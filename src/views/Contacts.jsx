import { useMemo, useState } from "react";
import Icon from "../ui/Icon.jsx";
import { PageHead, Pill, Avatar, Segmented, Empty } from "../ui/kit.jsx";
import { FieldValue } from "../ui/fields.jsx";
import { useStore, useSchema } from "../core/store.jsx";
import { useUI } from "../core/ui-context.jsx";
import { fmtDate, toCSV, download } from "../core/util.js";

export default function Contacts() {
  const { config, data } = useStore();
  const { statusByName, T } = useSchema();
  const ui = useUI();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState(null);
  const [view, setView] = useState(() => {
    try { return localStorage.getItem("nexo:contact-view") || "table"; } catch { return "table"; }
  });
  const [sort, setSort] = useState({ key: "createdAt", dir: "desc" });

  const setViewPersist = (v) => {
    setView(v);
    try { localStorage.setItem("nexo:contact-view", v); } catch { /* sin almacenamiento */ }
  };

  const tableFields = config.contactFields.filter((f) => f.table).slice(0, 3);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let list = data.contacts.filter((c) => {
      if (status && c.status !== status) return false;
      if (!needle) return true;
      const hay = [c.name, c.email, c.phone, c.status, ...(c.tags || []), ...Object.values(c.data || {}).flat()].join(" ").toLowerCase();
      return hay.includes(needle);
    });
    const get = (c) => (sort.key === "createdAt" ? c.createdAt : sort.key === "name" ? c.name.toLowerCase() : sort.key === "status" ? c.status : c.data?.[sort.key] ?? "");
    list = [...list].sort((a, b) => {
      const x = get(a);
      const y = get(b);
      const r = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y), "es", { numeric: true });
      return sort.dir === "asc" ? r : -r;
    });
    return list;
  }, [data.contacts, q, status, sort]);

  const toggleSort = (key) => setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
  const th = (k, label) => (
    <th key={k} className="sortable" onClick={() => toggleSort(k)}>
      {label}
      {sort.key === k && <Icon name={sort.dir === "asc" ? "chevU" : "chevD"} size={12} />}
    </th>
  );

  const exportCSV = () => {
    const cols = [
      { label: "Nombre", get: (c) => c.name },
      { label: "Email", get: (c) => c.email },
      { label: "Teléfono", get: (c) => c.phone },
      { label: "Estado", get: (c) => c.status },
      ...config.contactFields.map((f) => ({ label: f.label, get: (c) => c.data?.[f.key] })),
      { label: "Alta", get: (c) => c.createdAt.slice(0, 10) },
    ];
    download(`${T.contact.p.toLowerCase()}.csv`, "\uFEFF" + toCSV(rows, cols), "text/csv;charset=utf-8");
    ui.toast(`${rows.length} filas exportadas`);
  };

  const counts = Object.fromEntries(config.contactStatuses.map((s) => [s.name, data.contacts.filter((c) => c.status === s.name).length]));
  const newLabel = `${T.contact.g === "f" ? "Nueva" : "Nuevo"} ${T.contact.s.toLowerCase()}`;

  return (
    <div className="page-inner">
      <PageHead eyebrow="Base de datos" title={T.contact.p} sub={`${data.contacts.length} registros · ${rows.length} visibles`}>
        <button className="btn" onClick={exportCSV} disabled={!rows.length}><Icon name="download" size={16} />CSV</button>
        <button className="btn primary" onClick={() => ui.openPanel("contact", "new")}><Icon name="plus" size={16} />{newLabel}</button>
      </PageHead>

      <div className="row wrap" style={{ marginBottom: 14, justifyContent: "space-between" }}>
        <div className="row wrap" style={{ flex: 1 }}>
          <div className="input-wrap" style={{ width: 280, maxWidth: "100%" }}>
            <Icon name="search" size={16} />
            <input className="input" placeholder={`Buscar ${T.contact.p.toLowerCase()}…`} value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="filters">
            <button className={`fchip ${!status ? "on" : ""}`} onClick={() => setStatus(null)}>Todos <span className="n">{data.contacts.length}</span></button>
            {config.contactStatuses.map((s) => (
              <button key={s.name} className={`fchip ${status === s.name ? "on" : ""}`} style={{ "--c": s.color }} onClick={() => setStatus(status === s.name ? null : s.name)}>
                <i style={{ width: 7, height: 7, borderRadius: 9, background: s.color, boxShadow: `0 0 8px ${s.color}` }} />{s.name} <span className="n">{counts[s.name]}</span>
              </button>
            ))}
          </div>
        </div>
        <Segmented value={view} onChange={setViewPersist} options={[{ value: "table", icon: "list", label: "" }, { value: "cards", icon: "grid", label: "" }]} />
      </div>

      {rows.length === 0 ? (
        <div className="card">
          <Empty icon="users" title={data.contacts.length ? "Sin resultados" : `Aún no hay ${T.contact.p.toLowerCase()}`} action={!data.contacts.length && <button className="btn primary" onClick={() => ui.openPanel("contact", "new")}><Icon name="plus" size={16} />{newLabel}</button>}>
            {data.contacts.length ? "Prueba con otra búsqueda o quita los filtros." : "Crea el primero o importa tu lista para empezar."}
          </Empty>
        </div>
      ) : view === "table" ? (
        <div className="card table-card">
          <div className="table-scroll">
            <table className="tbl">
              <thead>
                <tr>
                  {th("name", "Nombre")}
                  {th("status", "Estado")}
                  {tableFields.map((f) => th(f.key, f.label))}
                  {th("createdAt", "Alta")}
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => {
                  const s = statusByName[c.status];
                  return (
                    <tr key={c.id} onClick={() => ui.openPanel("contact", c.id)}>
                      <td><div className="cell-main"><Avatar name={c.name} color={s?.color} /><div><div>{c.name}</div><div className="cell-sub">{c.email || c.phone || "Sin contacto"}</div></div></div></td>
                      <td>{s ? <Pill color={s.color}>{s.name}</Pill> : <span className="muted">—</span>}</td>
                      {tableFields.map((f) => <td key={f.key}><FieldValue field={f} value={c.data?.[f.key]} currency={config.currency} /></td>)}
                      <td className="muted">{fmtDate(c.createdAt)}</td>
                      <td style={{ textAlign: "right" }}><Icon name="chevR" size={16} className="go" /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="cards stagger">
          {rows.map((c) => {
            const s = statusByName[c.status];
            return (
              <div className="card rec-card" key={c.id} onClick={() => ui.openPanel("contact", c.id)}>
                <div className="row">
                  <Avatar name={c.name} color={s?.color} />
                  <div className="grow"><div style={{ fontWeight: 700 }}>{c.name}</div>{s && <div style={{ marginTop: 3 }}><Pill color={s.color}>{s.name}</Pill></div>}</div>
                </div>
                <div className="meta">
                  {c.email && <div><Icon name="mail" size={14} /><span>{c.email}</span></div>}
                  {c.phone && <div><Icon name="phone" size={14} /><span>{c.phone}</span></div>}
                  {tableFields.slice(0, 2).map((f) => c.data?.[f.key] !== undefined && c.data?.[f.key] !== "" && (
                    <div key={f.key}><Icon name="tag" size={14} /><span><b style={{ fontWeight: 600 }}>{f.label}:</b> <FieldValue field={f} value={c.data[f.key]} currency={config.currency} /></span></div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
