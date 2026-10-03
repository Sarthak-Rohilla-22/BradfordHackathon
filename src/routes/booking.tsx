import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CustomerShell, PageTitle } from "@/components/morrow/customer-shell";
import { ErrorState, gbp, ukDate } from "@/components/morrow/ui";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { quoteQ } from "@/lib/morrow/queries";
import * as api from "@/lib/morrow/api";

export const Route = createFileRoute("/booking")({
  head: () => ({
    meta: [
      { title: "Review your booking — Morrow" },
      { name: "description", content: "Check the details before you confirm your move." },
      { property: "og:title", content: "Review your booking — Morrow" },
      { property: "og:description", content: "One last look before you're booked." },
    ],
  }),
  component: Booking,
});

function Booking() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const q = useQuery(quoteQ);
  const book = useMutation({ mutationFn: api.createBooking, onSuccess: () => { qc.invalidateQueries(); nav({ to: "/confirmation", replace: true }); } });
  const d = q.data;
  const rows = d ? [
    ["Move", `${d.move.origin} → ${d.move.destination}`],
    ["Date", d.move.slot ? ukDate(d.move.slot.date) : "Not chosen"],
    ["Time", d.move.slot ? `${d.move.slot.start}–${d.move.slot.end}` : "—"],
    ["Crew", `${d.logistics.crew} movers`],
    ["Vehicle", d.logistics.vehicle],
    ["Inventory", `${d.logistics.volume} m³`],
    ["Services", d.logistics.dismantleItems ? `Dismantling (${d.logistics.dismantleItems} item${d.logistics.dismantleItems > 1 ? "s" : ""})` : "Standard move"],
    ["Price", gbp(d.quote.total)],
  ] : [];
  return (
    <CustomerShell step="book" footer={d && <Button size="lg" className="w-full" disabled={!d.move.slot || book.isPending} onClick={() => book.mutate()}>{book.isPending ? "Booking…" : "Confirm booking"}</Button>}>
      <PageTitle title="You're nearly there." sub="Have a final look. You'll get a confirmation by email." />
      {q.isLoading ? <Skeleton className="h-80 w-full" /> : !d ? <ErrorState body="We couldn't load your booking." onRetry={() => q.refetch()} /> : (
        <>
          <dl className="divide-y divide-border rounded-lg border border-border bg-card px-5">
            {rows.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 py-3.5"><dt className="text-muted-foreground">{k}</dt><dd className={k === "Price" ? "tabular text-lg font-semibold" : "tabular text-right font-medium"}>{v}</dd></div>
            ))}
          </dl>
          {!d.move.slot && <p className="mt-4 text-sm">Please <Link to="/availability" className="underline">choose a date</Link> first.</p>}
          {book.isError && <div className="mt-4"><ErrorState body="That slot was just taken. Please choose another time." /></div>}
          <p className="mt-5 text-xs leading-relaxed text-muted-foreground">Booking for {d.move.customerName || "you"} · {d.move.email}. Free cancellation up to 48 hours before your move.</p>
        </>
      )}
    </CustomerShell>
  );
}
