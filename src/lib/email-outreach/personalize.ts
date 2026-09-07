export type MergeContext = {
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  company: string;
  jobTitle: string;
  /** Campaign creator partner/affiliate URL when configured. */
  partnerLink?: string;
};

export function mergeContextFromContact(contact: {
  firstName?: string;
  lastName?: string;
  email?: string;
  jobTitle?: string;
  companyName?: string;
}): MergeContext {
  const firstName = contact.firstName?.trim() || "there";
  const lastName = contact.lastName?.trim() || "";
  const fullName = [contact.firstName, contact.lastName]
    .filter(Boolean)
    .join(" ")
    .trim() || firstName;
  return {
    firstName,
    lastName,
    fullName,
    email: contact.email?.trim() || "",
    company: contact.companyName?.trim() || "your team",
    jobTitle: contact.jobTitle?.trim() || "",
  };
}

export function applyMergeFields(template: string, ctx: MergeContext): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (full, key: string) => {
    if (key in ctx) return ctx[key as keyof MergeContext] ?? "";
    return full;
  });
}

export function personalizeForContact(
  template: string,
  contact: Parameters<typeof mergeContextFromContact>[0]
): string {
  return applyMergeFields(template, mergeContextFromContact(contact));
}

export function wrapEmailHtml(htmlOrText: string): string {
  const trimmed = htmlOrText.trim();
  if (!trimmed) {
    return "<html><body></body></html>";
  }
  if (/<(html|body|p|div|br|table|h[1-6])[\s>]/i.test(trimmed)) {
    if (/<html[\s>]/i.test(trimmed)) return trimmed;
    return `<html><body style="font-family:Georgia,serif;line-height:1.6;color:#1a1a1a">${trimmed}</body></html>`;
  }
  const escaped = trimmed
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return `<html><body style="font-family:Georgia,serif;line-height:1.6;color:#1a1a1a"><p>${escaped.replace(/\n{2,}/g, "</p><p>").replace(/\n/g, "<br/>")}</p></body></html>`;
}

function escapeHtmlAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Flatten nested marketing anchors so the whole HTML design can sit inside one
 * partner `<a>`. Preserve mailto / unsubscribe links as plain text with URL.
 */
function flattenInnerAnchors(inner: string): string {
  return inner.replace(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi, (full, attrs, content) => {
    const hrefMatch = /href\s*=\s*(['"])(.*?)\1/i.exec(attrs);
    const href = (hrefMatch?.[2] ?? "").trim();
    const isMail = /^mailto:/i.test(href);
    const isUnsub =
      /unsubscribe/i.test(href) ||
      /unsubscribe/i.test(full) ||
      /unsubscribe/i.test(String(attrs));
    if (isMail || isUnsub) {
      const label = String(content).replace(/<[^>]+>/g, "").trim() || href;
      return `${label}${href ? ` (${href})` : ""}`;
    }
    return String(content);
  });
}

/**
 * Make the HTML email design / photos / content a touchable link to the
 * campaign creator's partner URL. Safe for common email clients: one outer
 * block link, nested marketing anchors flattened.
 */
export function applyPartnerLinkToEmailHtml(
  html: string,
  partnerLinkUrl: string | undefined,
  options?: { enabled?: boolean }
): string {
  const url = partnerLinkUrl?.trim();
  const enabled = options?.enabled !== false;
  if (!url || !enabled) return html;

  const href = escapeHtmlAttr(url);
  const open = `<a href="${href}" target="_blank" style="display:block;text-decoration:none;color:inherit;cursor:pointer;">`;
  const close = `</a>`;

  if (/<body[\s>]/i.test(html)) {
    return html.replace(
      /(<body[^>]*>)([\s\S]*?)(<\/body>)/i,
      (_m, bodyOpen: string, inner: string, bodyClose: string) =>
        `${bodyOpen}${open}${flattenInnerAnchors(inner)}${close}${bodyClose}`
    );
  }

  return `${open}${flattenInnerAnchors(html)}${close}`;
}

/** Build final HTML for send: wrap document + optional partner link overlay. */
export function buildOutboundEmailHtml(input: {
  htmlBody: string;
  partnerLinkUrl?: string;
  linkHtmlAsPartner?: boolean;
}): string {
  const wrapped = wrapEmailHtml(input.htmlBody);
  const shouldLink =
    Boolean(input.partnerLinkUrl?.trim()) && input.linkHtmlAsPartner !== false;
  return applyPartnerLinkToEmailHtml(wrapped, input.partnerLinkUrl, {
    enabled: shouldLink,
  });
}
