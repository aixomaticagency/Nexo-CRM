/* Utilidades puras: ids, fechas, dinero, color, CSV. */

export const uid = (p = "") => p + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);

const pad = (n) => String(n).padStart(2, "0");
export const isoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayISO = () => isoDate(new Date());
export const parseISO = (s) => new Date(`${s}T00:00:00`);
export const addDaysISO = (n, from) => {
  const d = from ? parseISO(from) : new Date();
  d.setDate(d.getDate() + n);
  return isoDate(d);
};
export const daysAgoStamp = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(10, 0, 0, 0);
  return d.toISOString();
};
export const startOfWeekISO = (from = new Date()) => {
  const d = new Date(from);
  const dow = (d.getDay() + 6) % 7; // lunes = 0
  d.setDate(d.getDate() - dow);
  return isoDate(d);
};

export function fmtMoney(v, cur = "EUR", compact = false) {
  const n = Number(v);
  if (v === "" || v == null || Number.isNaN(n)) return "—";
  try {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: cur,
      maximumFractionDigits: n % 1 ? 2 : 0,
      notation: compact && Math.abs(n) >= 10000 ? "compact" : "standard",
    }).format(n);
  } catch {
    return `${n} ${cur}`;
  }
}

export function fmtDate(iso, withYear) {
  if (!iso) return "—";
  const d = iso.length > 10 ? new Date(iso) : parseISO(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    ...(withYear || !sameYear ? { year: "numeric" } : {}),
  });
}

export function relDay(iso) {
  if (!iso) return "Sin fecha";
  const diff = Math.round((parseISO(iso.slice(0, 10)) - parseISO(todayISO())) / 86400000);
  if (diff === 0) return "Hoy";
  if (diff === 1) return "Mañana";
  if (diff === -1) return "Ayer";
  return fmtDate(iso);
}

export function timeAgo(stamp) {
  const s = (Date.now() - new Date(stamp).getTime()) / 1000;
  if (s < 60) return "ahora";
  if (s < 3600) return `hace ${Math.floor(s / 60)} min`;
  if (s < 86400) return `hace ${Math.floor(s / 3600)} h`;
  if (s < 86400 * 30) return `hace ${Math.floor(s / 86400)} d`;
  return fmtDate(stamp);
}

export const initials = (str) =>
  !str
    ? "·"
    : str
        .trim()
        .split(/\s+/)
        .filter((w) => /^[\p{L}\p{N}]/u.test(w))
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

/* ---------- color: el acento de cada empresa genera toda la paleta ---------- */

function hexToHsl(hex) {
  const m = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(hex || "");
  if (!m) return [230, 80, 70];
  const [r, g, b] = [m[1], m[2], m[3]].map((x) => parseInt(x, 16) / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return [h, s * 100, l * 100];
}

function hslToHex(h, s, l) {
  h = ((h % 360) + 360) % 360;
  s /= 100;
  l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))));
  return `#${[f(0), f(8), f(4)].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
}

export function accentVars(hex) {
  const [h, s, l] = hexToHsl(hex);
  const accent = hslToHex(h, Math.max(s, 55), Math.min(Math.max(l, 58), 72));
  return {
    "--accent": accent,
    "--accent-2": hslToHex(h + 42, Math.max(s, 60), 66),
    "--accent-3": hslToHex(h - 38, Math.max(s, 55), 60),
    "--accent-ink": "#08090f",
  };
}

/* ---------- exportación ---------- */

export function toCSV(rows, cols) {
  const esc = (v) => {
    const s = Array.isArray(v) ? v.join("; ") : v == null ? "" : String(v);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.map((c) => esc(c.label)).join(","), ...rows.map((r) => cols.map((c) => esc(c.get(r))).join(","))].join("\n");
}

export function download(filename, text, mime = "application/json") {
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

export const slug = (s) =>
  String(s)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "") || "campo";
