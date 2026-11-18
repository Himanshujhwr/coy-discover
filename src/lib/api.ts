import type {
  ActiveFilters,
  FilterOptions,
  MatchEntry,
  Profile,
  Stats,
  SwipeAction,
  SwipeResult,
} from "./types";

export class ApiClientError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: init?.body ? { "Content-Type": "application/json" } : undefined,
      cache: "no-store",
    });
  } catch {
    throw new ApiClientError(0, "Can't reach the server. Check your connection.");
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiClientError(res.status, data?.error?.message ?? "Something went wrong");
  }
  return data as T;
}

const post = <T>(url: string, body?: unknown) =>
  request<T>(url, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) });

export function feedUrl(filters: ActiveFilters, limit: number): string {
  const sp = new URLSearchParams({ limit: String(limit) });
  if (filters.minAge !== null) sp.set("minAge", String(filters.minAge));
  if (filters.maxAge !== null) sp.set("maxAge", String(filters.maxAge));
  if (filters.city) sp.set("city", filters.city);
  if (filters.college) sp.set("college", filters.college);
  if (filters.interests.length) sp.set("interests", filters.interests.join(","));
  return `/api/feed?${sp}`;
}

export const api = {
  feed: (filters: ActiveFilters, limit = 10) =>
    request<{ profiles: Profile[]; remaining: number }>(feedUrl(filters, limit)),
  swipe: (targetId: number, action: SwipeAction) => post<SwipeResult>("/api/swipe", { targetId, action }),
  undo: () => post<{ profile: Profile; action: SwipeAction }>("/api/swipe/undo"),
  matches: () => request<{ matches: MatchEntry[] }>("/api/matches"),
  stats: () => request<Stats>("/api/stats"),
  filters: () => request<FilterOptions>("/api/filters"),
  me: () => request<Profile>("/api/me"),
  profile: (id: number) => request<Profile>(`/api/profiles/${id}`),
  block: (targetId: number) => post<{ blocked: true }>("/api/blocks", { targetId }),
  report: (targetId: number, reason: string, details?: string) =>
    post<{ reported: true }>("/api/reports", { targetId, reason, details }),
};

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
