export interface Profile {
  id: number;
  name: string;
  age: number;
  bio: string;
  city: string;
  college: string;
  photo: string;
  photos: string[];
  interests: string[];
}

export type SwipeAction = "like" | "pass";

export interface FeedFilters {
  minAge?: number;
  maxAge?: number;
  city?: string;
  college?: string;
  interests?: string[];
}

export interface MatchEntry {
  matchId: number;
  matchedAt: string;
  profile: Profile;
}

export interface SwipeResult {
  swipeId: number;
  action: SwipeAction;
  matched: boolean;
  match: MatchEntry | null;
}

export interface Stats {
  viewed: number;
  likes: number;
  passes: number;
  matches: number;
}

export interface FilterOptions {
  cities: string[];
  colleges: string[];
  interests: string[];
  minAge: number;
  maxAge: number;
}
