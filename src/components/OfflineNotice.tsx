"use client";

import { useEffect, useState } from "react";

// Интернэт холболт тасрахад дэлгэцийн дээд талд анхааруулга харуулна.
export default function OfflineNotice() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      className="fixed inset-x-0 top-0 z-[100] bg-red-600 px-4 py-2 text-center text-sm font-medium text-white"
      style={{ paddingTop: "max(0.5rem, env(safe-area-inset-top))" }}
      role="alert"
    >
      ⚠️ Интернет холболтоо шалгана уу
    </div>
  );
}
