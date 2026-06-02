import { AppSidebar } from "@/components/layout/app-sidebar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#FCF9F2]">
      <AppSidebar />
      <main className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
