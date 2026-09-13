import type { KnowledgeFileType } from "@/types/knowledge";

const MAX_FILE_BYTES = 10 * 1024 * 1024;

export function detectFileType(fileName: string): KnowledgeFileType | null {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".pdf")) return "pdf";
  if (lower.endsWith(".docx")) return "docx";
  if (lower.endsWith(".txt")) return "txt";
  return null;
}

export function validateUpload(file: File) {
  const fileType = detectFileType(file.name);
  if (!fileType) {
    throw new Error("Unsupported file type. Upload PDF, DOCX, or TXT.");
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new Error("File exceeds 10 MB limit.");
  }
  return fileType;
}

/**
 * pdfjs-dist (used by pdf-parse v2) constructs `DOMMatrix` while the module
 * evaluates. Polyfill browser canvas APIs *before* importing pdf-parse, then
 * pass the Node CanvasFactory so text extraction works in Next.js/Node.
 */
async function extractPdfText(buffer: Buffer): Promise<string> {
  await ensurePdfDomPolyfills();
  const { CanvasFactory, getData } = await import("pdf-parse/worker");
  const { PDFParse } = await import("pdf-parse");
  PDFParse.setWorker(getData());

  const parser = new PDFParse({
    data: new Uint8Array(buffer),
    CanvasFactory,
  });
  try {
    const result = await parser.getText();
    return (result.text ?? "").trim();
  } finally {
    await parser.destroy();
  }
}

async function ensurePdfDomPolyfills() {
  if (typeof globalThis.DOMMatrix !== "undefined") return;

  const canvas = await import("@napi-rs/canvas");
  const globals = globalThis as typeof globalThis & {
    DOMMatrix?: typeof canvas.DOMMatrix;
    ImageData?: typeof canvas.ImageData;
    Path2D?: typeof canvas.Path2D;
  };
  globals.DOMMatrix ??= canvas.DOMMatrix;
  globals.ImageData ??= canvas.ImageData;
  globals.Path2D ??= canvas.Path2D;
}

export async function extractTextFromBuffer(
  buffer: Buffer,
  fileType: KnowledgeFileType
): Promise<string> {
  if (fileType === "txt") {
    return buffer.toString("utf8").trim();
  }

  if (fileType === "docx") {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return result.value.trim();
  }

  return extractPdfText(buffer);
}

export async function extractTextFromFile(file: File): Promise<string> {
  const fileType = validateUpload(file);
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const text = await extractTextFromBuffer(buffer, fileType);
  if (!text) {
    throw new Error("No readable text found in this file.");
  }
  return text;
}
