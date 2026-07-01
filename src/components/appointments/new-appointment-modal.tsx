import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { APPOINTMENTS, APPT_TYPE_META } from "../../lib/core";
import { C } from "../../theme";

export const NewAppointmentModal = ({ lead, onClose, role, onAdd }) => {
  const [aDate,     setADate]    = useState("");
  const [aTime,     setATime]    = useState("");
  const [aEnd,      setAEnd]     = useState("");
  const [aType,     setAType]    = useState("call");
  const [aLead,     setALead]    = useState(lead?.name || "");
  const [aGP,       setAGP]      = useState("Anna Klein");
  const [aNotes,    setANotes]   = useState("");
  const [saved,     setSaved]    = useState(false);

  const gpList = [...new Set(APPOINTMENTS.map(a=>a.gp))].sort();

  const canSave = aDate && aTime && aLead.trim();

  const handleSave = () => {
    const newAppt = {
      id: `A-${Date.now()}`,
      lead: lead?.name || aLead,
      leadId: lead?.id || null,
      date: aDate,
      start: aTime,
      end: aEnd || (aTime ? `${String(parseInt(aTime)+1).padStart(2,"0")}:00` : ""),
      type: aType,
      gp: aGP,
      vd: "Thomas Müller",
      status: "upcoming",
      notes: aNotes,
    };
    if (onAdd) onAdd(newAppt);
    setSaved(true);
    setTimeout(()=>onClose(), 1400);
  };

  return (
    <>
      <div onClick={onClose} style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.35)",zIndex:400 }}/>
      <div style={{ position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",
        width:480,background:"#fff",borderRadius:16,zIndex:500,
        boxShadow:"0 24px 64px rgba(0,0,0,0.2)",fontFamily:"inherit",padding:"24px" }}>

        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
          <div style={{ fontSize:15,fontWeight:800,color:C.navy }}>📅 New Appointment</div>
          <button onClick={onClose}
            style={{ width:26,height:26,borderRadius:"50%",border:`1px solid ${C.border}`,background:"#F8FAFC",color:C.muted,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>×</button>
        </div>

        {/* Contact */}
        <div style={{ marginBottom:12 }}>
          <label style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:5 }}>Contact</label>
          {lead ? (
            <div style={{ padding:"9px 12px",borderRadius:8,background:C.indigo+"08",border:`1px solid ${C.indigo}25`,fontSize:13,fontWeight:600,color:C.text }}>
              {lead.name}
            </div>
          ) : (
            <input value={aLead} onChange={e=>setALead(e.target.value)}
              placeholder="Search contact name…"
              style={{ width:"100%",padding:"9px 12px",borderRadius:8,border:`1.5px solid ${C.border}`,fontSize:13,fontFamily:"inherit",boxSizing:"border-box",outline:"none" }}/>
          )}
        </div>

        {/* Date + Time + End */}
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:12 }}>
          {[["Date","date",aDate,setADate],["Start","time",aTime,setATime],["End","time",aEnd,setAEnd]].map(([label,type,val,setter])=>(
            <div key={label}>
              <label style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:5 }}>{label}</label>
              <input type={type} value={val} onChange={e=>setter(e.target.value)}
                style={{ width:"100%",padding:"9px 12px",borderRadius:8,border:`1.5px solid ${C.border}`,fontSize:12,fontFamily:"inherit",boxSizing:"border-box",outline:"none" }}/>
            </div>
          ))}
        </div>

        {/* Type */}
        <div style={{ marginBottom:12 }}>
          <label style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:5 }}>Type</label>
          <div style={{ display:"flex",gap:8 }}>
            {[["call","📞 Phone Call"],["video","📹 Video Call"],["inperson","🤝 In-Person"]].map(([k,l])=>(
              <button key={k} onClick={()=>setAType(k)}
                style={{ flex:1,padding:"8px 0",borderRadius:8,border:`1.5px solid ${aType===k?APPT_TYPE_META[k]?.color||C.indigo:C.border}`,
                  background:aType===k?(APPT_TYPE_META[k]?.color||C.indigo)+"0D":"#fff",
                  color:aType===k?APPT_TYPE_META[k]?.color||C.indigo:C.slate,
                  fontSize:12,fontWeight:aType===k?700:400,cursor:"pointer",fontFamily:"inherit" }}>{l}</button>
            ))}
          </div>
        </div>

        {/* Advisor — SA/VD can pick */}
        {(role==="superadmin"||role==="vd") && (
          <div style={{ marginBottom:12 }}>
            <label style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:5 }}>Advisor</label>
            <select value={aGP} onChange={e=>setAGP(e.target.value)}
              style={{ width:"100%",padding:"9px 12px",borderRadius:8,border:`1.5px solid ${C.border}`,fontSize:13,fontFamily:"inherit",background:"#fff",outline:"none" }}>
              {gpList.map(gp=><option key={gp} value={gp}>{gp}</option>)}
            </select>
          </div>
        )}

        {/* Notes */}
        <div style={{ marginBottom:18 }}>
          <label style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:5 }}>Notes</label>
          <textarea value={aNotes} onChange={e=>setANotes(e.target.value)}
            placeholder="Any preparation notes…" rows={2}
            style={{ width:"100%",padding:"9px 12px",borderRadius:8,border:`1.5px solid ${C.border}`,fontSize:12,fontFamily:"inherit",boxSizing:"border-box",resize:"none",outline:"none",lineHeight:1.5 }}/>
        </div>

        {saved ? (
          <div style={{ padding:"12px",borderRadius:9,background:C.green+"0A",border:`1px solid ${C.green}30`,textAlign:"center",fontSize:13,fontWeight:700,color:C.green }}>
            ✅ Appointment booked successfully
          </div>
        ) : (
          <div style={{ display:"flex",gap:10 }}>
            <button onClick={onClose}
              style={{ flex:1,padding:"10px",borderRadius:9,border:`1px solid ${C.border}`,background:"#fff",color:C.slate,fontSize:13,fontWeight:600,cursor:"pointer" }}>
              Cancel
            </button>
            <button onClick={handleSave} disabled={!canSave}
              style={{ flex:2,padding:"10px",borderRadius:9,border:"none",
                background:canSave?C.indigo:"#E2E8F0",color:canSave?"#fff":C.muted,
                fontSize:13,fontWeight:700,cursor:canSave?"pointer":"default" }}>
              📅 Book Appointment
            </button>
          </div>
        )}
      </div>
    </>
  );
};

// ─── Auto-Assign by ZIP Page ──────────────────────────────────────────────────
