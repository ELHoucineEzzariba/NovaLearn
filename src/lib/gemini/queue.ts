// NovaLearn – einfache Drosselung für Gemini-Aufrufe.
//
// Plan Abschnitt 12: Free-Tier-Rate-Limits liegen bei ca. 5–15 Anfragen/Minute.
// Beim Embedden vieler Chunks (Ingestion) oder parallelen KI-Aufrufen reicht
// eine simple sequentielle Warteschlange mit Mindestabstand zwischen den
// Aufrufen + Retry bei 429 – keine externe Queue-Library nötig für diese
// Größenordnung (ein Kurs = wenige hundert Chunks).

const MIN_INTERVAL_MS = 1200; // ~50 Anfragen/Minute Obergrenze, unter dem Free-Tier-Limit
const MAX_RETRIES = 4;

let queueTail: Promise<unknown> = Promise.resolve();

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRateLimitError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return message.includes("429") || message.toLowerCase().includes("rate limit");
}

/**
 * Reiht `task` in eine globale Warteschlange ein: Aufrufe laufen strikt
 * nacheinander mit Mindestabstand `MIN_INTERVAL_MS`, ein 429-Fehler löst
 * exponentielles Backoff + Retry aus statt den gesamten Batch abzubrechen.
 */
export function enqueueGeminiCall<T>(task: () => Promise<T>): Promise<T> {
  const result = queueTail.then(async () => {
    let attempt = 0;
    for (;;) {
      try {
        const value = await task();
        await sleep(MIN_INTERVAL_MS);
        return value;
      } catch (err) {
        attempt += 1;
        if (!isRateLimitError(err) || attempt > MAX_RETRIES) throw err;
        await sleep(MIN_INTERVAL_MS * 2 ** attempt);
      }
    }
  });

  // queueTail muss immer erfüllt (nie rejected) sein, sonst bricht die
  // gesamte Kette für alle nachfolgend eingereihten Aufrufe ab.
  queueTail = result.catch(() => undefined);

  return result as Promise<T>;
}
