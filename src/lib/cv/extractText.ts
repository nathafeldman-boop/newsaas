import mammoth from "mammoth";

// pdfjs-dist "legacy" build en pur JS : pas de dépendance native (contrairement
// à pdf-parse v2, qui embarque @napi-rs/canvas — fragile sur les fonctions
// serverless Vercel). getTextContent() n'a pas besoin de canvas.
async function extractPdfText(buffer: Buffer): Promise<string> {
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
