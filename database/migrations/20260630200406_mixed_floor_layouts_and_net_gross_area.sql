
alter table public.floor_template_units
  add column if not exists net_area_sqm numeric(10,2),
  add column if not exists gross_area_sqm numeric(10,2),
  add column if not exists unit_description text;

update public.floor_template_units
set net_area_sqm = coalesce(net_area_sqm, size_sqm),
    gross_area_sqm = coalesce(gross_area_sqm, size_sqm)
where net_area_sqm is null or gross_area_sqm is null;

alter table public.units
  add column if not exists net_area_sqm numeric(10,2),
  add column if not exists gross_area_sqm numeric(10,2),
  add column if not exists unit_description text;

update public.units
set net_area_sqm = coalesce(net_area_sqm, size_sqm),
    gross_area_sqm = coalesce(gross_area_sqm, size_sqm)
where net_area_sqm is null or gross_area_sqm is null;

do $$ begin
  alter table public.floor_template_units
    add constraint floor_template_units_area_check
    check (net_area_sqm > 0 and gross_area_sqm >= net_area_sqm);
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public.units
    add constraint units_area_check
    check (
      (net_area_sqm is null and gross_area_sqm is null)
      or (net_area_sqm > 0 and gross_area_sqm >= net_area_sqm)
    );
exception when duplicate_object then null;
end $$;

create or replace function public.generate_project_units(target_project_id uuid)
returns integer
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  generated_count integer := 0;
  floor_row record;
  template_unit record;
  generated_number text;
  generated_price numeric(14,2);
  legacy_type public.unit_type;
begin
  if not private.can_manage_project(target_project_id) then
    raise exception 'Not authorized to generate units for this project';
  end if;

  delete from public.units
  where project_id = target_project_id
    and generated_from_template_unit_id is not null
    and status in ('draft','available','on_hold');

  for floor_row in
    select pf.*, p.organization_id
    from public.project_floors pf
    join public.projects p on p.id = pf.project_id
    where pf.project_id = target_project_id and pf.template_id is not null
    order by pf.sequence, pf.floor_number
  loop
    for template_unit in
      select ftu.*, ut.code as unit_type_code, ut.category as unit_category
      from public.floor_template_units ftu
      join public.unit_types ut on ut.id = ftu.unit_type_id
      where ftu.template_id = floor_row.template_id
      order by ftu.position
    loop
      generated_number := replace(
        replace(template_unit.unit_number_pattern, '{floor}', floor_row.floor_number::text),
        '{position}', template_unit.position::text
      );

      legacy_type := case template_unit.unit_type_code
        when 'studio' then 'studio'::public.unit_type
        when '1br' then '1br'::public.unit_type
        when '2br' then '2br'::public.unit_type
        when '3br' then '3br'::public.unit_type
        when '4br' then '4br'::public.unit_type
        else null
      end;

      select coalesce(
        template_unit.price_override,
        (select pp.amount from public.project_prices pp
         where pp.project_id = target_project_id
           and pp.unit_type_id = template_unit.unit_type_id
           and pp.scope = 'unit_type'
           and pp.is_current
         order by pp.effective_from desc limit 1),
        0
      ) into generated_price;

      insert into public.units (
        organization_id, project_id, project_floor_id, unit_type_id, unit_number,
        type, category, size_sqm, net_area_sqm, gross_area_sqm, unit_description,
        base_price, status, bedrooms, bathrooms, balconies, orientation,
        vat_rate, parking_price, generated_from_template_unit_id
      ) values (
        floor_row.organization_id, target_project_id, floor_row.id, template_unit.unit_type_id,
        generated_number, legacy_type, template_unit.unit_category,
        template_unit.gross_area_sqm, template_unit.net_area_sqm, template_unit.gross_area_sqm,
        template_unit.unit_description, generated_price, 'available',
        template_unit.bedrooms, template_unit.bathrooms, template_unit.balconies,
        template_unit.orientation,
        (select vat_rate from public.projects where id = target_project_id),
        0,
        template_unit.id
      );
      generated_count := generated_count + 1;
    end loop;
  end loop;

  return generated_count;
end
$$;

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
            min(u.net_area_sqm) as minimum_net_area_sqm,
            max(u.net_area_sqm) as maximum_net_area_sqm,
            min(u.gross_area_sqm) as minimum_gross_area_sqm,
            max(u.gross_area_sqm) as maximum_gross_area_sqm,
            min(u.gross_area_sqm) as minimum_size_sqm,
            max(u.gross_area_sqm) as maximum_size_sqm,
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

drop view if exists public.public_project_unit_types;
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
  nullif(item->>'minimum_net_area_sqm','')::numeric as minimum_net_area_sqm,
  nullif(item->>'maximum_net_area_sqm','')::numeric as maximum_net_area_sqm,
  nullif(item->>'minimum_gross_area_sqm','')::numeric as minimum_gross_area_sqm,
  nullif(item->>'maximum_gross_area_sqm','')::numeric as maximum_gross_area_sqm,
  nullif(item->>'minimum_size_sqm','')::numeric as minimum_size_sqm,
  nullif(item->>'maximum_size_sqm','')::numeric as maximum_size_sqm,
  nullif(item->>'starting_price_etb','')::numeric as starting_price_etb
from private.published_project_documents d
cross join lateral jsonb_array_elements(d.payload->'unit_types') item;

revoke all on public.public_project_unit_types from public;
grant select on public.public_project_unit_types to anon, authenticated;

create or replace function public.create_project_from_wizard(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  target_org uuid;
  target_user uuid := auth.uid();
  new_project public.projects;
  typical_template public.floor_templates;
  special_template public.floor_templates;
  current_unit_type public.unit_types;
  unit_row record;
  special_row record;
  floor_number integer;
  is_special boolean;
  total_floor_count integer := greatest(coalesce((payload->>'total_floors')::integer, 1), 1);
  should_publish boolean := coalesce((payload->>'publish')::boolean, false);
  media_url text := nullif(trim(payload->>'media_url'), '');
  generated integer;
  unit_code text;
  unit_name text;
  unit_category public.unit_category;
  unit_bedrooms integer;
  unit_bathrooms numeric;
  unit_balconies integer;
  unit_net numeric;
  unit_gross numeric;
  unit_price numeric;
  unit_description text;
begin
  if target_user is null then
    raise exception 'Authentication required';
  end if;

  target_org := private.current_organization_id();

  if target_org is null
     or not private.has_project_role(array['admin','project_manager'], null) then
    raise exception 'Project creation requires administrator or project manager permission';
  end if;

  if nullif(trim(payload->>'name'), '') is null
     or nullif(trim(payload->>'code'), '') is null then
    raise exception 'Project name and code are required';
  end if;

  if jsonb_array_length(coalesce(payload->'typical_units','[]'::jsonb)) = 0 then
    raise exception 'At least one typical-floor unit is required';
  end if;

  if should_publish and media_url is null then
    raise exception 'An approved public media URL is required before publication';
  end if;

  insert into public.projects (
    organization_id, name, code, slug, status, phase,
    marketing_title, short_description, description,
    address, city, subcity, latitude, longitude, google_maps_url,
    amenities, payment_plan_summary, offers, expected_completion_date,
    parking_price, vat_rate, total_floors, floors_completed, responsible_user_id
  ) values (
    target_org,
    trim(payload->>'name'),
    upper(trim(payload->>'code')),
    coalesce(
      nullif(trim(payload->>'slug'), ''),
      lower(trim(both '-' from regexp_replace(payload->>'name', '[^a-zA-Z0-9]+', '-', 'g')))
    ),
    case when payload->>'phase' = 'planning_design' then 'planning'::public.project_status else 'active'::public.project_status end,
    coalesce(nullif(payload->>'phase','')::public.project_phase, 'planning_design'),
    nullif(trim(payload->>'marketing_title'), ''),
    nullif(trim(payload->>'short_description'), ''),
    nullif(trim(payload->>'description'), ''),
    nullif(trim(payload->>'address'), ''),
    coalesce(nullif(trim(payload->>'city'), ''), 'Addis Ababa'),
    nullif(trim(payload->>'subcity'), ''),
    nullif(payload->>'latitude','')::numeric,
    nullif(payload->>'longitude','')::numeric,
    nullif(trim(payload->>'google_maps_url'), ''),
    coalesce(
      array(select trim(value) from jsonb_array_elements_text(coalesce(payload->'amenities','[]'::jsonb)) value where trim(value) <> ''),
      '{}'
    ),
    nullif(trim(payload->>'payment_plan_summary'), ''),
    nullif(trim(payload->>'offers'), ''),
    nullif(payload->>'expected_completion_date','')::date,
    0,
    greatest(coalesce((payload->>'vat_rate')::numeric, 15), 0),
    total_floor_count,
    least(greatest(coalesce((payload->>'floors_completed')::integer, 0), 0), total_floor_count),
    target_user
  )
  returning * into new_project;

  insert into public.floor_templates (
    organization_id, project_id, name, description, created_by
  ) values (
    target_org, new_project.id, 'Typical Floor', 'Mixed-unit typical-floor layout', target_user
  )
  returning * into typical_template;

  for unit_row in
    select value as unit, ordinality::integer as position
    from jsonb_array_elements(payload->'typical_units') with ordinality
  loop
    unit_code := lower(trim(unit_row.unit->>'type'));
    unit_name := case unit_code
      when 'studio' then 'Studio'
      when '1br' then 'One Bedroom'
      when '2br' then 'Two Bedroom'
      when '3br' then 'Three Bedroom'
      when '4br' then 'Four Bedroom'
      else 'Commercial'
    end;
    unit_category := case when unit_code = 'commercial' then 'commercial'::public.unit_category else 'residential'::public.unit_category end;
    unit_bedrooms := case unit_code when 'studio' then 0 when '1br' then 1 when '2br' then 2 when '3br' then 3 when '4br' then 4 else null end;
    unit_bathrooms := greatest(coalesce((unit_row.unit->>'bathrooms')::numeric, 0), 0);
    unit_balconies := greatest(coalesce((unit_row.unit->>'balconies')::integer, 0), 0);
    unit_net := (unit_row.unit->>'net_area_sqm')::numeric;
    unit_gross := (unit_row.unit->>'gross_area_sqm')::numeric;
    unit_price := greatest(coalesce((unit_row.unit->>'price')::numeric, 0), 0);
    unit_description := nullif(trim(unit_row.unit->>'description'), '');

    if unit_code not in ('studio','1br','2br','3br','4br','commercial') then
      raise exception 'Unsupported unit type: %', unit_code;
    end if;
    if unit_net <= 0 or unit_gross < unit_net then
      raise exception 'Gross area must be greater than or equal to net area for typical unit %', unit_row.position;
    end if;

    insert into public.unit_types (
      organization_id, project_id, code, name, category, bedrooms, bathrooms, description
    ) values (
      target_org, new_project.id, unit_code, unit_name, unit_category,
      unit_bedrooms, unit_bathrooms, unit_description
    )
    on conflict (project_id, code) do update
    set name = excluded.name,
        category = excluded.category,
        bedrooms = excluded.bedrooms,
        bathrooms = excluded.bathrooms
    returning * into current_unit_type;

    insert into public.floor_template_units (
      organization_id, project_id, template_id, position, unit_type_id,
      unit_number_pattern, size_sqm, net_area_sqm, gross_area_sqm,
      unit_description, bedrooms, bathrooms, balconies, price_override
    ) values (
      target_org, new_project.id, typical_template.id, unit_row.position, current_unit_type.id,
      '{floor}-' || lpad(unit_row.position::text, 2, '0'),
      unit_gross, unit_net, unit_gross, unit_description,
      unit_bedrooms, unit_bathrooms, unit_balconies, unit_price
    );

    if not exists (
      select 1 from public.project_prices pp
      where pp.project_id = new_project.id
        and pp.unit_type_id = current_unit_type.id
        and pp.is_current
    ) then
      insert into public.project_prices (
        organization_id, project_id, scope, unit_type_id, amount, currency,
        vat_rate, parking_price, change_reason, created_by
      ) values (
        target_org, new_project.id, 'unit_type', current_unit_type.id,
        unit_price, 'ETB', new_project.vat_rate, 0,
        'Initial mixed-layout wizard price', target_user
      );
    end if;
  end loop;

  for special_row in
    select value as config
    from jsonb_array_elements(coalesce(payload->'special_floor_configurations','[]'::jsonb))
  loop
    floor_number := (special_row.config->>'floor_number')::integer;
    if floor_number < 1 or floor_number > total_floor_count then
      raise exception 'Special floor % is outside the building floor range', floor_number;
    end if;
    if jsonb_array_length(coalesce(special_row.config->'units','[]'::jsonb)) = 0 then
      raise exception 'Special floor % requires at least one unit', floor_number;
    end if;

    insert into public.floor_templates (
      organization_id, project_id, name, description, created_by
    ) values (
      target_org, new_project.id, 'Special Floor ' || floor_number,
      'Independent layout for floor ' || floor_number, target_user
    )
    returning * into special_template;

    for unit_row in
      select value as unit, ordinality::integer as position
      from jsonb_array_elements(special_row.config->'units') with ordinality
    loop
      unit_code := lower(trim(unit_row.unit->>'type'));
      unit_name := case unit_code
        when 'studio' then 'Studio'
        when '1br' then 'One Bedroom'
        when '2br' then 'Two Bedroom'
        when '3br' then 'Three Bedroom'
        when '4br' then 'Four Bedroom'
        else 'Commercial'
      end;
      unit_category := case when unit_code = 'commercial' then 'commercial'::public.unit_category else 'residential'::public.unit_category end;
      unit_bedrooms := case unit_code when 'studio' then 0 when '1br' then 1 when '2br' then 2 when '3br' then 3 when '4br' then 4 else null end;
      unit_bathrooms := greatest(coalesce((unit_row.unit->>'bathrooms')::numeric, 0), 0);
      unit_balconies := greatest(coalesce((unit_row.unit->>'balconies')::integer, 0), 0);
      unit_net := (unit_row.unit->>'net_area_sqm')::numeric;
      unit_gross := (unit_row.unit->>'gross_area_sqm')::numeric;
      unit_price := greatest(coalesce((unit_row.unit->>'price')::numeric, 0), 0);
      unit_description := nullif(trim(unit_row.unit->>'description'), '');

      if unit_code not in ('studio','1br','2br','3br','4br','commercial') then
        raise exception 'Unsupported unit type: %', unit_code;
      end if;
      if unit_net <= 0 or unit_gross < unit_net then
        raise exception 'Gross area must be greater than or equal to net area for special floor % unit %', floor_number, unit_row.position;
      end if;

      insert into public.unit_types (
        organization_id, project_id, code, name, category, bedrooms, bathrooms, description
      ) values (
        target_org, new_project.id, unit_code, unit_name, unit_category,
        unit_bedrooms, unit_bathrooms, unit_description
      )
      on conflict (project_id, code) do update
      set name = excluded.name,
          category = excluded.category,
          bedrooms = excluded.bedrooms,
          bathrooms = excluded.bathrooms
      returning * into current_unit_type;

      insert into public.floor_template_units (
        organization_id, project_id, template_id, position, unit_type_id,
        unit_number_pattern, size_sqm, net_area_sqm, gross_area_sqm,
        unit_description, bedrooms, bathrooms, balconies, price_override
      ) values (
        target_org, new_project.id, special_template.id, unit_row.position, current_unit_type.id,
        '{floor}-S' || lpad(unit_row.position::text, 2, '0'),
        unit_gross, unit_net, unit_gross, unit_description,
        unit_bedrooms, unit_bathrooms, unit_balconies, unit_price
      );

      if not exists (
        select 1 from public.project_prices pp
        where pp.project_id = new_project.id
          and pp.unit_type_id = current_unit_type.id
          and pp.is_current
      ) then
        insert into public.project_prices (
          organization_id, project_id, scope, unit_type_id, amount, currency,
          vat_rate, parking_price, change_reason, created_by
        ) values (
          target_org, new_project.id, 'unit_type', current_unit_type.id,
          unit_price, 'ETB', new_project.vat_rate, 0,
          'Initial special-floor wizard price', target_user
        );
      end if;
    end loop;
  end loop;

  for floor_number in 1..total_floor_count loop
    select exists (
      select 1
      from jsonb_array_elements(coalesce(payload->'special_floor_configurations','[]'::jsonb)) config
      where (config->>'floor_number')::integer = floor_number
    ) into is_special;

    if is_special then
      select ft.* into special_template
      from public.floor_templates ft
      where ft.project_id = new_project.id and ft.name = 'Special Floor ' || floor_number
      limit 1;
    end if;

    insert into public.project_floors (
      organization_id, project_id, floor_number, name, floor_kind, template_id,
      is_completed, completed_at, sequence
    ) values (
      target_org, new_project.id, floor_number, 'Floor ' || floor_number,
      case when is_special then 'special' else 'typical' end,
      case when is_special then special_template.id else typical_template.id end,
      floor_number <= new_project.floors_completed,
      case when floor_number <= new_project.floors_completed then now() else null end,
      floor_number
    );
  end loop;

  if media_url is not null then
    insert into public.project_media (
      organization_id, project_id, media_type, title, alt_text, public_url,
      is_hero, is_public, is_approved, uploaded_by
    ) values (
      target_org, new_project.id, 'image',
      coalesce(nullif(trim(payload->>'media_title'), ''), new_project.name),
      coalesce(nullif(trim(payload->>'media_alt_text'), ''), new_project.name),
      media_url, true, true, should_publish, target_user
    );
  end if;

  insert into public.project_milestones (
    organization_id, project_id, phase, title, description, progress_percent,
    floors_completed, total_floors, target_date, is_public, created_by
  ) values (
    target_org, new_project.id, new_project.phase,
    format('Current phase: %s', replace(initcap(new_project.phase::text), '_', ' ')),
    nullif(trim(payload->>'progress_description'), ''),
    least(greatest(coalesce((payload->>'progress_percent')::numeric, 0), 0), 100),
    new_project.floors_completed, new_project.total_floors,
    new_project.expected_completion_date, true, target_user
  );

  insert into public.project_publications (
    organization_id, project_id, status, submitted_by, submitted_at,
    approved_by, approved_at, published_at
  ) values (
    target_org, new_project.id,
    case when should_publish then 'published'::public.project_publication_status else 'draft'::public.project_publication_status end,
    case when should_publish then target_user else null end,
    case when should_publish then now() else null end,
    case when should_publish then target_user else null end,
    case when should_publish then now() else null end,
    case when should_publish then now() else null end
  );

  generated := public.generate_project_units(new_project.id);
  perform private.refresh_public_project(new_project.id);

  return jsonb_build_object(
    'project_id', new_project.id,
    'slug', new_project.slug,
    'generated_units', generated,
    'published', should_publish
  );
end
$$;

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
