-- Etappe 4: authorization warnings for the practice.
--
-- One security-definer function returns, per actively linked patient, the
-- primary authorization (same selection rule the charging uses) whenever it
-- is inside the warning window: remaining units at or below the threshold,
-- or validity ending within the given number of days (or already ended).
-- Thresholds are passed in by the application so TypeScript stays the single
-- source of truth for the default values.

create function public.list_authorization_warnings(
  p_practice_id uuid,
  p_units_threshold int,
  p_expiry_days int
)
returns table (
  patient_profile_id uuid,
  authorization_id uuid,
  title text,
  remaining int,
  valid_until date
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_practice_member(p_practice_id) then
    raise exception using errcode = '42501', message = 'not_authorized';
  end if;

  return query
  select
    link.patient_profile_id,
    auth_rec.id,
    auth_rec.title,
    rem.remaining,
    auth_rec.valid_until
  from public.patient_practice_links link
  cross join lateral (
    select public.primary_authorization_for_patient(link.patient_profile_id) as id
  ) prim
  join public.treatment_authorizations auth_rec on auth_rec.id = prim.id
  cross join lateral (
    select greatest(
      0,
      auth_rec.prescribed_sessions
      + coalesce((
          select sum(adjustment.session_delta)
          from public.treatment_authorization_adjustments adjustment
          where adjustment.authorization_id = auth_rec.id
        ), 0)
      - coalesce((
          select sum(usage.sessions_used)
          from public.appointment_authorization_usages usage
          where usage.authorization_id = auth_rec.id
            and usage.reversed_at is null
        ), 0)
    )::int as remaining
  ) rem
  where link.practice_id = p_practice_id
    and link.status = 'active'
    and auth_rec.practice_id = p_practice_id
    and (
      rem.remaining <= p_units_threshold
      or (
        auth_rec.valid_until is not null
        and auth_rec.valid_until <= current_date + p_expiry_days
      )
    )
  order by rem.remaining, auth_rec.valid_until nulls last;
end;
$$;

revoke all on function public.list_authorization_warnings(uuid, int, int) from public, anon;
grant execute on function public.list_authorization_warnings(uuid, int, int) to authenticated;
