import { redirect } from "next/navigation";

/** AI Team home now lives under Automation → Ask. Nested /workforce/* routes stay. */
export default function WorkforceRedirectPage() {
  redirect("/automation?view=ask");
}

export const metadata = { title: "Automation" };
