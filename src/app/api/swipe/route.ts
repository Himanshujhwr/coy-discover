import { DEMO_USER_ID } from "@/server/db";
import { getDb } from "@/server/client";
import { parseSwipeBody, swipe } from "@/server/services/swipe";
import { readJson, respond } from "@/server/http";

export const dynamic = "force-dynamic";

/** POST /api/swipe  { targetId: number, action: "like" | "pass" } */
export function POST(req: Request) {
  return respond(async () => {
    const { targetId, action } = parseSwipeBody(await readJson(req));
    return swipe(getDb(), DEMO_USER_ID, targetId, action);
  }, 201);
}
