import type {
  EventDetail,
  SectionPublic,
  SeatPublic,
  TicketTypePublic,
  UserPublic,
} from "./types";
import { computeAgeFromBirthdate } from "./format";

/**
 * Prototype fixtures shaped exactly like real FastAPI responses.
 * Deterministic UUIDs keep React keys and links stable across reloads.
 */
export const uuid = (n: number): string =>
  `00000000-0000-4000-8000-${n.toString().padStart(12, "0")}`;

const buildRows = (
  baseId: number,
  rows: { label: string; count: number }[],
): SeatPublic[] => {
  const result: SeatPublic[] = [];
  let offset = 0;
  for (const r of rows) {
    for (let s = 1; s <= r.count; s++) {
      offset += 1;
      result.push({
        id: uuid(baseId + offset),
        row_label: r.label,
        seat_number: s,
      });
    }
  }
  return result;
};

const ticketType = (
  n: number,
  name: string,
  priceCents: number,
  currency = "USD",
): TicketTypePublic => ({
  id: uuid(n),
  name,
  price_cents: priceCents,
  currency,
});

const section = (
  n: number,
  name: string,
  ticketTypeId: string,
  seats: SeatPublic[],
): SectionPublic => ({
  id: uuid(n),
  name,
  ticket_type_id: ticketTypeId,
  seats,
});

export const ORGANIZER_A = "aaaaaaaa-aaaa-4aaa-8aaa-000000000001";
export const ORGANIZER_B = "bbbbbbbb-bbbb-4bbb-8bbb-000000000002";

export const MOCK_USERS: (UserPublic & { password_plain: string })[] = [
  {
    id: ORGANIZER_A,
    email: "aria@queuepass.live",
    username: "ariavoss",
    first_name: "Aria",
    last_name: "Voss",
    birthdate: "1996-08-19",
    is_active: true,
    created_at: "2025-10-12T18:00:00Z",
    age: computeAgeFromBirthdate("1996-08-19"),
    password_plain: "nightlife2026",
  },
  {
    id: ORGANIZER_B,
    email: "marcus@queuepass.live",
    username: "marcuscole",
    first_name: "Marcus",
    last_name: "Cole",
    birthdate: "1992-03-04",
    is_active: true,
    created_at: "2025-10-20T11:30:00Z",
    age: computeAgeFromBirthdate("1992-03-04"),
    password_plain: "pavilion2026",
  },
];

export const MOCK_EVENTS: EventDetail[] = [
  {
    id: uuid(100),
    organizer_id: ORGANIZER_A,
    name: "Neon Nights: Modular & Laser Odyssey",
    description:
      "An all-night hardware synthwave showcase featuring three live modular acts, custom spatial audio, and a synchronized overhead laser rig. Floor offers up-close immersion near the sub-bass array; the elevated Balcony provides an unobstructed panoramic sightline of the entire visual show.",
    venue_name: "The Fillmore Underground",
    venue_address: "1805 Geary Blvd, San Francisco, CA",
    starts_at: "2026-06-14T20:00:00Z",
    ends_at: "2026-06-15T02:00:00Z",
    timezone: "America/Los_Angeles",
    created_at: "2025-11-01T09:00:00Z",
    ticket_types: [
      ticketType(101, "Floor Arena", 3500),
      ticketType(102, "Balcony VIP", 9500),
      ticketType(103, "Stage Booth", 18000),
    ],
    sections: [
      section(
        110,
        "Main Floor",
        uuid(101),
        buildRows(1100, [
          { label: "A", count: 8 },
          { label: "B", count: 8 },
          { label: "C", count: 10 },
          { label: "D", count: 10 },
        ]),
      ),
      section(
        120,
        "Mezzanine Balcony",
        uuid(102),
        buildRows(1200, [
          { label: "AA", count: 6 },
          { label: "BB", count: 8 },
          { label: "CC", count: 8 },
        ]),
      ),
      section(
        130,
        "Soundboard Booths",
        uuid(103),
        buildRows(1300, [
          { label: "VIP", count: 4 },
          { label: "BOX", count: 4 },
        ]),
      ),
    ],
  },
  {
    id: uuid(200),
    organizer_id: ORGANIZER_B,
    name: "Midnight Blue: Quartet at the Pavilion",
    description:
      "An intimate acoustic & electric jazz session beneath the glass canopy at Riverfront Pavilion. Custom table-side acoustics and late-night vinyl selectors between sets.",
    venue_name: "Riverfront Glass Pavilion",
    venue_address: "42 Riverside Walk, Austin, TX",
    starts_at: "2026-07-02T19:30:00Z",
    ends_at: "2026-07-02T23:00:00Z",
    timezone: "America/Chicago",
    created_at: "2025-11-03T14:15:00Z",
    ticket_types: [
      ticketType(201, "Terrace Seating", 4200),
      ticketType(202, "Front Acoustic Ring", 7800),
    ],
    sections: [
      section(
        210,
        "Acoustic Ring",
        uuid(202),
        buildRows(2100, [
          { label: "A", count: 6 },
          { label: "B", count: 6 },
        ]),
      ),
      section(
        220,
        "Pavilion Terrace",
        uuid(201),
        buildRows(2200, [
          { label: "C", count: 8 },
          { label: "D", count: 8 },
          { label: "E", count: 8 },
        ]),
      ),
    ],
  },
  {
    id: uuid(300),
    organizer_id: ORGANIZER_A,
    name: "35mm Afterhours: Cult Sci-Fi Marathon",
    description:
      "Six restored 35mm archival reels, live ambient score intervals, and bottomless espresso & popcorn. Curated by the Pacific Northwest Analog Film Collective.",
    venue_name: "The Nickelodeon Vault",
    venue_address: "1328 Main St, Portland, OR",
    starts_at: "2026-08-21T18:00:00Z",
    ends_at: "2026-08-22T01:30:00Z",
    timezone: "America/Los_Angeles",
    created_at: "2025-11-05T08:40:00Z",
    ticket_types: [
      ticketType(301, "Mezzanine Single", 1800),
      ticketType(302, "Orchestra All-Nighter", 5500),
    ],
    sections: [
      section(
        310,
        "Orchestra Center",
        uuid(302),
        buildRows(3100, [
          { label: "A", count: 7 },
          { label: "B", count: 7 },
          { label: "C", count: 8 },
        ]),
      ),
      section(
        320,
        "Upper Mezzanine",
        uuid(301),
        buildRows(3200, [
          { label: "M1", count: 6 },
          { label: "M2", count: 6 },
        ]),
      ),
    ],
  },
  {
    id: uuid(400),
    organizer_id: ORGANIZER_B,
    name: "Zero-Latency Systems Demo Night",
    description:
      "Eight systems engineers, five minutes of live terminal demos each, zero slide decks allowed. Open community showcase for distributed systems, database internals, and audio DSP builders.",
    venue_name: "Foundry Hardware Lab",
    venue_address: "900 Market St, 4th Floor, San Francisco, CA",
    starts_at: "2026-09-10T18:30:00Z",
    ends_at: "2026-09-10T21:30:00Z",
    timezone: "UTC",
    created_at: "2025-11-10T17:05:00Z",
    ticket_types: [
      ticketType(401, "Community Pass", 0),
      ticketType(402, "Supporter Front Row", 2500),
    ],
    sections: [
      section(
        410,
        "Front Bench",
        uuid(402),
        buildRows(4100, [{ label: "A", count: 6 }]),
      ),
      section(
        420,
        "Main Amphitheater",
        uuid(401),
        buildRows(4200, [
          { label: "B", count: 8 },
          { label: "C", count: 8 },
          { label: "D", count: 8 },
        ]),
      ),
    ],
  },
  {
    id: uuid(500),
    organizer_id: ORGANIZER_A,
    name: "Solstice Rooftop: Deep House till Dawn",
    description:
      "Open-air Funktion-One sound system overlooking the East River skyline. Sunset ambient warm-up transitioning into hypnotic deep house until first light.",
    venue_name: "Skyline Harbor Deck",
    venue_address: "77 Harbor Ave, Brooklyn, NY",
    starts_at: "2026-06-20T22:00:00Z",
    ends_at: "2026-06-21T05:00:00Z",
    timezone: "America/New_York",
    created_at: "2025-11-12T11:30:00Z",
    ticket_types: [
      ticketType(501, "Sunset Deck", 2800),
      ticketType(502, "Canopy Lounge", 6500),
    ],
    sections: [
      section(
        510,
        "Open Roof Deck",
        uuid(501),
        buildRows(5100, [
          { label: "A", count: 8 },
          { label: "B", count: 8 },
          { label: "C", count: 8 },
        ]),
      ),
      section(
        520,
        "Glass Canopy Lounge",
        uuid(502),
        buildRows(5200, [
          { label: "L1", count: 5 },
          { label: "L2", count: 5 },
        ]),
      ),
    ],
  },
];
