# PhysioCheck – Verzeichnis: wo liegen welche Daten

> Stand 01.08.2026. Übersicht, wo jede Datenkategorie tatsächlich gespeichert wird – Grundlage für Datenschutz-Auskünfte und die Bewertung im `docs/THREAT_MODEL.md`.

| Datenkategorie | Tabelle/Speicherort | Wer kann lesen (RLS) | Besonderheit |
|---|---|---|---|
| Login-Daten (E-Mail, Passwort-Hash) | Supabase Auth (nicht in eigenen Tabellen) | Niemand direkt – nur über Auth-API | Von Supabase verwaltet |
| Profil (Name, Zeitzone) | `profiles` | eigene Person + berechtigte Praxismitglieder | – |
| Praxis-Mitgliedschaft/Rolle | `practice_members` | Praxismitglieder der eigenen Praxis, Plattform-Admin (nur Zählungen/Metadaten) | Einzige Quelle für Rollen (D-006) |
| Patient-Praxis-Verknüpfung | `patient_practice_links` | Patient:in selbst, verbundene Praxis | Bestimmt „aktuell verbunden" |
| Termine | `appointments` | Patient:in selbst, Praxis (auch nach Praxiswechsel, wie `completion_logs`) | s. `docs/RETENTION_AND_DELETION.md` |
| Übungspläne/-protokolle | `exercise_plans`, `exercise_plan_items`, `completion_logs` | Patient:in selbst, Praxis (behält Historie) | Nie rückwirkend verfälschbar (Planversionierung) |
| **Nachrichten** | `conversations`, `messages` | Patient:in selbst, **nur aktuell verbundene** Praxis, **nie Plattform-Admin** | Einzige Tabelle mit Zugriffsverlust der Praxis nach Wechsel |
| **Patientenakten (Dateien)** | `patient_documents` (Metadaten) + Bucket `patient-records` (Dateien) | **nur Praxismitglieder** (Patient:in hat laut Produktentscheidung KEINEN Lesezugriff), Praxis behält Historie wie bei Terminen/Übungen | Malware-Scan seit 01.08.2026 aktiv (zuvor eine Lücke, s. D-124) |
| Profilbilder | Bucket `patient-avatars` | eigene Person, aktuell verbundene Praxis | Signierte Adressen, 5–10 Min. gültig |
| Übungsvideos/-bilder | Bucket `exercise-media` (Praxis-Bibliothek) | Praxismitglieder + Patienten mit zugewiesenem Plan (über `/api/mobile/exercise-media` bzw. Website-Route, nie direkter Storage-Zugriff für Patienten) | Malware-Scan aktivierbar |
| Verordnungen/Sitzungskontingente | `treatment_authorizations` u. Ä. | Patient:in selbst, Praxis | Nie negativ, append-only Anpassungen |
| Interne Kurzprofile | `patient_internal_profiles` | **nur Praxismitglieder**, für Patient:in unsichtbar | Eigene Tabelle ohne Patienten-Policy |
| Betreiber-Konfiguration | `platform_config`, `platform_admins` | nur Plattform-Admin | Keine Client-Policy überhaupt |
| Prüf-/Audit-Ereignisse | `audit_events` | Plattform-Admin (nur strukturierte Ereignistypen, kein Freitext) | s. `docs/ADMIN_DATA_BOUNDARIES.md` |
| Benachrichtigungen | `notifications` | eigene Person | Immer generischer Text, nie Gesundheitsdetails |

## Wo Daten NICHT liegen (bewusst geprüft)

- **Nicht in Server-Logs:** keine `console.*`-Ausgabe mit Gesundheitsdaten irgendwo im Server-Code gefunden.
- **Nicht in URLs:** alle sensiblen Werte laufen über Formulardaten/POST-Bodys, nicht als Adresszeilen-Parameter.
- **Nicht in Push-Benachrichtigungen:** es gibt aktuell ohnehin keine echte Push-Infrastruktur (nur eine In-App-Tabelle `notifications`), deren Texte generisch gehalten sind.
- **Nicht öffentlich auflistbar:** keiner der drei Storage-Buckets ist öffentlich; „Object Listing" ist für alle drei durch RLS auf `storage.objects` gesperrt.

## Backups

Sobald ein bezahlter Supabase-Tarif läuft, enthalten die automatischen Sicherungen sämtliche obigen Tabellen UND die Storage-Buckets (s. `docs/BACKUP_AND_RECOVERY.md`) – es gibt keine „unsichtbare" Kopie der Daten irgendwo außerhalb dieser einen Supabase-Instanz.
