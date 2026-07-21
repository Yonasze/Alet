alter table public.business_events
  add column if not exists event_number text,
  add column if not exists title text,
  add column if not exists description text,
  add column if not exists category text,
  add column if not exists status text not null default 'scheduled',
  add column if not exists priority text not null default 'normal',
  add column if not exists starts_at timestamptz,
  add column if not exists ends_at timestamptz,
  add column if not exists all_day boolean not null default false,
  add column if not exists location text,
  add column if not exists owner_id uuid,
  add column if not exists attendee_ids uuid[] not null default '{}',
  add column if not exists reminder_minutes integer[] not null default '{60}',
  add column if not exists completed_at timestamptz,
  add column if not exists created_by uuid,
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'business_events_owner_id_fkey') then
    alter table public.business_events add constraint business_events_owner_id_fkey foreign key (owner_id) references public.profiles(id) on delete set null;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'business_events_created_by_fkey') then
    alter table public.business_events add constraint business_events_created_by_fkey foreign key (created_by) references public.profiles(id) on delete set null;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'business_events_status_check') then
    alter table public.business_events add constraint business_events_status_check check (status in ('scheduled','in_progress','completed','cancelled')) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'business_events_priority_check') then
    alter table public.business_events add constraint business_events_priority_check check (priority in ('low','normal','high','urgent')) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'business_events_category_check') then
    alter table public.business_events add constraint business_events_category_check check (category is null or category in ('meeting','site_inspection','milestone','deadline','handover','payment','procurement','inventory','compliance','other')) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'business_events_time_check') then
    alter table public.business_events add constraint business_events_time_check check (ends_at is null or starts_at is null or ends_at >= starts_at) not valid;
  end if;
end $$;

create unique index if not exists business_events_org_number_idx on public.business_events(organization_id,event_number) where event_number is not null;
create index if not exists business_events_org_start_idx on public.business_events(organization_id,starts_at) where starts_at is not null;
create index if not exists business_events_owner_status_idx on public.business_events(owner_id,status) where owner_id is not null;
create index if not exists business_events_created_by_idx on public.business_events(created_by) where created_by is not null;

alter table public.business_events enable row level security;

drop policy if exists finance_business_events_read on public.business_events;
drop policy if exists events_workspace_read on public.business_events;
create policy events_workspace_read on public.business_events for select to authenticated
using (organization_id = private.current_organization_id() and private.can_view_project(project_id));

drop policy if exists events_workspace_insert on public.business_events;
create policy events_workspace_insert on public.business_events for insert to authenticated
with check (organization_id = private.current_organization_id() and private.can_view_project(project_id) and created_by = (select auth.uid()));

drop policy if exists events_workspace_update on public.business_events;
create policy events_workspace_update on public.business_events for update to authenticated
using (
  organization_id = private.current_organization_id()
  and private.can_view_project(project_id)
  and (created_by = (select auth.uid()) or owner_id = (select auth.uid()) or private.has_project_role(array['admin','project_manager'],project_id))
)
with check (organization_id = private.current_organization_id() and private.can_view_project(project_id));

drop policy if exists events_workspace_delete on public.business_events;
create policy events_workspace_delete on public.business_events for delete to authenticated
using (
  organization_id = private.current_organization_id()
  and private.can_view_project(project_id)
  and (created_by = (select auth.uid()) or private.has_project_role(array['admin','project_manager'],project_id))
);

create or replace function public.create_scheduled_event(payload jsonb)
returns public.business_events
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  event_id uuid := gen_random_uuid();
  result public.business_events;
  organization_id uuid := private.current_organization_id();
  start_time timestamptz := nullif(payload->>'starts_at','')::timestamptz;
  end_time timestamptz := nullif(payload->>'ends_at','')::timestamptz;
begin
  if organization_id is null then raise exception 'Your user is not assigned to an organization.'; end if;
  if coalesce(trim(payload->>'title'),'') = '' then raise exception 'Event title is required.'; end if;
  if start_time is null then raise exception 'Start date and time are required.'; end if;
  if end_time is not null and end_time < start_time then raise exception 'End time cannot be before start time.'; end if;

  insert into public.business_events(
    id,organization_id,project_id,type,reference_type,reference_id,payload,event_number,title,description,
    category,status,priority,starts_at,ends_at,all_day,location,owner_id,attendee_ids,reminder_minutes,created_by,updated_at
  ) values (
    event_id,organization_id,(payload->>'project_id')::uuid,upper(coalesce(payload->>'category','other')),
    'scheduled_event',event_id,'{}'::jsonb,'EVT-'||upper(substr(replace(event_id::text,'-',''),1,10)),
    trim(payload->>'title'),nullif(trim(payload->>'description'),''),coalesce(nullif(payload->>'category',''),'other'),
    'scheduled',coalesce(nullif(payload->>'priority',''),'normal'),start_time,end_time,
    coalesce((payload->>'all_day')::boolean,false),nullif(trim(payload->>'location'),''),
    coalesce(nullif(payload->>'owner_id','')::uuid,(select auth.uid())),
    coalesce(array(select jsonb_array_elements_text(coalesce(payload->'attendee_ids','[]'::jsonb))::uuid),'{}'::uuid[]),
    array[coalesce(nullif(payload->>'reminder_minutes','')::integer,60)],(select auth.uid()),now()
  ) returning * into result;
  return result;
end $$;

create or replace function public.scheduled_event_action(payload jsonb)
returns public.business_events
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  result public.business_events;
  requested_action text := lower(payload->>'action');
  target_event_id uuid := (payload->>'event_id')::uuid;
begin
  if requested_action not in ('start','complete','cancel','reopen') then raise exception 'Unsupported event action.'; end if;
  update public.business_events set
    status = case requested_action when 'start' then 'in_progress' when 'complete' then 'completed' when 'cancel' then 'cancelled' else 'scheduled' end,
    completed_at = case when requested_action = 'complete' then now() else null end,
    updated_at = now()
  where id = target_event_id and starts_at is not null
  returning * into result;
  if result.id is null then raise exception 'Event was not found or you cannot update it.'; end if;
  return result;
end $$;

revoke all on table public.business_events from anon;
grant select,insert,update,delete on table public.business_events to authenticated,service_role;
revoke all on function public.create_scheduled_event(jsonb) from public,anon;
revoke all on function public.scheduled_event_action(jsonb) from public,anon;
grant execute on function public.create_scheduled_event(jsonb) to authenticated,service_role;
grant execute on function public.scheduled_event_action(jsonb) to authenticated,service_role;

