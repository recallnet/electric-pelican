/**
 * @file Author display component
 * @description Component for rendering author information with avatar and display name
 */

import Link from "next/link";

/**
 * Render author information with avatar and display name
 */
export function AuthorDisplay({
  authorName,
  authorAvatarUrl,
  createdBy,
}: {
  authorName: string;
  authorAvatarUrl: string | undefined;
  createdBy: string;
}) {
  const initials = authorName
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Validate if the URL is a valid, non-empty string
  const isValidUrl =
    authorAvatarUrl &&
    typeof authorAvatarUrl === "string" &&
    authorAvatarUrl.trim().length > 0 &&
    (authorAvatarUrl.startsWith("http://") ||
      authorAvatarUrl.startsWith("https://") ||
      authorAvatarUrl.startsWith("data:"));

  return (
    <Link
      href={`/user/${createdBy}`}
      className="flex items-center gap-2 hover:opacity-80 transition-opacity"
    >
      {/* Avatar */}
      <div className="w-6 h-6 rounded-full overflow-hidden bg-brand-gray-01 flex-shrink-0 border border-brand-gray-02">
        {isValidUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={authorAvatarUrl}
            alt={`${authorName}'s avatar`}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to initials if image fails to load
              const target = e.target as HTMLImageElement;
              target.style.display = "none";
              const fallback = target.parentElement?.querySelector(
                ".initials-fallback",
              ) as HTMLElement;
              if (fallback) {
                fallback.style.display = "flex";
              }
            }}
          />
        ) : null}
        {/* Fallback initials */}
        <div
          className={`initials-fallback w-full h-full flex items-center justify-center text-xs font-medium text-brand-gray-04 bg-brand-gray-01 ${isValidUrl ? "hidden" : "flex"}`}
          style={{ display: isValidUrl ? "none" : "flex" }}
        >
          {initials}
        </div>
      </div>
    </Link>
  );
}
