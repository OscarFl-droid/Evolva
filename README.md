# EVOLVA v8.2.1 — Phenotype Intelligence Stability Patch

This release makes Derived Biological Capacities operational across movement, combat, defence, hydration, detection, ecological fit, signalling, merger, living-module retention and organism inspection.

## New
- Capacity effects displayed directly beneath each biological capacity.
- Five-level organism readout controlled by Cognition, Communication and sensory innovations.
- Tap organisms for a transparent risk-assessment panel; tapping empty terrain still moves.
- Threat classes: easy, favourable, risky, severe and overwhelming.
- High-DPI Living Genome Atlas with richer developmental field graphics, clearer node states, tier rings, complete prerequisites and current/required capacity values.
- v8.2.0 and v8.1 saves migrate into the separate `evolva-save-v8-2-1` key.

Deploy by replacing the repository contents with this package. Cache: `evolva-v8-2-1`.
Run `node tools/audit.mjs` before deployment.

## Stability patch
- Corrects the installed-app manifest identity.
- Measures Atlas and organism overlays before clamping them to the viewport.
- Clears cancelled touch pointers and long-press timers safely.
- Applies intelligence gating consistently to the interaction panel.
- Uses a release-metadata-driven audit instead of hard-coded partial checks.
