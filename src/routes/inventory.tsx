import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ArrowRight, Check, Plus } from "lucide-react";
import { toast } from "sonner";
import { CustomerShell, PageTitle } from "@/components/morrow/customer-shell";
import { AddItemDialog, InventoryDrawer, InventoryRoom, InventoryRow } from "@/components/morrow/inventory";
import { EmptyState, Hand } from "@/components/morrow/ui";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { catalogueQ, inventoryQ, moveQ } from "@/lib/morrow/queries";
import * as api from "@/lib/morrow/api";
import type { InventoryItem } from "@/lib/morrow/types";

export const Route = createFileRoute("/inventory")({
  head: () => ({
    meta: [
      { title: "Your inventory — Morrow" },
      { name: "description", content: "Review the items we found in your photos before we plan your move." },
      { property: "og:title", content: "Your inventory — Morrow" },
      { property: "og:description", content: "Have a quick look and make any changes." },
    ],
  }),
  component: Inventory,
});

const ROOM_ORDER = ["Living room", "Dining room", "Kitchen", "Bedroom", "Office", "Garage", "Loft"];

function Inventory() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const inv = useQuery(inventoryQ);
  const { data: catalogue = [] } = useQuery(catalogueQ);
  const { data: move } = useQuery(moveQ);
  const [openId, setOpenId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const catById = useMemo(() => new Map(catalogue.map((c) => [c.id, c])), [catalogue]);

  const setItems = (fn: (items: InventoryItem[]) => InventoryItem[]) => qc.setQueryData(inventoryQ.queryKey, (old: InventoryItem[] = []) => fn(old));
  const update = useMutation({ mutationFn: api.updateInventory, onMutate: (it) => setItems((xs) => xs.map((x) => (x.id === it.id ? it : x))) });
  const del = useMutation({
    mutationFn: api.deleteInventoryItem,
    onMutate: (id) => { const prev = qc.getQueryData<InventoryItem[]>(inventoryQ.queryKey); setItems((xs) => xs.filter((x) => x.id !== id)); return { prev }; },
    onSuccess: (_d, _id, ctx) => toast("Item removed", { action: { label: "Undo", onClick: async () => { const it = ctx?.prev?.find((x) => x.id === _id); if (it) { await api.addInventoryItem(it.catalogueId === "custom" ? null : it.catalogueId, it.room, it.name); qc.invalidateQueries({ queryKey: inventoryQ.queryKey }); } } } }),
  });
  const add = useMutation({
    mutationFn: ({ id, room, custom }: { id: string | null; room: string; custom?: string }) => api.addInventoryItem(id, room, custom),
    onSuccess: (it) => { setItems((xs) => [...xs, it]); toast(`${it.name} added to ${it.room}`); },
  });
  const confirm = useMutation({
    mutationFn: api.confirmInventory,
    onSuccess: () => { qc.invalidateQueries(); toast.success("Inventory confirmed ✓"); nav({ to: "/home" }); },
  });

  const items = inv.data ?? [];
  const rooms = useMemo(() => {
    const set = [...new Set(items.map((i) => i.room))];
    return set.sort((a, b) => ROOM_ORDER.indexOf(a) - ROOM_ORDER.indexOf(b));
  }, [items]);
  const review = items.filter((i) => i.review);
  const openItem = items.find((i) => i.id === openId) ?? null;

  return (
    <CustomerShell
      step="inventory"
      footer={items.length ? (
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="text-sm font-medium">Did we get everything?</p>
            <p className="text-xs text-muted-foreground">{review.length ? `${review.length} item${review.length > 1 ? "s" : ""} need${review.length > 1 ? "" : "s"} a look` : `${items.reduce((s, i) => s + i.qty, 0)} items across ${rooms.length} rooms`}</p>
          </div>
          <Button size="lg" onClick={() => confirm.mutate()} disabled={confirm.isPending}>{confirm.isPending ? "Saving…" : <>Confirm inventory <ArrowRight /></>}</Button>
        </div>
      ) : undefined}
    >
      <PageTitle title="Your inventory" sub="We found these items in your photos. Have a quick look and make any changes before we plan your move." />

      {inv.isLoading ? (
        <div className="space-y-4">{[0, 1].map((i) => <Skeleton key={i} className="h-48 w-full" />)}</div>
      ) : !move?.analysed && !items.length ? (
        <EmptyState title="No inventory yet" body="Upload a few photos of your home and we'll put a list together for you." action={<Button asChild><Link to="/upload">Add photos</Link></Button>} />
      ) : (
        <div className="space-y-4">
          {review.length > 0 && (
            <div className="rounded-lg border border-amber/30 bg-amber-soft px-4 py-3.5">
              <p className="text-sm font-medium">{review.length} item{review.length > 1 ? "s" : ""} need review</p>
              <ul className="mt-1.5 space-y-1 text-sm">
                {review.map((r) => (
                  <li key={r.id}><button className="text-left underline decoration-amber/50 underline-offset-4" onClick={() => setOpenId(r.id)}><span className="font-medium">{r.name}</span> — {r.review}</button></li>
                ))}
              </ul>
            </div>
          )}
          {rooms.map((room) => {
            const list = items.filter((i) => i.room === room);
            return (
              <InventoryRoom key={room} room={room} count={list.reduce((s, i) => s + i.qty, 0)}>
                {list.map((it) => (
                  <InventoryRow key={it.id} item={it} cat={catById.get(it.catalogueId)} onQty={(n) => update.mutate({ ...it, qty: n })} onOpen={() => setOpenId(it.id)} />
                ))}
              </InventoryRoom>
            );
          })}
          <div className="rounded-lg border border-dashed border-taupe/60 px-5 py-6 text-center">
            <p className="font-medium">Did we miss anything?</p>
            <p className="mt-1 text-sm text-muted-foreground">Things in cupboards, the loft or the garage often hide from photos.</p>
            <Button variant="outline" className="mt-4" onClick={() => setAdding(true)}><Plus /> Add item</Button>
            <p className="mt-4"><Hand>give it a quick once-over</Hand></p>
          </div>
          {!review.length && <p className="flex items-center justify-center gap-1.5 text-sm text-sage"><Check className="size-4" /> Nothing needs checking</p>}
        </div>
      )}

      <InventoryDrawer
        item={openItem} cat={openItem ? catById.get(openItem.catalogueId) : undefined} rooms={[...new Set([...rooms, ...ROOM_ORDER])]}
        open={!!openItem} onOpenChange={(o) => !o && setOpenId(null)}
        onSave={(it) => { update.mutate(it); toast("Changes saved"); }} onDelete={(id) => del.mutate(id)}
      />
      <AddItemDialog open={adding} onOpenChange={setAdding} catalogue={catalogue} rooms={rooms.length ? rooms : ["Living room"]} onAdd={(id, room, custom) => add.mutate({ id, room, custom })} />
    </CustomerShell>
  );
}
