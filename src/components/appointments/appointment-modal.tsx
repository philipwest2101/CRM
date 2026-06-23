import React, { useState } from "react";
import { ALL_LEADS } from "../../lib/core";
import { C } from "../../theme";

// Appointment modal — create | edit | view
// (matches "Schedule Appointment", "Edit Appointment", "Appointment" wireframes)

const lbl   = { fontSize:11, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.05em", display:"block", marginBottom:5 };
const input = { width:"100%", padding:"9px 12px", borderRadius:8, border:`1.5px solid ${C.border}`, fontSize:13, fontFamily:"inherit", boxSizing:"border-box", outline:"none", background:"#fff", color:C.text };

export const APPOINTMENT_TYPES = [
  "Consultation Appointment", "Recruiting", "Business Opening", "Investment Talk", "Finance Talk",
];
const REMINDER_OPTS = [["15","15 Minutes Before"],["30","30 Minutes Before"],["60","1 Hour Before"]];

const blank = (selectedDate) => ({
  title:"", contact:"", apptType:"Consultation Appointment",
  date:selectedDate||"", time:"", end:"", attendees:"", attachment:"",
  location:"", reminderOn:true, reminder:"30", note:"",
});

export const AppointmentModal = ({ mode="create", appt=null, selectedDate, onClose, onSubmit, onCancelAppt, onSetOutcome }) => {
  const [m, setM] = useState(mode);
  const [f, setF] = useState(appt ? { ...blank(selectedDate), ...appt } : blank(selectedDate));
  const set = (k,v) => setF(prev => ({ ...prev, [k]:v }));
  const isView = m === "view";
  const canSave = f.title.trim() && f.date;

  const titleText = m==="create" ? "Schedule Appointment"
    : m==="edit" ? `Edit Appointment — ${f.title||"Untitled"}`
    : `Appointment — ${f.title||"Untitled"}`;

  const field = (label, node) => (
    <div style={{ marginBottom:12 }}><label style={lbl}>{label}</label>{node}</div>
  );
  const rowR = (label, value) => value ? (
    <div style={{ display:"flex", justifyContent:"space-between", padding:"9px 0", borderBottom:`1px solid ${C.border}`, fontSize:12, gap:12 }}>
      <span style={{ color:C.muted }}>{label}</span>
      <span style={{ color:C.text, fontWeight:600, textAlign:"right" }}>{value}</span>
    </div>
  ) : null;

  return (
    <>
      <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.35)", zIndex:600 }}/>
      <div style={{ position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%)",
        width:500, maxHeight:"92vh", overflowY:"auto", background:"#fff", borderRadius:16, zIndex:700,
        boxShadow:"0 24px 64px rgba(0,0,0,0.2)", fontFamily:"inherit", padding:"22px 24px" }}>

        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
          <div style={{ fontSize:15, fontWeight:800, color:C.navy, display:"flex", alignItems:"center", gap:8 }}>
            <span>📅</span>{titleText}
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            {isView && (
              <button onClick={()=>setM("edit")} title="Edit"
                style={{ width:28, height:28, borderRadius:7, border:`1px solid ${C.border}`, background:"#fff", color:C.slate, cursor:"pointer", fontSize:13 }}>✏️</button>
            )}
            <button onClick={onClose} style={{ width:28, height:28, borderRadius:"50%", border:`1px solid ${C.border}`, background:"#F8FAFC", color:C.muted, fontSize:15, cursor:"pointer" }}>×</button>
          </div>
        </div>

        {isView ? (
          /* ── VIEW ─────────────────────────────────────────────── */
          <div>
            {rowR("📅 Date & Time", `${f.date}${f.time?` · ${f.time}`:""}${f.end?` – ${f.end}`:""}`)}
            {rowR("👤 Contact", f.contact)}
            {rowR("🏷 Type", f.apptType)}
            {rowR("👥 Attendees", f.attendees)}
            {rowR("📍 Location / Link", f.location)}
            {rowR("📎 Attachment", f.attachment)}
            {f.reminderOn && rowR("⏰ Reminder", (REMINDER_OPTS.find(r=>r[0]===String(f.reminder))||[])[1])}
            {f.note && (
              <div style={{ marginTop:12 }}>
                <label style={lbl}>Description</label>
                <div style={{ fontSize:12, color:C.slate, lineHeight:1.5 }}>{f.note}</div>
              </div>
            )}
            <div style={{ display:"flex", alignItems:"center", marginTop:20, gap:10 }}>
              <button onClick={()=>onCancelAppt&&onCancelAppt(f)} style={{ background:"none", border:"none", color:C.red, fontSize:12, fontWeight:700, cursor:"pointer", padding:0 }}>Cancel Appointment</button>
              <button onClick={()=>onSetOutcome&&onSetOutcome(f)}
                style={{ marginLeft:"auto", padding:"9px 22px", borderRadius:9, border:"none", background:C.primary, color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer" }}>Set Outcome</button>
            </div>
          </div>
        ) : (
          /* ── CREATE / EDIT ───────────────────────────────────── */
          <div>
            {field("Title *", <input value={f.title} onChange={e=>set("title",e.target.value)} placeholder="e.g. Consultation — Sandra Richter" style={input}/>)}

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 }}>
              <div>
                <label style={lbl}>Contact *</label>
                <select value={f.contact} onChange={e=>set("contact",e.target.value)} style={input}>
                  <option value="">Choose…</option>
                  {ALL_LEADS.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Type *</label>
                <select value={f.apptType} onChange={e=>set("apptType",e.target.value)} style={input}>
                  {APPOINTMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:12 }}>
              <div><label style={lbl}>Date *</label><input type="date" value={f.date} onChange={e=>set("date",e.target.value)} style={input}/></div>
              <div><label style={lbl}>Start</label><input type="time" value={f.time} onChange={e=>set("time",e.target.value)} style={input}/></div>
              <div><label style={lbl}>End</label><input type="time" value={f.end} onChange={e=>set("end",e.target.value)} style={input}/></div>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 }}>
              <div><label style={lbl}>Attendees</label><input value={f.attendees} onChange={e=>set("attendees",e.target.value)} placeholder="olivia.ruth@email.com" style={input}/></div>
              <div><label style={lbl}>Attachment</label><input value={f.attachment} onChange={e=>set("attachment",e.target.value)} placeholder="sample.pdf" style={input}/></div>
            </div>

            {field("Location / Link", <input value={f.location} onChange={e=>set("location",e.target.value)} placeholder="ARTIST Boutique Hotel — Vienna  ·  or https://meet.…" style={input}/>)}

            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
              <label style={{ display:"flex", alignItems:"center", gap:7, fontSize:12, color:C.slate, cursor:"pointer", whiteSpace:"nowrap" }}>
                <input type="checkbox" checked={f.reminderOn} onChange={e=>set("reminderOn",e.target.checked)} style={{ accentColor:C.primary, width:14, height:14 }}/>
                Reminder
              </label>
              <select value={f.reminder} disabled={!f.reminderOn} onChange={e=>set("reminder",e.target.value)} style={{ ...input, opacity:f.reminderOn?1:0.5 }}>
                {REMINDER_OPTS.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>

            {field("Description", <textarea value={f.note} onChange={e=>set("note",e.target.value)} placeholder="Any details for this appointment…"
              style={{ ...input, minHeight:70, resize:"none", lineHeight:1.5 }}/>)}

            <div style={{ display:"flex", gap:10, marginTop:6 }}>
              <button onClick={onClose} style={{ flex:1, padding:"10px", borderRadius:9, border:`1px solid ${C.border}`, background:"#fff", color:C.slate, fontSize:13, fontWeight:600, cursor:"pointer" }}>Cancel</button>
              <button onClick={()=>canSave && onSubmit && onSubmit({ ...f, kind:"appointment" }, m)} disabled={!canSave}
                style={{ flex:2, padding:"10px", borderRadius:9, border:"none", background:canSave?C.primary:"#E2E8F0", color:canSave?"#fff":C.muted, fontSize:13, fontWeight:700, cursor:canSave?"pointer":"default" }}>
                {m==="edit" ? "Update" : "Save"}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
