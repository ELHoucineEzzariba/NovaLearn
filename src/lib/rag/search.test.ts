import { describe, expect, it } from "vitest";
import { cosineSimilarity, topKChunks } from "./search";

describe("cosineSimilarity", () => {
  it("is 1 for identical direction and 0 for orthogonal vectors", () => {
    expect(cosineSimilarity([1, 2, 3], [2, 4, 6])).toBeCloseTo(1);
    expect(cosineSimilarity([1, 0], [0, 1])).toBe(0);
  });

  it("is -1 for opposite vectors", () => {
    expect(cosineSimilarity([1, 1], [-1, -1])).toBeCloseTo(-1);
  });

  it("returns 0 instead of NaN for zero vectors", () => {
    expect(cosineSimilarity([0, 0], [1, 1])).toBe(0);
  });
});

describe("topKChunks", () => {
  const chunks = [
    { id: "far", embedding: [0, 1] },
    { id: "best", embedding: [1, 0] },
    { id: "close", embedding: [1, 0.5] },
  ];

  it("returns the k most similar chunks in descending order", () => {
    expect(topKChunks([1, 0], chunks, 2).map((c) => c.id)).toEqual(["best", "close"]);
  });

  it("returns all chunks when k exceeds the pool", () => {
    expect(topKChunks([1, 0], chunks, 10)).toHaveLength(3);
  });
});
