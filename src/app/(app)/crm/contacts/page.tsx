import { redirect } from "next/navigation";

/** Legacy Contacts list → People. */
export default function ContactsRedirectPage() {
  redirect("/crm/people");
}

export const metadata = { title: "People" };
