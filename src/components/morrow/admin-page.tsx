import type { ReactNode } from "react";

export function AdminPage({ title, sub, actions, children }: { title: string; sub?: ReactNode; actions?: ReactNode; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-[1200px] px-5 py-7 lg:px-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.025em]">{title}</h1>
          {sub && <p className="mt-1 text-sm text-muted-foreground">{sub}</p>}
        </div>
        {actions && <div className="flex gap-2">{actions}</div>}
      </header>
      {children}
    </div>
  );
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="bg-card px-5 py-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="tabular mt-1 text-[1.75rem] font-semibold tracking-[-0.02em]">{value}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function StatRow({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-4">{children}</div>;
}
