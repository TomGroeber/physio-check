-- ============================================================
-- Patient profile pictures (avatars).
--
-- Design (D-054):
--  * profiles.avatar_path points at exactly one object in the private
--    bucket `patient-avatars`; the object path is `<profile_id>/<uuid>.<ext>`
--    (no e-mail address or name in the path, random file name).
--  * The column is NOT client-writable: the broad table-level update
--    grant is narrowed to harmless columns (same pattern as
--    practice_members.calendar_color, D-033). All avatar writes run
--    through server actions that verify the session first and use the
--    service role for the column update.
--  * Reading an object is allowed for the patient themselves and for
--    active members of the CURRENTLY linked practice
--    (member_can_view_patient checks link status = 'active', so a
--    former practice loses access after a practice switch).
--  * There are intentionally NO storage insert/update/delete policies:
--    uploads use a short-lived signed upload URL issued server-side
--    after authorization; finalization and deletion use the service
--    role after re-checking ownership.
-- ============================================================

alter table public.profiles
  add column avatar_path text;

comment on column public.profiles.avatar_path is
  'Object path inside the private patient-avatars bucket. Server-managed only.';

-- Narrow the client update surface of profiles to harmless columns so a
-- client can never point avatar_path at a foreign storage object.
revoke update on table public.profiles from authenticated;
grant update (full_name, phone, locale) on public.profiles to authenticated;

-- Private bucket: 5 MB, only common image formats.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'patient-avatars',
  'patient-avatars',
  false,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp']
);

create policy "patient-avatars: read own or current practice"
  on storage.objects for select
  using (
    bucket_id = 'patient-avatars'
    and (
      ((storage.foldername(name))[1])::uuid = (select auth.uid())
      or public.member_can_view_patient(((storage.foldername(name))[1])::uuid)
    )
  );
