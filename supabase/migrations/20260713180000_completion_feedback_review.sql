-- Phase H: separate review metadata for immutable patient self-reports.

alter table public.completion_logs
  add column reviewed_at timestamptz,
  add column reviewed_by uuid references public.practice_members (id) on delete set null;

create index completion_logs_unreviewed_idx
  on public.completion_logs (patient_profile_id, performed_at desc)
  where reviewed_at is null;

create or replace function public.mark_completion_log_reviewed(p_log_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_member_id uuid;
  v_practice_id uuid;
begin
  select p.practice_id, m.id
  into v_practice_id, v_member_id
  from public.completion_logs logs
  join public.exercise_plan_items i on i.id = logs.plan_item_id
  join public.exercise_plan_versions v on v.id = i.plan_version_id
  join public.exercise_plans p on p.id = v.plan_id
  join public.practice_members m
    on m.practice_id = p.practice_id
   and m.profile_id = (select auth.uid())
   and m.is_active
  where logs.id = p_log_id;

  if v_member_id is null then raise exception 'not_authorized'; end if;

  update public.completion_logs
  set reviewed_at = coalesce(reviewed_at, pg_catalog.now()),
      reviewed_by = coalesce(reviewed_by, v_member_id)
  where id = p_log_id;

  insert into public.audit_events (
    actor_profile_id, practice_id, event_type, entity_type, entity_id, metadata
  ) values (
    (select auth.uid()), v_practice_id, 'completion_feedback_reviewed',
    'completion_log', p_log_id, '{}'::jsonb
  );
  return true;
end;
$$;

revoke all on function public.mark_completion_log_reviewed(uuid) from public;
grant execute on function public.mark_completion_log_reviewed(uuid) to authenticated;
