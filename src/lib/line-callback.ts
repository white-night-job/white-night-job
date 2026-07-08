import { NextResponse } from "next/server";
import {
  exchangeLineCodeForToken,
  fetchLineProfile,
} from "@/lib/line-auth";
import { createSupabaseAdmin } from "@/lib/supabase";
import {
  clearLineStateCookie,
  getLineStateCookie,
  setUserCookie,
} from "@/lib/user-auth";

export async function handleLineCallback(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");
  if (!code || !state) {
    return NextResponse.redirect(new URL("/?lineLogin=failed", requestUrl.origin));
  }

  const stateCookie = await getLineStateCookie();
  await clearLineStateCookie();
  if (!stateCookie) {
    return NextResponse.redirect(new URL("/?lineLogin=failed", requestUrl.origin));
  }

  const delimiterIndex = stateCookie.indexOf(":");
  const expectedState =
    delimiterIndex >= 0 ? stateCookie.slice(0, delimiterIndex) : stateCookie;
  const redirectTo =
    delimiterIndex >= 0 ? stateCookie.slice(delimiterIndex + 1) : "/";
  if (expectedState !== state) {
    return NextResponse.redirect(new URL("/?lineLogin=failed", requestUrl.origin));
  }

  try {
    const accessToken = await exchangeLineCodeForToken(code);
    const profile = await fetchLineProfile(accessToken);
    const supabase = createSupabaseAdmin();

    const { data, error } = await supabase
      .from("users")
      .upsert(
        {
          line_user_id: profile.userId,
          display_name: profile.displayName,
          picture_url: profile.pictureUrl ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "line_user_id" },
      )
      .select("id")
      .single();

    if (error || !data?.id) {
      throw error ?? new Error("ユーザー情報保存に失敗しました。");
    }

    await setUserCookie(data.id);
    return NextResponse.redirect(new URL(redirectTo || "/", requestUrl.origin));
  } catch {
    return NextResponse.redirect(new URL("/?lineLogin=failed", requestUrl.origin));
  }
}
