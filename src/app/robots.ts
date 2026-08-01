import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/api/",
          "/shop-dashboard",
          "/shop-dashboard/",
          "/shop-login",
          "/mypage",
          "/mypage/",
          "/favorites",
          "/compare",
          "/notification-settings",
          "/liff",
          "/liff/",
          "/auth/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
