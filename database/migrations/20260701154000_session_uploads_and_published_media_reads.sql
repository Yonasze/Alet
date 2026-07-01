drop policy if exists "project media read own folder" on storage.objects;
create policy "project media read own folder"
on storage.objects for select to authenticated
using (
  bucket_id = 'project-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create or replace function private.is_published_project_media_path(target_path text)
returns boolean
language sql
stable
security definer
set search_path = public, private, pg_temp
as $function$
  select exists (
    select 1
    from public.project_media pm
    join public.project_publications publication on publication.project_id = pm.project_id
    where pm.storage_path = target_path
      and pm.is_public
      and pm.is_approved
      and publication.status = 'published'
  );
$function$;

revoke all on function private.is_published_project_media_path(text) from public;
grant execute on function private.is_published_project_media_path(text) to anon, authenticated;

drop policy if exists "published project media read" on storage.objects;
create policy "published project media read"
on storage.objects for select to anon, authenticated
using (
  bucket_id = 'project-media'
  and private.is_published_project_media_path(name)
);

create or replace function public.public_project_media_storage_path(target_media_id uuid)
returns text
language sql
stable
security definer
set search_path = public, private, pg_temp
as $function$
  select pm.storage_path
  from public.project_media pm
  join public.project_publications publication on publication.project_id = pm.project_id
  where pm.id = target_media_id
    and pm.is_public
    and pm.is_approved
    and publication.status = 'published'
  limit 1;
$function$;

revoke all on function public.public_project_media_storage_path(uuid) from public;
grant execute on function public.public_project_media_storage_path(uuid) to anon, authenticated;
