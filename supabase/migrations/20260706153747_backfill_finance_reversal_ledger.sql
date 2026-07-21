
insert into public.financial_transactions(organization_id,project_id,unit_id,type,amount,currency,description)
select p.organization_id,p.project_id,p.unit_id,'expense',p.amount_etb,'ETB','Reversal of customer payment '||p.payment_number
from public.finance_payments p
where p.status='reversed'
and not exists(select 1 from public.financial_transactions ft where ft.project_id=p.project_id and ft.description='Reversal of customer payment '||p.payment_number);
