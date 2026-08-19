import type { ReactNode } from "react";
import { PageFrame } from "@/components/layout/page-scroll";

export default function CrmLayout({ children }: { children: ReactNode }) {
  return <PageFrame>{children}</PageFrame>;
}
