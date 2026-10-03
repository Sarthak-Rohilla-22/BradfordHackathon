import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { CustomerShell } from "@/components/morrow/customer-shell";
import { ErrorState, Hand } from "@/components/morrow/ui";
import { Button } from "@/components/ui/button";
import * as api from "@/lib/morrow/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/analysis")({
  head: () => ({
    meta: [
      { title: "Looking at your photos — Morrow" },
      { name: "description", content: "Morrow is building your moving inventory from your photos." },
      { property: "og:title", content: "Looking at your photos — Morrow" },
      { property: "og:description", content: "Having a look..." },
    ],
  }),
  component: Analysis,
});

function Analysis() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const [done, setDone] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const ran = useRef(false);

  const run = useCallback(async () => {
    setErr(null); setDone(0);
    try {
      await api.analyseMove(setDone);
      qc.invalidateQueries();
      setTimeout(() => { if (window.location.pathname === "/analysis") nav({ to: "/inventory", replace: true }); }, 500);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Photo recognition failed. Please try again.";
      setErr(message === "NO_PHOTOS" ? "nophotos" : message === "PHOTO_DATA_MISSING"
        ? "These saved photos are from an older session and no longer contain image data. Go back, remove them, and upload them again."
        : message === "UNSUPPORTED_PHOTO_FORMAT"
          ? "A photo could not be prepared for analysis. Please upload a JPG, PNG or WebP image."
          : message);
    }
  }, [nav, qc]);

  useEffect(() => { if (!ran.current) { ran.current = true; run(); } }, [run]);

  return (
    <CustomerShell step="photos">
      <div className="mx-auto max-w-sm pt-10">
        <Hand className="text-2xl">having a look...</Hand>
        <h1 className="mt-3 text-2xl font-semibold tracking-[-0.02em]">Recognising your items</h1>
        <p className="mt-2 text-sm text-muted-foreground">Gemini is checking your photos. You can review and correct every result.</p>

        {err === "nophotos" ? (
          <div className="mt-8"><ErrorState title="No photos yet" body="We need at least one photo of your home to get started." /><Button asChild className="mt-4"><Link to="/upload">Add photos</Link></Button></div>
        ) : err ? (
          <div className="mt-8"><ErrorState body={err} onRetry={run} /></div>
        ) : (
          <ol className="mt-10 space-y-4" aria-live="polite">
            {api.ANALYSIS_STAGES.map((s, i) => {
              const complete = i < done; const active = i === done;
              return (
                <motion.li key={s} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} className="flex items-center gap-3">
                  <span className={cn("grid size-6 place-items-center rounded-full border text-primary-foreground transition-colors", complete ? "border-primary bg-primary" : "border-taupe")}>
                    {complete ? <Check className="size-3.5" /> : active ? <span className="size-2 animate-pulse rounded-full bg-taupe" /> : null}
                  </span>
                  <span className={cn("text-[0.95rem]", complete ? "text-foreground" : active ? "text-foreground" : "text-muted-foreground")}>{s}</span>
                </motion.li>
              );
            })}
          </ol>
        )}
      </div>
    </CustomerShell>
  );
}
