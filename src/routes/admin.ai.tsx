import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AdminPage, Stat, StatRow } from "@/components/morrow/admin-page";
import { EmptyState, Section, Tag } from "@/components/morrow/ui";
import { jobsQ } from "@/lib/morrow/queries";

export const Route = createFileRoute("/admin/ai")({
  head: () => ({ meta: [{ title: "AI Operations — Morrow" }, { name: "description", content: "What the vision model did, and what people corrected." }, { property: "og:title", content: "AI Operations — Morrow" }, { property: "og:description", content: "Vision results and human corrections." }] }),
  component: Ai,
});

function Ai() {
  const { data = [] } = useQuery(jobsQ);
  const withInv = data.filter((j) => j.move?.inventory.length);
  const items = withInv.flatMap((j) => j.move!.inventory.map((i) => ({ ...i, job: j })));
  const ai = items.filter((i) => i.addedBy === "ai");
  return (
    <AdminPage title="AI Operations" sub="Gemma handles recognition, counting, room classification and approximate sizes. Volumes, crew, vehicles and prices come from your catalogue and rules.">
      <StatRow>
        <Stat label="Images analysed" value={withInv.reduce((s, j) => s + (j.move!.photos.length || 4), 0)} />
        <Stat label="Items detected" value={ai.length} />
        <Stat label="Confirmed by customers" value={items.filter((i) => i.dimsSource === "confirmed").length} />
        <Stat label="Needs review" value={items.filter((i) => i.review).length} />
      </StatRow>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Section title="Responsibilities">
          <ul className="space-y-2 text-sm">
            {[["Object recognition & counting", "AI"], ["Room classification", "AI"], ["Approximate dimensions", "AI · customer verifies"], ["Volume & weight", "Item Catalogue"], ["Vehicle & crew", "Logistics rules"], ["Price", "Pricing Rules"], ["Availability", "Calendar"]].map(([k, v]) => <li key={k} className="flex justify-between"><span>{k}</span><Tag tone={v.startsWith("AI") ? "neutral" : "sage"}>{v}</Tag></li>)}
          </ul>
        </Section>
        <Section title="Recent jobs with photo inventories">
          {withInv.length ? <ul className="divide-y divide-border text-sm">{withInv.map((j) => <li key={j.id} className="flex justify-between py-2"><Link to="/admin/jobs/$id" params={{ id: j.id }} className="hover:underline">{j.ref} · {j.customer}</Link><span className="text-muted-foreground">{j.move!.inventory.length} lines</span></li>)}</ul>
            : <EmptyState title="No photo inventories yet" body="Complete a booking in the customer flow and it will appear here." />}
        </Section>
      </div>
    </AdminPage>
  );
}
