-- ============================================================
-- Echte Kontolöschung statt reiner Zugangssperre (Master-Prompt
-- Phase 4, 21.07.2026).
--
-- Bisher (D-062) schrieb der Löschantrag nur eine Zeile in
-- account_deletion_requests und bannte das Konto – es wurde NICHTS
-- gelöscht. Das ist keine Kontolöschung, nur eine Sperre.
--
-- Diese Migration ergänzt eine atomare, SECURITY-DEFINER-Funktion, die
-- beim Löschantrag SOFORT alle Daten löscht/anonymisiert, die der
-- Patient allein kontrolliert und die für nichts anderes gebraucht
-- werden: Profilbild-Verweis (das Storage-Objekt selbst löscht der
-- Server-Handler danach, da Storage-Löschung Service-Role braucht),
-- Telefonnummer, Erinnerungseinstellungen, eigene Benachrichtigungen.
--
-- BEWUSST NICHT gelöscht: Auth-Konto/Profil selbst (cascadiert sonst
-- auf Praxisverbindungen, Termine, Übungspläne, Selbstauskünfte und
-- Verordnungen – genau die Daten, deren Aufbewahrungsfrist für
-- Luxemburg rechtlich noch nicht geklärt ist, D-062/D-070). Diese
-- Daten bleiben unverändert, bis eine zuständige Person die Frist
-- bestätigt; `retained_data_note` dokumentiert das für jeden Antrag.
-- Der Zugang wird zusätzlich weiterhin gesperrt (Login-Bann, im
-- Route-Handler, da auth.admin nur mit Service-Role erreichbar ist).
-- ============================================================

alter table public.account_deletion_requests
  add column if not exists retained_data_note text not null default '';

comment on column public.account_deletion_requests.retained_data_note is
  'Für Nutzer sichtbare Erklärung, welche Daten aus welchem Grund (noch) nicht gelöscht wurden.';

-- Die bisherige "genau ein offener Antrag"-Regel passt nicht mehr:
-- jeder Antrag wird jetzt sofort verarbeitet, es gibt also fortan
-- direkt mehrere 'processed'-Zeilen als Historie statt eines
-- wartenden 'open'-Zustands. Der partielle Unique-Index bleibt
-- unschädlich (er wirkt nur auf status='open'), wird aber nicht mehr
-- aktiv benötigt.

create or replace function public.request_account_deletion(p_profile_id uuid)
returns table (avatar_path text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_avatar_path text;
  v_note text := 'Praxisbezogene Behandlungsdaten (Termine, Übungspläne, Selbstauskünfte, Verordnungen, Dokumente) bleiben gespeichert, bis die Aufbewahrungsfrist rechtlich bestätigt ist (offene Rechtsfrage Luxemburg). Ihr Zugang wurde gesperrt.';
begin
  -- Nur die eigene Person darf ihre eigene Löschung anstoßen. Diese
  -- Funktion läuft mit den Rechten des aufrufenden Nutzers (siehe
  -- Aufrufer: Route-Handler nutzt den mit dem Bearer-Token
  -- authentifizierten Client, nicht den Service-Client).
  if p_profile_id is null or p_profile_id <> auth.uid() then
    raise exception 'not_authorized' using errcode = '42501';
  end if;

  -- Spalte muss über den Tabellennamen qualifiziert werden: der
  -- RETURNS-TABLE-Ausgabename "avatar_path" erzeugt sonst eine
  -- gleichnamige PL/pgSQL-Variable, die mit profiles.avatar_path
  -- kollidiert ("column reference avatar_path is ambiguous").
  select profiles.avatar_path into v_avatar_path
  from public.profiles
  where profiles.id = p_profile_id;

  update public.profiles
  set phone = '', avatar_path = null
  where id = p_profile_id;

  delete from public.patient_reminder_preferences
  where profile_id = p_profile_id;

  delete from public.notifications
  where recipient_profile_id = p_profile_id;

  insert into public.account_deletion_requests (
    profile_id, status, processed_at, retained_data_note
  )
  values (p_profile_id, 'processed', now(), v_note);

  insert into public.audit_events (
    actor_profile_id, event_type, entity_type, entity_id, metadata
  )
  values (
    p_profile_id, 'account_deletion_processed', 'profile', p_profile_id, '{}'::jsonb
  );

  return query select v_avatar_path;
end;
$$;

revoke all on function public.request_account_deletion(uuid) from public, anon;
grant execute on function public.request_account_deletion(uuid) to authenticated;
