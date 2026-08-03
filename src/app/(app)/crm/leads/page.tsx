import { redirect } from "next/navigation";

/** Legacy Leads list → People (leads facet). */
export default function LeadsRedirectPage() {
  redirect("/crm/people?facet=leads");
}

export const metadata = { title: "People" };
