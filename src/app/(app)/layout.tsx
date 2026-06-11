import { AppShell } from "@/components/layout/app-shell";
import { isProductionMode } from "@/lib/config/app-mode";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell production={isProductionMode()}>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
    </AppShell>
  );
}
