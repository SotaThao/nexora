-- Job posts remain owned by Nailhub.ai; Nexora persists only the caller's
-- contact link to the existing direct-message channel.
create table public.community_job_contacts (
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  job_id text not null check (char_length(job_id) between 1 and 128),
  channel_id uuid not null references public.channels(id) on delete cascade,
  first_contacted_at timestamptz not null default now(),
  last_contacted_at timestamptz not null default now(),
  primary key (user_id, job_id)
);

create index community_job_contacts_user_last_contacted_idx
  on public.community_job_contacts (user_id, last_contacted_at desc);

alter table public.community_job_contacts enable row level security;

create policy community_job_contacts_read_own
on public.community_job_contacts
for select
to authenticated
using (
  user_id = auth.uid()
  and not public.is_anonymous()
);

create policy community_job_contacts_delete_own
on public.community_job_contacts
for delete
to authenticated
using (
  user_id = auth.uid()
  and not public.is_anonymous()
);

create policy community_job_contacts_create_own_direct
on public.community_job_contacts
for insert
to authenticated
with check (
  user_id = auth.uid()
  and not public.is_anonymous()
  and public.is_direct_channel_participant(channel_id)
);

create policy community_job_contacts_update_own_direct
on public.community_job_contacts
for update
to authenticated
using (
  user_id = auth.uid()
  and not public.is_anonymous()
)
with check (
  user_id = auth.uid()
  and not public.is_anonymous()
  and public.is_direct_channel_participant(channel_id)
);

revoke all on table public.community_job_contacts from anon, public;
grant select, insert, update, delete on table public.community_job_contacts to authenticated;
