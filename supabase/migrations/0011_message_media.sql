-- Chat messages store provider-neutral media references using the same JSON
-- array convention as public.posts.media_paths.
alter table public.messages
  add column media_paths jsonb not null default '[]'::jsonb
  check (jsonb_typeof(media_paths) = 'array');

comment on column public.messages.media_paths is
  'Cloudinary media references only; signed delivery URLs are never persisted.';
