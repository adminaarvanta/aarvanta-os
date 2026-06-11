import { AppSidebar } from "@/components/layout/app-sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { NavigationProvider } from "@/components/layout/navigation-provider";

export function AppShell({
  production,
  children,
}: {
  production: boolean;
  children: React.ReactNode;
}) {
  return (
    <NavigationProvider>
      <div className="flex h-[100dvh] overflow-hidden bg-black">
        <AppSidebar production={production} />
        <main className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden pb-[calc(3.75rem+env(safe-area-inset-bottom,0px))] md:pb-0">
          {children}
        </main>
        <MobileNav production={production} />
      </div>
    </NavigationProvider>
  );
}
