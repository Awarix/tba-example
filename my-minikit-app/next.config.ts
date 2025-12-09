import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");
    return config;
  },
  // Allow embedding in iframes for Mini Apps (Farcaster/Base App)
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Frame-Options",
            value: "ALLOWALL",
          },
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'self' https://*.farcaster.xyz https://*.warpcast.com https://base.org https://*.base.org *;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
