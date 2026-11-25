"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Code2,
  Layers,
  MapPin,
  Plus,
  Sparkles,
  Ticket,
  Trash2,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatPrice } from "@/lib/format";
import { ApiSimulationError, useQueuepass } from "@/lib/store";
import type { EventCreate, SeatCreate } from "@/lib/types";

interface RowBuilderItem {
  label: string;
  seatCount: number;
}

interface SectionBuilderItem {
  name: string;
  ticket_type_name: string;
  rows: RowBuilderItem[];
}

interface TierBuilderItem {
  name: string;
  priceDollars: string;
  currency: string;
}

const TIMEZONE_OPTIONS = [
  "America/Los_Angeles",
  "America/New_York",
  "America/Chicago",
  "UTC",
  "Europe/London",
  "Europe/Berlin",
  "Asia/Tokyo",
];

export default function CreateEventPage() {
  const router = useRouter();
  const { currentUser, quickDemoLogin, createEvent } = useQueuepass();

  const [name, setName] = useState("Subterranean Bass & Laser Ritual");
  const [description, setDescription] = useState(
    "Late-night quadraphonic sound system session with live modular visuals and custom stage lighting.",
  );
  const [venueName, setVenueName] = useState("Warehouse 404");
  const [venueAddress, setVenueAddress] = useState(
    "550 Industrial Way, San Francisco, CA",
  );
  const [startsAt, setStartsAt] = useState("2026-10-24T21:00");
  const [endsAt, setEndsAt] = useState("2026-10-25T03:00");
  const [timezone, setTimezone] = useState("America/Los_Angeles");

  const [tiers, setTiers] = useState<TierBuilderItem[]>([
    { name: "Floor Standard", priceDollars: "35", currency: "USD" },
    { name: "Balcony VIP", priceDollars: "95", currency: "USD" },
  ]);

  const [sections, setSections] = useState<SectionBuilderItem[]>([
    {
      name: "Main Floor",
      ticket_type_name: "Floor Standard",
      rows: [
        { label: "A", seatCount: 6 },
        { label: "B", seatCount: 6 },
      ],
    },
    {
      name: "Elevated Balcony",
      ticket_type_name: "Balcony VIP",
      rows: [
        { label: "AA", seatCount: 4 },
        { label: "BB", seatCount: 4 },
      ],
    },
  ]);

  const [error, setError] = useState<string | null>(null);
  const [showJson, setShowJson] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const wirePayload = useMemo<EventCreate>(() => {
    const startsIso = startsAt ? new Date(startsAt).toISOString() : "";
    const endsIso = endsAt ? new Date(endsAt).toISOString() : "";

    return {
      name,
      description: description.trim() || null,
      venue_name: venueName,
      venue_address: venueAddress,
      starts_at: startsIso,
      ends_at: endsIso,
      timezone,
      ticket_types: tiers.map((t) => ({
        name: t.name,
        price_cents: Math.max(0, Math.round((Number(t.priceDollars) || 0) * 100)),
        currency: t.currency || "USD",
      })),
      sections: sections.map((sec) => {
        const seats: SeatCreate[] = [];
        for (const r of sec.rows) {
          const count = Math.max(1, Math.min(30, Number(r.seatCount) || 1));
          for (let n = 1; n <= count; n++) {
            seats.push({
              row_label: r.label.trim() || "A",
              seat_number: n,
            });
          }
        }
        return {
          name: sec.name,
          ticket_type_name: sec.ticket_type_name,
          seats,
        };
      }),
    };
  }, [name, description, venueName, venueAddress, startsAt, endsAt, timezone, tiers, sections]);

  const totalSeats = useMemo(
    () => wirePayload.sections.reduce((acc, s) => acc + s.seats.length, 0),
    [wirePayload],
  );

  const addTier = () => {
    const nextNum = tiers.length + 1;
    setTiers((prev) => [
      ...prev,
      { name: `Tier ${nextNum}`, priceDollars: "50", currency: "USD" },
    ]);
  };

  const removeTier = (idx: number) => {
    if (tiers.length <= 1) return;
    setTiers((prev) => prev.filter((_, i) => i !== idx));
  };

  const addSection = () => {
    const defaultTier = tiers[0]?.name ?? "Standard";
    setSections((prev) => [
      ...prev,
      {
        name: `Section ${prev.length + 1}`,
        ticket_type_name: defaultTier,
        rows: [{ label: "A", seatCount: 6 }],
      },
    ]);
  };

  const removeSection = (idx: number) => {
    if (sections.length <= 1) return;
    setSections((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const created = await createEvent(wirePayload);
      router.push(`/events/${created.id}`);
    } catch (err) {
      if (err instanceof ApiSimulationError) {
        setError(`HTTP ${err.status}: ${err.message}`);
      } else {
        setError("Failed to create event");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <Link
            href="/"
            className={buttonVariants({ variant: "ghost", size: "sm", className: "-ml-2" })}
          >
            <ArrowLeft className="size-4" />
            Back to catalog
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">
              Organizer Event Studio
            </h1>
            <Badge variant="outline" className="font-mono text-primary">
              POST /api/v1/events · 201 Created
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Creates an Event, TicketTypes, Sections, and Seats atomically in a
            single transaction. Sections reference ticket types by name
            (ticket_type_name).
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowJson((v) => !v)}
        >
          <Code2 className="size-4 text-primary" />
          {showJson ? "Hide Wire JSON" : "Inspect EventCreate JSON"}
        </Button>
      </div>

      {!currentUser ? (
        <Alert className="border-amber-500/40 bg-amber-500/10">
          <AlertCircle className="size-4 text-amber-400" />
          <AlertTitle className="text-amber-300">
            Authentication required for POST /api/v1/events
          </AlertTitle>
          <AlertDescription className="mt-2 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span>
              Unauthenticated requests return 401 Unauthorized. Sign in or activate
              an instant organizer session below.
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="xs"
                onClick={() => void quickDemoLogin("aria@queuepass.live")}
              >
                <Sparkles className="size-3" />
                Instant Login as Aria Voss
              </Button>
              <Link
                href="/login"
                className={buttonVariants({ variant: "outline", size: "xs" })}
              >
                Go to Sign In
              </Link>
            </div>
          </AlertDescription>
        </Alert>
      ) : null}

      {error ? (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Event creation failed</AlertTitle>
          <AlertDescription className="font-mono text-xs">
            {error}
          </AlertDescription>
        </Alert>
      ) : null}

      {showJson ? (
        <Card className="border-primary/30 bg-background/90">
          <CardHeader>
            <CardTitle className="font-mono text-xs text-primary uppercase">
              Live Request Body (EventCreate Schema)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="max-h-80 overflow-auto rounded-xl border border-white/10 bg-black/50 p-4 font-mono text-xs text-emerald-300">
              {JSON.stringify(wirePayload, null, 2)}
            </pre>
          </CardContent>
        </Card>
      ) : null}

      <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-start">
        <div className="flex flex-col gap-6">
          {/* Step 1: Event & Venue Metadata */}
          <Card className="border-white/12 bg-card/80">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="size-4 text-primary" />
                1. Event & Venue Details
              </CardTitle>
              <CardDescription>
                Structural check: starts_at must precede ends_at (422). Policy
                check: starts_at must be in the future (400).
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Event Title (1–200 chars)</Label>
                <Input
                  id="name"
                  required
                  maxLength={200}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="description">Description (optional, max 2000 chars)</Label>
                <Textarea
                  id="description"
                  maxLength={2000}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="venue_name">Venue Name</Label>
                  <Input
                    id="venue_name"
                    required
                    maxLength={200}
                    value={venueName}
                    onChange={(e) => setVenueName(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="venue_address">Venue Address</Label>
                  <Input
                    id="venue_address"
                    required
                    maxLength={500}
                    value={venueAddress}
                    onChange={(e) => setVenueAddress(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="starts_at">Starts At</Label>
                  <Input
                    id="starts_at"
                    type="datetime-local"
                    required
                    value={startsAt}
                    onChange={(e) => setStartsAt(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="ends_at">Ends At</Label>
                  <Input
                    id="ends_at"
                    type="datetime-local"
                    required
                    value={endsAt}
                    onChange={(e) => setEndsAt(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="timezone">Venue IANA Timezone</Label>
                  <select
                    id="timezone"
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="h-9 w-full rounded-lg border border-input bg-input/30 px-3 text-sm text-foreground outline-none focus-visible:border-ring"
                  >
                    {TIMEZONE_OPTIONS.map((tz) => (
                      <option key={tz} value={tz} className="bg-background text-foreground">
                        {tz}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 2: Ticket Tiers */}
          <Card className="border-white/12 bg-card/80">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Ticket className="size-4 text-emerald-400" />
                    2. Ticket Tiers (ticket_types)
                  </CardTitle>
                  <CardDescription>
                    Tier names must be unique within the payload (409 on collision).
                    Prices convert to integer price_cents.
                  </CardDescription>
                </div>
                <Button type="button" variant="outline" size="xs" onClick={addTier}>
                  <Plus className="size-3.5" />
                  Add Tier
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {tiers.map((tier, idx) => (
                <div
                  key={idx}
                  className="grid gap-3 rounded-xl border border-white/10 bg-background/60 p-3 sm:grid-cols-[1fr_140px_100px_auto] sm:items-end"
                >
                  <div className="flex flex-col gap-1.5">
                    <Label>Tier Name</Label>
                    <Input
                      required
                      value={tier.name}
                      onChange={(e) => {
                        const nextName = e.target.value;
                        setTiers((prev) =>
                          prev.map((t, i) => (i === idx ? { ...t, name: nextName } : t)),
                        );
                      }}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>Price ($ USD)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={tier.priceDollars}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTiers((prev) =>
                          prev.map((t, i) =>
                            i === idx ? { ...t, priceDollars: val } : t,
                          ),
                        );
                      }}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>Wire Cents</Label>
                    <div className="flex h-9 items-center rounded-lg border border-white/8 bg-white/4 px-3 font-mono text-xs text-emerald-400">
                      {Math.max(0, Math.round((Number(tier.priceDollars) || 0) * 100))}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={tiers.length <= 1}
                    onClick={() => removeTier(idx)}
                  >
                    <Trash2 className="size-4 text-muted-foreground hover:text-destructive" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Step 3: Sections & Row/Seat Matrix */}
          <Card className="border-white/12 bg-card/80">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Layers className="size-4 text-primary" />
                    3. Venue Sections & Seat Matrix
                  </CardTitle>
                  <CardDescription>
                    Each section links to a tier via ticket_type_name and expands rows
                    into unique (row_label, seat_number) SeatCreate records.
                  </CardDescription>
                </div>
                <Button type="button" variant="outline" size="xs" onClick={addSection}>
                  <Plus className="size-3.5" />
                  Add Section
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {sections.map((sec, sIdx) => (
                <div
                  key={sIdx}
                  className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-background/70 p-4"
                >
                  <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                    <div className="flex flex-col gap-1.5">
                      <Label>Section Name</Label>
                      <Input
                        required
                        value={sec.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSections((prev) =>
                            prev.map((item, i) =>
                              i === sIdx ? { ...item, name: val } : item,
                            ),
                          );
                        }}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label>Linked Ticket Type (ticket_type_name)</Label>
                      <select
                        value={sec.ticket_type_name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSections((prev) =>
                            prev.map((item, i) =>
                              i === sIdx
                                ? { ...item, ticket_type_name: val }
                                : item,
                            ),
                          );
                        }}
                        className="h-9 w-full rounded-lg border border-input bg-input/30 px-3 text-sm text-foreground outline-none focus-visible:border-ring"
                      >
                        {tiers.map((t, i) => (
                          <option
                            key={i}
                            value={t.name}
                            className="bg-background text-foreground"
                          >
                            {t.name} ({formatPrice(Math.round((Number(t.priceDollars) || 0) * 100), t.currency)})
                          </option>
                        ))}
                      </select>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      disabled={sections.length <= 1}
                      onClick={() => removeSection(sIdx)}
                    >
                      <Trash2 className="size-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </div>

                  {/* Rows inside this section */}
                  <div className="flex flex-col gap-2 border-t border-white/8 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-muted-foreground">
                        Rows in {sec.name}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        onClick={() => {
                          const nextRowChar = String.fromCharCode(
                            65 + (sec.rows.length % 26),
                          );
                          setSections((prev) =>
                            prev.map((item, i) =>
                              i === sIdx
                                ? {
                                    ...item,
                                    rows: [
                                      ...item.rows,
                                      { label: nextRowChar, seatCount: 6 },
                                    ],
                                  }
                                : item,
                            ),
                          );
                        }}
                      >
                        + Add Row
                      </Button>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2">
                      {sec.rows.map((row, rIdx) => (
                        <div
                          key={rIdx}
                          className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/4 p-2"
                        >
                          <div className="flex-1">
                            <Label className="mb-1 text-[10px] text-muted-foreground">
                              Row Label
                            </Label>
                            <Input
                              required
                              maxLength={10}
                              value={row.label}
                              onChange={(e) => {
                                const val = e.target.value;
                                setSections((prev) =>
                                  prev.map((item, i) =>
                                    i === sIdx
                                      ? {
                                          ...item,
                                          rows: item.rows.map((r, ri) =>
                                            ri === rIdx ? { ...r, label: val } : r,
                                          ),
                                        }
                                      : item,
                                  ),
                                );
                              }}
                            />
                          </div>
                          <div className="w-24">
                            <Label className="mb-1 text-[10px] text-muted-foreground">
                              Seats (1–30)
                            </Label>
                            <Input
                              type="number"
                              min={1}
                              max={30}
                              required
                              value={row.seatCount}
                              onChange={(e) => {
                                const val = Number(e.target.value) || 1;
                                setSections((prev) =>
                                  prev.map((item, i) =>
                                    i === sIdx
                                      ? {
                                          ...item,
                                          rows: item.rows.map((r, ri) =>
                                            ri === rIdx
                                              ? { ...r, seatCount: val }
                                              : r,
                                          ),
                                        }
                                      : item,
                                  ),
                                );
                              }}
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            disabled={sec.rows.length <= 1}
                            onClick={() => {
                              setSections((prev) =>
                                prev.map((item, i) =>
                                  i === sIdx
                                    ? {
                                        ...item,
                                        rows: item.rows.filter(
                                          (_, ri) => ri !== rIdx,
                                        ),
                                      }
                                    : item,
                                ),
                              );
                            }}
                            className="mt-4"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Live Summary & Publish Card */}
        <aside className="sticky top-22 flex flex-col gap-4">
          <Card className="border-white/12 bg-card/90 shadow-xl backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-base font-bold">
                Live Blueprint Summary
              </CardTitle>
              <CardDescription className="text-xs">
                Ready to persist via EventService.create
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 font-mono text-xs">
              <div className="flex justify-between rounded-xl border border-white/8 bg-background/60 px-3 py-2">
                <span className="text-muted-foreground">Organizer</span>
                <span className="text-primary">
                  {currentUser ? `@${currentUser.username}` : "Unauthenticated"}
                </span>
              </div>
              <div className="flex justify-between rounded-xl border border-white/8 bg-background/60 px-3 py-2">
                <span className="text-muted-foreground">Ticket Tiers</span>
                <span className="text-foreground">
                  {wirePayload.ticket_types.length}
                </span>
              </div>
              <div className="flex justify-between rounded-xl border border-white/8 bg-background/60 px-3 py-2">
                <span className="text-muted-foreground">Sections</span>
                <span className="text-foreground">
                  {wirePayload.sections.length}
                </span>
              </div>
              <div className="flex justify-between rounded-xl border border-white/8 bg-background/60 px-3 py-2">
                <span className="text-muted-foreground">Total Generated Seats</span>
                <span className="font-bold text-emerald-400">{totalSeats}</span>
              </div>

              <div className="ticket-perforation my-1 h-px w-full" />

              <div className="space-y-1.5">
                <span className="text-[10px] text-muted-foreground uppercase">
                  Mini Venue Preview
                </span>
                {wirePayload.sections.map((s, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-white/8 bg-background/50 p-2.5"
                  >
                    <div className="mb-1 flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-foreground">{s.name}</span>
                      <span className="text-primary">{s.ticket_type_name}</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {s.seats.slice(0, 18).map((seat, i) => (
                        <span
                          key={i}
                          className="inline-flex size-5 items-center justify-center rounded border border-white/10 bg-white/5 text-[9px] text-muted-foreground"
                        >
                          {seat.row_label}
                          {seat.seat_number}
                        </span>
                      ))}
                      {s.seats.length > 18 ? (
                        <span className="px-1 text-[10px] text-muted-foreground">
                          +{s.seats.length - 18} more
                        </span>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={submitting}
                className="mt-2 w-full font-semibold shadow-[0_0_25px_oklch(0.71_0.21_292/0.4)]"
              >
                {submitting ? "Publishing Event..." : "Publish Event (201 Created)"}
              </Button>
            </CardContent>
          </Card>
        </aside>
      </form>
    </div>
  );
}
