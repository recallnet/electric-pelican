/**
 * @file Leaderboard-related component type definitions
 * @description Types for leaderboard, ranking, and comparison UI components
 */

/** Props for leaderboard filters */
export interface LeaderboardFiltersProps {
  searchTerm: string;
  minMatches: number;
  onSearchChange: (term: string) => void;
  onMinMatchesChange: (matches: number) => void;
  isLoading: boolean;
}

/** Props for leaderboard stats */
export interface LeaderboardStatsProps {
  totalModels: number;
  totalMatches: number;
  averageScore: number;
  isLoading: boolean;
}

/** Props for sort button */
export interface SortButtonProps {
  label: string;
  sortKey: "globalScore" | "winRate" | "matchesPlayed";
  currentSort: "globalScore" | "winRate" | "matchesPlayed";
  currentOrder: "asc" | "desc";
  onSort: (sortKey: "globalScore" | "winRate" | "matchesPlayed") => void;
}

/** Props for win rate indicator */
export interface WinRateIndicatorProps {
  winRate: number;
  wins: number;
  losses: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}
