# EVOLVA v6.1 — Stability and Interaction Repair

This release audits and repairs the v6 foundation build.

## Fixed

- Restored the backpack.
- Collected food is metabolised when energy is needed and stored when energy is high.
- Stored resources can be invested into genotype pathways.
- Replaced duplicate touch and pointer listeners with one pointer-event system.
- Corrected conversion from iPhone screen coordinates to canvas and world coordinates.
- Added pointer capture so dragging remains reliable near the canvas edge.
- Removed the accidental double-tap zoom behaviour.
- Added a clear crosshair at the exact selected destination.
- Rebuilt terrain generation using stable integer world coordinates. The landscape no longer changes as the camera moves.
- Save loading now safely merges missing inventory and pathway fields.
- Added migration back to the Ecology panel.
- Bumped the service-worker cache to `evolva-v6-1`.

## Upload

Replace all files in the GitHub repository with this package, including `sw.js`. Close the old Safari tab after deployment and reopen the site.
