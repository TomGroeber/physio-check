# PhysioCheck – Roadmap (nach dem MVP)

> Erweiterungen, die bewusst NICHT im ersten MVP sind. Die Architektur hält die Türen offen, ohne für Hypothesen zu wachsen.

## Nächste Produktphasen (Stand 2026-07-11, Phase C fertig)

- **Phase D:** vollständig nutzbarer Praxiskalender (Monat/Woche/Tag, anlegen/ändern/stornieren/abschließen, Konfliktprüfung, Notifications)
- **Phase E:** verordnete und verbleibende Therapiesitzungen (`treatment_authorizations` + Nutzungen, neutrale Kostenhinweise)
- **Phase F:** private Patientenakten mit Upload, Audit-Log und strikter Mandantentrennung
- **Phase G:** Benachrichtigungszentrum, Terminvorschläge nach Absage, Härtung
- **Offen aus Phase C:** Übungs-/Videoverwaltung über die Oberfläche, Planzuweisung per UI, dedizierte RLS-Testsuite

## Nahe Erweiterungen (Architektur vorbereitet)

- **Terminverschiebungs-Anfrage** (analog zur Absageanfrage; `cancellation_requests` dient als Muster)
- **Automatische Bestätigung fristgerechter Absagen** (Praxis-Einstellung in `practices.settings`)
- **Push- und E-Mail-Benachrichtigungen** (freiwillige In-App-Präferenzen existieren; Versandkanäle erst mit Einwilligung/Opt-out andocken, keine Gesundheitsdaten in Vorschau/Betreff)
- **Weitere Sprachen: Französisch, Luxemburgisch** (`src/messages/fr.ts`, `lb.ts` nach dem Muster von `de.ts`)
- **Dunkles Farbschema aktivieren** (Tokens in `globals.css` sind vorbereitet)
- **Echte App-Icons + Offline-Verhalten der PWA** (Manifest existiert; Service Worker, Icon-Satz)
- **Praxisadmin-Oberfläche ausbauen** (Mitarbeitende verwalten, Praxisdaten bearbeiten)
- **Datenexport und Kontolöschung als Selbstbedienung** (Datenmodell sieht es vor)

## Später denkbar

- Parallele aktive Praxen pro Patient mit bewusster Praxisauswahl (im MVP ist genau eine Praxis aktiv; Praxiswechsel ist bereits möglich)
- Kalender-Abo (ICS) für Termine
- Erinnerungs-Feineinstellungen pro einzelner Übung (globale Übungs-/Planhinweise und Ruhezeiten sind umgesetzt)
- Statistiken für Praxen (aggregiert, ohne medizinische Bewertung)

## Bewusst ausgeschlossen (siehe Produktspezifikation)

Automatische Diagnosen, KI-Bewegungsanalyse, Patientenvideoaufnahmen, Live-Chat, Bezahlung/Rechnungen, Fremdkalender-Sync, Praxissoftware-Integrationen, Ranglisten/Streaks, jede „Verifikations"-Behauptung über Übungsausführung.
