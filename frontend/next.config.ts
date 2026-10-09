import type { NextConfig } from "next";

const authApiUrl = (
  process.env.AUTH_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:4000"
).replace(/\/$/, "");

const nextConfig: NextConfig = {
  productionBrowserSourceMaps: false,
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  turbopack: {
    root: process.cwd(),
  },
  async rewrites() {
    // Proxy browser `/api/*` calls to the standalone backend so the
    // session cookie can stay on the frontend origin during local dev.
    return [
      {
        source: "/api/:path*",
        destination: `${authApiUrl}/api/:path*`,
      },
    ];
  },
  async headers() {
    const securityHeaders = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    ];
    return [
      {
        source: "/((?!api/).*)",
        // Let Next.js set the appropriate cache policy for HTML, RSC payloads,
        // and immutable assets. A shared public cache header here can serve old
        // HTML alongside a newer client bundle and cause hydration mismatches.
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
