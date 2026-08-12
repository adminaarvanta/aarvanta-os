import { NavigationProvider } from "@/components/layout/navigation-provider";
import { ScrollRestoration } from "@/components/layout/scroll-restoration";
import { SidebarCollapseProvider } from "@/components/layout/sidebar-collapse";
import { DemoTourProvider } from "@/components/demo/demo-tour-provider";
import { PlanProvider } from "@/components/billing/plan-context";
import { PlanAwareMain } from "@/components/billing/plan-aware-main";
import type { EntitlementsClient } from "@/lib/billing/entitlements";
import type { Organization, Workspace } from "@/types/tenant";
import { AppShellFrame } from "@/components/layout/app-shell-frame";

export function AppShell({
  production,
  tenant,
  userName,
  userRole,
  userId,
  hasSeenWalkthrough = false,
  whatsappUnread,
  voiceUnread,
  entitlements,
  children,
}: {
  production: boolean;
  tenant?: {
    organization: Organization;
    workspace: Workspace;
    workspaces: Workspace[];
  } | null;
  userName?: string;
  userRole?: string;
  userId?: string | null;
  hasSeenWalkthrough?: boolean;
  whatsappUnread?: number;
  voiceUnread?: number;
  entitlements?: EntitlementsClient | null;
  children: React.ReactNode;
}) {
  const autoStartWalkthrough =
    production &&
    entitlements?.planId === "free" &&
    !hasSeenWalkthrough;

  return (
    <PlanProvider value={entitlements ?? null}>
      <NavigationProvider>
        <SidebarCollapseProvider>
          <DemoTourProvider
            userId={userId ?? null}
            hasSeenWalkthrough={hasSeenWalkthrough}
            autoStartWalkthrough={autoStartWalkthrough}
          >
            <ScrollRestoration />
            <AppShellFrame
              production={production}
              tenant={tenant}
              userName={userName}
              userRole={userRole}
              whatsappUnread={whatsappUnread}
              voiceUnread={voiceUnread}
            >
              <PlanAwareMain>{children}</PlanAwareMain>
            </AppShellFrame>
          </DemoTourProvider>
        </SidebarCollapseProvider>
      </NavigationProvider>
    </PlanProvider>
  );
}
