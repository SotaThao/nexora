create or replace function public.is_anonymous()
returns boolean
language sql
stable
set search_path = public
as $$
  select coalesce(auth.jwt() ->> 'is_anonymous', 'false') = 'true';
$$;

-- SECURITY DEFINER prevents RLS recursion when a membership policy calls this helper.
create or replace function public.is_member(p_community_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.community_members
    where community_id = p_community_id
      and user_id = auth.uid()
      and status = 'active'
  );
$$;

create or replace function public.is_community_admin(p_community_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.community_members
    where community_id = p_community_id
      and user_id = auth.uid()
      and status = 'active'
      and role in ('owner', 'admin')
  );
$$;

create or replace function public.is_community_moderator(p_community_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.community_members
    where community_id = p_community_id
      and user_id = auth.uid()
      and status = 'active'
      and role in ('owner', 'admin', 'moderator')
  );
$$;

create or replace function public.is_channel_member(p_channel_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.channels channel
    join public.community_members member on member.community_id = channel.community_id
    where channel.id = p_channel_id
      and member.user_id = auth.uid()
      and member.status = 'active'
  );
$$;

create or replace function public.is_official_community(p_community_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.communities
    where id = p_community_id and slug = 'nexora-official'
  );
$$;

create or replace function public.is_official_channel(p_channel_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.channels channel
    join public.communities community on community.id = channel.community_id
    where channel.id = p_channel_id and community.slug = 'nexora-official'
  );
$$;

alter table public.profiles enable row level security;
alter table public.communities enable row level security;
alter table public.community_members enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.reactions enable row level security;
alter table public.invites enable row level security;
alter table public.join_requests enable row level security;
alter table public.channels enable row level security;
alter table public.messages enable row level security;
alter table public.reports enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_log enable row level security;

create policy profiles_read_authenticated on public.profiles for select to authenticated using (auth.uid() is not null);
create policy profiles_update_self on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy communities_read_visible on public.communities for select to authenticated using (
  visibility = 'public' or public.is_member(id) or slug = 'nexora-official'
);
create policy communities_create_owner on public.communities for insert to authenticated with check (
  owner_id = auth.uid() and not public.is_anonymous()
);
create policy communities_update_admin on public.communities for update to authenticated using (
  public.is_community_admin(id)
) with check (public.is_community_admin(id));

create policy community_members_read_member on public.community_members for select to authenticated using (
  user_id = auth.uid() or public.is_member(community_id)
);

create policy posts_read_visible on public.posts for select to authenticated using (
  public.is_member(community_id) or public.is_official_community(community_id) or exists (
    select 1 from public.communities where communities.id = posts.community_id and communities.visibility = 'public'
  )
);
create policy posts_create_member on public.posts for insert to authenticated with check (
  author_id = auth.uid() and public.is_member(community_id)
);
create policy posts_update_author_or_moderator on public.posts for update to authenticated using (
  author_id = auth.uid() or public.is_community_moderator(community_id)
) with check (author_id = auth.uid() or public.is_community_moderator(community_id));
create policy posts_delete_author_or_moderator on public.posts for delete to authenticated using (
  author_id = auth.uid() or public.is_community_moderator(community_id)
);

create policy comments_read_post_reader on public.comments for select to authenticated using (
  exists (select 1 from public.posts where posts.id = comments.post_id)
);
create policy comments_create_post_member on public.comments for insert to authenticated with check (
  author_id = auth.uid() and exists (
    select 1 from public.posts where posts.id = comments.post_id and public.is_member(posts.community_id)
  )
);
create policy comments_delete_author_or_moderator on public.comments for delete to authenticated using (
  author_id = auth.uid() or exists (
    select 1 from public.posts where posts.id = comments.post_id and public.is_community_moderator(posts.community_id)
  )
);

create policy reactions_read_post_reader on public.reactions for select to authenticated using (
  exists (select 1 from public.posts where posts.id = reactions.post_id)
);
create policy reactions_create_self on public.reactions for insert to authenticated with check (
  user_id = auth.uid() and exists (
    select 1 from public.posts where posts.id = reactions.post_id and public.is_member(posts.community_id)
  )
);
create policy reactions_delete_self on public.reactions for delete to authenticated using (user_id = auth.uid());

create policy invites_read_admin on public.invites for select to authenticated using (public.is_community_admin(community_id));
create policy invites_create_admin on public.invites for insert to authenticated with check (
  created_by = auth.uid() and public.is_community_admin(community_id)
);
create policy invites_update_admin on public.invites for update to authenticated using (public.is_community_admin(community_id)) with check (public.is_community_admin(community_id));
create policy invites_delete_admin on public.invites for delete to authenticated using (public.is_community_admin(community_id));

create policy join_requests_read_requester_or_admin on public.join_requests for select to authenticated using (
  user_id = auth.uid() or public.is_community_admin(community_id)
);
create policy join_requests_create_self on public.join_requests for insert to authenticated with check (
  user_id = auth.uid() and not public.is_member(community_id)
);

create policy channels_read_member on public.channels for select to authenticated using (
  public.is_member(community_id) or public.is_official_community(community_id)
);

create policy messages_read_member on public.messages for select to authenticated using (
  public.is_channel_member(channel_id) or public.is_official_channel(channel_id)
);
create policy messages_create_member on public.messages for insert to authenticated with check (
  sender_id = auth.uid() and public.is_channel_member(channel_id)
);

create policy reports_read_owner_or_admin on public.reports for select to authenticated using (public.is_community_admin(community_id));
create policy reports_create_member on public.reports for insert to authenticated with check (
  reporter_id = auth.uid() and public.is_member(community_id)
);
create policy reports_update_owner_or_admin on public.reports for update to authenticated using (
  public.is_community_admin(community_id)
) with check (public.is_community_admin(community_id));

create policy notifications_read_self on public.notifications for select to authenticated using (user_id = auth.uid());
create policy notifications_update_self on public.notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy audit_log_read_owner_or_admin on public.audit_log for select to authenticated using (
  public.is_community_admin(community_id)
);

-- Anonymous-authenticated sessions are constrained restrictively. Permissive
-- member policies above cannot widen these rules because RESTRICTIVE policies
-- are ANDed with every matching permissive policy.
create policy profiles_anonymous_block on public.profiles as restrictive for all to authenticated using (not public.is_anonymous()) with check (not public.is_anonymous());
create policy comments_anonymous_block on public.comments as restrictive for all to authenticated using (not public.is_anonymous()) with check (not public.is_anonymous());
create policy reactions_anonymous_block on public.reactions as restrictive for all to authenticated using (not public.is_anonymous()) with check (not public.is_anonymous());
create policy invites_anonymous_block on public.invites as restrictive for all to authenticated using (not public.is_anonymous()) with check (not public.is_anonymous());
create policy join_requests_anonymous_block on public.join_requests as restrictive for all to authenticated using (not public.is_anonymous()) with check (not public.is_anonymous());
create policy reports_anonymous_block on public.reports as restrictive for all to authenticated using (not public.is_anonymous()) with check (not public.is_anonymous());
create policy notifications_anonymous_block on public.notifications as restrictive for all to authenticated using (not public.is_anonymous()) with check (not public.is_anonymous());
create policy audit_log_anonymous_block on public.audit_log as restrictive for all to authenticated using (not public.is_anonymous()) with check (not public.is_anonymous());

-- auth.jwt()->>'is_anonymous' must remain in the RESTRICTIVE read rules below.
create policy communities_anonymous_read on public.communities as restrictive for select to authenticated using (
  (auth.jwt() ->> 'is_anonymous') is distinct from 'true'
  or public.is_member(id)
  or slug = 'nexora-official'
);
create policy communities_anonymous_insert on public.communities as restrictive for insert to authenticated with check (not public.is_anonymous());
create policy communities_anonymous_update on public.communities as restrictive for update to authenticated using (not public.is_anonymous()) with check (not public.is_anonymous());
create policy communities_anonymous_delete on public.communities as restrictive for delete to authenticated using (not public.is_anonymous());

create policy community_members_anonymous_read on public.community_members as restrictive for select to authenticated using (
  not public.is_anonymous() or user_id = auth.uid()
);
create policy community_members_anonymous_insert on public.community_members as restrictive for insert to authenticated with check (not public.is_anonymous());
create policy community_members_anonymous_update on public.community_members as restrictive for update to authenticated using (not public.is_anonymous()) with check (not public.is_anonymous());
create policy community_members_anonymous_delete on public.community_members as restrictive for delete to authenticated using (not public.is_anonymous());

create policy posts_anonymous_read on public.posts as restrictive for select to authenticated using (
  (auth.jwt() ->> 'is_anonymous') is distinct from 'true'
  or public.is_member(community_id)
  or public.is_official_community(community_id)
);
create policy posts_anonymous_insert on public.posts as restrictive for insert to authenticated with check (not public.is_anonymous());
create policy posts_anonymous_update on public.posts as restrictive for update to authenticated using (not public.is_anonymous()) with check (not public.is_anonymous());
create policy posts_anonymous_delete on public.posts as restrictive for delete to authenticated using (not public.is_anonymous());

create policy channels_anonymous_read on public.channels as restrictive for select to authenticated using (
  not public.is_anonymous() or public.is_member(community_id) or public.is_official_community(community_id)
);
create policy channels_anonymous_insert on public.channels as restrictive for insert to authenticated with check (not public.is_anonymous());
create policy channels_anonymous_update on public.channels as restrictive for update to authenticated using (not public.is_anonymous()) with check (not public.is_anonymous());
create policy channels_anonymous_delete on public.channels as restrictive for delete to authenticated using (not public.is_anonymous());

create policy messages_anonymous_read on public.messages as restrictive for select to authenticated using (
  (auth.jwt() ->> 'is_anonymous') is distinct from 'true'
  or public.is_channel_member(channel_id)
  or public.is_official_channel(channel_id)
);
create policy messages_anonymous_insert on public.messages as restrictive for insert to authenticated with check (
  not public.is_anonymous() or public.is_channel_member(channel_id)
);
create policy messages_anonymous_update on public.messages as restrictive for update to authenticated using (not public.is_anonymous()) with check (not public.is_anonymous());
create policy messages_anonymous_delete on public.messages as restrictive for delete to authenticated using (not public.is_anonymous());
