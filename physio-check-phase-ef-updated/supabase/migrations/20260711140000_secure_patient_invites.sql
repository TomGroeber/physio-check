-- ============================================================
-- Phase B: sichere Patienteneinladungen und Praxiswechsel
-- ============================================================

-- Falls ein Entwicklungsstand bereits mehrere aktive Verbindungen
-- enthält, bleibt die jüngste aktiv; ältere werden sauber beendet.
with ranked_links as (
  select
    id,
    row_number() over (
      partition by patient_profile_id
      order by linked_at desc, id desc
    ) as position
  from public.patient_practice_links
  where status = 'active'
)
update public.patient_practice_links links
set status = 'ended', ended_at = now()
from ranked_links ranked
where links.id = ranked.id
  and ranked.position > 1;

-- Ein Patient hat im MVP genau eine aktive Praxis. Frühere
-- Verbindungen bleiben als Historie mit status = 'ended' erhalten.
create unique index patient_links_one_active_practice
  on public.patient_practice_links (patient_profile_id)
  where status = 'active';

-- Serverseitiges Rate Limiting für öffentliche Code-Prüfungen.
-- actor_hash ist ein HMAC aus Netzwerk-/Browsermerkmalen und enthält
-- weder IP-Adresse noch User-Agent im Klartext.
create table public.invite_redemption_attempts (
  id bigint generated always as identity primary key,
  actor_hash text not null,
  successful boolean not null default false,
  attempted_at timestamptz not null default now()
);

create index invite_attempts_actor_time_idx
  on public.invite_redemption_attempts (actor_hash, attempted_at desc);

alter table public.invite_redemption_attempts enable row level security;

-- Keine Client-Policy: nur eng begrenzter serverseitiger Service-Code
-- darf Rate-Limit-Einträge lesen und schreiben.
revoke all on public.invite_redemption_attempts from anon, authenticated;
revoke all on sequence public.invite_redemption_attempts_id_seq from anon, authenticated;
grant all on public.invite_redemption_attempts to service_role;
grant all on sequence public.invite_redemption_attempts_id_seq to service_role;

-- Einladungshashes sind auch für angemeldete Praxisnutzer nicht
-- lesbar. Direkte Updates werden auf das Widerrufsdatum begrenzt.
revoke select, update on public.patient_invites from authenticated;
grant select (
  id,
  practice_id,
  created_by,
  patient_display_name,
  expires_at,
  revoked_at,
  used_at,
  used_by_profile_id,
  created_at
) on public.patient_invites to authenticated;
grant update (revoked_at) on public.patient_invites to authenticated;

drop policy "patient_invites: members create" on public.patient_invites;
create policy "patient_invites: members create"
  on public.patient_invites for insert
  with check (
    exists (
      select 1
      from public.practice_members member
      where member.id = created_by
        and member.practice_id = patient_invites.practice_id
        and member.profile_id = (select auth.uid())
        and member.is_active
    )
  );

-- Atomare Einlösung. Die Funktion akzeptiert nur den Hash eines zuvor
-- geprüften Codes. Sie sperrt die Einladung gegen parallele Einlösung,
-- beendet eine frühere aktive Praxisverbindung und legt die neue an.
create function public.redeem_patient_invite(
  p_invite_id uuid,
  p_code_hash text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_invite public.patient_invites%rowtype;
  v_link_id uuid;
  v_user_id uuid := (select auth.uid());
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'authentication_required';
  end if;

  select * into v_invite
  from public.patient_invites
  where id = p_invite_id
    and code_hash = p_code_hash
  for update;

  if not found
    or v_invite.revoked_at is not null
    or v_invite.used_at is not null
    or v_invite.expires_at <= now()
  then
    raise exception using errcode = 'P0001', message = 'invalid_invite';
  end if;

  select id into v_link_id
  from public.patient_practice_links
  where patient_profile_id = v_user_id
    and practice_id = v_invite.practice_id
    and status = 'active'
  limit 1;

  if v_link_id is null then
    update public.patient_practice_links
    set status = 'ended', ended_at = now()
    where patient_profile_id = v_user_id
      and status = 'active';

    insert into public.patient_practice_links (
      patient_profile_id,
      practice_id,
      status
    ) values (
      v_user_id,
      v_invite.practice_id,
      'active'
    )
    returning id into v_link_id;
  end if;

  update public.patient_invites
  set used_at = now(), used_by_profile_id = v_user_id
  where id = v_invite.id;

  insert into public.audit_events (
    actor_profile_id,
    practice_id,
    event_type,
    entity_type,
    entity_id,
    metadata
  ) values (
    v_user_id,
    v_invite.practice_id,
    'patient_invite_redeemed',
    'patient_practice_link',
    v_link_id,
    '{}'::jsonb
  );

  return v_link_id;
end;
$$;

revoke all on function public.redeem_patient_invite(uuid, text) from public, anon;
grant execute on function public.redeem_patient_invite(uuid, text) to authenticated;

-- Erzeugt für eine bestehende, noch nicht eingelöste Einladung atomar
-- einen neuen Code. Der alte Code wird im selben DB-Vorgang widerrufen.
create function public.renew_patient_invite(
  p_invite_id uuid,
  p_code_hash text,
  p_expires_at timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old public.patient_invites%rowtype;
  v_member_id uuid;
  v_new_id uuid;
begin
  select * into v_old
  from public.patient_invites
  where id = p_invite_id
  for update;

  if not found or v_old.used_at is not null then
    raise exception using errcode = 'P0001', message = 'invite_not_renewable';
  end if;

  select id into v_member_id
  from public.practice_members
  where practice_id = v_old.practice_id
    and profile_id = (select auth.uid())
    and is_active
  limit 1;

  if v_member_id is null then
    raise exception using errcode = '42501', message = 'not_a_practice_member';
  end if;

  update public.patient_invites
  set revoked_at = coalesce(revoked_at, now())
  where id = v_old.id;

  insert into public.patient_invites (
    practice_id,
    created_by,
    patient_display_name,
    code_hash,
    expires_at
  ) values (
    v_old.practice_id,
    v_member_id,
    v_old.patient_display_name,
    p_code_hash,
    p_expires_at
  )
  returning id into v_new_id;

  insert into public.audit_events (
    actor_profile_id,
    practice_id,
    event_type,
    entity_type,
    entity_id,
    metadata
  ) values (
    (select auth.uid()),
    v_old.practice_id,
    'patient_invite_renewed',
    'patient_invite',
    v_new_id,
    jsonb_build_object('replaced_invite_id', v_old.id)
  );

  return v_new_id;
end;
$$;

revoke all on function public.renew_patient_invite(uuid, text, timestamptz) from public, anon;
grant execute on function public.renew_patient_invite(uuid, text, timestamptz) to authenticated;
