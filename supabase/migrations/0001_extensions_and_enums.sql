create extension if not exists pgcrypto;

do $$ begin
  create type public.member_role as enum ('owner', 'admin', 'moderator', 'member');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.member_status as enum ('active', 'pending', 'banned', 'left');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.community_kind as enum ('public', 'private', 'salon');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.community_visibility as enum ('public', 'private');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.join_request_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.reaction_type as enum ('like', 'love', 'celebrate');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.notification_type as enum ('invite', 'join_request', 'join_approved', 'comment', 'mention', 'moderation');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.report_status as enum ('open', 'resolved', 'dismissed');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.report_target_type as enum ('post', 'comment', 'member');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.channel_kind as enum ('main');
exception when duplicate_object then null;
end $$;
