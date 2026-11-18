import { test } from "node:test";
import assert from "node:assert/strict";
import { freshDb, likersOfMe, ME } from "./helpers";
import { seed, seedIfEmpty } from "../src/server/seed";
import { getFeed } from "../src/server/services/feed";

test("seeds at least 30 complete profiles plus the demo user", () => {
  const db = freshDb();
  const { profiles, remaining } = getFeed(db, ME, {}, 50);
  assert.ok(remaining >= 30);
  for (const p of profiles) {
    assert.ok(p.name && p.bio && p.city && p.college && p.photo);
    assert.ok(p.age >= 18);
    assert.ok(p.interests.length >= 3);
    assert.ok(p.photos.length >= 2);
  }
});

test("some seeded profiles have already liked the demo user", () => {
  const db = freshDb();
  assert.ok(likersOfMe(db).length >= 5);
});

test("seedIfEmpty is idempotent and does not reseed", () => {
  const db = freshDb();
  seedIfEmpty(db);
  const { n } = db.prepare("SELECT COUNT(*) AS n FROM users").get() as { n: number };
  assert.equal(n, 33);
  assert.throws(() => seed(db)); // direct re-seed trips the id-1 guard
});
