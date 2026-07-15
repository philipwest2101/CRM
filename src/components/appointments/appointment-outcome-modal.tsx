import React, { useState } from "react";
import { LEAD_STAGE_STATUSES } from "../../lib/core";
import { C } from "../../theme";

// Appointment Outcome modal (matches the "Appointment Outcome" wireframe)

const lbl   = { fontSize:11, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.05em", display:"block", marginBottom:5 };
const input = { width:"100%", padding:"9px 12px", borderRadius:8, border:`1.5px solid ${C.border}`, fontSize:13, fontFamily:"inherit", boxSizing:"border-box", outline:"none", background:"#fff", color:C.text };

const MEETING_STATUS = ["Completed", "No-show", "Rescheduled", "Cancelled"];

export const AppointmentOutcomeModal = ({ appt=null, onClose, onSave }) => {
  const [status,  setStatus]  = useState("");
  const [report,  setReport]  = useState("");
  // Activities record Stage Status only; Lifecycle never changes here (it changes
  // solely via the Convert action). Options use the Lead vocabulary.
  const [sStatus, setSStatus] = useState(LEAD_STAGE_STATUSES[0] || "");

  const canSave = !!status && !!sStatus;

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
          <label style={lbl}>Meeting Status *</label>
          <select value={status} onChange={e=>setStatus(e.target.value)} style={input}>
            <option value="">Choose…</option>
            {MEETING_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div style={{ marginBottom:12 }}>
          <label style={lbl}>Meeting Report *</label>
          <textarea value={report} onChange={e=>setReport(e.target.value)} placeholder="What happened in the meeting…"
            style={{ ...input, minHeight:90, resize:"none", lineHeight:1.5 }}/>
        </div>

        <div style={{ marginBottom:18 }}>
          <label style={lbl}>Stage Status *</label>
          <select value={sStatus} onChange={e=>setSStatus(e.target.value)} style={input}>
            {LEAD_STAGE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div style={{ display:"flex", gap:10 }}>
          <button onClick={onClose} style={{ flex:1, padding:"10px", borderRadius:9, border:`1px solid ${C.border}`, background:"#fff", color:C.slate, fontSize:13, fontWeight:600, cursor:"pointer" }}>Cancel</button>
          <button onClick={()=>canSave && onSave && onSave({ status, report, stageStatus:sStatus })} disabled={!canSave}
            style={{ flex:2, padding:"10px", borderRadius:9, border:"none", background:canSave?C.primary:"#E2E8F0", color:canSave?"#fff":C.muted, fontSize:13, fontWeight:700, cursor:canSave?"pointer":"default" }}>
            Save Outcome
          </button>
        </div>
      </div>
    </>
  );
};
