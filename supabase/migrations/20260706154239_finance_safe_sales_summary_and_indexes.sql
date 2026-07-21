
drop view if exists public.sales_contract_finance_summary;
create table if not exists public.finance_contract_balances(
 contract_id uuid primary key references public.sales_contracts(id) on delete cascade,
 organization_id uuid not null references public.organizations(id) on delete cascade,
 project_id uuid not null references public.projects(id) on delete cascade,
 customer_id uuid not null references public.sales_customers(id) on delete cascade,
 unit_id uuid not null references public.units(id) on delete cascade,
 total_price_etb numeric(18,2) not null,
 paid_etb numeric(18,2) not null default 0,
 outstanding_etb numeric(18,2) not null,
 next_due_date date,
 refreshed_at timestamptz not null default now()
);
alter table public.finance_contract_balances enable row level security;
create policy finance_balances_read on public.finance_contract_balances for select to authenticated
using(private.can_view_sales(project_id) or private.can_view_finance(project_id));
revoke all on public.finance_contract_balances from anon,authenticated;
grant select on public.finance_contract_balances to authenticated;

create or replace function private.refresh_finance_contract_balance(target_contract uuid)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
 insert into public.finance_contract_balances(contract_id,organization_id,project_id,customer_id,unit_id,total_price_etb,paid_etb,outstanding_etb,next_due_date,refreshed_at)
 select c.id,c.organization_id,c.project_id,c.customer_id,c.unit_id,c.total_price_etb,
  coalesce((select sum(p.amount_etb) from public.finance_payments p where p.contract_id=c.id and p.status in ('verified','reconciled')),0),
  c.total_price_etb-coalesce((select sum(p.amount_etb) from public.finance_payments p where p.contract_id=c.id and p.status in ('verified','reconciled')),0),
  (select min(s.due_date) from public.finance_payment_schedules s where s.contract_id=c.id and s.status in ('scheduled','due','partially_paid','overdue')),
  now()
 from public.sales_contracts c where c.id=target_contract
 on conflict(contract_id) do update set paid_etb=excluded.paid_etb,outstanding_etb=excluded.outstanding_etb,next_due_date=excluded.next_due_date,total_price_etb=excluded.total_price_etb,refreshed_at=now();
end $$;

create or replace function private.refresh_finance_balance_trigger()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
 perform private.refresh_finance_contract_balance(coalesce(new.contract_id,old.contract_id));
 return coalesce(new,old);
end $$;
drop trigger if exists refresh_balance_from_schedule on public.finance_payment_schedules;
create trigger refresh_balance_from_schedule after insert or update or delete on public.finance_payment_schedules for each row execute function private.refresh_finance_balance_trigger();
drop trigger if exists refresh_balance_from_payment on public.finance_payments;
create trigger refresh_balance_from_payment after insert or update or delete on public.finance_payments for each row execute function private.refresh_finance_balance_trigger();

select private.refresh_finance_contract_balance(id) from public.sales_contracts;

create or replace view public.sales_contract_finance_summary with (security_invoker=true) as
select contract_id,project_id,customer_id,unit_id,total_price_etb,paid_etb,outstanding_etb,next_due_date
from public.finance_contract_balances;
revoke all on public.sales_contract_finance_summary from anon;
grant select on public.sales_contract_finance_summary to authenticated;

drop policy if exists finance_commissions_read on public.finance_commissions;
create policy finance_commissions_read on public.finance_commissions for select to authenticated
using(private.can_view_finance(project_id) or agent_user_id=(select auth.uid()));

create index if not exists finance_rules_created_by_idx on public.finance_commission_rules(created_by);
create index if not exists finance_rules_org_idx on public.finance_commission_rules(organization_id);
create index if not exists finance_rules_project_idx on public.finance_commission_rules(project_id);
create index if not exists finance_commissions_agent_idx on public.finance_commissions(agent_user_id);
create index if not exists finance_commissions_approved_by_idx on public.finance_commissions(approved_by);
create index if not exists finance_commissions_org_idx on public.finance_commissions(organization_id);
create index if not exists finance_commissions_rule_idx on public.finance_commissions(rule_id);
create index if not exists finance_disbursements_account_idx on public.finance_disbursements(account_id);
create index if not exists finance_disbursements_approved_by_idx on public.finance_disbursements(approved_by);
create index if not exists finance_disbursements_paid_by_idx on public.finance_disbursements(paid_by);
create index if not exists finance_disbursements_requested_by_idx on public.finance_disbursements(requested_by);
create index if not exists finance_disbursements_reversed_by_idx on public.finance_disbursements(reversed_by);
create index if not exists finance_allocations_org_idx on public.finance_payment_allocations(organization_id);
create index if not exists finance_allocations_project_idx on public.finance_payment_allocations(project_id);
create index if not exists finance_schedules_created_by_idx on public.finance_payment_schedules(created_by);
create index if not exists finance_schedules_org_idx on public.finance_payment_schedules(organization_id);
create index if not exists finance_payments_account_idx on public.finance_payments(account_id);
create index if not exists finance_payments_created_by_idx on public.finance_payments(created_by);
create index if not exists finance_payments_customer_idx on public.finance_payments(customer_id);
create index if not exists finance_payments_reconciled_by_idx on public.finance_payments(reconciled_by);
create index if not exists finance_payments_reversed_by_idx on public.finance_payments(reversed_by);
create index if not exists finance_payments_unit_idx on public.finance_payments(unit_id);
create index if not exists finance_payments_verified_by_idx on public.finance_payments(verified_by);
create index if not exists finance_receipts_issued_by_idx on public.finance_receipts(issued_by);
create index if not exists finance_receipts_voided_by_idx on public.finance_receipts(voided_by);
create index if not exists finance_balances_project_idx on public.finance_contract_balances(project_id);
create index if not exists finance_balances_customer_idx on public.finance_contract_balances(customer_id);
create index if not exists finance_balances_unit_idx on public.finance_contract_balances(unit_id);
create index if not exists finance_balances_org_idx on public.finance_contract_balances(organization_id);
