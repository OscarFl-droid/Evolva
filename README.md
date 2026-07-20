# EVOLVA v7.5.1 — Stability Audit

This is the corrected release of the v7.5 Living Systems build.

## Critical fixes

- Central build identity now controls the title, intro screen, HUD and startup build stamp.
- Service worker uses a new cache and explicitly replaces older app shells.
- Navigation is network-first with forced revalidation; offline fallback remains available.
- Existing v7 through v7.5 saves migrate into the new save key.
- Legacy organisms, resources, effects, niches and modules are validated before rendering.
- Rest-created niches now grow at a controlled rate and award XP only at one-time milestones.
- Duplicate symbiont stacking is capped at two copies of a module type.
- Defensive field outcomes now label field strength and local threat rather than pretending to be a contested organism roll.
- Runtime errors and rejected promises display the exact build number on the intro panel.

## Deployment

Delete or replace every file in the GitHub Pages repository, including `sw.js`. After deployment, open the page once in normal Safari, allow it to reload, then reopen the Home Screen app if installed.

Service-worker cache: `evolva-v7-5-1`.
