# Fase 1 — checklist de estado

Derivado de `Plan_Proyecto_IA_Automatizacion_sinRaul.pdf` (sección 4.1 y hoja de ruta, mes 1):
el único requisito explícito para el CRM en esa fase es un **"CRM mínimo funcional, como base
única reutilizable"** (multi-cliente, configurable, clonable). Este documento es el checklist
concreto derivado de eso, para que el estado del proyecto se pueda auditar sin releer el PDF.

Mantener esto actualizado cuando se añada o se rompa algo relevante — es el punto de partida
de la skill `nexo-status`.

## Requisitos del plan

- [x] **Base única multi-cliente**: varias empresas en la misma instalación, con selector.
      → `App.jsx` (`ws-switch`), `store.jsx` (`workspaces`/`activeId`).
- [x] **Producto configurable**: logo, color de marca, campos, etapas, estados, módulos y
      términos editables sin tocar código. → `views/Settings.jsx`.
- [x] **Clonable**: exportar la configuración de un cliente como plantilla (sin datos) para
      desplegar el siguiente sin desarrollo. → `Settings.jsx` (`exportTemplate`).
- [x] **Leads, clientes y pipeline**: kanban con arrastrar y soltar, fichas de contacto con
      notas. → `views/Pipeline.jsx`, `views/Contacts.jsx`.
- [x] **Agenda**: tareas/citas con tipos configurables. → `views/Agenda.jsx`.
- [x] **Ingreso recurrente**: un campo de oportunidad con `role: "recurring"` alimenta el KPI
      de MRR del panel. → `views/Dashboard.jsx`, `useSchema()` en `store.jsx`.
- [x] **Onboarding sin esfuerzo**: asistente de alta por sector, datos de ejemplo.
      → `views/Onboarding.jsx`, `buildDemoData` en `presets.js`.
- [x] **Importación/copia de seguridad**: CSV de contactos, copia completa de la empresa,
      importar empresa/plantilla desde JSON. → `Settings.jsx` (pestaña "Datos y plantillas").

## Lo que no cubre el plan todavía (fuera de alcance de Fase 1)

Según el propio PDF (sección 5), lo siguiente es deliberadamente posterior, no una carencia
de Fase 1:

- Backend/API compartida entre usuarios — ahora mismo todo vive en `localStorage` del
  navegador. Es el "siguiente paso natural" documentado en el README, no un requisito de
  Fase 1 (que es explícitamente de baja dedicación y mínima personalización).
- Captación de contactos comerciales automatizada, chatbot de soporte, suscripción de pago —
  son palancas de negocio (sección 5 del plan), no funcionalidad del CRM en sí.

## Cómo usar este checklist

Antes de dar por "terminada" la Fase 1, o cuando alguien pregunte "¿qué falta?", repasar esta
lista contra el código real (no contra lo que dice este documento, que puede quedarse
desactualizado) — ver la skill `nexo-status`.
