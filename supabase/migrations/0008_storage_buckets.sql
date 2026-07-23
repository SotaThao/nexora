-- Community post media buckets. This migration is intentionally not applied by
-- the client; apply it through the normal Supabase migration workflow.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'community-public',
    'community-public',
    true,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
  ),
  (
    'community-private',
    'community-private',
    false,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
  )
on conflict (id) do nothing;

-- Paths are always {community_id}/{post_id}/{filename}. Membership is checked
-- against the first segment so an authenticated actor cannot upload into a
-- different community's namespace.
drop policy if exists community_public_media_insert_member on storage.objects;
create policy community_public_media_insert_member
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'community-public'
  and public.is_member(split_part(name, '/', 1)::uuid)
);

drop policy if exists community_private_media_insert_member on storage.objects;
create policy community_private_media_insert_member
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'community-private'
  and public.is_member(split_part(name, '/', 1)::uuid)
);

drop policy if exists community_public_media_read_authenticated on storage.objects;
create policy community_public_media_read_authenticated
on storage.objects
for select
to authenticated
using (bucket_id = 'community-public');

drop policy if exists community_private_media_read_member on storage.objects;
create policy community_private_media_read_member
on storage.objects
for select
to authenticated
using (
  bucket_id = 'community-private'
  and public.is_member(split_part(name, '/', 1)::uuid)
);
