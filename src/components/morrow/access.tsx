import { AlertTriangle, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { AccessIssue, Doorway } from "@/lib/morrow/types";
import { cn } from "@/lib/utils";
import { fmtDims } from "./ui";

export function ChoiceGroup({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium">{label}</legend>
      <div role="radiogroup" className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={o} type="button" role="radio" aria-checked={value === o} onClick={() => onChange(o)}
            className={cn("h-10 rounded-md border px-3.5 text-sm transition-colors", value === o ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-taupe")}
          >{o}</button>
        ))}
      </div>
    </fieldset>
  );
}

const MODES: { k: Doorway["mode"]; l: string }[] = [
  { k: "exact", l: "Measured" }, { k: "approx", l: "Roughly" }, { k: "size", l: "Small / standard / wide" }, { k: "unsure", l: "I'm not sure" },
];

export function DoorwayForm({ doorway, onChange, onRemove }: { doorway: Doorway; onChange: (d: Doorway) => void; onRemove?: () => void }) {
  const num = (v: string) => (v ? Math.max(0, parseInt(v, 10) || 0) : undefined);
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <Input value={doorway.label} onChange={(e) => onChange({ ...doorway, label: e.target.value })} className="h-10 border-transparent bg-transparent px-0 font-medium shadow-none focus-visible:border-border focus-visible:px-2" aria-label="Doorway name" />
        {onRemove && <Button variant="ghost" size="icon" onClick={onRemove} aria-label="Remove doorway"><Trash2 /></Button>}
      </div>
      <div className="mt-2 flex flex-wrap gap-1" role="radiogroup" aria-label="How do you know the size?">
        {MODES.map((m) => (
          <button key={m.k} type="button" role="radio" aria-checked={doorway.mode === m.k} onClick={() => onChange({ ...doorway, mode: m.k })}
            className={cn("rounded px-2.5 py-1 text-xs", doorway.mode === m.k ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground")}>{m.l}</button>
        ))}
      </div>
      {(doorway.mode === "exact" || doorway.mode === "approx") && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          {(["width", "height"] as const).map((k) => (
            <label key={k}>
              <span className="text-xs capitalize text-muted-foreground">{k}</span>
              <div className="relative mt-1">
                <Input inputMode="numeric" value={doorway[k] ?? ""} onChange={(e) => onChange({ ...doorway, [k]: num(e.target.value) })} className="tabular h-11 pr-10" placeholder={k === "width" ? "82" : "198"} />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">cm</span>
              </div>
            </label>
          ))}
        </div>
      )}
      {doorway.mode === "size" && (
        <div className="mt-4 grid grid-cols-3 gap-2">
          {(["small", "standard", "wide"] as const).map((s) => (
            <button key={s} type="button" onClick={() => onChange({ ...doorway, size: s })} aria-pressed={doorway.size === s}
              className={cn("rounded-md border py-2.5 text-sm capitalize", doorway.size === s ? "border-primary bg-accent" : "border-border")}>
              {s}<span className="block text-[0.7rem] text-muted-foreground">{{ small: "~70 cm", standard: "~76 cm", wide: "~90 cm" }[s]}</span>
            </button>
          ))}
        </div>
      )}
      {doorway.mode === "unsure" && <p className="mt-3 text-sm text-muted-foreground">No problem — access needs checking, and our team will confirm before your move.</p>}
    </div>
  );
}

export function AddDoorwayButton({ onClick }: { onClick: () => void }) {
  return <Button variant="outline" onClick={onClick} className="w-full border-dashed"><Plus /> Add another doorway</Button>;
}

export function DoorDiagram() {
  return (
    <figure className="flex items-center gap-4 rounded-lg bg-muted px-4 py-3">
      <svg viewBox="0 0 60 80" className="h-16 w-12 shrink-0 text-taupe-dark" aria-hidden>
        <rect x="6" y="4" width="48" height="74" fill="none" stroke="currentColor" strokeWidth="3" />
        <rect x="11" y="9" width="38" height="69" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3 2" />
        <path d="M12 44h36" stroke="currentColor" strokeWidth="1.2" markerEnd="url(#a)" markerStart="url(#a)" />
        <defs><marker id="a" viewBox="0 0 6 6" refX="3" refY="3" markerWidth="4" markerHeight="4" orient="auto-start-reverse"><path d="M0 0L6 3L0 6z" fill="currentColor" /></marker></defs>
      </svg>
      <figcaption className="text-sm"><span className="font-medium">Measure the clear opening, not the door itself.</span><br /><span className="text-muted-foreground">Inside the frame, with the door fully open.</span></figcaption>
    </figure>
  );
}

export function AccessWarning({ issue }: { issue: AccessIssue }) {
  return (
    <div role="status" className="rounded-lg border border-amber/30 bg-amber-soft p-4">
      <p className="flex items-center gap-2 font-medium"><AlertTriangle className="size-4 text-amber" /> Potential access issue</p>
      <div className="tabular mt-3 grid grid-cols-2 gap-3 text-sm">
        <div><p className="text-xs text-muted-foreground">{issue.itemName}</p><p>{fmtDims(issue.dims)}</p></div>
        <div><p className="text-xs text-muted-foreground">{issue.doorway}</p><p>{issue.doorDims.w} × {issue.doorDims.h} cm</p></div>
      </div>
      <p className="mt-3 text-sm leading-relaxed">Your {issue.itemName.toLowerCase()} is larger than the available doorway in one dimension. It may need to be tilted, partially dismantled, or handled by an additional mover. We'll account for this in your estimate.</p>
    </div>
  );
}
