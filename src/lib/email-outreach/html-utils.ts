import {
  applyMergeFields,
  type MergeContext,
} from "@/lib/email-outreach/personalize";

/** Sample merge values for the Preview tab. */
export const PREVIEW_MERGE_CONTEXT: MergeContext = {
  firstName: "Alex",
  lastName: "Morgan",
  fullName: "Alex Morgan",
  email: "alex@example.com",
  company: "Northbridge Trading",
  jobTitle: "Buying Manager",
};

/** Strip tags for a plaintext fallback. */
export function htmlToPlainText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|tr|h[1-6]|li)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

/** Remove scripts before iframe preview (authored admin HTML is otherwise trusted). */
export function sanitizeEmailHtmlForPreview(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+\s*=\s*(['"]).*?\1/gi, "")
    .replace(/\son\w+\s*=\s*[^\s>]+/gi, "");
}

export function buildEmailPreviewHtml(
  htmlBody: string,
  textBody?: string
): string {
  const source = htmlBody.trim() || textBody?.trim() || "";
  const withMerges = applyMergeFields(source, PREVIEW_MERGE_CONTEXT);
  const safe = sanitizeEmailHtmlForPreview(withMerges);
  if (/<html[\s>]/i.test(safe)) return safe;
  if (/<(p|div|table|h[1-6]|br)[\s>]/i.test(safe)) {
    return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;background:#f4f6fa;">${safe}</body></html>`;
  }
  const escaped = safe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return `<!doctype html><html><body style="font-family:Georgia,serif;line-height:1.6;color:#1a1a1a;padding:24px;"><p>${escaped
    .replace(/\n{2,}/g, "</p><p>")
    .replace(/\n/g, "<br/>")}</p></body></html>`;
}

export function looksLikeHtml(value: string): boolean {
  return /<(html|body|p|div|br|table|h[1-6]|td|tr|span|a)[\s>]/i.test(
    value.trim()
  );
}
