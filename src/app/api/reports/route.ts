import { DEMO_USER_ID } from "@/server/db";
import { getDb } from "@/server/client";
import { reportUser } from "@/server/services/safety";
import { badRequest } from "@/server/errors";
import { readJson, respond } from "@/server/http";

export const dynamic = "force-dynamic";

/** POST /api/reports  { targetId: number, reason: string, details?: string } - also blocks. */
export function POST(req: Request) {
  return respond(async () => {
    const body = (await readJson(req)) as { targetId?: unknown; reason?: unknown; details?: unknown } | null;
    if (typeof body?.targetId !== "number") throw badRequest("targetId must be a number");
    reportUser(getDb(), DEMO_USER_ID, body.targetId, body.reason, body.details);
    return { reported: true, blocked: true };
  }, 201);
}
