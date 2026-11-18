import { DEMO_USER_ID } from "@/server/db";
import { getDb } from "@/server/client";
import { getMatches } from "@/server/services/matches";
import { respond } from "@/server/http";

export const dynamic = "force-dynamic";

/** GET /api/matches - mutual matches only. */
export function GET() {
  return respond(() => ({ matches: getMatches(getDb(), DEMO_USER_ID) }));
}
