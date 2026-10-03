import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { CustomerShell, PageTitle } from "@/components/morrow/customer-shell";
import { QuoteBreakdown } from "@/components/morrow/quote";
import { ErrorState, ukDate } from "@/components/morrow/ui";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { quoteQ } from "@/lib/morrow/queries";

export const Route = createFileRoute("/quote")({
  head: () => ({
    meta: [
      { title: "Your quote — Morrow" },
      { name: "description", content: "A clear, itemised quote for your move." },
      { property: "og:title", content: "Your quote — Morrow" },
      { property: "og:description", content: "Vehicle, labour, travel and services — clearly explained." },
    ],
  }),
  component: QuotePage,
});

function QuotePage() {
  const q = useQuery(quoteQ);
  const d = q.data;
  return (
    <CustomerShell step="quote" footer={d && <Button size="lg" className="w-full" asChild><Link to="/booking">Book this move <ArrowRight /></Link></Button>}>
      <PageTitle title="Your move" />
      {q.isLoading ? <Skeleton className="h-96 w-full" /> : q.isError || !d ? <ErrorState body="We couldn't prepare your quote." onRetry={() => q.refetch()} /> : (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          <div className="rounded-lg border border-border bg-card p-5">
            <p className="text-xl font-semibold tracking-[-0.02em]">{d.move.origin} → {d.move.destination}</p>
            {d.move.slot ? <p className="mt-1 text-muted-foreground">{ukDate(d.move.slot.date)} · {d.move.slot.start}–{d.move.slot.end}</p> : <Link to="/availability" className="mt-1 block text-sm underline">Choose a date</Link>}
            <p className="tabular mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm">
              <span>{d.logistics.crew} movers</span><span>{d.logistics.vehicle}</span><span>~{d.logistics.volume} m³</span><span>~{d.logistics.hours} hours</span>
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card px-5 pt-2"><QuoteBreakdown quote={d.quote} /></div>
          <Collapsible className="rounded-lg bg-muted px-5 py-4">
            <CollapsibleTrigger className="w-full text-left text-sm font-medium">How your quote is calculated ↓</CollapsibleTrigger>
            <CollapsibleContent className="pt-2 text-sm leading-relaxed text-muted-foreground">
              Your quote is based on the vehicle, crew, estimated duration, travel distance and any additional services required for your move. Prices come from our own published rates — nothing is priced per item of furniture.
            </CollapsibleContent>
          </Collapsible>
        </motion.div>
      )}
    </CustomerShell>
  );
}
