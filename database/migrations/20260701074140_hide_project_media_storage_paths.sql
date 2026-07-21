drop view if exists public.public_project_media;

create view public.public_project_media
with (security_invoker = true, security_barrier = true)
as
select
  d.slug as project_slug,
  (item->>'media_id')::uuid as media_id,
  item->>'media_type' as media_type,
  item->>'title' as title,
  item->>'alt_text' as alt_text,
  item->>'public_url' as public_url,
  coalesce((item->>'is_hero')::boolean, false) as is_hero,
  coalesce((item->>'sort_order')::integer, 0) as sort_order
from private.published_project_documents d
cross join lateral jsonb_array_elements(d.payload->'media') item;

revoke all on public.public_project_media from public;
grant select on public.public_project_media to anon, authenticated;
