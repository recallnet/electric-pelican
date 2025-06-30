import { usePrivy } from "@privy-io/react-auth";
import { useEffect, useState } from "react";

// Global state to prevent duplicate profile updates across multiple hook instances
let globalProfileUpdateInProgress = false;
let globalProfileUpdated = false;

/**
 * Hook to manage user profile data collection and updates.
 * Automatically updates profile data when user logs in with full Privy user object.
 */
export function useUserProfile() {
  const { ready, authenticated, user } = usePrivy();
  const [profileUpdated, setProfileUpdated] = useState(globalProfileUpdated);
  const [isUpdating, setIsUpdating] = useState(globalProfileUpdateInProgress);

  useEffect(() => {
    if (
      !ready ||
      !authenticated ||
      !user ||
      profileUpdated ||
      globalProfileUpdated ||
      globalProfileUpdateInProgress
    ) {
      return;
    }

    // Update profile data when user is available
    const updateProfile = async () => {
      // Prevent duplicate requests
      if (globalProfileUpdateInProgress) {
        return;
      }

      globalProfileUpdateInProgress = true;
      setIsUpdating(true);

      try {
        console.log("Updating user profile...");

        const response = await fetch("/api/user/profile", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ privyUser: user }),
        });

        if (response.ok) {
          const result = await response.json();
          console.log("Profile updated successfully:", result.profileData);
          globalProfileUpdated = true;
          setProfileUpdated(true);
        } else {
          const errorText = await response.text();
          console.error(
            "Failed to update profile:",
            response.status,
            response.statusText,
            errorText,
          );
        }
      } catch (error) {
        console.error("Error updating profile:", error);
      } finally {
        globalProfileUpdateInProgress = false;
        setIsUpdating(false);
      }
    };

    updateProfile();
  }, [ready, authenticated, user, profileUpdated]);

  return {
    isUpdating,
    profileUpdated,
  };
}
