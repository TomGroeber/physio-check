-- ============================================================
-- Globale Plattformkonfiguration (getrennt von practices.settings,
-- das praxisindividuell bleibt). Singleton-Tabelle: genau eine Zeile.
-- Schreibzugriff ausschliesslich ueber Betreiber-Server-Actions
-- (Service-Role, nach is_platform_admin()-Pruefung); Lesezugriff fuer
-- Clients bewusst NICHT ueber RLS freigegeben - oeffentlich noetige
-- Werte (Wartungshinweis) liefert eine eigene, eng begrenzte Route.
-- ============================================================

create table public.platform_config (
  id smallint primary key default 1 check (id = 1),
  product_name text not null default 'PhysioCheck',
  support_email text not null default '',
  support_url text not null default '',
  privacy_url text not null default '',
  imprint_url text not null default '',
  maintenance_active boolean not null default false,
  maintenance_message text not null default '',
  default_new_practice_timezone text not null default 'Europe/Luxembourg',
  default_new_practice_locale text not null default 'de',
  -- Sicherheitsobergrenze: darf per UI nur INNERHALB dieses fest
  -- codierten Korridors geaendert werden (siehe Zod-Schema).
  max_upload_mb int not null default 5 check (max_upload_mb between 1 and 25),
  -- Typisierte, schema-validierte Flags statt beliebiger Schluessel.
  -- Form je Eintrag: { enabled: boolean, defaultForNewPractices: boolean }.
  feature_flags jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null
);

comment on table public.platform_config is
  'Genau eine Zeile (id=1). Aenderungen ausschliesslich ueber Betreiber-Server-Actions nach is_platform_admin()-Pruefung; Historie liegt in audit_events (event_type = platform_config_updated).';

insert into public.platform_config (id) values (1);

alter table public.platform_config enable row level security;
-- Bewusst keine Policies fuer authenticated/anon: weder lesen noch
-- schreiben. Betreiber-Server-Actions lesen/schreiben ausschliesslich
-- ueber den Service-Role-Client.

create trigger platform_config_updated_at
  before update on public.platform_config
  for each row execute function public.set_updated_at();
