-- Allow the trusted server client to validate exercise schedules.
grant execute on function public.is_valid_plan_schedule(jsonb) to service_role;
