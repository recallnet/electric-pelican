import "./globals.css";

import type { Metadata } from "next";

import { SiteHeader } from "@/components/layout/SiteHeader";

import Providers from "./providers";

export const metadata: Metadata = {
  title: "Pelican - Taste-Driven Routing",
  description: "Curate agents, crown winners, route by expert taste.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="antialiased">
      <body className="min-h-screen bg-brand-white text-brand-black font-mono flex flex-col">
        <Providers>
          <SiteHeader />
          <main id="main-content" className="flex-grow">
            {children}
          </main>
          <footer className="p-4 text-center text-label text-brand-gray-02 border-t border-white/10">
            Recall (Labs)
          </footer>
        </Providers>
      </body>
    </html>
  );
}
