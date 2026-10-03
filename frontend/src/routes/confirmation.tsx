import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { CalendarPlus, Phone } from "lucide-react";
import { CustomerShell } from "@/components/morrow/customer-shell";
import { EmptyState, Hand, gbp, ukDate } from "@/components/morrow/ui";
import { Button } from "@/components/ui/button";
import { jobsQ, moveQ } from "@/lib/morrow/queries";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import * as api from "@/lib/morrow/api";

export const Route = createFileRoute("/confirmation")({
  head: () => ({
    meta: [
      { title: "You're booked — Morrow" },
      { name: "description", content: "Your move is confirmed." },
      { property: "og:title", content: "You're booked — Morrow" },
      { property: "og:description", content: "See you on moving day." },
    ],
  }),
  component: Confirmation,
});

function Confirmation() {
  const qc = useQueryClient();
  const nav = useNavigate();
  const { data: move } = useQuery(moveQ);
  const { data: jobs } = useQuery(jobsQ);
  const job = jobs?.find((j) => j.ref === move?.bookingRef);
  if (move && !job && jobs) return <CustomerShell><EmptyState title="No booking yet" body="Once you confirm a move, its details appear here." action={<Button asChild><Link to="/start">Start your move</Link></Button>} /></CustomerShell>;

  function ics() {
    if (!job) return;
    const d = job.date.replace(/-/g, "");
    const body = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:Morrow move ${job.ref}\nDTSTART:${d}T${job.start.replace(":", "")}00\nDTEND:${d}T${job.end.replace(":", "")}00\nLOCATION:${job.origin} to ${job.destination}\nEND:VEVENT\nEND:VCALENDAR`;
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([body], { type: "text/calendar" })); a.download = `${job.ref}.ics`; a.click();
  }

  return (
    <CustomerShell>
      {job && (
        <div className="mx-auto max-w-md pt-6 text-center">
          <motion.svg viewBox="0 0 52 52" className="mx-auto size-14 text-sage" aria-hidden>
            <motion.circle cx="26" cy="26" r="24" fill="none" stroke="currentColor" strokeWidth="2" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6 }} />
            <motion.path d="M15 27l7 7 15-16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.5, duration: 0.4 }} />
          </motion.svg>
          <h1 className="mt-5 text-3xl font-semibold tracking-[-0.03em]">You're booked.</h1>
          <p className="mt-2 text-sm text-muted-foreground">This booking is locked in — to change it, contact us.</p>
          <p className="mt-2 text-muted-foreground">Booking reference <span className="tabular font-medium text-foreground">{job.ref}</span></p>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="mt-8 rounded-lg border border-border bg-card p-5 text-left">
            <p className="text-lg font-semibold">{job.origin} → {job.destination}</p>
            <p className="text-muted-foreground">{ukDate(job.date)} · {job.start}–{job.end}</p>
            <p className="tabular mt-4 text-sm">{job.crew} movers · {job.vehicle}</p>
            <p className="tabular mt-3 text-2xl font-semibold">{gbp(job.quote)}</p>
          </motion.div>
          <Hand className="mt-6">see you on moving day</Hand>
          <div className="mt-8 grid gap-2">
            <Button size="lg" onClick={ics}><CalendarPlus /> Add to calendar</Button>
            <Button size="lg" variant="outline" onClick={async () => { await api.createMove(); qc.invalidateQueries(); nav({ to: "/start" }); }}>Plan another move</Button>
            <Button size="lg" variant="ghost" asChild><a href="tel:01130000000"><Phone /> Contact Morrow</a></Button>
          </div>
          <p className="mt-10 text-xs text-muted-foreground">Running the demo? <Link to="/admin/jobs/$id" params={{ id: job.id }} className="underline">See this job in the company dashboard</Link></p>
        </div>
      )}
    </CustomerShell>
  );
}
