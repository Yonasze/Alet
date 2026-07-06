
create table if not exists public.sales_customers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  full_name text not null,
  phone text,
  email text,
  address text,
  government_id_type text,
  government_id_number text,
  consent_given boolean not null default false,
  assigned_to uuid references auth.users(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sales_customers_contact_required check (nullif(btrim(coalesce(phone,'')),'') is not null or nullif(btrim(coalesce(email,'')),'') is not null)
);

create unique index if not exists sales_customers_org_phone_unique
  on public.sales_customers (organization_id, lower(phone))
  where phone is not null and btrim(phone) <> '';
create unique index if not exists sales_customers_org_email_unique
  on public.sales_customers (organization_id, lower(email))
  where email is not null and btrim(email) <> '';

create table if not exists public.sales_leads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  enquiry_id uuid unique references public.project_enquiries(id) on delete set null,
  customer_id uuid references public.sales_customers(id) on delete set null,
  unit_type_id uuid references public.unit_types(id) on delete set null,
  full_name text not null,
  phone text,
  email text,
  preferred_contact_method text not null default 'phone',
  source text not null default 'manual',
  status text not null default 'open',
  stage text not null default 'new',
  budget_min_etb numeric(18,2),
  budget_max_etb numeric(18,2),
  message text,
  notes text,
  lost_reason text,
  assigned_to uuid references auth.users(id) on delete set null,
  last_contacted_at timestamptz,
  next_follow_up_at timestamptz,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sales_leads_contact_required check (nullif(btrim(coalesce(phone,'')),'') is not null or nullif(btrim(coalesce(email,'')),'') is not null),
  constraint sales_leads_status_check check (status in ('open','won','lost','spam')),
  constraint sales_leads_stage_check check (stage in ('new','contacted','qualified','viewing','unit_selected','on_hold','reserved','contracted','sold','handed_over','closed')),
  constraint sales_leads_budget_check check (
    (budget_min_etb is null or budget_min_etb >= 0) and
    (budget_max_etb is null or budget_max_etb >= 0) and
    (budget_min_etb is null or budget_max_etb is null or budget_max_etb >= budget_min_etb)
  )
);

create table if not exists public.sales_activities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  lead_id uuid references public.sales_leads(id) on delete cascade,
  customer_id uuid references public.sales_customers(id) on delete cascade,
  activity_type text not null default 'note',
  summary text not null,
  due_at timestamptz,
  completed_at timestamptz,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  constraint sales_activities_type_check check (activity_type in ('note','call','email','meeting','viewing','follow_up','status_change'))
);

create table if not exists public.sales_opportunities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  lead_id uuid unique references public.sales_leads(id) on delete set null,
  customer_id uuid not null references public.sales_customers(id) on delete restrict,
  unit_type_id uuid references public.unit_types(id) on delete set null,
  unit_id uuid references public.units(id) on delete set null,
  stage text not null default 'qualified',
  expected_value_etb numeric(18,2),
  quoted_price_etb numeric(18,2),
  probability_percent integer not null default 25,
  expected_close_date date,
  assigned_to uuid references auth.users(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sales_opportunities_stage_check check (stage in ('qualified','viewing','unit_selected','on_hold','reserved','contracted','sold','lost')),
  constraint sales_opportunities_probability_check check (probability_percent between 0 and 100),
  constraint sales_opportunities_price_check check (
    (expected_value_etb is null or expected_value_etb >= 0) and
    (quoted_price_etb is null or quoted_price_etb >= 0)
  )
);

create table if not exists public.sales_reservations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  opportunity_id uuid references public.sales_opportunities(id) on delete set null,
  lead_id uuid references public.sales_leads(id) on delete set null,
  customer_id uuid not null references public.sales_customers(id) on delete restrict,
  unit_id uuid not null references public.units(id) on delete restrict,
  reservation_number text not null,
  status text not null default 'on_hold',
  reserved_price_etb numeric(18,2) not null,
  price_includes_vat boolean not null default true,
  hold_expires_at timestamptz,
  reservation_expires_at timestamptz,
  notes text,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  approved_by uuid references auth.users(id) on delete set null,
  cancelled_at timestamptz,
  cancellation_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sales_reservations_number_unique unique (organization_id, reservation_number),
  constraint sales_reservations_status_check check (status in ('on_hold','reserved','contracted','sold','handed_over','cancelled','expired')),
  constraint sales_reservations_price_check check (reserved_price_etb > 0)
);

create unique index if not exists sales_reservations_active_unit_unique
  on public.sales_reservations (unit_id)
  where status in ('on_hold','reserved','contracted','sold','handed_over');

create table if not exists public.sales_contracts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  reservation_id uuid not null unique references public.sales_reservations(id) on delete restrict,
  customer_id uuid not null references public.sales_customers(id) on delete restrict,
  unit_id uuid not null references public.units(id) on delete restrict,
  contract_number text not null,
  status text not null default 'draft',
  total_price_etb numeric(18,2) not null,
  price_includes_vat boolean not null default true,
  payment_plan jsonb not null default '[]'::jsonb,
  signed_at timestamptz,
  sold_at timestamptz,
  handed_over_at timestamptz,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  approved_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sales_contracts_number_unique unique (organization_id, contract_number),
  constraint sales_contracts_status_check check (status in ('draft','signed','active','completed','cancelled')),
  constraint sales_contracts_price_check check (total_price_etb > 0)
);

alter table public.project_enquiries add column if not exists organization_id uuid references public.organizations(id) on delete cascade;
alter table public.project_enquiries add column if not exists unit_type_id uuid references public.unit_types(id) on delete set null;
alter table public.project_enquiries add column if not exists preferred_contact_method text not null default 'phone';
alter table public.project_enquiries add column if not exists budget_min_etb numeric(18,2);
alter table public.project_enquiries add column if not exists budget_max_etb numeric(18,2);
alter table public.project_enquiries add column if not exists lead_id uuid references public.sales_leads(id) on delete set null;

update public.project_enquiries e
set organization_id = p.organization_id
from public.projects p
where p.id = e.project_id and e.organization_id is null;

alter table public.project_enquiries alter column organization_id set not null;
alter table public.project_enquiries drop constraint if exists project_enquiries_status_check;
alter table public.project_enquiries add constraint project_enquiries_status_check
  check (status in ('new','contacted','qualified','converted','closed','spam'));
alter table public.project_enquiries drop constraint if exists project_enquiries_contact_required;
alter table public.project_enquiries add constraint project_enquiries_contact_required
  check (nullif(btrim(coalesce(phone,'')),'') is not null or nullif(btrim(coalesce(email,'')),'') is not null);

create index if not exists sales_leads_project_stage_idx on public.sales_leads(project_id, stage, created_at desc);
create index if not exists sales_leads_assigned_followup_idx on public.sales_leads(assigned_to, next_follow_up_at) where status='open';
create index if not exists sales_activities_lead_idx on public.sales_activities(lead_id, created_at desc);
create index if not exists sales_opportunities_project_stage_idx on public.sales_opportunities(project_id, stage);
create index if not exists sales_reservations_project_status_idx on public.sales_reservations(project_id, status, created_at desc);
create index if not exists sales_contracts_project_status_idx on public.sales_contracts(project_id, status, created_at desc);

create or replace function private.can_manage_sales(target_project_id uuid)
returns boolean
language sql stable security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.projects p
    where p.id = target_project_id
      and p.organization_id = private.current_organization_id()
      and private.has_project_role(array['admin','project_manager','sales'], target_project_id)
  )
$$;

create or replace function private.can_view_sales(target_project_id uuid)
returns boolean
language sql stable security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.projects p
    where p.id = target_project_id
      and p.organization_id = private.current_organization_id()
      and private.has_project_role(array['admin','project_manager','sales','finance'], target_project_id)
  )
$$;

create or replace function private.sales_set_updated_at()
returns trigger language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end
$$;

alter table public.sales_customers enable row level security;
alter table public.sales_leads enable row level security;
alter table public.sales_activities enable row level security;
alter table public.sales_opportunities enable row level security;
alter table public.sales_reservations enable row level security;
alter table public.sales_contracts enable row level security;

drop policy if exists sales_customers_read on public.sales_customers;
create policy sales_customers_read on public.sales_customers for select to authenticated
using (
  organization_id = private.current_organization_id()
  and private.has_project_role(array['admin','project_manager','sales','finance'], null)
);
drop policy if exists sales_customers_manage on public.sales_customers;
create policy sales_customers_manage on public.sales_customers for all to authenticated
using (
  organization_id = private.current_organization_id()
  and private.has_project_role(array['admin','project_manager','sales'], null)
)
with check (
  organization_id = private.current_organization_id()
  and private.has_project_role(array['admin','project_manager','sales'], null)
);

drop policy if exists sales_leads_read on public.sales_leads;
create policy sales_leads_read on public.sales_leads for select to authenticated using (private.can_view_sales(project_id));
drop policy if exists sales_leads_manage on public.sales_leads;
create policy sales_leads_manage on public.sales_leads for all to authenticated
using (private.can_manage_sales(project_id)) with check (private.can_manage_sales(project_id));

drop policy if exists sales_activities_read on public.sales_activities;
create policy sales_activities_read on public.sales_activities for select to authenticated using (private.can_view_sales(project_id));
drop policy if exists sales_activities_manage on public.sales_activities;
create policy sales_activities_manage on public.sales_activities for all to authenticated
using (private.can_manage_sales(project_id)) with check (private.can_manage_sales(project_id));

drop policy if exists sales_opportunities_read on public.sales_opportunities;
create policy sales_opportunities_read on public.sales_opportunities for select to authenticated using (private.can_view_sales(project_id));
drop policy if exists sales_opportunities_manage on public.sales_opportunities;
create policy sales_opportunities_manage on public.sales_opportunities for all to authenticated
using (private.can_manage_sales(project_id)) with check (private.can_manage_sales(project_id));

drop policy if exists sales_reservations_read on public.sales_reservations;
create policy sales_reservations_read on public.sales_reservations for select to authenticated using (private.can_view_sales(project_id));
drop policy if exists sales_reservations_manage on public.sales_reservations;
create policy sales_reservations_manage on public.sales_reservations for all to authenticated
using (private.can_manage_sales(project_id)) with check (private.can_manage_sales(project_id));

drop policy if exists sales_contracts_read on public.sales_contracts;
create policy sales_contracts_read on public.sales_contracts for select to authenticated using (private.can_view_sales(project_id));
drop policy if exists sales_contracts_manage on public.sales_contracts;
create policy sales_contracts_manage on public.sales_contracts for all to authenticated
using (private.can_manage_sales(project_id)) with check (private.can_manage_sales(project_id));

drop policy if exists enquiries_manage on public.project_enquiries;
drop policy if exists enquiries_read on public.project_enquiries;
create policy enquiries_read on public.project_enquiries for select to authenticated using (private.can_view_sales(project_id));
create policy enquiries_manage on public.project_enquiries for all to authenticated
using (private.can_manage_sales(project_id)) with check (private.can_manage_sales(project_id));

create or replace function public.submit_project_enquiry(payload jsonb)
returns jsonb
language plpgsql security definer
set search_path = public, private, pg_temp
as $$
declare
  target_project public.projects%rowtype;
  target_unit_type_id uuid;
  enquiry_id uuid;
  lead_id uuid;
  contact_name text := btrim(coalesce(payload->>'name',''));
  contact_phone text := nullif(btrim(coalesce(payload->>'phone','')), '');
  contact_email text := nullif(lower(btrim(coalesce(payload->>'email',''))), '');
  contact_method text := coalesce(nullif(payload->>'preferred_contact_method',''), 'phone');
begin
  if nullif(btrim(coalesce(payload->>'website','')), '') is not null then
    return jsonb_build_object('accepted', true);
  end if;
  if length(contact_name) < 2 or length(contact_name) > 120 then raise exception 'Please enter your full name.'; end if;
  if contact_phone is null and contact_email is null then raise exception 'Enter a phone number or email address.'; end if;
  if contact_phone is not null and length(contact_phone) > 40 then raise exception 'Phone number is too long.'; end if;
  if contact_email is not null and length(contact_email) > 200 then raise exception 'Email address is too long.'; end if;
  if contact_method not in ('phone','email','whatsapp') then contact_method := 'phone'; end if;

  select p.* into target_project
  from public.projects p
  join public.project_publications pp on pp.project_id=p.id and pp.status='published'
  where p.slug = payload->>'project_slug'
  limit 1;
  if target_project.id is null then raise exception 'This project is not accepting enquiries.'; end if;

  if nullif(payload->>'unit_type_code','') is not null then
    select id into target_unit_type_id from public.unit_types
    where project_id=target_project.id and code=payload->>'unit_type_code' limit 1;
  end if;

  insert into public.project_enquiries (
    organization_id, project_id, unit_type_id, name, email, phone, message, source, status,
    consent_given, preferred_contact_method, budget_min_etb, budget_max_etb
  ) values (
    target_project.organization_id, target_project.id, target_unit_type_id, contact_name, contact_email, contact_phone,
    left(nullif(btrim(coalesce(payload->>'message','')), ''), 2000), 'website', 'new',
    coalesce((payload->>'consent_given')::boolean, false), contact_method,
    nullif(payload->>'budget_min_etb','')::numeric, nullif(payload->>'budget_max_etb','')::numeric
  ) returning id into enquiry_id;

  insert into public.sales_leads (
    organization_id, project_id, enquiry_id, unit_type_id, full_name, phone, email,
    preferred_contact_method, source, stage, budget_min_etb, budget_max_etb, message
  ) values (
    target_project.organization_id, target_project.id, enquiry_id, target_unit_type_id, contact_name, contact_phone,
    contact_email, contact_method, 'website', 'new',
    nullif(payload->>'budget_min_etb','')::numeric, nullif(payload->>'budget_max_etb','')::numeric,
    left(nullif(btrim(coalesce(payload->>'message','')), ''), 2000)
  ) returning id into lead_id;

  update public.project_enquiries set lead_id=lead_id where id=enquiry_id;
  return jsonb_build_object('accepted', true, 'enquiry_id', enquiry_id);
end
$$;

create or replace function public.create_crm_lead(payload jsonb)
returns jsonb
language plpgsql security definer
set search_path = public, private, pg_temp
as $$
declare
  target_project public.projects%rowtype;
  new_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required.'; end if;
  select * into target_project from public.projects where id=(payload->>'project_id')::uuid;
  if target_project.id is null or not private.can_manage_sales(target_project.id) then raise exception 'Not authorized.'; end if;
  if nullif(btrim(coalesce(payload->>'full_name','')), '') is null then raise exception 'Lead name is required.'; end if;
  if nullif(btrim(coalesce(payload->>'phone','')), '') is null and nullif(btrim(coalesce(payload->>'email','')), '') is null then
    raise exception 'Phone or email is required.';
  end if;

  insert into public.sales_leads (
    organization_id, project_id, unit_type_id, full_name, phone, email, preferred_contact_method,
    source, stage, budget_min_etb, budget_max_etb, message, notes, assigned_to
  ) values (
    target_project.organization_id, target_project.id, nullif(payload->>'unit_type_id','')::uuid,
    btrim(payload->>'full_name'), nullif(btrim(payload->>'phone'),''), nullif(lower(btrim(payload->>'email')),''),
    coalesce(nullif(payload->>'preferred_contact_method',''),'phone'), coalesce(nullif(payload->>'source',''),'manual'),
    'new', nullif(payload->>'budget_min_etb','')::numeric, nullif(payload->>'budget_max_etb','')::numeric,
    nullif(btrim(payload->>'message'),''), nullif(btrim(payload->>'notes'),''), auth.uid()
  ) returning id into new_id;

  return jsonb_build_object('lead_id',new_id);
end
$$;

create or replace function public.update_crm_lead(payload jsonb)
returns jsonb
language plpgsql security definer
set search_path = public, private, pg_temp
as $$
declare
  target public.sales_leads%rowtype;
  new_stage text;
  activity_summary text;
begin
  if auth.uid() is null then raise exception 'Authentication required.'; end if;
  select * into target from public.sales_leads where id=(payload->>'lead_id')::uuid;
  if target.id is null or not private.can_manage_sales(target.project_id) then raise exception 'Not authorized.'; end if;
  new_stage := coalesce(nullif(payload->>'stage',''), target.stage);
  if new_stage not in ('new','contacted','qualified','viewing','unit_selected','on_hold','reserved','contracted','sold','handed_over','closed') then
    raise exception 'Invalid sales stage.';
  end if;

  update public.sales_leads set
    stage=new_stage,
    status=case when new_stage in ('sold','handed_over') then 'won' when new_stage='closed' and nullif(payload->>'lost_reason','') is not null then 'lost' else status end,
    notes=coalesce(nullif(btrim(payload->>'notes'),''), notes),
    lost_reason=case when new_stage='closed' then nullif(btrim(payload->>'lost_reason'),'') else lost_reason end,
    next_follow_up_at=nullif(payload->>'next_follow_up_at','')::timestamptz,
    last_contacted_at=case when new_stage in ('contacted','qualified','viewing') then now() else last_contacted_at end,
    assigned_to=coalesce(nullif(payload->>'assigned_to','')::uuid, assigned_to)
  where id=target.id;

  activity_summary := nullif(btrim(coalesce(payload->>'activity_summary','')), '');
  if activity_summary is not null then
    insert into public.sales_activities (organization_id,project_id,lead_id,activity_type,summary,due_at)
    values (target.organization_id,target.project_id,target.id,coalesce(nullif(payload->>'activity_type',''),'note'),activity_summary,
      nullif(payload->>'next_follow_up_at','')::timestamptz);
  end if;

  update public.project_enquiries set
    status=case when new_stage='contacted' then 'contacted' when new_stage in ('qualified','viewing','unit_selected') then 'qualified'
      when new_stage in ('on_hold','reserved','contracted','sold','handed_over') then 'converted' when new_stage='closed' then 'closed' else status end
  where id=target.enquiry_id;

  return jsonb_build_object('lead_id',target.id);
end
$$;

create or replace function private.ensure_customer_for_lead(target_lead_id uuid)
returns uuid
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  target public.sales_leads%rowtype;
  customer_id uuid;
begin
  select * into target from public.sales_leads where id=target_lead_id for update;
  if target.customer_id is not null then return target.customer_id; end if;

  select id into customer_id from public.sales_customers
  where organization_id=target.organization_id
    and ((target.phone is not null and lower(phone)=lower(target.phone)) or (target.email is not null and lower(email)=lower(target.email)))
  limit 1;

  if customer_id is null then
    insert into public.sales_customers (organization_id,full_name,phone,email,consent_given,assigned_to)
    values (target.organization_id,target.full_name,target.phone,target.email,
      coalesce((select consent_given from public.project_enquiries where id=target.enquiry_id),false),target.assigned_to)
    returning id into customer_id;
  end if;
  update public.sales_leads set customer_id=customer_id where id=target.id;
  return customer_id;
end
$$;

create or replace function public.create_sales_reservation(payload jsonb)
returns jsonb
language plpgsql security definer
set search_path = public, private, pg_temp
as $$
declare
  target_lead public.sales_leads%rowtype;
  target_unit public.units%rowtype;
  customer_id uuid;
  opportunity_id uuid;
  reservation_id uuid;
  reservation_status text := coalesce(nullif(payload->>'status',''),'on_hold');
  reservation_price numeric := nullif(payload->>'reserved_price_etb','')::numeric;
  reservation_number text;
begin
  if auth.uid() is null then raise exception 'Authentication required.'; end if;
  select * into target_lead from public.sales_leads where id=(payload->>'lead_id')::uuid for update;
  if target_lead.id is null or not private.can_manage_sales(target_lead.project_id) then raise exception 'Not authorized.'; end if;
  select * into target_unit from public.units where id=(payload->>'unit_id')::uuid and project_id=target_lead.project_id for update;
  if target_unit.id is null then raise exception 'Unit not found.'; end if;
  if target_unit.status::text not in ('available','on_hold') then raise exception 'This unit is no longer available.'; end if;
  if reservation_status not in ('on_hold','reserved') then raise exception 'Invalid reservation status.'; end if;
  if reservation_price is null or reservation_price <= 0 then raise exception 'A valid agreed selling price is required.'; end if;

  customer_id := private.ensure_customer_for_lead(target_lead.id);

  select id into opportunity_id from public.sales_opportunities where lead_id=target_lead.id;
  if opportunity_id is null then
    insert into public.sales_opportunities (
      organization_id,project_id,lead_id,customer_id,unit_type_id,unit_id,stage,
      expected_value_etb,quoted_price_etb,probability_percent,assigned_to
    ) values (
      target_lead.organization_id,target_lead.project_id,target_lead.id,customer_id,target_unit.unit_type_id,target_unit.id,
      reservation_status,reservation_price,reservation_price,case when reservation_status='reserved' then 75 else 55 end,target_lead.assigned_to
    ) returning id into opportunity_id;
  else
    update public.sales_opportunities set unit_id=target_unit.id,quoted_price_etb=reservation_price,stage=reservation_status,
      probability_percent=case when reservation_status='reserved' then 75 else 55 end where id=opportunity_id;
  end if;

  reservation_number := 'RES-' || to_char(now(),'YYYYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,6));
  insert into public.sales_reservations (
    organization_id,project_id,opportunity_id,lead_id,customer_id,unit_id,reservation_number,status,
    reserved_price_etb,price_includes_vat,hold_expires_at,reservation_expires_at,notes
  ) values (
    target_lead.organization_id,target_lead.project_id,opportunity_id,target_lead.id,customer_id,target_unit.id,reservation_number,
    reservation_status,reservation_price,true,
    case when reservation_status='on_hold' then coalesce(nullif(payload->>'expires_at','')::timestamptz,now()+interval '48 hours') end,
    case when reservation_status='reserved' then coalesce(nullif(payload->>'expires_at','')::timestamptz,now()+interval '14 days') end,
    nullif(btrim(payload->>'notes'),'')
  ) returning id into reservation_id;

  update public.units set status=reservation_status::public.unit_status where id=target_unit.id;
  update public.sales_leads set stage=reservation_status,customer_id=customer_id where id=target_lead.id;
  update public.project_enquiries set status='converted' where id=target_lead.enquiry_id;

  return jsonb_build_object('reservation_id',reservation_id,'reservation_number',reservation_number);
end
$$;

create or replace function public.sales_reservation_action(payload jsonb)
returns jsonb
language plpgsql security definer
set search_path = public, private, pg_temp
as $$
declare
  target public.sales_reservations%rowtype;
  requested_action text := payload->>'action';
  contract_id uuid;
  contract_number text;
begin
  if auth.uid() is null then raise exception 'Authentication required.'; end if;
  select * into target from public.sales_reservations where id=(payload->>'reservation_id')::uuid for update;
  if target.id is null or not private.can_manage_sales(target.project_id) then raise exception 'Not authorized.'; end if;

  if requested_action='reserve' then
    if target.status <> 'on_hold' then raise exception 'Only held units can be reserved.'; end if;
    update public.sales_reservations set status='reserved',hold_expires_at=null,
      reservation_expires_at=coalesce(nullif(payload->>'expires_at','')::timestamptz,now()+interval '14 days') where id=target.id;
    update public.units set status='reserved' where id=target.unit_id;
    update public.sales_leads set stage='reserved' where id=target.lead_id;
  elsif requested_action='contract' then
    if target.status not in ('on_hold','reserved') then raise exception 'This reservation cannot be contracted.'; end if;
    contract_number := 'ALT-' || to_char(now(),'YYYY') || '-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,7));
    insert into public.sales_contracts (
      organization_id,project_id,reservation_id,customer_id,unit_id,contract_number,status,total_price_etb,
      price_includes_vat,payment_plan,signed_at,approved_by
    ) values (
      target.organization_id,target.project_id,target.id,target.customer_id,target.unit_id,contract_number,'signed',
      target.reserved_price_etb,true,coalesce(payload->'payment_plan','[]'::jsonb),now(),auth.uid()
    ) on conflict (reservation_id) do update set status='signed',signed_at=coalesce(public.sales_contracts.signed_at,now())
    returning id into contract_id;
    update public.sales_reservations set status='contracted',approved_by=auth.uid(),reservation_expires_at=null where id=target.id;
    update public.units set status='contracted' where id=target.unit_id;
    update public.sales_leads set stage='contracted' where id=target.lead_id;
    update public.sales_opportunities set stage='contracted',probability_percent=95 where id=target.opportunity_id;
  elsif requested_action='sell' then
    if target.status <> 'contracted' then raise exception 'Only contracted units can be marked sold.'; end if;
    update public.sales_contracts set status='active',sold_at=now() where reservation_id=target.id returning id into contract_id;
    update public.sales_reservations set status='sold' where id=target.id;
    update public.units set status='sold' where id=target.unit_id;
    update public.sales_leads set stage='sold',status='won' where id=target.lead_id;
    update public.sales_opportunities set stage='sold',probability_percent=100 where id=target.opportunity_id;
  elsif requested_action='handover' then
    if target.status <> 'sold' then raise exception 'Only sold units can be handed over.'; end if;
    update public.sales_contracts set status='completed',handed_over_at=now() where reservation_id=target.id returning id into contract_id;
    update public.sales_reservations set status='handed_over' where id=target.id;
    update public.units set status='handed_over' where id=target.unit_id;
    update public.sales_leads set stage='handed_over',status='won' where id=target.lead_id;
  elsif requested_action='cancel' then
    if target.status in ('sold','handed_over','cancelled','expired') then raise exception 'This reservation cannot be cancelled.'; end if;
    update public.sales_reservations set status='cancelled',cancelled_at=now(),
      cancellation_reason=coalesce(nullif(btrim(payload->>'reason'),''),'Cancelled by sales') where id=target.id;
    update public.sales_contracts set status='cancelled' where reservation_id=target.id;
    update public.units set status='available' where id=target.unit_id;
    update public.sales_leads set stage='qualified' where id=target.lead_id;
    update public.sales_opportunities set stage='qualified',unit_id=null,probability_percent=25 where id=target.opportunity_id;
  else
    raise exception 'Invalid reservation action.';
  end if;

  return jsonb_build_object('reservation_id',target.id,'action',requested_action,'contract_id',contract_id);
end
$$;

create or replace function public.expire_sales_holds()
returns integer
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare expired_count integer;
begin
  with expired as (
    update public.sales_reservations
    set status='expired',updated_at=now()
    where status='on_hold' and hold_expires_at < now()
    returning unit_id,lead_id,opportunity_id
  ), released as (
    update public.units u set status='available'
    from expired e where u.id=e.unit_id returning e.lead_id,e.opportunity_id
  )
  update public.sales_leads l set stage='qualified'
  from released r where l.id=r.lead_id;
  get diagnostics expired_count = row_count;
  return expired_count;
end
$$;

revoke all on function public.submit_project_enquiry(jsonb) from public;
grant execute on function public.submit_project_enquiry(jsonb) to anon, authenticated;
revoke all on function public.create_crm_lead(jsonb) from public, anon;
grant execute on function public.create_crm_lead(jsonb) to authenticated;
revoke all on function public.update_crm_lead(jsonb) from public, anon;
grant execute on function public.update_crm_lead(jsonb) to authenticated;
revoke all on function public.create_sales_reservation(jsonb) from public, anon;
grant execute on function public.create_sales_reservation(jsonb) to authenticated;
revoke all on function public.sales_reservation_action(jsonb) from public, anon;
grant execute on function public.sales_reservation_action(jsonb) to authenticated;
revoke all on function public.expire_sales_holds() from public, anon;
grant execute on function public.expire_sales_holds() to authenticated;

revoke all on public.sales_customers, public.sales_leads, public.sales_activities, public.sales_opportunities, public.sales_reservations, public.sales_contracts from anon;
grant select,insert,update,delete on public.sales_customers, public.sales_leads, public.sales_activities, public.sales_opportunities, public.sales_reservations, public.sales_contracts to authenticated;

drop trigger if exists sales_customers_updated_at on public.sales_customers;
create trigger sales_customers_updated_at before update on public.sales_customers for each row execute function private.sales_set_updated_at();
drop trigger if exists sales_leads_updated_at on public.sales_leads;
create trigger sales_leads_updated_at before update on public.sales_leads for each row execute function private.sales_set_updated_at();
drop trigger if exists sales_opportunities_updated_at on public.sales_opportunities;
create trigger sales_opportunities_updated_at before update on public.sales_opportunities for each row execute function private.sales_set_updated_at();
drop trigger if exists sales_reservations_updated_at on public.sales_reservations;
create trigger sales_reservations_updated_at before update on public.sales_reservations for each row execute function private.sales_set_updated_at();
drop trigger if exists sales_contracts_updated_at on public.sales_contracts;
create trigger sales_contracts_updated_at before update on public.sales_contracts for each row execute function private.sales_set_updated_at();

drop trigger if exists audit_sales_customers on public.sales_customers;
create trigger audit_sales_customers after insert or update or delete on public.sales_customers for each row execute function private.write_project_audit();
drop trigger if exists audit_sales_leads on public.sales_leads;
create trigger audit_sales_leads after insert or update or delete on public.sales_leads for each row execute function private.write_project_audit();
drop trigger if exists audit_sales_activities on public.sales_activities;
create trigger audit_sales_activities after insert or update or delete on public.sales_activities for each row execute function private.write_project_audit();
drop trigger if exists audit_sales_opportunities on public.sales_opportunities;
create trigger audit_sales_opportunities after insert or update or delete on public.sales_opportunities for each row execute function private.write_project_audit();
drop trigger if exists audit_sales_reservations on public.sales_reservations;
create trigger audit_sales_reservations after insert or update or delete on public.sales_reservations for each row execute function private.write_project_audit();
drop trigger if exists audit_sales_contracts on public.sales_contracts;
create trigger audit_sales_contracts after insert or update or delete on public.sales_contracts for each row execute function private.write_project_audit();
