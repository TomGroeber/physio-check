-- Etappe 5: internal patient short profile + permanent document deletion.
--
-- The short profile lives in its own table (NOT on patient_practice_links):
-- patients can read their own link row, so a column there would leak the
-- internal note. This table has no patient policy at all - only practice
-- members of the owning practice can read or write it.

create table public.patient_internal_profiles (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices (id) on delete cascade,
  patient_profile_id uuid not null references public.profiles (id) on delete cascade,
  content text not null default '' check (char_length(content) <= 2000),
  updated_by uuid references public.practice_members (id) on delete set null,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (practice_id, patient_profile_id)
);

comment on table public.patient_internal_profiles is
  'Internal, practice-only short profile per patient. Never visible to patients; no diagnoses required - free text maintained by the practice.';

alter table public.patient_internal_profiles enable row level security;

create policy "internal profiles: members read"
  on public.patient_internal_profiles for select
  using (public.is_practice_member(practice_id));
create policy "internal profiles: members create"
  on public.patient_internal_profiles for insert
  with check (
    public.is_practice_member(practice_id)
    and public.member_can_view_patient(patient_profile_id)
  );
create policy "internal profiles: members update"
  on public.patient_internal_profiles for update
  using (public.is_practice_member(practice_id))
  with check (public.is_practice_member(practice_id));

grant select, insert, update on public.patient_internal_profiles to authenticated;

-- ---------- permanent deletion of patient documents ----------

-- Deletion is restricted to already archived documents (two-step safety:
-- archive first, then delete). The storage object is removed by the server
-- action after this row-level delete succeeds.

create policy "patient documents: members delete archived"
  on public.patient_documents for delete
  using (
    public.is_practice_member(practice_id)
    and archived_at is not null
  );

grant delete on public.patient_documents to authenticated;
