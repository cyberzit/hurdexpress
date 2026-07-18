// Жагсаалтын гүйлтийн байрлалыг санах жижиг модуль.
//
// Яагаад scroll эвент СОНСОХГҮЙ вэ:
//   Дэлгэрэнгүй рүү шилжихэд Next хуудсыг дээш гүйлгэдэг. Хэрэв жагсаалтын
//   компонент тэр агшинд бүрэн unmount болоогүй бол сонсогч 0-ийг бүртгэж,
//   хадгалсан байрлал устдаг (desktop дээр санамсаргүй, mobile дээр ховор).
//   Тиймээс байрлалыг ЗӨВХӨН холбоос дарах агшинд тогтооно — уралдаангүй.
let saved = 0;

export function saveListScroll(): void {
  if (typeof window !== "undefined") saved = window.scrollY;
}

export function getListScroll(): number {
  return saved;
}
