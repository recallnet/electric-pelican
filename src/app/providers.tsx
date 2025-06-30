"use client";
import { PrivyProvider } from "@privy-io/react-auth";
import React from "react";

import { TournamentWizardProvider } from "@/contexts/TournamentWizardContext";
import { ProvidersProps } from "@/types/app";

export default function Providers({ children }: ProvidersProps) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  const content = <TournamentWizardProvider>{children}</TournamentWizardProvider>;

  if (!appId || appId === "demo") {
    // dev fallback without Privy
    return content;
  }

  return (
    <PrivyProvider
      appId={appId}
      config={{
        loginMethods: ["email", "google", "github"],
        embeddedWallets: { createOnLogin: "users-without-wallets" },
        appearance: { theme: "dark", accentColor: "#00ff88", logo: "/logo.png" },
      }}
    >
      {content}
    </PrivyProvider>
  );
}
