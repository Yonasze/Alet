create or replace function public.update_project_from_workspace(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'private', 'pg_temp'
as $$
declare
  target_user uuid := auth.uid();
  target_project_id uuid := nullif(payload->>'project_id', '')::uuid;
  target_project public.projects;
  media_files jsonb := coalesce(payload->'media_files', '[]'::jsonb);
  unit_item record;
  media_item record;
  new_media_id uuid;
  media_purpose text;
  media_unit_type_id uuid;
  publication_is_published boolean := false;
  updated_unit_types integer := 0;
  inserted_media integer := 0;
begin
  if target_user is null then
    raise exception 'Authentication required';
  end if;

  select * into target_project
  from public.projects
  where id = target_project_id;

  if target_project.id is null then
    raise exception 'Project not found';
  end if;

  if not private.can_manage_project(target_project_id) then
    raise exception 'Project update requires project manager or administrator permission';
  end if;

  if nullif(trim(payload->>'name'), '') is null then
    raise exception 'Project name is required';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(media_files) item
    where nullif(trim(item->>'storage_path'), '') is null
       or item->>'storage_path' not like target_user::text || '/%'
       or coalesce(item->>'purpose', '') not in ('building','location','unit')
  ) then
    raise exception 'Invalid project image metadata';
  end if;

  select exists (
    select 1
    from public.project_publications pp
    where pp.project_id = target_project_id
      and pp.status = 'published'
  ) into publication_is_published;

  update public.projects
  set name = trim(payload->>'name'),
      slug = coalesce(nullif(trim(payload->>'slug'), ''), target_project.slug),
      marketing_title = nullif(trim(payload->>'marketing_title'), ''),
      short_description = nullif(trim(payload->>'short_description'), ''),
      description = nullif(trim(payload->>'description'), ''),
      address = nullif(trim(payload->>'address'), ''),
      city = coalesce(nullif(trim(payload->>'city'), ''), target_project.city, 'Addis Ababa'),
      subcity = nullif(trim(payload->>'subcity'), ''),
      latitude = nullif(payload->>'latitude','')::numeric,
      longitude = nullif(payload->>'longitude','')::numeric,
      google_maps_url = nullif(trim(payload->>'google_maps_url'), ''),
      amenities = coalesce(
        array(select trim(value) from jsonb_array_elements_text(coalesce(payload->'amenities','[]'::jsonb)) value where trim(value) <> ''),
        '{}'
      ),
      payment_plan_summary = nullif(trim(payload->>'payment_plan_summary'), ''),
      offers = nullif(trim(payload->>'offers'), ''),
      expected_completion_date = nullif(payload->>'expected_completion_date','')::date,
      phase = coalesce(nullif(payload->>'phase','')::public.project_phase, target_project.phase),
      floors_completed = least(
        greatest(coalesce((nullif(payload->>'floors_completed',''))::integer, target_project.floors_completed), 0),
        target_project.total_floors
      ),
      status = case
        when coalesce(nullif(payload->>'phase','')::public.project_phase, target_project.phase) = 'planning_design' then 'planning'::public.project_status
        else 'active'::public.project_status
      end,
      updated_at = now()
  where id = target_project_id;

  for unit_item in
    select value as unit_type
    from jsonb_array_elements(coalesce(payload->'unit_types', '[]'::jsonb))
  loop
    update public.unit_types
    set name = coalesce(nullif(trim(unit_item.unit_type->>'name'), ''), name),
        description = nullif(trim(unit_item.unit_type->>'description'), ''),
        updated_at = now()
    where id = nullif(unit_item.unit_type->>'id', '')::uuid
      and project_id = target_project_id;

    if found then
      updated_unit_types := updated_unit_types + 1;
    end if;
  end loop;

  if exists (select 1 from jsonb_array_elements(media_files) item where item->>'purpose' = 'building') then
    update public.project_media
    set is_public = false, is_approved = false, is_hero = false, updated_at = now()
    where project_id = target_project_id
      and purpose = 'building';
  end if;

  if exists (select 1 from jsonb_array_elements(media_files) item where item->>'purpose' = 'location') then
    update public.project_media
    set is_public = false, is_approved = false, is_hero = false, updated_at = now()
    where project_id = target_project_id
      and purpose = 'location';
  end if;

  for media_item in
    select value as media, ordinality::integer as position
    from jsonb_array_elements(media_files) with ordinality
  loop
    media_purpose := media_item.media->>'purpose';
    media_unit_type_id := null;

    if media_purpose = 'unit' then
      media_unit_type_id := nullif(media_item.media->>'unit_type_id', '')::uuid;

      if not exists (
        select 1 from public.unit_types ut
        where ut.project_id = target_project_id
          and ut.id = media_unit_type_id
      ) then
        raise exception 'Unit image has no matching unit type';
      end if;

      update public.project_media
      set is_public = false, is_approved = false, is_hero = false, updated_at = now()
      where project_id = target_project_id
        and purpose = 'unit'
        and unit_type_id = media_unit_type_id;
    end if;

    new_media_id := gen_random_uuid();

    insert into public.project_media (
      id, organization_id, project_id, media_type, title, alt_text,
      storage_path, public_url, purpose, unit_type_id,
      is_hero, is_public, is_approved, sort_order, uploaded_by
    ) values (
      new_media_id, target_project.organization_id, target_project_id, 'image',
      coalesce(nullif(trim(media_item.media->>'title'), ''), target_project.name),
      coalesce(nullif(trim(media_item.media->>'alt_text'), ''), target_project.name),
      media_item.media->>'storage_path',
      '/api/project-media/' || new_media_id::text,
      media_purpose,
      media_unit_type_id,
      media_purpose = 'building' and not exists (
        select 1 from public.project_media existing
        where existing.project_id = target_project_id
          and existing.purpose = 'building'
          and existing.is_hero
          and existing.is_public
      ),
      true,
      publication_is_published,
      media_item.position - 1,
      target_user
    );

    inserted_media := inserted_media + 1;
  end loop;

  insert into public.audit_logs (
    organization_id, project_id, actor_user_id, action, entity_type, entity_id, new_data
  ) values (
    target_project.organization_id,
    target_project_id,
    target_user,
    'update',
    'project_workspace',
    target_project_id::text,
    jsonb_build_object(
      'updated_unit_types', updated_unit_types,
      'inserted_media', inserted_media,
      'published_snapshot_refreshed', publication_is_published
    )
  );

  perform private.refresh_public_project(target_project_id);

  return jsonb_build_object(
    'project_id', target_project_id,
    'updated_unit_types', updated_unit_types,
    'inserted_media', inserted_media,
    'published', publication_is_published
  );
end
$$;

revoke all on function public.update_project_from_workspace(jsonb) from public;
grant execute on function public.update_project_from_workspace(jsonb) to authenticated;
