import type { ReactNode } from "react";
import { HrNav } from "@/components/hr/hr-nav";
import { HrShell } from "@/components/hr/hr-ui";
import { PageFrame, PageScroll } from "@/components/layout/page-scroll";

export default function HrLayout({ children }: { children: ReactNode }) {
  return (
    <HrShell>
      <PageFrame>
        <HrNav />
        <PageScroll className="p-4 sm:p-6">
          <div className="hr-tab-enter mx-auto max-w-6xl">{children}</div>
        </PageScroll>
      </PageFrame>
    </HrShell>
  );
}
