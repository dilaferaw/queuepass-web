/**
 * Display formatting helpers.
 *
 * Prices arrive as integer minor units (`price_cents`) — never floats — so
 * division by 100 happens only at the display boundary.
 *
 * Times arrive as UTC ISO strings plus a per-event `timezone` name; the event
 * owner chose that zone, so render in it rather than the viewer's local zone.
 * A malformed zone string must not crash the page, hence the fallback.
 */
export function formatPrice(cents: number, currency = "USD"): string {
  if (cents === 0) return "Free";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(cents / 100);
  } catch {
    return `$${(cents / 100).toFixed(2)}`;
  }
}

export function formatEventDateTime(iso: string, timeZone: string): string {
  const date = new Date(iso);
  const options: Intl.DateTimeFormatOptions = {
    dateStyle: "medium",
    timeStyle: "short",
  };
  try {
    return new Intl.DateTimeFormat("en-US", { ...options, timeZone }).format(date);
  } catch {
    return new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" }).format(date);
  }
}

export function formatEventDateParts(iso: string, timeZone: string): {
  month: string;
  day: string;
  weekday: string;
  time: string;
  fullDate: string;
} {
  const date = new Date(iso);
  const safeZone = (() => {
    try {
      new Intl.DateTimeFormat("en-US", { timeZone });
      return timeZone;
    } catch {
      return "UTC";
    }
  })();

  const month = new Intl.DateTimeFormat("en-US", { month: "short", timeZone: safeZone })
    .format(date)
    .toUpperCase();
  const day = new Intl.DateTimeFormat("en-US", { day: "2-digit", timeZone: safeZone }).format(
    date,
  );
  const weekday = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    timeZone: safeZone,
  }).format(date);
  const time = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: safeZone,
  }).format(date);
  const fullDate = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: safeZone,
  }).format(date);

  return { month, day, weekday, time, fullDate };
}

export function formatDuration(startsAt: string, endsAt: string): string {
  const diffMs = new Date(endsAt).getTime() - new Date(startsAt).getTime();
  if (diffMs <= 0 || Number.isNaN(diffMs)) return "—";
  const totalMins = Math.round(diffMs / 60000);
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

/**
 * Mirrors backend UserPublic.age calculation:
 * `(today.month, today.day) < (bd.month, bd.day)` conservative leap-year policy.
 */
export function computeAgeFromBirthdate(birthdateIso: string): number {
  const [y, m, d] = birthdateIso.split("-").map(Number);
  if (!y || !m || !d) return 0;
  const now = new Date();
  const todayYear = now.getFullYear();
  const todayMonth = now.getMonth() + 1;
  const todayDay = now.getDate();
  let years = todayYear - y;
  if (todayMonth < m || (todayMonth === m && todayDay < d)) {
    years -= 1;
  }
  return Math.max(0, years);
}
