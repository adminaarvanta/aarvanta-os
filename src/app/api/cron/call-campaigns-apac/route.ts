import { runCallCampaignsCron } from "@/lib/calling/run-call-campaigns-cron";

export const runtime = "nodejs";

/** South Asia working-hours sweep (05:00 UTC ≈ 10:30 Asia/Kolkata). */
export async function GET(req: Request) {
  return runCallCampaignsCron(req);
}
