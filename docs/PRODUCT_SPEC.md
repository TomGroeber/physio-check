# PhysioCheck – Produktspezifikation (MVP)

> Stand: 2026-07-11 · Status: Phase 0 (Planung) · Verbindliche Grundlage ist der Masterprompt; dieses Dokument konkretisiert ihn.

## 1. Produktvision

PhysioCheck verbindet Physiotherapiepraxen mit ihren Patientinnen und Patienten. Therapeuten erstellen individuelle Heimübungspläne mit kurzen Videos, verwalten Termine und sehen die von Patienten **selbst dokumentierte** Durchführung. Patienten finden ohne Suchen ihre heutigen Übungen, ihren nächsten Termin und können Übungen anhand von Videos durchführen und dokumentieren.

Die Patientenoberfläche ist konsequent für ältere und technisch unerfahrene Menschen gestaltet: große Bedienelemente, klare deutsche Sprache, wenige Entscheidungen pro Bildschirm.

## 2. Fachliche Leitplanken (nicht verhandelbar)

1. **Selbstauskunft, kein Nachweis.** Dokumentierte Übungen heißen „Durchführung dokumentieren" / „Übung erledigt" / „Adhärenz". Niemals „verifiziert", „bewiesen" oder „kontrolliert ausgeführt".
2. **Einladung vor Registrierung.** Ein Patientenkonto kann erst nach Prüfung eines gültigen Praxis-Codes erstellt werden. Bestehende Konten können eine geprüfte Einladung nach dem Login annehmen. Auf neuen Geräten erfolgt die Anmeldung über das Konto, nicht erneut über den Code.
3. **Codes sind sicher:** zufällig, 7 Tage gültig, einmal verwendbar, widerrufbar, nur als Hash gespeichert, gegen Erraten geschützt (Rate Limiting).
4. **Absage ist zunächst eine Anfrage.** Der Therapeut bestätigt oder lehnt ab. Automatische Bestätigung fristgerechter Absagen ist eine spätere, konfigurierbare Praxis-Einstellung.
5. **Kein Medizinprodukt-Verhalten:** keine Diagnosen, keine automatischen Therapieentscheidungen, kein Notfalldienst. Bei hohen Schmerzangaben nur eine neutrale, mit der Praxis abstimmbare Sicherheitsinformation.

## 3. Rollen und Rechte

| Rolle | Sieht / darf |
|---|---|
| **Patient** | Nur eigene Daten: Profil, Praxisverknüpfung, Termine, Pläne, Videos, Protokolle, Benachrichtigungen. |
| **Physiotherapeut** | Nur Daten der eigenen Praxis: Patienten anlegen/einladen, Codes verwalten, Übungsbibliothek pflegen, Pläne zuweisen, Termine verwalten, Absageanfragen bearbeiten, Adhärenz einsehen. |
| **Praxisadministrator** | Technisch angelegt, UI im MVP minimal: Praxisdaten, Mitarbeitende, Grundeinstellungen. |

Rollenzuweisung erfolgt **niemals** durch den Benutzer selbst über das Frontend. Autorisierung wird serverseitig UND per PostgreSQL Row Level Security (RLS) durchgesetzt.

## 4. MVP-Funktionsumfang mit Akzeptanzkriterien

### F1 – Registrierung und Anmeldung
- Registrierung/Anmeldung per E-Mail und Passwort; E-Mail-Bestätigung; „Passwort vergessen".
- Verständliche deutsche Fehlertexte ohne technische Codes.
- Öffentliche Startseite bietet Einladungscode oder Anmeldung; eine freie Patientenregistrierung existiert nicht.
- Rollenabhängige Weiterleitung; ein Konto ohne Praxisverknüpfung landet bei der Einladungseingabe.
- Therapeutenkonten entstehen nur über einen Admin-/Praxiseinladungsprozess (im MVP: Seed/Admin-Skript, dokumentiert).

**Akzeptanz:** Ein neuer Patient kann sich erst nach gültigem Code registrieren, die E-Mail bestätigen und die Verbindung ausdrücklich annehmen. Ein Therapeut landet nach Login im Dashboard.

### F2 – Patienten-Einladung
- Therapeut legt Patientendatensatz mit minimalen Daten an (z. B. nur Anzeigename).
- System erzeugt gut ablesbaren Code ohne verwechselbare Zeichen (kein 0/O, 1/I/l).
- Ablauf nach 7 Tagen, einmal verwendbar, widerrufbar; neuer Code invalidiert den alten aktiven.
- In der Datenbank liegt nur ein Hash. Einlösung ist ratenbegrenzt.
- Nach Einlösung ist das Patientenkonto mit der Praxis verknüpft.

**Akzeptanz:** Gültiger Code verknüpft genau einmal. Abgelaufene, widerrufene, benutzte und falsche Codes werden mit verständlicher Meldung abgewiesen; wiederholtes Raten wird gebremst.

### F2a – Praxiswechsel
- Im MVP ist genau eine Praxisverbindung aktiv.
- Vor einem Wechsel wird die aktuell verbundene Praxis klar genannt.
- Erst die ausdrückliche Bestätigung beendet die bisherige Verbindung und aktiviert die neue.
- Frühere Verbindungen bleiben als Historie gespeichert; Daten werden nicht zwischen Praxen verschoben.

**Akzeptanz:** Ein Patient kann mit einem gültigen Code zu einer anderen Praxis wechseln, ohne dass Mitarbeiter einer Praxis Daten der anderen Praxis sehen.

### F3 – Patienten-Startseite („Heute")
Beantwortet ohne Scrollen: Was mache ich heute? Wann ist mein Termin? Gibt es Neues?
- Große Schaltfläche **„Heutige Übungen starten"**.
- Fortschritt „0 von 4 Übungen erledigt" – sachlich, nie beschämend.
- Nächster Termin mit Datum, Uhrzeit, Adresse, behandelnder Person + „Adresse in Karten-App öffnen".
- Hinweis auf neue/geänderte Aufgaben, falls vorhanden.

### F4 – Übungsbibliothek und Videos
- Therapeuten pflegen Übungen vollständig über die Oberfläche (kein Codeeingriff).
- Übung: Titel, Kurzbeschreibung, Video, Ausgangsposition, Durchführungsschritte, optional häufige Fehler, optional Hilfsmittel, Standarddauer/Wiederholungsart, Aktiv/Inaktiv.
- Videos in privatem Storage, Zugriff nur über kurzlebige signierte URLs; Dateityp- und Größenvalidierung; Vorschaubild, Untertitel, statisches Alternativbild eingeplant; kein Autoplay mit Ton.

### F5 – Individuelle Übungspläne
- Pro Patient konfigurierbar: Start-/Enddatum, Wochentage oder Häufigkeit/Woche, Sätze, Wiederholungen, Halte-/Gesamtdauer, Pause, Notiz, Sortierung.
- Pläne sind **versioniert**: Änderungen erzeugen eine neue Version; alte Durchführungsprotokolle bleiben unverfälscht (Snapshot der Vorgaben je Protokoll).

### F6 – Durchführung dokumentieren
- Patient sieht Video und Vorgaben; einfacher Timer bei zeitbasierten Übungen.
- Sätze oder ganze Übung als erledigt markieren; optional „zu schwierig" / „nicht möglich".
- Optional Schmerz vor/nach auf klar beschrifteter 0–10-Skala; optionale Kurznotiz.
- Zeitstempel + Status werden gespeichert; offensichtliche Doppelerfassungen werden verhindert, ohne zu blockieren.
- Bei sehr starken/zunehmenden Schmerzen: konfigurierbare Sicherheitsinformation (Übung pausieren, Praxis kontaktieren). Keine Diagnose.

### F7 – Therapeutisches Dashboard
- Kompakt: heutige Termine, offene Absageanfragen, Patienten mit/ohne kürzliche Aktivität (Zeitraum konfigurierbar), markierte Rückmeldungen („zu schwierig", hohe Schmerzangaben).
- Patientenliste mit Suche und einfachen Filtern.
- Patientendetail: nächster Termin, aktueller Plan, Einheiten der letzten 7/30 Tage, Verlauf ohne medizinische Bewertung, Rückmeldungen, Aktionen (Plan, Termin, Code).
- Sachliche Sprache; kein Rot allein für „nicht erledigt"; keine beschämende Gamification.

### F8 – Termine und Absagen
- Termin: Start/Ende, Zeitzone, Standort + Adresse, behandelnde Person, optionaler neutraler Hinweis, Status (geplant / Absage angefragt / abgesagt / abgeschlossen).
- Patient stellt Absageanfrage mit optionalem Grund; vorher klarer Hinweis, dass es eine Anfrage ist.
- Beide Seiten sehen jede Statusänderung. Verschiebungsanfrage: vorbereitet, nicht im MVP.

### F9 – Benachrichtigungen
- Internes Benachrichtigungszentrum (In-App). Architektur erweiterbar für Push/E-Mail: Termin morgen, Plan neu/geändert, Absage bearbeitet, freiwillige Trainingserinnerung.
- Nicht notwendige Erinnerungen sind abschaltbar. Keine Gesundheitsdaten in Push-Vorschauen/Betreffzeilen.

## 5. Nicht im MVP

Automatische Diagnosen/Therapieempfehlungen · KI-Bewegungsanalyse · Patientenvideoaufnahmen · Live-Chat · Bezahlung/Rechnungen · Kalender-Sync mit Drittanbietern · Praxissoftware-Integrationen · Ranglisten/Punkte/Streak-Zwang · jede Behauptung korrekter Ausführung. → Erweiterungen in `docs/ROADMAP.md`.

## 6. UX-Vorgaben (Kurzfassung)

**Patient:** mobile-first, Deutsch (fr/lb später), Touch-Ziele ≥ 48×48 px, Fließtext ≥ 18 px, WCAG 2.2 AA, Tastatur + Screenreader, vergrößerte Systemschrift, max. 3 Bereiche (**Heute · Termine · Profil**), sichtbare Zurück-Navigation, keine Kernaktionen per Wischgeste, Bestätigung vor folgenreichen Aktionen, klare Erfolgsmeldungen.

**Therapeut:** Desktop/Tablet-optimiert, auf Smartphone nutzbar; Seitenleiste; eindeutige Filter/Status; sensible Daten nur wo nötig.

**Visuell:** ruhig, modern, vertrauenswürdig – warme helle Grundfläche, dunkles Navy, zurückhaltendes Teal. Branding zentral in Konfiguration/Design-Tokens (siehe `docs/CUSTOMIZATION_GUIDE.md`, entsteht in Phase 4).

## 7. Definition of Done (MVP)

Siehe Masterprompt-Abschnitt „Definition of Done"; verkürzt: Rollentrennung technisch sauber, Einladungsablauf sicher + getestet, Übungen/Videos ohne Codeänderung pflegbar, versionierte Pläne, verständliche Dokumentation der Durchführung, konsistente Termine/Absagen, responsive Kernansichten, WCAG-2.2-AA-orientierte Patientenoberfläche, RLS-Tests gegen Fremdzugriff, keine Secrets/echten Daten im Repo, Typecheck + Lint + Tests + Production Build grün, verständliche Doku, ehrlich dokumentierte offene Risiken.
