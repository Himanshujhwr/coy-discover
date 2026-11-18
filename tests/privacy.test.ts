import { test } from "node:test";
import assert from "node:assert/strict";
import { freshDb, likersOfMe, nonLikers, ME } from "./helpers";
import { getFeed } from "../src/server/services/feed";
import { getProfile } from "../src/server/services/profiles";
import { swipe } from "../src/server/services/swipe";
import { getMatches } from "../src/server/services/matches";
import { blockUser, reportUser } from "../src/server/services/safety";
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

test("no API payload contains any field that reveals a like", () => {
  const db = freshDb();
  const feed = getFeed(db, ME, {}, 50);
  const likerId = likersOfMe(db)[0];
  const json = JSON.stringify(feed) + JSON.stringify(getProfile(db, ME, likerId));
  assert.ok(!/like/i.test(json), "feed/profile JSON must not mention likes");
  for (const p of feed.profiles) {
    assert.deepEqual(Object.keys(p).sort(), [
      "age", "bio", "city", "college", "id", "interests", "name", "photo", "photos",
    ]);
  }
});

test("feed order does not depend on who liked you", () => {
  const db = freshDb();
  const ids = getFeed(db, ME, {}, 50).profiles.map((p) => p.id);
  assert.deepEqual(ids, [...ids].sort((a, b) => a - b));
});

test("a one-sided like gives no signal in the matches list", () => {
  const db = freshDb();
  // Someone likes you privately; you haven't swiped on them yet.
  assert.equal(getMatches(db, ME).length, 0);
  // You like someone who has not liked you: still nothing.
  swipe(db, ME, nonLikers(db)[0], "like");
  assert.equal(getMatches(db, ME).length, 0);
});

test("the non-match response carries no hint about the other side", () => {
  const db = freshDb();
  const res = swipe(db, ME, nonLikers(db)[0], "like");
  assert.deepEqual(Object.keys(res).sort(), ["action", "match", "matched", "swipeId"]);
  assert.equal(res.match, null);
});

test("blocking removes a user from feed, detail view and matches", () => {
  const db = freshDb();
  const id = likersOfMe(db)[0];
  swipe(db, ME, id, "like");
  assert.equal(getMatches(db, ME).length, 1);

  blockUser(db, ME, id);
  assert.equal(getMatches(db, ME).length, 0);
  assert.ok(!getFeed(db, ME, {}, 50).profiles.some((p) => p.id === id));
  assert.equal(status(() => getProfile(db, ME, id)), 404);
  assert.equal(status(() => swipe(db, ME, id, "like")), 404);
});

test("blocking an unswiped profile removes it from the feed and from counts", () => {
  const db = freshDb();
  const before = getFeed(db, ME, {}, 50).remaining;
  const id = nonLikers(db)[0];
  blockUser(db, ME, id);
  const after = getFeed(db, ME, {}, 50);
  assert.equal(after.remaining, before - 1);
  assert.ok(!after.profiles.some((p) => p.id === id));
});

test("blocking validation: duplicate 409, unknown 404, self 400", () => {
  const db = freshDb();
  const id = nonLikers(db)[0];
  blockUser(db, ME, id);
  assert.equal(status(() => blockUser(db, ME, id)), 409);
  assert.equal(status(() => blockUser(db, ME, 99999)), 404);
  assert.equal(status(() => blockUser(db, ME, ME)), 400);
});

test("report stores the reason, auto-blocks, and rejects duplicates", () => {
  const db = freshDb();
  const id = nonLikers(db)[0];
  reportUser(db, ME, id, "spam", "  sends links  ");
  const row = db.prepare("SELECT reason, details FROM reports WHERE reported_id = ?").get(id) as {
    reason: string;
    details: string;
  };
  assert.equal(row.reason, "spam");
  assert.equal(row.details, "sends links");
  assert.ok(!getFeed(db, ME, {}, 50).profiles.some((p) => p.id === id));
  assert.equal(status(() => reportUser(db, ME, id, "spam")), 409);
});

test("report validation: reason required and from the allowed list", () => {
  const db = freshDb();
  const id = nonLikers(db)[0];
  assert.equal(status(() => reportUser(db, ME, id, undefined)), 400);
  assert.equal(status(() => reportUser(db, ME, id, "because")), 400);
  assert.equal(status(() => reportUser(db, ME, id, "spam", 42)), 400);
  // A failed report must not have blocked the user.
  assert.ok(getFeed(db, ME, {}, 50).profiles.some((p) => p.id === id));
});

test("reporting someone already blocked still records the report", () => {
  const db = freshDb();
  const id = nonLikers(db)[0];
  blockUser(db, ME, id);
  reportUser(db, ME, id, "harassment");
  const { n } = db.prepare("SELECT COUNT(*) AS n FROM reports").get() as { n: number };
  assert.equal(n, 1);
});
