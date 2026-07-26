-- ============================================================
-- Mitarbeitereinladungen (Praxisadmin ODER Therapeut, je nach
-- vorgesehener Rolle), verwendet sowohl beim Praxis-Onboarding durch
-- einen Plattformadmin (Phase C) als auch bei der Praxis-Selbst-
-- verwaltung (Phase E). Gleiches Sicherheitsmuster wie
-- patient_invites: nur ein Hash wird gespeichert, der Klartext-Token
-- existiert ausschliesslich im Erzeugungsmoment.
--
-- Unterschied zu patient_invites: der Token steckt in einem Link
-- (E-Mail/Zwischenablage), wird nicht abgetippt - deshalb hoehere
-- Entropie (32 Byte) statt eines kurzen, gut vorlesbaren Codes.
-- ============================================================

create table public.staff_invites (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices (id) on delete cascade,
  email text not null,
  role public.practice_role not null,
  token_hash text not null unique,
  -- Genau einer der beiden Ersteller ist gesetzt: ein Plattformadmin
  -- (Erst-Onboarding einer neuen Praxis, noch kein practice_member
  -- vorhanden) oder ein Praxismitglied (spaetere Einladungen).
  created_by_member_id uuid references public.practice_members (id) on delete set null,
  created_by_platform_admin_id uuid references public.platform_admins (id) on delete set null,
  expires_at timestamptz not null default now() + interval '7 days',
  revoked_at timestamptz,
  accepted_at timestamptz,
  accepted_by_profile_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint staff_invites_creator_xor check (
    (created_by_member_id is not null) <> (created_by_platform_admin_id is not null)
  )
);

create index staff_invites_practice_idx on public.staff_invites (practice_id);

-- Hoechstens eine offene (weder widerrufene noch angenommene, nicht
-- abgelaufene) Einladung je Praxis und E-Mail - verhindert doppelte
-- parallele Einladungen; "erneuern" widerruft zuerst (siehe RPC unten).
create unique index staff_invites_pending_unique
  on public.staff_invites (practice_id, lower(email))
  where revoked_at is null and accepted_at is null;

alter table public.staff_invites enable row level security;

-- Nur PraxisADMINS (nicht Therapeuten) verwalten Mitarbeitereinladungen
-- der eigenen Praxis - der Auftrag verlangt ausdruecklich, dass
-- Therapeuten keine Mitglieder-/Betreiberrollen verwalten koennen.
create policy "staff_invites: practice admins read"
  on public.staff_invites for select
  using (public.is_practice_admin(practice_id));

create policy "staff_invites: practice admins create"
  on public.staff_invites for insert
  with check (
    public.is_practice_admin(practice_id)
    and created_by_platform_admin_id is null
  );

create policy "staff_invites: practice admins revoke"
  on public.staff_invites for update
  using (public.is_practice_admin(practice_id))
  with check (public.is_practice_admin(practice_id));

-- ------------------------------------------------------------
-- Atomare Annahme: bindet das VERIFIZIERTE Konto (E-Mail-Abgleich
-- gegen den JWT-Claim der aktuellen Sitzung, nicht gegen Client-Input)
-- an genau die vorgesehene Praxis und Rolle. Kein direkter Client-
-- Schreibweg auf practice_members oder staff_invites.accepted_*.
-- ------------------------------------------------------------
create function public.accept_staff_invite(p_invite_id uuid, p_token_hash text)
returns table (out_practice_id uuid, out_role public.practice_role)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_invite public.staff_invites%rowtype;
  v_user_id uuid := (select auth.uid());
  v_email text := (select auth.jwt() ->> 'email');
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'authentication_required';
  end if;

  select * into v_invite
  from public.staff_invites s
  where s.id = p_invite_id
    and s.token_hash = p_token_hash
  for update;

  if not found
    or v_invite.revoked_at is not null
    or v_invite.accepted_at is not null
    or v_invite.expires_at <= now()
  then
    raise exception using errcode = 'P0001', message = 'invite_not_redeemable';
  end if;

  if v_email is null or lower(v_invite.email) <> lower(v_email) then
    raise exception using errcode = 'P0001', message = 'invite_email_mismatch';
  end if;

  insert into public.practice_members (practice_id, profile_id, role, is_active)
  values (v_invite.practice_id, v_user_id, v_invite.role, true)
  on conflict (practice_id, profile_id)
  do update set role = excluded.role, is_active = true;

  update public.staff_invites
  set accepted_at = now(), accepted_by_profile_id = v_user_id
  where id = v_invite.id;

  insert into public.audit_events (
    actor_profile_id, practice_id, event_type, entity_type, entity_id, metadata
  )
  values (
    v_user_id, v_invite.practice_id, 'staff_invite_accepted', 'staff_invite', v_invite.id,
    jsonb_build_object('role', v_invite.role)
  );

  return query select v_invite.practice_id, v_invite.role;
end;
$$;

revoke all on function public.accept_staff_invite(uuid, text) from public, anon;
grant execute on function public.accept_staff_invite(uuid, text) to authenticated;

-- ------------------------------------------------------------
-- Erneuerung: alten offenen Code widerrufen, neuen atomar anlegen.
-- Aufrufbar von Praxisadmins (eigene Praxis) und - ueber den
-- Service-Role-Client der Betreiber-Server-Actions - vom
-- Onboarding-Assistenten.
-- ------------------------------------------------------------
create function public.renew_staff_invite(
  p_invite_id uuid,
  p_token_hash text,
  p_expires_at timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old public.staff_invites%rowtype;
  v_new_id uuid;
  v_is_admin_call boolean := auth.role() = 'service_role';
begin
  select * into v_old from public.staff_invites where id = p_invite_id for update;
  if not found then
    raise exception using errcode = 'P0001', message = 'invite_not_found';
  end if;

  if not v_is_admin_call and not public.is_practice_admin(v_old.practice_id) then
    raise exception using errcode = '42501', message = 'not_authorized';
  end if;

  update public.staff_invites
  set revoked_at = now()
  where id = v_old.id and revoked_at is null and accepted_at is null;

  insert into public.staff_invites (
    practice_id, email, role, token_hash, created_by_member_id,
    created_by_platform_admin_id, expires_at
  )
  values (
    v_old.practice_id, v_old.email, v_old.role, p_token_hash,
    v_old.created_by_member_id, v_old.created_by_platform_admin_id, p_expires_at
  )
  returning id into v_new_id;

  return v_new_id;
end;
$$;

revoke all on function public.renew_staff_invite(uuid, text, timestamptz) from public, anon;
grant execute on function public.renew_staff_invite(uuid, text, timestamptz) to authenticated;

-- ------------------------------------------------------------
-- Schutz: der letzte aktive Praxisadmin darf nicht entfernt oder
-- herabgestuft werden (weder durch Update noch durch Deaktivierung).
-- Greift fuer JEDEN Schreibpfad (auch Service-Role), da practice_members
-- ohnehin nur serverseitig beschrieben wird.
-- ------------------------------------------------------------
create function public.prevent_removing_last_practice_admin()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_remaining_admins int;
begin
  -- Nur relevant, wenn aus einer aktiven Admin-Zeile etwas anderes wird.
  if old.role = 'admin' and old.is_active
     and (new.role <> 'admin' or new.is_active = false)
  then
    select count(*) into v_remaining_admins
    from public.practice_members m
    where m.practice_id = old.practice_id
      and m.role = 'admin'
      and m.is_active
      and m.id <> old.id;

    if v_remaining_admins = 0 then
      raise exception using errcode = 'P0001', message = 'last_practice_admin_protected';
    end if;
  end if;
  return new;
end;
$$;

create trigger practice_members_protect_last_admin
  before update on public.practice_members
  for each row execute function public.prevent_removing_last_practice_admin();

create function public.prevent_deleting_last_practice_admin()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_remaining_admins int;
begin
  -- Kaskadierendes Loeschen der GESAMTEN Praxis (z.B. lokales
  -- Seed-Skript) soll nicht blockiert werden - der Schutz gilt nur,
  -- solange die Praxis selbst weiterbestehen soll. Waehrend eine
  -- ON-DELETE-CASCADE-Kette laeuft, existiert die Elternzeile in
  -- practices bereits nicht mehr (empirisch mit pg_trigger_depth()
  -- und einer Testkaskade bestaetigt, nicht vermutet).
  if not exists (select 1 from public.practices where id = old.practice_id) then
    return old;
  end if;

  if old.role = 'admin' and old.is_active then
    select count(*) into v_remaining_admins
    from public.practice_members m
    where m.practice_id = old.practice_id
      and m.role = 'admin'
      and m.is_active
      and m.id <> old.id;

    if v_remaining_admins = 0 then
      raise exception using errcode = 'P0001', message = 'last_practice_admin_protected';
    end if;
  end if;
  return old;
end;
$$;

create trigger practice_members_protect_last_admin_delete
  before delete on public.practice_members
  for each row execute function public.prevent_deleting_last_practice_admin();
