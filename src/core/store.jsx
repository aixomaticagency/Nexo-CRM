/* Estado global: varias empresas (workspaces) en una sola base, con persistencia local. */

import { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import { buildWorkspace, buildConfig, buildDemoData } from "./presets.js";
import { uid } from "./util.js";

const KEY = "nexo-crm:v1";
const KINDS = { contact: "contacts", deal: "deals", task: "tasks", item: "items" };

const EMPTY = { workspaces: {}, order: [], activeId: null };

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const s = JSON.parse(raw);
    return s && s.workspaces ? s : EMPTY;
  } catch {
    return EMPTY;
  }
}

function onActive(state, fn) {
  const ws = state.workspaces[state.activeId];
  if (!ws) return state;
  return { ...state, workspaces: { ...state.workspaces, [ws.id]: fn(ws) } };
}

function reducer(state, a) {
  switch (a.type) {
    case "ws/create": {
      const ws = buildWorkspace(a.sector, a);
      return { workspaces: { ...state.workspaces, [ws.id]: ws }, order: [...state.order, ws.id], activeId: ws.id };
    }
    case "ws/switch":
      return state.workspaces[a.id] ? { ...state, activeId: a.id } : state;
    case "ws/delete": {
      const rest = { ...state.workspaces };
      delete rest[a.id];
      const order = state.order.filter((x) => x !== a.id);
      return { workspaces: rest, order, activeId: state.activeId === a.id ? order[0] || null : state.activeId };
    }
    case "ws/import": {
      const ws = { ...a.ws, id: uid("w_") };
      return { workspaces: { ...state.workspaces, [ws.id]: ws }, order: [...state.order, ws.id], activeId: ws.id };
    }
    case "config/patch":
      return onActive(state, (ws) => ({ ...ws, config: { ...ws.config, ...a.patch } }));
    case "config/preset":
      return onActive(state, (ws) => {
        const config = buildConfig(a.sector, { name: ws.config.name, accent: a.keepAccent ? ws.config.accent : undefined });
        config.logo = ws.config.logo;
        config.tagline = ws.config.tagline;
        config.currency = ws.config.currency;
        return { ...ws, config, data: a.demo ? buildDemoData(a.sector, config) : { contacts: [], deals: [], tasks: [], items: [] } };
      });
    case "data/replace":
      return onActive(state, (ws) => ({ ...ws, data: a.data }));
    case "rec/save":
      return onActive(state, (ws) => {
        const list = ws.data[KINDS[a.kind]];
        const rec = a.rec;
        const exists = list.some((r) => r.id === rec.id);
        const next = exists ? list.map((r) => (r.id === rec.id ? rec : r)) : [rec, ...list];
        return { ...ws, data: { ...ws.data, [KINDS[a.kind]]: next } };
      });
    case "rec/delete":
      return onActive(state, (ws) => {
        const data = { ...ws.data, [KINDS[a.kind]]: ws.data[KINDS[a.kind]].filter((r) => r.id !== a.id) };
        if (a.kind === "contact") {
          data.deals = data.deals.map((d) => (d.contactId === a.id ? { ...d, contactId: null } : d));
          data.tasks = data.tasks.map((t) => (t.contactId === a.id ? { ...t, contactId: null } : t));
        }
        return { ...ws, data };
      });
    case "deal/move":
      return onActive(state, (ws) => {
        const stage = ws.config.stages.find((s) => s.id === a.stage);
        return {
          ...ws,
          data: {
            ...ws.data,
            deals: ws.data.deals.map((d) =>
              d.id === a.id ? { ...d, stage: a.stage, closedAt: stage?.kind === "won" ? d.closedAt || new Date().toISOString() : null } : d,
            ),
          },
        };
      });
    case "task/toggle":
      return onActive(state, (ws) => ({
        ...ws,
        data: { ...ws.data, tasks: ws.data.tasks.map((t) => (t.id === a.id ? { ...t, done: !t.done } : t)) },
      }));
    case "contact/note":
      return onActive(state, (ws) => ({
        ...ws,
        data: {
          ...ws.data,
          contacts: ws.data.contacts.map((c) =>
            c.id === a.id ? { ...c, notes: [{ id: uid("n_"), text: a.text, at: new Date().toISOString() }, ...(c.notes || [])] } : c,
          ),
        },
      }));
    case "contact/note-delete":
      return onActive(state, (ws) => ({
        ...ws,
        data: {
          ...ws.data,
          contacts: ws.data.contacts.map((c) => (c.id === a.id ? { ...c, notes: c.notes.filter((n) => n.id !== a.noteId) } : c)),
        },
      }));
    case "reset":
      return EMPTY;
    default:
      return state;
  }
}

const Ctx = createContext(null);

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* almacenamiento lleno o bloqueado: la sesión sigue funcionando en memoria */
    }
  }, [state]);

  const value = useMemo(() => {
    const ws = state.workspaces[state.activeId] || null;
    return { state, dispatch, ws, config: ws?.config, data: ws?.data };
  }, [state]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useStore = () => useContext(Ctx);

/* Helpers derivados de la configuración del cliente activo */
// eslint-disable-next-line react-refresh/only-export-components
export function useSchema() {
  const { config } = useStore();
  return useMemo(() => {
    const stageById = Object.fromEntries(config.stages.map((s) => [s.id, s]));
    const statusByName = Object.fromEntries(config.contactStatuses.map((s) => [s.name, s]));
    const typeByName = Object.fromEntries(config.taskTypes.map((s) => [s.name, s]));
    const recurring = config.dealFields.find((f) => f.role === "recurring");
    return { stageById, statusByName, typeByName, recurring, T: config.terms };
  }, [config]);
}
