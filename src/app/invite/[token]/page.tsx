import { InviteAcceptClient } from "@/components/tenant/invite-accept-client";

type PageProps = { params: Promise<{ token: string }> };

export default async function InviteAcceptPage({ params }: PageProps) {
  const { token } = await params;
  return <InviteAcceptClient token={token} />;
}

export const metadata = { title: "Accept invitation" };
