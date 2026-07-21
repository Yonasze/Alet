
create or replace function public.is_valid_unit_status_transition(old_status public.unit_status, new_status public.unit_status)
returns boolean
language sql immutable
set search_path = public, pg_temp
as $$
  select case old_status
    when 'draft' then new_status in ('draft','available','cancelled')
    when 'available' then new_status in ('available','on_hold','cancelled')
    when 'on_hold' then new_status in ('on_hold','available','reserved','cancelled')
    when 'reserved' then new_status in ('reserved','on_hold','available','contracted','cancelled')
    when 'contracted' then new_status in ('contracted','available','under_payment','sold','cancelled')
    when 'under_payment' then new_status in ('under_payment','fully_paid','sold','cancelled')
    when 'fully_paid' then new_status in ('fully_paid','sold','handed_over')
    when 'sold' then new_status in ('sold','handed_over')
    when 'handed_over' then new_status='handed_over'
    when 'cancelled' then new_status in ('cancelled','draft')
    else false
  end
$$;

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

  update public.units u set status='on_hold' where u.id=target_unit.id;
  if reservation_status='reserved' then update public.units u set status='reserved' where u.id=target_unit.id; end if;
  update public.sales_leads l set stage=reservation_status,customer_id=v_customer_id where l.id=target_lead.id;
  update public.project_enquiries e set status='converted' where e.id=target_lead.enquiry_id;

  return jsonb_build_object('reservation_id',v_reservation_id,'reservation_number',v_reservation_number);
end
$$;

create or replace function public.sales_reservation_action(payload jsonb)
returns jsonb
language plpgsql security definer
set search_path = public, private, pg_temp
as $$
declare
  target public.sales_reservations%rowtype;
  requested_action text := payload->>'action';
  v_contract_id uuid;
  v_contract_number text;
begin
  if auth.uid() is null then raise exception 'Authentication required.'; end if;
  select * into target from public.sales_reservations r where r.id=(payload->>'reservation_id')::uuid for update;
  if target.id is null or not private.can_manage_sales(target.project_id) then raise exception 'Not authorized.'; end if;

  if requested_action='reserve' then
    if target.status <> 'on_hold' then raise exception 'Only held units can be reserved.'; end if;
    update public.sales_reservations r set status='reserved',hold_expires_at=null,
      reservation_expires_at=coalesce(nullif(payload->>'expires_at','')::timestamptz,now()+interval '14 days') where r.id=target.id;
    update public.units u set status='reserved' where u.id=target.unit_id;
    update public.sales_leads l set stage='reserved' where l.id=target.lead_id;
  elsif requested_action='contract' then
    if target.status not in ('on_hold','reserved') then raise exception 'This reservation cannot be contracted.'; end if;
    if target.status='on_hold' then update public.units u set status='reserved' where u.id=target.unit_id; end if;
    v_contract_number := 'ALT-' || to_char(now(),'YYYY') || '-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,7));
    insert into public.sales_contracts (
      organization_id,project_id,reservation_id,customer_id,unit_id,contract_number,status,total_price_etb,
      price_includes_vat,payment_plan,signed_at,approved_by
    ) values (
      target.organization_id,target.project_id,target.id,target.customer_id,target.unit_id,v_contract_number,'signed',
      target.reserved_price_etb,true,coalesce(payload->'payment_plan','[]'::jsonb),now(),auth.uid()
    ) on conflict (reservation_id) do update set status='signed',signed_at=coalesce(public.sales_contracts.signed_at,now())
    returning id into v_contract_id;
    update public.sales_reservations r set status='contracted',approved_by=auth.uid(),hold_expires_at=null,reservation_expires_at=null where r.id=target.id;
    update public.units u set status='contracted' where u.id=target.unit_id;
    update public.sales_leads l set stage='contracted' where l.id=target.lead_id;
    update public.sales_opportunities o set stage='contracted',probability_percent=95 where o.id=target.opportunity_id;
  elsif requested_action='sell' then
    if target.status <> 'contracted' then raise exception 'Only contracted units can be marked sold.'; end if;
    update public.sales_contracts c set status='active',sold_at=now() where c.reservation_id=target.id returning c.id into v_contract_id;
    update public.sales_reservations r set status='sold' where r.id=target.id;
    update public.units u set status='sold' where u.id=target.unit_id;
    update public.sales_leads l set stage='sold',status='won' where l.id=target.lead_id;
    update public.sales_opportunities o set stage='sold',probability_percent=100 where o.id=target.opportunity_id;
  elsif requested_action='handover' then
    if target.status <> 'sold' then raise exception 'Only sold units can be handed over.'; end if;
    update public.sales_contracts c set status='completed',handed_over_at=now() where c.reservation_id=target.id returning c.id into v_contract_id;
    update public.sales_reservations r set status='handed_over' where r.id=target.id;
    update public.units u set status='handed_over' where u.id=target.unit_id;
    update public.sales_leads l set stage='handed_over',status='won' where l.id=target.lead_id;
  elsif requested_action='cancel' then
    if target.status in ('sold','handed_over','cancelled','expired') then raise exception 'This reservation cannot be cancelled.'; end if;
    update public.sales_reservations r set status='cancelled',cancelled_at=now(),
      cancellation_reason=coalesce(nullif(btrim(payload->>'reason'),''),'Cancelled by sales') where r.id=target.id;
    update public.sales_contracts c set status='cancelled' where c.reservation_id=target.id;
    update public.units u set status='available' where u.id=target.unit_id;
    update public.sales_leads l set stage='qualified' where l.id=target.lead_id;
    update public.sales_opportunities o set stage='qualified',unit_id=null,probability_percent=25 where o.id=target.opportunity_id;
  else
    raise exception 'Invalid reservation action.';
  end if;
  return jsonb_build_object('reservation_id',target.id,'action',requested_action,'contract_id',v_contract_id);
end
$$;

revoke all on function public.create_sales_reservation(jsonb) from public, anon;
grant execute on function public.create_sales_reservation(jsonb) to authenticated;
revoke all on function public.sales_reservation_action(jsonb) from public, anon;
grant execute on function public.sales_reservation_action(jsonb) to authenticated;
