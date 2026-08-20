"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { ChatBot } from "@/components/ChatBot";
import { CompareProvider } from "@/components/CompareProvider";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { SiteVisitTracker } from "@/components/SiteVisitTracker";

/**
 * Public site chrome. Admin routes (/admin/*) render children only —
 * admin has its own layout without site header/footer/nav.
 */
export function SiteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "";
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");
  const isShopDashboardRoute =
    pathname === "/shop-dashboard" || pathname.startsWith("/shop-dashboard/");

  if (isAdminRoute) {
    return <div className="flex min-h-screen flex-1 flex-col">{children}</div>;
  }

  if (isShopDashboardRoute) {
    return (
      <CompareProvider>
        <Header />
        <main className="min-w-0 flex-1">{children}</main>
        <Footer />
      </CompareProvider>
    );
  }

  return (
    <CompareProvider>
      <SiteVisitTracker />
      <Header />
      <main className="min-w-0 flex-1">{children}</main>
      <Footer />
      <ChatBot />
    </CompareProvider>
  );
}
