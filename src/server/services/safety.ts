import { tx, type Db } from "../db";
import { badRequest, conflict, notFound } from "../errors";

export const REPORT_REASONS = [
  "fake_profile",
  "inappropriate_photos",
  "harassment",
  "spam",
  "underage",
  "other",
] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

function assertReal(db: Db, viewerId: number, targetId: number): void {
  if (!Number.isInteger(targetId) || targetId <= 0) throw badRequest("Invalid profile id");
  if (targetId === viewerId) throw badRequest("You cannot do this to yourself");
  if (!db.prepare("SELECT 1 FROM users WHERE id = ? AND is_demo = 0").get(targetId)) {
    throw notFound("Profile not found");
  }
}

/**
 * Blocks a user: they vanish from the feed, matches and detail view.
 * Any match with them is removed so a block is a clean break.
 */
export function blockUser(db: Db, viewerId: number, targetId: number): void {
  tx(db, () => {
    assertReal(db, viewerId, targetId);
    const dup = db
      .prepare("SELECT 1 FROM blocks WHERE blocker_id = ? AND blocked_id = ?")
      .get(viewerId, targetId);
    if (dup) throw conflict("User is already blocked");
    insertBlock(db, viewerId, targetId);
  });
}

/** Reports a user and blocks them in the same step. */
export function reportUser(
  db: Db,
  viewerId: number,
  targetId: number,
  reason: unknown,
  details?: unknown,
): void {
  if (typeof reason !== "string" || !REPORT_REASONS.includes(reason as ReportReason)) {
    throw badRequest(`reason must be one of: ${REPORT_REASONS.join(", ")}`);
  }
  if (details !== undefined && details !== null && typeof details !== "string") {
    throw badRequest("details must be a string");
  }
  const text = typeof details === "string" ? details.trim().slice(0, 500) : null;

  tx(db, () => {
    assertReal(db, viewerId, targetId);
    const dup = db
      .prepare("SELECT 1 FROM reports WHERE reporter_id = ? AND reported_id = ?")
      .get(viewerId, targetId);
    if (dup) throw conflict("You have already reported this user");

    db.prepare(
      "INSERT INTO reports (reporter_id, reported_id, reason, details) VALUES (?, ?, ?, ?)",
    ).run(viewerId, targetId, reason, text || null);

    const alreadyBlocked = db
      .prepare("SELECT 1 FROM blocks WHERE blocker_id = ? AND blocked_id = ?")
      .get(viewerId, targetId);
    if (!alreadyBlocked) insertBlock(db, viewerId, targetId);
  });
}

function insertBlock(db: Db, viewerId: number, targetId: number): void {
  db.prepare("INSERT INTO blocks (blocker_id, blocked_id) VALUES (?, ?)").run(viewerId, targetId);
  const [lo, hi] = viewerId < targetId ? [viewerId, targetId] : [targetId, viewerId];
  db.prepare("DELETE FROM matches WHERE user_a_id = ? AND user_b_id = ?").run(lo, hi);
}
