
revoke execute on function public.expire_sales_holds() from authenticated;
grant execute on function public.expire_sales_holds() to service_role;
revoke execute on function public.submit_project_enquiry(jsonb) from authenticated;
grant execute on function public.submit_project_enquiry(jsonb) to anon;

drop policy if exists sales_customers_manage on public.sales_customers;
create policy sales_customers_insert on public.sales_customers for insert to authenticated
with check (organization_id=private.current_organization_id() and private.has_project_role(array['admin','project_manager','sales'],null));
create policy sales_customers_update on public.sales_customers for update to authenticated
using (organization_id=private.current_organization_id() and private.has_project_role(array['admin','project_manager','sales'],null))
with check (organization_id=private.current_organization_id() and private.has_project_role(array['admin','project_manager','sales'],null));
create policy sales_customers_delete on public.sales_customers for delete to authenticated
using (organization_id=private.current_organization_id() and private.has_project_role(array['admin','project_manager','sales'],null));

drop policy if exists sales_leads_manage on public.sales_leads;
create policy sales_leads_insert on public.sales_leads for insert to authenticated with check (private.can_manage_sales(project_id));
create policy sales_leads_update on public.sales_leads for update to authenticated using (private.can_manage_sales(project_id)) with check (private.can_manage_sales(project_id));
create policy sales_leads_delete on public.sales_leads for delete to authenticated using (private.can_manage_sales(project_id));

drop policy if exists sales_activities_manage on public.sales_activities;
create policy sales_activities_insert on public.sales_activities for insert to authenticated with check (private.can_manage_sales(project_id));
create policy sales_activities_update on public.sales_activities for update to authenticated using (private.can_manage_sales(project_id)) with check (private.can_manage_sales(project_id));
create policy sales_activities_delete on public.sales_activities for delete to authenticated using (private.can_manage_sales(project_id));

drop policy if exists sales_opportunities_manage on public.sales_opportunities;
create policy sales_opportunities_insert on public.sales_opportunities for insert to authenticated with check (private.can_manage_sales(project_id));
create policy sales_opportunities_update on public.sales_opportunities for update to authenticated using (private.can_manage_sales(project_id)) with check (private.can_manage_sales(project_id));
create policy sales_opportunities_delete on public.sales_opportunities for delete to authenticated using (private.can_manage_sales(project_id));

drop policy if exists sales_reservations_manage on public.sales_reservations;
create policy sales_reservations_insert on public.sales_reservations for insert to authenticated with check (private.can_manage_sales(project_id));
create policy sales_reservations_update on public.sales_reservations for update to authenticated using (private.can_manage_sales(project_id)) with check (private.can_manage_sales(project_id));
create policy sales_reservations_delete on public.sales_reservations for delete to authenticated using (private.can_manage_sales(project_id));

drop policy if exists sales_contracts_manage on public.sales_contracts;
create policy sales_contracts_insert on public.sales_contracts for insert to authenticated with check (private.can_manage_sales(project_id));
create policy sales_contracts_update on public.sales_contracts for update to authenticated using (private.can_manage_sales(project_id)) with check (private.can_manage_sales(project_id));
create policy sales_contracts_delete on public.sales_contracts for delete to authenticated using (private.can_manage_sales(project_id));

drop policy if exists enquiries_manage on public.project_enquiries;
create policy enquiries_insert on public.project_enquiries for insert to authenticated with check (private.can_manage_sales(project_id));
create policy enquiries_update on public.project_enquiries for update to authenticated using (private.can_manage_sales(project_id)) with check (private.can_manage_sales(project_id));
create policy enquiries_delete on public.project_enquiries for delete to authenticated using (private.can_manage_sales(project_id));

create index if not exists project_enquiries_assigned_to_idx on public.project_enquiries(assigned_to);
create index if not exists project_enquiries_lead_id_idx on public.project_enquiries(lead_id);
create index if not exists project_enquiries_organization_id_idx on public.project_enquiries(organization_id);
create index if not exists project_enquiries_unit_type_id_idx on public.project_enquiries(unit_type_id);
create index if not exists sales_customers_assigned_to_idx on public.sales_customers(assigned_to);
create index if not exists sales_customers_created_by_idx on public.sales_customers(created_by);
create index if not exists sales_leads_created_by_idx on public.sales_leads(created_by);
create index if not exists sales_leads_customer_id_idx on public.sales_leads(customer_id);
create index if not exists sales_leads_organization_id_idx on public.sales_leads(organization_id);
create index if not exists sales_leads_unit_type_id_idx on public.sales_leads(unit_type_id);
create index if not exists sales_activities_created_by_idx on public.sales_activities(created_by);
create index if not exists sales_activities_customer_id_idx on public.sales_activities(customer_id);
create index if not exists sales_activities_organization_id_idx on public.sales_activities(organization_id);
create index if not exists sales_activities_project_id_idx on public.sales_activities(project_id);
create index if not exists sales_opportunities_assigned_to_idx on public.sales_opportunities(assigned_to);
create index if not exists sales_opportunities_created_by_idx on public.sales_opportunities(created_by);
create index if not exists sales_opportunities_customer_id_idx on public.sales_opportunities(customer_id);
create index if not exists sales_opportunities_organization_id_idx on public.sales_opportunities(organization_id);
create index if not exists sales_opportunities_unit_id_idx on public.sales_opportunities(unit_id);
create index if not exists sales_opportunities_unit_type_id_idx on public.sales_opportunities(unit_type_id);
create index if not exists sales_reservations_approved_by_idx on public.sales_reservations(approved_by);
create index if not exists sales_reservations_created_by_idx on public.sales_reservations(created_by);
create index if not exists sales_reservations_customer_id_idx on public.sales_reservations(customer_id);
create index if not exists sales_reservations_lead_id_idx on public.sales_reservations(lead_id);
create index if not exists sales_reservations_opportunity_id_idx on public.sales_reservations(opportunity_id);
create index if not exists sales_contracts_approved_by_idx on public.sales_contracts(approved_by);
create index if not exists sales_contracts_created_by_idx on public.sales_contracts(created_by);
create index if not exists sales_contracts_customer_id_idx on public.sales_contracts(customer_id);
create index if not exists sales_contracts_unit_id_idx on public.sales_contracts(unit_id);
