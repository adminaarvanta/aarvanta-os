/**
 * Ask Twilio to complete an in-flight call. No-ops for demo/simulated SIDs.
 */
export async function hangupTwilioCall(callSid: string | undefined): Promise<void> {
  if (!callSid || callSid.startsWith("sim_")) return;

  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  if (!accountSid || !authToken) return;

  await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls/${callSid}.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ Status: "completed" }),
    }
  ).catch((error) => {
    console.warn("[twilio] hangup failed", error);
  });
}
