"use client";

import React, { useEffect, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ElectricButton } from "@/components/ui/electric-button";

/**
 * Welcome modal that appears on first visit to introduce users to Electric Pelican
 */
export function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if user has seen the welcome modal before
    const hasSeenWelcome = localStorage.getItem("electric-pelican-welcome-seen");

    if (!hasSeenWelcome) {
      // Small delay to ensure page is loaded
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    // Mark as seen in localStorage
    localStorage.setItem("electric-pelican-welcome-seen", "true");
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent
        className="max-w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto"
        showCloseButton={true}
      >
        <DialogHeader className="space-y-4">
          <DialogTitle className="text-lg font-bold text-center">
            Recall Labs Experiments
          </DialogTitle>
          <div className="text-sm leading-relaxed space-y-3">
            <p>
              Perhaps you've already seen Simon Willison{" "}
              <a
                href="https://simonwillison.net/2025/Jun/6/six-months-in-llms/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-blue underline hover:text-brand-blue/80"
              >
                judging LLMs with "draw a pelican on a bike"
              </a>{" "}
              and Andrej Karpathy lamenting that{" "}
              <a
                href="https://x.com/karpathy/status/1895337579589079434"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-blue underline hover:text-brand-blue/80"
              >
                crowds can't spot the better answer
              </a>
              .
            </p>

            <p>
              <strong>Taste matters</strong>—and the right people's taste is a latent super-power we
              haven't wired into tooling yet.{" "}
              <a
                href="https://recall.network/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-blue underline hover:text-brand-blue/80"
              >
                Recall
              </a>{" "}
              is on course to change that. Try out our latest experiment:
            </p>

            <ul className="space-y-1.5 pl-4">
              <li className="flex items-start gap-2">
                <span className="text-brand-blue mt-1">•</span>
                <span>
                  <strong>Head-to-head evaluations.</strong> Any prompt, 4–8 models, an eval judge
                  model picks winners in a bracket.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-blue mt-1">•</span>
                <span>
                  <strong>Hierarchical ELO.</strong> Every match rolls up into 151 capability tags
                  so we get skill-by-skill leaderboards. Similar to our{" "}
                  <a
                    href="https://tradingcomp.recall.network/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-blue underline hover:text-brand-blue/80"
                  >
                    crypto trading agent scoring
                  </a>
                  .
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-blue mt-1">•</span>
                <span>
                  <strong>Soon, one-click reruns & forks.</strong> People remix each other's evals;
                  the data snowballs.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-blue mt-1">•</span>
                <span>
                  <strong>Explore the capabilities scores as a router:</strong> give a prompt, break
                  it into subtasks → pick the top-ranked model for each → run, merge, and show
                  "workflow vs. single-model" results.
                </span>
              </li>
            </ul>

            <p>
              What's still missing is <strong>taste on tap</strong>: letting high-taste humans
              override the judge, publishing their picks, and letting everyone else route with those
              preferences baked in. That's the next mile.
            </p>
          </div>
        </DialogHeader>

        <DialogFooter className="flex justify-center">
          <ElectricButton variant="primary" onClick={handleClose}>
            Got it!
          </ElectricButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
