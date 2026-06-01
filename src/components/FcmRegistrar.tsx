"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { listenForegroundMessages, registerFcmToken } from "@/lib/fcm";

// Нэвтэрсэн хэрэглэгчийн FCM token-г бүртгэж, foreground мессеж сонсоно.
// Панелуудын layout-д суулгана (нэвтэрсний дараа автоматаар ажиллана).
export default function FcmRegistrar() {
  const { profile } = useAuth();
  const registered = useRef(false);

  useEffect(() => {
    if (!profile?.uid || registered.current) return;
    registered.current = true;

    registerFcmToken(profile.uid, profile.role).catch(() => {});

    let unsub: (() => void) | undefined;
    listenForegroundMessages((payload) => {
      const data = payload.data;
      if (data?.title && typeof Notification !== "undefined" && Notification.permission === "granted") {
        new Notification(data.title, {
          body: data.body,
          icon: "/icons/icon-192.png",
        });
      }
    }).then((u) => {
      unsub = u;
    });

    return () => unsub?.();
  }, [profile]);

  return null;
}
