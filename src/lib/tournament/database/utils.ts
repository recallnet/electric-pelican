/**
 * @file Tournament database utility functions.
 * @description Helper and utility functions for tournament operations.
 */

/**
 * Generates a codename for a user.
 * @description Creates a deterministic codename from a user ID.
 * Used as a fallback when user profile data is not available.
 *
 * @param userId - ID of the user
 * @returns Generated codename string
 */
export function generateCodename(userId: string): string {
  const prefixes = [
    "Cyber",
    "Quantum",
    "Neural",
    "Data",
    "Code",
    "Pixel",
    "Binary",
    "Matrix",
    "Vector",
    "Logic",
    "Nano",
    "Crypto",
    "Digital",
    "Plasma",
    "Fusion",
    "Nexus",
  ];

  const suffixes = [
    "Void",
    "Byte",
    "Core",
    "Link",
    "Node",
    "Wave",
    "Grid",
    "Flux",
    "Echo",
    "Spark",
    "Prime",
    "Edge",
    "Storm",
    "Pulse",
    "Shift",
    "Ghost",
  ];

  // Use simple hash of userId to pick consistent prefix/suffix
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash + userId.charCodeAt(i)) & 0xffffffff;
  }

  const prefixIndex = Math.abs(hash) % prefixes.length;
  const suffixIndex = Math.abs(hash >> 8) % suffixes.length;

  return `${prefixes[prefixIndex]}${suffixes[suffixIndex]}`;
}
