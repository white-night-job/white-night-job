import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getErrorMessage } from "@/lib/api-error";
import { getAuthenticatedShopJobId } from "@/lib/shop-auth";
import {
  extractStoragePathFromPublicUrl,
  isTempStoragePath,
  promoteTempImageUrl,
} from "@/lib/temp-images";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const isAdmin = await isAdminAuthenticated();
  const shopJobId = await getAuthenticatedShopJobId();
  if (!isAdmin && !shopJobId) {
    return NextResponse.json({ message: "ログインしてください。" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { urls?: unknown };
    const urls = Array.isArray(body.urls)
      ? body.urls.filter((u): u is string => typeof u === "string" && Boolean(u.trim()))
      : [];

    if (urls.length === 0) {
      return NextResponse.json({ urls: {} });
    }

    const mapping: Record<string, string> = {};
    for (const url of urls) {
      const path = extractStoragePathFromPublicUrl(url);
      if (!path || !isTempStoragePath(path)) {
        mapping[url] = url;
        continue;
      }

      // Shop may only promote temp images under their own owner folder
      if (!isAdmin && shopJobId) {
        const ownerSegment = path.split("/")[2]; // temp/{kind}/{ownerId}/...
        if (ownerSegment && ownerSegment !== shopJobId) {
          return NextResponse.json(
            { message: "他店舗の一時画像は確定できません。" },
            { status: 403 },
          );
        }
      }

      mapping[url] = await promoteTempImageUrl(url);
    }

    return NextResponse.json({ urls: mapping });
  } catch (error) {
    return NextResponse.json(
      { message: getErrorMessage(error, "一時画像の確定に失敗しました。") },
      { status: 500 },
    );
  }
}
