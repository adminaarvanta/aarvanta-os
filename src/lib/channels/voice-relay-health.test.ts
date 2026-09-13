import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  decideTwimlGreeting,
  relayHonorsSkipOpening,
  voiceRelayHealthUrl,
} from "@/lib/channels/voice-relay-health";

describe("voice relay skipOpening compatibility", () => {
  it("treats 1.7.2 as the old double-intro relay", () => {
    assert.equal(relayHonorsSkipOpening("1.7.2"), false);
    assert.equal(relayHonorsSkipOpening(""), false);
    assert.equal(relayHonorsSkipOpening(undefined), false);
  });

  it("treats 1.9.2 and later as skipOpening-aware", () => {
    assert.equal(relayHonorsSkipOpening("1.9.2"), true);
    assert.equal(relayHonorsSkipOpening("1.9.4"), true);
    assert.equal(relayHonorsSkipOpening("1.10.0"), true);
  });

  it("maps the live WSS URL to /health", () => {
    assert.equal(
      voiceRelayHealthUrl("wss://orbit.aarvanta.co/voice-relay/ws"),
      "https://orbit.aarvanta.co/voice-relay/health"
    );
  });

  it("keeps TwiML identity only when the relay will skip its opening", () => {
    const identity = "Hi Priya, it's Ava with Aarvanta. Is now okay?";
    const notice = "This call may be recorded for quality and training purposes.";

    assert.deepEqual(
      decideTwimlGreeting({
        relayHonorsSkipOpening: true,
        identityGreeting: identity,
        recordingNotice: notice,
      }),
      { welcome: `${notice} ${identity}`, skipOpening: true }
    );

    assert.deepEqual(
      decideTwimlGreeting({
        relayHonorsSkipOpening: false,
        identityGreeting: identity,
        recordingNotice: notice,
      }),
      { welcome: notice, skipOpening: false }
    );

    assert.deepEqual(
      decideTwimlGreeting({
        relayHonorsSkipOpening: false,
        identityGreeting: identity,
      }),
      { welcome: "", skipOpening: false }
    );
  });
});
