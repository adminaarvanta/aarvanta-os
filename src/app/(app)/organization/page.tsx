import { redirect } from "next/navigation";

/** Organization hierarchy now lives on Team. */
export default function OrganizationRedirectPage() {
  redirect("/team?tab=hierarchy");
}
