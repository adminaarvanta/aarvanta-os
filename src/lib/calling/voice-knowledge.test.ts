import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatPlaybookForRelay } from "@/lib/calling/call-playbook";
import {
  callBriefingForRelay,
  isGenericBookingGoal,
  knowledgeSearchTopic,
  spokenFirstName,
  spokenVoiceBrand,
  voiceIdentityGreeting,
  voiceKnowledgeMode,
} from "@/lib/calling/voice-knowledge";
import { DEFAULT_FLOW_CONFIG } from "@/types/calling-agent";

describe("voice knowledge / first speech", () => {
  it("treats Book Meetings and the old KB dump string as non-topics", () => {
    assert.equal(isGenericBookingGoal("Book Meetings"), true);
    assert.equal(isGenericBookingGoal("book a call"), true);
    assert.equal(isGenericBookingGoal(""), true);
    assert.equal(
      isGenericBookingGoal(
        "company overview products services pricing FAQ hours support what we do"
      ),
      true
    );
    assert.equal(
      isGenericBookingGoal("warehouse automation rollout for Northstar"),
      false
    );
  });

  it("does not search Knowledge Hub for a generic campaign goal", () => {
    assert.equal(knowledgeSearchTopic("Book Meetings", "book a call"), null);
    assert.equal(
      knowledgeSearchTopic(
        "Book Meetings",
        "Discuss Q3 logistics pricing for Acme"
      ),
      "Discuss Q3 logistics pricing for Acme"
    );
    assert.equal(callBriefingForRelay("Book Meetings"), "");
  });

  it("speaks an identity greeting immediately, not a booking ask", () => {
    const outbound = voiceIdentityGreeting({
      direction: "outbound",
      agentName: "Ava",
      brandName: "Aarvanta",
      firstName: "Priya Sharma",
    });
    assert.match(outbound, /^Hi Priya, it's Ava with Aarvanta\./);
    assert.match(outbound, /Is now okay/);
    assert.doesNotMatch(outbound, /book|meeting|calendar|schedule/i);

    const inbound = voiceIdentityGreeting({
      direction: "inbound",
      agentName: "Ava",
      brandName: "Aarvanta",
    });
    assert.match(inbound, /you've reached Aarvanta/);
    assert.doesNotMatch(inbound, /book|meeting/i);
  });

  it("does not greet as a Launch OS workspace brand", () => {
    assert.equal(spokenVoiceBrand("CandleCrafted"), "Aarvanta");
    assert.equal(spokenVoiceBrand("AARVANTA LIMITED"), "Aarvanta");
  });

  it("ignores phone numbers and placeholders as first names", () => {
    assert.equal(spokenFirstName("+17167032574"), "");
    assert.equal(spokenFirstName("Unknown Contact"), "");
    assert.equal(spokenFirstName("James"), "James");
  });

  it("stays bare when no digest is present", () => {
    assert.equal(voiceKnowledgeMode(""), "bare");
    assert.equal(voiceKnowledgeMode("  "), "bare");
    assert.equal(voiceKnowledgeMode("[FAQ] We ship next-day."), "informed");
  });

  it("does not dump playbook sample lines for the relay to recite", () => {
    const brief = formatPlaybookForRelay(DEFAULT_FLOW_CONFIG);
    assert.match(brief, /Greeting/);
    assert.doesNotMatch(brief, /Example line/);
    assert.doesNotMatch(brief, /Is this a good time for a quick 2-minute/);
  });
});
