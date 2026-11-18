"use client";

import { motion } from "framer-motion";
import { Photo } from "@/components/Photo";
import { timeAgo } from "@/lib/api";
import type { MatchEntry, Profile } from "@/lib/types";
import { DeckSkeleton, EmptyMatches, ErrorState } from "./StatesAndBits";

export function MatchesList({
  matches,
  status,
  onOpen,
  onRetry,
}: {
  matches: MatchEntry[];
  status: "loading" | "ready" | "error";
  onOpen: (p: Profile) => void;
  onRetry: () => void;
}) {
  if (status === "loading") return <DeckSkeleton />;
  if (status === "error") return <ErrorState message="Couldn't load your matches." onRetry={onRetry} />;
  if (matches.length === 0) return <EmptyMatches />;

  return (
    <ul className="grid grid-cols-2 gap-3 overflow-y-auto pb-4" aria-label="Your matches">
      {matches.map((m, i) => (
        <motion.li
          key={m.matchId}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: Math.min(i, 8) * 0.04 }}
        >
          <button
            onClick={() => onOpen(m.profile)}
            className="relative block aspect-[3/4] w-full overflow-hidden rounded-3xl bg-lav text-left shadow-soft transition active:scale-[0.97]"
          >
            <Photo src={m.profile.photo} name={m.profile.name} className="absolute inset-0 h-full w-full" />
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-3.5 text-white">
              <p className="font-display text-lg font-bold leading-tight">
                {m.profile.name}, {m.profile.age}
              </p>
              <p className="mt-0.5 text-xs text-white/80">Matched {timeAgo(m.matchedAt)}</p>
            </div>
          </button>
        </motion.li>
      ))}
    </ul>
  );
}
