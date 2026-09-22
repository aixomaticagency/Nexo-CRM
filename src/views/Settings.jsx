import { useRef, useState } from "react";
import Icon, { ICON_NAMES } from "../ui/Icon.jsx";
import { PageHead, Toggle, LogoMark } from "../ui/kit.jsx";
import { FIELD_TYPES } from "../ui/fields.jsx";
import { useStore } from "../core/store.jsx";
import { useUI } from "../core/ui-context.jsx";
import { PRESETS, SECTOR_ORDER, PALETTE } from "../core/presets.js";
import { uid, slug, toCSV, download } from "../core/util.js";

const TABS = [
  { id: "general", label: "Marca", icon: "palette" },
  { id: "sector", label: "Sector y términos", icon: "layers" },
  { id: "fields", label: "Campos", icon: "sliders" },
  { id: "pipeline", label: "Embudo y estados", icon: "pipeline" },
  { id: "modules", label: "Módulos", icon: "grid" },
  { id: "data", label: "Datos y plantillas", icon: "database" },
];

const move = (arr, i, d) => {
  const j = i + d;
  if (j < 0 || j >= arr.length) return arr;
  const c = [...arr];
  [c[i], c[j]] = [c[j], c[i]];
  return c;
};

function ColorDot({ value, onChange }) {
  return (
    <label className="color-dot" style={{ "--c": value }}>
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} aria-label="Color" />
    </label>
  );
}

function Arrows({ i, n, onMove }) {
  return (
    <div className="arrows">
      <button disabled={i === 0} onClick={() => onMove(-1)} aria-label="Subir"><Icon name="chevU" size={14} /></button>
      <button disabled={i === n - 1} onClick={() => onMove(1)} aria-label="Bajar"><Icon name="chevD" size={14} /></button>
    </div>
  );
}

/* ---------------------------- Marca ---------------------------- */

function readLogo(file) {
  return new Promise((resolve) => {
    const fr = new FileReader();
    fr.onload = () => {
      const img = new Image();
      img.onload = () => {
        const S = 128;
        const cv = document.createElement("canvas");
        cv.width = cv.height = S;
        const ctx = cv.getContext("2d");
        const k = Math.max(S / img.width, S / img.height);
        ctx.drawImage(img, (S - img.width * k) / 2, (S - img.height * k) / 2, img.width * k, img.height * k);
        resolve(cv.toDataURL("image/png"));
      };
      img.onerror = () => resolve(null);
      img.src = fr.result;
    };
    fr.onerror = () => resolve(null);
    fr.readAsDataURL(file);
  });
}

function General() {
  const { config, dispatch } = useStore();
  const ui = useUI();
  const fileRef = useRef(null);
  const patch = (p) => dispatch({ type: "config/patch", patch: p });
  const onFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = await readLogo(f);
    if (url) patch({ logo: url });
    else ui.toast("No se pudo leer la imagen", "alert");
    e.target.value = "";
  };
  return (
    <>
      <div className="card s-block">
        <h3>Identidad</h3>
        <p className="sub">Nombre, lema y logotipo. Aparecen en el menú y en los informes.</p>
        <div className="row" style={{ alignItems: "flex-start", gap: 20, flexWrap: "wrap" }}>
          <div style={{ textAlign: "center" }}>
            <LogoMark config={config} size="lg" />
            <div className="row" style={{ marginTop: 10, gap: 4, justifyContent: "center" }}>
              <button className="btn sm" onClick={() => fileRef.current?.click()}><Icon name="upload" size={14} />Logo</button>
              {config.logo && <button className="btn sm ghost icon" aria-label="Quitar logo" onClick={() => patch({ logo: null })}><Icon name="x" size={14} /></button>}
            </div>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />
          </div>
          <div className="form-grid" style={{ flex: 1, minWidth: 260 }}>
            <div className="field span2"><label className="label">Nombre de la empresa</label><input className="input" value={config.name} onChange={(e) => patch({ name: e.target.value })} /></div>
            <div className="field span2"><label className="label">Lema (opcional)</label><input className="input" value={config.tagline} placeholder="Ej.: Tu salud, en buenas manos" onChange={(e) => patch({ tagline: e.target.value })} /></div>
            <div className="field"><label className="label">Moneda</label>
              <select className="select" value={config.currency} onChange={(e) => patch({ currency: e.target.value })}>
                {["EUR", "USD", "GBP", "MXN", "ARS", "COP", "CLP", "BRL"].map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>
      <div className="card s-block">
        <h3>Color de marca</h3>
        <p className="sub">Toda la interfaz —fondos, brillos, botones, gráficos— se recalcula a partir de este color.</p>
        <div className="swatches">
          {PALETTE.map((c) => (
            <button key={c} className={`swatch ${config.accent.toLowerCase() === c ? "on" : ""}`} style={{ "--c": c }} onClick={() => patch({ accent: c })} aria-label={c} />
          ))}
          <label className="swatch-custom" title="Color personalizado"><Icon name="plus" size={14} /><input type="color" value={config.accent} onChange={(e) => patch({ accent: e.target.value })} /></label>
        </div>
      </div>
    </>
  );
}

/* ---------------------------- Sector ---------------------------- */

function Sector() {
  const { config, dispatch } = useStore();
  const ui = useUI();
  const [demo, setDemo] = useState(false);
  const setTerm = (k, part, v) => dispatch({ type: "config/patch", patch: { terms: { ...config.terms, [k]: { ...config.terms[k], [part]: v } } } });

  const apply = async (key) => {
    if (key === config.sector) return;
    const ok = await ui.confirm({
      title: `Aplicar «${PRESETS[key].name}»`,
      message: `Se sustituirán los campos, etapas y términos por los del sector, y ${demo ? "se cargarán datos de ejemplo" : "los datos actuales se borrarán"}. Tu nombre, logo y moneda se mantienen.`,
      confirmLabel: "Aplicar sector",
      danger: true,
    });
    if (ok) {
      dispatch({ type: "config/preset", sector: key, demo });
      ui.toast("Sector aplicado");
    }
  };

  return (
    <>
      <div className="card s-block">
        <h3>Sector</h3>
        <p className="sub">Un sector es solo un paquete de configuración: no cambia el motor, cambia el vocabulario, los campos y el embudo.</p>
        <div className="sector-grid">
          {SECTOR_ORDER.map((k) => {
            const p = PRESETS[k];
            return (
              <button key={k} className={`sector ${config.sector === k ? "on" : ""}`} style={{ "--c": p.accent }} onClick={() => apply(k)}>
                <span className="s-ico"><Icon name={p.icon} size={22} /></span>
                <b>{p.name}</b>
                <span>{p.desc}</span>
              </button>
            );
          })}
        </div>
        <div className="check-row" style={{ marginTop: 14 }}><Toggle on={demo} onChange={setDemo} label="Datos de ejemplo" /><span className="muted">Cargar datos de ejemplo al cambiar de sector</span></div>
      </div>
      <div className="card s-block">
        <h3>Terminología</h3>
        <p className="sub">Llama a las cosas como las llama tu negocio: «Paciente», «Socio», «Comensal»…</p>
        {[["contact", "Personas"], ["deal", "Oportunidades"], ["task", "Agenda"], ["item", "Catálogo"]].map(([k, label]) => (
          <div key={k} className="edit-row" style={{ gridTemplateColumns: "90px 1fr 1fr 96px" }}>
            <span className="muted tiny" style={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em" }}>{label}</span>
            <input className="input" aria-label="Singular" placeholder="Singular" value={config.terms[k].s} onChange={(e) => setTerm(k, "s", e.target.value)} />
            <input className="input" aria-label="Plural" placeholder="Plural" value={config.terms[k].p} onChange={(e) => setTerm(k, "p", e.target.value)} />
            <select className="select" aria-label="Género" value={config.terms[k].g} onChange={(e) => setTerm(k, "g", e.target.value)}><option value="m">Masc.</option><option value="f">Fem.</option></select>
          </div>
        ))}
      </div>
    </>
  );
}

/* ---------------------------- Campos ---------------------------- */

const ENTITY = { contactFields: "Personas", dealFields: "Oportunidades", itemFields: "Catálogo" };

function Fields() {
  const { config, dispatch } = useStore();
  const [ent, setEnt] = useState("contactFields");
  const fields = config[ent];
  const set = (next) => dispatch({ type: "config/patch", patch: { [ent]: next } });
  const upd = (i, p) => set(fields.map((f, j) => (j === i ? { ...f, ...p } : f)));
  const add = () => {
    let key = "campo";
    const taken = new Set(fields.map((f) => f.key));
    let n = 1;
    while (taken.has(key)) key = `campo_${++n}`;
    set([...fields, { key, label: "Nuevo campo", type: "text", table: false }]);
  };
  const rename = (i, label) => upd(i, { label });

  return (
    <div className="card s-block">
      <h3>Campos personalizados</h3>
      <p className="sub">Añade los datos propios de tu negocio. Aparecen automáticamente en formularios, fichas, tablas y exportaciones.</p>
      <div style={{ marginBottom: 16 }}>
        <div className="seg">
          {Object.entries(ENTITY).map(([k, l]) => <button key={k} className={ent === k ? "on" : ""} onClick={() => setEnt(k)}>{l}</button>)}
        </div>
      </div>
      {fields.length === 0 && <p className="muted" style={{ marginBottom: 12 }}>Sin campos propios. Añade el primero.</p>}
      {fields.map((f, i) => (
        <div key={f.key} className="edit-row">
          <Arrows i={i} n={fields.length} onMove={(d) => set(move(fields, i, d))} />
          <input className="input" value={f.label} aria-label="Nombre del campo" onChange={(e) => rename(i, e.target.value)} />
          <select className="select" value={f.type} aria-label="Tipo" onChange={(e) => upd(i, { type: e.target.value, options: e.target.value === "select" ? f.options || ["Opción 1", "Opción 2"] : f.options })}>
            {Object.entries(FIELD_TYPES).map(([k, t]) => <option key={k} value={k}>{t.label}</option>)}
          </select>
          {f.type === "select" ? (
            <input className="input" aria-label="Opciones" placeholder="Opciones separadas por coma" value={(f.options || []).join(", ")} onChange={(e) => upd(i, { options: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} />
          ) : (
            <div className="row" style={{ gap: 14 }}>
              <label className="row tiny muted" style={{ gap: 6, cursor: "pointer" }}><Toggle on={!!f.table} onChange={(v) => upd(i, { table: v })} label="Mostrar en tabla" />En tabla</label>
              <label className="row tiny muted" style={{ gap: 6, cursor: "pointer" }}><Toggle on={!!f.required} onChange={(v) => upd(i, { required: v })} label="Obligatorio" />Oblig.</label>
            </div>
          )}
          <button className="btn ghost icon sm" aria-label="Eliminar campo" onClick={() => set(fields.filter((_, j) => j !== i))}><Icon name="trash" size={15} /></button>
        </div>
      ))}
      <button className="btn" onClick={add} style={{ marginTop: 8 }}><Icon name="plus" size={16} />Añadir campo</button>
    </div>
  );
}

/* ---------------------------- Embudo ---------------------------- */

function Pipeline() {
  const { config, data, dispatch } = useStore();
  const ui = useUI();
  const patch = (p) => dispatch({ type: "config/patch", patch: p });

  const stages = config.stages;
  const setStages = (s) => patch({ stages: s });
  const updStage = (i, p) => setStages(stages.map((s, j) => (j === i ? { ...s, ...p } : s)));
  const delStage = (i) => {
    const s = stages[i];
    if (stages.length <= 1) return ui.toast("Debe haber al menos una etapa", "alert");
    if (data.deals.some((d) => d.stage === s.id)) return ui.toast(`Mueve antes las tarjetas de «${s.name}»`, "alert");
    setStages(stages.filter((_, j) => j !== i));
  };

  const renameStatus = (i, name) => {
    const old = config.contactStatuses[i].name;
    patch({ contactStatuses: config.contactStatuses.map((s, j) => (j === i ? { ...s, name } : s)) });
    dispatch({ type: "data/replace", data: { ...data, contacts: data.contacts.map((c) => (c.status === old ? { ...c, status: name } : c)) } });
  };
  const renameType = (i, name) => {
    const old = config.taskTypes[i].name;
    patch({ taskTypes: config.taskTypes.map((s, j) => (j === i ? { ...s, name } : s)) });
    dispatch({ type: "data/replace", data: { ...data, tasks: data.tasks.map((t) => (t.type === old ? { ...t, type: name } : t)) } });
  };

  const TASK_ICONS = ["phone", "calendar", "mail", "check", "user", "zap", "flag", "eye", "note", "pin", "bell"].filter((n) => ICON_NAMES.includes(n));

  return (
    <>
      <div className="card s-block">
        <h3>Etapas del embudo</h3>
        <p className="sub">Cada etapa es una columna del tablero. «Ganada» y «perdida» cierran la operación y alimentan las métricas.</p>
        {stages.map((s, i) => (
          <div key={s.id} className="edit-row stage">
            <Arrows i={i} n={stages.length} onMove={(d) => setStages(move(stages, i, d))} />
            <ColorDot value={s.color} onChange={(c) => updStage(i, { color: c })} />
            <input className="input" aria-label="Nombre de etapa" value={s.name} onChange={(e) => updStage(i, { name: e.target.value })} />
            <select className="select" value={s.kind} aria-label="Tipo de etapa" onChange={(e) => updStage(i, { kind: e.target.value })}>
              <option value="open">En curso</option><option value="won">Ganada</option><option value="lost">Perdida</option>
            </select>
            <button className="btn ghost icon sm" aria-label="Eliminar etapa" onClick={() => delStage(i)}><Icon name="trash" size={15} /></button>
          </div>
        ))}
        <button className="btn" style={{ marginTop: 8 }} onClick={() => setStages([...stages, { id: uid("s_"), name: "Nueva etapa", color: "#94a3b8", kind: "open" }])}><Icon name="plus" size={16} />Añadir etapa</button>
      </div>

      <div className="card s-block">
        <h3>Estados de {config.terms.contact.p.toLowerCase()}</h3>
        <p className="sub">Etiquetas de seguimiento visibles en tablas, fichas y gráficos.</p>
        {config.contactStatuses.map((s, i) => (
          <div key={i} className="edit-row simple">
            <Arrows i={i} n={config.contactStatuses.length} onMove={(d) => patch({ contactStatuses: move(config.contactStatuses, i, d) })} />
            <ColorDot value={s.color} onChange={(c) => patch({ contactStatuses: config.contactStatuses.map((x, j) => (j === i ? { ...x, color: c } : x)) })} />
            <input className="input" aria-label="Nombre del estado" value={s.name} onChange={(e) => renameStatus(i, e.target.value)} />
            <button className="btn ghost icon sm" aria-label="Eliminar estado" onClick={() => config.contactStatuses.length > 1 && patch({ contactStatuses: config.contactStatuses.filter((_, j) => j !== i) })}><Icon name="trash" size={15} /></button>
          </div>
        ))}
        <button className="btn" style={{ marginTop: 8 }} onClick={() => patch({ contactStatuses: [...config.contactStatuses, { name: "Nuevo estado", color: "#94a3b8" }] })}><Icon name="plus" size={16} />Añadir estado</button>
      </div>

      <div className="card s-block">
        <h3>Tipos de {config.terms.task.s.toLowerCase()}</h3>
        <p className="sub">Categorías de la agenda con su icono y color.</p>
        {config.taskTypes.map((s, i) => (
          <div key={i} className="edit-row simple" style={{ gridTemplateColumns: "auto auto auto 1fr auto" }}>
            <Arrows i={i} n={config.taskTypes.length} onMove={(d) => patch({ taskTypes: move(config.taskTypes, i, d) })} />
            <ColorDot value={s.color} onChange={(c) => patch({ taskTypes: config.taskTypes.map((x, j) => (j === i ? { ...x, color: c } : x)) })} />
            <select className="select" style={{ width: 96 }} aria-label="Icono" value={s.icon} onChange={(e) => patch({ taskTypes: config.taskTypes.map((x, j) => (j === i ? { ...x, icon: e.target.value } : x)) })}>
              {TASK_ICONS.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
            <input className="input" aria-label="Nombre" value={s.name} onChange={(e) => renameType(i, e.target.value)} />
            <button className="btn ghost icon sm" aria-label="Eliminar tipo" onClick={() => config.taskTypes.length > 1 && patch({ taskTypes: config.taskTypes.filter((_, j) => j !== i) })}><Icon name="trash" size={15} /></button>
          </div>
        ))}
        <button className="btn" style={{ marginTop: 8 }} onClick={() => patch({ taskTypes: [...config.taskTypes, { name: "Nuevo tipo", icon: "check", color: "#94a3b8" }] })}><Icon name="plus" size={16} />Añadir tipo</button>
      </div>
    </>
  );
}

/* ---------------------------- Módulos ---------------------------- */

function Modules() {
  const { config, dispatch } = useStore();
  const T = config.terms;
  const items = [
    ["dashboard", "Panel", "dashboard", "Métricas, embudo y agenda de un vistazo."],
    ["contacts", T.contact.p, "users", "Fichas, historial de notas y filtros."],
    ["pipeline", T.deal.p, "pipeline", "Tablero kanban con arrastrar y soltar."],
    ["agenda", T.task.p, "calendar", "Vista semanal con recordatorios."],
    ["catalog", T.item.p, "box", "Productos, servicios o inmuebles con precio."],
  ];
  return (
    <div className="card s-block">
      <h3>Módulos activos</h3>
      <p className="sub">Enciende solo lo que este negocio necesita. Un kiosco quizá no quiere un embudo; una clínica sí una agenda.</p>
      {items.map(([k, name, icon, d]) => (
        <div key={k} className="edit-row" style={{ gridTemplateColumns: "auto 1fr auto" }}>
          <span className="task-ico" style={{ "--c": "var(--accent)" }}><Icon name={icon} size={17} /></span>
          <div><div style={{ fontWeight: 650 }}>{name}</div><div className="muted tiny">{d}</div></div>
          <Toggle on={config.modules[k]} onChange={(v) => dispatch({ type: "config/patch", patch: { modules: { ...config.modules, [k]: v } } })} label={name} />
        </div>
      ))}
    </div>
  );
}

/* ---------------------------- Datos ---------------------------- */

function parseCSV(text) {
  const rows = [];
  let row = [];
  let cur = "";
  let q = false;
  const delim = (text.split("\n")[0].match(/;/g) || []).length > (text.split("\n")[0].match(/,/g) || []).length ? ";" : ",";
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"' && text[i + 1] === '"') { cur += '"'; i++; } else if (ch === '"') q = false; else cur += ch;
    } else if (ch === '"') q = true;
    else if (ch === delim) { row.push(cur); cur = ""; }
    else if (ch === "\n" || ch === "\r") { if (ch === "\r" && text[i + 1] === "\n") i++; row.push(cur); rows.push(row); row = []; cur = ""; }
    else cur += ch;
  }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim()));
}

function DataTab() {
  const { ws, config, data, state, dispatch } = useStore();
  const ui = useUI();
  const jsonRef = useRef(null);
  const csvRef = useRef(null);
  const T = config.terms;

  const exportWs = () => { download(`${slug(config.name)}-copia.nexo.json`, JSON.stringify({ nexo: 1, kind: "workspace", ws }, null, 2)); ui.toast("Copia descargada"); };
  const exportTemplate = () => {
    download(`${slug(config.name)}-plantilla.nexo.json`, JSON.stringify({ nexo: 1, kind: "workspace", ws: { ...ws, data: { contacts: [], deals: [], tasks: [], items: [] } } }, null, 2));
    ui.toast("Plantilla de despliegue descargada");
  };

  const importJson = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    try {
      const j = JSON.parse(await f.text());
      if (!j.ws?.config || !j.ws?.data) throw new Error();
      dispatch({ type: "ws/import", ws: j.ws });
      ui.toast(`«${j.ws.config.name}» importada como empresa nueva`);
    } catch {
      ui.toast("Archivo no válido", "alert");
    }
  };

  const importCsv = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    const rows = parseCSV((await f.text()).replace(/^\uFEFF/, ""));
    if (rows.length < 2) return ui.toast("El CSV está vacío", "alert");
    const head = rows[0].map((h) => slug(h));
    const idx = (...names) => head.findIndex((h) => names.includes(h));
    const iName = idx("nombre", "name", "nombre_completo", slug(T.contact.s));
    if (iName < 0) return ui.toast("Falta una columna «Nombre»", "alert");
    const iMail = idx("email", "correo", "e_mail");
    const iTel = idx("telefono", "phone", "movil", "tel");
    const iSt = idx("estado", "status");
    const fieldCols = config.contactFields.map((fl) => ({ fl, i: head.indexOf(slug(fl.label)) })).filter((x) => x.i >= 0);
    let n = 0;
    rows.slice(1).forEach((r) => {
      const name = (r[iName] || "").trim();
      if (!name) return;
      const d = {};
      fieldCols.forEach(({ fl, i }) => {
        const v = (r[i] || "").trim();
        if (v === "") return;
        d[fl.key] = fl.type === "number" || fl.type === "money" ? Number(v.replace(",", ".")) || 0 : fl.type === "tags" ? v.split(/[;|]/).map((x) => x.trim()).filter(Boolean) : fl.type === "checkbox" ? /^(si|sí|yes|true|1)$/i.test(v) : v;
      });
      const stName = iSt >= 0 ? (r[iSt] || "").trim() : "";
      dispatch({ type: "rec/save", kind: "contact", rec: { id: uid("c_"), name, email: iMail >= 0 ? (r[iMail] || "").trim() : "", phone: iTel >= 0 ? (r[iTel] || "").trim() : "", status: config.contactStatuses.find((s) => s.name.toLowerCase() === stName.toLowerCase())?.name || config.contactStatuses[0]?.name || "", tags: [], data: d, notes: [], createdAt: new Date().toISOString() } });
      n++;
    });
    ui.toast(`${n} ${T.contact.p.toLowerCase()} importados`);
  };

  const csvTemplate = () => {
    const cols = [{ label: "Nombre", get: () => "" }, { label: "Email", get: () => "" }, { label: "Teléfono", get: () => "" }, { label: "Estado", get: () => "" }, ...config.contactFields.map((f) => ({ label: f.label, get: () => "" }))];
    download("plantilla-importacion.csv", "\uFEFF" + toCSV([], cols), "text/csv;charset=utf-8");
  };

  const removeWs = async () => {
    if (await ui.confirm({ title: `¿Eliminar «${config.name}»?`, message: "Se borrarán todos sus datos de este navegador. Descarga antes una copia si la necesitas.", confirmLabel: "Eliminar empresa", danger: true })) {
      dispatch({ type: "ws/delete", id: ws.id });
    }
  };
  const clearData = async () => {
    if (await ui.confirm({ title: "¿Vaciar todos los datos?", message: `Se borrarán ${T.contact.p.toLowerCase()}, ${T.deal.p.toLowerCase()}, ${T.task.p.toLowerCase()} y ${T.item.p.toLowerCase()}. La configuración se conserva.`, confirmLabel: "Vaciar", danger: true })) {
      dispatch({ type: "data/replace", data: { contacts: [], deals: [], tasks: [], items: [] } });
      ui.toast("Datos vaciados");
    }
  };

  return (
    <>
      <div className="card s-block">
        <h3>Desplegar para un cliente nuevo</h3>
        <p className="sub">La misma base sirve para todos. Configura una empresa, descarga su <b>plantilla</b> (sin datos) y úsala como punto de partida para el siguiente cliente del mismo sector: cero desarrollo.</p>
        <div className="notice" style={{ marginBottom: 14 }}><Icon name="zap" size={17} /><span>Tienes <b>{state.order.length}</b> {state.order.length === 1 ? "empresa" : "empresas"} en esta base. Cámbiate entre ellas desde el selector de arriba a la izquierda.</span></div>
        <div className="row wrap">
          <button className="btn primary" onClick={exportTemplate}><Icon name="copy" size={16} />Descargar plantilla</button>
          <button className="btn" onClick={() => jsonRef.current?.click()}><Icon name="upload" size={16} />Importar empresa / plantilla</button>
          <input ref={jsonRef} type="file" accept=".json,application/json" hidden onChange={importJson} />
        </div>
      </div>
      <div className="card s-block">
        <h3>Importar {T.contact.p.toLowerCase()} desde CSV</h3>
        <p className="sub">Primera fila con cabeceras: Nombre, Email, Teléfono, Estado y el nombre de cualquiera de tus campos personalizados.</p>
        <div className="row wrap">
          <button className="btn" onClick={() => csvRef.current?.click()}><Icon name="upload" size={16} />Elegir CSV</button>
          <button className="btn ghost" onClick={csvTemplate}><Icon name="download" size={16} />Descargar modelo</button>
          <input ref={csvRef} type="file" accept=".csv,text/csv" hidden onChange={importCsv} />
        </div>
      </div>
      <div className="card s-block">
        <h3>Copias y zona de peligro</h3>
        <p className="sub">Los datos se guardan en este navegador. Descarga copias con regularidad.</p>
        <div className="row wrap">
          <button className="btn" onClick={exportWs}><Icon name="download" size={16} />Copia de seguridad completa</button>
          <button className="btn danger" onClick={clearData}><Icon name="trash" size={16} />Vaciar datos</button>
          <button className="btn danger" onClick={removeWs}><Icon name="x" size={16} />Eliminar empresa</button>
        </div>
        <p className="muted tiny" style={{ marginTop: 12 }}>{data.contacts.length} {T.contact.p.toLowerCase()} · {data.deals.length} {T.deal.p.toLowerCase()} · {data.tasks.length} {T.task.p.toLowerCase()} · {data.items.length} {T.item.p.toLowerCase()}</p>
      </div>
    </>
  );
}

export default function Settings() {
  const [tab, setTab] = useState("general");
  const Body = { general: General, sector: Sector, fields: Fields, pipeline: Pipeline, modules: Modules, data: DataTab }[tab];
  return (
    <div className="page-inner">
      <PageHead eyebrow="Configuración" title="Ajustes" sub="Todo lo que cambia entre un cliente y otro vive aquí, sin tocar código." />
      <div className="settings">
        <nav className="s-nav">
          {TABS.map((t) => (
            <button key={t.id} className={`nav-item ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
              <Icon name={t.icon} size={18} /><span>{t.label}</span>
            </button>
          ))}
        </nav>
        <div key={tab} style={{ animation: "rise .35s var(--ease) both", minWidth: 0 }}><Body /></div>
      </div>
    </div>
  );
}
