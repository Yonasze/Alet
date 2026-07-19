-- Project visibility alone must not grant access to the Documents module.
-- Require an explicit document-capable role for both organization-wide and
-- project-scoped documents. HR is intentionally excluded.

create or replace function private.can_view_documents(target_project_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select private.has_project_role(
    array[
      'admin', 'project_manager', 'procurement', 'finance', 'engineer',
      'inventory', 'sales', 'marketing', 'viewer'
    ],
    target_project_id
  )
  and (
    target_project_id is null
    or private.can_view_project(target_project_id)
  )
$$;

revoke all on function private.can_view_documents(uuid) from public, anon;
grant execute on function private.can_view_documents(uuid) to authenticated, service_role;
