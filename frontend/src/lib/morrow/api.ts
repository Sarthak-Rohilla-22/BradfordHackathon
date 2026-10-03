/**
 * Customer and company data are simulated locally; uploaded photos are sent to the
 * backend vision endpoint for recognition.
 */
import { CREW, CUSTOMERS, DEFAULT_CATALOGUE, DEFAULT_HOME, DEFAULT_JOBS, DEFAULT_MEMORIES, DEFAULT_RULES, VEHICLES } from "./data";
import { computeAvailability, computeLogistics, computeQuote } from "./engine";
import type { CatalogueItem, HomeInfo, InventoryItem, Job, Memory, Move, Photo, PricingRules, Slot } from "./types";

interface DB { move: Move; jobs: Job[]; rules: PricingRules; catalogue: CatalogueItem[]; memories: Memory[]; nextRef: number }

const KEY = "morrow:v1";
const API_BASE_URL = import.meta.env["VITE_API_BASE_URL"] ?? "http://127.0.0.1:8000/api/v1";
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
    const loaded: DB = raw ? { ...freshDB(), ...JSON.parse(raw) } : freshDB();
    loaded.move.photos = loaded.move.photos.map((photo) => {
      const dataUrl = photo.dataUrl ?? (photo.url.startsWith("data:image/") ? photo.url : undefined);
      return { ...photo, url: dataUrl ?? photo.url, dataUrl };
    });
    if (loaded.move.photos.some((photo) => photo.status === "uploaded" && !photo.dataUrl)) {
      loaded.move.inventory = loaded.move.inventory.filter((item) => item.addedBy !== "ai");
      loaded.move.analysed = true;
    }
    db = loaded;
  } catch {
    db = freshDB();
  }
  return db!;
}
function save() {
  if (typeof window === "undefined" || !db) return;
  const persist = {
    ...db,
    move: {
      ...db.move,
      photos: db.move.photos.map(({ dataUrl, ...photo }) => ({
        ...photo,
        url: dataUrl ?? (photo.url.startsWith("blob:") ? "" : photo.url),
      })),
    },
  };
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

export const ANALYSIS_STAGES = ["Preparing your photos", "Recognising your items", "Ready for your review"] as const;

/** Sends uploaded photos to the configured backend vision model and builds a reviewable inventory. */
export async function analyseMove(onStage: (i: number) => void) {
  const d = load();
  const uploadedPhotos = d.move.photos.filter((p) => p.status === "uploaded");
  if (!uploadedPhotos.length) throw new Error("NO_PHOTOS");
  if (uploadedPhotos.some((photo) => !photo.dataUrl?.startsWith("data:image/"))) {
    throw new Error("PHOTO_DATA_MISSING");
  }
  onStage(1);
  const response = await fetch(`${API_BASE_URL}/enquiry/analyse-photos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      photos: uploadedPhotos.map((photo) => {
        const match = photo.dataUrl!.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/);
        if (!match?.[1] || !match[2]) throw new Error("UNSUPPORTED_PHOTO_FORMAT");
        return { mime_type: match[1], data: match[2] };
      }),
      catalogue_items: d.catalogue.map((item) => item.name),
    }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const detail = typeof body?.detail === "string" ? body.detail : "Photo recognition failed. Please try again.";
    throw new Error(detail);
  }
  const result: { items: { name: string; quantity: number; room: string; estimated_volume_m3: number; confidence: number }[] } = await response.json();
  onStage(2);
  const normalize = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  d.move.inventory = result.items.map((det) => {
    const normalizedName = normalize(det.name);
    const catalogueItem = d.catalogue.find((item) => normalize(item.name) === normalizedName);
    const review = det.confidence < 0.7 ? "Low-confidence photo match — please check this item and quantity." : undefined;
    return {
      id: uid(),
      catalogueId: catalogueItem?.id ?? "custom",
      name: catalogueItem?.name ?? det.name,
      room: det.room,
      qty: det.quantity,
      dims: catalogueItem && catalogueItem.category !== "Boxes" ? { ...catalogueItem.dims } : undefined,
      dimsSource: catalogueItem ? "estimated" : undefined,
      volumeM3: catalogueItem ? undefined : det.estimated_volume_m3,
      material: "Unknown",
      dismantle: false,
      special: catalogueItem?.special ?? false,
      notes: "",
      review,
      addedBy: "ai",
    } satisfies InventoryItem;
  });
  onStage(3);
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
  const slot = computeAvailability(d.jobs, lg.vehicleId).find((candidate) => candidate.id === m.slot?.id);
  if (!slot?.available) throw new Error("SLOT_UNAVAILABLE");
  const ref = `MYR-${d.nextRef++}`;
  const last = m.customerName.trim().split(" ").pop() || "New";
  const moveSnapshot = structuredClone(m);
  moveSnapshot.photos = moveSnapshot.photos.map(({ dataUrl, ...photo }) => ({
    ...photo,
    url: dataUrl ? "" : photo.url.startsWith("blob:") ? "" : photo.url,
  }));
  const job: Job = { id: `job-${ref.slice(4)}`, ref, customer: `${last} Residence`, customerId: "new", origin: m.origin, destination: m.destination, date: m.slot.date, start: m.slot.start, end: m.slot.end, crew: lg.crew, vehicle: lg.vehicle, vehicleId: `${lg.vehicleId}-01`, status: "Confirmed", quote: q.total, volume: lg.volume, hours: lg.hours, crewIds: [], move: moveSnapshot, logistics: lg, quoteDetail: q, createdAt: new Date().toISOString().slice(0, 10) };
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
