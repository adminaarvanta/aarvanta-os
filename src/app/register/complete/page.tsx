import { RegisterCompleteShell } from "@/components/auth/register-complete-page";
import { sanitizeNextPath } from "@/lib/auth/cookie-options";

export const metadata = { title: "Complete signup · Aarvanta" };

export default async function RegisterCompletePage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const nextPath = sanitizeNextPath(next ?? "/build");
  return <RegisterCompleteShell nextPath={nextPath} />;
}
