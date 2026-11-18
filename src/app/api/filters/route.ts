import { DEMO_USER_ID } from "@/server/db";
import { getDb } from "@/server/client";
import { getFilterOptions } from "@/server/services/profiles";
import { respond } from "@/server/http";

export const dynamic = "force-dynamic";

export function GET() {
  return respond(() => getFilterOptions(getDb(), DEMO_USER_ID));
}
