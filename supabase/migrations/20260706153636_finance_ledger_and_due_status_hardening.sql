
create or replace view public.sales_contract_finance_summary as
select c.id contract_id,c.project_id,c.customer_id,c.unit_id,c.total_price_etb,
 coalesce(paid.total_paid,0)::numeric(18,2) paid_etb,
 (c.total_price_etb-coalesce(paid.total_paid,0))::numeric(18,2) outstanding_etb,
 due.next_due_date
from public.sales_contracts c
left join lateral (
 select sum(fp.amount_etb) total_paid from public.finance_payments fp
 where fp.contract_id=c.id and fp.status in ('verified','reconciled')
) paid on true
left join lateral (
 select min(fs.due_date) next_due_date from public.finance_payment_schedules fs
 where fs.contract_id=c.id and fs.status in ('scheduled','due','partially_paid','overdue')
) due on true
where private.can_view_sales(c.project_id);

revoke all on public.sales_contract_finance_summary from anon;
grant select on public.sales_contract_finance_summary to authenticated;

create or replace function private.post_finance_payment_reversal()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if new.status='reversed' and old.status<>'reversed' then
  insert into public.financial_transactions(organization_id,project_id,unit_id,type,amount,currency,description)
  values(new.organization_id,new.project_id,new.unit_id,'expense',new.amount_etb,'ETB','Reversal of customer payment '||new.payment_number);
 end if;
 return new;
end $$;
drop trigger if exists finance_payment_reversal_ledger on public.finance_payments;
create trigger finance_payment_reversal_ledger after update on public.finance_payments for each row execute function private.post_finance_payment_reversal();

create or replace function public.refresh_finance_due_statuses()
returns integer language plpgsql security definer set search_path=public,pg_temp as $$
declare changed integer;
begin
 update public.finance_payment_schedules
 set status=case when paid_amount_etb>=amount_etb then 'paid' when paid_amount_etb>0 then 'partially_paid' when due_date<current_date then 'overdue' when due_date=current_date then 'due' else 'scheduled' end,
 updated_at=now()
 where status<>'cancelled';
 get diagnostics changed=row_count;
 return changed;
end $$;
revoke all on function public.refresh_finance_due_statuses() from public,anon,authenticated;
grant execute on function public.refresh_finance_due_statuses() to service_role;

do $$
declare jid bigint;
begin
 select jobid into jid from cron.job where jobname='refresh-finance-due-statuses';
 if jid is not null then perform cron.unschedule(jid); end if;
 perform cron.schedule('refresh-finance-due-statuses','15 * * * *','select public.refresh_finance_due_statuses();');
end $$;
