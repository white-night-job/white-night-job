import { NextResponse } from "next/server";
import { isValidAdminPassword, setAdminCookie } from "@/lib/admin-auth";

export async function POST(request: Request) {
  try {
    const { password } = (await request.json()) as { password?: string };

    if (!password || !isValidAdminPassword(password)) {
      return NextResponse.json(
        { message: "パスワードが違います。" },
        { status: 401 },
      );
    }

    await setAdminCookie();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "ログインに失敗しました。" },
      { status: 500 },
    );
  }
}
