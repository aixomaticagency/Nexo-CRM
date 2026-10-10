# Nexo CRM

Un CRM que se adapta al negocio sin tocar el código. En vez de programar una versión
distinta para cada cliente (kiosco, clínica, restaurante, inmobiliaria...) hay una única
base, y lo que cambia sector a sector es solo configuración: cómo se llama cada cosa, qué
campos tiene una ficha, qué etapas tiene el embudo de ventas.

La idea de fondo es poder montar un CRM a medida para un cliente nuevo en minutos, no en días.

```
npm install
npm run dev      # entorno de desarrollo
npm run build    # build de producción, queda en dist/
```

## Cómo funciona

Todo negocio comparte lo mismo por debajo: contactos, un pipeline con etapas, una agenda
y fichas con campos. Lo que cambia de un sector a otro es cómo se llaman las cosas y qué
datos importan, y eso vive entero en un solo archivo, `src/core/presets.js`. Añadir un
sector nuevo es escribir un objeto de configuración, no tocar la app.

Ahora mismo hay presets para: Kiosco, Clínica médica, Restaurante, Inmobiliaria, Gimnasio,
Peluquería, Bolsa de empleo y Agencia B2B — más uno "en blanco" por si quieres definir tus
propios campos desde cero.

## Qué trae

- Varias empresas en la misma instalación, con selector arriba a la izquierda. Útil si
  llevas varios clientes desde un solo panel.
- Todo lo visual (logo, color de marca, campos, etapas, términos) se edita desde *Ajustes*,
  sin tocar código ni redeploy.
- Pipeline en kanban con arrastrar y soltar, agenda semanal, fichas de contacto con notas.
- Si un campo de oportunidad lleva `role: "recurring"`, se suma solo al MRR del panel —
  pensado para negocios con ingresos recurrentes (agencias, gimnasios, suscripciones).
- Asistente de onboarding, importación por CSV y datos de ejemplo, para no arrancar en blanco.
- Desde *Ajustes → Datos y plantillas* se exporta la configuración de un cliente como
  plantilla limpia (sin sus datos), lista para reutilizar en el siguiente.

## Estructura

- `src/core/presets.js` — aquí vive cada sector: nombres, campos, colores, etapas.
- `src/core/store.jsx` — el estado de la app, cómo se guarda (localStorage) y cómo convive
  con varias empresas a la vez.
- `src/ui/fields.jsx` — el motor que dibuja un mismo campo como input, como columna de
  tabla o como dato de ficha, según haga falta.
- `src/ui/Icon.jsx` y `src/index.css` — iconos propios y el tema oscuro.

