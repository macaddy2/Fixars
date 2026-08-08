import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import test from "node:test";
import worker from "../worker/index.js";

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

test("emits the files required by Sites packaging", async () => {
  await access(new URL("../dist/client/index.html", import.meta.url));
  await access(new URL("../dist/server/index.js", import.meta.url));
  await access(new URL("../dist/.openai/hosting.json", import.meta.url));
});
