import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

/**
 * HTTP-level tests: call the real route handlers with real Request objects against a
 * real SQLite file. Dropping the cached connection simulates a server restart.
 */
let dir: string;
let routes: Record<string, any>;

const call = async (handler: (...a: any[]) => Promise<Response>, url: string, init?: RequestInit, ctx?: unknown) => {
  const res = await handler(new Request(`http://localhost${url}`, init), ctx);
  return { status: res.status, body: await res.json() };
};
const post = (body: unknown) => ({ method: "POST", body: JSON.stringify(body) });
const restartServer = () => {
  const g = globalThis as { __coyDb?: { close(): void } };
  g.__coyDb?.close();
  delete g.__coyDb;
};

before(async () => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "coy-api-"));
  process.env.DATABASE_FILE = path.join(dir, "api.db");
  routes = {
    feed: await import("../src/app/api/feed/route"),
    swipe: await import("../src/app/api/swipe/route"),
    undo: await import("../src/app/api/swipe/undo/route"),
    matches: await import("../src/app/api/matches/route"),
    stats: await import("../src/app/api/stats/route"),
    blocks: await import("../src/app/api/blocks/route"),
    reports: await import("../src/app/api/reports/route"),
    profile: await import("../src/app/api/profiles/[id]/route"),
    filters: await import("../src/app/api/filters/route"),
    me: await import("../src/app/api/me/route"),
  };
});

after(() => {
  restartServer();
  fs.rmSync(dir, { recursive: true, force: true });
});

test("GET /api/feed returns profiles without leaking like data", async () => {
  const { status, body } = await call(routes.feed.GET, "/api/feed?limit=50");
  assert.equal(status, 200);
  assert.ok(body.profiles.length >= 30);
  assert.ok(!/like/i.test(JSON.stringify(body)));
});

test("GET /api/feed rejects bad params with 400", async () => {
  assert.equal((await call(routes.feed.GET, "/api/feed?limit=abc")).status, 400);
  assert.equal((await call(routes.feed.GET, "/api/feed?minAge=30&maxAge=20")).status, 400);
  assert.equal((await call(routes.feed.GET, "/api/feed?limit=0")).status, 400);
});

test("GET /api/feed applies filters from the query string", async () => {
  const { body } = await call(routes.feed.GET, "/api/feed?limit=50&city=Kolkata&interests=Cinema,Chess");
  assert.ok(body.profiles.length > 0);
  assert.ok(body.profiles.every((p: any) => p.city === "Kolkata"));
});

test("POST /api/swipe validates input", async () => {
  assert.equal((await call(routes.swipe.POST, "/api/swipe", { method: "POST", body: "not json" })).status, 400);
  assert.equal((await call(routes.swipe.POST, "/api/swipe", post({ targetId: 2, action: "boost" }))).status, 400);
  assert.equal((await call(routes.swipe.POST, "/api/swipe", post({ targetId: 9999, action: "like" }))).status, 404);
});

test("full flow: like a one-sided profile, then match with a mutual one, persisted across restart", async () => {
  const feed = (await call(routes.feed.GET, "/api/feed?limit=50")).body.profiles as { id: number }[];

  // Seeded profiles 2, 5, 8 ... liked the demo user; find one by trying likes until a match.
  let matchedId = 0;
  let nonMatches = 0;
  for (const p of feed.slice(0, 12)) {
    const res = await call(routes.swipe.POST, "/api/swipe", post({ targetId: p.id, action: "like" }));
    assert.equal(res.status, 201);
    if (res.body.matched) {
      matchedId = p.id;
      assert.equal(res.body.match.profile.id, p.id);
      break;
    }
    nonMatches++;
    assert.equal(res.body.match, null);
  }
  assert.ok(matchedId > 0, "a seeded mutual like should produce a match");

  const dup = await call(routes.swipe.POST, "/api/swipe", post({ targetId: matchedId, action: "like" }));
  assert.equal(dup.status, 409);

  restartServer(); // fresh connection to the same file

  const matches = (await call(routes.matches.GET, "/api/matches")).body.matches;
  assert.equal(matches.length, 1);
  assert.equal(matches[0].profile.id, matchedId);

  const after = (await call(routes.feed.GET, "/api/feed?limit=50")).body.profiles as { id: number }[];
  assert.ok(!after.some((p) => p.id === matchedId));
  assert.equal(after.length, feed.length - (nonMatches + 1));

  const stats = (await call(routes.stats.GET, "/api/stats")).body;
  assert.deepEqual(stats, { viewed: nonMatches + 1, likes: nonMatches + 1, passes: 0, matches: 1 });
});

test("undo over HTTP reverses the match and returns the profile", async () => {
  const before = (await call(routes.matches.GET, "/api/matches")).body.matches;
  assert.equal(before.length, 1);
  // Undo repeatedly until the matching like (not necessarily last) is reversed.
  let guard = 0;
  while ((await call(routes.matches.GET, "/api/matches")).body.matches.length > 0 && guard++ < 20) {
    const res = await call(routes.undo.POST, "/api/swipe/undo", { method: "POST" });
    assert.equal(res.status, 200);
    assert.ok(res.body.profile.id);
  }
  assert.equal((await call(routes.matches.GET, "/api/matches")).body.matches.length, 0);
});

test("block and report over HTTP hide the profile everywhere", async () => {
  const feed = (await call(routes.feed.GET, "/api/feed?limit=50")).body.profiles as { id: number }[];
  const [a, b] = feed;

  assert.equal((await call(routes.blocks.POST, "/api/blocks", post({ targetId: a.id }))).status, 201);
  assert.equal((await call(routes.blocks.POST, "/api/blocks", post({ targetId: a.id }))).status, 409);
  assert.equal((await call(routes.blocks.POST, "/api/blocks", post({}))).status, 400);

  assert.equal((await call(routes.reports.POST, "/api/reports", post({ targetId: b.id, reason: "nope" }))).status, 400);
  assert.equal(
    (await call(routes.reports.POST, "/api/reports", post({ targetId: b.id, reason: "spam", details: "x" }))).status,
    201,
  );
  assert.equal((await call(routes.reports.POST, "/api/reports", post({ targetId: b.id, reason: "spam" }))).status, 409);

  const ids = (await call(routes.feed.GET, "/api/feed?limit=50")).body.profiles.map((p: any) => p.id);
  assert.ok(!ids.includes(a.id) && !ids.includes(b.id));

  const detail = await call(routes.profile.GET, `/api/profiles/${a.id}`, undefined, {
    params: Promise.resolve({ id: String(a.id) }),
  });
  assert.equal(detail.status, 404);
});

test("profile detail, filters, me and error shape", async () => {
  const ok = await call(routes.profile.GET, "/api/profiles/30", undefined, { params: Promise.resolve({ id: "30" }) });
  assert.equal(ok.status, 200);
  assert.ok(ok.body.photos.length >= 2);
  const bad = await call(routes.profile.GET, "/api/profiles/abc", undefined, { params: Promise.resolve({ id: "abc" }) });
  assert.equal(bad.status, 400);
  assert.equal(bad.body.error.code, "bad_request");

  const f = (await call(routes.filters.GET, "/api/filters")).body;
  assert.ok(f.cities.length > 3 && f.interests.length > 10 && f.minAge < f.maxAge);
  assert.equal((await call(routes.me.GET, "/api/me")).body.id, 1);
});
