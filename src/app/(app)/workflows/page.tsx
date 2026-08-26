import { redirect } from "next/navigation";

/** Workflows hub is now the Automation home. Editor and runs stay at /workflows/[id]. */
export default function WorkflowsRedirectPage() {
  redirect("/automation");
}

export const metadata = { title: "Automation" };
