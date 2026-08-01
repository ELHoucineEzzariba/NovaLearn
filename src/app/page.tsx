import Image from "next/image";
import Link from "next/link";
import { UploadCloud, MessageCircle, CheckCircle2 } from "lucide-react";

const PILLARS = [
  {
    icon: UploadCloud,
    title: "Material hochladen",
    text: "PDF-Folien, Skripte, Übungen und Altklausuren hochladen – NovaLearn extrahiert automatisch die Themen mit nachvollziehbarer Klausurrelevanz.",
  },
  {
    icon: MessageCircle,
    title: "Mit Quellenangabe fragen",
    text: "Chat mit dem eigenen Kursmaterial – jede Antwort verweist auf die Quelle (z. B. \"laut Folie 12\").",
  },
  {
    icon: CheckCircle2,
    title: "Aktiv geprüft werden",
    text: "Statt nur zu antworten generiert die KI Fragen zu jedem Thema und bewertet Freitext-Antworten mit konkretem Feedback.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center bg-white">
      <main className="flex w-full max-w-4xl flex-1 flex-col items-center px-6 py-20 text-center sm:py-28">
        <Image
          src="/images/brand/logo-mark-transparent.png"
          alt="NovaLearn Logo"
          width={72}
          height={72}
          priority
          className="mb-6"
        />
        <h1 className="brand-gradient-text text-4xl font-semibold tracking-tight sm:text-5xl">
          NovaLearn
        </h1>
        <p className="mt-4 max-w-xl text-lg text-slate-600">
          Lädt Kursmaterial hoch, prüft aktiv statt nur zu antworten.
        </p>

        <Link
          href="/courses"
          className="brand-gradient-bg mt-8 inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90"
        >
          Kurse ansehen
        </Link>

        <div className="mt-20 grid w-full gap-6 text-left sm:grid-cols-3">
          {PILLARS.map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
            >
              <Icon className="h-5 w-5 text-[#8A38EC]" strokeWidth={2.25} />
              <h2 className="mt-3 text-sm font-semibold text-slate-900">{title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{text}</p>
            </div>
          ))}
        </div>

        <p className="mt-16 max-w-xl text-xs text-slate-400">
          Demo läuft mit einem kostenlosen KI-Tier – bitte Beispielmaterial statt
          echter sensibler Unterlagen hochladen.
        </p>
      </main>
    </div>
  );
}
