"use client";

import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { Photo } from "@/components/Photo";
import type { MatchEntry, Profile } from "@/lib/types";

const HEARTS = [
  { left: "12%", delay: 0.1, size: 18 },
  { left: "28%", delay: 0.5, size: 26 },
  { left: "46%", delay: 0.25, size: 14 },
  { left: "64%", delay: 0.7, size: 24 },
  { left: "80%", delay: 0.35, size: 18 },
  { left: "90%", delay: 0.9, size: 12 },
];

export function MatchOverlay({
  match,
  me,
  onKeepSwiping,
  onViewMatches,
}: {
  match: MatchEntry;
  me: Profile | null;
  onKeepSwiping: () => void;
  onViewMatches: () => void;
}) {
  const other = match.profile;
  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="It's a match"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-40 flex flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-pink via-[#d85bd0] to-[#6b4fd8] px-6 text-white"
    >
      {HEARTS.map((h, i) => (
        <motion.span
          key={i}
          aria-hidden
          initial={{ y: "110%", opacity: 0 }}
          animate={{ y: "-120%", opacity: [0, 0.8, 0] }}
          transition={{ duration: 4, delay: h.delay, repeat: Infinity, ease: "easeOut" }}
          style={{ left: h.left }}
          className="absolute bottom-0 text-white/70"
        >
          <Heart size={h.size} fill="currentColor" strokeWidth={0} />
        </motion.span>
      ))}

      <motion.p
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="text-sm font-semibold uppercase tracking-[0.25em] text-white/80"
      >
        Mutual crush
      </motion.p>
      <motion.h1
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 14, delay: 0.2 }}
        className="mt-2 text-center font-display text-[44px] font-extrabold leading-none"
      >
        It's a Match!
      </motion.h1>

      <div className="relative mt-10 flex h-44 w-full items-center justify-center">
        <motion.div
          initial={{ x: -120, rotate: -20, opacity: 0 }}
          animate={{ x: -52, rotate: -9, opacity: 1 }}
          transition={{ type: "spring", stiffness: 140, damping: 16, delay: 0.3 }}
          className="absolute h-40 w-32 overflow-hidden rounded-3xl border-4 border-white shadow-card"
        >
          <Photo src={me?.photo ?? ""} name={me?.name ?? "You"} className="h-full w-full" />
        </motion.div>
        <motion.div
          initial={{ x: 120, rotate: 20, opacity: 0 }}
          animate={{ x: 52, rotate: 9, opacity: 1 }}
          transition={{ type: "spring", stiffness: 140, damping: 16, delay: 0.4 }}
          className="absolute h-40 w-32 overflow-hidden rounded-3xl border-4 border-white shadow-card"
        >
          <Photo src={other.photo} name={other.name} className="h-full w-full" />
        </motion.div>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 12, delay: 0.7 }}
          className="absolute z-10 flex h-14 w-14 items-center justify-center rounded-full bg-white text-pink shadow-pop"
        >
          <Heart size={26} fill="currentColor" strokeWidth={0} />
        </motion.div>
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-8 max-w-[280px] text-center text-base text-white/90"
      >
        You and <strong className="font-bold">{other.name}</strong> liked each other.
      </motion.p>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="mt-8 flex w-full max-w-[300px] flex-col gap-3"
      >
        <button
          onClick={onViewMatches}
          className="rounded-full bg-white py-4 text-base font-bold text-ink shadow-card transition active:scale-95"
        >
          See your matches
        </button>
        <button
          onClick={onKeepSwiping}
          className="rounded-full bg-white/15 py-4 text-base font-semibold text-white ring-1 ring-white/40 backdrop-blur transition active:scale-95"
        >
          Keep swiping
        </button>
      </motion.div>
    </motion.div>
  );
}
