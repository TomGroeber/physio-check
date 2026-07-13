-- Phase C (Auftrag 13.07.2026): exactly one active medium of each kind
-- per exercise. Replacements use an upsert, so the database never exposes
-- two competing videos/posters/caption files for the same exercise.

create unique index exercise_media_exercise_kind_key
  on public.exercise_media (exercise_id, kind);
