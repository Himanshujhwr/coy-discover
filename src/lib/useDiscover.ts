"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiClientError } from "./api";
import {
  EMPTY_FILTERS,
  type ActiveFilters,
  type FilterOptions,
  type MatchEntry,
  type Profile,
  type Stats,
  type SwipeAction,
} from "./types";

const ZERO_STATS: Stats = { viewed: 0, likes: 0, passes: 0, matches: 0 };
const REFILL_AT = 3;

type Status = "loading" | "ready" | "error";

/**
 * All Discover state. The server is the source of truth: swipes are applied
 * optimistically to the deck, sent through a serial queue so they reach the
 * server in order, and the deck is reloaded if anything fails.
 */
export function useDiscover() {
  const [filters, setFiltersState] = useState<ActiveFilters>(EMPTY_FILTERS);
  const [queue, setQueue] = useState<Profile[]>([]);
  const [remaining, setRemaining] = useState(0);
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState("");
  const [stats, setStats] = useState<Stats>(ZERO_STATS);
  const [matches, setMatches] = useState<MatchEntry[]>([]);
  const [matchesStatus, setMatchesStatus] = useState<Status>("loading");
  const [me, setMe] = useState<Profile | null>(null);
  const [options, setOptions] = useState<FilterOptions | null>(null);
  const [celebrate, setCelebrate] = useState<MatchEntry | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [exitDir, setExitDir] = useState<1 | -1>(1);
  const [undoing, setUndoing] = useState(false);

  const filtersRef = useRef(filters);
  const queueRef = useRef(queue);
  queueRef.current = queue;
  const chain = useRef<Promise<unknown>>(Promise.resolve());
  const swiped = useRef(new Set<number>());
  const refilling = useRef(false);
  const generation = useRef(0);
  /** Net change to `remaining` made locally (swipes -1, undo +1); used to reconcile refills. */
  const remainingDelta = useRef(0);

  const notify = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast((t) => (t === msg ? null : t)), 2800);
  }, []);

  const refreshStats = useCallback(async () => {
    try {
      setStats(await api.stats());
    } catch {
      /* stats are non-critical */
    }
  }, []);

  const loadMatches = useCallback(async () => {
    try {
      setMatches((await api.matches()).matches);
      setMatchesStatus("ready");
    } catch {
      setMatchesStatus("error");
    }
  }, []);

  const loadOptions = useCallback(async () => {
    try {
      setOptions(await api.filters());
    } catch {
      /* filters degrade gracefully */
    }
  }, []);

  const loadFeed = useCallback(async (f: ActiveFilters) => {
    const gen = ++generation.current;
    setStatus("loading");
    try {
      const feed = await api.feed(f, 10);
      if (gen !== generation.current) return;
      swiped.current.clear();
      remainingDelta.current = 0;
      setQueue(feed.profiles);
      setRemaining(feed.remaining);
      setStatus("ready");
    } catch (e) {
      if (gen !== generation.current) return;
      setError(e instanceof ApiClientError ? e.message : "Couldn't load profiles");
      setStatus("error");
    }
  }, []);

  const reloadAll = useCallback(() => {
    loadFeed(filtersRef.current);
    refreshStats();
    loadMatches();
  }, [loadFeed, refreshStats, loadMatches]);

  useEffect(() => {
    reloadAll();
    loadOptions();
    api.me().then(setMe).catch(() => undefined);
  }, [reloadAll, loadOptions]);

  // Top the deck up before it runs dry.
  useEffect(() => {
    if (status !== "ready" || refilling.current) return;
    if (queue.length > REFILL_AT || remaining <= queue.length) return;
    refilling.current = true;
    const gen = generation.current;
    // Runs inside the request chain so every earlier swipe is already saved
    // server-side when the feed is read; the delta covers swipes made meanwhile.
    chain.current = chain.current.then(async () => {
      const startDelta = remainingDelta.current;
      try {
        const feed = await api.feed(filtersRef.current, 12 + queueRef.current.length);
        if (gen !== generation.current) return;
        setQueue((q) => {
          const have = new Set(q.map((p) => p.id));
          const fresh = feed.profiles.filter((p) => !have.has(p.id) && !swiped.current.has(p.id));
          return [...q, ...fresh];
        });
        setRemaining(Math.max(0, feed.remaining + (remainingDelta.current - startDelta)));
      } catch {
        /* the next swipe will retry the refill */
      } finally {
        refilling.current = false;
      }
    });
  }, [queue, remaining, status]);

  const setFilters = useCallback(
    (f: ActiveFilters) => {
      filtersRef.current = f;
      setFiltersState(f);
      loadFeed(f);
    },
    [loadFeed],
  );

  const swipe = useCallback(
    (action: SwipeAction) => {
      const top = queueRef.current[0];
      if (!top) return;

      setExitDir(action === "like" ? 1 : -1);
      swiped.current.add(top.id);
      remainingDelta.current -= 1;
      setQueue((q) => q.filter((p) => p.id !== top.id));
      setRemaining((r) => Math.max(0, r - 1));
      setStats((s) => ({
        ...s,
        viewed: s.viewed + 1,
        likes: s.likes + (action === "like" ? 1 : 0),
        passes: s.passes + (action === "pass" ? 1 : 0),
      }));

      chain.current = chain.current.then(async () => {
        try {
          const res = await api.swipe(top.id, action);
          if (res.matched && res.match) {
            const match = res.match;
            setTimeout(() => setCelebrate(match), 260);
            loadMatches();
          }
          refreshStats();
        } catch (e) {
          if (!(e instanceof ApiClientError && e.status === 409)) {
            notify(e instanceof ApiClientError ? e.message : "Swipe failed");
          }
          reloadAll();
        }
      });
    },
    [loadMatches, notify, refreshStats, reloadAll],
  );

  const undo = useCallback(() => {
    if (undoing) return;
    setUndoing(true);
    chain.current = chain.current.then(async () => {
      try {
        const { profile, action } = await api.undo();
        swiped.current.delete(profile.id);
        remainingDelta.current += 1;
        setQueue((q) => [profile, ...q.filter((p) => p.id !== profile.id)]);
        setRemaining((r) => r + 1);
        notify(action === "like" ? "Undid your like" : "Undid your pass");
        refreshStats();
        loadMatches();
      } catch (e) {
        notify(e instanceof ApiClientError ? e.message : "Couldn't undo");
      } finally {
        setUndoing(false);
      }
    });
  }, [undoing, notify, refreshStats, loadMatches]);

  /** Removes someone from every list after a block/report succeeded. */
  const dropProfile = useCallback(
    (id: number) => {
      const wasInDeck = queueRef.current.some((p) => p.id === id);
      swiped.current.add(id);
      setQueue((q) => q.filter((p) => p.id !== id));
      if (wasInDeck) {
        remainingDelta.current -= 1;
        setRemaining((r) => Math.max(0, r - 1));
      }
      setMatches((m) => m.filter((x) => x.profile.id !== id));
      refreshStats();
      loadOptions();
    },
    [refreshStats, loadOptions],
  );

  const block = useCallback(
    async (id: number) => {
      await api.block(id);
      dropProfile(id);
      notify("User blocked");
    },
    [dropProfile, notify],
  );

  const report = useCallback(
    async (id: number, reason: string, details: string) => {
      await api.report(id, reason, details || undefined);
      dropProfile(id);
      notify("Report sent. They're blocked too.");
    },
    [dropProfile, notify],
  );

  return {
    filters, setFilters, options,
    queue, remaining, status, error,
    stats, matches, matchesStatus, me,
    celebrate, dismissCelebration: () => setCelebrate(null),
    toast, exitDir, undoing,
    swipe, undo, block, report,
    reload: reloadAll, reloadMatches: loadMatches,
  };
}

export type DiscoverState = ReturnType<typeof useDiscover>;
