"use client";

import { Check, Copy, Share } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

interface ShareButtonProps {
  shareUrl: string;
  title?: string;
}

export function ShareButton({ shareUrl, title = "Router Result" }: ShareButtonProps) {
  const [isSharing, setIsSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [fullUrl, setFullUrl] = useState("");
  const [hasNativeShare, setHasNativeShare] = useState(false);

  // Set the full URL and check for native share on client-side only
  useEffect(() => {
    setFullUrl(`${window.location.origin}${shareUrl}`);
    setHasNativeShare(
      typeof navigator !== "undefined" &&
        "share" in navigator &&
        typeof navigator.share === "function",
    );
  }, [shareUrl]);

  const handleShare = async () => {
    if (!fullUrl) return; // Don't share if URL isn't ready

    setIsSharing(true);

    try {
      // Try native Web Share API first (mobile)
      if (hasNativeShare) {
        await navigator.share({
          title,
          text: "Check out this AI router execution result",
          url: fullUrl,
        });
        // Don't show copied state for native sharing
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(fullUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        console.error("Share failed:", error);
        // Could add a more sophisticated error display here
      }
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleShare}
      disabled={isSharing || !fullUrl}
      className="flex items-center gap-2"
    >
      {isSharing ? (
        <>
          <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
          Sharing...
        </>
      ) : copied ? (
        <>
          <Check className="h-4 w-4 text-green-600" />
          Copied!
        </>
      ) : (
        <>
          {hasNativeShare ? <Share className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          Share
        </>
      )}
    </Button>
  );
}
