import type { NextConfig } from "next";

// Firebase Hosting static export. SSR/API байхгүй — бүх дата client Firebase SDK-аар.
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
