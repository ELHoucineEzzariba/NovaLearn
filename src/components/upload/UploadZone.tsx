"use client";

// NovaLearn – Drag-&-Drop-Upload mit sichtbarem Verarbeitungsstatus je Datei
// (Plan Abschnitt 7: "hochladen → extrahieren → chunken → embedden, jeder
// Schritt sichtbar"). Die drei serverseitigen Schritte laufen technisch in
// einem API-Aufruf (siehe uploadPipeline.ts) – hier als ein gemeinsamer
// "Verarbeiten"-Status dargestellt, um keinen Fortschritt vorzutäuschen, der
// nicht wirklich einzeln beobachtbar ist.

import { useCallback, useRef, useState } from "react";
import { UploadCloud, AlertTriangle } from "lucide-react";
import { StatusPill } from "@/components/ui/StatusPill";
import { runIngestion, IngestionError, type IngestionStage } from "@/lib/ingestion/uploadPipeline";
import type { SourceType } from "@/types/course";

const SOURCE_TYPE_LABEL: Record<SourceType, string> = {
  folie: "Folie",
  skript: "Skript",
  uebung: "Übung",
  altklausur: "Altklausur",
};

const STAGE_LABEL: Record<IngestionStage, string> = {
  hochladen: "Hochladen",
  verarbeiten: "Extrahieren, chunken & embedden",
  speichern: "Speichern",
  fertig: "Fertig",
};

const ERROR_LABEL: Record<string, string> = {
  not_a_pdf: "Keine PDF-Datei.",
  file_too_large: "Datei zu groß (max. 20 MB).",
  no_text_layer: "Kein Text gefunden – vermutlich ein gescanntes PDF ohne Text-Layer.",
  parse_error: "PDF konnte nicht gelesen werden.",
  embedding_failed: "Embedding fehlgeschlagen (KI-Dienst gerade nicht erreichbar).",
  missing_file: "Keine Datei übermittelt.",
  unknown: "Unbekannter Fehler bei der Verarbeitung.",
};

type QueueItem = {
  key: string;
  fileName: string;
  stage: IngestionStage | "fehler";
  errorCode?: string;
  uploadProgress: number;
};

export function UploadZone({
  courseId,
  uid,
  onUploaded,
}: {
  courseId: string;
  uid: string;
  onUploaded: () => void;
}) {
  const [sourceType, setSourceType] = useState<SourceType>("folie");
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(
    async (files: FileList | File[]) => {
      const pdfFiles = Array.from(files).filter(
        (f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"),
      );

      for (const file of pdfFiles) {
        const key = `${file.name}-${Date.now()}-${Math.random()}`;
        setQueue((q) => [...q, { key, fileName: file.name, stage: "hochladen", uploadProgress: 0 }]);

        try {
          await runIngestion({
            uid,
            courseId,
            file,
            sourceType,
            onStage: (stage) =>
              setQueue((q) => q.map((it) => (it.key === key ? { ...it, stage } : it))),
            onUploadProgress: (fraction) =>
              setQueue((q) =>
                q.map((it) => (it.key === key ? { ...it, uploadProgress: fraction } : it)),
              ),
          });
          onUploaded();
        } catch (err) {
          const code = err instanceof IngestionError ? err.code : "unknown";
          setQueue((q) =>
            q.map((it) => (it.key === key ? { ...it, stage: "fehler", errorCode: code } : it)),
          );
        }
      }
    },
    [courseId, uid, sourceType, onUploaded],
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <label htmlFor="source-type" className="text-sm text-slate-600">
          Dateityp:
        </label>
        <select
          id="source-type"
          value={sourceType}
          onChange={(e) => setSourceType(e.target.value as SourceType)}
          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm text-slate-900"
        >
          {(Object.keys(SOURCE_TYPE_LABEL) as SourceType[]).map((type) => (
            <option key={type} value={type}>
              {SOURCE_TYPE_LABEL[type]}
            </option>
          ))}
        </select>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          void processFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
          isDragging ? "border-[#8A38EC] bg-[#8A38EC0D]" : "border-slate-200 bg-slate-50"
        }`}
      >
        <UploadCloud className="h-6 w-6 text-slate-400" strokeWidth={2} />
        <p className="text-sm font-medium text-slate-700">
          PDFs hierher ziehen oder klicken zum Auswählen
        </p>
        <p className="text-xs text-slate-400">Mehrere Dateien möglich, max. 20 MB pro Datei</p>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) void processFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {queue.length > 0 && (
        <ul className="space-y-2">
          {queue.map((item) => (
            <li
              key={item.key}
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              <span className="truncate text-slate-700">{item.fileName}</span>
              {item.stage === "fehler" ? (
                <span className="flex items-center gap-1.5 text-xs font-medium text-red-600">
                  <AlertTriangle className="h-3.5 w-3.5" strokeWidth={2.25} />
                  {ERROR_LABEL[item.errorCode ?? "unknown"]}
                </span>
              ) : (
                <StatusPill
                  icon="Loader2"
                  label={
                    item.stage === "hochladen"
                      ? `${STAGE_LABEL[item.stage]} ${Math.round(item.uploadProgress * 100)}%`
                      : STAGE_LABEL[item.stage]
                  }
                  colorToken={{ fg: "#8A38EC", bg: "rgba(138,56,236,0.10)" }}
                  size="sm"
                  spin={item.stage !== "fertig"}
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
