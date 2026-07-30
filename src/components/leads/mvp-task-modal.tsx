import React, { useState } from "react";
import { ALL_LEADS, PRIORITY_META, PRIORITY_KEYS } from "../../lib/core";
import { C } from "../../theme";
import { ModalShell, FooterBtns, Label, fieldStyle, placeholderSelect } from "./mvp-modal-kit";

// MVP fork of the Task composer — the "Create a Task" quick action on the
// contact detail view. Same fields and onSubmit contract as the calendar
// TaskModal, restyled onto the shared MVP ModalShell so it matches the other
// activity modals. A task has no call/email/to-do subtype (board: Title ·
// Contact · Priority · Date · Time · Description). Create-only.

const PRIORITIES = PRIORITY_KEYS.map(k => [k, PRIORITY_META[k].label, PRIORITY_META[k].color]);

const blank = (selectedDate) => ({
  type: "note", title: "", contact: "", priority: "normal",
  date: selectedDate || "", time: "09:00", note: "",
});

// Compact pill-toggle row shared by the Type and Priority pickers.
const PillGroup = ({ options, value, onChange }) => (
  <div style={{ display: "flex", gap: 6 }}>
    {options.map(([k, label, color]) => {
      const active = value === k;
      const tint = color || C.primary;
      return (
        <button key={k} onClick={() => onChange(k)}
          style={{ flex: 1, padding: "8px 4px", borderRadius: 8, border: `1.5px solid ${active ? tint : C.border}`,
            background: active ? `${tint}12` : "#fff", color: active ? (color ? tint : C.primaryDark) : C.muted,
            fontSize: 12, fontWeight: active ? 700 : 500, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
          {label}
        </button>
      );
    })}
  </div>
);

export const MVPTaskModal = ({ mode = "create", task = null, selectedDate, lockContact = false, onClose, onSubmit }) => {
  const [f, setF] = useState(() => {
    const init = task ? { ...blank(selectedDate), ...task } : blank(selectedDate);
    if (!init.time) init.time = "09:00";
    return init;
  });
  const set = (k, v) => setF(prev => ({ ...prev, [k]: v }));
  const canSave = f.title.trim() && f.date && f.time;

  return (
    <ModalShell icon="✅" title="Create a Task" subtitle={f.contact ? `For ${f.contact}` : "Add a follow-up to your calendar"}
      accent={C.purple} width={560} onClose={onClose}>
      <div style={{ marginBottom: 14 }}>
        <Label>Title *</Label>
        <input value={f.title} onChange={e => set("title", e.target.value)} placeholder="e.g. Follow-up call — Sandra Richter" style={fieldStyle} />
      </div>

      <div style={{ marginBottom: 14 }}>
        <Label>Contact *</Label>
        {lockContact ? (
          <input value={f.contact} disabled style={{ ...fieldStyle, background: C.light, color: C.slate, cursor: "not-allowed" }} />
        ) : (
          <select value={f.contact} onChange={e => set("contact", e.target.value)} style={f.contact ? fieldStyle : placeholderSelect}>
            <option value="">Choose…</option>
            {ALL_LEADS.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
          </select>
        )}
      </div>

      <div style={{ marginBottom: 14 }}>
        <Label>Priority</Label>
        <PillGroup options={PRIORITIES} value={f.priority} onChange={v => set("priority", v)} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
        <div><Label>Date *</Label><input type="date" value={f.date} onChange={e => set("date", e.target.value)} style={f.date ? fieldStyle : placeholderSelect} /></div>
        <div><Label>Time *</Label><input type="time" value={f.time} onChange={e => set("time", e.target.value)} style={f.time ? fieldStyle : placeholderSelect} /></div>
      </div>

      <div>
        <Label>Description</Label>
        <textarea value={f.note} onChange={e => set("note", e.target.value)} placeholder="Any details for this task…"
          style={{ ...fieldStyle, minHeight: 72, resize: "vertical", lineHeight: 1.5 }} />
      </div>

      <FooterBtns onClose={onClose} label={mode === "edit" ? "Update Task" : "Save Task"} disabled={!canSave}
        onAction={() => canSave && onSubmit && onSubmit({ ...f, kind: "task" }, mode)} />
    </ModalShell>
  );
};
