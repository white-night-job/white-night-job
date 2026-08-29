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
  // Handle trailing slashes in middleware so /girls-bar/ can 308→/girlsbar in one hop
  // (Next's built-in slash redirect would otherwise 308→/girls-bar first).
  skipTrailingSlashRedirect: true,
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
      // Susukino legacy → canonical BEFORE apex catch-all (one hop from apex+legacy).
      {
        source: "/sapporo/susukino/girls-bar",
        has: [{ type: "host" as const, value: "whitenightjob.jp" }],
        destination: "https://www.whitenightjob.jp/sapporo/susukino/girlsbar",
        statusCode: 301,
      },
      {
        source: "/sapporo/susukino/girls-bar/",
        has: [{ type: "host" as const, value: "whitenightjob.jp" }],
        destination: "https://www.whitenightjob.jp/sapporo/susukino/girlsbar",
        statusCode: 301,
      },
      {
        source: "/sapporo/susukino/girls-bar/:path*",
        has: [{ type: "host" as const, value: "whitenightjob.jp" }],
        destination: "https://www.whitenightjob.jp/sapporo/susukino/girlsbar",
        statusCode: 301,
      },
      {
        source: "/sapporo/susukino/girls_bar",
        has: [{ type: "host" as const, value: "whitenightjob.jp" }],
        destination: "https://www.whitenightjob.jp/sapporo/susukino/girlsbar",
        statusCode: 301,
      },
      {
        source: "/sapporo/susukino/girlsBar",
        has: [{ type: "host" as const, value: "whitenightjob.jp" }],
        destination: "https://www.whitenightjob.jp/sapporo/susukino/girlsbar",
        statusCode: 301,
      },
      // www / preview / other hosts: relative 301 (no HTML for legacy URL).
      {
        source: "/sapporo/susukino/girls-bar",
        destination: "/sapporo/susukino/girlsbar",
        statusCode: 301,
      },
      {
        source: "/sapporo/susukino/girls-bar/",
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
        source: "/sapporo/susukino/girls_bar/",
        destination: "/sapporo/susukino/girlsbar",
        statusCode: 301,
      },
      {
        source: "/sapporo/susukino/girls_bar/:path*",
        destination: "/sapporo/susukino/girlsbar",
        statusCode: 301,
      },
      // Note: do not add a girlsBar→girlsbar rule here — on case-insensitive
      // matching it can 301-loop the canonical /girlsbar path. Case variants
      // are handled in middleware / vercel.json on Linux (case-sensitive).
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
      // Apex → www last so legacy path rules above can one-hop to www+canonical.
      {
        source: "/:path*",
        has: [{ type: "host" as const, value: "whitenightjob.jp" }],
        destination: "https://www.whitenightjob.jp/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
