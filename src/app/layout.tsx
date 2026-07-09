import type { Metadata, Viewport } from "next";
import { ChatBot } from "@/components/ChatBot";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { UserSessionProvider } from "@/components/UserSessionProvider";
import { getServerUserSession } from "@/lib/server-user-session";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: SITE_NAME, template: `%s | ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
};

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
        <UserSessionProvider initialSession={initialSession}>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <ChatBot />
        </UserSessionProvider>
      </body>
    </html>
  );
}
