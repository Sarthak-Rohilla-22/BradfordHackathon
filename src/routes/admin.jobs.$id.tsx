import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { AdminPage } from "@/components/morrow/admin-page";
import { InventoryRoom, InventoryRow } from "@/components/morrow/inventory";
import { LogisticsGrid, QuoteBreakdown } from "@/components/morrow/quote";
import { AccessWarning } from "@/components/morrow/access";
import { DataBadge, EmptyState, ErrorState, Section, StatusBadge, Tag, fmtDims, gbp, ukDate } from "@/components/morrow/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { catalogueQ, crewQ, jobQ, memoriesQ, qk } from "@/lib/morrow/queries";
import { doorOpening } from "@/lib/morrow/engine";
import * as api from "@/lib/morrow/api";
import type { InventoryItem, Job, JobStatus } from "@/lib/morrow/types";

export const Route = createFileRoute("/admin/jobs/$id")({
  head: () => ({ meta: [{ title: "Job — Morrow" }, { name: "description", content: "Job detail." }, { property: "og:title", content: "Job — Morrow" }, { property: "og:description", content: "Job detail." }] }),
  component: JobDetail,
});

const TABS = ["Overview", "Inventory", "Access", "Logistics", "Quote", "AI Operations", "Activity", "Memory"] as const;

function JobDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const q = useQuery(jobQ(id));
  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview");
  const status = useMutation({ mutationFn: (s: JobStatus) => api.updateJobStatus(id, s), onSuccess: () => { qc.invalidateQueries(); toast("Status updated"); } });

  if (q.isLoading) return <AdminPage title="Loading…"><Skeleton className="h-96" /></AdminPage>;
  if (q.isError || !q.data) return <AdminPage title="Job not found"><ErrorState title="We couldn't find that job" body={`No job with reference “${id}”. (${(q.error as Error)?.message ?? "NOT_FOUND"})`} /></AdminPage>;
  const j = q.data;

  return (
    <AdminPage
      title={`${j.customer}`}
      sub={<span className="flex items-center gap-2"><Link to="/admin/jobs" className="inline-flex items-center gap-1 hover:text-foreground"><ArrowLeft className="size-3" /> Jobs</Link> · <span className="tabular">{j.ref}</span> · <StatusBadge status={j.status} /></span>}
      actions={
        <Select value={j.status} onValueChange={(v) => status.mutate(v as JobStatus)}>
          <SelectTrigger className="h-9 w-44 bg-card" aria-label="Change status"><SelectValue /></SelectTrigger>
          <SelectContent>{["New", "Needs review", "Estimating", "Quote ready", "Confirmed", "In progress", "Completed", "Cancelled"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>
      }
    >
      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-border" role="tablist">
        {TABS.map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm ${tab === t ? "border-primary font-medium" : "border-transparent text-muted-foreground hover:text-foreground"}`}>{t}</button>
        ))}
      </div>
      {tab === "Overview" && <Overview j={j} />}
      {tab === "Inventory" && <InventoryTab j={j} />}
      {tab === "Access" && <AccessTab j={j} />}
      {tab === "Logistics" && (j.logistics ? <LogisticsGrid lg={j.logistics} compact /> : <Legacy j={j} />)}
      {tab === "Quote" && (j.quoteDetail ? <div className="max-w-xl rounded-lg border border-border bg-card px-5 pt-2"><QuoteBreakdown quote={j.quoteDetail} /></div> : j.quote ? <Section><p className="tabular text-2xl font-semibold">{gbp(j.quote)}</p><p className="text-sm text-muted-foreground">Quoted before this job used itemised breakdowns.</p></Section> : <EmptyState title="No quote yet" body="A quote is produced once the inventory and access are confirmed." />)}
      {tab === "AI Operations" && <AiTab j={j} />}
      {tab === "Activity" && <Activity j={j} />}
      {tab === "Memory" && <MemoryTab j={j} />}
    </AdminPage>
  );
}

function Overview({ j }: { j: Job }) {
  const { data: crew } = useQuery(crewQ);
  const m = j.move;
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Section title="Customer"><p className="font-medium">{m?.customerName || j.customer}</p><p className="text-sm text-muted-foreground">{m?.email ?? "—"}</p><p className="text-sm text-muted-foreground">{m?.phone || ""}</p></Section>
      <Section title="Move"><p className="font-medium">{j.origin} → {j.destination}</p><p className="text-sm text-muted-foreground">{ukDate(j.date)} · {j.start}–{j.end}</p></Section>
      <Section title="Resources"><p className="text-sm">{j.vehicle} · {j.crew} movers · ~{j.hours} h</p><p className="mt-2 text-sm text-muted-foreground">{j.crewIds.length ? j.crewIds.map((id) => crew?.find((c) => c.id === id)?.name).filter(Boolean).join(", ") : "Crew not yet assigned"}</p></Section>
      {j.logistics && <div className="lg:col-span-3"><LogisticsGrid lg={j.logistics} compact /></div>}
    </div>
  );
}

function Legacy({ j }: { j: Job }) {
  return <Section><p className="text-sm">{j.volume ? `${j.volume} m³ · ${j.vehicle} · ${j.crew} movers · ~${j.hours} hours` : "Logistics not yet calculated."}</p></Section>;
}

function InventoryTab({ j }: { j: Job }) {
  const { data: cat = [] } = useQuery(catalogueQ);
  const byId = useMemo(() => new Map(cat.map((c) => [c.id, c])), [cat]);
  if (!j.move?.inventory.length) return <EmptyState title="No inventory on file" body="This job was entered before photo inventories, or the customer hasn't sent photos yet." />;
  const rooms = [...new Set(j.move.inventory.map((i) => i.room))];
  return <div className="grid gap-4 lg:grid-cols-2">{rooms.map((r) => { const l = j.move!.inventory.filter((i) => i.room === r); return <InventoryRoom key={r} room={r} count={l.length}>{l.map((i) => <InventoryRow key={i.id} item={i} cat={byId.get(i.catalogueId)} readOnly />)}</InventoryRoom>; })}</div>;
}

function AccessTab({ j }: { j: Job }) {
  const h = j.move?.home;
  if (!h) return <EmptyState title="No access details" body="The customer hasn't described their home yet." />;
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Section title="Property">
        <dl className="grid grid-cols-2 gap-y-3 text-sm">
          {[["Type", h.propertyType], ["Floor", h.floor], ["Lift", h.lift || "n/a"], ["Stairs", h.stairs], ["Parking", h.parking]].map(([k, v]) => <div key={k}><dt className="text-xs text-muted-foreground">{k}</dt><dd>{v || "—"}</dd></div>)}
        </dl>
      </Section>
      <Section title="Doorways">
        <ul className="divide-y divide-border text-sm">
          {h.doorways.map((d) => { const o = doorOpening(d); return <li key={d.id} className="flex justify-between py-2"><span>{d.label}</span><span className="tabular">{o ? `${o.w} × ${o.h} cm` : <Tag tone="amber">Access needs checking</Tag>} {d.mode === "approx" || d.mode === "size" ? <span className="text-xs text-muted-foreground">approx.</span> : null}</span></li>; })}
        </ul>
      </Section>
      {j.logistics?.accessIssues.map((i) => <AccessWarning key={i.itemId} issue={i} />)}
    </div>
  );
}

function AiTab({ j }: { j: Job }) {
  const qc = useQueryClient();
  const inv = j.move?.inventory ?? [];
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [note, setNote] = useState("");
  const save = useMutation({ mutationFn: () => api.overrideJobItem(j.id, editing!, note), onSuccess: () => { qc.invalidateQueries({ queryKey: qk.job(j.id) }); qc.invalidateQueries({ queryKey: qk.memories }); setEditing(null); setNote(""); toast("Override saved to memory"); } });
  if (!inv.length) return <EmptyState title="No AI activity" body="AI results appear here once a customer uploads photos." />;
  const ai = inv.filter((i) => i.addedBy === "ai");
  const changed = ai.filter((i) => i.dimsSource === "confirmed");
  const reviews = inv.filter((i) => i.review);
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-5">
        {[["Images analysed", j.move!.photos.length || 4], ["Items detected", ai.length], ["Customer corrected", changed.length], ["Customer added", inv.length - ai.length], ["Needs review", reviews.length]].map(([l, v]) => <div key={l} className="bg-card px-4 py-3"><p className="text-xs text-muted-foreground">{l}</p><p className="tabular text-xl font-semibold">{v}</p></div>)}
      </div>
      <Section title="Detections" aside={<span className="text-xs text-muted-foreground">Model: Gemma · vision · object recognition, counting, room classification</span>}>
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-muted-foreground"><tr><th className="pb-2 font-medium">Item</th><th className="pb-2 font-medium">Room</th><th className="pb-2 font-medium">Dimensions</th><th className="pb-2 font-medium">State</th><th /></tr></thead>
          <tbody className="divide-y divide-border">
            {inv.map((i) => (
              <tr key={i.id}>
                <td className="py-2.5">{i.name} × {i.qty}{i.addedBy === "customer" && <span className="ml-2 text-xs text-muted-foreground">customer-added</span>}</td>
                <td className="py-2.5 text-muted-foreground">{i.room}</td>
                <td className="tabular py-2.5">{i.dims ? fmtDims(i.dims) : "—"}</td>
                <td className="py-2.5">{i.review ? <DataBadge state="review" /> : <DataBadge state={i.dimsSource ?? "estimated"} />}</td>
                <td className="py-2.5 text-right"><Button size="sm" variant="ghost" onClick={() => setEditing(i)}>Override</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>
      {reviews.map((r) => (
        <Section key={r.id} title={`${r.name} — needs review`}><p className="text-sm"><span className="text-muted-foreground">Reason:</span> {r.review}</p><p className="mt-1 text-sm"><span className="text-muted-foreground">Action:</span> Customer asked to confirm.</p></Section>
      ))}
      {editing && (
        <Section title={`Override: ${editing.name}`}>
          <div className="grid gap-3 sm:grid-cols-4">
            <label className="text-sm">Name<Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="mt-1" /></label>
            <label className="text-sm">Quantity<Input type="number" value={editing.qty} onChange={(e) => setEditing({ ...editing, qty: +e.target.value || 1 })} className="mt-1" /></label>
            <label className="text-sm sm:col-span-2">Correction note (saved to memory)<Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Large / 2-person lift" className="mt-1" /></label>
          </div>
          <div className="mt-4 flex gap-2"><Button onClick={() => save.mutate()}>Save override</Button><Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button></div>
        </Section>
      )}
    </div>
  );
}

function Activity({ j }: { j: Job }) {
  const ev = [
    [j.createdAt, "Enquiry received", "via Morrow customer page"],
    ...(j.move ? [[j.createdAt, "Photos analysed", `${j.move.inventory.filter((i) => i.addedBy === "ai").length} items detected`], [j.createdAt, "Inventory confirmed by customer", `${j.move.inventory.filter((i) => i.dimsSource === "confirmed").length} dimensions confirmed`], [j.createdAt, "Access details provided", `${j.move.home.doorways.length} doorways`]] : []),
    ...(j.quote ? [[j.createdAt, "Quote generated", gbp(j.quote)]] : []),
    ...(["Confirmed", "In progress", "Completed"].includes(j.status) ? [[j.createdAt, "Booking confirmed", `${ukDate(j.date, { day: "numeric", month: "short" })} · ${j.start}`]] : []),
  ];
  return (
    <ol className="relative max-w-xl space-y-5 border-l border-border pl-6">
      {ev.map(([d, t, s], i) => <li key={i} className="relative"><span className="absolute -left-[1.84rem] top-1 size-2.5 rounded-full border-2 border-card bg-taupe" /><p className="text-sm font-medium">{t}</p><p className="text-xs text-muted-foreground">{s} · {ukDate(d ?? "", { day: "numeric", month: "short" })}</p></li>)}
    </ol>
  );
}

function MemoryTab({ j }: { j: Job }) {
  const { data = [] } = useQuery(memoriesQ);
  const rel = data.filter((m) => m.kind === "AI correction" || m.title.includes(j.origin) || m.body.includes(j.origin) || m.source.includes(j.ref));
  return rel.length ? <div className="grid gap-4 md:grid-cols-2">{rel.map((m) => <Section key={m.id}><Tag>{m.kind}</Tag><p className="mt-2 font-medium">{m.title}</p><p className="mt-1 text-sm text-muted-foreground">{m.body}</p>{m.action && <p className="mt-2 text-sm">→ {m.action}</p>}</Section>)}</div> : <EmptyState title="No saved memories" body="Useful operational memories will appear here as Morrow learns from completed jobs." />;
}
