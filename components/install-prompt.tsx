"use client";

import { useEffect, useState } from "react";

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallPrompt() {
  const [installEvent, setInstallEvent] = useState<InstallEvent | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as InstallEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (hidden) return null;

  async function install() {
    if (installEvent) {
      await installEvent.prompt();
      const choice = await installEvent.userChoice;
      if (choice.outcome === "accepted") setHidden(true);
      setInstallEvent(null);
      return;
    }
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setHint(ios ? "Tap Share, then Add to Home Screen." : "Use the browser menu, then Install Hearth.");
  }

  return (
    <div
      className="install-prompt fixed inset-x-3 z-40 md:hidden"
      style={{ bottom: "calc(4.75rem + env(safe-area-inset-bottom))" }}
    >
      <div className="flex items-center gap-2 rounded-2xl bg-ink px-3 py-2 text-white shadow-lg">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-extrabold leading-tight">Install Hearth</p>
          <p className="text-xs leading-4 text-white/80">{hint ?? "Add it to your home screen. It opens like an app."}</p>
        </div>
        <button type="button" onClick={() => void install()} className="punch h-11 shrink-0 rounded-full px-3 text-sm font-extrabold">
          Install
        </button>
        <button type="button" onClick={() => setHidden(true)} className="h-11 w-11 shrink-0 text-lg font-bold" aria-label="Dismiss install prompt">
          ×
        </button>
      </div>
    </div>
  );
}
