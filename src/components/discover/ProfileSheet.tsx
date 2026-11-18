"use client";

import { Ban, ChevronLeft, Flag, GraduationCap, Heart, MapPin, X } from "lucide-react";
import { useRef, useState } from "react";
import { Photo } from "@/components/Photo";
import { ApiClientError } from "@/lib/api";
import { REPORT_REASONS, type Profile } from "@/lib/types";
import { Sheet } from "./Sheet";
import { Chip } from "./StatesAndBits";

type View = "profile" | "report" | "block";

export function ProfileSheet({
  profile,
  onClose,
  onBlock,
  onReport,
  onDecision,
}: {
  profile: Profile;
  onClose: () => void;
  onBlock: (id: number) => Promise<void>;
  onReport: (id: number, reason: string, details: string) => Promise<void>;
  /** Present only when opened from the deck, so the viewer can decide right here. */
  onDecision?: (action: "like" | "pass") => void;
}) {
  const [view, setView] = useState<View>("profile");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [page, setPage] = useState(0);
  const gallery = useRef<HTMLDivElement>(null);

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await fn();
      onClose();
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "Something went wrong");
      setBusy(false);
    }
  }

  const title = view === "profile" ? "" : view === "report" ? `Report ${profile.name}` : `Block ${profile.name}?`;

  return (
    <Sheet title={title} onClose={onClose} full={view === "profile"}>
      {view === "profile" && (
        <div className="pb-28">
          <div className="relative">
            <div
              ref={gallery}
              onScroll={(e) => {
                const el = e.currentTarget;
                setPage(Math.round(el.scrollLeft / el.clientWidth));
              }}
              className="scrollbar-none flex snap-x snap-mandatory overflow-x-auto"
            >
              {profile.photos.map((src, i) => (
                <div key={src + i} className="aspect-[4/5] w-full shrink-0 snap-center">
                  <Photo src={src} name={profile.name} className="h-full w-full" />
                </div>
              ))}
            </div>
            {profile.photos.length > 1 && (
              <div className="absolute inset-x-0 top-3 flex justify-center gap-1.5 px-6">
                {profile.photos.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1 flex-1 rounded-full ${i === page ? "bg-white" : "bg-white/40"}`}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="space-y-5 px-5 pt-5">
            <div>
              <h3 className="font-display text-3xl font-bold">
                {profile.name} <span className="font-medium text-ink-soft">{profile.age}</span>
              </h3>
              <p className="mt-2 flex items-center gap-1.5 text-sm text-ink-soft">
                <MapPin size={14} /> {profile.city}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-soft">
                <GraduationCap size={14} /> {profile.college}
              </p>
            </div>

            <section>
              <h4 className="mb-1.5 text-xs font-bold uppercase tracking-widest text-ink-faint">About</h4>
              <p className="leading-relaxed text-ink">{profile.bio}</p>
            </section>

            <section>
              <h4 className="mb-2 text-xs font-bold uppercase tracking-widest text-ink-faint">Interests</h4>
              <div className="flex flex-wrap gap-2">
                {profile.interests.map((i) => (
                  <Chip key={i}>{i}</Chip>
                ))}
              </div>
            </section>

            <div className="flex gap-3 border-t border-lav pt-4">
              <button
                onClick={() => setView("block")}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-lav py-3 text-sm font-semibold text-ink-soft transition hover:text-ink"
              >
                <Ban size={16} /> Block
              </button>
              <button
                onClick={() => setView("report")}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-lav py-3 text-sm font-semibold text-ink-soft transition hover:text-ink"
              >
                <Flag size={16} /> Report
              </button>
            </div>
          </div>

          {onDecision && (
            <div className="absolute inset-x-0 bottom-0 flex justify-center gap-5 bg-gradient-to-t from-white via-white to-transparent pb-5 pt-8">
              <button
                aria-label="Pass"
                onClick={() => {
                  onDecision("pass");
                  onClose();
                }}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-ink-soft shadow-soft ring-1 ring-lav-deep/60 active:scale-90"
              >
                <X size={26} strokeWidth={2.6} />
              </button>
              <button
                aria-label="Like"
                onClick={() => {
                  onDecision("like");
                  onClose();
                }}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-pink text-white shadow-pop active:scale-90"
              >
                <Heart size={26} fill="currentColor" strokeWidth={0} />
              </button>
            </div>
          )}
        </div>
      )}

      {view === "report" && (
        <div className="space-y-4 px-5 pb-6">
          <p className="text-sm text-ink-soft">
            Tell us what's wrong. Reporting also blocks {profile.name}, and they won't be told.
          </p>
          <div className="space-y-2" role="radiogroup" aria-label="Report reason">
            {REPORT_REASONS.map((r) => (
              <button
                key={r.value}
                role="radio"
                aria-checked={reason === r.value}
                onClick={() => setReason(r.value)}
                className={`flex w-full items-center justify-between rounded-2xl px-4 py-3.5 text-left text-sm font-semibold transition ${
                  reason === r.value ? "bg-pink-soft text-pink-deep ring-2 ring-pink" : "bg-lav text-ink"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="Anything else we should know? (optional)"
            className="w-full resize-none rounded-2xl bg-lav p-4 text-sm outline-none placeholder:text-ink-faint focus:ring-2 focus:ring-pink"
          />
          {error && <p role="alert" className="text-sm font-medium text-pink-deep">{error}</p>}
          <div className="flex gap-3">
            <button
              onClick={() => setView("profile")}
              className="flex items-center gap-1 rounded-full bg-lav px-5 py-3.5 text-sm font-semibold"
            >
              <ChevronLeft size={16} /> Back
            </button>
            <button
              disabled={!reason || busy}
              onClick={() => run(() => onReport(profile.id, reason, details))}
              className="flex-1 rounded-full bg-pink py-3.5 text-sm font-bold text-white shadow-pop transition active:scale-95 disabled:opacity-40 disabled:shadow-none"
            >
              {busy ? "Sending…" : "Send report"}
            </button>
          </div>
        </div>
      )}

      {view === "block" && (
        <div className="space-y-5 px-5 pb-6">
          <p className="leading-relaxed text-ink-soft">
            {profile.name} will disappear from your Discover feed and your matches. This can't be undone
            from the app yet.
          </p>
          {error && <p role="alert" className="text-sm font-medium text-pink-deep">{error}</p>}
          <div className="flex gap-3">
            <button
              onClick={() => setView("profile")}
              className="flex items-center gap-1 rounded-full bg-lav px-5 py-3.5 text-sm font-semibold"
            >
              <ChevronLeft size={16} /> Back
            </button>
            <button
              disabled={busy}
              onClick={() => run(() => onBlock(profile.id))}
              className="flex-1 rounded-full bg-ink py-3.5 text-sm font-bold text-white transition active:scale-95 disabled:opacity-40"
            >
              {busy ? "Blocking…" : `Block ${profile.name}`}
            </button>
          </div>
        </div>
      )}
    </Sheet>
  );
}
