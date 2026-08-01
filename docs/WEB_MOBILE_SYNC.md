# PhysioCheck – Warum Website und App zusammenpassen

> Stand 01.08.2026. Für Tom: verständlich erklärt, warum Website und native App dieselben Daten zeigen und wie das technisch funktioniert. Für die technischen Details s. `docs/DATA_FLOW.md` und `docs/API_ARCHITECTURE.md`.

## Die kurze Antwort

Website und App sind zwei verschiedene „Fenster" zur **selben** Datenbank. Es gibt nicht zwei getrennte Datentöpfe, die irgendwie abgeglichen werden müssen – beide fragen live bei derselben Supabase-Instanz nach. Wenn eine Physiotherapeutin auf der Website einen Termin einträgt, steht er sofort in derselben Datenbank, aus der auch die App liest. Es ist kein „Synchronisieren" im Sinne von zwei Kopien, die sich angleichen müssen, sondern eine gemeinsame Quelle.

## Warum können sie dieselbe Datenbank nutzen?

Weil beide für dieselben Nutzerkonten und Praxen gebaut sind und dieselben Zugriffsregeln (Row Level Security) in der Datenbank gelten – unabhängig davon, ob die Anfrage von der Website oder der App kommt. Die Datenbank selbst entscheidet „darf diese Person das sehen", nicht die Website oder die App. Das ist ein wichtiger Sicherheitsvorteil: Selbst wenn morgen eine dritte Anwendung dazukäme (z. B. eine Android-Version oder ein Praxis-Desktop-Programm), würden dieselben Regeln automatisch gelten, ohne dass man sie an drei Stellen neu programmieren müsste.

## Was passiert, wenn sich etwas ändert?

**Termine, Übungspläne, Patientendaten:** Beim nächsten Öffnen der jeweiligen Seite/des jeweiligen Bildschirms wird frisch nachgefragt. Es gibt keine „veraltete Kopie", die erst nach einer Wartezeit aktualisiert wird – jede Seite lädt ihre Daten neu, wenn sie geöffnet wird.

**Nachrichten:** Hier gibt es noch keine „Sofort-Push"-Technik (echtes Realtime). Stattdessen fragt die Website alle 8 Sekunden nach, solange man die Seite offen hat, und die App fragt nach, sobald man sie öffnet oder wieder in den Vordergrund holt. Für ein Nachrichtensystem, das ausdrücklich nicht für Notfälle gedacht ist, ist das ein vernünftiger Kompromiss – niemand muss Minuten warten, aber es ist auch keine Chat-App mit Tippanzeige in Echtzeit. Eine echte Sofort-Technik wäre später nachrüstbar, ist aber ein eigenes, klar abgrenzbares Vorhaben.

## Was passiert, wenn ein Gerät offline ist?

Ehrlich gesagt: aktuell nichts Besonderes. Ist keine Verbindung da, bekommt die Person eine Fehlermeldung statt einer erfolgreichen Aktion – es wird nichts nur „lokal" gespeichert und später heimlich nachgereicht. Das heißt: kein Datenverlust und keine Überraschungen, aber auch kein Komfort für Zugfahrten ohne Netz. Für eine App, die überwiegend zuhause mit Übungen genutzt wird, ist das vertretbar; es steht aber offen als möglicher späterer Ausbauschritt (Phase außerhalb dieses Auftrags).

## Wie werden Widersprüche verhindert (z. B. Doppelbuchung)?

Die Datenbank selbst wacht darüber, nicht die Website oder App einzeln. Zwei Beispiele:

- Zwei Personen versuchen gleichzeitig, denselben Termin-Zeitraum bei derselben behandelnden Person zu buchen → die Datenbank lässt nur den ersten zu und lehnt den zweiten mit einer klaren Meldung ab.
- Jemand tippt hastig zweimal auf „Übung erledigt" → die Datenbank erkennt, dass für diesen Tag/diese Übung bereits ein Eintrag läuft, und verhindert einen doppelten.

Das funktioniert unabhängig davon, ob die Anfragen von der Website, der App oder theoretisch von zehn Geräten gleichzeitig kommen – die Absicherung sitzt an der richtigen Stelle (in der Datenbank), nicht doppelt und potenziell inkonsistent in jeder App einzeln nachgebaut.

## Was bedeutet das für dich als Betreiber?

- Du musst dir **keine Sorgen machen**, dass Website und App „auseinanderlaufen" – sie können es strukturell nicht, weil es nur eine Datenquelle gibt.
- Wenn du später eine Android-App oder eine weitere Oberfläche hinzufügst, gelten dieselben Sicherheitsregeln automatisch mit.
- Die einzige bewusste Ausnahme sind Nachrichten (Nachfragen statt Sofort-Push) und fehlender Offline-Komfort – beides dokumentierte, nachvollziehbare Kompromisse, keine Fehler.
