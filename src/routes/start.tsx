import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { CustomerShell, PageTitle } from "@/components/morrow/customer-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CITIES } from "@/lib/morrow/data";
import { moveQ } from "@/lib/morrow/queries";
import * as api from "@/lib/morrow/api";

export const Route = createFileRoute("/start")({
  head: () => ({
    meta: [
      { title: "Start your move — Morrow" },
      { name: "description", content: "Tell us where you're moving from and to, then show us your home." },
      { property: "og:title", content: "Start your move — Morrow" },
      { property: "og:description", content: "A few details, then a few photos." },
    ],
  }),
  component: Start,
});

function Start() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const { data: move } = useQuery(moveQ);
  const [f, setF] = useState({ origin: "Leeds", destination: "Bradford", customerName: "", email: "", phone: "" });
  const [touched, setTouched] = useState(false);
  useEffect(() => { if (move) setF({ origin: move.origin, destination: move.destination, customerName: move.customerName, email: move.email, phone: move.phone }); }, [move?.id]);

  const errors = {
    customerName: !f.customerName.trim() ? "Let us know who's moving." : "",
    email: !/^\S+@\S+\.\S+$/.test(f.email) ? "Enter an email so we can send your quote." : "",
    route: f.origin === f.destination ? "Choose two different places." : "",
  };
  const valid = !errors.customerName && !errors.email && !errors.route;

  async function go() {
    setTouched(true);
    if (!valid) return;
    if (move?.bookingRef) await api.createMove();
    await api.updateMove(f);
    qc.invalidateQueries();
    nav({ to: "/upload" });
  }

  return (
    <CustomerShell footer={<Button size="lg" className="w-full" onClick={go}>Continue to photos <ArrowRight /></Button>}>
      <PageTitle title="Where are you going next?" sub="Just the basics for now. You can change any of this later." />
      <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); go(); }}>
        <div className="grid grid-cols-2 gap-3">
          <CityField label="Moving from" value={f.origin} onChange={(v) => setF({ ...f, origin: v })} />
          <CityField label="Moving to" value={f.destination} onChange={(v) => setF({ ...f, destination: v })} />
        </div>
        {touched && errors.route && <p className="-mt-3 text-sm text-destructive">{errors.route}</p>}
        <Field id="name" label="Your name" value={f.customerName} onChange={(v) => setF({ ...f, customerName: v })} error={touched ? errors.customerName : ""} autoComplete="name" />
        <Field id="email" label="Email" type="email" value={f.email} onChange={(v) => setF({ ...f, email: v })} error={touched ? errors.email : ""} autoComplete="email" />
        <Field id="phone" label="Phone (optional)" type="tel" value={f.phone} onChange={(v) => setF({ ...f, phone: v })} autoComplete="tel" />
        <button type="submit" className="sr-only">Continue</button>
      </form>
    </CustomerShell>
  );
}

function CityField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-11 bg-card"><SelectValue /></SelectTrigger>
        <SelectContent>{CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  );
}

function Field({ id, label, value, onChange, error, type = "text", autoComplete }: { id: string; label: string; value: string; onChange: (v: string) => void; error?: string; type?: string; autoComplete?: string }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} autoComplete={autoComplete} value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined} className="h-11 bg-card" />
      {error && <p id={`${id}-err`} className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
