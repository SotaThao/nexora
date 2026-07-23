-- Public preview only. Apply an API gateway or Edge Function per-IP rate limit
-- before exposing this RPC broadly; database functions cannot safely infer IP.
create or replace function public.validate_invite(p_token text)
returns table (
  community_id uuid,
  community_name text,
  community_slug text,
  expires_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
begin
  if coalesce(trim(p_token), '') = '' then
    return;
  end if;

  -- This is intentionally callable by the unauthenticated anon role. An
  -- anonymous-authenticated session receives the same preview and no mutation.
  if public.is_anonymous() then
    null;
  end if;

  return query
  select invite.community_id, community.name, community.slug, invite.expires_at
  from public.invites invite
  join public.communities community on community.id = invite.community_id
  where invite.token_hash = encode(digest(p_token, 'sha256'), 'hex')
    and invite.revoked_at is null
    and (invite.expires_at is null or invite.expires_at > now())
    and (not invite.single_use or invite.consumed_at is null);
end;
$$;

create or replace function public.consume_invite(p_token text)
returns public.community_members
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user_id uuid := auth.uid();
  v_invite public.invites%rowtype;
  v_member public.community_members%rowtype;
begin
  if v_user_id is null then
    raise exception 'Authentication is required to consume an invite';
  end if;

  -- Anonymous-authenticated members may join only through this RPC. The RLS
  -- pack limits their resulting membership to reads and group messages.
  if public.is_anonymous() then
    null;
  end if;

  select * into v_invite
  from public.invites
  where token_hash = encode(digest(p_token, 'sha256'), 'hex')
  for update;

  if not found or v_invite.revoked_at is not null then
    raise exception 'Invite is invalid';
  end if;
  if v_invite.expires_at is not null and v_invite.expires_at <= now() then
    raise exception 'Invite has expired';
  end if;
  if v_invite.single_use and v_invite.consumed_at is not null then
    raise exception 'Invite has already been consumed';
  end if;

  select * into v_member
  from public.community_members
  where community_id = v_invite.community_id and user_id = v_user_id
  for update;

  if found then
    if v_member.status = 'banned' then
      raise exception 'Banned members cannot consume invites';
    end if;
    update public.community_members
    set status = 'active'
    where id = v_member.id
    returning * into v_member;
  else
    insert into public.community_members (community_id, user_id, role, status)
    values (v_invite.community_id, v_user_id, 'member', 'active')
    returning * into v_member;
  end if;

  if v_invite.single_use then
    update public.invites
    set consumed_by = v_user_id, consumed_at = now()
    where id = v_invite.id;
  end if;

  return v_member;
end;
$$;

create or replace function public.approve_join(p_request_id uuid)
returns public.join_requests
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user_id uuid := auth.uid();
  v_request public.join_requests%rowtype;
  v_member public.community_members%rowtype;
begin
  if v_user_id is null or public.is_anonymous() then
    raise exception 'Only signed-in community administrators can approve requests';
  end if;

  select * into v_request from public.join_requests where id = p_request_id for update;
  if not found then
    raise exception 'Join request not found';
  end if;
  if not public.is_community_admin(v_request.community_id) then
    raise exception 'Only an owner or admin can approve join requests';
  end if;
  if v_request.status <> 'pending' then
    raise exception 'Join request is no longer pending';
  end if;

  select * into v_member
  from public.community_members
  where community_id = v_request.community_id and user_id = v_request.user_id
  for update;

  if found then
    if v_member.status = 'banned' then
      raise exception 'Banned members cannot be approved';
    end if;
    update public.community_members set status = 'active' where id = v_member.id;
  else
    insert into public.community_members (community_id, user_id, role, status)
    values (v_request.community_id, v_request.user_id, 'member', 'active');
  end if;

  update public.join_requests
  set status = 'approved', reviewed_by = v_user_id, reviewed_at = now()
  where id = v_request.id
  returning * into v_request;
  return v_request;
end;
$$;

create or replace function public.reject_join(p_request_id uuid)
returns public.join_requests
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user_id uuid := auth.uid();
  v_request public.join_requests%rowtype;
begin
  if v_user_id is null or public.is_anonymous() then
    raise exception 'Only signed-in community administrators can reject requests';
  end if;

  select * into v_request from public.join_requests where id = p_request_id for update;
  if not found then
    raise exception 'Join request not found';
  end if;
  if not public.is_community_admin(v_request.community_id) then
    raise exception 'Only an owner or admin can reject join requests';
  end if;
  if v_request.status <> 'pending' then
    raise exception 'Join request is no longer pending';
  end if;

  update public.join_requests
  set status = 'rejected', reviewed_by = v_user_id, reviewed_at = now()
  where id = v_request.id
  returning * into v_request;
  return v_request;
end;
$$;

create or replace function public.change_role(
  p_community_id uuid,
  p_user_id uuid,
  p_new_role public.member_role
)
returns public.community_members
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user_id uuid := auth.uid();
  v_member public.community_members%rowtype;
  v_owner_count integer;
begin
  if v_user_id is null or public.is_anonymous() then
    raise exception 'Only signed-in community administrators can change roles';
  end if;
  if not public.is_community_admin(p_community_id) then
    raise exception 'Only an owner or admin can change roles';
  end if;

  select * into v_member
  from public.community_members
  where community_id = p_community_id and user_id = p_user_id
  for update;
  if not found then
    raise exception 'Community member not found';
  end if;

  if v_member.role = 'owner' and p_new_role <> 'owner' then
    perform 1 from public.community_members
    where community_id = p_community_id and role = 'owner' and status = 'active'
    for update;
    select count(*) into v_owner_count
    from public.community_members
    where community_id = p_community_id and role = 'owner' and status = 'active';
    if v_owner_count <= 1 then
      raise exception 'Cannot remove or downgrade the last owner';
    end if;
  end if;

  update public.community_members
  set role = p_new_role
  where id = v_member.id
  returning * into v_member;
  return v_member;
end;
$$;

create or replace function public.moderate(
  p_community_id uuid,
  p_action text,
  p_target_id uuid,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user_id uuid := auth.uid();
  v_post public.posts%rowtype;
  v_member public.community_members%rowtype;
  v_owner_count integer;
begin
  if v_user_id is null or public.is_anonymous() then
    raise exception 'Only signed-in community administrators can moderate';
  end if;
  if not public.is_community_admin(p_community_id) then
    raise exception 'Only an owner or admin can moderate';
  end if;

  if p_action = 'remove_post' then
    select * into v_post from public.posts
    where id = p_target_id and community_id = p_community_id
    for update;
    if not found then
      raise exception 'Post not found in this community';
    end if;
    delete from public.posts where id = v_post.id;
  elsif p_action = 'remove_member' then
    select * into v_member from public.community_members
    where id = p_target_id and community_id = p_community_id
    for update;
    if not found then
      raise exception 'Community member not found';
    end if;
    if v_member.role = 'owner' and v_member.status = 'active' then
      perform 1 from public.community_members
      where community_id = p_community_id and role = 'owner' and status = 'active'
      for update;
      select count(*) into v_owner_count from public.community_members
      where community_id = p_community_id and role = 'owner' and status = 'active';
      if v_owner_count <= 1 then
        raise exception 'Cannot remove the last owner';
      end if;
    end if;
    delete from public.community_members where id = v_member.id;
  else
    raise exception 'Unsupported moderation action';
  end if;

  insert into public.audit_log (community_id, actor_id, action, target_type, target_id, meta)
  values (
    p_community_id,
    v_user_id,
    p_action,
    case when p_action = 'remove_post' then 'post' else 'member' end,
    p_target_id,
    jsonb_build_object('reason', p_reason)
  );
end;
$$;

alter default privileges in schema public revoke execute on functions from public;

revoke execute on function public.validate_invite(text) from anon, authenticated, public;
revoke execute on function public.consume_invite(text) from anon, authenticated, public;
revoke execute on function public.approve_join(uuid) from anon, authenticated, public;
revoke execute on function public.reject_join(uuid) from anon, authenticated, public;
revoke execute on function public.change_role(uuid, uuid, public.member_role) from anon, authenticated, public;
revoke execute on function public.moderate(uuid, text, uuid, text) from anon, authenticated, public;

grant execute on function public.validate_invite(text) to anon, authenticated;
grant execute on function public.consume_invite(text) to authenticated;
grant execute on function public.approve_join(uuid) to authenticated;
grant execute on function public.reject_join(uuid) to authenticated;
grant execute on function public.change_role(uuid, uuid, public.member_role) to authenticated;
grant execute on function public.moderate(uuid, text, uuid, text) to authenticated;
