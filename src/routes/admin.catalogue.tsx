import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { AdminPage } from "@/components/morrow/admin-page";
import { Tag } from "@/components/morrow/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { catalogueQ, qk } from "@/lib/morrow/queries";
import * as api from "@/lib/morrow/api";
import type { CatalogueItem } from "@/lib/morrow/types";

export const Route = createFileRoute("/admin/catalogue")({
  head: () => ({ meta: [{ title: "Item Catalogue — Morrow" }, { name: "description", content: "Your operational assumptions for each item type." }, { property: "og:title", content: "Item Catalogue — Morrow" }, { property: "og:description", content: "Operational item assumptions." }] }),
  component: Catalogue,
});

const blank = (): CatalogueItem => ({ id: `item-${api.uid()}`, name: "", category: "Furniture", dims: { l: 0, w: 0, h: 0 }, volume: [0, 0], weight: [0, 0], crew: 2, minCrew: 1, handling: "Standard", dismantling: "Never", dismantlingCost: null, equipment: "", special: false, pricingCategory: "Furniture", manualReview: false });

function Catalogue() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery(catalogueQ);
  const [q, setQ] = useState("");
  const [edit, setEdit] = useState<CatalogueItem | null>(null);
  const save = useMutation({ mutationFn: api.saveCatalogueItem, onSuccess: () => { qc.invalidateQueries({ queryKey: qk.catalogue }); setEdit(null); toast("Catalogue updated"); } });
  const del = useMutation({ mutationFn: api.deleteCatalogueItem, onSuccess: () => { qc.invalidateQueries({ queryKey: qk.catalogue }); setEdit(null); toast("Item removed"); } });
  const rows = (data ?? []).filter((c) => `${c.name} ${c.category}`.toLowerCase().includes(q.toLowerCase()));
  const num = (v: string) => Number(v) || 0;

  return (
    <AdminPage title="Item Catalogue" sub="Company-defined assumptions that enrich what the AI recognises. Typical values, not guarantees."
      actions={<Button onClick={() => setEdit(blank())}><Plus /> New item</Button>}>
      <div className="relative mb-4 max-w-sm"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search items" className="h-9 bg-card pl-9" aria-label="Search catalogue" /></div>
      {isLoading ? <Skeleton className="h-96" /> : (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="border-b border-border text-left text-xs text-muted-foreground"><tr>{["Item", "Typical dimensions", "Volume", "Weight", "Crew", "Handling", "Dismantling", ""].map((h) => <th key={h} className="px-4 py-2.5 font-medium">{h}</th>)}</tr></thead>
            <tbody className="tabular divide-y divide-border">
              {rows.map((c) => (
                <tr key={c.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setEdit(structuredClone(c))}>
                  <td className="px-4 py-2.5"><p className="font-medium">{c.name}</p><p className="text-xs text-muted-foreground">{c.category}</p></td>
                  <td className="px-4 py-2.5">{c.dims.l} × {c.dims.w} × {c.dims.h} cm</td>
                  <td className="px-4 py-2.5">{c.volume[0]}–{c.volume[1]} m³</td>
                  <td className="px-4 py-2.5">{c.weight[0]}–{c.weight[1]} kg</td>
                  <td className="px-4 py-2.5">{c.crew}</td>
                  <td className="px-4 py-2.5"><Tag tone={c.handling === "Specialist" ? "amber" : "neutral"}>{c.handling}</Tag></td>
                  <td className="px-4 py-2.5">{c.dismantling}{c.dismantlingCost ? ` · £${c.dismantlingCost}` : ""}</td>
                  <td className="px-4 py-2.5 text-right text-muted-foreground">Edit</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Sheet open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <SheetContent className="w-full overflow-y-auto bg-card sm:max-w-lg">
          <SheetHeader><SheetTitle>{edit?.name || "New item"}</SheetTitle></SheetHeader>
          {edit && (
            <form className="mt-4 space-y-4 px-4 pb-6 text-sm" onSubmit={(e) => { e.preventDefault(); if (edit.name.trim()) save.mutate(edit); }}>
              <L l="Name"><Input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} required /></L>
              <div className="grid grid-cols-2 gap-3">
                <L l="Category"><Input value={edit.category} onChange={(e) => setEdit({ ...edit, category: e.target.value })} /></L>
                <L l="Pricing category"><Input value={edit.pricingCategory} onChange={(e) => setEdit({ ...edit, pricingCategory: e.target.value })} /></L>
              </div>
              <L l="Typical dimensions (cm)"><div className="grid grid-cols-3 gap-2">{(["l", "w", "h"] as const).map((k) => <Input key={k} inputMode="numeric" value={edit.dims[k]} onChange={(e) => setEdit({ ...edit, dims: { ...edit.dims, [k]: num(e.target.value) } })} aria-label={k} />)}</div></L>
              <div className="grid grid-cols-2 gap-3">
                <L l="Volume range (m³)"><div className="flex gap-2">{[0, 1].map((i) => <Input key={i} inputMode="decimal" value={edit.volume[i]} onChange={(e) => { const v = [...edit.volume] as [number, number]; v[i] = num(e.target.value); setEdit({ ...edit, volume: v }); }} />)}</div></L>
                <L l="Weight range (kg)"><div className="flex gap-2">{[0, 1].map((i) => <Input key={i} inputMode="numeric" value={edit.weight[i]} onChange={(e) => { const v = [...edit.weight] as [number, number]; v[i] = num(e.target.value); setEdit({ ...edit, weight: v }); }} />)}</div></L>
                <L l="Standard crew"><Input inputMode="numeric" value={edit.crew} onChange={(e) => setEdit({ ...edit, crew: num(e.target.value) })} /></L>
                <L l="Minimum crew"><Input inputMode="numeric" value={edit.minCrew} onChange={(e) => setEdit({ ...edit, minCrew: num(e.target.value) })} /></L>
                <L l="Handling"><Sel v={edit.handling} o={["Standard", "Careful", "Specialist"]} on={(v) => setEdit({ ...edit, handling: v as CatalogueItem["handling"] })} /></L>
                <L l="Dismantling"><Sel v={edit.dismantling} o={["Never", "Sometimes", "Usually", "Manual assessment"]} on={(v) => setEdit({ ...edit, dismantling: v as CatalogueItem["dismantling"] })} /></L>
                <L l="Dismantling cost (£)"><Input inputMode="numeric" value={edit.dismantlingCost ?? ""} onChange={(e) => setEdit({ ...edit, dismantlingCost: e.target.value ? num(e.target.value) : null })} /></L>
                <L l="Special equipment"><Input value={edit.equipment} onChange={(e) => setEdit({ ...edit, equipment: e.target.value })} /></L>
              </div>
              <label className="flex items-center gap-2"><Checkbox checked={edit.special} onCheckedChange={(v) => setEdit({ ...edit, special: !!v })} /> Special handling</label>
              <label className="flex items-center gap-2"><Checkbox checked={edit.manualReview} onCheckedChange={(v) => setEdit({ ...edit, manualReview: !!v })} /> Always require manual review</label>
              <div className="flex gap-2 pt-2"><Button type="submit" className="flex-1">Save item</Button><Button type="button" variant="ghost" className="text-destructive" onClick={() => del.mutate(edit.id)}>Delete</Button></div>
            </form>
          )}
        </SheetContent>
      </Sheet>
    </AdminPage>
  );
}

function L({ l, children }: { l: string; children: React.ReactNode }) { return <label className="block space-y-1"><span className="text-xs text-muted-foreground">{l}</span>{children}</label>; }
function Sel({ v, o, on }: { v: string; o: string[]; on: (v: string) => void }) {
  return <Select value={v} onValueChange={on}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{o.map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select>;
}
