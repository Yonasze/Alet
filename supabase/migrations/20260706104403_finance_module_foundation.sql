
create table if not exists public.finance_accounts (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete cascade,
 code text not null,
 name text not null,
 account_type text not null default 'bank',
 bank_name text,
 account_number text,
 currency text not null default 'ETB',
 is_active boolean not null default true,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(organization_id,code),
 constraint finance_accounts_type_check check(account_type in ('bank','cash','mobile_money','clearing'))
);

create table if not exists public.finance_payment_schedules (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete cascade,
 project_id uuid not null references public.projects(id) on delete cascade,
 contract_id uuid not null references public.sales_contracts(id) on delete cascade,
 installment_number integer not null,
 label text not null,
 percentage numeric(7,4),
 amount_etb numeric(18,2) not null,
 paid_amount_etb numeric(18,2) not null default 0,
 due_date date,
 trigger_type text not null default 'date',
 milestone_reference text,
 status text not null default 'scheduled',
 created_by uuid references auth.users(id) on delete set null default auth.uid(),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(contract_id,installment_number),
 constraint finance_schedule_amount_check check(amount_etb>0 and paid_amount_etb>=0 and paid_amount_etb<=amount_etb),
 constraint finance_schedule_status_check check(status in ('scheduled','due','partially_paid','paid','overdue','cancelled')),
 constraint finance_schedule_trigger_check check(trigger_type in ('date','contract_signing','construction_milestone','handover','manual'))
);

create table if not exists public.finance_payments (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete cascade,
 project_id uuid not null references public.projects(id) on delete cascade,
 contract_id uuid not null references public.sales_contracts(id) on delete restrict,
 customer_id uuid not null references public.sales_customers(id) on delete restrict,
 unit_id uuid not null references public.units(id) on delete restrict,
 account_id uuid not null references public.finance_accounts(id) on delete restrict,
 payment_number text not null,
 amount_etb numeric(18,2) not null,
 payment_date date not null,
 payment_method text not null,
 bank_reference text,
 payer_name text,
 notes text,
 status text not null default 'submitted',
 created_by uuid references auth.users(id) on delete set null default auth.uid(),
 verified_by uuid references auth.users(id) on delete set null,
 verified_at timestamptz,
 reconciled_by uuid references auth.users(id) on delete set null,
 reconciled_at timestamptz,
 reversed_by uuid references auth.users(id) on delete set null,
 reversed_at timestamptz,
 reversal_reason text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(organization_id,payment_number),
 constraint finance_payments_amount_check check(amount_etb>0),
 constraint finance_payments_method_check check(payment_method in ('bank_transfer','cash','cheque','mobile_money','other')),
 constraint finance_payments_status_check check(status in ('draft','submitted','verified','reconciled','reversed'))
);

create table if not exists public.finance_payment_allocations (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete cascade,
 project_id uuid not null references public.projects(id) on delete cascade,
 payment_id uuid not null references public.finance_payments(id) on delete cascade,
 schedule_id uuid not null references public.finance_payment_schedules(id) on delete restrict,
 amount_etb numeric(18,2) not null,
 created_at timestamptz not null default now(),
 unique(payment_id,schedule_id),
 constraint finance_allocations_amount_check check(amount_etb>0)
);

create table if not exists public.finance_receipts (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete cascade,
 project_id uuid not null references public.projects(id) on delete cascade,
 payment_id uuid not null unique references public.finance_payments(id) on delete restrict,
 receipt_number text not null,
 issued_at timestamptz not null default now(),
 issued_by uuid references auth.users(id) on delete set null default auth.uid(),
 status text not null default 'issued',
 voided_at timestamptz,
 voided_by uuid references auth.users(id) on delete set null,
 void_reason text,
 unique(organization_id,receipt_number),
 constraint finance_receipts_status_check check(status in ('issued','void'))
);

create table if not exists public.finance_commission_rules (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete cascade,
 project_id uuid references public.projects(id) on delete cascade,
 name text not null,
 calculation_type text not null default 'percentage',
 rate numeric(9,4) not null,
 eligibility_trigger text not null default 'contract_signed',
 minimum_collection_percent numeric(7,4) not null default 0,
 withholding_rate numeric(7,4) not null default 0,
 is_active boolean not null default true,
 created_by uuid references auth.users(id) on delete set null default auth.uid(),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint finance_commission_type_check check(calculation_type in ('percentage','fixed')),
 constraint finance_commission_trigger_check check(eligibility_trigger in ('contract_signed','minimum_collection','fully_paid')),
 constraint finance_commission_rates_check check(rate>=0 and withholding_rate between 0 and 100 and minimum_collection_percent between 0 and 100)
);

create table if not exists public.finance_commissions (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete cascade,
 project_id uuid not null references public.projects(id) on delete cascade,
 contract_id uuid not null references public.sales_contracts(id) on delete restrict,
 rule_id uuid not null references public.finance_commission_rules(id) on delete restrict,
 agent_user_id uuid not null references auth.users(id) on delete restrict,
 gross_amount_etb numeric(18,2) not null,
 withholding_amount_etb numeric(18,2) not null default 0,
 net_amount_etb numeric(18,2) not null,
 status text not null default 'calculated',
 eligible_at timestamptz,
 approved_by uuid references auth.users(id) on delete set null,
 approved_at timestamptz,
 paid_at timestamptz,
 notes text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(contract_id,agent_user_id),
 constraint finance_commission_amount_check check(gross_amount_etb>=0 and withholding_amount_etb>=0 and net_amount_etb>=0),
 constraint finance_commission_status_check check(status in ('calculated','eligible','approved','paid','cancelled','reversed'))
);

create table if not exists public.finance_disbursements (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete cascade,
 project_id uuid references public.projects(id) on delete set null,
 account_id uuid references public.finance_accounts(id) on delete restrict,
 commission_id uuid unique references public.finance_commissions(id) on delete set null,
 disbursement_number text not null,
 disbursement_type text not null,
 payee_name text not null,
 payee_reference text,
 amount_etb numeric(18,2) not null,
 payment_method text,
 bank_reference text,
 description text not null,
 status text not null default 'draft',
 requested_by uuid references auth.users(id) on delete set null default auth.uid(),
 approved_by uuid references auth.users(id) on delete set null,
 approved_at timestamptz,
 paid_by uuid references auth.users(id) on delete set null,
 paid_at timestamptz,
 reversed_by uuid references auth.users(id) on delete set null,
 reversed_at timestamptz,
 reversal_reason text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(organization_id,disbursement_number),
 constraint finance_disbursement_amount_check check(amount_etb>0),
 constraint finance_disbursement_type_check check(disbursement_type in ('commission','payroll','reimbursement','supplier','contractor','other')),
 constraint finance_disbursement_status_check check(status in ('draft','submitted','approved','paid','reversed','cancelled'))
);

create index if not exists finance_schedules_contract_idx on public.finance_payment_schedules(contract_id,status,due_date);
create index if not exists finance_schedules_project_idx on public.finance_payment_schedules(project_id,due_date);
create index if not exists finance_payments_contract_idx on public.finance_payments(contract_id,status,payment_date);
create index if not exists finance_payments_project_idx on public.finance_payments(project_id,payment_date);
create index if not exists finance_allocations_schedule_idx on public.finance_payment_allocations(schedule_id);
create index if not exists finance_receipts_project_idx on public.finance_receipts(project_id,issued_at);
create index if not exists finance_commissions_project_idx on public.finance_commissions(project_id,status);
create index if not exists finance_disbursements_project_idx on public.finance_disbursements(project_id,status);

create or replace function private.can_manage_finance(target_project_id uuid)
returns boolean language sql stable security definer set search_path=public,pg_temp as $$
 select exists(select 1 from public.projects p where p.id=target_project_id and p.organization_id=private.current_organization_id()
 and private.has_project_role(array['admin','finance'],target_project_id))
$$;
create or replace function private.can_view_finance(target_project_id uuid)
returns boolean language sql stable security definer set search_path=public,pg_temp as $$
 select exists(select 1 from public.projects p where p.id=target_project_id and p.organization_id=private.current_organization_id()
 and private.has_project_role(array['admin','finance','project_manager'],target_project_id))
$$;
create or replace function private.can_manage_finance_org(target_org uuid)
returns boolean language sql stable security definer set search_path=public,pg_temp as $$
 select target_org=private.current_organization_id() and private.has_project_role(array['admin','finance'],null)
$$;

alter table public.finance_accounts enable row level security;
alter table public.finance_payment_schedules enable row level security;
alter table public.finance_payments enable row level security;
alter table public.finance_payment_allocations enable row level security;
alter table public.finance_receipts enable row level security;
alter table public.finance_commission_rules enable row level security;
alter table public.finance_commissions enable row level security;
alter table public.finance_disbursements enable row level security;

create policy finance_accounts_read on public.finance_accounts for select to authenticated using(organization_id=private.current_organization_id() and private.has_project_role(array['admin','finance','project_manager'],null));
create policy finance_accounts_insert on public.finance_accounts for insert to authenticated with check(private.can_manage_finance_org(organization_id));
create policy finance_accounts_update on public.finance_accounts for update to authenticated using(private.can_manage_finance_org(organization_id)) with check(private.can_manage_finance_org(organization_id));
create policy finance_accounts_delete on public.finance_accounts for delete to authenticated using(private.can_manage_finance_org(organization_id));

create policy finance_schedules_read on public.finance_payment_schedules for select to authenticated using(private.can_view_finance(project_id));
create policy finance_schedules_insert on public.finance_payment_schedules for insert to authenticated with check(private.can_manage_finance(project_id));
create policy finance_schedules_update on public.finance_payment_schedules for update to authenticated using(private.can_manage_finance(project_id)) with check(private.can_manage_finance(project_id));
create policy finance_schedules_delete on public.finance_payment_schedules for delete to authenticated using(private.can_manage_finance(project_id));

create policy finance_payments_read on public.finance_payments for select to authenticated using(private.can_view_finance(project_id));
create policy finance_payments_insert on public.finance_payments for insert to authenticated with check(private.can_manage_finance(project_id));
create policy finance_payments_update on public.finance_payments for update to authenticated using(private.can_manage_finance(project_id)) with check(private.can_manage_finance(project_id));
create policy finance_payments_delete on public.finance_payments for delete to authenticated using(private.can_manage_finance(project_id));

create policy finance_allocations_read on public.finance_payment_allocations for select to authenticated using(private.can_view_finance(project_id));
create policy finance_allocations_insert on public.finance_payment_allocations for insert to authenticated with check(private.can_manage_finance(project_id));
create policy finance_allocations_update on public.finance_payment_allocations for update to authenticated using(private.can_manage_finance(project_id)) with check(private.can_manage_finance(project_id));
create policy finance_allocations_delete on public.finance_payment_allocations for delete to authenticated using(private.can_manage_finance(project_id));

create policy finance_receipts_read on public.finance_receipts for select to authenticated using(private.can_view_finance(project_id));
create policy finance_receipts_insert on public.finance_receipts for insert to authenticated with check(private.can_manage_finance(project_id));
create policy finance_receipts_update on public.finance_receipts for update to authenticated using(private.can_manage_finance(project_id)) with check(private.can_manage_finance(project_id));
create policy finance_receipts_delete on public.finance_receipts for delete to authenticated using(private.can_manage_finance(project_id));

create policy finance_rules_read on public.finance_commission_rules for select to authenticated using(organization_id=private.current_organization_id() and (project_id is null or private.can_view_finance(project_id)));
create policy finance_rules_insert on public.finance_commission_rules for insert to authenticated with check(private.can_manage_finance_org(organization_id));
create policy finance_rules_update on public.finance_commission_rules for update to authenticated using(private.can_manage_finance_org(organization_id)) with check(private.can_manage_finance_org(organization_id));
create policy finance_rules_delete on public.finance_commission_rules for delete to authenticated using(private.can_manage_finance_org(organization_id));

create policy finance_commissions_read on public.finance_commissions for select to authenticated using(private.can_view_finance(project_id) or agent_user_id=auth.uid());
create policy finance_commissions_insert on public.finance_commissions for insert to authenticated with check(private.can_manage_finance(project_id));
create policy finance_commissions_update on public.finance_commissions for update to authenticated using(private.can_manage_finance(project_id)) with check(private.can_manage_finance(project_id));
create policy finance_commissions_delete on public.finance_commissions for delete to authenticated using(private.can_manage_finance(project_id));

create policy finance_disbursements_read on public.finance_disbursements for select to authenticated using(
 organization_id=private.current_organization_id() and (project_id is null and private.has_project_role(array['admin','finance'],null) or project_id is not null and private.can_view_finance(project_id))
);
create policy finance_disbursements_insert on public.finance_disbursements for insert to authenticated with check(private.can_manage_finance_org(organization_id));
create policy finance_disbursements_update on public.finance_disbursements for update to authenticated using(private.can_manage_finance_org(organization_id)) with check(private.can_manage_finance_org(organization_id));
create policy finance_disbursements_delete on public.finance_disbursements for delete to authenticated using(private.can_manage_finance_org(organization_id));

revoke all on public.finance_accounts,public.finance_payment_schedules,public.finance_payments,public.finance_payment_allocations,public.finance_receipts,public.finance_commission_rules,public.finance_commissions,public.finance_disbursements from anon;
grant select,insert,update,delete on public.finance_accounts,public.finance_payment_schedules,public.finance_payments,public.finance_payment_allocations,public.finance_receipts,public.finance_commission_rules,public.finance_commissions,public.finance_disbursements to authenticated;

create or replace function public.generate_finance_schedule(payload jsonb)
returns jsonb language plpgsql security definer set search_path=public,private,pg_temp as $$
declare c public.sales_contracts%rowtype; item jsonb; i int:=0; n int; pct numeric; amt numeric; allocated numeric:=0; sid uuid;
begin
 if auth.uid() is null then raise exception 'Authentication required.'; end if;
 select * into c from public.sales_contracts where id=(payload->>'contract_id')::uuid for update;
 if c.id is null or not private.can_manage_finance(c.project_id) then raise exception 'Not authorized.'; end if;
 if exists(select 1 from public.finance_payment_schedules where contract_id=c.id) then raise exception 'A payment schedule already exists.'; end if;
 n:=jsonb_array_length(c.payment_plan);
 if n=0 then
   insert into public.finance_payment_schedules(organization_id,project_id,contract_id,installment_number,label,percentage,amount_etb,due_date,trigger_type)
   values(c.organization_id,c.project_id,c.id,1,'Contract balance',100,c.total_price_etb,coalesce(c.signed_at::date,current_date),'contract_signing') returning id into sid;
 else
   for item in select * from jsonb_array_elements(c.payment_plan) loop
     i:=i+1; pct:=coalesce(nullif(item->>'percent','')::numeric,case when n=1 then 100 else null end);
     if pct is null or pct<=0 then raise exception 'Every payment-plan item requires a positive percentage.'; end if;
     amt:=case when i=n then c.total_price_etb-allocated else round(c.total_price_etb*pct/100,2) end;
     allocated:=allocated+amt;
     insert into public.finance_payment_schedules(organization_id,project_id,contract_id,installment_number,label,percentage,amount_etb,due_date,trigger_type,milestone_reference,status)
     values(c.organization_id,c.project_id,c.id,i,coalesce(nullif(item->>'label',''),'Installment '||i),pct,amt,
       coalesce(nullif(item->>'due','')::date,(coalesce(c.signed_at::date,current_date)+(i-1)*interval '90 days')::date),
       case when lower(coalesce(item->>'label','')) like '%handover%' then 'handover'
            when lower(coalesce(item->>'label','')) like '%milestone%' or lower(coalesce(item->>'label','')) like '%construction%' then 'construction_milestone'
            when i=1 then 'contract_signing' else 'date' end,
       case when lower(coalesce(item->>'label','')) like '%milestone%' or lower(coalesce(item->>'label','')) like '%construction%' then item->>'label' end,
       case when coalesce(nullif(item->>'due','')::date,current_date)<=current_date then 'due' else 'scheduled' end);
   end loop;
   if abs(allocated-c.total_price_etb)>0.01 then raise exception 'Payment schedule does not equal contract total.'; end if;
 end if;
 return jsonb_build_object('contract_id',c.id,'installments',coalesce(n,1));
end $$;

create or replace function public.update_finance_installment(payload jsonb)
returns jsonb language plpgsql security definer set search_path=public,private,pg_temp as $$
declare s public.finance_payment_schedules%rowtype; new_amount numeric;
begin
 if auth.uid() is null then raise exception 'Authentication required.'; end if;
 select * into s from public.finance_payment_schedules where id=(payload->>'schedule_id')::uuid;
 if s.id is null or not private.can_manage_finance(s.project_id) then raise exception 'Not authorized.'; end if;
 if s.paid_amount_etb>0 then raise exception 'Installments with payments cannot be changed.'; end if;
 new_amount:=coalesce(nullif(payload->>'amount_etb','')::numeric,s.amount_etb);
 update public.finance_payment_schedules set label=coalesce(nullif(btrim(payload->>'label'),''),label),amount_etb=new_amount,
 due_date=case when payload ? 'due_date' then nullif(payload->>'due_date','')::date else due_date end,
 trigger_type=coalesce(nullif(payload->>'trigger_type',''),trigger_type),milestone_reference=case when payload ? 'milestone_reference' then nullif(btrim(payload->>'milestone_reference'),'') else milestone_reference end
 where id=s.id;
 if abs((select sum(amount_etb) from public.finance_payment_schedules where contract_id=s.contract_id)-(select total_price_etb from public.sales_contracts where id=s.contract_id))>0.01 then
   raise exception 'Installments must equal the contract total.';
 end if;
 return jsonb_build_object('schedule_id',s.id);
end $$;

create or replace function public.record_finance_payment(payload jsonb)
returns jsonb language plpgsql security definer set search_path=public,private,pg_temp as $$
declare s public.finance_payment_schedules%rowtype; c public.sales_contracts%rowtype; a public.finance_accounts%rowtype; amount numeric; pid uuid; pnum text;
begin
 if auth.uid() is null then raise exception 'Authentication required.'; end if;
 select * into s from public.finance_payment_schedules where id=(payload->>'schedule_id')::uuid for update;
 if s.id is null or not private.can_manage_finance(s.project_id) then raise exception 'Not authorized.'; end if;
 select * into c from public.sales_contracts where id=s.contract_id;
 select * into a from public.finance_accounts where id=(payload->>'account_id')::uuid and organization_id=s.organization_id and is_active;
 if a.id is null then raise exception 'Select an active finance account.'; end if;
 amount:=nullif(payload->>'amount_etb','')::numeric;
 if amount is null or amount<=0 then raise exception 'Enter a valid payment amount.'; end if;
 if amount>s.amount_etb-s.paid_amount_etb then raise exception 'Payment exceeds the installment balance.'; end if;
 pnum:='PAY-'||to_char(now(),'YYYYMMDD')||'-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,6));
 insert into public.finance_payments(organization_id,project_id,contract_id,customer_id,unit_id,account_id,payment_number,amount_etb,payment_date,payment_method,bank_reference,payer_name,notes,status)
 values(s.organization_id,s.project_id,c.id,c.customer_id,c.unit_id,a.id,pnum,amount,coalesce(nullif(payload->>'payment_date','')::date,current_date),
 coalesce(nullif(payload->>'payment_method',''),'bank_transfer'),nullif(btrim(payload->>'bank_reference'),''),nullif(btrim(payload->>'payer_name'),''),nullif(btrim(payload->>'notes'),''),'submitted')
 returning id into pid;
 insert into public.finance_payment_allocations(organization_id,project_id,payment_id,schedule_id,amount_etb)
 values(s.organization_id,s.project_id,pid,s.id,amount);
 return jsonb_build_object('payment_id',pid,'payment_number',pnum);
end $$;

create or replace function public.finance_payment_action(payload jsonb)
returns jsonb language plpgsql security definer set search_path=public,private,pg_temp as $$
declare p public.finance_payments%rowtype; act text:=payload->>'action'; rnum text; sid uuid; alloc numeric; eid uuid;
begin
 if auth.uid() is null then raise exception 'Authentication required.'; end if;
 select * into p from public.finance_payments where id=(payload->>'payment_id')::uuid for update;
 if p.id is null or not private.can_manage_finance(p.project_id) then raise exception 'Not authorized.'; end if;
 select schedule_id,amount_etb into sid,alloc from public.finance_payment_allocations where payment_id=p.id;
 if act='verify' then
   if p.status<>'submitted' then raise exception 'Only submitted payments can be verified.'; end if;
   update public.finance_payments set status='verified',verified_by=auth.uid(),verified_at=now() where id=p.id;
   update public.finance_payment_schedules set paid_amount_etb=paid_amount_etb+alloc,
     status=case when paid_amount_etb+alloc>=amount_etb then 'paid' else 'partially_paid' end where id=sid;
   rnum:='RCT-'||to_char(now(),'YYYYMMDD')||'-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,6));
   insert into public.finance_receipts(organization_id,project_id,payment_id,receipt_number,issued_by) values(p.organization_id,p.project_id,p.id,rnum,auth.uid());
   insert into public.business_events(organization_id,project_id,type,reference_type,reference_id,payload)
   values(p.organization_id,p.project_id,'PAYMENT_VERIFIED','finance_payment',p.id,jsonb_build_object('amount_etb',p.amount_etb,'contract_id',p.contract_id));
   insert into public.financial_transactions(organization_id,project_id,unit_id,type,amount,currency,description)
   values(p.organization_id,p.project_id,p.unit_id,'income',p.amount_etb,'ETB','Verified customer payment '||p.payment_number);
 elsif act='reconcile' then
   if p.status<>'verified' then raise exception 'Only verified payments can be reconciled.'; end if;
   update public.finance_payments set status='reconciled',reconciled_by=auth.uid(),reconciled_at=now() where id=p.id;
 elsif act='reverse' then
   if p.status not in ('verified','reconciled') then raise exception 'Only verified or reconciled payments can be reversed.'; end if;
   if nullif(btrim(payload->>'reason'),'') is null then raise exception 'A reversal reason is required.'; end if;
   update public.finance_payments set status='reversed',reversed_by=auth.uid(),reversed_at=now(),reversal_reason=btrim(payload->>'reason') where id=p.id;
   update public.finance_payment_schedules set paid_amount_etb=greatest(0,paid_amount_etb-alloc),
     status=case when greatest(0,paid_amount_etb-alloc)=0 then case when due_date<=current_date then 'due' else 'scheduled' end else 'partially_paid' end where id=sid;
   update public.finance_receipts set status='void',voided_at=now(),voided_by=auth.uid(),void_reason=btrim(payload->>'reason') where payment_id=p.id;
   insert into public.business_events(organization_id,project_id,type,reference_type,reference_id,payload)
   values(p.organization_id,p.project_id,'PAYMENT_REVERSED','finance_payment',p.id,jsonb_build_object('amount_etb',p.amount_etb,'reason',payload->>'reason'));
 else raise exception 'Invalid payment action.';
 end if;
 return jsonb_build_object('payment_id',p.id,'action',act,'receipt_number',rnum);
end $$;

create or replace function public.calculate_finance_commission(payload jsonb)
returns jsonb language plpgsql security definer set search_path=public,private,pg_temp as $$
declare c public.sales_contracts%rowtype; rule public.finance_commission_rules%rowtype; agent uuid; gross numeric; wh numeric; net numeric; cid uuid; collected numeric; pct numeric;
begin
 if auth.uid() is null then raise exception 'Authentication required.'; end if;
 select * into c from public.sales_contracts where id=(payload->>'contract_id')::uuid;
 if c.id is null or not private.can_manage_finance(c.project_id) then raise exception 'Not authorized.'; end if;
 select o.assigned_to into agent from public.sales_reservations r join public.sales_opportunities o on o.id=r.opportunity_id where r.id=c.reservation_id;
 agent:=coalesce(nullif(payload->>'agent_user_id','')::uuid,agent);
 if agent is null then raise exception 'Assign a sales agent before calculating commission.'; end if;
 select * into rule from public.finance_commission_rules where organization_id=c.organization_id and is_active and (project_id=c.project_id or project_id is null) order by (project_id is not null) desc,created_at desc limit 1;
 if rule.id is null then raise exception 'Create an active commission rule first.'; end if;
 collected:=coalesce((select sum(amount_etb) from public.finance_payments where contract_id=c.id and status in ('verified','reconciled')),0);
 pct:=case when c.total_price_etb>0 then collected/c.total_price_etb*100 else 0 end;
 gross:=case when rule.calculation_type='percentage' then round(c.total_price_etb*rule.rate/100,2) else rule.rate end;
 wh:=round(gross*rule.withholding_rate/100,2); net:=gross-wh;
 insert into public.finance_commissions(organization_id,project_id,contract_id,rule_id,agent_user_id,gross_amount_etb,withholding_amount_etb,net_amount_etb,status,eligible_at)
 values(c.organization_id,c.project_id,c.id,rule.id,agent,gross,wh,net,
   case when rule.eligibility_trigger='contract_signed' or rule.eligibility_trigger='minimum_collection' and pct>=rule.minimum_collection_percent or rule.eligibility_trigger='fully_paid' and pct>=100 then 'eligible' else 'calculated' end,
   case when rule.eligibility_trigger='contract_signed' or rule.eligibility_trigger='minimum_collection' and pct>=rule.minimum_collection_percent or rule.eligibility_trigger='fully_paid' and pct>=100 then now() end)
 on conflict(contract_id,agent_user_id) do update set rule_id=excluded.rule_id,gross_amount_etb=excluded.gross_amount_etb,withholding_amount_etb=excluded.withholding_amount_etb,net_amount_etb=excluded.net_amount_etb,status=case when public.finance_commissions.status in ('paid','approved') then public.finance_commissions.status else excluded.status end,eligible_at=coalesce(public.finance_commissions.eligible_at,excluded.eligible_at)
 returning id into cid;
 return jsonb_build_object('commission_id',cid,'gross_amount_etb',gross,'net_amount_etb',net);
end $$;

create or replace function public.finance_commission_action(payload jsonb)
returns jsonb language plpgsql security definer set search_path=public,private,pg_temp as $$
declare c public.finance_commissions%rowtype; act text:=payload->>'action'; did uuid; dnum text; agent_name text;
begin
 if auth.uid() is null then raise exception 'Authentication required.'; end if;
 select * into c from public.finance_commissions where id=(payload->>'commission_id')::uuid for update;
 if c.id is null or not private.can_manage_finance(c.project_id) then raise exception 'Not authorized.'; end if;
 select full_name into agent_name from public.profiles where id=c.agent_user_id;
 if act='approve' then
   if c.status<>'eligible' then raise exception 'Only eligible commissions can be approved.'; end if;
   update public.finance_commissions set status='approved',approved_by=auth.uid(),approved_at=now() where id=c.id;
 elsif act='pay' then
   if c.status<>'approved' then raise exception 'Approve the commission before payment.'; end if;
   if nullif(payload->>'account_id','') is null then raise exception 'Select a payment account.'; end if;
   dnum:='DIS-'||to_char(now(),'YYYYMMDD')||'-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,6));
   insert into public.finance_disbursements(organization_id,project_id,account_id,commission_id,disbursement_number,disbursement_type,payee_name,payee_reference,amount_etb,payment_method,bank_reference,description,status,approved_by,approved_at,paid_by,paid_at)
   values(c.organization_id,c.project_id,(payload->>'account_id')::uuid,c.id,dnum,'commission',coalesce(agent_name,c.agent_user_id::text),c.agent_user_id::text,c.net_amount_etb,
     coalesce(nullif(payload->>'payment_method',''),'bank_transfer'),nullif(payload->>'bank_reference',''),'Sales commission payment','paid',auth.uid(),now(),auth.uid(),now()) returning id into did;
   update public.finance_commissions set status='paid',paid_at=now() where id=c.id;
   insert into public.financial_transactions(organization_id,project_id,type,amount,currency,description)
   values(c.organization_id,c.project_id,'commission',c.net_amount_etb,'ETB','Paid sales commission '||dnum);
 else raise exception 'Invalid commission action.';
 end if;
 return jsonb_build_object('commission_id',c.id,'action',act,'disbursement_id',did);
end $$;

create or replace function public.create_finance_disbursement(payload jsonb)
returns jsonb language plpgsql security definer set search_path=public,private,pg_temp as $$
declare org uuid:=private.current_organization_id(); pid uuid:=nullif(payload->>'project_id','')::uuid; did uuid; dnum text; dtype text:=payload->>'disbursement_type'; amount numeric:=nullif(payload->>'amount_etb','')::numeric;
begin
 if auth.uid() is null or not private.can_manage_finance_org(org) then raise exception 'Not authorized.'; end if;
 if pid is not null and not private.can_manage_finance(pid) then raise exception 'Not authorized for this project.'; end if;
 if dtype not in ('commission','payroll','reimbursement','supplier','contractor','other') then raise exception 'Invalid disbursement type.'; end if;
 if amount is null or amount<=0 then raise exception 'Enter a valid amount.'; end if;
 if nullif(btrim(payload->>'payee_name'),'') is null or nullif(btrim(payload->>'description'),'') is null then raise exception 'Payee and description are required.'; end if;
 dnum:='DIS-'||to_char(now(),'YYYYMMDD')||'-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,6));
 insert into public.finance_disbursements(organization_id,project_id,disbursement_number,disbursement_type,payee_name,payee_reference,amount_etb,description,status)
 values(org,pid,dnum,dtype,btrim(payload->>'payee_name'),nullif(btrim(payload->>'payee_reference'),''),amount,btrim(payload->>'description'),'submitted') returning id into did;
 return jsonb_build_object('disbursement_id',did,'disbursement_number',dnum);
end $$;

create or replace function public.finance_disbursement_action(payload jsonb)
returns jsonb language plpgsql security definer set search_path=public,private,pg_temp as $$
declare d public.finance_disbursements%rowtype; act text:=payload->>'action';
begin
 if auth.uid() is null then raise exception 'Authentication required.'; end if;
 select * into d from public.finance_disbursements where id=(payload->>'disbursement_id')::uuid for update;
 if d.id is null or not private.can_manage_finance_org(d.organization_id) then raise exception 'Not authorized.'; end if;
 if act='approve' then
   if d.status<>'submitted' then raise exception 'Only submitted disbursements can be approved.'; end if;
   update public.finance_disbursements set status='approved',approved_by=auth.uid(),approved_at=now() where id=d.id;
 elsif act='pay' then
   if d.status<>'approved' then raise exception 'Approve the disbursement before payment.'; end if;
   if nullif(payload->>'account_id','') is null then raise exception 'Select a payment account.'; end if;
   update public.finance_disbursements set status='paid',account_id=(payload->>'account_id')::uuid,payment_method=coalesce(nullif(payload->>'payment_method',''),'bank_transfer'),bank_reference=nullif(payload->>'bank_reference',''),paid_by=auth.uid(),paid_at=now() where id=d.id;
   if d.project_id is not null then insert into public.financial_transactions(organization_id,project_id,type,amount,currency,description)
     values(d.organization_id,d.project_id,case when d.disbursement_type='commission' then 'commission'::public.financial_transaction_type else 'expense'::public.financial_transaction_type end,d.amount_etb,'ETB','Paid disbursement '||d.disbursement_number); end if;
 elsif act='reverse' then
   if d.status<>'paid' or nullif(btrim(payload->>'reason'),'') is null then raise exception 'Paid disbursements require a reversal reason.'; end if;
   update public.finance_disbursements set status='reversed',reversed_by=auth.uid(),reversed_at=now(),reversal_reason=btrim(payload->>'reason') where id=d.id;
 elsif act='cancel' then
   if d.status not in ('draft','submitted','approved') then raise exception 'This disbursement cannot be cancelled.'; end if;
   update public.finance_disbursements set status='cancelled' where id=d.id;
 else raise exception 'Invalid disbursement action.';
 end if;
 return jsonb_build_object('disbursement_id',d.id,'action',act);
end $$;

create or replace view public.finance_receivables with (security_invoker=true) as
select c.id contract_id,c.organization_id,c.project_id,c.customer_id,c.unit_id,c.contract_number,c.status contract_status,c.total_price_etb,
 sc.full_name customer_name,u.unit_number,p.name project_name,
 coalesce(sum(s.amount_etb),0)::numeric(18,2) scheduled_etb,
 coalesce(sum(s.paid_amount_etb),0)::numeric(18,2) paid_etb,
 (c.total_price_etb-coalesce(sum(s.paid_amount_etb),0))::numeric(18,2) outstanding_etb,
 min(s.due_date) filter(where s.status in ('scheduled','due','partially_paid','overdue')) next_due_date
from public.sales_contracts c join public.sales_customers sc on sc.id=c.customer_id join public.units u on u.id=c.unit_id join public.projects p on p.id=c.project_id
left join public.finance_payment_schedules s on s.contract_id=c.id
group by c.id,sc.full_name,u.unit_number,p.name;

create or replace view public.sales_contract_finance_summary as
select c.id contract_id,c.project_id,c.customer_id,c.unit_id,c.total_price_etb,
 coalesce(sum(fp.amount_etb) filter(where fp.status in ('verified','reconciled')),0)::numeric(18,2) paid_etb,
 (c.total_price_etb-coalesce(sum(fp.amount_etb) filter(where fp.status in ('verified','reconciled')),0))::numeric(18,2) outstanding_etb,
 min(fs.due_date) filter(where fs.status in ('scheduled','due','partially_paid','overdue')) next_due_date
from public.sales_contracts c left join public.finance_payments fp on fp.contract_id=c.id
left join public.finance_payment_schedules fs on fs.contract_id=c.id
where private.can_view_sales(c.project_id)
group by c.id;

revoke all on public.finance_receivables,public.sales_contract_finance_summary from anon;
grant select on public.finance_receivables,public.sales_contract_finance_summary to authenticated;

do $$
declare oid uuid; pid uuid;
begin
 select id into oid from public.organizations order by created_at limit 1;
 insert into public.finance_accounts(organization_id,code,name,account_type,bank_name,account_number) values
 (oid,'BANK-MAIN','Alet Main Bank Account','bank','Commercial Bank of Ethiopia','Configure account number'),
 (oid,'CASH-HQ','Cash on Hand','cash',null,null)
 on conflict(organization_id,code) do nothing;
 for pid in select id from public.projects loop
  insert into public.finance_commission_rules(organization_id,project_id,name,calculation_type,rate,eligibility_trigger,minimum_collection_percent,withholding_rate)
  select oid,pid,'Standard sales commission','percentage',2,'contract_signed',0,5
  where not exists(select 1 from public.finance_commission_rules where project_id=pid and name='Standard sales commission');
 end loop;
end $$;

do $$
declare t text;
begin
 foreach t in array array['finance_accounts','finance_payment_schedules','finance_payments','finance_payment_allocations','finance_receipts','finance_commission_rules','finance_commissions','finance_disbursements'] loop
  execute format('drop trigger if exists %I on public.%I','audit_'||t,t);
  execute format('create trigger %I after insert or update or delete on public.%I for each row execute function private.write_project_audit()','audit_'||t,t);
 end loop;
end $$;

create trigger finance_accounts_updated_at before update on public.finance_accounts for each row execute function private.sales_set_updated_at();
create trigger finance_schedules_updated_at before update on public.finance_payment_schedules for each row execute function private.sales_set_updated_at();
create trigger finance_payments_updated_at before update on public.finance_payments for each row execute function private.sales_set_updated_at();
create trigger finance_rules_updated_at before update on public.finance_commission_rules for each row execute function private.sales_set_updated_at();
create trigger finance_commissions_updated_at before update on public.finance_commissions for each row execute function private.sales_set_updated_at();
create trigger finance_disbursements_updated_at before update on public.finance_disbursements for each row execute function private.sales_set_updated_at();

revoke all on function public.generate_finance_schedule(jsonb),public.update_finance_installment(jsonb),public.record_finance_payment(jsonb),public.finance_payment_action(jsonb),public.calculate_finance_commission(jsonb),public.finance_commission_action(jsonb),public.create_finance_disbursement(jsonb),public.finance_disbursement_action(jsonb) from public,anon;
grant execute on function public.generate_finance_schedule(jsonb),public.update_finance_installment(jsonb),public.record_finance_payment(jsonb),public.finance_payment_action(jsonb),public.calculate_finance_commission(jsonb),public.finance_commission_action(jsonb),public.create_finance_disbursement(jsonb),public.finance_disbursement_action(jsonb) to authenticated;
