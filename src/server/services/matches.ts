import type { Db } from "../db";
import type { MatchEntry } from "../types";
import { loadProfiles } from "./profiles";

interface MatchRow {
  id: number;
  other_id: number;
  created_at: string;
}

/** Mutual matches only, newest first. Blocked users are hidden. */
export function getMatches(db: Db, viewerId: number): MatchEntry[] {
  // Plain positional "?" placeholders: numbered "?1" binding is not supported by
  // every Node 22.x build of node:sqlite.
  const rows = db
    .prepare(
      `SELECT m.id, m.created_at,
              CASE WHEN m.user_a_id = ? THEN m.user_b_id ELSE m.user_a_id END AS other_id
       FROM matches m
       WHERE (m.user_a_id = ? OR m.user_b_id = ?)
         AND NOT EXISTS (
           SELECT 1 FROM blocks b WHERE b.blocker_id = ?
             AND b.blocked_id = CASE WHEN m.user_a_id = ? THEN m.user_b_id ELSE m.user_a_id END)
       ORDER BY m.created_at DESC, m.id DESC`,
    )
    .all(viewerId, viewerId, viewerId, viewerId, viewerId) as unknown as MatchRow[];

  const profiles = loadProfiles(
    db,
    rows.map((r) => r.other_id),
  );
  return rows.map((r, i) => ({ matchId: r.id, matchedAt: r.created_at, profile: profiles[i] }));
}

export function getMatchFor(db: Db, viewerId: number, otherId: number): MatchEntry | null {
  return getMatches(db, viewerId).find((m) => m.profile.id === otherId) ?? null;
}

/** Creates the match row for a pair, in canonical (low, high) order. Idempotent. */
export function createMatch(db: Db, a: number, b: number): void {
  const [lo, hi] = a < b ? [a, b] : [b, a];
  db.prepare("INSERT OR IGNORE INTO matches (user_a_id, user_b_id) VALUES (?, ?)").run(lo, hi);
}

export function deleteMatch(db: Db, a: number, b: number): void {
  const [lo, hi] = a < b ? [a, b] : [b, a];
  db.prepare("DELETE FROM matches WHERE user_a_id = ? AND user_b_id = ?").run(lo, hi);
}
