"use client";

import { Eye, Heart, Sparkles, X } from "lucide-react";
import type { Stats } from "@/lib/types";

const ITEMS = [
  { key: "viewed", label: "Viewed", icon: Eye },
  { key: "likes", label: "Likes", icon: Heart },
  { key: "passes", label: "Passes", icon: X },
  { key: "matches", label: "Matches", icon: Sparkles },
] as const;

export function StatsRow({ stats }: { stats: Stats }) {
  return (
    <dl className="grid grid-cols-4 gap-2" aria-label="Discovery statistics">
      {ITEMS.map(({ key, label, icon: Icon }) => (
        <div key={key} className="rounded-2xl bg-lav px-2 py-2 text-center">
          <dd className="font-display text-lg font-bold leading-none">{stats[key]}</dd>
          <dt className="mt-1 flex items-center justify-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-ink-faint">
            <Icon size={10} strokeWidth={2.6} />
            {label}
          </dt>
        </div>
      ))}
    </dl>
  );
}
