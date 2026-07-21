import React, { useState, useRef } from "react";
import { ALL_LEADS, DOCUMENT_TYPES_STORE } from "../../lib/core";
import { C } from "../../theme";
import { ModalShell, FooterBtns, Label, fieldStyle, placeholderSelect } from "./mvp-modal-kit";
import { APPOINTMENT_TYPES, getSuperiorEmails } from "../appointments/appointment-modal";

// MVP fork of the Appointment composer — the "Schedule an Appointment" quick
// action on the contact detail view. Same fields and onSubmit contract as the
// calendar AppointmentModal, restyled onto the shared MVP ModalShell. Create-only.

const REMINDER_OPTS = [["15", "15 Minutes Before"], ["30", "30 Minutes Before"], ["60", "1 Hour Before"], ["1440", "1 Day Before"], ["custom", "Custom Date"]];

// Attendees are stored as email addresses.
const isEmail = (s) => /^[^\s,()]+@[^\s,()]+\.[^\s,()]+$/.test(String(s || "").trim());
const leadByEmail = (email) => ALL_LEADS.find(l => l.email.toLowerCase() === String(email).toLowerCase());
const displayName = (email) => (leadByEmail(email) || {}).name || "";
const attLabelOf = (email) => { const n = displayName(email); return n ? `${email} (${n})` : email; };

const blank = (selectedDate) => ({
  title: "", contact: "", attendees: [], apptType: "Consultation Appointment", apptTypeOther: "",
  date: selectedDate || "", time: "09:00", end: "", location: "", attachments: [],
  reminderOn: true, reminder: "30", reminderCustom: "", note: "",
});

export const MVPAppointmentModal = ({ mode = "create", appt = null, selectedDate, role, lockContact = false, onClose, onSubmit }) => {
  const [f, setF] = useState(() => {
    const init = appt ? { ...blank(selectedDate), ...appt } : blank(selectedDate);
    if (!init.time) init.time = "09:00";
    init.attendees = Array.isArray(init.attendees) ? init.attendees : [];
    init.attachments = Array.isArray(init.attachments) ? init.attachments : [];
    return init;
  });
  const set = (k, v) => setF(prev => ({ ...prev, [k]: v }));

  // ── Attendees: searchable multiselect (superiors + free-typed emails) ──────
  const attendeeArr = f.attendees;
  const writeAttendees = (arr) => setF(prev => ({ ...prev, attendees: arr }));
  const toggleAttendee = (email) => writeAttendees(attendeeArr.includes(email) ? attendeeArr.filter(e => e !== email) : [...attendeeArr, email]);
  const [attOpen, setAttOpen] = useState(false);
  const [attQuery, setAttQuery] = useState("");
  const q = attQuery.trim().toLowerCase();
  const superiors = getSuperiorEmails(role);
  const superiorOptions = superiors.filter(email => !q || email.toLowerCase().includes(q) || displayName(email).toLowerCase().includes(q));
  const extraSelected = attendeeArr.filter(e => !superiors.includes(e));
  const canAddTyped = isEmail(attQuery.trim()) && !attendeeArr.includes(attQuery.trim());

  // ── Attachments: multiselect (system docs) ─────────────────────────────────
  const fileRef = useRef(null);
  const addAttachment = (name) => setF(prev => prev.attachments.includes(name) ? prev : { ...prev, attachments: [...prev.attachments, name] });
  const removeAttachment = (name) => setF(prev => ({ ...prev, attachments: prev.attachments.filter(a => a !== name) }));

  const apptTypeOk = f.apptType !== "Other" || f.apptTypeOther.trim();
  const canSave = f.title.trim() && f.contact && f.date && f.time && apptTypeOk;

  return (
    <ModalShell icon="📅" title="Schedule an Appointment" subtitle={f.contact ? `With ${f.contact}` : "Book a meeting"}
      accent={C.green} width={600} onClose={onClose}>
      <div style={{ marginBottom: 14 }}>
        <Label>Title *</Label>
        <input value={f.title} onChange={e => set("title", e.target.value)} placeholder="e.g. Consultation — Sandra Richter" style={fieldStyle} />
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

      {/* Attendees */}
      <div style={{ marginBottom: 14 }}>
        <Label>Attendees *</Label>
        <div style={{ position: "relative" }}>
          <div onClick={() => setAttOpen(o => !o)}
            style={{ ...fieldStyle, minHeight: 40, display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6, cursor: "pointer", padding: attendeeArr.length ? "6px 30px 6px 8px" : "10px 30px 10px 12px" }}>
            {attendeeArr.length === 0 && <span style={{ color: C.muted }}>Select attendees</span>}
            {attendeeArr.map((email) => (
              <span key={email} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 8px", borderRadius: 20, background: "#F1F5F9", border: `1px solid ${C.border}`, fontSize: 11.5, fontWeight: 600, color: C.text }}>
                {displayName(email) || email}
                <span onClick={e => { e.stopPropagation(); toggleAttendee(email); }} style={{ color: C.muted, cursor: "pointer", fontSize: 13, lineHeight: 1 }}>×</span>
              </span>
            ))}
            <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: C.muted, fontSize: 11, pointerEvents: "none" }}>{attOpen ? "▲" : "▼"}</span>
          </div>
          {attOpen && (
            <>
              <div onClick={() => setAttOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 510 }} />
              <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 520, background: "#fff", border: `1.5px solid ${C.border}`, borderRadius: 10, boxShadow: "0 12px 32px rgba(0,0,0,0.15)", overflow: "hidden" }}>
                <div style={{ padding: 8, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 6 }}>
                  <input autoFocus value={attQuery} onChange={e => setAttQuery(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && canAddTyped) { e.preventDefault(); toggleAttendee(attQuery.trim()); setAttQuery(""); } }}
                    placeholder="Search superiors or type an email…" style={{ ...fieldStyle, border: "none", padding: "4px 6px", fontSize: 12.5 }} />
                  <span style={{ color: C.muted, fontSize: 13 }}>🔍</span>
                </div>
                <div style={{ maxHeight: 200, overflowY: "auto" }}>
                  {canAddTyped && (
                    <div onClick={() => { toggleAttendee(attQuery.trim()); setAttQuery(""); }}
                      style={{ padding: "9px 12px", fontSize: 12.5, color: C.primaryDark, fontWeight: 600, cursor: "pointer", borderBottom: `1px solid ${C.border}` }}>
                      ＋ Add “{attQuery.trim()}”
                    </div>
                  )}
                  {extraSelected.filter(e => !q || e.toLowerCase().includes(q)).map(email => (
                    <label key={email} style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 12px", cursor: "pointer", fontSize: 12.5 }}>
                      <input type="checkbox" checked readOnly onChange={() => toggleAttendee(email)} style={{ accentColor: C.primary, width: 14, height: 14 }} />
                      <span style={{ color: C.text }}>{email}</span>
                    </label>
                  ))}
                  {superiorOptions.map(email => { const checked = attendeeArr.includes(email); const name = displayName(email); return (
                    <label key={email} onClick={e => { e.preventDefault(); toggleAttendee(email); }}
                      style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 12px", cursor: "pointer", fontSize: 12.5, background: checked ? C.primary + "08" : "transparent" }}>
                      <input type="checkbox" checked={checked} readOnly style={{ accentColor: C.primary, width: 14, height: 14 }} />
                      <span style={{ color: C.text }}>{email}</span>
                      {name && <span style={{ color: C.muted }}>({name})</span>}
                    </label>
                  ); })}
                  {superiorOptions.length === 0 && !canAddTyped && (
                    <div style={{ padding: "10px 12px", fontSize: 12, color: C.muted }}>No matches</div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <Label>Type *</Label>
        <select value={f.apptType} onChange={e => set("apptType", e.target.value)} style={fieldStyle}>
          {APPOINTMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        {f.apptType === "Other" && (
          <input value={f.apptTypeOther} onChange={e => set("apptTypeOther", e.target.value)} autoFocus
            placeholder="Enter appointment type *" style={{ ...fieldStyle, marginTop: 8 }} />
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div><Label>Date *</Label><input type="date" value={f.date} onChange={e => set("date", e.target.value)} style={f.date ? fieldStyle : placeholderSelect} /></div>
        <div><Label>Start *</Label><input type="time" value={f.time} onChange={e => set("time", e.target.value)} style={f.time ? fieldStyle : placeholderSelect} /></div>
        <div><Label>End</Label><input type="time" value={f.end} onChange={e => set("end", e.target.value)} style={f.end ? fieldStyle : placeholderSelect} /></div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <Label>Appointment Location *</Label>
        <input value={f.location} onChange={e => set("location", e.target.value)}
          placeholder="ARTIST Boutique Hotel — Vienna  ·  or https://meet.…" style={fieldStyle} />
      </div>

      {/* Attachments */}
      <div style={{ marginBottom: 14 }}>
        <Label>Attachments</Label>
        {f.attachments.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 6 }}>
            {f.attachments.map(a => (
              <span key={a} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 9px", borderRadius: 7, background: "#F1F5F9", border: `1px solid ${C.border}`, fontSize: 11.5, color: C.text, fontWeight: 600 }}>
                📎 {a}
                <span onClick={() => removeAttachment(a)} style={{ color: C.muted, cursor: "pointer", fontSize: 13, lineHeight: 1 }}>×</span>
              </span>
            ))}
          </div>
        )}
        <select value="" onChange={e => { const v = e.target.value; if (!v) return; addAttachment(v); e.target.value = ""; }} style={placeholderSelect}>
          <option value="">+ Add attachment…</option>
          {DOCUMENT_TYPES_STORE.filter(d => !f.attachments.includes(d.label)).map(d => <option key={d.id} value={d.label}>{d.icon} {d.label}</option>)}
        </select>
      </div>

      {/* Reminder */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: f.reminderOn && f.reminder === "custom" ? 8 : 4 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, color: C.navy, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
          <input type="checkbox" checked={f.reminderOn} onChange={e => set("reminderOn", e.target.checked)} style={{ accentColor: C.primary, width: 15, height: 15 }} />
          Reminder
        </label>
        <select value={f.reminder} disabled={!f.reminderOn} onChange={e => set("reminder", e.target.value)} style={{ ...fieldStyle, opacity: f.reminderOn ? 1 : 0.5 }}>
          {REMINDER_OPTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>
      {f.reminderOn && f.reminder === "custom" && (
        <div style={{ marginTop: 12 }}>
          <Label>Remind me on</Label>
          <input type="datetime-local" value={f.reminderCustom} onChange={e => set("reminderCustom", e.target.value)} style={fieldStyle} />
        </div>
      )}

      <div style={{ marginTop: 14 }}>
        <Label>Description</Label>
        <textarea value={f.note} onChange={e => set("note", e.target.value)} placeholder="Any details for this appointment…"
          style={{ ...fieldStyle, minHeight: 72, resize: "vertical", lineHeight: 1.5 }} />
      </div>

      <FooterBtns onClose={onClose} label={mode === "edit" ? "Update" : "Schedule"} disabled={!canSave}
        onAction={() => canSave && onSubmit && onSubmit({
          ...f,
          apptType: f.apptType === "Other" ? f.apptTypeOther.trim() : f.apptType,
          attendees: attendeeArr.map(attLabelOf).join(", "),
          attachment: f.attachments.join(", "),
          kind: "appointment",
        }, mode)} />
    </ModalShell>
  );
};
