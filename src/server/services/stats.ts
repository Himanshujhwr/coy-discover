import type { Db } from "../db";
import type { Stats } from "../types";
import { getMatches } from "./matches";

export function getStats(db: Db, viewerId: number): Stats {
  const row = db
    .prepare(
      `SELECT COUNT(*) AS viewed,
              COALESCE(SUM(action = 'like'), 0) AS likes,
              COALESCE(SUM(action = 'pass'), 0) AS passes
       FROM swipes WHERE swiper_id = ?`,
    )
    .get(viewerId) as unknown as { viewed: number; likes: number; passes: number };

  return { ...row, matches: getMatches(db, viewerId).length };
}
