import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Icon from "./ui/Icon.jsx";
import { LogoMark, ConfirmDialog } from "./ui/kit.jsx";
import { StoreProvider, useStore } from "./core/store.jsx";
import { UIContext } from "./core/ui-context.jsx";
import { accentVars } from "./core/util.js";
import Dashboard from "./views/Dashboard.jsx";
import Contacts from "./views/Contacts.jsx";
import Pipeline from "./views/Pipeline.jsx";
import Agenda from "./views/Agenda.jsx";
import Catalog from "./views/Catalog.jsx";
import Settings from "./views/Settings.jsx";
import { PRESETS } from "./core/presets.js";
import Onboarding from "./views/Onboarding.jsx";
import { ContactPanel, DealPanel, TaskPanel, ItemPanel } from "./views/Panels.jsx";

const VIEWS = { dashboard: Dashboard, contacts: Contacts, pipeline: Pipeline, agenda: Agenda, catalog: Catalog, settings: Settings };

function Backdrop() {
  return (
    <div className="backdrop" aria-hidden="true">
      <div className="blob b1" /><div className="blob b2" /><div className="blob b3" />
      <div className="grid" /><div className="grain" />
    </div>
  );
}

function Palette({ onClose, go, openPanel }) {
  const { config, data } = useStore();
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const listRef = useRef(null);
  const T = config.terms;

  const items = useMemo(() => {
    const nav = [
      ["dashboard", "Panel", "dashboard"], ["contacts", T.contact.p, "users"], ["pipeline", T.deal.p, "pipeline"], ["agenda", T.task.p, "calendar"], ["catalog", T.item.p, "box"], ["settings", "Ajustes", "sliders"],
    ].filter(([k]) => k === "settings" || config.modules[k]).map(([k, label, icon]) => ({ group: "Ir a", label, icon, run: () => go(k) }));
    const actions = [
      config.modules.contacts && { group: "Crear", label: `${T.contact.g === "f" ? "Nueva" : "Nuevo"} ${T.contact.s.toLowerCase()}`, icon: "plus", run: () => openPanel("contact", "new") },
      config.modules.pipeline && { group: "Crear", label: `${T.deal.g === "f" ? "Nueva" : "Nuevo"} ${T.deal.s.toLowerCase()}`, icon: "plus", run: () => openPanel("deal", "new") },
      config.modules.agenda && { group: "Crear", label: `${T.task.g === "f" ? "Nueva" : "Nuevo"} ${T.task.s.toLowerCase()}`, icon: "plus", run: () => openPanel("task", "new") },
      config.modules.catalog && { group: "Crear", label: `${T.item.g === "f" ? "Nueva" : "Nuevo"} ${T.item.s.toLowerCase()}`, icon: "plus", run: () => openPanel("item", "new") },
    ].filter(Boolean);
    const records = [
      ...data.contacts.map((c) => ({ group: T.contact.p, label: c.name, hint: c.email || c.phone, icon: "user", run: () => openPanel("contact", c.id) })),
      ...data.deals.map((d) => ({ group: T.deal.p, label: d.title, icon: "pipeline", run: () => openPanel("deal", d.id) })),
      ...data.items.map((i) => ({ group: T.item.p, label: i.name, hint: i.category, icon: "box", run: () => openPanel("item", i.id) })),
    ];
    const n = q.trim().toLowerCase();
    const all = [...nav, ...actions, ...records];
    return (n ? all.filter((x) => `${x.label} ${x.hint || ""}`.toLowerCase().includes(n)) : [...nav, ...actions, ...records.slice(0, 5)]).slice(0, 40);
  }, [q, config, data, go, openPanel, T]);

  useEffect(() => { listRef.current?.querySelector(".sel")?.scrollIntoView({ block: "nearest" }); }, [sel]);

  const run = (it) => { onClose(); it?.run(); };
  const onKey = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => Math.min(items.length - 1, s + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => Math.max(0, s - 1)); }
    else if (e.key === "Enter") run(items[sel]);
    else if (e.key === "Escape") onClose();
  };

  let last = null;
  return (
    <>
      <div className="overlay" style={{ zIndex: 79 }} onClick={onClose} />
      <div className="palette" role="dialog" aria-label="Buscar">
        <Icon name="search" size={19} className="p-ico" />
        <input autoFocus placeholder={`Buscar ${T.contact.p.toLowerCase()}, ${T.deal.p.toLowerCase()} o acciones…`} value={q} onChange={(e) => { setQ(e.target.value); setSel(0); }} onKeyDown={onKey} />
        <div className="p-list" ref={listRef}>
          {items.length === 0 && <div className="empty" style={{ padding: 30 }}>Sin resultados para «{q}»</div>}
          {items.map((it, i) => {
            const head = it.group !== last ? <div className="p-group" key={`g${i}`}>{it.group}</div> : null;
            last = it.group;
            return (
              <div key={i}>
                {head}
                <button className={`p-item ${i === sel ? "sel" : ""}`} onMouseMove={() => setSel(i)} onClick={() => run(it)}>
                  <Icon name={it.icon} size={17} /><span>{it.label}</span>{it.hint && <span className="hint">{it.hint}</span>}
                </button>
              </div>
            );
          })}
        </div>
        <div className="p-foot"><span><span className="kbd">↑↓</span> navegar</span><span><span className="kbd">↵</span> abrir</span><span><span className="kbd">esc</span> cerrar</span></div>
      </div>
    </>
  );
}

function Shell() {
  const { state, dispatch, ws, config, data } = useStore();
  const [view, setView] = useState("dashboard");
  const [panel, setPanel] = useState(null);
  const [dialog, setDialog] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [palette, setPalette] = useState(false);
  const [wsMenu, setWsMenu] = useState(false);
  const [creating, setCreating] = useState(false);

  const vars = useMemo(() => accentVars(config?.accent || "#8b9cff"), [config?.accent]);
  useEffect(() => {
    Object.entries(vars).forEach(([k, v]) => document.documentElement.style.setProperty(k, v));
  }, [vars]);
  useEffect(() => {
    document.title = config ? `${config.name} · Nexo` : "Nexo · CRM adaptable";
  }, [config]);

  const toast = useCallback((text, icon = "check") => {
    const id = Math.random();
    setToasts((t) => [...t, { id, text, icon }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600);
  }, []);
  const confirm = useCallback((opts) => new Promise((resolve) => setDialog({ ...opts, resolve })), []);
  const openPanel = useCallback((type, id, defaults) => setPanel({ type, id, defaults, key: `${type}:${id}:${Math.random()}` }), []);
  const closePanel = useCallback(() => setPanel(null), []);
  const go = useCallback((v) => { setView(v); setPanel(null); }, []);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setPalette((p) => !p); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const ui = useMemo(() => ({ toast, confirm, openPanel, closePanel, go }), [toast, confirm, openPanel, closePanel, go]);

  if (!ws || creating) {
    return (
      <UIContext.Provider value={ui}>
        <Backdrop />
        <Onboarding
          first={!ws}
          onCancel={ws ? () => setCreating(false) : null}
          onCreate={(opts) => { dispatch({ type: "ws/create", ...opts }); setCreating(false); setView("dashboard"); }}
        />
      </UIContext.Provider>
    );
  }

  const T = config.terms;
  const nav = [
    ["dashboard", "Panel", "dashboard", null],
    ["contacts", T.contact.p, "users", data.contacts.length],
    ["pipeline", T.deal.p, "pipeline", data.deals.length],
    ["agenda", T.task.p, "calendar", data.tasks.filter((t) => !t.done).length],
    ["catalog", T.item.p, "box", data.items.length],
  ].filter(([k]) => config.modules[k]);
  const current = view === "settings" || config.modules[view] ? view : "dashboard";
  const View = VIEWS[current];
  const Panel = { contact: ContactPanel, deal: DealPanel, task: TaskPanel, item: ItemPanel }[panel?.type];

  return (
    <UIContext.Provider value={ui}>
      <Backdrop />
      <div className="app">
        <aside className="sidebar">
          <div className="ws-switch">
            <button className={`ws-btn ${wsMenu ? "open" : ""}`} onClick={() => setWsMenu((o) => !o)} aria-haspopup="menu" aria-expanded={wsMenu}>
              <LogoMark config={config} />
              <div className="grow"><div className="ws-name">{config.name}</div><div className="ws-sub">{PRESETS[config.sector] && config.name !== PRESETS[config.sector].name ? PRESETS[config.sector].name : "Nexo CRM"}</div></div>
              <Icon name="swap" size={16} style={{ color: "var(--muted)" }} />
            </button>
            {wsMenu && (
              <>
                <div style={{ position: "fixed", inset: 0, zIndex: 39 }} onClick={() => setWsMenu(false)} />
                <div className="ws-menu" role="menu">
                  {state.order.map((id) => (
                    <button key={id} className={`menu-item ${id === state.activeId ? "active" : ""}`} onClick={() => { dispatch({ type: "ws/switch", id }); setPanel(null); setView("dashboard"); setWsMenu(false); }}>
                      <span style={{ width: 8, height: 8, borderRadius: 9, background: state.workspaces[id].config.accent, boxShadow: `0 0 8px ${state.workspaces[id].config.accent}` }} />
                      <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{state.workspaces[id].config.name}</span>
                      {id === state.activeId && <Icon name="check" size={15} />}
                    </button>
                  ))}
                  <div className="sep" />
                  <button className="menu-item" onClick={() => { setWsMenu(false); setCreating(true); }}><Icon name="plus" size={16} />Añadir empresa</button>
                </div>
              </>
            )}
          </div>

          <div className="nav-label">Navegación</div>
          <nav className="nav">
            {nav.map(([k, label, icon, n]) => (
              <button key={k} className={`nav-item ${current === k ? "active" : ""}`} onClick={() => go(k)} title={label}>
                <Icon name={icon} size={19} /><span>{label}</span>{n != null && <span className="count">{n}</span>}
              </button>
            ))}
            <button className={`nav-item ${current === "settings" ? "active" : ""}`} onClick={() => go("settings")} title="Ajustes">
              <Icon name="sliders" size={19} /><span>Ajustes</span>
            </button>
          </nav>

          <div className="sidebar-foot">
            <div className="side-card"><b>Nexo · base única</b>Una instalación, muchas empresas. Cada una con su sector, campos y marca.</div>
          </div>
        </aside>

        <div className="main">
          <div className="topbar">
            <button className="search-trigger" onClick={() => setPalette(true)}>
              <Icon name="search" size={16} /><span style={{ flex: 1 }}>Buscar o crear…</span><span className="kbd">Ctrl K</span>
            </button>
            <div className="spacer" />
          </div>
          <main className="page" key={`${state.activeId}:${current}`}><View /></main>
        </div>
      </div>

      {Panel && <Panel key={panel.key} id={panel.id} defaults={panel.defaults} onClose={closePanel} />}
      {palette && <Palette onClose={() => setPalette(false)} go={go} openPanel={openPanel} />}
      {dialog && <ConfirmDialog {...dialog} onResolve={(v) => { dialog.resolve(v); setDialog(null); }} />}
      <div className="toasts" aria-live="polite">
        {toasts.map((t) => <div className="toast" key={t.id}><Icon name={t.icon} size={16} style={t.icon === "alert" ? { color: "var(--warn)" } : undefined} />{t.text}</div>)}
      </div>
    </UIContext.Provider>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}
