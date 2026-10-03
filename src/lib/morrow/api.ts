/**
 * Morrow API client. Every screen talks to the backend through these functions only.
 * This build ships a local backend simulation (persisted in the browser) so the full
 * demo works offline; swap the bodies for fetch() calls to the real service.
 */
import { CREW, CUSTOMERS, DEFAULT_CATALOGUE, DEFAULT_HOME, DEFAULT_JOBS, DEFAULT_MEMORIES, DEFAULT_RULES, DEMO_DETECTIONS, VEHICLES } from "./data";
import { computeAvailability, computeLogistics, computeQuote } from "./engine";
import type { CatalogueItem, HomeInfo, InventoryItem, Job, Memory, Move, Photo, PricingRules, Slot } from "./types";

interface DB { move: Move; jobs: Job[]; rules: PricingRules; catalogue: CatalogueItem[]; memories: Memory[]; nextRef: number }

const KEY = "morrow:v1";
const uid = () => Math.random().toString(36).slice(2, 10);

function freshMove(): Move {
  return { id: uid(), origin: "Leeds", destination: "Bradford", customerName: "", email: "", phone: "", photos: [], analysed: false, inventory: [], inventoryConfirmed: false, home: structuredClone(DEFAULT_HOME) };
}
function freshDB(): DB {
  return { move: freshMove(), jobs: structuredClone(DEFAULT_JOBS), rules: structuredClone(DEFAULT_RULES), catalogue: structuredClone(DEFAULT_CATALOGUE), memories: structuredClone(DEFAULT_MEMORIES), nextRef: 1048 };
}

let db: DB | null = null;
function load(): DB {
  if (db) return db;
  if (typeof window === "undefined") return freshDB();
  try {
    const raw = localStorage.getItem(KEY);
    db = raw ? { ...freshDB(), ...JSON.parse(raw) } : freshDB();
  } catch {
    db = freshDB();
  }
  return db!;
}
function save() {
  if (typeof window === "undefined" || !db) return;
  const persist = { ...db, move: { ...db.move, photos: db.move.photos.filter((p) => !p.url.startsWith("blob:")) } };
  localStorage.setItem(KEY, JSON.stringify(persist));
}
const net = <T,>(v: T, ms = 180) => new Promise<T>((r) => setTimeout(() => r(structuredClone(v)), ms));

// ---------- Customer move ----------
export async function getMove() { return net(load().move, 60); }
export async function createMove() { const d = load(); d.move = freshMove(); save(); return net(d.move); }
export async function updateMove(patch: Partial<Pick<Move, "origin" | "destination" | "customerName" | "email" | "phone">>) {
  const d = load(); Object.assign(d.move, patch); save(); return net(d.move, 60);
}

const MAX_MB = 15;
const OK_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
export function validatePhoto(f: File): string | null {
  if (!OK_TYPES.includes(f.type) && !/\.(heic|heif)$/i.test(f.name)) return "This file type isn't supported. Use JPG, PNG, WebP or HEIC.";
  if (f.size > MAX_MB * 1024 * 1024) return `This photo is over ${MAX_MB} MB. Try a smaller version.`;
  return null;
}
export async function uploadPhotos(photos: Photo[]) {
  const d = load();
  for (const p of photos) {
    const i = d.move.photos.findIndex((x) => x.id === p.id);
    if (i >= 0) d.move.photos[i] = p; else d.move.photos.push(p);
  }
  save(); return net(d.move.photos, 60);
}
export async function removePhoto(id: string) { const d = load(); d.move.photos = d.move.photos.filter((p) => p.id !== id); save(); return net(d.move.photos, 40); }

export const ANALYSIS_STAGES = ["Reading your photos", "Identifying furniture", "Grouping items by room", "Preparing your inventory"] as const;

/** Runs the image-understanding pipeline. Calls onStage as each backend stage completes. */
export async function analyseMove(onStage: (i: number) => void) {
  const d = load();
  if (!d.move.photos.some((p) => p.status === "uploaded")) throw new Error("NO_PHOTOS");
  const cat = new Map(d.catalogue.map((c) => [c.id, c]));
  for (let i = 0; i < ANALYSIS_STAGES.length; i++) {
    await new Promise((r) => setTimeout(r, 900 + i * 250));
    onStage(i + 1);
  }
  d.move.inventory = DEMO_DETECTIONS.map((det) => {
    const c = cat.get(det.catalogueId)!;
    return { id: uid(), catalogueId: c.id, name: c.name, room: det.room, qty: det.qty, dims: c.category === "Boxes" ? undefined : { ...c.dims }, dimsSource: "estimated", material: det.material ?? "Unknown", dismantle: false, special: c.special, notes: "", review: det.review, addedBy: "ai" } satisfies InventoryItem;
  });
  d.move.analysed = true;
  d.move.inventoryConfirmed = false;
  save();
  return net(d.move.inventory, 50);
}

export async function getInventory() { return net(load().move.inventory, 80); }
export async function updateInventory(item: InventoryItem) {
  const d = load(); const i = d.move.inventory.findIndex((x) => x.id === item.id);
  if (i >= 0) d.move.inventory[i] = item; d.move.inventoryConfirmed = false; save(); return net(item, 60);
}
export async function deleteInventoryItem(id: string) { const d = load(); d.move.inventory = d.move.inventory.filter((x) => x.id !== id); save(); return net(true, 40); }
export async function addInventoryItem(catalogueId: string | null, room: string, customName?: string) {
  const d = load();
  const c = catalogueId ? d.catalogue.find((x) => x.id === catalogueId) : undefined;
  const item: InventoryItem = { id: uid(), catalogueId: c?.id ?? "custom", name: c?.name ?? customName ?? "Item", room, qty: 1, dims: c && c.category !== "Boxes" ? { ...c.dims } : undefined, dimsSource: c ? "estimated" : undefined, material: "Unknown", dismantle: false, special: c?.special ?? false, notes: "", review: c ? undefined : "We'll check this item's size and handling.", addedBy: "customer" };
  d.move.inventory.push(item); save(); return net(item, 80);
}
export async function confirmInventory() { const d = load(); d.move.inventoryConfirmed = true; save(); return net(true, 120); }

export async function updateHome(home: HomeInfo) { const d = load(); d.move.home = home; save(); return net(home, 80); }

export async function getCatalogue() { return net(load().catalogue, 80); }
export async function getLogistics() { const d = load(); return net(computeLogistics(d.move, d.catalogue, d.rules), 260); }
export async function getAvailability(): Promise<Slot[]> {
  const d = load(); const lg = computeLogistics(d.move, d.catalogue, d.rules);
  return net(computeAvailability(d.jobs, lg.vehicleId), 260);
}
export async function selectSlot(slot: Slot) { const d = load(); d.move.slot = slot; save(); return net(slot, 40); }
export async function getQuote() {
  const d = load(); const lg = computeLogistics(d.move, d.catalogue, d.rules);
  return net({ logistics: lg, quote: computeQuote(d.move, lg, d.rules), move: d.move }, 300);
}
export async function createBooking() {
  const d = load(); const m = d.move;
  if (!m.slot) throw new Error("NO_SLOT");
  const lg = computeLogistics(m, d.catalogue, d.rules); const q = computeQuote(m, lg, d.rules);
  const ref = `MYR-${d.nextRef++}`;
  const last = m.customerName.trim().split(" ").pop() || "New";
  const job: Job = { id: `job-${ref.slice(4)}`, ref, customer: `${last} Residence`, customerId: "new", origin: m.origin, destination: m.destination, date: m.slot.date, start: m.slot.start, end: m.slot.end, crew: lg.crew, vehicle: lg.vehicle, vehicleId: `${lg.vehicleId}-01`, status: "Confirmed", quote: q.total, volume: lg.volume, hours: lg.hours, crewIds: [], move: structuredClone(m), logistics: lg, quoteDetail: q, createdAt: new Date().toISOString().slice(0, 10) };
  d.jobs.unshift(job);
  m.bookingRef = ref;
  save();
  return net(job, 400);
}

// ---------- Company ----------
export async function getJobs() { return net(load().jobs, 160); }
export async function getJob(id: string) { const j = load().jobs.find((x) => x.id === id || x.ref === id); if (!j) throw new Error("NOT_FOUND"); return net(j, 120); }
export async function updateJobStatus(id: string, status: Job["status"]) { const d = load(); const j = d.jobs.find((x) => x.id === id); if (j) j.status = status; save(); return net(j, 80); }
export async function overrideJobItem(jobId: string, item: InventoryItem, note: string) {
  const d = load(); const j = d.jobs.find((x) => x.id === jobId);
  if (j?.move) {
    const i = j.move.inventory.findIndex((x) => x.id === item.id);
    if (i >= 0) j.move.inventory[i] = { ...item, review: undefined };
    if (note) d.memories.unshift({ id: uid(), kind: "AI correction", title: item.name, body: note, action: "Saved for similar future jobs.", source: `${j.ref} · operator`, date: new Date().toISOString().slice(0, 10) });
  }
  save(); return net(j, 80);
}
export async function getCustomers() { return net(CUSTOMERS, 140); }
export async function getVehicles() { return net(VEHICLES, 140); }
export async function getCrew() { return net(CREW, 140); }
export async function getMemories() { return net(load().memories, 140); }
export async function getPricingRules() { return net(load().rules, 120); }
export async function updatePricingRules(r: PricingRules) { const d = load(); d.rules = r; save(); return net(r, 200); }
export async function saveCatalogueItem(item: CatalogueItem) {
  const d = load(); const i = d.catalogue.findIndex((x) => x.id === item.id);
  if (i >= 0) d.catalogue[i] = item; else d.catalogue.push(item); save(); return net(item, 120);
}
export async function deleteCatalogueItem(id: string) { const d = load(); d.catalogue = d.catalogue.filter((x) => x.id !== id); save(); return net(true, 80); }
export async function resetDemo() { db = freshDB(); save(); return net(true, 50); }
export { uid };
