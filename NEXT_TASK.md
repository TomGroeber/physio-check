# Nächster Arbeitsschritt

> Stand: 2026-07-13 · Laufender Auftrag: Übungs-/Videoverwaltung, individuelle Pläne, flexible Häufigkeiten, geführter Patientenmodus, optimierter Einladungseinstieg (Phasen A–J, Details in `TASKS.md`). Der frühere Inhalt dieser Datei (Folgeauftrag Phase D–G) ist vollständig erledigt und dokumentiert in `docs/AI_HANDOFF.md`.

- **Phase A/B:** Einladungseinstieg und vollständige Übungsbibliothek fertig und lokal verifiziert.
- **Phase C (Cloud-Prüfstand):** Sicherer Medien-Ticket-Upload für Video, Bilder und WebVTT fertig; lokale Supabase-/Browserprüfung offen.
- **Phase D/E (Cloud-Prüfstand, 2026-07-13):** Typisierter individueller Plan-Builder und atomare, unveränderliche Planversionen samt Archivierung, Audit und datensparsamer Notification implementiert. Migration `20260713140000`; Typecheck, Lint, 74 Unit-Tests und Build grün. Lokaler DB-/RLS-/Browserlauf bleibt offen.
- **Phase F (Cloud-Prüfstand, 2026-07-13):** Mehrere einzeln dokumentierbare Durchgänge, Wochenziele und getrennte Soll-/Dokumentiert-/Erledigt-Zählung implementiert. Migration `20260713160000`; Typecheck, Lint, 79 Unit-Tests und Build grün. Lokaler DB-/RLS-/Browserlauf bleibt offen.
- **Phase G (Cloud-Prüfstand, 2026-07-13):** Geführter Patientenmodus `/session` mit einer Übung/einem Durchgang, Video, großen Vorgaben, optionalem Timer, automatischem Weitergehen und Tageszusammenfassung implementiert. Typecheck, Lint, 83 Tests und Build grün; Browser-/WCAG-Prüfung offen.
- **Phase H (Cloud-Prüfstand, 2026-07-13):** Praxis-Auswertung für 7/30 Tage, Soll/Dokumentiert/Erledigt, problematische und ungelesene Rückmeldungen, Schmerzmarkierungen, letzte Aktivität und inaktive Patienten implementiert. Migration `20260713180000`; Typecheck, Lint, 88 Tests und Build grün. Lokaler DB-/RLS-/Browserlauf offen.

## Jetzt dran

**Phase I – freiwillige Erinnerungen:** patientenseitige Einstellungen, Ruhezeiten und datensparsame In-App-Hinweise für fällige beziehungsweise weitere Tagesdurchgänge umsetzen; Push ehrlich als späteren Ausbau dokumentieren. Danach Phase J Gesamtprüfung und verbleibende Qualitätslücken.

## Regeln (Kurzfassung)

Deutsch im UI, Englisch im Code; bestehende Migrationen nie umschreiben (nur neue, timestamp-basiert); Service-Role-Key nie im Client; RLS für alles Patientenbezogene; ehrlich dokumentieren; nach jeder Phase Typecheck/Lint/Tests, Doku-Update, `pnpm docs:sync`, Commit + Push.
