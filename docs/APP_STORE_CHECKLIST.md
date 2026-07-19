# PhysioCheck – App-Store-Vorbereitung (Checkliste)

> Stand 19.07.2026. NICHTS aus dieser Liste wird ohne Toms ausdrückliche Zustimmung eingereicht, registriert oder bezahlt. Die App wird erst nach Klärung der offenen Punkte eingereicht.

## Identität (Vorschläge, noch nicht registriert)

- [ ] iOS Bundle ID: `test.physiocheck.patient` (Platzhalter-Präfix, bis Name/Organisation final sind)
- [ ] Android Application ID: `test.physiocheck.patient`
- [ ] App-Name im Store: „PhysioCheck“ (vorläufig; Namensrechte ungeprüft – offener Punkt)
- [x] Versions-/Buildnummern: `version 0.1.0`, EAS `autoIncrement` im Production-Profil
- [ ] App-Icon und Splashscreen sind **Platzhalter aus dem Expo-Template** – vor Einreichung durch echte Assets ersetzen (`assets/images/`)

## Konten und Infrastruktur (alles offen, kostenpflichtig → nur mit Toms Freigabe)

- [ ] Apple Developer Program (99 €/Jahr) – benötigt für TestFlight und App Store
- [ ] Google Play Console (einmalig 25 $) – benötigt für interne Tests und Play Store
- [ ] Expo-Konto/EAS für Cloud-Builds (`eas.json` liegt bereit: development/preview/production)
- [ ] Push: APNs-Key + FCM-Konfiguration + Expo-Push-Credentials (Konzept in `docs/MOBILE_ARCHITECTURE.md`; ohne Credentials bewusst nicht implementiert)
- [ ] Universal Links (iOS) / App Links (Android): echte Domain mit `apple-app-site-association` und `assetlinks.json`; bis dahin nur `physiocheck://` (Development)

## Berechtigungstexte (bei Einreichung in Info.plist/Manifest prüfen)

- [ ] Fotobibliothek (Profilbild): „PhysioCheck benötigt Zugriff auf Ihre Fotos, um ein Profilbild auszuwählen." (expo-image-picker erzeugt den Eintrag; Text vor Einreichung prüfen)
- [x] Keine Kamera-, Standort-, Mikrofon- oder Kontaktberechtigungen – die App fragt nichts weiter an (Datenminimierung)

## Datenschutz (App Store Privacy + Play Data Safety)

- [ ] Datenschutzerklärung mit öffentlicher URL (PFLICHT in beiden Stores; existiert noch nicht – juristisch prüfen lassen, Basis: `docs/PRIVACY_SECURITY.md`)
- [ ] App Store „App Privacy“: erhoben werden Name, E-Mail, Telefonnummer (optional), Profilbild (optional), Gesundheitsbezug (Übungs-Selbstauskünfte, Schmerzangaben 0–10) – verknüpft mit dem Konto, kein Tracking, keine Werbung, keine Weitergabe an Dritte
- [ ] Google Play „Data Safety“: dieselben Angaben; Übertragung TLS, Löschantrag in der App vorhanden
- [ ] Prüfen, ob die Schmerz-Selbstauskünfte als „Health data" deklariert werden müssen (konservativ: ja)
- [ ] Hosting-/Auftragsverarbeitungskette dokumentieren (Supabase-Instanz: Region und Vertrag offen – aktuell nur lokale Entwicklung, KEIN Produktivsystem)

## Review-Anforderungen

- [ ] Support-URL + Support-E-Mail (existiert noch nicht)
- [ ] Testkonto für die Review (fiktiver Patient mit Demo-Praxis und Code – Ablauf wie `pnpm seed`, aber auf einer Produktions-/Staging-Instanz; NIE echte Patientendaten)
- [x] Kontolöschung in der App (Store-Pflicht bei In-App-Registrierung): auditierter Löschantrag mit Zugangssperre ist implementiert (D-062)
- [ ] **Offene Rechtsfrage Luxemburg:** Aufbewahrungspflichten für physiotherapeutische Behandlungsdaten. Bis zur juristischen Klärung löscht der Antrag bewusst keine Praxisdaten; das ist in der App transparent formuliert. KEINE rechtliche Aussage erfinden.
- [ ] Malware-/Virenscan für Datei-Uploads (bestehender Pilot-Blocker der Plattform, gilt auch mobil)

## Release-Abläufe (dokumentiert, nicht ausgeführt)

- [ ] iOS: `eas build --profile preview --platform ios` → TestFlight interne Tester → Feedbackrunde → `--profile production` → Review
- [ ] Android: `eas build --profile preview --platform android` → Play Console „Interner Test“ → geschlossener Test → Produktion
- [ ] Store-Screenshots (iPhone 6,7"/6,1", Android Phone) – offene Aufgabe, erst mit finalem Design
- [ ] Release-Notes deutsch pflegen

## Technischer Stand (verifiziert am 19.07.2026)

- [x] `eas.json` mit getrennten Profilen, ohne Zugangsdaten
- [x] `expo-doctor` 20/20, Produktions-JS-Bundle baut (`expo export --platform ios`)
- [x] Kein `service_role`-Schlüssel in der App; nur Publishable Key + RLS
- [ ] Nativer iOS-/Android-Build ungetestet (Xcode/Android SDK fehlen auf Toms Mac – echter Umgebungs-Blocker)
