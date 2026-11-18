"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Home } from "lucide-react";

const TABS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/discover", label: "Discover", icon: Compass },
] as const;

export function TabBar() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Primary"
      className="flex items-center justify-around border-t border-lav bg-white/90 px-6 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur"
    >
      {TABS.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className="group flex w-24 flex-col items-center gap-1 py-1.5"
          >
            <span
              className={`flex h-8 w-14 items-center justify-center rounded-full transition-colors ${
                active ? "bg-pink-soft text-pink-deep" : "text-ink-faint group-hover:text-ink-soft"
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.4 : 2} />
            </span>
            <span className={`text-[11px] font-semibold ${active ? "text-ink" : "text-ink-faint"}`}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
