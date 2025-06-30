"use client";
import { usePrivy } from "@privy-io/react-auth";
import Image from "next/image";

import { useUserProfile } from "@/hooks/useUserProfile";

import { Button } from "../ui/button";

export function UserProfile() {
  const { ready, authenticated, user, logout } = usePrivy();

  // Update user profile data automatically
  const { isUpdating } = useUserProfile();

  if (!ready) {
    return <div>Loading...</div>;
  }

  if (!authenticated || !user) {
    return <div>Not logged in</div>;
  }

  // Get display name with fallbacks
  const getDisplayName = () => {
    // Priority: GitHub name > Google name > email username > generic fallback
    if (user.github?.name) return user.github.name;
    if (user.github?.username) return user.github.username;
    if (user.google?.name) return user.google.name;
    if (user.email?.address) {
      return user.email.address.split("@")[0].replace(/[._]/g, " ");
    }
    return "User";
  };

  // Get avatar URL with fallbacks
  const getAvatarUrl = () => {
    // Priority: GitHub avatar > user.picture > null
    if (user.github?.username) {
      return `https://github.com/${user.github.username}.png`;
    }
    if (user.picture) {
      return user.picture;
    }
    return null;
  };

  // Get provider info

  return (
    <div className="p-4 border border-primary rounded space-y-4">
      <div className="flex items-center gap-3">
        {getAvatarUrl() ? (
          <Image
            src={getAvatarUrl()!}
            alt={`${getDisplayName()} avatar`}
            width={48}
            height={48}
            className="rounded-full border-2 border-primary"
          />
        ) : (
          <div className="w-12 h-12 rounded-full border-2 border-primary bg-primary/10 flex items-center justify-center">
            <span className="text-lg font-medium text-primary">
              {getDisplayName().charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div>
          <p className="font-medium">{getDisplayName()}</p>
          <p className="text-sm text-muted-foreground">{user.email?.address || "No email"}</p>
        </div>
      </div>

      {isUpdating && <div className="text-sm text-blue-600">Updating profile...</div>}

      <Button variant="outline" onClick={logout} size="sm">
        Log out
      </Button>
    </div>
  );
}
