"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Info,
  Layers,
  Lock,
  MapPin,
  Sparkles,
  Ticket,
  Trash2,
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
import type { EventDetail, SeatPublic, SectionPublic, TicketTypePublic } from "@/lib/types";
import { cn } from "@/lib/utils";

const TIER_PALETTES = [
  {
    badge: "bg-primary/20 text-primary ring-primary/40",
    seat: "border-primary/40 bg-primary/15 text-primary hover:bg-primary hover:text-primary-foreground",
    seatSelected:
      "border-primary bg-primary text-primary-foreground ring-2 ring-primary/50 shadow-[0_0_15px_oklch(0.71_0.21_292/0.6)]",
    glow: "from-primary/25",
    dot: "bg-primary",
  },
  {
    badge: "bg-emerald-500/20 text-emerald-400 ring-emerald-500/40",
    seat: "border-emerald-500/40 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-400 hover:text-emerald-950",
    seatSelected:
      "border-emerald-400 bg-emerald-400 text-emerald-950 ring-2 ring-emerald-400/50 shadow-[0_0_15px_rgba(52,211,153,0.6)]",
    glow: "from-emerald-500/25",
    dot: "bg-emerald-400",
  },
  {
    badge: "bg-amber-500/20 text-amber-300 ring-amber-500/40",
    seat: "border-amber-500/40 bg-amber-500/15 text-amber-300 hover:bg-amber-400 hover:text-amber-950",
    seatSelected:
      "border-amber-400 bg-amber-400 text-amber-950 ring-2 ring-amber-400/50 shadow-[0_0_15px_rgba(251,191,36,0.6)]",
    glow: "from-amber-500/25",
    dot: "bg-amber-400",
  },
  {
    badge: "bg-sky-500/20 text-sky-300 ring-sky-500/40",
    seat: "border-sky-500/40 bg-sky-500/15 text-sky-300 hover:bg-sky-400 hover:text-sky-950",
    seatSelected:
      "border-sky-400 bg-sky-400 text-sky-950 ring-2 ring-sky-400/50 shadow-[0_0_15px_rgba(56,189,248,0.6)]",
    glow: "from-sky-500/25",
    dot: "bg-sky-400",
  },
];

function groupByRow(seats: SeatPublic[]): Map<string, SeatPublic[]> {
  const rows = new Map<string, SeatPublic[]>();
  for (const seat of seats) {
    const row = rows.get(seat.row_label) ?? [];
    row.push(seat);
    rows.set(seat.row_label, row);
  }
  for (const row of rows.values()) {
    row.sort((a, b) => a.seat_number - b.seat_number);
  }
  return new Map([...rows.entries()].sort(([a], [b]) => a.localeCompare(b)));
}

interface SelectedSeatInfo {
  seat: SeatPublic;
  section: SectionPublic;
  ticketType: TicketTypePublic | undefined;
}

export function EventDetailClient({
  eventId,
  initialEvent,
}: {
  eventId: string;
  initialEvent: EventDetail | null;
}) {
  const { getEventById, hydrated } = useQueuepass();
  const event = getEventById(eventId) ?? initialEvent;

  const [activeTierFilter, setActiveTierFilter] = useState<string | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<SelectedSeatInfo[]>([]);

  const tierMeta = useMemo(() => {
    if (!event) return new Map<string, { tt: TicketTypePublic; palette: (typeof TIER_PALETTES)[0] }>();
    return new Map(
      event.ticket_types.map((tt, idx) => [
        tt.id,
        { tt, palette: TIER_PALETTES[idx % TIER_PALETTES.length] },
      ]),
    );
  }, [event]);

  if (!event) {
    if (!hydrated) {
      return (
        <div className="rounded-3xl border border-white/10 bg-card/50 p-12 text-center font-mono text-sm text-muted-foreground">
          Loading venue telemetry...
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-white/10 bg-card/60 py-20 text-center">
        <Ticket className="size-10 text-muted-foreground" />
        <div className="space-y-1">
          <h1 className="text-xl font-bold">Event not found (404)</h1>
          <p className="font-mono text-xs text-muted-foreground">
            No event matches UUID {eventId}
          </p>
        </div>
        <Link href="/" className={buttonVariants({ variant: "default" })}>
          ← Return to catalog
        </Link>
      </div>
    );
  }

  const startParts = formatEventDateParts(event.starts_at, event.timezone);
  const totalSeats = event.sections.reduce((acc, s) => acc + s.seats.length, 0);
  const selectedIds = new Set(selectedSeats.map((s) => s.seat.id));
  const subtotalCents = selectedSeats.reduce(
    (acc, item) => acc + (item.ticketType?.price_cents ?? 0),
    0,
  );
  const defaultCurrency = event.ticket_types[0]?.currency ?? "USD";

  const toggleSeat = (
    seat: SeatPublic,
    section: SectionPublic,
    ticketType: TicketTypePublic | undefined,
  ) => {
    setSelectedSeats((prev) => {
      const exists = prev.some((item) => item.seat.id === seat.id);
      if (exists) {
        return prev.filter((item) => item.seat.id !== seat.id);
      }
      return [...prev, { seat, section, ticketType }];
    });
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Breadcrumb & Meta Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "-ml-2 gap-1.5 text-muted-foreground hover:text-foreground",
          )}
        >
          <ArrowLeft className="size-4" />
          Back to catalog
        </Link>
        <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
          <span className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1">
            EVENT UUID: {event.id.slice(0, 8)}…{event.id.slice(-4)}
          </span>
          <Badge variant="outline" className="font-mono">
            {event.timezone}
          </Badge>
        </div>
      </div>

      {/* Immersive Venue Hero Header */}
      <header className="relative overflow-hidden rounded-3xl border border-white/12 bg-linear-to-br from-primary/15 via-card to-emerald-500/10 p-6 sm:p-8">
        <div className="bg-grid-pattern absolute inset-0 opacity-60" />
        <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 font-mono text-xs font-medium text-emerald-400 ring-1 ring-emerald-500/30">
                <Sparkles className="size-3" />
                RESERVED SEATING VENUE
              </span>
              <span className="font-mono text-xs text-muted-foreground">
                {event.sections.length} Sections · {totalSeats} Seats
              </span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              {event.name}
            </h1>

            {event.description ? (
              <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                {event.description}
              </p>
            ) : null}

            <div className="flex flex-wrap items-center gap-5 pt-1 text-xs sm:text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="size-4 text-primary" />
                <span className="font-semibold text-foreground">
                  {event.venue_name}
                </span>
                <span className="text-muted-foreground">
                  · {event.venue_address}
                </span>
              </div>
              <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
                <Calendar className="size-4 text-emerald-400" />
                <span>
                  {formatEventDateTime(event.starts_at, event.timezone)} —{" "}
                  {formatEventDateTime(event.ends_at, event.timezone)}
                </span>
              </div>
              <div className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                <Clock className="size-4 text-primary" />
                <span>{formatDuration(event.starts_at, event.ends_at)}</span>
              </div>
            </div>
          </div>

          {/* Calendar Stamp Card */}
          <div className="flex items-center gap-4 self-start rounded-2xl border border-white/15 bg-background/85 p-4 backdrop-blur-md lg:flex-col lg:items-center lg:px-6 lg:py-5 lg:text-center">
            <div className="flex flex-col items-center">
              <span className="font-mono text-xs font-semibold tracking-widest text-primary uppercase">
                {startParts.month}
              </span>
              <span className="font-mono text-4xl font-bold text-foreground">
                {startParts.day}
              </span>
              <span className="font-mono text-xs text-muted-foreground">
                {startParts.weekday} · {startParts.time}
              </span>
            </div>
            <div className="ticket-perforation hidden h-px w-full lg:block" />
            <span className="font-mono text-[11px] text-emerald-400">
              Doors Open · {event.timezone}
            </span>
          </div>
        </div>
      </header>

      {/* Ticket Tiers Section */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight">
              <Layers className="size-5 text-primary" />
              Ticket Tiers
            </h2>
            <p className="text-xs text-muted-foreground">
              Click any tier card to filter corresponding sections on the seating map below.
            </p>
          </div>
          {activeTierFilter ? (
            <Button
              variant="ghost"
              size="xs"
              onClick={() => setActiveTierFilter(null)}
            >
              Show all tiers
            </Button>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {event.ticket_types.map((tt) => {
            const meta = tierMeta.get(tt.id);
            const isFiltered = activeTierFilter === tt.id;
            const matchingSections = event.sections.filter(
              (s) => s.ticket_type_id === tt.id,
            );
            const tierSeatCount = matchingSections.reduce(
              (acc, s) => acc + s.seats.length,
              0,
            );

            return (
              <button
                key={tt.id}
                type="button"
                onClick={() =>
                  setActiveTierFilter((curr) => (curr === tt.id ? null : tt.id))
                }
                className={cn(
                  "group relative flex flex-col justify-between overflow-hidden rounded-2xl border p-5 text-left transition-all",
                  isFiltered
                    ? "border-primary bg-primary/10 ring-2 ring-primary/40"
                    : "border-white/10 bg-card/80 hover:border-white/25 hover:bg-card",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "size-2.5 rounded-full",
                          meta?.palette.dot ?? "bg-primary",
                        )}
                      />
                      <span className="font-semibold text-foreground">
                        {tt.name}
                      </span>
                    </div>
                    <p className="font-mono text-xs text-muted-foreground">
                      {matchingSections.map((s) => s.name).join(", ") ||
                        "Unassigned"}
                    </p>
                  </div>
                  <span className="font-mono text-xl font-bold text-foreground">
                    {formatPrice(tt.price_cents, tt.currency)}
                  </span>
                </div>

                <div className="ticket-perforation my-4 h-px w-full" />

                <div className="flex items-center justify-between font-mono text-[11px] text-muted-foreground">
                  <span>
                    {matchingSections.length} section
                    {matchingSections.length === 1 ? "" : "s"} · {tierSeatCount}{" "}
                    seats
                  </span>
                  <span className="text-primary group-hover:underline">
                    {isFiltered ? "Active filter ✓" : "Highlight on map →"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Interactive Stage & Seat Map + Hold Tray */}
      <section className="grid gap-6 lg:grid-cols-[1fr_340px] lg:items-start">
        {/* Left: Stage & Venue Map */}
        <div className="flex flex-col gap-6 rounded-3xl border border-white/10 bg-card/60 p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold tracking-tight">
                Interactive Venue Map
              </h2>
              <p className="text-xs text-muted-foreground">
                Click seats to inspect coordinates and preview Redis TTL seat-hold tickets.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
              {event.ticket_types.map((tt) => {
                const meta = tierMeta.get(tt.id);
                return (
                  <span key={tt.id} className="flex items-center gap-1.5">
                    <span
                      className={cn("size-2.5 rounded-full", meta?.palette.dot)}
                    />
                    <span className="text-muted-foreground">{tt.name}</span>
                  </span>
                );
              })}
            </div>
          </div>

          {/* Glowing Stage Arc */}
          <div className="relative mx-auto flex w-full max-w-xl flex-col items-center pt-2 pb-4">
            <div className="h-3 w-4/5 rounded-t-full bg-linear-to-r from-transparent via-primary to-transparent opacity-80 shadow-[0_10px_40px_oklch(0.71_0.21_292/0.8)]" />
            <div className="mt-1 flex w-3/4 items-center justify-center rounded-b-2xl border border-t-0 border-white/10 bg-white/4 py-2 font-mono text-[11px] tracking-[0.25em] text-muted-foreground uppercase">
              STAGE / MAIN PERFORMER RIG
            </div>
          </div>

          {/* Sections Grid */}
          <div className="grid gap-5">
            {event.sections
              .filter(
                (sec) =>
                  !activeTierFilter || sec.ticket_type_id === activeTierFilter,
              )
              .map((section) => {
                const meta = tierMeta.get(section.ticket_type_id);
                const ticketType = meta?.tt;
                const palette = meta?.palette ?? TIER_PALETTES[0];
                const rows = groupByRow(section.seats);

                return (
                  <div
                    key={section.id}
                    className="rounded-2xl border border-white/10 bg-background/70 p-4 sm:p-5"
                  >
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-white/8 pb-3">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={cn("size-2.5 rounded-full", palette.dot)}
                        />
                        <h3 className="font-semibold text-foreground">
                          {section.name}
                        </h3>
                        <span className="font-mono text-xs text-muted-foreground">
                          ({section.seats.length} seats)
                        </span>
                      </div>
                      {ticketType ? (
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-0.5 font-mono text-xs font-medium ring-1",
                            palette.badge,
                          )}
                        >
                          {ticketType.name} ·{" "}
                          {formatPrice(
                            ticketType.price_cents,
                            ticketType.currency,
                          )}
                        </span>
                      ) : null}
                    </div>

                    <div className="flex flex-col gap-2.5 overflow-x-auto pb-1">
                      {[...rows.entries()].map(([rowLabel, seats]) => (
                        <div
                          key={rowLabel}
                          className="flex items-center gap-3"
                        >
                          <span className="w-10 shrink-0 rounded bg-white/5 py-1 text-center font-mono text-xs font-semibold text-muted-foreground">
                            {rowLabel}
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {seats.map((seat) => {
                              const isSelected = selectedIds.has(seat.id);
                              return (
                                <button
                                  key={seat.id}
                                  type="button"
                                  onClick={() =>
                                    toggleSeat(seat, section, ticketType)
                                  }
                                  aria-label={`Section ${section.name}, Row ${seat.row_label}, Seat ${seat.seat_number}`}
                                  aria-pressed={isSelected}
                                  className={cn(
                                    "inline-flex size-8 items-center justify-center rounded-lg border font-mono text-xs font-medium transition-all duration-150 cursor-pointer",
                                    isSelected
                                      ? palette.seatSelected
                                      : palette.seat,
                                  )}
                                >
                                  {seat.seat_number}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Right: Simulated Pass Inspector & Redis Hold Preview */}
        <aside className="sticky top-22 flex flex-col gap-4 rounded-3xl border border-white/12 bg-card/90 p-5 shadow-xl backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Ticket className="size-4 text-primary" />
              <h3 className="font-bold tracking-tight">Pass Selection Tray</h3>
            </div>
            <span className="rounded-full bg-primary/20 px-2 py-0.5 font-mono text-xs font-semibold text-primary">
              {selectedSeats.length} selected
            </span>
          </div>

          {selectedSeats.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/12 bg-background/50 px-4 py-10 text-center">
              <Lock className="size-6 text-muted-foreground" />
              <p className="text-xs font-medium text-foreground">
                No seats selected yet
              </p>
              <p className="text-[11px] text-muted-foreground">
                Click any seat in the venue map to inspect its UUID and preview a ticket stub.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex max-h-72 flex-col gap-2 overflow-y-auto pr-1">
                {selectedSeats.map(({ seat, section, ticketType }) => (
                  <div
                    key={seat.id}
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-background/80 px-3 py-2.5 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 font-medium text-foreground">
                        <span>{section.name}</span>
                        <span className="text-muted-foreground">·</span>
                        <span className="font-mono text-primary">
                          Row {seat.row_label} · Seat {seat.seat_number}
                        </span>
                      </div>
                      <div className="font-mono text-[10px] text-muted-foreground">
                        {ticketType?.name ?? "Tier"} · Seat ID #{seat.id.slice(-6)}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-emerald-400">
                        {ticketType
                          ? formatPrice(ticketType.price_cents, ticketType.currency)
                          : "—"}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleSeat(seat, section, ticketType)}
                        className="rounded p-1 text-muted-foreground hover:bg-white/10 hover:text-destructive"
                        aria-label="Remove seat"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="ticket-perforation my-1 h-px w-full" />

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Estimated Total</span>
                <span className="font-mono text-lg font-bold text-foreground">
                  {formatPrice(subtotalCents, defaultCurrency)}
                </span>
              </div>

              <Button
                variant="outline"
                size="xs"
                onClick={() => setSelectedSeats([])}
                className="w-full"
              >
                Clear seat selection
              </Button>
            </div>
          )}

          <div className="rounded-2xl border border-primary/25 bg-primary/8 p-3.5 text-xs">
            <div className="flex items-center gap-1.5 font-mono text-[11px] font-semibold text-primary">
              <Info className="size-3.5 shrink-0" />
              <span>BACKEND INCREMENT 3 STATUS</span>
            </div>
            <p className="mt-1 leading-relaxed text-muted-foreground">
              Seats are persisted via <code className="text-foreground">SeatPublic</code>.
              Redis DB 1 (<code className="text-foreground">REDIS_LOCKS_URL</code>) is
              provisioned for TTL seat holds and checkout locks in the next backend
              increment.
            </p>
            <div className="mt-2.5 flex items-center gap-1.5 font-mono text-[10px] text-emerald-400">
              <CheckCircle2 className="size-3" />
              <span>Wire schema verified against GET /api/v1/events/&#123;id&#125;</span>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
