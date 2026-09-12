import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applyElevenLabsPhoneQuality,
  elevenLabsVoiceBaseId,
  isElevenLabsVoiceAlreadyTuned,
} from "@/lib/channels/elevenlabs-relay-voice";
import { resolveVoiceCallingConfig } from "@/lib/channels/voice-calling-config";
import { defaultVoiceIdFor } from "@/lib/channels/voice-catalog";
import { DEFAULT_ELEVENLABS_VOICE_ID } from "@/lib/channels/voice-relay-tts";

describe("ElevenLabs ConversationRelay phone quality", () => {
  it("upgrades a bare Rachel id to Turbo 2.5 with expressive settings", () => {
    const tuned = applyElevenLabsPhoneQuality("21m00Tcm4TlvDq8ikWAM");
    assert.equal(tuned, "21m00Tcm4TlvDq8ikWAM-turbo_v2_5-0.95_0.38_0.82");
    assert.equal(elevenLabsVoiceBaseId(tuned), "21m00Tcm4TlvDq8ikWAM");
  });

  it("leaves an already-tuned voice alone", () => {
    const custom = "EXAVITQu4vr4xnSDxMaL-flash_v2_5-1.0_0.7_0.8";
    assert.equal(applyElevenLabsPhoneQuality(custom), custom);
    assert.equal(isElevenLabsVoiceAlreadyTuned(custom), true);
  });

  it("does not treat Google/Amazon ids as ElevenLabs-tuned", () => {
    assert.equal(isElevenLabsVoiceAlreadyTuned("Joanna-Neural"), false);
  });

  it("defaults ElevenLabs en-US to Jessica, not Mark", () => {
    assert.equal(defaultVoiceIdFor("ElevenLabs", "en-US"), DEFAULT_ELEVENLABS_VOICE_ID);
    assert.equal(DEFAULT_ELEVENLABS_VOICE_ID, "cgSgspJ2msm6clMCkdW9");
  });

  it("applies Turbo tuning when resolving workspace ElevenLabs config", () => {
    const resolved = resolveVoiceCallingConfig({
      voiceTtsProvider: "ElevenLabs",
      voiceId: "cgSgspJ2msm6clMCkdW9",
      voiceLanguage: "en-US",
    });
    assert.equal(resolved.provider, "ElevenLabs");
    assert.equal(
      resolved.voice,
      "cgSgspJ2msm6clMCkdW9-turbo_v2_5-0.95_0.38_0.82"
    );
  });
});
