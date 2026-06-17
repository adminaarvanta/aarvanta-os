import { AppSidebar } from "@/components/layout/app-sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { NavigationProvider } from "@/components/layout/navigation-provider";
import { FounderCommandBar } from "@/components/founder/founder-command-bar";
import type { Organization, Workspace } from "@/types/tenant";

export function AppShell({
  production,
  tenant,
  children,
}: {
  production: boolean;
  tenant?: {
    organization: Organization;
    workspace: Workspace;
    workspaces: Workspace[];
  } | null;
  children: React.ReactNode;
}) {
  return (
    <NavigationProvider>
      <div className="flex h-[100dvh] overflow-hidden bg-black">
        <AppSidebar production={production} tenant={tenant} />
        <main className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden pb-[calc(3.75rem+env(safe-area-inset-bottom,0px))] md:pb-0">
          {children}
        </main>
        <MobileNav production={production} />
        <FounderCommandBar />
      </div>
    </NavigationProvider>
  );
}
