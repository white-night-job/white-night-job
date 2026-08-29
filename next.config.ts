import type { NextConfig } from "next";

function supabaseHostname(): string | undefined {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!raw) return undefined;
  try {
    return new URL(raw).hostname;
  } catch {
    return undefined;
  }
}

const hostname = supabaseHostname();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      ...(hostname
        ? [
            {
              protocol: "https" as const,
              hostname,
              pathname: "/storage/v1/object/public/**",
            },
            {
              protocol: "https" as const,
              hostname,
              pathname: "/storage/v1/render/image/public/**",
            },
          ]
        : []),
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/**",
      },
    ],
  },
  async redirects() {
    return [
      // Apex → www (path + query preserved by Next.js). www itself never redirects here.
      {
        source: "/:path*",
        has: [{ type: "host" as const, value: "whitenightjob.jp" }],
        destination: "https://www.whitenightjob.jp/:path*",
        permanent: true,
      },
      {
        source: "/sapporo/susukino/girls-bar",
        destination: "/sapporo/susukino/girlsbar",
        statusCode: 301,
      },
      {
        source: "/sapporo/susukino/girls-bar/:path*",
        destination: "/sapporo/susukino/girlsbar",
        statusCode: 301,
      },
      {
        source: "/sapporo/susukino/girls_bar",
        destination: "/sapporo/susukino/girlsbar",
        statusCode: 301,
      },
      {
        source: "/sapporo/susukino/girls_bar/:path*",
        destination: "/sapporo/susukino/girlsbar",
        statusCode: 301,
      },
      {
        source: "/sapporo/susukino/girlsBar",
        destination: "/sapporo/susukino/girlsbar",
        statusCode: 301,
      },
      {
        source: "/sapporo/kotoni/girls-bar",
        destination: "/sapporo/kotoni/girlsbar",
        statusCode: 301,
      },
      {
        source: "/sapporo/kotoni/girls-bar/:path*",
        destination: "/sapporo/kotoni/girlsbar",
        statusCode: 301,
      },
      {
        source: "/sapporo/kita24jo/girls-bar",
        destination: "/sapporo/kita24jo/girlsbar",
        statusCode: 301,
      },
      {
        source: "/sapporo/kita24jo/girls-bar/:path*",
        destination: "/sapporo/kita24jo/girlsbar",
        statusCode: 301,
      },
      {
        source: "/sapporo/teine/girls-bar",
        destination: "/sapporo/teine/girlsbar",
        statusCode: 301,
      },
      {
        source: "/sapporo/teine/girls-bar/:path*",
        destination: "/sapporo/teine/girlsbar",
        statusCode: 301,
      },
      {
        source: "/listing-criteria",
        destination: "/first-time-guide",
        permanent: true,
      },
      {
        source: "/listing-criteria/:path*",
        destination: "/first-time-guide",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
