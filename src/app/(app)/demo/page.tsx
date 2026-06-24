import { redirect } from "next/navigation";

/** Legacy route — demo & onboarding live in the Help menu (header). */
export default function DemoPageRedirect() {
  redirect("/dashboard?help=open");
}

export const metadata = { title: "Help & Demo" };
