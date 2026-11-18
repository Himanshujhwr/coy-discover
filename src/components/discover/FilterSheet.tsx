"use client";

import { useState } from "react";
import { EMPTY_FILTERS, type ActiveFilters, type FilterOptions } from "@/lib/types";
import { Sheet } from "./Sheet";

const selectCls =
  "w-full appearance-none rounded-2xl bg-lav px-4 py-3.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-pink";

export function FilterSheet({
  options,
  value,
  onApply,
  onClose,
}: {
  options: FilterOptions;
  value: ActiveFilters;
  onApply: (f: ActiveFilters) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<ActiveFilters>(value);
  const lo = draft.minAge ?? options.minAge;
  const hi = draft.maxAge ?? options.maxAge;

  function setAge(nextLo: number, nextHi: number) {
    const a = Math.min(nextLo, nextHi);
    const b = Math.max(nextLo, nextHi);
    setDraft((d) => ({
      ...d,
      minAge: a <= options.minAge ? null : a,
      maxAge: b >= options.maxAge ? null : b,
    }));
  }

  function toggleInterest(i: string) {
    setDraft((d) => ({
      ...d,
      interests: d.interests.includes(i) ? d.interests.filter((x) => x !== i) : [...d.interests, i],
    }));
  }

  return (
    <Sheet title="Filters" onClose={onClose}>
      <div className="space-y-6 px-5 pb-6">
        <section>
          <div className="mb-2 flex items-baseline justify-between">
            <h3 className="text-xs font-bold uppercase tracking-widest text-ink-faint">Age</h3>
            <span className="text-sm font-bold">
              {lo} – {hi}
            </span>
          </div>
          <div className="space-y-2 rounded-2xl bg-lav px-4 py-3">
            <label className="flex items-center gap-3 text-xs font-semibold text-ink-soft">
              <span className="w-8">Min</span>
              <input
                type="range"
                aria-label="Minimum age"
                min={options.minAge}
                max={options.maxAge}
                value={lo}
                onChange={(e) => setAge(Number(e.target.value), hi)}
                className="flex-1"
              />
            </label>
            <label className="flex items-center gap-3 text-xs font-semibold text-ink-soft">
              <span className="w-8">Max</span>
              <input
                type="range"
                aria-label="Maximum age"
                min={options.minAge}
                max={options.maxAge}
                value={hi}
                onChange={(e) => setAge(lo, Number(e.target.value))}
                className="flex-1"
              />
            </label>
          </div>
        </section>

        <section>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-ink-faint">City</h3>
          <select
            aria-label="City"
            className={selectCls}
            value={draft.city}
            onChange={(e) => setDraft((d) => ({ ...d, city: e.target.value }))}
          >
            <option value="">Anywhere</option>
            {options.cities.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </section>

        <section>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-ink-faint">College</h3>
          <select
            aria-label="College"
            className={selectCls}
            value={draft.college}
            onChange={(e) => setDraft((d) => ({ ...d, college: e.target.value }))}
          >
            <option value="">Any college</option>
            {options.colleges.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </section>

        <section>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-ink-faint">
            Interests <span className="font-medium normal-case tracking-normal">(any of)</span>
          </h3>
          <div className="flex flex-wrap gap-2">
            {options.interests.map((i) => {
              const on = draft.interests.includes(i);
              return (
                <button
                  key={i}
                  role="checkbox"
                  aria-checked={on}
                  onClick={() => toggleInterest(i)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                    on ? "bg-pink text-white shadow-pop" : "bg-lav text-lav-ink hover:bg-lav-deep/70"
                  }`}
                >
                  {i}
                </button>
              );
            })}
          </div>
        </section>

        <div className="flex gap-3 pt-1">
          <button
            onClick={() => setDraft(EMPTY_FILTERS)}
            className="rounded-full bg-lav px-6 py-3.5 text-sm font-semibold"
          >
            Reset
          </button>
          <button
            onClick={() => {
              onApply(draft);
              onClose();
            }}
            className="flex-1 rounded-full bg-pink py-3.5 text-sm font-bold text-white shadow-pop transition active:scale-95"
          >
            Show results
          </button>
        </div>
      </div>
    </Sheet>
  );
}
