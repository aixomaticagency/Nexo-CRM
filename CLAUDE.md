# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```
npm install
npm run dev      # Vite dev server
npm run build    # production build -> dist/
npm run preview  # preview the production build
npm run lint     # ESLint (flat config, eslint.config.js)
```

There is no test suite configured.

## Architecture

Nexo is a single-codebase, multi-tenant CRM: one React app is reused across unrelated
business types (kiosk, clinic, restaurant, real estate, gym, salon, recruiting, B2B agency…)
by treating a "sector" as **pure configuration**, never as separate code paths. The entire
point of the codebase is to keep that invariant — new business logic almost always belongs
in configuration (`presets.js`) or in the generic engine (`store.jsx`, `fields.jsx`), not in a
new branch inside a view.

**Presets define a sector** (`src/core/presets.js`): terminology (`terms`), contact statuses,
pipeline stages, per-entity custom fields (`contactFields`/`dealFields`/`itemFields`), task
types, and seed/demo data. `buildConfig(sectorKey, overrides)` turns a preset into a workspace's
live `config`; `buildWorkspace`/`buildDemoData` wrap that into a full workspace with data.
Adding a sector means adding an entry to `PRESETS` (and to `SECTOR_ORDER`) — not touching any
view or component.

**Store (`src/core/store.jsx`)** holds all workspaces ("empresas") keyed by id, persisted
whole to `localStorage` under `nexo-crm:v1`. Only one workspace is active at a time
(`state.activeId`); `useStore()` exposes `{ state, dispatch, ws, config, data }` for the active
workspace. All mutations go through the `reducer`'s action types (`ws/*`, `config/*`,
`data/replace`, `rec/save`, `rec/delete`, `deal/move`, `task/toggle`, `contact/note*`) — there
is no other write path. `useSchema()` derives lookup maps (`stageById`, `statusByName`,
`typeByName`, the recurring-revenue field) from the active `config`; it returns empty
fallbacks when there's no active workspace, since every view that calls it is only mounted
once `ws` exists (see `Shell` in `App.jsx`, which renders `Onboarding` instead while `!ws`).

**Field engine (`src/ui/fields.jsx`)**: a custom field is declared once (`FIELD_TYPES`) and
the same schema entry drives its form input, its appearance on a record detail panel, and its
table column — there is no per-screen field definition. Adding a field type means adding it
here, once.

**Views** (`src/views/*.jsx`) are generic and sector-agnostic — they render whatever
`config` says (labels, stages, fields), so a view should never hardcode a sector's vocabulary
or assume specific fields exist. `Panels.jsx` holds the create/edit slide-over panels for all
four record kinds (contact, deal, task, item).

**Clone-as-template**: Settings exposes exporting the active workspace's `config` (without
`data`) so a new client can be bootstrapped from it without development — this is the
mechanism behind "base única, no un CRM por cliente".

**Everything is client-side.** There is no backend; all state lives in `localStorage` per
browser. The natural next step if multi-user/shared data is ever needed is to replace
`store.jsx`'s persistence with a real API (e.g. Supabase/Postgres, one `workspace_id` per
tenant) without the rest of the app needing to change, since every view only talks to
`useStore()`/`useSchema()`.
