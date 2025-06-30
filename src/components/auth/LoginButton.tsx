"use client";
import { useLogin, usePrivy } from "@privy-io/react-auth";

import { Button } from "../ui/button";

export function LoginButton() {
  const { ready, authenticated } = usePrivy();
  const { login } = useLogin();

  return (
    <Button disabled={!ready || authenticated} onClick={login} variant="secondary" size="lg">
      {authenticated ? "Logged in" : "Log in"}
    </Button>
  );
}
