import { Suspense } from "react";
import { HeaderBar } from "@/components/site-chrome";
import { Wordmark } from "@/components/wordmark";
import { getCurrentUser } from "@/lib/auth";
import { load } from "@/lib/load";

export function HeaderFallback() {
  return (
    <header className="border-b border-line bg-paper">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Wordmark />
        <div className="h-11 w-24 bg-paper-2" />
      </div>
    </header>
  );
}

export async function SiteHeader() {
  const loaded = await load(() => getCurrentUser());
  return <HeaderBar user={loaded.ok ? loaded.value : null} />;
}

export function HeaderSlot() {
  return (
    <Suspense fallback={<HeaderFallback />}>
      <SiteHeader />
    </Suspense>
  );
}
