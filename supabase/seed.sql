-- Community demo domain data. This file is safe for `supabase db reset`: it
-- becomes a no-op until the three UUID settings below are supplied.
--
-- Manual convention (the Node seed script sets these values for you):
--   select set_config('app.demo_jessica_id', '<auth uuid>', false);
--   select set_config('app.demo_kayla_id', '<auth uuid>', false);
--   select set_config('app.demo_linh_id', '<auth uuid>', false);
--   \i supabase/seed.sql
--
-- The active invite's raw token is `nexora-demo-invite`; only its SHA-256 hash
-- is inserted, in line with the production schema.

do $$
declare
  v_jessica uuid := nullif(current_setting('app.demo_jessica_id', true), '')::uuid;
  v_kayla uuid := nullif(current_setting('app.demo_kayla_id', true), '')::uuid;
  v_linh uuid := nullif(current_setting('app.demo_linh_id', true), '')::uuid;
  v_official uuid;
  v_bitcoin uuid;
  v_houston uuid;
  v_announcement uuid;
  v_houston_post uuid;
begin
  if v_jessica is null or v_kayla is null or v_linh is null then
    raise notice 'Community seed skipped: set app.demo_jessica_id, app.demo_kayla_id, and app.demo_linh_id first.';
    return;
  end if;

  insert into public.profiles (id, display_name, bio)
  values
    (v_jessica, 'Jessica Nguyen', 'Thợ nail tại Houston'),
    (v_kayla, 'Kayla Le', 'Chủ Bitcoin Nail Bar'),
    (v_linh, 'Linh Tran', 'Khách demo Nexora')
  on conflict (id) do update set display_name = excluded.display_name, bio = excluded.bio;

  delete from public.communities
  where slug in ('nexora-official', 'bitcoin-nail-bar-team', 'nail-houston');

  insert into public.communities (name, slug, description, kind, visibility, media_visibility, verified, owner_id)
  values
    ('Nexora Official', 'nexora-official', 'Cộng đồng chính thức của Nexora dành cho thợ nail và chủ salon.', 'public', 'public', 'public', true, v_kayla)
  returning id into v_official;

  insert into public.communities (name, slug, description, kind, visibility, media_visibility, verified, owner_id)
  values
    ('Bitcoin Nail Bar Team', 'bitcoin-nail-bar-team', 'Nhóm nội bộ của Bitcoin Nail Bar — lịch training, ca làm và chia sẻ mẫu nail.', 'salon', 'private', 'private', true, v_kayla)
  returning id into v_bitcoin;

  insert into public.communities (name, slug, description, kind, visibility, media_visibility, verified, owner_id)
  values
    ('Nail Houston', 'nail-houston', 'Nơi thợ nail Houston chia sẻ kinh nghiệm, mẫu mới và nguồn hàng.', 'public', 'public', 'public', false, v_jessica)
  returning id into v_houston;

  insert into public.community_members (community_id, user_id, role, status)
  values
    (v_official, v_jessica, 'member', 'active'),
    (v_official, v_linh, 'member', 'active'),
    (v_bitcoin, v_jessica, 'admin', 'active'),
    (v_houston, v_linh, 'member', 'active')
  on conflict (community_id, user_id) do update set role = excluded.role, status = excluded.status;

  insert into public.posts (community_id, author_id, body, is_announcement, created_at)
  values (v_bitcoin, v_kayla, 'Lịch training Gel-X tuần này dời sang thứ Năm, 10am. Ai chưa đăng ký hãy bình luận bên dưới để tiệm chuẩn bị kit nhé.', true, now() - interval '2 hours')
  returning id into v_announcement;

  insert into public.posts (community_id, author_id, body, is_announcement, created_at)
  values (v_houston, v_jessica, 'Bộ french ombre mới cho khách hôm nay. Mọi người góp ý giúp mình phần blend màu với nhé!', false, now() - interval '4 hours')
  returning id into v_houston_post;

  insert into public.posts (community_id, author_id, body, is_announcement, created_at)
  values (v_official, v_kayla, 'Chào mừng mọi người đến Nexora Community. Hãy chia sẻ mẹo nghề tử tế và hỗ trợ nhau phát triển.', true, now() - interval '1 day');

  insert into public.comments (post_id, author_id, body, created_at)
  values
    (v_announcement, v_jessica, 'Em đã đăng ký, cảm ơn chị Kayla!', now() - interval '90 minutes'),
    (v_houston_post, v_linh, 'Màu ombre rất xinh, phần tip nhìn sạch lắm ạ.', now() - interval '3 hours');

  insert into public.reactions (post_id, user_id, type)
  values
    (v_announcement, v_jessica, 'love'),
    (v_announcement, v_linh, 'like'),
    (v_houston_post, v_kayla, 'like'),
    (v_houston_post, v_linh, 'celebrate');

  insert into public.join_requests (community_id, user_id, message, status)
  values (v_houston, v_kayla, 'Mình muốn theo dõi các mẫu nail mới ở Houston.', 'pending');

  insert into public.invites (community_id, created_by, token_hash, expires_at, single_use)
  values (
    v_bitcoin,
    v_kayla,
    encode(extensions.digest('nexora-demo-invite', 'sha256'), 'hex'),
    now() + interval '30 days',
    true
  );
end;
$$;
