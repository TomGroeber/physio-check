# PhysioCheck – Kostenschätzung (Richtwerte)

> Stand 01.08.2026. **Grobe Richtwerte, keine verbindlichen Preise** – Anbieter ändern Preise/Tarife regelmäßig, vor einer echten Buchung immer die aktuellen Seiten der Anbieter prüfen. Keine dieser Kosten ist bisher entstanden; nichts wurde gebucht.

## Option A (empfohlen): Supabase verwaltet + Vercel/Amplify

| Posten | Pilot (1 Praxis, wenige Nutzer:innen) | Produktion (mehrere Praxen) |
|---|---|---|
| Supabase | Kostenloser Tarif reicht oft für einen ersten Test, empfehlenswert aber der „Pro"-Tarif (Stand heute in der Größenordnung 25 $/Monat) wegen täglicher Sicherungen und höherer Grenzen | Je nach Nutzung ggf. nächsthöherer Tarif oder Zusatzkosten für Datenverkehr/Speicher |
| Website-Hosting (Vercel oder AWS Amplify) | Oft im kostenlosen Einstiegstarif möglich für geringen Traffic | Kostenpflichtiger Tarif ab spürbarem Nutzeraufkommen (Größenordnung niedrig zweistellig $/Monat aufwärts) |
| Domain | Größenordnung 10–20 €/Jahr | gleich |
| E-Mail-Versand | Oft kostenloses Kontingent für kleine Mengen ausreichend | Kostenpflichtiger Tarif ab höherem Volumen |
| Apple Developer Program | 99 $/Jahr | gleich |
| Google Play Console | 25 $ einmalig | gleich |
| **Grobe monatliche Gesamtsumme (ohne Jahresgebühren)** | **etwa 25–50 $/Monat** | **etwa 50–150+ $/Monat, abhängig von Praxen-/Nutzerzahl** |

## Option B: Vollständig AWS

Deutlich schwerer seriös zu schätzen, weil viele Einzelposten (RDS, Lambda-Aufrufe, API-Gateway-Anfragen, S3-Speicher/-Traffic, WAF-Anfragen, CloudWatch-Protokolle) jeweils eigene, nutzungsabhängige Preise haben. Als grobe Einordnung: für eine vergleichbare Nutzungsgröße oft **ähnlich oder sogar höher** als Option A, bei gleichzeitig deutlich höherem Einrichtungs- und Wartungsaufwand (der selbst wiederum Zeit/Geld kostet, s. `docs/HOSTING_OPTIONS.md`). Eine belastbare Zahl wäre erst nach einer konkreten Architekturentscheidung und einer echten AWS-Kostenkalkulation (z. B. mit dem AWS-Kostenrechner) sinnvoll – das lohnt sich erst, wenn Option B tatsächlich ansteht.

## Option C: Supabase selbst auf AWS hosten

Serverkosten allein (ein oder mehrere dauerhaft laufende virtuelle Server) liegen grob im Bereich von Option A, ABER: hinzu kommt die eigene Arbeitszeit für Einrichtung, Updates, Sicherheits-Patches und Monitoring – bei einem Einzelbetrieb oder kleinen Team der eigentlich entscheidende Kostenfaktor, nicht die reine Server-Rechnung.

## Nicht in dieser Tabelle enthalten (unabhängig von der Hosting-Wahl)

- Rechtliche Beratung (Datenschutzerklärung, Auftragsverarbeitungsvertrag, Luxemburg-spezifische Fragen) – s. `docs/PRIVACY_SECURITY.md`.
- Eigene Arbeitszeit für Weiterentwicklung/Support.
- Ein echter Virenscan-Dienst im Dauerbetrieb (aktuell nur lokal/CI mit ClamAV getestet, für Produktion bräuchte es einen dauerhaften Scan-Dienst, s. `docs/PRIVACY_SECURITY.md`).

## Fazit

Für einen ersten Pilotbetrieb ist mit **grob 25–50 $ im Monat plus den beiden einmaligen/jährlichen Store-Gebühren** zu rechnen – überschaubar und ohne große Vorabinvestition. Erst bei tatsächlichem Wachstum (mehrere Praxen, viele Nutzer:innen) steigen die Kosten spürbar, dann aber planbar mit dem Nutzen mit.
