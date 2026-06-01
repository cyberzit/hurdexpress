import {
  applicationDefault,
  cert,
  getApps,
  initializeApp,
  type App,
  type ServiceAccount,
} from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Firebase Admin SDK — зөвхөн серверийн талд (API route). Rules-ийг тойрно.
//
// Credential дараалал:
//  1. FIREBASE_SERVICE_ACCOUNT_KEY (нэг мөр JSON) — локал dev / классик hosting.
//  2. Application Default Credentials (ADC) — App Hosting / Cloud Run дээр
//     үйлчилгээний default service account-аар автоматаар (түлхүүр шаардахгүй).

let cached: App | undefined;

export function getAdminApp(): App {
  if (cached) return cached;
  if (getApps().length) {
    cached = getApps()[0];
    return cached;
  }

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  const credential = raw
    ? cert(JSON.parse(raw) as ServiceAccount)
    : applicationDefault();

  cached = initializeApp({ credential });
  return cached;
}

export function getAdminDb() {
  return getFirestore(getAdminApp());
}
