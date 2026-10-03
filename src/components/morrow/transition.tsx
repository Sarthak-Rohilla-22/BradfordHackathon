import { Outlet, useRouterState } from "@tanstack/react-router";
import { motion, useReducedMotion } from "framer-motion";

/**
 * "Daybreak" route transition: a deep-brown dusk curtain with a rising sun arc
 * lifts away over the new page, which itself rises from the horizon.
 * Admin routes share one key so the sidebar layout is not remounted.
 */
export function RouteStage() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const reduce = useReducedMotion();
  const key = path.startsWith("/admin") ? "admin" : path;

  if (reduce) return <Outlet />;
  return (
    <div className="relative">
      <motion.div
        key={key}
        initial={{ clipPath: "ellipse(80% 0% at 50% 100%)", y: 40 }}
        animate={{ clipPath: "ellipse(150% 150% at 50% 100%)", y: 0 }}
        transition={{ duration: 0.9, ease: [0.65, 0, 0.15, 1], delay: 0.12 }}
      >
        <Outlet />
      </motion.div>
      <motion.div
        key={`veil-${key}`}
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[100] overflow-hidden bg-primary"
        initial={{ y: "0%" }}
        animate={{ y: "-102%" }}
        transition={{ duration: 0.85, ease: [0.76, 0, 0.24, 1], delay: 0.1 }}
      >
        <motion.svg viewBox="0 0 200 100" className="absolute bottom-[38%] left-1/2 w-40 -translate-x-1/2 text-primary-foreground/80"
          initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: 0.3, delay: 0.3 }}>
          <motion.path d="M10 90 H190" stroke="currentColor" strokeWidth="1.5" fill="none" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.35 }} />
          <motion.path d="M50 90 A50 50 0 0 1 150 90" stroke="currentColor" strokeWidth="1.5" fill="none" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4, delay: 0.05 }} />
        </motion.svg>
      </motion.div>
    </div>
  );
}

/** Subtle in-layout transition for admin pages. */
export function SoftStage() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <motion.div key={path} initial={{ opacity: 0, y: 12, filter: "blur(6px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ duration: 0.45, ease: [0.2, 0.7, 0.2, 1] }}>
      <Outlet />
    </motion.div>
  );
}
