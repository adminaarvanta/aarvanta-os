import { redirect } from "next/navigation";
import { LoginPageShell } from "@/components/auth/login-page";
import { sanitizeNextPath } from "@/lib/auth/cookie-options";
import { getSessionFromCookies } from "@/lib/auth/session";
import { isDemoMode } from "@/lib/config/app-mode";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next } = await searchParams;
  const nextPath = sanitizeNextPath(next);

  if (isDemoMode()) {
    redirect(nextPath);
  }

  const session = await getSessionFromCookies();
  if (session) {
    redirect(nextPath);
  }

  return <LoginPageShell nextPath={nextPath} />;
}
