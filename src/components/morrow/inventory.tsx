import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ChevronRight, Minus, Plus, Search, Trash2 } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";
import type { CatalogueItem, InventoryItem } from "@/lib/morrow/types";
import { DataBadge, Tag, fmtDims } from "./ui";
import { cn } from "@/lib/utils";

export function volumeOf(item: InventoryItem, cat?: CatalogueItem) {
  if (!cat) return null;
  return (cat.volume[0] + cat.volume[1]) / 2;
}

export function QtyStepper({ value, onChange, label }: { value: number; onChange: (n: number) => void; label: string }) {
  return (
    <div className="inline-flex items-center rounded-md border border-border bg-card" role="group" aria-label={`Quantity of ${label}`}>
      <button type="button" className="grid size-9 place-items-center text-muted-foreground hover:text-foreground disabled:opacity-40" onClick={() => onChange(value - 1)} disabled={value <= 1} aria-label={`Decrease ${label}`}><Minus className="size-3.5" /></button>
      <span className="tabular w-7 text-center text-sm font-medium" aria-live="polite">{value}</span>
      <button type="button" className="grid size-9 place-items-center text-muted-foreground hover:text-foreground" onClick={() => onChange(value + 1)} aria-label={`Increase ${label}`}><Plus className="size-3.5" /></button>
    </div>
  );
}

export function InventoryRow({ item, cat, onQty, onOpen, readOnly }: { item: InventoryItem; cat?: CatalogueItem; onQty?: (n: number) => void; onOpen?: () => void; readOnly?: boolean }) {
  const vol = volumeOf(item, cat);
  return (
    <motion.li layout initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 py-3">
      <button type="button" onClick={onOpen} disabled={!onOpen} className="min-w-0 flex-1 text-left">
        <p className="flex items-center gap-2 font-medium">
          <span className="truncate">{item.name}</span>
          {item.addedBy === "customer" && <span className="text-xs font-normal text-muted-foreground">added by you</span>}
        </p>
        <p className="tabular mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          {item.dims && <span>{item.dimsSource === "estimated" ? "~" : ""}{fmtDims(item.dims)}</span>}
          {!item.dims && vol !== null && <span>~{(vol * item.qty).toFixed(1)} m³</span>}
          {item.dims && item.dimsSource && <DataBadge state={item.dimsSource} />}
          {item.review && <DataBadge state="review" />}
          {item.special && <Tag tone="amber">Special handling</Tag>}
          {item.dismantle && <Tag tone="outline">Dismantle</Tag>}
        </p>
      </button>
      {readOnly ? <span className="tabular text-sm">× {item.qty}</span> : <QtyStepper value={item.qty} onChange={(n) => onQty?.(n)} label={item.name} />}
      {onOpen && !readOnly && <button onClick={onOpen} aria-label={`Details for ${item.name}`} className="text-muted-foreground hover:text-foreground"><ChevronRight className="size-4" /></button>}
    </motion.li>
  );
}

export function InventoryRoom({ room, children, count }: { room: string; children: React.ReactNode; count: number }) {
  return (
    <section className="rounded-lg border border-border bg-card px-4 sm:px-5" aria-label={room}>
      <header className="flex items-center justify-between border-b border-border py-3">
        <h2 className="eyebrow text-foreground">{room}</h2>
        <span className="text-xs text-muted-foreground">{count} item{count === 1 ? "" : "s"}</span>
      </header>
      <ul className="divide-y divide-border">{children}</ul>
    </section>
  );
}

const MATERIALS = ["Unknown", "Wood", "Metal", "Glass", "Fabric", "Leather", "Marble / stone", "Plastic"];

export function InventoryDrawer({ item, cat, rooms, open, onOpenChange, onSave, onDelete }: {
  item: InventoryItem | null; cat?: CatalogueItem; rooms: string[]; open: boolean; onOpenChange: (o: boolean) => void;
  onSave: (i: InventoryItem) => void; onDelete: (id: string) => void;
}) {
  const mobile = useIsMobile();
  const [draft, setDraft] = useState<InventoryItem | null>(item);
  const [editDims, setEditDims] = useState(false);
  useEffect(() => { setDraft(item); setEditDims(false); }, [item?.id, open]);
  if (!draft) return null;
  const setDim = (k: "l" | "w" | "h", v: string) => {
    const n = Math.max(0, parseInt(v || "0", 10));
    setDraft({ ...draft, dims: { ...(draft.dims ?? { l: 0, w: 0, h: 0 }), [k]: n }, dimsSource: "confirmed", review: draft.review?.includes("size") ? undefined : draft.review });
  };
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={mobile ? "bottom" : "right"} className={cn("flex flex-col gap-0 bg-card p-0", mobile ? "max-h-[92dvh] rounded-t-xl" : "w-full sm:max-w-md")}>
        <SheetHeader className="border-b border-border px-5 py-4 text-left">
          <SheetTitle className="text-lg">{draft.name}</SheetTitle>
          <SheetDescription>{draft.room}{cat ? ` · ${cat.category}` : ""}</SheetDescription>
        </SheetHeader>
        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
          {draft.review && (
            <div className="flex gap-2.5 rounded-md bg-amber-soft px-3.5 py-3 text-sm">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber" /><p>{draft.review}</p>
            </div>
          )}
          <div className="flex items-center justify-between">
            <Label>Quantity</Label>
            <QtyStepper value={draft.qty} onChange={(n) => setDraft({ ...draft, qty: n })} label={draft.name} />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <Label>Approximate dimensions</Label>
              {draft.dimsSource && <DataBadge state={draft.dimsSource} />}
            </div>
            {editDims || !draft.dims ? (
              <div className="mt-2 grid grid-cols-3 gap-2">
                {(["l", "w", "h"] as const).map((k) => (
                  <label key={k} className="block">
                    <span className="text-xs text-muted-foreground">{{ l: "Length", w: "Width", h: "Height" }[k]}</span>
                    <div className="relative mt-1">
                      <Input inputMode="numeric" value={draft.dims?.[k] ?? ""} onChange={(e) => setDim(k, e.target.value)} className="tabular h-11 pr-9" />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">cm</span>
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <div className="mt-2 flex items-center justify-between rounded-md bg-background px-3.5 py-3">
                <span className="tabular">{draft.dimsSource === "estimated" ? "~" : ""}{fmtDims(draft.dims)}</span>
                <Button variant="link" size="sm" className="h-auto p-0" onClick={() => setEditDims(true)}>Edit dimensions</Button>
              </div>
            )}
            <p className="mt-2 text-xs text-muted-foreground">{draft.dimsSource === "confirmed" ? "Confirmed by you" : "Estimated from photo — measure if you can."}</p>
          </div>
          <div className="space-y-1.5">
            <Label>Room</Label>
            <Select value={draft.room} onValueChange={(v) => setDraft({ ...draft, room: v })}>
              <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
              <SelectContent>{rooms.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Material</Label>
            <Select value={draft.material} onValueChange={(v) => setDraft({ ...draft, material: v, review: draft.review?.includes("Material") ? undefined : draft.review })}>
              <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
              <SelectContent>{MATERIALS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-3">
            <label className="flex items-center gap-3 text-sm"><Checkbox checked={draft.dismantle} onCheckedChange={(v) => setDraft({ ...draft, dismantle: !!v })} /> Needs dismantling</label>
            <label className="flex items-center gap-3 text-sm"><Checkbox checked={draft.special} onCheckedChange={(v) => setDraft({ ...draft, special: !!v })} /> Special handling (fragile, valuable, very heavy)</label>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} placeholder="e.g. glass top, extends to 260 cm" />
          </div>
          {cat?.special && <p className="rounded-md bg-muted px-3.5 py-3 text-sm">Manual assessment required — our team will be in touch about this item.</p>}
        </div>
        <div className="flex gap-2 border-t border-border px-5 py-4">
          <Button variant="ghost" className="text-destructive" onClick={() => { onDelete(draft.id); onOpenChange(false); }}><Trash2 /> Remove</Button>
          <Button className="flex-1" onClick={() => { onSave({ ...draft, review: draft.review && draft.dimsSource === "confirmed" && draft.review.includes("size") ? undefined : draft.review }); onOpenChange(false); }}>Save changes</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function AddItemDialog({ open, onOpenChange, catalogue, rooms, onAdd }: {
  open: boolean; onOpenChange: (o: boolean) => void; catalogue: CatalogueItem[]; rooms: string[];
  onAdd: (catalogueId: string | null, room: string, custom?: string) => void;
}) {
  const [q, setQ] = useState("");
  const [room, setRoom] = useState(rooms[0] ?? "Living room");
  const [custom, setCustom] = useState("");
  const [describe, setDescribe] = useState(false);
  useEffect(() => { if (open) { setQ(""); setDescribe(false); setCustom(""); } }, [open]);
  const groups = useMemo(() => {
    const f = catalogue.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()) || c.category.toLowerCase().includes(q.toLowerCase()));
    const m = new Map<string, CatalogueItem[]>();
    f.forEach((c) => m.set(c.category, [...(m.get(c.category) ?? []), c]));
    return [...m.entries()];
  }, [catalogue, q]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[88dvh] flex-col gap-0 bg-card p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-border px-5 py-4 text-left">
          <DialogTitle>Add an item</DialogTitle>
          <DialogDescription>Pick from the list or describe it in your own words.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 border-b border-border px-5 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search — sofa, fridge, boxes…" className="h-11 pl-9" aria-label="Search items" />
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Room</span>
            <Select value={room} onValueChange={setRoom}>
              <SelectTrigger className="h-9 w-auto min-w-36"><SelectValue /></SelectTrigger>
              <SelectContent>{[...new Set([...rooms, "Kitchen", "Office", "Garage", "Loft"])].map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-3">
          {describe ? (
            <div className="space-y-3 py-2">
              <Label htmlFor="custom">Describe the item</Label>
              <Textarea id="custom" value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="e.g. Antique grandfather clock, about 2 m tall" />
              <Button disabled={!custom.trim()} onClick={() => { onAdd(null, room, custom.trim()); onOpenChange(false); }}>Add item</Button>
            </div>
          ) : groups.length ? groups.map(([cat, items]) => (
            <div key={cat} className="py-2">
              <p className="eyebrow mb-1">{cat}</p>
              <ul>
                {items.map((c) => (
                  <li key={c.id}>
                    <button onClick={() => { onAdd(c.id, room); onOpenChange(false); }} className="flex w-full items-center justify-between rounded-md px-2 py-2.5 text-left text-sm hover:bg-muted">
                      {c.name}
                      {c.special ? <Tag tone="amber">Specialist</Tag> : <Plus className="size-4 text-muted-foreground" />}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )) : <p className="py-8 text-center text-sm text-muted-foreground">Nothing matches “{q}”.</p>}
        </div>
        <div className="border-t border-border px-5 py-3">
          <button onClick={() => setDescribe((d) => !d)} className="text-sm underline decoration-taupe underline-offset-4">{describe ? "Back to the list" : "Describe something else"}</button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
