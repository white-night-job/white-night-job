import { NextResponse } from "next/server";
import {
  clearLinePendingLoginCookie,
  upsertLineUser,
} from "@/lib/line-complete-login";
import {
  decodeLinePendingLogin,
  isLineOfficialAccountFriend,
  LINE_PENDING_LOGIN_COOKIE,
} from "@/lib/line-friendship";
import { attachUserSessionCookie } from "@/lib/user-auth";

export const dynamic = "force-dynamic";

function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const [rawName, ...rest] = part.trim().split("=");
    if (rawName === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

/**
 * Re-check Official Account follow after the user taps「追加しました」.
 * Issues the session cookie only when Messaging API confirms friendship.
 */
export async function POST(request: Request) {
  try {
    const raw = readCookie(request, LINE_PENDING_LOGIN_COOKIE);
    const pending = decodeLinePendingLogin(raw);
    if (!pending) {
      return NextResponse.json(
        {
          ok: false,
          message: "ログイン情報の有効期限が切れました。再度ログインしてください。",
          expired: true,
        },
        { status: 401 },
      );
    }

    const friendship = await isLineOfficialAccountFriend({
      lineUserId: pending.lineUserId,
      accessToken: pending.accessToken,
    });

    console.log("[line/friendship-confirm] check", {
      lineUserId: pending.lineUserId,
      isFriend: friendship.isFriend,
      method: friendship.method,
    });

    if (!friendship.isFriend) {
      return NextResponse.json({
        ok: false,
        isFriend: false,
        message:
          "まだ友だち追加が確認できません。公式アカウントを追加してから、もう一度お試しください。",
      });
    }

    const userId = await upsertLineUser({
      lineUserId: pending.lineUserId,
      displayName: pending.displayName,
      pictureUrl: pending.pictureUrl,
    });

    const redirectPath = pending.redirectPath || "/";
    const response = NextResponse.json({
      ok: true,
      isFriend: true,
      redirectPath,
    });
    clearLinePendingLoginCookie(response, request);
    attachUserSessionCookie(response, userId, request);
    return response;
  } catch (error) {
    console.error("[line/friendship-confirm] failed:", error);
    return NextResponse.json(
      { ok: false, message: "フォロー状態の確認に失敗しました。" },
      { status: 500 },
    );
  }
}
