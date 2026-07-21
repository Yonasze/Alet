
create or replace function public.update_crm_lead(payload jsonb)
returns jsonb
language plpgsql security definer
set search_path = public, private, pg_temp
as $$
declare
  target public.sales_leads%rowtype;
  new_stage text;
  v_name text;
  v_phone text;
  v_email text;
  v_unit_type uuid;
  activity_summary text;
begin
  if auth.uid() is null then raise exception 'Authentication required.'; end if;
  select * into target from public.sales_leads l where l.id=(payload->>'lead_id')::uuid;
  if target.id is null or not private.can_manage_sales(target.project_id) then raise exception 'Not authorized.'; end if;

  new_stage := coalesce(nullif(payload->>'stage',''),target.stage);
  if new_stage not in ('new','contacted','qualified','viewing','unit_selected','on_hold','reserved','contracted','sold','handed_over','closed') then raise exception 'Invalid sales stage.'; end if;
  v_name := case when payload ? 'full_name' then btrim(payload->>'full_name') else target.full_name end;
  v_phone := case when payload ? 'phone' then nullif(btrim(payload->>'phone'),'') else target.phone end;
  v_email := case when payload ? 'email' then nullif(lower(btrim(payload->>'email')),'') else target.email end;
  if v_name is null or length(v_name)<2 then raise exception 'Lead name is required.'; end if;
  if v_phone is null and v_email is null then raise exception 'Phone or email is required.'; end if;
  if payload ? 'unit_type_id' then
    v_unit_type := nullif(payload->>'unit_type_id','')::uuid;
    if v_unit_type is not null and not exists(select 1 from public.unit_types ut where ut.id=v_unit_type and ut.project_id=target.project_id) then raise exception 'Invalid unit type.'; end if;
  else v_unit_type := target.unit_type_id;
  end if;

  update public.sales_leads l set
    full_name=v_name,phone=v_phone,email=v_email,unit_type_id=v_unit_type,
    preferred_contact_method=case when payload ? 'preferred_contact_method' then coalesce(nullif(payload->>'preferred_contact_method',''),'phone') else l.preferred_contact_method end,
    source=case when payload ? 'source' then coalesce(nullif(payload->>'source',''),'manual') else l.source end,
    budget_min_etb=case when payload ? 'budget_min_etb' then nullif(payload->>'budget_min_etb','')::numeric else l.budget_min_etb end,
    budget_max_etb=case when payload ? 'budget_max_etb' then nullif(payload->>'budget_max_etb','')::numeric else l.budget_max_etb end,
    message=case when payload ? 'message' then nullif(btrim(payload->>'message'),'') else l.message end,
    stage=new_stage,
    status=case when new_stage in ('sold','handed_over') then 'won' when new_stage='closed' and nullif(payload->>'lost_reason','') is not null then 'lost' else l.status end,
    notes=case when payload ? 'notes' then nullif(btrim(payload->>'notes'),'') else l.notes end,
    lost_reason=case when new_stage='closed' then nullif(btrim(payload->>'lost_reason'),'') else l.lost_reason end,
    next_follow_up_at=case when payload ? 'next_follow_up_at' then nullif(payload->>'next_follow_up_at','')::timestamptz else l.next_follow_up_at end,
    last_contacted_at=case when new_stage in ('contacted','qualified','viewing') then now() else l.last_contacted_at end,
    assigned_to=case when payload ? 'assigned_to' then coalesce(nullif(payload->>'assigned_to','')::uuid,l.assigned_to) else l.assigned_to end
  where l.id=target.id;

  activity_summary := nullif(btrim(coalesce(payload->>'activity_summary','')),'');
  if activity_summary is not null then
    insert into public.sales_activities (organization_id,project_id,lead_id,customer_id,activity_type,summary,due_at)
    values (target.organization_id,target.project_id,target.id,target.customer_id,coalesce(nullif(payload->>'activity_type',''),'note'),activity_summary,nullif(payload->>'next_follow_up_at','')::timestamptz);
  end if;

  update public.project_enquiries e set
    name=v_name,phone=v_phone,email=v_email,unit_type_id=v_unit_type,preferred_contact_method=(select preferred_contact_method from public.sales_leads where id=target.id),
    budget_min_etb=(select budget_min_etb from public.sales_leads where id=target.id),budget_max_etb=(select budget_max_etb from public.sales_leads where id=target.id),
    message=(select message from public.sales_leads where id=target.id),
    status=case when new_stage='contacted' then 'contacted' when new_stage in ('qualified','viewing','unit_selected') then 'qualified'
      when new_stage in ('on_hold','reserved','contracted','sold','handed_over') then 'converted' when new_stage='closed' then 'closed' else e.status end
  where e.id=target.enquiry_id;

  return jsonb_build_object('lead_id',target.id);
end
$$;

create or replace function public.update_crm_customer(payload jsonb)
returns jsonb
language plpgsql security definer
set search_path = public, private, pg_temp
as $$
declare target public.sales_customers%rowtype; v_name text; v_phone text; v_email text;
begin
  if auth.uid() is null then raise exception 'Authentication required.'; end if;
  select * into target from public.sales_customers c where c.id=(payload->>'customer_id')::uuid;
  if target.id is null or not exists(select 1 from public.sales_leads l where l.customer_id=target.id and private.can_manage_sales(l.project_id)) then raise exception 'Not authorized.'; end if;
  v_name:=btrim(coalesce(payload->>'full_name',target.full_name));
  v_phone:=case when payload ? 'phone' then nullif(btrim(payload->>'phone'),'') else target.phone end;
  v_email:=case when payload ? 'email' then nullif(lower(btrim(payload->>'email')),'') else target.email end;
  if length(v_name)<2 then raise exception 'Customer name is required.'; end if;
  if v_phone is null and v_email is null then raise exception 'Phone or email is required.'; end if;
  update public.sales_customers c set
    full_name=v_name,phone=v_phone,email=v_email,
    address=case when payload ? 'address' then nullif(btrim(payload->>'address'),'') else c.address end,
    government_id_type=case when payload ? 'government_id_type' then nullif(btrim(payload->>'government_id_type'),'') else c.government_id_type end,
    government_id_number=case when payload ? 'government_id_number' then nullif(btrim(payload->>'government_id_number'),'') else c.government_id_number end,
    consent_given=case when payload ? 'consent_given' then coalesce((payload->>'consent_given')::boolean,false) else c.consent_given end
  where c.id=target.id;
  update public.sales_leads l set full_name=v_name,phone=v_phone,email=v_email where l.customer_id=target.id;
  return jsonb_build_object('customer_id',target.id);
end
$$;

create or replace function public.update_sales_reservation(payload jsonb)
returns jsonb
language plpgsql security definer
set search_path = public, private, pg_temp
as $$
declare target public.sales_reservations%rowtype; v_price numeric;
begin
  if auth.uid() is null then raise exception 'Authentication required.'; end if;
  select * into target from public.sales_reservations r where r.id=(payload->>'reservation_id')::uuid for update;
  if target.id is null or not private.can_manage_sales(target.project_id) then raise exception 'Not authorized.'; end if;
  if target.status not in ('on_hold','reserved') then raise exception 'Only active holds and reservations can be edited.'; end if;
  v_price:=case when payload ? 'reserved_price_etb' then nullif(payload->>'reserved_price_etb','')::numeric else target.reserved_price_etb end;
  if v_price is null or v_price<=0 then raise exception 'A valid VAT-inclusive selling price is required.'; end if;
  update public.sales_reservations r set
    reserved_price_etb=v_price,
    notes=case when payload ? 'notes' then nullif(btrim(payload->>'notes'),'') else r.notes end,
    hold_expires_at=case when r.status='on_hold' and payload ? 'expires_at' then nullif(payload->>'expires_at','')::timestamptz else r.hold_expires_at end,
    reservation_expires_at=case when r.status='reserved' and payload ? 'expires_at' then nullif(payload->>'expires_at','')::timestamptz else r.reservation_expires_at end
  where r.id=target.id;
  update public.sales_opportunities o set quoted_price_etb=v_price,expected_value_etb=v_price where o.id=target.opportunity_id;
  return jsonb_build_object('reservation_id',target.id);
end
$$;

revoke all on function public.update_crm_customer(jsonb) from public,anon;
grant execute on function public.update_crm_customer(jsonb) to authenticated;
revoke all on function public.update_sales_reservation(jsonb) from public,anon;
grant execute on function public.update_sales_reservation(jsonb) to authenticated;
revoke all on function public.update_crm_lead(jsonb) from public,anon;
grant execute on function public.update_crm_lead(jsonb) to authenticated;
