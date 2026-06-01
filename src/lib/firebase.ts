import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

// Firebase config-ийг .env.local-оос уншина (NEXT_PUBLIC_* нь client дээр inline хийгдэнэ).
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Түлхүүрүүд бөглөгдсөн эсэх. Бөглөгдөөгүй үед апп унахгүйгээр (mock горим) ажиллана.
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId,
);

let firebaseApp: FirebaseApp | undefined;
let authInstance: Auth | undefined;
let dbInstance: Firestore | undefined;
let storageInstance: FirebaseStorage | undefined;

// Зөвхөн тохиргоо бүрэн үед эхлүүлнэ (getAuth нь хоосон түлхүүртэй бол алдаа шиддэг).
if (isFirebaseConfigured) {
  firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
  authInstance = getAuth(firebaseApp);
  dbInstance = getFirestore(firebaseApp);
  storageInstance = getStorage(firebaseApp);
}

// Тохиргоогүй үед эдгээр нь undefined байх ба ашиглахаас өмнө `isFirebaseConfigured`-ийг шалгана.
export const app = firebaseApp;
export const auth = authInstance as Auth;
export const db = dbInstance as Firestore;
export const storage = storageInstance as FirebaseStorage;
