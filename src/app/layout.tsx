import type { Metadata, Viewport } from "next";
import { JsonLd } from "@/components/JsonLd";
import { SiteShell } from "@/components/SiteShell";
import { UserSessionProvider } from "@/components/UserSessionProvider";
import { getServerUserSession } from "@/lib/server-user-session";
import { buildOrganizationJsonLd, buildRootMetadata, buildWebSiteJsonLd } from "@/lib/seo";
import "./globals.css";
import "./desktop.css";
import "./admin.css";

export const metadata: Metadata = buildRootMetadata();

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0D0D0D",
  interactiveWidget: "resizes-content",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const initialSession = await getServerUserSession();

  return (
    <html lang="ja">
      <body className="flex min-h-screen flex-col bg-ivory font-sans text-charcoal antialiased">
        <JsonLd data={buildOrganizationJsonLd()} />
        <JsonLd data={buildWebSiteJsonLd()} />
        <UserSessionProvider initialSession={initialSession}>
          <SiteShell>{children}</SiteShell>
        </UserSessionProvider>
      </body>
    </html>
  );
}
