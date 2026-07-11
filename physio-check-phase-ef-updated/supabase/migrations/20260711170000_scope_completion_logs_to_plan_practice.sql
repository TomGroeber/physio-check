-- ============================================================
-- Phase C: Mandantentrennung für Durchführungsprotokolle schärfen
--
-- Bisher durften Mitglieder jeder Praxis mit AKTIVEM Link alle
-- Protokolle des Patienten lesen – nach einem Praxiswechsel also auch
-- die Dokumentation, die unter dem Plan der früheren Praxis entstand.
-- Neu: Ein Praxismitglied liest nur Protokolle, deren Plan-Item zu
-- einem Plan der EIGENEN Praxis gehört. Die frühere Praxis behält so
-- ihre eigene Behandlungsdokumentation, die neue Praxis sieht nichts
-- aus der alten Verbindung ("Daten werden nicht übertragen").
-- Patienten lesen weiterhin nur ihre eigenen Protokolle.
-- ============================================================

drop policy "completion_logs: members read for linked patients"
  on public.completion_logs;

create policy "completion_logs: members read own practice plan logs"
  on public.completion_logs for select
  using (
    exists (
      select 1
      from public.exercise_plan_items i
      join public.exercise_plan_versions v on v.id = i.plan_version_id
      join public.exercise_plans p on p.id = v.plan_id
      where i.id = completion_logs.plan_item_id
        and public.is_practice_member(p.practice_id)
    )
  );
