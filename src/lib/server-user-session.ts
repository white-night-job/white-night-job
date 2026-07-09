import {
  parseUserSessionValue,
  readUserSessionCookieValue,
} from "@/lib/user-auth";
import { createSupabaseAdmin } from "@/lib/supabase";

export type ServerUserSession = {
  authenticated: boolean;
  user?: {
    id: string;
    displayName: string | null;
    pictureUrl: string | null;
    lineUserId: string | null;
  };
};

export async function getServerUserSession(): Promise<ServerUserSession> {
  const rawCookie = await readUserSessionCookieValue();
  if (!rawCookie) {
    return { authenticated: false };
  }

  const userId = parseUserSessionValue(rawCookie);
  if (!userId) {
    return { authenticated: false };
  }

  const supabase = createSupabaseAdmin();
  const { data: user, error } = await supabase
    .from("users")
    .select("id, line_user_id, display_name, picture_url")
    .eq("id", userId)
    .maybeSingle();

  if (error || !user) {
    return { authenticated: false };
  }

  return {
    authenticated: true,
    user: {
      id: user.id,
      displayName: user.display_name,
      pictureUrl: user.picture_url,
      lineUserId: user.line_user_id,
    },
  };
}
