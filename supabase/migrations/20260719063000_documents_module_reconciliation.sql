-- Alet ERP Documents module
-- Private storage, project-scoped records, immutable versions, and approval workflow.
-- Reconciliation: this definition existed on the Documents branch under
-- database/migrations and was applied manually, but was absent from the active
-- supabase/migrations history used to reproduce the staging database.

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  document_number text,
  title text not null,
  description text,
  category text not null,
  linked_entity_type text,
  linked_entity_id uuid,
  status text not null default 'draft',
  confidentiality text not null default 'internal',
  current_version integer not null default 1,
  issue_date date,
  expiry_date date,
  tags text[] not null default '{}',
  review_notes text,
  created_by uuid references auth.users(id) on delete set null,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint documents_title_not_blank check (length(btrim(title)) > 0),
  constraint documents_category_check check (category in (
    'legal', 'design', 'procurement', 'inventory', 'construction', 'sales',
    'finance', 'contractor', 'compliance', 'handover', 'other'
  )),
  constraint documents_status_check check (status in (
    'draft', 'under_review', 'approved', 'rejected', 'expired', 'archived'
  )),
  constraint documents_confidentiality_check check (confidentiality in (
    'internal', 'confidential', 'restricted'
  )),
  constraint documents_version_positive check (current_version > 0),
  constraint documents_dates_valid check (
    expiry_date is null or issue_date is null or expiry_date >= issue_date
  )
);

create table if not exists public.document_versions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  version_number integer not null,
  storage_path text not null,
  file_name text not null,
  mime_type text not null,
  size_bytes bigint not null,
  checksum text,
  change_summary text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint document_versions_version_positive check (version_number > 0),
  constraint document_versions_size_valid check (size_bytes > 0 and size_bytes <= 10485760),
  constraint document_versions_storage_path_not_blank check (length(btrim(storage_path)) > 0),
  unique (document_id, version_number),
  unique (storage_path)
);

create unique index if not exists documents_org_number_unique
  on public.documents (organization_id, document_number)
  where document_number is not null;
create index if not exists documents_org_project_idx
  on public.documents (organization_id, project_id, updated_at desc);
create index if not exists documents_status_idx
  on public.documents (organization_id, status, updated_at desc);
create index if not exists documents_project_id_idx
  on public.documents (project_id);
create index if not exists documents_created_by_idx
  on public.documents (created_by);
create index if not exists documents_reviewed_by_idx
  on public.documents (reviewed_by)
  where reviewed_by is not null;
create index if not exists documents_expiry_idx
  on public.documents (organization_id, expiry_date)
  where expiry_date is not null and status not in ('archived', 'expired');
create index if not exists documents_link_idx
  on public.documents (linked_entity_type, linked_entity_id)
  where linked_entity_id is not null;
create index if not exists document_versions_document_idx
  on public.document_versions (document_id, version_number desc);
create index if not exists document_versions_created_by_idx
  on public.document_versions (created_by);

create or replace function private.can_view_documents(target_project_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select case
    when target_project_id is null then private.has_project_role(
      array['admin','project_manager','procurement','finance','engineer','inventory','sales','marketing','viewer'],
      null
    )
    else private.can_view_project(target_project_id)
  end
$$;

create or replace function private.can_manage_documents(target_project_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select private.has_project_role(
    array['admin','project_manager','procurement','finance','engineer','inventory','sales','marketing'],
    target_project_id
  )
$$;

create or replace function private.can_approve_documents(target_project_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select private.has_project_role(array['admin','project_manager'], target_project_id)
$$;

create or replace function private.documents_touch_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists documents_touch_updated_at on public.documents;
create trigger documents_touch_updated_at
before update on public.documents
for each row execute function private.documents_touch_updated_at();

alter table public.documents enable row level security;
alter table public.document_versions enable row level security;

drop policy if exists documents_read on public.documents;
create policy documents_read on public.documents
for select to authenticated
using (
  organization_id = (select private.current_organization_id())
  and private.can_view_documents(project_id)
);

drop policy if exists documents_insert on public.documents;
create policy documents_insert on public.documents
for insert to authenticated
with check (
  organization_id = (select private.current_organization_id())
  and created_by = (select auth.uid())
  and private.can_manage_documents(project_id)
);

drop policy if exists documents_update on public.documents;
create policy documents_update on public.documents
for update to authenticated
using (
  organization_id = (select private.current_organization_id())
  and private.can_manage_documents(project_id)
)
with check (
  organization_id = (select private.current_organization_id())
  and private.can_manage_documents(project_id)
);

drop policy if exists documents_delete on public.documents;
create policy documents_delete on public.documents
for delete to authenticated
using (
  organization_id = (select private.current_organization_id())
  and private.can_approve_documents(project_id)
);

drop policy if exists document_versions_read on public.document_versions;
create policy document_versions_read on public.document_versions
for select to authenticated
using (
  exists (
    select 1 from public.documents d
    where d.id = document_id
      and d.organization_id = (select private.current_organization_id())
      and private.can_view_documents(d.project_id)
  )
);

drop policy if exists document_versions_insert on public.document_versions;
create policy document_versions_insert on public.document_versions
for insert to authenticated
with check (
  created_by = (select auth.uid())
  and exists (
    select 1 from public.documents d
    where d.id = document_id
      and d.organization_id = (select private.current_organization_id())
      and private.can_manage_documents(d.project_id)
  )
);

drop policy if exists document_versions_delete on public.document_versions;
create policy document_versions_delete on public.document_versions
for delete to authenticated
using (
  exists (
    select 1 from public.documents d
    where d.id = document_id
      and d.organization_id = (select private.current_organization_id())
      and private.can_approve_documents(d.project_id)
  )
);

grant select, insert, update, delete on public.documents to authenticated;
grant select, insert, delete on public.document_versions to authenticated;
revoke all on public.documents from anon;
revoke all on public.document_versions from anon;

create or replace function public.create_document(payload jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_org uuid := private.current_organization_id();
  v_project uuid := nullif(payload->>'project_id', '')::uuid;
  v_document_id uuid := coalesce(nullif(payload->>'id', '')::uuid, gen_random_uuid());
  v_title text := btrim(coalesce(payload->>'title', ''));
  v_category text := coalesce(nullif(payload->>'category', ''), 'other');
  v_path text := btrim(coalesce(payload->>'storage_path', ''));
  v_file_name text := btrim(coalesce(payload->>'file_name', ''));
  v_mime_type text := btrim(coalesce(payload->>'mime_type', 'application/octet-stream'));
  v_size bigint := coalesce((payload->>'size_bytes')::bigint, 0);
begin
  if v_org is null then raise exception 'Organization membership is required'; end if;
  if v_title = '' then raise exception 'Document title is required'; end if;
  if v_path = '' or v_file_name = '' then raise exception 'A stored file is required'; end if;
  if v_size <= 0 or v_size > 10485760 then raise exception 'File must be between 1 byte and 10 MB'; end if;
  if not private.can_manage_documents(v_project) then raise exception 'Document access denied'; end if;
  if v_project is not null and not exists (
    select 1 from public.projects p where p.id = v_project and p.organization_id = v_org
  ) then raise exception 'Project not found'; end if;

  insert into public.documents (
    id, organization_id, project_id, document_number, title, description, category,
    linked_entity_type, linked_entity_id, status, confidentiality, current_version,
    issue_date, expiry_date, tags, created_by
  ) values (
    v_document_id, v_org, v_project, nullif(btrim(payload->>'document_number'), ''),
    v_title, nullif(btrim(payload->>'description'), ''), v_category,
    nullif(btrim(payload->>'linked_entity_type'), ''),
    nullif(payload->>'linked_entity_id', '')::uuid,
    'draft', coalesce(nullif(payload->>'confidentiality', ''), 'internal'), 1,
    nullif(payload->>'issue_date', '')::date, nullif(payload->>'expiry_date', '')::date,
    coalesce(array(select jsonb_array_elements_text(coalesce(payload->'tags', '[]'::jsonb))), '{}'),
    auth.uid()
  );

  insert into public.document_versions (
    document_id, version_number, storage_path, file_name, mime_type, size_bytes,
    checksum, change_summary, created_by
  ) values (
    v_document_id, 1, v_path, v_file_name, v_mime_type, v_size,
    nullif(payload->>'checksum', ''), nullif(payload->>'change_summary', ''), auth.uid()
  );

  return jsonb_build_object('id', v_document_id, 'status', 'draft', 'version', 1);
end;
$$;

create or replace function public.document_action(payload jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_document public.documents%rowtype;
  v_action text := lower(btrim(coalesce(payload->>'action', '')));
  v_next_status text;
begin
  select * into v_document
  from public.documents
  where id = (payload->>'document_id')::uuid
  for update;

  if not found then raise exception 'Document not found'; end if;

  if v_action = 'submit' then
    if not private.can_manage_documents(v_document.project_id) then raise exception 'Document access denied'; end if;
    if v_document.status not in ('draft', 'rejected') then raise exception 'Only draft or rejected documents can be submitted'; end if;
    v_next_status := 'under_review';
  elsif v_action = 'approve' then
    if not private.can_approve_documents(v_document.project_id) then raise exception 'Approval access denied'; end if;
    if v_document.status <> 'under_review' then raise exception 'Only documents under review can be approved'; end if;
    v_next_status := 'approved';
  elsif v_action = 'reject' then
    if not private.can_approve_documents(v_document.project_id) then raise exception 'Approval access denied'; end if;
    if v_document.status <> 'under_review' then raise exception 'Only documents under review can be rejected'; end if;
    v_next_status := 'rejected';
  elsif v_action = 'archive' then
    if not private.can_manage_documents(v_document.project_id) then raise exception 'Document access denied'; end if;
    v_next_status := 'archived';
  else
    raise exception 'Unsupported document action';
  end if;

  update public.documents
  set status = v_next_status,
      review_notes = nullif(btrim(payload->>'notes'), ''),
      reviewed_by = case when v_action in ('approve', 'reject') then auth.uid() else reviewed_by end,
      reviewed_at = case when v_action in ('approve', 'reject') then now() else reviewed_at end
  where id = v_document.id;

  return jsonb_build_object('id', v_document.id, 'status', v_next_status);
end;
$$;

revoke execute on function public.create_document(jsonb) from public, anon;
revoke execute on function public.document_action(jsonb) from public, anon;
grant execute on function public.create_document(jsonb) to authenticated;
grant execute on function public.document_action(jsonb) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'erp-documents', 'erp-documents', false, 10485760,
  array[
    'application/pdf', 'image/jpeg', 'image/png', 'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/octet-stream'
  ]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists erp_documents_storage_read on storage.objects;
create policy erp_documents_storage_read on storage.objects
for select to authenticated
using (
  bucket_id = 'erp-documents'
  and exists (
    select 1
    from public.document_versions dv
    join public.documents d on d.id = dv.document_id
    where dv.storage_path = name
      and d.organization_id = (select private.current_organization_id())
      and private.can_view_documents(d.project_id)
  )
);

drop policy if exists erp_documents_storage_insert on storage.objects;
create policy erp_documents_storage_insert on storage.objects
for insert to authenticated
with check (
  bucket_id = 'erp-documents'
  and (storage.foldername(name))[1] = (select private.current_organization_id())::text
  and private.can_manage_documents(
    case
      when (storage.foldername(name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      then ((storage.foldername(name))[2])::uuid
      else null
    end
  )
);

drop policy if exists erp_documents_storage_delete on storage.objects;
create policy erp_documents_storage_delete on storage.objects
for delete to authenticated
using (
  bucket_id = 'erp-documents'
  and (
    exists (
      select 1
      from public.document_versions dv
      join public.documents d on d.id = dv.document_id
      where dv.storage_path = name
        and d.organization_id = (select private.current_organization_id())
        and private.can_approve_documents(d.project_id)
    )
    or (
      owner_id = (select auth.uid())::text
      and not exists (select 1 from public.document_versions dv where dv.storage_path = name)
      and (storage.foldername(name))[1] = (select private.current_organization_id())::text
      and private.can_manage_documents(
        case
          when (storage.foldername(name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
          then ((storage.foldername(name))[2])::uuid
          else null
        end
      )
    )
  )
);
