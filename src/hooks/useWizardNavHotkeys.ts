"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

const stepOrder = ["/challenge", "/models", "/eval/setup"];

export function useWizardNavHotkeys() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      // Ignore if focus is within an interactive element (not document body)
      const active = document.activeElement as HTMLElement | null;
      if (active && active !== document.body) return;

      if (e.key === "ArrowRight" && !e.altKey && !e.metaKey && !e.ctrlKey) {
        const idx = stepOrder.indexOf(pathname);
        if (idx >= 0 && idx < stepOrder.length - 1) {
          router.push(stepOrder[idx + 1]!);
        }
      }
      if (e.key === "ArrowLeft" && !e.altKey && !e.metaKey && !e.ctrlKey) {
        const idx = stepOrder.indexOf(pathname);
        if (idx > 0) {
          router.push(stepOrder[idx - 1]!);
        }
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [pathname, router]);
}
