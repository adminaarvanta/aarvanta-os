import { redirect } from "next/navigation";

/** Partner dashboard lives at /partners. */
export default function AffiliateDashboardRedirectPage() {
  redirect("/partners");
}
