/* Motor de campos: un tipo de campo se define UNA vez y sirve para
   formulario, ficha, tabla y ajustes. Añadir un tipo = añadirlo aquí. */

import { useState } from "react";
import Icon from "./Icon.jsx";
import { Toggle, Pill } from "./kit.jsx";
import { fmtDate, fmtMoney } from "../core/util.js";

// eslint-disable-next-line react-refresh/only-export-components
export const FIELD_TYPES = {
  text: { label: "Texto", icon: "note" },
  longtext: { label: "Texto largo", icon: "note" },
  number: { label: "Número", icon: "target" },
  money: { label: "Importe", icon: "coin" },
  date: { label: "Fecha", icon: "calendar" },
  select: { label: "Selección", icon: "list" },
  tags: { label: "Etiquetas", icon: "tag" },
  checkbox: { label: "Sí / No", icon: "check" },
  url: { label: "Enlace", icon: "link" },
  email: { label: "Email", icon: "mail" },
  phone: { label: "Teléfono", icon: "phone" },
  rating: { label: "Valoración", icon: "star" },
};

function TagsInput({ value, onChange, placeholder }) {
  const [draft, setDraft] = useState("");
  const tags = Array.isArray(value) ? value : [];
  const commit = () => {
    const parts = draft.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length) onChange([...tags, ...parts.filter((p) => !tags.includes(p))]);
    setDraft("");
  };
  return (
    <div className="tags-input">
      {tags.map((t) => (
        <span className="chip" key={t}>
          {t}
          <button type="button" onClick={() => onChange(tags.filter((x) => x !== t))} aria-label={`Quitar ${t}`}>
            <Icon name="x" size={12} />
          </button>
        </span>
      ))}
      <input
        value={draft}
        placeholder={tags.length ? "" : placeholder || "Escribe y pulsa Enter"}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            commit();
          } else if (e.key === "Backspace" && !draft && tags.length) onChange(tags.slice(0, -1));
        }}
        onBlur={commit}
      />
    </div>
  );
}

export function Stars({ value = 0, onChange, size = 18 }) {
  return (
    <span className="stars">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" className={n <= value ? "on" : ""} onClick={() => onChange?.(n === value ? 0 : n)} disabled={!onChange} aria-label={`${n} estrellas`}>
          <Icon name="star" size={size} />
        </button>
      ))}
    </span>
  );
}

export function FieldInput({ field, value, onChange, currency }) {
  const t = field.type;
  const common = { id: `f_${field.key}`, className: "input" };
  if (t === "longtext") return <textarea {...common} className="textarea" rows={3} value={value ?? ""} onChange={(e) => onChange(e.target.value)} />;
  if (t === "select")
    return (
      <select {...common} className="select" value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
        <option value="">—</option>
        {(field.options || []).map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    );
  if (t === "tags") return <TagsInput value={value} onChange={onChange} />;
  if (t === "checkbox")
    return (
      <div className="check-row">
        <Toggle on={!!value} onChange={onChange} label={field.label} />
        <span className="muted">{value ? "Sí" : "No"}</span>
      </div>
    );
  if (t === "rating") return <Stars value={Number(value) || 0} onChange={onChange} />;
  if (t === "money")
    return (
      <div className="input-suffix">
        <input {...common} type="number" step="any" value={value ?? ""} onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))} />
        <span>{currency === "EUR" ? "€" : currency}</span>
      </div>
    );
  if (t === "number") return <input {...common} type="number" step="any" value={value ?? ""} onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))} />;
  const type = t === "date" ? "date" : t === "email" ? "email" : t === "url" ? "url" : t === "phone" ? "tel" : "text";
  return <input {...common} type={type} value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={t === "url" ? "https://" : ""} />;
}

export function FieldValue({ field, value, currency }) {
  const t = field.type;
  const empty = value === "" || value == null || (Array.isArray(value) && !value.length);
  if (t === "checkbox") return <Pill color={value ? "var(--ok)" : "var(--muted)"} flat>{value ? "Sí" : "No"}</Pill>;
  if (empty) return <span className="muted">—</span>;
  if (t === "tags")
    return (
      <span style={{ display: "inline-flex", gap: 5, flexWrap: "wrap" }}>
        {value.map((x) => <span className="chip" key={x}>{x}</span>)}
      </span>
    );
  if (t === "rating") return <Stars value={Number(value)} size={15} />;
  if (t === "money") return <>{fmtMoney(value, currency)}</>;
  if (t === "date") return <>{fmtDate(value, true)}</>;
  if (t === "url") return <a href={value} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>{String(value).replace(/^https?:\/\//, "")}</a>;
  if (t === "email") return <a href={`mailto:${value}`} onClick={(e) => e.stopPropagation()}>{value}</a>;
  if (t === "phone") return <a href={`tel:${value}`} onClick={(e) => e.stopPropagation()}>{value}</a>;
  if (t === "select") return <>{value}</>;
  return <>{String(value)}</>;
}

/** Renderiza los campos personalizados de una entidad dentro de un formulario. */
export function CustomFields({ fields, data, onChange, currency }) {
  return fields.map((f) => (
    <div key={f.key} className={`field ${f.type === "longtext" || f.type === "tags" ? "span2" : ""}`}>
      <label className="label" htmlFor={`f_${f.key}`}>
        {f.label}
        {f.required && <span className="req">*</span>}
      </label>
      <FieldInput field={f} value={data?.[f.key]} currency={currency} onChange={(v) => onChange({ ...data, [f.key]: v })} />
    </div>
  ));
}

/** Ficha de solo lectura de los campos personalizados. */
export function CustomDetails({ fields, data, currency }) {
  const shown = fields;
  if (!shown.length) return null;
  return (
    <div className="detail-grid">
      {shown.map((f) => (
        <div key={f.key} className={`detail ${f.type === "longtext" || f.type === "tags" ? "span2" : ""}`}>
          <div className="dl">{f.label}</div>
          <div className="dv">
            <FieldValue field={f} value={data?.[f.key]} currency={currency} />
          </div>
        </div>
      ))}
    </div>
  );
}
