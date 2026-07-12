-- Etappe 8: freed slots and the appointment offer workflow.
--
-- The practice offers a concrete time slot (usually one freed by a
-- cancellation) to a patient. The patient sees their own offers and
-- accepts or declines exactly one - acceptance atomically creates the
-- appointment under the existing therapist-overlap exclusion
-- constraint, so double-booking a slot is impossible. Offers are never
-- deleted; they end as accepted / declined / withdrawn.

create type public.offer_status as enum ('offered', 'accepted', 'declined', 'withdrawn');

create table public.appointment_offers (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices (id) on delete cascade,
  patient_profile_id uuid not null references public.profiles (id) on delete cascade,
  therapist_member_id uuid references public.practice_members (id) on delete set null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  timezone text not null default 'Europe/Luxembourg',
  location_name text not null default '',
  status public.offer_status not null default 'offered',
  appointment_id uuid references public.appointments (id) on delete set null,
  created_by uuid references public.practice_members (id) on delete set null,
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  check (ends_at > starts_at)
);

create index appointment_offers_practice_idx
  on public.appointment_offers (practice_id, status, starts_at);
create index appointment_offers_patient_idx
  on public.appointment_offers (patient_profile_id, status, starts_at);

alter table public.appointment_offers enable row level security;

create policy "offers: members read"
  on public.appointment_offers for select
  using (public.is_practice_member(practice_id));
create policy "offers: members create"
  on public.appointment_offers for insert
  with check (
    public.is_practice_member(practice_id)
    and public.member_can_view_patient(patient_profile_id)
  );
create policy "offers: members update"
  on public.appointment_offers for update
  using (public.is_practice_member(practice_id))
  with check (public.is_practice_member(practice_id));
create policy "offers: patient reads own"
  on public.appointment_offers for select
  using (patient_profile_id = (select auth.uid()));
-- Patients respond only through the functions below - no direct update.

grant select, insert, update on public.appointment_offers to authenticated;

-- ---------- patient accepts exactly one offer ----------

create function public.accept_appointment_offer(p_offer_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_offer public.appointment_offers%rowtype;
  v_user_id uuid := (select auth.uid());
  v_appointment_id uuid;
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'authentication_required';
  end if;

  select * into v_offer
  from public.appointment_offers
  where id = p_offer_id
    and patient_profile_id = v_user_id
  for update;

  if not found or v_offer.status <> 'offered' then
    raise exception using errcode = 'P0001', message = 'offer_not_open';
  end if;
  if v_offer.starts_at <= now() then
    raise exception using errcode = 'P0001', message = 'offer_in_past';
  end if;

  -- May raise the therapist-overlap exclusion (23P01) when the slot has
  -- been taken meanwhile; the caller translates that into a message.
  insert into public.appointments (
    practice_id, patient_profile_id, therapist_member_id,
    starts_at, ends_at, timezone, location_name
  ) values (
    v_offer.practice_id, v_offer.patient_profile_id, v_offer.therapist_member_id,
    v_offer.starts_at, v_offer.ends_at, v_offer.timezone, v_offer.location_name
  )
  returning id into v_appointment_id;

  update public.appointment_offers
  set status = 'accepted', appointment_id = v_appointment_id, responded_at = now()
  where id = v_offer.id;

  -- The patient got a slot: close an open waitlist entry, keep history.
  update public.practice_waitlist_entries
  set status = 'resolved', resolved_at = now()
  where practice_id = v_offer.practice_id
    and patient_profile_id = v_offer.patient_profile_id
    and status = 'waiting';

  insert into public.notifications (recipient_profile_id, type, title, body, reference)
  select
    member.profile_id,
    'appointment_offer_accepted',
    'Terminangebot angenommen',
    'Ein Patient hat ein Terminangebot angenommen. Der Termin steht im Kalender.',
    jsonb_build_object('appointmentId', v_appointment_id, 'offerId', v_offer.id)
  from public.practice_members member
  where member.practice_id = v_offer.practice_id
    and member.is_active;

  return v_appointment_id;
end;
$$;

revoke all on function public.accept_appointment_offer(uuid) from public, anon;
grant execute on function public.accept_appointment_offer(uuid) to authenticated;

-- ---------- patient declines an offer ----------

create function public.decline_appointment_offer(p_offer_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_offer public.appointment_offers%rowtype;
  v_user_id uuid := (select auth.uid());
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'authentication_required';
  end if;

  select * into v_offer
  from public.appointment_offers
  where id = p_offer_id
    and patient_profile_id = v_user_id
  for update;

  if not found or v_offer.status <> 'offered' then
    raise exception using errcode = 'P0001', message = 'offer_not_open';
  end if;

  update public.appointment_offers
  set status = 'declined', responded_at = now()
  where id = v_offer.id;

  insert into public.notifications (recipient_profile_id, type, title, body, reference)
  select
    member.profile_id,
    'appointment_offer_declined',
    'Terminangebot abgelehnt',
    'Ein Patient hat ein Terminangebot abgelehnt. Das Zeitfenster ist wieder frei.',
    jsonb_build_object('offerId', v_offer.id)
  from public.practice_members member
  where member.practice_id = v_offer.practice_id
    and member.is_active;
end;
$$;

revoke all on function public.decline_appointment_offer(uuid) from public, anon;
grant execute on function public.decline_appointment_offer(uuid) to authenticated;
