import { redirect } from "next/navigation";
import { RegisterPageShell } from "@/components/auth/register-page";
import { sanitizeNextPath } from "@/lib/auth/cookie-options";
import { getSessionFromCookies } from "@/lib/auth/session";
import { isSsoConfigured } from "@/lib/auth/sso-oidc";
import { isDemoMode } from "@/lib/config/app-mode";

export const metadata = { title: "Create free account · Aarvanta" };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const nextPath = sanitizeNextPath(next ?? "/dashboard");

  if (!isDemoMode()) {
    const session = await getSessionFromCookies().catch(() => null);
    if (session) redirect(nextPath);
  }

  return (
    <RegisterPageShell
      nextPath={nextPath}
      googleEnabled={isSsoConfigured("google")}
    />
  );
}
