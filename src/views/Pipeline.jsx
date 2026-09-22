import { useState } from "react";
import Icon from "../ui/Icon.jsx";
import { PageHead, Avatar } from "../ui/kit.jsx";
import { useStore, useSchema } from "../core/store.jsx";
import { useUI } from "../core/ui-context.jsx";
import { fmtMoney, fmtDate, todayISO } from "../core/util.js";

export default function Pipeline() {
  const { config, data, dispatch } = useStore();
  const { T, statusByName } = useSchema();
  const ui = useUI();
  const [drag, setDrag] = useState(null);
  const [over, setOver] = useState(null);
  const contactById = Object.fromEntries(data.contacts.map((c) => [c.id, c]));

  const totalOpen = data.deals.filter((d) => config.stages.find((s) => s.id === d.stage)?.kind === "open").reduce((a, d) => a + (Number(d.value) || 0), 0);

  const drop = (stageId) => {
    if (drag) {
      const d = data.deals.find((x) => x.id === drag);
      if (d && d.stage !== stageId) {
        dispatch({ type: "deal/move", id: drag, stage: stageId });
        const st = config.stages.find((s) => s.id === stageId);
        ui.toast(`Movido a «${st.name}»`);
      }
    }
    setDrag(null);
    setOver(null);
  };

  return (
    <div className="page-inner" style={{ maxWidth: "none" }}>
      <PageHead eyebrow="Embudo" title={T.deal.p} sub={`${fmtMoney(totalOpen, config.currency)} en curso · arrastra las tarjetas entre etapas`}>
        <button className="btn primary" onClick={() => ui.openPanel("deal", "new")}><Icon name="plus" size={16} />{T.deal.g === "f" ? "Nueva" : "Nuevo"} {T.deal.s.toLowerCase()}</button>
      </PageHead>

      <div className="kanban">
        {config.stages.map((s) => {
          const list = data.deals.filter((d) => d.stage === s.id);
          const sum = list.reduce((a, d) => a + (Number(d.value) || 0), 0);
          return (
            <section
              key={s.id}
              className={`col ${over === s.id ? "over" : ""}`}
              style={{ "--c": s.color }}
              onDragOver={(e) => { e.preventDefault(); setOver(s.id); }}
              onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setOver(null); }}
              onDrop={(e) => { e.preventDefault(); drop(s.id); }}
            >
              <div className="col-head">
                <span className="dot" />
                <span className="name">{s.name}</span>
                <span className="cnt">{list.length}</span>
                <span className="sum">{sum ? fmtMoney(sum, config.currency, true) : ""}</span>
              </div>
              <div className="col-body">
                {list.length === 0 && <div className="col-empty">Suelta aquí</div>}
                {list.map((d) => {
                  const c = contactById[d.contactId];
                  const late = s.kind === "open" && d.closeDate && d.closeDate < todayISO();
                  return (
                    <article
                      key={d.id}
                      className={`kcard ${drag === d.id ? "dragging" : ""}`}
                      style={{ "--c": s.color }}
                      draggable
                      onDragStart={(e) => { setDrag(d.id); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", d.id); }}
                      onDragEnd={() => { setDrag(null); setOver(null); }}
                      onClick={() => ui.openPanel("deal", d.id)}
                    >
                      <div className="k-title">{d.title}</div>
                      <div className="k-foot">
                        {c ? <><Avatar name={c.name} size="sm" color={statusByName[c.status]?.color} /><span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 110 }}>{c.name}</span></> : <span>Sin {T.contact.s.toLowerCase()}</span>}
                        {Number(d.value) > 0 && <span className="k-val">{fmtMoney(d.value, config.currency)}</span>}
                      </div>
                      {d.closeDate && s.kind === "open" && (
                        <div className="k-foot" style={late ? { color: "var(--bad)" } : undefined}><Icon name="clock" size={13} />{fmtDate(d.closeDate)}{late && " · vencida"}</div>
                      )}
                    </article>
                  );
                })}
              </div>
              <button className="col-add" onClick={() => ui.openPanel("deal", "new", { stage: s.id })}><Icon name="plus" size={14} />Añadir</button>
            </section>
          );
        })}
      </div>
    </div>
  );
}
