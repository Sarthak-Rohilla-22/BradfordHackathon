<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- All screens get data only via `src/lib/morrow/api.ts` (local simulated backend persisted in localStorage); swap its bodies for real fetches — so UI never computes prices/availability itself.
- Volume/crew/vehicle/quote/availability logic lives in `src/lib/morrow/engine.ts` — deterministic rules, never AI.
- Auth is frontend-only (`src/lib/morrow/auth.ts`); `/admin` requires a company session — replace with real auth before production.
- Route transitions live in `src/components/morrow/transition.tsx`; admin routes share one key so the sidebar layout isn't remounted.
- Once a move has a booking reference, CustomerShell redirects every planning step to /confirmation.
