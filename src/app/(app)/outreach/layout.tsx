import { notFound } from "next/navigation";
import { EmailOsNav } from "@/components/outreach/email-os-nav";
import { canAccessEmailOutreach } from "@/lib/channels/email-outreach-access";
import { getSessionContext } from "@/lib/tenant/context";

export default async function EmailOutreachLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getSessionContext();
  if (!canAccessEmailOutreach(ctx.email)) {
    notFound();
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-gradient-to-b from-[rgba(14,165,198,0.05)] via-background to-[rgba(26,47,89,0.04)]">
      <EmailOsNav />
      <div className="flex min-h-0 flex-1 flex-col overflow-auto">{children}</div>
    </div>
  );
}
