revoke all on function public.update_project_from_workspace(jsonb) from public;
revoke all on function public.update_project_from_workspace(jsonb) from anon;
grant execute on function public.update_project_from_workspace(jsonb) to authenticated;
