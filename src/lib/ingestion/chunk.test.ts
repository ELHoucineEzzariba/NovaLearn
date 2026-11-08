import { describe, expect, it } from "vitest";
import { chunkPages } from "./chunk";

const paragraph = (char: string, length: number) => char.repeat(length);

describe("chunkPages", () => {
  it("merges short paragraphs of one page into a single chunk with page reference", () => {
    const chunks = chunkPages([{ pageNumber: 3, text: "Erster Absatz.\n\nZweiter Absatz." }]);
    expect(chunks).toEqual([
      { text: "Erster Absatz.\n\nZweiter Absatz.", pageRef: "Seite 3", pageNumbers: [3] },
    ]);
  });

  it("labels chunks spanning several pages as a page range", () => {
    const chunks = chunkPages([
      { pageNumber: 1, text: "Ende von Kapitel eins." },
      { pageNumber: 2, text: "Fortsetzung auf Seite zwei." },
    ]);
    expect(chunks).toHaveLength(1);
    expect(chunks[0].pageRef).toBe("Seite 1–2");
    expect(chunks[0].pageNumbers).toEqual([1, 2]);
  });

  it("starts a new chunk once the target size would be exceeded", () => {
    const chunks = chunkPages([
      { pageNumber: 1, text: `${paragraph("a", 900)}\n\n${paragraph("b", 900)}` },
    ]);
    expect(chunks).toHaveLength(2);
    expect(chunks[0].text).toBe(paragraph("a", 900));
    expect(chunks[1].text).toBe(paragraph("b", 900));
  });

  it("splits over-long paragraphs at sentence boundaries", () => {
    const sentence = `${paragraph("x", 999)}.`;
    const chunks = chunkPages([{ pageNumber: 7, text: `${sentence} ${sentence} ${sentence}` }]);
    expect(chunks).toHaveLength(3);
    for (const chunk of chunks) {
      expect(chunk.text.length).toBeLessThanOrEqual(1800);
      expect(chunk.pageRef).toBe("Seite 7");
    }
  });

  it("ignores empty pages and whitespace-only paragraphs", () => {
    expect(chunkPages([{ pageNumber: 1, text: "  \n\n   \n\n" }])).toEqual([]);
  });
});
