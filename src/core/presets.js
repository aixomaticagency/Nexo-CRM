/* ============================================================
   PRESETS DE SECTOR
   ------------------------------------------------------------
   Un sector es solo CONFIGURACIÓN: terminología, campos propios,
   estados y etapas del embudo. El motor (tablas, kanban, agenda,
   formularios, informes) es el mismo para todos. Desplegar un
   cliente nuevo = elegir preset + ajustar variables, sin código.
   ============================================================ */

import { uid, daysAgoStamp, addDaysISO } from "./util.js";

const C = {
  indigo: "#818cf8", sky: "#38bdf8", mint: "#34d399", amber: "#fbbf24", rose: "#fb7185",
  pink: "#f472b6", violet: "#a78bfa", slate: "#94a3b8", teal: "#2dd4bf", orange: "#fb923c",
};
export const PALETTE = [C.indigo, C.sky, C.teal, C.mint, C.amber, C.orange, C.rose, C.pink, C.violet, C.slate];

const t = (s, p, g = "m") => ({ s, p, g });
const st = (id, name, color, kind = "open") => ({ id, name, color, kind });
const F = (key, label, type = "text", x = {}) => ({ key, label, type, ...x });
const S = (name, color) => ({ name, color });
const TT = (a, b, c, d) => [
  { name: a, icon: "phone", color: C.sky },
  { name: b, icon: "calendar", color: C.violet },
  { name: c, icon: "mail", color: C.amber },
  { name: d, icon: "check", color: C.mint },
];

export const PRESETS = {
  kiosco: {
    name: "Kiosco / Comercio",
    desc: "Ventas de mostrador, fidelización y stock.",
    icon: "store",
    accent: "#fbbf24",
    terms: { contact: t("Cliente", "Clientes"), deal: t("Pedido", "Pedidos"), task: t("Tarea", "Tareas", "f"), item: t("Producto", "Productos") },
    contactStatuses: [S("Nuevo", C.sky), S("Habitual", C.mint), S("VIP", C.amber), S("Inactivo", C.slate)],
    stages: [st("reservado", "Reservado", C.indigo), st("preparado", "Preparado", C.amber), st("entregado", "Entregado", C.mint, "won"), st("cancelado", "Cancelado", C.rose, "lost")],
    contactFields: [
      F("tarjeta", "Tarjeta de fidelidad", "select", { options: ["Ninguna", "Bronce", "Plata", "Oro"], table: true }),
      F("puntos", "Puntos acumulados", "number", { table: true }),
      F("pago", "Pago habitual", "select", { options: ["Efectivo", "Tarjeta", "Bizum"] }),
      F("notas", "Notas", "longtext"),
    ],
    dealFields: [F("pago", "Método de pago", "select", { options: ["Efectivo", "Tarjeta", "Bizum"] }), F("beneficio", "Beneficio aplicado")],
    itemFields: [F("stock", "Stock", "number", { table: true }), F("codigo", "Código / EAN")],
    taskTypes: TT("Llamar", "Recogida", "Aviso", "Reponer stock"),
    seed: {
      contacts: [
        ["Marta Ibáñez", "Habitual", { tarjeta: "Plata", puntos: 340, pago: "Tarjeta" }],
        ["Julián Pérez", "VIP", { tarjeta: "Oro", puntos: 1210, pago: "Bizum" }],
        ["Cliente mostrador", "Nuevo", { tarjeta: "Ninguna", puntos: 0, pago: "Efectivo" }],
        ["Carmen Solís", "Habitual", { tarjeta: "Bronce", puntos: 95, pago: "Efectivo" }],
        ["Bar La Esquina", "VIP", { tarjeta: "Oro", puntos: 2050, pago: "Tarjeta", notas: "Pedido semanal de prensa y snacks" }],
        ["Nuria Campos", "Inactivo", { tarjeta: "Bronce", puntos: 20 }],
      ],
      deals: [
        ["Pack prensa + tabaco", 0, 0, 12.5, 1, { pago: "Tarjeta", beneficio: "Descuento fidelidad" }],
        ["Recarga móvil 20 €", 1, 2, 20, 4, { pago: "Bizum" }],
        ["Pedido semanal bar", 4, 1, 186, 2, { pago: "Tarjeta", beneficio: "Precio mayorista" }],
        ["Colección de cromos", 3, 2, 34.9, 9, { pago: "Efectivo" }],
        ["Reserva de abono transporte", 2, 0, 41.5, 1, { pago: "Efectivo" }],
        ["Pedido cancelado", 5, 3, 15, 12, {}],
      ],
      tasks: [["Avisar a Marta: llegó su revista", 0, 0, 0, "10:30"], ["Reponer bebidas frías", 3, 2, 0, "12:00"], ["Recogida del pedido del bar", 1, 4, 1, "09:00"], ["Llamar a proveedor de prensa", 0, null, 2, "11:00"]],
      items: [
        ["Periódico del día", 1.6, "Prensa", { stock: 40, codigo: "PRN-001" }],
        ["Recarga móvil 20 €", 20, "Servicios", { stock: 999, codigo: "REC-020" }],
        ["Cromos (sobre)", 1.2, "Coleccionismo", { stock: 180, codigo: "CRO-014" }],
        ["Agua 50 cl", 0.9, "Bebidas", { stock: 64, codigo: "BEB-050" }],
        ["Abono transporte", 41.5, "Servicios", { stock: 999, codigo: "TRP-001" }],
      ],
    },
  },

  clinica: {
    name: "Clínica médica",
    desc: "Pacientes, tratamientos y citas clínicas.",
    icon: "heart",
    accent: "#2dd4bf",
    terms: { contact: t("Paciente", "Pacientes"), deal: t("Tratamiento", "Tratamientos"), task: t("Cita", "Citas", "f"), item: t("Servicio", "Servicios") },
    contactStatuses: [S("Pendiente", C.amber), S("En tratamiento", C.teal), S("Seguimiento", C.sky), S("Alta", C.slate)],
    stages: [st("primera", "Primera consulta", C.sky), st("diag", "Diagnóstico", C.violet), st("trat", "En tratamiento", C.teal), st("alta", "Alta", C.mint, "won"), st("aband", "Abandonado", C.rose, "lost")],
    contactFields: [
      F("nacimiento", "Fecha de nacimiento", "date"),
      F("medico", "Médico asignado", "select", { options: ["Dr. Salas", "Dra. Ferrer", "Dr. Ortega"], table: true }),
      F("seguro", "Seguro / mutua", "text", { table: true }),
      F("alergias", "Alergias", "tags"),
      F("consentimiento", "Consentimiento RGPD firmado", "checkbox"),
      F("clinica", "Notas clínicas", "longtext"),
    ],
    dealFields: [F("diagnostico", "Diagnóstico", "longtext"), F("sesiones", "Sesiones previstas", "number")],
    itemFields: [F("duracion", "Duración (min)", "number", { table: true })],
    taskTypes: TT("Llamada", "Consulta", "Informe por email", "Revisión de historial"),
    seed: {
      contacts: [
        ["Marta Ibáñez", "En tratamiento", { nacimiento: "1987-04-12", medico: "Dr. Salas", seguro: "Sanitas", alergias: ["Penicilina"], consentimiento: true, clinica: "Seguimiento post-operatorio, revisión en 15 días" }],
        ["Iker Roldán", "Alta", { nacimiento: "1995-11-02", medico: "Dra. Ferrer", seguro: "Privado", alergias: [], consentimiento: true }],
        ["Elena Marín", "Pendiente", { nacimiento: "1978-01-23", medico: "Dr. Ortega", seguro: "Adeslas", alergias: ["Látex", "Polen"], consentimiento: false }],
        ["Tomás Cuesta", "Seguimiento", { nacimiento: "1961-08-30", medico: "Dra. Ferrer", seguro: "Mapfre", alergias: [], consentimiento: true }],
        ["Sofía Prieto", "En tratamiento", { nacimiento: "2001-06-14", medico: "Dr. Salas", seguro: "Sanitas", alergias: ["Ibuprofeno"], consentimiento: true }],
      ],
      deals: [
        ["Rehabilitación de rodilla", 0, 2, 480, 20, { diagnostico: "Post-operatorio LCA", sesiones: 12 }],
        ["Chequeo anual", 1, 3, 90, 30, { diagnostico: "Sin incidencias", sesiones: 1 }],
        ["Estudio alergias", 2, 1, 210, 6, { diagnostico: "Pruebas cutáneas pendientes", sesiones: 2 }],
        ["Control hipertensión", 3, 2, 120, 25, { sesiones: 4 }],
        ["Fisioterapia lumbar", 4, 2, 360, 14, { diagnostico: "Lumbalgia mecánica", sesiones: 8 }],
        ["Primera valoración", 2, 0, 60, 2, {}],
      ],
      tasks: [["Consulta de revisión — Marta", 1, 0, 0, "09:30"], ["Llamar a Elena para consentimiento", 0, 2, 0, "12:00"], ["Sesión 4/8 fisioterapia", 1, 4, 1, "17:00"], ["Enviar informe a Tomás", 2, 3, 1, "10:00"], ["Consulta primera valoración", 1, 2, 3, "11:15"]],
      items: [
        ["Consulta general", 60, "Medicina", { duracion: 30 }],
        ["Sesión de fisioterapia", 45, "Rehabilitación", { duracion: 50 }],
        ["Analítica completa", 85, "Diagnóstico", { duracion: 15 }],
        ["Electrocardiograma", 55, "Diagnóstico", { duracion: 20 }],
      ],
    },
  },

  restaurante: {
    name: "Restaurante / Bar",
    desc: "Reservas, comensales habituales y carta.",
    icon: "dish",
    accent: "#fb923c",
    terms: { contact: t("Comensal", "Comensales"), deal: t("Reserva", "Reservas", "f"), task: t("Tarea", "Tareas", "f"), item: t("Plato", "Platos") },
    contactStatuses: [S("Nuevo", C.sky), S("Habitual", C.mint), S("VIP", C.amber), S("Grupo / empresa", C.violet)],
    stages: [st("solicitada", "Solicitada", C.sky), st("confirmada", "Confirmada", C.violet), st("sentados", "En mesa", C.amber), st("completada", "Completada", C.mint, "won"), st("noshow", "No-show / cancelada", C.rose, "lost")],
    contactFields: [
      F("alergias", "Alergias e intolerancias", "tags", { table: true }),
      F("cumple", "Cumpleaños", "date"),
      F("mesa", "Mesa preferida", "text"),
      F("visitas", "Visitas", "number", { table: true }),
      F("notas", "Preferencias", "longtext"),
    ],
    dealFields: [F("comensales", "Comensales", "number"), F("zona", "Zona", "select", { options: ["Sala", "Terraza", "Barra", "Reservado"] }), F("ocasion", "Ocasión especial")],
    itemFields: [F("alergenos", "Alérgenos", "tags"), F("coste", "Coste de elaboración", "money")],
    taskTypes: TT("Confirmar por teléfono", "Evento", "Enviar carta", "Pedido a proveedor"),
    seed: {
      contacts: [
        ["Lucía Vidal", "VIP", { alergias: ["Gluten"], visitas: 18, mesa: "Ventana 4", notas: "Prefiere vino blanco seco" }],
        ["Rubén Castaño", "Habitual", { alergias: [], visitas: 7 }],
        ["Bufete Alonso & Asociados", "Grupo / empresa", { alergias: ["Marisco"], visitas: 4, notas: "Comidas de empresa, factura siempre" }],
        ["Paula Herrera", "Nuevo", { alergias: ["Lactosa"], visitas: 1, cumple: "1992-10-05" }],
        ["Andrés Molina", "Habitual", { alergias: [], visitas: 9, mesa: "Barra" }],
      ],
      deals: [
        ["Cena aniversario", 0, 1, 120, 3, { comensales: 2, zona: "Sala", ocasion: "Aniversario de boda" }],
        ["Comida de empresa", 2, 1, 640, 5, { comensales: 12, zona: "Reservado" }],
        ["Mesa para 4 sábado", 3, 0, 180, 1, { comensales: 4, zona: "Terraza" }],
        ["Cumpleaños Rubén", 1, 3, 260, 8, { comensales: 8, zona: "Sala", ocasion: "Cumpleaños" }],
        ["Cena de tapas", 4, 3, 75, 10, { comensales: 3, zona: "Barra" }],
        ["Reserva no presentada", 3, 4, 90, 15, { comensales: 4 }],
      ],
      tasks: [["Confirmar reserva del sábado", 0, 2, 0, "11:00"], ["Menú especial comida de empresa", 1, 1, 1, "16:00"], ["Pedido de pescado", 3, null, 0, "08:00"], ["Felicitar a Paula (cumple)", 2, 3, 3, "12:00"]],
      items: [
        ["Arroz meloso de bogavante", 24, "Arroces", { alergenos: ["Marisco"], coste: 9.5 }],
        ["Ensalada de burrata", 12.5, "Entrantes", { alergenos: ["Lactosa"], coste: 4.2 }],
        ["Tarta de queso", 6.5, "Postres", { alergenos: ["Lactosa", "Gluten"], coste: 1.8 }],
        ["Menú degustación", 48, "Menús", { alergenos: [], coste: 17 }],
      ],
    },
  },

  inmobiliaria: {
    name: "Inmobiliaria",
    desc: "Compradores, inmuebles y operaciones.",
    icon: "home",
    accent: "#38bdf8",
    terms: { contact: t("Cliente", "Clientes"), deal: t("Operación", "Operaciones", "f"), task: t("Gestión", "Gestiones", "f"), item: t("Inmueble", "Inmuebles") },
    contactStatuses: [S("Lead", C.sky), S("Buscando", C.amber), S("Propietario", C.violet), S("Cerrado", C.mint)],
    stages: [st("contacto", "Contacto", C.sky), st("visita", "Visita", C.violet), st("oferta", "Oferta", C.amber), st("arras", "Arras", C.orange), st("cerrada", "Cerrada", C.mint, "won"), st("perdida", "Perdida", C.rose, "lost")],
    contactFields: [
      F("interes", "Interés", "select", { options: ["Compra", "Alquiler", "Venta", "Inversión"], table: true }),
      F("presupuesto", "Presupuesto máx.", "money", { table: true }),
      F("zona", "Zona preferida"),
      F("financia", "Necesita financiación", "checkbox"),
    ],
    dealFields: [F("comision", "Comisión estimada", "money"), F("tipo", "Tipo", "select", { options: ["Venta", "Alquiler"] })],
    itemFields: [F("m2", "Superficie (m²)", "number", { table: true }), F("hab", "Habitaciones", "number", { table: true }), F("zona", "Zona")],
    taskTypes: TT("Llamada", "Visita", "Enviar dossier", "Trámite"),
    seed: {
      contacts: [
        ["Familia Gómez-Rey", "Buscando", { interes: "Compra", presupuesto: 285000, zona: "Chamberí", financia: true }],
        ["Álvaro Duarte", "Lead", { interes: "Alquiler", presupuesto: 1100, zona: "Centro" }],
        ["Isabel Navarro", "Propietario", { interes: "Venta", presupuesto: 0, zona: "Retiro", financia: false }],
        ["Grupo Inversor Norte", "Buscando", { interes: "Inversión", presupuesto: 900000, zona: "Cualquiera" }],
      ],
      deals: [
        ["Piso 3 hab. Chamberí", 0, 2, 279000, 12, { comision: 8370, tipo: "Venta" }],
        ["Alquiler estudio Centro", 1, 1, 1050, 4, { comision: 1050, tipo: "Alquiler" }],
        ["Venta ático Retiro", 2, 0, 460000, 20, { comision: 13800, tipo: "Venta" }],
        ["Edificio de rentas", 3, 3, 850000, 35, { comision: 25500, tipo: "Venta" }],
        ["Local comercial", 3, 4, 190000, 50, { comision: 5700, tipo: "Venta" }],
      ],
      tasks: [["Visita piso Chamberí", 1, 0, 0, "18:00"], ["Enviar dossier ático", 2, 2, 1, "10:00"], ["Firma de arras", 3, 3, 3, "12:30"], ["Llamar a Álvaro", 0, 1, 0, "09:30"]],
      items: [
        ["Piso 3 hab. Chamberí", 285000, "Venta", { m2: 98, hab: 3, zona: "Chamberí" }],
        ["Estudio luminoso Centro", 1100, "Alquiler", { m2: 38, hab: 1, zona: "Centro" }],
        ["Ático con terraza", 470000, "Venta", { m2: 120, hab: 3, zona: "Retiro" }],
      ],
    },
  },

  gimnasio: {
    name: "Gimnasio / Estudio",
    desc: "Socios, planes, clases y bajas.",
    icon: "dumbbell",
    accent: "#f472b6",
    terms: { contact: t("Socio", "Socios"), deal: t("Suscripción", "Suscripciones", "f"), task: t("Tarea", "Tareas", "f"), item: t("Plan", "Planes") },
    contactStatuses: [S("Prueba", C.sky), S("Activo", C.mint), S("En riesgo", C.amber), S("Baja", C.slate)],
    stages: [st("prueba", "Clase de prueba", C.sky), st("propuesta", "Propuesta", C.violet), st("alta", "Alta", C.mint, "won"), st("baja", "Baja", C.rose, "lost")],
    contactFields: [
      F("objetivo", "Objetivo", "select", { options: ["Pérdida de peso", "Fuerza", "Salud", "Rendimiento"], table: true }),
      F("alta", "Fecha de alta", "date"),
      F("ultima", "Última visita", "date", { table: true }),
      F("lesiones", "Lesiones", "longtext"),
    ],
    dealFields: [F("cuota_mensual", "Cuota mensual", "money", { role: "recurring" }), F("permanencia", "Permanencia (meses)", "number")],
    itemFields: [F("cuota", "Cuota mensual", "money"), F("aforo", "Aforo", "number")],
    taskTypes: TT("Llamar", "Clase / evaluación", "Email", "Renovación"),
    seed: {
      contacts: [
        ["Daniela Ruiz", "Activo", { objetivo: "Fuerza", alta: "2026-01-12", ultima: addDaysISO(-1) }],
        ["Mateo Lozano", "En riesgo", { objetivo: "Salud", alta: "2025-10-04", ultima: addDaysISO(-19), lesiones: "Hombro derecho" }],
        ["Carla Benítez", "Prueba", { objetivo: "Pérdida de peso", ultima: addDaysISO(-2) }],
        ["Óscar Vega", "Activo", { objetivo: "Rendimiento", alta: "2024-09-01", ultima: addDaysISO(0) }],
        ["Irene Tapia", "Baja", { objetivo: "Salud", alta: "2025-03-20", ultima: addDaysISO(-60) }],
      ],
      deals: [
        ["Plan Premium", 0, 2, 59, 200, { cuota_mensual: 59, permanencia: 12 }],
        ["Plan Básico", 3, 2, 35, 500, { cuota_mensual: 35, permanencia: 6 }],
        ["Propuesta Plan Premium", 2, 1, 59, 3, { cuota_mensual: 59, permanencia: 12 }],
        ["Retención Mateo", 1, 1, 35, 5, { cuota_mensual: 35 }],
        ["Baja de Irene", 4, 3, 35, 40, { cuota_mensual: 35 }],
      ],
      tasks: [["Llamar a Mateo (19 días sin venir)", 0, 1, 0, "18:00"], ["Evaluación inicial de Carla", 1, 2, 1, "17:30"], ["Renovar Plan de Óscar", 3, 3, 4, "10:00"]],
      items: [["Plan Básico", 35, "Mensual", { cuota: 35, aforo: 0 }], ["Plan Premium", 59, "Mensual", { cuota: 59, aforo: 0 }], ["Clase de spinning", 8, "Clases", { aforo: 18 }]],
    },
  },

  belleza: {
    name: "Belleza / Peluquería",
    desc: "Citas, fichas de cliente y servicios.",
    icon: "scissors",
    accent: "#a78bfa",
    terms: { contact: t("Cliente", "Clientes"), deal: t("Reserva", "Reservas", "f"), task: t("Cita", "Citas", "f"), item: t("Servicio", "Servicios") },
    contactStatuses: [S("Nueva", C.sky), S("Recurrente", C.mint), S("VIP", C.amber), S("Sin volver", C.slate)],
    stages: [st("solicitada", "Solicitada", C.sky), st("confirmada", "Confirmada", C.violet), st("realizada", "Realizada", C.mint, "won"), st("cancelada", "Cancelada", C.rose, "lost")],
    contactFields: [
      F("tipo_pelo", "Tipo de cabello", "select", { options: ["Liso", "Ondulado", "Rizado", "Graso", "Seco"] }),
      F("tinte", "Fórmula de tinte", "text"),
      F("profesional", "Profesional habitual", "text", { table: true }),
      F("alergias", "Alergias", "tags"),
      F("ultima", "Última visita", "date", { table: true }),
    ],
    dealFields: [F("profesional", "Profesional"), F("duracion", "Duración (min)", "number")],
    itemFields: [F("duracion", "Duración (min)", "number", { table: true })],
    taskTypes: TT("Llamar", "Cita", "Recordatorio", "Pedido productos"),
    seed: {
      contacts: [
        ["Beatriz Llorente", "VIP", { tipo_pelo: "Ondulado", tinte: "7.3 + 20vol", profesional: "Ana", alergias: ["Amoníaco"], ultima: addDaysISO(-14) }],
        ["Sara Villalba", "Recurrente", { tipo_pelo: "Liso", profesional: "Marcos", ultima: addDaysISO(-30) }],
        ["Noa Fuentes", "Nueva", { tipo_pelo: "Rizado", profesional: "Ana" }],
        ["Pilar Soto", "Sin volver", { tipo_pelo: "Seco", ultima: addDaysISO(-120) }],
      ],
      deals: [
        ["Mechas + corte", 0, 1, 95, 2, { profesional: "Ana", duracion: 150 }],
        ["Corte y peinado", 1, 0, 32, 1, { profesional: "Marcos", duracion: 45 }],
        ["Tratamiento hidratante", 2, 2, 40, 6, { profesional: "Ana", duracion: 60 }],
        ["Color completo", 0, 2, 70, 30, { profesional: "Ana", duracion: 120 }],
      ],
      tasks: [["Cita: Beatriz — mechas", 1, 0, 0, "16:30"], ["Recordatorio a Sara", 2, 1, 1, "10:00"], ["Pedir tintes a proveedor", 3, null, 2, "09:00"]],
      items: [["Corte", 22, "Cabello", { duracion: 40 }], ["Mechas", 75, "Color", { duracion: 150 }], ["Manicura", 25, "Estética", { duracion: 45 }], ["Tratamiento hidratante", 40, "Cabello", { duracion: 60 }]],
    },
  },

  empleo: {
    name: "Bolsa de empleo",
    desc: "Candidatos, vacantes y procesos de selección.",
    icon: "briefcase",
    accent: "#818cf8",
    terms: { contact: t("Candidato", "Candidatos"), deal: t("Proceso", "Procesos"), task: t("Tarea", "Tareas", "f"), item: t("Vacante", "Vacantes", "f") },
    contactStatuses: [S("Disponible", C.mint), S("En proceso", C.amber), S("Contratado", C.sky), S("Descartado", C.rose)],
    stages: [st("recibido", "CV recibido", C.slate), st("cribado", "Cribado", C.sky), st("entrevista", "Entrevista", C.violet), st("oferta", "Oferta", C.amber), st("contratado", "Contratado", C.mint, "won"), st("descartado", "Descartado", C.rose, "lost")],
    contactFields: [
      F("puesto", "Puesto deseado", "text", { table: true }),
      F("aptitudes", "Aptitudes", "tags", { table: true }),
      F("experiencia", "Años de experiencia", "number"),
      F("salario", "Expectativa salarial", "money"),
      F("pros", "Pros", "longtext"),
      F("contras", "Contras", "longtext"),
      F("cv", "Enlace al CV", "url"),
    ],
    dealFields: [F("empresa", "Empresa cliente"), F("comision", "Comisión de la colocación", "money")],
    itemFields: [F("empresa", "Empresa", "text", { table: true }), F("salario", "Salario ofertado", "money"), F("plazas", "Plazas", "number")],
    taskTypes: TT("Llamada de cribado", "Entrevista", "Email", "Verificar referencias"),
    seed: {
      contacts: [
        ["Lucía Vidal", "Disponible", { puesto: "Administrativa", aptitudes: ["Excel", "Atención al cliente"], experiencia: 2, salario: 1500, pros: "Muy organizada, aprende rápido", contras: "Poca experiencia previa" }],
        ["Rubén Castaño", "En proceso", { puesto: "Mozo de almacén", aptitudes: ["Carnet carretillero", "Turnos flexibles"], experiencia: 5, salario: 1400, pros: "Disponibilidad total", contras: "Sin coche propio" }],
        ["Alicia Montes", "Disponible", { puesto: "Contable", aptitudes: ["Contaplus", "Fiscalidad"], experiencia: 8, salario: 2300 }],
        ["Héctor Ribas", "Descartado", { puesto: "Comercial", aptitudes: ["Ventas B2B"], experiencia: 1, contras: "No cumple el perfil" }],
      ],
      deals: [
        ["Administrativa — Logística Sur", 0, 2, 0, 3, { empresa: "Logística Sur", comision: 900 }],
        ["Mozo — Almacenes Vega", 1, 3, 0, 8, { empresa: "Almacenes Vega", comision: 700 }],
        ["Contable — Gestoría Ríos", 2, 1, 0, 2, { empresa: "Gestoría Ríos", comision: 1200 }],
        ["Comercial — Zenit", 3, 5, 0, 20, { empresa: "Zenit" }],
      ],
      tasks: [["Entrevista con Lucía", 1, 0, 0, "11:00"], ["Verificar referencias de Rubén", 3, 1, 1, "09:30"], ["Llamada de cribado — Alicia", 0, 2, 2, "16:00"]],
      items: [["Administrativa", 0, "Oficina", { empresa: "Logística Sur", salario: 1500, plazas: 1 }], ["Mozo de almacén", 0, "Logística", { empresa: "Almacenes Vega", salario: 1400, plazas: 2 }]],
    },
  },

  agencia: {
    name: "Agencia IA / B2B",
    desc: "Prospección, demos y suscripciones recurrentes.",
    icon: "bot",
    accent: "#818cf8",
    terms: { contact: t("Lead", "Leads"), deal: t("Oportunidad", "Oportunidades", "f"), task: t("Tarea", "Tareas", "f"), item: t("Paquete", "Paquetes") },
    contactStatuses: [S("Frío", C.slate), S("Contactado", C.sky), S("Interesado", C.amber), S("Cliente", C.mint)],
    stages: [st("prospecto", "Prospecto", C.slate), st("contactado", "Contactado", C.sky), st("demo", "Demo", C.violet), st("propuesta", "Propuesta", C.amber), st("cliente", "Cliente", C.mint, "won"), st("perdido", "Perdido", C.rose, "lost")],
    contactFields: [
      F("empresa", "Empresa", "text", { table: true }),
      F("sector", "Sector", "text", { table: true }),
      F("fuente", "Fuente", "select", { options: ["Scraping", "LinkedIn", "Referido", "Redes propias", "Auditoría gratuita"] }),
      F("web", "Web", "url"),
      F("tamano", "Tamaño", "select", { options: ["1-5", "6-20", "21-50", "50+"] }),
      F("notas", "Notas de cualificación", "longtext"),
    ],
    dealFields: [
      F("cuota_mensual", "Cuota mensual", "money", { role: "recurring" }),
      F("setup", "Pago inicial (setup)", "money"),
      F("personalizacion", "Personalización (%)", "number"),
    ],
    itemFields: [F("setup", "Setup", "money"), F("cuota", "Cuota mensual", "money", { table: true }), F("horas", "Horas de puesta en marcha", "number")],
    taskTypes: TT("Seguimiento", "Demo", "Primer contacto", "Auditoría"),
    seed: {
      contacts: [
        ["Clínica Dental Arce", "Interesado", { empresa: "Clínica Dental Arce", sector: "Salud", fuente: "Scraping", tamano: "6-20", web: "https://ejemplo.es" }],
        ["Ferretería Hnos. Lara", "Contactado", { empresa: "Ferretería Lara", sector: "Comercio", fuente: "LinkedIn", tamano: "1-5" }],
        ["Restaurante Marea", "Cliente", { empresa: "Marea", sector: "Hostelería", fuente: "Auditoría gratuita", tamano: "6-20", notas: "Cliente piloto" }],
        ["Gestoría Ríos", "Frío", { empresa: "Gestoría Ríos", sector: "Servicios", fuente: "Scraping", tamano: "6-20" }],
        ["Taller Mecánico Rueda", "Interesado", { empresa: "Taller Rueda", sector: "Automoción", fuente: "Referido", tamano: "1-5" }],
      ],
      deals: [
        ["CRM + dashboard — Marea", 2, 4, 60, 40, { cuota_mensual: 60, setup: 300, personalizacion: 10 }],
        ["Pack Entrada — Dental Arce", 0, 2, 90, 6, { cuota_mensual: 90, setup: 450, personalizacion: 15 }],
        ["CRM básico — Taller Rueda", 4, 1, 45, 4, { cuota_mensual: 45, setup: 250, personalizacion: 5 }],
        ["Primer contacto — Lara", 1, 1, 0, 3, {}],
        ["Auditoría — Gestoría Ríos", 3, 0, 0, 1, {}],
      ],
      tasks: [["Demo con Dental Arce", 1, 0, 1, "12:00"], ["Seguimiento automático: Lara", 0, 3, 0, "09:00"], ["Enviar propuesta a Taller Rueda", 3, 4, 2, "10:30"], ["Revisar horas activas por cliente", 3, null, 5, "17:00"]],
      items: [
        ["Pack Entrada (CRM + Dashboard)", 450, "Suscripción", { setup: 450, cuota: 60, horas: 6 }],
        ["CRM configurable", 250, "Suscripción", { setup: 250, cuota: 45, horas: 3 }],
        ["Auditoría de IA", 0, "Gancho comercial", { setup: 0, cuota: 0, horas: 1 }],
      ],
    },
  },

  blank: {
    name: "En blanco",
    desc: "Parte de cero y define tus propios campos.",
    icon: "hex",
    accent: "#818cf8",
    terms: { contact: t("Contacto", "Contactos"), deal: t("Oportunidad", "Oportunidades", "f"), task: t("Tarea", "Tareas", "f"), item: t("Producto", "Productos") },
    contactStatuses: [S("Nuevo", C.sky), S("Activo", C.mint), S("Inactivo", C.slate)],
    stages: [st("nuevo", "Nueva", C.sky), st("progreso", "En curso", C.amber), st("ganada", "Ganada", C.mint, "won"), st("perdida", "Perdida", C.rose, "lost")],
    contactFields: [F("empresa", "Empresa", "text", { table: true }), F("notas", "Notas", "longtext")],
    dealFields: [],
    itemFields: [],
    taskTypes: TT("Llamada", "Reunión", "Email", "Tarea"),
    seed: { contacts: [], deals: [], tasks: [], items: [] },
  },
};

export const SECTOR_ORDER = ["kiosco", "clinica", "restaurante", "inmobiliaria", "gimnasio", "belleza", "empleo", "agencia", "blank"];

const clone = (x) => JSON.parse(JSON.stringify(x));

/** Configuración (todo lo que es "variable de cliente") a partir de un preset. */
export function buildConfig(key, overrides = {}) {
  const p = PRESETS[key] || PRESETS.blank;
  return {
    sector: key,
    name: overrides.name || p.name,
    tagline: "",
    accent: overrides.accent || p.accent,
    logo: null,
    currency: "EUR",
    terms: clone(p.terms),
    contactStatuses: clone(p.contactStatuses),
    stages: clone(p.stages),
    contactFields: clone(p.contactFields),
    dealFields: clone(p.dealFields),
    itemFields: clone(p.itemFields),
    taskTypes: clone(p.taskTypes),
    modules: { dashboard: true, contacts: true, pipeline: true, agenda: true, catalog: true },
  };
}

/** Datos de ejemplo coherentes con el sector. */
export function buildDemoData(key, config) {
  const seed = (PRESETS[key] || PRESETS.blank).seed;
  const cs = config.contactStatuses;
  const contacts = seed.contacts.map(([name, status, data], i) => ({
    id: uid("c_"),
    name,
    email: `${name.toLowerCase().normalize("NFD").replace(/[^a-z ]/g, "").split(" ").slice(0, 2).join(".")}@ejemplo.com`,
    phone: `6${String(10000000 + ((i + 3) * 7919317) % 89999999).padStart(8, "0")}`,
    status: cs.find((s) => s.name === status)?.name || cs[0]?.name || "",
    tags: [],
    data: data || {},
    notes: [],
    createdAt: daysAgoStamp(2 + i * 6),
  }));
  const deals = seed.deals.map(([title, ci, si, value, ago, data]) => {
    const stage = config.stages[si] || config.stages[0];
    const createdAt = daysAgoStamp(ago);
    return {
      id: uid("d_"),
      title,
      contactId: contacts[ci]?.id || null,
      stage: stage.id,
      value,
      closeDate: addDaysISO(Math.max(3, 14 - ago)),
      data: data || {},
      createdAt,
      closedAt: stage.kind === "won" ? daysAgoStamp(Math.max(0, ago - 3)) : null,
    };
  });
  const tasks = seed.tasks.map(([title, ti, ci, day, time]) => ({
    id: uid("t_"),
    title,
    type: config.taskTypes[ti]?.name || config.taskTypes[0].name,
    contactId: ci == null ? null : contacts[ci]?.id || null,
    due: addDaysISO(day),
    time,
    done: false,
    createdAt: daysAgoStamp(1),
  }));
  const items = seed.items.map(([name, price, category, data]) => ({ id: uid("i_"), name, price, category, active: true, data: data || {} }));
  return { contacts, deals, tasks, items };
}

export function buildWorkspace(key, { name, accent, demo = true } = {}) {
  const config = buildConfig(key, { name, accent });
  const data = demo ? buildDemoData(key, config) : { contacts: [], deals: [], tasks: [], items: [] };
  return { id: uid("w_"), createdAt: new Date().toISOString(), config, data };
}
