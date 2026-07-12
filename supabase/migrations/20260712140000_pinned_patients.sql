-- Etappe 6: pinned (marked) patients.
--
-- A practice can mark patients it wants to keep an eye on. The mark is
-- internal practice organisation, so - like the internal short profile -
-- it lives in its own table without any patient policy: patients can
-- never see whether they are marked.

create table public.pinned_patients (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices (id) on delete cascade,
  patient_profile_id uuid not null references public.profiles (id) on delete cascade,
  note text not null default '' check (char_length(note) <= 200),
  pinned_by uuid references public.practice_members (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (practice_id, patient_profile_id)
);

comment on table public.pinned_patients is
  'Internal practice-only marker for patients that need attention. Not visible to patients. The note is organisational, never medical.';

alter table public.pinned_patients enable row level security;

create policy "pinned patients: members read"
  on public.pinned_patients for select
  using (public.is_practice_member(practice_id));
create policy "pinned patients: members create"
  on public.pinned_patients for insert
  with check (
    public.is_practice_member(practice_id)
    and public.member_can_view_patient(patient_profile_id)
  );
create policy "pinned patients: members delete"
  on public.pinned_patients for delete
  using (public.is_practice_member(practice_id));

grant select, insert, delete on public.pinned_patients to authenticated;
