# EVOLVA v4 — Pocket Evolution

This release improves mobile playability and makes traits functionally important.

## Version 4 changes

- The directional pad is now overlaid on the environment window.
- FORAGE is a toggle. While active, the pet autonomously moves once every three seconds.
- Directional sensing improves target selection and collection distance.
- Motility increases movement speed.
- Shells and skeletons reduce damage but slow movement.
- Photosynthetic tissue generates energy in bright environments and alters autonomous behaviour.
- External digestion biases foraging toward amino acids and spores.
- Water retention, osmoregulation, thermal tolerance, antifreeze chemistry and detoxification alter survival in relevant biomes.
- The pet drinks automatically when it reaches the water region.
- Fresh water and oasis water hydrate efficiently.
- Saline, acidic, frozen and thermal water impose biologically appropriate constraints, which can be mitigated by evolved traits.
- The Biology screen now describes active functional effects.
- The World screen reports current environmental fit.
- Cache version upgraded to v4 to prevent GitHub Pages serving the previous release.

## Updating the existing GitHub repository

Upload and replace all files in the repository root, including `sw.js`.

After GitHub Pages redeploys, open the game URL and refresh Safari. If the old version remains visible, close the browser tab and reopen it. The v4 service worker will remove the older cache.

## GitHub Pages

The repository root must contain:

- index.html
- styles.css
- game.js
- manifest.webmanifest
- sw.js
- .nojekyll
- icons/icon.svg

The game requires no build process.
