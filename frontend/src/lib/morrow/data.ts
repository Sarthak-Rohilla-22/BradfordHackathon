import type { CatalogueItem, CrewMember, Customer, Job, Memory, PricingRules, Vehicle, HomeInfo } from "./types";

export function isoDay(offset = 0) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

export const CITIES = ["Leeds", "Bradford", "York", "Harrogate", "Huddersfield", "Halifax", "Wakefield", "Otley"];

/** Road miles including depot legs, keyed alphabetically. Default 30. */
export const DISTANCES: Record<string, number> = {
  "Bradford|Leeds": 35,
  "Leeds|York": 52,
  "Harrogate|Leeds": 38,
  "Huddersfield|Leeds": 44,
  "Halifax|Leeds": 42,
  "Bradford|Halifax": 28,
  "Harrogate|York": 41,
  "Bradford|Huddersfield": 30,
};

export const DEFAULT_RULES: PricingRules = {
  callout: 0,
  moverHourly: 30,
  additionalMoverHourly: 30,
  standardCrew: 2,
  vehicles: [
    { id: "swb", name: "Transit van", hourly: 45, capacity: 8 },
    { id: "luton", name: "Luton van", hourly: 60, capacity: 18 },
    { id: "truck", name: "7.5t truck", hourly: 85, capacity: 32 },
  ],
  mileage: 1.2,
  stairs: 20,
  difficultAccess: 20,
  dismantling: { standard: 35, large: 60, complex: 90 },
  specialHandling: 80,
  equipment: [
    { name: "Piano skid & straps", price: 45 },
    { name: "Stair climber", price: 35 },
    { name: "Mattress covers (each)", price: 6 },
  ],
};

export const DEFAULT_CATALOGUE: CatalogueItem[] = [
  c("sofa-3", "3-seat sofa", "Sofas", [195, 90, 85], [1.5, 2.0], [45, 90], 2, 2, "Standard", "Sometimes", 35, "", false, "Large furniture"),
  c("sofa-2", "2-seat sofa", "Sofas", [160, 88, 85], [1.1, 1.5], [35, 70], 2, 2, "Standard", "Never", null, "", false, "Large furniture"),
  c("armchair", "Armchair", "Chairs", [85, 85, 90], [0.6, 0.9], [20, 40], 1, 1, "Standard", "Never", null, "", false, "Furniture"),
  c("coffee-table", "Coffee table", "Tables", [110, 60, 45], [0.3, 0.5], [15, 35], 1, 1, "Standard", "Never", null, "", false, "Furniture"),
  c("dining-table", "Dining table", "Tables", [180, 90, 75], [1.0, 1.4], [40, 80], 2, 2, "Careful", "Sometimes", 60, "", false, "Large furniture"),
  c("dining-chair", "Dining chair", "Chairs", [45, 50, 95], [0.15, 0.25], [4, 8], 1, 1, "Standard", "Never", null, "", false, "Furniture"),
  c("tv", "Television", "Electronics", [125, 10, 75], [0.15, 0.25], [12, 25], 1, 1, "Careful", "Never", null, "TV box", false, "Electronics"),
  c("tv-cabinet", "TV cabinet", "Storage", [150, 40, 50], [0.4, 0.6], [25, 45], 1, 1, "Standard", "Never", null, "", false, "Furniture"),
  c("floor-lamp", "Floor lamp", "Other", [40, 40, 160], [0.15, 0.25], [3, 8], 1, 1, "Careful", "Never", null, "", false, "Furniture"),
  c("double-bed", "Double bed", "Beds", [190, 135, 40], [1.3, 1.7], [40, 70], 2, 2, "Standard", "Usually", 35, "", false, "Large furniture"),
  c("single-bed", "Single bed", "Beds", [190, 90, 40], [0.8, 1.1], [25, 45], 1, 1, "Standard", "Usually", 35, "", false, "Furniture"),
  c("wardrobe", "Wardrobe", "Wardrobes", [95, 58, 190], [1.3, 1.7], [50, 90], 2, 2, "Standard", "Sometimes", 35, "", false, "Large furniture"),
  c("bedside", "Bedside table", "Storage", [45, 40, 55], [0.15, 0.25], [6, 12], 1, 1, "Standard", "Never", null, "", false, "Furniture"),
  c("chest", "Chest of drawers", "Storage", [90, 45, 100], [0.5, 0.7], [30, 55], 2, 1, "Standard", "Never", null, "", false, "Furniture"),
  c("bookcase", "Bookcase", "Storage", [80, 30, 180], [0.4, 0.6], [25, 45], 1, 1, "Standard", "Sometimes", 35, "", false, "Furniture"),
  c("desk", "Desk", "Tables", [140, 70, 75], [0.6, 0.9], [25, 50], 2, 1, "Standard", "Sometimes", 35, "", false, "Furniture"),
  c("office-chair", "Office chair", "Chairs", [65, 65, 110], [0.3, 0.4], [10, 18], 1, 1, "Standard", "Never", null, "", false, "Furniture"),
  c("fridge", "Fridge freezer", "Appliances", [60, 65, 185], [0.7, 0.8], [60, 90], 2, 2, "Careful", "Never", null, "Sack truck", false, "Appliances"),
  c("washer", "Washing machine", "Appliances", [60, 60, 85], [0.3, 0.35], [60, 80], 2, 2, "Careful", "Never", null, "Transit bolts", false, "Appliances"),
  c("dishwasher", "Dishwasher", "Appliances", [60, 60, 85], [0.3, 0.35], [40, 55], 2, 1, "Careful", "Never", null, "", false, "Appliances"),
  c("dryer", "Tumble dryer", "Appliances", [60, 60, 85], [0.3, 0.35], [30, 45], 2, 1, "Standard", "Never", null, "", false, "Appliances"),
  c("computer", "Desktop computer", "Electronics", [45, 20, 45], [0.05, 0.1], [8, 15], 1, 1, "Careful", "Never", null, "", false, "Electronics"),
  c("monitor", "Monitor", "Electronics", [60, 20, 45], [0.05, 0.1], [4, 8], 1, 1, "Careful", "Never", null, "", false, "Electronics"),
  c("box-s", "Box — small", "Boxes", [40, 30, 30], [0.04, 0.04], [5, 12], 1, 1, "Standard", "Never", null, "", false, "Boxes"),
  c("box-m", "Box — medium", "Boxes", [45, 40, 40], [0.07, 0.07], [8, 18], 1, 1, "Standard", "Never", null, "", false, "Boxes"),
  c("box-l", "Box — large", "Boxes", [60, 45, 45], [0.12, 0.12], [10, 22], 1, 1, "Standard", "Never", null, "", false, "Boxes"),
  c("piano", "Upright piano", "Other", [150, 60, 125], [1.5, 2.0], [200, 300], 3, 3, "Specialist", "Manual assessment", null, "Piano skid & straps", true, "Specialist"),
  c("pool-table", "Pool table", "Other", [210, 115, 80], [2.0, 2.6], [150, 300], 4, 3, "Specialist", "Manual assessment", null, "", true, "Specialist"),
  c("marble-table", "Marble table", "Tables", [160, 90, 75], [0.9, 1.2], [90, 180], 3, 2, "Specialist", "Manual assessment", null, "", true, "Specialist"),
];

function c(
  id: string, name: string, category: string, d: [number, number, number], volume: [number, number], weight: [number, number],
  crew: number, minCrew: number, handling: CatalogueItem["handling"], dismantling: CatalogueItem["dismantling"],
  dismantlingCost: number | null, equipment: string, special: boolean, pricingCategory: string,
): CatalogueItem {
  return { id, name, category, dims: { l: d[0], w: d[1], h: d[2] }, volume, weight, crew, minCrew, handling, dismantling, dismantlingCost, equipment, special, pricingCategory, manualReview: special };
}

export const VEHICLES: Vehicle[] = [
  { id: "luton-01", name: "Luton Van 01", type: "luton", reg: "YK21 MRW", capacity: 18, status: "Available", hourly: 60, nextBooking: "14:00", maintenance: "MOT due 14 Jan" },
  { id: "luton-02", name: "Luton Van 02", type: "luton", reg: "YK72 OWE", capacity: 18, status: "On job", hourly: 60, nextBooking: "Tomorrow 09:00", maintenance: "Serviced 2 Sep" },
  { id: "truck-01", name: "7.5t Truck 01", type: "truck", reg: "YJ19 TRK", capacity: 32, status: "On job", hourly: 85, nextBooking: "11:30", maintenance: "Tyres checked 28 Sep" },
  { id: "swb-01", name: "Transit 01", type: "swb", reg: "YF70 VAN", capacity: 8, status: "Available", hourly: 45, maintenance: "Serviced 19 Aug" },
  { id: "luton-03", name: "Luton Van 03", type: "luton", reg: "YC68 LUT", capacity: 18, status: "Maintenance", hourly: 60, maintenance: "Brake pads — back Tue" },
];

export const CREW: CrewMember[] = [
  { id: "c1", name: "Oliver Hart", role: "Senior mover", status: "Assigned", assignment: "MYR-1041", skills: ["Team lead", "Piano", "Dismantling"], phone: "07700 900112" },
  { id: "c2", name: "James Cole", role: "Mover", status: "Available", skills: ["Dismantling"], phone: "07700 900245" },
  { id: "c3", name: "Priya Shah", role: "Driver / mover", status: "Assigned", assignment: "MYR-1042", skills: ["7.5t licence", "Packing"], phone: "07700 900318" },
  { id: "c4", name: "Tom Barker", role: "Mover", status: "Assigned", assignment: "MYR-1041", skills: ["Heavy lift"], phone: "07700 900407" },
  { id: "c5", name: "Ellie Ward", role: "Packer", status: "Available", skills: ["Packing", "Fragile items"], phone: "07700 900566" },
  { id: "c6", name: "Sam Okafor", role: "Driver / mover", status: "Assigned", assignment: "MYR-1042", skills: ["7.5t licence", "Dismantling"], phone: "07700 900671" },
  { id: "c7", name: "Ben Lister", role: "Mover", status: "Off", skills: [], phone: "07700 900733" },
  { id: "c8", name: "Grace Fenwick", role: "Senior mover", status: "Available", skills: ["Team lead", "Antiques"], phone: "07700 900884" },
];

export const CUSTOMERS: Customer[] = [
  { id: "u1", name: "Hannah Smith", email: "hannah.smith@outlook.com", phone: "07700 901001", previousMoves: 1, activeBooking: "MYR-1041", area: "Headingley, Leeds" },
  { id: "u2", name: "Mark Johnson", email: "m.johnson@gmail.com", phone: "07700 901002", previousMoves: 0, activeBooking: "MYR-1042", area: "Clifton, York" },
  { id: "u3", name: "Aisha Rahman", email: "aisha.r@icloud.com", phone: "07700 901003", previousMoves: 2, activeBooking: "MYR-1043", area: "Saltaire, Bradford" },
  { id: "u4", name: "David Pearson", email: "dpearson@btinternet.com", phone: "07700 901004", previousMoves: 0, activeBooking: "MYR-1044", area: "Harrogate" },
  { id: "u5", name: "Chloe Bennett", email: "chloe.bennett@gmail.com", phone: "07700 901005", previousMoves: 1, activeBooking: "MYR-1045", area: "Lindley, Huddersfield" },
  { id: "u6", name: "Robert Kaur", email: "r.kaur@yahoo.co.uk", phone: "07700 901006", previousMoves: 0, activeBooking: "MYR-1046", area: "Halifax" },
  { id: "u7", name: "Emma Walsh", email: "emma.walsh@outlook.com", phone: "07700 901007", previousMoves: 3, area: "Chapel Allerton, Leeds" },
  { id: "u8", name: "George Hill", email: "ghill@gmail.com", phone: "07700 901008", previousMoves: 1, activeBooking: "MYR-1047", area: "Otley" },
];

function j(n: number, cu: string, cid: string, o: string, d: string, off: number, s: string, e: string, crew: number, vehicle: string, vid: string, status: Job["status"], quote: number, vol: number, hours: number, crewIds: string[]): Job {
  return { id: `job-${n}`, ref: `MYR-${n}`, customer: cu, customerId: cid, origin: o, destination: d, date: isoDay(off), start: s, end: e, crew, vehicle, vehicleId: vid, status, quote, volume: vol, hours, crewIds, createdAt: isoDay(off - 6) };
}

export const DEFAULT_JOBS: Job[] = [
  j(1041, "Smith Residence", "u1", "Leeds", "Bradford", 0, "09:00", "14:00", 2, "Luton van", "luton-02", "Confirmed", 690, 10.2, 5, ["c1", "c4"]),
  j(1042, "Johnson Residence", "u2", "York", "Leeds", 0, "11:30", "17:30", 3, "7.5t truck", "truck-01", "In progress", 1140, 22.5, 6, ["c3", "c6", "c2"]),
  j(1043, "Rahman Residence", "u3", "Bradford", "Halifax", 0, "13:00", "17:00", 2, "Luton van", "luton-01", "Confirmed", 512, 8.4, 4, ["c8", "c5"]),
  j(1044, "Pearson Residence", "u4", "Harrogate", "York", 0, "14:00", "18:00", 2, "Luton van", "luton-01", "Needs review", 0, 12.8, 4, []),
  j(1045, "Bennett Residence", "u5", "Huddersfield", "Leeds", 1, "09:00", "15:00", 3, "Luton van", "luton-02", "Confirmed", 884, 14.1, 6, ["c1", "c2", "c4"]),
  j(1046, "Kaur Residence", "u6", "Halifax", "Bradford", 2, "10:00", "14:00", 2, "Transit van", "swb-01", "Quote ready", 365, 6.2, 4, []),
  j(1047, "Hill Residence", "u8", "Otley", "Harrogate", 3, "12:00", "17:00", 2, "Luton van", "luton-01", "Estimating", 0, 9.8, 5, []),
  j(1038, "Walsh Residence", "u7", "Leeds", "Wakefield", -2, "09:00", "13:00", 2, "Luton van", "luton-02", "Completed", 548, 7.9, 4, ["c1", "c2"]),
  j(1039, "Ahmed Residence", "u3", "Bradford", "Leeds", -1, "10:00", "15:00", 3, "Luton van", "luton-01", "Completed", 812, 13.2, 5, ["c8", "c4", "c6"]),
  j(1040, "Turner Residence", "u7", "York", "Harrogate", 4, "09:00", "13:00", 2, "Transit van", "swb-01", "Cancelled", 410, 5.1, 4, []),
  j(1037, "Moss Residence", "u5", "Leeds", "Otley", 5, "10:00", "15:00", 2, "Luton van", "luton-02", "New", 0, 0, 0, []),
];

export const DEFAULT_MEMORIES: Memory[] = [
  { id: "m1", kind: "Address", title: "12 Green Lane, Headingley", body: "Previous move: parking was difficult between 08:30–09:00 (school run).", action: "Add 20-minute access buffer.", source: "MYR-0982 · crew note", date: "2026-06-14" },
  { id: "m2", kind: "AI correction", title: "Extending dining tables", body: "Dining table initially classified as standard. Operator corrected: large / 2-person lift.", action: "Saved for similar future jobs.", source: "MYR-1019 · Grace Fenwick", date: "2026-08-02" },
  { id: "m3", kind: "Address", title: "Riverside Court, York", body: "Lift is 1.1 m deep — too short for sofas over 200 cm upright.", action: "Plan stairs for large sofas.", source: "MYR-1003 · crew note", date: "2026-07-21" },
  { id: "m4", kind: "Operational", title: "Saturday jobs in Harrogate centre", body: "Loading bays on James Street are restricted until 10:00 on Saturdays.", action: "Prefer slots starting 10:00 or later.", source: "Ops review", date: "2026-09-05" },
  { id: "m5", kind: "Customer", title: "Aisha Rahman", body: "Third move with us. Prefers early starts; has a cat that must be kept in the kitchen.", source: "MYR-1039 · Oliver Hart", date: "2026-10-02" },
  { id: "m6", kind: "AI correction", title: "Wardrobes in Victorian terraces", body: "Fitted wardrobes in older terraces were twice detected as freestanding.", action: "Ask customer to confirm freestanding vs fitted.", source: "MYR-1027 · ops", date: "2026-08-29" },
];

export const DEFAULT_HOME: HomeInfo = { propertyType: "", floor: "", lift: "", stairs: "", parking: "", doorways: [] };

/** What the image model returns for the demo photos. */
export const DEMO_DETECTIONS: { catalogueId: string; room: string; qty: number; review?: string; material?: string }[] = [
  { catalogueId: "sofa-3", room: "Living room", qty: 1 },
  { catalogueId: "coffee-table", room: "Living room", qty: 1, material: "Wood" },
  { catalogueId: "tv", room: "Living room", qty: 1 },
  { catalogueId: "tv-cabinet", room: "Living room", qty: 1 },
  { catalogueId: "floor-lamp", room: "Living room", qty: 2 },
  { catalogueId: "box-m", room: "Living room", qty: 12 },
  { catalogueId: "dining-table", room: "Dining room", qty: 1, review: "Please confirm size — it may extend.", material: "Wood" },
  { catalogueId: "dining-chair", room: "Dining room", qty: 6 },
  { catalogueId: "double-bed", room: "Bedroom", qty: 1 },
  { catalogueId: "wardrobe", room: "Bedroom", qty: 1, review: "Freestanding or fitted? Only freestanding units move." },
  { catalogueId: "bedside", room: "Bedroom", qty: 2 },
];
