"use client";

import { format } from "date-fns";
import Image from "next/image";
import Link from "next/link";

import { GlassPanel } from "@/components/ui/glass-panel";
import { type UsersTableProps } from "@/types/components";

/**
 * Render author information with avatar and display name
 */
function AuthorDisplay({
  authorName,
  authorAvatarUrl,
  createdBy,
}: {
  authorName: string;
  authorAvatarUrl: string | null;
  createdBy: string;
}) {
  const initials = authorName
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const isValidUrl =
    authorAvatarUrl &&
    typeof authorAvatarUrl === "string" &&
    authorAvatarUrl.trim().length > 0 &&
    (authorAvatarUrl.startsWith("http://") ||
      authorAvatarUrl.startsWith("https://") ||
      authorAvatarUrl.startsWith("data:") ||
      authorAvatarUrl.startsWith("<svg"));

  return (
    <Link
      href={`/user/${createdBy}`}
      className="flex items-center gap-2 hover:opacity-80 transition-opacity"
    >
      <div className="w-8 h-8 rounded-full overflow-hidden bg-brand-gray-01 flex-shrink-0 border border-brand-gray-02">
        {isValidUrl ? (
          authorAvatarUrl.startsWith("<svg") ? (
            <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: authorAvatarUrl }} />
          ) : (
            <Image
              src={authorAvatarUrl}
              alt={`${authorName}'s avatar`}
              width={32}
              height={32}
              className="w-full h-full object-cover"
              onError={(e) => {
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
          )
        ) : null}
        <div
          className={`initials-fallback w-full h-full flex items-center justify-center text-xs font-medium text-brand-gray-04 bg-brand-gray-01 ${isValidUrl ? "hidden" : "flex"}`}
          style={{ display: isValidUrl ? "none" : "flex" }}
        >
          {initials}
        </div>
      </div>
      <span className="text-sm font-medium text-brand-black truncate">{authorName}</span>
    </Link>
  );
}

export function UsersTable({ users }: UsersTableProps) {
  if (users.length === 0) {
    return <p className="text-brand-gray-03 italic">No users found.</p>;
  }

  return (
    <GlassPanel>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-brand-gray-02">
              <th className="text-left py-3 px-4 text-xs font-medium text-brand-black uppercase tracking-wide">
                User
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-brand-black uppercase tracking-wide">
                Evaluations
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-brand-black uppercase tracking-wide">
                Joined
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-brand-gray-01 hover:bg-brand-gray-01/50">
                <td className="py-3 px-4 max-w-sm">
                  <AuthorDisplay
                    authorName={user.displayName}
                    authorAvatarUrl={user.avatarUrl}
                    createdBy={user.id}
                  />
                </td>
                <td className="py-3 px-4">
                  <span className="text-sm text-brand-black font-medium">
                    {user.evaluationsCreated}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="text-xs text-brand-gray-04">
                    {format(new Date(user.createdAt), "MMM d, yyyy")}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassPanel>
  );
}
