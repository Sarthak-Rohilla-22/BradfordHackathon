import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { moveQ } from "@/lib/morrow/queries";
import { signOut, useSession } from "@/lib/morrow/auth";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Logo } from "./ui";
import { Check } from "lucide-react";

const STEPS = [
  { key: "photos", label: "Photos", to: "/upload" },
  { key: "inventory", label: "Inventory", to: "/inventory" },
  { key: "home", label: "Home", to: "/home" },
  { key: "quote", label: "Quote", to: "/quote" },
  { key: "book", label: "Book", to: "/booking" },
] as const;
export type StepKey = (typeof STEPS)[number]["key"];

export function ProgressSteps({ current }: { current: StepKey }) {
  const idx = STEPS.findIndex((s) => s.key === current);
  return (
    <nav aria-label="Move progress">
      <ol className="flex items-center gap-1.5">
        {STEPS.map((s, i) => {
          const done = i < idx;
          const active = i === idx;
          return (
            <li key={s.key} className="flex flex-1 flex-col gap-1.5" aria-current={active ? "step" : undefined}>
              <div className={cn("h-[3px] rounded-full transition-colors", done || active ? "bg-primary" : "bg-border")} />
              <span className={cn("hidden items-center gap-1 text-[0.7rem] sm:flex", active ? "font-medium text-foreground" : "text-muted-foreground")}>
                {done && <Check className="size-3" />}
                {done ? <Link to={s.to} className="hover:underline">{s.label}</Link> : s.label}
              </span>
            </li>
          );
        })}
      </ol>
      <p className="mt-1.5 text-[0.7rem] text-muted-foreground sm:hidden">
        Step {idx + 1} of {STEPS.length} · <span className="text-foreground">{STEPS[idx].label}</span>
      </p>
    </nav>
  );
}

export function CustomerShell({ step, children, footer, wide }: { step?: StepKey; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  const nav = useNavigate();
  const session = useSession();
  const { data: move } = useQuery(moveQ);
  const locked = !!step && !!move?.bookingRef;
  // Once booked, the planning steps are closed — always land on the confirmation.
  useEffect(() => { if (locked) nav({ to: "/confirmation", replace: true }); }, [locked, nav]);
  if (locked) return <div className="min-h-dvh bg-background" />;
  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/92 backdrop-blur-sm">
        <div className={cn("mx-auto px-5 py-3.5", wide ? "max-w-5xl" : "max-w-2xl")}>
          <div className="flex items-center justify-between">
            <Logo />
            <div className="flex items-center gap-4 text-sm">
              <Link to="/voice" className="text-muted-foreground hover:text-foreground">Talk to Morrow</Link>
              {session ? (
                <button onClick={signOut} className="flex items-center gap-2 text-muted-foreground hover:text-foreground" title="Sign out">
                  <span className="grid size-7 place-items-center rounded-full bg-beige text-xs font-medium text-foreground">{session.name[0]}</span>
                </button>
              ) : <Link to="/auth" className="text-muted-foreground hover:text-foreground">Sign in</Link>}
            </div>
          </div>
          {step && <div className="mt-3"><ProgressSteps current={step} /></div>}
        </div>
      </header>
      <motion.main
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.2, 0.7, 0.2, 1] }}
        className={cn("mx-auto px-5 pb-36 pt-8", wide ? "max-w-5xl" : "max-w-2xl")}
      >
        {children}
      </motion.main>
      {footer && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 backdrop-blur-sm">
          <div className={cn("mx-auto px-5 py-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom))]", wide ? "max-w-5xl" : "max-w-2xl")}>{footer}</div>
        </div>
      )}
    </div>
  );
}

export function PageTitle({ title, sub, hand }: { title: string; sub?: string; hand?: string }) {
  return (
    <div className="mb-8">
      <h1 className="text-[1.85rem] font-semibold leading-tight tracking-[-0.025em] sm:text-[2.2rem]">{title}</h1>
      {sub && <p className="mt-2 max-w-lg text-[0.95rem] leading-relaxed text-muted-foreground">{sub}</p>}
      {hand && <p className="mt-3"><span className="hand inline-block -rotate-2">{hand}</span></p>}
    </div>
  );
}
