# PhysioCheck – Vorgehen bei einem Sicherheitsvorfall

> Stand 01.08.2026. Für Tom: was zu tun ist, falls doch einmal etwas passiert. Noch nie in der Praxis durchgespielt – vor einem echten Pilotbetrieb empfehlenswert, das einmal bewusst zu üben.

## Sofortmaßnahmen (in dieser Reihenfolge)

1. **Ruhe bewahren, nichts überstürzt löschen.** Gelöschte Spuren erschweren später die Aufklärung.
2. **Zugriff einschränken, wenn nötig:** betroffenes Konto deaktivieren (Praxismitglied) oder Praxis sperren (im Betreiberportal, „Praxis-Lebenszyklus") – kein Hard-Delete.
3. **Umfang feststellen:** welche Datenkategorie ist betroffen? Nachrichten? Akten? Nur ein Konto oder mehrere? Die `docs/DATA_LOCATION_REGISTER.md` hilft, schnell zu sehen, was in der betroffenen Tabelle überhaupt liegt.
4. **Audit-Ereignisse prüfen:** im Betreiberportal, „Letzte Ereignisse" – strukturiert, ohne Gesundheitsdaten, aber mit Zeitstempeln und Ereignistypen, die zeigen, was wann passiert ist.

## Wer entscheidet was

- **Zugriffssperrungen** (Konto/Praxis): nur Tom als Plattform-Admin (bereits so eingerichtet – keine Praxis kann sich selbst oder andere sperren).
- **Wiederherstellung aus einem Backup**: nur Tom, nur nach vorherigem Testlauf auf Staging (s. `docs/BACKUP_AND_RECOVERY.md`) – im Ernstfall trotzdem zuerst genau abwägen, ob eine volle Wiederherstellung nötig ist oder eine gezielte Korrektur reicht (eine volle Wiederherstellung verwirft auch alle rechtmäßigen Änderungen seit der Sicherung).

## Wann Betroffene informiert werden müssen

Bei einem Vorfall mit echten Patientendaten kann eine gesetzliche Meldepflicht bestehen (DSGVO, ggf. mit kurzer Frist). **Das ist eine rechtliche Frage, keine technische** – im Ernstfall zeitnah rechtlichen Rat einholen, nicht selbst entscheiden, ob eine Meldung nötig ist. Dieses Dokument ersetzt keine rechtliche Beratung.

## Was danach zu tun ist

1. Root-Cause finden (nicht nur Symptom beheben) – bei einem code-bedingten Fehler: Fehler beheben, automatisierten Test dagegen schreiben (wie bei jedem anderen Fehler in diesem Projekt).
2. Kurze, ehrliche Notiz in `DECISIONS.md`, was passiert ist und was behoben wurde (wie bei jeder anderen Entscheidung/jedem Fund in diesem Projekt).
3. Betroffene informieren, falls rechtlich/ethisch geboten.
4. Dieses Dokument bei Bedarf um die tatsächlich gemachte Erfahrung ergänzen.

## Ehrlich: aktueller Stand

Es gab bisher **keinen echten Sicherheitsvorfall** in diesem Projekt (lokale Entwicklung, keine echten Patientendaten, s. `CLAUDE.md`). Dieses Dokument ist vorausschauend geschrieben, nicht aus einem echten Vorfall abgeleitet – ein bewusster Testlauf (z. B. „simulierter Vorfall" auf Staging, sobald es existiert) wäre wertvoll, um zu sehen, ob der Ablauf in der Praxis wirklich so reibungslos funktioniert wie hier beschrieben.
