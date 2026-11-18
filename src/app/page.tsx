import { Wordmark } from "@/components/Wordmark";

/** Intentionally blank: the assignment only asks for a placeholder Home tab. */
export default function HomePage() {
  return (
    <div className="flex h-full flex-col">
      <header className="px-5 pb-3 pt-5">
        <Wordmark />
      </header>
      <div className="flex-1" aria-label="Home (placeholder)" />
    </div>
  );
}
