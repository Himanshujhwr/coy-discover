import { ApiError, badRequest } from "./errors";

/** Wraps a route handler: domain errors become proper HTTP responses, the rest become 500. */
export async function respond<T>(fn: () => T | Promise<T>, okStatus = 200): Promise<Response> {
  try {
    return Response.json(await fn(), { status: okStatus });
  } catch (err) {
    if (err instanceof ApiError) {
      return Response.json({ error: { code: err.code, message: err.message } }, { status: err.status });
    }
    console.error(err);
    return Response.json(
      { error: { code: "internal", message: "Something went wrong on our side" } },
      { status: 500 },
    );
  }
}

export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw badRequest("Request body must be valid JSON");
  }
}

/** Parses an optional integer query param; throws 400 if present but not an integer. */
export function intParam(sp: URLSearchParams, key: string): number | undefined {
  const raw = sp.get(key);
  if (raw === null || raw === "") return undefined;
  if (!/^-?\d+$/.test(raw)) throw badRequest(`${key} must be an integer`);
  return Number(raw);
}
