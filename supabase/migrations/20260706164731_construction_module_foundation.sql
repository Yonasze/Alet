
create table if not exists public.construction_work_packages(
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete cascade,
 project_id uuid not null references public.projects(id) on delete cascade,
 floor_id uuid references public.project_floors(id) on delete set null,
 code text not null,
 title text not null,
 category text not null,
 description text,
 priority text not null default 'normal',
 status text not null default 'draft',
 progress_percent numeric(7,2) not null default 0,
 planned_start date,
 planned_finish date,
 actual_start date,
 actual_finish date,
 assigned_to uuid references auth.users(id) on delete set null,
 contractor_name text,
 dependencies text,
 inspection_required boolean not null default true,
 public_summary text,
 created_by uuid references auth.users(id) on delete set null default auth.uid(),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(project_id,code),
 constraint construction_package_category_check check(category in ('site_preparation','excavation','foundation','structure','floor_construction','masonry','electrical','plumbing','fire_protection','elevator','finishing','external_works','testing_commissioning','other')),
 constraint construction_package_priority_check check(priority in ('low','normal','high','critical')),
 constraint construction_package_status_check check(status in ('draft','planned','active','awaiting_inspection','approved','completed','delayed','blocked','cancelled')),
 constraint construction_package_progress_check check(progress_percent between 0 and 100)
);

create table if not exists public.construction_daily_reports(
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete cascade,
 project_id uuid not null references public.projects(id) on delete cascade,
 report_date date not null,
 weather text,
 workforce_count integer not null default 0,
 work_performed text not null,
 equipment_used text,
 materials_used text,
 delays text,
 safety_incidents text,
 site_instructions text,
 next_day_plan text,
 status text not null default 'draft',
 created_by uuid references auth.users(id) on delete set null default auth.uid(),
 reviewed_by uuid references auth.users(id) on delete set null,
 reviewed_at timestamptz,
 review_comments text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint construction_report_workforce_check check(workforce_count>=0),
 constraint construction_report_status_check check(status in ('draft','submitted','approved','rejected'))
);

create table if not exists public.construction_inspections(
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete cascade,
 project_id uuid not null references public.projects(id) on delete cascade,
 work_package_id uuid not null references public.construction_work_packages(id) on delete cascade,
 inspection_type text not null,
 status text not null default 'requested',
 requested_by uuid references auth.users(id) on delete set null default auth.uid(),
 inspector_id uuid references auth.users(id) on delete set null,
 scheduled_at timestamptz,
 inspected_at timestamptz,
 checklist jsonb not null default '[]'::jsonb,
 comments text,
 corrective_actions text,
 approved_by uuid references auth.users(id) on delete set null,
 approved_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint construction_inspection_status_check check(status in ('requested','under_review','approved','rejected','reinspection','cancelled'))
);

create table if not exists public.construction_issues(
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete cascade,
 project_id uuid not null references public.projects(id) on delete cascade,
 work_package_id uuid references public.construction_work_packages(id) on delete set null,
 floor_id uuid references public.project_floors(id) on delete set null,
 issue_number text not null,
 category text not null,
 priority text not null default 'normal',
 title text not null,
 description text not null,
 status text not null default 'open',
 owner_id uuid references auth.users(id) on delete set null,
 due_date date,
 resolved_at timestamptz,
 resolution text,
 created_by uuid references auth.users(id) on delete set null default auth.uid(),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(organization_id,issue_number),
 constraint construction_issue_category_check check(category in ('design','material_shortage','contractor_delay','quality','safety','weather','access','client_change','other')),
 constraint construction_issue_priority_check check(priority in ('low','normal','high','critical')),
 constraint construction_issue_status_check check(status in ('open','in_progress','resolved','closed','cancelled'))
);

create table if not exists public.construction_milestones(
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete cascade,
 project_id uuid not null references public.projects(id) on delete cascade,
 project_milestone_id uuid references public.project_milestones(id) on delete set null,
 code text not null,
 title text not null,
 description text,
 phase public.project_phase not null,
 target_floor_number integer,
 planned_date date,
 progress_percent numeric(7,2) not null default 0,
 status text not null default 'draft',
 finance_trigger boolean not null default false,
 public_on_approval boolean not null default false,
 public_summary text,
 submitted_by uuid references auth.users(id) on delete set null,
 submitted_at timestamptz,
 approved_by uuid references auth.users(id) on delete set null,
 approved_at timestamptz,
 rejection_reason text,
 created_by uuid references auth.users(id) on delete set null default auth.uid(),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(project_id,code),
 constraint construction_milestone_status_check check(status in ('draft','active','awaiting_approval','approved','rejected','cancelled')),
 constraint construction_milestone_progress_check check(progress_percent between 0 and 100)
);

create index if not exists construction_packages_project_idx on public.construction_work_packages(project_id,status);
create index if not exists construction_packages_floor_idx on public.construction_work_packages(floor_id,status);
create index if not exists construction_reports_project_date_idx on public.construction_daily_reports(project_id,report_date desc);
create index if not exists construction_inspections_project_idx on public.construction_inspections(project_id,status);
create index if not exists construction_inspections_package_idx on public.construction_inspections(work_package_id,status);
create index if not exists construction_issues_project_idx on public.construction_issues(project_id,status,priority);
create index if not exists construction_issues_package_idx on public.construction_issues(work_package_id);
create index if not exists construction_issues_floor_idx on public.construction_issues(floor_id);
create index if not exists construction_milestones_project_idx on public.construction_milestones(project_id,status);

create or replace function private.can_manage_construction(target_project_id uuid)
returns boolean language sql stable security definer set search_path=public,pg_temp as $$
 select exists(select 1 from public.projects p where p.id=target_project_id and p.organization_id=private.current_organization_id()
 and private.has_project_role(array['admin','project_manager','engineer'],target_project_id))
$$;
create or replace function private.can_approve_construction(target_project_id uuid)
returns boolean language sql stable security definer set search_path=public,pg_temp as $$
 select exists(select 1 from public.projects p where p.id=target_project_id and p.organization_id=private.current_organization_id()
 and private.has_project_role(array['admin','project_manager'],target_project_id))
$$;

alter table public.construction_work_packages enable row level security;
alter table public.construction_daily_reports enable row level security;
alter table public.construction_inspections enable row level security;
alter table public.construction_issues enable row level security;
alter table public.construction_milestones enable row level security;

create policy construction_packages_read on public.construction_work_packages for select to authenticated using(private.can_view_project(project_id));
create policy construction_packages_insert on public.construction_work_packages for insert to authenticated with check(private.can_manage_construction(project_id));
create policy construction_packages_update on public.construction_work_packages for update to authenticated using(private.can_manage_construction(project_id)) with check(private.can_manage_construction(project_id));
create policy construction_packages_delete on public.construction_work_packages for delete to authenticated using(private.can_approve_construction(project_id));

create policy construction_reports_read on public.construction_daily_reports for select to authenticated using(private.can_view_project(project_id));
create policy construction_reports_insert on public.construction_daily_reports for insert to authenticated with check(private.can_manage_construction(project_id));
create policy construction_reports_update on public.construction_daily_reports for update to authenticated using(private.can_manage_construction(project_id)) with check(private.can_manage_construction(project_id));
create policy construction_reports_delete on public.construction_daily_reports for delete to authenticated using(private.can_approve_construction(project_id));

create policy construction_inspections_read on public.construction_inspections for select to authenticated using(private.can_view_project(project_id));
create policy construction_inspections_insert on public.construction_inspections for insert to authenticated with check(private.can_manage_construction(project_id));
create policy construction_inspections_update on public.construction_inspections for update to authenticated using(private.can_manage_construction(project_id)) with check(private.can_manage_construction(project_id));
create policy construction_inspections_delete on public.construction_inspections for delete to authenticated using(private.can_approve_construction(project_id));

create policy construction_issues_read on public.construction_issues for select to authenticated using(private.can_view_project(project_id));
create policy construction_issues_insert on public.construction_issues for insert to authenticated with check(private.can_manage_construction(project_id));
create policy construction_issues_update on public.construction_issues for update to authenticated using(private.can_manage_construction(project_id)) with check(private.can_manage_construction(project_id));
create policy construction_issues_delete on public.construction_issues for delete to authenticated using(private.can_approve_construction(project_id));

create policy construction_milestones_read on public.construction_milestones for select to authenticated using(private.can_view_project(project_id));
create policy construction_milestones_insert on public.construction_milestones for insert to authenticated with check(private.can_manage_construction(project_id));
create policy construction_milestones_update on public.construction_milestones for update to authenticated using(private.can_manage_construction(project_id)) with check(private.can_manage_construction(project_id));
create policy construction_milestones_delete on public.construction_milestones for delete to authenticated using(private.can_approve_construction(project_id));

revoke all on public.construction_work_packages,public.construction_daily_reports,public.construction_inspections,public.construction_issues,public.construction_milestones from anon;
grant select,insert,update,delete on public.construction_work_packages,public.construction_daily_reports,public.construction_inspections,public.construction_issues,public.construction_milestones to authenticated;

create or replace function public.create_construction_work_package(payload jsonb)
returns jsonb language plpgsql security definer set search_path=public,private,pg_temp as $$
declare p public.projects%rowtype; wid uuid; code text;
begin
 if auth.uid() is null then raise exception 'Authentication required.'; end if;
 select * into p from public.projects where id=(payload->>'project_id')::uuid;
 if p.id is null or not private.can_manage_construction(p.id) then raise exception 'Not authorized.'; end if;
 if nullif(btrim(payload->>'title'),'') is null then raise exception 'Work-package title is required.'; end if;
 code:=coalesce(nullif(upper(btrim(payload->>'code')),''),'WP-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,6)));
 insert into public.construction_work_packages(organization_id,project_id,floor_id,code,title,category,description,priority,status,progress_percent,planned_start,planned_finish,assigned_to,contractor_name,dependencies,inspection_required,public_summary)
 values(p.organization_id,p.id,nullif(payload->>'floor_id','')::uuid,code,btrim(payload->>'title'),coalesce(nullif(payload->>'category',''),'other'),nullif(btrim(payload->>'description'),''),
 coalesce(nullif(payload->>'priority',''),'normal'),'planned',coalesce(nullif(payload->>'progress_percent','')::numeric,0),nullif(payload->>'planned_start','')::date,nullif(payload->>'planned_finish','')::date,
 nullif(payload->>'assigned_to','')::uuid,nullif(btrim(payload->>'contractor_name'),''),nullif(btrim(payload->>'dependencies'),''),coalesce((payload->>'inspection_required')::boolean,true),nullif(btrim(payload->>'public_summary'),''))
 returning id into wid;
 return jsonb_build_object('work_package_id',wid,'code',code);
end $$;

create or replace function public.update_construction_work_package(payload jsonb)
returns jsonb language plpgsql security definer set search_path=public,private,pg_temp as $$
declare w public.construction_work_packages%rowtype; st text; prog numeric;
begin
 if auth.uid() is null then raise exception 'Authentication required.'; end if;
 select * into w from public.construction_work_packages where id=(payload->>'work_package_id')::uuid for update;
 if w.id is null or not private.can_manage_construction(w.project_id) then raise exception 'Not authorized.'; end if;
 st:=coalesce(nullif(payload->>'status',''),w.status);prog:=coalesce(nullif(payload->>'progress_percent','')::numeric,w.progress_percent);
 if prog<0 or prog>100 then raise exception 'Progress must be between 0 and 100.'; end if;
 if st='completed' and w.inspection_required and not exists(select 1 from public.construction_inspections i where i.work_package_id=w.id and i.status='approved') then raise exception 'Required inspection must be approved before completion.'; end if;
 update public.construction_work_packages set
 title=case when payload ? 'title' then coalesce(nullif(btrim(payload->>'title'),''),title) else title end,
 description=case when payload ? 'description' then nullif(btrim(payload->>'description'),'') else description end,
 priority=coalesce(nullif(payload->>'priority',''),priority),status=st,progress_percent=case when st='completed' then 100 else prog end,
 planned_start=case when payload ? 'planned_start' then nullif(payload->>'planned_start','')::date else planned_start end,
 planned_finish=case when payload ? 'planned_finish' then nullif(payload->>'planned_finish','')::date else planned_finish end,
 actual_start=case when st in ('active','awaiting_inspection','approved','completed') then coalesce(actual_start,current_date) else actual_start end,
 actual_finish=case when st='completed' then current_date else actual_finish end,
 assigned_to=case when payload ? 'assigned_to' then nullif(payload->>'assigned_to','')::uuid else assigned_to end,
 contractor_name=case when payload ? 'contractor_name' then nullif(btrim(payload->>'contractor_name'),'') else contractor_name end,
 dependencies=case when payload ? 'dependencies' then nullif(btrim(payload->>'dependencies'),'') else dependencies end,
 public_summary=case when payload ? 'public_summary' then nullif(btrim(payload->>'public_summary'),'') else public_summary end
 where id=w.id;
 return jsonb_build_object('work_package_id',w.id);
end $$;

create or replace function public.create_construction_daily_report(payload jsonb)
returns jsonb language plpgsql security definer set search_path=public,private,pg_temp as $$
declare p public.projects%rowtype; rid uuid;
begin
 if auth.uid() is null then raise exception 'Authentication required.'; end if;
 select * into p from public.projects where id=(payload->>'project_id')::uuid;
 if p.id is null or not private.can_manage_construction(p.id) then raise exception 'Not authorized.'; end if;
 if nullif(btrim(payload->>'work_performed'),'') is null then raise exception 'Work performed is required.'; end if;
 insert into public.construction_daily_reports(organization_id,project_id,report_date,weather,workforce_count,work_performed,equipment_used,materials_used,delays,safety_incidents,site_instructions,next_day_plan,status)
 values(p.organization_id,p.id,coalesce(nullif(payload->>'report_date','')::date,current_date),nullif(btrim(payload->>'weather'),''),coalesce(nullif(payload->>'workforce_count','')::int,0),
 btrim(payload->>'work_performed'),nullif(btrim(payload->>'equipment_used'),''),nullif(btrim(payload->>'materials_used'),''),nullif(btrim(payload->>'delays'),''),
 nullif(btrim(payload->>'safety_incidents'),''),nullif(btrim(payload->>'site_instructions'),''),nullif(btrim(payload->>'next_day_plan'),''),'draft') returning id into rid;
 return jsonb_build_object('report_id',rid);
end $$;

create or replace function public.construction_report_action(payload jsonb)
returns jsonb language plpgsql security definer set search_path=public,private,pg_temp as $$
declare r public.construction_daily_reports%rowtype; act text:=payload->>'action';
begin
 if auth.uid() is null then raise exception 'Authentication required.'; end if;
 select * into r from public.construction_daily_reports where id=(payload->>'report_id')::uuid for update;
 if r.id is null or not private.can_manage_construction(r.project_id) then raise exception 'Not authorized.'; end if;
 if act='submit' and r.status in ('draft','rejected') then update public.construction_daily_reports set status='submitted' where id=r.id;
 elsif act='approve' and r.status='submitted' and private.can_approve_construction(r.project_id) then update public.construction_daily_reports set status='approved',reviewed_by=auth.uid(),reviewed_at=now(),review_comments=nullif(btrim(payload->>'comments'),'') where id=r.id;
 elsif act='reject' and r.status='submitted' and private.can_approve_construction(r.project_id) then update public.construction_daily_reports set status='rejected',reviewed_by=auth.uid(),reviewed_at=now(),review_comments=coalesce(nullif(btrim(payload->>'comments'),''),'Correction required') where id=r.id;
 else raise exception 'Invalid report action or status.'; end if;
 return jsonb_build_object('report_id',r.id,'action',act);
end $$;

create or replace function public.create_construction_inspection(payload jsonb)
returns jsonb language plpgsql security definer set search_path=public,private,pg_temp as $$
declare w public.construction_work_packages%rowtype;iid uuid;
begin
 if auth.uid() is null then raise exception 'Authentication required.'; end if;
 select * into w from public.construction_work_packages where id=(payload->>'work_package_id')::uuid;
 if w.id is null or not private.can_manage_construction(w.project_id) then raise exception 'Not authorized.'; end if;
 insert into public.construction_inspections(organization_id,project_id,work_package_id,inspection_type,inspector_id,scheduled_at,checklist,comments)
 values(w.organization_id,w.project_id,w.id,coalesce(nullif(payload->>'inspection_type',''),'Quality inspection'),nullif(payload->>'inspector_id','')::uuid,nullif(payload->>'scheduled_at','')::timestamptz,
 coalesce(payload->'checklist','[]'::jsonb),nullif(btrim(payload->>'comments'),'')) returning id into iid;
 update public.construction_work_packages set status='awaiting_inspection' where id=w.id;
 return jsonb_build_object('inspection_id',iid);
end $$;

create or replace function public.construction_inspection_action(payload jsonb)
returns jsonb language plpgsql security definer set search_path=public,private,pg_temp as $$
declare i public.construction_inspections%rowtype;act text:=payload->>'action';
begin
 if auth.uid() is null then raise exception 'Authentication required.'; end if;
 select * into i from public.construction_inspections where id=(payload->>'inspection_id')::uuid for update;
 if i.id is null or not private.can_manage_construction(i.project_id) then raise exception 'Not authorized.'; end if;
 if act='start' and i.status in ('requested','reinspection') then update public.construction_inspections set status='under_review',inspector_id=coalesce(inspector_id,auth.uid()),inspected_at=now() where id=i.id;
 elsif act='approve' and i.status in ('requested','under_review','reinspection') and private.can_approve_construction(i.project_id) then
  update public.construction_inspections set status='approved',inspector_id=coalesce(inspector_id,auth.uid()),inspected_at=coalesce(inspected_at,now()),approved_by=auth.uid(),approved_at=now(),comments=nullif(btrim(payload->>'comments'),'') where id=i.id;
  update public.construction_work_packages set status='approved',progress_percent=100 where id=i.work_package_id;
 elsif act='reject' and i.status in ('requested','under_review','reinspection') and private.can_approve_construction(i.project_id) then
  update public.construction_inspections set status='rejected',inspector_id=coalesce(inspector_id,auth.uid()),inspected_at=coalesce(inspected_at,now()),comments=nullif(btrim(payload->>'comments'),''),corrective_actions=coalesce(nullif(btrim(payload->>'corrective_actions'),''),'Corrective work required') where id=i.id;
  update public.construction_work_packages set status='active' where id=i.work_package_id;
 elsif act='reinspect' and i.status='rejected' then update public.construction_inspections set status='reinspection',scheduled_at=nullif(payload->>'scheduled_at','')::timestamptz where id=i.id;
 else raise exception 'Invalid inspection action or status.'; end if;
 return jsonb_build_object('inspection_id',i.id,'action',act);
end $$;

create or replace function public.create_construction_issue(payload jsonb)
returns jsonb language plpgsql security definer set search_path=public,private,pg_temp as $$
declare p public.projects%rowtype;iid uuid;inum text;
begin
 if auth.uid() is null then raise exception 'Authentication required.'; end if;
 select * into p from public.projects where id=(payload->>'project_id')::uuid;
 if p.id is null or not private.can_manage_construction(p.id) then raise exception 'Not authorized.'; end if;
 if nullif(btrim(payload->>'title'),'') is null or nullif(btrim(payload->>'description'),'') is null then raise exception 'Issue title and description are required.'; end if;
 inum:='ISS-'||to_char(now(),'YYYYMMDD')||'-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,5));
 insert into public.construction_issues(organization_id,project_id,work_package_id,floor_id,issue_number,category,priority,title,description,owner_id,due_date)
 values(p.organization_id,p.id,nullif(payload->>'work_package_id','')::uuid,nullif(payload->>'floor_id','')::uuid,inum,coalesce(nullif(payload->>'category',''),'other'),coalesce(nullif(payload->>'priority',''),'normal'),
 btrim(payload->>'title'),btrim(payload->>'description'),nullif(payload->>'owner_id','')::uuid,nullif(payload->>'due_date','')::date) returning id into iid;
 return jsonb_build_object('issue_id',iid,'issue_number',inum);
end $$;

create or replace function public.construction_issue_action(payload jsonb)
returns jsonb language plpgsql security definer set search_path=public,private,pg_temp as $$
declare i public.construction_issues%rowtype;act text:=payload->>'action';
begin
 if auth.uid() is null then raise exception 'Authentication required.'; end if;
 select * into i from public.construction_issues where id=(payload->>'issue_id')::uuid for update;
 if i.id is null or not private.can_manage_construction(i.project_id) then raise exception 'Not authorized.'; end if;
 if act='start' and i.status='open' then update public.construction_issues set status='in_progress',owner_id=coalesce(owner_id,auth.uid()) where id=i.id;
 elsif act='resolve' and i.status in ('open','in_progress') then update public.construction_issues set status='resolved',resolved_at=now(),resolution=coalesce(nullif(btrim(payload->>'resolution'),''),'Resolved') where id=i.id;
 elsif act='close' and i.status='resolved' and private.can_approve_construction(i.project_id) then update public.construction_issues set status='closed' where id=i.id;
 elsif act='reopen' and i.status in ('resolved','closed') then update public.construction_issues set status='open',resolved_at=null,resolution=null where id=i.id;
 else raise exception 'Invalid issue action or status.'; end if;
 return jsonb_build_object('issue_id',i.id,'action',act);
end $$;

create or replace function public.create_construction_milestone(payload jsonb)
returns jsonb language plpgsql security definer set search_path=public,private,pg_temp as $$
declare p public.projects%rowtype;mid uuid;code text;
begin
 if auth.uid() is null then raise exception 'Authentication required.'; end if;
 select * into p from public.projects where id=(payload->>'project_id')::uuid;
 if p.id is null or not private.can_manage_construction(p.id) then raise exception 'Not authorized.'; end if;
 code:=coalesce(nullif(upper(btrim(payload->>'code')),''),'MS-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,6)));
 insert into public.construction_milestones(organization_id,project_id,code,title,description,phase,target_floor_number,planned_date,progress_percent,status,finance_trigger,public_on_approval,public_summary)
 values(p.organization_id,p.id,code,btrim(payload->>'title'),nullif(btrim(payload->>'description'),''),coalesce(nullif(payload->>'phase',''),'floor_construction')::public.project_phase,
 nullif(payload->>'target_floor_number','')::int,nullif(payload->>'planned_date','')::date,coalesce(nullif(payload->>'progress_percent','')::numeric,0),'active',
 coalesce((payload->>'finance_trigger')::boolean,false),coalesce((payload->>'public_on_approval')::boolean,false),nullif(btrim(payload->>'public_summary'),'')) returning id into mid;
 return jsonb_build_object('milestone_id',mid);
end $$;

create or replace function public.construction_milestone_action(payload jsonb)
returns jsonb language plpgsql security definer set search_path=public,private,pg_temp as $$
declare m public.construction_milestones%rowtype;act text:=payload->>'action';pmid uuid;floor_count int;
begin
 if auth.uid() is null then raise exception 'Authentication required.'; end if;
 select * into m from public.construction_milestones where id=(payload->>'milestone_id')::uuid for update;
 if m.id is null or not private.can_manage_construction(m.project_id) then raise exception 'Not authorized.'; end if;
 if act='submit' and m.status in ('active','rejected','draft') then update public.construction_milestones set status='awaiting_approval',progress_percent=100,submitted_by=auth.uid(),submitted_at=now(),rejection_reason=null where id=m.id;
 elsif act='approve' and m.status='awaiting_approval' and private.can_approve_construction(m.project_id) then
  floor_count:=coalesce((select count(*) from public.project_floors where project_id=m.project_id and is_completed),0);
  insert into public.project_milestones(organization_id,project_id,phase,title,description,progress_percent,floors_completed,total_floors,target_date,completed_at,is_public,created_by)
  select m.organization_id,m.project_id,m.phase,m.title,coalesce(m.public_summary,m.description),100,floor_count,p.total_floors,m.planned_date,now(),m.public_on_approval,auth.uid() from public.projects p where p.id=m.project_id
  returning id into pmid;
  update public.construction_milestones set status='approved',progress_percent=100,approved_by=auth.uid(),approved_at=now(),project_milestone_id=pmid where id=m.id;
  update public.projects set phase=m.phase,floors_completed=floor_count where id=m.project_id;
  insert into public.business_events(organization_id,project_id,type,reference_type,reference_id,payload)
  values(m.organization_id,m.project_id,'CONSTRUCTION_MILESTONE_APPROVED','construction_milestone',m.id,jsonb_build_object('code',m.code,'title',m.title,'phase',m.phase,'finance_trigger',m.finance_trigger));
  if m.finance_trigger then update public.finance_payment_schedules set status='due',due_date=coalesce(due_date,current_date)
   where project_id=m.project_id and trigger_type='construction_milestone' and status in ('scheduled','overdue')
   and (lower(coalesce(milestone_reference,''))=lower(m.title) or lower(label)=lower(m.title) or lower(m.title) like '%'||lower(coalesce(milestone_reference,''))||'%'); end if;
  perform private.refresh_public_project_document(m.project_id);
 elsif act='reject' and m.status='awaiting_approval' and private.can_approve_construction(m.project_id) then update public.construction_milestones set status='rejected',rejection_reason=coalesce(nullif(btrim(payload->>'reason'),''),'Correction required') where id=m.id;
 else raise exception 'Invalid milestone action or status.'; end if;
 return jsonb_build_object('milestone_id',m.id,'action',act,'project_milestone_id',pmid);
end $$;

create or replace function public.complete_construction_floor(payload jsonb)
returns jsonb language plpgsql security definer set search_path=public,private,pg_temp as $$
declare f public.project_floors%rowtype;cnt int;
begin
 if auth.uid() is null then raise exception 'Authentication required.'; end if;
 select * into f from public.project_floors where id=(payload->>'floor_id')::uuid for update;
 if f.id is null or not private.can_approve_construction(f.project_id) then raise exception 'Not authorized.'; end if;
 if exists(select 1 from public.construction_work_packages w where w.floor_id=f.id and w.status not in ('approved','completed','cancelled')) then raise exception 'All floor work packages must be approved or completed.'; end if;
 update public.project_floors set is_completed=true,completed_at=coalesce(completed_at,now()) where id=f.id;
 select count(*) into cnt from public.project_floors where project_id=f.project_id and is_completed and floor_number>0;
 update public.projects set phase='floor_construction',floors_completed=cnt where id=f.project_id;
 insert into public.business_events(organization_id,project_id,type,reference_type,reference_id,payload)
 values(f.organization_id,f.project_id,'FLOOR_COMPLETED','project_floor',f.id,jsonb_build_object('floor_number',f.floor_number,'floors_completed',cnt));
 perform private.refresh_public_project_document(f.project_id);
 return jsonb_build_object('floor_id',f.id,'floors_completed',cnt);
end $$;

do $$
declare t text;
begin
 foreach t in array array['construction_work_packages','construction_daily_reports','construction_inspections','construction_issues','construction_milestones'] loop
  execute format('create trigger %I before update on public.%I for each row execute function private.sales_set_updated_at()',t||'_updated_at',t);
  execute format('create trigger %I after insert or update or delete on public.%I for each row execute function private.write_project_audit()','audit_'||t,t);
 end loop;
end $$;

revoke all on function public.create_construction_work_package(jsonb),public.update_construction_work_package(jsonb),public.create_construction_daily_report(jsonb),public.construction_report_action(jsonb),public.create_construction_inspection(jsonb),public.construction_inspection_action(jsonb),public.create_construction_issue(jsonb),public.construction_issue_action(jsonb),public.create_construction_milestone(jsonb),public.construction_milestone_action(jsonb),public.complete_construction_floor(jsonb) from public,anon;
grant execute on function public.create_construction_work_package(jsonb),public.update_construction_work_package(jsonb),public.create_construction_daily_report(jsonb),public.construction_report_action(jsonb),public.create_construction_inspection(jsonb),public.construction_inspection_action(jsonb),public.create_construction_issue(jsonb),public.construction_issue_action(jsonb),public.create_construction_milestone(jsonb),public.construction_milestone_action(jsonb),public.complete_construction_floor(jsonb) to authenticated;
