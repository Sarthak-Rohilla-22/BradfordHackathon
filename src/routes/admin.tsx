import { createFileRoute, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import { SoftStage } from "@/components/morrow/transition";
import { signOut, useHydratedSession } from "@/lib/morrow/auth";
import { Bot, Brain, Calendar, Car, ClipboardList, Cog, LayoutGrid, Menu, PoundSterling, Receipt, Sofa, Users, UserSquare } from "lucide-react";
import { Logo } from "@/components/morrow/ui";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Morrow for removals companies" },
      { name: "description", content: "Jobs, crews, vehicles, quotes and AI operations for your removals business." },
      { property: "og:title", content: "Morrow for removals companies" },
      { property: "og:description", content: "Operations platform for removals companies." },
    ],
  }),
  component: AdminLayout,
});

const NAV = [
  [
    { to: "/admin", label: "Overview", icon: LayoutGrid, exact: true },
    { to: "/admin/jobs", label: "Jobs", icon: ClipboardList },
    { to: "/admin/calendar", label: "Calendar", icon: Calendar },
    { to: "/admin/customers", label: "Customers", icon: UserSquare },
    { to: "/admin/vehicles", label: "Vehicles", icon: Car },
    { to: "/admin/crew", label: "Crew", icon: Users },
    { to: "/admin/quotes", label: "Quotes", icon: Receipt },
  ],
  [
    { to: "/admin/ai", label: "AI Operations", icon: Bot },
    { to: "/admin/memory", label: "Memory", icon: Brain },
  ],
  [
    { to: "/admin/catalogue", label: "Item Catalogue", icon: Sofa },
    { to: "/admin/pricing", label: "Pricing Rules", icon: PoundSterling },
  ],
  [{ to: "/admin/settings", label: "Settings", icon: Cog }],
] as const;

function SideNav({ onNav }: { onNav?: () => void }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="flex h-full flex-col">
      <div className="px-5 py-5"><Logo to="/admin" /><p className="mt-0.5 text-xs text-muted-foreground">Aire Valley Removals</p></div>
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-5" aria-label="Company">
        {NAV.map((group, gi) => (
          <ul key={gi} className="space-y-0.5">
            {group.map((n) => {
              const active = "exact" in n ? path === n.to || path === n.to + "/" : path.startsWith(n.to);
              return (
                <li key={n.to}>
                  <Link to={n.to} onClick={onNav} aria-current={active ? "page" : undefined}
                    className={cn("flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors", active ? "bg-sidebar-accent font-medium text-foreground" : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground")}>
                    <n.icon className="size-4" strokeWidth={1.7} />{n.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        ))}
      </nav>
      <UserBox />
    </div>
  );
}

function UserBox() {
  const { session } = useHydratedSession();
  const nav = useNavigate();
  return (
    <div className="border-t border-sidebar-border px-4 py-3">
      <div className="flex items-center gap-2.5">
        <span className="grid size-8 place-items-center rounded-full bg-beige text-xs font-medium">{session?.name.split(" ").map((x) => x[0]).join("").slice(0, 2)}</span>
        <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{session?.name}</p><p className="truncate text-xs text-muted-foreground">{session?.email}</p></div>
        <button aria-label="Sign out" onClick={() => { signOut(); nav({ to: "/auth", search: { role: "company" }, replace: true }); }} className="text-muted-foreground hover:text-foreground"><LogOut className="size-4" /></button>
      </div>
      <Link to="/" className="mt-3 block text-xs text-muted-foreground hover:text-foreground">← Customer site</Link>
    </div>
  );
}

function AdminLayout() {
  const [open, setOpen] = useState(false);
  const { session, ready } = useHydratedSession();
  const nav = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const allowed = session?.role === "company";
  useEffect(() => { if (ready && !allowed) nav({ to: "/auth", search: { role: "company", ...(path.startsWith("/admin") ? { redirect: path } : {}) }, replace: true }); }, [ready, allowed]);
  if (!ready || !allowed) return <div className="min-h-dvh bg-background" />;
  return (
    <div className="flex min-h-dvh bg-background">
      <aside className="sticky top-0 hidden h-dvh w-56 shrink-0 border-r border-sidebar-border bg-sidebar lg:block"><SideNav /></aside>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-64 bg-sidebar p-0"><SheetTitle className="sr-only">Navigation</SheetTitle><SideNav onNav={() => setOpen(false)} /></SheetContent>
      </Sheet>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-3 border-b border-border px-4 py-3 lg:hidden">
          <button onClick={() => setOpen(true)} aria-label="Open navigation"><Menu className="size-5" /></button>
          <Logo to="/admin" />
        </div>
        <SoftStage />
      </div>
    </div>
  );
}
