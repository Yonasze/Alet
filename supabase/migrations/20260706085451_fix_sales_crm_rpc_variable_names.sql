
create or replace function public.submit_project_enquiry(payload jsonb)
returns jsonb
language plpgsql security definer
set search_path = public, private, pg_temp
as $$
declare
  target_project public.projects%rowtype;
  target_unit_type_id uuid;
  v_enquiry_id uuid;
  v_lead_id uuid;
  contact_name text := btrim(coalesce(payload->>'name',''));
  contact_phone text := nullif(btrim(coalesce(payload->>'phone','')), '');
  contact_email text := nullif(lower(btrim(coalesce(payload->>'email',''))), '');
  contact_method text := coalesce(nullif(payload->>'preferred_contact_method',''), 'phone');
begin
  if nullif(btrim(coalesce(payload->>'website','')), '') is not null then return jsonb_build_object('accepted', true); end if;
  if length(contact_name) < 2 or length(contact_name) > 120 then raise exception 'Please enter your full name.'; end if;
  if contact_phone is null and contact_email is null then raise exception 'Enter a phone number or email address.'; end if;
  if contact_phone is not null and length(contact_phone) > 40 then raise exception 'Phone number is too long.'; end if;
  if contact_email is not null and length(contact_email) > 200 then raise exception 'Email address is too long.'; end if;
  if contact_method not in ('phone','email','whatsapp') then contact_method := 'phone'; end if;

  select p.* into target_project
  from public.projects p join public.project_publications pp on pp.project_id=p.id and pp.status='published'
  where p.slug=payload->>'project_slug' limit 1;
  if target_project.id is null then raise exception 'This project is not accepting enquiries.'; end if;

  if nullif(payload->>'unit_type_code','') is not null then
    select ut.id into target_unit_type_id from public.unit_types ut
    where ut.project_id=target_project.id and ut.code=payload->>'unit_type_code' limit 1;
  end if;

  insert into public.project_enquiries (
    organization_id,project_id,unit_type_id,name,email,phone,message,source,status,consent_given,
    preferred_contact_method,budget_min_etb,budget_max_etb
  ) values (
    target_project.organization_id,target_project.id,target_unit_type_id,contact_name,contact_email,contact_phone,
    left(nullif(btrim(coalesce(payload->>'message','')),''),2000),'website','new',
    coalesce((payload->>'consent_given')::boolean,false),contact_method,
    nullif(payload->>'budget_min_etb','')::numeric,nullif(payload->>'budget_max_etb','')::numeric
  ) returning id into v_enquiry_id;

  insert into public.sales_leads (
    organization_id,project_id,enquiry_id,unit_type_id,full_name,phone,email,preferred_contact_method,
    source,stage,budget_min_etb,budget_max_etb,message
  ) values (
    target_project.organization_id,target_project.id,v_enquiry_id,target_unit_type_id,contact_name,contact_phone,
    contact_email,contact_method,'website','new',nullif(payload->>'budget_min_etb','')::numeric,
    nullif(payload->>'budget_max_etb','')::numeric,left(nullif(btrim(coalesce(payload->>'message','')),''),2000)
  ) returning id into v_lead_id;

  update public.project_enquiries e set lead_id=v_lead_id where e.id=v_enquiry_id;
  return jsonb_build_object('accepted',true,'enquiry_id',v_enquiry_id);
end
$$;

create or replace function private.ensure_customer_for_lead(target_lead_id uuid)
returns uuid
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  target public.sales_leads%rowtype;
  v_customer_id uuid;
begin
  select * into target from public.sales_leads where id=target_lead_id for update;
  if target.customer_id is not null then return target.customer_id; end if;
  select c.id into v_customer_id from public.sales_customers c
  where c.organization_id=target.organization_id
    and ((target.phone is not null and lower(c.phone)=lower(target.phone)) or
         (target.email is not null and lower(c.email)=lower(target.email)))
  limit 1;
  if v_customer_id is null then
    insert into public.sales_customers (organization_id,full_name,phone,email,consent_given,assigned_to)
    values (target.organization_id,target.full_name,target.phone,target.email,
      coalesce((select e.consent_given from public.project_enquiries e where e.id=target.enquiry_id),false),target.assigned_to)
    returning id into v_customer_id;
  end if;
  update public.sales_leads l set customer_id=v_customer_id where l.id=target.id;
  return v_customer_id;
end
$$;

revoke all on function public.submit_project_enquiry(jsonb) from public;
grant execute on function public.submit_project_enquiry(jsonb) to anon, authenticated;
