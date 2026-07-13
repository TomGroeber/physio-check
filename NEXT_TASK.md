# Nächster Arbeitsschritt

> Stand: 2026-07-13 · Laufender Auftrag: Übungs-/Videoverwaltung, individuelle Pläne, flexible Häufigkeiten, geführter Patientenmodus, optimierter Einladungseinstieg (Phasen A–J, Details in `TASKS.md`). Der frühere Inhalt dieser Datei (Folgeauftrag Phase D–G) ist vollständig erledigt und dokumentiert in `docs/AI_HANDOFF.md`.

- **Phase A/B:** Einladungseinstieg und vollständige Übungsbibliothek fertig und lokal verifiziert.
- **Phase C (Cloud-Prüfstand):** Sicherer Medien-Ticket-Upload für Video, Bilder und WebVTT fertig; lokale Supabase-/Browserprüfung offen.
- **Phase D/E (Cloud-Prüfstand, 2026-07-13):** Typisierter individueller Plan-Builder und atomare, unveränderliche Planversionen samt Archivierung, Audit und datensparsamer Notification implementiert. Migration `20260713140000`; Typecheck, Lint, 74 Unit-Tests und Build grün. Lokaler DB-/RLS-/Browserlauf bleibt offen.
- **Phase F (Cloud-Prüfstand, 2026-07-13):** Mehrere einzeln dokumentierbare Durchgänge, Wochenziele und getrennte Soll-/Dokumentiert-/Erledigt-Zählung implementiert. Migration `20260713160000`; Typecheck, Lint, 79 Unit-Tests und Build grün. Lokaler DB-/RLS-/Browserlauf bleibt offen.

## Jetzt dran

**Phase G – geführter Patientenmodus:** barrierearmen Ablauf „Heutige Übungen starten“ mit einer Übung beziehungsweise einem Durchgang pro Bildschirm, Video, großen Vorgaben, optionalem Timer, automatischem Weitergehen und Tageszusammenfassung bauen.

## Regeln (Kurzfassung)

Deutsch im UI, Englisch im Code; bestehende Migrationen nie umschreiben (nur neue, timestamp-basiert); Service-Role-Key nie im Client; RLS für alles Patientenbezogene; ehrlich dokumentieren; nach jeder Phase Typecheck/Lint/Tests, Doku-Update, `pnpm docs:sync`, Commit + Push.
