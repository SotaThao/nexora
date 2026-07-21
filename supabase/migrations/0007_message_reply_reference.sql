-- 0007_message_reply_reference.sql
-- Adds inline reply-quote support to community chat (Chat-2 locked design).
-- messages.reply_to_message_id: nullable self-reference; on delete set null so
-- a reply survives if its parent is removed. Same-channel integrity is enforced
-- by a trigger below (a reply may only quote a message in the same channel).

alter table public.messages
  add column if not exists reply_to_message_id uuid
  references public.messages(id) on delete set null;

create index if not exists messages_reply_to_idx
  on public.messages(reply_to_message_id);

-- Enforce that a reply quotes a message in the SAME channel.
create or replace function public.enforce_reply_same_channel()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  parent_channel uuid;
begin
  if new.reply_to_message_id is null then
    return new;
  end if;
  select channel_id into parent_channel
    from public.messages
    where id = new.reply_to_message_id;
  if parent_channel is null or parent_channel <> new.channel_id then
    raise exception 'reply_to_message_id must reference a message in the same channel';
  end if;
  return new;
end;
$$;

drop trigger if exists messages_reply_same_channel on public.messages;
create trigger messages_reply_same_channel
  before insert or update of reply_to_message_id on public.messages
  for each row execute function public.enforce_reply_same_channel();
