-- ============================================================
-- Zugangs-Wiederherstellung fuer Praxismitglieder, die sowohl
-- Passwort ALS AUCH die E-Mail-Adresse ihres Kontos verloren haben
-- (z. B. altes Postfach existiert nicht mehr) - der normale
-- Supabase-Passwort-Reset setzt Zugriff auf die alte E-Mail voraus
-- und deckt diesen Fall nicht ab.
--
-- Nur ein Plattformadmin kann das ausloesen (sensible Identitaets-
-- Umschaltung, siehe D-113). Anders als staff_invites (neue
-- Mitgliedschaft) wird hier eine BESTEHENDE practice_members-Zeile
-- auf ein neues Konto umgehaengt - Rolle, Praxiszugehoerigkeit, id
-- und jede damit verbundene Historie (Termine, Behandlungseinheiten
-- usw. referenzieren die practice_members.id, nicht die E-Mail)
-- bleiben unveraendert erhalten.
-- ============================================================

create table public.practice_member_recovery (
  id uuid primary key default gen_random_uuid(),
  practice_member_id uuid not null references public.practice_members (id) on delete cascade,
  new_email text not null,
  token_hash text not null unique,
  created_by_platform_admin_id uuid not null references public.platform_admins (id) on delete cascade,
  expires_at timestamptz not null,
  used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index practice_member_recovery_member_idx on public.practice_member_recovery (practice_member_id);

alter table public.practice_member_recovery enable row level security;
-- Bewusst KEINE Client-Policies (wie platform_admins selbst): nur ueber
-- die untenstehenden SECURITY-DEFINER-Funktionen erreichbar.

-- ------------------------------------------------------------
-- Erzeugen: nur Plattformadmin. Hoechstens eine offene (weder
-- benutzte noch widerrufene, nicht abgelaufene) Wiederherstellung je
-- Mitglied - eine neue Anfrage widerruft automatisch eine vorherige.
-- ------------------------------------------------------------
create function public.create_practice_member_recovery(
  p_practice_member_id uuid,
  p_new_email text,
  p_token_hash text,
  p_expires_at timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admin_id uuid;
  v_new_id uuid;
begin
  select id into v_admin_id
  from public.platform_admins
  where profile_id = (select auth.uid());

  if v_admin_id is null then
    raise exception using errcode = '42501', message = 'not_authorized';
  end if;

  if not exists (select 1 from public.practice_members where id = p_practice_member_id) then
    raise exception using errcode = 'P0001', message = 'member_not_found';
  end if;

  update public.practice_member_recovery
  set revoked_at = now()
  where practice_member_id = p_practice_member_id
    and used_at is null
    and revoked_at is null;

  insert into public.practice_member_recovery (
    practice_member_id, new_email, token_hash, created_by_platform_admin_id, expires_at
  )
  values (p_practice_member_id, lower(p_new_email), p_token_hash, v_admin_id, p_expires_at)
  returning id into v_new_id;

  insert into public.audit_events (actor_profile_id, practice_id, event_type, entity_type, entity_id)
  select (select auth.uid()), pm.practice_id, 'practice_member_recovery_created', 'practice_member', p_practice_member_id
  from public.practice_members pm
  where pm.id = p_practice_member_id;

  return v_new_id;
end;
$$;

revoke all on function public.create_practice_member_recovery(uuid, text, text, timestamptz) from public, anon;
grant execute on function public.create_practice_member_recovery(uuid, text, text, timestamptz) to authenticated;

-- ------------------------------------------------------------
-- Ansehen eines Wiederherstellungs-Tokens (fuer die oeffentliche
-- Bestaetigungsseite) - liest per Hash, ohne dass zu diesem Zeitpunkt
-- schon eine Sitzung existiert. Nur laufende (nicht abgelaufene,
-- nicht widerrufene, nicht benutzte) Eintraege sind sichtbar.
-- ------------------------------------------------------------
create function public.inspect_practice_member_recovery(p_token_hash text)
returns table (
  out_practice_member_id uuid,
  out_new_email text,
  out_practice_id uuid,
  out_practice_name text,
  out_role public.practice_role
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    r.practice_member_id,
    r.new_email,
    pm.practice_id,
    p.name,
    pm.role
  from public.practice_member_recovery r
  join public.practice_members pm on pm.id = r.practice_member_id
  join public.practices p on p.id = pm.practice_id
  where r.token_hash = p_token_hash
    and r.used_at is null
    and r.revoked_at is null
    and r.expires_at > now();
$$;

revoke all on function public.inspect_practice_member_recovery(text) from public, anon;
grant execute on function public.inspect_practice_member_recovery(text) to service_role;

-- ------------------------------------------------------------
-- Einloesen: haengt die BESTEHENDE Mitgliedszeile auf ein neues Konto
-- um. Wird von einer Server Action mit Service-Role aufgerufen (die
-- Person hat zu diesem Zeitpunkt noch KEINE gueltige Sitzung - das
-- neue Konto wurde gerade erst per Admin-API angelegt). Deshalb eigene,
-- in sich geschlossene Pruefung ueber den Token-Hash statt auth.uid().
-- ------------------------------------------------------------
create function public.redeem_practice_member_recovery(
  p_token_hash text,
  p_new_profile_id uuid
)
returns table (out_practice_id uuid, out_role public.practice_role)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_recovery public.practice_member_recovery%rowtype;
  v_member public.practice_members%rowtype;
begin
  select * into v_recovery
  from public.practice_member_recovery r
  where r.token_hash = p_token_hash
  for update;

  if not found
    or v_recovery.used_at is not null
    or v_recovery.revoked_at is not null
    or v_recovery.expires_at <= now()
  then
    raise exception using errcode = 'P0001', message = 'recovery_not_redeemable';
  end if;

  select * into v_member from public.practice_members where id = v_recovery.practice_member_id for update;
  if not found then
    raise exception using errcode = 'P0001', message = 'member_not_found';
  end if;

  update public.practice_members
  set profile_id = p_new_profile_id
  where id = v_member.id;

  update public.practice_member_recovery
  set used_at = now()
  where id = v_recovery.id;

  insert into public.audit_events (actor_profile_id, practice_id, event_type, entity_type, entity_id)
  values (p_new_profile_id, v_member.practice_id, 'practice_member_recovery_redeemed', 'practice_member', v_member.id);

  return query select v_member.practice_id, v_member.role;
end;
$$;

revoke all on function public.redeem_practice_member_recovery(text, uuid) from public, anon;
grant execute on function public.redeem_practice_member_recovery(text, uuid) to service_role;
