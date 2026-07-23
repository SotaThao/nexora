create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'display_name', ''),
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      split_part(coalesce(new.email, ''), '@', 1),
      'Nexora member'
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.create_community_defaults()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.community_members (community_id, user_id, role, status)
  values (new.id, new.owner_id, 'owner', 'active')
  on conflict (community_id, user_id) do nothing;

  insert into public.channels (community_id, kind, name)
  values (new.id, 'main', 'Main')
  on conflict (community_id, kind) do nothing;
  return new;
end;
$$;

drop trigger if exists on_community_created on public.communities;
create trigger on_community_created
  after insert on public.communities
  for each row execute procedure public.create_community_defaults();

create or replace function public.enforce_community_media_visibility()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    new.media_visibility = coalesce(new.media_visibility, new.visibility);
    if new.media_visibility <> new.visibility then
      raise exception 'Media visibility must match community visibility at creation';
    end if;
    return new;
  end if;

  if new.visibility is distinct from old.visibility
    or new.media_visibility is distinct from old.media_visibility then
    raise exception 'Community visibility and media visibility are immutable after creation';
  end if;
  return new;
end;
$$;

drop trigger if exists community_media_visibility_immutable on public.communities;
create trigger community_media_visibility_immutable
  before insert or update on public.communities
  for each row execute procedure public.enforce_community_media_visibility();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles for each row execute procedure public.set_updated_at();
drop trigger if exists communities_set_updated_at on public.communities;
create trigger communities_set_updated_at before update on public.communities for each row execute procedure public.set_updated_at();
drop trigger if exists community_members_set_updated_at on public.community_members;
create trigger community_members_set_updated_at before update on public.community_members for each row execute procedure public.set_updated_at();
drop trigger if exists posts_set_updated_at on public.posts;
create trigger posts_set_updated_at before update on public.posts for each row execute procedure public.set_updated_at();
drop trigger if exists comments_set_updated_at on public.comments;
create trigger comments_set_updated_at before update on public.comments for each row execute procedure public.set_updated_at();
drop trigger if exists join_requests_set_updated_at on public.join_requests;
create trigger join_requests_set_updated_at before update on public.join_requests for each row execute procedure public.set_updated_at();
drop trigger if exists messages_set_updated_at on public.messages;
create trigger messages_set_updated_at before update on public.messages for each row execute procedure public.set_updated_at();
drop trigger if exists reports_set_updated_at on public.reports;
create trigger reports_set_updated_at before update on public.reports for each row execute procedure public.set_updated_at();
