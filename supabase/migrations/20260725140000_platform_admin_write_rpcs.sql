-- ============================================================
-- Atomare Schreib-RPCs fuer das Betreiberportal. Folgt demselben
-- Muster wie die bestehenden kritischen Schreibwege (redeem_patient_
-- invite, publish_exercise_plan, record_exercise_occurrence): SECURITY
-- DEFINER, Autorisierung ZUERST innerhalb der Funktion geprueft, dann
-- die eigentliche Aenderung. Aufgerufen ueber die normale
-- authentifizierte Sitzung des Plattformadmins - kein Service-Role-
-- Client noetig, `auth.uid()` loest hier korrekt auf.
-- ============================================================

-- ------------------------------------------------------------
-- Phase C: Praxis-Onboarding. Legt Praxis + erste Admin-Einladung in
-- EINER Transaktion an (kein Kompensationslogik-Risiko wie bei zwei
-- getrennten Client-Aufrufen).
-- ------------------------------------------------------------
create function public.create_practice_with_admin_invite(
  p_name text,
  p_address_street text,
  p_address_postal_code text,
  p_address_city text,
  p_phone text,
  p_timezone text,
  p_support_email text,
  p_support_url text,
  p_status public.practice_status,
  p_admin_email text,
  p_admin_token_hash text,
  p_invite_expires_at timestamptz,
  -- Muss als letzter Parameter stehen: Postgres verlangt, dass alle
  -- Parameter NACH dem ersten mit Default ebenfalls einen Default
  -- haben. supabase-js ruft RPCs ueber benannte Parameter auf (PostgREST),
  -- die Reihenfolge hier ist fuer Aufrufer irrelevant.
  p_trial_ends_at timestamptz default null
)
returns table (out_practice_id uuid, out_invite_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_platform_admin_id uuid;
  v_practice_id uuid;
  v_invite_id uuid;
begin
  select id into v_platform_admin_id
  from public.platform_admins
  where profile_id = (select auth.uid());

  if v_platform_admin_id is null then
    raise exception using errcode = '42501', message = 'not_authorized';
  end if;

  insert into public.practices (
    name, address_street, address_postal_code, address_city, phone, timezone,
    support_email, support_url, status, trial_ends_at,
    created_by_platform_admin_id, status_changed_by
  ) values (
    p_name, p_address_street, p_address_postal_code, p_address_city, p_phone, p_timezone,
    p_support_email, p_support_url, p_status, p_trial_ends_at,
    v_platform_admin_id, (select auth.uid())
  )
  returning id into v_practice_id;

  insert into public.staff_invites (
    practice_id, email, role, token_hash, created_by_platform_admin_id, expires_at
  ) values (
    v_practice_id, lower(p_admin_email), 'admin', p_admin_token_hash, v_platform_admin_id, p_invite_expires_at
  )
  returning id into v_invite_id;

  insert into public.audit_events (
    actor_profile_id, practice_id, event_type, entity_type, entity_id, metadata
  ) values (
    (select auth.uid()), v_practice_id, 'practice_onboarded', 'practice', v_practice_id,
    jsonb_build_object('status', p_status)
  );

  return query select v_practice_id, v_invite_id;
end;
$$;

revoke all on function public.create_practice_with_admin_invite(
  text, text, text, text, text, text, text, text, public.practice_status,
  text, text, timestamptz, timestamptz
) from public, anon;
grant execute on function public.create_practice_with_admin_invite(
  text, text, text, text, text, text, text, text, public.practice_status,
  text, text, timestamptz, timestamptz
) to authenticated;

-- ------------------------------------------------------------
-- Lebenszyklus (Status/Trial/interne Notiz) - nur Plattformadmin.
-- ------------------------------------------------------------
create function public.set_practice_lifecycle(
  p_practice_id uuid,
  p_status public.practice_status,
  p_internal_note text,
  p_trial_ends_at timestamptz default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_platform_admin() then
    raise exception using errcode = '42501', message = 'not_authorized';
  end if;

  update public.practices
  set status = p_status,
      trial_ends_at = p_trial_ends_at,
      internal_note = p_internal_note,
      status_changed_at = now(),
      status_changed_by = (select auth.uid())
  where id = p_practice_id;

  if not found then
    raise exception using errcode = 'P0001', message = 'practice_not_found';
  end if;

  insert into public.audit_events (
    actor_profile_id, practice_id, event_type, entity_type, entity_id, metadata
  ) values (
    (select auth.uid()), p_practice_id, 'practice_lifecycle_changed', 'practice', p_practice_id,
    jsonb_build_object('status', p_status)
  );
end;
$$;

revoke all on function public.set_practice_lifecycle(uuid, public.practice_status, text, timestamptz) from public, anon;
grant execute on function public.set_practice_lifecycle(uuid, public.practice_status, text, timestamptz) to authenticated;

-- ------------------------------------------------------------
-- Praxis-Einstellungen (validiertes JSON in practices.settings).
-- Sowohl fuer Praxisadmins (eigene Praxis) als auch Plattformadmins.
-- ------------------------------------------------------------
create function public.update_practice_settings(
  p_practice_id uuid,
  p_settings jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_practice_admin(p_practice_id) and not public.is_platform_admin() then
    raise exception using errcode = '42501', message = 'not_authorized';
  end if;

  update public.practices
  set settings = p_settings
  where id = p_practice_id;

  if not found then
    raise exception using errcode = 'P0001', message = 'practice_not_found';
  end if;

  insert into public.audit_events (
    actor_profile_id, practice_id, event_type, entity_type, entity_id, metadata
  ) values (
    (select auth.uid()), p_practice_id, 'practice_settings_changed', 'practice', p_practice_id, '{}'::jsonb
  );
end;
$$;

revoke all on function public.update_practice_settings(uuid, jsonb) from public, anon;
grant execute on function public.update_practice_settings(uuid, jsonb) to authenticated;

-- ------------------------------------------------------------
-- Globale Plattformkonfiguration - nur Plattformadmin.
-- ------------------------------------------------------------
create function public.update_platform_config(p_config jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_platform_admin() then
    raise exception using errcode = '42501', message = 'not_authorized';
  end if;

  update public.platform_config
  set product_name = coalesce(p_config ->> 'productName', product_name),
      support_email = coalesce(p_config ->> 'supportEmail', support_email),
      support_url = coalesce(p_config ->> 'supportUrl', support_url),
      privacy_url = coalesce(p_config ->> 'privacyUrl', privacy_url),
      imprint_url = coalesce(p_config ->> 'imprintUrl', imprint_url),
      maintenance_active = coalesce((p_config ->> 'maintenanceActive')::boolean, maintenance_active),
      maintenance_message = coalesce(p_config ->> 'maintenanceMessage', maintenance_message),
      default_new_practice_timezone = coalesce(p_config ->> 'defaultNewPracticeTimezone', default_new_practice_timezone),
      default_new_practice_locale = coalesce(p_config ->> 'defaultNewPracticeLocale', default_new_practice_locale),
      max_upload_mb = coalesce((p_config ->> 'maxUploadMb')::int, max_upload_mb),
      updated_by = (select auth.uid())
  where id = 1;

  insert into public.audit_events (
    actor_profile_id, event_type, entity_type, entity_id, metadata
  ) values (
    (select auth.uid()), 'platform_config_changed', 'platform_config', null, '{}'::jsonb
  );
end;
$$;

revoke all on function public.update_platform_config(jsonb) from public, anon;
grant execute on function public.update_platform_config(jsonb) to authenticated;

create function public.update_platform_feature_flags(p_flags jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_platform_admin() then
    raise exception using errcode = '42501', message = 'not_authorized';
  end if;

  update public.platform_config
  set feature_flags = p_flags,
      updated_by = (select auth.uid())
  where id = 1;

  insert into public.audit_events (
    actor_profile_id, event_type, entity_type, entity_id, metadata
  ) values (
    (select auth.uid()), 'platform_feature_flags_changed', 'platform_config', null, '{}'::jsonb
  );
end;
$$;

revoke all on function public.update_platform_feature_flags(jsonb) from public, anon;
grant execute on function public.update_platform_feature_flags(jsonb) to authenticated;

-- ------------------------------------------------------------
-- Mitgliederverwaltung: Rolle aendern / (de)aktivieren. Praxisadmin
-- (eigene Praxis) oder Plattformadmin. practice_members hat bewusst
-- KEINE Client-Update-Policy - dieser RPC ist der einzige Schreibweg,
-- die bestehenden Schutz-Trigger (letzter aktiver Admin) greifen
-- automatisch, weil sie auf der Tabelle selbst sitzen.
-- ------------------------------------------------------------
create function public.set_practice_member_status(
  p_member_id uuid,
  p_role public.practice_role,
  p_is_active boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_practice_id uuid;
begin
  select practice_id into v_practice_id
  from public.practice_members
  where id = p_member_id;

  if v_practice_id is null then
    raise exception using errcode = 'P0001', message = 'member_not_found';
  end if;

  if not public.is_practice_admin(v_practice_id) and not public.is_platform_admin() then
    raise exception using errcode = '42501', message = 'not_authorized';
  end if;

  update public.practice_members
  set role = p_role, is_active = p_is_active
  where id = p_member_id;

  insert into public.audit_events (
    actor_profile_id, practice_id, event_type, entity_type, entity_id, metadata
  ) values (
    (select auth.uid()), v_practice_id, 'practice_member_status_changed', 'practice_member', p_member_id,
    jsonb_build_object('role', p_role, 'is_active', p_is_active)
  );
end;
$$;

revoke all on function public.set_practice_member_status(uuid, public.practice_role, boolean) from public, anon;
grant execute on function public.set_practice_member_status(uuid, public.practice_role, boolean) to authenticated;

-- ------------------------------------------------------------
-- Plattformadmin laedt fuer eine BESTEHENDE Praxis eine weitere
-- Mitarbeiter-Einladung ein (z.B. Wiederherstellung, falls eine
-- Praxis ohne aktiven Admin dasteht - siehe Dashboard-Warnhinweis).
-- Laufende Selbstverwaltung neuer Einladungen bleibt Sache der
-- Praxisadmins selbst (Phase E); dieser Weg ist der Ausnahmefall.
-- ------------------------------------------------------------
create function public.create_staff_invite_as_platform_admin(
  p_practice_id uuid,
  p_email text,
  p_role public.practice_role,
  p_token_hash text,
  p_expires_at timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_platform_admin_id uuid;
  v_invite_id uuid;
begin
  select id into v_platform_admin_id
  from public.platform_admins
  where profile_id = (select auth.uid());

  if v_platform_admin_id is null then
    raise exception using errcode = '42501', message = 'not_authorized';
  end if;

  insert into public.staff_invites (
    practice_id, email, role, token_hash, created_by_platform_admin_id, expires_at
  ) values (
    p_practice_id, lower(p_email), p_role, p_token_hash, v_platform_admin_id, p_expires_at
  )
  returning id into v_invite_id;

  insert into public.audit_events (
    actor_profile_id, practice_id, event_type, entity_type, entity_id, metadata
  ) values (
    (select auth.uid()), p_practice_id, 'staff_invite_created', 'staff_invite', v_invite_id,
    jsonb_build_object('role', p_role)
  );

  return v_invite_id;
end;
$$;

revoke all on function public.create_staff_invite_as_platform_admin(uuid, text, public.practice_role, text, timestamptz) from public, anon;
grant execute on function public.create_staff_invite_as_platform_admin(uuid, text, public.practice_role, text, timestamptz) to authenticated;
