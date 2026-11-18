"use client";

import { AnimatePresence } from "framer-motion";
import { SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { Wordmark } from "@/components/Wordmark";
import { useDiscover } from "@/lib/useDiscover";
import { countActiveFilters, EMPTY_FILTERS, type Profile } from "@/lib/types";
import { FilterSheet } from "./FilterSheet";
import { MatchOverlay } from "./MatchOverlay";
import { MatchesList } from "./MatchesList";
import { ProfileSheet } from "./ProfileSheet";
import { StatsRow } from "./StatsRow";
import { DeckSkeleton, EmptyDeck, ErrorState, Toast } from "./StatesAndBits";
import { SwipeDeck } from "./SwipeDeck";

type Tab = "swipe" | "matches";

export function DiscoverScreen() {
  const d = useDiscover();
  const [tab, setTab] = useState<Tab>("swipe");
  const [detail, setDetail] = useState<{ profile: Profile; fromDeck: boolean } | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const activeCount = countActiveFilters(d.filters);
  const deckEmpty = d.queue.length === 0 && d.remaining <= 0;

  return (
    <div className="relative flex h-full flex-col px-4 pt-4">
      <header className="flex items-center justify-between pb-3">
        <Wordmark />
        <div className="flex items-center gap-2">
          <div role="tablist" aria-label="Discover sections" className="flex rounded-full bg-lav p-1">
            {(["swipe", "matches"] as const).map((t) => (
              <button
                key={t}
                role="tab"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={`relative rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                  tab === t ? "bg-white text-ink shadow-soft" : "text-ink-soft"
                }`}
              >
                {t === "swipe" ? "Swipe" : "Matches"}
                {t === "matches" && d.matches.length > 0 && (
                  <span className="ml-1.5 rounded-full bg-pink px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {d.matches.length}
                  </span>
                )}
              </button>
            ))}
          </div>
          <button
            onClick={() => setFiltersOpen(true)}
            disabled={!d.options}
            aria-label={`Filters${activeCount ? `, ${activeCount} active` : ""}`}
            className="relative flex h-10 w-10 items-center justify-center rounded-full bg-lav text-ink transition active:scale-90 disabled:opacity-40"
          >
            <SlidersHorizontal size={18} />
            {activeCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-pink text-[10px] font-bold text-white">
                {activeCount}
              </span>
            )}
          </button>
        </div>
      </header>

      <StatsRow stats={d.stats} />

      <section className="min-h-0 flex-1 pb-3 pt-4" aria-live="polite">
        {tab === "swipe" ? (
          d.status === "loading" || (d.queue.length === 0 && d.remaining > 0) ? (
            <DeckSkeleton />
          ) : d.status === "error" ? (
            <ErrorState message={d.error} onRetry={d.reload} />
          ) : deckEmpty ? (
            <EmptyDeck
              filtersActive={activeCount > 0}
              onClearFilters={() => d.setFilters(EMPTY_FILTERS)}
              onOpenMatches={() => setTab("matches")}
            />
          ) : (
            <SwipeDeck
              queue={d.queue}
              exitDir={d.exitDir}
              canUndo={d.stats.viewed > 0 && !d.undoing}
              onSwipe={d.swipe}
              onUndo={d.undo}
              onOpen={(profile) => setDetail({ profile, fromDeck: true })}
            />
          )
        ) : (
          <MatchesList
            matches={d.matches}
            status={d.matchesStatus}
            onRetry={d.reloadMatches}
            onOpen={(profile) => setDetail({ profile, fromDeck: false })}
          />
        )}
      </section>

      <AnimatePresence>
        {filtersOpen && d.options && (
          <FilterSheet
            options={d.options}
            value={d.filters}
            onApply={d.setFilters}
            onClose={() => setFiltersOpen(false)}
          />
        )}
        {detail && (
          <ProfileSheet
            key={detail.profile.id}
            profile={detail.profile}
            onClose={() => setDetail(null)}
            onBlock={d.block}
            onReport={d.report}
            onDecision={detail.fromDeck && d.queue[0]?.id === detail.profile.id ? d.swipe : undefined}
          />
        )}
        {d.celebrate && (
          <MatchOverlay
            match={d.celebrate}
            me={d.me}
            onKeepSwiping={d.dismissCelebration}
            onViewMatches={() => {
              d.dismissCelebration();
              setTab("matches");
            }}
          />
        )}
      </AnimatePresence>

      <Toast message={d.toast} />
    </div>
  );
}
