export type LeaderboardRow = {
  rank: number;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  clover_count: number;
};

export type LeafFilter = "all" | "4" | "5" | "6" | "7" | "8" | "9" | "10";
