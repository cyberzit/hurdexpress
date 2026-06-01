// Нэгдсэн алдааны мессеж (форм/жагсаалтын дээр).
export default function ErrorState({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600"
    >
      {message}
    </p>
  );
}
