/**
 * @file Model-related component type definitions
 * @description Types for model display, performance, and evaluation UI components
 */

/** Props for components that handle model data */
export interface ModelDisplayProps {
  modelId: string;
  modelName: string;
  response?: string;
  isWinner?: boolean;
}

/** Props for model rank badge */
export interface ModelRankBadgeProps {
  rank: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/** Tag performance data */
export interface TagData {
  /** Legacy tag name or hierarchical tag ID */
  tag: string;
  /** Tag display name (for hierarchical tags) */
  displayName?: string;
  /** Full lineage breadcrumb string (for hierarchical tags) */
  lineage?: string;
  /** Performance percentile (0-100) */
  percentile: number;
  /** Number of wins */
  wins: number;
  /** Total number of matches */
  total: number;
  /** Whether this is a hierarchical tag */
  isHierarchical?: boolean;
}

/** Tag ELO score data for model capabilities */
export interface TagELOData {
  /** Model ID */
  modelId: string;
  /** Hierarchical tag ID */
  tagId: string;
  /** Human-readable tag name */
  tagName: string;
  /** Tag level (1=pillar, 2=family, 3=leaf) */
  tagLevel: number;
  /** Parent tag ID if applicable */
  parentTagId?: string;
  /** ELO score for this tag */
  eloScore: number;
  /** Number of matches played for this tag */
  matchesPlayed: number;
  /** Number of wins */
  wins: number;
  /** Number of losses */
  losses: number;
  /** Win rate (0-1) */
  winRate: number;
  /** Rank among all models for this tag (1 = best) */
  rank: number;
  /** Total number of models evaluated for this tag */
  totalModelsForTag: number;
  /** Percentile ranking (0-100, 100 = best) */
  percentile: number;
  /** Last time this model was evaluated for this tag */
  lastActive: string;
}

/** Props for tag performance chart */
export interface TagPerformanceChartProps {
  modelId: string;
  className?: string;
}

/** Props for evaluation history */
export interface EvaluationHistoryProps {
  modelId: string;
  evaluationHistory?: {
    evaluations: Array<{
      tournamentId: string;
      title: string;
      prompt: string;
      result: "win" | "loss" | "ongoing";
      opponent?: string;
      createdAt: string;
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  isLoading: boolean;
}

/** Props for model header */
export interface ModelHeaderProps {
  modelStats: {
    modelScore: {
      modelId: string;
      globalScore: number;
      matchesPlayed: number;
      wins: number;
      losses: number;
      winRate: number;
      rank: number;
      lastActive: string;
    };
    recentMatches: Array<{
      tournamentRunId: string;
      roundNumber: number;
      winnerModelId: string;
      loserModelId: string;
      winnerScoreBefore: number;
      loserScoreBefore: number;
      winnerScoreAfter: number;
      loserScoreAfter: number;
      createdAt: string;
    }>;
    eloHistory: Array<{
      date: string;
      score: number;
      change: number;
    }>;
  };
}

/** Props for performance section */
export interface PerformanceSectionProps {
  modelStats: {
    modelScore: {
      modelId: string;
      globalScore: number;
      matchesPlayed: number;
      wins: number;
      losses: number;
      winRate: number;
      rank: number;
      lastActive: string;
    };
    recentMatches: Array<{
      tournamentRunId: string;
      roundNumber: number;
      winnerModelId: string;
      loserModelId: string;
      winnerScoreBefore: number;
      loserScoreBefore: number;
      winnerScoreAfter: number;
      loserScoreAfter: number;
      createdAt: string;
    }>;
    eloHistory: Array<{
      date: string;
      score: number;
      change: number;
    }>;
  };
}

/** Props for model card */
export interface ModelCardProps {
  model: {
    id: string;
    name: string;
    description: string;
    capabilities: string[];
    isNew?: boolean;
    provider?: string;
    context_length?: number;
  };
  rating?: {
    /** Global ELO score or rating */
    globalScore: number;
    /** Total number of matches played */
    matchesPlayed: number;
    /** Number of won matches */
    wins: number;
    /** Number of lost matches */
    losses: number;
    /** Win percentage (0-100) */
    winRate: number;
    /** Leaderboard position */
    rank: number;
  };
  isContestant: boolean;
  isJudge: boolean;
  canAddContestant: boolean;
  onToggleContestant: (modelId: string) => void;
  onSelectJudge: (modelId: string) => void;
}

/** Props for recent matches */
export interface RecentMatchesProps {
  modelStats: {
    modelScore: {
      modelId: string;
      globalScore: number;
      matchesPlayed: number;
      wins: number;
      losses: number;
      winRate: number;
      rank: number;
      lastActive: string;
    };
    recentMatches: Array<{
      tournamentRunId: string;
      roundNumber: number;
      winnerModelId: string;
      loserModelId: string;
      winnerScoreBefore: number;
      loserScoreBefore: number;
      winnerScoreAfter: number;
      loserScoreAfter: number;
      createdAt: string;
    }>;
    eloHistory: Array<{
      date: string;
      score: number;
      change: number;
    }>;
  };
}

/** Props for model link */
export interface ModelLinkProps {
  modelId: string;
  modelName?: string;
  className?: string;
}

/** Props for ELO chart */
export interface ELOChartProps {
  eloHistory: Array<{
    date: string;
    score: number;
    change: number;
  }>;
}
