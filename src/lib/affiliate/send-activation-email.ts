import { isEmailConfigured } from "@/lib/channels/config";
import { sendGmailEmail } from "@/lib/channels/gmail-client";
import { isDemoMode } from "@/lib/config/app-mode";

export type AffiliateEmailResult =
  | { sent: true; url: string }
  | { sent: false; url: string; reason: string };

function appBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "https://os.aarvanta.co"
  );
}

export function affiliateActivationUrl(token: string): string {
  return `${appBaseUrl()}/affiliate/activate/${encodeURIComponent(token)}`;
}

export function affiliateDashboardUrl(): string {
  return `${appBaseUrl()}/affiliate/dashboard`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Email set-password link after partner approval. */
export async function sendAffiliateActivationEmail(input: {
  email: string;
  name: string;
  token: string;
  expiresAt: string;
}): Promise<AffiliateEmailResult> {
  const url = affiliateActivationUrl(input.token);
  const firstName = input.name.split(/\s+/)[0] || "there";

  if (isDemoMode()) {
    console.info("[affiliate:demo] Would email activation", {
      to: input.email,
      url,
    });
    return { sent: false, url, reason: "demo_mode" };
  }

  if (!isEmailConfigured()) {
    return { sent: false, url, reason: "email_not_configured" };
  }

  const subject = "You're approved — create your Aarvanta partner password";
  const text = [
    `Hi ${firstName},`,
    ``,
    `Your Aarvanta partner application was approved.`,
    `Create a password to access your affiliate dashboard:`,
    url,
    ``,
    `This link expires on ${new Date(input.expiresAt).toUTCString()}.`,
    ``,
    `After that, sign in anytime at ${appBaseUrl()}/login`,
    `and open ${affiliateDashboardUrl()}.`,
  ].join("\n");

  const html = `
    <div style="font-family:system-ui,-apple-system,sans-serif;line-height:1.5;color:#111;max-width:560px">
      <p>Hi ${escapeHtml(firstName)},</p>
      <p>Your Aarvanta partner application was <strong>approved</strong>.</p>
      <p>Create a password to access your affiliate dashboard:</p>
      <p style="margin:24px 0">
        <a href="${escapeHtml(url)}"
           style="display:inline-block;background:#B8965D;color:#111;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:600">
          Create password
        </a>
      </p>
      <p style="font-size:13px;color:#555">
        Or open this link:<br/>
        <a href="${escapeHtml(url)}">${escapeHtml(url)}</a>
      </p>
      <p style="font-size:12px;color:#777">
        Expires ${escapeHtml(new Date(input.expiresAt).toUTCString())}.
      </p>
    </div>
  `;

  try {
    await sendGmailEmail({
      to: input.email,
      subject,
      text,
      html,
    });
    return { sent: true, url };
  } catch (error) {
    console.error("[affiliate] activation email failed", error);
    return {
      sent: false,
      url,
      reason: error instanceof Error ? error.message : "send_failed",
    };
  }
}

/** Notify partners who already have a login that they were approved. */
export async function sendAffiliateApprovedNoticeEmail(input: {
  email: string;
  name: string;
}): Promise<AffiliateEmailResult> {
  const url = affiliateDashboardUrl();
  const firstName = input.name.split(/\s+/)[0] || "there";

  if (isDemoMode()) {
    console.info("[affiliate:demo] Would email approved notice", {
      to: input.email,
      url,
    });
    return { sent: false, url, reason: "demo_mode" };
  }

  if (!isEmailConfigured()) {
    return { sent: false, url, reason: "email_not_configured" };
  }

  const subject = "Your Aarvanta partner account is active";
  const text = [
    `Hi ${firstName},`,
    ``,
    `Your partner application was approved.`,
    `Sign in and open your dashboard:`,
    url,
  ].join("\n");

  const html = `
    <div style="font-family:system-ui,-apple-system,sans-serif;line-height:1.5;color:#111;max-width:560px">
      <p>Hi ${escapeHtml(firstName)},</p>
      <p>Your partner application was <strong>approved</strong>.</p>
      <p style="margin:24px 0">
        <a href="${escapeHtml(url)}"
           style="display:inline-block;background:#B8965D;color:#111;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:600">
          Open affiliate dashboard
        </a>
      </p>
    </div>
  `;

  try {
    await sendGmailEmail({
      to: input.email,
      subject,
      text,
      html,
    });
    return { sent: true, url };
  } catch (error) {
    console.error("[affiliate] approved notice email failed", error);
    return {
      sent: false,
      url,
      reason: error instanceof Error ? error.message : "send_failed",
    };
  }
}
