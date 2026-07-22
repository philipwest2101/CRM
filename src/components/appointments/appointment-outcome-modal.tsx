import React, { useState } from "react";
import { C } from "../../theme";

// Appointment Outcome modal (matches the "Appointment Outcome" wireframe).
// Set Outcome is a Network-only action (Lead appointments are worked in the
// Processing & Feedback tab). Picking "Rescheduled" reveals a new Date + Time so
// the appointment can be moved in the same step.

const lbl   = { fontSize:11, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.05em", display:"block", marginBottom:5 };
const input = { width:"100%", padding:"9px 12px", borderRadius:8, border:`1.5px solid ${C.border}`, fontSize:13, fontFamily:"inherit", boxSizing:"border-box", outline:"none", background:"#fff", color:C.text };

// Outcome options come straight from the board.
export const APPOINTMENT_OUTCOMES = [
  "Won", "Rescheduled", "Attending Event", "Not Interested", "Maybe Later", "Difficult Case", "Other",
];

export const AppointmentOutcomeModal = ({ appt=null, onClose, onSave }) => {
  const [outcome, setOutcome] = useState("");
  const [note,    setNote]    = useState("");
  // Only used when the outcome is "Rescheduled" — the new appointment slot.
  const [date,    setDate]    = useState(appt?.date || "");
  const [time,    setTime]    = useState(appt?.time || "09:00");

  const isReschedule = outcome === "Rescheduled";
  const canSave = !!outcome && (!isReschedule || (!!date && !!time));

  // "Sandra Richter" → "SR"
  const initials = (appt?.contact||"").split(/\s+/).filter(Boolean).slice(0,2).map(s=>s[0]?.toUpperCase()||"").join("") || "–";
  const when = appt ? `${appt.date||""}${appt.time?` | ${appt.time}${appt.end?` - ${appt.end}`:""}`:""}` : "";

  return (
    <>
      <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.4)", zIndex:800 }}/>
      <div style={{ position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%)",
        width:460, maxHeight:"92vh", overflowY:"auto", background:"#fff", borderRadius:16, zIndex:900,
        boxShadow:"0 24px 64px rgba(0,0,0,0.2)", fontFamily:"inherit", padding:"22px 24px" }}>

        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
          <div style={{ fontSize:15, fontWeight:800, color:C.navy, display:"flex", alignItems:"center", gap:8 }}>
            <span>🤝</span>Appointment Outcome
          </div>
          <button onClick={onClose} style={{ width:28, height:28, borderRadius:"50%", border:`1px solid ${C.border}`, background:"#F8FAFC", color:C.muted, fontSize:15, cursor:"pointer" }}>×</button>
        </div>

        {appt && (when || appt.contact) && (
          <div style={{ marginBottom:18 }}>
            {when && (
              <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, color:C.text, marginBottom:appt.contact?10:0 }}>
                <span>🕐</span>{when}
              </div>
            )}
            {appt.contact && (
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ width:32, height:32, borderRadius:"50%", background:C.primary+"18", color:C.primaryDark, display:"grid", placeItems:"center", fontSize:11, fontWeight:700 }}>{initials}</span>
                <span style={{ fontSize:13, color:C.text }}>{appt.contact}</span>
              </div>
            )}
          </div>
        )}

        <div style={{ marginBottom:12 }}>
          <label style={lbl}>Outcome *</label>
          <select value={outcome} onChange={e=>setOutcome(e.target.value)} style={input}>
            <option value="">Select outcome</option>
            {APPOINTMENT_OUTCOMES.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>

        <div style={{ marginBottom:isReschedule?12:18 }}>
          <label style={lbl}>Note</label>
          <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Enter a note"
            style={{ ...input, minHeight:90, resize:"none", lineHeight:1.5 }}/>
        </div>

        {/* Reschedule reveal — a new Date + Time for the moved appointment. */}
        {isReschedule && (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:18 }}>
            <div><label style={lbl}>Date *</label><input type="date" value={date} onChange={e=>setDate(e.target.value)} style={input}/></div>
            <div><label style={lbl}>Time *</label><input type="time" value={time} onChange={e=>setTime(e.target.value)} style={input}/></div>
          </div>
        )}

        <div style={{ display:"flex", gap:10 }}>
          <button onClick={onClose} style={{ flex:1, padding:"10px", borderRadius:9, border:`1px solid ${C.border}`, background:"#fff", color:C.slate, fontSize:13, fontWeight:600, cursor:"pointer" }}>Cancel</button>
          <button onClick={()=>canSave && onSave && onSave({ outcome, note, ...(isReschedule?{ date, time }:{}) })} disabled={!canSave}
            style={{ flex:2, padding:"10px", borderRadius:9, border:"none", background:canSave?C.primary:"#E2E8F0", color:canSave?"#fff":C.muted, fontSize:13, fontWeight:700, cursor:canSave?"pointer":"default" }}>
            {isReschedule ? "Update" : "Save"}
          </button>
        </div>
      </div>
    </>
  );
};
