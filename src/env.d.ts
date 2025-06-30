declare namespace NodeJS {
  interface ProcessEnv {
    DATABASE_URL?: string;
    NEXT_PUBLIC_PRIVY_APP_ID?: string;
    NEXT_PUBLIC_SITE_URL?: string;
    PRIVY_JWKS_ENDPOINT?: string;
    PRIVY_APP_SECRET?: string;
    OPENROUTER_API_KEY?: string;
  }
}
