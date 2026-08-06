import { redirect } from "next/navigation";

/** Dialer lives inside Voice OS Settings. */
export default function CallingRedirectPage() {
  redirect("/voice/settings");
}
