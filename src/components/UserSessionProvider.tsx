"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";

type NotificationSettings = {
  notify_new_jobs: boolean;
  notify_pickup_jobs: boolean;
  notify_favorite_updates: boolean;
};

type UserSession = {
  authenticated: boolean;
  user?: {
    id: string;
    displayName?: string | null;
    pictureUrl?: string | null;
  };
  notificationSettings?: NotificationSettings | null;
};

type UserSessionContextValue = {
  session: UserSession;
  ready: boolean;
  refreshSession: () => Promise<boolean>;
};

const UserSessionContext = createContext<UserSessionContextValue | null>(null);

async function fetchUserSession(): Promise<UserSession> {
  const response = await fetch("/api/user/session", {
    cache: "no-store",
    credentials: "include",
  });
  const data = (await response.json()) as {
    authenticated?: boolean;
    user?: UserSession["user"];
    notificationSettings?: NotificationSettings | null;
  };
  return {
    authenticated: Boolean(data.authenticated),
    user: data.user,
    notificationSettings: data.notificationSettings ?? null,
  };
}

export function UserSessionProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [session, setSession] = useState<UserSession>({ authenticated: false });
  const [ready, setReady] = useState(false);

  const refreshSession = useCallback(async () => {
    try {
      const nextSession = await fetchUserSession();
      setSession(nextSession);
      return nextSession.authenticated;
    } catch (error) {
      console.error("[UserSessionProvider] session fetch failed:", error);
      setSession({ authenticated: false });
      return false;
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      const lineLogin = new URLSearchParams(window.location.search).get("lineLogin");
      let authenticated = await refreshSession();

      if (!cancelled && lineLogin === "success" && !authenticated) {
        await new Promise((resolve) => setTimeout(resolve, 150));
        authenticated = await refreshSession();
      }

      if (!cancelled && lineLogin) {
        const url = new URL(window.location.href);
        url.searchParams.delete("lineLogin");
        const nextUrl = `${url.pathname}${url.search}${url.hash}`;
        window.history.replaceState(window.history.state, "", nextUrl);
      }
    }

    void loadSession();

    return () => {
      cancelled = true;
    };
  }, [pathname, refreshSession]);

  const value = useMemo(
    () => ({ session, ready, refreshSession }),
    [ready, refreshSession, session],
  );

  return (
    <UserSessionContext.Provider value={value}>
      {children}
    </UserSessionContext.Provider>
  );
}

export function useUserSession() {
  const context = useContext(UserSessionContext);
  if (!context) {
    throw new Error("useUserSession must be used within UserSessionProvider");
  }
  return context;
}
