import React from "react";
import { C } from "../../theme";

// Lead appointment modal — READ ONLY.
//
// A Lead's appointment is worked from the lead's "Processing & Feedback" tab,
// never edited on the Calendar. So — unlike the Network appointment modal
// (appointment-modal.tsx), which supports create / edit / Cancel / Set Outcome —
// this modal only *shows* the appointment and offers a shortcut into Processing
// & Feedback. Network contacts get the actionable modal; Leads get this one.

const lbl = { fontSize:11, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.05em", display:"block", marginBottom:5 };

const toList = (v) => Array.isArray(v)
  ? v.filter(Boolean).join(", ")
  : (v || "");

export const LeadAppointmentModal = ({ appt=null, onClose, onOpenProcessing }) => {
  const f = appt || {};
  const apptType = f.apptType === "Other" ? (f.apptTypeOther || "Other") : f.apptType;

  const row = (label, value) => value ? (
    <div style={{ display:"flex", justifyContent:"space-between", padding:"9px 0", borderBottom:`1px solid ${C.border}`, fontSize:12, gap:12 }}>
      <span style={{ color:C.muted }}>{label}</span>
      <span style={{ color:C.text, fontWeight:600, textAlign:"right" }}>{value}</span>
    </div>
  ) : null;

  return (
    <>
      <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.35)", zIndex:600 }}/>
      <div style={{ position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%)",
        width:520, maxHeight:"92vh", overflowY:"auto", background:"#fff", borderRadius:16, zIndex:700,
        boxShadow:"0 24px 64px rgba(0,0,0,0.2)", fontFamily:"inherit", padding:"22px 24px" }}>

        {/* Header — note the Lead badge, so the modal reads differently from the
            Network one at a glance. */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <div style={{ display:"flex", alignItems:"center", gap:9, minWidth:0 }}>
            <span style={{ fontSize:18 }}>📅</span>
            <span style={{ fontSize:15, fontWeight:800, color:C.navy, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
              Lead Appointment — {f.title || "Untitled"}
            </span>
            <span style={{ flexShrink:0, fontSize:10, fontWeight:800, color:C.slate, background:C.light,
              border:`1px solid ${C.border}`, padding:"2px 8px", borderRadius:20, textTransform:"uppercase", letterSpacing:"0.04em" }}>Lead</span>
          </div>
          <button onClick={onClose} style={{ width:28, height:28, borderRadius:"50%", border:`1px solid ${C.border}`, background:"#F8FAFC", color:C.muted, fontSize:15, cursor:"pointer", flexShrink:0 }}>×</button>
        </div>

        {/* Read-only details */}
        <div>
          {row("📅 Date & Time", `${f.date||""}${f.time?` · ${f.time}`:""}${f.end?` – ${f.end}`:""}`)}
          {row("👤 Contact", f.contact)}
          {row("🏷 Type", apptType)}
          {row("👥 Attendees", toList(f.attendees))}
          {row("📍 Meeting Location", f.location)}
          {row("📎 Attachments", toList(f.attachments) || toList(f.attachment))}
          {f.note && (
            <div style={{ marginTop:12 }}>
              <label style={lbl}>Description</label>
              <div style={{ fontSize:12, color:C.slate, lineHeight:1.5 }}>{f.note}</div>
            </div>
          )}
        </div>

        {/* Read-only rationale + shortcut into Processing & Feedback. No edit /
            cancel / outcome actions — those belong to Network appointments. */}
        <div style={{ marginTop:16, padding:"11px 13px", borderRadius:10, background:C.light, border:`1px solid ${C.border}` }}>
          <div style={{ fontSize:12, color:C.slate, lineHeight:1.5 }}>
            This appointment belongs to a <b>Lead</b>. Leads are worked from the lead's{" "}
            <b>Processing &amp; Feedback</b> tab, so the appointment is read-only here.
          </div>
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:10, marginTop:16 }}>
          {onOpenProcessing && (
            <button onClick={()=>onOpenProcessing(f)}
              style={{ padding:"9px 18px", borderRadius:9, border:"none", background:C.primary, color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer" }}>
              Open Processing &amp; Feedback
            </button>
          )}
          <button onClick={onClose}
            style={{ marginLeft:"auto", padding:"9px 22px", borderRadius:9, border:`1px solid ${C.border}`, background:"#fff", color:C.slate, fontSize:13, fontWeight:600, cursor:"pointer" }}>
            Close
          </button>
        </div>
      </div>
    </>
  );
};
