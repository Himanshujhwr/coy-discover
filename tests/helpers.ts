import { DEMO_USER_ID, openDb, type Db } from "../src/server/db";
import { seed } from "../src/server/seed";

export const ME = DEMO_USER_ID;

export function freshDb(): Db {
  const db = openDb(":memory:");
  seed(db);
  return db;
}

/** Test-only peek at the private data: who already liked the demo user. */
export function likersOfMe(db: Db): number[] {
  return (
    db
      .prepare("SELECT swiper_id AS id FROM swipes WHERE target_id = ? AND action = 'like' ORDER BY id")
      .all(ME) as unknown as { id: number }[]
  ).map((r) => r.id);
}

export function nonLikers(db: Db): number[] {
  const likers = new Set(likersOfMe(db));
  return (db.prepare("SELECT id FROM users WHERE is_demo = 0 ORDER BY id").all() as unknown as { id: number }[])
    .map((r) => r.id)
    .filter((id) => !likers.has(id));
}
