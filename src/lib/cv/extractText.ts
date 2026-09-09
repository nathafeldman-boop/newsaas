import mammoth from "mammoth";

// pdfjs-dist "legacy" build en pur JS : pas de dépendance native (contrairement
// à pdf-parse v2, qui embarque @napi-rs/canvas — fragile sur les fonctions
// serverless Vercel). getTextContent() n'a pas besoin de canvas, mais
// certains PDF (police Type3, texte avec matrice de transformation...)
// font quand même référence à `DOMMatrix`, une API navigateur absente de
// Node -- crash réel en prod ("DOMMatrix is not defined") sur des CV qui
// déclenchent ce chemin, sans lien avec le contenu du texte lui-même.
// Polyfill pur JS (même contrainte que pdfjs-dist : zéro dépendance native).
async function ensureDomMatrixPolyfill() {
  if (typeof globalThis.DOMMatrix !== "undefined") return;
  const { default: CSSMatrix } = await import("@thednp/dommatrix");
  globalThis.DOMMatrix = CSSMatrix as unknown as typeof DOMMatrix;
}

// En Node, pdfjs-dist désactive son vrai Worker et retombe sur un "fake
// worker" qui va chercher pdf.worker.mjs via un `import()` dynamique résolu
// au chemin littéral "./pdf.worker.mjs" (voir PDFWorker#setupFakeWorker) --
// ce chemin relatif ne pointe vers rien une fois le code empaqueté par
// Next.js pour une fonction serverless Vercel, d'où le crash silencieux en
// prod ("Setting up fake worker failed: Cannot find module ... pdf.worker.mjs").
// pdfjs-dist court-circuite cette recherche si `globalThis.pdfjsWorker` est
// déjà défini (il l'utilise directement au lieu de faire l'import dynamique
// fragile) -- on importe donc le worker nous-mêmes, en package, où Next peut
// le tracer et l'inclure correctement dans le bundle serverless.
async function ensurePdfWorkerPolyfill() {
  if (typeof (globalThis as { pdfjsWorker?: unknown }).pdfjsWorker !== "undefined") return;
  // Spécificateur non-littéral : pdfjs-dist ne publie pas de types pour ce
  // sous-chemin (seul pdf.mjs en a), un littéral ferait échouer le typecheck.
  const workerPath: string = "pdfjs-dist/legacy/build/pdf.worker.mjs";
  const workerModule = await import(workerPath);
  (globalThis as { pdfjsWorker?: unknown }).pdfjsWorker = workerModule;
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  await ensureDomMatrixPolyfill();
  await ensurePdfWorkerPolyfill();
  const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const doc = await getDocument({ data: new Uint8Array(buffer) }).promise;

  let text = "";
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    text +=
      content.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ") + "\n";
  }
  return text;
}

export async function extractCvText(
  buffer: Buffer,
  filename: string,
): Promise<string> {
  const ext = filename.split(".").pop()?.toLowerCase();

  if (ext === "pdf") {
    return extractPdfText(buffer);
  }

  if (ext === "docx") {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  throw new Error(
    "Format non supporté pour l'analyse : réexporte ton CV en PDF ou DOCX.",
  );
}
