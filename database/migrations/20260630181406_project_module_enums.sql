
do $$ begin
  create type public.project_phase as enum (
    'planning_design',
    'groundbreaking',
    'foundation_work',
    'floor_construction',
    'ready_to_handover',
    'completed',
    'closed'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.project_publication_status as enum ('draft', 'pending_approval', 'published', 'unpublished');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.project_media_type as enum ('image', 'video', 'document', 'virtual_tour');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.project_price_scope as enum ('project', 'unit_type', 'unit');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.unit_category as enum ('residential', 'commercial');
exception when duplicate_object then null;
end $$;

alter type public.unit_status add value if not exists 'on_hold' after 'available';
alter type public.unit_status add value if not exists 'sold' after 'fully_paid';
