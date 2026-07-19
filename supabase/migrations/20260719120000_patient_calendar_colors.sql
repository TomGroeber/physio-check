-- ============================================================
-- Calendar colors move from practice members to PATIENTS (D-057).
--
-- The practice assigns one color per patient (per practice, so every
-- practice keeps its own scheme after a patient switches). The calendar
-- then colors appointments by patient, with the patient name always
-- shown next to the color (WCAG 1.4.1). The old per-member color
-- feature is removed entirely.
--
-- The table is practice-internal organizational data (same reasoning as
-- pinned_patients): there is intentionally NO patient policy, so
-- patients can never read which color their practice assigned.
-- ============================================================

create table public.patient_calendar_colors (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices (id) on delete cascade,
  patient_profile_id uuid not null references public.profiles (id) on delete cascade,
  color text not null
    constraint patient_calendar_colors_color check (
      color in ('teal', 'indigo', 'amber', 'rose', 'emerald', 'violet', 'cyan', 'slate')
    ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (practice_id, patient_profile_id)
);

create trigger patient_calendar_colors_updated_at
  before update on public.patient_calendar_colors
  for each row execute function public.set_updated_at();

alter table public.patient_calendar_colors enable row level security;

create policy "patient_calendar_colors: members read"
  on public.patient_calendar_colors for select
  using (public.is_practice_member(practice_id));

-- Like pinned_patients: assigning requires an ACTIVE link to the
-- patient, so a practice can never tag arbitrary foreign profiles.
create policy "patient_calendar_colors: members insert"
  on public.patient_calendar_colors for insert
  with check (
    public.is_practice_member(practice_id)
    and public.member_can_view_patient(patient_profile_id)
  );

create policy "patient_calendar_colors: members update"
  on public.patient_calendar_colors for update
  using (public.is_practice_member(practice_id))
  with check (
    public.is_practice_member(practice_id)
    and public.member_can_view_patient(patient_profile_id)
  );

create policy "patient_calendar_colors: members delete"
  on public.patient_calendar_colors for delete
  using (public.is_practice_member(practice_id));

grant select, insert, update, delete on public.patient_calendar_colors to authenticated;

-- ---------- remove the old per-member color feature ----------
drop policy "practice members: update own calendar color" on public.practice_members;
revoke update (calendar_color) on public.practice_members from authenticated;
alter table public.practice_members drop column calendar_color;
