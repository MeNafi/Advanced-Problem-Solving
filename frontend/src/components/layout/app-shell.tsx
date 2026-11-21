"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clapperboard, ListOrdered, Menu, Ticket, X, type LucideIcon } from "lucide-react";
import { NAV_ITEMS } from "@/constants";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  "/movies": Clapperboard,
  "/rewatch-plan": ListOrdered,
  "/booking": Ticket,
};

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1" aria-label="Main">
      {NAV_ITEMS.map((item) => {
        const Icon = ICONS[item.href];
        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
              active ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function Brand() {
  return (
    <Link href="/movies" className="flex items-center gap-2.5">
      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <Clapperboard className="h-4 w-4" />
      </span>
      <span className="text-base font-semibold tracking-tight">Doomsday Ready</span>
    </Link>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen lg:flex">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r bg-card/50 p-5 lg:block">
        <div className="mb-8">
          <Brand />
        </div>
        <NavLinks />
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur lg:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <Brand />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="rounded-md p-2 hover:bg-accent"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {open && (
          <div className="border-t px-4 py-3">
            <NavLinks onNavigate={() => setOpen(false)} />
          </div>
        )}
      </header>

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 sm:py-10">
        <div className="mx-auto max-w-4xl">{children}</div>
      </main>
    </div>
  );
}
