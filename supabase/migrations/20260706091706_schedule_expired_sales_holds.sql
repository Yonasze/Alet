
create or replace function public.expire_sales_holds()
returns integer
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  item record;
  expired_count integer := 0;
begin
  for item in
    update public.sales_reservations
    set status='expired',updated_at=now()
    where status='on_hold' and hold_expires_at < now()
    returning unit_id,lead_id,opportunity_id
  loop
    update public.units set status='available' where id=item.unit_id;
    update public.sales_leads set stage='qualified' where id=item.lead_id;
    update public.sales_opportunities set stage='qualified',unit_id=null,probability_percent=25 where id=item.opportunity_id;
    expired_count := expired_count + 1;
  end loop;
  return expired_count;
end
$$;

revoke all on function public.expire_sales_holds() from public, anon, authenticated;
grant execute on function public.expire_sales_holds() to service_role;

create extension if not exists pg_cron with schema pg_catalog;
do $$
declare existing_job bigint;
begin
  select jobid into existing_job from cron.job where jobname='expire-sales-holds';
  if existing_job is not null then perform cron.unschedule(existing_job); end if;
  perform cron.schedule('expire-sales-holds','*/5 * * * *','select public.expire_sales_holds();');
end
$$;
