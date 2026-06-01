import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // firebase-admin нь Node-only — server дээр bundle хийхгүй гадаад package болгоно.
  serverExternalPackages: ["firebase-admin"],
};

export default nextConfig;
