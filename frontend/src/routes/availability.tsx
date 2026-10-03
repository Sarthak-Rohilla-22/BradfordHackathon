import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import { CustomerShell, PageTitle } from "@/components/morrow/customer-shell";
import { ErrorState, ukDate } from "@/components/morrow/ui";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { availabilityQ, moveQ } from "@/lib/morrow/queries";
import * as api from "@/lib/morrow/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/availability")({
  head: () => ({
    meta: [
      { title: "Choose a date — Morrow" },
      { name: "description", content: "Pick an available slot for your move." },
      { property: "og:title", content: "Choose a date — Morrow" },
      { property: "og:description", content: "Live crew and vehicle availability." },
    ],
  }),
  component: Availability,
});

function Availability() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const q = useQuery(availabilityQ);
  const { data: move } = useQuery(moveQ);
  const dates = useMemo(() => [...new Set((q.data ?? []).map((s) => s.date))], [q.data]);
  const [date, setDate] = useState<string>("");
  const [slotId, setSlotId] = useState<string>("");
  useEffect(() => {
    if (!q.data) return;
    const selected = q.data.find((slot) => slot.id === move?.slot?.id && slot.available);
    const firstAvailable = q.data.find((slot) => slot.available);
    const initial = selected ?? firstAvailable;
    setDate(initial?.date ?? move?.slot?.date ?? dates[0] ?? "");
    setSlotId(initial?.id ?? "");
  }, [q.data, move?.slot?.id, move?.slot?.date, dates]);
  const slots = (q.data ?? []).filter((s) => s.date === date);
  const chosen = q.data?.find((s) => s.id === slotId && s.available);

  async function next() {
    if (!chosen) return;
    await api.selectSlot(chosen);
    qc.invalidateQueries();
    nav({ to: "/quote" });
  }

  return (
    <CustomerShell step="quote" footer={<Button size="lg" className="w-full" disabled={!chosen} onClick={next}>{chosen ? <>See your quote <ArrowRight /></> : "Pick a time"}</Button>}>
      <PageTitle title="When would you like to move?" sub="These times reflect our crew and vehicles right now." />
      {q.isLoading ? <Skeleton className="h-72 w-full" /> : q.isError ? <ErrorState body="We couldn't load availability." onRetry={() => q.refetch()} /> : (
        <>
          <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-2" role="tablist" aria-label="Dates">
            {dates.map((d) => {
              const free = (q.data ?? []).filter((s) => s.date === d && s.available).length;
              return (
                <button key={d} role="tab" aria-selected={d === date} onClick={() => { setDate(d); setSlotId(""); }}
                  className={cn("flex min-w-[4.5rem] flex-col items-center rounded-md border px-3 py-2.5", d === date ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card", !free && "opacity-50")}>
                  <span className="text-[0.7rem] uppercase tracking-wider opacity-80">{ukDate(d, { weekday: "short" })}</span>
                  <span className="tabular text-xl font-semibold">{ukDate(d, { day: "numeric" })}</span>
                  <span className="text-[0.7rem] opacity-80">{ukDate(d, { month: "short" })}</span>
                </button>
              );
            })}
          </div>
          <h2 className="mb-3 mt-6 font-medium">{date && ukDate(date)}</h2>
          <ul className="space-y-2" role="radiogroup" aria-label="Times">
            {slots.map((s) => (
              <li key={s.id}>
                <button role="radio" aria-checked={s.id === slotId} disabled={!s.available} onClick={() => setSlotId(s.id)}
                  className={cn("flex w-full items-center justify-between rounded-md border px-4 py-3.5 text-left transition-colors", s.id === slotId ? "border-primary bg-accent" : "border-border bg-card hover:border-taupe", !s.available && "cursor-not-allowed bg-muted text-muted-foreground hover:border-border")}>
                  <span className="tabular font-medium">{s.start}–{s.end}</span>
                  <span className="text-sm">{s.available ? "Available" : "Unavailable"}</span>
                </button>
              </li>
            ))}
          </ul>
          {!slots.some((s) => s.available) && <p className="mt-4 text-sm text-muted-foreground">No times left on this day — try another date.</p>}
        </>
      )}
    </CustomerShell>
  );
}
