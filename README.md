# EVOLVA v6 — Foundation and Feel Update

Version 6 replaces the permanent directional controls with direct interaction and establishes a shared survival simulation for the player and all other organisms.

## Interaction

- Tap anywhere in the world to move there.
- Hold and drag to continue directing movement.
- Double-tap expands the visible field.
- Long-press near another organism to inspect its condition and current behaviour.
- FORAGE delegates immediate survival decisions to the organism.
- REST enters a low-consumption recovery state.
- EVOLVE appears permanently but only succeeds when sufficient ecological experience has accumulated.

## Shared organism simulation

The player and non-player organisms use the same locomotor basis and the same broad survival variables:

- energy
- water
- health
- biomass
- hunger
- fear
- curiosity
- aggression
- genes
- current behavioural state

Non-player organisms may forage, rest, inspect, ignore, hunt or flee. Predation is a risk/reward decision based on hunger, relative size, health, injury risk and nearby alternatives.

## Genotype to phenotype

Collected materials are assimilated automatically and bias seven developmental paths:

- metabolism
- structure
- growth
- sensing
- defence
- homeostasis
- symbiosis

Evolution fixes one supported function at a time. Fixed genes alter physiology, ecological fit, movement, water use, defence and visible anatomy.

## GitHub Pages update

Replace all repository files with the contents of this package:

- index.html
- styles.css
- game.js
- manifest.webmanifest
- sw.js
- README.md
- .nojekyll
- icons/icon.svg

The service-worker cache is `evolva-v6`. Close the old Safari tab after deployment and reopen the GitHub Pages URL.
