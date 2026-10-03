import { queryOptions } from "@tanstack/react-query";
import * as api from "./api";

export const qk = {
  move: ["move"] as const,
  inventory: ["inventory"] as const,
  catalogue: ["catalogue"] as const,
  logistics: ["logistics"] as const,
  availability: ["availability"] as const,
  quote: ["quote"] as const,
  jobs: ["jobs"] as const,
  job: (id: string) => ["job", id] as const,
  customers: ["customers"] as const,
  vehicles: ["vehicles"] as const,
  crew: ["crew"] as const,
  memories: ["memories"] as const,
  rules: ["rules"] as const,
};

export const moveQ = queryOptions({ queryKey: qk.move, queryFn: api.getMove });
export const inventoryQ = queryOptions({ queryKey: qk.inventory, queryFn: api.getInventory });
export const catalogueQ = queryOptions({ queryKey: qk.catalogue, queryFn: api.getCatalogue });
export const logisticsQ = queryOptions({ queryKey: qk.logistics, queryFn: api.getLogistics, staleTime: 0 });
export const availabilityQ = queryOptions({ queryKey: qk.availability, queryFn: api.getAvailability, staleTime: 0 });
export const quoteQ = queryOptions({ queryKey: qk.quote, queryFn: api.getQuote, staleTime: 0 });
export const jobsQ = queryOptions({ queryKey: qk.jobs, queryFn: api.getJobs, staleTime: 0 });
export const jobQ = (id: string) => queryOptions({ queryKey: qk.job(id), queryFn: () => api.getJob(id), staleTime: 0 });
export const customersQ = queryOptions({ queryKey: qk.customers, queryFn: api.getCustomers });
export const vehiclesQ = queryOptions({ queryKey: qk.vehicles, queryFn: api.getVehicles });
export const crewQ = queryOptions({ queryKey: qk.crew, queryFn: api.getCrew });
export const memoriesQ = queryOptions({ queryKey: qk.memories, queryFn: api.getMemories, staleTime: 0 });
export const rulesQ = queryOptions({ queryKey: qk.rules, queryFn: api.getPricingRules });
