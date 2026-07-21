create index if not exists construction_daily_reports_created_by_idx on public.construction_daily_reports(created_by);
create index if not exists construction_daily_reports_organization_idx on public.construction_daily_reports(organization_id);
create index if not exists construction_daily_reports_reviewed_by_idx on public.construction_daily_reports(reviewed_by);

create index if not exists construction_inspections_approved_by_idx on public.construction_inspections(approved_by);
create index if not exists construction_inspections_inspector_idx on public.construction_inspections(inspector_id);
create index if not exists construction_inspections_organization_idx on public.construction_inspections(organization_id);
create index if not exists construction_inspections_requested_by_idx on public.construction_inspections(requested_by);

create index if not exists construction_issues_created_by_idx on public.construction_issues(created_by);
create index if not exists construction_issues_owner_idx on public.construction_issues(owner_id);

create index if not exists construction_milestones_approved_by_idx on public.construction_milestones(approved_by);
create index if not exists construction_milestones_created_by_idx on public.construction_milestones(created_by);
create index if not exists construction_milestones_organization_idx on public.construction_milestones(organization_id);
create index if not exists construction_milestones_project_milestone_idx on public.construction_milestones(project_milestone_id);
create index if not exists construction_milestones_submitted_by_idx on public.construction_milestones(submitted_by);

create index if not exists construction_work_packages_assigned_to_idx on public.construction_work_packages(assigned_to);
create index if not exists construction_work_packages_created_by_idx on public.construction_work_packages(created_by);
create index if not exists construction_work_packages_organization_idx on public.construction_work_packages(organization_id);
