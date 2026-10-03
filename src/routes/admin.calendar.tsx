import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AdminPage } from "@/components/morrow/admin-page";
import { StatusBadge, Tag, ukDate } from "@/components/morrow/ui";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { jobsQ, vehiclesQ } from "@/lib/morrow/queries";
import { isoDay } from "@/lib/morrow/data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/calendar")({
  head: () => ({ meta: [{ title: "Calendar — Morrow" }, { name: "description", content: "Operations calendar by vehicle." }, { property: "og:title", content: "Calendar — Morrow" }, { property: "og:description", content: "Operations calendar by vehicle." }] }),
  component: Cal,
});

const H0 = 8, H1 = 20;
const toH = (t: string) => { const [h, m] = t.split(":").map(Number); return h + m / 60; };

function Cal() {
  const { data: jobs, isLoading } = useQuery(jobsQ);
  const { data: vehicles } = useQuery(vehiclesQ);
  const [off, setOff] = useState(0);
  const [view, setView] = useState<"day" | "week">("day");
  const day = isoDay(off);
  const live = (jobs ?? []).filter((j) => j.status !== "Cancelled");
  const conflicts = useMemo(() => {
    const s = new Set<string>();
    live.filter((j) => j.date === day).forEach((a) => live.forEach((b) => { if (a.id !== b.id && a.date === b.date && a.vehicleId === b.vehicleId && a.start < b.end && b.start < a.end) s.add(a.id); }));
    return s;
  }, [live, day]);

  return (
    <AdminPage title="Calendar" sub={view === "day" ? ukDate(day) : `Week of ${ukDate(day, { day: "numeric", month: "long" })}`}
      actions={<>
        <div className="flex rounded-md border border-border bg-card p-0.5">{(["day", "week"] as const).map((v) => <button key={v} onClick={() => setView(v)} className={cn("rounded px-3 py-1 text-sm capitalize", view === v && "bg-primary text-primary-foreground")}>{v}</button>)}</div>
        <Button variant="outline" size="icon" onClick={() => setOff(off - (view === "day" ? 1 : 7))} aria-label="Previous"><ChevronLeft /></Button>
        <Button variant="outline" onClick={() => setOff(0)}>Today</Button>
        <Button variant="outline" size="icon" onClick={() => setOff(off + (view === "day" ? 1 : 7))} aria-label="Next"><ChevronRight /></Button>
      </>}>
      {isLoading ? <Skeleton className="h-96" /> : view === "day" ? (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <div className="min-w-[900px]">
            <div className="grid grid-cols-[10rem_1fr] border-b border-border text-xs text-muted-foreground">
              <div className="px-4 py-2">Vehicle</div>
              <div className="relative h-8">{Array.from({ length: H1 - H0 + 1 }).map((_, i) => <span key={i} className="tabular absolute top-2 -translate-x-1/2" style={{ left: `${(i / (H1 - H0)) * 100}%` }}>{String(H0 + i).padStart(2, "0")}:00</span>)}</div>
            </div>
            {vehicles?.map((v) => {
              const vj = live.filter((j) => j.date === day && j.vehicleId === v.id);
              return (
                <div key={v.id} className="grid grid-cols-[10rem_1fr] border-b border-border last:border-0">
                  <div className="px-4 py-4 text-sm"><p className="font-medium">{v.name}</p><p className="text-xs text-muted-foreground">{v.status === "Maintenance" ? v.maintenance : `${v.capacity} m³`}</p></div>
                  <div className={cn("relative h-20", v.status === "Maintenance" && "bg-[repeating-linear-gradient(135deg,transparent_0_8px,var(--color-muted)_8px_16px)]")}>
                    {vj.map((j) => (
                      <Link key={j.id} to="/admin/jobs/$id" params={{ id: j.id }}
                        className={cn("absolute top-2 bottom-2 overflow-hidden rounded-md border px-2.5 py-1.5 text-xs transition-shadow hover:shadow-soft", conflicts.has(j.id) ? "border-destructive bg-error-soft" : j.status === "In progress" ? "border-primary bg-primary text-primary-foreground" : "border-border bg-sage-soft")}
                        style={{ left: `${((toH(j.start) - H0) / (H1 - H0)) * 100}%`, width: `${((toH(j.end) - toH(j.start)) / (H1 - H0)) * 100}%` }}>
                        <p className="truncate font-medium">{j.customer}</p>
                        <p className="truncate opacity-80">{j.start}–{j.end} · {j.crew} crew{conflicts.has(j.id) ? " · CONFLICT" : ""}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-7">
          {Array.from({ length: 7 }).map((_, i) => {
            const d = isoDay(off + i); const dj = live.filter((j) => j.date === d).sort((a, b) => a.start.localeCompare(b.start));
            return (
              <div key={d} className="min-h-48 bg-card p-3">
                <p className="text-xs text-muted-foreground">{ukDate(d, { weekday: "short", day: "numeric", month: "short" })}</p>
                <ul className="mt-2 space-y-1.5">{dj.map((j) => <li key={j.id}><Link to="/admin/jobs/$id" params={{ id: j.id }} className="block rounded border border-border bg-background px-2 py-1.5 text-xs hover:border-taupe"><span className="tabular">{j.start}</span> {j.customer}<span className="mt-1 block"><StatusBadge status={j.status} /></span></Link></li>)}</ul>
                {!dj.length && <p className="mt-2 text-xs text-muted-foreground">Free</p>}
              </div>
            );
          })}
        </div>
      )}
      {conflicts.size > 0 && view === "day" && <p className="mt-3"><Tag tone="error">{conflicts.size} jobs share a vehicle at overlapping times</Tag></p>}
    </AdminPage>
  );
}
