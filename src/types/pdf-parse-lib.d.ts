// Ambient Typisierung für den internen pdf-parse-Einstiegspunkt.
//
// Wir importieren bewusst "pdf-parse/lib/pdf-parse.js" statt des Hauptpakets:
// pdf-parse@1's index.js liest beim Import eine Test-PDF ein, sobald
// `module.parent` fehlt (`isDebugMode`) – in manchen Next.js-Bundling-
// Konstellationen ist das der Fall und der Import crasht mit ENOENT. Der
// interne lib-Pfad enthält diese Debug-Logik nicht.
declare module "pdf-parse/lib/pdf-parse.js" {
  interface PdfParseResult {
    numpages: number;
    numrender: number;
    info: unknown;
    metadata: unknown;
    version: string;
    text: string;
  }

  interface PdfParseOptions {
    pagerender?: (pageData: import("pdf-parse-lib-internal").PdfJsPage) => string | Promise<string>;
    max?: number;
    version?: string;
  }

  function PdfParse(dataBuffer: Buffer, options?: PdfParseOptions): Promise<PdfParseResult>;
  export = PdfParse;
}

// Minimaler struktureller Typ für das pdf.js-Seitenobjekt, das pagerender()
// erhält – nur die Felder, die extractText.ts tatsächlich verwendet.
declare module "pdf-parse-lib-internal" {
  export interface PdfJsTextItem {
    str: string;
    transform: number[];
  }
  export interface PdfJsTextContent {
    items: PdfJsTextItem[];
  }
  export interface PdfJsPage {
    pageNumber: number;
    getTextContent(options?: {
      normalizeWhitespace?: boolean;
      disableCombineTextItems?: boolean;
    }): Promise<PdfJsTextContent>;
  }
}
