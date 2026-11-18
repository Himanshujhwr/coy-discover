export type {
  Profile,
  SwipeAction,
  SwipeResult,
  MatchEntry,
  Stats,
  FilterOptions,
} from "@/server/types";

export interface ActiveFilters {
  minAge: number | null;
  maxAge: number | null;
  city: string;
  college: string;
  interests: string[];
}

export const EMPTY_FILTERS: ActiveFilters = {
  minAge: null,
  maxAge: null,
  city: "",
  college: "",
  interests: [],
};

export function countActiveFilters(f: ActiveFilters): number {
  return (
    (f.minAge !== null || f.maxAge !== null ? 1 : 0) +
    (f.city ? 1 : 0) +
    (f.college ? 1 : 0) +
    (f.interests.length > 0 ? 1 : 0)
  );
}

export const REPORT_REASONS: { value: string; label: string }[] = [
  { value: "fake_profile", label: "Fake profile" },
  { value: "inappropriate_photos", label: "Inappropriate photos" },
  { value: "harassment", label: "Harassment" },
  { value: "spam", label: "Spam or scam" },
  { value: "underage", label: "Seems underage" },
  { value: "other", label: "Something else" },
];
