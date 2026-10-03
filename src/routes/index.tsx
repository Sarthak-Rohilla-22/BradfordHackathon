import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Phone } from "lucide-react";
import heroImg from "@/assets/hero-room.jpg";
import { Button } from "@/components/ui/button";
import { Hand, Logo, Tag } from "@/components/morrow/ui";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Morrow — Moving starts with a few photos" },
      { name: "description", content: "Show us your home. Morrow turns your photos into a moving inventory you can review, then plans the crew, vehicle and quote." },
      { property: "og:title", content: "Morrow — Moving starts with a few photos" },
      { property: "og:description", content: "For where you're going next. Photo-to-inventory removals, planned properly." },
    ],
  }),
  component: Landing,
});

const PREVIEW = [
  { name: "3-seat sofa", meta: "~1.8 m³", state: "est" },
  { name: "Coffee table", meta: "~0.4 m³", state: "est" },
  { name: "Boxes", meta: "× 4", state: "est" },
  { name: "Floor lamp", meta: "× 1", state: "ok" },
];

function Landing() {
  return (
    <div className="min-h-dvh bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Logo />
        <nav className="flex items-center gap-5 text-sm">
          <Link to="/admin" className="hidden text-muted-foreground hover:text-foreground sm:inline">For removals companies</Link>
          <Button asChild size="sm" variant="outline"><Link to="/start">Get a quote</Link></Button>
        </nav>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl gap-10 px-5 pb-20 pt-8 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:pt-16">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <p className="eyebrow">For where you're going next</p>
            <h1 className="mt-4 text-[2.6rem] font-semibold leading-[1.02] tracking-[-0.035em] sm:text-[3.6rem]">
              Moving starts with a few photos.
            </h1>
            <p className="mt-5 max-w-md text-[1.05rem] leading-relaxed text-muted-foreground">
              Show us your home. Morrow will turn what it sees into a moving inventory you can review, edit and confirm.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg"><Link to="/start">Start your move <ArrowRight /></Link></Button>
              <Button asChild size="lg" variant="outline"><Link to="/voice"><Phone /> Talk to Morrow</Link></Button>
            </div>
            <p className="mt-6 text-sm text-muted-foreground">Usually takes about ten minutes. No account needed.</p>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, delay: 0.1 }} className="relative">
            <img src={heroImg} width={1600} height={1104} alt="A sunlit living room with labelled moving boxes beside the sofa" className="aspect-[4/3] w-full rounded-lg object-cover" />
            <motion.div
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.5 }}
              className="absolute -bottom-8 left-4 w-[17rem] rounded-lg border border-border bg-card p-4 shadow-lift sm:left-auto sm:right-6"
            >
              <div className="flex items-center justify-between">
                <p className="eyebrow">Living room</p>
                <span className="text-xs text-muted-foreground">4 items</span>
              </div>
              <ul className="mt-3 divide-y divide-border text-sm">
                {PREVIEW.map((p) => (
                  <li key={p.name} className="flex items-center justify-between py-2">
                    <span>{p.name}</span>
                    <span className="flex items-center gap-2 text-xs text-muted-foreground">
                      {p.meta} {p.state === "ok" ? <Tag tone="sage">Confirmed</Tag> : <Tag>Estimated</Tag>}
                    </span>
                  </li>
                ))}
              </ul>
              <Hand className="absolute -right-3 -top-6 rotate-3">did we miss anything?</Hand>
            </motion.div>
          </motion.div>
        </section>

        <section className="border-y border-border bg-card">
          <div className="mx-auto grid max-w-6xl gap-px px-5 py-16 sm:grid-cols-3 sm:gap-10">
            {[
              ["01", "Photograph each room", "Walk around with your phone. A few angles per room is plenty."],
              ["02", "Check your inventory", "We list what we can see. You correct sizes, add anything missed."],
              ["03", "Pick a slot and book", "Crew, van and a clear, itemised quote — then choose a time that suits."],
            ].map(([n, t, b]) => (
              <div key={n} className="py-4">
                <p className="tabular text-sm text-taupe">{n}</p>
                <h3 className="mt-2 font-semibold">{t}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{b}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-10 px-5 py-20 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-semibold tracking-[-0.02em]">Honest about what's estimated.</h2>
            <p className="mt-3 max-w-md leading-relaxed text-muted-foreground">
              Morrow turns photos of your home into a moving inventory, then helps work out the people, vehicle and services your move needs. Anything we've judged from a photo is marked as an estimate until you confirm it.
            </p>
          </div>
          <div className="space-y-2.5 rounded-lg border border-border bg-card p-5">
            <Row name="Dining table" dims="~180 × 90 × 75 cm" tag={<Tag>Estimated</Tag>} />
            <Row name="Dining table" dims="220 × 100 × 75 cm" tag={<Tag tone="sage">Confirmed</Tag>} />
            <Row name="Dining room doorway" dims="78 × 198 cm" tag={<Tag tone="amber">Potential access issue</Tag>} />
            <p className="pt-2 text-sm text-muted-foreground">Your quote is worked out from company pricing rules — never guessed.</p>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <Logo />
          <p>Removals across Leeds, Bradford, York, Harrogate and West Yorkshire.</p>
          <Link to="/admin" className="hover:text-foreground">Company login</Link>
        </div>
      </footer>
    </div>
  );
}

function Row({ name, dims, tag }: { name: string; dims: string; tag: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-md bg-background px-3.5 py-3 text-sm">
      <div><p className="font-medium">{name}</p><p className="tabular text-xs text-muted-foreground">{dims}</p></div>
      {tag}
    </div>
  );
}
