
drop policy if exists "users can view same-organization profiles" on public.profiles;
create policy profiles_organization_read on public.profiles for select to authenticated
using(organization_id=private.current_organization_id());
grant select on public.profiles to authenticated;
revoke all on public.profiles from anon;
