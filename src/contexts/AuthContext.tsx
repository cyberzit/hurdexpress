"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db, isFirebaseConfigured } from "@/lib/firebase";
import type { UserDoc } from "@/types";

// Firestore профайл + uid
export interface StaffProfile extends UserDoc {
  uid: string;
}

interface AuthContextValue {
  user: User | null; // Firebase Auth хэрэглэгч
  profile: StaffProfile | null; // Firestore users/{uid} (role зэрэг)
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  // Firebase бөглөгдөөгүй бол ачаалах төлөвгүйгээр шууд эхэлнэ.
  const [loading, setLoading] = useState(isFirebaseConfigured);

  useEffect(() => {
    // Тохиргоо байхгүй үед Firebase Auth-д хандахгүй (mock горим).
    if (!isFirebaseConfigured) return;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const snap = await getDoc(doc(db, "users", firebaseUser.uid));
          setProfile(
            snap.exists()
              ? ({ uid: firebaseUser.uid, ...(snap.data() as UserDoc) })
              : null,
          );
        } catch {
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const value = useMemo(
    () => ({ user, profile, loading }),
    [user, profile, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
