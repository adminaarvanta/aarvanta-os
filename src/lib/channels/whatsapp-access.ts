/** WhatsApp OS is intentionally limited to the platform operator account. */
export const WHATSAPP_OS_EMAIL = "admin@aarvanta.co";

export function canAccessWhatsAppOs(email: string | null | undefined): boolean {
  return email?.trim().toLowerCase() === WHATSAPP_OS_EMAIL;
}
