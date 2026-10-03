import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AdminPage } from "@/components/morrow/admin-page";
import { Tag } from "@/components/morrow/ui";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { customersQ, memoriesQ } from "@/lib/morrow/queries";

export const Route = createFileRoute("/admin/customers")({
  head: () => ({ meta: [{ title: "Customers — Morrow" }, { name: "description", content: "Customer records." }, { property: "og:title", content: "Customers — Morrow" }, { property: "og:description", content: "Customer records." }] }),
  component: Customers,
});

function Customers() {
  const { data, isLoading } = useQuery(customersQ);
  const { data: mem = [] } = useQuery(memoriesQ);
  const [q, setQ] = useState("");
  const rows = (data ?? []).filter((c) => `${c.name} ${c.email} ${c.area}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <AdminPage title="Customers" sub={`${data?.length ?? "—"} customers`} actions={<Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" className="h-9 w-56 bg-card" aria-label="Search customers" />}>
      {isLoading ? <Skeleton className="h-80" /> : (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="border-b border-border text-left text-xs text-muted-foreground"><tr>{["Name", "Email", "Phone", "Previous moves", "Active booking", "Memories"].map((h) => <th key={h} className="px-4 py-2.5 font-medium">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-border">
              {rows.map((c) => {
                const m = mem.filter((x) => x.title.includes(c.name) || x.title.includes(c.area.split(",")[0])).length;
                return (
                  <tr key={c.id}>
                    <td className="px-4 py-3"><p className="font-medium">{c.name}</p><p className="text-xs text-muted-foreground">{c.area}</p></td>
                    <td className="px-4 py-3">{c.email}</td>
                    <td className="tabular px-4 py-3">{c.phone}</td>
                    <td className="tabular px-4 py-3">{c.previousMoves}</td>
                    <td className="tabular px-4 py-3">{c.activeBooking ?? <span className="text-muted-foreground">—</span>}</td>
                    <td className="px-4 py-3">{m ? <Tag>{m} saved</Tag> : <span className="text-muted-foreground">—</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </AdminPage>
  );
}
