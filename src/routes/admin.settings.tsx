import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AdminPage } from "@/components/morrow/admin-page";
import { Section, Tag } from "@/components/morrow/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import * as api from "@/lib/morrow/api";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({ meta: [{ title: "Settings — Morrow" }, { name: "description", content: "Company settings." }, { property: "og:title", content: "Settings — Morrow" }, { property: "og:description", content: "Company settings." }] }),
  component: Settings,
});

function Settings() {
  const qc = useQueryClient();
  return (
    <AdminPage title="Settings">
      <div className="grid max-w-3xl gap-6">
        <Section title="Company details">
          <div className="grid gap-3 sm:grid-cols-2 text-sm">
            <label className="space-y-1"><span className="text-xs text-muted-foreground">Trading name</span><Input defaultValue="Aire Valley Removals" /></label>
            <label className="space-y-1"><span className="text-xs text-muted-foreground">Phone</span><Input defaultValue="0113 000 0000" /></label>
            <label className="space-y-1 sm:col-span-2"><span className="text-xs text-muted-foreground">Depot address</span><Input defaultValue="Unit 4, Kirkstall Industrial Park, Leeds LS5 3BT" /></label>
          </div>
        </Section>
        <Section title="Notifications">
          {["New booking", "Item needs review", "Vehicle conflict", "Daily summary at 07:00"].map((n, i) => <label key={n} className="flex items-center justify-between py-2 text-sm">{n}<Switch defaultChecked={i < 3} /></label>)}
        </Section>
        <Section title="Quote settings">
          <label className="flex items-center justify-between py-2 text-sm">Quotes valid for<Input defaultValue="14 days" className="w-32 text-right" /></label>
          <label className="flex items-center justify-between py-2 text-sm">Require manual approval above £1,500<Switch defaultChecked /></label>
        </Section>
        <Section title="Users">
          {[["Sarah Ellis", "Owner"], ["Grace Fenwick", "Operations"], ["Oliver Hart", "Crew lead"]].map(([n, r]) => <div key={n} className="flex items-center justify-between py-2 text-sm"><span>{n}</span><Tag>{r}</Tag></div>)}
        </Section>
        <div className="flex justify-between">
          <Button variant="outline" onClick={async () => { await api.resetDemo(); qc.invalidateQueries(); toast("Demo data reset"); }}>Reset demo data</Button>
          <Button onClick={() => toast.success("Settings saved")}>Save settings</Button>
        </div>
      </div>
    </AdminPage>
  );
}
