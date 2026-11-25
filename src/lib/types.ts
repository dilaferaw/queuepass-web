/**
 * Wire types mirroring the backend Pydantic schemas exactly:
 * - queuepass/src/queuepass/modules/events/schemas.py
 * - queuepass/src/queuepass/modules/auth/schemas.py
 *
 * Datetimes are ISO-8601 strings because that is what JSON carries on the
 * wire; ids are the canonical hyphenated UUID strings Pydantic serialises.
 */

// --- Auth Schemas (modules/auth/schemas.py) ----------------------------------

export interface UserCreate {
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  /** ISO date string YYYY-MM-DD */
  birthdate: string;
  password: string;
}

export interface UserPublic {
  id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  /** ISO date string YYYY-MM-DD */
  birthdate: string;
  is_active: boolean;
  created_at: string;
  /** Computed property from birthdate on the backend */
  age: number;
}

export interface Token {
  access_token: string;
  token_type: string;
}

export interface TokenPayload {
  sub: string;
  exp: number;
  iat: number;
  jti: string;
  type: string;
}

// --- Events Request Payloads (modules/events/schemas.py) ---------------------

export interface SeatCreate {
  row_label: string;
  seat_number: number;
}

export interface SectionCreate {
  name: string;
  /** References a TicketTypeCreate.name in the same EventCreate payload */
  ticket_type_name: string;
  seats: SeatCreate[];
}

export interface TicketTypeCreate {
  name: string;
  price_cents: number;
  currency: string;
}

export interface EventCreate {
  name: string;
  description: string | null;
  venue_name: string;
  venue_address: string;
  starts_at: string;
  ends_at: string;
  timezone: string;
  ticket_types: TicketTypeCreate[];
  sections: SectionCreate[];
}

// --- Events Response Projections (modules/events/schemas.py) -----------------

export interface EventSummary {
  id: string;
  organizer_id: string;
  name: string;
  venue_name: string;
  starts_at: string;
  ends_at: string;
  timezone: string;
}

export interface TicketTypePublic {
  id: string;
  name: string;
  price_cents: number;
  currency: string;
}

export interface SeatPublic {
  id: string;
  row_label: string;
  seat_number: number;
}

export interface SectionPublic {
  id: string;
  name: string;
  ticket_type_id: string;
  seats: SeatPublic[];
}

export interface EventDetail extends EventSummary {
  description: string | null;
  venue_address: string;
  ticket_types: TicketTypePublic[];
  sections: SectionPublic[];
  created_at: string;
}
