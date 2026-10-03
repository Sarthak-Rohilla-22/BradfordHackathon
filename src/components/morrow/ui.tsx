import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { JobStatus } from "@/lib/morrow/types";

export function Logo({ className, to = "/" }: { className?: string; to?: string }) {
  return (
    <Link to={to} className={cn("inline-flex items-baseline gap-1.5 text-foreground", className)} aria-label="Morrow home">
      <svg viewBox="0 0 24 24" className="size-5 self-center" aria-hidden>
        <path d="M2 17h20" stroke="currentColor" strokeWidth="1.6" fill="none" />
        <path d="M6 17a6 6 0 0 1 12 0" stroke="currentColor" strokeWidth="1.6" fill="none" />
        <path d="M12 6V3.5M5 9.2 3.4 7.6M19 9.2l1.6-1.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      <span className="text-[1.15rem] font-semibold tracking-[-0.02em]">morrow</span>
    </Link>
  );
}

export function Hand({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("hand inline-block -rotate-2", className)}>{children}</span>;
}

type Tone = "neutral" | "sage" | "amber" | "error" | "dark" | "outline";
const TONES: Record<Tone, string> = {
  neutral: "bg-muted text-muted-foreground",
  sage: "bg-sage-soft text-sage",
  amber: "bg-amber-soft text-amber",
  error: "bg-error-soft text-destructive",
  dark: "bg-primary text-primary-foreground",
  outline: "border border-border text-muted-foreground",
};
export function Tag({ tone = "neutral", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={cn("inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[0.7rem] font-medium leading-4", TONES[tone], className)}>{children}</span>;
}

export function DataBadge({ state }: { state: "estimated" | "confirmed" | "review" | "action" }) {
  if (state === "confirmed") return <Tag tone="sage">Confirmed</Tag>;
  if (state === "review") return <Tag tone="amber">Needs review</Tag>;
  if (state === "action") return <Tag tone="error">Action required</Tag>;
  return <Tag tone="neutral">Estimated</Tag>;
}

const STATUS_TONE: Record<JobStatus, Tone> = {
  New: "outline", "Needs review": "amber", Estimating: "neutral", "Quote ready": "neutral",
  Confirmed: "sage", "In progress": "dark", Completed: "outline", Cancelled: "error",
};
export function StatusBadge({ status }: { status: JobStatus }) {
  return (
    <Tag tone={STATUS_TONE[status]}>
      <span className="size-1.5 rounded-full bg-current opacity-70" aria-hidden />
      {status}
    </Tag>
  );
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-card/60 px-6 py-12 text-center">
      <p className="font-medium">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{body}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ title = "Something went wrong", body, onRetry }: { title?: string; body: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="rounded-lg border border-destructive/30 bg-error-soft px-5 py-4">
      <p className="font-medium text-destructive">{title}</p>
      <p className="mt-1 text-sm text-foreground/80">{body}</p>
      {onRetry && <button onClick={onRetry} className="mt-3 text-sm font-medium underline underline-offset-4">Try again</button>}
    </div>
  );
}

export function Section({ title, children, aside, className }: { title?: string; children: ReactNode; aside?: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-lg border border-border bg-card", className)}>
      {title && (
        <header className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 className="text-sm font-semibold">{title}</h2>
          {aside}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export const gbp = (n: number) => `£${n.toLocaleString("en-GB")}`;
export const ukDate = (iso: string, opts: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "long" }) =>
  new Date(iso + "T12:00:00").toLocaleDateString("en-GB", opts);
export const fmtDims = (d: { l: number; w: number; h: number }) => `${d.l} × ${d.w} × ${d.h} cm`;
