import type { ReactNode } from "react";
import { FinanceNav } from "@/components/finance/finance-nav";
import { FinanceShell } from "@/components/finance/finance-ui";
import { PageFrame, PageScroll } from "@/components/layout/page-scroll";

export default function FinanceLayout({ children }: { children: ReactNode }) {
  return (
    <FinanceShell>
      <PageFrame>
        <FinanceNav />
        <PageScroll className="p-4 sm:p-6">
          <div className="finance-tab-enter mx-auto max-w-6xl">{children}</div>
        </PageScroll>
      </PageFrame>
    </FinanceShell>
  );
}
