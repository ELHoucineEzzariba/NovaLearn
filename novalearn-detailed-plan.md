# NovaLearn – Detaillierter Plan & Roadmap für Claude Code

Portfolio-taugliche Version der "KI-Lernplattform"-Idee, ersetzt NovaAgent in der Projektliste. Diese Version ist eine **bewusst radikal verkleinerte** Ableitung der vollständigen Produktplanung – nicht deren MVP (das volle MVP dort ist auf 6 Sprints à 2 Wochen ausgelegt), sondern ein in Tagen statt Monaten baubares Projekt, das trotzdem den eigentlichen USP ("prüft aktiv, statt nur zu antworten") sichtbar zeigt.

## 1. Überblick & Ziel

Eine Lernplattform, bei der man Kursmaterial (PDF) hochlädt, die KI daraus automatisch Themen mit nachvollziehbarer Klausurrelevanz extrahiert, man per Chat mit Quellenangabe Fragen zum Material stellen kann, und die KI einen zusätzlich aktiv mit generierten Fragen prüft statt nur zu antworten.

## 2. Bewusst nicht enthalten (im Vergleich zur vollen Produktplanung)

Explizit **nicht** Teil dieser Version, um den Umfang realistisch zu halten:

- Fehlerkategorisierung (Wissenslücke/Verwechslung/Anwendung/Transfer) als eigenes System
- Spaced-Repetition-Scheduler
- Klausurmodus, Feynman-Modus, Interleaving-Modus
- Vision-Analyse für Diagramme/Grafiken auf Folien (nur Text-Extraktion)
- PPTX-Support (nur PDF – PPTX kann später ergänzt werden)
- Wissensgraph mit Abhängigkeiten zwischen Themen
- PDF-Lernbericht-Export
- Mehrere parallele Kurse mit komplexer Verwaltung (ein Kurs reicht für die Demo, Struktur erlaubt aber mehrere)
- Vier getrennte Microservices (Ingestion/RAG/Prüfung/Analytics) aus der Original-Architektur – hier alles als Module in einer Next.js-App, nicht als separate Dienste

## 3. Tech-Stack

- Next.js (App Router), TypeScript, Tailwind CSS
- Firebase: Firestore für alle Daten, Storage für hochgeladene PDFs, Anonymous Auth für Daten-Scoping (siehe Abschnitt 9) – dasselbe Firebase-Projekt-Setup wie bei NovaChat/NovaFlow, kein zusätzlicher Anbieter
- **Gemini (aktuelles Flash-Modell, z. B. über Google AI Studio API)** für Themenextraktion, Relevanz-Begründung, Chat-Antworten, Fragen-Generierung, Antwortbewertung – kostenloser Free-Tier, kein Zahlungsmittel nötig
- **Gemini Embedding** für die Embeddings – selbes Google-Konto/API-Key wie oben, kein zweiter Anbieter nötig
- Vektorsuche: **keine dedizierte Vektor-DB.** Bei Portfolio-Größenordnung (ein Kurs = wenige hundert Chunks) reicht In-Memory-Cosine-Similarity direkt in der Next.js-API-Route – Embeddings liegen einfach als Zahlen-Array-Feld im Firestore-Dokument
- `pdf-parse` oder vergleichbare Library für Text-Extraktion aus PDF

**Warum Firebase statt Supabase/pgvector:** Supabase pausiert Free-Tier-Projekte nach 7 Tagen ohne API-Traffic – ein Portfolio-Demo, das ein Recruiter erst Wochen nach der Bewerbung anklickt, würde dann einen Fehler statt der App zeigen. Firebase Spark (Free) hat keine solche Inaktivitäts-Pause, nur tägliche Kontingente. Zusätzlicher Vorteil: ein Firebase-Projekt für alle drei Nova-Tools statt einem weiteren Anbieter-Account.

**Warum Gemini statt Claude/OpenAI:** Gemini bietet einen echten, dauerhaften Free-Tier für Flash-Modelle (inkl. Embeddings), ohne Zahlungsmittel und ohne Ablauf – im Gegensatz zu Anthropic/OpenAI, wo laufende Nutzung bezahlt werden muss. Trade-off, den man kennen sollte: nur Flash/Flash-Lite sind kostenlos (Pro-Modelle nicht mehr), Rate-Limits liegen bei ca. 5–15 Anfragen/Minute, und Google darf Free-Tier-Prompts standardmäßig zur Produktverbesserung nutzen (Paid-Tier nicht) – für eine Demo mit Testmaterial unkritisch, für eigene sensible Unterlagen später ggf. relevant.

## 4. Datenmodell (Firestore)

```
courses/{courseId}
  - name: string
  - createdAt: timestamp
  - ownerId: string                    // anonyme Firebase-uid, siehe Abschnitt 9

courses/{courseId}/sources/{sourceId}
  - fileName: string
  - storagePath: string
  - type: "folie" | "skript" | "uebung" | "altklausur"
  - uploadedAt: timestamp

courses/{courseId}/chunks/{chunkId}
  - sourceId: string
  - text: string
  - embedding: number[]                // z.B. 1536 Werte als Array-Feld
  - pageRef: string | null

courses/{courseId}/topics/{topicId}
  - title: string
  - description: string
  - relevanceScore: number
  - relevanceReasoning: string
  - relevanceSignals: string[]         // z.B. ["wiederholung_material", "explizite_markierung", "strukturelle_position"]
  - chunkIds: string[]
  - progressStatus: "nicht_begonnen" | "unsicher" | "verstanden"
  - progressUpdatedAt: timestamp

courses/{courseId}/topics/{topicId}/questions/{questionId}
  - questionText: string
  - questionType: "definition" | "anwendung" | "transfer"

courses/{courseId}/topics/{topicId}/questions/{questionId}/attempts/{attemptId}
  - userAnswer: string
  - aiVerdict: "richtig" | "teilweise" | "falsch"
  - aiFeedback: string
  - createdAt: timestamp
```

`progressStatus` bewusst als Feld direkt auf dem Topic-Dokument statt eigener Collection – für die vereinfachte Fortschrittslogik aus Abschnitt 5/Schritt 5 reicht das, kein voller Event-Verlauf nötig.

## 5. KI-Pipeline (scoped)

**Schritt 1 – Ingestion:** PDF-Text extrahieren, in sinnvolle Abschnitte chunken (nicht stur nach Zeichenzahl), jeden Chunk embedden, in `chunks` speichern.

**Schritt 2 – Themenextraktion + Relevanz:** ein Gemini-Aufruf pro Kurs (bei sehr langen Dokumenten ggf. in Batches mit Zusammenführung), der alle Chunk-Texte erhält und strukturiertes JSON zurückgibt: Liste von Themen mit Kurzbeschreibung, zugehörigen Chunk-Referenzen, Relevanz-Score (0–100) und einer kurzen, für den Nutzer lesbaren Begründung basierend auf: Wiederholung im Material, explizite Marker ("wichtig", "klausurrelevant"), strukturelle Position (eigene Kapitelüberschrift vs. Randnotiz). Kein Altklausur-Abgleich in dieser Version (dafür bräuchte man ohnehin vorhandene Altklausuren, die optional sind).

**Schritt 3 – RAG-Chat:** Nutzerfrage embedden, alle Chunk-Dokumente des Kurses aus Firestore laden (bei Portfolio-Größenordnung unproblematisch, ein Kurs bleibt im niedrigen Hundert-Chunk-Bereich), Cosine-Similarity zwischen Frage-Embedding und jedem Chunk-Embedding **in der API-Route selbst** berechnen, Top-k ähnlichste Chunks als Kontext, Gemini mit Anweisung zur Quellenangabe (z. B. "laut Folie 12") antworten lassen.

**Schritt 4 – Aktives Prüfen (minimal):** pro Thema auf Anfrage 3 Fragen generieren (je eine Definition/Anwendung/Transfer-Frage) aus den zugehörigen Chunks. Freitext-Antwort des Nutzers wird von Gemini bewertet: Rückgabe `richtig`/`teilweise`/`falsch` + kurzes, konkretes Feedback. Kein separates Fehlerkategorie-System – das Feedback selbst benennt das Problem in Prosa.

**Schritt 5 – Fortschritt:** nach jedem Attempt wird `topic_progress.status` einfach aktualisiert (z. B. "verstanden" nach 2 aufeinanderfolgenden `richtig`-Antworten zum Thema, "unsicher" nach einem `falsch`/`teilweise`). Kein voller Verlaufs-Chart in dieser Version.

## 6. Feature-Liste (verbindlich)

- PDF-Upload (mehrere Dateien pro Kurs), Fortschrittsanzeige während Verarbeitung
- Themenliste im Kurs-Dashboard mit Relevanz-Badge (hoch/mittel/niedrig aus Score abgeleitet) und aufklappbarer Begründung
- Chat-Ansicht: freie Fragen zum Kursmaterial, Antworten mit Quellenangabe (welche Datei/Seite)
- Übungsansicht: pro Thema Fragen generieren lassen, Freitext-Antwort eingeben, sofortiges KI-Feedback mit Verdict
- Fortschritts-Ampel pro Thema im Dashboard (nicht begonnen / unsicher / verstanden)
- Gesamtfortschritt des Kurses als einfacher Prozentwert (Anteil "verstanden"-Themen)

## 7. Komponenten-Spezifikation

- **`app/courses/page.tsx`** – Kursliste, "Neuer Kurs"-Button
- **`app/courses/[id]/page.tsx`** – Dashboard: Themenliste mit Relevanz-Badge + Fortschritts-Ampel, Upload-Bereich
- **`app/courses/[id]/chat/page.tsx`** – Chat-Interface mit Quellenverweisen pro Antwort
- **`app/courses/[id]/topics/[topicId]/page.tsx`** – Übungsansicht: Frage anzeigen, Antwortfeld, Feedback nach Absenden
- **`components/upload/UploadZone.tsx`** – Drag-&-Drop-Upload mit Verarbeitungsstatus (hochladen → extrahieren → chunken → embedden, jeder Schritt sichtbar)
- **`components/topics/TopicCard.tsx`** – Titel, Relevanz-Badge, Ampel-Status, aufklappbare Begründung
- **`components/chat/ChatWindow.tsx`**, **`ChatMessage.tsx`** (mit Quellenangabe-Chip)
- **`components/practice/QuestionCard.tsx`**, **`AnswerFeedback.tsx`**

## 8. Ordnerstruktur

```
src/
├── app/
│   ├── courses/page.tsx
│   ├── courses/[id]/page.tsx
│   ├── courses/[id]/chat/page.tsx
│   ├── courses/[id]/topics/[topicId]/page.tsx
│   └── api/
│       ├── courses/[id]/upload/route.ts        # Extraktion, Chunking, Embedding
│       ├── courses/[id]/topics/generate/route.ts  # Themenextraktion + Relevanz
│       ├── courses/[id]/chat/route.ts           # RAG-Chat
│       └── topics/[topicId]/practice/route.ts   # Fragen generieren + Antwort bewerten
├── lib/
│   ├── ingestion/{extractText.ts, chunk.ts, embed.ts}
│   ├── rag/{search.ts, buildContext.ts}
│   ├── practice/{generateQuestions.ts, evaluateAnswer.ts}
│   ├── topics/extractTopics.ts
│   └── firebase/client.ts
├── components/{upload, topics, chat, practice}/
└── types/{course.ts, topic.ts, question.ts}
```

## 9. Zugriffsmodell

- Kein Login/Register-UI – Firebase Anonymous Auth (`signInAnonymously`) im Hintergrund beim ersten Laden, `ownerId` auf allen `courses`-Dokumenten scoped die Daten pro Besucher, Firestore-Security-Rules erlauben Lesen/Schreiben nur bei `ownerId === request.auth.uid`, damit sich Demo-Besucher nicht gegenseitig Kurse überschreiben.
- Ein vorbefüllter Beispiel-Kurs (mit Demo-PDF, bereits verarbeiteten Themen) global lesbar aber nicht editierbar, damit ein Besucher sofort etwas Fertiges sieht, ohne selbst erst etwas hochzuladen.

## 10. Setup & Environment

- Pakete: `next react react-dom typescript tailwindcss firebase pdf-parse zod`
- Gemini-SDK (`@google/generative-ai` oder aktuelles offizielles Google-AI-SDK, im Zweifel bei Claude Code aktuellen Paketnamen auf ai.google.dev prüfen lassen)
- `.env.local`: `NEXT_PUBLIC_FIREBASE_*`-Config-Variablen (gleiches Firebase-Projekt wie NovaChat/NovaFlow oder ein separates Projekt, je nachdem was du willst), `GEMINI_API_KEY` (serverseitig, aus Google AI Studio)

## 11. Roadmap (mit Definition of Done je Phase)

**Phase 0 – Setup**
Next.js/TS/Tailwind-Grundgerüst, Firebase-Projekt mit Firestore/Storage/Anonymous Auth aktiviert, Collections-Struktur aus Abschnitt 4 als Konvention festgelegt (Firestore braucht kein Schema im Voraus, aber die Struktur sollte dokumentiert eingehalten werden).
*Fertig wenn:* App verbindet sich erfolgreich mit Firebase, ein Test-Dokument lässt sich schreiben/lesen.

**Phase 1 – Ingestion**
PDF-Upload, Text-Extraktion, Chunking, Embedding, Speicherung in `chunks`.
*Fertig wenn:* ein hochgeladenes PDF erzeugt nachweisbar mehrere sinnvoll geschnittene Chunks mit Embeddings in der Datenbank.

**Phase 2 – Themenextraktion & Relevanz**
Gemini-Aufruf aus Abschnitt 5/Schritt 2, Ergebnis in den `topics`-Dokumenten speichern, Dashboard zeigt Themenliste mit Relevanz-Badge und Begründung.
*Fertig wenn:* nach Upload eines echten Foliensatzes erscheint eine plausible, nachvollziehbar begründete Themenliste – keine generischen/leeren Begründungen.

**Phase 3 – RAG-Chat**
Vektorsuche + Chat-Endpoint + UI mit Quellenangabe.
*Fertig wenn:* eine Frage zum hochgeladenen Material wird korrekt beantwortet und die Antwort verweist auf die richtige Quelle/Seite.

**Phase 4 – Aktives Prüfen (minimal)**
Fragen-Generator + Bewertungs-Endpoint + Übungsansicht.
*Fertig wenn:* zu einem Thema lassen sich 3 unterschiedliche Fragetypen generieren, eine Freitext-Antwort bekommt ein plausibles, konkretes KI-Feedback (nicht nur "richtig"/"falsch" ohne Begründung).

**Phase 5 – Fortschritt**
`topic_progress`-Update-Logik nach jedem Attempt, Ampel-Anzeige im Dashboard, Gesamtfortschritt-Prozentwert.
*Fertig wenn:* nach ein paar Übungsrunden verändert sich die Ampel pro Thema sichtbar und nachvollziehbar.

**Phase 6 – Design-Pass**
Farb-/Layout-Tokens konsistent mit dem übrigen Portfolio (heller, minimalistischer Stil laut Original-Konzept ist hier bewusst ein Kontrast zu den dunklen Nova-Tools – als Signal, dass du beide Richtungen gestalten kannst).
*Fertig wenn:* alle Ansichten nutzen ein einheitliches, durchdachtes Farb-/Typografie-System statt Tailwind-Standardwerten.

## 12. Nicht-funktionale Anforderungen

- Ingestion (Upload → Chunking → Embedding) läuft asynchron mit sichtbarem Fortschritt, blockiert nicht das UI.
- API-Keys ausschließlich serverseitig.
- Sichtbarer Fehlerzustand, wenn PDF-Extraktion fehlschlägt (z. B. gescanntes Bild-PDF ohne Text-Layer) – kein stiller Absturz.
- Kosten im Blick behalten: Themenextraktion ist ein teurer Aufruf (großer Kontext) – nicht bei jedem Seitenaufruf neu berechnen, nur bei explizitem Trigger nach Upload.
- Gemini-Free-Tier-Rate-Limits einplanen (ca. 5–15 Anfragen/Minute): bei parallelen Anfragen (z. B. mehrere Chunks gleichzeitig embedden) eine einfache Warteschlange/Drosselung statt alles parallel abzufeuern, sonst brechen Requests mit 429-Fehlern ab.
- Sichtbarer Hinweis (z. B. kleine Fußnote im Upload-Bereich), dass die Demo mit einem kostenlosen KI-Tier läuft und Beispielmaterial statt echter sensibler Unterlagen genutzt werden sollte – deckt sich mit dem Datenschutz-Prinzip aus der ursprünglichen Produktplanung.
