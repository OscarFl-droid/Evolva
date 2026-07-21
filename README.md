# EVOLVA v8.1 — Living World

A coordinated autonomous ecosystem and visual overhaul on the v8 fixed-timestep engine.

## Main changes

- 18% wider camera and 3000×3000 ecosystems
- 30 target autonomous organisms, capped at 44 for mobile performance
- organism hunting, scavenging, courtship, reproduction, autonomous merging, defensive chemistry, schools and producer settlement
- persistent carcasses and detrital food web
- habitat succession: detritus → microbial films → living mats; spores → fungal patches
- weather cycles: calm current, nutrient rain, microbial bloom, thermal surge and spore fronts
- event-aware camera easing for births, hunts and mergers
- richer procedural organisms with role-specific silhouettes and idle membrane animation
- ambient rain, spores, blooms and heat distortion
- persistent ecological counters and save migration from v8.0 and v7

## Performance bounds

Organisms, carcasses and habitat patches are explicitly capped. Simulation remains fixed-timestep and rendering culls off-screen entities.

## Deployment

Delete old repository contents and upload this entire package. Cache: `evolva-v8-1-0`.
