import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applyElevenLabsPhoneQuality,
  elevenLabsVoiceBaseId,
  isElevenLabsVoiceAlreadyTuned,
  LEGACY_ELEVENLABS_RACHEL_VOICE_ID,
  upgradeLegacyRachelVoice,
} from "@/lib/channels/elevenlabs-relay-voice";
import { resolveVoiceCallingConfig } from "@/lib/channels/voice-calling-config";
import { defaultVoiceIdFor, voicesForProvider } from "@/lib/channels/voice-catalog";
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

  it("lists Jessica first for ElevenLabs en-US", () => {
    assert.equal(voicesForProvider("ElevenLabs", "en-US")[0]?.id, DEFAULT_ELEVENLABS_VOICE_ID);
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

  it("remaps saved legacy Rachel to Jessica with Turbo phone quality", () => {
    assert.equal(upgradeLegacyRachelVoice(LEGACY_ELEVENLABS_RACHEL_VOICE_ID), DEFAULT_ELEVENLABS_VOICE_ID);
    assert.equal(
      upgradeLegacyRachelVoice("21m00Tcm4TlvDq8ikWAM-turbo_v2_5-0.95_0.38_0.82"),
      DEFAULT_ELEVENLABS_VOICE_ID
    );

    const fromCurated = resolveVoiceCallingConfig({
      voiceTtsProvider: "ElevenLabs",
      voiceId: LEGACY_ELEVENLABS_RACHEL_VOICE_ID,
      voiceLanguage: "en-US",
    });
    assert.equal(
      fromCurated.voice,
      "cgSgspJ2msm6clMCkdW9-turbo_v2_5-0.95_0.38_0.82"
    );
    assert.equal(elevenLabsVoiceBaseId(fromCurated.voice), DEFAULT_ELEVENLABS_VOICE_ID);

    const fromCustom = resolveVoiceCallingConfig({
      voiceTtsProvider: "ElevenLabs",
      voiceId: "__custom__",
      voiceCustomId: "21m00Tcm4TlvDq8ikWAM-turbo_v2_5-0.95_0.38_0.82",
      voiceLanguage: "en-US",
    });
    assert.equal(
      fromCustom.voice,
      "cgSgspJ2msm6clMCkdW9-turbo_v2_5-0.95_0.38_0.82"
    );
  });

  it("does not remap already-tuned custom ids or Amazon/Google voices", () => {
    const tunedSarah = "EXAVITQu4vr4xnSDxMaL-flash_v2_5-1.0_0.7_0.8";
    assert.equal(upgradeLegacyRachelVoice(tunedSarah), tunedSarah);

    const custom = resolveVoiceCallingConfig({
      voiceTtsProvider: "ElevenLabs",
      voiceId: "__custom__",
      voiceCustomId: tunedSarah,
      voiceLanguage: "en-US",
    });
    assert.equal(custom.voice, tunedSarah);

    const amazon = resolveVoiceCallingConfig({
      voiceTtsProvider: "Amazon",
      voiceId: "Joanna-Neural",
      voiceLanguage: "en-US",
    });
    assert.equal(amazon.provider, "Amazon");
    assert.equal(amazon.voice, "Joanna-Neural");

    const google = resolveVoiceCallingConfig({
      voiceTtsProvider: "Google",
      voiceId: "en-US-Journey-O",
      voiceLanguage: "en-US",
    });
    assert.equal(google.provider, "Google");
    assert.equal(google.voice, "en-US-Journey-O");
  });
});
