import type { ReactNode } from "react";
import { WorkflowShell } from "@/components/workflow/workflow-shell";

export default function WorkflowsLayout({ children }: { children: ReactNode }) {
  return <WorkflowShell>{children}</WorkflowShell>;
}
