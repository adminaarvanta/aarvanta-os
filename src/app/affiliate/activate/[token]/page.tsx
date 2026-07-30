import { AffiliateActivateClient } from "@/components/affiliate/affiliate-activate-client";

type PageProps = { params: Promise<{ token: string }> };

export default async function AffiliateActivatePage({ params }: PageProps) {
  const { token } = await params;
  return <AffiliateActivateClient token={token} />;
}

export const metadata = { title: "Activate partner account" };
