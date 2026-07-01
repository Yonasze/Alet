
create table if not exists private.published_project_documents (
  project_id uuid primary key,
  slug text not null unique,
  payload jsonb not null,
  refreshed_at timestamptz not null default now()
);

revoke all on private.published_project_documents from public;
grant usage on schema private to anon, authenticated;
grant select on private.published_project_documents to anon, authenticated;

create or replace function private.refresh_public_project(target_project_id uuid)
returns void
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  project_payload jsonb;
  project_slug text;
begin
  if not exists (
    select 1
    from public.project_publications pub
    where pub.project_id = target_project_id and pub.status = 'published'
  ) then
    delete from private.published_project_documents where project_id = target_project_id;
    return;
  end if;

  select p.slug,
    jsonb_build_object(
      'id', p.id,
      'slug', p.slug,
      'name', coalesce(p.marketing_title, p.name),
      'short_description', p.short_description,
      'description', p.description,
      'address', p.address,
      'city', p.city,
      'subcity', p.subcity,
      'latitude', p.latitude,
      'longitude', p.longitude,
      'google_maps_url', p.google_maps_url,
      'amenities', to_jsonb(p.amenities),
      'payment_plan_summary', p.payment_plan_summary,
      'offers', p.offers,
      'expected_completion_date', p.expected_completion_date,
      'phase', p.phase,
      'floors_completed', p.floors_completed,
      'total_floors', p.total_floors,
      'progress_label', case
        when p.phase = 'floor_construction'
          then p.floors_completed::text || ' of ' || p.total_floors::text || ' floors completed'
        else replace(initcap(p.phase::text), '_', ' ')
      end,
      'starting_price_etb', (
        select min(pp.amount) from public.project_prices pp
        where pp.project_id = p.id and pp.is_current
      ),
      'hero_image_url', (
        select pm.public_url from public.project_media pm
        where pm.project_id = p.id and pm.is_public and pm.is_approved
        order by pm.is_hero desc, pm.sort_order, pm.created_at
        limit 1
      ),
      'published_at', pub.published_at,
      'unit_types', coalesce((
        select jsonb_agg(to_jsonb(summary) order by summary.starting_price_etb nulls last)
        from (
          select
            ut.code,
            ut.name,
            ut.category::text as category,
            ut.bedrooms,
            ut.bathrooms,
            min(u.size_sqm) as minimum_size_sqm,
            max(u.size_sqm) as maximum_size_sqm,
            min(coalesce(pp.amount, u.base_price)) as starting_price_etb
          from public.units u
          join public.unit_types ut on ut.id = u.unit_type_id
          left join public.project_prices pp
            on pp.project_id = p.id
           and pp.unit_type_id = ut.id
           and pp.scope = 'unit_type'
           and pp.is_current
          where u.project_id = p.id and u.status = 'available'
          group by ut.code, ut.name, ut.category, ut.bedrooms, ut.bathrooms
        ) summary
      ), '[]'::jsonb),
      'media', coalesce((
        select jsonb_agg(
          jsonb_build_object(
            'media_type', pm.media_type,
            'title', pm.title,
            'alt_text', pm.alt_text,
            'public_url', pm.public_url,
            'is_hero', pm.is_hero,
            'sort_order', pm.sort_order
          )
          order by pm.is_hero desc, pm.sort_order, pm.created_at
        )
        from public.project_media pm
        where pm.project_id = p.id and pm.is_public and pm.is_approved
      ), '[]'::jsonb),
      'milestones', coalesce((
        select jsonb_agg(
          jsonb_build_object(
            'phase', m.phase,
            'title', m.title,
            'description', m.description,
            'progress_percent', m.progress_percent,
            'target_date', m.target_date,
            'completed_at', m.completed_at
          )
          order by m.created_at
        )
        from public.project_milestones m
        where m.project_id = p.id and m.is_public
      ), '[]'::jsonb)
    )
  into project_slug, project_payload
  from public.projects p
  join public.project_publications pub on pub.project_id = p.id
  where p.id = target_project_id
    and p.slug is not null
    and pub.status = 'published';

  if project_payload is null then
    delete from private.published_project_documents where project_id = target_project_id;
    return;
  end if;

  insert into private.published_project_documents(project_id, slug, payload, refreshed_at)
  values (target_project_id, project_slug, project_payload, now())
  on conflict (project_id) do update
  set slug = excluded.slug, payload = excluded.payload, refreshed_at = excluded.refreshed_at;
end
$$;

create or replace function private.refresh_public_project_trigger()
returns trigger
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  target_project_id uuid;
begin
  if tg_table_name = 'projects' then
    target_project_id := coalesce(new.id, old.id);
  else
    target_project_id := coalesce(new.project_id, old.project_id);
  end if;

  perform private.refresh_public_project(target_project_id);
  return coalesce(new, old);
end
$$;

create or replace function private.sync_project_floor_progress()
returns trigger
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  target_project_id uuid;
begin
  target_project_id := coalesce(new.project_id, old.project_id);

  update public.projects p
  set total_floors = summary.total_floors,
      floors_completed = summary.floors_completed
  from (
    select
      count(*)::integer as total_floors,
      count(*) filter (where is_completed)::integer as floors_completed
    from public.project_floors
    where project_id = target_project_id
  ) summary
  where p.id = target_project_id;

  return coalesce(new, old);
end
$$;

drop trigger if exists project_floors_sync_progress on public.project_floors;
create trigger project_floors_sync_progress
after insert or update of is_completed or delete on public.project_floors
for each row execute function private.sync_project_floor_progress();

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'projects','project_publications','project_prices','project_media',
    'project_milestones','units','unit_types'
  ]
  loop
    execute format('drop trigger if exists %I_refresh_publication on public.%I', table_name, table_name);
    execute format(
      'create trigger %I_refresh_publication after insert or update or delete on public.%I for each row execute function private.refresh_public_project_trigger()',
      table_name, table_name
    );
  end loop;
end
$$;

drop view if exists public.public_project_unit_types;
drop view if exists public.public_project_media;
drop view if exists public.public_project_milestones;
drop view if exists public.public_projects;

create view public.public_projects
with (security_invoker = true, security_barrier = true)
as
select
  project_id as id,
  slug,
  payload->>'name' as name,
  payload->>'short_description' as short_description,
  payload->>'description' as description,
  payload->>'address' as address,
  payload->>'city' as city,
  payload->>'subcity' as subcity,
  nullif(payload->>'latitude','')::numeric as latitude,
  nullif(payload->>'longitude','')::numeric as longitude,
  payload->>'google_maps_url' as google_maps_url,
  payload->'amenities' as amenities,
  payload->>'payment_plan_summary' as payment_plan_summary,
  payload->>'offers' as offers,
  nullif(payload->>'expected_completion_date','')::date as expected_completion_date,
  payload->>'phase' as phase,
  coalesce((payload->>'floors_completed')::integer, 0) as floors_completed,
  coalesce((payload->>'total_floors')::integer, 0) as total_floors,
  payload->>'progress_label' as progress_label,
  nullif(payload->>'starting_price_etb','')::numeric as starting_price_etb,
  payload->>'hero_image_url' as hero_image_url,
  nullif(payload->>'published_at','')::timestamptz as published_at
from private.published_project_documents;

create view public.public_project_unit_types
with (security_invoker = true, security_barrier = true)
as
select
  d.slug as project_slug,
  item->>'code' as code,
  item->>'name' as name,
  item->>'category' as category,
  nullif(item->>'bedrooms','')::integer as bedrooms,
  nullif(item->>'bathrooms','')::numeric as bathrooms,
  nullif(item->>'minimum_size_sqm','')::numeric as minimum_size_sqm,
  nullif(item->>'maximum_size_sqm','')::numeric as maximum_size_sqm,
  nullif(item->>'starting_price_etb','')::numeric as starting_price_etb
from private.published_project_documents d
cross join lateral jsonb_array_elements(d.payload->'unit_types') item;

create view public.public_project_media
with (security_invoker = true, security_barrier = true)
as
select
  d.slug as project_slug,
  item->>'media_type' as media_type,
  item->>'title' as title,
  item->>'alt_text' as alt_text,
  item->>'public_url' as public_url,
  coalesce((item->>'is_hero')::boolean, false) as is_hero,
  coalesce((item->>'sort_order')::integer, 0) as sort_order
from private.published_project_documents d
cross join lateral jsonb_array_elements(d.payload->'media') item;

create view public.public_project_milestones
with (security_invoker = true, security_barrier = true)
as
select
  d.slug as project_slug,
  item->>'phase' as phase,
  item->>'title' as title,
  item->>'description' as description,
  nullif(item->>'progress_percent','')::numeric as progress_percent,
  nullif(item->>'target_date','')::date as target_date,
  nullif(item->>'completed_at','')::timestamptz as completed_at
from private.published_project_documents d
cross join lateral jsonb_array_elements(d.payload->'milestones') item;

revoke all on public.public_projects, public.public_project_unit_types,
  public.public_project_media, public.public_project_milestones from public;
grant select on public.public_projects, public.public_project_unit_types,
  public.public_project_media, public.public_project_milestones to anon, authenticated;

alter function public.set_updated_at() set search_path = public, pg_temp;
alter function public.current_user_is_admin() set search_path = public, pg_temp;
alter function public.current_user_is_project_member(uuid) set search_path = public, pg_temp;
alter function public.current_user_organization_id() set search_path = public, pg_temp;
revoke all on function public.current_user_is_admin() from public, anon, authenticated;
revoke all on function public.current_user_is_project_member(uuid) from public, anon, authenticated;
revoke all on function public.current_user_organization_id() from public, anon, authenticated;

do $$
declare
  target_project_id uuid;
begin
  for target_project_id in
    select project_id from public.project_publications where status = 'published'
  loop
    perform private.refresh_public_project(target_project_id);
  end loop;
end
$$;
