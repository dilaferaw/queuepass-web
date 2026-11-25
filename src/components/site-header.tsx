"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass,
  KeyRound,
  LogOut,
  PlusCircle,
  Radio,
  Sparkles,
  Ticket,
  UserCheck,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { useQueuepass } from "@/lib/store";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const pathname = usePathname();
  const { currentUser, logout, quickDemoLogin } = useQueuepass();

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="group flex items-center gap-2.5 text-base font-semibold tracking-tight"
          >
            <span className="relative flex size-8 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/40 transition-all group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-[0_0_20px_oklch(0.71_0.21_292/0.5)]">
              <Ticket className="size-4 -rotate-12 transition-transform group-hover:rotate-0" />
            </span>
            <div className="flex flex-col">
              <span className="flex items-center gap-1.5 leading-none">
                QUEUEPASS
                <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 font-mono text-[10px] font-medium tracking-wider text-emerald-400 ring-1 ring-emerald-500/30">
                  v1.3
                </span>
              </span>
              <span className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
                Reserved Ticketing Engine
              </span>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            <Link
              href="/"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "gap-1.5 text-muted-foreground hover:text-foreground",
                (pathname === "/" || pathname?.startsWith("/events/0")) &&
                  "bg-white/6 text-foreground",
              )}
            >
              <Compass className="size-3.5 text-primary" />
              Discover
            </Link>
            <Link
              href="/events/new"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "gap-1.5 text-muted-foreground hover:text-foreground",
                pathname === "/events/new" && "bg-white/6 text-foreground",
              )}
            >
              <PlusCircle className="size-3.5 text-emerald-400" />
              Create Event
            </Link>
            {currentUser ? (
              <Link
                href="/account"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "gap-1.5 text-muted-foreground hover:text-foreground",
                  pathname === "/account" && "bg-white/6 text-foreground",
                )}
              >
                <KeyRound className="size-3.5 text-amber-400" />
                Session & JWT
              </Link>
            ) : null}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {currentUser ? (
            <div className="flex items-center gap-2">
              <Link
                href="/account"
                className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs transition hover:border-primary/40 hover:bg-white/10"
              >
                <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                <span className="font-medium text-foreground">
                  @{currentUser.username}
                </span>
                <span className="hidden font-mono text-[10px] text-muted-foreground sm:inline">
                  ({currentUser.age}y)
                </span>
              </Link>
              <Link
                href="/events/new"
                className={cn(
                  buttonVariants({ variant: "default", size: "sm" }),
                  "hidden sm:inline-flex",
                )}
              >
                <PlusCircle className="size-3.5" />
                New Event
              </Link>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => void logout()}
                title="Revoke current JWT (POST /api/v1/auth/logout)"
              >
                <LogOut className="size-3.5 text-muted-foreground hover:text-destructive" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="xs"
                onClick={() => void quickDemoLogin("aria@queuepass.live")}
                className="hidden border border-dashed border-primary/30 text-xs text-primary hover:bg-primary/10 lg:inline-flex"
                title="Instant organizer login as Aria Voss"
              >
                <Sparkles className="size-3" />
                Demo Organizer
              </Button>
              <Link
                href="/login"
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                <UserCheck className="size-3.5" />
                Sign in
              </Link>
              <Link
                href="/register"
                className={buttonVariants({ variant: "default", size: "sm" })}
              >
                Join Queuepass
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Sub-nav */}
      <div className="flex items-center justify-between border-t border-white/5 px-4 py-1.5 text-xs md:hidden">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className={cn(
              "font-medium text-muted-foreground hover:text-foreground",
              pathname === "/" && "text-primary",
            )}
          >
            Discover
          </Link>
          <Link
            href="/events/new"
            className={cn(
              "font-medium text-muted-foreground hover:text-foreground",
              pathname === "/events/new" && "text-primary",
            )}
          >
            + Create Event
          </Link>
          {currentUser ? (
            <Link
              href="/account"
              className={cn(
                "font-medium text-muted-foreground hover:text-foreground",
                pathname === "/account" && "text-primary",
              )}
            >
              Session & JWT
            </Link>
          ) : null}
        </div>
        <span className="flex items-center gap-1 font-mono text-[10px] text-emerald-400">
          <Radio className="size-3 animate-pulse" />
          MOCK STORE ACTIVE
        </span>
      </div>
    </header>
  );
}
