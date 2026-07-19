# EVOLVA v5 — Open-ended Niche Genetics Survival

EVOLVA v5 is a major systems rebuild focused on ecological survival, genotype-to-phenotype development and open-ended lineage change.

## Major version 5 systems

### Behavioural modes
- **REST is a toggle.** While active, energy and health recover continuously.
- Water consumption during rest is drastically reduced.
- Rest stops manual movement and autonomous foraging.
- Rest automatically ends when energy and health are nearly full.
- **FORAGE is a toggle.** The organism moves autonomously every three seconds.
- Forage seeks resources and edible prey while avoiding larger predators.
- Sensing genes extend avoidance and improve target selection.

### Automatic metabolism and biome resource ecology
- Energy-bearing resources are metabolised automatically when collected and energy is below full.
- When energy is full, the resource is stored in the backpack.
- Stored resources can be invested deliberately into a developmental path.
- Every biome has a distinct weighted abundance profile.
- Examples:
  - Tidal Pool: minerals, osmolytes and pigments
  - Fungal Forest: spores, amino acids and sugars
  - Wind Desert: pigments and minerals, but little food
  - Acid Marsh: abundant nutrients with toxin risk
  - Frozen Basin: lipid-rich but sparse
  - Hydrothermal Shelf: mineral-rich and sugar-poor

### Growth and agar-style camera scaling
- **DIVIDE** converts energy and protein reserves into biomass.
- Every growth event increases physical size.
- The biome camera progressively zooms out as biomass rises.
- Larger organisms therefore perceive a wider ecological field.
- Mass also changes movement speed, predation risk and prey availability.

### Genotype network
The former flat trait list has been replaced by seven connected developmental paths:

- Metabolism
- Structure
- Growth
- Sensing
- Defence
- Homeostasis
- Symbiosis

Collected items push different paths. Thresholds make functions available, while EVOLVE fixes an individual gain or loss. The active genotype generates:

- sprite anatomy
- metabolism
- trophic mode
- movement
- resource use
- water balance
- damage resistance
- predator avoidance
- ecological niche fit
- future evolution direction

### Incremental evolution
- EVOLVE changes one heritable function at a time.
- Most events are gains of a function supported by the current build path.
- Poor niche fit increases the chance of loss-of-function evolution.
- Rare variants can appear at low frequency.
- Open-ended branch names are generated after the defined thresholds are exhausted.
- Each fixed gene is expressed in the organism's visible sprite where applicable.

### Dynamic predators and prey
- Every biome contains prey and predators.
- Non-player organisms spontaneously gain or lose mass and traits.
- Prey can be food, competitors or sources of ecological teaching.
- Predators can reduce health and biomass.
- Severe attacks can remove an evolved function.
- Small predators can be repelled or consumed by suitable offensive phenotypes.
- Risk and reward scale with relative biomass and genotype.

## Updating GitHub Pages

Replace every file in the repository root with this release:

- `index.html`
- `styles.css`
- `game.js`
- `manifest.webmanifest`
- `sw.js`
- `.nojekyll`
- `README.md`
- `icons/icon.svg`

Do not upload the outer `evolva-github-v5` folder itself. Upload its contents.

The cache identifier is `evolva-v5`; the new service worker deletes older caches during activation.

After deployment, close the old Safari tab and reopen:

`https://oscarfl-droid.github.io/evolva/`

Version 4 saves are imported into the new genotype model where possible.
