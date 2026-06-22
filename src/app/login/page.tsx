import { LoginPageShell } from "@/components/auth/login-page";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return <LoginPageShell nextPath={next ?? "/dashboard"} />;
}
