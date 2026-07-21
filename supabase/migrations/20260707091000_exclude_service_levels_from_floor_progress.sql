create or replace function private.sync_project_floor_progress()
returns trigger language plpgsql security definer set search_path=public,private,pg_temp as $function$
declare target_project_id uuid;
begin
 target_project_id:=coalesce(new.project_id,old.project_id);
 update public.projects p
 set total_floors=summary.total_floors,floors_completed=summary.floors_completed
 from (
  select count(*) filter(where floor_number>0)::integer total_floors,
         count(*) filter(where floor_number>0 and is_completed)::integer floors_completed
  from public.project_floors where project_id=target_project_id
 ) summary
 where p.id=target_project_id;
 return coalesce(new,old);
end $function$;

update public.projects p
set total_floors=summary.total_floors,floors_completed=summary.floors_completed
from (
 select project_id,
        count(*) filter(where floor_number>0)::integer total_floors,
        count(*) filter(where floor_number>0 and is_completed)::integer floors_completed
 from public.project_floors group by project_id
) summary
where p.id=summary.project_id;

do $block$ declare project_row record; begin
 for project_row in select id from public.projects loop
  perform private.refresh_public_project(project_row.id);
 end loop;
end $block$;
