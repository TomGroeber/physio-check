# PhysioCheck – Aufbewahrung und Löschung

> Stand 01.08.2026. Code-verifiziert. Ergänzt `docs/PRIVACY_SECURITY.md` um den konkreten Stand für Nachrichten und Akten.

## Kontolöschung (bestehende Funktion, `20260721100000_real_account_deletion.sql`)

Sofort und endgültig gelöscht: Telefonnummer, Profilbild-Verweis (Datei aus dem Speicher entfernt), Erinnerungseinstellungen, eigene Benachrichtigungen. Löschantrag selbst wird dokumentiert (Status + Hinweis zur Aufbewahrungsfrist).

**Bewusst NICHT gelöscht** (Profilzeile bleibt bestehen, daher bleiben verknüpfte Zeilen erreichbar): Termine, Übungspläne/-protokolle, Verordnungen, Patientenakten, **Nachrichten**. Das ist eine offene, rechtlich noch zu klärende Frage (Luxemburg-spezifische Aufbewahrungsfrist, s. `docs/PRIVACY_SECURITY.md`) – nicht versehentlich vergessen, sondern bewusst aufgeschoben, bis die rechtliche Prüfung steht. **Nachrichten waren in der bisherigen Dokumentation nicht explizit genannt, unterliegen aber demselben Mechanismus** (Profil bleibt, Fremdschlüssel-Zeilen bleiben erreichbar) – hiermit nachgetragen.

## Praxiswechsel eines Patienten (`patient_practice_links.status`)

| Datenkategorie | Ehemalige Praxis behält Zugriff? |
|---|---|
| Termine, Übungspläne/-protokolle, Verordnungen, Patientenakten, interne Kurzprofile | **Ja** – wie eine Papierakte, die eine Praxis nach Behandlungsende behält |
| **Nachrichten** | **Nein** – sofortiger Zugriffsverlust, sowohl Lesen als auch Schreiben |

Diese bewusste Ungleichbehandlung ist im Code selbst dokumentiert (Kommentar in der Nachrichten-Migration) und entspricht einer expliziten Vorgabe: Nachrichten sind ein laufender Kommunikationskanal, keine klinische Aufzeichnung – eine ehemalige Praxis hat keinen Grund mehr, mitzulesen.

## Mitarbeiterdeaktivierung (`practice_members.is_active`)

Eine deaktivierte Mitarbeiterin verliert sofort jeden Zugriff auf alle Praxisdaten (jede RLS-Regel prüft `is_active = true`) – unabhängig davon, ob sie vorher an bestimmten Unterhaltungen/Akten beteiligt war. Es gibt keine Sonderregel „ehemalige Mitarbeiterin behält Einsicht in eigene Fälle".

## Praxisdeaktivierung

Eine deaktivierte/gesperrte Praxis kann laut Lebenszyklus-Regeln nicht mehr aktiv auf Patientendaten zugreifen; die Daten selbst bleiben erhalten (kein Hard-Delete einer ganzen Praxis, s. `docs/PLATFORM_ADMIN_GUIDE.md`).

## Was fehlt (ehrlich)

- Kein automatisierter Prozess, der Daten nach Ablauf einer bestimmten Frist automatisch löscht (Löschung ist aktuell immer eine bewusste, einzelne Aktion – z. B. „Dokument endgültig löschen", nie ein Zeitablauf-Automatismus).
- Die Luxemburg-spezifische Aufbewahrungsfrist ist rechtlich noch nicht final geklärt (s. `docs/PRIVACY_SECURITY.md`) – bis dahin bleibt die konservative Voreinstellung „nichts automatisch löschen" bestehen, was Datensparsamkeit gegen Rechtssicherheit abwägt.
