/**
 * App-specific types that don't fit into other type categories
 */

/** Props for page metadata */
export interface PageMetadataProps {
  params: {
    id: string;
  };
}

/** Props for providers */
export interface ProvidersProps {
  children: React.ReactNode;
}

/** Props for response sections */
export interface ResponseSectionProps {
  modelName: string;
  response: string;
  isWinner: boolean;
}

/** Props for champion response renderer */
export interface ChampionResponseRendererProps {
  content: string;
  className?: string;
}

/** User profile data */
export interface UserProfile {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  evaluationsCreated: number;
  /** Legacy free-text top tags */
  topTags: string[];
  /** Hierarchical capability top tags (from taxonomy) */
  topTagIds?: import("@/types/taxonomy").HierarchicalTagId[];
  createdAt: string;
}

/** User tournaments response */
export interface UserTournamentsResponse {
  user: {
    id: string;
    displayName: string;
    avatarUrl?: string;
  };
  tournaments: TournamentSummary[];
  total: number;
  page: number;
  hasMore: boolean;
}

/** Tournament list response */
export interface TournamentListResponse {
  tournaments: TournamentSummary[];
  total: number;
  page: number;
  hasMore: boolean;
}

/** Tournament summary */
export interface TournamentSummary {
  /** Tournament ID */
  id: string;
  /** URL-friendly identifier */
  slug?: string;
  /** Human-readable title */
  title: string;
  /** Challenge prompt */
  prompt: string;
  /** Current status */
  status: "completed" | "in-progress";
  /** Creation timestamp */
  createdAt: string;
  /** ID of creator */
  createdBy: string;
  /** Display name of creator */
  authorName: string;
  /** Avatar URL of creator */
  authorAvatarUrl?: string;
  /** Number of upvotes */
  upvoteCount: number;
  /** Whether requesting user has upvoted */
  hasUpvoted: boolean;
  /** Number of forks */
  forkCount: number;
  /** Hierarchical capability tags (from taxonomy) */
  tagIds: import("@/types/taxonomy").HierarchicalTagId[];
  /** Participating model IDs */
  models?: string[];
  /** Whether the current user is the owner */
  isOwner?: boolean;
}

/** Fork request */
export interface ForkRequest {
  changes?: {
    prompt?: string;
    models?: string[];
    judgeModel?: string;
    judgePrompt?: string;
  };
}

/** Version request */
export interface VersionRequest {
  userId: string;
  changes?: {
    prompt?: string;
    models?: string[];
    judgeModel?: string;
    judgePrompt?: string;
  };
}

/** Database tournament record type */
export interface TournamentRecord {
  /** Tournament ID */
  id: string;
  /** URL-friendly slug */
  slug: string;
  /** Tournament title */
  title: string;
  /** Challenge prompt */
  prompt: string;
  /** Participating models (array or JSON string) */
  models: string | string[];
  /** Tournament tags (array or JSON string) - DEPRECATED: use tagIds instead */
  tags?: string | string[];
  /** Hierarchical tag IDs (array or JSON string) */
  tagIds?: string | import("@/types/taxonomy").HierarchicalTagId[];
  /** Number of models in bracket */
  bracketSize: number;
  /** Creator user ID */
  createdBy: string;
  /** Creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
  /** Number of forks */
  forkCount?: number;
  /** Tournament version */
  version?: number;
}
