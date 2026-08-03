import { redirect } from "next/navigation";

/** Legacy autonomous queue — Jobs hub replaces it. */
export default function AutonomousRedirectPage() {
  redirect("/workforce/jobs");
}

export const metadata = { title: "AI Team Jobs" };
