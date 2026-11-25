"use client";
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { computeAgeFromBirthdate } from "./format";
import { MOCK_EVENTS, MOCK_USERS } from "./mock-data";
import type {
  EventCreate,
  EventDetail,
  Token,
  TokenPayload,
  UserCreate,
  UserPublic,
} from "./types";
const STORAGE_KEY_EVENTS = "queuepass.custom_events.v1";
const STORAGE_KEY_USERS = "queuepass.custom_users.v1";
const STORAGE_KEY_SESSION = "queuepass.session.v1";
const STORAGE_KEY_REVOKED = "queuepass.revocation.v1";
interface StoredUser extends UserPublic {
  password_plain: string;
}
interface SessionState {
  token: Token;
  payload: TokenPayload;
  user: UserPublic;
}
interface RevocationState {
  revokedJtis: string[];
  userCutoffs: Record<string, number>;
}
export class ApiSimulationError extends Error {
  status: number;
  constructor(status: number, detail: string) {
    super(detail);
    this.status = status;
  }
}
interface QueuepassContextValue {
  hydrated: boolean;
  events: EventDetail[];
  currentUser: UserPublic | null;
  token: Token | null;
  tokenPayload: TokenPayload | null;
  revocationState: RevocationState;
  getEventById: (id: string) => EventDetail | null;
  login: (email: string, password: string) => Promise<Token>;
  quickDemoLogin: (email: string) => Promise<void>;
  register: (payload: UserCreate) => Promise<UserPublic>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  createEvent: (payload: EventCreate) => Promise<EventDetail>;
  resetDemoData: () => void;
}
const QueuepassContext = createContext<QueuepassContextValue | null>(null);
function readStoredJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
function persistJson(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore quota / private-mode failures
  }
}
function removeStored(key: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore
  }
}
function toPublicUser(stored: StoredUser): UserPublic {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password_plain, ...publicUser } = stored;
  return publicUser;
}
function subscribeNoop(): () => void {
  return () => {};
}
function readInitialSession(): SessionState | null {
  if (typeof window === "undefined") return null;
  const parsed = readStoredJson<SessionState | null>(STORAGE_KEY_SESSION, null);
  if (!parsed) return null;
  const nowSec = Math.floor(Date.now() / 1000);
  if (parsed.payload.exp > nowSec) return parsed;
  removeStored(STORAGE_KEY_SESSION);
  return null;
}
function randomUuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
function buildMockJwt(userId: string): { token: Token; payload: TokenPayload } {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 30 * 60; // 30 minutes matching settings.JWT_EXPIRE_MINUTES
  const jti = randomUuid();
  const payload: TokenPayload = {
    sub: userId,
    iat,
    exp,
    jti,
    type: "access",
  };
  const encodedHeader = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const encodedPayload = btoa(JSON.stringify(payload));
  const signature = btoa(`queuepass-sig-${jti.slice(0, 8)}`);
  return {
    token: {
      access_token: `${encodedHeader}.${encodedPayload}.${signature}`,
      token_type: "bearer",
    },
    payload,
  };
}
export function QueuepassProvider({ children }: { children: React.ReactNode }) {
  const hydrated = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );
  const [customEvents, setCustomEvents] = useState<EventDetail[]>(() =>
    readStoredJson<EventDetail[]>(STORAGE_KEY_EVENTS, []),
  );
  const [customUsers, setCustomUsers] = useState<StoredUser[]>(() =>
    readStoredJson<StoredUser[]>(STORAGE_KEY_USERS, []),
  );
  const [session, setSession] = useState<SessionState | null>(readInitialSession);
  const [revocationState, setRevocationState] = useState<RevocationState>(() =>
    readStoredJson<RevocationState>(STORAGE_KEY_REVOKED, {
      revokedJtis: [],
      userCutoffs: {},
    }),
  );
  const allUsers = useMemo(
    () => [...MOCK_USERS, ...customUsers],
    [customUsers],
  );
  const allEvents = useMemo(
    () => [...customEvents, ...MOCK_EVENTS],
    [customEvents],
  );
  const getEventById = useCallback(
    (id: string): EventDetail | null => {
      return allEvents.find((ev) => ev.id === id) ?? null;
    },
    [allEvents],
  );
  const login = useCallback(
    async (emailInput: string, password: string): Promise<Token> => {
      const normalizedEmail = emailInput.trim().toLowerCase();
      const found = allUsers.find(
        (u) => u.email.toLowerCase() === normalizedEmail,
      );
      if (!found || found.password_plain !== password || !found.is_active) {
        throw new ApiSimulationError(401, "Incorrect email or password");
      }
      const publicUser = toPublicUser(found);
      const { token, payload } = buildMockJwt(publicUser.id);
      const nextSession: SessionState = {
        token,
        payload,
        user: {
          ...publicUser,
          age: computeAgeFromBirthdate(publicUser.birthdate),
        },
      };
      setSession(nextSession);
      persistJson(STORAGE_KEY_SESSION, nextSession);
      return token;
    },
    [allUsers],
  );
  const quickDemoLogin = useCallback(
    async (emailInput: string): Promise<void> => {
      const found = allUsers.find(
        (u) => u.email.toLowerCase() === emailInput.toLowerCase(),
      );
      if (!found) return;
      await login(found.email, found.password_plain);
    },
    [allUsers, login],
  );
  const register = useCallback(
    async (payload: UserCreate): Promise<UserPublic> => {
      const email = payload.email.trim().toLowerCase();
      const username = payload.username.trim();
      const firstName = payload.first_name.trim();
      const lastName = payload.last_name.trim();
      if (!email.includes("@")) {
        throw new ApiSimulationError(422, "Valid email address is required");
      }
      if (username.length < 3 || username.length > 50) {
        throw new ApiSimulationError(
          422,
          "Username must be between 3 and 50 characters",
        );
      }
      if (!firstName || !lastName) {
        throw new ApiSimulationError(
          422,
          "First name and last name are required",
        );
      }
      if (payload.password.length < 8) {
        throw new ApiSimulationError(
          422,
          "Password must be at least 8 characters",
        );
      }
      const todayIso = new Date().toISOString().slice(0, 10);
      if (!payload.birthdate || payload.birthdate > todayIso) {
        throw new ApiSimulationError(
          422,
          "birthdate cannot be in the future",
        );
      }
      if (allUsers.some((u) => u.email.toLowerCase() === email)) {
        throw new ApiSimulationError(409, "Email already registered");
      }
      if (allUsers.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
        throw new ApiSimulationError(409, "Username already taken");
      }
      const newUser: StoredUser = {
        id: randomUuid(),
        email,
        username,
        first_name: firstName,
        last_name: lastName,
        birthdate: payload.birthdate,
        is_active: true,
        created_at: new Date().toISOString(),
        age: computeAgeFromBirthdate(payload.birthdate),
        password_plain: payload.password,
      };
      const updatedUsers = [...customUsers, newUser];
      setCustomUsers(updatedUsers);
      persistJson(STORAGE_KEY_USERS, updatedUsers);
      const publicUser = toPublicUser(newUser);
      const { token, payload: tokenPayload } = buildMockJwt(publicUser.id);
      const nextSession: SessionState = {
        token,
        payload: tokenPayload,
        user: publicUser,
      };
      setSession(nextSession);
      persistJson(STORAGE_KEY_SESSION, nextSession);
      return publicUser;
    },
    [allUsers, customUsers],
  );
  const logout = useCallback(async () => {
    if (session) {
      const nextRevoked: RevocationState = {
        ...revocationState,
        revokedJtis: [session.payload.jti, ...revocationState.revokedJtis].slice(
          0,
          20,
        ),
      };
      setRevocationState(nextRevoked);
      persistJson(STORAGE_KEY_REVOKED, nextRevoked);
    }
    setSession(null);
    removeStored(STORAGE_KEY_SESSION);
  }, [session, revocationState]);
  const logoutAll = useCallback(async () => {
    if (session) {
      const nowSec = Math.floor(Date.now() / 1000);
      const nextRevoked: RevocationState = {
        revokedJtis: [session.payload.jti, ...revocationState.revokedJtis].slice(
          0,
          20,
        ),
        userCutoffs: {
          ...revocationState.userCutoffs,
          [session.user.id]: nowSec,
        },
      };
      setRevocationState(nextRevoked);
      persistJson(STORAGE_KEY_REVOKED, nextRevoked);
    }
    setSession(null);
    removeStored(STORAGE_KEY_SESSION);
  }, [session, revocationState]);
  const createEvent = useCallback(
    async (payload: EventCreate): Promise<EventDetail> => {
      if (!session) {
        throw new ApiSimulationError(401, "Not authenticated");
      }
      const startsMs = new Date(payload.starts_at).getTime();
      const endsMs = new Date(payload.ends_at).getTime();
      if (Number.isNaN(startsMs) || Number.isNaN(endsMs)) {
        throw new ApiSimulationError(422, "Valid start and end datetimes required");
      }
      // 1. Structural rule (schemas.py: EventCreate._starts_before_ends -> 422)
      if (startsMs >= endsMs) {
        throw new ApiSimulationError(
          422,
          "starts_at must be strictly before ends_at",
        );
      }
      // 2. Policy rule (service.py: starts_at > datetime.now(UTC) -> 400)
      if (startsMs <= Date.now()) {
        throw new ApiSimulationError(400, "starts_at must be in the future");
      }
      if (payload.ticket_types.length === 0) {
        throw new ApiSimulationError(422, "At least one ticket type is required");
      }
      if (payload.sections.length === 0) {
        throw new ApiSimulationError(422, "At least one section is required");
      }
      // 3. Uniqueness of ticket-type names (409)
      const ttNames = payload.ticket_types.map((t) => t.name.trim());
      if (new Set(ttNames).size !== ttNames.length) {
        throw new ApiSimulationError(409, "duplicate ticket type names");
      }
      // 4. Uniqueness of section names (409)
      const sectionNames = payload.sections.map((s) => s.name.trim());
      if (new Set(sectionNames).size !== sectionNames.length) {
        throw new ApiSimulationError(409, "duplicate section names");
      }
      // 5. Referential integrity: section.ticket_type_name in ticket_types (400)
      const ttNameSet = new Set(ttNames);
      for (const s of payload.sections) {
        if (!ttNameSet.has(s.ticket_type_name.trim())) {
          throw new ApiSimulationError(
            400,
            `section '${s.name}' references unknown ticket type '${s.ticket_type_name}'`,
          );
        }
      }
      // 6. Uniqueness: seats within each section (row_label, seat_number) (409)
      for (const s of payload.sections) {
        if (s.seats.length === 0) {
          throw new ApiSimulationError(
            422,
            `section '${s.name}' must contain at least 1 seat`,
          );
        }
        const keys = new Set(
          s.seats.map((seat) => `${seat.row_label.trim()}::${seat.seat_number}`),
        );
        if (keys.size !== s.seats.length) {
          throw new ApiSimulationError(
            409,
            `duplicate seat in section '${s.name}'`,
          );
        }
      }
      const createdTicketTypes = payload.ticket_types.map((tt) => ({
        id: randomUuid(),
        name: tt.name.trim(),
        price_cents: tt.price_cents,
        currency: tt.currency.toUpperCase(),
      }));
      const ttIdByName = new Map(
        createdTicketTypes.map((tt) => [tt.name, tt.id]),
      );
      const createdSections = payload.sections.map((s) => ({
        id: randomUuid(),
        name: s.name.trim(),
        ticket_type_id: ttIdByName.get(s.ticket_type_name.trim())!,
        seats: s.seats.map((seat) => ({
          id: randomUuid(),
          row_label: seat.row_label.trim(),
          seat_number: seat.seat_number,
        })),
      }));
      const createdEvent: EventDetail = {
        id: randomUuid(),
        organizer_id: session.user.id,
        name: payload.name.trim(),
        description: payload.description?.trim() || null,
        venue_name: payload.venue_name.trim(),
        venue_address: payload.venue_address.trim(),
        starts_at: new Date(payload.starts_at).toISOString(),
        ends_at: new Date(payload.ends_at).toISOString(),
        timezone: payload.timezone || "UTC",
        created_at: new Date().toISOString(),
        ticket_types: createdTicketTypes,
        sections: createdSections,
      };
      const nextEvents = [createdEvent, ...customEvents];
      setCustomEvents(nextEvents);
      persistJson(STORAGE_KEY_EVENTS, nextEvents);
      return createdEvent;
    },
    [session, customEvents],
  );
  const resetDemoData = useCallback(() => {
    setCustomEvents([]);
    setCustomUsers([]);
    removeStored(STORAGE_KEY_EVENTS);
    removeStored(STORAGE_KEY_USERS);
  }, []);
  const value = useMemo<QueuepassContextValue>(
    () => ({
      hydrated,
      events: allEvents,
      currentUser: session?.user ?? null,
      token: session?.token ?? null,
      tokenPayload: session?.payload ?? null,
      revocationState,
      getEventById,
      login,
      quickDemoLogin,
      register,
      logout,
      logoutAll,
      createEvent,
      resetDemoData,
    }),
    [
      hydrated,
      allEvents,
      session,
      revocationState,
      getEventById,
      login,
      quickDemoLogin,
      register,
      logout,
      logoutAll,
      createEvent,
      resetDemoData,
    ],
  );
  return (
    <QueuepassContext.Provider value={value}>
      {children}
    </QueuepassContext.Provider>
  );
}
export function useQueuepass(): QueuepassContextValue {
  const ctx = useContext(QueuepassContext);
  if (!ctx) {
    throw new Error("useQueuepass must be used within a QueuepassProvider");
  }
  return ctx;
}
