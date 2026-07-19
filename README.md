# EVOLVA v7.3 — Atlas Reliability and Mobile Fixes

This build is a troubleshooting release for v7.2.

## Fixed

- Added true two-finger pinch zoom on the Living Genome Atlas.
- Zoom now preserves the point beneath the gesture or mouse cursor.
- Atlas panning is bounded so the graph cannot be permanently lost off-screen.
- Recenter now follows the current fixed lineage.
- Fixed several overlapping nodes in the compact mobile layout.
- Added central links from the organism to fixed basal innovations.
- Improved node hit areas and tooltip placement on narrow screens.
- Tooltips now state both missing prerequisites and unmet biological-axis thresholds.
- Atlas rendering is throttled and stops while another tab is active, reducing iPhone battery use and lag.
- Save camera values are validated to prevent a blank Atlas after malformed or older saves.
- Unknown/deprecated genes and malformed arrays are filtered during save migration.
- New Lineage and Restart now clear all v7-series save keys consistently.
- Evolution forecasts now explicitly show which Atlas regions were illuminated by nutrition, biome and behavioural pressure.
- Progression changes immediately invalidate and redraw the Atlas.
- Updated cache isolation to `evolva-v7-3`.

Existing v7, v7.1 and v7.2 saves migrate automatically.
