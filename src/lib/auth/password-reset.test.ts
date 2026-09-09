import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import {
  clearPasswordResetMemoryForTests,
  completePasswordReset,
  expirePasswordResetCodeForTests,
  generateResetCode,
  getPasswordResetRecord,
  hashResetCode,
  INVALID_CODE_MESSAGE,
  issueResetCode,
  requestPasswordReset,
  RESET_MAX_SENDS_PER_HOUR,
  RESET_MAX_VERIFY_ATTEMPTS,
  RESET_SEND_COOLDOWN_MS,
  resetCodesMatch,
  verifyResetCode,
} from "@/lib/auth/password-reset";
import {
  upsertUserPassword,
  verifyUserPassword,
} from "@/lib/auth/user-credentials";

let seq = 0;
function testEmail(label: string) {
  seq += 1;
  return `${label}.${seq}@reset.test`;
}

describe("reset code hashing", () => {
  it("accepts the same 6-digit code, including spaced input", () => {
    const hash = hashResetCode("123456");
    assert.equal(resetCodesMatch("123456", hash), true);
    assert.equal(resetCodesMatch("123 456", hash), true);
    assert.equal(resetCodesMatch("000000", hash), false);
  });

  it("generates zero-padded 6-digit codes", () => {
    for (let i = 0; i < 25; i += 1) {
      assert.match(generateResetCode(), /^\d{6}$/);
    }
  });
});

describe("password reset codes", () => {
  beforeEach(() => {
    clearPasswordResetMemoryForTests();
  });

  it("issues a code that verifies and then sets a new password", async () => {
    const email = testEmail("happy");
    await upsertUserPassword({
      email,
      userId: "user_reset_happy",
      password: "oldpassword",
    });

    const issued = await issueResetCode({
      email,
      userId: "user_reset_happy",
    });
    assert.equal(issued.status, "issued");
    if (issued.status !== "issued") return;

    const verified = await verifyResetCode(email, issued.code);
    assert.equal(verified.ok, true);

    const completed = await completePasswordReset({
      email,
      code: issued.code,
      password: "newpassword",
      confirmPassword: "newpassword",
    });
    assert.equal(completed.ok, true);
    assert.equal(await getPasswordResetRecord(email), null);

    const creds = await verifyUserPassword(email, "newpassword");
    assert.ok(creds);
    assert.equal(await verifyUserPassword(email, "oldpassword"), null);
  });

  it("rejects expired codes", async () => {
    const email = testEmail("expired");
    const issued = await issueResetCode({
      email,
      userId: "user_reset_expired",
    });
    assert.equal(issued.status, "issued");
    if (issued.status !== "issued") return;

    await expirePasswordResetCodeForTests(email);
    const verified = await verifyResetCode(email, issued.code);
    assert.equal(verified.ok, false);
    if (verified.ok) return;
    assert.equal(verified.message, INVALID_CODE_MESSAGE);
    assert.equal(await getPasswordResetRecord(email), null);
  });

  it("locks out after too many failed attempts", async () => {
    const email = testEmail("lockout");
    const issued = await issueResetCode({
      email,
      userId: "user_reset_lockout",
    });
    assert.equal(issued.status, "issued");
    if (issued.status !== "issued") return;

    const wrong = issued.code === "999999" ? "888888" : "999999";
    for (let i = 0; i < RESET_MAX_VERIFY_ATTEMPTS; i += 1) {
      const failed = await verifyResetCode(email, wrong);
      assert.equal(failed.ok, false);
    }

    const after = await verifyResetCode(email, issued.code);
    assert.equal(after.ok, false);
    assert.equal(await getPasswordResetRecord(email), null);
  });

  it("throttles resends within the cooldown and hourly cap", async () => {
    const email = testEmail("throttle");
    const now = 1_700_000_000_000;
    const first = await issueResetCode({
      email,
      userId: "user_reset_throttle",
      now,
    });
    assert.equal(first.status, "issued");

    const cooldown = await issueResetCode({
      email,
      userId: "user_reset_throttle",
      now: now + 1_000,
    });
    assert.equal(cooldown.status, "throttled");

    let latestNow = now;
    for (let i = 1; i < RESET_MAX_SENDS_PER_HOUR; i += 1) {
      latestNow += RESET_SEND_COOLDOWN_MS + 1_000;
      const next = await issueResetCode({
        email,
        userId: "user_reset_throttle",
        now: latestNow,
      });
      assert.equal(next.status, "issued");
    }

    const overCap = await issueResetCode({
      email,
      userId: "user_reset_throttle",
      now: latestNow + RESET_SEND_COOLDOWN_MS + 1_000,
    });
    assert.equal(overCap.status, "throttled");
  });

  it("does not store a code for unknown emails", async () => {
    const email = testEmail("unknown");
    const result = await requestPasswordReset(email);
    assert.equal(result.ok, true);
    assert.equal("code" in result, false);
    assert.equal(await getPasswordResetRecord(email), null);
  });

  it("creates a code for known accounts without returning it", async () => {
    const email = testEmail("known");
    await upsertUserPassword({
      email,
      userId: "user_reset_known",
      password: "oldpassword",
    });
    const result = await requestPasswordReset(email);
    assert.equal(result.ok, true);
    assert.equal("code" in result, false);
    assert.ok(await getPasswordResetRecord(email));
  });

  it("keeps the code when new passwords do not match", async () => {
    const email = testEmail("mismatch");
    const issued = await issueResetCode({
      email,
      userId: "user_reset_mismatch",
    });
    assert.equal(issued.status, "issued");
    if (issued.status !== "issued") return;

    const completed = await completePasswordReset({
      email,
      code: issued.code,
      password: "newpassword",
      confirmPassword: "different1",
    });
    assert.equal(completed.ok, false);
    if (completed.ok) return;
    assert.equal(completed.message, "Passwords do not match.");

    const verified = await verifyResetCode(email, issued.code);
    assert.equal(verified.ok, true);
  });
});
