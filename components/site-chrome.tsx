"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/lib/actions";
import type { User } from "@/lib/types";
import { roleLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Wordmark } from "@/components/wordmark";

const links = [
  { href: "/market", label: "Market" },
  { href: "/requests", label: "Requests" },
  { href: "/requests/new", label: "Post a request" },
];

function active(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  if (href === "/requests/new") return pathname === "/requests/new";
  if (href === "/account") return pathname === "/account" || pathname === "/sign-in";
  if (href === "/requests") return pathname === "/requests" || (pathname.startsWith("/requests/") && pathname !== "/requests/new");
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function HeaderBar({ user }: { user: User | null }) {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-30 border-b-[3px] border-ink bg-white pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="shrink-0" aria-label="Hearth home">
          <Wordmark />
        </Link>
        <nav className="hidden items-center gap-6 md:flex" aria-label="Primary">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active(pathname, link.href) ? "page" : undefined}
              className={cn(
                "text-sm text-ink-soft hover:text-ink",
                active(pathname, link.href) && "text-bolt underline decoration-ember decoration-[3px] underline-offset-8",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link href="/account" className="hidden text-right sm:block">
                <span className="block text-sm font-medium text-ink">{user.name}</span>
                <span className="block font-mono text-[10px] tracking-[0.12em] text-muted uppercase">
                  {roleLabel(user.role)}
                  {user.desk ? ` · ${user.desk}` : ""}
                  {user.isDemo ? " · Demo" : ""}
                </span>
              </Link>
              <form action={signOut}>
                <button type="submit" className="h-12 rounded-full border-[3px] border-ink bg-white px-4 text-sm font-extrabold text-ink hover:bg-ember">
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <Link href="/sign-in" className="inline-flex h-12 items-center rounded-full bg-ember px-5 text-sm font-extrabold text-ink hover:bg-ink hover:text-white">
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

const mobile = [
  { href: "/", label: "Home" },
  { href: "/market", label: "Markets" },
  { href: "/requests/new", label: "Post a risk" },
  { href: "/account", label: "Profile" },
];

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t-[3px] border-ink bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
      aria-label="Mobile"
    >
      <ul className="grid grid-cols-4 gap-1 px-2 py-2">
        {mobile.map((link) => {
          const isCurrent = active(pathname, link.href) || (link.href === "/account" && pathname === "/sign-in");
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={isCurrent ? "page" : undefined}
                className={cn(
                  "flex min-h-12 items-center justify-center rounded-full px-1 text-center text-xs font-extrabold leading-tight text-ink",
                  isCurrent && "tab-on",
                )}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
