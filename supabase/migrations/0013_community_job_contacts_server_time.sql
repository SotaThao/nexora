-- Contact chronology is database-owned so client clocks cannot rewrite the
-- first-contact timestamp or choose the ordering timestamp.
create or replace function public.set_community_job_contact_timestamps()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.last_contacted_at := now();

  if tg_op = 'INSERT' then
    new.first_contacted_at := now();
  else
    new.first_contacted_at := old.first_contacted_at;
  end if;

  return new;
end;
$$;

create trigger community_job_contacts_set_timestamps
before insert or update on public.community_job_contacts
for each row execute function public.set_community_job_contact_timestamps();

-- Remove table-owner-style defaults before restoring the least privileges the
-- authenticated application needs. Anonymous and public access stays revoked.
revoke all on table public.community_job_contacts from anon, public;
revoke all on table public.community_job_contacts from authenticated;
grant select, insert, update, delete on table public.community_job_contacts to authenticated;
