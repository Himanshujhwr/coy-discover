"use client";

import { AlertTriangle, Heart, SlidersHorizontal, Sparkles } from "lucide-react";
import type { ReactNode } from "react";

export function Chip({ children, active = false }: { children: ReactNode; active?: boolean }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${
        active ? "bg-pink text-white" : "bg-lav text-lav-ink"
      }`}
    >
      {children}
    </span>
  );
}

export function DeckSkeleton() {
  return (
    <div className="h-full w-full" aria-busy="true" aria-label="Loading profiles">
      <div className="relative h-full overflow-hidden rounded-[2rem] bg-lav">
        <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" />
        <div className="absolute inset-x-5 bottom-6 space-y-3">
          <div className="h-7 w-2/3 rounded-full bg-lav-deep/70" />
          <div className="h-4 w-1/2 rounded-full bg-lav-deep/60" />
          <div className="flex gap-2">
            <div className="h-7 w-16 rounded-full bg-lav-deep/60" />
            <div className="h-7 w-20 rounded-full bg-lav-deep/60" />
          </div>
        </div>
      </div>
    </div>
  );
}

function Illustration({ children }: { children: ReactNode }) {
  return (
    <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-gradient-to-br from-pink-soft to-lav-deep text-pink-deep shadow-soft">
      {children}
    </div>
  );
}

export function EmptyDeck({
  filtersActive,
  onClearFilters,
  onOpenMatches,
}: {
  filtersActive: boolean;
  onClearFilters: () => void;
  onOpenMatches: () => void;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center rounded-[2rem] bg-lav/60 px-8 text-center">
      <Illustration>{filtersActive ? <SlidersHorizontal size={32} /> : <Sparkles size={32} />}</Illustration>
      <h2 className="font-display text-2xl font-bold">
        {filtersActive ? "No one fits these filters" : "You're all caught up"}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">
        {filtersActive
          ? "Try widening your age range or removing a filter to see more people."
          : "You've seen everyone for now. Check your matches, or come back later for new faces."}
      </p>
      <div className="mt-6 flex gap-3">
        {filtersActive && (
          <button
            onClick={onClearFilters}
            className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition active:scale-95"
          >
            Clear filters
          </button>
        )}
        <button
          onClick={onOpenMatches}
          className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-ink shadow-soft transition active:scale-95"
        >
          View matches
        </button>
      </div>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="flex h-full flex-col items-center justify-center rounded-[2rem] bg-lav/60 px-8 text-center">
      <Illustration>
        <AlertTriangle size={30} />
      </Illustration>
      <h2 className="font-display text-2xl font-bold">Something broke</h2>
      <p className="mt-2 text-sm text-ink-soft">{message}</p>
      <button
        onClick={onRetry}
        className="mt-6 rounded-full bg-pink px-6 py-3 text-sm font-semibold text-white shadow-pop transition active:scale-95"
      >
        Try again
      </button>
    </div>
  );
}

export function EmptyMatches() {
  return (
    <div className="flex h-full flex-col items-center justify-center px-8 text-center">
      <Illustration>
        <Heart size={32} />
      </Illustration>
      <h2 className="font-display text-2xl font-bold">No matches yet</h2>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">
        When you and someone else both like each other, they'll show up here. Likes stay private until
        then.
      </p>
    </div>
  );
}

export function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      role="status"
      className="pointer-events-none absolute inset-x-0 top-16 z-50 flex justify-center px-6"
    >
      <div className="rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-white shadow-card">{message}</div>
    </div>
  );
}
