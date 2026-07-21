import { isEmailConfigured } from "@/lib/channels/config";
import { sendGmailEmail } from "@/lib/channels/gmail-client";
import { isDemoMode } from "@/lib/config/app-mode";
import { ROLE_LABELS, type Invitation, type MemberRole } from "@/types/tenant";

export type InviteEmailResult =
  | { sent: true; acceptUrl: string }
  | { sent: false; acceptUrl: string; reason: string };

function appBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "https://os.aarvanta.co"
  );
}

export function invitationAcceptUrl(token: string): string {
  return `${appBaseUrl()}/invite/${token}`;
}

export async function sendInvitationEmail(input: {
  invitation: Invitation;
  organizationName: string;
  workspaceName: string;
}): Promise<InviteEmailResult> {
  const acceptUrl = invitationAcceptUrl(input.invitation.token);
  const roleLabel =
    ROLE_LABELS[input.invitation.role as MemberRole] ?? input.invitation.role;

  if (isDemoMode()) {
    console.info("[invite:demo] Would email invite", {
      to: input.invitation.email,
      acceptUrl,
    });
    return { sent: false, acceptUrl, reason: "demo_mode" };
  }

  if (!isEmailConfigured()) {
    return {
      sent: false,
      acceptUrl,
      reason: "email_not_configured",
    };
  }

  const subject = `You're invited to ${input.organizationName} on Aarvanta OS`;
  const text = [
    `Hi,`,
    ``,
    `${input.invitation.invitedByName} invited you to join ${input.organizationName}`,
    `(workspace: ${input.workspaceName}) as ${roleLabel}.`,
    ``,
    `Accept your invitation and create a password here:`,
    acceptUrl,
    ``,
    `This link expires on ${new Date(input.invitation.expiresAt).toUTCString()}.`,
    ``,
    `If you were not expecting this, you can ignore this email.`,
  ].join("\n");

  const html = `
    <div style="font-family:system-ui,-apple-system,sans-serif;line-height:1.5;color:#111;max-width:560px">
      <p>Hi,</p>
      <p>
        <strong>${escapeHtml(input.invitation.invitedByName)}</strong> invited you to join
        <strong>${escapeHtml(input.organizationName)}</strong>
        (workspace: ${escapeHtml(input.workspaceName)}) as
        <strong>${escapeHtml(roleLabel)}</strong>.
      </p>
      <p style="margin:24px 0">
        <a href="${escapeHtml(acceptUrl)}"
           style="display:inline-block;background:#B8965D;color:#111;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:600">
          Accept invitation
        </a>
      </p>
      <p style="font-size:13px;color:#555">
        Or open this link:<br/>
        <a href="${escapeHtml(acceptUrl)}">${escapeHtml(acceptUrl)}</a>
      </p>
      <p style="font-size:12px;color:#777">
        Expires ${escapeHtml(new Date(input.invitation.expiresAt).toUTCString())}.
        If you were not expecting this, ignore this email.
      </p>
    </div>
  `;

  try {
    await sendGmailEmail({
      to: input.invitation.email,
      subject,
      text,
      html,
    });
    return { sent: true, acceptUrl };
  } catch (error) {
    console.error("[invite] email send failed", error);
    return {
      sent: false,
      acceptUrl,
      reason: error instanceof Error ? error.message : "send_failed",
    };
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
