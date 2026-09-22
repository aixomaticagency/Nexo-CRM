import { useMemo, useState } from "react";
import Icon from "../ui/Icon.jsx";
import { PageHead, Pill, Avatar, Empty } from "../ui/kit.jsx";
import { AreaChart, Donut } from "../ui/charts.jsx";
import { useStore, useSchema } from "../core/store.jsx";
import { useUI } from "../core/ui-context.jsx";
import { fmtMoney, relDay, todayISO, isoDate, timeAgo } from "../core/util.js";

const DAY = 86400000;

function greeting() {
  const h = new Date().getHours();
  return h < 6 ? "Buenas noches" : h < 13 ? "Buenos días" : h < 21 ? "Buenas tardes" : "Buenas noches";
}

export default function Dashboard() {
  const { config, data } = useStore();
  const { stageById, statusByName, typeByName, recurring, T } = useSchema();
  const ui = useUI();
  const cur = config.currency;
  const [now] = useState(() => Date.now());

  const m = useMemo(() => {
    const inRange = (stamp, from, to) => {
      const t = new Date(stamp).getTime();
      return t >= from && t < to;
    };
    const newNow = data.contacts.filter((c) => inRange(c.createdAt, now - 30 * DAY, now + DAY)).length;
    const newPrev = data.contacts.filter((c) => inRange(c.createdAt, now - 60 * DAY, now - 30 * DAY)).length;
    const open = data.deals.filter((d) => stageById[d.stage]?.kind === "open");
    const won = data.deals.filter((d) => stageById[d.stage]?.kind === "won");
    const lost = data.deals.filter((d) => stageById[d.stage]?.kind === "lost");
    const won30 = won.filter((d) => d.closedAt && new Date(d.closedAt).getTime() > now - 30 * DAY);
    const conv = won.length + lost.length ? Math.round((won.length / (won.length + lost.length)) * 100) : null;
    const mrr = recurring ? won.reduce((a, d) => a + (Number(d.data?.[recurring.key]) || 0), 0) : null;

    const series = Array.from({ length: 30 }, (_, i) => {
      const day = new Date(now - (29 - i) * DAY);
      const key = isoDate(day);
      return {
        label: day.toLocaleDateString("es-ES", { day: "numeric", month: "short" }).replace(".", ""),
        full: day.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" }),
        value: data.contacts.filter((c) => isoDate(new Date(c.createdAt)) === key).length,
      };
    });
    // curva de crecimiento: total acumulado de la base al final de cada día
    const base = data.contacts.filter((c) => new Date(c.createdAt).getTime() < now - 29 * DAY).length;
    let run = base;
    const smooth = series.map((s) => ({ ...s, value: (run += s.value) }));

    const funnel = config.stages.map((s) => {
      const list = data.deals.filter((d) => d.stage === s.id);
      return { ...s, count: list.length, sum: list.reduce((a, d) => a + (Number(d.value) || 0), 0) };
    });
    const statusSlices = config.contactStatuses.map((s) => ({ name: s.name, color: s.color, value: data.contacts.filter((c) => c.status === s.name).length }));

    const today = todayISO();
    const pending = data.tasks.filter((t) => !t.done).sort((a, b) => `${a.due} ${a.time || ""}`.localeCompare(`${b.due} ${b.time || ""}`));
    const overdue = pending.filter((t) => t.due && t.due < today).length;
    const todayN = pending.filter((t) => t.due === today).length;
    return { newNow, newPrev, open, won30, conv, mrr, smooth, funnel, statusSlices, pending, overdue, todayN };
  }, [data, config, stageById, recurring, now]);

  const delta = m.newNow - m.newPrev;
  const openValue = m.open.reduce((a, d) => a + (Number(d.value) || 0), 0);
  const wonValue = m.won30.reduce((a, d) => a + (Number(d.value) || 0), 0);
  const maxFunnel = Math.max(1, ...m.funnel.map((f) => f.count));
  const recent = [...data.contacts].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);
  const upcoming = m.pending.slice(0, 6);

  return (
    <div className="page-inner">
      <PageHead eyebrow={config.name} title={<><span className="grad">{greeting()}</span> 👋</>} sub={config.tagline || `Así va ${config.name} hoy.`}>
        <button className="btn" onClick={() => ui.openPanel("task", "new")}><Icon name="calendar" size={16} />{T.task.s} rápida</button>
        <button className="btn primary" onClick={() => ui.openPanel("contact", "new")}><Icon name="plus" size={16} />{T.contact.g === "f" ? "Nueva" : "Nuevo"} {T.contact.s.toLowerCase()}</button>
      </PageHead>

      <div className="kpis stagger">
        <div className="card kpi" style={{ "--k": "var(--accent)" }}>
          <div className="k-top"><span className="k-ico"><Icon name="users" size={17} /></span>{T.contact.p}</div>
          <div className="k-val">{data.contacts.length}</div>
          <div className="k-foot"><span className={`delta ${delta >= 0 ? "up" : "down"}`}><Icon name={delta >= 0 ? "arrowUp" : "arrowDown"} size={12} />{Math.abs(delta)}</span> nuevos en 30 días</div>
        </div>
        <div className="card kpi" style={{ "--k": "var(--accent-2)" }}>
          <div className="k-top"><span className="k-ico"><Icon name="pipeline" size={17} /></span>{T.deal.p} abiertas</div>
          <div className="k-val">{fmtMoney(openValue, cur, true)}</div>
          <div className="k-foot">{m.open.length} en curso</div>
        </div>
        {m.mrr != null ? (
          <div className="card kpi" style={{ "--k": "var(--ok)" }}>
            <div className="k-top"><span className="k-ico"><Icon name="repeat" size={17} /></span>Ingreso recurrente</div>
            <div className="k-val">{fmtMoney(m.mrr, cur)}<span className="muted" style={{ fontSize: 14, fontWeight: 600 }}>/mes</span></div>
            <div className="k-foot">≈ {fmtMoney(m.mrr * 12, cur, true)} al año</div>
          </div>
        ) : (
          <div className="card kpi" style={{ "--k": "var(--ok)" }}>
            <div className="k-top"><span className="k-ico"><Icon name="trend" size={17} /></span>Cerrado · 30 días</div>
            <div className="k-val">{fmtMoney(wonValue, cur, true)}</div>
            <div className="k-foot">{m.won30.length} {(m.won30.length === 1 ? T.deal.s : T.deal.p).toLowerCase()} cerrad{m.won30.length === 1 && T.deal.g === "f" ? "a" : m.won30.length === 1 ? "o" : T.deal.g === "f" ? "as" : "os"}</div>
          </div>
        )}
        <div className="card kpi" style={{ "--k": "var(--warn)" }}>
          <div className="k-top"><span className="k-ico"><Icon name="target" size={17} /></span>Conversión</div>
          <div className="k-val">{m.conv == null ? "—" : `${m.conv}%`}</div>
          <div className="k-foot">{m.overdue > 0 ? <><Icon name="alert" size={13} style={{ color: "var(--bad)" }} /> {m.overdue} {(m.overdue === 1 ? T.task.s : T.task.p).toLowerCase()} {m.overdue === 1 ? "atrasada" : "atrasadas"}</> : `${m.todayN} ${(m.todayN === 1 ? T.task.s : T.task.p).toLowerCase()} para hoy`}</div>
        </div>
      </div>

      <div className="dash-grid">
        <div className="card pad">
          <div className="card-title"><Icon name="trend" size={17} style={{ color: "var(--accent)" }} />Crecimiento de {T.contact.p.toLowerCase()}<span className="muted tiny">últimos 30 días</span></div>
          {data.contacts.length ? <AreaChart data={m.smooth} format={(v) => `${v} en total`} /> : <Empty icon="users" title="Todavía no hay datos">Añade tu primer {T.contact.s.toLowerCase()} y verás aquí cómo crece tu base.</Empty>}
        </div>
        <div className="card pad">
          <div className="card-title"><Icon name="target" size={17} style={{ color: "var(--accent-2)" }} />Embudo</div>
          <div className="funnel">
            {m.funnel.map((f) => (
              <div className="f-row" key={f.id} style={{ "--c": f.color }}>
                <span className="name">{f.name}</span>
                <div className="f-bar"><i style={{ width: `${Math.max(f.count ? 6 : 0, (f.count / maxFunnel) * 100)}%` }} /></div>
                <span className="val">{f.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="dash-grid b">
        <div className="card pad">
          <div className="card-title"><Icon name="clock" size={17} style={{ color: "var(--warn)" }} />Próximas {T.task.p.toLowerCase()}</div>
          {upcoming.length === 0 ? <p className="muted">Todo al día 🎉</p> : (
            <div className="list">
              {upcoming.map((t) => {
                const ty = typeByName[t.type];
                const late = t.due < todayISO();
                return (
                  <div className="li" key={t.id} onClick={() => ui.openPanel("task", t.id)}>
                    <span className="task-ico" style={{ "--c": ty?.color || "var(--accent)" }}><Icon name={ty?.icon || "check"} size={16} /></span>
                    <div className="grow"><div className="t">{t.title}</div><div className="s" style={late ? { color: "var(--bad)" } : undefined}>{relDay(t.due)}{t.time ? ` · ${t.time}` : ""}</div></div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="card pad">
          <div className="card-title"><Icon name="users" size={17} style={{ color: "var(--accent)" }} />Últimos {T.contact.p.toLowerCase()}</div>
          {recent.length === 0 ? <p className="muted">Sin registros todavía.</p> : (
            <div className="list">
              {recent.map((c) => (
                <div className="li" key={c.id} onClick={() => ui.openPanel("contact", c.id)}>
                  <Avatar name={c.name} color={statusByName[c.status]?.color} />
                  <div className="grow"><div className="t">{c.name}</div><div className="s">{timeAgo(c.createdAt)}</div></div>
                  {statusByName[c.status] && <Pill color={statusByName[c.status].color}>{c.status}</Pill>}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="card pad">
          <div className="card-title"><Icon name="layers" size={17} style={{ color: "var(--accent-3)" }} />Reparto por estado</div>
          <div className="donut-wrap">
            <Donut slices={m.statusSlices} center={<div><div style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.03em" }}>{data.contacts.length}</div><div className="muted tiny">{T.contact.p.toLowerCase()}</div></div>} />
            <div className="legend">
              {m.statusSlices.map((s) => <div key={s.name} style={{ "--c": s.color }}><i />{s.name}<b>{s.value}</b></div>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
