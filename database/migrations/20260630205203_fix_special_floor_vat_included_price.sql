CREATE OR REPLACE FUNCTION public.create_project_from_wizard(payload jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'private', 'pg_temp'
AS $function$
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
  typical_floor_start integer := coalesce((payload->>'typical_floor_start')::integer, 0);
  typical_floor_end integer := coalesce((payload->>'typical_floor_end')::integer, 0);
  total_floor_count integer := greatest(coalesce((payload->>'total_floors')::integer, 0), 0);
  should_publish boolean := coalesce((payload->>'publish')::boolean, false);
  media_url text := nullif(trim(payload->>'media_url'), '');
  generated integer;
  unit_code text;
  unit_name text;
  unit_id_pattern text;
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

  if typical_floor_start < 0
     or typical_floor_end < typical_floor_start
     or typical_floor_end > total_floor_count then
    raise exception 'Typical floor range must be between Ground Floor (0) and floor %', total_floor_count;
  end if;

  if jsonb_array_length(coalesce(payload->'typical_units','[]'::jsonb)) = 0 then
    raise exception 'At least one typical-floor unit is required';
  end if;

  if should_publish and media_url is null then
    raise exception 'An approved public media URL is required before publication';
  end if;

  for floor_number in 0..total_floor_count loop
    if floor_number < typical_floor_start or floor_number > typical_floor_end then
      if not exists (
        select 1
        from jsonb_array_elements(coalesce(payload->'special_floor_configurations','[]'::jsonb)) config
        where (config->>'floor_number')::integer = floor_number
      ) then
        raise exception 'Floor % has no layout. Include it in the typical range or select it as a special floor.', floor_number;
      end if;
    end if;
  end loop;

  insert into public.projects (
    organization_id, name, code, slug, status, phase,
    marketing_title, short_description, description,
    address, city, subcity, latitude, longitude, google_maps_url,
    amenities, payment_plan_summary, offers, expected_completion_date,
    parking_price, vat_rate, price_includes_vat, total_floors, floors_completed, responsible_user_id
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
    15,
    true,
    total_floor_count,
    least(greatest(coalesce((payload->>'floors_completed')::integer, 0), 0), total_floor_count),
    target_user
  )
  returning * into new_project;

  insert into public.floor_templates (
    organization_id, project_id, name, description, created_by
  ) values (
    target_org, new_project.id, 'Typical Floor',
    format('Mixed-unit layout for floors %s to %s', typical_floor_start, typical_floor_end),
    target_user
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
    unit_id_pattern := nullif(trim(unit_row.unit->>'unit_id_pattern'), '');
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
    if unit_id_pattern is null or position('{floor}' in unit_id_pattern) = 0 then
      raise exception 'Typical unit % ID must include {floor}', unit_row.position;
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
      unit_id_pattern, unit_gross, unit_net, unit_gross, unit_description,
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
        vat_rate, parking_price, price_includes_vat, change_reason, created_by
      ) values (
        target_org, new_project.id, 'unit_type', current_unit_type.id,
        unit_price, 'ETB', 15, 0, true,
        'Initial mixed-layout wizard price', target_user
      );
    end if;
  end loop;

  for special_row in
    select value as config
    from jsonb_array_elements(coalesce(payload->'special_floor_configurations','[]'::jsonb))
  loop
    floor_number := (special_row.config->>'floor_number')::integer;
    if floor_number < 0 or floor_number > total_floor_count then
      raise exception 'Special floor % is outside the building floor range', floor_number;
    end if;
    if jsonb_array_length(coalesce(special_row.config->'units','[]'::jsonb)) = 0 then
      raise exception 'Special floor % requires at least one unit', floor_number;
    end if;

    insert into public.floor_templates (
      organization_id, project_id, name, description, created_by
    ) values (
      target_org, new_project.id,
      case when floor_number = 0 then 'Special Ground Floor' else 'Special Floor ' || floor_number end,
      case when floor_number = 0 then 'Independent layout for Ground Floor' else 'Independent layout for floor ' || floor_number end,
      target_user
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
      unit_id_pattern := nullif(trim(unit_row.unit->>'unit_id_pattern'), '');
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
      if unit_id_pattern is null or position('{floor}' in unit_id_pattern) = 0 then
        raise exception 'Special floor % unit % ID must include {floor}', floor_number, unit_row.position;
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
        unit_id_pattern, unit_gross, unit_net, unit_gross, unit_description,
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
          vat_rate, parking_price, price_includes_vat, change_reason, created_by
        ) values (
          target_org, new_project.id, 'unit_type', current_unit_type.id,
          unit_price, 'ETB', 15, 0, true,
          'Initial special-floor wizard price', target_user
        );
      end if;
    end loop;
  end loop;

  for floor_number in 0..total_floor_count loop
    select exists (
      select 1
      from jsonb_array_elements(coalesce(payload->'special_floor_configurations','[]'::jsonb)) config
      where (config->>'floor_number')::integer = floor_number
    ) into is_special;

    if is_special then
      select ft.* into special_template
      from public.floor_templates ft
      where ft.project_id = new_project.id
        and ft.name = case when floor_number = 0 then 'Special Ground Floor' else 'Special Floor ' || floor_number end
      limit 1;
    end if;

    insert into public.project_floors (
      organization_id, project_id, floor_number, name, floor_kind, template_id,
      is_completed, completed_at, sequence
    ) values (
      target_org, new_project.id, floor_number,
      case when floor_number = 0 then 'Ground Floor' else 'Floor ' || floor_number end,
      case when is_special then 'special' else 'typical' end,
      case when is_special then special_template.id else typical_template.id end,
      floor_number > 0 and floor_number <= new_project.floors_completed,
      case when floor_number > 0 and floor_number <= new_project.floors_completed then now() else null end,
      floor_number
    );
  end loop;

  update public.project_prices pp
  set amount = summary.minimum_price
  from (
    select ftu.unit_type_id, min(ftu.price_override) as minimum_price
    from public.floor_template_units ftu
    where ftu.project_id = new_project.id
    group by ftu.unit_type_id
  ) summary
  where pp.project_id = new_project.id
    and pp.unit_type_id = summary.unit_type_id
    and pp.is_current;

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
$function$
