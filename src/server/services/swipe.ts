import { tx, type Db } from "../db";
import { badRequest, conflict, notFound } from "../errors";
import type { Profile, SwipeAction, SwipeResult } from "../types";
import { createMatch, deleteMatch, getMatchFor } from "./matches";
import { loadProfiles } from "./profiles";

export function parseSwipeBody(body: unknown): { targetId: number; action: SwipeAction } {
  if (typeof body !== "object" || body === null) throw badRequest("JSON body required");
  const { targetId, action } = body as Record<string, unknown>;
  if (typeof targetId !== "number" || !Number.isInteger(targetId) || targetId <= 0) {
    throw badRequest("targetId must be a positive integer");
  }
  if (action !== "like" && action !== "pass") {
    throw badRequest("action must be 'like' or 'pass'");
  }
  return { targetId, action };
}

/**
 * Records a swipe. A match is created only when the target has ALREADY liked
 * the swiper, so the swiper can never learn about a non-mutual like.
 */
export function swipe(
  db: Db,
  viewerId: number,
  targetId: number,
  action: SwipeAction,
): SwipeResult {
  return tx(db, () => {
    if (targetId === viewerId) throw badRequest("You cannot swipe on yourself");

    const target = db
      .prepare("SELECT id FROM users WHERE id = ? AND is_demo = 0")
      .get(targetId);
    if (!target) throw notFound("Profile not found");

    const blocked = db
      .prepare("SELECT 1 FROM blocks WHERE blocker_id = ? AND blocked_id = ?")
      .get(viewerId, targetId);
    if (blocked) throw notFound("Profile not found");

    const existing = db
      .prepare("SELECT 1 FROM swipes WHERE swiper_id = ? AND target_id = ?")
      .get(viewerId, targetId);
    if (existing) throw conflict("You have already swiped on this profile");

    const { lastInsertRowid } = db
      .prepare("INSERT INTO swipes (swiper_id, target_id, action) VALUES (?, ?, ?)")
      .run(viewerId, targetId, action);

    let matched = false;
    if (action === "like") {
      const reciprocal = db
        .prepare(
          "SELECT 1 FROM swipes WHERE swiper_id = ? AND target_id = ? AND action = 'like'",
        )
        .get(targetId, viewerId);
      if (reciprocal) {
        createMatch(db, viewerId, targetId);
        matched = true;
      }
    }

    return {
      swipeId: Number(lastInsertRowid),
      action,
      matched,
      match: matched ? getMatchFor(db, viewerId, targetId) : null,
    };
  });
}

/**
 * Reverses the viewer's most recent swipe, including any match it created.
 * Returns the profile so the UI can put the card back on top of the deck.
 */
export function undoLastSwipe(db: Db, viewerId: number): { profile: Profile; action: SwipeAction } {
  return tx(db, () => {
    const last = db
      .prepare(
        "SELECT id, target_id, action FROM swipes WHERE swiper_id = ? ORDER BY id DESC LIMIT 1",
      )
      .get(viewerId) as unknown as { id: number; target_id: number; action: SwipeAction } | undefined;
    if (!last) throw notFound("Nothing to undo");

    db.prepare("DELETE FROM swipes WHERE id = ?").run(last.id);
    if (last.action === "like") deleteMatch(db, viewerId, last.target_id);

    return { profile: loadProfiles(db, [last.target_id])[0], action: last.action };
  });
}
