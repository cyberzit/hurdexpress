"use client";

import { useEffect, useState } from "react";
import { getSettings } from "@/lib/settings";

export interface PublicInfo {
  phone: string;
  secondaryPhone: string;
  email: string;
  address: string;
  facebookUrl: string;
  brochureUrl: string;
  brochureName: string;
}

// Settings хоосон үед харуулах анхдагч холбоо барих мэдээлэл (бодит утгууд).
const FALLBACK: PublicInfo = {
  phone: "89080233",
  secondaryPhone: "8804034",
  email: "dayanhurdexpress@gmail.com",
  address: "БЗД 13-р хороо, Skytown 2 давхар, 209 тоот",
  facebookUrl: "https://www.facebook.com/hurdexpress",
  brochureUrl: "",
  brochureName: "",
};

// Нийтийн (нүүр хуудас) холбоо барих мэдээлэл — settings/general-аас, fallback-тай.
export function usePublicInfo(): PublicInfo {
  const [info, setInfo] = useState<PublicInfo>(FALLBACK);

  useEffect(() => {
    getSettings()
      .then((s) => {
        if (!s) return;
        setInfo({
          phone: s.phone?.trim() || FALLBACK.phone,
          secondaryPhone: s.secondaryPhone?.trim() || FALLBACK.secondaryPhone,
          email: s.email?.trim() || FALLBACK.email,
          address: s.address?.trim() || FALLBACK.address,
          facebookUrl: s.facebookUrl?.trim() || FALLBACK.facebookUrl,
          brochureUrl: s.brochureUrl?.trim() || "",
          brochureName: s.brochureName?.trim() || "Танилцуулга",
        });
      })
      .catch(() => {});
  }, []);

  return info;
}
