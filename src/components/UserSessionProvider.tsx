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
  refreshSession: () => Promise<void>;
};

const UserSessionContext = createContext<UserSessionContextValue | null>(null);

export function UserSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<UserSession>({ authenticated: false });
  const [ready, setReady] = useState(false);

  const refreshSession = useCallback(async () => {
    try {
      const response = await fetch("/api/user/session", {
        cache: "no-store",
        credentials: "include",
      });
      const data = (await response.json()) as {
        authenticated?: boolean;
        user?: UserSession["user"];
        notificationSettings?: NotificationSettings | null;
      };
      setSession({
        authenticated: Boolean(data.authenticated),
        user: data.user,
        notificationSettings: data.notificationSettings ?? null,
      });
    } catch {
      setSession({ authenticated: false });
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

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
