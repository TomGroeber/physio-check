-- Phase D: Terminlebenszyklus.
-- 1) Nachvollziehbare Stornierung/Abschluss: Termine werden nie gelöscht,
--    sondern mit Zeitpunkt, ausführender Person und optionalem neutralem
--    Grund als storniert bzw. abgeschlossen markiert.
-- 2) Serverseitige Konfliktverhinderung: Derselbe Therapeut kann keine
--    zeitlich überlappenden aktiven Termine haben. Als Exclusion-
--    Constraint direkt in der Datenbank, damit auch zwei gleichzeitige
--    Anfragen keinen Konflikt anlegen können (atomar, kein Race).

-- ---------- lifecycle fields ----------
alter table public.appointments
  add column cancelled_at timestamptz,
  add column cancelled_by_profile_id uuid references public.profiles (id) on delete set null,
  add column cancellation_reason text not null default '',
  add column completed_at timestamptz;

comment on column public.appointments.cancellation_reason is
  'Neutraler, optionaler Grund. Keine Gesundheitsdetails.';

-- Bestehende Zeilen plausibel nachziehen (lokale Demo-Daten).
update public.appointments
  set completed_at = updated_at
  where status = 'completed' and completed_at is null;

update public.appointments
  set cancelled_at = updated_at
  where status = 'cancelled' and cancelled_at is null;

-- ---------- therapist conflict prevention ----------
create extension if not exists btree_gist with schema extensions;

-- Nur aktive Termine (geplant / Absage angefragt) blockieren das
-- Zeitfenster. Termine ohne zugewiesenen Therapeuten (NULL) kollidieren
-- nie, da NULL-Vergleiche im Exclusion-Constraint nicht greifen.
alter table public.appointments
  add constraint appointments_no_therapist_overlap
  exclude using gist (
    therapist_member_id with =,
    tstzrange(starts_at, ends_at) with &&
  )
  where (status in ('scheduled', 'cancellation_requested'));

-- Pro Termin höchstens eine offene Absageanfrage.
create unique index cancellation_requests_one_pending_per_appointment
  on public.cancellation_requests (appointment_id)
  where status = 'pending';

-- Patientenseitige Absageanfrage atomar: Anfrage, Terminstatus und
-- Benachrichtigungen an aktive Praxismitarbeiter entstehen gemeinsam.
create function public.request_appointment_cancellation(
  p_appointment_id uuid,
  p_reason text default ''
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_appointment public.appointments%rowtype;
  v_request_id uuid;
  v_user_id uuid := (select auth.uid());
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'authentication_required';
  end if;

  select * into v_appointment
  from public.appointments
  where id = p_appointment_id
    and patient_profile_id = v_user_id
  for update;

  if not found or v_appointment.status <> 'scheduled' then
    raise exception using errcode = 'P0001', message = 'appointment_not_requestable';
  end if;

  insert into public.cancellation_requests (appointment_id, requested_by, reason)
  values (v_appointment.id, v_user_id, left(coalesce(p_reason, ''), 300))
  returning id into v_request_id;

  update public.appointments
  set status = 'cancellation_requested'
  where id = v_appointment.id;

  insert into public.notifications (recipient_profile_id, type, title, body, reference)
  select
    member.profile_id,
    'appointment_cancellation_requested',
    'Neue Absageanfrage',
    'Eine Patientin oder ein Patient hat eine Terminabsage angefragt.',
    jsonb_build_object('appointmentId', v_appointment.id, 'requestId', v_request_id)
  from public.practice_members member
  where member.practice_id = v_appointment.practice_id
    and member.is_active;

  return v_request_id;
end;
$$;

revoke all on function public.request_appointment_cancellation(uuid, text) from public, anon;
grant execute on function public.request_appointment_cancellation(uuid, text) to authenticated;
