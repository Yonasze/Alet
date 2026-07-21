create or replace function private.write_project_audit()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $$
declare
  row_data jsonb;
  old_row jsonb;
  new_row jsonb;
  target_project uuid;
  target_org uuid;
  target_id text;
begin
  old_row := case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) else null end;
  new_row := case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) else null end;
  row_data := coalesce(new_row, old_row);
  target_project := case
    when tg_table_name = 'projects' and tg_op = 'DELETE' then null
    when tg_table_name = 'projects' then (row_data->>'id')::uuid
    else nullif(row_data->>'project_id','')::uuid
  end;
  target_org := nullif(row_data->>'organization_id','')::uuid;
  target_id := row_data->>'id';

  insert into public.audit_logs (
    organization_id, project_id, actor_user_id, action, entity_type, entity_id, old_data, new_data
  ) values (
    target_org, target_project, auth.uid(), lower(tg_op), tg_table_name, target_id, old_row, new_row
  );
  return coalesce(new, old);
end
$$;
