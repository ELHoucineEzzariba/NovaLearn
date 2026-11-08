import { describe, expect, it } from "vitest";
import { buildContext } from "./buildContext";
import type { SearchableChunk } from "./search";

const chunk = (overrides: Partial<SearchableChunk>): SearchableChunk => ({
  id: "c1",
  text: "Inhalt",
  embedding: [],
  sourceId: "s1",
  sourceFileName: "skript.pdf",
  pageRef: "Seite 2",
  pageNumbers: [2],
  ...overrides,
});

const image = (sourceId: string, pageNumber: number) => ({
  id: `${sourceId}_${pageNumber}`,
  courseId: "course",
  sourceId,
  pageNumber,
  mimeType: "image/png",
  dataBase64: "",
});

describe("buildContext", () => {
  it("prefixes every chunk with its source label", () => {
    const { contextText } = buildContext([
      chunk({ text: "A" }),
      chunk({ id: "c2", text: "B", pageRef: null, sourceFileName: "notizen.pdf" }),
    ]);
    expect(contextText).toBe("[Quelle: skript.pdf, Seite 2]\nA\n\n[Quelle: notizen.pdf]\nB");
  });

  it("derives de-duplicated citations from the chunks actually used", () => {
    const { citations } = buildContext([chunk({ id: "c1" }), chunk({ id: "c2" })]);
    expect(citations).toEqual([{ label: "skript.pdf, Seite 2", sourceFileName: "skript.pdf", pageRef: "Seite 2" }]);
  });

  it("only forwards page images that belong to the used chunks", () => {
    const { images } = buildContext(
      [chunk({ sourceId: "s1", pageNumbers: [2, 3] })],
      [image("s1", 2), image("s1", 3), image("s1", 9), image("s2", 2)],
    );
    expect(images.map((img) => img.id)).toEqual(["s1_2", "s1_3"]);
  });
});
