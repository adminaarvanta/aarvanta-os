import { isEmailConfigured } from "@/lib/channels/config";
import {
  describeGmailSendFailure,
  sendGmailEmail,
} from "@/lib/channels/gmail-client";
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
  return `${appBaseUrl()}/partners`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Email set-password link when a partner is auto-activated. */
export async function sendAffiliateActivationEmail(input: {
  email: string;
  name: string;
  token: string;
  expiresAt?: string;
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

  const subject = "Create your Aarvanta partner password";
  const text = [
    `Hi ${firstName},`,
    ``,
    `You are in the Aarvanta partner program.`,
    `Create a password to access your affiliate dashboard:`,
    url,
    ``,
    `This link stays valid until you create your password. Resending the email does not invalidate it.`,
    ``,
    `After that, sign in anytime at ${appBaseUrl()}/login`,
    `and open ${affiliateDashboardUrl()}.`,
  ].join("\n");

  const html = `
    <div style="font-family:system-ui,-apple-system,sans-serif;line-height:1.5;color:#111;max-width:560px">
      <p>Hi ${escapeHtml(firstName)},</p>
      <p>You are in the Aarvanta partner program.</p>
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
        This link stays valid until you create your password.
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
      reason: describeGmailSendFailure(error),
    };
  }
}

/** Notify partners who already have a login that their partner account is ready. */
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
    `You are in the Aarvanta partner program.`,
    `Sign in and open your dashboard:`,
    url,
  ].join("\n");

  const html = `
    <div style="font-family:system-ui,-apple-system,sans-serif;line-height:1.5;color:#111;max-width:560px">
      <p>Hi ${escapeHtml(firstName)},</p>
      <p>You are in the Aarvanta partner program. Your account is <strong>active</strong>.</p>
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
      reason: describeGmailSendFailure(error),
    };
  }
}

export function affiliateAdminUrl(): string {
  return `${appBaseUrl()}/affiliate/admin`;
}

/** Notify platform ops that a new partner joined (auto-activated). */
export async function sendAffiliateApplicationNotifyEmail(input: {
  to: string[];
  applicantName: string;
  applicantEmail: string;
  company?: string;
  country: string;
  referralCode: string;
}): Promise<{ sent: number; failed: number; reason?: string }> {
  const recipients = [
    ...new Set(input.to.map((e) => e.trim().toLowerCase()).filter(Boolean)),
  ];
  const url = affiliateAdminUrl();

  if (isDemoMode()) {
    console.info("[affiliate:demo] Would email new application", {
      to: recipients,
      applicant: input.applicantEmail,
      code: input.referralCode,
      url,
    });
    return { sent: 0, failed: 0, reason: "demo_mode" };
  }

  if (recipients.length === 0) {
    console.warn(
      "[affiliate] No AFFILIATE_ADMIN_EMAILS / AUTH_EMAIL configured — skipping application notify"
    );
    return { sent: 0, failed: 0, reason: "no_admin_emails" };
  }

  if (!isEmailConfigured()) {
    return { sent: 0, failed: recipients.length, reason: "email_not_configured" };
  }

  const subject = `New partner joined: ${input.applicantName}`;
  const text = [
    `A new Aarvanta partner was auto-activated.`,
    ``,
    `Name: ${input.applicantName}`,
    `Email: ${input.applicantEmail}`,
    `Company: ${input.company || "—"}`,
    `Country: ${input.country}`,
    `Referral code: ${input.referralCode}`,
    ``,
    `Admin: ${url}`,
  ].join("\n");

  const html = `
    <div style="font-family:system-ui,-apple-system,sans-serif;line-height:1.5;color:#111;max-width:560px">
      <p>A new Aarvanta partner was <strong>auto-activated</strong>.</p>
      <ul>
        <li><strong>Name:</strong> ${escapeHtml(input.applicantName)}</li>
        <li><strong>Email:</strong> ${escapeHtml(input.applicantEmail)}</li>
        <li><strong>Company:</strong> ${escapeHtml(input.company || "—")}</li>
        <li><strong>Country:</strong> ${escapeHtml(input.country)}</li>
        <li><strong>Referral code:</strong> ${escapeHtml(input.referralCode)}</li>
      </ul>
      <p style="margin:24px 0">
        <a href="${escapeHtml(url)}"
           style="display:inline-block;background:#B8965D;color:#111;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:600">
          Open affiliate admin
        </a>
      </p>
    </div>
  `;

  let sent = 0;
  let failed = 0;
  for (const to of recipients) {
    try {
      await sendGmailEmail({ to, subject, text, html });
      sent += 1;
    } catch (error) {
      failed += 1;
      console.error("[affiliate] application notify failed", { to, error });
    }
  }
  return { sent, failed };
}
