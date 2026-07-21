alter table public.projects add column if not exists basement_floors integer not null default 0;
alter table public.projects drop constraint if exists projects_basement_floors_check;
alter table public.projects add constraint projects_basement_floors_check check (basement_floors between 0 and 20);

alter table public.project_floors drop constraint if exists project_floors_floor_kind_check;
alter table public.project_floors add constraint project_floors_floor_kind_check
  check (floor_kind in ('typical','special','basement','ground'));

create or replace function private.ensure_project_service_floors(target_project_id uuid,target_basement_floors integer)
returns void language plpgsql security definer set search_path=public,private,pg_temp as $function$
declare target_project public.projects%rowtype; basement_level integer;
begin
 select * into target_project from public.projects where id=target_project_id for update;
 if target_project.id is null then raise exception 'Project not found'; end if;
 if target_basement_floors<0 or target_basement_floors>20 then raise exception 'Basement levels must be between 0 and 20'; end if;
 if exists(
  select 1 from public.project_floors floor where floor.project_id=target_project_id and floor.floor_number < -target_basement_floors
  and (exists(select 1 from public.units unit where unit.project_floor_id=floor.id)
    or exists(select 1 from public.construction_work_packages package where package.floor_id=floor.id)
    or exists(select 1 from public.construction_issues issue where issue.floor_id=floor.id))
 ) then raise exception 'A basement containing units or Construction records cannot be removed'; end if;
 delete from public.project_floors where project_id=target_project_id and floor_number < -target_basement_floors;
 insert into public.project_floors(organization_id,project_id,floor_number,name,floor_kind,template_id,is_completed,completed_at,sequence)
 values(target_project.organization_id,target_project_id,0,'Ground Floor','ground',null,false,null,0)
 on conflict(project_id,floor_number) do update set name='Ground Floor',sequence=0,
 floor_kind=case when public.project_floors.template_id is null then 'ground' else public.project_floors.floor_kind end;
 if target_basement_floors>0 then
  for basement_level in 1..target_basement_floors loop
   insert into public.project_floors(organization_id,project_id,floor_number,name,floor_kind,template_id,is_completed,completed_at,sequence)
   values(target_project.organization_id,target_project_id,-basement_level,'Basement '||basement_level,'basement',null,false,null,-basement_level)
   on conflict(project_id,floor_number) do update set name='Basement '||basement_level,sequence=-basement_level,
   floor_kind=case when public.project_floors.template_id is null then 'basement' else public.project_floors.floor_kind end;
  end loop;
 end if;
end $function$;
revoke all on function private.ensure_project_service_floors(uuid,integer) from public,anon,authenticated;

do $block$ begin
 if to_regprocedure('public.create_project_from_wizard_core(jsonb)') is null then
  alter function public.create_project_from_wizard(jsonb) rename to create_project_from_wizard_core;
 end if;
 if to_regprocedure('public.update_project_from_workspace_core(jsonb)') is null then
  alter function public.update_project_from_workspace(jsonb) rename to update_project_from_workspace_core;
 end if;
end $block$;
revoke all on function public.create_project_from_wizard_core(jsonb) from public,anon,authenticated;
revoke all on function public.update_project_from_workspace_core(jsonb) from public,anon,authenticated;

create or replace function public.create_project_from_wizard(payload jsonb)
returns jsonb language plpgsql security definer set search_path=public,private,pg_temp as $function$
declare result jsonb; basement_count integer:=coalesce(nullif(payload->>'basement_floors','')::integer,0); target_project_id uuid;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if basement_count<0 or basement_count>20 then raise exception 'Basement levels must be between 0 and 20'; end if;
 result:=public.create_project_from_wizard_core(payload);
 target_project_id:=(result->>'project_id')::uuid;
 update public.projects set basement_floors=basement_count,updated_at=now() where id=target_project_id;
 perform private.ensure_project_service_floors(target_project_id,basement_count);
 return result||jsonb_build_object('basement_floors',basement_count);
end $function$;

create or replace function public.update_project_from_workspace(payload jsonb)
returns jsonb language plpgsql security definer set search_path=public,private,pg_temp as $function$
declare result jsonb; target_project_id uuid:=nullif(payload->>'project_id','')::uuid; basement_count integer;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 select coalesce(nullif(payload->>'basement_floors','')::integer,projects.basement_floors) into basement_count from public.projects where id=target_project_id;
 if basement_count is null then raise exception 'Project not found'; end if;
 if basement_count<0 or basement_count>20 then raise exception 'Basement levels must be between 0 and 20'; end if;
 result:=public.update_project_from_workspace_core(payload);
 update public.projects set basement_floors=basement_count,updated_at=now() where id=target_project_id;
 perform private.ensure_project_service_floors(target_project_id,basement_count);
 return result||jsonb_build_object('basement_floors',basement_count);
end $function$;

revoke all on function public.create_project_from_wizard(jsonb) from public,anon;
revoke all on function public.update_project_from_workspace(jsonb) from public,anon;
grant execute on function public.create_project_from_wizard(jsonb) to authenticated;
grant execute on function public.update_project_from_workspace(jsonb) to authenticated;

create or replace function public.construction_milestone_action(payload jsonb)
returns jsonb language plpgsql security definer set search_path=public,private,pg_temp as $function$
declare m public.construction_milestones%rowtype;act text:=payload->>'action';pmid uuid;floor_count int;
begin
 if auth.uid() is null then raise exception 'Authentication required.'; end if;
 select * into m from public.construction_milestones where id=(payload->>'milestone_id')::uuid for update;
 if m.id is null or not private.can_manage_construction(m.project_id) then raise exception 'Not authorized.'; end if;
 if act='submit' and m.status in ('active','rejected','draft') then
  update public.construction_milestones set status='awaiting_approval',progress_percent=100,submitted_by=auth.uid(),submitted_at=now(),rejection_reason=null where id=m.id;
 elsif act='approve' and m.status='awaiting_approval' and private.can_approve_construction(m.project_id) then
  floor_count:=coalesce((select count(*) from public.project_floors where project_id=m.project_id and is_completed and floor_number>0),0);
  insert into public.project_milestones(organization_id,project_id,phase,title,description,progress_percent,floors_completed,total_floors,target_date,completed_at,is_public,created_by)
  select m.organization_id,m.project_id,m.phase,m.title,coalesce(m.public_summary,m.description),100,floor_count,p.total_floors,m.planned_date,now(),m.public_on_approval,auth.uid() from public.projects p where p.id=m.project_id returning id into pmid;
  update public.construction_milestones set status='approved',progress_percent=100,approved_by=auth.uid(),approved_at=now(),project_milestone_id=pmid where id=m.id;
  update public.projects set phase=m.phase,floors_completed=floor_count where id=m.project_id;
  insert into public.business_events(organization_id,project_id,type,reference_type,reference_id,payload)
  values(m.organization_id,m.project_id,'CONSTRUCTION_MILESTONE_APPROVED','construction_milestone',m.id,jsonb_build_object('code',m.code,'title',m.title,'phase',m.phase,'finance_trigger',m.finance_trigger));
  if m.finance_trigger then update public.finance_payment_schedules set status='due',due_date=coalesce(due_date,current_date)
   where project_id=m.project_id and trigger_type='construction_milestone' and status in('scheduled','overdue')
   and(lower(coalesce(milestone_reference,''))=lower(m.title) or lower(label)=lower(m.title) or lower(m.title) like '%'||lower(coalesce(milestone_reference,''))||'%'); end if;
  perform private.refresh_public_project_document(m.project_id);
 elsif act='reject' and m.status='awaiting_approval' and private.can_approve_construction(m.project_id) then
  update public.construction_milestones set status='rejected',rejection_reason=coalesce(nullif(btrim(payload->>'reason'),''),'Correction required') where id=m.id;
 else raise exception 'Invalid milestone action or status.'; end if;
 return jsonb_build_object('milestone_id',m.id,'action',act,'project_milestone_id',pmid);
end $function$;

do $block$ declare p record; begin
 for p in select id,basement_floors from public.projects loop
  perform private.ensure_project_service_floors(p.id,p.basement_floors);
 end loop;
end $block$;
