-- Etappe 2: patient phone number + calendar colors for practice members.
--
-- profiles.phone: optional contact number. The owner edits it through the
-- existing "profiles: update own" policy; an actively linked practice may
-- correct it only through set_patient_phone() below.
--
-- practice_members.calendar_color: fixed accessible palette. Members may
-- change ONLY this column on ONLY their own row (column-level grant +
-- row policy); every other write path stays server-side.

-- ---------- profiles.phone ----------

alter table public.profiles
  add column phone text not null default ''
  constraint profiles_phone_length check (char_length(phone) <= 30);

comment on column public.profiles.phone is
  'Optional contact phone number. Self-maintained; linked practices may correct it via set_patient_phone().';

-- ---------- practice_members.calendar_color ----------

alter table public.practice_members
  add column calendar_color text not null default 'teal'
  constraint practice_members_calendar_color check (
    calendar_color in ('teal', 'indigo', 'amber', 'rose', 'emerald', 'violet', 'cyan', 'slate')
  );

-- practice_members rows are written server-side only (roles!). Narrow the
-- broad table-level update grant down to the one harmless column, then
-- allow members to touch only their own row.
revoke update on public.practice_members from authenticated;
grant update (calendar_color) on public.practice_members to authenticated;

create policy "practice members: update own calendar color"
  on public.practice_members for update
  using (profile_id = (select auth.uid()))
  with check (profile_id = (select auth.uid()));

-- ---------- practice corrects a linked patient's phone ----------

create function public.set_patient_phone(target_patient_id uuid, new_phone text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new_phone is null or char_length(new_phone) > 30 then
    raise exception 'invalid phone number';
  end if;

  if not exists (
    select 1
    from public.patient_practice_links link
    where link.patient_profile_id = target_patient_id
      and link.status = 'active'
      and public.is_practice_member(link.practice_id)
  ) then
    raise exception 'not authorized to update this patient';
  end if;

  update public.profiles
  set phone = trim(new_phone)
  where id = target_patient_id;
end;
$$;

revoke all on function public.set_patient_phone(uuid, text) from public;
grant execute on function public.set_patient_phone(uuid, text) to authenticated;
