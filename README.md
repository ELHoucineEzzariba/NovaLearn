# NovaLearn – Projekt-Assets & UI-Komponenten

Basiert auf `novalearn-detailed-plan.md` und dem bereits vorhandenen Logo
(`c92fe1e0-....png`) im NovaLearn-Ordner. Zwei Teile: (1) Favicons/App-Icons/OG-Bild aus
eurem bestehenden Logo extrahiert, (2) ein Lucide-Icon-System für die im Plan
spezifizierten Datentypen (Relevanz, Fortschritts-Ampel, Fragetypen, KI-Bewertung).


## Tests & CI

```bash
npm test   # Vitest: Chunking, RAG-Retrieval, Quellenangaben, Gemini-Warteschlange
```

Getestet wird die Logik, auf der die Antworten des Lern-Chats beruhen: wie PDFs in Abschnitte zerlegt werden (`src/lib/ingestion/chunk.ts`), wie die passendsten Abschnitte gefunden werden (`src/lib/rag/search.ts`), dass Quellenangaben nur aus tatsächlich verwendeten Abschnitten entstehen (`src/lib/rag/buildContext.ts`) und dass Gemini-Aufrufe bei Rate-Limits sauber wiederholt werden (`src/lib/gemini/queue.ts`). GitHub Actions führt Typecheck und Tests bei jedem Push aus.

## Teil 1 – Icons & Bilder (aus eurem bestehenden Logo)

Das Logo lag bisher nur als ein zusammengesetztes Referenzblatt vor (Hero-Motiv +
4 Beispiel-Varianten auf dunklem Grund) – kein direkt einsetzbares Favicon/App-Icon-Set.
Ich habe das Icon per Chroma-Key freigestellt (dunkler Hintergrund entfernt, sauberer
Alpha-Kanal, Rauschartefakte bereinigt) und daraus alle gängigen Web-Größen erzeugt:

```
public/
├── icons/
│   ├── favicon.ico              Multi-Size (16/32/48px), transparenter Hintergrund
│   ├── favicon-16x16.png
│   ├── favicon-32x32.png
│   ├── favicon-48x48.png
│   ├── apple-touch-icon.png     180×180, auf weißem Rounded-Square (matcht euer helles Theme)
│   ├── icon-192.png / icon-512.png   PWA-Icons, weißer Rounded-Square-Hintergrund
│   ├── icon-1024.png            Master-Größe
│   ├── maskable-icon-192.png / maskable-icon-512.png   Android Adaptive Icon (Safe-Zone)
├── images/
│   ├── brand/
│   │   ├── logo-mark-transparent.png     freigestelltes Icon, 1024px, transparent
│   │   └── logo-mark-light-rounded.png   Icon auf weißem Rounded-Square, 1024px
│   └── og/
│       └── og-image.png         1200×630 Open-Graph-Bild, HELLES Theme (siehe unten)
└── site.webmanifest
```

**Warum transparent fürs Favicon, aber weißer Hintergrund fürs App-Icon?** Favicons
werden auf sehr unterschiedlichen Tab-Hintergründen (hell/dunkel) angezeigt –
Transparenz funktioniert dort überall. iOS/Android rendern Transparenz bei
Homescreen-Icons dagegen unzuverlässig, deshalb dort der weiße Rounded-Square, der
ohnehin zu eurem hellen App-Theme passt.

**Kein `favicon.svg`:** Das Ausgangsmaterial ist ein bereits gerendertes Rasterbild
(sieht nach einem AI-Bildgenerator-Output aus, mit Schlagschatten/Verlaufs-Rendering),
keine Vektordatei. Für ein echtes Vektor-Logo müsste es aus dem ursprünglichen
Design-Tool als SVG exportiert werden – die PNG-Größen hier sind alle in hoher
Auflösung (bis 1024px) erzeugt, sollte für alle Web-/App-Zwecke ausreichen.

**OG-Bild bewusst hell**, nicht dunkel wie bei NovaChat/NovaFlow – der Plan legt für
NovaLearn explizit einen "hellen, minimalistischen Stil" als bewussten Kontrast zu den
dunklen Nova-Tools fest (Abschnitt 11, Phase 6).

### Einbindung (Next.js App Router)

```tsx
// app/layout.tsx
export const metadata = {
  title: "NovaLearn",
  description: "Lädt Kursmaterial hoch, prüft aktiv statt nur zu antworten",
  icons: {
    icon: [
      { url: "/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  openGraph: { images: ["/images/og/og-image.png"] },
  twitter: { card: "summary_large_image", images: ["/images/og/og-image.png"] },
};
```

## Teil 2 – UI-Icon-System (lucide-react)

Gleiche Bibliothek wie bereits für NovaChat/NovaFlow festgelegt: Open Source,
MIT-lizenziert, Named Imports für Tree-Shaking. Fallback bei fehlendem Icon: Tabler
Icons oder Heroicons.

```
src/
├── types/
│   ├── course.ts      Course, CourseSource, CourseChunk, SourceType (Plan Abschnitt 4)
│   ├── topic.ts        Topic, RelevanceLevel, ProgressStatus + relevanceLevelFromScore()
│   └── question.ts     Question, QuestionAttempt, QuestionType, AiVerdict
├── lib/ui/
│   ├── colorTokens.ts   Helles Farbschema + Marken-Verlauf (aus dem Logo gesampelt)
│   └── icons.ts         Icon-Resolver + fachliche Zuordnungen (Relevanz/Ampel/Fragetyp/...)
└── components/ui/
    ├── StatusPill.tsx      generischer Icon+Label-Pill-Baustein
    ├── RelevanceBadge.tsx  für TopicCard.tsx
    ├── ProgressBadge.tsx   für TopicCard.tsx / Dashboard
    └── VerdictBadge.tsx    für AnswerFeedback.tsx
```

### Fachliche Icon-Zuordnung

| Bereich | Wert | Icon | Farbe |
|---|---|---|---|
| Relevanz | hoch / mittel / niedrig | `SignalHigh` / `SignalMedium` / `SignalLow` | Marken-Violett / Amber / Slate |
| Fortschritts-Ampel | nicht_begonnen / unsicher / verstanden | `Circle` / `CircleDashed` / `CheckCircle2` | Slate / Amber / Grün |
| Fragetyp | definition / anwendung / transfer | `BookOpen` / `Wrench` / `Shuffle` | – |
| KI-Bewertung | richtig / teilweise / falsch | `CheckCircle2` / `CircleAlert` / `XCircle` | Grün / Amber / Rot |
| Quellen-Typ | folie / skript / uebung / altklausur | `Presentation` / `FileText` / `PencilLine` / `FileClock` | – |

Übergreifend: `UploadCloud` (Upload-Zone), `Plus` (neuer Kurs), `Send`/`MessageCircle`
(Chat), `Quote` (Quellenangabe-Chip in Chat-Antworten), `ChevronDown` (aufklappbare
Relevanz-Begründung), `Percent` (Gesamtfortschritt-Prozentwert), `Loader2` (Ingestion-
Fortschritt: hochladen → extrahieren → chunken → embedden), `AlertTriangle`
(Fehlerzustand bei gescanntem PDF ohne Text-Layer).

### Einbindung

```bash
npm install lucide-react
```

```tsx
import { RelevanceBadge } from "@/components/ui/RelevanceBadge";
import { ProgressBadge } from "@/components/ui/ProgressBadge";

function TopicCardHeader({ topic }: { topic: Topic }) {
  return (
    <div className="flex items-center gap-2">
      <RelevanceBadge score={topic.relevanceScore} />
      <ProgressBadge status={topic.progressStatus} />
    </div>
  );
}
```

### Verifikation

Der komplette Code in `src/` wurde gegen einen strukturellen TypeScript-Stub von
`lucide-react`/`react` geprüft (`tsc --noEmit --strict`) – **0 Fehler**. Ein echtes
`npm install lucide-react` konnte in dieser Sandbox nicht ausgeführt werden (Netzwerk
hier für neue Paketinstallationen gesperrt) – normales `npm install` beim
Projekt-Setup (Plan Phase 0) holt das nach. Die selteneren Icon-Namen
(`Presentation`, `FileClock`, `SignalHigh/-Medium/-Low`) sind mit hoher, aber nicht
100%iger Sicherheit korrekt (nicht live gegen die echte Bibliothek geprüft) – der
`resolveIcon()`-Fallback in `icons.ts` verhindert aber in jedem Fall einen Crash,
falls sich einer der Namen geändert haben sollte; stattdessen erscheint eine
Konsolen-Warnung und ein `HelpCircle`-Platzhalter.

## Noch offen

`Canvas`/`UploadZone`/`ChatWindow`/`QuestionCard` selbst (Plan Abschnitt 7) sind
eigenständige Implementierungsarbeit für die jeweilige Roadmap-Phase – hier ging es
um die Icon-/Farb-/Typ-Grundlage, auf der diese Komponenten aufbauen.
