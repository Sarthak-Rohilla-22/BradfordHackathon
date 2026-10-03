import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Camera, ImagePlus, RotateCcw, X } from "lucide-react";
import { CustomerShell, PageTitle } from "@/components/morrow/customer-shell";
import { Button } from "@/components/ui/button";
import { Hand } from "@/components/morrow/ui";
import { moveQ, qk } from "@/lib/morrow/queries";
import * as api from "@/lib/morrow/api";
import type { Photo } from "@/lib/morrow/types";
import living from "@/assets/room-living.jpg";
import dining from "@/assets/room-dining.jpg";
import bedroom from "@/assets/room-bedroom.jpg";
import hero from "@/assets/hero-room.jpg";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/upload")({
  head: () => ({
    meta: [
      { title: "Photos of your home — Morrow" },
      { name: "description", content: "Upload a few photos of each room so we can build your moving inventory." },
      { property: "og:title", content: "Photos of your home — Morrow" },
      { property: "og:description", content: "Let's see what you're moving." },
    ],
  }),
  component: Upload,
});

const ROOMS = ["Living room", "Bedroom", "Kitchen", "Dining room", "Office", "Garage", "Loft"];
const MAX_PHOTOS = 12;
const SAMPLES = [
  { url: living, name: "living-room.jpg", room: "Living room" },
  { url: hero, name: "living-room-2.jpg", room: "Living room" },
  { url: dining, name: "dining-room.jpg", room: "Dining room" },
  { url: bedroom, name: "bedroom.jpg", room: "Bedroom" },
];

function Upload() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const { data: move } = useQuery(moveQ);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [rejected, setRejected] = useState<{ name: string; reason: string }[]>([]);
  const [drag, setDrag] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (move) setPhotos(move.photos); }, [move?.id]);

  function finish(p: Photo, error?: string) {
    const done: Photo = error ? { ...p, status: "failed", error } : { ...p, status: "uploaded" };
    setPhotos((ps) => ps.map((x) => (x.id === p.id ? done : x)));
    void api.uploadPhotos([done]).catch(() => {
      setPhotos((ps) => ps.map((x) => (x.id === p.id ? { ...x, status: "failed", error: "Couldn't save this photo. Remove it and try again." } : x)));
    });
  }
  function startUpload(list: Photo[]) {
    setPhotos((ps) => [...ps, ...list]);
    list.forEach((p, i) => setTimeout(() => finish(p), 600 + i * 220));
  }
  async function preparePhoto(file: File): Promise<string> {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1280 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((result) => result ? resolve(result) : reject(new Error("Couldn't resize this image.")), "image/jpeg", 0.8);
    });
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Couldn't read this image."));
      reader.onerror = () => reject(new Error("Couldn't read this image."));
      reader.readAsDataURL(blob);
    });
  }
  async function addFiles(files: FileList | null) {
    if (!files) return;
    const ok: Photo[] = []; const bad: typeof rejected = [];
    const selectedFiles = Array.from(files);
    const remaining = Math.max(0, MAX_PHOTOS - photos.length);
    if (selectedFiles.length > remaining) {
      bad.push({ name: "Additional photos", reason: `You can analyse up to ${MAX_PHOTOS} photos at a time.` });
    }
    for (const f of selectedFiles.slice(0, remaining)) {
      const err = api.validatePhoto(f);
      if (err) bad.push({ name: f.name, reason: err });
      else {
        try {
          ok.push({ id: api.uid(), url: URL.createObjectURL(f), dataUrl: await preparePhoto(f), name: f.name, status: "uploading" });
        } catch {
          bad.push({ name: f.name, reason: "This image can't be read by your browser. Try saving it as a JPG or PNG." });
        }
      }
    }
    setRejected(bad);
    startUpload(ok);
  }
  async function addSamples() {
    const additions: Photo[] = [];
    for (const sample of SAMPLES.filter((item) => !photos.some((photo) => photo.name === item.name))) {
      try {
        const response = await fetch(sample.url);
        if (!response.ok) throw new Error("Sample image couldn't be loaded.");
        const file = new File([await response.blob()], sample.name, { type: "image/jpeg" });
        additions.push({ id: api.uid(), ...sample, dataUrl: await preparePhoto(file), status: "uploading" });
      } catch {
        setRejected((current) => [...current, { name: sample.name, reason: "Couldn't prepare this sample photo. Please try again." }]);
      }
    }
    startUpload(additions);
  }
  function remove(id: string) { setPhotos((ps) => ps.filter((p) => p.id !== id)); api.removePhoto(id); }
  function retry(p: Photo) { const np = { ...p, status: "uploading" as const, error: undefined }; setPhotos((ps) => ps.map((x) => (x.id === p.id ? np : x))); setTimeout(() => finish(np), 700); }

  const uploaded = photos.filter((p) => p.status === "uploaded").length;
  const uploading = photos.some((p) => p.status === "uploading");

  async function scan() {
    qc.invalidateQueries({ queryKey: qk.move });
    nav({ to: "/analysis" });
  }

  return (
    <CustomerShell
      step="photos"
      footer={
        <div className="flex items-center gap-3">
          <p className="flex-1 text-sm text-muted-foreground">{uploaded ? `${uploaded} photo${uploaded > 1 ? "s" : ""} ready` : "Add at least one photo"}</p>
          <Button size="lg" disabled={!uploaded || uploading} onClick={scan}>Scan my home <ArrowRight /></Button>
        </div>
      }
    >
      <PageTitle title="Let's see what you're moving." sub="Upload a few photos of each room. More angles help Morrow build a better inventory." />

      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files); }}
        className={cn("relative rounded-lg border-[1.5px] border-dashed bg-card px-5 py-10 text-center transition-colors", drag ? "border-primary bg-accent" : "border-taupe/60")}
      >
        <ImagePlus className="mx-auto size-7 text-taupe" strokeWidth={1.5} />
        <p className="mt-3 font-medium">Drop your photos here</p>
        <p className="mt-1 text-sm text-muted-foreground">JPG, PNG, WebP or HEIC · up to 15 MB each</p>
        <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-muted-foreground">
          Photos are resized and sent to Google Gemini for recognition. Results are estimates, so please review your inventory.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Button variant="default" onClick={() => camRef.current?.click()} className="sm:hidden"><Camera /> Take photos</Button>
          <Button variant="outline" onClick={() => fileRef.current?.click()}>Choose photos</Button>
        </div>
        <input ref={fileRef} type="file" accept="image/*,.heic,.heif" multiple className="sr-only" onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} aria-label="Choose photos" />
        <input ref={camRef} type="file" accept="image/*" capture="environment" multiple className="sr-only" onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} aria-label="Take photos" />
        {!photos.length && (
          <button onClick={addSamples} className="mt-5 text-sm text-muted-foreground underline decoration-taupe underline-offset-4 hover:text-foreground">
            No photos to hand? Use our sample home
          </button>
        )}
      </div>

      {rejected.length > 0 && (
        <div role="alert" className="mt-4 space-y-1 rounded-md bg-error-soft px-4 py-3 text-sm">
          {rejected.map((r) => <p key={r.name}><span className="font-medium">{r.name}</span> — {r.reason}</p>)}
        </div>
      )}

      {photos.length > 0 && (
        <div className="mt-6">
          <div className="mb-3 flex items-end justify-between">
            <p className="eyebrow">Your photos</p>
            <Hand className="text-lg">we'll work out the rooms</Hand>
          </div>
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            <AnimatePresence initial={false}>
              {photos.map((p) => (
                <motion.li key={p.id} layout initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} className="relative aspect-square overflow-hidden rounded-md bg-muted">
                  <img src={p.url} alt={p.name} className={cn("size-full object-cover", p.status !== "uploaded" && "opacity-60")} />
                  {p.status === "uploading" && (
                    <div className="absolute inset-x-2 bottom-2 h-1 overflow-hidden rounded-full bg-card/70" aria-label="Uploading">
                      <div className="h-full w-1/2 animate-[pulse_1s_ease-in-out_infinite] rounded-full bg-primary" />
                    </div>
                  )}
                  {p.status === "failed" && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-card/85 p-2 text-center">
                      <p className="text-xs font-medium text-destructive">We couldn't upload this photo.</p>
                      <button onClick={() => retry(p)} className="inline-flex items-center gap-1 text-xs underline"><RotateCcw className="size-3" /> Try again</button>
                    </div>
                  )}
                  {p.room && p.status === "uploaded" && <span className="absolute left-1.5 top-1.5 rounded bg-card/90 px-1.5 py-0.5 text-[0.65rem]">{p.room}</span>}
                  <button onClick={() => remove(p.id)} aria-label={`Remove ${p.name}`} className="absolute right-1.5 top-1.5 grid size-6 place-items-center rounded-full bg-card/90 text-foreground hover:bg-card">
                    <X className="size-3.5" />
                  </button>
                </motion.li>
              ))}
            </AnimatePresence>
            <li>
              <button onClick={() => fileRef.current?.click()} className="grid aspect-square w-full place-items-center rounded-md border border-dashed border-taupe/60 text-sm text-muted-foreground hover:bg-card">
                + Add more
              </button>
            </li>
          </ul>
        </div>
      )}

      <div className="mt-8 rounded-lg bg-muted px-5 py-4">
        <p className="text-sm font-medium">A tip</p>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">Take photos from the corners of the room and try to include furniture from different angles. Rooms we often see:</p>
        <div className="mt-3 flex flex-wrap gap-1.5">{ROOMS.map((r) => <span key={r} className="rounded border border-border bg-card px-2 py-1 text-xs text-muted-foreground">{r}</span>)}</div>
      </div>
    </CustomerShell>
  );
}
