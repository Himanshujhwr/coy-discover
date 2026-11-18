import type { Db } from "../db";
import { badRequest, notFound } from "../errors";
import type { FilterOptions, Profile } from "../types";

interface UserRow {
  id: number;
  name: string;
  age: number;
  bio: string;
  city: string;
  college: string;
}

/** Loads full profiles for the given ids, preserving the order of `ids`. */
export function loadProfiles(db: Db, ids: number[]): Profile[] {
  if (ids.length === 0) return [];
  const marks = ids.map(() => "?").join(",");

  const users = db
    .prepare(`SELECT id, name, age, bio, city, college FROM users WHERE id IN (${marks})`)
    .all(...ids) as unknown as UserRow[];

  const photos = db
    .prepare(`SELECT user_id, url FROM user_photos WHERE user_id IN (${marks}) ORDER BY position`)
    .all(...ids) as unknown as { user_id: number; url: string }[];

  const interests = db
    .prepare(
      `SELECT ui.user_id, i.name FROM user_interests ui
       JOIN interests i ON i.id = ui.interest_id
       WHERE ui.user_id IN (${marks}) ORDER BY i.name`,
    )
    .all(...ids) as unknown as { user_id: number; name: string }[];

  const byId = new Map<number, Profile>();
  for (const u of users) byId.set(u.id, { ...u, photo: "", photos: [], interests: [] });
  for (const p of photos) byId.get(p.user_id)?.photos.push(p.url);
  for (const i of interests) byId.get(i.user_id)?.interests.push(i.name);
  for (const p of byId.values()) p.photo = p.photos[0] ?? "";

  return ids.map((id) => byId.get(id)).filter((p): p is Profile => Boolean(p));
}

/** The logged-in user's own profile (used for the "It's a Match!" screen). */
export function getMe(db: Db, viewerId: number): Profile {
  const me = loadProfiles(db, [viewerId])[0];
  if (!me) throw notFound("User not found");
  return me;
}

/**
 * Detail view of someone else's profile. Deliberately returns nothing about
 * whether they liked the viewer.
 */
export function getProfile(db: Db, viewerId: number, targetId: number): Profile {
  if (!Number.isInteger(targetId) || targetId <= 0) throw badRequest("Invalid profile id");
  const visible = db
    .prepare(
      `SELECT 1 FROM users u
       WHERE u.id = ? AND u.is_demo = 0
         AND NOT EXISTS (SELECT 1 FROM blocks b WHERE b.blocker_id = ? AND b.blocked_id = u.id)`,
    )
    .get(targetId, viewerId);
  if (!visible) throw notFound("Profile not found");
  return loadProfiles(db, [targetId])[0];
}

export function getFilterOptions(db: Db, viewerId: number): FilterOptions {
  const visible = `u.is_demo = 0 AND NOT EXISTS (
    SELECT 1 FROM blocks b WHERE b.blocker_id = ${Number(viewerId)} AND b.blocked_id = u.id)`;
  const col = (c: string) =>
    (
      db.prepare(`SELECT DISTINCT u.${c} AS v FROM users u WHERE ${visible} ORDER BY u.${c}`).all() as unknown as {
        v: string;
      }[]
    ).map((r) => r.v);

  const interests = (
    db
      .prepare(
        `SELECT DISTINCT i.name AS v FROM interests i
         JOIN user_interests ui ON ui.interest_id = i.id
         JOIN users u ON u.id = ui.user_id
         WHERE ${visible} ORDER BY i.name`,
      )
      .all() as unknown as { v: string }[]
  ).map((r) => r.v);

  const range = db
    .prepare(`SELECT MIN(u.age) AS lo, MAX(u.age) AS hi FROM users u WHERE ${visible}`)
    .get() as unknown as { lo: number | null; hi: number | null };

  return {
    cities: col("city"),
    colleges: col("college"),
    interests,
    minAge: range.lo ?? 18,
    maxAge: range.hi ?? 99,
  };
}
