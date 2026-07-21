import React, { useState } from "react";
import { NETWORK_OUTCOMES } from "../../lib/core";
import { C } from "../../theme";

// Appointment Outcome modal (matches the "Appointment Outcome" wireframe)

const lbl   = { fontSize:11, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.05em", display:"block", marginBottom:5 };
const input = { width:"100%", padding:"9px 12px", borderRadius:8, border:`1.5px solid ${C.border}`, fontSize:13, fontFamily:"inherit", boxSizing:"border-box", outline:"none", background:"#fff", color:C.text };

const APPOINTMENT_STATUS = ["Completed", "No Show", "Rescheduled", "Cancelled"];

export const AppointmentOutcomeModal = ({ appt=null, onClose, onSave }) => {
  const [status,  setStatus]  = useState("");
  const [report,  setReport]  = useState("");
  // Set Outcome is a Network-only action (Lead appointments are worked in the
  // Processing & Feedback tab). A Network member has no stage status — instead it
  // carries an Outcome: any combination of Customer / Partner (empty = a plain
  // Network contact).
  const [outcome, setOutcome] = useState<string[]>([]);
  const toggleOutcome = (v) => setOutcome(o => o.includes(v) ? o.filter(x => x !== v) : [...o, v]);

  const canSave = !!status && !!report.trim();

  return (
    <>
      <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.4)", zIndex:800 }}/>
      <div style={{ position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%)",
        width:460, maxHeight:"92vh", overflowY:"auto", background:"#fff", borderRadius:16, zIndex:900,
        boxShadow:"0 24px 64px rgba(0,0,0,0.2)", fontFamily:"inherit", padding:"22px 24px" }}>

        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
          <div style={{ fontSize:15, fontWeight:800, color:C.navy }}>📋 Appointment Outcome</div>
          <button onClick={onClose} style={{ width:28, height:28, borderRadius:"50%", border:`1px solid ${C.border}`, background:"#F8FAFC", color:C.muted, fontSize:15, cursor:"pointer" }}>×</button>
        </div>

        {appt && (
          <div style={{ fontSize:12, color:C.muted, marginBottom:16 }}>
            {appt.contact ? `👤 ${appt.contact}` : ""}{appt.date ? `  ·  📅 ${appt.date}${appt.time?` ${appt.time}`:""}` : ""}
          </div>
        )}

        <div style={{ marginBottom:12 }}>
          <label style={lbl}>Appointment Status *</label>
          <select value={status} onChange={e=>setStatus(e.target.value)} style={input}>
            <option value="">Choose…</option>
            {APPOINTMENT_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div style={{ marginBottom:12 }}>
          <label style={lbl}>Appointment Report *</label>
          <textarea value={report} onChange={e=>setReport(e.target.value)} placeholder="What happened in the appointment…"
            style={{ ...input, minHeight:90, resize:"none", lineHeight:1.5 }}/>
        </div>

        <div style={{ marginBottom:18 }}>
          <label style={lbl}>Outcome — the person may be both</label>
          <div style={{ display:"flex", gap:10 }}>
            {NETWORK_OUTCOMES.map(v => {
              const on = outcome.includes(v);
              const tone = v === "Customer" ? C.green : C.indigo;
              return (
                <button key={v} onClick={()=>toggleOutcome(v)} style={{
                  flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"10px 12px", borderRadius:9,
                  border:`1.5px solid ${on?tone:C.border}`, background:on?tone+"12":"#fff", color:on?tone:C.slate,
                  fontSize:13, fontWeight:on?700:500, cursor:"pointer", fontFamily:"inherit" }}>
                  <span style={{ width:16, height:16, borderRadius:4, border:`2px solid ${on?tone:C.border}`, background:on?tone:"#fff", display:"grid", placeItems:"center", fontSize:10, color:"#fff" }}>{on?"✓":""}</span>
                  {v}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display:"flex", gap:10 }}>
          <button onClick={onClose} style={{ flex:1, padding:"10px", borderRadius:9, border:`1px solid ${C.border}`, background:"#fff", color:C.slate, fontSize:13, fontWeight:600, cursor:"pointer" }}>Cancel</button>
          <button onClick={()=>canSave && onSave && onSave({ status, report, outcome })} disabled={!canSave}
            style={{ flex:2, padding:"10px", borderRadius:9, border:"none", background:canSave?C.primary:"#E2E8F0", color:canSave?"#fff":C.muted, fontSize:13, fontWeight:700, cursor:canSave?"pointer":"default" }}>
            Save Outcome
          </button>
        </div>
      </div>
    </>
  );
};
