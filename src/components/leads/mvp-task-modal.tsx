import React, { useState } from "react";
import { ALL_LEADS, ACTIVITY_TYPES, TASK_TYPE_KEYS, PRIORITY_META, PRIORITY_KEYS } from "../../lib/core";
import { C } from "../../theme";
import { ModalShell, FooterBtns, Label, fieldStyle, placeholderSelect } from "./mvp-modal-kit";

// MVP fork of the Task composer — the "Create a Task" quick action on the
// contact detail view. Same fields and onSubmit contract as the calendar
// TaskModal, restyled onto the shared MVP ModalShell so it matches the other
// activity modals. Create-only (the MVP surface never edits/views here).

const TASK_TYPE_OVERRIDE = { note: { icon: "✅", label: "To Do" } };
const TYPE_META = Object.fromEntries(
  TASK_TYPE_KEYS.map(k => [k, TASK_TYPE_OVERRIDE[k] || { icon: ACTIVITY_TYPES[k].icon, label: ACTIVITY_TYPES[k].label }])
);
const PRIORITIES = PRIORITY_KEYS.map(k => [k, PRIORITY_META[k].label, PRIORITY_META[k].color]);
const REMINDER_OPTS = [["15", "15 Minutes Before"], ["30", "30 Minutes Before"], ["60", "1 Hour Before"], ["custom", "Custom Date"]];
const REPEAT_UNITS = ["day", "week", "month", "year"];
const composeRecur = (every, unit) => `Every ${every} ${unit}${every > 1 ? "s" : ""}`;

const blank = (selectedDate) => ({
  type: "call", title: "", contact: "", priority: "normal",
  date: selectedDate || "", time: "09:00", reminderOn: true, reminder: "30", reminderCustom: "",
  repeatOn: false, repeatEvery: 1, repeatUnit: "day", recur: "Once", note: "",
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
  const tm = TYPE_META[f.type] || TYPE_META.note;

  const typeOpts = Object.entries(TYPE_META).map(([k, v]) => [k, `${v.icon} ${v.label}`]);

  return (
    <ModalShell icon={tm.icon} title="Create a Task" subtitle={f.contact ? `For ${f.contact}` : "Add a follow-up to your calendar"}
      accent={C.purple} width={560} onClose={onClose}>
      <div style={{ marginBottom: 14 }}>
        <Label>Title *</Label>
        <input value={f.title} onChange={e => set("title", e.target.value)} placeholder="e.g. Follow-up call — Sandra Richter" style={fieldStyle} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
        <div>
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
        <div>
          <Label>Type *</Label>
          <PillGroup options={typeOpts} value={f.type} onChange={v => set("type", v)} />
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <Label>Priority</Label>
        <PillGroup options={PRIORITIES} value={f.priority} onChange={v => set("priority", v)} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
        <div><Label>Date *</Label><input type="date" value={f.date} onChange={e => set("date", e.target.value)} style={f.date ? fieldStyle : placeholderSelect} /></div>
        <div><Label>Time *</Label><input type="time" value={f.time} onChange={e => set("time", e.target.value)} style={f.time ? fieldStyle : placeholderSelect} /></div>
      </div>

      {/* Reminder */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: f.reminderOn && f.reminder === "custom" ? 8 : 14 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, color: C.navy, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
          <input type="checkbox" checked={f.reminderOn} onChange={e => set("reminderOn", e.target.checked)} style={{ accentColor: C.primary, width: 15, height: 15 }} />
          Reminder
        </label>
        <select value={f.reminder} disabled={!f.reminderOn} onChange={e => set("reminder", e.target.value)} style={{ ...fieldStyle, opacity: f.reminderOn ? 1 : 0.5 }}>
          {REMINDER_OPTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>
      {f.reminderOn && f.reminder === "custom" && (
        <div style={{ marginBottom: 14 }}>
          <Label>Remind me on</Label>
          <input type="datetime-local" value={f.reminderCustom} onChange={e => set("reminderCustom", e.target.value)} style={fieldStyle} />
        </div>
      )}

      {/* Repeat */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        <label style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, color: C.navy, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
          <input type="checkbox" checked={f.repeatOn} onChange={e => set("repeatOn", e.target.checked)} style={{ accentColor: C.primary, width: 15, height: 15 }} />
          🔁 Set to repeat:
        </label>
        <span style={{ fontSize: 13, color: f.repeatOn ? C.slate : C.muted }}>every</span>
        <input type="number" min={1} max={365} value={f.repeatEvery} disabled={!f.repeatOn}
          onChange={e => set("repeatEvery", Math.max(1, Number(e.target.value) || 1))}
          style={{ ...fieldStyle, width: 72, opacity: f.repeatOn ? 1 : 0.5, padding: "10px 8px" }} />
        <select value={f.repeatUnit} disabled={!f.repeatOn} onChange={e => set("repeatUnit", e.target.value)}
          style={{ ...fieldStyle, width: 120, opacity: f.repeatOn ? 1 : 0.5 }}>
          {REPEAT_UNITS.map(u => <option key={u} value={u}>{u}{f.repeatEvery > 1 ? "s" : ""}</option>)}
        </select>
      </div>

      <div>
        <Label>Description</Label>
        <textarea value={f.note} onChange={e => set("note", e.target.value)} placeholder="Any details for this task…"
          style={{ ...fieldStyle, minHeight: 72, resize: "vertical", lineHeight: 1.5 }} />
      </div>

      <FooterBtns onClose={onClose} label={mode === "edit" ? "Update Task" : "Save Task"} disabled={!canSave}
        onAction={() => canSave && onSubmit && onSubmit({ ...f, recur: f.repeatOn ? composeRecur(f.repeatEvery, f.repeatUnit) : "Once", kind: "task" }, mode)} />
    </ModalShell>
  );
};
