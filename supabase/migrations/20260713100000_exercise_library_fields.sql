-- Phase B (Auftrag 13.07.2026): exercise library management fields.
--
-- The library UI gains search and filters, so exercises get a category
-- (body region), a default total duration (for duration-based dosage)
-- and an archive timestamp. Archiving is the soft replacement for
-- deletion: exercises referenced by plan items or completion logs are
-- never hard-deleted (there is deliberately NO delete policy on
-- public.exercises), so old plans and logs stay readable.

alter table public.exercises
  add column category text not null default ''
    check (char_length(category) <= 100),
  add column default_total_duration_seconds int
    check (default_total_duration_seconds between 1 and 3600),
  add column archived_at timestamptz;

comment on column public.exercises.category is
  'Free-text category / body region (e.g. Ruecken, Knie). Used for filtering only.';
comment on column public.exercises.archived_at is
  'Archived exercises are hidden from pickers and the default library view but stay referencable by old plans and logs.';

create index exercises_practice_active_idx
  on public.exercises (practice_id, archived_at, is_active);
