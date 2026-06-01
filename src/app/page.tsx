import { redirect } from "next/navigation";

// Нүүр хуудас → нэвтрэх/tracking хуудас руу чиглүүлнэ.
export default function Home() {
  redirect("/login");
}
