/**
 * @file User-related component type definitions
 * @description Types for user profiles, tables, and user management components
 */

/** Props for users table */
export interface UsersTableProps {
  users: UserSummary[];
}

/** User summary data */
export interface UserSummary {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  evaluationsCreated: number;
  topTags: string[];
  createdAt: string;
}
