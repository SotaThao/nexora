-- Producer contract: a producer inserts at most one unread notification for a
-- recipient, notification type, and source ID. The NOT EXISTS guards below are
-- the dedup rule and keep retried trigger delivery idempotent.
create or replace function public.notify_join_request_created()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  insert into public.notifications (user_id, type, payload)
  select member.user_id,
         'join_request',
         jsonb_build_object('joinRequestId', new.id, 'communityId', new.community_id, 'requesterId', new.user_id)
  from public.community_members member
  where member.community_id = new.community_id
    and member.status = 'active'
    and member.role in ('owner', 'admin')
    and not exists (
      select 1 from public.notifications notification
      where notification.user_id = member.user_id
        and notification.type = 'join_request'
        and notification.read_at is null
        and notification.payload ->> 'joinRequestId' = new.id::text
    );
  return new;
end;
$$;

create or replace function public.notify_join_request_approved()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if old.status = 'pending' and new.status = 'approved' then
    insert into public.notifications (user_id, type, payload)
    select new.user_id,
           'join_approved',
           jsonb_build_object('joinRequestId', new.id, 'communityId', new.community_id)
    where not exists (
      select 1 from public.notifications notification
      where notification.user_id = new.user_id
        and notification.type = 'join_approved'
        and notification.read_at is null
        and notification.payload ->> 'joinRequestId' = new.id::text
    );
  end if;
  return new;
end;
$$;

create or replace function public.notify_post_comment_created()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_post public.posts%rowtype;
begin
  select * into v_post from public.posts where id = new.post_id;
  if found and v_post.author_id <> new.author_id then
    insert into public.notifications (user_id, type, payload)
    select v_post.author_id,
           'comment',
           jsonb_build_object('commentId', new.id, 'postId', new.post_id, 'communityId', v_post.community_id)
    where not exists (
      select 1 from public.notifications notification
      where notification.user_id = v_post.author_id
        and notification.type = 'comment'
        and notification.read_at is null
        and notification.payload ->> 'commentId' = new.id::text
    );
  end if;
  return new;
end;
$$;

drop trigger if exists join_request_notification_created on public.join_requests;
create trigger join_request_notification_created
  after insert on public.join_requests
  for each row execute procedure public.notify_join_request_created();

drop trigger if exists join_request_notification_approved on public.join_requests;
create trigger join_request_notification_approved
  after update of status on public.join_requests
  for each row execute procedure public.notify_join_request_approved();

drop trigger if exists post_comment_notification_created on public.comments;
create trigger post_comment_notification_created
  after insert on public.comments
  for each row execute procedure public.notify_post_comment_created();

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
    and not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'messages'
    ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end;
$$;
