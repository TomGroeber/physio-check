# PhysioCheck – Zugriffsmatrix

> Stand 01.08.2026. Wer darf was sehen/ändern – als Matrix, ergänzend zu `docs/DATA_LOCATION_REGISTER.md` (wo liegt was) und `docs/PLATFORM_ADMIN_GUIDE.md` (Bedienung). ✅ = ja, ❌ = nein, 🔸 = eingeschränkt (siehe Fußnote).

| Datenkategorie | Patient:in (eigene) | Praxismitglied (verbunden) | Ehemalige Praxis | Andere Praxis | Plattform-Admin |
|---|---|---|---|---|---|
| Eigenes Profil | ✅ lesen/ändern | 🔸 lesen (nur eigene Patient:innen) | ❌ | ❌ | ❌ |
| Termine | ✅ lesen | ✅ lesen/schreiben | 🔸 lesen (Historie bleibt) | ❌ | ❌ |
| Übungspläne/-protokolle | ✅ lesen/eigene Durchführung eintragen | ✅ lesen/schreiben | 🔸 lesen (Historie bleibt) | ❌ | ❌ |
| Nachrichten | ✅ eigene Unterhaltung | ✅ **nur solange aktuell verbunden** | ❌ **verliert Zugriff** | ❌ | ❌ |
| Patientenakten (Dateien) | ❌ (Produktentscheidung) | ✅ lesen/schreiben | 🔸 lesen (Historie bleibt) | ❌ | ❌ |
| Interne Kurzprofile | ❌ (für Patient:in unsichtbar) | ✅ lesen/schreiben | 🔸 lesen (Historie bleibt) | ❌ | ❌ |
| Verordnungen/Sitzungskontingente | ✅ lesen | ✅ lesen/schreiben | 🔸 lesen (Historie bleibt) | ❌ | ❌ |
| Praxis-Metadaten (Name, Status, Vertrag) | ❌ | 🔸 nur eigene Praxis | ❌ | ❌ | ✅ |
| Mitarbeiterliste/-rollen | ❌ | 🔸 nur eigene Praxis (Admin-Rolle für Verwaltung) | ❌ | ❌ | ✅ (Zählungen + Verwaltung) |
| Audit-Ereignisse | ❌ | ❌ | ❌ | ❌ | ✅ (nur strukturiert, kein Freitext) |
| Betreiber-Konfiguration | ❌ | ❌ | ❌ | ❌ | ✅ |

**🔸 „Historie bleibt":** entspricht dem realen Praxisalltag – eine Praxis behält ihre eigenen, während der Behandlung entstandenen Unterlagen auch nach Ende der Behandlung (wie eine Papierakte im Aktenschrank), unabhängig davon, ob der Patient/die Patientin später zu einer anderen Praxis wechselt. Bewusste Ausnahme: **Nachrichten** – hier verlangt die Produktentscheidung ausdrücklich sofortigen Zugriffsverlust für die ehemalige Praxis.

## Wichtigste Zeile der Tabelle

**Die letzte Spalte** ist der Kern der Anforderung „Plattform-Admin darf keine medizinischen Daten sehen": in jeder einzelnen Zeile mit Patientenbezug steht ❌. Der Plattform-Admin sieht ausschließlich betriebliche/technische Informationen (Praxisname, Mitarbeiterzahl, Systemzustand, strukturierte Prüfereignisse) – nie Namen, Nachrichten, Notizen, Diagnosen oder Dateien von Patient:innen. Details und Codeprüfung in `docs/ADMIN_DATA_BOUNDARIES.md`.

## Wie das technisch erzwungen wird (nicht nur behauptet)

Jede Zeile dieser Tabelle entspricht einer echten Datenbankregel (Row Level Security), nicht nur einer Oberflächen-Einschränkung. Selbst ein technisch versierter Angriff über die Programmierschnittstelle (nicht nur über die sichtbare Oberfläche) würde an denselben Regeln scheitern – die Datenbank selbst entscheidet, nicht die Website oder App.
