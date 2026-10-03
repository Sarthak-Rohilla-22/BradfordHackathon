import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AdminPage, Stat, StatRow } from "@/components/morrow/admin-page";
import { EmptyState, Hand, Section, StatusBadge, ukDate } from "@/components/morrow/ui";
import { Skeleton } from "@/components/ui/skeleton";
import { jobsQ, memoriesQ, vehiclesQ } from "@/lib/morrow/queries";
import { isoDay } from "@/lib/morrow/data";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Overview — Morrow" }, { name: "description", content: "Today's moves at a glance." }, { property: "og:title", content: "Overview — Morrow" }, { property: "og:description", content: "Today's moves at a glance." }] }),
  component: Dashboard,
});

function greeting() { const h = new Date().getHours(); return h < 12 ? "Good morning." : h < 18 ? "Good afternoon." : "Good evening."; }

function Dashboard() {
  const { data: jobs, isLoading } = useQuery(jobsQ);
  const { data: vehicles } = useQuery(vehiclesQ);
  const { data: memories } = useQuery(memoriesQ);
  const today = isoDay(0);
  const todays = (jobs ?? []).filter((j) => j.date === today && j.status !== "Cancelled").sort((a, b) => a.start.localeCompare(b.start));
  const review = (jobs ?? []).filter((j) => j.status === "Needs review" || j.status === "New");
  const recent = (jobs ?? []).filter((j) => j.move).slice(0, 3);

  return (
    <AdminPage title={greeting()} sub={ukDate(today)}>
      {isLoading ? <Skeleton className="h-24 w-full" /> : (
        <StatRow>
          <Stat label="Jobs today" value={todays.length} />
          <Stat label="Confirmed" value={todays.filter((j) => j.status === "Confirmed").length} />
          <Stat label="In progress" value={todays.filter((j) => j.status === "In progress").length} />
          <Stat label="Awaiting review" value={review.length} />
        </StatRow>
      )}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Section title="Today's schedule" aside={<Link to="/admin/calendar" className="text-xs text-muted-foreground hover:text-foreground">Calendar →</Link>}>
          {isLoading ? <Skeleton className="h-40" /> : todays.length ? (
            <ol className="-my-2 divide-y divide-border">
              {todays.map((j) => (
                <li key={j.id}>
                  <Link to="/admin/jobs/$id" params={{ id: j.id }} className="grid grid-cols-[3.5rem_1fr_auto] items-start gap-4 py-3 hover:bg-muted/50">
                    <span className="tabular text-sm font-medium">{j.start}</span>
                    <span><span className="block font-medium">{j.customer}</span><span className="block text-sm text-muted-foreground">{j.origin} → {j.destination}</span><span className="block text-xs text-muted-foreground">{j.crew} movers · {j.vehicle}</span></span>
                    <StatusBadge status={j.status} />
                  </Link>
                </li>
              ))}
            </ol>
          ) : <EmptyState title="No upcoming jobs" body="Your next confirmed move will appear here." />}
        </Section>
        <div className="space-y-6">
          <Section title="New from customers">
            {recent.length ? (
              <ul className="-my-2 divide-y divide-border">
                {recent.map((j) => (
                  <li key={j.id}><Link to="/admin/jobs/$id" params={{ id: j.id }} className="flex items-center justify-between py-2.5 text-sm hover:underline"><span><span className="font-medium">{j.ref}</span> · {j.origin} → {j.destination}</span><StatusBadge status={j.status} /></Link></li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted-foreground">Bookings made through your Morrow page land here instantly. <Hand className="text-lg">try the customer flow</Hand></p>}
          </Section>
          <Section title="Needs attention">
            <ul className="space-y-2.5 text-sm">
              {review.map((j) => <li key={j.id}><Link to="/admin/jobs/$id" params={{ id: j.id }} className="flex justify-between hover:underline"><span>{j.customer}</span><StatusBadge status={j.status} /></Link></li>)}
              {vehicles?.filter((v) => v.status === "Maintenance").map((v) => <li key={v.id} className="flex justify-between"><span>{v.name}</span><span className="text-muted-foreground">{v.maintenance}</span></li>)}
            </ul>
          </Section>
          {memories?.[0] && (
            <Section title="From memory">
              <p className="text-sm font-medium">{memories[0].title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{memories[0].body}</p>
            </Section>
          )}
        </div>
      </div>
    </AdminPage>
  );
}
