import { DEMO_USER_ID } from "@/server/db";
import { getDb } from "@/server/client";
import { getProfile } from "@/server/services/profiles";
import { badRequest } from "@/server/errors";
import { respond } from "@/server/http";

export const dynamic = "force-dynamic";

export function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  return respond(async () => {
    const { id } = await ctx.params;
    if (!/^\d+$/.test(id)) throw badRequest("Invalid profile id");
    return getProfile(getDb(), DEMO_USER_ID, Number(id));
  });
}
