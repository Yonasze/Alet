-- user_roles is the sole authorization source. The legacy profiles.role value
-- is retained only for compatibility with older profile displays and must not
-- grant ERP permissions.

create or replace function private.has_project_role(
  role_codes text[],
  target_project_id uuid default null
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.user_id = (select auth.uid())
      and r.code = any(role_codes)
      and (ur.project_id is null or ur.project_id = target_project_id)
  )
$$;

revoke all on function private.has_project_role(text[], uuid) from public, anon;
grant execute on function private.has_project_role(text[], uuid) to authenticated, service_role;
