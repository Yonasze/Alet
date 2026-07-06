
drop policy if exists "project members can view ledger transactions" on public.financial_transactions;
create policy finance_ledger_read on public.financial_transactions for select to authenticated using(private.can_view_finance(project_id));
drop policy if exists "project members can view business events" on public.business_events;
create policy finance_business_events_read on public.business_events for select to authenticated using(private.can_view_finance(project_id) or private.can_view_sales(project_id));
grant select on public.financial_transactions,public.business_events to authenticated;
revoke all on public.financial_transactions,public.business_events from anon;
