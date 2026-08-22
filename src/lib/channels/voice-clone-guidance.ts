/** Guidance for Instant Voice Clone samples (ElevenLabs IVC). */

export const VOICE_CLONE_TIPS = [
  "One speaker only — your voice, in a natural phone-call tone (not a monotone read).",
  "Quiet room: no music, TV, traffic, or other people in the background.",
  "Sit about 15–30 cm from the mic; keep volume even — no whispering or shouting.",
  "Record 1–2 minutes. Under 30 seconds is usually too thin; more than 3 minutes rarely helps.",
  "Mix statements, questions, and a few numbers or names the agent will actually say.",
  "Avoid echoey bathrooms, car audio, auto-tune, and overlapping speakers.",
] as const;

export const VOICE_CLONE_SCRIPT = `Hi, thanks for calling. This is a quick sample so we can clone my voice for our AI receptionist.

I usually speak at a calm, friendly pace — not rushed, not overly formal. Could I ask if now is a good time for a two-minute conversation?

Great. We help teams answer inbound calls, book meetings, and follow up with customers. Our hours are nine to five, Monday through Friday. If you need a callback, I can note your number — for example, four one five, five five five, zero one two three.

Is there anything else I can help with today? If not, thanks so much for your time. Take care, and goodbye.`;
