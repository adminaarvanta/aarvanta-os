export type MergeContext = {
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  company: string;
  jobTitle: string;
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
    if (key in ctx) return ctx[key as keyof MergeContext];
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
