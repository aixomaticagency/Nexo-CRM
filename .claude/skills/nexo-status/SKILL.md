---
name: nexo-status
description: Use when asked for the project's current status, what's left to finish, a progress/health check, or "what's incomplete" in Nexo CRM — e.g. "¿cómo va el proyecto?", "¿qué falta?", "haz una evaluación de estado". Self-audits the codebase against docs/phase1-checklist.md rather than trusting the checklist's own checkmarks.
---

# Nexo CRM — self status check

Goal: produce an honest, current answer to "what's done and what's incomplete", without
relying on stale notes (including this project's own `docs/phase1-checklist.md`, whose
checkmarks may be outdated).

## Steps

1. Read `docs/phase1-checklist.md` for the list of Phase 1 requirements and their claimed
   status.
2. For each item, verify it against the actual code (grep/read the referenced file), not
   against the checkbox. Don't trust a `[x]` at face value.
3. Run `npm run lint` and `npm run build` — both must pass cleanly. Report any failure
   verbatim.
4. Scan for things a checklist won't catch: unused/dead code paths, TODO/FIXME comments,
   views that assume a specific sector's fields exist (a violation of the architecture rule in
   `nexo-architecture`), and any place that reads `config.*` without the `!config` guard
   pattern used in `useSchema()`.
5. Update `docs/phase1-checklist.md` if an item's real status differs from what's recorded —
   keep it in sync with what you found, don't just report the drift verbally.
6. Report back in plain language: what's solid, what's broken, what's missing, and whether
   Phase 1 (per the plan: "CRM mínimo funcional, base única reutilizable") can be considered
   done. Don't invent requirements that aren't in the checklist or the plan.
