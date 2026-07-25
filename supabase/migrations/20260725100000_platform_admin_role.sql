-- ============================================================
-- Betreiber-/Plattformadministratorrolle (streng getrennt von
-- practice_members, siehe Auftrag 25.07.2026).
--
-- Bewusste Entscheidung: KEIN weiterer Wert von practice_role, KEINE
-- Praxis-Mitgliedschaft. Ein eigenes, minimales Grant-Table, das
-- Clients niemals lesen oder schreiben können (keine einzige Policy
-- für `authenticated`/`anon`) – Zuweisung/Entzug ausschließlich über
-- das Service-Role-Skript scripts/platform-admin.ts.
-- ============================================================

create table public.platform_admins (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles (id) on delete cascade,
  granted_by text not null default 'bootstrap-script',
  note text not null default '',
  created_at timestamptz not null default now()
);

comment on table public.platform_admins is
  'Betreiber der Plattform. NICHT ueber practice_members modellierbar, damit eine Praxis-Mitgliedschaft niemals versehentlich Plattformrechte erzeugt. Schreibzugriff ausschliesslich per Service-Role-Skript (scripts/platform-admin.ts).';

alter table public.platform_admins enable row level security;
-- Absichtlich KEINE Policies: weder SELECT noch INSERT/UPDATE/DELETE
-- fuer authenticated/anon. Die Tabelle ist fuer jeden normalen Client
-- vollstaendig unsichtbar; nur der Service-Role-Client (RLS-Bypass)
-- und die untenstehende SECURITY-DEFINER-Funktion koennen sie lesen.

-- ------------------------------------------------------------
-- Autorisierungs-Helfer fuer serverseitige Prüfungen und (falls
-- spaeter noetig) RLS-Policies. Bewusst ohne Fallback auf irgendeine
-- Praxis-Rolle: ein Praxisadmin ist NIE automatisch Plattformadmin.
-- ------------------------------------------------------------
create function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.platform_admins a
    where a.profile_id = (select auth.uid())
  );
$$;

revoke all on function public.is_platform_admin() from public, anon;
grant execute on function public.is_platform_admin() to authenticated;

-- ------------------------------------------------------------
-- Praxis-Lebenszyklus (additiv, bestehende Zeilen bleiben 'active').
-- Typisierte Spalten fuer wichtige Zustaende statt JSON, wie im
-- Auftrag gefordert.
-- ------------------------------------------------------------
create type public.practice_status as enum ('trial', 'active', 'suspended', 'archived');

alter table public.practices
  add column status public.practice_status not null default 'active',
  add column trial_ends_at timestamptz,
  add column support_email text not null default '',
  add column support_url text not null default '',
  add column internal_note text not null default '',
  add column created_by_platform_admin_id uuid references public.platform_admins (id) on delete set null,
  add column status_changed_at timestamptz not null default now(),
  add column status_changed_by uuid references public.profiles (id) on delete set null;

comment on column public.practices.internal_note is
  'Rein betreiberinterne Notiz (z.B. "Testkunde, Ansprechpartner XY"). NIEMALS medizinische oder patientenbezogene Inhalte - wird im Betreiberportal angezeigt, nicht in der Praxis-UI.';
comment on column public.practices.status is
  'trial|active: normale Nutzung moeglich. suspended: Zugriff gesperrt, Daten bleiben erhalten. archived: kein Zugriff, kein Hard Delete.';

create index practices_status_idx on public.practices (status);

-- practices-Update-Policy erlaubte bisher jedem Admin JEDES Feld zu
-- aendern, inkl. status/internal_note/created_by_platform_admin_id.
-- Praxisadmins duerfen ihre Stammdaten pflegen, aber NIE ihren
-- eigenen Lebenszyklus-Status setzen oder die Betreiber-Notiz lesen/
-- schreiben - das waere eine Selbstentsperrung. Die Policy selbst
-- bleibt zeilenbasiert (Postgres RLS kennt keine Spaltenrechte); die
-- Spaltensperre erzwingt zusaetzlich ein Trigger.
drop policy "practices: admin updates" on public.practices;

create policy "practices: admin updates own fields"
  on public.practices for update
  using (public.is_practice_admin(id))
  with check (public.is_practice_admin(id));

-- Spaltensperre fuer Lebenszyklus-/Betreiberfelder. Der Bypass gilt
-- fuer den Service-Role-Client, NICHT fuer is_platform_admin(): unter
-- Service-Role hat der Request keinen Nutzer-JWT-Sub, `auth.uid()`
-- liefert dort NULL, is_platform_admin() waere also fuer den
-- Service-Role-Pfad IMMER false. Die Betreiber-Server-Actions pruefen
-- is_platform_admin() bereits ueber die Sitzung des angemeldeten
-- Nutzers, BEVOR sie den Service-Role-Client fuer den eigentlichen
-- Schreibzugriff erzeugen (Auftragsregel: kein Service-Role-Aufruf
-- ohne unmittelbar vorherige Plattformadminpruefung) - der Trigger
-- vertraut also bewusst dem bereits geprueften Service-Role-Pfad,
-- nicht direkt is_platform_admin().
create function public.prevent_practice_lifecycle_self_edit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.role() = 'service_role' then
    return new;
  end if;

  if new.status is distinct from old.status
    or new.trial_ends_at is distinct from old.trial_ends_at
    or new.internal_note is distinct from old.internal_note
    or new.created_by_platform_admin_id is distinct from old.created_by_platform_admin_id
    or new.status_changed_at is distinct from old.status_changed_at
    or new.status_changed_by is distinct from old.status_changed_by
  then
    raise exception 'practice_lifecycle_admin_only' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger practices_protect_lifecycle_fields
  before update on public.practices
  for each row execute function public.prevent_practice_lifecycle_self_edit();
