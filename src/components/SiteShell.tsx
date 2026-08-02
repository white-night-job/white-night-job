"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { ChatBot } from "@/components/ChatBot";
import { CompareProvider } from "@/components/CompareProvider";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";

/**
 * Public site chrome. Admin routes (/admin/*) render children only —
 * admin has its own layout without site header/footer/nav.
 */
export function SiteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "";
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");

  if (isAdminRoute) {
    return <div className="flex min-h-screen flex-1 flex-col">{children}</div>;
  }

  return (
    <CompareProvider>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <ChatBot />
    </CompareProvider>
  );
}
