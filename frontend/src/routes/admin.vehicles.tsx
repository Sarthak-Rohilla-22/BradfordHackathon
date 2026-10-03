import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Truck } from "lucide-react";
import { AdminPage } from "@/components/morrow/admin-page";
import { Tag } from "@/components/morrow/ui";
import { Skeleton } from "@/components/ui/skeleton";
import { vehiclesQ } from "@/lib/morrow/queries";
import type { Vehicle } from "@/lib/morrow/types";

export const Route = createFileRoute("/admin/vehicles")({
  head: () => ({ meta: [{ title: "Vehicles — Morrow" }, { name: "description", content: "Fleet status and rates." }, { property: "og:title", content: "Vehicles — Morrow" }, { property: "og:description", content: "Fleet status and rates." }] }),
  component: Vehicles,
});

export function VehicleCard({ v }: { v: Vehicle }) {
  const tone = v.status === "Available" ? "sage" : v.status === "On job" ? "dark" : "amber";
  return (
    <article className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-start justify-between"><Truck className="size-5 text-taupe" strokeWidth={1.5} /><Tag tone={tone}>{v.status}</Tag></div>
      <h2 className="mt-4 font-semibold">{v.name}</h2>
      <p className="tabular text-xs text-muted-foreground">{v.reg}</p>
      <dl className="tabular mt-4 grid grid-cols-2 gap-3 text-sm">
        <div><dt className="text-xs text-muted-foreground">Capacity</dt><dd>{v.capacity} m³</dd></div>
        <div><dt className="text-xs text-muted-foreground">Rate</dt><dd>£{v.hourly}/hour</dd></div>
        <div><dt className="text-xs text-muted-foreground">Next booking</dt><dd>{v.nextBooking ?? "—"}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Maintenance</dt><dd>{v.maintenance}</dd></div>
      </dl>
    </article>
  );
}

function Vehicles() {
  const { data, isLoading } = useQuery(vehiclesQ);
  return (
    <AdminPage title="Vehicles" sub="Rates here are read from Pricing Rules.">
      {isLoading ? <Skeleton className="h-64" /> : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{data?.map((v) => <VehicleCard key={v.id} v={v} />)}</div>}
    </AdminPage>
  );
}
