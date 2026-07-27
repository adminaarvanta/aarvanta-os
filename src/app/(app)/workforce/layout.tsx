import type { ReactNode } from "react";
import { WorkforceShell } from "@/components/workforce/workforce-shell";

export default function WorkforceLayout({ children }: { children: ReactNode }) {
  return <WorkforceShell>{children}</WorkforceShell>;
}
