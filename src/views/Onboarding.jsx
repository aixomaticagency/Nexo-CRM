import { useState } from "react";
import Icon from "../ui/Icon.jsx";
import { NexoMark, Toggle } from "../ui/kit.jsx";
import { PRESETS, SECTOR_ORDER, PALETTE } from "../core/presets.js";
import { accentVars } from "../core/util.js";
import { useEffect } from "react";

/** Asistente para crear una empresa nueva a partir de un sector. */
export default function Onboarding({ first, onCreate, onCancel }) {
  const [step, setStep] = useState(0);
  const [sector, setSector] = useState(null);
  const [name, setName] = useState("");
  const [accent, setAccent] = useState(null);
  const [demo, setDemo] = useState(true);
  const preset = sector ? PRESETS[sector] : null;
  const color = accent || preset?.accent || "#8b9cff";

  useEffect(() => {
    const vars = accentVars(color);
    Object.entries(vars).forEach(([k, v]) => document.documentElement.style.setProperty(k, v));
  }, [color]);

  const pick = (k) => {
    setSector(k);
    setAccent(null);
    setStep(1);
  };

  return (
    <div className="onboard">
      <div className="ob-inner">
        <div className="ob-hero">
          <NexoMark size={52} />
          <h1>{first ? "Un CRM que se adapta a tu negocio" : "Añadir una empresa"}</h1>
          <p>{first ? "Elige tu sector y Nexo configura campos, embudo y vocabulario al instante. Kioscos, clínicas, restaurantes… todo con la misma base." : "Cada empresa tiene su propia configuración, marca y datos dentro de la misma instalación."}</p>
        </div>
        <div className="ob-steps"><i className="on" /><i className={step >= 1 ? "on" : ""} /></div>

        {step === 0 ? (
          <>
            <div className="sector-grid">
              {SECTOR_ORDER.map((k) => {
                const p = PRESETS[k];
                return (
                  <button key={k} className={`sector ${sector === k ? "on" : ""}`} style={{ "--c": p.accent }} onClick={() => pick(k)}>
                    <span className="s-ico"><Icon name={p.icon} size={22} /></span>
                    <b>{p.name}</b>
                    <span>{p.desc}</span>
                  </button>
                );
              })}
            </div>
            {onCancel && <div style={{ textAlign: "center", marginTop: 22 }}><button className="btn ghost" onClick={onCancel}>Cancelar</button></div>}
          </>
        ) : (
          <div className="card ob-card">
            <div className="row" style={{ marginBottom: 20 }}>
              <span className="sector" style={{ "--c": color, padding: 0, border: 0, background: "none" }}><span className="s-ico"><Icon name={preset.icon} size={22} /></span></span>
              <div><div style={{ fontWeight: 800, fontSize: 17 }}>{preset.name}</div><div className="muted tiny">{preset.terms.contact.p} · {preset.terms.deal.p} · {preset.terms.task.p} · {preset.terms.item.p}</div></div>
            </div>
            <div className="form-grid">
              <div className="field span2">
                <label className="label" htmlFor="ob_name">Nombre de la empresa</label>
                <input id="ob_name" className="input" autoFocus placeholder="Ej.: Kiosco Los Álamos" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && onCreate({ sector, name: name.trim() || preset.name, accent: color, demo })} />
              </div>
              <div className="field span2">
                <label className="label">Color de marca</label>
                <div className="swatches">
                  {PALETTE.map((c) => <button key={c} className={`swatch ${color.toLowerCase() === c ? "on" : ""}`} style={{ "--c": c }} onClick={() => setAccent(c)} aria-label={c} />)}
                  <label className="swatch-custom"><Icon name="plus" size={14} /><input type="color" value={color} onChange={(e) => setAccent(e.target.value)} /></label>
                </div>
              </div>
              <div className="field span2">
                <div className="check-row"><Toggle on={demo} onChange={setDemo} label="Datos de ejemplo" /><div><div style={{ fontWeight: 650 }}>Cargar datos de ejemplo</div><div className="muted tiny">Recomendado para explorar. Puedes vaciarlos después en Ajustes.</div></div></div>
              </div>
            </div>
            <div className="row" style={{ marginTop: 22 }}>
              <button className="btn ghost" onClick={() => setStep(0)}><Icon name="chevL" size={16} />Sectores</button>
              <div className="grow" />
              <button className="btn primary" onClick={() => onCreate({ sector, name: name.trim() || preset.name, accent: color, demo })}><Icon name="sparkle" size={16} />Crear mi CRM</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
