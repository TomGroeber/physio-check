-- ============================================================
-- Account deletion requests (D-062, store requirement for in-app
-- account creation).
--
-- The mobile app lets a patient REQUEST deletion. Whether and when
-- practice-side medical records may be deleted is an OPEN legal
-- question for Luxembourg (retention obligations) – documented in
-- docs/APP_STORE_CHECKLIST.md. Therefore this table only records the
-- audited request; processing happens deliberately outside the app.
--
-- Access model: intentionally NO client policies. All writes and reads
-- go through the server (service role) after Bearer authentication –
-- patients cannot forge, read or delete requests directly.
-- ============================================================

create table public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  requested_at timestamptz not null default now(),
  status text not null default 'open'
    constraint account_deletion_requests_status check (status in ('open', 'processed', 'rejected')),
  processed_at timestamptz
);

-- Only one OPEN request per account; processed history stays complete.
create unique index account_deletion_requests_one_open
  on public.account_deletion_requests (profile_id)
  where (status = 'open');

comment on table public.account_deletion_requests is
  'Audited in-app account deletion requests. Processing is manual until the Luxembourg retention question is resolved (D-062). No client policies on purpose.';

alter table public.account_deletion_requests enable row level security;
