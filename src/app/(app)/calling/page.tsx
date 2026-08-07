import { redirect } from "next/navigation";

/** Dialer lives inside Voice OS. */
export default function CallingRedirectPage() {
  redirect("/voice/dialer");
}
