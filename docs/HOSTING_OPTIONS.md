# PhysioCheck – Hosting-Optionen im Vergleich

> Stand 01.08.2026. Setzt `docs/HOSTING_FOR_BEGINNERS.md` voraus. **Nichts hier wurde umgesetzt** – reine Gegenüberstellung zur Entscheidungsfindung. Keine Domain gekauft, kein kostenpflichtiges Konto angelegt, kein Vertrag geschlossen.

## Die drei Optionen kurz

**A – Supabase-Backend beibehalten:** Supabase bleibt Datenbank/Auth/Storage (wie heute in der lokalen Entwicklung, nur als bezahlter, produktiver Tarif in einer EU-Region), die Next.js-Website läuft bei Vercel oder AWS Amplify, die Domain kommt über einen Registrar (z. B. Route 53).

**B – Vollständig AWS:** Next.js-Hosting über AWS Amplify, eigenes API-Gateway + Lambda-Funktionen statt Supabase-eigenem Backend, PostgreSQL über RDS/Aurora, S3 für Dateien, Cognito statt Supabase Auth, dazu KMS/Secrets Manager/CloudTrail/CloudWatch/AWS Backup/WAF – im Grunde ein kompletter Nachbau dessen, was Supabase heute schon fertig liefert.

**C – Supabase selbst auf AWS hosten:** die Open-Source-Version von Supabase auf eigenen AWS-Servern betreiben, statt den verwalteten Supabase-Dienst zu nutzen.

## Vergleichstabelle

| Kriterium | A – Supabase (verwaltet) | B – Vollständig AWS | C – Supabase selbst gehostet |
|---|---|---|---|
| Einrichtungsaufwand | Niedrig – im Grunde nur produktiven Tarif wählen, EU-Region einstellen | Sehr hoch – jeder Baustein (Auth, RLS-Äquivalent, Storage-Regeln, Rate-Limits) muss neu entworfen und der gesamte bestehende Supabase-Code umgeschrieben werden | Hoch – Infrastruktur selbst aufsetzen, aber Code/RLS bleibt gleich |
| Monatliche Kosten (Richtwert, s. `docs/COST_ESTIMATE.md`) | Niedrig bis mittel, planbar | Ähnlich oder höher, aber viel schwerer vorherzusagen (viele Einzelposten) | Mittel (Server laufen ständig), plus eigene Zeit |
| Laufender Wartungsaufwand | Sehr niedrig – Supabase kümmert sich um Updates/Patches/Skalierung der Datenbank | Hoch – man verwaltet selbst deutlich mehr Bausteine | Hoch – Datenbank-Updates, Sicherheits-Patches, Monitoring alles in Eigenregie |
| Sicherheitsverantwortung | Großteils bei Supabase (Infrastruktur), Rest wie bisher im eigenen Code (RLS, s. `docs/PRIVACY_SECURITY.md`) | Komplett bei dir/dem Team – jede AWS-Komponente muss selbst korrekt konfiguriert werden | Komplett bei dir/dem Team, plus die Verantwortung für den Supabase-Unterbau selbst |
| Datenschutz (EU-Bezug) | Gut lösbar – Supabase bietet EU-Regionen an | Gut lösbar – AWS bietet EU-Regionen an | Gut lösbar, aber du trägst die Konfiguration allein |
| Skalierbarkeit | Gut für eine bis mehrere Dutzend Praxen, wächst mit höherem Tarif | Theoretisch unbegrenzt, aber der Umbauaufwand steht in keinem Verhältnis zum aktuellen Bedarf | Begrenzt durch die eigene Servergröße, muss man selbst nachjustieren |
| Abhängigkeit von einem Anbieter | Ja, von Supabase | Ja, von AWS (aber verteilter über viele Einzeldienste) | Geringer (Open-Source-Code läuft überall), aber dafür mehr Eigenverantwortung |
| Backup | Von Supabase automatisch angeboten (bezahlter Tarif) | Muss man selbst mit AWS Backup einrichten und pflegen | Muss man komplett selbst einrichten |
| Monitoring | Von Supabase mitgeliefert (Basis), erweiterbar | Muss man selbst mit CloudWatch aufbauen | Muss man komplett selbst aufbauen |
| Eignung für einen ersten Pilotbetrieb (eine Praxis) | **Sehr gut** – schnell startklar, geringes Risiko | Ungeeignet – viel zu viel Aufwand für einen Test | Ungeeignet – Wartungsaufwand steht in keinem Verhältnis |
| Eignung für spätere Produktion (mehrere Praxen) | Gut, solange Supabase mitwächst | Sinnvoll erst bei sehr großem Bedarf oder konkreten AWS-spezifischen Anforderungen | Nur mit eigenem, dediziertem Betriebsteam sinnvoll |

## Empfehlung

1. **Lokale Entwicklung:** bleibt wie heute (lokale Supabase-Instanz über Docker) – hier ändert sich nichts.
2. **Erster Pilot mit einer Praxis:** **Option A.** Supabase-Tarif „Pro" (oder vergleichbar) in einer EU-Region, Next.js-Website auf Vercel oder AWS Amplify, eine Domain. Schnell, überschaubar, mit planbaren Kosten – genau richtig, um mit echten (aber wenigen) Nutzer:innen zu testen, ohne sich in Infrastruktur zu verlieren.
3. **Produktion mit mehreren Praxen:** **weiterhin Option A**, ggf. auf einen höheren Supabase-Tarif wechseln. Ein Wechsel zu Option B (vollständig AWS) lohnt sich nur, wenn ein konkreter Grund dazukommt (z. B. eine vertragliche Vorgabe, alles in einer bestimmten AWS-Organisation zu betreiben, oder ein Bedarf, den Supabase nicht mehr abdeckt) – „vorsorglich" auf AWS umzusteigen würde nur unnötige Komplexität ohne echten Vorteil bedeuten (das widerspricht ausdrücklich deiner eigenen Vorgabe).
4. **Spätere Skalierung:** Supabase skaliert selbst mit steigendem Tarif deutlich weiter, als für PhysioCheck in absehbarer Zeit nötig sein wird. Sollte es doch einmal eng werden, ist Option A jederzeit später noch um einzelne AWS-Bausteine ergänzbar (z. B. nur für Backups oder Analyse), ohne alles auf einmal umbauen zu müssen.

**Option C (Supabase selbst auf AWS hosten) wird für PhysioCheck nicht empfohlen** – der Wartungsaufwand (Datenbank-Patches, Sicherheits-Updates, Monitoring, alles in Eigenregie) steht in keinem Verhältnis zum Nutzen, wenn der verwaltete Supabase-Dienst dieselbe Technik ohne diesen Aufwand anbietet.
