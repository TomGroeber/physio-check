-- ============================================================
-- PhysioCheck – initial schema
-- Source of truth: docs/DATA_MODEL.md
-- Conventions: UUID PKs, timestamptz (UTC), RLS on every table.
-- Privileges are granted ONLY via practice_members rows, which are
-- written exclusively by server-side code (service role). No
-- client-facing write path can escalate a user's role.
-- ============================================================

-- ---------- enums ----------
create type public.practice_role as enum ('therapist', 'admin');
create type public.link_status as enum ('active', 'ended');
create type public.dosage_type as enum ('repetitions', 'duration');
create type public.plan_status as enum ('active', 'archived');
create type public.completion_status as enum ('completed', 'partial', 'too_difficult', 'not_possible');
create type public.appointment_status as enum ('scheduled', 'cancellation_requested', 'cancelled', 'completed');
create type public.cancellation_status as enum ('pending', 'approved', 'rejected');
create type public.media_kind as enum ('video', 'thumbnail', 'captions', 'fallback_image');

-- ---------- updated_at helper ----------
create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------- profiles ----------
-- One row per auth user. Carries NO role: privileges live only in
-- practice_members (defense against self-escalation).
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  locale text not null default 'de',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create a profile for every new auth user.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, locale)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'locale', 'de')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- practices ----------
create table public.practices (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address_street text not null default '',
  address_postal_code text not null default '',
  address_city text not null default '',
  phone text not null default '',
  timezone text not null default 'Europe/Luxembourg',
  -- practice-level settings, e.g. inactivity_days for the dashboard
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger practices_updated_at
  before update on public.practices
  for each row execute function public.set_updated_at();

-- ---------- practice_members ----------
create table public.practice_members (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  role public.practice_role not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (practice_id, profile_id)
);

create index practice_members_profile_idx on public.practice_members (profile_id);

-- ---------- patient_practice_links ----------
create table public.patient_practice_links (
  id uuid primary key default gen_random_uuid(),
  patient_profile_id uuid not null references public.profiles (id) on delete cascade,
  practice_id uuid not null references public.practices (id) on delete cascade,
  primary_therapist_id uuid references public.practice_members (id) on delete set null,
  status public.link_status not null default 'active',
  linked_at timestamptz not null default now(),
  ended_at timestamptz
);

create index patient_links_patient_idx on public.patient_practice_links (patient_profile_id);
create index patient_links_practice_idx on public.patient_practice_links (practice_id);
-- one active link per patient and practice
create unique index patient_links_active_unique
  on public.patient_practice_links (patient_profile_id, practice_id)
  where status = 'active';

-- ---------- patient_invites ----------
-- Only a hash of the invite code is stored; the plaintext code is
-- shown once to the therapist and never persisted.
create table public.patient_invites (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices (id) on delete cascade,
  created_by uuid not null references public.practice_members (id),
  patient_display_name text not null,
  code_hash text not null unique,
  expires_at timestamptz not null default now() + interval '7 days',
  revoked_at timestamptz,
  used_at timestamptz,
  used_by_profile_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index patient_invites_practice_idx on public.patient_invites (practice_id);

-- ---------- exercises ----------
create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices (id) on delete cascade,
  created_by uuid references public.practice_members (id) on delete set null,
  title text not null,
  description text not null default '',
  starting_position text not null default '',
  -- ordered list of plain-text instruction steps
  steps jsonb not null default '[]'::jsonb,
  common_mistakes text not null default '',
  equipment text not null default '',
  default_dosage_type public.dosage_type not null default 'repetitions',
  default_sets int check (default_sets between 1 and 20),
  default_repetitions int check (default_repetitions between 1 and 100),
  default_hold_seconds int check (default_hold_seconds between 1 and 600),
  default_rest_seconds int check (default_rest_seconds between 0 and 600),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index exercises_practice_idx on public.exercises (practice_id);

create trigger exercises_updated_at
  before update on public.exercises
  for each row execute function public.set_updated_at();

-- ---------- exercise_media ----------
create table public.exercise_media (
  id uuid primary key default gen_random_uuid(),
  exercise_id uuid not null references public.exercises (id) on delete cascade,
  kind public.media_kind not null,
  storage_path text not null,
  mime_type text not null,
  size_bytes bigint not null default 0,
  duration_seconds int,
  created_at timestamptz not null default now()
);

create index exercise_media_exercise_idx on public.exercise_media (exercise_id);

-- ---------- exercise_plans ----------
create table public.exercise_plans (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices (id) on delete cascade,
  patient_profile_id uuid not null references public.profiles (id) on delete cascade,
  created_by uuid references public.practice_members (id) on delete set null,
  title text not null default 'Übungsplan',
  status public.plan_status not null default 'active',
  -- points at the currently valid version (set after first version insert)
  current_version_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index exercise_plans_patient_idx on public.exercise_plans (patient_profile_id);
create index exercise_plans_practice_idx on public.exercise_plans (practice_id);

create trigger exercise_plans_updated_at
  before update on public.exercise_plans
  for each row execute function public.set_updated_at();

-- ---------- exercise_plan_versions ----------
-- Every change creates a new version; old completion logs keep
-- pointing at items of older versions and are never altered.
create table public.exercise_plan_versions (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.exercise_plans (id) on delete cascade,
  version_number int not null,
  created_by uuid references public.practice_members (id) on delete set null,
  change_note text not null default '',
  created_at timestamptz not null default now(),
  unique (plan_id, version_number)
);

alter table public.exercise_plans
  add constraint exercise_plans_current_version_fk
  foreign key (current_version_id) references public.exercise_plan_versions (id)
  on delete set null;

-- ---------- exercise_plan_items ----------
create table public.exercise_plan_items (
  id uuid primary key default gen_random_uuid(),
  plan_version_id uuid not null references public.exercise_plan_versions (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id),
  sort_order int not null default 0,
  start_date date not null,
  end_date date,
  -- either {"weekdays":[1,3,5]} (ISO: Mon=1..Sun=7) or {"times_per_week":3}
  schedule jsonb not null default '{"weekdays":[1,2,3,4,5,6,7]}'::jsonb,
  sets int check (sets between 1 and 20),
  repetitions int check (repetitions between 1 and 100),
  hold_seconds int check (hold_seconds between 1 and 600),
  total_duration_seconds int check (total_duration_seconds between 1 and 3600),
  rest_seconds int check (rest_seconds between 0 and 600),
  note text not null default '',
  check (end_date is null or end_date >= start_date)
);

create index plan_items_version_idx on public.exercise_plan_items (plan_version_id);
create index plan_items_exercise_idx on public.exercise_plan_items (exercise_id);

-- ---------- completion_logs ----------
-- Self-reported adherence. Immutable by design (no update policy).
-- prescription_snapshot preserves the exact prescription at the time
-- of logging so later plan edits can never distort history.
create table public.completion_logs (
  id uuid primary key default gen_random_uuid(),
  patient_profile_id uuid not null references public.profiles (id) on delete cascade,
  plan_item_id uuid not null references public.exercise_plan_items (id),
  performed_on date not null,
  performed_at timestamptz not null default now(),
  status public.completion_status not null,
  sets_completed int check (sets_completed between 0 and 20),
  pain_before int check (pain_before between 0 and 10),
  pain_after int check (pain_after between 0 and 10),
  note text not null default '',
  prescription_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index completion_logs_patient_day_idx
  on public.completion_logs (patient_profile_id, performed_on);
create index completion_logs_item_idx on public.completion_logs (plan_item_id);

-- ---------- appointments ----------
create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices (id) on delete cascade,
  patient_profile_id uuid not null references public.profiles (id) on delete cascade,
  therapist_member_id uuid references public.practice_members (id) on delete set null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  timezone text not null default 'Europe/Luxembourg',
  location_name text not null default '',
  address text not null default '',
  note text not null default '',
  status public.appointment_status not null default 'scheduled',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create index appointments_practice_time_idx on public.appointments (practice_id, starts_at);
create index appointments_patient_time_idx on public.appointments (patient_profile_id, starts_at);

create trigger appointments_updated_at
  before update on public.appointments
  for each row execute function public.set_updated_at();

-- ---------- cancellation_requests ----------
create table public.cancellation_requests (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments (id) on delete cascade,
  requested_by uuid not null references public.profiles (id),
  reason text not null default '',
  status public.cancellation_status not null default 'pending',
  decided_by uuid references public.practice_members (id) on delete set null,
  decided_at timestamptz,
  created_at timestamptz not null default now()
);

create index cancellation_requests_appointment_idx
  on public.cancellation_requests (appointment_id);

-- ---------- notifications ----------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_profile_id uuid not null references public.profiles (id) on delete cascade,
  type text not null,
  title text not null,
  body text not null default '',
  reference jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_recipient_idx
  on public.notifications (recipient_profile_id, read_at);

-- ---------- consent_records ----------
create table public.consent_records (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  document_type text not null,
  document_version text not null,
  consented_at timestamptz not null default now()
);

create index consent_records_profile_idx on public.consent_records (profile_id);

-- ---------- audit_events ----------
-- Metadata must never contain health details (pain values, notes).
create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_profile_id uuid references public.profiles (id) on delete set null,
  practice_id uuid references public.practices (id) on delete cascade,
  event_type text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_events_practice_idx on public.audit_events (practice_id, created_at);

-- ============================================================
-- RLS helper functions
-- SECURITY DEFINER so policies can consult other tables without
-- recursive RLS evaluation. search_path pinned for safety.
-- ============================================================

create function public.is_practice_member(p_practice_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.practice_members m
    where m.practice_id = p_practice_id
      and m.profile_id = (select auth.uid())
      and m.is_active
  );
$$;

create function public.is_practice_admin(p_practice_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.practice_members m
    where m.practice_id = p_practice_id
      and m.profile_id = (select auth.uid())
      and m.role = 'admin'
      and m.is_active
  );
$$;

-- Current user is an active member of a practice that has an active
-- link with the given patient.
create function public.member_can_view_patient(p_patient_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.patient_practice_links l
    join public.practice_members m on m.practice_id = l.practice_id
    where l.patient_profile_id = p_patient_id
      and l.status = 'active'
      and m.profile_id = (select auth.uid())
      and m.is_active
  );
$$;

-- Current user (patient) has an active link with the given practice.
create function public.is_linked_patient(p_practice_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.patient_practice_links l
    where l.practice_id = p_practice_id
      and l.patient_profile_id = (select auth.uid())
      and l.status = 'active'
  );
$$;

-- Plan access for the current user, either as its patient or as an
-- active member of the owning practice.
create function public.can_access_plan(p_plan_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.exercise_plans p
    where p.id = p_plan_id
      and (
        p.patient_profile_id = (select auth.uid())
        or public.is_practice_member(p.practice_id)
      )
  );
$$;

-- Patient may read an exercise if it occurs in any plan assigned to
-- them (needed to render plan items and videos).
create function public.patient_can_view_exercise(p_exercise_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.exercise_plan_items i
    join public.exercise_plan_versions v on v.id = i.plan_version_id
    join public.exercise_plans p on p.id = v.plan_id
    where i.exercise_id = p_exercise_id
      and p.patient_profile_id = (select auth.uid())
  );
$$;

-- Profile visibility: own profile, patients of my practices, fellow
-- members of my practices, and members of practices I am linked to
-- as a patient (so patients can see their therapist's name).
create function public.can_view_profile(p_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    p_profile_id = (select auth.uid())
    or public.member_can_view_patient(p_profile_id)
    or exists (
      select 1
      from public.practice_members mine
      join public.practice_members theirs on theirs.practice_id = mine.practice_id
      where mine.profile_id = (select auth.uid())
        and mine.is_active
        and theirs.profile_id = p_profile_id
        and theirs.is_active
    )
    or exists (
      select 1
      from public.patient_practice_links l
      join public.practice_members m on m.practice_id = l.practice_id
      where l.patient_profile_id = (select auth.uid())
        and l.status = 'active'
        and m.profile_id = p_profile_id
        and m.is_active
    );
$$;

-- ============================================================
-- RLS policies
-- Tables with no insert/update/delete policy are write-protected for
-- clients; only server-side code using the service role may write.
-- ============================================================

alter table public.profiles enable row level security;
alter table public.practices enable row level security;
alter table public.practice_members enable row level security;
alter table public.patient_practice_links enable row level security;
alter table public.patient_invites enable row level security;
alter table public.exercises enable row level security;
alter table public.exercise_media enable row level security;
alter table public.exercise_plans enable row level security;
alter table public.exercise_plan_versions enable row level security;
alter table public.exercise_plan_items enable row level security;
alter table public.completion_logs enable row level security;
alter table public.appointments enable row level security;
alter table public.cancellation_requests enable row level security;
alter table public.notifications enable row level security;
alter table public.consent_records enable row level security;
alter table public.audit_events enable row level security;

-- profiles
create policy "profiles: read visible profiles"
  on public.profiles for select
  using (public.can_view_profile(id));

create policy "profiles: update own"
  on public.profiles for update
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- practices
create policy "practices: read as member or linked patient"
  on public.practices for select
  using (public.is_practice_member(id) or public.is_linked_patient(id));

create policy "practices: admin updates"
  on public.practices for update
  using (public.is_practice_admin(id))
  with check (public.is_practice_admin(id));

-- practice_members (writes: server only)
create policy "practice_members: members read their practice"
  on public.practice_members for select
  using (public.is_practice_member(practice_id));

-- Patients see the member list of their own practice (needed to show
-- the treating person's name on appointments).
create policy "practice_members: linked patients read"
  on public.practice_members for select
  using (public.is_linked_patient(practice_id));

-- patient_practice_links (writes: server only, during invite redemption)
create policy "patient_links: patient reads own"
  on public.patient_practice_links for select
  using (patient_profile_id = (select auth.uid()));

create policy "patient_links: members read practice links"
  on public.patient_practice_links for select
  using (public.is_practice_member(practice_id));

-- patient_invites (creation/revocation by members; redemption: server only)
create policy "patient_invites: members read"
  on public.patient_invites for select
  using (public.is_practice_member(practice_id));

create policy "patient_invites: members create"
  on public.patient_invites for insert
  with check (public.is_practice_member(practice_id));

create policy "patient_invites: members revoke"
  on public.patient_invites for update
  using (public.is_practice_member(practice_id))
  with check (public.is_practice_member(practice_id));

-- exercises
create policy "exercises: members full read"
  on public.exercises for select
  using (public.is_practice_member(practice_id));

create policy "exercises: patients read assigned"
  on public.exercises for select
  using (public.patient_can_view_exercise(id));

create policy "exercises: members create"
  on public.exercises for insert
  with check (public.is_practice_member(practice_id));

create policy "exercises: members update"
  on public.exercises for update
  using (public.is_practice_member(practice_id))
  with check (public.is_practice_member(practice_id));

-- exercise_media
create policy "exercise_media: read via exercise access"
  on public.exercise_media for select
  using (
    exists (
      select 1 from public.exercises e
      where e.id = exercise_id
        and (public.is_practice_member(e.practice_id) or public.patient_can_view_exercise(e.id))
    )
  );

create policy "exercise_media: members manage"
  on public.exercise_media for all
  using (
    exists (
      select 1 from public.exercises e
      where e.id = exercise_id and public.is_practice_member(e.practice_id)
    )
  )
  with check (
    exists (
      select 1 from public.exercises e
      where e.id = exercise_id and public.is_practice_member(e.practice_id)
    )
  );

-- exercise_plans
create policy "exercise_plans: patient reads own"
  on public.exercise_plans for select
  using (patient_profile_id = (select auth.uid()));

create policy "exercise_plans: members read practice plans"
  on public.exercise_plans for select
  using (public.is_practice_member(practice_id));

create policy "exercise_plans: members create"
  on public.exercise_plans for insert
  with check (public.is_practice_member(practice_id));

create policy "exercise_plans: members update"
  on public.exercise_plans for update
  using (public.is_practice_member(practice_id))
  with check (public.is_practice_member(practice_id));

-- exercise_plan_versions
create policy "plan_versions: read via plan access"
  on public.exercise_plan_versions for select
  using (public.can_access_plan(plan_id));

create policy "plan_versions: members create"
  on public.exercise_plan_versions for insert
  with check (
    exists (
      select 1 from public.exercise_plans p
      where p.id = plan_id and public.is_practice_member(p.practice_id)
    )
  );

-- exercise_plan_items (immutable per version: no update policy)
create policy "plan_items: read via plan access"
  on public.exercise_plan_items for select
  using (
    exists (
      select 1 from public.exercise_plan_versions v
      where v.id = plan_version_id and public.can_access_plan(v.plan_id)
    )
  );

create policy "plan_items: members create"
  on public.exercise_plan_items for insert
  with check (
    exists (
      select 1 from public.exercise_plan_versions v
      join public.exercise_plans p on p.id = v.plan_id
      where v.id = plan_version_id and public.is_practice_member(p.practice_id)
    )
  );

-- completion_logs (immutable: no update/delete policies)
create policy "completion_logs: patient reads own"
  on public.completion_logs for select
  using (patient_profile_id = (select auth.uid()));

create policy "completion_logs: members read for linked patients"
  on public.completion_logs for select
  using (public.member_can_view_patient(patient_profile_id));

create policy "completion_logs: patient documents own"
  on public.completion_logs for insert
  with check (
    patient_profile_id = (select auth.uid())
    and exists (
      select 1
      from public.exercise_plan_items i
      join public.exercise_plan_versions v on v.id = i.plan_version_id
      join public.exercise_plans p on p.id = v.plan_id
      where i.id = plan_item_id
        and p.patient_profile_id = (select auth.uid())
    )
  );

-- appointments
create policy "appointments: patient reads own"
  on public.appointments for select
  using (patient_profile_id = (select auth.uid()));

create policy "appointments: members read practice"
  on public.appointments for select
  using (public.is_practice_member(practice_id));

create policy "appointments: members create"
  on public.appointments for insert
  with check (public.is_practice_member(practice_id));

create policy "appointments: members update"
  on public.appointments for update
  using (public.is_practice_member(practice_id))
  with check (public.is_practice_member(practice_id));

-- cancellation_requests
create policy "cancellations: patient reads own"
  on public.cancellation_requests for select
  using (requested_by = (select auth.uid()));

create policy "cancellations: members read practice"
  on public.cancellation_requests for select
  using (
    exists (
      select 1 from public.appointments a
      where a.id = appointment_id and public.is_practice_member(a.practice_id)
    )
  );

create policy "cancellations: patient requests for own appointment"
  on public.cancellation_requests for insert
  with check (
    requested_by = (select auth.uid())
    and exists (
      select 1 from public.appointments a
      where a.id = appointment_id
        and a.patient_profile_id = (select auth.uid())
    )
  );

create policy "cancellations: members decide"
  on public.cancellation_requests for update
  using (
    exists (
      select 1 from public.appointments a
      where a.id = appointment_id and public.is_practice_member(a.practice_id)
    )
  )
  with check (
    exists (
      select 1 from public.appointments a
      where a.id = appointment_id and public.is_practice_member(a.practice_id)
    )
  );

-- notifications (insert: server only)
create policy "notifications: recipient reads own"
  on public.notifications for select
  using (recipient_profile_id = (select auth.uid()));

create policy "notifications: recipient marks read"
  on public.notifications for update
  using (recipient_profile_id = (select auth.uid()))
  with check (recipient_profile_id = (select auth.uid()));

-- consent_records
create policy "consents: own read"
  on public.consent_records for select
  using (profile_id = (select auth.uid()));

create policy "consents: own insert"
  on public.consent_records for insert
  with check (profile_id = (select auth.uid()));

-- audit_events (insert: server only)
create policy "audit_events: practice admins read"
  on public.audit_events for select
  using (practice_id is not null and public.is_practice_admin(practice_id));

-- ============================================================
-- Grants
-- The Supabase CLI no longer grants data privileges by default.
-- Model: the service role gets full access (server-side only);
-- authenticated users get data privileges that are then gated row by
-- row through the RLS policies above; anon gets nothing.
-- ============================================================

grant usage on schema public to authenticated, service_role;
grant all on all tables in schema public to service_role;
grant select, insert, update, delete on all tables in schema public to authenticated;
alter default privileges in schema public
  grant all on tables to service_role;
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;

-- ============================================================
-- Storage: private bucket for exercise media
-- Object paths follow the convention: <practice_id>/<exercise_id>/<file>
-- Patients never get direct storage access; they receive short-lived
-- signed URLs created server-side after an authorization check.
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'exercise-media',
  'exercise-media',
  false,
  104857600, -- 100 MB per file
  array['video/mp4', 'video/webm', 'video/quicktime', 'image/jpeg', 'image/png', 'image/webp', 'text/vtt']
);

create policy "exercise-media: members read own practice folder"
  on storage.objects for select
  using (
    bucket_id = 'exercise-media'
    and public.is_practice_member(((storage.foldername(name))[1])::uuid)
  );

create policy "exercise-media: members upload to own practice folder"
  on storage.objects for insert
  with check (
    bucket_id = 'exercise-media'
    and public.is_practice_member(((storage.foldername(name))[1])::uuid)
  );

create policy "exercise-media: members delete in own practice folder"
  on storage.objects for delete
  using (
    bucket_id = 'exercise-media'
    and public.is_practice_member(((storage.foldername(name))[1])::uuid)
  );
