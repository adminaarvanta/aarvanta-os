/**
 * Simulate inbound messages on all channels (dev/demo).
 * Usage: node --env-file=.env.local scripts/simulate-channels.mjs [baseUrl]
 */
const base = process.argv[2] ?? "http://localhost:3000";

async function post(path, body, contentType = "application/json") {
  const init =
    contentType === "application/json"
      ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
      : {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams(body),
        };

  const res = await fetch(`${base}${path}`, init);
  const text = await res.text();
  console.log(path, res.status, text.slice(0, 200));
}

console.log("Simulating inbound channels at", base);

await post("/api/webhooks/whatsapp", {
  entry: [
    {
      changes: [
        {
          value: {
            contacts: [{ profile: { name: "WhatsApp Tester" } }],
            messages: [
              {
                id: `wa_${Date.now()}`,
                from: "447700900111",
                type: "text",
                text: { body: "Test WhatsApp inbound" },
              },
            ],
          },
        },
      ],
    },
  ],
});

await post(
  "/api/webhooks/twilio",
  {
    From: "+447700900222",
    Body: "Test SMS inbound",
    MessageSid: `SM_${Date.now()}`,
  },
  "form"
);

await post(
  "/api/webhooks/twilio",
  {
    CallSid: `CA_${Date.now()}`,
    From: "+447700900333",
    CallStatus: "completed",
    CallDuration: "45",
  },
  "form"
);

const testEmail = process.env.AUTH_EMAIL ?? "admin@aarvanta.co";
await post("/api/webhooks/email", {
  type: "email.received",
  data: {
    email_id: `em_${Date.now()}`,
    from: `Email Tester <${testEmail}>`,
    subject: "Test email inbound",
    text: "Hello from simulated email.",
  },
});

const sessionRes = await fetch(`${base}/api/chat/session`, { method: "POST" });
const { sessionId } = await sessionRes.json();
await post("/api/chat/messages", {
  sessionId,
  visitorName: "Website Visitor",
  content: "Test website chat inbound",
});

console.log("\nDone. Open inbox:", `${base}/inbox`);
