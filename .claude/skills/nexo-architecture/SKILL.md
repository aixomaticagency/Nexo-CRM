---
name: nexo-architecture
description: Use when adding or changing a business sector/preset, a custom field type, a pipeline stage/status, or anything else in Nexo CRM that could be done as configuration instead of code. Also use before adding a new view or touching src/core/store.jsx or src/core/presets.js, to make sure the change follows the single-codebase/multi-tenant pattern instead of forking logic per client.
---

# Nexo CRM architecture

Nexo is one React codebase reused across unrelated business types. The rule that makes that
possible: **a sector is configuration, never a code branch.** Every task below exists to keep
that rule intact. If you're about to write `if (sector === "...")` anywhere outside
`src/core/presets.js`, stop — that almost always means the thing you need belongs in a preset
or in the generic engine instead.

## Adding a new business sector

1. Add an entry to `PRESETS` in `src/core/presets.js`: `name`, `desc`, `icon`, `accent`,
   `terms` (vocabulary for contact/deal/task/item, singular+plural+gender via the `t()`
   helper), `contactStatuses`, `stages` (pipeline, each with a `kind`: `open`/`won`/`lost`),
   `contactFields`/`dealFields`/`itemFields` (via the `F()` helper), `taskTypes`, and a `seed`
   block with a handful of realistic example records.
2. Add the new key to `SECTOR_ORDER`.
3. Do **not** add any new component, view, or conditional branch for the sector — if the
   sector needs a field no `FIELD_TYPES` entry supports, that's a field-engine change (below),
   not a sector-specific one.
4. If a field should drive the dashboard's recurring-revenue (MRR) KPI, give it `role:
   "recurring"` — `useSchema()` picks that up automatically.

## Adding a custom field type

Field types are declared once in `src/ui/fields.jsx` (`FIELD_TYPES` + the rendering logic in
`FieldInput`/wherever the type is displayed) and that single definition drives the create/edit
form, the record detail panel, and the table column. Add it there; never add a one-off input
inside a specific view.

## Touching workspace/global state

All reads/writes to a workspace go through `useStore()` and the `reducer` in
`src/core/store.jsx`. New mutations are new action types in that reducer, not direct
`localStorage` access or ad-hoc state in a view. `useSchema()` is the place for anything
derived from `config` that more than one view needs (lookup maps, the recurring field, etc.).

## Views

Views in `src/views/*.jsx` must stay sector-agnostic: pull labels from `config.terms`, fields
from `config.*Fields`, stages from `config.stages`, etc. A view should work correctly for
every sector in `PRESETS` without modification — if it doesn't, the fix belongs in the schema
(presets/fields), not in the view.

## Before finishing a change

- `npm run lint` and `npm run build` must pass.
- Mentally (or actually) switch through a couple of different presets in Settings and confirm
  the change still makes sense — a change that only looks right for one sector's vocabulary or
  field set usually means something got hardcoded.
- Everything is client-only (`localStorage`, no backend) — don't introduce an assumption of a
  server unless that's the explicit task.
