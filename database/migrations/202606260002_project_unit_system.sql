-- Alet ERP Sprint 2: project and unit lifecycle guards.

create or replace function public.is_valid_unit_status_transition(
  old_status public.unit_status,
  new_status public.unit_status
)
returns boolean
language sql
immutable
as $$
  select case old_status
    when 'draft' then new_status in ('draft', 'available', 'cancelled')
    when 'available' then new_status in ('available', 'reserved', 'contracted', 'cancelled')
    when 'reserved' then new_status in ('reserved', 'available', 'contracted', 'cancelled')
    when 'contracted' then new_status in ('contracted', 'under_payment', 'cancelled')
    when 'under_payment' then new_status in ('under_payment', 'fully_paid', 'cancelled')
    when 'fully_paid' then new_status in ('fully_paid', 'handed_over')
    when 'handed_over' then new_status = 'handed_over'
    when 'cancelled' then new_status in ('cancelled', 'draft')
    else false
  end
$$;

create or replace function public.enforce_unit_status_transition()
returns trigger
language plpgsql
as $$
begin
  if not public.is_valid_unit_status_transition(old.status, new.status) then
    raise exception 'Invalid unit status transition from % to %', old.status, new.status;
  end if;

  return new;
end;
$$;

create trigger units_enforce_status_transition
before update of status on public.units
for each row execute function public.enforce_unit_status_transition();

create policy "admins can manage buildings"
on public.buildings for all
using (public.current_user_is_admin() and organization_id = public.current_user_organization_id())
with check (public.current_user_is_admin() and organization_id = public.current_user_organization_id());

create policy "admins can manage floors"
on public.floors for all
using (public.current_user_is_admin() and organization_id = public.current_user_organization_id())
with check (public.current_user_is_admin() and organization_id = public.current_user_organization_id());

create policy "admins and sales can manage units"
on public.units for all
using (
  public.current_user_is_project_member(project_id)
  and exists (
    select 1
    from public.user_projects
    where user_id = auth.uid()
      and project_id = units.project_id
      and role in ('admin', 'sales')
  )
)
with check (
  public.current_user_is_project_member(project_id)
  and exists (
    select 1
    from public.user_projects
    where user_id = auth.uid()
      and project_id = units.project_id
      and role in ('admin', 'sales')
  )
);

create unique index idx_units_single_active_reservation
on public.units(project_id, unit_number)
where status in ('reserved', 'contracted', 'under_payment', 'fully_paid', 'handed_over');
