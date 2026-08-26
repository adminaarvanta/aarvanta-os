import type { ReactNode } from "react";
import { CrmAtmosphere } from "@/components/crm/crm-shell";

export default function CrmLayout({ children }: { children: ReactNode }) {
  return <CrmAtmosphere>{children}</CrmAtmosphere>;
}
