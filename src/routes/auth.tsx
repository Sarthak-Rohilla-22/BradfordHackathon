import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { z } from "zod";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import heroImg from "@/assets/hero-room.jpg";
import { Logo, Hand } from "@/components/morrow/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestReset, signIn, signInWithGoogle, signUp, type Role } from "@/lib/morrow/auth";
import { cn } from "@/lib/utils";

const search = z.object({ mode: z.enum(["signin", "signup", "forgot"]).optional(), role: z.enum(["customer", "company"]).optional(), redirect: z.string().optional() });

export const Route = createFileRoute("/auth")({
  validateSearch: search,
  head: () => ({ meta: [{ title: "Sign in — Morrow" }, { name: "description", content: "Sign in to manage your move or your removals business." }, { property: "og:title", content: "Sign in — Morrow" }, { property: "og:description", content: "Welcome back to Morrow." }] }),
  component: Auth,
});

function Auth() {
  const s = Route.useSearch();
  const nav = useNavigate();
  const [mode, setMode] = useState(s.mode ?? "signin");
  const [role, setRole] = useState<Role>(s.role ?? "customer");
  const [f, setF] = useState({ name: "", email: "", password: "" });
  const [show, setShow] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const done = () => {
    const to = s.redirect && s.redirect.startsWith("/") ? s.redirect : role === "company" ? "/admin" : "/start";
    nav({ to, replace: true });
  };
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr("");
    if (!/^\S+@\S+\.\S+$/.test(f.email)) return setErr("Enter a valid email address.");
    if (mode !== "forgot" && f.password.length < 8) return setErr("Passwords are at least 8 characters.");
    if (mode === "signup" && !f.name.trim()) return setErr("Tell us your name.");
    setBusy(true);
    try {
      if (mode === "forgot") { await requestReset(f.email); setSent(true); }
      else { if (mode === "signin") await signIn(f.email, f.password, role); else await signUp(f.name, f.email, f.password, role); done(); }
    } catch (x) { setErr((x as Error).message); } finally { setBusy(false); }
  }

  const title = mode === "signin" ? "Welcome back." : mode === "signup" ? "Let's get you set up." : "Reset your password";

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_1.05fr]">
      <div className="flex flex-col px-6 py-6 sm:px-12">
        <Logo />
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
          <div className="mb-8 inline-flex self-start rounded-full border border-border bg-card p-1 text-sm">
            {(["customer", "company"] as const).map((r) => (
              <button key={r} onClick={() => setRole(r)} className="relative rounded-full px-4 py-1.5">
                {role === r && <motion.span layoutId="role-pill" className="absolute inset-0 rounded-full bg-primary" transition={{ type: "spring", stiffness: 400, damping: 34 }} />}
                <span className={cn("relative", role === r ? "text-primary-foreground" : "text-muted-foreground")}>{r === "customer" ? "I'm moving" : "Removals company"}</span>
              </button>
            ))}
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={mode} initial={{ opacity: 0, y: 10, filter: "blur(4px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, y: -8, filter: "blur(4px)" }} transition={{ duration: 0.28 }}>
              <h1 className="font-display text-[2.1rem] font-semibold leading-tight tracking-[-0.035em]">{title}</h1>
              <p className="mt-2 text-muted-foreground">{mode === "forgot" ? "We'll email you a link to choose a new one." : role === "company" ? "Jobs, crews and quotes in one calm place." : "Pick up your move where you left off."}</p>

              {sent ? (
                <div className="mt-8 rounded-lg border border-border bg-card p-5 text-sm">Check <span className="font-medium">{f.email}</span> for a reset link. <button className="mt-3 block underline" onClick={() => { setMode("signin"); setSent(false); }}>Back to sign in</button></div>
              ) : (
                <form onSubmit={submit} className="mt-8 space-y-4" noValidate>
                  {mode !== "forgot" && (
                    <>
                      <Button type="button" variant="outline" size="lg" className="w-full" disabled={busy} onClick={async () => { setBusy(true); await signInWithGoogle(role); done(); }}>
                        <svg viewBox="0 0 24 24" className="size-4" aria-hidden><path fill="currentColor" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3ZM12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22ZM6.4 14c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7.4H3.1a10 10 0 0 0 0 9.2L6.4 14ZM12 6c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 0 0 3.1 7.4L6.4 10C7.2 7.7 9.4 6 12 6Z" /></svg>
                        Continue with Google
                      </Button>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />or with email<span className="h-px flex-1 bg-border" /></div>
                    </>
                  )}
                  {mode === "signup" && <div className="space-y-1.5"><Label htmlFor="name">{role === "company" ? "Your name" : "Full name"}</Label><Input id="name" autoComplete="name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className="h-11 bg-card" /></div>}
                  <div className="space-y-1.5"><Label htmlFor="email">Email</Label><Input id="email" type="email" autoComplete="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} className="h-11 bg-card" /></div>
                  {mode !== "forgot" && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between"><Label htmlFor="pw">Password</Label>{mode === "signin" && <button type="button" onClick={() => setMode("forgot")} className="text-xs text-muted-foreground hover:text-foreground">Forgot password?</button>}</div>
                      <div className="relative">
                        <Input id="pw" type={show ? "text" : "password"} autoComplete={mode === "signup" ? "new-password" : "current-password"} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} className="h-11 bg-card pr-10" />
                        <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">{show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button>
                      </div>
                    </div>
                  )}
                  {err && <p role="alert" className="text-sm text-destructive">{err}</p>}
                  <Button type="submit" size="lg" className="w-full" disabled={busy}>{busy ? "One moment…" : mode === "signin" ? <>Sign in <ArrowRight /></> : mode === "signup" ? <>Create account <ArrowRight /></> : "Send reset link"}</Button>
                </form>
              )}
              <p className="mt-6 text-sm text-muted-foreground">
                {mode === "signin" ? <>New to Morrow? <button className="font-medium text-foreground underline underline-offset-4" onClick={() => setMode("signup")}>Create an account</button></> : <>Already have an account? <button className="font-medium text-foreground underline underline-offset-4" onClick={() => { setMode("signin"); setSent(false); }}>Sign in</button></>}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
        <p className="text-xs text-muted-foreground"><Link to="/" className="hover:text-foreground">← Back to Morrow</Link></p>
      </div>
      <div className="relative hidden overflow-hidden lg:block">
        <motion.img initial={{ scale: 1.08 }} animate={{ scale: 1 }} transition={{ duration: 1.6, ease: [0.2, 0.7, 0.2, 1] }} src={heroImg} alt="" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/55 via-transparent to-transparent" />
        <div className="absolute bottom-10 left-10 right-10 text-primary-foreground">
          <Hand className="text-primary-foreground/90">for where you're going next</Hand>
          <p className="font-display mt-3 max-w-md text-3xl font-semibold leading-tight tracking-[-0.03em]">A calmer way to move a whole home.</p>
        </div>
      </div>
    </div>
  );
}
