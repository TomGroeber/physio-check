# PhysioCheck – Betreiberportal (für Tom, nicht-technisch)

Dieses Dokument erklärt das neue Betreiber-Admin-Interface unter `/admin`: wofür es gedacht ist, was dort einstellbar ist – und was **niemals** über eine Oberfläche einstellbar sein darf.

## Wofür ist das Portal?

Als Betreiber von PhysioCheck kannst du dort:

- neue Physiotherapiepraxen anlegen (Testkunden oder echte Kunden) und deren ersten Praxisadmin per Link einladen,
- Praxen aktivieren, in eine Testphase setzen, sperren oder archivieren (nichts wird dabei gelöscht),
- weitere Mitarbeitende für eine Praxis einladen (falls die Praxis das nicht selbst erledigen kann),
- globale Produkteinstellungen ändern (Name/Support-Kontakt/Wartungsbanner/Funktionsschalter),
- eine schlanke Übersicht je Praxis sehen (wie viele Mitarbeitende, wie viele Patient:innen, allgemeine Zahlen) – **keine** medizinischen Daten einzelner Patient:innen.

## Wer darf das Portal benutzen?

Nur Konten, die als „Plattform-Admin" freigeschaltet sind. Das ist etwas völlig anderes als eine Praxisrolle (Therapeut:in/Admin einer Praxis) – die beiden Dinge sind technisch komplett getrennt. Niemand kann sich selbst zum Plattform-Admin machen, auch nicht über Umwege in der App. Freischalten/Entziehen geht ausschließlich über ein Kommandozeilen-Skript, das du (oder jemand mit direktem Serverzugriff) selbst ausführst:

```bash
pnpm platform-admin grant --email tom@example.com --yes
pnpm platform-admin revoke --email jemand@example.com --yes
pnpm platform-admin list
```

Das Skript verlangt absichtlich das `--yes`-Flag, damit niemand aus Versehen jemanden zum Betreiber macht.

## Was ist global einstellbar (gilt für alle Praxen)?

Über „Plattform-Konfiguration" im Portal:

- Produktname/Branding-Texte, Support-E-Mail/-Link
- Datenschutz-/Impressum-Link
- Wartungsbanner (Text + An/Aus)
- Standard-Zeitzone/-Sprache für neu angelegte Praxen
- Funktionsschalter (Feature Flags) für Praxen

## Was ist je Praxis einstellbar?

Über „Praxis-Details" im Portal bzw. für die Praxis selbst über „Einstellungen":

- Stammdaten (Name, Adresse, Telefon, Zeitzone, Support-Kontakt)
- Status (Testphase/aktiv/gesperrt/archiviert) inklusive interner, nicht-medizinischer Notiz – nur im Portal, nicht durch die Praxis selbst
- Betriebliche Einstellungen: Standard-Termindauer, Stornofrist + -text, Warnschwelle für wenige Behandlungseinheiten, Akzentfarbe, patientenseitiger Sicherheitshinweistext
- Mitarbeitende: einladen, Rolle setzen, aktiv/inaktiv setzen

## Was ist NIEMALS über eine Oberfläche einstellbar?

Das ist die wichtigste Grenze in diesem Dokument – sie schützt vor Sicherheitslücken:

- Supabase-/Service-Role-Schlüssel, SMTP-Passwörter, Push-Zertifikate (APNs/FCM) – diese liegen ausschließlich in Umgebungsvariablen auf dem Server, nie in einer Datenbanktabelle, die eine Oberfläche beschreiben könnte.
- Row-Level-Security-Richtlinien und das Datenbankschema selbst – Änderungen daran sind Code-Änderungen (Migrationen), keine Konfiguration.
- Storage-Zugriffsrichtlinien (wer welche Dateien sehen darf).
- Native App-Kennungen (Bundle-ID/Package-Name) und Signierungszertifikate.
- Rechtsverbindliche Texte (Datenschutzerklärung, Impressum, AGB) – diese benötigen eine juristische Prüfung durch eine zuständige Person, bevor sie als „final" gelten; das Portal kann solche Texte höchstens als erkennbaren Entwurf verwalten, nie als verbindlich veröffentlicht ausgeben.

Kurz gesagt: Alles, was bei falscher Bedienung eine Sicherheitslücke, einen Datenschutzverstoß oder eine rechtliche Fehlaussage erzeugen könnte, bleibt bewusst Code statt Oberfläche.

## Was das Portal ausdrücklich NICHT kann

- Medizinische Patientendaten lesen (Übungspläne, Termine, Selbstauskünfte, Dokumente, Verordnungen) – das Portal zeigt nur datensparsame Verwaltungszahlen.
- Sich als eine andere Person anmelden („Impersonation") – das gibt es bewusst nicht. Sollte später ein Support-Zugriff nötig werden, muss das ein eigenes, offen dokumentiertes „Break-Glass"-Konzept werden, nie eine stillschweigende Funktion.
- Praxen oder deren Historie endgültig löschen – Sperren/Archivieren verstecken nur, sie löschen nicht.

## Verwandte Dokumente

- `docs/PRIVACY_SECURITY.md` – Sicherheits- und Datenschutzkonzept insgesamt
- `docs/DATA_MODEL.md` – Tabellenübersicht inkl. `platform_admins`, `staff_invites`, `platform_config`
- `DECISIONS.md` – Begründungen der Architekturentscheidungen (Suche nach „platform_admin"/„Betreiber")
