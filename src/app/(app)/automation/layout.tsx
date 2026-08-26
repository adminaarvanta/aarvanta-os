import type { ReactNode } from "react";
import { AutomationShell } from "@/components/automation/automation-shell";

export default function AutomationLayout({ children }: { children: ReactNode }) {
  return <AutomationShell>{children}</AutomationShell>;
}
