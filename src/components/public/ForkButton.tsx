"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ElectricButton } from "@/components/ui/electric-button";

interface ForkButtonProps {
  tournamentId: string;
  className?: string;
  slug?: string;
}

export function ForkButton({ tournamentId, className = "" }: ForkButtonProps) {
  const { authenticated, login } = usePrivy();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Hide button if user is owner - TODO: Add createdBy prop or fetch tournament owner
  // if (ready && authenticated && user?.id === createdBy) {
  //   return null;
  // }

  const handleFork = async () => {
    if (!authenticated) {
      login();
      return;
    }

    setLoading(true);
    try {
      // Lazy import to avoid client bundle size hit on first load
      const { typedApi } = await import("@/lib/api-client");
      const data = await typedApi("POST /api/tournament/:id/fork", { id: tournamentId });

      router.push(`/eval/${data.newTournamentId}/edit`);
      toast.success("Evaluation forked!", {
        description: "You can now modify the forked evaluation.",
      });
    } catch (err) {
      toast.error("Fork failed", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (authenticated) {
        setOpen(true);
      } else {
        login();
      }
    }
  };

  return (
    <>
      <Button
        variant="default"
        className={`ring-green-400 focus:ring-2 ${className}`}
        onClick={() => {
          if (authenticated) {
            setOpen(true);
          } else {
            login();
          }
        }}
        onKeyDown={handleKeyDown}
        aria-label="Fork Tournament"
        aria-haspopup="dialog"
      >
        Fork Tournament
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-mono text-lg">Fork Evaluation</DialogTitle>
          </DialogHeader>
          <DialogDescription className="text-brand-gray-04 mt-2">
            A copy of this evaluation will be created under your account. You can modify its
            settings and run your own version.
          </DialogDescription>
          <DialogFooter className="mt-4 flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
              aria-label="Cancel forking"
            >
              Cancel
            </Button>
            <ElectricButton
              size="sm"
              variant="outline"
              onClick={handleFork}
              disabled={loading}
              className="text-xs"
              aria-label="Fork Evaluation"
            >
              {loading ? "..." : "Fork"}
            </ElectricButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
