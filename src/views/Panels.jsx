/* Paneles laterales de ficha/edición. Todos se generan desde la configuración del cliente. */

import { useState } from "react";
import Icon from "../ui/Icon.jsx";
import { Drawer, Pill, Avatar, Toggle } from "../ui/kit.jsx";
import { CustomFields, CustomDetails } from "../ui/fields.jsx";
import { useStore, useSchema } from "../core/store.jsx";
import { useUI } from "../core/ui-context.jsx";
import { uid, fmtMoney, fmtDate, relDay, timeAgo, todayISO } from "../core/util.js";

const nuevo = (term) => (term.g === "f" ? "Nueva" : "Nuevo");
const missingRequired = (fields, data) => fields.find((f) => f.required && (data?.[f.key] === "" || data?.[f.key] == null));

function ContactSelect({ value, onChange, contacts, label }) {
  const sorted = [...contacts].sort((a, b) => a.name.localeCompare(b.name));
  return (
    <select className="select" value={value || ""} onChange={(e) => onChange(e.target.value || null)} aria-label={label}>
      <option value="">— Sin asignar —</option>
      {sorted.map((c) => (
        <option key={c.id} value={c.id}>{c.name}</option>
      ))}
    </select>
  );
}

/* ============================ CONTACTO ============================ */

export function ContactPanel({ id, defaults, onClose }) {
  const { config, data, dispatch } = useStore();
  const { statusByName, stageById, typeByName, T } = useSchema();
  const ui = useUI();
  const existing = data.contacts.find((c) => c.id === id);
  const isNew = id === "new";
  const [editing, setEditing] = useState(isNew);
  const [draft, setDraft] = useState(() => existing || { id: uid("c_"), name: "", email: "", phone: "", status: config.contactStatuses[0]?.name || "", tags: [], data: {}, notes: [], createdAt: new Date().toISOString(), ...defaults });
  const [note, setNote] = useState("");

  if (!isNew && !existing) return null;
  const c = editing ? draft : existing;
  const status = statusByName[c.status];
  const deals = data.deals.filter((d) => d.contactId === c.id);
  const tasks = data.tasks.filter((t) => t.contactId === c.id).sort((a, b) => (a.due || "").localeCompare(b.due || ""));

  const save = () => {
    if (!draft.name.trim()) return ui.toast(`Escribe el nombre del ${T.contact.s.toLowerCase()}`, "alert");
    const miss = missingRequired(config.contactFields, draft.data);
    if (miss) return ui.toast(`Falta el campo «${miss.label}»`, "alert");
    dispatch({ type: "rec/save", kind: "contact", rec: { ...draft, name: draft.name.trim() } });
    ui.toast(isNew ? `${T.contact.s} creado` : "Cambios guardados");
    if (isNew) ui.openPanel("contact", draft.id);
    else setEditing(false);
  };

  const remove = async () => {
    if (await ui.confirm({ title: `¿Eliminar a ${c.name}?`, message: "Sus oportunidades y tareas se conservarán pero quedarán sin asignar.", confirmLabel: "Eliminar", danger: true })) {
      dispatch({ type: "rec/delete", kind: "contact", id: c.id });
      ui.toast("Eliminado");
      onClose();
    }
  };

  const addNote = () => {
    if (!note.trim()) return;
    dispatch({ type: "contact/note", id: c.id, text: note.trim() });
    setNote("");
  };

  return (
    <Drawer
      onClose={onClose}
      lead={<Avatar name={c.name || "?"} color={status?.color} size="lg" />}
      title={c.name || `${nuevo(T.contact)} ${T.contact.s.toLowerCase()}`}
      subtitle={!isNew && `Alta ${fmtDate(c.createdAt, true)}`}
      footer={
        editing ? (
          <>
            {!isNew && <button className="btn danger" onClick={remove}><Icon name="trash" size={16} />Eliminar</button>}
            <div className="grow" />
            <button className="btn ghost" onClick={() => (isNew ? onClose() : (setDraft(existing), setEditing(false)))}>Cancelar</button>
            <button className="btn primary" onClick={save}><Icon name="check" size={16} />Guardar</button>
          </>
        ) : (
          <>
            <button className="btn danger" onClick={remove}><Icon name="trash" size={16} /></button>
            <div className="grow" />
            <button className="btn" onClick={() => { setDraft(existing); setEditing(true); }}><Icon name="edit" size={16} />Editar</button>
          </>
        )
      }
    >
      {editing ? (
        <div className="form-grid">
          <div className="field span2">
            <label className="label" htmlFor="c_name">Nombre<span className="req">*</span></label>
            <input id="c_name" className="input" autoFocus value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          </div>
          <div className="field">
            <label className="label" htmlFor="c_email">Email</label>
            <input id="c_email" type="email" className="input" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} />
          </div>
          <div className="field">
            <label className="label" htmlFor="c_phone">Teléfono</label>
            <input id="c_phone" type="tel" className="input" value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} />
          </div>
          <div className="field span2">
            <label className="label">Estado</label>
            <div className="filters">
              {config.contactStatuses.map((s) => (
                <button key={s.name} type="button" className={`fchip ${draft.status === s.name ? "on" : ""}`} style={{ "--c": s.color }} onClick={() => setDraft({ ...draft, status: s.name })}>
                  <span className="pill flat" style={{ "--c": s.color, padding: 0, border: 0, background: "none" }}><i style={{ width: 7, height: 7, borderRadius: 9, background: s.color, display: "inline-block" }} /></span>
                  {s.name}
                </button>
              ))}
            </div>
          </div>
          {config.contactFields.length > 0 && <div className="form-section">Datos de {T.contact.s.toLowerCase()}</div>}
          <CustomFields fields={config.contactFields} data={draft.data} currency={config.currency} onChange={(d) => setDraft({ ...draft, data: d })} />
        </div>
      ) : (
        <>
          <div className="quick">
            {c.phone && <a className="btn sm" href={`tel:${c.phone}`}><Icon name="phone" size={15} />Llamar</a>}
            {c.email && <a className="btn sm" href={`mailto:${c.email}`}><Icon name="mail" size={15} />Email</a>}
            <button className="btn sm" onClick={() => ui.openPanel("task", "new", { contactId: c.id })}><Icon name="calendar" size={15} />{nuevo(T.task)} {T.task.s.toLowerCase()}</button>
            <button className="btn sm" onClick={() => ui.openPanel("deal", "new", { contactId: c.id })}><Icon name="pipeline" size={15} />{nuevo(T.deal)} {T.deal.s.toLowerCase()}</button>
          </div>

          <div className="detail-grid">
            <div className="detail"><div className="dl">Estado</div><div className="dv">{status ? <Pill color={status.color}>{status.name}</Pill> : "—"}</div></div>
            <div className="detail"><div className="dl">Email</div><div className="dv">{c.email ? <a href={`mailto:${c.email}`}>{c.email}</a> : "—"}</div></div>
            <div className="detail"><div className="dl">Teléfono</div><div className="dv">{c.phone ? <a href={`tel:${c.phone}`}>{c.phone}</a> : "—"}</div></div>
            <div className="detail"><div className="dl">Alta</div><div className="dv">{fmtDate(c.createdAt, true)}</div></div>
          </div>
          <CustomDetails fields={config.contactFields} data={c.data} currency={config.currency} />

          <div>
            <div className="section-h"><Icon name="pipeline" size={14} />{T.deal.p} · {deals.length}</div>
            {deals.length === 0 ? <p className="muted tiny">Aún no hay {T.deal.p.toLowerCase()} para este {T.contact.s.toLowerCase()}.</p> : (
              <div className="list">
                {deals.map((d) => {
                  const s = stageById[d.stage];
                  return (
                    <div className="li" key={d.id} onClick={() => ui.openPanel("deal", d.id)}>
                      <div className="grow"><div className="t">{d.title}</div><div className="s">{fmtMoney(d.value, config.currency)}</div></div>
                      {s && <Pill color={s.color}>{s.name}</Pill>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <div className="section-h"><Icon name="calendar" size={14} />{T.task.p} · {tasks.length}</div>
            {tasks.length === 0 ? <p className="muted tiny">Nada programado.</p> : (
              <div className="list">
                {tasks.map((t) => {
                  const ty = typeByName[t.type];
                  return (
                    <div className="li" key={t.id} onClick={() => ui.openPanel("task", t.id)}>
                      <span className="task-ico" style={{ "--c": ty?.color || "var(--accent)" }}><Icon name={ty?.icon || "check"} size={16} /></span>
                      <div className="grow"><div className={`t ${t.done ? "done" : ""}`}>{t.title}</div><div className="s">{relDay(t.due)}{t.time ? ` · ${t.time}` : ""}</div></div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <div className="section-h"><Icon name="note" size={14} />Notas y actividad</div>
            <div className="row" style={{ alignItems: "flex-start", marginBottom: 14 }}>
              <textarea className="textarea" style={{ minHeight: 56 }} placeholder="Añade una nota…" value={note} onChange={(e) => setNote(e.target.value)} onKeyDown={(e) => (e.ctrlKey || e.metaKey) && e.key === "Enter" && addNote()} />
              <button className="btn primary" onClick={addNote} disabled={!note.trim()}>Añadir</button>
            </div>
            <div className="timeline">
              {(c.notes || []).map((n) => (
                <div className="tl-item" key={n.id}>
                  <div className="when">{timeAgo(n.at)}<button aria-label="Borrar nota" onClick={() => dispatch({ type: "contact/note-delete", id: c.id, noteId: n.id })}><Icon name="trash" size={13} /></button></div>
                  <div style={{ whiteSpace: "pre-wrap" }}>{n.text}</div>
                </div>
              ))}
              <div className="tl-item"><div className="when">{fmtDate(c.createdAt, true)}</div><div className="muted">{T.contact.s} añadido al sistema</div></div>
            </div>
          </div>
        </>
      )}
    </Drawer>
  );
}

/* ============================ OPORTUNIDAD ============================ */

export function DealPanel({ id, defaults, onClose }) {
  const { config, data, dispatch } = useStore();
  const { T } = useSchema();
  const ui = useUI();
  const existing = data.deals.find((d) => d.id === id);
  const isNew = id === "new";
  const [draft, setDraft] = useState(() => existing || { id: uid("d_"), title: "", contactId: null, stage: config.stages[0].id, value: "", closeDate: "", data: {}, createdAt: new Date().toISOString(), closedAt: null, ...defaults });
  if (!isNew && !existing) return null;

  const save = () => {
    if (!draft.title.trim()) return ui.toast(`Escribe un título para ${T.deal.s.toLowerCase() === "venta" ? "la" : "el"} ${T.deal.s.toLowerCase()}`, "alert");
    const miss = missingRequired(config.dealFields, draft.data);
    if (miss) return ui.toast(`Falta el campo «${miss.label}»`, "alert");
    const stage = config.stages.find((s) => s.id === draft.stage);
    const rec = { ...draft, title: draft.title.trim(), value: draft.value === "" ? 0 : Number(draft.value), closedAt: stage?.kind === "won" ? draft.closedAt || new Date().toISOString() : null };
    dispatch({ type: "rec/save", kind: "deal", rec });
    ui.toast(isNew ? `${T.deal.s} creado` : "Cambios guardados");
    onClose();
  };
  const remove = async () => {
    if (await ui.confirm({ title: `¿Eliminar «${draft.title}»?`, message: "Esta acción no se puede deshacer.", confirmLabel: "Eliminar", danger: true })) {
      dispatch({ type: "rec/delete", kind: "deal", id: draft.id });
      ui.toast("Eliminado");
      onClose();
    }
  };

  const stage = config.stages.find((s) => s.id === draft.stage);
  return (
    <Drawer
      onClose={onClose}
      lead={<span className="task-ico" style={{ "--c": stage?.color, width: 44, height: 44, borderRadius: 14 }}><Icon name="pipeline" size={22} /></span>}
      title={draft.title || `${nuevo(T.deal)} ${T.deal.s.toLowerCase()}`}
      subtitle={stage && <Pill color={stage.color}>{stage.name}</Pill>}
      footer={<>
        {!isNew && <button className="btn danger" onClick={remove}><Icon name="trash" size={16} />Eliminar</button>}
        <div className="grow" />
        <button className="btn ghost" onClick={onClose}>Cancelar</button>
        <button className="btn primary" onClick={save}><Icon name="check" size={16} />Guardar</button>
      </>}
    >
      <div className="form-grid">
        <div className="field span2">
          <label className="label" htmlFor="d_title">Título<span className="req">*</span></label>
          <input id="d_title" className="input" autoFocus value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
        </div>
        <div className="field span2">
          <label className="label">{T.contact.s}</label>
          <ContactSelect value={draft.contactId} onChange={(v) => setDraft({ ...draft, contactId: v })} contacts={data.contacts} label={T.contact.s} />
        </div>
        <div className="field">
          <label className="label" htmlFor="d_value">Valor</label>
          <div className="input-suffix">
            <input id="d_value" type="number" step="any" className="input" value={draft.value} onChange={(e) => setDraft({ ...draft, value: e.target.value })} />
            <span>{config.currency === "EUR" ? "€" : config.currency}</span>
          </div>
        </div>
        <div className="field">
          <label className="label" htmlFor="d_close">Fecha prevista</label>
          <input id="d_close" type="date" className="input" value={draft.closeDate || ""} onChange={(e) => setDraft({ ...draft, closeDate: e.target.value })} />
        </div>
        <div className="field span2">
          <label className="label">Etapa</label>
          <div className="filters">
            {config.stages.map((s) => (
              <button key={s.id} type="button" className={`fchip ${draft.stage === s.id ? "on" : ""}`} style={{ "--c": s.color }} onClick={() => setDraft({ ...draft, stage: s.id })}>
                <i style={{ width: 7, height: 7, borderRadius: 9, background: s.color, display: "inline-block", boxShadow: `0 0 8px ${s.color}` }} />{s.name}
              </button>
            ))}
          </div>
        </div>
        {config.dealFields.length > 0 && <div className="form-section">Detalles</div>}
        <CustomFields fields={config.dealFields} data={draft.data} currency={config.currency} onChange={(d) => setDraft({ ...draft, data: d })} />
      </div>
    </Drawer>
  );
}

/* ============================ TAREA / CITA ============================ */

export function TaskPanel({ id, defaults, onClose }) {
  const { config, data, dispatch } = useStore();
  const { T } = useSchema();
  const ui = useUI();
  const existing = data.tasks.find((t) => t.id === id);
  const isNew = id === "new";
  const [draft, setDraft] = useState(() => existing || { id: uid("t_"), title: "", type: config.taskTypes[0]?.name, contactId: null, due: todayISO(), time: "", done: false, notes: "", createdAt: new Date().toISOString(), ...defaults });
  if (!isNew && !existing) return null;

  const save = () => {
    if (!draft.title.trim()) return ui.toast("Escribe un título", "alert");
    dispatch({ type: "rec/save", kind: "task", rec: { ...draft, title: draft.title.trim() } });
    ui.toast(isNew ? `${T.task.s} creada` : "Cambios guardados");
    onClose();
  };
  const remove = async () => {
    if (await ui.confirm({ title: "¿Eliminar?", message: `«${draft.title}» se borrará definitivamente.`, confirmLabel: "Eliminar", danger: true })) {
      dispatch({ type: "rec/delete", kind: "task", id: draft.id });
      onClose();
    }
  };
  return (
    <Drawer
      onClose={onClose}
      lead={<span className="task-ico" style={{ "--c": config.taskTypes.find((t) => t.name === draft.type)?.color, width: 44, height: 44, borderRadius: 14 }}><Icon name={config.taskTypes.find((t) => t.name === draft.type)?.icon || "check"} size={22} /></span>}
      title={draft.title || `${nuevo(T.task)} ${T.task.s.toLowerCase()}`}
      subtitle={draft.due && `${relDay(draft.due)}${draft.time ? ` · ${draft.time}` : ""}`}
      footer={<>
        {!isNew && <button className="btn danger" onClick={remove}><Icon name="trash" size={16} />Eliminar</button>}
        <div className="grow" />
        <button className="btn ghost" onClick={onClose}>Cancelar</button>
        <button className="btn primary" onClick={save}><Icon name="check" size={16} />Guardar</button>
      </>}
    >
      <div className="form-grid">
        <div className="field span2">
          <label className="label" htmlFor="t_title">Título<span className="req">*</span></label>
          <input id="t_title" className="input" autoFocus value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
        </div>
        <div className="field span2">
          <label className="label">Tipo</label>
          <div className="filters">
            {config.taskTypes.map((ty) => (
              <button key={ty.name} type="button" className={`fchip ${draft.type === ty.name ? "on" : ""}`} style={{ "--c": ty.color }} onClick={() => setDraft({ ...draft, type: ty.name })}>
                <Icon name={ty.icon} size={14} />{ty.name}
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <label className="label" htmlFor="t_due">Fecha</label>
          <input id="t_due" type="date" className="input" value={draft.due || ""} onChange={(e) => setDraft({ ...draft, due: e.target.value })} />
        </div>
        <div className="field">
          <label className="label" htmlFor="t_time">Hora</label>
          <input id="t_time" type="time" className="input" value={draft.time || ""} onChange={(e) => setDraft({ ...draft, time: e.target.value })} />
        </div>
        <div className="field span2">
          <label className="label">{T.contact.s}</label>
          <ContactSelect value={draft.contactId} onChange={(v) => setDraft({ ...draft, contactId: v })} contacts={data.contacts} label={T.contact.s} />
        </div>
        <div className="field span2">
          <label className="label" htmlFor="t_notes">Notas</label>
          <textarea id="t_notes" className="textarea" value={draft.notes || ""} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
        </div>
        <div className="field span2">
          <div className="check-row">
            <Toggle on={draft.done} onChange={(v) => setDraft({ ...draft, done: v })} label="Completada" />
            <span>Marcar como completada</span>
          </div>
        </div>
      </div>
    </Drawer>
  );
}

/* ============================ CATÁLOGO ============================ */

export function ItemPanel({ id, onClose }) {
  const { config, data, dispatch } = useStore();
  const { T } = useSchema();
  const ui = useUI();
  const existing = data.items.find((i) => i.id === id);
  const isNew = id === "new";
  const [draft, setDraft] = useState(() => existing || { id: uid("i_"), name: "", price: "", category: "", active: true, data: {} });
  if (!isNew && !existing) return null;

  const save = () => {
    if (!draft.name.trim()) return ui.toast("Escribe un nombre", "alert");
    const miss = missingRequired(config.itemFields, draft.data);
    if (miss) return ui.toast(`Falta el campo «${miss.label}»`, "alert");
    dispatch({ type: "rec/save", kind: "item", rec: { ...draft, name: draft.name.trim(), price: draft.price === "" ? 0 : Number(draft.price) } });
    ui.toast(isNew ? `${T.item.s} creado` : "Cambios guardados");
    onClose();
  };
  const remove = async () => {
    if (await ui.confirm({ title: `¿Eliminar «${draft.name}»?`, message: "Esta acción no se puede deshacer.", confirmLabel: "Eliminar", danger: true })) {
      dispatch({ type: "rec/delete", kind: "item", id: draft.id });
      onClose();
    }
  };
  const categories = [...new Set(data.items.map((i) => i.category).filter(Boolean))];
  return (
    <Drawer
      onClose={onClose}
      lead={<span className="task-ico" style={{ "--c": "var(--accent)", width: 44, height: 44, borderRadius: 14 }}><Icon name="box" size={22} /></span>}
      title={draft.name || `${nuevo(T.item)} ${T.item.s.toLowerCase()}`}
      subtitle={draft.category}
      footer={<>
        {!isNew && <button className="btn danger" onClick={remove}><Icon name="trash" size={16} />Eliminar</button>}
        <div className="grow" />
        <button className="btn ghost" onClick={onClose}>Cancelar</button>
        <button className="btn primary" onClick={save}><Icon name="check" size={16} />Guardar</button>
      </>}
    >
      <div className="form-grid">
        <div className="field span2">
          <label className="label" htmlFor="i_name">Nombre<span className="req">*</span></label>
          <input id="i_name" className="input" autoFocus value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
        </div>
        <div className="field">
          <label className="label" htmlFor="i_price">Precio</label>
          <div className="input-suffix">
            <input id="i_price" type="number" step="any" className="input" value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} />
            <span>{config.currency === "EUR" ? "€" : config.currency}</span>
          </div>
        </div>
        <div className="field">
          <label className="label" htmlFor="i_cat">Categoría</label>
          <input id="i_cat" className="input" list="cats" value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} />
          <datalist id="cats">{categories.map((c) => <option key={c} value={c} />)}</datalist>
        </div>
        {config.itemFields.length > 0 && <div className="form-section">Detalles</div>}
        <CustomFields fields={config.itemFields} data={draft.data} currency={config.currency} onChange={(d) => setDraft({ ...draft, data: d })} />
        <div className="field span2">
          <div className="check-row"><Toggle on={draft.active} onChange={(v) => setDraft({ ...draft, active: v })} label="Activo" /><span>{draft.active ? "Visible y disponible" : "Archivado"}</span></div>
        </div>
      </div>
    </Drawer>
  );
}
