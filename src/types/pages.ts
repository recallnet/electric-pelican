/**
 * Type definitions for page components
 */

/**
 * Metadata params for model pages
 */
export interface ModelMetadataParams {
  /** Model ID parameter(s) with Promise support */
  params: Promise<{
    id: string[];
  }>;
}

/**
 * Metadata params for single model page
 */
export interface SingleModelMetadataParams {
  /** Model ID parameter with Promise support */
  params: Promise<{
    id: string;
  }>;
}

/**
 * Page parameters for model page array path
 */
export interface ModelPageParams {
  /** Model ID parameter(s) with Promise support */
  params: Promise<{
    id: string[] | string;
  }>;
}

/**
 * Resolved model page params after Promise is unwrapped
 */
export interface ResolvedModelPageParams {
  /** Model ID parameter */
  id: string[] | string;
}

/**
 * Page parameters for single model page
 */
export interface SingleModelPageParams {
  /** Model ID parameter */
  params: {
    id: string;
  };
}

/**
 * Page parameters for user page
 */
export interface UserPageParams {
  /** User ID parameter */
  params: {
    id: string;
  };
}

/**
 * User page search parameters
 */
export interface UserPageSearchParams {
  /** Search parameters */
  searchParams: {
    tab?: string;
  };
}

/**
 * Users page search parameters
 */
export interface UsersPageSearchParams {
  /** Search parameters */
  searchParams: {
    sort?: string;
    order?: string;
  };
}

/**
 * Metadata props for tag leaderboard pages
 */
export interface TagLeaderboardMetadataProps {
  /** Tag ID parameter */
  params: Promise<{ tagId: string }>;
}

/**
 * Provider component props
 */
export interface ProvidersProps {
  /** Children components */
  children: React.ReactNode;
}
