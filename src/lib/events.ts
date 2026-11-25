import { MOCK_EVENTS } from "./mock-data";
import type { EventDetail, EventSummary } from "./types";

/**
 * Data-access layer for events.
 *
 * Signatures deliberately mirror the backend contract
 * (`GET /api/v1/events?limit&offset`, `GET /api/v1/events/{id}`) so the
 * eventual integration is a body swap, not a refactor.
 */
export function toEventSummary(event: EventDetail): EventSummary {
  return {
    id: event.id,
    organizer_id: event.organizer_id,
    name: event.name,
    venue_name: event.venue_name,
    starts_at: event.starts_at,
    ends_at: event.ends_at,
    timezone: event.timezone,
  };
}

export async function listEvents(
  limit: number,
  offset: number,
): Promise<EventSummary[]> {
  return MOCK_EVENTS.map(toEventSummary).slice(offset, offset + limit);
}

export async function getEvent(id: string): Promise<EventDetail | null> {
  return MOCK_EVENTS.find((event) => event.id === id) ?? null;
}
