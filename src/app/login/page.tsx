import { redirect } from "next/navigation";
import { LoginPageShell } from "@/components/auth/login-page";
import { isDemoMode } from "@/lib/config/app-mode";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const nextPath = next ?? "/dashboard";

  if (isDemoMode()) {
    redirect(nextPath);
  }

  return <LoginPageShell nextPath={nextPath} />;
}
