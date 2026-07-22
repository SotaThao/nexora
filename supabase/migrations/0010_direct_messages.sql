-- Direct messages reuse public.channels and public.messages so the existing
-- history, reply, and Realtime message path remains shared with group chat.
-- Group-channel RLS stays untouched; additive direct-participant policies grant
-- access only when the caller belongs to the direct channel.

alter type public.channel_kind add value if not exists 'direct';

alter table public.channels
  alter column community_id drop not null,
  add column if not exists direct_user_low_id uuid references public.profiles(id) on delete cascade,
  add column if not exists direct_user_high_id uuid references public.profiles(id) on delete cascade;

-- The existing unique (community_id, kind) constraint still enforces one group
-- channel per community. NULL community IDs do not conflict, so direct channels
-- are deduplicated independently by their canonical participant pair.
alter table public.channels
  add constraint channels_direct_pair_order
    check (
      direct_user_low_id is null
      or direct_user_high_id is null
      or direct_user_low_id::text < direct_user_high_id::text
    ),
  add constraint channels_scope_matches_kind
    check (
      (
        kind::text = 'direct'
        and community_id is null
        and direct_user_low_id is not null
        and direct_user_high_id is not null
      )
      or
      (
        kind::text <> 'direct'
        and community_id is not null
        and direct_user_low_id is null
        and direct_user_high_id is null
      )
    ),
  add constraint channels_direct_pair_key unique (direct_user_low_id, direct_user_high_id);

create table public.direct_channel_participants (
  channel_id uuid not null references public.channels(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (channel_id, user_id)
);

create index direct_channel_participants_user_channel_idx
  on public.direct_channel_participants (user_id, channel_id);

alter table public.direct_channel_participants enable row level security;

-- SECURITY DEFINER avoids policy recursion while resolving channel membership.
create or replace function public.is_direct_channel_participant(p_channel_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.direct_channel_participants participant
    join public.channels channel on channel.id = participant.channel_id
    where participant.channel_id = p_channel_id
      and participant.user_id = auth.uid()
      and channel.kind::text = 'direct'
  );
$$;

create policy direct_channel_participants_read_channel
on public.direct_channel_participants
for select
to authenticated
using (
  not public.is_anonymous()
  and public.is_direct_channel_participant(channel_id)
);

create policy channels_read_direct_participant
on public.channels
for select
to authenticated
using (
  kind::text = 'direct'
  and not public.is_anonymous()
  and public.is_direct_channel_participant(id)
);

create policy messages_read_direct_participant
on public.messages
for select
to authenticated
using (
  not public.is_anonymous()
  and public.is_direct_channel_participant(channel_id)
);

create policy messages_create_direct_participant
on public.messages
for insert
to authenticated
with check (
  sender_id = auth.uid()
  and not public.is_anonymous()
  and public.is_direct_channel_participant(channel_id)
);

-- DM-open scope tradeoff: any signed-in, non-anonymous user may discover any
-- profile. RLS is row-level, so DM consumers use the minimal directory view
-- below; auth.users and non-directory profile fields are not exposed by it.
drop policy if exists profiles_read_authenticated on public.profiles;

create policy profiles_read_dm_open_scope
on public.profiles
for select
to authenticated
using (auth.uid() is not null and not public.is_anonymous());

create or replace view public.dm_profile_directory
with (security_invoker = true)
as
select id, display_name, avatar_path
from public.profiles;

revoke all on table public.dm_profile_directory from anon, public;
grant select on table public.dm_profile_directory to authenticated;

revoke all on table public.direct_channel_participants from anon, public;
revoke all on table public.direct_channel_participants from authenticated;
grant select on table public.direct_channel_participants to authenticated;

-- TODO(prod): rate-limit / block-list before enabling unrestricted DM creation.
create or replace function public.find_or_create_direct_channel(p_other_user_id uuid)
returns public.channels
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user_id uuid := auth.uid();
  v_low_user_id uuid;
  v_high_user_id uuid;
  v_channel public.channels%rowtype;
begin
  if v_user_id is null or public.is_anonymous() then
    raise exception 'Only signed-in users can create direct messages';
  end if;
  if p_other_user_id is null then
    raise exception 'The other user is required';
  end if;
  if p_other_user_id = v_user_id then
    raise exception 'You cannot create a direct message with yourself';
  end if;
  if not exists (select 1 from public.profiles where id = p_other_user_id) then
    raise exception 'The other user does not exist';
  end if;

  if v_user_id::text < p_other_user_id::text then
    v_low_user_id := v_user_id;
    v_high_user_id := p_other_user_id;
  else
    v_low_user_id := p_other_user_id;
    v_high_user_id := v_user_id;
  end if;

  insert into public.channels (
    community_id,
    kind,
    name,
    direct_user_low_id,
    direct_user_high_id
  )
  values (
    null,
    'direct',
    'Direct',
    v_low_user_id,
    v_high_user_id
  )
  on conflict (direct_user_low_id, direct_user_high_id)
  do update set direct_user_low_id = excluded.direct_user_low_id
  returning * into v_channel;

  insert into public.direct_channel_participants (channel_id, user_id)
  values
    (v_channel.id, v_low_user_id),
    (v_channel.id, v_high_user_id)
  on conflict (channel_id, user_id) do nothing;

  return v_channel;
end;
$$;

revoke execute on function public.is_direct_channel_participant(uuid) from anon, authenticated, public;
revoke execute on function public.find_or_create_direct_channel(uuid) from anon, authenticated, public;

grant execute on function public.is_direct_channel_participant(uuid) to authenticated;
grant execute on function public.find_or_create_direct_channel(uuid) to authenticated;
