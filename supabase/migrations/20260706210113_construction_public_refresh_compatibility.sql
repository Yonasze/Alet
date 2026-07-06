
create or replace function private.refresh_public_project_document(target_project_id uuid)
returns void language plpgsql security definer set search_path=public,private,pg_temp as $$
begin
 perform private.refresh_public_project(target_project_id);
end $$;
