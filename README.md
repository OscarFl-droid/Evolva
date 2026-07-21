# EVOLVA v9.0.2 — Living Morphology

Visible morphology now scales continuously with lineage complexity, completed Atlas genes, symbionts and play style. Late-game forms use an original chitinous brood-organism aesthetic: segmented armour, hooked feeding limbs, dorsal spines, organ sacs, brood buds and luminous sensory clusters. No specific third-party creature is reproduced.

## Progression
- Six visible morphology stages from Ancestral Cell to Brood Apex.
- Atlas genes add corresponding anatomy immediately.
- Symbionts remain visible as integrated modules.
- Major evolution triggers a short non-blocking morphology burst.
- Lineage panel reports complexity and current morphology identity.

Save key: `evolva-save-v9-0-2`. Migrates v8.3.0 and earlier supported saves. Cache: `evolva-v9-0-2`.

## v9.0.2 stability patch

- Separates Atlas pointer cancellation from pointer release, preventing cancelled iOS gestures from selecting a Genome Atlas node.
- Sanitises migrated capacity, pressure, health, mass, level and generation values before morphology calculations.
- Restores the correct basal origin gene when an older or partially malformed save identifies an origin but lacks its foundational innovation.
- Makes morphology complexity calculations finite and defensive against malformed legacy save data.
- Extends the release audit to verify v9.0.0 and v8.3.0 migration, morphology functions and Atlas cancellation routing.
