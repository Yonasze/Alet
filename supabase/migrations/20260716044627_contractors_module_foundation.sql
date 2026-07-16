create sequence if not exists public.contractor_seq;
create sequence if not exists public.contractor_contract_seq;
create sequence if not exists public.contractor_claim_seq;

create table if not exists public.contractors(
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete cascade,
 supplier_id uuid references public.procurement_suppliers(id) on delete set null,
 contractor_code text not null,
 legal_name text not null,
 trade_name text,
 contractor_type text not null default 'general' check(contractor_type in('general','specialist','subcontractor','consultant','labor_only','equipment')),
 specialization text,
 tax_id text,
 license_number text,
 license_class text,
 contact_person text,
 phone text,
 email text,
 address text,
 bank_name text,
 bank_account text,
 status text not null default 'draft' check(status in('draft','submitted','approved','rejected','suspended','inactive')),
 prequalification_score numeric(5,2) check(prequalification_score is null or(prequalification_score>=0 and prequalification_score<=100)),
 approved_by uuid references auth.users(id) on delete set null,
 approved_at timestamptz,
 rejection_reason text,
 created_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(organization_id,contractor_code),
 unique(organization_id,legal_name)
);

create table if not exists public.contractor_contracts(
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete cascade,
 project_id uuid not null references public.projects(id) on delete cascade,
 contractor_id uuid not null references public.contractors(id) on delete restrict,
 work_package_id uuid references public.construction_work_packages(id) on delete set null,
 contract_number text not null,
 title text not null,
 scope_of_work text not null,
 contract_type text not null default 'lump_sum' check(contract_type in('lump_sum','unit_rate','cost_plus','labor_only','design_build','consultancy')),
 contract_value_etb numeric(18,2) not null check(contract_value_etb>0),
 retention_rate numeric(5,2) not null default 5 check(retention_rate>=0 and retention_rate<=20),
 advance_payment_etb numeric(18,2) not null default 0 check(advance_payment_etb>=0),
 start_date date,
 end_date date,
 status text not null default 'draft' check(status in('draft','approved','active','suspended','completed','terminated')),
 approved_by uuid references auth.users(id) on delete set null,
 approved_at timestamptz,
 activated_at timestamptz,
 completed_at timestamptz,
 termination_reason text,
 created_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(project_id,contract_number)
);

create table if not exists public.contractor_compliance_documents(
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete cascade,
 contractor_id uuid not null references public.contractors(id) on delete cascade,
 project_id uuid references public.projects(id) on delete cascade,
 document_type text not null check(document_type in('business_license','contractor_license','tax_clearance','insurance','performance_bond','advance_guarantee','safety_certificate','other')),
 reference_number text,
 issued_date date,
 expiry_date date,
 status text not null default 'valid' check(status in('valid','expiring','expired','rejected')),
 notes text,
 verified_by uuid references auth.users(id) on delete set null,
 verified_at timestamptz not null default now(),
 created_at timestamptz not null default now()
);

create table if not exists public.contractor_progress_claims(
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete cascade,
 project_id uuid not null references public.projects(id) on delete cascade,
 contract_id uuid not null references public.contractor_contracts(id) on delete restrict,
 claim_number text not null,
 period_start date,
 period_end date,
 work_progress_percent numeric(5,2) not null check(work_progress_percent>=0 and work_progress_percent<=100),
 gross_amount_etb numeric(18,2) not null check(gross_amount_etb>0),
 retention_amount_etb numeric(18,2) not null default 0 check(retention_amount_etb>=0),
 other_deductions_etb numeric(18,2) not null default 0 check(other_deductions_etb>=0),
 net_amount_etb numeric(18,2) not null check(net_amount_etb>0),
 description text,
 status text not null default 'draft' check(status in('draft','submitted','certified','payment_requested','paid','rejected','cancelled','payment_reversed')),
 submitted_by uuid references auth.users(id) on delete set null,
 submitted_at timestamptz,
 certified_by uuid references auth.users(id) on delete set null,
 certified_at timestamptz,
 finance_disbursement_id uuid references public.finance_disbursements(id) on delete set null,
 paid_at timestamptz,
 rejection_reason text,
 created_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(project_id,claim_number)
);

create table if not exists public.contractor_evaluations(
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete cascade,
 project_id uuid not null references public.projects(id) on delete cascade,
 contractor_id uuid not null references public.contractors(id) on delete cascade,
 contract_id uuid references public.contractor_contracts(id) on delete set null,
 evaluation_date date not null default current_date,
 quality_score numeric(3,2) not null check(quality_score>=1 and quality_score<=5),
 schedule_score numeric(3,2) not null check(schedule_score>=1 and schedule_score<=5),
 safety_score numeric(3,2) not null check(safety_score>=1 and safety_score<=5),
 commercial_score numeric(3,2) not null check(commercial_score>=1 and commercial_score<=5),
 overall_score numeric(3,2) generated always as((quality_score+schedule_score+safety_score+commercial_score)/4) stored,
 strengths text,
 concerns text,
 recommendation text not null default 'retain' check(recommendation in('preferred','retain','improvement_plan','suspend','do_not_use')),
 evaluated_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now()
);

create index if not exists contractors_org_status_idx on public.contractors(organization_id,status);
create index if not exists contractors_supplier_idx on public.contractors(supplier_id);
create index if not exists contractor_contracts_project_status_idx on public.contractor_contracts(project_id,status);
create index if not exists contractor_contracts_contractor_idx on public.contractor_contracts(contractor_id);
create index if not exists contractor_contracts_work_package_idx on public.contractor_contracts(work_package_id);
create index if not exists contractor_compliance_contractor_expiry_idx on public.contractor_compliance_documents(contractor_id,expiry_date);
create index if not exists contractor_compliance_project_idx on public.contractor_compliance_documents(project_id);
create index if not exists contractor_claims_contract_status_idx on public.contractor_progress_claims(contract_id,status);
create index if not exists contractor_claims_project_created_idx on public.contractor_progress_claims(project_id,created_at desc);
create index if not exists contractor_claims_disbursement_idx on public.contractor_progress_claims(finance_disbursement_id);
create index if not exists contractor_evaluations_contractor_date_idx on public.contractor_evaluations(contractor_id,evaluation_date desc);
create index if not exists contractor_evaluations_project_idx on public.contractor_evaluations(project_id);

create or replace function private.can_view_contractors(target_project_id uuid default null)
returns boolean language sql stable security definer set search_path=public,pg_temp as $function$
 select private.current_organization_id() is not null and private.has_project_role(array['admin','project_manager','procurement','finance','engineer'],target_project_id)
$function$;
create or replace function private.can_manage_contractors(target_project_id uuid default null)
returns boolean language sql stable security definer set search_path=public,pg_temp as $function$
 select private.current_organization_id() is not null and private.has_project_role(array['admin','project_manager','procurement'],target_project_id)
$function$;
create or replace function private.can_certify_contractor_claim(target_project_id uuid)
returns boolean language sql stable security definer set search_path=public,pg_temp as $function$
 select private.current_organization_id() is not null and private.has_project_role(array['admin','project_manager','engineer'],target_project_id)
$function$;
create or replace function private.contractor_touch_updated_at()
returns trigger language plpgsql set search_path=pg_catalog,pg_temp as $function$
begin new.updated_at=now();return new;end $function$;

drop trigger if exists contractors_touch_updated_at on public.contractors;
create trigger contractors_touch_updated_at before update on public.contractors for each row execute function private.contractor_touch_updated_at();
drop trigger if exists contractor_contracts_touch_updated_at on public.contractor_contracts;
create trigger contractor_contracts_touch_updated_at before update on public.contractor_contracts for each row execute function private.contractor_touch_updated_at();
drop trigger if exists contractor_claims_touch_updated_at on public.contractor_progress_claims;
create trigger contractor_claims_touch_updated_at before update on public.contractor_progress_claims for each row execute function private.contractor_touch_updated_at();

alter table public.contractors enable row level security;
alter table public.contractor_contracts enable row level security;
alter table public.contractor_compliance_documents enable row level security;
alter table public.contractor_progress_claims enable row level security;
alter table public.contractor_evaluations enable row level security;

drop policy if exists contractors_read on public.contractors;
create policy contractors_read on public.contractors for select to authenticated using(organization_id=private.current_organization_id() and private.can_view_contractors(null));
drop policy if exists contractor_contracts_read on public.contractor_contracts;
create policy contractor_contracts_read on public.contractor_contracts for select to authenticated using(organization_id=private.current_organization_id() and private.can_view_contractors(project_id));
drop policy if exists contractor_compliance_read on public.contractor_compliance_documents;
create policy contractor_compliance_read on public.contractor_compliance_documents for select to authenticated using(organization_id=private.current_organization_id() and private.can_view_contractors(project_id));
drop policy if exists contractor_claims_read on public.contractor_progress_claims;
create policy contractor_claims_read on public.contractor_progress_claims for select to authenticated using(organization_id=private.current_organization_id() and private.can_view_contractors(project_id));
drop policy if exists contractor_evaluations_read on public.contractor_evaluations;
create policy contractor_evaluations_read on public.contractor_evaluations for select to authenticated using(organization_id=private.current_organization_id() and private.can_view_contractors(project_id));

create or replace function public.create_contractor(payload jsonb)
returns jsonb language plpgsql security definer set search_path=public,private,pg_temp as $function$
declare org uuid:=private.current_organization_id();cid uuid;code text;sid uuid:=nullif(payload->>'supplier_id','')::uuid;
begin
 if auth.uid() is null or org is null or not private.can_manage_contractors(null) then raise exception 'Not authorized.';end if;
 if nullif(btrim(payload->>'legal_name'),'') is null then raise exception 'Legal name is required.';end if;
 if sid is not null and not exists(select 1 from public.procurement_suppliers where id=sid and organization_id=org) then raise exception 'Choose a supplier from your organization.';end if;
 code:=coalesce(nullif(upper(btrim(payload->>'contractor_code')),''),'CTR-'||lpad(nextval('public.contractor_seq')::text,5,'0'));
 insert into public.contractors(organization_id,supplier_id,contractor_code,legal_name,trade_name,contractor_type,specialization,tax_id,license_number,license_class,contact_person,phone,email,address,bank_name,bank_account,created_by)
 values(org,sid,code,btrim(payload->>'legal_name'),nullif(btrim(payload->>'trade_name'),''),coalesce(nullif(payload->>'contractor_type',''),'general'),nullif(btrim(payload->>'specialization'),''),nullif(btrim(payload->>'tax_id'),''),nullif(btrim(payload->>'license_number'),''),nullif(btrim(payload->>'license_class'),''),nullif(btrim(payload->>'contact_person'),''),nullif(btrim(payload->>'phone'),''),nullif(btrim(payload->>'email'),''),nullif(btrim(payload->>'address'),''),nullif(btrim(payload->>'bank_name'),''),nullif(btrim(payload->>'bank_account'),''),auth.uid()) returning id into cid;
 return jsonb_build_object('contractor_id',cid,'contractor_code',code);
end $function$;

create or replace function public.contractor_action(payload jsonb)
returns jsonb language plpgsql security definer set search_path=public,private,pg_temp as $function$
declare c public.contractors%rowtype;act text:=payload->>'action';next_status text;score numeric:=nullif(payload->>'score','')::numeric;
begin
 select * into c from public.contractors where id=(payload->>'contractor_id')::uuid for update;
 if c.id is null or not private.can_manage_contractors(null) then raise exception 'Not authorized.';end if;
 if act='submit' and c.status='draft' then next_status:='submitted';
 elsif act='approve' and c.status='submitted' then
  if score is null or score<0 or score>100 then raise exception 'Enter a prequalification score from 0 to 100.';end if;
  next_status:='approved';
 elsif act='reject' and c.status='submitted' then next_status:='rejected';
 elsif act='suspend' and c.status='approved' then next_status:='suspended';
 elsif act='reinstate' and c.status='suspended' then next_status:='approved';
 elsif act='deactivate' and c.status in('approved','suspended') then next_status:='inactive';
 else raise exception 'Invalid contractor action or status.';end if;
 update public.contractors set status=next_status,
  prequalification_score=case when next_status='approved' and score is not null then score else prequalification_score end,
  approved_by=case when next_status='approved' then auth.uid() else approved_by end,
  approved_at=case when next_status='approved' then now() else approved_at end,
  rejection_reason=case when next_status='rejected' then coalesce(nullif(btrim(payload->>'comments'),''),'Rejected') else null end
 where id=c.id;
 return jsonb_build_object('contractor_id',c.id,'status',next_status);
end $function$;

create or replace function public.create_contractor_contract(payload jsonb)
returns jsonb language plpgsql security definer set search_path=public,private,pg_temp as $function$
declare org uuid:=private.current_organization_id();pid uuid:=nullif(payload->>'project_id','')::uuid;cid uuid:=nullif(payload->>'contractor_id','')::uuid;wid uuid:=nullif(payload->>'work_package_id','')::uuid;idout uuid;num text;value numeric:=nullif(payload->>'contract_value_etb','')::numeric;
begin
 if auth.uid() is null or not private.can_manage_contractors(pid) then raise exception 'Not authorized.';end if;
 if not exists(select 1 from public.contractors where id=cid and organization_id=org and status='approved') then raise exception 'Choose an approved contractor.';end if;
 if wid is not null and not exists(select 1 from public.construction_work_packages where id=wid and project_id=pid) then raise exception 'Work package does not belong to this project.';end if;
 if nullif(btrim(payload->>'title'),'') is null or nullif(btrim(payload->>'scope_of_work'),'') is null or value is null or value<=0 then raise exception 'Title, scope and contract value are required.';end if;
 num:=coalesce(nullif(upper(btrim(payload->>'contract_number')),''),'CON-'||to_char(current_date,'YYYY')||'-'||lpad(nextval('public.contractor_contract_seq')::text,5,'0'));
 insert into public.contractor_contracts(organization_id,project_id,contractor_id,work_package_id,contract_number,title,scope_of_work,contract_type,contract_value_etb,retention_rate,advance_payment_etb,start_date,end_date,created_by)
 values(org,pid,cid,wid,num,btrim(payload->>'title'),btrim(payload->>'scope_of_work'),coalesce(nullif(payload->>'contract_type',''),'lump_sum'),value,coalesce(nullif(payload->>'retention_rate','')::numeric,5),coalesce(nullif(payload->>'advance_payment_etb','')::numeric,0),nullif(payload->>'start_date','')::date,nullif(payload->>'end_date','')::date,auth.uid()) returning id into idout;
 return jsonb_build_object('contract_id',idout,'contract_number',num);
end $function$;

create or replace function public.contractor_contract_action(payload jsonb)
returns jsonb language plpgsql security definer set search_path=public,private,pg_temp as $function$
declare c public.contractor_contracts%rowtype;ctr public.contractors%rowtype;act text:=payload->>'action';next_status text;
begin
 select * into c from public.contractor_contracts where id=(payload->>'contract_id')::uuid for update;
 if c.id is null or not private.can_manage_contractors(c.project_id) then raise exception 'Not authorized.';end if;
 select * into ctr from public.contractors where id=c.contractor_id;
 if act='approve' and c.status='draft' then next_status:='approved';
 elsif act='activate' and c.status='approved' then next_status:='active';
 elsif act='suspend' and c.status='active' then next_status:='suspended';
 elsif act='resume' and c.status='suspended' then next_status:='active';
 elsif act='complete' and c.status='active' then next_status:='completed';
 elsif act='terminate' and c.status in('approved','active','suspended') then next_status:='terminated';
 else raise exception 'Invalid contract action or status.';end if;
 update public.contractor_contracts set status=next_status,
  approved_by=case when next_status='approved' then auth.uid() else approved_by end,
  approved_at=case when next_status='approved' then now() else approved_at end,
  activated_at=case when next_status='active' and activated_at is null then now() else activated_at end,
  completed_at=case when next_status='completed' then now() else completed_at end,
  termination_reason=case when next_status='terminated' then coalesce(nullif(btrim(payload->>'comments'),''),'Terminated') else termination_reason end
 where id=c.id;
 if c.work_package_id is not null and next_status='active' then update public.construction_work_packages set contractor_name=ctr.legal_name where id=c.work_package_id;end if;
 return jsonb_build_object('contract_id',c.id,'status',next_status);
end $function$;

create or replace function public.record_contractor_compliance(payload jsonb)
returns jsonb language plpgsql security definer set search_path=public,private,pg_temp as $function$
declare org uuid:=private.current_organization_id();cid uuid:=nullif(payload->>'contractor_id','')::uuid;pid uuid:=nullif(payload->>'project_id','')::uuid;did uuid;exp date:=nullif(payload->>'expiry_date','')::date;doc_status text;
begin
 if auth.uid() is null or not private.can_manage_contractors(pid) then raise exception 'Not authorized.';end if;
 if not exists(select 1 from public.contractors where id=cid and organization_id=org) then raise exception 'Choose a valid contractor.';end if;
 if nullif(payload->>'document_type','') is null then raise exception 'Document type is required.';end if;
 doc_status:=case when exp is null then 'valid' when exp<current_date then 'expired' when exp<=current_date+30 then 'expiring' else 'valid' end;
 insert into public.contractor_compliance_documents(organization_id,contractor_id,project_id,document_type,reference_number,issued_date,expiry_date,status,notes,verified_by)
 values(org,cid,pid,payload->>'document_type',nullif(btrim(payload->>'reference_number'),''),nullif(payload->>'issued_date','')::date,exp,doc_status,nullif(btrim(payload->>'notes'),''),auth.uid()) returning id into did;
 return jsonb_build_object('document_id',did,'status',doc_status);
end $function$;

create or replace function public.create_contractor_claim(payload jsonb)
returns jsonb language plpgsql security definer set search_path=public,private,pg_temp as $function$
declare c public.contractor_contracts%rowtype;idout uuid;num text;gross numeric:=nullif(payload->>'gross_amount_etb','')::numeric;ded numeric:=coalesce(nullif(payload->>'other_deductions_etb','')::numeric,0);ret numeric;net numeric;claimed numeric;
begin
 select * into c from public.contractor_contracts where id=(payload->>'contract_id')::uuid;
 if c.id is null or not private.can_manage_contractors(c.project_id) then raise exception 'Not authorized.';end if;
 if c.status<>'active' then raise exception 'Contract must be active before recording a claim.';end if;
 if gross is null or gross<=0 then raise exception 'Claim amount must be positive.';end if;
 select coalesce(sum(gross_amount_etb),0) into claimed from public.contractor_progress_claims where contract_id=c.id and status not in('rejected','cancelled');
 if claimed+gross>c.contract_value_etb then raise exception 'Cumulative claims cannot exceed contract value.';end if;
 ret:=round(gross*c.retention_rate/100,2);net:=gross-ret-ded;if net<=0 then raise exception 'Deductions must be less than the gross claim.';end if;
 num:='CLM-'||to_char(current_date,'YYYY')||'-'||lpad(nextval('public.contractor_claim_seq')::text,5,'0');
 insert into public.contractor_progress_claims(organization_id,project_id,contract_id,claim_number,period_start,period_end,work_progress_percent,gross_amount_etb,retention_amount_etb,other_deductions_etb,net_amount_etb,description,created_by)
 values(c.organization_id,c.project_id,c.id,num,nullif(payload->>'period_start','')::date,nullif(payload->>'period_end','')::date,coalesce(nullif(payload->>'work_progress_percent','')::numeric,0),gross,ret,ded,net,nullif(btrim(payload->>'description'),''),auth.uid()) returning id into idout;
 return jsonb_build_object('claim_id',idout,'claim_number',num,'net_amount_etb',net);
end $function$;

create or replace function public.contractor_claim_action(payload jsonb)
returns jsonb language plpgsql security definer set search_path=public,private,pg_temp as $function$
declare cl public.contractor_progress_claims%rowtype;c public.contractor_contracts%rowtype;ctr public.contractors%rowtype;act text:=payload->>'action';next_status text;did uuid;dnum text;
begin
 select * into cl from public.contractor_progress_claims where id=(payload->>'claim_id')::uuid for update;
 if cl.id is null then raise exception 'Claim not found.';end if;
 select * into c from public.contractor_contracts where id=cl.contract_id;select * into ctr from public.contractors where id=c.contractor_id;
 if act='submit' and cl.status='draft' and private.can_manage_contractors(cl.project_id) then next_status:='submitted';
 elsif act='certify' and cl.status='submitted' and private.can_certify_contractor_claim(cl.project_id) then next_status:='certified';
 elsif act='request_payment' and cl.status='certified' and private.can_manage_contractors(cl.project_id) then
  dnum:='DIS-'||to_char(now(),'YYYYMMDD')||'-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,6));
  insert into public.finance_disbursements(organization_id,project_id,disbursement_number,disbursement_type,payee_name,payee_reference,amount_etb,description,status,requested_by)
  values(cl.organization_id,cl.project_id,dnum,'contractor',ctr.legal_name,cl.claim_number,cl.net_amount_etb,'Contractor claim '||cl.claim_number||' for '||c.contract_number,'submitted',auth.uid()) returning id into did;
  next_status:='payment_requested';
 elsif act='reject' and cl.status in('submitted','certified') and (private.can_manage_contractors(cl.project_id) or private.can_certify_contractor_claim(cl.project_id)) then next_status:='rejected';
 elsif act='cancel' and cl.status in('draft','submitted') and private.can_manage_contractors(cl.project_id) then next_status:='cancelled';
 else raise exception 'Invalid claim action or status.';end if;
 update public.contractor_progress_claims set status=next_status,
  submitted_by=case when next_status='submitted' then auth.uid() else submitted_by end,
  submitted_at=case when next_status='submitted' then now() else submitted_at end,
  certified_by=case when next_status='certified' then auth.uid() else certified_by end,
  certified_at=case when next_status='certified' then now() else certified_at end,
  finance_disbursement_id=coalesce(did,finance_disbursement_id),
  rejection_reason=case when next_status='rejected' then coalesce(nullif(btrim(payload->>'comments'),''),'Rejected') else rejection_reason end
 where id=cl.id;
 return jsonb_build_object('claim_id',cl.id,'status',next_status,'finance_disbursement_id',did,'disbursement_number',dnum);
end $function$;

create or replace function public.record_contractor_evaluation(payload jsonb)
returns jsonb language plpgsql security definer set search_path=public,private,pg_temp as $function$
declare org uuid:=private.current_organization_id();pid uuid:=nullif(payload->>'project_id','')::uuid;cid uuid:=nullif(payload->>'contractor_id','')::uuid;conid uuid:=nullif(payload->>'contract_id','')::uuid;eid uuid;
begin
 if auth.uid() is null or not private.can_certify_contractor_claim(pid) then raise exception 'Not authorized.';end if;
 if not exists(select 1 from public.contractors where id=cid and organization_id=org) then raise exception 'Choose a valid contractor.';end if;
 if conid is not null and not exists(select 1 from public.contractor_contracts where id=conid and contractor_id=cid and project_id=pid) then raise exception 'Contract does not match contractor and project.';end if;
 insert into public.contractor_evaluations(organization_id,project_id,contractor_id,contract_id,evaluation_date,quality_score,schedule_score,safety_score,commercial_score,strengths,concerns,recommendation,evaluated_by)
 values(org,pid,cid,conid,coalesce(nullif(payload->>'evaluation_date','')::date,current_date),(payload->>'quality_score')::numeric,(payload->>'schedule_score')::numeric,(payload->>'safety_score')::numeric,(payload->>'commercial_score')::numeric,nullif(btrim(payload->>'strengths'),''),nullif(btrim(payload->>'concerns'),''),coalesce(nullif(payload->>'recommendation',''),'retain'),auth.uid()) returning id into eid;
 return jsonb_build_object('evaluation_id',eid);
end $function$;

create or replace function private.sync_contractor_claim_payment()
returns trigger language plpgsql security definer set search_path=public,private,pg_temp as $function$
begin
 if new.status='paid' and old.status is distinct from new.status then update public.contractor_progress_claims set status='paid',paid_at=now() where finance_disbursement_id=new.id and status='payment_requested';
 elsif new.status='reversed' and old.status is distinct from new.status then update public.contractor_progress_claims set status='payment_reversed' where finance_disbursement_id=new.id and status='paid';end if;
 return new;
end $function$;
drop trigger if exists finance_disbursement_sync_contractor_claim on public.finance_disbursements;
create trigger finance_disbursement_sync_contractor_claim after update of status on public.finance_disbursements for each row execute function private.sync_contractor_claim_payment();

do $block$
declare f text;
begin
 foreach f in array array['create_contractor','contractor_action','create_contractor_contract','contractor_contract_action','record_contractor_compliance','create_contractor_claim','contractor_claim_action','record_contractor_evaluation'] loop
  execute format('revoke all on function public.%I(jsonb) from public,anon',f);
  execute format('grant execute on function public.%I(jsonb) to authenticated',f);
 end loop;
end $block$;