-- Etappe 3: strict integer treatment units with a full, append-only ledger.
--
-- Rules implemented here:
-- * A completed appointment consumes exactly 1 unit (check tightened).
-- * Reversing a completion books exactly 1 unit back WITHOUT deleting
--   history: the usage row is marked reversed, never removed.
-- * The same appointment can never be charged twice at the same time
--   (partial unique index on non-reversed usages); after a reversal a
--   renewed completion may charge again - still at most one active charge.
-- * Remaining units never go below 0 and ignore reversed usages.
-- * One shared selection rule ("primary authorization") is used for the
--   patient display so it matches what completion actually charges.

-- ---------- usages become reversible (append-only) ----------

alter table public.appointment_authorization_usages
  add column reversed_at timestamptz,
  add column reversed_by uuid references public.practice_members (id) on delete set null;

comment on column public.appointment_authorization_usages.reversed_at is
  'Set when the appointment completion was reversed. The row is kept as history; only non-reversed rows count.';

-- Exactly one unit per completed appointment.
alter table public.appointment_authorization_usages
  drop constraint appointment_authorization_usages_sessions_used_check;
alter table public.appointment_authorization_usages
  add constraint appointment_authorization_usages_sessions_used_check
  check (sessions_used = 1);

-- Allow a new charge after a reversal, but never two active charges.
alter table public.appointment_authorization_usages
  drop constraint appointment_authorization_usages_appointment_id_key;
create unique index appointment_usages_active_appointment_key
  on public.appointment_authorization_usages (appointment_id)
  where reversed_at is null;

-- ---------- remaining ignores reversed usages ----------

create or replace function public.authorization_remaining(p_authorization_id uuid)
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
  where authorization_id = v_authorization.id
    and reversed_at is null;

  return greatest(0, v_authorization.prescribed_sessions + v_adjustments - v_used);
end;
$$;

-- ---------- completion: count only non-reversed usages ----------

create or replace function public.complete_appointment_with_authorization(p_appointment_id uuid)
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
      - coalesce((select sum(usage.sessions_used) from public.appointment_authorization_usages usage where usage.authorization_id = auth_rec.id and usage.reversed_at is null), 0)
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

-- ---------- reversal: book exactly 1 unit back, keep history ----------

-- Supersedes remove_appointment_authorization_usage, which DELETED the
-- usage row and thereby history. Never shipped in any UI.
drop function public.remove_appointment_authorization_usage(uuid);

create function public.reverse_appointment_completion(p_appointment_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_appointment public.appointments%rowtype;
  v_member_id uuid;
  v_usage_id uuid;
  v_authorization_id uuid;
begin
  select * into v_appointment
  from public.appointments
  where id = p_appointment_id
  for update;

  if not found or v_appointment.status <> 'completed' then
    raise exception using errcode = 'P0001', message = 'appointment_not_reversible';
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

  -- May raise the therapist-overlap exclusion (23P01) if the slot has
  -- been taken meanwhile; the caller translates that into a clear message.
  update public.appointments
  set status = 'scheduled', completed_at = null
  where id = v_appointment.id;

  select usage.id, usage.authorization_id
  into v_usage_id, v_authorization_id
  from public.appointment_authorization_usages usage
  where usage.appointment_id = v_appointment.id
    and usage.reversed_at is null
  for update;

  if v_usage_id is null then
    return false;
  end if;

  update public.appointment_authorization_usages
  set reversed_at = now(), reversed_by = v_member_id
  where id = v_usage_id;

  update public.treatment_authorizations
  set status = 'active'
  where id = v_authorization_id and status = 'exhausted';

  return true;
end;
$$;

revoke all on function public.reverse_appointment_completion(uuid) from public, anon;
grant execute on function public.reverse_appointment_completion(uuid) to authenticated;

-- ---------- shared "primary authorization" selection ----------

-- The authorization the next completion would charge: oldest currently
-- valid active one with remaining capacity. If none has capacity, the
-- most recent active/exhausted one (so a 0 state is still shown).
-- Used by the patient display so it can never contradict the charging.
create function public.primary_authorization_for_patient(p_patient_id uuid)
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_authorization_id uuid;
begin
  if not (
    p_patient_id = (select auth.uid())
    or exists (
      select 1 from public.patient_practice_links link
      where link.patient_profile_id = p_patient_id
        and link.status = 'active'
        and public.is_practice_member(link.practice_id)
    )
  ) then
    raise exception using errcode = '42501', message = 'not_authorized';
  end if;

  select auth_rec.id into v_authorization_id
  from public.treatment_authorizations auth_rec
  where auth_rec.patient_profile_id = p_patient_id
    and auth_rec.status = 'active'
    and (auth_rec.valid_from is null or auth_rec.valid_from <= current_date)
    and (auth_rec.valid_until is null or auth_rec.valid_until >= current_date)
    and (
      auth_rec.prescribed_sessions
      + coalesce((select sum(adjustment.session_delta) from public.treatment_authorization_adjustments adjustment where adjustment.authorization_id = auth_rec.id), 0)
      - coalesce((select sum(usage.sessions_used) from public.appointment_authorization_usages usage where usage.authorization_id = auth_rec.id and usage.reversed_at is null), 0)
    ) > 0
  order by coalesce(auth_rec.valid_from, auth_rec.issued_on), auth_rec.created_at
  limit 1;

  if v_authorization_id is null then
    select auth_rec.id into v_authorization_id
    from public.treatment_authorizations auth_rec
    where auth_rec.patient_profile_id = p_patient_id
      and auth_rec.status in ('active', 'exhausted')
    order by auth_rec.issued_on desc, auth_rec.created_at desc
    limit 1;
  end if;

  return v_authorization_id;
end;
$$;

revoke all on function public.primary_authorization_for_patient(uuid) from public, anon;
grant execute on function public.primary_authorization_for_patient(uuid) to authenticated;
