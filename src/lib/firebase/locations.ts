import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { DriverLocation } from "@/types";

const COLLECTION = "driverLocations";

export interface LocationInput {
  driverId: string;
  driverName: string;
  lat: number;
  lng: number;
  accuracy?: number;
  heading?: number;
  speed?: number;
}

function toMillis(value: unknown): number {
  if (value && typeof value === "object" && "toMillis" in value) {
    return (value as { toMillis: () => number }).toMillis();
  }
  return typeof value === "number" ? value : Date.now();
}

// Жолоочийн байршлыг driverLocations/{driverId}-д бичих, мөн хүргэлтэнд яваа
// (on_the_way) захиалгуудын lastDriverLocation-г денормализ хийх (partner харахад).
export async function pushDriverLocation(input: LocationInput): Promise<void> {
  const payload: Record<string, unknown> = {
    driverId: input.driverId,
    driverName: input.driverName,
    lat: input.lat,
    lng: input.lng,
    updatedAt: serverTimestamp(),
  };
  if (input.accuracy != null) payload.accuracy = input.accuracy;
  if (input.heading != null) payload.heading = input.heading;
  if (input.speed != null) payload.speed = input.speed;

  await setDoc(doc(db, COLLECTION, input.driverId), payload, { merge: true });

  // on_the_way захиалгуудад denormalize (partner-д харагдана).
  const snap = await getDocs(
    query(collection(db, "orders"), where("driverId", "==", input.driverId)),
  );
  const updates = snap.docs
    .filter((d) => d.data().status === "on_the_way")
    .map((d) =>
      updateDoc(d.ref, {
        lastDriverLocation: {
          lat: input.lat,
          lng: input.lng,
          updatedAt: serverTimestamp(),
        },
        updatedAt: serverTimestamp(),
      }),
    );
  await Promise.all(updates);
}

function mapLocation(id: string, data: Record<string, unknown>): DriverLocation {
  return {
    driverId: (data.driverId as string) ?? id,
    driverName: (data.driverName as string) ?? "",
    lat: (data.lat as number) ?? 0,
    lng: (data.lng as number) ?? 0,
    accuracy: data.accuracy as number | undefined,
    heading: data.heading as number | undefined,
    speed: data.speed as number | undefined,
    updatedAt: toMillis(data.updatedAt),
  };
}

// Бүх жолоочийн байршил (admin live map).
export function subscribeDriverLocations(
  onData: (list: DriverLocation[]) => void,
  onError?: (e: Error) => void,
): Unsubscribe {
  return onSnapshot(
    collection(db, COLLECTION),
    (snap) => {
      const list = snap.docs.map((d) => mapLocation(d.id, d.data()));
      list.sort((a, b) => b.updatedAt - a.updatedAt);
      onData(list);
    },
    (err) => onError?.(err),
  );
}
