
create or replace function public.create_sales_reservation(payload jsonb)
returns jsonb
language plpgsql security definer
set search_path = public, private, pg_temp
as $$
declare
  target_lead public.sales_leads%rowtype;
  target_unit public.units%rowtype;
  v_customer_id uuid;
  v_opportunity_id uuid;
  v_reservation_id uuid;
  reservation_status text := coalesce(nullif(payload->>'status',''),'on_hold');
  reservation_price numeric := nullif(payload->>'reserved_price_etb','')::numeric;
  v_reservation_number text;
begin
  if auth.uid() is null then raise exception 'Authentication required.'; end if;
  select * into target_lead from public.sales_leads l where l.id=(payload->>'lead_id')::uuid for update;
  if target_lead.id is null or not private.can_manage_sales(target_lead.project_id) then raise exception 'Not authorized.'; end if;
  select * into target_unit from public.units u where u.id=(payload->>'unit_id')::uuid and u.project_id=target_lead.project_id for update;
  if target_unit.id is null then raise exception 'Unit not found.'; end if;
  if target_unit.status::text <> 'available' then raise exception 'This unit is no longer available.'; end if;
  if reservation_status not in ('on_hold','reserved') then raise exception 'Invalid reservation status.'; end if;
  if reservation_price is null or reservation_price <= 0 then raise exception 'A valid agreed selling price is required.'; end if;

  v_customer_id := private.ensure_customer_for_lead(target_lead.id);
  select o.id into v_opportunity_id from public.sales_opportunities o where o.lead_id=target_lead.id;
  if v_opportunity_id is null then
    insert into public.sales_opportunities (
      organization_id,project_id,lead_id,customer_id,unit_type_id,unit_id,stage,
      expected_value_etb,quoted_price_etb,probability_percent,assigned_to
    ) values (
      target_lead.organization_id,target_lead.project_id,target_lead.id,v_customer_id,target_unit.unit_type_id,target_unit.id,
      reservation_status,reservation_price,reservation_price,case when reservation_status='reserved' then 75 else 55 end,target_lead.assigned_to
    ) returning id into v_opportunity_id;
  else
    update public.sales_opportunities o set unit_id=target_unit.id,quoted_price_etb=reservation_price,stage=reservation_status,
      probability_percent=case when reservation_status='reserved' then 75 else 55 end where o.id=v_opportunity_id;
  end if;

  v_reservation_number := 'RES-' || to_char(now(),'YYYYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,6));
  insert into public.sales_reservations (
    organization_id,project_id,opportunity_id,lead_id,customer_id,unit_id,reservation_number,status,
    reserved_price_etb,price_includes_vat,hold_expires_at,reservation_expires_at,notes
  ) values (
    target_lead.organization_id,target_lead.project_id,v_opportunity_id,target_lead.id,v_customer_id,target_unit.id,v_reservation_number,
    reservation_status,reservation_price,true,
    case when reservation_status='on_hold' then coalesce(nullif(payload->>'expires_at','')::timestamptz,now()+interval '48 hours') end,
    case when reservation_status='reserved' then coalesce(nullif(payload->>'expires_at','')::timestamptz,now()+interval '14 days') end,
    nullif(btrim(payload->>'notes'),'')
  ) returning id into v_reservation_id;

  update public.units u set status=reservation_status::public.unit_status where u.id=target_unit.id;
  update public.sales_leads l set stage=reservation_status,customer_id=v_customer_id where l.id=target_lead.id;
  update public.project_enquiries e set status='converted' where e.id=target_lead.enquiry_id;

  return jsonb_build_object('reservation_id',v_reservation_id,'reservation_number',v_reservation_number);
end
$$;
revoke all on function public.create_sales_reservation(jsonb) from public, anon;
grant execute on function public.create_sales_reservation(jsonb) to authenticated;
