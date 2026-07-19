-- Align ERP route visibility and Events mutations with least-privilege role access.

create or replace function private.can_manage_events(target_project_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select private.has_project_role(
    array[
      'admin', 'project_manager', 'marketing', 'sales', 'finance',
      'engineer', 'procurement', 'inventory', 'hr'
    ],
    target_project_id
  )
$$;

revoke all on function private.can_manage_events(uuid) from public, anon;
grant execute on function private.can_manage_events(uuid) to authenticated, service_role;

drop policy if exists events_workspace_insert on public.business_events;
create policy events_workspace_insert on public.business_events
for insert to authenticated
with check (
  organization_id = (select private.current_organization_id())
  and private.can_manage_events(project_id)
  and created_by = (select auth.uid())
);

drop policy if exists events_workspace_update on public.business_events;
create policy events_workspace_update on public.business_events
for update to authenticated
using (
  organization_id = (select private.current_organization_id())
  and private.can_manage_events(project_id)
  and (
    created_by = (select auth.uid())
    or owner_id = (select auth.uid())
    or private.has_project_role(array['admin', 'project_manager'], project_id)
  )
)
with check (
  organization_id = (select private.current_organization_id())
  and private.can_manage_events(project_id)
);

drop policy if exists events_workspace_delete on public.business_events;
create policy events_workspace_delete on public.business_events
for delete to authenticated
using (
  organization_id = (select private.current_organization_id())
  and private.can_manage_events(project_id)
  and (
    created_by = (select auth.uid())
    or private.has_project_role(array['admin', 'project_manager'], project_id)
  )
);
