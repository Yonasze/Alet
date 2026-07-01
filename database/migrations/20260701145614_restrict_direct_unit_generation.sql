revoke execute on function public.generate_project_units(uuid) from public, anon, authenticated;
grant execute on function public.create_project_from_wizard(jsonb) to authenticated;
revoke execute on function public.create_project_from_wizard(jsonb) from anon;
