-- Phase E/F: verordnete Sitzungen und private Patientenakten.

create type public.authorization_status as enum ('active', 'exhausted', 'expired', 'archived');
create type public.patient_document_category as enum (
  'prescription', 'finding', 'patient_record', 'therapy_report', 'other'
);

create table public.treatment_authorizations (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices (id) on delete cascade,
  patient_profile_id uuid not null references public.profiles (id) on delete cascade,
  title text not null default 'Ärztliche Verordnung',
  reference text not null default '',
  prescribed_sessions int not null check (prescribed_sessions between 1 and 500),
  issued_on date not null,
  valid_from date,
  valid_until date,
  status public.authorization_status not null default 'active',
  prescribing_doctor text not null default '',
  note text not null default '',
  created_by uuid not null references public.practice_members (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (valid_until is null or valid_from is null or valid_until >= valid_from)
);

create index treatment_authorizations_patient_idx
  on public.treatment_authorizations (practice_id, patient_profile_id, status);

create trigger treatment_authorizations_updated_at
  before update on public.treatment_authorizations
  for each row execute function public.set_updated_at();

create table public.treatment_authorization_adjustments (
  id uuid primary key default gen_random_uuid(),
  authorization_id uuid not null references public.treatment_authorizations (id) on delete cascade,
  session_delta int not null check (session_delta between -500 and 500 and session_delta <> 0),
  reason text not null check (char_length(trim(reason)) between 3 and 500),
  created_by uuid not null references public.practice_members (id),
  created_at timestamptz not null default now()
);

create index authorization_adjustments_authorization_idx
  on public.treatment_authorization_adjustments (authorization_id, created_at);

create table public.appointment_authorization_usages (
  id uuid primary key default gen_random_uuid(),
  authorization_id uuid not null references public.treatment_authorizations (id) on delete cascade,
  appointment_id uuid not null unique references public.appointments (id) on delete cascade,
  sessions_used int not null default 1 check (sessions_used between 1 and 10),
  recorded_by uuid not null references public.practice_members (id),
  created_at timestamptz not null default now()
);

create index authorization_usages_authorization_idx
  on public.appointment_authorization_usages (authorization_id, created_at);

create table public.patient_documents (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices (id) on delete cascade,
  patient_profile_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  category public.patient_document_category not null,
  document_date date,
  note text not null default '',
  storage_path text not null unique,
  original_name text not null,
  mime_type text not null check (mime_type in ('application/pdf', 'image/jpeg', 'image/png')),
  size_bytes bigint not null check (size_bytes between 1 and 20971520),
  uploaded_by uuid not null references public.practice_members (id),
  archived_at timestamptz,
  created_at timestamptz not null default now()
);

create index patient_documents_patient_idx
  on public.patient_documents (practice_id, patient_profile_id, archived_at, created_at desc);

-- ---------- RLS ----------
alter table public.treatment_authorizations enable row level security;
alter table public.treatment_authorization_adjustments enable row level security;
alter table public.appointment_authorization_usages enable row level security;
alter table public.patient_documents enable row level security;

create policy "authorizations: members read practice"
  on public.treatment_authorizations for select
  using (public.is_practice_member(practice_id));
create policy "authorizations: patient reads own"
  on public.treatment_authorizations for select
  using (patient_profile_id = (select auth.uid()));
create policy "authorizations: members create"
  on public.treatment_authorizations for insert
  with check (
    public.is_practice_member(practice_id)
    and public.member_can_view_patient(patient_profile_id)
    and exists (
      select 1 from public.practice_members member
      where member.id = created_by
        and member.practice_id = treatment_authorizations.practice_id
        and member.profile_id = (select auth.uid())
        and member.is_active
    )
  );
create policy "authorizations: members update"
  on public.treatment_authorizations for update
  using (public.is_practice_member(practice_id))
  with check (public.is_practice_member(practice_id));

create policy "authorization adjustments: members read"
  on public.treatment_authorization_adjustments for select
  using (
    exists (
      select 1 from public.treatment_authorizations auth_rec
      where auth_rec.id = authorization_id
        and public.is_practice_member(auth_rec.practice_id)
    )
  );
create policy "authorization adjustments: members create"
  on public.treatment_authorization_adjustments for insert
  with check (
    exists (
      select 1
      from public.treatment_authorizations auth_rec
      join public.practice_members member on member.practice_id = auth_rec.practice_id
      where auth_rec.id = authorization_id
        and member.id = created_by
        and member.profile_id = (select auth.uid())
        and member.is_active
    )
  );

create policy "authorization usages: members read"
  on public.appointment_authorization_usages for select
  using (
    exists (
      select 1 from public.treatment_authorizations auth_rec
      where auth_rec.id = authorization_id
        and public.is_practice_member(auth_rec.practice_id)
    )
  );
create policy "authorization usages: patient reads own"
  on public.appointment_authorization_usages for select
  using (
    exists (
      select 1 from public.treatment_authorizations auth_rec
      where auth_rec.id = authorization_id
        and auth_rec.patient_profile_id = (select auth.uid())
    )
  );
-- Writes happen only through the atomic functions below.

create policy "patient documents: members read"
  on public.patient_documents for select
  using (public.is_practice_member(practice_id));
create policy "patient documents: members create"
  on public.patient_documents for insert
  with check (
    public.is_practice_member(practice_id)
    and public.member_can_view_patient(patient_profile_id)
  );
create policy "patient documents: members update"
  on public.patient_documents for update
  using (public.is_practice_member(practice_id))
  with check (public.is_practice_member(practice_id));

grant select, insert, update on public.treatment_authorizations to authenticated;
grant select, insert on public.treatment_authorization_adjustments to authenticated;
grant select on public.appointment_authorization_usages to authenticated;
grant select, insert, update on public.patient_documents to authenticated;
grant all on public.treatment_authorizations,
  public.treatment_authorization_adjustments,
  public.appointment_authorization_usages,
  public.patient_documents to service_role;

-- ---------- computed remaining sessions ----------
create function public.authorization_remaining(p_authorization_id uuid)
returns int
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_authorization public.treatment_authorizations%rowtype;
  v_adjustments int;
  v_used int;
begin
  select * into v_authorization
  from public.treatment_authorizations
  where id = p_authorization_id;

  if not found or not (
    v_authorization.patient_profile_id = (select auth.uid())
    or public.is_practice_member(v_authorization.practice_id)
  ) then
    raise exception using errcode = '42501', message = 'not_authorized';
  end if;

  select coalesce(sum(session_delta), 0)::int into v_adjustments
  from public.treatment_authorization_adjustments
  where authorization_id = v_authorization.id;

  select coalesce(sum(sessions_used), 0)::int into v_used
  from public.appointment_authorization_usages
  where authorization_id = v_authorization.id;

  return greatest(0, v_authorization.prescribed_sessions + v_adjustments - v_used);
end;
$$;

revoke all on function public.authorization_remaining(uuid) from public, anon;
grant execute on function public.authorization_remaining(uuid) to authenticated;

create function public.authorization_adjusted_total(p_authorization_id uuid)
returns int
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_authorization public.treatment_authorizations%rowtype;
  v_adjustments int;
begin
  select * into v_authorization
  from public.treatment_authorizations
  where id = p_authorization_id;

  if not found or not (
    v_authorization.patient_profile_id = (select auth.uid())
    or public.is_practice_member(v_authorization.practice_id)
  ) then
    raise exception using errcode = '42501', message = 'not_authorized';
  end if;

  select coalesce(sum(session_delta), 0)::int into v_adjustments
  from public.treatment_authorization_adjustments
  where authorization_id = v_authorization.id;

  return greatest(0, v_authorization.prescribed_sessions + v_adjustments);
end;
$$;

revoke all on function public.authorization_adjusted_total(uuid) from public, anon;
grant execute on function public.authorization_adjusted_total(uuid) to authenticated;

-- Mark a scheduled appointment completed and automatically consume one
-- session from the oldest currently valid active authorization with capacity.
create function public.complete_appointment_with_authorization(p_appointment_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_appointment public.appointments%rowtype;
  v_member_id uuid;
  v_authorization_id uuid;
begin
  select * into v_appointment
  from public.appointments
  where id = p_appointment_id
  for update;

  if not found or v_appointment.status <> 'scheduled' then
    raise exception using errcode = 'P0001', message = 'appointment_not_completable';
  end if;

  select id into v_member_id
  from public.practice_members
  where practice_id = v_appointment.practice_id
    and profile_id = (select auth.uid())
    and is_active
  limit 1;
  if v_member_id is null then
    raise exception using errcode = '42501', message = 'not_a_practice_member';
  end if;

  update public.appointments
  set status = 'completed', completed_at = now()
  where id = v_appointment.id;

  select auth_rec.id into v_authorization_id
  from public.treatment_authorizations auth_rec
  where auth_rec.practice_id = v_appointment.practice_id
    and auth_rec.patient_profile_id = v_appointment.patient_profile_id
    and auth_rec.status = 'active'
    and (auth_rec.valid_from is null or auth_rec.valid_from <= v_appointment.starts_at::date)
    and (auth_rec.valid_until is null or auth_rec.valid_until >= v_appointment.starts_at::date)
    and (
      auth_rec.prescribed_sessions
      + coalesce((select sum(adjustment.session_delta) from public.treatment_authorization_adjustments adjustment where adjustment.authorization_id = auth_rec.id), 0)
      - coalesce((select sum(usage.sessions_used) from public.appointment_authorization_usages usage where usage.authorization_id = auth_rec.id), 0)
    ) > 0
  order by coalesce(auth_rec.valid_from, auth_rec.issued_on), auth_rec.created_at
  limit 1
  for update;

  if v_authorization_id is not null then
    insert into public.appointment_authorization_usages (
      authorization_id, appointment_id, sessions_used, recorded_by
    ) values (v_authorization_id, v_appointment.id, 1, v_member_id);

    if public.authorization_remaining(v_authorization_id) = 0 then
      update public.treatment_authorizations
      set status = 'exhausted'
      where id = v_authorization_id;
    end if;
  end if;

  return v_authorization_id;
end;
$$;

revoke all on function public.complete_appointment_with_authorization(uuid) from public, anon;
grant execute on function public.complete_appointment_with_authorization(uuid) to authenticated;

create function public.remove_appointment_authorization_usage(p_appointment_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_usage_id uuid;
  v_authorization_id uuid;
  v_practice_id uuid;
begin
  select usage.id, usage.authorization_id, auth_rec.practice_id
  into v_usage_id, v_authorization_id, v_practice_id
  from public.appointment_authorization_usages usage
  join public.treatment_authorizations auth_rec on auth_rec.id = usage.authorization_id
  where usage.appointment_id = p_appointment_id
  for update;

  if not found or not public.is_practice_member(v_practice_id) then
    raise exception using errcode = '42501', message = 'not_authorized';
  end if;

  delete from public.appointment_authorization_usages where id = v_usage_id;
  update public.treatment_authorizations
  set status = 'active'
  where id = v_authorization_id and status = 'exhausted';
end;
$$;

revoke all on function public.remove_appointment_authorization_usage(uuid) from public, anon;
grant execute on function public.remove_appointment_authorization_usage(uuid) to authenticated;

-- ---------- private patient records bucket ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'patient-records',
  'patient-records',
  false,
  20971520,
  array['application/pdf', 'image/jpeg', 'image/png']
);

create policy "patient-records: members read practice folder"
  on storage.objects for select
  using (
    bucket_id = 'patient-records'
    and public.is_practice_member(((storage.foldername(name))[1])::uuid)
  );
create policy "patient-records: members upload practice folder"
  on storage.objects for insert
  with check (
    bucket_id = 'patient-records'
    and public.is_practice_member(((storage.foldername(name))[1])::uuid)
  );
create policy "patient-records: members delete practice folder"
  on storage.objects for delete
  using (
    bucket_id = 'patient-records'
    and public.is_practice_member(((storage.foldername(name))[1])::uuid)
  );
