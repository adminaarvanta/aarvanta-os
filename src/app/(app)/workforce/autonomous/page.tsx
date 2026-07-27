import { redirect } from "next/navigation";

/** Legacy autonomous queue — goal-first Tasks hub replaces it. */
export default function AutonomousRedirectPage() {
  redirect("/workforce/tasks");
}

export const metadata = { title: "Workforce Tasks" };
