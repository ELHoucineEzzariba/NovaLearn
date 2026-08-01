// NovaLearn – einzelne Chat-Nachricht mit Quellenangabe-Chips
// (Plan Abschnitt 7).

import { Quote } from "lucide-react";
import type { ChatCitation } from "@/lib/rag/buildContext";

export type ChatMessageData = {
  id: string;
  role: "user" | "assistant";
  text: string;
  citations?: ChatCitation[];
};

export function ChatMessage({ message }: { message: ChatMessageData }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
          isUser ? "brand-gradient-bg text-white" : "border border-slate-200 bg-white text-slate-800"
        }`}
      >
        <p className="whitespace-pre-wrap leading-relaxed">{message.text}</p>
        {message.citations && message.citations.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {message.citations.map((citation) => (
              <span
                key={citation.label}
                className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500"
              >
                <Quote className="h-3 w-3" strokeWidth={2.25} />
                {citation.label}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
