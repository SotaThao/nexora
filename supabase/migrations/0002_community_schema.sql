create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  avatar_path text,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.communities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique check (slug = lower(slug) and slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text,
  kind public.community_kind not null,
  visibility public.community_visibility not null,
  -- This determines the storage bucket. It can never change after creation.
  media_visibility public.community_visibility not null,
  verified boolean not null default false,
  owner_id uuid not null references public.profiles(id) on delete restrict,
  cover_image_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint communities_media_visibility_matches_visibility check (visibility = media_visibility)
);

create table if not exists public.community_members (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.member_role not null default 'member',
  status public.member_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (community_id, user_id)
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete restrict,
  body text not null check (char_length(body) <= 10000),
  -- Object paths follow {community_id}/{post_id}/; no signed URL is persisted here.
  media_paths jsonb not null default '[]'::jsonb check (jsonb_typeof(media_paths) = 'array'),
  is_announcement boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete restrict,
  body text not null check (char_length(body) <= 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  type public.reaction_type not null,
  created_at timestamptz not null default now(),
  unique (post_id, user_id, type)
);

create table if not exists public.invites (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete restrict,
  -- SHA-256 hash only. Raw invite tokens are never persisted.
  token_hash text not null unique,
  expires_at timestamptz,
  single_use boolean not null default true,
  consumed_by uuid references public.profiles(id) on delete set null,
  consumed_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.join_requests (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  message text,
  status public.join_request_status not null default 'pending',
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (community_id, user_id)
);

create table if not exists public.channels (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  kind public.channel_kind not null default 'main',
  name text not null default 'Main',
  created_at timestamptz not null default now(),
  unique (community_id, kind)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.channels(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete restrict,
  body text not null check (char_length(body) <= 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id) on delete restrict,
  target_type public.report_target_type not null,
  target_id uuid not null,
  reason text not null check (char_length(reason) <= 2000),
  status public.report_status not null default 'open',
  resolved_by uuid references public.profiles(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type public.notification_type not null,
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object'),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  target_type text not null,
  target_id uuid,
  meta jsonb not null default '{}'::jsonb check (jsonb_typeof(meta) = 'object'),
  created_at timestamptz not null default now()
);

create index if not exists communities_visibility_created_at_idx on public.communities (visibility, created_at desc, id desc);
create index if not exists community_members_community_status_idx on public.community_members (community_id, status, created_at desc, id desc);
create index if not exists community_members_user_idx on public.community_members (user_id, community_id);
create index if not exists posts_community_created_at_idx on public.posts (community_id, created_at desc, id desc);
create index if not exists comments_post_created_at_idx on public.comments (post_id, created_at asc, id asc);
create index if not exists reactions_post_idx on public.reactions (post_id);
create index if not exists invites_community_idx on public.invites (community_id, created_at desc);
create index if not exists join_requests_community_status_idx on public.join_requests (community_id, status, created_at desc, id desc);
create index if not exists messages_channel_created_at_idx on public.messages (channel_id, created_at desc, id desc);
create index if not exists reports_community_status_idx on public.reports (community_id, status, created_at desc, id desc);
create index if not exists notifications_user_unread_idx on public.notifications (user_id, read_at, created_at desc);
create index if not exists audit_log_community_created_at_idx on public.audit_log (community_id, created_at desc);
