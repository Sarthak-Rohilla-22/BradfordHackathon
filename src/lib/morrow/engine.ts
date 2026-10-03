/**
 * Deterministic logistics + pricing engines.
 * In production these run on the backend; the UI only renders their output.
 */
import type { AccessIssue, CatalogueItem, Doorway, Job, Logistics, Move, PricingRules, Quote, Slot } from "./types";
import { DISTANCES } from "./data";

const SIZE_PRESETS = { small: { w: 70, h: 195 }, standard: { w: 76, h: 198 }, wide: { w: 90, h: 200 } };

export function doorOpening(d: Doorway): { w: number; h: number } | null {
  if (d.mode === "unsure") return null;
  if (d.mode === "size") return d.size ? SIZE_PRESETS[d.size] : null;
  if (!d.width || !d.height) return null;
  return { w: d.width, h: d.height };
}

export function findAccessIssues(move: Move): { issues: AccessIssue[]; unknown: boolean } {
  const openings = move.home.doorways.map((d) => ({ d, o: doorOpening(d) }));
  const known = openings.filter((x) => x.o) as { d: Doorway; o: { w: number; h: number } }[];
  const unknown = move.home.doorways.length === 0 || openings.some((x) => !x.o);
  const issues: AccessIssue[] = [];
  for (const item of move.inventory) {
    if (!item.dims) continue;
    const [a = 0, b = 0] = [item.dims.l, item.dims.w, item.dims.h].sort((x, y) => y - x);
    for (const { d, o } of known) {
      if (a > o.h && b > o.w) {
        issues.push({ itemId: item.id, itemName: item.name, dims: item.dims, doorway: d.label, doorDims: o });
        break;
      }
    }
  }
  return { issues, unknown };
}

export function computeLogistics(move: Move, catalogue: CatalogueItem[], rules: PricingRules): Logistics {
  const byId = new Map(catalogue.map((c) => [c.id, c]));
  let volume = 0;
  let maxCrew = rules.standardCrew;
  const special: string[] = [];
  let dismantle = 0;
  for (const it of move.inventory) {
    const cat = byId.get(it.catalogueId);
    const unit = cat ? (cat.volume[0] + cat.volume[1]) / 2 : 0.5;
    volume += unit * it.qty;
    if (cat) maxCrew = Math.max(maxCrew, cat.minCrew);
    if (it.special || cat?.special) special.push(it.name);
    if (it.dismantle) dismantle += 1;
  }
  volume = Math.round(volume * 10) / 10;
  const { issues, unknown } = findAccessIssues(move);
  for (const iss of issues) {
    const it = move.inventory.find((i) => i.id === iss.itemId);
    if (it && !it.dismantle) dismantle += 1;
  }
  const vehicle = [...rules.vehicles].sort((a, b) => a.capacity - b.capacity).find((v) => v.capacity >= volume) ?? rules.vehicles[rules.vehicles.length - 1]!;
  let crew = maxCrew;
  let crewReason: string | undefined;
  const tough = move.home.stairs === "External stairs" || ["2", "3+"].includes(move.home.floor) && move.home.lift !== "Yes";
  if (issues.length || tough || volume > 16) {
    crew = Math.max(crew, rules.standardCrew + 1);
    crewReason = issues.length ? "Large furniture + restricted access" : tough ? "Stairs without a lift" : "Large volume";
  }
  if (special.length) crewReason = crewReason ?? "Specialist items";
  const hours = Math.max(3, Math.ceil(volume / 2.4));
  return { volume, vehicle: vehicle.name, vehicleId: vehicle.id, crew, standardCrew: rules.standardCrew, crewReason, hours, dismantleItems: dismantle, specialItems: special, accessIssues: issues, accessUnknown: unknown };
}

export function miles(o: string, d: string) {
  const k = [o, d].sort().join("|");
  return DISTANCES[k] ?? 30;
}

export function computeQuote(move: Move, lg: Logistics, rules: PricingRules): Quote {
  const v = rules.vehicles.find((x) => x.id === lg.vehicleId)!;
  const lines: Quote["lines"] = [];
  if (rules.callout) lines.push({ label: "Base call-out", detail: "Fixed", amount: rules.callout });
  lines.push({ label: "Vehicle", detail: `${v.name} · ${lg.hours} hours × £${v.hourly}`, amount: lg.hours * v.hourly });
  lines.push({ label: "Labour", detail: `${lg.standardCrew} movers × ${lg.hours} hours × £${rules.moverHourly}`, amount: lg.standardCrew * lg.hours * rules.moverHourly });
  const extra = lg.crew - lg.standardCrew;
  if (extra > 0) lines.push({ label: "Additional mover", detail: `${extra} × ${lg.hours} hours × £${rules.additionalMoverHourly}`, amount: extra * lg.hours * rules.additionalMoverHourly });
  const m = miles(move.origin, move.destination);
  lines.push({ label: "Travel", detail: `${m} miles × £${rules.mileage.toFixed(2)}`, amount: Math.round(m * rules.mileage) });
  const stairs = move.home.stairs && move.home.stairs !== "None";
  const parking = ["Limited access", "Permit required"].includes(move.home.parking);
  if (stairs || parking) {
    const amt = (stairs ? rules.stairs : 0) + (parking ? rules.difficultAccess : 0);
    lines.push({ label: "Access", detail: [stairs && move.home.stairs, parking && move.home.parking].filter(Boolean).join(" · "), amount: amt });
  }
  if (lg.dismantleItems) lines.push({ label: "Dismantling", detail: `${lg.dismantleItems} large item${lg.dismantleItems > 1 ? "s" : ""}`, amount: lg.dismantleItems * rules.dismantling.large });
  const manual = lg.specialItems;
  return { lines, total: lines.reduce((s, l) => s + l.amount, 0), manual };
}

const SLOT_TIMES = [["09:00", "14:00"], ["10:00", "15:00"], ["12:00", "17:00"], ["14:00", "19:00"]];

export function computeAvailability(jobs: Job[], vehicleId: string, days = 10): Slot[] {
  const out: Slot[] = [];
  const base = new Date();
  base.setHours(12, 0, 0, 0);
  for (let i = 1; i <= days; i++) {
    const d = new Date(base);
    d.setDate(d.getDate() + i);
    if (d.getDay() === 0) continue; // no Sunday moves
    const date = d.toISOString().slice(0, 10);
    const sameType = jobs.filter((j) => j.date === date && j.status !== "Cancelled" && j.vehicleId.split("-")[0] === vehicleId);
    SLOT_TIMES.forEach(([s = "", e = ""], idx) => {
      const clash = sameType.some((j) => j.start < e && s < j.end);
      const busy = (i * 7 + idx * 3) % 5 === 0; // crew rota
      out.push({ id: `${date}-${s}`, date, start: s, end: e, available: !clash && !busy });
    });
  }
  return out;
}
