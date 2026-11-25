"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  Calendar,
  Clock,
  Globe,
  MapPin,
  PlusCircle,
  Search,
  Sparkles,
  Ticket,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  formatDuration,
  formatEventDateParts,
  formatEventDateTime,
  formatPrice,
} from "@/lib/format";
import { useQueuepass } from "@/lib/store";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 4;

export function CatalogClient({ initialPage }: { initialPage: number }) {
  const { events, currentUser } = useQueuepass();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedZone, setSelectedZone] = useState<string>("ALL");
  const [onlyMine, setOnlyMine] = useState(false);
  const [page, setPage] = useState(initialPage);

  const timezones = useMemo(() => {
    const set = new Set(events.map((e) => e.timezone));
    return ["ALL", ...Array.from(set)];
  }, [events]);

  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      if (onlyMine && currentUser && ev.organizer_id !== currentUser.id) {
        return false;
      }
      if (selectedZone !== "ALL" && ev.timezone !== selectedZone) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = ev.name.toLowerCase().includes(q);
        const matchVenue = ev.venue_name.toLowerCase().includes(q);
        const matchAddress = ev.venue_address.toLowerCase().includes(q);
        if (!matchName && !matchVenue && !matchAddress) return false;
      }
      return true;
    });
  }, [events, onlyMine, currentUser, selectedZone, searchQuery]);

  const spotlightEvent = events[0];
  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const offset = (safePage - 1) * PAGE_SIZE;
  const pageEvents = filteredEvents.slice(offset, offset + PAGE_SIZE);

  const totalSeatsAcrossCatalog = useMemo(
    () =>
      events.reduce(
        (acc, ev) =>
          acc + ev.sections.reduce((sAcc, sec) => sAcc + sec.seats.length, 0),
        0,
      ),
    [events],
  );

  return (
    <div className="flex flex-col gap-10">
      {/* Spotlight Hero Pass */}
      {spotlightEvent ? (
        <section className="relative overflow-hidden rounded-3xl border border-white/12 bg-linear-to-br from-primary/15 via-card to-emerald-500/10 p-1 shadow-[0_24px_80px_-20px_oklch(0.71_0.21_292/0.3)]">
          <div className="bg-grid-pattern relative grid gap-6 rounded-[calc(var(--radius-3xl)-4px)] bg-background/85 p-6 backdrop-blur-xl sm:p-8 lg:grid-cols-[1fr_300px] lg:gap-0 lg:p-0">
            <div className="flex flex-col justify-between gap-6 lg:p-8">
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/20 px-3 py-1 font-mono text-xs font-medium text-primary ring-1 ring-primary/40">
                    <Sparkles className="size-3.5" />
                    FEATURED ON-SALE
                  </span>
                  <Badge variant="outline" className="font-mono text-[11px]">
                    {spotlightEvent.timezone}
                  </Badge>
                  <span className="font-mono text-xs text-emerald-400">
                    ● {spotlightEvent.sections.reduce((a, s) => a + s.seats.length, 0)} reserved seats mapped
                  </span>
                </div>

                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                  {spotlightEvent.name}
                </h1>

                {spotlightEvent.description ? (
                  <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                    {spotlightEvent.description}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-6 text-xs text-muted-foreground sm:text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="size-4 text-primary" />
                  <span className="font-medium text-foreground">
                    {spotlightEvent.venue_name}
                  </span>
                  <span className="hidden text-muted-foreground sm:inline">
                    · {spotlightEvent.venue_address}
                  </span>
                </div>
                <div className="flex items-center gap-2 font-mono text-xs">
                  <Calendar className="size-4 text-emerald-400" />
                  <span>
                    {formatEventDateTime(
                      spotlightEvent.starts_at,
                      spotlightEvent.timezone,
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Perforated Right Ticket Stub */}
            <div className="ticket-perforation-y relative flex flex-col justify-between gap-6 border-t border-dashed border-white/15 pt-6 lg:border-t-0 lg:p-8">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] tracking-widest text-muted-foreground uppercase">
                    PASS TIERS
                  </span>
                  <span className="font-mono text-[11px] text-primary">
                    ID #{spotlightEvent.id.slice(-6)}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {spotlightEvent.ticket_types.map((tt) => (
                    <div
                      key={tt.id}
                      className="flex items-center justify-between rounded-xl border border-white/8 bg-white/4 px-3 py-2 text-xs"
                    >
                      <span className="font-medium text-foreground">
                        {tt.name}
                      </span>
                      <span className="font-mono font-semibold text-emerald-400">
                        {formatPrice(tt.price_cents, tt.currency)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Link
                  href={`/events/${spotlightEvent.id}`}
                  className={cn(
                    buttonVariants({ variant: "default", size: "lg" }),
                    "w-full justify-between font-medium shadow-[0_0_25px_oklch(0.71_0.21_292/0.4)]",
                  )}
                >
                  <span>Explore Venue & Seat Map</span>
                  <ArrowUpRight className="size-4" />
                </Link>
                <p className="text-center font-mono text-[11px] text-muted-foreground">
                  Duration: {formatDuration(spotlightEvent.starts_at, spotlightEvent.ends_at)}
                </p>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* Stats & Filter Bar */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold tracking-tight">
                Live Event Catalog
              </h2>
              <span className="rounded-full bg-white/8 px-2.5 py-0.5 font-mono text-xs text-foreground">
                {filteredEvents.length}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Times rendered in each event&apos;s local venue timezone ·{" "}
              <span className="font-mono text-xs text-foreground">
                {totalSeatsAcrossCatalog} total seats indexed
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {currentUser ? (
              <Button
                variant={onlyMine ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setOnlyMine((v) => !v);
                  setPage(1);
                }}
              >
                <Users className="size-3.5" />
                My Events ({events.filter((e) => e.organizer_id === currentUser.id).length})
              </Button>
            ) : null}
            <Link
              href="/events/new"
              className={buttonVariants({ variant: "secondary", size: "sm" })}
            >
              <PlusCircle className="size-3.5 text-emerald-400" />
              Host an Event
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-card/70 p-3 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search by event title, venue, or city..."
              className="h-9 w-full rounded-xl border border-white/10 bg-background/70 pr-3 pl-9 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <Globe className="mr-1 hidden size-3.5 text-muted-foreground sm:inline" />
            {timezones.map((tz) => (
              <button
                key={tz}
                type="button"
                onClick={() => {
                  setSelectedZone(tz);
                  setPage(1);
                }}
                className={cn(
                  "rounded-lg px-2.5 py-1 font-mono text-xs transition",
                  selectedZone === tz
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground",
                )}
              >
                {tz === "ALL" ? "All Zones" : tz.split("/").pop()?.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Event Cards Grid */}
      {pageEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/15 bg-card/40 py-16 text-center">
          <Ticket className="size-8 text-muted-foreground" />
          <div className="space-y-1">
            <h3 className="font-semibold text-foreground">No matching events</h3>
            <p className="text-xs text-muted-foreground">
              Try clearing your search filters or create a new event.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchQuery("");
              setSelectedZone("ALL");
              setOnlyMine(false);
              setPage(1);
            }}
          >
            Reset filters
          </Button>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {pageEvents.map((event) => {
            const startParts = formatEventDateParts(event.starts_at, event.timezone);
            const prices = event.ticket_types.map((t) => t.price_cents);
            const minPrice = prices.length ? Math.min(...prices) : 0;
            const maxPrice = prices.length ? Math.max(...prices) : 0;
            const currency = event.ticket_types[0]?.currency ?? "USD";
            const totalSeats = event.sections.reduce(
              (acc, s) => acc + s.seats.length,
              0,
            );
            const isOrganizer =
              currentUser && event.organizer_id === currentUser.id;

            return (
              <article
                key={event.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-card/80 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/45 hover:shadow-[0_16px_50px_-15px_oklch(0.71_0.21_292/0.28)]"
              >
                <div className="flex flex-col gap-4 p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    {/* Date Stamp Badge */}
                    <div className="flex shrink-0 flex-col items-center justify-center rounded-xl border border-white/12 bg-background/90 px-3 py-2 text-center shadow-inner">
                      <span className="font-mono text-[10px] font-semibold tracking-widest text-primary uppercase">
                        {startParts.month}
                      </span>
                      <span className="font-mono text-xl leading-tight font-bold text-foreground">
                        {startParts.day}
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {startParts.weekday}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="rounded-md bg-white/6 px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                          {event.timezone}
                        </span>
                        {isOrganizer ? (
                          <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 font-mono text-[10px] font-medium text-emerald-400 ring-1 ring-emerald-500/30">
                            Your Event
                          </span>
                        ) : null}
                      </div>
                      <h3 className="truncate text-lg font-bold tracking-tight text-foreground group-hover:text-primary">
                        <Link href={`/events/${event.id}`} className="focus:outline-none">
                          <span className="absolute inset-0" aria-hidden="true" />
                          {event.name}
                        </Link>
                      </h3>
                      <p className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                        <MapPin className="size-3.5 shrink-0 text-primary/80" />
                        <span className="font-medium text-foreground/90">
                          {event.venue_name}
                        </span>
                        <span>· {event.venue_address}</span>
                      </p>
                    </div>
                  </div>

                  {event.description ? (
                    <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                      {event.description}
                    </p>
                  ) : null}

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {event.ticket_types.map((tt) => (
                      <span
                        key={tt.id}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-white/8 bg-white/4 px-2.5 py-1 text-[11px]"
                      >
                        <span className="text-muted-foreground">{tt.name}</span>
                        <span className="font-mono font-semibold text-foreground">
                          {formatPrice(tt.price_cents, tt.currency)}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Perforated Ticket Footer */}
                <div className="ticket-perforation h-px w-full" />
                <div className="flex items-center justify-between gap-4 bg-black/25 px-5 py-3.5 text-xs sm:px-6">
                  <div className="flex items-center gap-4 font-mono text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="size-3.5 text-primary" />
                      {startParts.time} ({formatDuration(event.starts_at, event.ends_at)})
                    </span>
                    <span>
                      {event.sections.length} sec · {totalSeats} seats
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-emerald-400">
                      {minPrice === maxPrice
                        ? formatPrice(minPrice, currency)
                        : `${formatPrice(minPrice, currency)} – ${formatPrice(maxPrice, currency)}`}
                    </span>
                    <span className="inline-flex size-7 items-center justify-center rounded-lg bg-white/8 text-foreground transition group-hover:bg-primary group-hover:text-primary-foreground">
                      <ArrowUpRight className="size-4" />
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Pagination Bar */}
      <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-card/50 px-4 py-3">
        <Button
          variant="ghost"
          size="sm"
          disabled={safePage <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          ← Previous
        </Button>
        <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
          <span>
            Page <strong className="text-foreground">{safePage}</strong> of{" "}
            <strong className="text-foreground">{totalPages}</strong>
          </span>
          <span className="hidden text-white/20 sm:inline">|</span>
          <span className="hidden sm:inline">
            Showing {pageEvents.length} of {filteredEvents.length} events
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          disabled={safePage >= totalPages}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
        >
          Next →
        </Button>
      </div>
    </div>
  );
}
