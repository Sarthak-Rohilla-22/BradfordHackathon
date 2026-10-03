import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AdminPage } from "@/components/morrow/admin-page";
import { EmptyState, Tag, ukDate } from "@/components/morrow/ui";
import { Skeleton } from "@/components/ui/skeleton";
import { memoriesQ } from "@/lib/morrow/queries";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/memory")({
  head: () => ({ meta: [{ title: "Memory — Morrow" }, { name: "description", content: "Operational memory learned from past jobs." }, { property: "og:title", content: "Memory — Morrow" }, { property: "og:description", content: "Operational memory." }] }),
  component: Mem,
});

const KINDS = ["All", "Address", "AI correction", "Customer", "Operational"];

function Mem() {
  const { data, isLoading } = useQuery(memoriesQ);
  const [k, setK] = useState("All");
  const list = (data ?? []).filter((m) => k === "All" || m.kind === k);
  return (
    <AdminPage title="Memory" sub="OpenLoft keeps what your team learns. Your database stays the record of truth.">
      <div className="mb-5 flex flex-wrap gap-1">{KINDS.map((x) => <button key={x} onClick={() => setK(x)} className={cn("rounded px-3 py-1.5 text-sm", k === x ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground")}>{x}</button>)}</div>
      {isLoading ? <Skeleton className="h-80" /> : !list.length ? <EmptyState title="No saved memories" body="Useful operational memories will appear here as Morrow learns from completed jobs." /> : (
        <ol className="relative max-w-2xl space-y-6 border-l border-border pl-7">
          {list.map((m) => (
            <li key={m.id} className="relative">
              <span className="absolute -left-[2.1rem] top-1.5 size-3 rounded-full border-2 border-background bg-taupe" />
              <p className="text-xs text-muted-foreground">{ukDate(m.date, { day: "numeric", month: "short", year: "numeric" })} · {m.source}</p>
              <div className="mt-1.5 rounded-lg border border-border bg-card p-4">
                <div className="flex items-center justify-between"><p className="font-medium">{m.title}</p><Tag>{m.kind}</Tag></div>
                <p className="mt-1.5 text-sm text-muted-foreground">{m.body}</p>
                {m.action && <p className="mt-2 text-sm"><span className="text-muted-foreground">Suggested action:</span> {m.action}</p>}
              </div>
            </li>
          ))}
        </ol>
      )}
    </AdminPage>
  );
}
