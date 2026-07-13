# Nächster Arbeitsschritt

> Stand: 2026-07-13 · Laufender Auftrag: Übungs-/Videoverwaltung, individuelle Pläne, flexible Häufigkeiten, geführter Patientenmodus, optimierter Einladungseinstieg (Phasen A–J, Details in `TASKS.md`). Der frühere Inhalt dieser Datei (Folgeauftrag Phase D–G) ist vollständig erledigt und dokumentiert in `docs/AI_HANDOFF.md`.

## Erledigt in diesem Auftrag

- **Phase A** (2026-07-13): Einladungseinstieg – primärer Code-Weg auf der Startseite, Ablaufdatum + Hinweistext auf `/invite/continue`, lokal erzeugter QR-Code beim Einladungsergebnis (`src/components/practice/invite-qr-code.tsx`, Paket `qrcode`). Verifiziert per 7-Schritte-UI-Durchlauf; Typecheck/Lint/61 Unit-Tests grün.

## Jetzt dran

**Phase B – Übungsbibliothek:** Migration (Kategorie/Körperregion, Standard-Gesamtdauer, `archived_at` auf `exercises`), Praxis-UI unter `/practice/exercises`: Suche, Filter, anlegen, bearbeiten, duplizieren, deaktivieren, archivieren. Kein Hard-Delete referenzierter Übungen. Danach Phasen C–J gemäß `TASKS.md`.

## Regeln (Kurzfassung)

Deutsch im UI, Englisch im Code; bestehende Migrationen nie umschreiben (nur neue, timestamp-basiert); Service-Role-Key nie im Client; RLS für alles Patientenbezogene; ehrlich dokumentieren; nach jeder Phase Typecheck/Lint/Tests, Doku-Update, `pnpm docs:sync`, Commit + Push.
