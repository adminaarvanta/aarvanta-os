import { redirect } from "next/navigation";

type PageProps = {
  searchParams: Promise<{
    start?: string;
    contactId?: string;
    dealId?: string;
    conversationId?: string;
  }>;
};

/** Legacy Tasks hub — redirects to Jobs (or Chat when starting). */
export default async function WorkforceTasksRedirectPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  if (params.start === "1") {
    const q = new URLSearchParams();
    if (params.contactId) q.set("contactId", params.contactId);
    if (params.dealId) q.set("dealId", params.dealId);
    if (params.conversationId) q.set("conversationId", params.conversationId);
    const qs = q.toString();
    redirect(qs ? `/workforce?${qs}` : "/workforce");
  }
  redirect("/workforce/jobs");
}

export const metadata = { title: "AI Team Jobs" };
