-- Etappe 7: practice waitlist.
--
-- Internal list of linked patients waiting for (additional) appointments.
-- Like pins and internal profiles this is practice organisation: no
-- patient policy, patients cannot see the list. Preferred times and the
-- note are organisational free text - no health data by convention (UI
-- says so explicitly).

create type public.waitlist_priority as enum ('normal', 'high');
create type public.waitlist_status as enum ('waiting', 'resolved');

create table public.practice_waitlist_entries (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices (id) on delete cascade,
  patient_profile_id uuid not null references public.profiles (id) on delete cascade,
  preferred_times text not null default '' check (char_length(preferred_times) <= 200),
  priority public.waitlist_priority not null default 'normal',
  note text not null default '' check (char_length(note) <= 500),
  status public.waitlist_status not null default 'waiting',
  created_by uuid references public.practice_members (id) on delete set null,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

-- One open entry per patient and practice; resolved history may pile up.
create unique index waitlist_one_waiting_per_patient
  on public.practice_waitlist_entries (practice_id, patient_profile_id)
  where status = 'waiting';

create index waitlist_practice_idx
  on public.practice_waitlist_entries (practice_id, status, priority, created_at);

alter table public.practice_waitlist_entries enable row level security;

create policy "waitlist: members read"
  on public.practice_waitlist_entries for select
  using (public.is_practice_member(practice_id));
create policy "waitlist: members create"
  on public.practice_waitlist_entries for insert
  with check (
    public.is_practice_member(practice_id)
    and public.member_can_view_patient(patient_profile_id)
  );
create policy "waitlist: members update"
  on public.practice_waitlist_entries for update
  using (public.is_practice_member(practice_id))
  with check (public.is_practice_member(practice_id));
create policy "waitlist: members delete"
  on public.practice_waitlist_entries for delete
  using (public.is_practice_member(practice_id));

grant select, insert, update, delete on public.practice_waitlist_entries to authenticated;
