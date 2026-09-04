import { notFound } from "next/navigation";
import { EmailAtmosphere } from "@/components/outreach/email-os-ui";
import { canAccessEmailOutreachAsync } from "@/lib/channels/email-outreach-access";
import { getSessionContext } from "@/lib/tenant/context";

export default async function EmailOutreachLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getSessionContext();
  if (!(await canAccessEmailOutreachAsync(ctx.email, ctx.member))) {
    notFound();
  }

  return <EmailAtmosphere>{children}</EmailAtmosphere>;
}
