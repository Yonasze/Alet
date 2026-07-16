create sequence if not exists public.inventory_item_seq;
create sequence if not exists public.inventory_receipt_seq;
create sequence if not exists public.inventory_issue_seq;
create sequence if not exists public.inventory_movement_seq;

create table if not exists public.inventory_locations(
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete cascade,
 project_id uuid not null references public.projects(id) on delete cascade,
 code text not null,
 name text not null,
 location_type text not null default 'main_store' check(location_type in('main_store','site_store','floor_store','yard','other')),
 address text,
 is_active boolean not null default true,
 created_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(project_id,code)
);

create table if not exists public.inventory_items(
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete cascade,
 item_code text not null,
 name text not null,
 category text not null default 'material' check(category in('material','equipment','consumable','spare_part','safety','other')),
 description text,
 unit text not null,
 minimum_stock numeric(16,3) not null default 0 check(minimum_stock>=0),
 source_requisition_item_id uuid references public.procurement_requisition_items(id) on delete set null,
 is_active boolean not null default true,
 created_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(organization_id,item_code)
);
create unique index if not exists inventory_items_source_req_unique on public.inventory_items(organization_id,source_requisition_item_id) where source_requisition_item_id is not null;

create table if not exists public.inventory_stock(
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete cascade,
 project_id uuid not null references public.projects(id) on delete cascade,
 location_id uuid not null references public.inventory_locations(id) on delete cascade,
 item_id uuid not null references public.inventory_items(id) on delete restrict,
 quantity_on_hand numeric(16,3) not null default 0 check(quantity_on_hand>=0),
 reserved_quantity numeric(16,3) not null default 0 check(reserved_quantity>=0 and reserved_quantity<=quantity_on_hand),
 average_unit_cost_etb numeric(16,2) not null default 0 check(average_unit_cost_etb>=0),
 updated_at timestamptz not null default now(),
 unique(location_id,item_id)
);

create table if not exists public.inventory_receipts(
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete cascade,
 project_id uuid not null references public.projects(id) on delete cascade,
 location_id uuid not null references public.inventory_locations(id) on delete restrict,
 procurement_delivery_id uuid not null references public.procurement_deliveries(id) on delete restrict,
 receipt_number text not null,
 received_at timestamptz not null default now(),
 status text not null default 'posted' check(status in('posted','reversed')),
 posted_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now(),
 unique(procurement_delivery_id),
 unique(organization_id,receipt_number)
);

create table if not exists public.inventory_receipt_items(
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete cascade,
 project_id uuid not null references public.projects(id) on delete cascade,
 receipt_id uuid not null references public.inventory_receipts(id) on delete cascade,
 item_id uuid not null references public.inventory_items(id) on delete restrict,
 procurement_delivery_item_id uuid not null references public.procurement_delivery_items(id) on delete restrict,
 quantity numeric(16,3) not null check(quantity>0),
 unit_cost_etb numeric(16,2) not null default 0 check(unit_cost_etb>=0),
 total_cost_etb numeric(16,2) not null default 0 check(total_cost_etb>=0),
 created_at timestamptz not null default now(),
 unique(procurement_delivery_item_id)
);

create table if not exists public.inventory_issue_requests(
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete cascade,
 project_id uuid not null references public.projects(id) on delete cascade,
 location_id uuid not null references public.inventory_locations(id) on delete restrict,
 work_package_id uuid references public.construction_work_packages(id) on delete set null,
 issue_number text not null,
 purpose text not null,
 required_date date,
 status text not null default 'draft' check(status in('draft','submitted','approved','issued','rejected','cancelled')),
 requested_by uuid references auth.users(id) on delete set null,
 submitted_at timestamptz,
 approved_by uuid references auth.users(id) on delete set null,
 approved_at timestamptz,
 issued_by uuid references auth.users(id) on delete set null,
 issued_at timestamptz,
 rejection_reason text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(organization_id,issue_number)
);

create table if not exists public.inventory_issue_items(
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete cascade,
 project_id uuid not null references public.projects(id) on delete cascade,
 issue_request_id uuid not null references public.inventory_issue_requests(id) on delete cascade,
 item_id uuid not null references public.inventory_items(id) on delete restrict,
 requested_quantity numeric(16,3) not null check(requested_quantity>0),
 approved_quantity numeric(16,3) not null default 0 check(approved_quantity>=0 and approved_quantity<=requested_quantity),
 issued_quantity numeric(16,3) not null default 0 check(issued_quantity>=0 and issued_quantity<=approved_quantity),
 unit text not null,
 notes text,
 created_at timestamptz not null default now(),
 unique(issue_request_id,item_id)
);

create table if not exists public.inventory_movements(
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete cascade,
 project_id uuid not null references public.projects(id) on delete cascade,
 location_id uuid not null references public.inventory_locations(id) on delete restrict,
 item_id uuid not null references public.inventory_items(id) on delete restrict,
 movement_number text not null,
 movement_type text not null check(movement_type in('receipt','issue','adjustment_in','adjustment_out','return')),
 quantity numeric(16,3) not null check(quantity>0),
 unit_cost_etb numeric(16,2) not null default 0 check(unit_cost_etb>=0),
 reference_type text,
 reference_id uuid,
 notes text,
 actor_user_id uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now(),
 unique(organization_id,movement_number)
);

create index if not exists inventory_locations_project_active_idx on public.inventory_locations(project_id,is_active);
create index if not exists inventory_items_org_active_idx on public.inventory_items(organization_id,is_active);
create index if not exists inventory_stock_project_item_idx on public.inventory_stock(project_id,item_id);
create index if not exists inventory_stock_location_idx on public.inventory_stock(location_id);
create index if not exists inventory_receipts_project_created_idx on public.inventory_receipts(project_id,created_at desc);
create index if not exists inventory_receipts_location_idx on public.inventory_receipts(location_id);
create index if not exists inventory_receipt_items_receipt_idx on public.inventory_receipt_items(receipt_id);
create index if not exists inventory_receipt_items_item_idx on public.inventory_receipt_items(item_id);
create index if not exists inventory_issue_requests_project_status_idx on public.inventory_issue_requests(project_id,status);
create index if not exists inventory_issue_requests_location_idx on public.inventory_issue_requests(location_id);
create index if not exists inventory_issue_requests_work_package_idx on public.inventory_issue_requests(work_package_id);
create index if not exists inventory_issue_items_request_idx on public.inventory_issue_items(issue_request_id);
create index if not exists inventory_issue_items_item_idx on public.inventory_issue_items(item_id);
create index if not exists inventory_movements_project_created_idx on public.inventory_movements(project_id,created_at desc);
create index if not exists inventory_movements_location_item_idx on public.inventory_movements(location_id,item_id,created_at desc);

create or replace function private.can_view_inventory(target_project_id uuid)
returns boolean language sql stable security definer set search_path=public,pg_temp as $function$
 select exists(
  select 1 from public.projects p
  where p.id=target_project_id
   and p.organization_id=private.current_organization_id()
   and private.has_project_role(array['admin','project_manager','procurement','finance','engineer','inventory'],target_project_id)
 )
$function$;

create or replace function private.can_manage_inventory(target_project_id uuid)
returns boolean language sql stable security definer set search_path=public,pg_temp as $function$
 select exists(
  select 1 from public.projects p
  where p.id=target_project_id
   and p.organization_id=private.current_organization_id()
   and private.has_project_role(array['admin','inventory'],target_project_id)
 )
$function$;

create or replace function private.can_request_inventory(target_project_id uuid)
returns boolean language sql stable security definer set search_path=public,pg_temp as $function$
 select exists(
  select 1 from public.projects p
  where p.id=target_project_id
   and p.organization_id=private.current_organization_id()
   and private.has_project_role(array['admin','project_manager','engineer','inventory'],target_project_id)
 )
$function$;

create or replace function private.inventory_touch_updated_at()
returns trigger language plpgsql set search_path=pg_catalog,pg_temp as $function$
begin new.updated_at=now();return new;end
$function$;

do $block$
declare t text;
begin
 foreach t in array array['inventory_locations','inventory_items','inventory_stock','inventory_issue_requests'] loop
  execute format('drop trigger if exists %I_touch on public.%I',t,t);
  execute format('create trigger %I_touch before update on public.%I for each row execute function private.inventory_touch_updated_at()',t,t);
 end loop;
end
$block$;

alter table public.inventory_locations enable row level security;
alter table public.inventory_items enable row level security;
alter table public.inventory_stock enable row level security;
alter table public.inventory_receipts enable row level security;
alter table public.inventory_receipt_items enable row level security;
alter table public.inventory_issue_requests enable row level security;
alter table public.inventory_issue_items enable row level security;
alter table public.inventory_movements enable row level security;

do $block$
declare t text;
begin
 foreach t in array array['inventory_locations','inventory_stock','inventory_receipts','inventory_receipt_items','inventory_issue_requests','inventory_issue_items','inventory_movements'] loop
  execute format('drop policy if exists %I_read on public.%I',t,t);
  execute format('create policy %I_read on public.%I for select to authenticated using((select private.can_view_inventory(project_id)))',t,t);
 end loop;
end
$block$;

drop policy if exists inventory_items_read on public.inventory_items;
create policy inventory_items_read on public.inventory_items for select to authenticated
using(
 organization_id=(select private.current_organization_id())
 and (select private.has_project_role(array['admin','project_manager','procurement','finance','engineer','inventory'],null))
);

grant select on public.inventory_locations,public.inventory_items,public.inventory_stock,public.inventory_receipts,
 public.inventory_receipt_items,public.inventory_issue_requests,public.inventory_issue_items,public.inventory_movements to authenticated;
revoke all on public.inventory_locations,public.inventory_items,public.inventory_stock,public.inventory_receipts,
 public.inventory_receipt_items,public.inventory_issue_requests,public.inventory_issue_items,public.inventory_movements from anon;

create or replace function public.create_inventory_location(payload jsonb)
returns jsonb language plpgsql security definer set search_path=public,private,pg_temp as $function$
declare org uuid:=private.current_organization_id();pid uuid:=nullif(payload->>'project_id','')::uuid;lid uuid;
begin
 if auth.uid() is null or not private.can_manage_inventory(pid) then raise exception 'Not authorized.';end if;
 if nullif(btrim(payload->>'code'),'') is null or nullif(btrim(payload->>'name'),'') is null then raise exception 'Location code and name are required.';end if;
 insert into public.inventory_locations(organization_id,project_id,code,name,location_type,address,created_by)
 values(org,pid,upper(btrim(payload->>'code')),btrim(payload->>'name'),coalesce(nullif(payload->>'location_type',''),'site_store'),nullif(btrim(payload->>'address'),''),auth.uid())
 returning id into lid;
 return jsonb_build_object('location_id',lid);
end
$function$;

create or replace function public.create_inventory_item(payload jsonb)
returns jsonb language plpgsql security definer set search_path=public,private,pg_temp as $function$
declare org uuid:=private.current_organization_id();iid uuid;icode text;
begin
 if auth.uid() is null or org is null or not private.has_project_role(array['admin','inventory'],null) then raise exception 'Not authorized.';end if;
 if nullif(btrim(payload->>'name'),'') is null or nullif(btrim(payload->>'unit'),'') is null then raise exception 'Item name and unit are required.';end if;
 icode:=coalesce(nullif(upper(btrim(payload->>'item_code')),''),'MAT-'||lpad(nextval('public.inventory_item_seq')::text,5,'0'));
 insert into public.inventory_items(organization_id,item_code,name,category,description,unit,minimum_stock,created_by)
 values(org,icode,btrim(payload->>'name'),coalesce(nullif(payload->>'category',''),'material'),nullif(btrim(payload->>'description'),''),btrim(payload->>'unit'),
 greatest(coalesce(nullif(payload->>'minimum_stock','')::numeric,0),0),auth.uid()) returning id into iid;
 return jsonb_build_object('item_id',iid,'item_code',icode);
end
$function$;

create or replace function public.create_inventory_issue(payload jsonb)
returns jsonb language plpgsql security definer set search_path=public,private,pg_temp as $function$
declare org uuid:=private.current_organization_id();pid uuid:=nullif(payload->>'project_id','')::uuid;lid uuid:=nullif(payload->>'location_id','')::uuid;wid uuid:=nullif(payload->>'work_package_id','')::uuid;iid uuid;inum text;entry record;
begin
 if auth.uid() is null or not private.can_request_inventory(pid) then raise exception 'Not authorized.';end if;
 if not exists(select 1 from public.inventory_locations l where l.id=lid and l.project_id=pid and l.is_active) then raise exception 'Choose an active project stock location.';end if;
 if wid is not null and not exists(select 1 from public.construction_work_packages w where w.id=wid and w.project_id=pid) then raise exception 'Work package does not belong to the project.';end if;
 if nullif(btrim(payload->>'purpose'),'') is null then raise exception 'Purpose is required.';end if;
 if jsonb_array_length(coalesce(payload->'items','[]'::jsonb))=0 then raise exception 'Add at least one stock item.';end if;
 inum:='ISR-'||to_char(current_date,'YYYY')||'-'||lpad(nextval('public.inventory_issue_seq')::text,5,'0');
 insert into public.inventory_issue_requests(organization_id,project_id,location_id,work_package_id,issue_number,purpose,required_date,requested_by)
 values(org,pid,lid,wid,inum,btrim(payload->>'purpose'),nullif(payload->>'required_date','')::date,auth.uid()) returning id into iid;
 for entry in select value item from jsonb_array_elements(payload->'items') loop
  if coalesce(nullif(entry.item->>'quantity','')::numeric,0)<=0 then raise exception 'Every requested quantity must be positive.';end if;
  insert into public.inventory_issue_items(organization_id,project_id,issue_request_id,item_id,requested_quantity,unit,notes)
  select org,pid,iid,i.id,(entry.item->>'quantity')::numeric,i.unit,nullif(btrim(entry.item->>'notes'),'')
  from public.inventory_items i
  where i.id=(entry.item->>'item_id')::uuid and i.organization_id=org and i.is_active;
  if not found then raise exception 'Choose a valid active stock item.';end if;
 end loop;
 return jsonb_build_object('issue_request_id',iid,'issue_number',inum);
end
$function$;

create or replace function public.inventory_issue_action(payload jsonb)
returns jsonb language plpgsql security definer set search_path=public,private,pg_temp as $function$
declare req public.inventory_issue_requests%rowtype;act text:=payload->>'action';next_status text;entry record;cost numeric;
begin
 select * into req from public.inventory_issue_requests where id=(payload->>'issue_request_id')::uuid for update;
 if req.id is null then raise exception 'Issue request not found.';end if;
 if act='submit' and req.status='draft' and private.can_request_inventory(req.project_id) then next_status:='submitted';
 elsif act='approve' and req.status='submitted' and private.has_project_role(array['admin','project_manager'],req.project_id) then
  if req.requested_by=auth.uid() then raise exception 'Requester cannot approve their own stock issue.';end if;
  update public.inventory_issue_items set approved_quantity=requested_quantity where issue_request_id=req.id;
  next_status:='approved';
 elsif act='reject' and req.status='submitted' and private.has_project_role(array['admin','project_manager'],req.project_id) then next_status:='rejected';
 elsif act='issue' and req.status='approved' and private.can_manage_inventory(req.project_id) then
  for entry in select * from public.inventory_issue_items where issue_request_id=req.id order by id for update loop
   update public.inventory_stock
    set quantity_on_hand=quantity_on_hand-entry.approved_quantity
    where project_id=req.project_id and location_id=req.location_id and item_id=entry.item_id
      and quantity_on_hand-reserved_quantity>=entry.approved_quantity
    returning average_unit_cost_etb into cost;
   if not found then raise exception 'Insufficient available stock for one or more items.';end if;
   update public.inventory_issue_items set issued_quantity=approved_quantity where id=entry.id;
   insert into public.inventory_movements(organization_id,project_id,location_id,item_id,movement_number,movement_type,quantity,unit_cost_etb,reference_type,reference_id,notes,actor_user_id)
   values(req.organization_id,req.project_id,req.location_id,entry.item_id,'MOV-'||to_char(current_date,'YYYY')||'-'||lpad(nextval('public.inventory_movement_seq')::text,7,'0'),
    'issue',entry.approved_quantity,cost,'issue_request',req.id,req.purpose,auth.uid());
  end loop;
  next_status:='issued';
 elsif act='cancel' and req.status in('draft','submitted','approved') and (req.requested_by=auth.uid() or private.can_manage_inventory(req.project_id)) then next_status:='cancelled';
 else raise exception 'Invalid stock issue action or status.';end if;
 update public.inventory_issue_requests set status=next_status,
  submitted_at=case when next_status='submitted' then now() else submitted_at end,
  approved_by=case when next_status='approved' then auth.uid() else approved_by end,
  approved_at=case when next_status='approved' then now() else approved_at end,
  issued_by=case when next_status='issued' then auth.uid() else issued_by end,
  issued_at=case when next_status='issued' then now() else issued_at end,
  rejection_reason=case when next_status='rejected' then coalesce(nullif(btrim(payload->>'comments'),''),'Rejected') else rejection_reason end
 where id=req.id;
 return jsonb_build_object('issue_request_id',req.id,'status',next_status);
end
$function$;

create or replace function public.adjust_inventory_stock(payload jsonb)
returns jsonb language plpgsql security definer set search_path=public,private,pg_temp as $function$
declare pid uuid:=nullif(payload->>'project_id','')::uuid;lid uuid:=nullif(payload->>'location_id','')::uuid;iid uuid:=nullif(payload->>'item_id','')::uuid;delta numeric:=nullif(payload->>'quantity_delta','')::numeric;stock public.inventory_stock%rowtype;movement text;
begin
 if auth.uid() is null or not private.can_manage_inventory(pid) then raise exception 'Not authorized.';end if;
 if delta is null or delta=0 or nullif(btrim(payload->>'reason'),'') is null then raise exception 'A non-zero adjustment and reason are required.';end if;
 if not exists(select 1 from public.inventory_locations where id=lid and project_id=pid and is_active) then raise exception 'Choose an active project stock location.';end if;
 if not exists(select 1 from public.inventory_items where id=iid and organization_id=private.current_organization_id() and is_active) then raise exception 'Choose an active inventory item.';end if;
 select * into stock from public.inventory_stock where location_id=lid and item_id=iid for update;
 if stock.id is null then
  if delta<0 then raise exception 'Cannot reduce stock that does not exist.';end if;
  insert into public.inventory_stock(organization_id,project_id,location_id,item_id,quantity_on_hand)
  values(private.current_organization_id(),pid,lid,iid,delta) returning * into stock;
 else
  if stock.quantity_on_hand-stock.reserved_quantity+delta<0 then raise exception 'Adjustment would make available stock negative.';end if;
  update public.inventory_stock set quantity_on_hand=quantity_on_hand+delta where id=stock.id returning * into stock;
 end if;
 movement:=case when delta>0 then 'adjustment_in' else 'adjustment_out' end;
 insert into public.inventory_movements(organization_id,project_id,location_id,item_id,movement_number,movement_type,quantity,unit_cost_etb,reference_type,reference_id,notes,actor_user_id)
 values(stock.organization_id,pid,lid,iid,'MOV-'||to_char(current_date,'YYYY')||'-'||lpad(nextval('public.inventory_movement_seq')::text,7,'0'),
  movement,abs(delta),stock.average_unit_cost_etb,'adjustment',stock.id,btrim(payload->>'reason'),auth.uid());
 return jsonb_build_object('stock_id',stock.id,'quantity_on_hand',stock.quantity_on_hand);
end
$function$;

create or replace function private.post_accepted_delivery_to_inventory()
returns trigger language plpgsql security definer set search_path=public,private,pg_temp as $function$
declare lid uuid;rid uuid;rnum text;entry record;iid uuid;icode text;
begin
 if new.inspection_status not in('accepted','partially_accepted') or old.inspection_status is not distinct from new.inspection_status then return new;end if;
 insert into public.inventory_locations(organization_id,project_id,code,name,location_type,is_active,created_by)
 values(new.organization_id,new.project_id,'MAIN','Main Project Store','main_store',true,new.inspected_by)
 on conflict(project_id,code) do update set is_active=true
 returning id into lid;
 rnum:='IR-'||to_char(current_date,'YYYY')||'-'||lpad(nextval('public.inventory_receipt_seq')::text,6,'0');
 insert into public.inventory_receipts(organization_id,project_id,location_id,procurement_delivery_id,receipt_number,received_at,posted_by)
 values(new.organization_id,new.project_id,lid,new.id,rnum,coalesce(new.inspected_at,now()),new.inspected_by)
 on conflict(procurement_delivery_id) do nothing returning id into rid;
 if rid is null then return new;end if;
 for entry in
  select di.id delivery_item_id,di.quantity_accepted,poi.requisition_item_id,poi.description,poi.unit,poi.unit_price_etb
  from public.procurement_delivery_items di
  join public.procurement_purchase_order_items poi on poi.id=di.purchase_order_item_id
  where di.delivery_id=new.id and di.quantity_accepted>0
 loop
  select id into iid from public.inventory_items where organization_id=new.organization_id and source_requisition_item_id=entry.requisition_item_id;
  if iid is null then
   icode:='MAT-'||lpad(nextval('public.inventory_item_seq')::text,5,'0');
   insert into public.inventory_items(organization_id,item_code,name,category,unit,source_requisition_item_id,created_by)
   values(new.organization_id,icode,entry.description,'material',entry.unit,entry.requisition_item_id,new.inspected_by) returning id into iid;
  end if;
  insert into public.inventory_receipt_items(organization_id,project_id,receipt_id,item_id,procurement_delivery_item_id,quantity,unit_cost_etb,total_cost_etb)
  values(new.organization_id,new.project_id,rid,iid,entry.delivery_item_id,entry.quantity_accepted,entry.unit_price_etb,round(entry.quantity_accepted*entry.unit_price_etb,2));
  insert into public.inventory_stock(organization_id,project_id,location_id,item_id,quantity_on_hand,average_unit_cost_etb)
  values(new.organization_id,new.project_id,lid,iid,entry.quantity_accepted,entry.unit_price_etb)
  on conflict(location_id,item_id) do update set
   average_unit_cost_etb=case when public.inventory_stock.quantity_on_hand+excluded.quantity_on_hand=0 then public.inventory_stock.average_unit_cost_etb
    else round(((public.inventory_stock.quantity_on_hand*public.inventory_stock.average_unit_cost_etb)+(excluded.quantity_on_hand*excluded.average_unit_cost_etb))/(public.inventory_stock.quantity_on_hand+excluded.quantity_on_hand),2) end,
   quantity_on_hand=public.inventory_stock.quantity_on_hand+excluded.quantity_on_hand;
  insert into public.inventory_movements(organization_id,project_id,location_id,item_id,movement_number,movement_type,quantity,unit_cost_etb,reference_type,reference_id,notes,actor_user_id)
  values(new.organization_id,new.project_id,lid,iid,'MOV-'||to_char(current_date,'YYYY')||'-'||lpad(nextval('public.inventory_movement_seq')::text,7,'0'),
   'receipt',entry.quantity_accepted,entry.unit_price_etb,'procurement_delivery',new.id,'Accepted Procurement delivery '||new.delivery_number,new.inspected_by);
 end loop;
 return new;
end
$function$;

drop trigger if exists procurement_delivery_post_inventory on public.procurement_deliveries;
create trigger procurement_delivery_post_inventory
after update of inspection_status on public.procurement_deliveries
for each row execute function private.post_accepted_delivery_to_inventory();

do $block$
declare f text;
begin
 foreach f in array array['create_inventory_location','create_inventory_item','create_inventory_issue','inventory_issue_action','adjust_inventory_stock'] loop
  execute format('revoke all on function public.%I(jsonb) from public,anon',f);
  execute format('grant execute on function public.%I(jsonb) to authenticated',f);
 end loop;
end
$block$;
