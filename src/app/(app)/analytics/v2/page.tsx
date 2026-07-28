import { redirect } from "next/navigation";

/** Analytics 2.0 metrics are folded into the primary `/analytics` dashboard. */
export default function AnalyticsV2RedirectPage() {
  redirect("/analytics");
}
