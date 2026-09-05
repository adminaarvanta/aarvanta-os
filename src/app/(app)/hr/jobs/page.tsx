import { redirect } from "next/navigation";

/** Jobs posting UI was removed from People; ATS lives under Candidates. */
export default function HrJobsRedirectPage() {
  redirect("/hr/candidates");
}
