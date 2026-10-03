/**
 * Frontend-only session store. Swap signIn/signUp bodies for the real auth provider later.
 */
import { useSyncExternalStore } from "react";

export type Role = "customer" | "company";
export interface Session { name: string; email: string; role: Role }

const KEY = "morrow:session";
const subs = new Set<() => void>();
let cache: Session | null | undefined;

function read(): Session | null {
  if (typeof window === "undefined") return null;
  if (cache === undefined) {
    try { cache = JSON.parse(localStorage.getItem(KEY) ?? "null"); } catch { cache = null; }
  }
  return cache ?? null;
}
function write(s: Session | null) {
  cache = s;
  if (s) localStorage.setItem(KEY, JSON.stringify(s)); else localStorage.removeItem(KEY);
  subs.forEach((f) => f());
}

export function useSession() {
  return useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f); }, read, () => null);
}
export function useHydratedSession(): { session: Session | null; ready: boolean } {
  const session = useSession();
  const ready = useSyncExternalStore(() => () => {}, () => true, () => false);
  return { session, ready };
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function signIn(email: string, password: string, role: Role) {
  await wait(700);
  if (password.length < 8) throw new Error("That email and password don't match.");
  const name = (email.split("@")[0] ?? "").replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  write({ name, email, role });
}
export async function signUp(name: string, email: string, _password: string, role: Role) {
  await wait(800);
  write({ name, email, role });
}
export async function signInWithGoogle(role: Role) {
  await wait(600);
  write({ name: role === "company" ? "Sarah Ellis" : "Hannah Smith", email: role === "company" ? "sarah@airevalley.co.uk" : "hannah.smith@gmail.com", role });
}
export async function requestReset(_email: string) { await wait(700); }
export function signOut() { write(null); }
