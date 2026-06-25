-- Alet ERP foundation schema
-- Sprint 1: organization/project isolation, unit lifecycle, events, and finance ledger.

create extension if not exists pgcrypto;

create type public.user_role as enum (
  'admin',
  'finance',
  'sales',
  'engineer',
  'procurement',
  'contractor'
);

create type public.project_status as enum ('planning', 'active', 'paused', 'completed');
create type public.unit_type as enum ('studio', '1br', '2br', '3br', '4br');
create type public.unit_status as enum (
  'draft',
  'available',
  'reserved',
  'contracted',
  'under_payment',
  'fully_paid',
  'handed_over',
  'cancelled'
);
create type public.financial_transaction_type as enum (
  'income',
  'expense',
  'commission',
  'procurement',
  'contractor_payment'
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id),
  full_name text not null,
  role public.user_role not null default 'sales',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  name text not null,
  code text not null,
  status public.project_status not null default 'planning',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, code)
);

create table public.user_projects (
  user_id uuid not null references public.profiles(id) on delete cascade,
  organization_id uuid not null references public.organizations(id),
  project_id uuid not null references public.projects(id) on delete cascade,
  role public.user_role not null,
  created_at timestamptz not null default now(),
  primary key (user_id, project_id)
);

create table public.buildings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.floors (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  project_id uuid not null references public.projects(id) on delete cascade,
  building_id uuid not null references public.buildings(id) on delete cascade,
  floor_number integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (building_id, floor_number)
);

create table public.units (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  project_id uuid not null references public.projects(id) on delete cascade,
  building_id uuid not null references public.buildings(id),
  floor_id uuid not null references public.floors(id),
  unit_number text not null,
  type public.unit_type not null,
  size_sqm numeric(10, 2) not null check (size_sqm > 0),
  base_price numeric(14, 2) not null check (base_price >= 0),
  status public.unit_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, unit_number)
);

create table public.business_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  project_id uuid not null references public.projects(id) on delete cascade,
  type text not null,
  reference_type text not null,
  reference_id uuid not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.financial_transactions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  project_id uuid not null references public.projects(id) on delete cascade,
  unit_id uuid references public.units(id),
  event_id uuid references public.business_events(id),
  type public.financial_transaction_type not null,
  amount numeric(14, 2) not null check (amount >= 0),
  currency text not null default 'ETB',
  description text not null,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger organizations_set_updated_at
before update on public.organizations
for each row execute function public.set_updated_at();

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger projects_set_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

create trigger buildings_set_updated_at
before update on public.buildings
for each row execute function public.set_updated_at();

create trigger floors_set_updated_at
before update on public.floors
for each row execute function public.set_updated_at();

create trigger units_set_updated_at
before update on public.units
for each row execute function public.set_updated_at();

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.user_projects enable row level security;
alter table public.buildings enable row level security;
alter table public.floors enable row level security;
alter table public.units enable row level security;
alter table public.business_events enable row level security;
alter table public.financial_transactions enable row level security;

create policy "profiles can view same organization"
on public.profiles for select
using (
  organization_id in (
    select organization_id from public.profiles where id = auth.uid()
  )
);

create policy "project members can view assigned projects"
on public.projects for select
using (
  id in (
    select project_id from public.user_projects where user_id = auth.uid()
  )
);

create policy "project members can view assigned project users"
on public.user_projects for select
using (
  project_id in (
    select project_id from public.user_projects where user_id = auth.uid()
  )
);

create policy "project members can view buildings"
on public.buildings for select
using (
  project_id in (
    select project_id from public.user_projects where user_id = auth.uid()
  )
);

create policy "project members can view floors"
on public.floors for select
using (
  project_id in (
    select project_id from public.user_projects where user_id = auth.uid()
  )
);

create policy "project members can view units"
on public.units for select
using (
  project_id in (
    select project_id from public.user_projects where user_id = auth.uid()
  )
);

create policy "project members can view business events"
on public.business_events for select
using (
  project_id in (
    select project_id from public.user_projects where user_id = auth.uid()
  )
);

create policy "project members can view ledger transactions"
on public.financial_transactions for select
using (
  project_id in (
    select project_id from public.user_projects where user_id = auth.uid()
  )
);

create index idx_user_projects_user_id on public.user_projects(user_id);
create index idx_user_projects_project_id on public.user_projects(project_id);
create index idx_units_project_status on public.units(project_id, status);
create index idx_business_events_project_type on public.business_events(project_id, type);
create index idx_financial_transactions_project_type on public.financial_transactions(project_id, type);
