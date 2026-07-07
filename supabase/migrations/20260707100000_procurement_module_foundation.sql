create sequence if not exists public.procurement_supplier_seq;
create sequence if not exists public.procurement_requisition_seq;
create sequence if not exists public.procurement_quotation_seq;
create sequence if not exists public.procurement_po_seq;
create sequence if not exists public.procurement_delivery_seq;

create table if not exists public.procurement_suppliers(
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete cascade,
 supplier_code text not null,
 name text not null,
 category text not null default 'materials' check(category in('materials','equipment','services','subcontractor','mixed')),
 tax_id text,
 contact_person text,
 phone text,
 email text,
 address text,
 payment_terms text,
 rating numeric(3,2) check(rating is null or (rating>=0 and rating<=5)),
 status text not null default 'pending' check(status in('pending','approved','suspended','inactive')),
 created_by uuid references auth.users(id) on delete set null,
 approved_by uuid references auth.users(id) on delete set null,
 approved_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(organization_id,supplier_code)
);

create table if not exists public.procurement_requisitions(
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete cascade,
 project_id uuid not null references public.projects(id) on delete cascade,
 work_package_id uuid references public.construction_work_packages(id) on delete set null,
 request_number text not null,
 title text not null,
 purpose text not null,
 request_type text not null default 'materials' check(request_type in('materials','equipment','services','subcontractor')),
 priority text not null default 'normal' check(priority in('low','normal','high','critical')),
 required_date date,
 delivery_location text,
 estimated_amount_etb numeric(16,2) not null default 0 check(estimated_amount_etb>=0),
 status text not null default 'draft' check(status in('draft','submitted','approved','rejected','sourcing','ordered','closed','cancelled')),
 requested_by uuid references auth.users(id) on delete set null,
 submitted_at timestamptz,
 approved_by uuid references auth.users(id) on delete set null,
 approved_at timestamptz,
 rejection_reason text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(organization_id,request_number)
);

create table if not exists public.procurement_requisition_items(
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete cascade,
 project_id uuid not null references public.projects(id) on delete cascade,
 requisition_id uuid not null references public.procurement_requisitions(id) on delete cascade,
 description text not null,
 specification text,
 quantity numeric(16,3) not null check(quantity>0),
 unit text not null,
 estimated_unit_price_etb numeric(16,2) not null default 0 check(estimated_unit_price_etb>=0),
 estimated_total_etb numeric(16,2) not null default 0 check(estimated_total_etb>=0),
 created_at timestamptz not null default now()
);

create table if not exists public.procurement_quotations(
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete cascade,
 project_id uuid not null references public.projects(id) on delete cascade,
 requisition_id uuid not null references public.procurement_requisitions(id) on delete cascade,
 supplier_id uuid not null references public.procurement_suppliers(id) on delete restrict,
 quotation_number text not null,
 supplier_reference text,
 quotation_date date not null default current_date,
 valid_until date,
 currency text not null default 'ETB' check(currency='ETB'),
 subtotal_etb numeric(16,2) not null default 0 check(subtotal_etb>=0),
 vat_rate numeric(5,2) not null default 15 check(vat_rate>=0),
 vat_amount_etb numeric(16,2) not null default 0 check(vat_amount_etb>=0),
 total_etb numeric(16,2) not null default 0 check(total_etb>=0),
 delivery_days integer check(delivery_days is null or delivery_days>=0),
 payment_terms text,
 technical_notes text,
 commercial_notes text,
 status text not null default 'draft' check(status in('draft','submitted','evaluated','selected','rejected','expired','cancelled')),
 created_by uuid references auth.users(id) on delete set null,
 submitted_at timestamptz,
 evaluated_by uuid references auth.users(id) on delete set null,
 evaluated_at timestamptz,
 selected_by uuid references auth.users(id) on delete set null,
 selected_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(organization_id,quotation_number)
);

create table if not exists public.procurement_quotation_items(
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete cascade,
 project_id uuid not null references public.projects(id) on delete cascade,
 quotation_id uuid not null references public.procurement_quotations(id) on delete cascade,
 requisition_item_id uuid not null references public.procurement_requisition_items(id) on delete restrict,
 description text not null,
 quantity numeric(16,3) not null check(quantity>0),
 unit text not null,
 unit_price_etb numeric(16,2) not null check(unit_price_etb>=0),
 total_etb numeric(16,2) not null check(total_etb>=0),
 created_at timestamptz not null default now(),
 unique(quotation_id,requisition_item_id)
);

create table if not exists public.procurement_purchase_orders(
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete cascade,
 project_id uuid not null references public.projects(id) on delete cascade,
 requisition_id uuid not null references public.procurement_requisitions(id) on delete restrict,
 quotation_id uuid not null references public.procurement_quotations(id) on delete restrict,
 supplier_id uuid not null references public.procurement_suppliers(id) on delete restrict,
 po_number text not null,
 order_date date not null default current_date,
 expected_delivery_date date,
 delivery_location text,
 subtotal_etb numeric(16,2) not null,
 vat_rate numeric(5,2) not null default 15,
 vat_amount_etb numeric(16,2) not null,
 total_etb numeric(16,2) not null check(total_etb>0),
 terms text,
 status text not null default 'draft' check(status in('draft','approved','issued','partially_delivered','delivered','closed','cancelled')),
 created_by uuid references auth.users(id) on delete set null,
 approved_by uuid references auth.users(id) on delete set null,
 approved_at timestamptz,
 issued_by uuid references auth.users(id) on delete set null,
 issued_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(organization_id,po_number),
 unique(quotation_id)
);

create table if not exists public.procurement_purchase_order_items(
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete cascade,
 project_id uuid not null references public.projects(id) on delete cascade,
 purchase_order_id uuid not null references public.procurement_purchase_orders(id) on delete cascade,
 requisition_item_id uuid not null references public.procurement_requisition_items(id) on delete restrict,
 description text not null,
 quantity numeric(16,3) not null check(quantity>0),
 unit text not null,
 unit_price_etb numeric(16,2) not null check(unit_price_etb>=0),
 total_etb numeric(16,2) not null check(total_etb>=0),
 delivered_quantity numeric(16,3) not null default 0 check(delivered_quantity>=0),
 created_at timestamptz not null default now(),
 unique(purchase_order_id,requisition_item_id)
);

create table if not exists public.procurement_deliveries(
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete cascade,
 project_id uuid not null references public.projects(id) on delete cascade,
 purchase_order_id uuid not null references public.procurement_purchase_orders(id) on delete restrict,
 supplier_id uuid not null references public.procurement_suppliers(id) on delete restrict,
 delivery_number text not null,
 delivery_date date not null default current_date,
 supplier_delivery_reference text,
 status text not null default 'received' check(status in('received','accepted','partially_accepted','rejected','cancelled')),
 inspection_status text not null default 'pending' check(inspection_status in('pending','accepted','partially_accepted','rejected')),
 received_by uuid references auth.users(id) on delete set null,
 inspected_by uuid references auth.users(id) on delete set null,
 inspected_at timestamptz,
 notes text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(organization_id,delivery_number)
);

create table if not exists public.procurement_delivery_items(
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete cascade,
 project_id uuid not null references public.projects(id) on delete cascade,
 delivery_id uuid not null references public.procurement_deliveries(id) on delete cascade,
 purchase_order_item_id uuid not null references public.procurement_purchase_order_items(id) on delete restrict,
 quantity_received numeric(16,3) not null check(quantity_received>0),
 quantity_accepted numeric(16,3) not null default 0 check(quantity_accepted>=0),
 quantity_rejected numeric(16,3) not null default 0 check(quantity_rejected>=0),
 notes text,
 created_at timestamptz not null default now(),
 unique(delivery_id,purchase_order_item_id),
 check(quantity_accepted+quantity_rejected<=quantity_received)
);

create table if not exists public.procurement_invoices(
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete cascade,
 project_id uuid not null references public.projects(id) on delete cascade,
 purchase_order_id uuid not null references public.procurement_purchase_orders(id) on delete restrict,
 supplier_id uuid not null references public.procurement_suppliers(id) on delete restrict,
 invoice_number text not null,
 supplier_invoice_number text not null,
 invoice_date date not null default current_date,
 due_date date,
 subtotal_etb numeric(16,2) not null check(subtotal_etb>=0),
 vat_amount_etb numeric(16,2) not null default 0 check(vat_amount_etb>=0),
 total_etb numeric(16,2) not null check(total_etb>0),
 matched_amount_etb numeric(16,2) not null default 0 check(matched_amount_etb>=0),
 status text not null default 'registered' check(status in('registered','matched','approved','payment_requested','paid','rejected','cancelled')),
 finance_disbursement_id uuid references public.finance_disbursements(id) on delete set null,
 registered_by uuid references auth.users(id) on delete set null,
 approved_by uuid references auth.users(id) on delete set null,
 approved_at timestamptz,
 rejection_reason text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(organization_id,invoice_number),
 unique(supplier_id,supplier_invoice_number)
);

create table if not exists public.procurement_approvals(
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete cascade,
 project_id uuid references public.projects(id) on delete cascade,
 entity_type text not null check(entity_type in('supplier','requisition','quotation','purchase_order','delivery','invoice')),
 entity_id uuid not null,
 action text not null,
 from_status text,
 to_status text,
 comments text,
 actor_user_id uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now()
);

create index if not exists procurement_suppliers_org_status_idx on public.procurement_suppliers(organization_id,status);
create index if not exists procurement_requisitions_project_status_idx on public.procurement_requisitions(project_id,status);
create index if not exists procurement_requisitions_work_package_idx on public.procurement_requisitions(work_package_id);
create index if not exists procurement_requisition_items_req_idx on public.procurement_requisition_items(requisition_id);
create index if not exists procurement_quotations_req_status_idx on public.procurement_quotations(requisition_id,status);
create index if not exists procurement_quotations_supplier_idx on public.procurement_quotations(supplier_id);
create index if not exists procurement_quotation_items_quote_idx on public.procurement_quotation_items(quotation_id);
create index if not exists procurement_po_project_status_idx on public.procurement_purchase_orders(project_id,status);
create index if not exists procurement_po_supplier_idx on public.procurement_purchase_orders(supplier_id);
create index if not exists procurement_po_items_po_idx on public.procurement_purchase_order_items(purchase_order_id);
create index if not exists procurement_deliveries_po_idx on public.procurement_deliveries(purchase_order_id);
create index if not exists procurement_deliveries_project_status_idx on public.procurement_deliveries(project_id,status);
create index if not exists procurement_delivery_items_delivery_idx on public.procurement_delivery_items(delivery_id);
create index if not exists procurement_invoices_project_status_idx on public.procurement_invoices(project_id,status);
create index if not exists procurement_invoices_po_idx on public.procurement_invoices(purchase_order_id);
create index if not exists procurement_invoices_disbursement_idx on public.procurement_invoices(finance_disbursement_id);
create index if not exists procurement_approvals_entity_idx on public.procurement_approvals(entity_type,entity_id,created_at desc);
create index if not exists procurement_approvals_project_idx on public.procurement_approvals(project_id,created_at desc);

create or replace function private.can_view_procurement(target_project_id uuid)
returns boolean language sql stable security definer set search_path=public,pg_temp as $function$
 select exists(select 1 from public.projects p where p.id=target_project_id and p.organization_id=private.current_organization_id()
 and private.has_project_role(array['admin','project_manager','procurement','finance','engineer','inventory'],target_project_id))
$function$;
create or replace function private.can_request_procurement(target_project_id uuid)
returns boolean language sql stable security definer set search_path=public,pg_temp as $function$
 select exists(select 1 from public.projects p where p.id=target_project_id and p.organization_id=private.current_organization_id()
 and private.has_project_role(array['admin','project_manager','procurement','engineer','inventory'],target_project_id))
$function$;
create or replace function private.can_manage_procurement(target_project_id uuid)
returns boolean language sql stable security definer set search_path=public,pg_temp as $function$
 select exists(select 1 from public.projects p where p.id=target_project_id and p.organization_id=private.current_organization_id()
 and private.has_project_role(array['admin','procurement'],target_project_id))
$function$;
create or replace function private.can_approve_procurement(target_project_id uuid)
returns boolean language sql stable security definer set search_path=public,pg_temp as $function$
 select exists(select 1 from public.projects p where p.id=target_project_id and p.organization_id=private.current_organization_id()
 and private.has_project_role(array['admin','project_manager'],target_project_id))
$function$;
create or replace function private.can_inspect_procurement(target_project_id uuid)
returns boolean language sql stable security definer set search_path=public,pg_temp as $function$
 select exists(select 1 from public.projects p where p.id=target_project_id and p.organization_id=private.current_organization_id()
 and private.has_project_role(array['admin','project_manager','engineer','inventory'],target_project_id))
$function$;

create or replace function private.procurement_touch_updated_at()
returns trigger language plpgsql as $function$ begin new.updated_at=now();return new;end $function$;

do $block$
declare t text;
begin
 foreach t in array array['procurement_suppliers','procurement_requisitions','procurement_quotations','procurement_purchase_orders','procurement_deliveries','procurement_invoices'] loop
  execute format('drop trigger if exists %I_touch on public.%I',t,t);
  execute format('create trigger %I_touch before update on public.%I for each row execute function private.procurement_touch_updated_at()',t,t);
  execute format('drop trigger if exists %I_audit on public.%I',t,t);
  execute format('create trigger %I_audit after insert or update or delete on public.%I for each row execute function private.write_project_audit()',t,t);
 end loop;
end $block$;

alter table public.procurement_suppliers enable row level security;
alter table public.procurement_requisitions enable row level security;
alter table public.procurement_requisition_items enable row level security;
alter table public.procurement_quotations enable row level security;
alter table public.procurement_quotation_items enable row level security;
alter table public.procurement_purchase_orders enable row level security;
alter table public.procurement_purchase_order_items enable row level security;
alter table public.procurement_deliveries enable row level security;
alter table public.procurement_delivery_items enable row level security;
alter table public.procurement_invoices enable row level security;
alter table public.procurement_approvals enable row level security;

do $block$
declare t text;
begin
 foreach t in array array['procurement_requisitions','procurement_requisition_items','procurement_quotations','procurement_quotation_items','procurement_purchase_orders','procurement_purchase_order_items','procurement_deliveries','procurement_delivery_items','procurement_invoices','procurement_approvals'] loop
  execute format('drop policy if exists %I_read on public.%I',t,t);
  execute format('create policy %I_read on public.%I for select to authenticated using(private.can_view_procurement(project_id))',t,t);
 end loop;
end $block$;
drop policy if exists procurement_suppliers_read on public.procurement_suppliers;
create policy procurement_suppliers_read on public.procurement_suppliers for select to authenticated
using(organization_id=private.current_organization_id() and private.has_project_role(array['admin','project_manager','procurement','finance','engineer','inventory'],null));
drop policy if exists procurement_suppliers_manage on public.procurement_suppliers;
create policy procurement_suppliers_manage on public.procurement_suppliers for all to authenticated
using(organization_id=private.current_organization_id() and private.has_project_role(array['admin','procurement'],null))
with check(organization_id=private.current_organization_id() and private.has_project_role(array['admin','procurement'],null));

grant select on public.procurement_suppliers,public.procurement_requisitions,public.procurement_requisition_items,
 public.procurement_quotations,public.procurement_quotation_items,public.procurement_purchase_orders,
 public.procurement_purchase_order_items,public.procurement_deliveries,public.procurement_delivery_items,
 public.procurement_invoices,public.procurement_approvals to authenticated;
grant insert,update on public.procurement_suppliers to authenticated;
revoke all on public.procurement_suppliers,public.procurement_requisitions,public.procurement_requisition_items,
 public.procurement_quotations,public.procurement_quotation_items,public.procurement_purchase_orders,
 public.procurement_purchase_order_items,public.procurement_deliveries,public.procurement_delivery_items,
 public.procurement_invoices,public.procurement_approvals from anon;

create or replace function private.procurement_approval(target_org uuid,target_project uuid,target_type text,target_id uuid,target_action text,old_status text,new_status text,target_comments text default null)
returns void language sql security definer set search_path=public,pg_temp as $function$
 insert into public.procurement_approvals(organization_id,project_id,entity_type,entity_id,action,from_status,to_status,comments,actor_user_id)
 values(target_org,target_project,target_type,target_id,target_action,old_status,new_status,nullif(btrim(target_comments),''),auth.uid())
$function$;

create or replace function public.create_procurement_supplier(payload jsonb)
returns jsonb language plpgsql security definer set search_path=public,private,pg_temp as $function$
declare org uuid:=private.current_organization_id();sid uuid;scode text;
begin
 if auth.uid() is null or org is null or not private.has_project_role(array['admin','procurement'],null) then raise exception 'Not authorized.';end if;
 if nullif(btrim(payload->>'name'),'') is null then raise exception 'Supplier name is required.';end if;
 scode:='SUP-'||lpad(nextval('public.procurement_supplier_seq')::text,5,'0');
 insert into public.procurement_suppliers(organization_id,supplier_code,name,category,tax_id,contact_person,phone,email,address,payment_terms,created_by)
 values(org,scode,btrim(payload->>'name'),coalesce(nullif(payload->>'category',''),'materials'),nullif(btrim(payload->>'tax_id'),''),
 nullif(btrim(payload->>'contact_person'),''),nullif(btrim(payload->>'phone'),''),nullif(btrim(payload->>'email'),''),
 nullif(btrim(payload->>'address'),''),nullif(btrim(payload->>'payment_terms'),''),auth.uid()) returning id into sid;
 perform private.procurement_approval(org,null,'supplier',sid,'create',null,'pending',null);
 return jsonb_build_object('supplier_id',sid,'supplier_code',scode);
end $function$;

create or replace function public.procurement_supplier_action(payload jsonb)
returns jsonb language plpgsql security definer set search_path=public,private,pg_temp as $function$
declare s public.procurement_suppliers%rowtype;act text:=payload->>'action';next_status text;
begin
 select * into s from public.procurement_suppliers where id=(payload->>'supplier_id')::uuid for update;
 if s.id is null or s.organization_id<>private.current_organization_id() or not private.has_project_role(array['admin','project_manager','procurement'],null) then raise exception 'Not authorized.';end if;
 next_status:=case act when 'approve' then 'approved' when 'suspend' then 'suspended' when 'reactivate' then 'approved' when 'deactivate' then 'inactive' else null end;
 if next_status is null then raise exception 'Invalid supplier action.';end if;
 update public.procurement_suppliers set status=next_status,approved_by=case when next_status='approved' then auth.uid() else approved_by end,approved_at=case when next_status='approved' then now() else approved_at end where id=s.id;
 perform private.procurement_approval(s.organization_id,null,'supplier',s.id,act,s.status,next_status,payload->>'comments');
 return jsonb_build_object('supplier_id',s.id,'status',next_status);
end $function$;

create or replace function public.create_procurement_requisition(payload jsonb)
returns jsonb language plpgsql security definer set search_path=public,private,pg_temp as $function$
declare org uuid:=private.current_organization_id();pid uuid:=(payload->>'project_id')::uuid;wid uuid:=nullif(payload->>'work_package_id','')::uuid;rid uuid;rnum text;item record;estimated numeric:=0;
begin
 if auth.uid() is null or not private.can_request_procurement(pid) then raise exception 'Not authorized.';end if;
 if wid is not null and not exists(select 1 from public.construction_work_packages where id=wid and project_id=pid) then raise exception 'Work package does not belong to the project.';end if;
 if nullif(btrim(payload->>'title'),'') is null or nullif(btrim(payload->>'purpose'),'') is null then raise exception 'Title and purpose are required.';end if;
 if jsonb_array_length(coalesce(payload->'items','[]'::jsonb))=0 then raise exception 'Add at least one requested item.';end if;
 rnum:='PR-'||to_char(current_date,'YYYY')||'-'||lpad(nextval('public.procurement_requisition_seq')::text,5,'0');
 insert into public.procurement_requisitions(organization_id,project_id,work_package_id,request_number,title,purpose,request_type,priority,required_date,delivery_location,requested_by)
 values(org,pid,wid,rnum,btrim(payload->>'title'),btrim(payload->>'purpose'),coalesce(nullif(payload->>'request_type',''),'materials'),
 coalesce(nullif(payload->>'priority',''),'normal'),nullif(payload->>'required_date','')::date,nullif(btrim(payload->>'delivery_location'),''),auth.uid()) returning id into rid;
 for item in select value item from jsonb_array_elements(payload->'items') loop
  if coalesce((item.item->>'quantity')::numeric,0)<=0 or nullif(btrim(item.item->>'description'),'') is null or nullif(btrim(item.item->>'unit'),'') is null then raise exception 'Every item needs a description, positive quantity and unit.';end if;
  insert into public.procurement_requisition_items(organization_id,project_id,requisition_id,description,specification,quantity,unit,estimated_unit_price_etb,estimated_total_etb)
  values(org,pid,rid,btrim(item.item->>'description'),nullif(btrim(item.item->>'specification'),''),(item.item->>'quantity')::numeric,btrim(item.item->>'unit'),
  greatest(coalesce(nullif(item.item->>'estimated_unit_price_etb','')::numeric,0),0),
  (item.item->>'quantity')::numeric*greatest(coalesce(nullif(item.item->>'estimated_unit_price_etb','')::numeric,0),0));
 end loop;
 select coalesce(sum(estimated_total_etb),0) into estimated from public.procurement_requisition_items where requisition_id=rid;
 update public.procurement_requisitions set estimated_amount_etb=estimated where id=rid;
 perform private.procurement_approval(org,pid,'requisition',rid,'create',null,'draft',null);
 return jsonb_build_object('requisition_id',rid,'request_number',rnum,'estimated_amount_etb',estimated);
end $function$;

create or replace function public.procurement_requisition_action(payload jsonb)
returns jsonb language plpgsql security definer set search_path=public,private,pg_temp as $function$
declare r public.procurement_requisitions%rowtype;act text:=payload->>'action';next_status text;
begin
 select * into r from public.procurement_requisitions where id=(payload->>'requisition_id')::uuid for update;
 if r.id is null then raise exception 'Requisition not found.';end if;
 if act='submit' and r.status='draft' and private.can_request_procurement(r.project_id) then next_status:='submitted';
 elsif act='approve' and r.status='submitted' and private.can_approve_procurement(r.project_id) then
  if r.requested_by=auth.uid() then raise exception 'Requester cannot approve their own requisition.';end if;next_status:='approved';
 elsif act='reject' and r.status='submitted' and private.can_approve_procurement(r.project_id) then next_status:='rejected';
 elsif act='cancel' and r.status in('draft','submitted','approved','sourcing') and (private.can_manage_procurement(r.project_id) or r.requested_by=auth.uid()) then next_status:='cancelled';
 else raise exception 'Invalid requisition action or status.';end if;
 update public.procurement_requisitions set status=next_status,
 submitted_at=case when next_status='submitted' then now() else submitted_at end,
 approved_by=case when next_status='approved' then auth.uid() else approved_by end,
 approved_at=case when next_status='approved' then now() else approved_at end,
 rejection_reason=case when next_status='rejected' then coalesce(nullif(btrim(payload->>'comments'),''),'Rejected') else null end where id=r.id;
 perform private.procurement_approval(r.organization_id,r.project_id,'requisition',r.id,act,r.status,next_status,payload->>'comments');
 return jsonb_build_object('requisition_id',r.id,'status',next_status);
end $function$;

create or replace function public.create_procurement_quotation(payload jsonb)
returns jsonb language plpgsql security definer set search_path=public,private,pg_temp as $function$
declare r public.procurement_requisitions%rowtype;s public.procurement_suppliers%rowtype;qid uuid;qnum text;item record;sub numeric:=0;vat_rate numeric:=coalesce(nullif(payload->>'vat_rate','')::numeric,15);vat numeric;total numeric;
begin
 select * into r from public.procurement_requisitions where id=(payload->>'requisition_id')::uuid for update;
 select * into s from public.procurement_suppliers where id=(payload->>'supplier_id')::uuid;
 if r.id is null or not private.can_manage_procurement(r.project_id) then raise exception 'Not authorized.';end if;
 if r.status not in('approved','sourcing') then raise exception 'Requisition must be approved before sourcing.';end if;
 if s.id is null or s.organization_id<>r.organization_id or s.status<>'approved' then raise exception 'Choose an approved supplier.';end if;
 if jsonb_array_length(coalesce(payload->'items','[]'::jsonb))=0 then raise exception 'Add quotation items.';end if;
 qnum:='QT-'||to_char(current_date,'YYYY')||'-'||lpad(nextval('public.procurement_quotation_seq')::text,5,'0');
 insert into public.procurement_quotations(organization_id,project_id,requisition_id,supplier_id,quotation_number,supplier_reference,quotation_date,valid_until,vat_rate,delivery_days,payment_terms,technical_notes,commercial_notes,created_by)
 values(r.organization_id,r.project_id,r.id,s.id,qnum,nullif(btrim(payload->>'supplier_reference'),''),coalesce(nullif(payload->>'quotation_date','')::date,current_date),
 nullif(payload->>'valid_until','')::date,vat_rate,nullif(payload->>'delivery_days','')::integer,nullif(btrim(payload->>'payment_terms'),''),
 nullif(btrim(payload->>'technical_notes'),''),nullif(btrim(payload->>'commercial_notes'),''),auth.uid()) returning id into qid;
 for item in select value item from jsonb_array_elements(payload->'items') loop
  if not exists(select 1 from public.procurement_requisition_items where id=(item.item->>'requisition_item_id')::uuid and requisition_id=r.id) then raise exception 'Quotation item does not belong to the requisition.';end if;
  insert into public.procurement_quotation_items(organization_id,project_id,quotation_id,requisition_item_id,description,quantity,unit,unit_price_etb,total_etb)
  select r.organization_id,r.project_id,qid,ri.id,ri.description,
  coalesce(nullif(item.item->>'quantity','')::numeric,ri.quantity),ri.unit,
  greatest(coalesce(nullif(item.item->>'unit_price_etb','')::numeric,0),0),
  coalesce(nullif(item.item->>'quantity','')::numeric,ri.quantity)*greatest(coalesce(nullif(item.item->>'unit_price_etb','')::numeric,0),0)
  from public.procurement_requisition_items ri where ri.id=(item.item->>'requisition_item_id')::uuid;
 end loop;
 select coalesce(sum(total_etb),0) into sub from public.procurement_quotation_items where quotation_id=qid;
 vat:=round(sub*vat_rate/100,2);total:=sub+vat;
 update public.procurement_quotations set subtotal_etb=sub,vat_amount_etb=vat,total_etb=total where id=qid;
 update public.procurement_requisitions set status='sourcing' where id=r.id;
 perform private.procurement_approval(r.organization_id,r.project_id,'quotation',qid,'create',null,'draft',null);
 return jsonb_build_object('quotation_id',qid,'quotation_number',qnum,'total_etb',total);
end $function$;

create or replace function public.procurement_quotation_action(payload jsonb)
returns jsonb language plpgsql security definer set search_path=public,private,pg_temp as $function$
declare q public.procurement_quotations%rowtype;r public.procurement_requisitions%rowtype;act text:=payload->>'action';next_status text;poid uuid;ponum text;
begin
 select * into q from public.procurement_quotations where id=(payload->>'quotation_id')::uuid for update;
 if q.id is null then raise exception 'Quotation not found.';end if;
 select * into r from public.procurement_requisitions where id=q.requisition_id for update;
 if act='submit' and q.status='draft' and private.can_manage_procurement(q.project_id) then next_status:='submitted';
 elsif act='evaluate' and q.status='submitted' and private.can_manage_procurement(q.project_id) then next_status:='evaluated';
 elsif act='reject' and q.status in('submitted','evaluated') and private.can_approve_procurement(q.project_id) then next_status:='rejected';
 elsif act='select' and q.status in('submitted','evaluated') and private.can_approve_procurement(q.project_id) then
  next_status:='selected';
  update public.procurement_quotations set status='rejected' where requisition_id=q.requisition_id and id<>q.id and status in('draft','submitted','evaluated');
  update public.procurement_requisitions set status='ordered' where id=q.requisition_id;
  ponum:='PO-'||to_char(current_date,'YYYY')||'-'||lpad(nextval('public.procurement_po_seq')::text,5,'0');
  insert into public.procurement_purchase_orders(organization_id,project_id,requisition_id,quotation_id,supplier_id,po_number,expected_delivery_date,delivery_location,subtotal_etb,vat_rate,vat_amount_etb,total_etb,terms,created_by)
  values(q.organization_id,q.project_id,q.requisition_id,q.id,q.supplier_id,ponum,
   case when q.delivery_days is null then null else current_date+q.delivery_days end,r.delivery_location,q.subtotal_etb,q.vat_rate,q.vat_amount_etb,q.total_etb,q.payment_terms,auth.uid()) returning id into poid;
  insert into public.procurement_purchase_order_items(organization_id,project_id,purchase_order_id,requisition_item_id,description,quantity,unit,unit_price_etb,total_etb)
  select organization_id,project_id,poid,requisition_item_id,description,quantity,unit,unit_price_etb,total_etb from public.procurement_quotation_items where quotation_id=q.id;
 else raise exception 'Invalid quotation action or status.';end if;
 update public.procurement_quotations set status=next_status,
 submitted_at=case when next_status='submitted' then now() else submitted_at end,
 evaluated_by=case when next_status='evaluated' then auth.uid() else evaluated_by end,
 evaluated_at=case when next_status='evaluated' then now() else evaluated_at end,
 selected_by=case when next_status='selected' then auth.uid() else selected_by end,
 selected_at=case when next_status='selected' then now() else selected_at end where id=q.id;
 perform private.procurement_approval(q.organization_id,q.project_id,'quotation',q.id,act,q.status,next_status,payload->>'comments');
 if poid is not null then perform private.procurement_approval(q.organization_id,q.project_id,'purchase_order',poid,'create',null,'draft','Created from selected quotation');end if;
 return jsonb_build_object('quotation_id',q.id,'status',next_status,'purchase_order_id',poid,'po_number',ponum);
end $function$;

create or replace function public.procurement_purchase_order_action(payload jsonb)
returns jsonb language plpgsql security definer set search_path=public,private,pg_temp as $function$
declare po public.procurement_purchase_orders%rowtype;act text:=payload->>'action';next_status text;
begin
 select * into po from public.procurement_purchase_orders where id=(payload->>'purchase_order_id')::uuid for update;
 if po.id is null then raise exception 'Purchase order not found.';end if;
 if act='approve' and po.status='draft' and private.can_approve_procurement(po.project_id) then next_status:='approved';
 elsif act='issue' and po.status='approved' and private.can_manage_procurement(po.project_id) then next_status:='issued';
 elsif act='close' and po.status='delivered' and private.can_manage_procurement(po.project_id) then next_status:='closed';
 elsif act='cancel' and po.status in('draft','approved','issued') and private.can_approve_procurement(po.project_id) then next_status:='cancelled';
 else raise exception 'Invalid purchase order action or status.';end if;
 update public.procurement_purchase_orders set status=next_status,
 approved_by=case when next_status='approved' then auth.uid() else approved_by end,approved_at=case when next_status='approved' then now() else approved_at end,
 issued_by=case when next_status='issued' then auth.uid() else issued_by end,issued_at=case when next_status='issued' then now() else issued_at end where id=po.id;
 perform private.procurement_approval(po.organization_id,po.project_id,'purchase_order',po.id,act,po.status,next_status,payload->>'comments');
 return jsonb_build_object('purchase_order_id',po.id,'status',next_status);
end $function$;

create or replace function public.create_procurement_delivery(payload jsonb)
returns jsonb language plpgsql security definer set search_path=public,private,pg_temp as $function$
declare po public.procurement_purchase_orders%rowtype;did uuid;dnum text;item record;
begin
 select * into po from public.procurement_purchase_orders where id=(payload->>'purchase_order_id')::uuid;
 if po.id is null or not private.can_manage_procurement(po.project_id) then raise exception 'Not authorized.';end if;
 if po.status not in('issued','partially_delivered') then raise exception 'Purchase order must be issued before receiving delivery.';end if;
 if jsonb_array_length(coalesce(payload->'items','[]'::jsonb))=0 then raise exception 'Add delivered items.';end if;
 dnum:='GRN-'||to_char(current_date,'YYYY')||'-'||lpad(nextval('public.procurement_delivery_seq')::text,5,'0');
 insert into public.procurement_deliveries(organization_id,project_id,purchase_order_id,supplier_id,delivery_number,delivery_date,supplier_delivery_reference,received_by,notes)
 values(po.organization_id,po.project_id,po.id,po.supplier_id,dnum,coalesce(nullif(payload->>'delivery_date','')::date,current_date),
 nullif(btrim(payload->>'supplier_delivery_reference'),''),auth.uid(),nullif(btrim(payload->>'notes'),'')) returning id into did;
 for item in select value item from jsonb_array_elements(payload->'items') loop
  if not exists(select 1 from public.procurement_purchase_order_items where id=(item.item->>'purchase_order_item_id')::uuid and purchase_order_id=po.id) then raise exception 'Delivery item does not belong to purchase order.';end if;
  if coalesce((item.item->>'quantity_received')::numeric,0)<=0 then raise exception 'Received quantity must be positive.';end if;
  insert into public.procurement_delivery_items(organization_id,project_id,delivery_id,purchase_order_item_id,quantity_received,notes)
  values(po.organization_id,po.project_id,did,(item.item->>'purchase_order_item_id')::uuid,(item.item->>'quantity_received')::numeric,nullif(btrim(item.item->>'notes'),''));
 end loop;
 perform private.procurement_approval(po.organization_id,po.project_id,'delivery',did,'receive',null,'received',null);
 return jsonb_build_object('delivery_id',did,'delivery_number',dnum);
end $function$;

create or replace function public.procurement_delivery_action(payload jsonb)
returns jsonb language plpgsql security definer set search_path=public,private,pg_temp as $function$
declare d public.procurement_deliveries%rowtype;act text:=payload->>'action';next_status text;po_status text;
begin
 select * into d from public.procurement_deliveries where id=(payload->>'delivery_id')::uuid for update;
 if d.id is null or not private.can_inspect_procurement(d.project_id) then raise exception 'Not authorized.';end if;
 if d.inspection_status<>'pending' then raise exception 'Delivery is already inspected.';end if;
 if act='accept' then
  update public.procurement_delivery_items set quantity_accepted=quantity_received,quantity_rejected=0 where delivery_id=d.id;next_status:='accepted';
 elsif act='reject' then
  update public.procurement_delivery_items set quantity_accepted=0,quantity_rejected=quantity_received where delivery_id=d.id;next_status:='rejected';
 else raise exception 'Invalid delivery action.';end if;
 update public.procurement_deliveries set status=next_status,inspection_status=next_status,inspected_by=auth.uid(),inspected_at=now(),notes=coalesce(nullif(btrim(payload->>'comments'),''),notes) where id=d.id;
 update public.procurement_purchase_order_items poi set delivered_quantity=coalesce(x.accepted,0)
 from(select di.purchase_order_item_id,sum(di.quantity_accepted) accepted from public.procurement_delivery_items di join public.procurement_deliveries dd on dd.id=di.delivery_id where dd.purchase_order_id=d.purchase_order_id and dd.status<>'cancelled' group by di.purchase_order_item_id)x
 where poi.id=x.purchase_order_item_id;
 select case when bool_and(delivered_quantity>=quantity) then 'delivered' else 'partially_delivered' end into po_status from public.procurement_purchase_order_items where purchase_order_id=d.purchase_order_id;
 update public.procurement_purchase_orders set status=po_status where id=d.purchase_order_id and status<>'cancelled';
 perform private.procurement_approval(d.organization_id,d.project_id,'delivery',d.id,act,'received',next_status,payload->>'comments');
 return jsonb_build_object('delivery_id',d.id,'status',next_status,'purchase_order_status',po_status);
end $function$;

create or replace function public.create_procurement_invoice(payload jsonb)
returns jsonb language plpgsql security definer set search_path=public,private,pg_temp as $function$
declare po public.procurement_purchase_orders%rowtype;iid uuid;inum text;sub numeric:=nullif(payload->>'subtotal_etb','')::numeric;vat numeric:=coalesce(nullif(payload->>'vat_amount_etb','')::numeric,0);total numeric;
begin
 select * into po from public.procurement_purchase_orders where id=(payload->>'purchase_order_id')::uuid;
 if po.id is null or not private.can_manage_procurement(po.project_id) then raise exception 'Not authorized.';end if;
 if nullif(btrim(payload->>'supplier_invoice_number'),'') is null or sub is null or sub<0 or vat<0 then raise exception 'Invoice reference and valid amounts are required.';end if;
 total:=sub+vat;if total<=0 then raise exception 'Invoice total must be positive.';end if;
 inum:='PINV-'||to_char(current_date,'YYYYMMDD')||'-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,6));
 insert into public.procurement_invoices(organization_id,project_id,purchase_order_id,supplier_id,invoice_number,supplier_invoice_number,invoice_date,due_date,subtotal_etb,vat_amount_etb,total_etb,registered_by)
 values(po.organization_id,po.project_id,po.id,po.supplier_id,inum,btrim(payload->>'supplier_invoice_number'),coalesce(nullif(payload->>'invoice_date','')::date,current_date),
 nullif(payload->>'due_date','')::date,sub,vat,total,auth.uid()) returning id into iid;
 perform private.procurement_approval(po.organization_id,po.project_id,'invoice',iid,'register',null,'registered',null);
 return jsonb_build_object('invoice_id',iid,'invoice_number',inum,'total_etb',total);
end $function$;

create or replace function public.procurement_invoice_action(payload jsonb)
returns jsonb language plpgsql security definer set search_path=public,private,pg_temp as $function$
declare i public.procurement_invoices%rowtype;po public.procurement_purchase_orders%rowtype;s public.procurement_suppliers%rowtype;act text:=payload->>'action';next_status text;accepted_value numeric;did uuid;dnum text;
begin
 select * into i from public.procurement_invoices where id=(payload->>'invoice_id')::uuid for update;
 if i.id is null then raise exception 'Invoice not found.';end if;
 select * into po from public.procurement_purchase_orders where id=i.purchase_order_id;
 select * into s from public.procurement_suppliers where id=i.supplier_id;
 if act='match' and i.status='registered' and private.can_manage_procurement(i.project_id) then
  select coalesce(sum(delivered_quantity*unit_price_etb),0) into accepted_value from public.procurement_purchase_order_items where purchase_order_id=po.id;
  if accepted_value<=0 or i.total_etb>po.total_etb then raise exception 'Invoice does not match accepted delivery and purchase order value.';end if;
  next_status:='matched';
 elsif act='approve' and i.status='matched' and private.can_approve_procurement(i.project_id) then next_status:='approved';
 elsif act='request_payment' and i.status='approved' and private.can_manage_procurement(i.project_id) then
  next_status:='payment_requested';dnum:='DIS-'||to_char(now(),'YYYYMMDD')||'-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,6));
  insert into public.finance_disbursements(organization_id,project_id,disbursement_number,disbursement_type,payee_name,payee_reference,amount_etb,description,status,requested_by)
  values(i.organization_id,i.project_id,dnum,'supplier',s.name,i.supplier_invoice_number,i.total_etb,'Procurement invoice '||i.invoice_number||' for '||po.po_number,'submitted',auth.uid()) returning id into did;
 elsif act='reject' and i.status in('registered','matched') and private.can_approve_procurement(i.project_id) then next_status:='rejected';
 else raise exception 'Invalid invoice action or status.';end if;
 update public.procurement_invoices set status=next_status,matched_amount_etb=case when next_status in('matched','approved','payment_requested') then total_etb else matched_amount_etb end,
 approved_by=case when next_status='approved' then auth.uid() else approved_by end,approved_at=case when next_status='approved' then now() else approved_at end,
 finance_disbursement_id=coalesce(did,finance_disbursement_id),rejection_reason=case when next_status='rejected' then coalesce(nullif(btrim(payload->>'comments'),''),'Rejected') else null end where id=i.id;
 perform private.procurement_approval(i.organization_id,i.project_id,'invoice',i.id,act,i.status,next_status,payload->>'comments');
 return jsonb_build_object('invoice_id',i.id,'status',next_status,'finance_disbursement_id',did,'disbursement_number',dnum);
end $function$;

create or replace function private.sync_procurement_invoice_payment()
returns trigger language plpgsql security definer set search_path=public,private,pg_temp as $function$
begin
 if new.status='paid' and old.status is distinct from new.status then
  update public.procurement_invoices set status='paid' where finance_disbursement_id=new.id and status='payment_requested';
 end if;return new;
end $function$;
drop trigger if exists finance_disbursement_sync_procurement_invoice on public.finance_disbursements;
create trigger finance_disbursement_sync_procurement_invoice after update of status on public.finance_disbursements for each row execute function private.sync_procurement_invoice_payment();

do $block$
declare f text;
begin
 foreach f in array array['create_procurement_supplier','procurement_supplier_action','create_procurement_requisition','procurement_requisition_action','create_procurement_quotation','procurement_quotation_action','procurement_purchase_order_action','create_procurement_delivery','procurement_delivery_action','create_procurement_invoice','procurement_invoice_action'] loop
  execute format('revoke all on function public.%I(jsonb) from public,anon',f);
  execute format('grant execute on function public.%I(jsonb) to authenticated',f);
 end loop;
end $block$;