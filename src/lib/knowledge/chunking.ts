const CHUNK_SIZE = 900;
const CHUNK_OVERLAP = 120;

export function chunkText(text: string): string[] {
  const normalized = text.replace(/\r\n/g, "\n").replace(/\s+\n/g, "\n").trim();
  if (!normalized) return [];

  const paragraphs = normalized.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const chunks: string[] = [];
  let buffer = "";

  function flushBuffer() {
    const trimmed = buffer.trim();
    if (trimmed) chunks.push(trimmed);
    buffer = "";
  }

  for (const paragraph of paragraphs) {
    if (`${buffer}\n\n${paragraph}`.length <= CHUNK_SIZE) {
      buffer = buffer ? `${buffer}\n\n${paragraph}` : paragraph;
      continue;
    }

    if (buffer) flushBuffer();

    if (paragraph.length <= CHUNK_SIZE) {
      buffer = paragraph;
      continue;
    }

    let start = 0;
    while (start < paragraph.length) {
      const end = Math.min(start + CHUNK_SIZE, paragraph.length);
      chunks.push(paragraph.slice(start, end).trim());
      if (end >= paragraph.length) break;
      start = Math.max(end - CHUNK_OVERLAP, start + 1);
    }
  }

  flushBuffer();
  return chunks.filter(Boolean);
}
