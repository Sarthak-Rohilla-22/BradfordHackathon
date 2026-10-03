import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AdminPage, Stat, StatRow } from "@/components/morrow/admin-page";
import { StatusBadge, gbp, ukDate } from "@/components/morrow/ui";
import { Skeleton } from "@/components/ui/skeleton";
import { jobsQ } from "@/lib/morrow/queries";

export const Route = createFileRoute("/admin/quotes")({
  head: () => ({ meta: [{ title: "Quotes — Morrow" }, { name: "description", content: "Quotes issued by the pricing engine." }, { property: "og:title", content: "Quotes — Morrow" }, { property: "og:description", content: "Quotes issued by the pricing engine." }] }),
  component: Quotes,
});

function Quotes() {
  const { data, isLoading } = useQuery(jobsQ);
  const q = (data ?? []).filter((j) => j.quote > 0);
  const won = q.filter((j) => ["Confirmed", "In progress", "Completed"].includes(j.status));
  return (
    <AdminPage title="Quotes" sub="Every figure here came from your Pricing Rules.">
      {isLoading ? <Skeleton className="h-80" /> : (
        <>
          <StatRow>
            <Stat label="Quotes issued" value={q.length} />
            <Stat label="Booked" value={won.length} />
            <Stat label="Conversion" value={`${q.length ? Math.round((won.length / q.length) * 100) : 0}%`} />
            <Stat label="Booked value" value={gbp(won.reduce((s, j) => s + j.quote, 0))} />
          </StatRow>
          <ul className="mt-6 divide-y divide-border rounded-lg border border-border bg-card">
            {q.map((j) => (
              <li key={j.id}><Link to="/admin/jobs/$id" params={{ id: j.id }} className="grid grid-cols-[5rem_1fr_auto_auto] items-center gap-4 px-4 py-3 text-sm hover:bg-muted/50">
                <span className="tabular text-muted-foreground">{j.ref}</span>
                <span><span className="font-medium">{j.customer}</span> · {j.origin} → {j.destination} <span className="text-muted-foreground">· {ukDate(j.date, { day: "numeric", month: "short" })}</span></span>
                <StatusBadge status={j.status} />
                <span className="tabular w-16 text-right font-medium">{gbp(j.quote)}</span>
              </Link></li>
            ))}
          </ul>
        </>
      )}
    </AdminPage>
  );
}
