import React from "react";

export function Field({ label, children, full = false, hasError = false }) {
  return (
    <label className={`field ${full ? "field-full" : ""} ${hasError ? "field-error" : ""}`}>
      <span>{label}</span>
      {children}
    </label>
  );
}

export function RadioGroup({ label, name, value, onChange, trueValue = true, falseValue = false }) {
  return (
    <fieldset className="radio-group">
      <legend>{label}</legend>
      <label>
        <input type="radio" name={name} value={String(trueValue)} checked={value === trueValue} onChange={onChange} />
        Sim
      </label>
      <label>
        <input type="radio" name={name} value={String(falseValue)} checked={value === falseValue} onChange={onChange} />
        Não
      </label>
    </fieldset>
  );
}

export function SectionHeader({ eyebrow, title, compact = false }) {
  return (
    <div className={`section-title ${compact ? "compact" : ""}`}>
      <span>{eyebrow}</span>
      <h2>{title}</h2>
    </div>
  );
}

export function ListToolbar({ label, onAdd }) {
  return (
    <div className="list-toolbar">
      <strong>{label}</strong>
      <button className="ghost-button" type="button" onClick={onAdd}>
        Adicionar
      </button>
    </div>
  );
}

export function ReviewItem({ label, value }) {
  return (
    <article className="review-card">
      <span>{label}</span>
      <strong>{value || "Não informado"}</strong>
    </article>
  );
}
