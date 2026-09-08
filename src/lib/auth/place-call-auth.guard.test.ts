import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { sessionErrorResponse } from "@/lib/api/request";
import { SESSION_COOKIE, tokenFromCookieHeader } from "@/lib/auth/session";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");

function readRepo(...parts: string[]) {
  return readFileSync(join(repoRoot, ...parts), "utf8");
}

describe("sessionErrorResponse", () => {
  it("returns 401 only for the exact Unauthorized throw", async () => {
    const res = sessionErrorResponse(new Error("Unauthorized"));
    assert.equal(res.status, 401);
    const body = (await res.json()) as { error: { message: string } };
    assert.equal(body.error.message, "Authentication required");
  });

  it("does not treat datastore/membership failures as auth failures", async () => {
    const err = console.error;
    console.error = () => {};
    try {
      const res = sessionErrorResponse(new Error("8 RESOURCE_EXHAUSTED: quota"));
      assert.equal(res.status, 500);
      const body = (await res.json()) as { error: string };
      assert.match(body.error, /RESOURCE_EXHAUSTED/);
    } finally {
      console.error = err;
    }
  });

  it("does not 401 on errors that merely mention unauthorized", async () => {
    const err = console.error;
    console.error = () => {};
    try {
      const res = sessionErrorResponse(
        new Error("Twilio Voice failed (401): Authenticate")
      );
      assert.equal(res.status, 500);
    } finally {
      console.error = err;
    }
  });
});

describe("tokenFromCookieHeader", () => {
  it("reads the session cookie among other cookies", () => {
    const token = tokenFromCookieHeader(
      `other=1; ${SESSION_COOKIE}=abc.def.ghi; theme=dark`
    );
    assert.equal(token, "abc.def.ghi");
  });

  it("decodes URI-encoded JWT characters", () => {
    const token = tokenFromCookieHeader(`${SESSION_COOKIE}=a%2Bb.c`);
    assert.equal(token, "a+b.c");
  });
});

describe("place-call auth source guards", () => {
  it("does not swallow cookies()/headers() in session.ts", () => {
    const src = readRepo("src/lib/auth/session.ts");
    assert.equal(
      /try\s*\{[\s\S]{0,160}cookies\s*\(/.test(src),
      false,
      "cookies() must not be inside try/catch — that breaks production prerender"
    );
    assert.equal(
      /try\s*\{[\s\S]{0,160}headers\s*\(/.test(src),
      false,
      "headers() must not be inside try/catch — that breaks production prerender"
    );
    assert.match(src, /await cookies\(\)/);
  });

  it("keeps Edge middleware.ts so Vercel production can deploy", () => {
    assert.equal(existsSync(join(repoRoot, "src/middleware.ts")), true);
    assert.equal(existsSync(join(repoRoot, "src/proxy.ts")), false);
  });

  it("maps outbound session failures through sessionErrorResponse", () => {
    for (const file of [
      "src/app/api/calling/outbound/route.ts",
      "src/app/api/calling/schedule/route.ts",
      "src/app/api/voice/queue/call-now/route.ts",
    ]) {
      const src = readRepo(file);
      assert.match(src, /getSessionContextFromRequest/);
      assert.match(src, /sessionErrorResponse/);
      assert.equal(
        /catch\s*\{\s*return unauthorized\(\);?\s*\}/.test(src),
        false,
        `${file} must not map every session error to 401`
      );
    }
  });

  it("sends cookies on Dialer Place call fetches", () => {
    const src = readRepo("src/components/voice/voice-dialer.tsx");
    assert.match(
      src,
      /fetch\("\/api\/calling\/outbound"[\s\S]{0,120}credentials:\s*"include"/
    );
  });

  it("runs a production-mode Next build in CI", () => {
    const yml = readRepo(".github/workflows/ci.yml");
    assert.match(yml, /APP_MODE:\s*production/);
    assert.match(yml, /npm test/);
  });
});
