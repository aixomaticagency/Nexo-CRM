import { useState } from "react";
import Icon from "../ui/Icon.jsx";
import { PageHead } from "../ui/kit.jsx";
import { useStore, useSchema } from "../core/store.jsx";
import { useUI } from "../core/ui-context.jsx";
import { addDaysISO, todayISO, parseISO, relDay } from "../core/util.js";

export default function Agenda() {
  const { data, dispatch } = useStore();
  const { typeByName, T } = useSchema();
  const ui = useUI();
  const [start, setStart] = useState(todayISO());
  const [drag, setDrag] = useState(null);
  const [over, setOver] = useState(null);
  const today = todayISO();
  const days = Array.from({ length: 7 }, (_, i) => addDaysISO(i, start));
  const overdue = data.tasks.filter((t) => !t.done && t.due && t.due < today && t.due < start).sort((a, b) => a.due.localeCompare(b.due));

  const label = (() => {
    const a = parseISO(days[0]);
    const b = parseISO(days[6]);
    const f = (d, o) => d.toLocaleDateString("es-ES", o);
    return `${f(a, { day: "numeric", month: "short" })} – ${f(b, { day: "numeric", month: "short", year: "numeric" })}`;
  })();

  const drop = (iso) => {
    const t = data.tasks.find((x) => x.id === drag);
    if (t && t.due !== iso) {
      dispatch({ type: "rec/save", kind: "task", rec: { ...t, due: iso } });
      ui.toast(`Reprogramado: ${relDay(iso).toLowerCase()}`);
    }
    setDrag(null);
    setOver(null);
  };

  const renderChip = (t) => {
    const ty = typeByName[t.type];
    return (
      <div
        key={t.id}
        className={`tchip ${t.done ? "done" : ""} ${drag === t.id ? "dragging" : ""}`}
        style={{ "--c": ty?.color || "var(--accent)" }}
        draggable
        onDragStart={(e) => { setDrag(t.id); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", t.id); }}
        onDragEnd={() => { setDrag(null); setOver(null); }}
        onClick={() => ui.openPanel("task", t.id)}
      >
        <div className="tm">
          <Icon name={ty?.icon || "check"} size={12} />
          {t.time || "Todo el día"}
          <button className={`checkbox ${t.done ? "on" : ""}`} style={{ marginLeft: "auto", width: 18, height: 18 }} aria-label="Completar" onClick={(e) => { e.stopPropagation(); dispatch({ type: "task/toggle", id: t.id }); }}>
            <Icon name="check" size={12} />
          </button>
        </div>
        <div className="tt">{t.title}</div>
      </div>
    );
  };

  return (
    <div className="page-inner" style={{ maxWidth: "none" }}>
      <PageHead eyebrow="Agenda · 7 días" title={T.task.p} sub={label}>
        <div className="row" style={{ gap: 4 }}>
          <button className="btn icon" aria-label="Semana anterior" onClick={() => setStart(addDaysISO(-7, start))}><Icon name="chevL" size={16} /></button>
          <button className="btn" onClick={() => setStart(todayISO())}>Hoy</button>
          <button className="btn icon" aria-label="Semana siguiente" onClick={() => setStart(addDaysISO(7, start))}><Icon name="chevR" size={16} /></button>
        </div>
        <button className="btn primary" onClick={() => ui.openPanel("task", "new")}><Icon name="plus" size={16} />{T.task.g === "f" ? "Nueva" : "Nuevo"} {T.task.s.toLowerCase()}</button>
      </PageHead>

      {overdue.length > 0 && (
        <div className="card pad" style={{ marginBottom: 14, borderColor: "color-mix(in srgb, var(--bad) 30%, transparent)" }}>
          <div className="card-title" style={{ color: "var(--bad)", marginBottom: 10 }}><Icon name="alert" size={16} />Atrasadas · {overdue.length}</div>
          <div className="row wrap" style={{ alignItems: "stretch" }}>
            {overdue.map((t) => (<div key={t.id} style={{ width: 210 }}>{renderChip(t)}<div className="tiny muted" style={{ padding: "3px 4px" }}>{relDay(t.due)}</div></div>))}
          </div>
        </div>
      )}

      <div className="week">
        {days.map((iso) => {
          const list = data.tasks.filter((t) => t.due === iso).sort((a, b) => (a.time || "99").localeCompare(b.time || "99"));
          const d = parseISO(iso);
          return (
            <div key={iso} className={`day ${iso === today ? "today" : ""} ${over === iso ? "over" : ""}`}
              onDragOver={(e) => { e.preventDefault(); setOver(iso); }}
              onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setOver(null); }}
              onDrop={(e) => { e.preventDefault(); drop(iso); }}>
              <div className="day-head">
                <span className="dd">{d.getDate()}</span>
                <span className="dn">{d.toLocaleDateString("es-ES", { weekday: "short" }).replace(".", "")}</span>
                <button className="add" aria-label="Añadir" onClick={() => ui.openPanel("task", "new", { due: iso })}><Icon name="plus" size={16} /></button>
              </div>
              {list.map((t) => renderChip(t))}
              {list.length === 0 && <div className="tiny" style={{ color: "var(--faint)", padding: "4px" }}>—</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
