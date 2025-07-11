/**
 * @file Authentication Prompt Component
 * @description Displays authentication requirement prompt for router analysis
 */

import { usePrivy } from "@privy-io/react-auth";
import { UserIcon } from "lucide-react";

/**
 * Authentication prompt component for router analysis
 */
export function AuthPrompt() {
  const { login } = usePrivy();

  return (
    <div className="glassmorphism-25 backdrop-blur-sm border border-white/10 rounded-lg p-6 text-center">
      <div className="space-y-4">
        <div className="flex items-center justify-center w-12 h-12 bg-brand-blue/20 rounded-full mx-auto">
          <UserIcon className="w-6 h-6 text-brand-blue" />
        </div>

        <div className="space-y-2">
          <h3 className="text-headline text-brand-black">Sign In Required</h3>
          <p className="text-body text-brand-gray-04">
            Please sign in to use the AI Router analysis feature
          </p>
        </div>

        <button
          onClick={login}
          className="interactive-surface-primary text-on-primary rounded-md py-3 px-6 font-semibold"
        >
          Sign In to Continue
        </button>
      </div>
    </div>
  );
}
