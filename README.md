# EVOLVA v8.0 — Lineage Engine Rewrite

V8 replaces the frame-coupled prototype loop with a fixed-timestep system engine while preserving the v7 mechanics and save history.

## Preserved mechanics

- six biomes, local tile descriptions and passive water uptake
- forage, directed movement, rest and migration
- nutritional memory, developmental recipes and epoch feeding
- Living Genome Atlas, prerequisites, pressure forecasting and major evolution
- autonomous organism ecology and risk/reward behaviour
- signal, merge, engulf and defend encounter intentions
- d20-style biological resolution
- visible symbiont modules and reverse assimilation
- mucus, toxin, electrical, nutrient and alarm area effects
- persistent conditioned niches and enhanced healing
- XP, adaptation points, generations, phenotype and history
- offline support and migration from v7 through v7.5.1

## Engine architecture

`js/engine.js` provides a fixed 60 Hz simulation, ordered systems, independent render passes, event-based error reporting and bounded catch-up.

`js/game.js` contains the biological domain layer. Its update work is separated into clock, player movement, world interaction, organism AI, niche, population and physiology systems.

`js/main.js` owns bootstrapping and service-worker lifecycle. Service-worker failures are non-fatal and are never reported as gameplay errors.

## Deployment

Delete obsolete repository files before uploading this package. In particular, remove the old root `game.js`; v8 loads `js/main.js`, `js/engine.js` and `js/game.js`.

Current cache: `evolva-v8-0-0`.
