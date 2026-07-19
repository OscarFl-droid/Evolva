# EVOLVA v7.1 — Lineage Stability Audit

This release repairs progression, simulation and Atlas-effect faults identified in v7.

## Major fixes

- Evolution screens now pause the ecosystem.
- Multiple level-5 milestones are queued rather than collapsed into one event.
- Multiple copies of the same backpack resource can be committed to an epoch.
- Forecast scores are calculated once before sorting.
- Locked or prerequisite-incompatible Atlas nodes can no longer be chosen.
- A biological consolidation fallback prevents an epoch dead-end when no anatomical node is accessible.
- Epoch choices are validated against the displayed forecast.
- v7 saves migrate into the queued-epoch state model.

## Ecology and trait fixes

- NPCs now complete foraging, recover while resting and hunt each other.
- Feeding Groove increases resource energy yield.
- Pseudopods improve resource experience.
- Surface Exchange and Communication increase interaction range.
- Predatory Strike and Toxin Organelle now provide active interaction attacks.
- Electroreception increases detection range.
- Thermal Engine produces energy in extreme-temperature biomes.
- Adaptive Radiation improves niche compatibility.
- Water immersion visibly reports HYDRATING and restores water each physiology cycle.
- Resource collection autosaves immediately.

## Deployment

Replace all repository files. The service-worker cache is `evolva-v7-1`.
