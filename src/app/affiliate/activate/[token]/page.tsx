import { AffiliateActivateClient } from "@/components/affiliate/affiliate-activate-client";

type PageProps = { params: Promise<{ token: string }> };

function normalizeTokenParam(raw: string): string {
  let token = raw.trim();
  try {
    if (/%[0-9a-fA-F]{2}/.test(token)) {
      token = decodeURIComponent(token);
    }
  } catch {
    /* keep */
  }
  return token.trim();
}

export default async function AffiliateActivatePage({ params }: PageProps) {
  const { token: raw } = await params;
  const token = normalizeTokenParam(raw);
  return <AffiliateActivateClient token={token} />;
}

export const metadata = { title: "Activate partner account" };
