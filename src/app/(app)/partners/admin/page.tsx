import { redirect } from "next/navigation";

/** Admin stays on the affiliate admin surface. */
export default function PartnersAdminRedirectPage() {
  redirect("/affiliate/admin");
}
