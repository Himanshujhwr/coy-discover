import { DEMO_USER_ID } from "@/server/db";
import { getDb } from "@/server/client";
import { getMe } from "@/server/services/profiles";
import { respond } from "@/server/http";

export const dynamic = "force-dynamic";

export function GET() {
  return respond(() => getMe(getDb(), DEMO_USER_ID));
}
