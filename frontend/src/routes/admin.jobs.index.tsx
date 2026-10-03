import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ArrowUpDown, Search } from "lucide-react";
import { AdminPage } from "@/components/morrow/admin-page";
import { EmptyState, StatusBadge, gbp, ukDate } from "@/components/morrow/ui";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { jobsQ } from "@/lib/morrow/queries";
import type { Job, JobStatus } from "@/lib/morrow/types";

export const Route = createFileRoute("/admin/jobs/")({
  head: () => ({ meta: [{ title: "Jobs — Morrow" }, { name: "description", content: "All removals jobs." }, { property: "og:title", content: "Jobs — Morrow" }, { property: "og:description", content: "All removals jobs." }] }),
  component: Jobs,
});

const STATUSES: JobStatus[] = ["New", "Needs review", "Estimating", "Quote ready", "Confirmed", "In progress", "Completed", "Cancelled"];
type SortKey = "date" | "customer" | "quote";

function Jobs() {
  const nav = useNavigate();
  const { data, isLoading } = useQuery(jobsQ);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [vehicle, setVehicle] = useState("all");
  const [when, setWhen] = useState("all");
  const [sort, setSort] = useState<{ k: SortKey; dir: 1 | -1 }>({ k: "date", dir: 1 });

  const rows = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return (data ?? [])
      .filter((j) => !q || `${j.customer} ${j.ref} ${j.origin} ${j.destination}`.toLowerCase().includes(q.toLowerCase()))
      .filter((j) => status === "all" || j.status === status)
      .filter((j) => vehicle === "all" || j.vehicle === vehicle)
      .filter((j) => when === "all" || (when === "upcoming" ? j.date >= today : j.date < today))
      .sort((a, b) => (sort.k === "quote" ? a.quote - b.quote : sort.k === "customer" ? a.customer.localeCompare(b.customer) : (a.date + a.start).localeCompare(b.date + b.start)) * sort.dir);
  }, [data, q, status, vehicle, when, sort]);
  const vehicles = [...new Set((data ?? []).map((j) => j.vehicle))];
  const th = (k: SortKey, l: string) => (
    <button className="inline-flex items-center gap-1" onClick={() => setSort((s) => ({ k, dir: s.k === k ? (s.dir === 1 ? -1 : 1) : 1 }))}>{l}<ArrowUpDown className="size-3 opacity-50" /></button>
  );

  return (
    <AdminPage title="Jobs" sub={`${data?.length ?? "—"} jobs`}>
      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative min-w-60 flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search customer, reference or town" className="h-9 bg-card pl-9" aria-label="Search jobs" />
        </div>
        <Filter value={when} onChange={setWhen} label="Date" options={[["all", "All dates"], ["upcoming", "Upcoming"], ["past", "Past"]]} />
        <Filter value={status} onChange={setStatus} label="Status" options={[["all", "All statuses"], ...STATUSES.map((s) => [s, s] as [string, string])]} />
        <Filter value={vehicle} onChange={setVehicle} label="Vehicle" options={[["all", "All vehicles"], ...vehicles.map((v) => [v, v] as [string, string])]} />
      </div>
      {isLoading ? <Skeleton className="h-96" /> : !rows.length ? <EmptyState title="No jobs match" body="Try clearing a filter." /> : (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="border-b border-border text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 font-medium">Ref</th>
                <th className="px-4 py-2.5 font-medium">{th("customer", "Customer")}</th>
                <th className="px-4 py-2.5 font-medium">Route</th>
                <th className="px-4 py-2.5 font-medium">{th("date", "Date")}</th>
                <th className="px-4 py-2.5 font-medium">Crew</th>
                <th className="px-4 py-2.5 font-medium">Vehicle</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 text-right font-medium">{th("quote", "Quote")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((j: Job) => (
                <tr key={j.id} className="cursor-pointer hover:bg-muted/50" onClick={() => nav({ to: "/admin/jobs/$id", params: { id: j.id } })}>
                  <td className="tabular px-4 py-3 text-muted-foreground"><Link to="/admin/jobs/$id" params={{ id: j.id }} onClick={(e) => e.stopPropagation()} className="hover:underline">{j.ref}</Link></td>
                  <td className="px-4 py-3 font-medium">{j.customer}</td>
                  <td className="px-4 py-3">{j.origin} → {j.destination}</td>
                  <td className="tabular px-4 py-3">{ukDate(j.date, { weekday: "short", day: "numeric", month: "short" })} · {j.start}</td>
                  <td className="tabular px-4 py-3">{j.crew}</td>
                  <td className="px-4 py-3">{j.vehicle}</td>
                  <td className="px-4 py-3"><StatusBadge status={j.status} /></td>
                  <td className="tabular px-4 py-3 text-right">{j.quote ? gbp(j.quote) : <span className="text-muted-foreground">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminPage>
  );
}

function Filter({ value, onChange, options, label }: { value: string; onChange: (v: string) => void; options: [string, string][]; label: string }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9 w-auto min-w-36 bg-card" aria-label={label}><SelectValue /></SelectTrigger>
      <SelectContent>{options.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
    </Select>
  );
}
