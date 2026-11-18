import { DEMO_USER_ID } from "@/server/db";
import { getDb } from "@/server/client";
import { getFeed } from "@/server/services/feed";
import { intParam, respond } from "@/server/http";

export const dynamic = "force-dynamic";

/** GET /api/feed?limit=&minAge=&maxAge=&city=&college=&interests=a,b */
export function GET(req: Request) {
  return respond(() => {
    const sp = new URL(req.url).searchParams;
    const interests = sp.get("interests")?.split(",").map((s) => s.trim()).filter(Boolean);
    return getFeed(
      getDb(),
      DEMO_USER_ID,
      {
        minAge: intParam(sp, "minAge"),
        maxAge: intParam(sp, "maxAge"),
        city: sp.get("city") || undefined,
        college: sp.get("college") || undefined,
        interests,
      },
      intParam(sp, "limit") ?? 10,
    );
  });
}
