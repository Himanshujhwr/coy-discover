import type { Db } from "../db";
import { badRequest } from "../errors";
import type { FeedFilters, Profile } from "../types";
import { loadProfiles } from "./profiles";

export interface Feed {
  profiles: Profile[];
  /** How many profiles remain for this user under the current filters. */
  remaining: number;
}

const MAX_LIMIT = 50;

/**
 * Profiles the viewer has not swiped on and has not blocked.
 *
 * Ordering is by id only. It must never depend on whether someone liked the
 * viewer, otherwise the order itself would leak private likes.
 */
export function getFeed(
  db: Db,
  viewerId: number,
  filters: FeedFilters = {},
  limit = 10,
): Feed {
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
    throw badRequest(`limit must be an integer between 1 and ${MAX_LIMIT}`);
  }
  validateFilters(filters);

  const where: string[] = [
    "u.is_demo = 0",
    "u.id <> ?",
    "NOT EXISTS (SELECT 1 FROM swipes s WHERE s.swiper_id = ? AND s.target_id = u.id)",
    "NOT EXISTS (SELECT 1 FROM blocks b WHERE b.blocker_id = ? AND b.blocked_id = u.id)",
  ];
  const params: (string | number)[] = [viewerId, viewerId, viewerId];

  if (filters.minAge !== undefined) {
    where.push("u.age >= ?");
    params.push(filters.minAge);
  }
  if (filters.maxAge !== undefined) {
    where.push("u.age <= ?");
    params.push(filters.maxAge);
  }
  if (filters.city) {
    where.push("u.city = ? COLLATE NOCASE");
    params.push(filters.city);
  }
  if (filters.college) {
    where.push("u.college = ? COLLATE NOCASE");
    params.push(filters.college);
  }
  if (filters.interests?.length) {
    const marks = filters.interests.map(() => "?").join(",");
    where.push(
      `EXISTS (SELECT 1 FROM user_interests ui JOIN interests i ON i.id = ui.interest_id
               WHERE ui.user_id = u.id AND i.name COLLATE NOCASE IN (${marks}))`,
    );
    params.push(...filters.interests);
  }

  const clause = where.join(" AND ");
  const ids = (
    db
      .prepare(`SELECT u.id FROM users u WHERE ${clause} ORDER BY u.id LIMIT ?`)
      .all(...params, limit) as unknown as { id: number }[]
  ).map((r) => r.id);

  const { n } = db
    .prepare(`SELECT COUNT(*) AS n FROM users u WHERE ${clause}`)
    .get(...params) as unknown as { n: number };

  return { profiles: loadProfiles(db, ids), remaining: n };
}

function validateFilters(f: FeedFilters): void {
  for (const key of ["minAge", "maxAge"] as const) {
    const v = f[key];
    if (v !== undefined && (!Number.isInteger(v) || v < 18 || v > 100)) {
      throw badRequest(`${key} must be an integer between 18 and 100`);
    }
  }
  if (f.minAge !== undefined && f.maxAge !== undefined && f.minAge > f.maxAge) {
    throw badRequest("minAge cannot be greater than maxAge");
  }
}
