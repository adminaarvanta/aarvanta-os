import { redirect } from "next/navigation";

/** Referrals and affiliate dashboard share one Partners hub. */
export default function ReferralsRedirectPage() {
  redirect("/partners");
}
