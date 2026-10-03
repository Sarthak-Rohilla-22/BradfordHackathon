import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AdminPage } from "@/components/morrow/admin-page";
import { Tag } from "@/components/morrow/ui";
import { Skeleton } from "@/components/ui/skeleton";
import { crewQ } from "@/lib/morrow/queries";

export const Route = createFileRoute("/admin/crew")({
  head: () => ({ meta: [{ title: "Crew — Morrow" }, { name: "description", content: "Crew availability and skills." }, { property: "og:title", content: "Crew — Morrow" }, { property: "og:description", content: "Crew availability and skills." }] }),
  component: Crew,
});

function Crew() {
  const { data, isLoading } = useQuery(crewQ);
  return (
    <AdminPage title="Crew" sub={data ? `${data.filter((c) => c.status === "Available").length} available today` : ""}>
      {isLoading ? <Skeleton className="h-64" /> : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {data?.map((c) => (
            <article key={c.id} className="rounded-lg border border-border bg-card p-5">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-full bg-beige text-sm font-medium">{c.name.split(" ").map((x) => x[0]).join("")}</span>
                <div><p className="font-medium">{c.name}</p><p className="text-xs text-muted-foreground">{c.role}</p></div>
              </div>
              <p className="mt-4"><Tag tone={c.status === "Available" ? "sage" : c.status === "Assigned" ? "dark" : "outline"}>{c.status}{c.assignment ? ` · ${c.assignment}` : ""}</Tag></p>
              <div className="mt-3 flex flex-wrap gap-1">{c.skills.map((s) => <Tag key={s} tone="outline">{s}</Tag>)}</div>
              <p className="tabular mt-3 text-xs text-muted-foreground">{c.phone}</p>
            </article>
          ))}
        </div>
      )}
    </AdminPage>
  );
}
