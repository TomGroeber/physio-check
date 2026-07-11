# PhysioCheck – Roadmap (nach dem MVP)

> Erweiterungen, die bewusst NICHT im ersten MVP sind. Die Architektur hält die Türen offen, ohne für Hypothesen zu wachsen.

## Nächste Produktphasen

- **Phase C:** echte Übungsverwaltung, private Videos und funktionierende Dokumentation der Durchführung
- **Phase D:** Absagen, neue Terminanfragen, mehrere Vorschläge und Bestätigung durch den Patienten
- **Phase E:** internes Benachrichtigungszentrum mit gelesen/ungelesen
- **Phase F:** private Patientenakten mit Upload, Audit-Log und strikter Mandantentrennung

## Nahe Erweiterungen (Architektur vorbereitet)

- **Terminverschiebungs-Anfrage** (analog zur Absageanfrage; `cancellation_requests` dient als Muster)
- **Automatische Bestätigung fristgerechter Absagen** (Praxis-Einstellung in `practices.settings`)
- **Push- und E-Mail-Benachrichtigungen** (Benachrichtigungszentrum existiert als Tabelle; Versandkanäle andocken, keine Gesundheitsdaten in Vorschau/Betreff)
- **Weitere Sprachen: Französisch, Luxemburgisch** (`src/messages/fr.ts`, `lb.ts` nach dem Muster von `de.ts`)
- **Dunkles Farbschema aktivieren** (Tokens in `globals.css` sind vorbereitet)
- **Echte App-Icons + Offline-Verhalten der PWA** (Manifest existiert; Service Worker, Icon-Satz)
- **Praxisadmin-Oberfläche ausbauen** (Mitarbeitende verwalten, Praxisdaten bearbeiten)
- **Datenexport und Kontolöschung als Selbstbedienung** (Datenmodell sieht es vor)

## Später denkbar

- Parallele aktive Praxen pro Patient mit bewusster Praxisauswahl (im MVP ist genau eine Praxis aktiv; Praxiswechsel ist bereits möglich)
- Kalender-Abo (ICS) für Termine
- Erinnerungs-Feineinstellungen pro Übung
- Statistiken für Praxen (aggregiert, ohne medizinische Bewertung)

## Bewusst ausgeschlossen (siehe Produktspezifikation)

Automatische Diagnosen, KI-Bewegungsanalyse, Patientenvideoaufnahmen, Live-Chat, Bezahlung/Rechnungen, Fremdkalender-Sync, Praxissoftware-Integrationen, Ranglisten/Streaks, jede „Verifikations"-Behauptung über Übungsausführung.
