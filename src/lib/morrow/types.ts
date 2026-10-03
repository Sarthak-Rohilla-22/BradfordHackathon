export type DimSource = "estimated" | "confirmed";
export interface Dims { l: number; w: number; h: number }

export interface Photo { id: string; url: string; name: string; room?: string | undefined; status: "uploading" | "uploaded" | "failed"; error?: string | undefined }

export interface InventoryItem {
  id: string;
  catalogueId: string;
  name: string;
  room: string;
  qty: number;
  dims?: Dims | undefined;
  dimsSource?: DimSource | undefined;
  material: string;
  dismantle: boolean;
  special: boolean;
  notes: string;
  review?: string | undefined; // reason the item needs a look
  addedBy: "ai" | "customer";
}

export interface Doorway { id: string; label: string; mode: "exact" | "approx" | "size" | "unsure"; width?: number | undefined; height?: number | undefined; size?: "small" | "standard" | "wide" }

export interface HomeInfo {
  propertyType: string;
  floor: string;
  lift: string;
  stairs: string;
  parking: string;
  doorways: Doorway[];
}

export interface AccessIssue { itemId: string; itemName: string; dims: Dims; doorway: string; doorDims: { w: number; h: number } }

export interface Logistics {
  volume: number;
  vehicle: string;
  vehicleId: string;
  crew: number;
  standardCrew: number;
  crewReason?: string | undefined;
  hours: number;
  dismantleItems: number;
  specialItems: string[];
  accessIssues: AccessIssue[];
  accessUnknown: boolean;
}

export interface Slot { id: string; date: string; start: string; end: string; available: boolean }

export interface QuoteLine { label: string; detail: string; amount: number }
export interface Quote { lines: QuoteLine[]; total: number; manual: string[] }

export interface Move {
  id: string;
  origin: string;
  destination: string;
  customerName: string;
  email: string;
  phone: string;
  photos: Photo[];
  analysed: boolean;
  inventory: InventoryItem[];
  inventoryConfirmed: boolean;
  home: HomeInfo;
  slot?: Slot | undefined;
  bookingRef?: string | undefined;
}

export type JobStatus = "New" | "Needs review" | "Estimating" | "Quote ready" | "Confirmed" | "In progress" | "Completed" | "Cancelled";

export interface Job {
  id: string;
  ref: string;
  customer: string;
  customerId: string;
  origin: string;
  destination: string;
  date: string; // ISO date
  start: string;
  end: string;
  crew: number;
  vehicle: string;
  vehicleId: string;
  status: JobStatus;
  quote: number;
  volume: number;
  hours: number;
  crewIds: string[];
  move?: Move | undefined;
  logistics?: Logistics | undefined;
  quoteDetail?: Quote | undefined;
  createdAt: string;
}

export interface CatalogueItem {
  id: string;
  name: string;
  category: string;
  dims: Dims;
  volume: [number, number];
  weight: [number, number];
  crew: number;
  minCrew: number;
  handling: "Standard" | "Careful" | "Specialist";
  dismantling: "Never" | "Sometimes" | "Usually" | "Manual assessment";
  dismantlingCost: number | null;
  equipment: string;
  special: boolean;
  pricingCategory: string;
  manualReview: boolean;
}

export interface PricingRules {
  callout: number;
  moverHourly: number;
  additionalMoverHourly: number;
  standardCrew: number;
  vehicles: { id: string; name: string; hourly: number; capacity: number }[];
  mileage: number;
  stairs: number;
  difficultAccess: number;
  dismantling: { standard: number; large: number; complex: number };
  specialHandling: number;
  equipment: { name: string; price: number }[];
}

export interface Vehicle { id: string; name: string; type: string; capacity: number; status: "Available" | "On job" | "Maintenance"; hourly: number; nextBooking?: string | undefined; maintenance: string; reg: string }
export interface CrewMember { id: string; name: string; role: string; status: "Available" | "Assigned" | "Off"; assignment?: string | undefined; skills: string[]; phone: string }
export interface Customer { id: string; name: string; email: string; phone: string; previousMoves: number; activeBooking?: string | undefined; area: string }
export interface Memory { id: string; kind: "Address" | "AI correction" | "Customer" | "Operational"; title: string; body: string; action?: string | undefined; source: string; date: string }
