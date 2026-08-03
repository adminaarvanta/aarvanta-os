import { redirect } from "next/navigation";

/** Legacy Approvals — redirects to Waiting for You. */
export default function WorkforceApprovalsRedirectPage() {
  redirect("/workforce/waiting");
}

export const metadata = { title: "Waiting for You" };
