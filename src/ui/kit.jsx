/* Piezas de interfaz reutilizables. */

import { useEffect } from "react";
import Icon from "./Icon.jsx";
import { initials } from "../core/util.js";

export function LogoMark({ config, size }) {
  return (
    <div className={`logo-mark ${size === "lg" ? "lg" : ""}`}>
      {config?.logo ? <img src={config.logo} alt="" /> : <span>{initials(config?.name || "N").slice(0, 2)}</span>}
    </div>
  );
}

export function NexoMark({ size = 34 }) {
  return (
    <div className="logo-mark" style={{ width: size, height: size }}>
      <svg width={size * 0.56} height={size * 0.56} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ position: "relative", zIndex: 1 }}>
        <path d="M6 19V5l12 14V5" />
      </svg>
    </div>
  );
}

export function Pill({ color, children, flat }) {
  return (
    <span className={`pill ${flat ? "flat" : ""}`} style={{ "--c": color || "var(--muted)" }}>
      {children}
    </span>
  );
}

export function Avatar({ name, color, size, square }) {
  return (
    <span className={`avatar ${size || ""} ${square ? "sq" : ""}`} style={color ? { "--c": color } : undefined}>
      {initials(name)}
    </span>
  );
}

export function Toggle({ on, onChange, label }) {
  return <button type="button" role="switch" aria-checked={on} aria-label={label} className={`toggle ${on ? "on" : ""}`} onClick={() => onChange(!on)} />;
}

export function Segmented({ value, onChange, options }) {
  return (
    <div className="seg" role="tablist">
      {options.map((o) => (
        <button key={o.value} className={value === o.value ? "on" : ""} onClick={() => onChange(o.value)} title={o.label}>
          {o.icon && <Icon name={o.icon} size={16} />}
          {o.label && <span>{o.label}</span>}
        </button>
      ))}
    </div>
  );
}

export function Empty({ icon = "sparkle", title, children, action }) {
  return (
    <div className="empty">
      <div className="e-ico">
        <Icon name={icon} size={30} />
      </div>
      <h4>{title}</h4>
      {children && <p style={{ maxWidth: 380 }}>{children}</p>}
      {action}
    </div>
  );
}

export function Drawer({ title, subtitle, lead, onClose, children, footer, actions }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <>
      <div className="overlay" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label={typeof title === "string" ? title : undefined}>
        <div className="d-head">
          {lead}
          <div className="grow">
            <div className="d-title">{title}</div>
            {subtitle && <div className="muted tiny" style={{ marginTop: 2 }}>{subtitle}</div>}
          </div>
          {actions}
          <button className="btn ghost icon" onClick={onClose} aria-label="Cerrar">
            <Icon name="x" />
          </button>
        </div>
        <div className="d-body">{children}</div>
        {footer && <div className="d-foot">{footer}</div>}
      </aside>
    </>
  );
}

export function ConfirmDialog({ title, message, confirmLabel = "Confirmar", danger, onResolve }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onResolve(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onResolve]);
  return (
    <>
      <div className="overlay" style={{ zIndex: 69 }} onClick={() => onResolve(false)} />
      <div className="modal-wrap">
        <div className="modal" role="alertdialog">
          <h3>{title}</h3>
          <p className="muted" style={{ marginBottom: 20 }}>{message}</p>
          <div className="row" style={{ justifyContent: "flex-end" }}>
            <button className="btn ghost" onClick={() => onResolve(false)}>Cancelar</button>
            <button className={`btn ${danger ? "danger" : "primary"}`} onClick={() => onResolve(true)} autoFocus>{confirmLabel}</button>
          </div>
        </div>
      </div>
    </>
  );
}

export function PageHead({ eyebrow, title, sub, children }) {
  return (
    <div className="page-head">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1 className="h1">{title}</h1>
        {sub && <p className="sub">{sub}</p>}
      </div>
      <div className="row wrap">{children}</div>
    </div>
  );
}
