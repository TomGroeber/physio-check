# PhysioCheck – Hosting für Einsteiger

> Stand 01.08.2026. Für Tom geschrieben, ohne Vorwissen vorausgesetzt. Erklärt die Grundbegriffe, bevor `docs/HOSTING_OPTIONS.md` die eigentlichen Optionen vergleicht. **Nichts in diesem Dokument wurde umgesetzt** – keine Domain gekauft, kein Konto angelegt, keine Kosten entstanden.

## Die Grundbegriffe, einmal in normaler Sprache

**Domain** ist der Name, den man in die Adresszeile tippt, z. B. `physiocheck.de`. Man „kauft" sie nicht wirklich, man mietet sie jährlich bei einer Registrierungsstelle.

**Hosting** heißt: irgendwo muss ein Computer ständig laufen, der die Website ausliefert, wenn jemand die Domain aufruft. Diesen Computer mietet man bei einem Anbieter (statt selbst einen im Keller stehen zu haben).

**Frontend** ist das, was man sieht und anklickt – bei PhysioCheck die Next.js-Website und die native Handy-App.

**Backend** ist der unsichtbare Teil, der Anfragen entgegennimmt, prüft, wer man ist, und mit der Datenbank spricht. Bei PhysioCheck ist das **Supabase** – ein fertiger Dienst, der Datenbank, Login-System und Dateispeicher in einem Paket anbietet, statt dass man das alles selbst bauen müsste.

**Datenbank** ist der Ort, wo die eigentlichen Daten liegen (Patienten, Termine, Übungen). Bei PhysioCheck: PostgreSQL, verwaltet durch Supabase.

## Wie App und Website dasselbe Backend nutzen

Beide reden mit derselben Supabase-Instanz (einem Datenbank-Projekt, das Supabase für dich betreibt). Die Website läuft dabei über einen zusätzlichen, eigenen Server (siehe unten „Warum die Website einen eigenen Server braucht"), die App spricht größtenteils direkt mit Supabase. Details dazu in `docs/DATA_FLOW.md` – hier reicht: **eine Datenbank, zwei Zugänge.**

## Warum die Website einen eigenen Server braucht (und die App nicht ganz)

Next.js-Websites (wie diese) brauchen einen laufenden Server-Prozess, der bei jeder Seite mitrechnet – anders als eine ganz einfache, „fertig gebackene" Website. Diesen Server muss man hosten (mieten). Die native App braucht dagegen keinen eigenen Server – sie läuft direkt auf dem Handy und lädt sich nur über die (kostenlosen) App-Stores von Apple/Google auf die Geräte der Nutzer.

## Welche Domain braucht was

- Die **Website** braucht eine echte Domain (z. B. `physiocheck.de` oder `app.physiocheck.de`), die Patient:innen und Praxen im Browser eintippen.
- Die **App** braucht **keine eigene Domain** zum Aufrufen (man „besucht" eine App nicht per Adresse), sie muss aber wissen, unter welcher Adresse sie das Backend/die API erreicht – das ist intern eine Einstellung, keine sichtbare Adresse für Nutzer:innen.

## Wie HTTPS funktioniert

HTTPS ist das kleine Schloss-Symbol im Browser – es verschlüsselt die Verbindung, damit niemand unterwegs mitlesen kann. Fast jeder Hosting-Anbieter (Vercel, AWS Amplify, Supabase) richtet das heute automatisch und kostenlos ein (über ein „TLS-Zertifikat", das sich selbst erneuert). Das ist kein zusätzlicher Aufwand oder Kostenpunkt mehr, den man früher noch selbst konfigurieren musste.

## Wie E-Mail-Bestätigung funktioniert

Wenn sich jemand registriert, verschickt Supabase eine Bestätigungs-E-Mail. Lokal beim Entwickeln landet die in einem Test-Postfach (Mailpit) und geht nirgendwo wirklich hin. **Für den echten Betrieb braucht man einen echten E-Mail-Versanddienst** (z. B. den, den Supabase selbst anbietet, oder einen externen wie Postmark/Resend) – das ist einer der „externen Blocker", die noch fehlen (s. `docs/RELEASE_READINESS.md`).

## Wie Deep Links funktionieren

Ein „Deep Link" ist ein Link, der nicht im Browser, sondern direkt in der App öffnet (z. B. der Bestätigungslink aus der Registrierungs-E-Mail, oder ein Link, der direkt zu einem bestimmten Termin führt). Damit das funktioniert, muss die App bei Apple/Google registriert sein und weiß, welche Links „ihr gehören". Das ist bereits im Code vorbereitet, funktioniert aber erst vollständig, sobald die App wirklich veröffentlicht ist (nicht nur im Simulator läuft).

## Welche Konten du grundsätzlich brauchen wirst (noch nicht angelegt)

| Konto | Wofür | Kostet etwas? |
|---|---|---|
| Domain-Registrar (z. B. über AWS Route 53 oder einen anderen Anbieter) | die Adresse `physiocheck.de` o. Ä. | Ja, jährlich, meist niedrig zweistellig € |
| Supabase-Konto (kostenpflichtiger Tarif für Produktion) | Datenbank/Auth/Storage im echten Betrieb | Ja, monatlich, s. `docs/COST_ESTIMATE.md` |
| Hosting für die Website (z. B. Vercel oder AWS Amplify) | die Next.js-Website läuft „im Internet" | Ja, oft mit kostenlosem Einstieg |
| Apple Developer Program | App im Apple App Store veröffentlichen | Ja, ca. 99 $/Jahr |
| Google Play Console | App im Google Play Store veröffentlichen | Ja, einmalig ca. 25 $ |
| E-Mail-Versanddienst | echte Bestätigungs-/Benachrichtigungs-Mails | teils ja, teils kostenlose Kontingente |

## Wie Staging und Produktion getrennt werden

„Staging" ist eine Testumgebung, die genauso aussieht wie die echte (Produktions-)Umgebung, aber mit Test-Daten läuft – damit man neue Funktionen ausprobieren kann, ohne echte Patientendaten zu riskieren. Details/Empfehlung in `docs/STAGING_AND_PRODUCTION.md`.

## Wie Updates veröffentlicht werden

Bei der **Website**: ein neuer Code-Stand wird hochgeladen, der Hosting-Anbieter baut ihn und schaltet ihn live – meist innerhalb weniger Minuten, ohne dass Nutzer:innen etwas installieren müssen.

Bei der **App**: kleine Änderungen (nur JavaScript-Code, kein neues natives Aussehen) können „over the air" ohne Store-Prüfung verteilt werden (Expo unterstützt das). Größere Änderungen (neue native Funktionen) brauchen eine neue Version im App Store/Play Store, die erst geprüft werden muss (kann Stunden bis wenige Tage dauern).

## Wie Backups funktionieren (Grundidee, Details in `docs/BACKUP_AND_RECOVERY.md`)

Supabase sichert bezahlte Projekte automatisch (tägliche Sicherungen, bei höheren Tarifen auch „Zeitreise" auf einen beliebigen Zeitpunkt der letzten Tage). Wichtig: **das ist bisher nicht getestet worden** (kein echter Wiederherstellungs-Testlauf) – das gehört zu den offenen Punkten vor einem echten Praxis-Piloten.

## Wie eine Wiederherstellung abläuft (Grundidee)

Im Ernstfall (z. B. jemand löscht versehentlich etwas Wichtiges) stellt man die Datenbank aus einer Sicherung auf einen Zeitpunkt VOR dem Fehler wieder her. Das ist bei Supabase ein Klick im Kontrollbereich, sollte aber **vorher einmal geübt werden**, damit man im Ernstfall weiß, wie lange es dauert und was währenddessen passiert (kurzer Ausfall).
