-- Phase D/E: typed schedules and atomic, immutable exercise-plan versions.

create or replace function public.is_valid_plan_schedule(p_schedule jsonb)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_mode text;
  v_value jsonb;
  v_day int;
  v_days int[] := '{}';
  v_time text;
  v_times text[] := '{}';
  v_times_per_day int;
  v_times_per_week int;
begin
  if p_schedule is null or jsonb_typeof(p_schedule) <> 'object' then
    return false;
  end if;

  v_mode := p_schedule ->> 'mode';

  -- Legacy schedules remain readable and valid until a new version is published.
  if v_mode is null and p_schedule ? 'weekdays' then
    v_mode := 'weekdays';
    v_times_per_day := 1;
  elsif v_mode is null and p_schedule ? 'times_per_week' then
    begin
      v_times_per_week := (p_schedule ->> 'times_per_week')::int;
    exception when others then
      return false;
    end;
    return (p_schedule ->> 'times_per_week') ~ '^[1-7]$';
  elsif v_mode = 'weekdays' then
    begin
      v_times_per_day := (p_schedule ->> 'times_per_day')::int;
    exception when others then
      return false;
    end;
    if not ((p_schedule ->> 'times_per_day') ~ '^[1-6]$') then
      return false;
    end if;
  elsif v_mode = 'times_per_week' then
    begin
      v_times_per_week := (p_schedule ->> 'times_per_week')::int;
      v_times_per_day := coalesce((p_schedule ->> 'times_per_day')::int, 1);
    exception when others then
      return false;
    end;
    if not ((p_schedule ->> 'times_per_week') ~ '^[1-7]$') or v_times_per_day <> 1 then
      return false;
    end if;
    if p_schedule ? 'preferred_times' then
      if jsonb_typeof(p_schedule -> 'preferred_times') <> 'array'
        or jsonb_array_length(p_schedule -> 'preferred_times') > 1 then
        return false;
      end if;
      for v_value in select value from jsonb_array_elements(p_schedule -> 'preferred_times') loop
        if jsonb_typeof(v_value) <> 'string' then return false; end if;
        v_time := v_value #>> '{}';
        if v_time !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' then return false; end if;
      end loop;
    end if;
    return true;
  else
    return false;
  end if;

  if not (p_schedule ? 'weekdays')
    or jsonb_typeof(p_schedule -> 'weekdays') <> 'array'
    or jsonb_array_length(p_schedule -> 'weekdays') not between 1 and 7 then
    return false;
  end if;

  for v_value in select value from jsonb_array_elements(p_schedule -> 'weekdays') loop
    if jsonb_typeof(v_value) <> 'number' or (v_value #>> '{}') !~ '^[1-7]$' then
      return false;
    end if;
    v_day := (v_value #>> '{}')::int;
    if v_day = any(v_days) then return false; end if;
    v_days := array_append(v_days, v_day);
  end loop;

  if p_schedule ? 'preferred_times' then
    if jsonb_typeof(p_schedule -> 'preferred_times') <> 'array'
      or jsonb_array_length(p_schedule -> 'preferred_times') > v_times_per_day then
      return false;
    end if;
    for v_value in select value from jsonb_array_elements(p_schedule -> 'preferred_times') loop
      if jsonb_typeof(v_value) <> 'string' then return false; end if;
      v_time := v_value #>> '{}';
      if v_time !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' or v_time = any(v_times) then
        return false;
      end if;
      v_times := array_append(v_times, v_time);
    end loop;
  end if;

  return true;
exception when others then
  return false;
end;
$$;

alter table public.exercise_plan_items
  add constraint exercise_plan_items_schedule_valid
  check (public.is_valid_plan_schedule(schedule)) not valid;

alter table public.exercise_plan_items
  validate constraint exercise_plan_items_schedule_valid;

-- At most one plan is active for a patient inside a practice. Archived
-- versions and their completion history remain untouched.
create unique index exercise_plans_one_active_per_patient_idx
  on public.exercise_plans (practice_id, patient_profile_id)
  where status = 'active';

-- Patients only see the active plan of the practice they are currently
-- linked to. A former practice keeps its history, but it is no longer
-- exposed through the patient's session after a practice change.
create or replace function public.can_access_plan(p_plan_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.exercise_plans p
    where p.id = p_plan_id
      and (
        public.is_practice_member(p.practice_id)
        or (
          p.patient_profile_id = (select auth.uid())
          and public.is_linked_patient(p.practice_id)
        )
      )
  );
$$;

create or replace function public.patient_can_view_exercise(p_exercise_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.exercise_plan_items i
    join public.exercise_plan_versions v on v.id = i.plan_version_id
    join public.exercise_plans p on p.id = v.plan_id
    where i.exercise_id = p_exercise_id
      and p.patient_profile_id = (select auth.uid())
      and p.status = 'active'
      and p.current_version_id = v.id
      and public.is_linked_patient(p.practice_id)
  );
$$;

drop policy "exercise_plans: patient reads own" on public.exercise_plans;
create policy "exercise_plans: patient reads current practice"
  on public.exercise_plans for select
  using (
    patient_profile_id = (select auth.uid())
    and public.is_linked_patient(practice_id)
  );

-- Plan mutations are intentionally only exposed through the atomic RPCs
-- below. Direct table writes could otherwise create half-published versions.
drop policy "exercise_plans: members create" on public.exercise_plans;
drop policy "exercise_plans: members update" on public.exercise_plans;
drop policy "plan_versions: members create" on public.exercise_plan_versions;
drop policy "plan_items: members create" on public.exercise_plan_items;

create or replace function public.publish_exercise_plan(
  p_practice_id uuid,
  p_patient_id uuid,
  p_title text,
  p_change_note text,
  p_items jsonb,
  p_notification_title text,
  p_notification_body text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_member_id uuid;
  v_plan_id uuid;
  v_version_id uuid;
  v_version_number int;
  v_item jsonb;
  v_exercise_id uuid;
  v_start_date date;
  v_end_date date;
  v_sets int;
  v_repetitions int;
  v_hold_seconds int;
  v_total_duration_seconds int;
  v_rest_seconds int;
  v_note text;
  v_sort_order int := 0;
  v_seen_exercises uuid[] := '{}';
begin
  select m.id into v_member_id
  from public.practice_members m
  where m.practice_id = p_practice_id
    and m.profile_id = (select auth.uid())
    and m.is_active;

  if v_member_id is null then raise exception 'not_authorized'; end if;
  if not exists (
    select 1 from public.patient_practice_links l
    where l.practice_id = p_practice_id
      and l.patient_profile_id = p_patient_id
      and l.status = 'active'
  ) then raise exception 'patient_not_linked'; end if;

  if length(btrim(coalesce(p_title, ''))) not between 2 and 200 then
    raise exception 'invalid_plan_title';
  end if;
  if length(btrim(coalesce(p_change_note, ''))) > 500 then
    raise exception 'invalid_change_note';
  end if;
  if jsonb_typeof(p_items) <> 'array'
    or jsonb_array_length(p_items) not between 1 and 30 then
    raise exception 'invalid_plan_items';
  end if;
  if length(coalesce(p_notification_title, '')) not between 1 and 200
    or length(coalesce(p_notification_body, '')) > 500 then
    raise exception 'invalid_notification';
  end if;

  -- Serializes concurrent publications for this exact patient/practice pair.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_practice_id::text || ':' || p_patient_id::text, 0)
  );

  select p.id into v_plan_id
  from public.exercise_plans p
  where p.practice_id = p_practice_id
    and p.patient_profile_id = p_patient_id
    and p.status = 'active'
  for update;

  if v_plan_id is null then
    insert into public.exercise_plans (
      practice_id, patient_profile_id, created_by, title, status
    ) values (
      p_practice_id, p_patient_id, v_member_id, btrim(p_title), 'active'
    ) returning id into v_plan_id;
  end if;

  select coalesce(max(v.version_number), 0) + 1 into v_version_number
  from public.exercise_plan_versions v
  where v.plan_id = v_plan_id;

  insert into public.exercise_plan_versions (
    plan_id, version_number, created_by, change_note
  ) values (
    v_plan_id, v_version_number, v_member_id, btrim(coalesce(p_change_note, ''))
  ) returning id into v_version_id;

  for v_item in select value from jsonb_array_elements(p_items) loop
    begin
      v_exercise_id := (v_item ->> 'exercise_id')::uuid;
      v_start_date := (v_item ->> 'start_date')::date;
      v_end_date := nullif(v_item ->> 'end_date', '')::date;
      v_sets := nullif(v_item ->> 'sets', '')::int;
      v_repetitions := nullif(v_item ->> 'repetitions', '')::int;
      v_hold_seconds := nullif(v_item ->> 'hold_seconds', '')::int;
      v_total_duration_seconds := nullif(v_item ->> 'total_duration_seconds', '')::int;
      v_rest_seconds := nullif(v_item ->> 'rest_seconds', '')::int;
      v_note := btrim(coalesce(v_item ->> 'note', ''));
    exception when others then
      raise exception 'invalid_plan_item';
    end;

    if v_exercise_id = any(v_seen_exercises)
      or not exists (
        select 1 from public.exercises e
        where e.id = v_exercise_id
          and e.practice_id = p_practice_id
          and e.is_active
          and e.archived_at is null
      )
      or not public.is_valid_plan_schedule(v_item -> 'schedule')
      or v_end_date < v_start_date
      or (v_sets is not null and v_sets not between 1 and 20)
      or (v_repetitions is not null and v_repetitions not between 1 and 100)
      or (v_hold_seconds is not null and v_hold_seconds not between 1 and 600)
      or (v_total_duration_seconds is not null and v_total_duration_seconds not between 1 and 3600)
      or (v_rest_seconds is not null and v_rest_seconds not between 0 and 600)
      or length(v_note) > 1000 then
      raise exception 'invalid_plan_item';
    end if;

    v_seen_exercises := array_append(v_seen_exercises, v_exercise_id);
    insert into public.exercise_plan_items (
      plan_version_id, exercise_id, sort_order, start_date, end_date, schedule,
      sets, repetitions, hold_seconds, total_duration_seconds, rest_seconds, note
    ) values (
      v_version_id, v_exercise_id, v_sort_order, v_start_date, v_end_date,
      v_item -> 'schedule', v_sets, v_repetitions, v_hold_seconds,
      v_total_duration_seconds, v_rest_seconds, v_note
    );
    v_sort_order := v_sort_order + 1;
  end loop;

  update public.exercise_plans
  set title = btrim(p_title), current_version_id = v_version_id
  where id = v_plan_id;

  insert into public.notifications (
    recipient_profile_id, type, title, body, reference
  ) values (
    p_patient_id, 'exercise_plan_published', p_notification_title,
    p_notification_body,
    jsonb_build_object('plan_id', v_plan_id, 'version_number', v_version_number)
  );

  insert into public.audit_events (
    actor_profile_id, practice_id, event_type, entity_type, entity_id, metadata
  ) values (
    (select auth.uid()), p_practice_id, 'exercise_plan_published',
    'exercise_plan', v_plan_id, jsonb_build_object('version_number', v_version_number)
  );

  return v_plan_id;
end;
$$;

create or replace function public.archive_exercise_plan(
  p_practice_id uuid,
  p_patient_id uuid,
  p_plan_id uuid,
  p_notification_title text,
  p_notification_body text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_member_id uuid;
begin
  select m.id into v_member_id
  from public.practice_members m
  where m.practice_id = p_practice_id
    and m.profile_id = (select auth.uid())
    and m.is_active;
  if v_member_id is null then raise exception 'not_authorized'; end if;
  if not exists (
    select 1 from public.patient_practice_links l
    where l.practice_id = p_practice_id
      and l.patient_profile_id = p_patient_id
      and l.status = 'active'
  ) then raise exception 'patient_not_linked'; end if;
  if length(coalesce(p_notification_title, '')) not between 1 and 200
    or length(coalesce(p_notification_body, '')) > 500 then
    raise exception 'invalid_notification';
  end if;

  update public.exercise_plans
  set status = 'archived'
  where id = p_plan_id
    and practice_id = p_practice_id
    and patient_profile_id = p_patient_id
    and status = 'active';
  if not found then raise exception 'plan_not_found'; end if;

  insert into public.notifications (
    recipient_profile_id, type, title, body, reference
  ) values (
    p_patient_id, 'exercise_plan_archived', p_notification_title,
    p_notification_body, jsonb_build_object('plan_id', p_plan_id)
  );
  insert into public.audit_events (
    actor_profile_id, practice_id, event_type, entity_type, entity_id, metadata
  ) values (
    (select auth.uid()), p_practice_id, 'exercise_plan_archived',
    'exercise_plan', p_plan_id, '{}'::jsonb
  );
  return true;
end;
$$;

revoke all on function public.is_valid_plan_schedule(jsonb) from public;
grant execute on function public.is_valid_plan_schedule(jsonb) to authenticated;
revoke all on function public.publish_exercise_plan(uuid, uuid, text, text, jsonb, text, text) from public;
grant execute on function public.publish_exercise_plan(uuid, uuid, text, text, jsonb, text, text) to authenticated;
revoke all on function public.archive_exercise_plan(uuid, uuid, uuid, text, text) from public;
grant execute on function public.archive_exercise_plan(uuid, uuid, uuid, text, text) to authenticated;
