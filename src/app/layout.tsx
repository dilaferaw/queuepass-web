import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { Radio, ShieldCheck, Terminal, Ticket } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { QueuepassProvider } from "@/lib/store";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "Queuepass · Live Event & Reserved Seating Engine", template: "%s · Queuepass" },
  description:
    "High-concurrency event ticketing, reserved seating maps, and JWT-authenticated event orchestration.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <QueuepassProvider>
          <Suspense
            fallback={
              <div className="h-15 border-b border-white/10 bg-background/80" />
            }
          >
            <SiteHeader />
          </Suspense>

          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
            {children}
          </main>

          <footer className="mt-16 border-t border-white/10 bg-black/30 backdrop-blur-md">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 text-xs text-muted-foreground sm:px-6 lg:px-8">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/30">
                    <Ticket className="size-3.5" />
                  </span>
                  <div>
                    <p className="font-semibold text-foreground">QUEUEPASS LIVE</p>
                    <p className="font-mono text-[11px] text-muted-foreground">
                      FastAPI + SQLModel + Redis Revocation & Seat-Lock Architecture
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 font-mono text-[11px]">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-emerald-400">
                    <Radio className="size-3" />
                    API Contract: /api/v1/events & /api/v1/auth
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-muted-foreground">
                    <ShieldCheck className="size-3 text-primary" />
                    JTI Denylist + User Cutoff Ready
                  </span>
                </div>
              </div>
              <div className="ticket-perforation h-px w-full" />
              <div className="flex flex-wrap items-center justify-between gap-4 text-[11px]">
                <p className="flex items-center gap-1.5 font-mono">
                  <Terminal className="size-3.5 text-primary" />
                  Interactive Mock Engine active — created events & auth sessions persist in browser storage.
                </p>
                <div className="flex items-center gap-4">
                  <Link href="/" className="hover:text-foreground">
                    Catalog
                  </Link>
                  <Link href="/events/new" className="hover:text-foreground">
                    Create Event
                  </Link>
                  <Link href="/login" className="hover:text-foreground">
                    Sign In
                  </Link>
                  <Link href="/register" className="hover:text-foreground">
                    Register
                  </Link>
                </div>
              </div>
            </div>
          </footer>
        </QueuepassProvider>
      </body>
    </html>
  );
}
