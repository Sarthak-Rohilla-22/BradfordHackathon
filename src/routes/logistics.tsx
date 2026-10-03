import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { CustomerShell, PageTitle } from "@/components/morrow/customer-shell";
import { LogisticsGrid } from "@/components/morrow/quote";
import { AccessWarning } from "@/components/morrow/access";
import { ErrorState } from "@/components/morrow/ui";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { logisticsQ } from "@/lib/morrow/queries";

export const Route = createFileRoute("/logistics")({
  head: () => ({
    meta: [
      { title: "What your move needs — Morrow" },
      { name: "description", content: "Volume, vehicle, crew and time for your move." },
      { property: "og:title", content: "What your move needs — Morrow" },
      { property: "og:description", content: "Here's what your move needs." },
    ],
  }),
  component: LogisticsPage,
});

function LogisticsPage() {
  const q = useQuery(logisticsQ);
  const lg = q.data;
  return (
    <CustomerShell step="quote" footer={lg && <Button size="lg" className="w-full" asChild><Link to="/availability">Choose a date <ArrowRight /></Link></Button>}>
      <PageTitle title="Here's what your move needs" sub="Worked out from your confirmed inventory, your home and our crew guidelines. This is a summary — your quote comes next." />
      {q.isLoading ? <Skeleton className="h-64 w-full" /> : q.isError || !lg ? <ErrorState body="We couldn't plan your move just now." onRetry={() => q.refetch()} /> : (
        <div className="space-y-4">
          <LogisticsGrid lg={lg} />
          {lg.crew > lg.standardCrew && (
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="font-medium">Additional mover recommended</p>
              <p className="mt-1 text-sm text-muted-foreground">{lg.crewReason === "Large furniture + restricted access" ? "Large furniture and access conditions require additional handling." : `${lg.crewReason} — an extra pair of hands keeps things safe and on time.`}</p>
            </div>
          )}
          {lg.dismantleItems > 0 && (
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="font-medium">Dismantling may be required</p>
              <p className="mt-1 text-sm text-muted-foreground">The dimensions of this item and the available access suggest that it may need to be partially dismantled before removal.</p>
              <p className="mt-2 text-sm">Estimated additional service: <span className="font-medium">Dismantling</span></p>
            </div>
          )}
          {lg.accessIssues.map((i) => <AccessWarning key={i.itemId} issue={i} />)}
          {lg.accessUnknown && <p className="rounded-md bg-muted px-4 py-3 text-sm">Access needs checking for one or more doorways. We'll confirm before your move day.</p>}
          {lg.specialItems.length > 0 && <p className="rounded-md bg-amber-soft px-4 py-3 text-sm">Special handling recommended: {lg.specialItems.join(", ")}.</p>}
        </div>
      )}
    </CustomerShell>
  );
}
