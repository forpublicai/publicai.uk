/**
 * Smoke test for /api/chat
 *
 * Usage:
 *   npx tsx scripts/smoke-test.ts
 *
 * Requires the dev server to be running on localhost:3000
 * and ANTHROPIC_API_KEY to be set in the environment.
 */
export {}; // make this a module so top-level await is valid

const BASE = process.env.BASE_URL ?? "http://localhost:3000";

type TestCase = {
  name: string;
  body: unknown;
  expectStatus: number;
  expectText?: string;
};

const cases: TestCase[] = [
  // Happy paths
  {
    name: "BBC mode — basic question",
    body: {
      mode: "bbc",
      messages: [{ role: "user", content: "What's happening with the BBC licence fee?" }],
    },
    expectStatus: 200,
  },
  {
    name: "Justice mode — basic question",
    body: {
      mode: "justice",
      messages: [{ role: "user", content: "What is small claims court?" }],
    },
    expectStatus: 200,
  },
  {
    name: "Planning mode — basic question",
    body: {
      mode: "planning",
      messages: [{ role: "user", content: "What does permitted development mean?" }],
    },
    expectStatus: 200,
  },
  // Error cases
  {
    name: "Invalid mode → 400",
    body: {
      mode: "invalid",
      messages: [{ role: "user", content: "Hello" }],
    },
    expectStatus: 400,
  },
  {
    name: "Missing messages → 400",
    body: { mode: "bbc", messages: [] },
    expectStatus: 400,
  },
  {
    name: "Message too long → 400",
    body: {
      mode: "bbc",
      messages: [{ role: "user", content: "x".repeat(501) }],
    },
    expectStatus: 400,
  },
  {
    name: "Bad JSON → 400",
    body: null, // sent as invalid JSON manually
    expectStatus: 400,
  },
];

let passed = 0;
let failed = 0;

for (const tc of cases) {
  let res: Response;
  try {
    res = await fetch(`${BASE}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: tc.body === null ? "{{invalid json}}" : JSON.stringify(tc.body),
    });
  } catch (err) {
    console.error(`  FAIL [${tc.name}] — fetch error: ${err}`);
    failed++;
    continue;
  }

  if (res.status !== tc.expectStatus) {
    console.error(
      `  FAIL [${tc.name}] — expected ${tc.expectStatus}, got ${res.status}`
    );
    failed++;
    continue;
  }

  // For happy paths, drain the stream and check we got some bytes back
  if (tc.expectStatus === 200) {
    const text = await res.text();
    if (!text || text.length < 10) {
      console.error(`  FAIL [${tc.name}] — empty response body`);
      failed++;
      continue;
    }
  }

  console.log(`  PASS [${tc.name}]`);
  passed++;
}

console.log(`\n${passed}/${passed + failed} tests passed`);
process.exit(failed > 0 ? 1 : 0);
