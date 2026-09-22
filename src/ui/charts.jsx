/* Gráficos SVG propios (sin dependencias). */

import { useId, useState } from "react";

function smooth(points) {
  if (points.length < 2) return "";
  let d = `M${points[0][0]},${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    const t = 0.18;
    const c1 = [p1[0] + (p2[0] - p0[0]) * t, p1[1] + (p2[1] - p0[1]) * t];
    const c2 = [p2[0] - (p3[0] - p1[0]) * t, p2[1] - (p3[1] - p1[1]) * t];
    d += ` C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${p2[0]},${p2[1]}`;
  }
  return d;
}

export function AreaChart({ data, color = "var(--accent)", height = 210, format = (v) => v }) {
  const id = useId().replace(/:/g, "");
  const [hover, setHover] = useState(null);
  const W = 640;
  const H = height;
  const pad = { l: 8, r: 8, t: 14, b: 26 };
  const max = Math.max(1, ...data.map((d) => d.value));
  const top = Math.ceil(max * 1.15);
  const x = (i) => pad.l + (i / Math.max(1, data.length - 1)) * (W - pad.l - pad.r);
  const y = (v) => H - pad.b - (v / top) * (H - pad.t - pad.b);
  const pts = data.map((d, i) => [x(i), y(d.value)]);
  const line = smooth(pts);
  const area = `${line} L${x(data.length - 1)},${H - pad.b} L${x(0)},${H - pad.b} Z`;
  const ticks = [0, 0.5, 1].map((f) => Math.round(top * f));
  const labelEvery = Math.ceil(data.length / 6);

  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const rel = ((e.clientX - r.left) / r.width) * W;
    const i = Math.round(((rel - pad.l) / (W - pad.l - pad.r)) * (data.length - 1));
    setHover(Math.max(0, Math.min(data.length - 1, i)));
  };

  return (
    <div style={{ position: "relative" }}>
      <svg className="chart" viewBox={`0 0 ${W} ${H}`} onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
        <defs>
          <linearGradient id={`g${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={color} stopOpacity="0.45" />
            <stop offset="1" stopColor={color} stopOpacity="0" />
          </linearGradient>
          <filter id={`b${id}`} x="-10%" y="-40%" width="120%" height="180%">
            <feGaussianBlur stdDeviation="5" />
          </filter>
        </defs>
        {ticks.map((t) => (
          <g key={t}>
            <line className="gridline" x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} />
            <text x={pad.l} y={y(t) - 5}>{t}</text>
          </g>
        ))}
        <path d={area} fill={`url(#g${id})`} />
        <path d={line} fill="none" stroke={color} strokeWidth="6" opacity="0.5" filter={`url(#b${id})`} />
        <path d={line} fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
        {data.map((d, i) =>
          i % labelEvery === 0 ? (
            <text key={i} x={x(i)} y={H - 6} textAnchor="middle">{d.label}</text>
          ) : null,
        )}
        {hover != null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={H - pad.b} stroke="rgba(255,255,255,.2)" strokeDasharray="3 4" />
            <circle cx={x(hover)} cy={y(data[hover].value)} r="5" fill="#0a0c14" stroke={color} strokeWidth="2.4" />
          </g>
        )}
      </svg>
      {hover != null && (
        <div className="chart-tip" style={{ left: `${(x(hover) / W) * 100}%`, top: `${(y(data[hover].value) / H) * 100}%` }}>
          <span className="muted" style={{ fontWeight: 500 }}>{data[hover].full || data[hover].label} · </span>
          {format(data[hover].value)}
        </div>
      )}
    </div>
  );
}

export function Donut({ slices, size = 132, thickness = 15, center }) {
  const total = slices.reduce((a, s) => a + s.value, 0);
  const r = (size - thickness) / 2;
  const C = 2 * Math.PI * r;
  let acc = 0;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,.05)" strokeWidth={thickness} />
        {total > 0 &&
          slices.map((s, i) => {
            const len = (s.value / total) * C;
            const gap = slices.filter((x) => x.value > 0).length > 1 ? 3 : 0;
            const el = (
              <circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth={thickness}
                strokeLinecap="round"
                strokeDasharray={`${Math.max(0, len - gap)} ${C}`}
                strokeDashoffset={-acc}
                style={{ filter: `drop-shadow(0 0 5px ${s.color})` }}
              />
            );
            acc += len;
            return s.value > 0 ? el : null;
          })}
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", textAlign: "center" }}>{center}</div>
    </div>
  );
}

export function Sparkline({ values, color = "var(--accent)", width = 90, height = 28 }) {
  const max = Math.max(1, ...values);
  const pts = values.map((v, i) => [(i / Math.max(1, values.length - 1)) * width, height - 3 - (v / max) * (height - 6)]);
  return (
    <svg width={width} height={height} style={{ overflow: "visible" }}>
      <path d={smooth(pts)} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
