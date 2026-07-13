# Nächster Arbeitsschritt

> Stand: 2026-07-13 · Laufender Auftrag: Übungs-/Videoverwaltung, individuelle Pläne, flexible Häufigkeiten, geführter Patientenmodus, optimierter Einladungseinstieg (Phasen A–J, Details in `TASKS.md`). Der frühere Inhalt dieser Datei (Folgeauftrag Phase D–G) ist vollständig erledigt und dokumentiert in `docs/AI_HANDOFF.md`.

## Erledigt in diesem Auftrag

- **Phase A** (2026-07-13): Einladungseinstieg – primärer Code-Weg auf der Startseite, Ablaufdatum + Hinweistext auf `/invite/continue`, lokal erzeugter QR-Code beim Einladungsergebnis (`src/components/practice/invite-qr-code.tsx`, Paket `qrcode`). Verifiziert per 7-Schritte-UI-Durchlauf.
- **Phase B** (2026-07-13): Übungsbibliothek komplett (Suche, Filter, anlegen, bearbeiten, duplizieren, deaktivieren, archivieren; nie Hard-Delete). Migration `20260713100000`. Verifiziert per 8-Schritte-UI-Durchlauf; 65 Unit-Tests.

## Erledigt in diesem Auftrag

- **Phase C implementiert (Cloud-Prüfstand, 2026-07-13):** Sicherer Ticket-Upload für Video, Poster, Alternativbild und WebVTT-Untertitel; Vorschau, Fortschritt, Ersetzen/Entfernen, serverseitige Größen-/Signaturprüfung, Audit und Patientenzugriff über kurzlebige signierte URLs. Migration `20260713120000`; Typecheck, Lint, 69 Unit-Tests und Build grün. Lokaler DB-/RLS-/Browserlauf bleibt offen.

## Jetzt dran

**Phase D/E – Individueller Plan-Builder und Versionierung:** typisiertes Schedule-Modell (Wochentage, N-mal/Woche, N-mal/Tag, Kombination), patientenspezifische Dosierung, atomare Veröffentlichung als neue Planversion mit Änderungsgrund und datensparsamer Notification. Danach Phase F (mehrere Durchgänge pro Tag).

## Regeln (Kurzfassung)

Deutsch im UI, Englisch im Code; bestehende Migrationen nie umschreiben (nur neue, timestamp-basiert); Service-Role-Key nie im Client; RLS für alles Patientenbezogene; ehrlich dokumentieren; nach jeder Phase Typecheck/Lint/Tests, Doku-Update, `pnpm docs:sync`, Commit + Push.
