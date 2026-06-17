export type Role = "master" | "comum";

export interface User {
  id: string | number;
  username: string;
  role: Role;
}

export interface Session {
  access_token: string;
  refresh_token: string;
  user: User;
}

const STORAGE_KEY = "p3d.session";

function isBrowser() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function setAuth(session: Session) {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearAuth() {
  if (!isBrowser()) return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export function getSession(): Session | null {
  if (!isBrowser()) return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export function getAccessToken(): string | null {
  return getSession()?.access_token ?? null;
}

export function getRefreshToken(): string | null {
  return getSession()?.refresh_token ?? null;
}

export function getUser(): User | null {
  return getSession()?.user ?? null;
}

export function isAuthenticated(): boolean {
  return Boolean(getAccessToken());
}

export function updateAccessToken(access_token: string) {
  const session = getSession();
  if (!session) return;
  setAuth({ ...session, access_token });
}
