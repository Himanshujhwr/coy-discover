"use client";

import { AnimatePresence, motion, useMotionValue, useTransform, type PanInfo } from "framer-motion";
import { Heart, Info, MapPin, RotateCcw, X, GraduationCap } from "lucide-react";
import { useEffect } from "react";
import { Photo } from "@/components/Photo";
import type { Profile, SwipeAction } from "@/lib/types";

const COMMIT_DISTANCE = 110;
const COMMIT_VELOCITY = 600;

const variants = {
  enter: { scale: 0.94, y: 14, opacity: 0.9 },
  center: { scale: 1, y: 0, opacity: 1, transition: { type: "spring" as const, stiffness: 260, damping: 24 } },
  exit: (dir: number) => ({
    x: dir * 520,
    rotate: dir * 18,
    opacity: 0,
    transition: { duration: 0.3, ease: "easeIn" as const },
  }),
};

function CardFace({ profile, onInfo }: { profile: Profile; onInfo?: () => void }) {
  return (
    <>
      <Photo src={profile.photo} name={profile.name} className="absolute inset-0 h-full w-full" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />
      {onInfo && (
        <button
          aria-label={`View ${profile.name}'s full profile`}
          onClick={(e) => {
            e.stopPropagation();
            onInfo();
          }}
          onPointerDownCapture={(e) => e.stopPropagation()}
          className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/25 text-white backdrop-blur-md transition hover:bg-white/40"
        >
          <Info size={20} />
        </button>
      )}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 space-y-2.5 p-5 text-white">
        <h2 className="font-display text-[32px] font-bold leading-none">
          {profile.name}
          <span className="ml-2 font-medium text-white/85">{profile.age}</span>
        </h2>
        <div className="space-y-1 text-sm text-white/90">
          <p className="flex items-center gap-1.5">
            <MapPin size={14} /> {profile.city}
          </p>
          <p className="flex items-center gap-1.5">
            <GraduationCap size={14} /> {profile.college}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {profile.interests.slice(0, 3).map((i) => (
            <span key={i} className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-md">
              {i}
            </span>
          ))}
        </div>
      </div>
    </>
  );
}

function TopCard({
  profile,
  onSwipe,
  onOpen,
}: {
  profile: Profile;
  onSwipe: (a: SwipeAction) => void;
  onOpen: (p: Profile) => void;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-240, 0, 240], [-14, 0, 14]);
  const likeOpacity = useTransform(x, [24, 120], [0, 1]);
  const passOpacity = useTransform(x, [-120, -24], [1, 0]);
  const tint = useTransform(x, [-160, 0, 160], ["rgba(120,120,140,0.35)", "rgba(0,0,0,0)", "rgba(255,79,147,0.35)"]);

  function onDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.x > COMMIT_DISTANCE || info.velocity.x > COMMIT_VELOCITY) onSwipe("like");
    else if (info.offset.x < -COMMIT_DISTANCE || info.velocity.x < -COMMIT_VELOCITY) onSwipe("pass");
  }

  return (
    <motion.div
      key={profile.id}
      style={{ x, rotate }}
      variants={variants}
      initial="enter"
      animate="center"
      exit="exit"
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.85}
      onDragEnd={onDragEnd}
      onTap={() => onOpen(profile)}
      whileTap={{ cursor: "grabbing" }}
      className="absolute inset-0 cursor-grab touch-pan-y overflow-hidden rounded-[2rem] bg-lav shadow-card"
    >
      <CardFace profile={profile} onInfo={() => onOpen(profile)} />
      <motion.div style={{ backgroundColor: tint }} className="pointer-events-none absolute inset-0" />
      <motion.div
        style={{ opacity: likeOpacity }}
        className="pointer-events-none absolute left-5 top-8 -rotate-12 rounded-xl border-4 border-pink px-3 py-1 font-display text-3xl font-extrabold tracking-wider text-pink"
      >
        LIKE
      </motion.div>
      <motion.div
        style={{ opacity: passOpacity }}
        className="pointer-events-none absolute right-5 top-8 rotate-12 rounded-xl border-4 border-white px-3 py-1 font-display text-3xl font-extrabold tracking-wider text-white"
      >
        PASS
      </motion.div>
    </motion.div>
  );
}

export function SwipeDeck({
  queue,
  exitDir,
  canUndo,
  onSwipe,
  onUndo,
  onOpen,
}: {
  queue: Profile[];
  exitDir: 1 | -1;
  canUndo: boolean;
  onSwipe: (a: SwipeAction) => void;
  onUndo: () => void;
  onOpen: (p: Profile) => void;
}) {
  const top = queue[0];
  const behind = queue[1];

  // Desktop keyboard shortcuts.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLElement && /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
      if (e.key === "ArrowRight") onSwipe("like");
      else if (e.key === "ArrowLeft") onSwipe("pass");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onSwipe]);

  return (
    <div className="flex h-full flex-col">
      <div className="relative min-h-0 flex-1">
        {behind && (
          <div
            key={`behind-${behind.id}`}
            aria-hidden
            className="absolute inset-0 origin-bottom overflow-hidden rounded-[2rem] bg-lav opacity-90 shadow-soft"
            style={{ transform: "translateY(14px) scale(0.94)" }}
          >
            <CardFace profile={behind} />
          </div>
        )}
        <AnimatePresence custom={exitDir} initial={false}>
          {top && <TopCard key={top.id} profile={top} onSwipe={onSwipe} onOpen={onOpen} />}
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-center gap-5 pb-1 pt-5">
        <button
          onClick={() => onSwipe("pass")}
          disabled={!top}
          aria-label="Pass"
          className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-ink-soft shadow-soft ring-1 ring-lav-deep/60 transition hover:text-ink active:scale-90 disabled:opacity-40"
        >
          <X size={28} strokeWidth={2.6} />
        </button>
        <button
          onClick={onUndo}
          disabled={!canUndo}
          aria-label="Undo last swipe"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-lav text-lav-ink transition active:scale-90 disabled:opacity-40"
        >
          <RotateCcw size={20} strokeWidth={2.4} />
        </button>
        <button
          onClick={() => onSwipe("like")}
          disabled={!top}
          aria-label="Like"
          className="flex h-16 w-16 items-center justify-center rounded-full bg-pink text-white shadow-pop transition hover:bg-pink-deep active:scale-90 disabled:opacity-40"
        >
          <Heart size={28} fill="currentColor" strokeWidth={0} />
        </button>
      </div>
    </div>
  );
}

