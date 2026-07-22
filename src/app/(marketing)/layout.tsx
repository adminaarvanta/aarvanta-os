import { MarketingFooter, MarketingNav } from "@/components/marketing/marketing-chrome";
import { isProductionMode } from "@/lib/config/app-mode";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const production = isProductionMode();

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <MarketingNav production={production} />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
    </div>
  );
}
