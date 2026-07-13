-- Phase I: voluntary patient reminder settings and safe read receipts.

create table public.patient_reminder_preferences (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  exercise_reminders_enabled boolean not null default true,
  plan_updates_enabled boolean not null default true,
  quiet_start time not null default '20:00',
  quiet_end time not null default '08:00',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger patient_reminder_preferences_set_updated_at
  before update on public.patient_reminder_preferences
  for each row execute function public.set_updated_at();

alter table public.patient_reminder_preferences enable row level security;

create policy "patient reminder preferences: own read"
  on public.patient_reminder_preferences for select
  using (profile_id = (select auth.uid()));

create policy "patient reminder preferences: own insert"
  on public.patient_reminder_preferences for insert
  with check (profile_id = (select auth.uid()));

create policy "patient reminder preferences: own update"
  on public.patient_reminder_preferences for update
  using (profile_id = (select auth.uid()))
  with check (profile_id = (select auth.uid()));

-- A recipient may acknowledge a notification but must not rewrite its
-- server-created title, body, type, reference or ownership.
create or replace function public.mark_notification_read(p_notification_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  update public.notifications
  set read_at = coalesce(read_at, now())
  where id = p_notification_id
    and recipient_profile_id = (select auth.uid());

  if not found then
    raise exception 'notification_not_found';
  end if;
end;
$$;

revoke update on public.notifications from authenticated;
grant execute on function public.mark_notification_read(uuid) to authenticated;

