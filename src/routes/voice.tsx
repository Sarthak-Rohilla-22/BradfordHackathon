import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Check, Mic, MicOff, PhoneOff, Phone } from "lucide-react";
import { CustomerShell } from "@/components/morrow/customer-shell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/voice")({
  head: () => ({
    meta: [
      { title: "Talk to Morrow" },
      { name: "description", content: "Plan your move by phone-style voice call." },
      { property: "og:title", content: "Talk to Morrow" },
      { property: "og:description", content: "Tell us about your move out loud." },
    ],
  }),
  component: Voice,
});

const SCRIPT: { who: "morrow" | "you"; text: string; step?: number | undefined }[] = [
  { who: "morrow", text: "Hi, this is Morrow. Where are you moving from?" },
  { who: "you", text: "From Headingley in Leeds.", step: 0 },
  { who: "morrow", text: "Lovely. And where to?" },
  { who: "you", text: "A house in Bradford, near Saltaire.", step: 1 },
  { who: "morrow", text: "Do you have a date in mind?" },
  { who: "you", text: "Friday the ninth, ideally the afternoon.", step: 2 },
  { who: "morrow", text: "Let me check what we have on Friday afternoon…", step: 3 },
  { who: "morrow", text: "We have 14:00 to 19:00 free. To give you an accurate quote I'll text you a link to send a few photos of your rooms.", step: 4 },
];
const STEPS = ["Origin captured", "Destination captured", "Date captured", "Checking availability", "Preparing quote"];

function Voice() {
  const [state, setState] = useState<"idle" | "connecting" | "live" | "ended">("idle");
  const [muted, setMuted] = useState(false);
  const [n, setN] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => {
    if (state !== "live" || n >= SCRIPT.length) return;
    timer.current = setTimeout(() => setN((x) => x + 1), 2100);
    return () => clearTimeout(timer.current);
  }, [state, n]);
  const lines = SCRIPT.slice(0, n);
  const reached = Math.max(-1, ...lines.map((l) => l.step ?? -1));
  const speaking = state === "live" && n < SCRIPT.length ? (SCRIPT[n]?.who === "you" ? "Listening…" : "Speaking…") : "";

  function start() { setState("connecting"); setN(0); setTimeout(() => { setState("live"); setN(1); }, 1200); }

  return (
    <CustomerShell>
      <div className="mx-auto max-w-md">
        <p className="eyebrow">{state === "live" ? "On a call" : state === "connecting" ? "Connecting" : state === "ended" ? "Call ended" : "Voice"}</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-[-0.02em]">Talking to Morrow</h1>
        <div className="mt-6 rounded-lg border border-border bg-card p-5">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2"><span className={cn("size-2 rounded-full", state === "live" ? "bg-sage" : "bg-border")} />{state === "live" ? (muted ? "Microphone muted" : speaking) : state === "connecting" ? "Ringing…" : "Not connected"}</span>
            <span className="tabular text-muted-foreground">{state === "live" ? `0:${String(n * 2).padStart(2, "0")}` : ""}</span>
          </div>
          <div className="mt-5 flex h-14 items-center justify-center gap-[3px]" aria-hidden>
            {Array.from({ length: 36 }).map((_, i) => (
              <span key={i} className={cn("w-[3px] rounded-full bg-taupe transition-all", state === "live" && !muted ? "animate-pulse" : "")}
                style={{ height: state === "live" && !muted ? `${18 + Math.abs(Math.sin(i * 1.7 + n)) * 70}%` : "8%", animationDelay: `${i * 40}ms` }} />
            ))}
          </div>
          <div className="mt-5 flex justify-center gap-3">
            {state === "idle" || state === "ended" ? (
              <Button size="lg" onClick={start}><Phone /> {state === "ended" ? "Call again" : "Start call"}</Button>
            ) : (
              <>
                <Button size="icon" variant="outline" className="size-12 rounded-full" onClick={() => setMuted((m) => !m)} aria-label={muted ? "Unmute" : "Mute"}>{muted ? <MicOff /> : <Mic />}</Button>
                <Button size="icon" variant="destructive" className="size-12 rounded-full" onClick={() => setState("ended")} aria-label="End call"><PhoneOff /></Button>
              </>
            )}
          </div>
        </div>

        <ol className="mt-6 space-y-2" aria-label="Progress">
          {STEPS.map((s, i) => (
            <li key={s} className={cn("flex items-center gap-2.5 text-sm", i <= reached ? "text-foreground" : "text-muted-foreground")}>
              <span className={cn("grid size-5 place-items-center rounded-full border", i <= reached ? "border-sage bg-sage text-primary-foreground" : "border-border")}>{i <= reached && <Check className="size-3" />}</span>{s}
            </li>
          ))}
        </ol>

        {lines.length > 0 && (
          <div className="mt-6 space-y-3 border-t border-border pt-6" aria-live="polite">
            <p className="eyebrow">Transcript</p>
            {lines.map((l, i) => (
              <p key={i} className={cn("text-sm leading-relaxed", l.who === "you" && "text-right")}>
                <span className="block text-[0.7rem] uppercase tracking-wider text-muted-foreground">{l.who === "you" ? "You" : "Morrow"}</span>
                {l.text}
              </p>
            ))}
          </div>
        )}
        {n >= SCRIPT.length && <Button asChild className="mt-6 w-full" size="lg"><Link to="/upload">Send my photos</Link></Button>}
        <p className="mt-8 text-xs text-muted-foreground">This is a demonstration call. Live voice connects once the voice service is switched on.</p>
      </div>
    </CustomerShell>
  );
}
