import { useMemo, useState } from "react";
import Icon from "../ui/Icon.jsx";
import { PageHead, Empty, Pill } from "../ui/kit.jsx";
import { FieldValue } from "../ui/fields.jsx";
import { useStore, useSchema } from "../core/store.jsx";
import { useUI } from "../core/ui-context.jsx";
import { fmtMoney } from "../core/util.js";

export default function Catalog() {
  const { config, data } = useStore();
  const { T } = useSchema();
  const ui = useUI();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState(null);
  const cats = [...new Set(data.items.map((i) => i.category).filter(Boolean))];
  const list = useMemo(() => {
    const n = q.trim().toLowerCase();
    return data.items.filter((i) => (!cat || i.category === cat) && (!n || `${i.name} ${i.category}`.toLowerCase().includes(n)));
  }, [data.items, q, cat]);
  const fields = config.itemFields.filter((f) => f.table).slice(0, 3);

  return (
    <div className="page-inner">
      <PageHead eyebrow="Catálogo" title={T.item.p} sub={`${data.items.length} en total`}>
        <button className="btn primary" onClick={() => ui.openPanel("item", "new")}><Icon name="plus" size={16} />{T.item.g === "f" ? "Nueva" : "Nuevo"} {T.item.s.toLowerCase()}</button>
      </PageHead>
      <div className="row wrap" style={{ marginBottom: 14 }}>
        <div className="input-wrap" style={{ width: 280, maxWidth: "100%" }}>
          <Icon name="search" size={16} />
          <input className="input" placeholder={`Buscar ${T.item.p.toLowerCase()}…`} value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="filters">
          {cats.length > 0 && <button className={`fchip ${!cat ? "on" : ""}`} onClick={() => setCat(null)}>Todas</button>}
          {cats.map((c) => <button key={c} className={`fchip ${cat === c ? "on" : ""}`} onClick={() => setCat(cat === c ? null : c)}>{c}</button>)}
        </div>
      </div>
      {list.length === 0 ? (
        <div className="card"><Empty icon="box" title={data.items.length ? "Sin resultados" : `Sin ${T.item.p.toLowerCase()} todavía`} action={!data.items.length && <button className="btn primary" onClick={() => ui.openPanel("item", "new")}><Icon name="plus" size={16} />Añadir</button>}>Define lo que vendes o ofreces para usarlo en tus {T.deal.p.toLowerCase()}.</Empty></div>
      ) : (
        <div className="cards stagger">
          {list.map((i) => (
            <div className="card rec-card" key={i.id} style={i.active ? undefined : { opacity: 0.55 }} onClick={() => ui.openPanel("item", i.id)}>
              <div className="row" style={{ alignItems: "flex-start" }}>
                <div className="grow"><div style={{ fontWeight: 700, lineHeight: 1.3 }}>{i.name}</div>{i.category && <div className="muted tiny" style={{ marginTop: 3 }}>{i.category}</div>}</div>
                {!i.active && <Pill flat>Archivado</Pill>}
              </div>
              <div className="price">{fmtMoney(i.price, config.currency)}</div>
              {fields.length > 0 && (
                <div className="meta">
                  {fields.map((f) => i.data?.[f.key] !== undefined && i.data?.[f.key] !== "" && (
                    <div key={f.key}><Icon name="tag" size={14} /><span><b style={{ fontWeight: 600 }}>{f.label}:</b> <FieldValue field={f} value={i.data[f.key]} currency={config.currency} /></span></div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
