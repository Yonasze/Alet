
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

alter table public.projects
  add column if not exists slug text,
  add column if not exists marketing_title text,
  add column if not exists short_description text,
  add column if not exists description text,
  add column if not exists address text,
  add column if not exists city text not null default 'Addis Ababa',
  add column if not exists subcity text,
  add column if not exists latitude numeric(10,7),
  add column if not exists longitude numeric(10,7),
  add column if not exists google_maps_url text,
  add column if not exists amenities text[] not null default '{}',
  add column if not exists payment_plan_summary text,
  add column if not exists offers text,
  add column if not exists expected_completion_date date,
  add column if not exists parking_price numeric(14,2) not null default 0,
  add column if not exists vat_rate numeric(5,2) not null default 15,
  add column if not exists phase public.project_phase not null default 'planning_design',
  add column if not exists floors_completed integer not null default 0,
  add column if not exists total_floors integer not null default 0,
  add column if not exists responsible_user_id uuid references auth.users(id);

update public.projects
set slug = lower(trim(both '-' from regexp_replace(code, '[^a-zA-Z0-9]+', '-', 'g')))
where slug is null;

create unique index if not exists projects_slug_unique on public.projects(slug) where slug is not null;
create index if not exists projects_phase_idx on public.projects(phase);
create index if not exists projects_responsible_user_idx on public.projects(responsible_user_id);

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  is_read_only boolean not null default false,
  created_at timestamptz not null default now()
);

insert into public.roles (code, name, description, is_read_only) values
  ('admin', 'Administrator', 'Full ERP administration', false),
  ('project_manager', 'Project Manager', 'Creates and manages projects', false),
  ('marketing', 'Marketing', 'Manages public project content and publication', false),
  ('sales', 'Sales', 'Reads projects and manages future CRM activity', false),
  ('finance', 'Finance', 'Manages project pricing', false),
  ('engineer', 'Engineer', 'Updates construction progress', false),
  ('procurement', 'Procurement', 'Project information read-only until Procurement is built', true),
  ('inventory', 'Inventory', 'Project information read-only until Inventory is built', true),
  ('hr', 'HR', 'Project information read-only until HR is built', true),
  ('viewer', 'Viewer', 'Read-only project access', true)
on conflict (code) do update set
  name = excluded.name,
  description = excluded.description,
  is_read_only = excluded.is_read_only;

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role_id uuid not null references public.roles(id),
  project_id uuid references public.projects(id) on delete cascade,
  assigned_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create unique index if not exists user_roles_global_unique
  on public.user_roles(user_id, role_id) where project_id is null;
create unique index if not exists user_roles_project_unique
  on public.user_roles(user_id, role_id, project_id) where project_id is not null;
create index if not exists user_roles_project_idx on public.user_roles(project_id);
create index if not exists user_roles_org_idx on public.user_roles(organization_id);

create table if not exists public.floor_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  description text,
  is_active boolean not null default true,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(project_id, name)
);

create table if not exists public.unit_types (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  code text not null,
  name text not null,
  category public.unit_category not null default 'residential',
  bedrooms integer,
  bathrooms numeric(3,1),
  description text,
  amenities text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(project_id, code)
);

create table if not exists public.project_floors (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  floor_number integer not null,
  name text,
  floor_kind text not null default 'typical' check (floor_kind in ('typical', 'special')),
  template_id uuid references public.floor_templates(id) on delete set null,
  is_completed boolean not null default false,
  completed_at timestamptz,
  sequence integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(project_id, floor_number)
);

create table if not exists public.floor_template_units (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  template_id uuid not null references public.floor_templates(id) on delete cascade,
  position integer not null,
  unit_type_id uuid not null references public.unit_types(id),
  unit_number_pattern text not null default '{floor}-{position}',
  size_sqm numeric(10,2) not null check (size_sqm > 0),
  bedrooms integer,
  bathrooms numeric(3,1),
  balconies integer not null default 0,
  orientation text,
  price_override numeric(14,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(template_id, position)
);

alter table public.units
  alter column building_id drop not null,
  alter column floor_id drop not null,
  alter column type drop not null,
  alter column base_price drop not null,
  add column if not exists project_floor_id uuid references public.project_floors(id) on delete restrict,
  add column if not exists unit_type_id uuid references public.unit_types(id) on delete restrict,
  add column if not exists category public.unit_category not null default 'residential',
  add column if not exists bedrooms integer,
  add column if not exists bathrooms numeric(3,1),
  add column if not exists balconies integer not null default 0,
  add column if not exists orientation text,
  add column if not exists vat_rate numeric(5,2) not null default 15,
  add column if not exists parking_price numeric(14,2) not null default 0,
  add column if not exists generated_from_template_unit_id uuid references public.floor_template_units(id) on delete set null;

create index if not exists units_project_floor_idx on public.units(project_floor_id);
create index if not exists units_unit_type_idx on public.units(unit_type_id);

create table if not exists public.project_prices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  scope public.project_price_scope not null default 'unit_type',
  unit_type_id uuid references public.unit_types(id) on delete cascade,
  unit_id uuid references public.units(id) on delete cascade,
  amount numeric(14,2) not null check (amount >= 0),
  currency text not null default 'ETB' check (currency = 'ETB'),
  vat_rate numeric(5,2) not null default 15 check (vat_rate >= 0),
  parking_price numeric(14,2) not null default 0 check (parking_price >= 0),
  effective_from timestamptz not null default now(),
  effective_to timestamptz,
  is_current boolean not null default true,
  change_reason text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  check (
    (scope = 'project' and unit_type_id is null and unit_id is null)
    or (scope = 'unit_type' and unit_type_id is not null and unit_id is null)
    or (scope = 'unit' and unit_id is not null)
  )
);

create unique index if not exists project_prices_current_project_unique
  on public.project_prices(project_id) where is_current and scope = 'project';
create unique index if not exists project_prices_current_unit_type_unique
  on public.project_prices(project_id, unit_type_id) where is_current and scope = 'unit_type';
create unique index if not exists project_prices_current_unit_unique
  on public.project_prices(project_id, unit_id) where is_current and scope = 'unit';
create index if not exists project_prices_history_idx on public.project_prices(project_id, effective_from desc);

create table if not exists public.project_media (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  media_type public.project_media_type not null default 'image',
  title text,
  alt_text text,
  storage_path text,
  public_url text not null,
  is_hero boolean not null default false,
  is_public boolean not null default false,
  is_approved boolean not null default false,
  sort_order integer not null default 0,
  uploaded_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists project_media_project_sort_idx on public.project_media(project_id, sort_order);

create table if not exists public.project_milestones (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  phase public.project_phase not null,
  title text not null,
  description text,
  progress_percent numeric(5,2) not null default 0 check (progress_percent between 0 and 100),
  floors_completed integer,
  total_floors integer,
  target_date date,
  completed_at timestamptz,
  is_public boolean not null default true,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists project_milestones_project_idx on public.project_milestones(project_id, created_at desc);

create table if not exists public.project_publications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null unique references public.projects(id) on delete cascade,
  status public.project_publication_status not null default 'draft',
  submitted_by uuid references auth.users(id),
  submitted_at timestamptz,
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  published_at timestamptz,
  unpublished_at timestamptz,
  publication_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  organization_id uuid references public.organizations(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  old_data jsonb,
  new_data jsonb,
  changed_at timestamptz not null default now(),
  request_id text
);

create index if not exists audit_logs_project_changed_idx on public.audit_logs(project_id, changed_at desc);
create index if not exists audit_logs_actor_idx on public.audit_logs(actor_user_id, changed_at desc);

create table if not exists public.project_enquiries (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  message text,
  source text not null default 'website',
  status text not null default 'new' check (status in ('new', 'contacted', 'closed', 'spam')),
  consent_given boolean not null default false,
  assigned_to uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists project_enquiries_project_status_idx on public.project_enquiries(project_id, status, created_at desc);

create or replace function private.current_organization_id()
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select organization_id from public.profiles where id = auth.uid()
$$;

create or replace function private.has_project_role(role_codes text[], target_project_id uuid default null)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    exists (
      select 1
      from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where ur.user_id = auth.uid()
        and r.code = any(role_codes)
        and (ur.project_id is null or ur.project_id = target_project_id)
    )
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role::text = any(role_codes)
    )
$$;

create or replace function private.can_view_project(target_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.projects p
    where p.id = target_project_id
      and p.organization_id = private.current_organization_id()
      and (
        private.has_project_role(array['admin','project_manager','marketing','sales','finance','engineer','procurement','inventory','hr','viewer'], target_project_id)
        or exists (
          select 1 from public.user_projects up
          where up.user_id = auth.uid() and up.project_id = target_project_id
        )
      )
  )
$$;

create or replace function private.can_manage_project(target_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.projects p
    where p.id = target_project_id
      and p.organization_id = private.current_organization_id()
      and private.has_project_role(array['admin','project_manager'], target_project_id)
  )
$$;

revoke all on all functions in schema private from public, anon;
grant execute on all functions in schema private to authenticated;

create or replace function private.set_price_history()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.is_current then
    update public.project_prices
    set is_current = false, effective_to = new.effective_from
    where project_id = new.project_id
      and id <> new.id
      and is_current
      and scope = new.scope
      and unit_type_id is not distinct from new.unit_type_id
      and unit_id is not distinct from new.unit_id;
  end if;
  return new;
end
$$;

drop trigger if exists project_prices_preserve_history on public.project_prices;
create trigger project_prices_preserve_history
before insert or update of is_current on public.project_prices
for each row execute function private.set_price_history();

create or replace function private.write_project_audit()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  row_data jsonb;
  old_row jsonb;
  new_row jsonb;
  target_project uuid;
  target_org uuid;
  target_id text;
begin
  old_row := case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) else null end;
  new_row := case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) else null end;
  row_data := coalesce(new_row, old_row);
  target_project := case when tg_table_name = 'projects'
    then (row_data->>'id')::uuid
    else nullif(row_data->>'project_id','')::uuid
  end;
  target_org := nullif(row_data->>'organization_id','')::uuid;
  target_id := row_data->>'id';

  insert into public.audit_logs (
    organization_id, project_id, actor_user_id, action, entity_type, entity_id, old_data, new_data
  ) values (
    target_org, target_project, auth.uid(), lower(tg_op), tg_table_name, target_id, old_row, new_row
  );
  return coalesce(new, old);
end
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'projects','user_roles','project_floors','floor_templates','floor_template_units',
    'unit_types','units','project_prices','project_media','project_milestones','project_publications'
  ]
  loop
    execute format('drop trigger if exists %I_audit on public.%I', table_name, table_name);
    execute format(
      'create trigger %I_audit after insert or update or delete on public.%I for each row execute function private.write_project_audit()',
      table_name, table_name
    );
  end loop;
end
$$;

create or replace function public.is_valid_unit_status_transition(
  old_status public.unit_status,
  new_status public.unit_status
)
returns boolean
language sql
immutable
set search_path = public, pg_temp
as $$
  select case old_status
    when 'draft' then new_status in ('draft', 'available', 'cancelled')
    when 'available' then new_status in ('available', 'on_hold', 'cancelled')
    when 'on_hold' then new_status in ('on_hold', 'available', 'reserved', 'cancelled')
    when 'reserved' then new_status in ('reserved', 'on_hold', 'contracted', 'cancelled')
    when 'contracted' then new_status in ('contracted', 'under_payment', 'sold', 'cancelled')
    when 'under_payment' then new_status in ('under_payment', 'fully_paid', 'sold', 'cancelled')
    when 'fully_paid' then new_status in ('fully_paid', 'sold', 'handed_over')
    when 'sold' then new_status in ('sold', 'handed_over')
    when 'handed_over' then new_status = 'handed_over'
    when 'cancelled' then new_status in ('cancelled', 'draft')
    else false
  end
$$;

create or replace function public.enforce_unit_status_transition()
returns trigger
language plpgsql
set search_path = public, private, pg_temp
as $$
begin
  if not public.is_valid_unit_status_transition(old.status, new.status) then
    raise exception 'Invalid unit status transition from % to %', old.status, new.status;
  end if;

  if new.status in ('reserved','contracted','sold','handed_over')
     and not private.has_project_role(array['admin','sales'], new.project_id) then
    raise exception 'Contractual unit status changes require Sales CRM permission';
  end if;

  return new;
end
$$;

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
        type, category, size_sqm, base_price, status, bedrooms, bathrooms,
        balconies, orientation, vat_rate, parking_price, generated_from_template_unit_id
      ) values (
        floor_row.organization_id, target_project_id, floor_row.id, template_unit.unit_type_id,
        generated_number, legacy_type, template_unit.unit_category, template_unit.size_sqm,
        generated_price, 'available', template_unit.bedrooms, template_unit.bathrooms,
        template_unit.balconies, template_unit.orientation,
        (select vat_rate from public.projects where id = target_project_id),
        (select parking_price from public.projects where id = target_project_id),
        template_unit.id
      );
      generated_count := generated_count + 1;
    end loop;
  end loop;

  return generated_count;
end
$$;

revoke all on function public.generate_project_units(uuid) from public, anon;
grant execute on function public.generate_project_units(uuid) to authenticated;
revoke all on function public.is_valid_unit_status_transition(public.unit_status, public.unit_status) from public, anon;
revoke all on function public.enforce_unit_status_transition() from public, anon;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'roles','user_roles','floor_templates','unit_types','project_floors','floor_template_units',
    'project_prices','project_media','project_milestones','project_publications','audit_logs','project_enquiries'
  ]
  loop
    execute format('alter table public.%I enable row level security', table_name);
  end loop;
end
$$;

drop policy if exists "project members can view assigned projects" on public.projects;
drop policy if exists "admins can manage organization projects" on public.projects;
drop policy if exists "project_module_read" on public.projects;
drop policy if exists "project_module_insert" on public.projects;
drop policy if exists "project_module_update" on public.projects;
drop policy if exists "project_module_delete" on public.projects;

create policy "project_module_read" on public.projects
for select to authenticated using (private.can_view_project(id));
create policy "project_module_insert" on public.projects
for insert to authenticated with check (
  organization_id = private.current_organization_id()
  and private.has_project_role(array['admin','project_manager'], null)
);
create policy "project_module_update" on public.projects
for update to authenticated using (private.can_manage_project(id))
with check (private.can_manage_project(id));
create policy "project_module_delete" on public.projects
for delete to authenticated using (private.can_manage_project(id));

drop policy if exists "roles_read" on public.roles;
create policy "roles_read" on public.roles
for select to authenticated using (true);

drop policy if exists "user_roles_read" on public.user_roles;
drop policy if exists "user_roles_manage" on public.user_roles;
create policy "user_roles_read" on public.user_roles
for select to authenticated using (
  user_id = auth.uid()
  or organization_id = private.current_organization_id()
     and private.has_project_role(array['admin','project_manager'], project_id)
);
create policy "user_roles_manage" on public.user_roles
for all to authenticated using (
  organization_id = private.current_organization_id()
  and private.has_project_role(array['admin'], project_id)
) with check (
  organization_id = private.current_organization_id()
  and private.has_project_role(array['admin'], project_id)
);

do $$
declare
  table_name text;
begin
  foreach table_name in array array['floor_templates','unit_types','floor_template_units']
  loop
    execute format('drop policy if exists project_read on public.%I', table_name);
    execute format('drop policy if exists project_manage on public.%I', table_name);
    execute format(
      'create policy project_read on public.%I for select to authenticated using (private.can_view_project(project_id))',
      table_name
    );
    execute format(
      'create policy project_manage on public.%I for all to authenticated using (private.can_manage_project(project_id)) with check (private.can_manage_project(project_id))',
      table_name
    );
  end loop;
end
$$;

drop policy if exists "project_read" on public.project_floors;
drop policy if exists "project_manage" on public.project_floors;
drop policy if exists "engineer_progress" on public.project_floors;
create policy "project_read" on public.project_floors
for select to authenticated using (private.can_view_project(project_id));
create policy "project_manage" on public.project_floors
for all to authenticated using (private.can_manage_project(project_id))
with check (private.can_manage_project(project_id));
create policy "engineer_progress" on public.project_floors
for update to authenticated using (
  private.has_project_role(array['engineer'], project_id) and private.can_view_project(project_id)
) with check (
  private.has_project_role(array['engineer'], project_id) and private.can_view_project(project_id)
);

drop policy if exists "project_read" on public.project_prices;
drop policy if exists "project_manage" on public.project_prices;
create policy "project_read" on public.project_prices
for select to authenticated using (private.can_view_project(project_id));
create policy "project_manage" on public.project_prices
for all to authenticated using (
  private.can_manage_project(project_id)
  or private.has_project_role(array['finance'], project_id)
) with check (
  private.can_manage_project(project_id)
  or private.has_project_role(array['finance'], project_id)
);

drop policy if exists "project_read" on public.project_media;
drop policy if exists "project_manage" on public.project_media;
create policy "project_read" on public.project_media
for select to authenticated using (private.can_view_project(project_id));
create policy "project_manage" on public.project_media
for all to authenticated using (
  private.can_manage_project(project_id)
  or private.has_project_role(array['marketing'], project_id)
) with check (
  private.can_manage_project(project_id)
  or private.has_project_role(array['marketing'], project_id)
);

drop policy if exists "project_read" on public.project_milestones;
drop policy if exists "project_manage" on public.project_milestones;
create policy "project_read" on public.project_milestones
for select to authenticated using (private.can_view_project(project_id));
create policy "project_manage" on public.project_milestones
for all to authenticated using (
  private.can_manage_project(project_id)
  or private.has_project_role(array['engineer'], project_id)
) with check (
  private.can_manage_project(project_id)
  or private.has_project_role(array['engineer'], project_id)
);

drop policy if exists "project_read" on public.project_publications;
drop policy if exists "project_manage" on public.project_publications;
create policy "project_read" on public.project_publications
for select to authenticated using (private.can_view_project(project_id));
create policy "project_manage" on public.project_publications
for all to authenticated using (
  private.can_manage_project(project_id)
  or private.has_project_role(array['marketing'], project_id)
) with check (
  private.can_manage_project(project_id)
  or private.has_project_role(array['marketing'], project_id)
);

drop policy if exists "audit_read" on public.audit_logs;
create policy "audit_read" on public.audit_logs
for select to authenticated using (
  project_id is not null
  and private.can_view_project(project_id)
  and private.has_project_role(array['admin','project_manager'], project_id)
);

drop policy if exists "enquiries_read" on public.project_enquiries;
drop policy if exists "enquiries_manage" on public.project_enquiries;
create policy "enquiries_read" on public.project_enquiries
for select to authenticated using (
  private.can_view_project(project_id)
  and private.has_project_role(array['admin','project_manager','marketing','sales'], project_id)
);
create policy "enquiries_manage" on public.project_enquiries
for all to authenticated using (
  private.can_view_project(project_id)
  and private.has_project_role(array['admin','project_manager','marketing','sales'], project_id)
) with check (
  private.can_view_project(project_id)
  and private.has_project_role(array['admin','project_manager','marketing','sales'], project_id)
);

drop policy if exists "project members can view units" on public.units;
drop policy if exists "admins and sales can manage units" on public.units;
drop policy if exists "project_units_read" on public.units;
drop policy if exists "project_units_manage" on public.units;
create policy "project_units_read" on public.units
for select to authenticated using (private.can_view_project(project_id));
create policy "project_units_manage" on public.units
for all to authenticated using (private.can_manage_project(project_id))
with check (private.can_manage_project(project_id));

drop policy if exists "project members can view buildings" on public.buildings;
drop policy if exists "admins can manage buildings" on public.buildings;
drop policy if exists "project_buildings_read" on public.buildings;
drop policy if exists "project_buildings_manage" on public.buildings;
create policy "project_buildings_read" on public.buildings
for select to authenticated using (private.can_view_project(project_id));
create policy "project_buildings_manage" on public.buildings
for all to authenticated using (private.can_manage_project(project_id))
with check (private.can_manage_project(project_id));

drop policy if exists "project members can view floors" on public.floors;
drop policy if exists "admins can manage floors" on public.floors;
drop policy if exists "project_floors_legacy_read" on public.floors;
drop policy if exists "project_floors_legacy_manage" on public.floors;
create policy "project_floors_legacy_read" on public.floors
for select to authenticated using (private.can_view_project(project_id));
create policy "project_floors_legacy_manage" on public.floors
for all to authenticated using (private.can_manage_project(project_id))
with check (private.can_manage_project(project_id));

revoke all on public.projects, public.profiles, public.user_projects, public.buildings, public.floors,
  public.units, public.business_events, public.financial_transactions, public.roles, public.user_roles,
  public.floor_templates, public.unit_types, public.project_floors, public.floor_template_units,
  public.project_prices, public.project_media, public.project_milestones, public.project_publications,
  public.audit_logs, public.project_enquiries from anon;

grant select, insert, update, delete on public.projects, public.user_roles, public.buildings, public.floors,
  public.units, public.floor_templates, public.unit_types, public.project_floors, public.floor_template_units,
  public.project_prices, public.project_media, public.project_milestones, public.project_publications,
  public.project_enquiries to authenticated;
grant select on public.roles, public.audit_logs to authenticated;
grant usage, select on sequence public.audit_logs_id_seq to authenticated;

drop view if exists public.public_project_unit_types;
drop view if exists public.public_project_media;
drop view if exists public.public_project_milestones;
drop view if exists public.public_projects;

create view public.public_projects
with (security_barrier = true)
as
select
  p.id,
  p.slug,
  coalesce(p.marketing_title, p.name) as name,
  p.short_description,
  p.description,
  p.address,
  p.city,
  p.subcity,
  p.latitude,
  p.longitude,
  p.google_maps_url,
  p.amenities,
  p.payment_plan_summary,
  p.offers,
  p.expected_completion_date,
  p.phase,
  p.floors_completed,
  p.total_floors,
  case
    when p.phase = 'floor_construction' then p.floors_completed::text || ' of ' || p.total_floors::text || ' floors completed'
    else replace(initcap(p.phase::text), '_', ' ')
  end as progress_label,
  (
    select min(pp.amount)
    from public.project_prices pp
    where pp.project_id = p.id and pp.is_current
  ) as starting_price_etb,
  (
    select pm.public_url
    from public.project_media pm
    where pm.project_id = p.id and pm.is_public and pm.is_approved
    order by pm.is_hero desc, pm.sort_order, pm.created_at
    limit 1
  ) as hero_image_url,
  pub.published_at
from public.projects p
join public.project_publications pub on pub.project_id = p.id
where pub.status = 'published'
  and p.slug is not null;

create view public.public_project_unit_types
with (security_barrier = true)
as
select
  p.slug as project_slug,
  ut.code,
  ut.name,
  ut.category,
  ut.bedrooms,
  ut.bathrooms,
  min(u.size_sqm) as minimum_size_sqm,
  max(u.size_sqm) as maximum_size_sqm,
  min(coalesce(pp.amount, u.base_price)) as starting_price_etb
from public.projects p
join public.project_publications pub on pub.project_id = p.id and pub.status = 'published'
join public.units u on u.project_id = p.id and u.status = 'available'
join public.unit_types ut on ut.id = u.unit_type_id
left join public.project_prices pp
  on pp.project_id = p.id and pp.unit_type_id = ut.id and pp.scope = 'unit_type' and pp.is_current
group by p.slug, ut.code, ut.name, ut.category, ut.bedrooms, ut.bathrooms;

create view public.public_project_media
with (security_barrier = true)
as
select
  p.slug as project_slug,
  pm.media_type,
  pm.title,
  pm.alt_text,
  pm.public_url,
  pm.is_hero,
  pm.sort_order
from public.projects p
join public.project_publications pub on pub.project_id = p.id and pub.status = 'published'
join public.project_media pm on pm.project_id = p.id
where pm.is_public and pm.is_approved;

create view public.public_project_milestones
with (security_barrier = true)
as
select
  p.slug as project_slug,
  m.phase,
  m.title,
  m.description,
  m.progress_percent,
  m.target_date,
  m.completed_at
from public.projects p
join public.project_publications pub on pub.project_id = p.id and pub.status = 'published'
join public.project_milestones m on m.project_id = p.id
where m.is_public;

revoke all on public.public_projects, public.public_project_unit_types,
  public.public_project_media, public.public_project_milestones from public;
grant select on public.public_projects, public.public_project_unit_types,
  public.public_project_media, public.public_project_milestones to anon, authenticated;
