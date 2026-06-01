import type { MetadataRoute } from "next";

// PWA manifest — /manifest.webmanifest дээр serve хийгдэнэ.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "HurdExpress",
    short_name: "HurdExpress",
    description: "HurdExpress хүргэлтийн систем",
    start_url: "/login",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#0b1b33",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
