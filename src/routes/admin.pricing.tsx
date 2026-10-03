import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminPage } from "@/components/morrow/admin-page";
import { Section } from "@/components/morrow/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { rulesQ } from "@/lib/morrow/queries";
import * as api from "@/lib/morrow/api";
import type { PricingRules } from "@/lib/morrow/types";

export const Route = createFileRoute("/admin/pricing")({
  head: () => ({ meta: [{ title: "Pricing Rules — Morrow" }, { name: "description", content: "The rules that power Morrow's quote engine." }, { property: "og:title", content: "Pricing Rules — Morrow" }, { property: "og:description", content: "AI does not set your prices." }] }),
  component: Pricing,
});

function Money({ label, value, onChange, unit }: { label: string; value: number; onChange: (n: number) => void; unit?: string }) {
  return (
    <label className="flex items-center justify-between gap-4 py-2.5">
      <span className="text-sm">{label}</span>
      <span className="relative w-36">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">£</span>
        <Input inputMode="decimal" value={value} onChange={(e) => onChange(Number(e.target.value) || 0)} className="tabular h-9 pl-7 pr-14 text-right" />
        {unit && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{unit}</span>}
      </span>
    </label>
  );
}

function Pricing() {
  const qc = useQueryClient();
  const { data } = useQuery(rulesQ);
  const [r, setR] = useState<PricingRules | null>(null);
  useEffect(() => { if (data) setR(structuredClone(data)); }, [data]);
  const save = useMutation({ mutationFn: api.updatePricingRules, onSuccess: () => { qc.invalidateQueries(); toast.success("Pricing rules saved. New quotes use these immediately."); } });
  if (!r) return <AdminPage title="Pricing Rules"><Skeleton className="h-96" /></AdminPage>;
  const dirty = JSON.stringify(r) !== JSON.stringify(data);

  return (
    <AdminPage title="Pricing Rules" sub="These rules power Morrow's quote engine. AI does not set your prices."
      actions={<><Button variant="ghost" disabled={!dirty} onClick={() => setR(structuredClone(data!))}>Discard</Button><Button disabled={!dirty || save.isPending} onClick={() => save.mutate(r)}>Save changes</Button></>}>
      <div className="mb-6 rounded-lg border border-border bg-card px-5 py-4 text-sm">
        <span className="font-medium">Morrow uses these company-defined rules to calculate quotes. AI does not set prices.</span> Furniture is never priced per item — it only informs volume, crew and time.
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Base move"><Money label="Base call-out" value={r.callout} onChange={(n) => setR({ ...r, callout: n })} /></Section>
        <Section title="Labour">
          <Money label="Standard mover" unit="/hour" value={r.moverHourly} onChange={(n) => setR({ ...r, moverHourly: n })} />
          <Money label="Additional mover" unit="/hour" value={r.additionalMoverHourly} onChange={(n) => setR({ ...r, additionalMoverHourly: n })} />
          <label className="flex items-center justify-between py-2.5 text-sm">Standard crew size<Input inputMode="numeric" value={r.standardCrew} onChange={(e) => setR({ ...r, standardCrew: Number(e.target.value) || 1 })} className="tabular h-9 w-36 text-right" /></label>
        </Section>
        <Section title="Vehicles">{r.vehicles.map((v, i) => <Money key={v.id} label={`${v.name} (${v.capacity} m³)`} unit="/hour" value={v.hourly} onChange={(n) => { const vs = [...r.vehicles]; vs[i] = { ...v, hourly: n }; setR({ ...r, vehicles: vs }); }} />)}</Section>
        <Section title="Travel & access">
          <Money label="Mileage" unit="/mile" value={r.mileage} onChange={(n) => setR({ ...r, mileage: n })} />
          <Money label="Stairs" value={r.stairs} onChange={(n) => setR({ ...r, stairs: n })} />
          <Money label="Difficult access / permit" value={r.difficultAccess} onChange={(n) => setR({ ...r, difficultAccess: n })} />
        </Section>
        <Section title="Dismantling">
          <Money label="Standard furniture" value={r.dismantling.standard} onChange={(n) => setR({ ...r, dismantling: { ...r.dismantling, standard: n } })} />
          <Money label="Large furniture" value={r.dismantling.large} onChange={(n) => setR({ ...r, dismantling: { ...r.dismantling, large: n } })} />
          <Money label="Complex" value={r.dismantling.complex} onChange={(n) => setR({ ...r, dismantling: { ...r.dismantling, complex: n } })} />
          <p className="py-2.5 text-sm text-muted-foreground">Specialist dismantling · manual assessment</p>
        </Section>
        <Section title="Special handling & equipment">
          <Money label="Special handling (per item)" value={r.specialHandling} onChange={(n) => setR({ ...r, specialHandling: n })} />
          {r.equipment.map((e, i) => <Money key={e.name} label={e.name} value={e.price} onChange={(n) => { const es = [...r.equipment]; es[i] = { ...e, price: n }; setR({ ...r, equipment: es }); }} />)}
        </Section>
      </div>
    </AdminPage>
  );
}
