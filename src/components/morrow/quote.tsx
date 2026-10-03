import { Box, Clock, Truck, Users, Wrench } from "lucide-react";
import type { Logistics, Quote } from "@/lib/morrow/types";
import { gbp } from "./ui";

export function QuoteBreakdown({ quote }: { quote: Quote }) {
  return (
    <div>
      <dl className="tabular divide-y divide-border">
        {quote.lines.map((l) => (
          <div key={l.label} className="flex items-baseline justify-between gap-4 py-3">
            <dt><span className="font-medium">{l.label}</span><span className="block text-xs text-muted-foreground">{l.detail}</span></dt>
            <dd>{gbp(l.amount)}</dd>
          </div>
        ))}
        <div className="flex items-baseline justify-between border-t-2 border-foreground/80 py-4">
          <dt className="font-semibold">Total</dt>
          <dd className="text-2xl font-semibold tracking-[-0.02em]">{gbp(quote.total)}</dd>
        </div>
      </dl>
      {quote.manual.length > 0 && (
        <p className="rounded-md bg-amber-soft px-3.5 py-3 text-sm">Manual assessment required for {quote.manual.join(", ")}. These items aren't included above — we'll confirm before your move.</p>
      )}
    </div>
  );
}

export function LogisticsGrid({ lg, compact }: { lg: Logistics; compact?: boolean | undefined }) {
  const cells = [
    { icon: Box, label: "Approx. volume", value: `${lg.volume} m³` },
    { icon: Truck, label: "Vehicle", value: lg.vehicle },
    { icon: Users, label: "Crew", value: `${lg.crew} movers`, why: lg.crew > lg.standardCrew ? lg.crewReason : undefined },
    { icon: Clock, label: "Estimated duration", value: `~${lg.hours} hours` },
  ];
  return (
    <div className={compact ? "grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border lg:grid-cols-4" : "grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border"}>
      {cells.map((c) => (
        <div key={c.label} className="bg-card p-4">
          <c.icon className="size-4 text-taupe" strokeWidth={1.6} />
          <p className="mt-3 text-xs text-muted-foreground">{c.label}</p>
          <p className="tabular mt-0.5 text-lg font-semibold tracking-[-0.01em]">{c.value}</p>
          {c.why && <p className="mt-1 text-xs text-muted-foreground">Why? {c.why}</p>}
        </div>
      ))}
      {lg.dismantleItems > 0 && (
        <div className="col-span-2 flex items-center gap-3 bg-card p-4 lg:col-span-4">
          <Wrench className="size-4 text-taupe" strokeWidth={1.6} />
          <p className="text-sm"><span className="font-medium">Dismantling</span> · {lg.dismantleItems} item{lg.dismantleItems > 1 ? "s" : ""} may require dismantling</p>
        </div>
      )}
    </div>
  );
}
