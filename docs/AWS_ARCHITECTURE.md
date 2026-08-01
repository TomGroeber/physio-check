# PhysioCheck – Mögliche vollständige AWS-Architektur (Referenz, nicht empfohlen)

> Stand 01.08.2026. Beantwortet die Aufgabenstellung „AWS-Option B untersuchen". **Reine Skizze auf dem Papier – nichts hiervon existiert, nichts wurde angelegt.** Laut `docs/HOSTING_OPTIONS.md` wird diese Option für PhysioCheck aktuell NICHT empfohlen (Supabase deckt dieselbe Funktionalität mit deutlich weniger Eigenaufwand ab). Dieses Dokument existiert, damit die Option nachvollziehbar dokumentiert ist, falls sie später aus einem konkreten Grund doch relevant wird.

## Bausteine und wofür sie stünden

| AWS-Baustein | Würde ersetzen | Anmerkung |
|---|---|---|
| AWS Amplify (oder eine begründete Alternative) | Next.js-Hosting (aktuell z. B. Vercel-artig) | Amplify kann Next.js direkt bauen/hosten |
| API Gateway + Lambda | Next.js Server Actions/Route Handler liefen dann teils weiter in Amplify, teils bräuchte man zusätzliche Lambda-Funktionen für Hintergrundaufgaben | Deutlich mehr bewegliche Teile als heute |
| RDS oder Aurora (PostgreSQL) | die heutige Supabase-Datenbank | RLS-Regeln (Zeilenrechte) müssten 1:1 identisch nachgebaut werden – das ist der aufwendigste Einzelposten, weil die komplette Sicherheitsarchitektur davon abhängt |
| Private S3-Buckets | Supabase Storage (Profilbilder, Übungsvideos, Patientenakten) | Signierte Kurzzeit-Adressen (wie heute) ließen sich mit S3 „presigned URLs" nachbauen |
| Cognito | Supabase Auth | Login/Registrierung/E-Mail-Bestätigung müssten neu integriert werden – beide Apps (Website + native App) bräuchten eine neue Anbindung |
| KMS | Verschlüsselung ruhender Daten | Bei RDS/S3 grundsätzlich mit AWS-eigenen Schlüsseln möglich; für „auch der Betreiber kommt nicht ran" bräuchte es zusätzlich eigene, clientseitige Verschlüsselung (unabhängig vom Hosting, s. `docs/ENCRYPTION_ARCHITECTURE.md`, sobald erstellt) |
| Secrets Manager | sichere Aufbewahrung von Zugangsschlüsseln | Ersetzt `.env`-Dateien in der produktiven Umgebung |
| CloudTrail | Nachvollziehbarkeit, wer welche AWS-Einstellung wann geändert hat | Betrifft nur AWS-Verwaltungsvorgänge, nicht die App-eigenen Audit-Ereignisse (die gibt es bereits unabhängig davon in der Datenbank) |
| CloudWatch | Systemüberwachung/Alarme | Ersetzt/ergänzt Supabase-eigenes Monitoring |
| AWS Backup | automatische Sicherungen | Müsste für RDS und S3 separat eingerichtet und regelmäßig auf echte Wiederherstellbarkeit geprüft werden |
| WAF + Rate Limits | Schutz vor automatisierten Angriffen/Überlastung | Aktuell teilweise durch Supabase/die Anwendung selbst abgedeckt (z. B. Einladungscode-Ratenbegrenzung), müsste bei AWS zusätzlich auf Infrastrukturebene eingerichtet werden |
| EU-Region | Datenschutz-Anforderung | Bei AWS genauso wählbar wie bei Supabase (z. B. Frankfurt/Irland) |
| Infrastructure as Code | reproduzierbarer, versionierter Aufbau statt Klicken im Kontrollbereich | Empfehlenswert (z. B. Terraform oder AWS CDK), aber selbst ein zusätzlicher Lernaufwand |

## Warum diese Option (aktuell) nicht empfohlen wird

Jeder einzelne Baustein in der Tabelle oben **existiert bei Supabase bereits fertig integriert und aufeinander abgestimmt** – RLS-Rechte, signierte Storage-Adressen, Auth mit E-Mail-Bestätigung, automatische Sicherungen. Eine vollständige AWS-Architektur würde bedeuten, all das einzeln neu zu bauen und selbst dafür zu sorgen, dass die Teile so sicher zusammenspielen, wie es die bestehende, bereits getestete Supabase-Architektur heute tut (136 automatisierte Zugriffsproben, s. `docs/TEST_MATRIX.md`) – mit entsprechend hohem Risiko, dabei etwas zu übersehen, das RLS heute automatisch verhindert.

## Wann diese Option doch sinnvoll werden könnte

- Eine externe Vorgabe (z. B. eines großen Praxis-Kunden oder einer Kooperation), dass alles ausschließlich in einer bestimmten AWS-Organisation laufen muss.
- Ein tatsächlicher Bedarf, der über das hinausgeht, was Supabase in höheren Tarifen anbietet (bei PhysioCheks aktueller Größe nicht absehbar).
- Der Wunsch, langfristig komplett anbieterunabhängig zu sein (dann wäre allerdings Option C – Supabase selbst hosten – der naheliegendere Zwischenschritt, weil dabei der bestehende, getestete Code unverändert bliebe).

Sollte einer dieser Fälle eintreten, ist dieses Dokument der Ausgangspunkt für eine detaillierte Migrationsplanung – aktuell ist das kein anstehender Schritt.
