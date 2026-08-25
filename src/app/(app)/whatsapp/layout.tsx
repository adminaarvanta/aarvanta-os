import { notFound } from "next/navigation";
import { canAccessWhatsAppOs } from "@/lib/channels/whatsapp-access";
import { getSessionContext } from "@/lib/tenant/context";

export default async function WhatsAppOsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getSessionContext();
  if (!canAccessWhatsAppOs(ctx.email)) {
    notFound();
  }
  return children;
}
