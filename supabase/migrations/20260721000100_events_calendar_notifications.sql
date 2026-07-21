create table if not exists public.event_notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  event_id uuid not null references public.business_events(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  reminder_minutes integer not null check (reminder_minutes >= 0),
  title text not null,
  message text not null,
  scheduled_for timestamptz not null,
  delivered_at timestamptz not null default now(),
  read_at timestamptz,
  created_at timestamptz not null default now(),
  unique (event_id, recipient_id, reminder_minutes)
);

alter table public.event_notifications enable row level security;

create index if not exists event_notifications_recipient_unread_idx
  on public.event_notifications (recipient_id, delivered_at desc)
  where read_at is null;

create index if not exists event_notifications_event_idx
  on public.event_notifications (event_id);

drop policy if exists event_notifications_read on public.event_notifications;
create policy event_notifications_read on public.event_notifications
  for select to authenticated
  using (
    recipient_id = (select auth.uid())
    and organization_id = (select private.current_organization_id())
  );

drop policy if exists event_notifications_update on public.event_notifications;
create policy event_notifications_update on public.event_notifications
  for update to authenticated
  using (
    recipient_id = (select auth.uid())
    and organization_id = (select private.current_organization_id())
  )
  with check (
    recipient_id = (select auth.uid())
    and organization_id = (select private.current_organization_id())
  );

revoke all on public.event_notifications from anon;
grant select, update on public.event_notifications to authenticated;

create or replace function public.update_scheduled_event(payload jsonb)
returns public.business_events
language plpgsql
set search_path = public, pg_temp
as $$
declare
  result public.business_events;
  target_event_id uuid := nullif(payload->>'event_id','')::uuid;
  start_time timestamptz := nullif(payload->>'starts_at','')::timestamptz;
  end_time timestamptz := nullif(payload->>'ends_at','')::timestamptz;
  attendees uuid[] := coalesce(
    array(select jsonb_array_elements_text(coalesce(payload->'attendee_ids','[]'::jsonb))::uuid),
    '{}'::uuid[]
  );
begin
  if target_event_id is null then raise exception 'Event is required.'; end if;
  if coalesce(trim(payload->>'title'),'') = '' then raise exception 'Event title is required.'; end if;
  if start_time is null then raise exception 'Start date and time are required.'; end if;
  if end_time is not null and end_time < start_time then raise exception 'End time cannot be before start time.'; end if;

  if exists (
    select 1 from unnest(attendees) attendee_id
    where not exists (
      select 1 from public.profiles p
      where p.id = attendee_id
        and p.organization_id = (select private.current_organization_id())
    )
  ) then raise exception 'One or more attendees are outside your organization.'; end if;

  update public.business_events set
    project_id = (payload->>'project_id')::uuid,
    type = upper(coalesce(nullif(payload->>'category',''),'other')),
    title = trim(payload->>'title'),
    description = nullif(trim(payload->>'description'),''),
    category = coalesce(nullif(payload->>'category',''),'other'),
    priority = coalesce(nullif(payload->>'priority',''),'normal'),
    starts_at = start_time,
    ends_at = end_time,
    all_day = coalesce((payload->>'all_day')::boolean,false),
    location = nullif(trim(payload->>'location'),''),
    owner_id = coalesce(nullif(payload->>'owner_id','')::uuid,(select auth.uid())),
    attendee_ids = attendees,
    reminder_minutes = array[coalesce(nullif(payload->>'reminder_minutes','')::integer,60)],
    updated_at = now()
  where id = target_event_id and starts_at is not null
  returning * into result;

  if result.id is null then raise exception 'Event was not found or you cannot update it.'; end if;
  return result;
end;
$$;

revoke all on function public.update_scheduled_event(jsonb) from public, anon;
grant execute on function public.update_scheduled_event(jsonb) to authenticated;

create or replace function private.dispatch_event_reminders()
returns integer
language plpgsql
security definer
set search_path = pg_catalog, public, private, pg_temp
as $$
declare
  inserted_count integer;
begin
  insert into public.event_notifications (
    organization_id, project_id, event_id, recipient_id, reminder_minutes,
    title, message, scheduled_for, delivered_at
  )
  select distinct
    event.organization_id,
    event.project_id,
    event.id,
    recipient.id,
    reminder.minutes,
    event.title,
    'Upcoming ' || replace(coalesce(event.category,'event'),'_',' ') ||
      ' at ' || to_char(event.starts_at at time zone 'Africa/Addis_Ababa', 'Mon DD, YYYY HH12:MI AM'),
    event.starts_at - make_interval(mins => reminder.minutes),
    now()
  from public.business_events event
  cross join lateral unnest(event.reminder_minutes) reminder(minutes)
  cross join lateral (
    select distinct person_id as id
    from unnest(array_remove(array_cat(event.attendee_ids, array[event.owner_id, event.created_by]), null)) person_id
  ) recipient
  join public.profiles profile
    on profile.id = recipient.id and profile.organization_id = event.organization_id
  where event.starts_at is not null
    and event.status in ('scheduled','in_progress')
    and event.starts_at >= now()
    and event.starts_at - make_interval(mins => reminder.minutes) <= now()
  on conflict (event_id, recipient_id, reminder_minutes) do nothing;

  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;

revoke all on function private.dispatch_event_reminders() from public, anon, authenticated;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'dispatch-event-reminders') then
    perform cron.unschedule('dispatch-event-reminders');
  end if;
  perform cron.schedule(
    'dispatch-event-reminders',
    '*/5 * * * *',
    'select private.dispatch_event_reminders();'
  );
end;
$$;
