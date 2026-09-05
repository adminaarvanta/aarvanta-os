import type { EmailOutreachTemplate } from "@/types/email-outreach";
import { htmlToPlainText } from "@/lib/email-outreach/html-utils";

export type EmailStarterTemplate = Omit<
  EmailOutreachTemplate,
  | "id"
  | "tenantId"
  | "workspaceId"
  | "companyId"
  | "createdAt"
  | "updatedAt"
  | "createdBy"
> & {
  id: string;
  source: "starter";
};

const clothingTradeHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Trade partnership</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;">
          <tr>
            <td style="background:#0b1c2c;padding:28px 32px;text-align:center;">
              <div style="font-size:22px;font-weight:700;letter-spacing:0.08em;color:#d4af37;text-transform:uppercase;">
                Your Brand
              </div>
              <div style="margin-top:8px;font-size:13px;color:#c9d6e3;">Wholesale &amp; trade partnerships</div>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 36px 12px;color:#1a1a1a;">
              <p style="margin:0 0 16px;font-size:16px;line-height:1.5;">Hi {{firstName}},</p>
              <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">
                We help retailers and partners grow with a curated clothing line built for
                <strong>quality, margin, and reliable replenishment</strong>.
              </p>
              <p style="margin:0 0 8px;font-size:16px;line-height:1.6;">If you are facing any of these:</p>
              <ul style="margin:0 0 20px;padding-left:20px;font-size:15px;line-height:1.7;color:#333333;">
                <li>Inconsistent stock from suppliers</li>
                <li>Thin margins on commodity styles</li>
                <li>Slow turns on seasonal assortment</li>
              </ul>
              <p style="margin:0 0 24px;font-size:16px;line-height:1.6;">
                We would like to explore a trade partnership with <strong>{{company}}</strong>.
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
                <tr>
                  <td style="background:#d4af37;border-radius:4px;">
                    <a href="https://example.com/trade"
                       style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:700;color:#0b1c2c;text-decoration:none;">
                      Book a 15-minute intro
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0;font-size:14px;line-height:1.6;color:#555555;">
                Best regards,<br />
                Trade Team<br />
                <a href="mailto:trade@example.com" style="color:#0b1c2c;">trade@example.com</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#0b1c2c;padding:18px 32px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9aabb8;">
                You are receiving this because you are listed as a trade contact for {{company}}.
              </p>
              <p style="margin:8px 0 0;font-size:12px;">
                <a href="mailto:{{email}}?subject=Unsubscribe" style="color:#d4af37;text-decoration:underline;">Unsubscribe</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

const productUpdateHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Product update</title>
</head>
<body style="margin:0;padding:0;background:#f7f7f7;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f7f7;padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e5e5e5;">
          <tr>
            <td style="padding:28px 32px;border-bottom:3px solid #111111;">
              <p style="margin:0;font-size:13px;letter-spacing:0.12em;text-transform:uppercase;color:#666666;">Product update</p>
              <h1 style="margin:10px 0 0;font-size:22px;line-height:1.3;color:#111111;">What is new this month</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px;color:#222222;font-size:15px;line-height:1.65;">
              <p style="margin:0 0 14px;">Hi {{firstName}},</p>
              <p style="margin:0 0 14px;">
                A quick update for {{company}} on what shipped recently and what is coming next.
              </p>
              <p style="margin:0 0 8px;"><strong>Shipped</strong></p>
              <ul style="margin:0 0 16px;padding-left:18px;">
                <li>Faster onboarding for new team members</li>
                <li>Clearer reporting on campaign performance</li>
              </ul>
              <p style="margin:0 0 8px;"><strong>Coming soon</strong></p>
              <ul style="margin:0 0 20px;padding-left:18px;">
                <li>Deeper CRM sync options</li>
                <li>Improved template library</li>
              </ul>
              <p style="margin:0 0 22px;">
                <a href="https://example.com/updates" style="color:#111111;font-weight:700;">Read the full changelog →</a>
              </p>
              <p style="margin:0;color:#555555;">Thanks,<br />The product team</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

export const EMAIL_STARTER_TEMPLATES: EmailStarterTemplate[] = [
  {
    id: "starter-clothing-trade",
    name: "Clothing trade promo",
    description:
      "Navy/gold one-column promo with problem list and CTA — adapted for deliverability (no embedded logo).",
    subject: "{{firstName}}, trade partnership for {{company}}",
    previewText: "Quality assortment, reliable replenishment, and a short intro call.",
    htmlBody: clothingTradeHtml,
    textBody: htmlToPlainText(clothingTradeHtml),
    source: "starter",
  },
  {
    id: "starter-product-update",
    name: "Simple product update",
    description: "Short single-column HTML for shipping product news.",
    subject: "What is new this month",
    previewText: "Shipped updates and what is coming next.",
    htmlBody: productUpdateHtml,
    textBody: htmlToPlainText(productUpdateHtml),
    source: "starter",
  },
  {
    id: "starter-plain-follow-up",
    name: "Plain follow-up",
    description: "Text-first follow-up with light HTML wrapping on send.",
    subject: "Quick follow-up, {{firstName}}",
    previewText: "Checking in on our last conversation.",
    htmlBody: "",
    textBody: `Hi {{firstName}},

Just following up on my earlier note. Happy to pick a time that works for {{company}}.

Would next Tuesday or Wednesday work for a quick call?

Best,
{{fullName}}`,
    source: "starter",
  },
];

export function listEmailStarterTemplates(): EmailStarterTemplate[] {
  return EMAIL_STARTER_TEMPLATES;
}

export function getEmailStarterTemplate(
  id: string
): EmailStarterTemplate | undefined {
  return EMAIL_STARTER_TEMPLATES.find((t) => t.id === id);
}
