import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import test from "node:test";
import worker, {
  handleWaitlist,
  normalizeWhatsApp,
  resetRateLimitsForTests,
  validateWaitlist,
} from "../worker/index.js";

function validPayload(overrides = {}) {
  return {
    firstName: "Ada",
    email: "ada@example.com",
    whatsapp: "+234 801 234 5678",
    university: "University of Lagos",
    course: "Computer Science",
    consent: true,
    website: "",
    ...overrides,
  };
}

test("permanently redirects product connector paths to canonical domains", async () => {
  const cases = [
    ["/skills", "https://skillscanvas.co/"],
    ["/skills/passport?source=hub", "https://skillscanvas.co/passport?source=hub"],
    ["/concepts/ideas/42", "https://conceptsnexus.co/ideas/42"],
    ["/collab/capsules/demo", "https://collaboard.co/capsules/demo"],
    ["/vest/projects/demo", "https://vestden.co/projects/demo"],
  ];

  for (const [pathname, expectedLocation] of cases) {
    let assetCalls = 0;
    const response = await worker.fetch(new Request(`https://fixars.ai${pathname}`), {
      ASSETS: {
        fetch: async () => {
          assetCalls += 1;
          return new Response("unexpected", { status: 500 });
        },
      },
    });

    assert.equal(response.status, 308);
    assert.equal(response.headers.get("location"), expectedLocation);
    assert.equal(assetCalls, 0);
  }
});

test("does not redirect write requests through connector aliases", async () => {
  let assetCalls = 0;
  const response = await worker.fetch(
    new Request("https://fixars.ai/skills/passport", { method: "POST" }),
    {
      ASSETS: {
        fetch: async () => {
          assetCalls += 1;
          return new Response("missing", { status: 404 });
        },
      },
    },
  );

  assert.equal(response.status, 404);
  assert.equal(assetCalls, 1);
});

test("serves existing static assets without a fallback", async () => {
  const calls = [];
  const response = await worker.fetch(new Request("https://example.test/assets/app.js"), {
    ASSETS: {
      fetch: async (request) => {
        calls.push(new URL(request.url).pathname);
        return new Response("asset", { status: 200 });
      },
    },
  });

  assert.equal(response.status, 200);
  assert.deepEqual(calls, ["/assets/app.js"]);
});

test("falls back to index.html for an unknown app route", async () => {
  const calls = [];
  const response = await worker.fetch(
    new Request("https://example.test/flow/step-two?source=share", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async (request) => {
          const url = new URL(request.url);
          calls.push(url.pathname + url.search);
          return new Response(url.pathname === "/index.html" ? "app" : "missing", {
            status: url.pathname === "/index.html" ? 200 : 404,
          });
        },
      },
    },
  );

  assert.equal(response.status, 200);
  assert.deepEqual(calls, ["/flow/step-two?source=share", "/index.html"]);
});

test("does not turn missing API or write requests into the app shell", async () => {
  for (const request of [
    new Request("https://example.test/api/missing", { headers: { accept: "application/json" } }),
    new Request("https://example.test/flow", { method: "POST", headers: { accept: "text/html" } }),
  ]) {
    let calls = 0;
    const response = await worker.fetch(request, {
      ASSETS: {
        fetch: async () => {
          calls += 1;
          return new Response("missing", { status: 404 });
        },
      },
    });

    assert.equal(response.status, 404);
    assert.equal(calls, 1);
  }
});

test("validates and normalizes waitlist details", () => {
  const result = validateWaitlist(validPayload({ whatsapp: "0801 234 5678" }));
  assert.deepEqual(result.errors, {});
  assert.equal(result.values.whatsapp, "+2348012345678");
  assert.equal(normalizeWhatsApp("+44 (0) 7700 900123"), "+4407700900123");
});

test("returns field errors and does not contact the upstream form", async () => {
  let calls = 0;
  const request = new Request("https://example.test/api/waitlist", {
    method: "POST",
    headers: { "content-type": "application/json", origin: "https://example.test" },
    body: JSON.stringify(validPayload({ email: "not-an-email", consent: false })),
  });
  const response = await handleWaitlist(request, async () => {
    calls += 1;
    return new Response(null, { status: 200 });
  });
  const body = await response.json();
  assert.equal(response.status, 400);
  assert.ok(body.errors.email);
  assert.ok(body.errors.consent);
  assert.equal(calls, 0);
});

test("forwards accepted details to the existing Google Form and verifies its response", async () => {
  let forwarded;
  const request = new Request("https://example.test/api/waitlist", {
    method: "POST",
    headers: { "content-type": "application/json", origin: "https://example.test" },
    body: JSON.stringify(validPayload()),
  });
  const response = await handleWaitlist(request, async (_url, options) => {
    forwarded = options.body;
    return new Response("accepted", { status: 200 });
  });
  assert.equal(response.status, 201);
  assert.equal(forwarded.get("entry.1211410083"), "Ada");
  assert.equal(forwarded.get("entry.1093468283"), "ada@example.com | WhatsApp: +2348012345678");
  assert.equal(forwarded.get("entry.1556195189"), "Computer Science");
});

test("does not claim success when the upstream form fails", async () => {
  const request = new Request("https://example.test/api/waitlist", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(validPayload()),
  });
  const response = await handleWaitlist(request, async () => new Response("no", { status: 503 }));
  assert.equal(response.status, 502);
});

test("rejects cross-origin, oversized and non-JSON requests", async () => {
  const crossOrigin = await handleWaitlist(new Request("https://example.test/api/waitlist", {
    method: "POST",
    headers: { "content-type": "application/json", origin: "https://attacker.test" },
    body: JSON.stringify(validPayload()),
  }));
  assert.equal(crossOrigin.status, 403);

  const wrongType = await handleWaitlist(new Request("https://example.test/api/waitlist", {
    method: "POST",
    headers: { "content-type": "text/plain" },
    body: "hello",
  }));
  assert.equal(wrongType.status, 415);

  const oversized = await handleWaitlist(new Request("https://example.test/api/waitlist", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ value: "x".repeat(9000) }),
  }));
  assert.equal(oversized.status, 413);
});

test("throttles repeated submissions when the platform supplies an address", async () => {
  resetRateLimitsForTests();
  const fetcher = async () => new Response("accepted", { status: 200 });
  const responses = [];
  for (let attempt = 0; attempt < 6; attempt += 1) {
    responses.push(await handleWaitlist(new Request("https://example.test/api/waitlist", {
      method: "POST",
      headers: { "content-type": "application/json", "cf-connecting-ip": "192.0.2.1" },
      body: JSON.stringify(validPayload({ email: `ada${attempt}@example.com` })),
    }), fetcher));
  }
  assert.equal(responses.at(-1).status, 429);
  resetRateLimitsForTests();
});

test("emits the files required by Sites packaging", async () => {
  await access(new URL("../dist/client/index.html", import.meta.url));
  await access(new URL("../dist/server/index.js", import.meta.url));
  await access(new URL("../dist/.openai/hosting.json", import.meta.url));
});
