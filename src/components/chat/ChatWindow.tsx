"use client";

// NovaLearn – Chat-Interface mit Quellenverweisen (Plan Abschnitt 7).

import { useRef, useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { ChatMessage, type ChatMessageData } from "./ChatMessage";
import type { SearchableChunk } from "@/lib/rag/search";
import type { CoursePageImage } from "@/types/course";

export function ChatWindow({
  courseId,
  chunks,
  pageImages,
}: {
  courseId: string;
  chunks: SearchableChunk[];
  pageImages: CoursePageImage[];
}) {
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function handleSend() {
    const question = input.trim();
    if (!question || sending) return;

    setInput("");
    setError(null);
    setMessages((m) => [...m, { id: `${Date.now()}-user`, role: "user", text: question }]);
    setSending(true);

    try {
      const res = await fetch(`/api/courses/${courseId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, chunks, pageImages }),
      });
      if (!res.ok) throw new Error("Antwort fehlgeschlagen.");
      const data = (await res.json()) as { answer: string; citations: ChatMessageData["citations"] };
      setMessages((m) => [
        ...m,
        { id: `${Date.now()}-assistant`, role: "assistant", text: data.answer, citations: data.citations },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler.");
    } finally {
      setSending(false);
      requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }));
    }
  }

  return (
    <div className="flex h-[70vh] flex-col rounded-2xl border border-slate-200 bg-slate-50">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="text-center text-sm text-slate-400">
            Stell eine Frage zum Kursmaterial – die Antwort verweist auf die Quelle.
          </p>
        )}
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5">
              <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {error && <p className="px-4 pb-1 text-xs text-red-600">{error}</p>}

      <div className="flex items-center gap-2 border-t border-slate-200 p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Frage zum Kursmaterial…"
          className="flex-1 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 placeholder:text-slate-400"
        />
        <button
          onClick={handleSend}
          disabled={sending || !input.trim()}
          className="brand-gradient-bg flex h-9 w-9 items-center justify-center rounded-full text-white disabled:opacity-50"
        >
          <Send className="h-4 w-4" strokeWidth={2.25} />
        </button>
      </div>
    </div>
  );
}
