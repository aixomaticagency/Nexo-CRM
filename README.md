# Nexo · CRM adaptable

Una sola base de código para cualquier negocio (kioscos, clínicas, restaurantes, inmobiliarias,
gimnasios, peluquerías, bolsas de empleo, agencias B2B…). Un sector es **configuración, no código**:
vocabulario, campos propios, estados y etapas del embudo.

```
npm install
npm run dev      # desarrollo
npm run build    # producción (carpeta dist/)
```

## Cómo cumple el plan de proyecto (v2)
- **Base única multi-cliente**: varias empresas en la misma instalación (selector arriba a la izquierda).
- **Producto configurable**: logo, color de marca, campos, etapas, estados, módulos y términos desde *Ajustes*.
- **Clonable**: *Ajustes → Datos y plantillas* exporta una plantilla (sin datos) para desplegar el siguiente cliente sin desarrollo (<15 % de personalización).
- **Leads, clientes y pipeline**: kanban con arrastrar y soltar, agenda semanal y fichas con notas.
- **Ingreso recurrente**: cualquier campo de oportunidad con `role: "recurring"` alimenta el KPI de MRR del panel (ver preset «Agencia IA / B2B» y «Gimnasio»).
- **Onboarding sin esfuerzo**: asistente de alta por sector, importación CSV y datos de ejemplo.

## Estructura
- `src/core/presets.js` – definición de sectores (aquí se añade uno nuevo).
- `src/core/store.jsx` – estado, persistencia local (localStorage) y multi-empresa.
- `src/ui/fields.jsx` – motor de campos (formulario, ficha y tabla desde el mismo esquema).
- `src/ui/Icon.jsx` – set de iconos propio · `src/index.css` – sistema de diseño oscuro.

## Siguiente paso natural
Los datos viven en el navegador. Para producción multi-usuario, sustituir `store.jsx` por una API
(p. ej. Supabase/Postgres con una columna `workspace_id`); el resto de la app no cambia.
