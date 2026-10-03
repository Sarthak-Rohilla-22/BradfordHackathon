import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import { CustomerShell, PageTitle } from "@/components/morrow/customer-shell";
import { AccessWarning, AddDoorwayButton, ChoiceGroup, DoorDiagram, DoorwayForm } from "@/components/morrow/access";
import { Button } from "@/components/ui/button";
import { moveQ } from "@/lib/morrow/queries";
import { findAccessIssues } from "@/lib/morrow/engine";
import * as api from "@/lib/morrow/api";
import type { HomeInfo } from "@/lib/morrow/types";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { title: "A little about your home — Morrow" },
      { name: "description", content: "Property, stairs, parking and doorways — so everything can get out safely." },
      { property: "og:title", content: "A little about your home — Morrow" },
      { property: "og:description", content: "Let's make sure everything can get out." },
    ],
  }),
  component: Home,
});

function Home() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const { data: move } = useQuery(moveQ);
  const [h, setH] = useState<HomeInfo | null>(null);
  useEffect(() => {
    if (move && !h) setH(move.home.doorways.length ? move.home : { ...move.home, doorways: [{ id: api.uid(), label: "Front door", mode: "exact" }, { id: api.uid(), label: "Dining room → Hallway", mode: "exact" }] });
  }, [move, h]);

  // Live preview of the backend's access check as doorways are entered
  const issues = useMemo(() => (move && h ? findAccessIssues({ ...move, home: h }).issues : []), [move, h]);
  if (!h) return <CustomerShell step="home"><div className="h-96" /></CustomerShell>;
  const set = (p: Partial<HomeInfo>) => setH({ ...h, ...p });
  const missing = !h.propertyType || !h.floor || !h.stairs || !h.parking;

  async function next() {
    await api.updateHome(h!);
    qc.invalidateQueries();
    nav({ to: "/logistics" });
  }

  return (
    <CustomerShell
      step="home"
      footer={<div className="flex items-center gap-3"><p className="flex-1 text-xs text-muted-foreground">{missing ? "A few answers still to go" : "You're nearly there."}</p><Button size="lg" disabled={missing} onClick={next}>See what your move needs <ArrowRight /></Button></div>}
    >
      <PageTitle title="A little about your home" sub="A few details help us work out how to get everything out safely." />
      <div className="space-y-7">
        <ChoiceGroup label="Property type" options={["Flat", "Terraced house", "Semi-detached", "Detached", "Other"]} value={h.propertyType} onChange={(v) => set({ propertyType: v })} />
        <ChoiceGroup label="Which floor are you moving from?" options={["Ground", "1", "2", "3+", "Multiple floors"]} value={h.floor} onChange={(v) => set({ floor: v })} />
        {h.propertyType === "Flat" && <ChoiceGroup label="Is there a lift?" options={["Yes", "No", "Not sure"]} value={h.lift} onChange={(v) => set({ lift: v })} />}
        <ChoiceGroup label="Stairs" options={["None", "Internal stairs", "External stairs"]} value={h.stairs} onChange={(v) => set({ stairs: v })} />
        <ChoiceGroup label="Parking and access for the van" options={["Easy access", "Street parking", "Limited access", "Permit required", "Not sure"]} value={h.parking} onChange={(v) => set({ parking: v })} />

        <section className="border-t border-border pt-7">
          <h2 className="text-lg font-semibold">Doorways & access</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">Tell us roughly how wide and high the main doorways are. This helps us spot furniture that may need extra handling.</p>
          <div className="mt-4 space-y-3">
            <DoorDiagram />
            {h.doorways.map((d) => (
              <DoorwayForm key={d.id} doorway={d} onChange={(nd) => set({ doorways: h.doorways.map((x) => (x.id === d.id ? nd : x)) })} onRemove={h.doorways.length > 1 ? () => set({ doorways: h.doorways.filter((x) => x.id !== d.id) }) : undefined} />
            ))}
            <AddDoorwayButton onClick={() => set({ doorways: [...h.doorways, { id: api.uid(), label: `Doorway ${h.doorways.length + 1}`, mode: "exact" }] })} />
          </div>
          {issues.length > 0 && <div className="mt-5 space-y-3">{issues.map((i) => <AccessWarning key={i.itemId} issue={i} />)}</div>}
        </section>
      </div>
    </CustomerShell>
  );
}
