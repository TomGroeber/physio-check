# PhysioCheck – App-Store-Vorbereitung (Checkliste)

> Stand 21.07.2026. NICHTS aus dieser Liste wird ohne Toms ausdrückliche Zustimmung eingereicht, registriert oder bezahlt. Die App wird erst nach Klärung der offenen Punkte eingereicht.

## Identität (Vorschläge, noch nicht registriert)

- [ ] iOS Bundle ID: `test.physiocheck.patient` (Platzhalter-Präfix, bis Name/Organisation final sind)
- [ ] Android Application ID: `test.physiocheck.patient`
- [ ] App-Name im Store: „PhysioCheck“ (vorläufig; Namensrechte ungeprüft – offener Punkt)
- [x] Versions-/Buildnummern: `version 0.1.0`, EAS `autoIncrement` im Production-Profil
- [x] App-Icon und Splashscreen sind aus der PhysioCheck-Marke gerendert (`logo.svg`, siehe D-073) – kein Expo-Template-Icon mehr

## Konten und Infrastruktur (alles offen, kostenpflichtig → nur mit Toms Freigabe)

- [ ] Apple Developer Program (99 €/Jahr) – benötigt für TestFlight und App Store
- [ ] Google Play Console (einmalig 25 $) – benötigt für interne Tests und Play Store
- [ ] Expo-Konto/EAS für Cloud-Builds (`eas.json` liegt bereit: development/preview/production)
- [ ] Push: APNs-Key + FCM-Konfiguration + Expo-Push-Credentials (Konzept in `docs/MOBILE_ARCHITECTURE.md`; ohne Credentials bewusst nicht implementiert)
- [ ] Universal Links (iOS) / App Links (Android): echte Domain mit `apple-app-site-association` und `assetlinks.json`; bis dahin nur `physiocheck://` (Development)

## Berechtigungstexte (bei Einreichung in Info.plist/Manifest prüfen)

- [x] Fotobibliothek (Profilbild): „PhysioCheck benötigt Zugriff auf Ihre Fotos, um ein Profilbild auszuwählen." – explizit über das `expo-image-picker`-Plugin gesetzt und per `expo config --type introspect` verifiziert (D-074)
- [x] Keine Kamera-, Standort-, Mikrofon- oder Kontaktberechtigungen – Kamera/Mikrofon sind im Plugin explizit `false` gesetzt, nicht nur unkonfiguriert (Datenminimierung)

## Datenschutz (App Store Privacy + Play Data Safety)

- [ ] Datenschutzerklärung mit öffentlicher URL (PFLICHT in beiden Stores; existiert noch nicht – juristisch prüfen lassen, Basis: `docs/PRIVACY_SECURITY.md`)
- [x] App Store „App Privacy“ / Google Play „Data Safety“: vollständige Mapping-Tabelle pro Datentyp in `docs/PRIVACY_SECURITY.md` Abschnitt 1a (erhoben/verknüpft/Tracking) – gegen den Code geprüft: kein Tracking, keine Werbung, keine Analytics-SDKs
- [x] Schmerz-Selbstauskünfte als „Health & Fitness"/„Health data" deklariert (unabhängig von HealthKit, das nicht genutzt wird) – siehe Abschnitt 1a
- [ ] Hosting-/Auftragsverarbeitungskette dokumentieren (Supabase-Instanz: Region und Vertrag offen – aktuell nur lokale Entwicklung, KEIN Produktivsystem)

## Review-Anforderungen

- [ ] Support-URL + Support-E-Mail (existiert noch nicht)
- [ ] Testkonto für die Review (fiktiver Patient mit Demo-Praxis und Code – Ablauf wie `pnpm seed`, aber auf einer Produktions-/Staging-Instanz; NIE echte Patientendaten)
- [x] Kontolöschung in der App (Store-Pflicht bei In-App-Registrierung): auditierter Löschantrag mit Zugangssperre ist implementiert (D-062)
- [ ] **Offene Rechtsfrage Luxemburg:** Aufbewahrungspflichten für physiotherapeutische Behandlungsdaten. Bis zur juristischen Klärung löscht der Antrag bewusst keine Praxisdaten; das ist in der App transparent formuliert. KEINE rechtliche Aussage erfinden.
- [x] Malware-/Virenscan für Datei-Uploads implementiert (ClamAV, fail-closed, hinter `MALWARE_SCAN_ENABLED`) – gilt für Web und mobil, da beide dieselben Server-Services nutzen; produktionsreife Dauerlösung (`clamd`/Cloud-AV) noch an Hosting-Wahl gebunden

## Store-Texte (Entwurf, Deutsch – vor Einreichung von Tom gegenlesen lassen)

Wichtiger Rahmen für die Formulierung: PhysioCheck ist **kein** eigenständiges Fitness-/Gesundheits-Produkt, sondern nur mit einem Einladungscode einer bereits angebundenen Physiotherapiepraxis nutzbar (siehe Produktvision, `docs/PRODUCT_SPEC.md`). Texte dürfen deshalb nie „universelle Trainings-App“ suggerieren, und dokumentierte Übungen sind laut Sprachregel (CLAUDE.md) immer **Selbstauskunft**, nie „verifiziert“/„nachgewiesen“.

- **App-Name:** PhysioCheck
- **Untertitel (iOS, ≤ 30 Zeichen):** „Ihr Übungsplan Ihrer Praxis“
- **Kurzbeschreibung (Google Play, ≤ 80 Zeichen):** „Heimübungen, Termine und Selbstauskunft – verbunden mit Ihrer Physiopraxis“
- **Beschreibung (Entwurf, beide Stores):**

  > PhysioCheck verbindet Sie mit Ihrer Physiotherapiepraxis. Nach einer Behandlung erhalten Sie von Ihrer Praxis einen Verbindungscode – damit sehen Sie Ihren persönlichen Heimübungsplan mit kurzen Videos, Ihre kommenden Termine und können Ihre Behandlungseinheiten einsehen.
  >
  > So funktioniert es:
  > • Übungsvideos mit klaren Vorgaben (Wiederholungen, Sätze, Häufigkeit)
  > • Durchführung selbst dokumentieren – als einfache Selbstauskunft, keine automatische Kontrolle
  > • Kommende und vergangene Termine im Blick, Absagen direkt anfragen
  > • Große Schrift, große Bedienflächen, einfache deutsche Sprache
  >
  > PhysioCheck ersetzt keine ärztliche oder therapeutische Beurteilung, stellt keine Diagnosen und trifft keine automatischen Therapieentscheidungen. Ohne einen gültigen Verbindungscode Ihrer Praxis lässt sich die App nicht sinnvoll nutzen.

- **Schlüsselwörter (iOS, ≤ 100 Zeichen, kommagetrennt):** `physiotherapie,heimübungen,übungsplan,reha,krankengymnastik,termine,patient`
- **Kategorie:** Gesundheit und Fitness (bewusst **nicht** „Medizin"/„Medical" – die App trifft keine Diagnosen und vermeidet die strengere Zusatzprüfung dieser Kategorie bei beiden Stores)
- **Alterseinstufung:** Apple 4+ / Google „Everyone" (keine anstößigen Inhalte; Gesundheitsbezug ist Selbstauskunft, keine medizinische Beratung – im Fragebogen ehrlich als „kein Nutzergenerierter Kontakt mit Fremden", „keine Diagnosen" beantworten)
- **Reviewhinweis für Apple/Google (Notizfeld):** „Diese App ist nur mit einem gültigen Verbindungscode einer Physiotherapiepraxis nutzbar. Bitte nutzen Sie das bereitgestellte Testkonto (siehe Zeile „Testkonto für die Review" oben), da eine freie Registrierung ohne Code nur den Verbindungsbereich zeigt."

## Release-Abläufe (dokumentiert, nicht ausgeführt)

- [ ] iOS: `eas build --profile preview --platform ios` → TestFlight interne Tester → Feedbackrunde → `--profile production` → Review
- [ ] Android: `eas build --profile preview --platform android` → Play Console „Interner Test“ → geschlossener Test → Produktion
- [ ] Store-Screenshots (iPhone 6,7"/6,1", Android Phone) – offene Aufgabe, erst mit finalem Design
- [ ] Release-Notes deutsch pflegen

## Technischer Stand (zuletzt verifiziert am 20.07.2026)

- [x] `eas.json` mit getrennten Profilen, ohne Zugangsdaten
- [x] `expo-doctor` 20/20, Produktions-JS-Bundle baut (`expo export --platform ios`)
- [x] Kein `service_role`-Schlüssel in der App; nur Publishable Key + RLS
- [x] iOS-Simulatorlauf erfolgreich (iPhone 17 Pro, iOS 26.5, Xcode 26.6): Anmeldung mit Demo-Patientenkonto funktioniert, UI-Parität zur Web-Referenz visuell verifiziert (`docs/TEST_MATRIX.md`)
- [ ] Echter EAS-Build (Preview/Production) noch nie ausgeführt – benötigt EAS-Konto (Toms Freigabe erforderlich)
- [ ] Android-Emulator-Lauf ungetestet (Android Studio/SDK fehlt auf Toms Mac – echter Umgebungs-Blocker)
- [ ] Vollständiger Tap-Durchlauf der Formulare im Simulator (Telefonnummer, Absage, Bildauswahl) noch offen – macOS-Bedienungshilfen-Berechtigung fehlt für Automatisierung (nur Formulareingabe betroffen, kein Codeproblem)
