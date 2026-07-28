import { NavigationProvider } from "@/components/layout/navigation-provider";
import { ScrollRestoration } from "@/components/layout/scroll-restoration";
import { SidebarCollapseProvider } from "@/components/layout/sidebar-collapse";
import { DemoTourProvider } from "@/components/demo/demo-tour-provider";
import type { Organization, Workspace } from "@/types/tenant";
import { AppShellFrame } from "@/components/layout/app-shell-frame";

export function AppShell({
  production,
  tenant,
  userName,
  userRole,
  whatsappUnread,
  voiceUnread,
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
  whatsappUnread?: number;
  voiceUnread?: number;
  children: React.ReactNode;
}) {
  return (
    <NavigationProvider>
      <SidebarCollapseProvider>
        <DemoTourProvider>
          <ScrollRestoration />
          <AppShellFrame
            production={production}
            tenant={tenant}
            userName={userName}
            userRole={userRole}
            whatsappUnread={whatsappUnread}
            voiceUnread={voiceUnread}
          >
            {children}
          </AppShellFrame>
        </DemoTourProvider>
      </SidebarCollapseProvider>
    </NavigationProvider>
  );
}
