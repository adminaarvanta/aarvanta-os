import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  detectFileType,
  extractTextFromBuffer,
  validateUpload,
} from "@/lib/knowledge/text-extract";

/** Minimal one-page PDF with Helvetica text — no xref required by pdf.js. */
function minimalPdf(text: string): Buffer {
  const escaped = text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
  const stream = `BT /F1 12 Tf 72 720 Td (${escaped}) Tj ET`;
  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj\n",
    `4 0 obj << /Length ${Buffer.byteLength(stream)} >> stream\n${stream}\nendstream endobj\n`,
    "5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n",
  ];

  let body = "%PDF-1.4\n";
  const offsets = [0];
  for (const object of objects) {
    offsets.push(Buffer.byteLength(body));
    body += object;
  }

  const xrefStart = Buffer.byteLength(body);
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i += 1) {
    xref += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  body += xref;
  body += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;
  return Buffer.from(body);
}

describe("knowledge text extract", () => {
  it("detects supported file types from the filename", () => {
    assert.equal(detectFileType("playbook.PDF"), "pdf");
    assert.equal(detectFileType("sop.docx"), "docx");
    assert.equal(detectFileType("notes.txt"), "txt");
    assert.equal(detectFileType("photo.png"), null);
  });

  it("rejects unsupported uploads", () => {
    const file = { name: "image.png", size: 12 } as File;
    assert.throws(() => validateUpload(file), /Unsupported file type/);
  });

  it("reads utf-8 text files", async () => {
    const text = await extractTextFromBuffer(
      Buffer.from("  Knowledge Hub notes  \n", "utf8"),
      "txt"
    );
    assert.equal(text, "Knowledge Hub notes");
  });

  it("extracts PDF text in Node without a browser DOMMatrix", async () => {
    const buffer = minimalPdf("Knowledge Hub PDF");
    const text = await extractTextFromBuffer(buffer, "pdf");
    assert.match(text, /Knowledge Hub PDF/);
  });
});
