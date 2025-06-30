import { useCallback, useState } from "react";

/**
 * Hook for generating creative challenge and judge pairs for tournaments
 */
export const useChallengeGenerator = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateChallenge = useCallback(async (): Promise<{
    challenge: string;
  } | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/challenge-generator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      return {
        challenge: data.challenge,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to generate challenge";
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    generateChallenge,
    isLoading,
    error,
  };
};
