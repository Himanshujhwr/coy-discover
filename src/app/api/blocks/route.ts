import { DEMO_USER_ID } from "@/server/db";
import { getDb } from "@/server/client";
import { blockUser } from "@/server/services/safety";
import { badRequest } from "@/server/errors";
import { readJson, respond } from "@/server/http";

export const dynamic = "force-dynamic";

/** POST /api/blocks  { targetId: number } */
export function POST(req: Request) {
  return respond(async () => {
    const body = (await readJson(req)) as { targetId?: unknown } | null;
    if (typeof body?.targetId !== "number") throw badRequest("targetId must be a number");
    blockUser(getDb(), DEMO_USER_ID, body.targetId);
    return { blocked: true };
  }, 201);
}
