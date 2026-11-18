import { test } from "node:test";
import assert from "node:assert/strict";
import { freshDb, likersOfMe, nonLikers, ME } from "./helpers";
import { getFeed } from "../src/server/services/feed";
import { swipe, undoLastSwipe, parseSwipeBody } from "../src/server/services/swipe";
import { getMatches } from "../src/server/services/matches";
import { getStats } from "../src/server/services/stats";
import { ApiError } from "../src/server/errors";

const status = (fn: () => unknown) => {
  try {
    fn();
  } catch (e) {
    if (e instanceof ApiError) return e.status;
    throw e;
  }
  return 200;
};

test("liking someone who has NOT liked you does not match", () => {
  const db = freshDb();
  const res = swipe(db, ME, nonLikers(db)[0], "like");
  assert.equal(res.matched, false);
  assert.equal(res.match, null);
  assert.equal(getMatches(db, ME).length, 0);
});

test("liking someone who already liked you creates a match", () => {
  const db = freshDb();
  const res = swipe(db, ME, likersOfMe(db)[0], "like");
  assert.equal(res.matched, true);
  assert.equal(res.match?.profile.id, likersOfMe(db)[0]);
  assert.equal(getMatches(db, ME).length, 1);
});

test("passing on someone who liked you never matches, even if you swipe again later", () => {
  const db = freshDb();
  const id = likersOfMe(db)[0];
  const res = swipe(db, ME, id, "pass");
  assert.equal(res.matched, false);
  assert.equal(getMatches(db, ME).length, 0);
  assert.equal(status(() => swipe(db, ME, id, "like")), 409);
  assert.equal(getMatches(db, ME).length, 0);
});

test("swiped profiles never reappear in the feed", () => {
  const db = freshDb();
  const [a, b] = getFeed(db, ME, {}, 5).profiles;
  swipe(db, ME, a.id, "like");
  swipe(db, ME, b.id, "pass");
  const ids = getFeed(db, ME, {}, 50).profiles.map((p) => p.id);
  assert.ok(!ids.includes(a.id));
  assert.ok(!ids.includes(b.id));
});

test("swiping every profile empties the feed", () => {
  const db = freshDb();
  for (const p of getFeed(db, ME, {}, 50).profiles) swipe(db, ME, p.id, "pass");
  const feed = getFeed(db, ME, {}, 50);
  assert.equal(feed.profiles.length, 0);
  assert.equal(feed.remaining, 0);
});

test("swipes persist across a reconnect to the same database file", async () => {
  const { openDb } = await import("../src/server/db");
  const { seed } = await import("../src/server/seed");
  const os = await import("node:os");
  const path = await import("node:path");
  const fs = await import("node:fs");
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "coy-"));
  const file = path.join(dir, "t.db");

  const db1 = openDb(file);
  seed(db1);
  const target = likersOfMe(db1)[0];
  swipe(db1, ME, target, "like");
  db1.close();

  const db2 = openDb(file);
  assert.equal(getMatches(db2, ME).length, 1);
  assert.ok(!getFeed(db2, ME, {}, 50).profiles.some((p) => p.id === target));
  assert.equal(getStats(db2, ME).viewed, 1);
  db2.close();
  fs.rmSync(dir, { recursive: true, force: true });
});

test("duplicate swipes are rejected with 409 and do not double count", () => {
  const db = freshDb();
  const id = nonLikers(db)[0];
  swipe(db, ME, id, "like");
  assert.equal(status(() => swipe(db, ME, id, "like")), 409);
  assert.equal(status(() => swipe(db, ME, id, "pass")), 409);
  assert.equal(getStats(db, ME).viewed, 1);
});

test("validation: bad body, unknown target, self, demo user", () => {
  const db = freshDb();
  assert.equal(status(() => parseSwipeBody(null)), 400);
  assert.equal(status(() => parseSwipeBody({ targetId: "2", action: "like" })), 400);
  assert.equal(status(() => parseSwipeBody({ targetId: 2, action: "superlike" })), 400);
  assert.equal(status(() => parseSwipeBody({ targetId: 1.5, action: "like" })), 400);
  assert.equal(status(() => swipe(db, ME, 99999, "like")), 404);
  assert.equal(status(() => swipe(db, ME, ME, "like")), 400);
});

test("feed validates limit and age filters", () => {
  const db = freshDb();
  assert.equal(status(() => getFeed(db, ME, {}, 0)), 400);
  assert.equal(status(() => getFeed(db, ME, {}, 500)), 400);
  assert.equal(status(() => getFeed(db, ME, { minAge: 30, maxAge: 20 })), 400);
  assert.equal(status(() => getFeed(db, ME, { minAge: 10 })), 400);
});

test("filters: age, city, college, interests narrow the feed", () => {
  const db = freshDb();
  const all = getFeed(db, ME, {}, 50).profiles;

  const age = getFeed(db, ME, { minAge: 23, maxAge: 24 }, 50).profiles;
  assert.ok(age.length > 0 && age.every((p) => p.age >= 23 && p.age <= 24));

  const city = getFeed(db, ME, { city: "kolkata" }, 50).profiles; // case-insensitive
  assert.ok(city.length > 0 && city.every((p) => p.city === "Kolkata"));

  const college = getFeed(db, ME, { college: "Symbiosis" }, 50).profiles;
  assert.ok(college.length > 0 && college.every((p) => p.college === "Symbiosis"));

  const tags = getFeed(db, ME, { interests: ["Cinema", "Chess"] }, 50).profiles;
  assert.ok(tags.length > 0 && tags.length < all.length);
  assert.ok(tags.every((p) => p.interests.some((i) => i === "Cinema" || i === "Chess")));

  const none = getFeed(db, ME, { city: "Atlantis" }, 50);
  assert.equal(none.profiles.length, 0);
});

test("filters still exclude already-swiped profiles", () => {
  const db = freshDb();
  const [first] = getFeed(db, ME, { city: "Kolkata" }, 50).profiles;
  swipe(db, ME, first.id, "pass");
  const ids = getFeed(db, ME, { city: "Kolkata" }, 50).profiles.map((p) => p.id);
  assert.ok(!ids.includes(first.id));
});

test("undo reverses a pass so the profile returns to the feed", () => {
  const db = freshDb();
  const id = nonLikers(db)[0];
  swipe(db, ME, id, "pass");
  const undone = undoLastSwipe(db, ME);
  assert.equal(undone.profile.id, id);
  assert.equal(getStats(db, ME).viewed, 0);
  assert.ok(getFeed(db, ME, {}, 50).profiles.some((p) => p.id === id));
});

test("undo of a matching like removes the match, and re-liking recreates it", () => {
  const db = freshDb();
  const id = likersOfMe(db)[0];
  swipe(db, ME, id, "like");
  assert.equal(getMatches(db, ME).length, 1);

  undoLastSwipe(db, ME);
  assert.equal(getMatches(db, ME).length, 0);
  assert.equal(getStats(db, ME).likes, 0);

  const again = swipe(db, ME, id, "like");
  assert.equal(again.matched, true);
  assert.equal(getMatches(db, ME).length, 1);
});

test("undo only reverses the most recent swipe, one at a time", () => {
  const db = freshDb();
  const [a, b] = nonLikers(db);
  swipe(db, ME, a, "like");
  swipe(db, ME, b, "like");
  assert.equal(undoLastSwipe(db, ME).profile.id, b);
  assert.equal(undoLastSwipe(db, ME).profile.id, a);
  assert.equal(status(() => undoLastSwipe(db, ME)), 404);
});

test("stats count viewed, likes, passes and matches", () => {
  const db = freshDb();
  const [liker] = likersOfMe(db);
  const [x, y] = nonLikers(db);
  swipe(db, ME, liker, "like");
  swipe(db, ME, x, "like");
  swipe(db, ME, y, "pass");
  assert.deepEqual(getStats(db, ME), { viewed: 3, likes: 2, passes: 1, matches: 1 });
});

test("database rejects duplicate or self swipes even if the service is bypassed", () => {
  const db = freshDb();
  db.prepare("INSERT INTO swipes (swiper_id, target_id, action) VALUES (1, 2, 'like')").run();
  assert.throws(() => db.prepare("INSERT INTO swipes (swiper_id, target_id, action) VALUES (1, 2, 'pass')").run());
  assert.throws(() => db.prepare("INSERT INTO swipes (swiper_id, target_id, action) VALUES (3, 3, 'like')").run());
  assert.throws(() => db.prepare("INSERT INTO swipes (swiper_id, target_id, action) VALUES (1, 4, 'maybe')").run());
});
