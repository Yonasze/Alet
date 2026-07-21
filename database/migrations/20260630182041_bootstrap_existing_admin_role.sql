
insert into public.profiles (id, organization_id, full_name, role)
select
  u.id,
  o.id,
  coalesce(nullif(u.raw_user_meta_data->>'full_name', ''), split_part(coalesce(u.email, 'Alet Admin'), '@', 1)),
  'admin'::public.user_role
from auth.users u
cross join lateral (
  select id from public.organizations order by created_at limit 1
) o
where not exists (select 1 from public.profiles p where p.id = u.id);

insert into public.user_roles (organization_id, user_id, role_id, project_id, assigned_by)
select p.organization_id, p.id, r.id, null, p.id
from public.profiles p
join public.roles r on r.code = 'admin'
where not exists (
  select 1 from public.user_roles ur
  where ur.user_id = p.id and ur.role_id = r.id and ur.project_id is null
);
