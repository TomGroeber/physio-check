-- Reparatur aus dem ersten lokalen Lauf der RLS-Suite (2026-07-18):
-- mark_notification_read war als SECURITY INVOKER angelegt, obwohl das
-- direkte UPDATE-Recht auf notifications für authenticated in derselben
-- Migration bewusst entzogen wurde. Damit schlug jeder Aufruf mit
-- "permission denied for table notifications" fehl – Patienten konnten
-- Planhinweise nie als gelesen markieren.
--
-- SECURITY DEFINER stellt die gewollte, eng begrenzte Funktion her:
-- Nur die empfangende Person kann ausschließlich den eigenen Lesestatus
-- setzen; Titel, Inhalt, Typ und Empfänger bleiben unveränderbar.
create or replace function public.mark_notification_read(p_notification_id uuid)
returns void
language plpgsql
security definer
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

revoke all on function public.mark_notification_read(uuid) from public, anon;
grant execute on function public.mark_notification_read(uuid) to authenticated;
