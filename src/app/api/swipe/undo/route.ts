import { DEMO_USER_ID } from "@/server/db";
import { getDb } from "@/server/client";
import { undoLastSwipe } from "@/server/services/swipe";
import { respond } from "@/server/http";

export const dynamic = "force-dynamic";

/** POST /api/swipe/undo - reverses the most recent swipe (and its match, if any). */
export function POST() {
  return respond(() => undoLastSwipe(getDb(), DEMO_USER_ID));
}
