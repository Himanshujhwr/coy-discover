import path from "node:path";
import { openDb, type Db } from "./db";
import { seedIfEmpty } from "./seed";

const globalForDb = globalThis as unknown as { __coyDb?: Db };

/** Lazy singleton used by API routes. Creates and seeds the database on first use. */
export function getDb(): Db {
  if (!globalForDb.__coyDb) {
    const file = process.env.DATABASE_FILE ?? path.join(process.cwd(), "data", "coy.db");
    const db = openDb(file);
    seedIfEmpty(db);
    globalForDb.__coyDb = db;
  }
  return globalForDb.__coyDb;
}
