import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse (via pdfjs-dist) lädt zur Laufzeit dynamisch einen Worker-Pfad
  // (pdf.worker.mjs) auf, den Turbopack beim Server-Bundling nicht korrekt
  // auflöst ("Setting up fake worker failed"). Als externes Paket markiert
  // läuft es stattdessen über Node.js' normale require()-Auflösung.
  serverExternalPackages: ["pdf-parse", "pdfjs-dist", "@napi-rs/canvas"],
};

export default nextConfig;
