-- Phase F: separate, atomically numbered exercise occurrences.

alter table public.completion_logs
  add column occurrence_index int;

-- Preserve every historical log. If old data contains same-day duplicates,
-- give them deterministic indexes instead of deleting or merging them.
with ranked as (
  select
    id,
    row_number() over (
      partition by patient_profile_id, plan_item_id, performed_on
      order by performed_at, id
    )::int as occurrence_index
  from public.completion_logs
)
update public.completion_logs logs
set occurrence_index = ranked.occurrence_index
from ranked
where ranked.id = logs.id;

alter table public.completion_logs
  alter column occurrence_index set not null,
  alter column occurrence_index set default 1,
  add constraint completion_logs_occurrence_positive check (occurrence_index > 0);

create unique index completion_logs_one_occurrence_idx
  on public.completion_logs (
    patient_profile_id, plan_item_id, performed_on, occurrence_index
  );

-- Inserts are only allowed through the function below. It derives date,
-- due state and next occurrence server-side and closes direct over-logging.
drop policy "completion_logs: patient documents own" on public.completion_logs;

create or replace function public.record_exercise_occurrence(
  p_plan_item_id uuid,
  p_status public.completion_status,
  p_sets_completed int,
  p_pain_before int,
  p_pain_after int,
  p_note text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_today date;
  v_timezone text;
  v_schedule jsonb;
  v_start_date date;
  v_end_date date;
  v_exercise_id uuid;
  v_exercise_title text;
  v_sets int;
  v_repetitions int;
  v_hold_seconds int;
  v_total_duration_seconds int;
  v_rest_seconds int;
  v_plan_note text;
  v_mode text;
  v_iso_weekday int;
  v_planned int;
  v_week_start date;
  v_documented int;
  v_occurrence_index int;
  v_log_id uuid;
begin
  if v_user_id is null then raise exception 'not_authenticated'; end if;

  select
    i.start_date, i.end_date, i.schedule, i.sets, i.repetitions,
    i.hold_seconds, i.total_duration_seconds, i.rest_seconds, i.note,
    e.id, e.title, pr.timezone
  into
    v_start_date, v_end_date, v_schedule, v_sets, v_repetitions,
    v_hold_seconds, v_total_duration_seconds, v_rest_seconds, v_plan_note,
    v_exercise_id, v_exercise_title, v_timezone
  from public.exercise_plan_items i
  join public.exercises e on e.id = i.exercise_id
  join public.exercise_plan_versions v on v.id = i.plan_version_id
  join public.exercise_plans p on p.id = v.plan_id
  join public.practices pr on pr.id = p.practice_id
  join public.patient_practice_links l
    on l.practice_id = p.practice_id
   and l.patient_profile_id = p.patient_profile_id
   and l.status = 'active'
  where i.id = p_plan_item_id
    and p.patient_profile_id = v_user_id
    and p.status = 'active'
    and p.current_version_id = v.id;

  if v_exercise_id is null then raise exception 'not_found'; end if;
  v_today := (pg_catalog.now() at time zone v_timezone)::date;
  v_iso_weekday := extract(isodow from v_today)::int;
  if v_today < v_start_date or (v_end_date is not null and v_today > v_end_date) then
    raise exception 'not_due';
  end if;
  if length(btrim(coalesce(p_note, ''))) > 1000
    or (p_sets_completed is not null and p_sets_completed not between 0 and 20)
    or (p_pain_before is not null and p_pain_before not between 0 and 10)
    or (p_pain_after is not null and p_pain_after not between 0 and 10) then
    raise exception 'invalid_log';
  end if;

  v_mode := v_schedule ->> 'mode';
  if v_mode is null and v_schedule ? 'times_per_week' then
    v_mode := 'times_per_week';
  elsif v_mode is null then
    v_mode := 'weekdays';
  end if;

  -- Serialize concurrent taps for the same patient/item/day.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_user_id::text || ':' || p_plan_item_id::text || ':' || v_today::text, 0)
  );

  if v_mode = 'times_per_week' then
    v_planned := (v_schedule ->> 'times_per_week')::int;
    v_week_start := v_today - (v_iso_weekday - 1);
    select count(*)::int into v_documented
    from public.completion_logs logs
    where logs.patient_profile_id = v_user_id
      and logs.plan_item_id = p_plan_item_id
      and logs.performed_on between v_week_start and v_week_start + 6;
    if v_documented >= v_planned then raise exception 'all_occurrences_logged'; end if;
    if exists (
      select 1 from public.completion_logs logs
      where logs.patient_profile_id = v_user_id
        and logs.plan_item_id = p_plan_item_id
        and logs.performed_on = v_today
    ) then raise exception 'duplicate_occurrence'; end if;
    v_occurrence_index := 1;
  elsif v_mode = 'weekdays' then
    if not exists (
      select 1 from jsonb_array_elements_text(v_schedule -> 'weekdays') day_value
      where day_value::int = v_iso_weekday
    ) then raise exception 'not_due'; end if;
    v_planned := coalesce((v_schedule ->> 'times_per_day')::int, 1);
    select series.index into v_occurrence_index
    from generate_series(1, v_planned) as series(index)
    where not exists (
      select 1 from public.completion_logs logs
      where logs.patient_profile_id = v_user_id
        and logs.plan_item_id = p_plan_item_id
        and logs.performed_on = v_today
        and logs.occurrence_index = series.index
    )
    order by series.index
    limit 1;
    if v_occurrence_index is null then raise exception 'all_occurrences_logged'; end if;
  else
    raise exception 'invalid_schedule';
  end if;

  insert into public.completion_logs (
    patient_profile_id, plan_item_id, performed_on, performed_at,
    occurrence_index, status, sets_completed, pain_before, pain_after,
    note, prescription_snapshot
  ) values (
    v_user_id, p_plan_item_id, v_today, pg_catalog.now(),
    v_occurrence_index, p_status, p_sets_completed, p_pain_before, p_pain_after,
    btrim(coalesce(p_note, '')),
    jsonb_build_object(
      'exercise_id', v_exercise_id,
      'exercise_title', v_exercise_title,
      'sets', v_sets,
      'repetitions', v_repetitions,
      'hold_seconds', v_hold_seconds,
      'total_duration_seconds', v_total_duration_seconds,
      'rest_seconds', v_rest_seconds,
      'schedule', v_schedule,
      'note', v_plan_note,
      'occurrence_index', v_occurrence_index,
      'planned_occurrences', v_planned
    )
  ) returning id into v_log_id;

  return v_log_id;
end;
$$;

revoke all on function public.record_exercise_occurrence(uuid, public.completion_status, int, int, int, text) from public;
grant execute on function public.record_exercise_occurrence(uuid, public.completion_status, int, int, int, text) to authenticated;
