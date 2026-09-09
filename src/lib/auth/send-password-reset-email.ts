import { isEmailConfigured } from "@/lib/channels/config";
import {
  describeGmailSendFailure,
  sendGmailEmail,
} from "@/lib/channels/gmail-client";
import { isDemoMode } from "@/lib/config/app-mode";

export type PasswordResetEmailResult =
  | { sent: true }
  | { sent: false; reason: string };

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Email a 6-digit password reset code. Never log the code in production. */
export async function sendPasswordResetEmail(input: {
  email: string;
  code: string;
}): Promise<PasswordResetEmailResult> {
  if (isDemoMode()) {
    console.info("[password-reset:demo] Would email reset code", {
      to: input.email,
      code: input.code,
    });
    return { sent: false, reason: "demo_mode" };
  }

  if (!isEmailConfigured()) {
    return { sent: false, reason: "email_not_configured" };
  }

  const subject = "Your Aarvanta password reset code";
  const text = [
    `Use this code to reset your Aarvanta password:`,
    ``,
    input.code,
    ``,
    `This code expires in 10 minutes.`,
    ``,
    `If you did not ask to reset your password, you can ignore this email.`,
  ].join("\n");

  const html = `
    <div style="font-family:system-ui,-apple-system,sans-serif;line-height:1.5;color:#111;max-width:560px">
      <p>Use this code to reset your Aarvanta password:</p>
      <p style="margin:24px 0;font-size:32px;letter-spacing:8px;font-weight:700;font-family:ui-monospace,SFMono-Regular,Menlo,monospace">
        ${escapeHtml(input.code)}
      </p>
      <p style="font-size:13px;color:#555">This code expires in 10 minutes.</p>
      <p style="font-size:12px;color:#777">
        If you did not ask to reset your password, you can ignore this email.
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
    return { sent: true };
  } catch (error) {
    console.error("[password-reset] email send failed", error);
    return {
      sent: false,
      reason: describeGmailSendFailure(error),
    };
  }
}
