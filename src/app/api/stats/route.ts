import { DEMO_USER_ID } from "@/server/db";
import { getDb } from "@/server/client";
import { getStats } from "@/server/services/stats";
import { respond } from "@/server/http";

export const dynamic = "force-dynamic";

export function GET() {
  return respond(() => getStats(getDb(), DEMO_USER_ID));
}
