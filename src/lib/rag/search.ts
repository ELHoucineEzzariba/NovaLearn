// NovaLearn – In-Memory-Cosine-Similarity statt dedizierter Vektor-DB
// (Plan Abschnitt 3/5/Schritt 3: bei Portfolio-Größenordnung unproblematisch).

export type SearchableChunk = {
  id: string;
  text: string;
  embedding: number[];
  sourceId: string;
  sourceFileName: string;
  pageRef: string | null;
  pageNumbers: number[];
};

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function topKChunks<T extends { embedding: number[] }>(
  queryEmbedding: number[],
  chunks: T[],
  k: number,
): T[] {
  return chunks
    .map((chunk) => ({ chunk, score: cosineSimilarity(queryEmbedding, chunk.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map(({ chunk }) => chunk);
}
