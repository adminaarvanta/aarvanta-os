import "@/lib/knowledge/pdf-dom-polyfill";
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

async function extractPdfText(buffer: Buffer): Promise<string> {
  // Do not import `pdf-parse/worker` — that entry hard-requires `@napi-rs/canvas`.
  // On Vercel the native addon is excluded from the serverless trace, so loading
  // the worker module fails with ERR_MODULE_NOT_FOUND. The JS DOM polyfill above
  // is enough for text extraction; pdfjs only warns if canvas is missing.
  const { PDFParse } = await import("pdf-parse");

  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    const result = await parser.getText();
    return (result.text ?? "").trim();
  } finally {
    await parser.destroy();
  }
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
