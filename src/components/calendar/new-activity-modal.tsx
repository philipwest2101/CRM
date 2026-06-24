import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { ACTIVITY_TYPES, APPOINTMENT_TYPE_KEYS, TASK_TYPE_KEYS } from "../../lib/core";
import { C } from "../../theme";

export const NewActivityModal = ({ onClose, role, onAdd, initial=null }) => {
  // If opened via chevron dropdown, initial.type is pre-set → lock the type
  const typePreset = !!initial?.type;
  const [type,     setType]     = useState(initial?.type||"call");
  const [title,    setTitle]    = useState(initial?.title||"");
  const [lead,     setLead]     = useState(initial?.lead||"");
  const [date,     setDate]     = useState(initial?.date||"");
  const [time,     setTime]     = useState(initial?.time||"09:00");
  const [end,      setEnd]      = useState(initial?.end||"");
  const [priority, setPriority] = useState(initial?.priority||"normal");
  const [recur,    setRecur]    = useState(initial?.recur||"Once");
  const [note,     setNote]     = useState(initial?.note||"");
  const [push,     setPush]     = useState(initial?.channels?.includes("push")!==false);
  const [location, setLocation] = useState(initial?.location||"");
  const [link,     setLink]     = useState(initial?.link||"");
  const [saved,    setSaved]    = useState(false);

  const at = ACTIVITY_TYPES[type];
  const canSave = title.trim() && date && (!at.timeLabel || time);   // Time required when the type has a time

  return (
    <>
      <div onClick={onClose} style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.35)",zIndex:400 }}/>
      <div style={{ position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",
        width:560,maxHeight:"90vh",overflowY:"auto",background:"#fff",borderRadius:16,zIndex:500,
        boxShadow:"0 24px 64px rgba(0,0,0,0.2)",fontFamily:"inherit",padding:"24px" }}>

        {/* Header */}
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18 }}>
          <div style={{ display:"flex",alignItems:"center",gap:10 }}>
            <div style={{ fontSize:15,fontWeight:800,color:C.navy }}>
              {initial?"✏️ Edit Activity":"+ Add Activity"}
            </div>
            {/* Show type badge when pre-selected via chevron */}
            {typePreset && (
              <div style={{ display:"flex",alignItems:"center",gap:6,padding:"4px 12px",borderRadius:20,
                background:at.bg,border:`1.5px solid ${at.color}`,
                fontSize:12,fontWeight:700,color:at.color }}>
                <span>{at.icon}</span>{at.label}
                {/* Allow changing type via small "change" link */}
                <button onClick={()=>{ /* noop — type locked from chevron */ }}
                  title="Type selected from menu"
                  style={{ marginLeft:4,fontSize:10,color:at.color,opacity:0.6,background:"none",border:"none",cursor:"default" }}>
                  ✓ locked
                </button>
              </div>
            )}
          </div>
          <button onClick={onClose} style={{ width:26,height:26,borderRadius:"50%",border:`1px solid ${C.border}`,background:"#F8FAFC",color:C.muted,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>×</button>
        </div>

        {/* Type picker — only shown when NOT pre-selected via chevron */}
        {!typePreset && (
          <div style={{ marginBottom:16 }}>
            {[["Appointments",APPOINTMENT_TYPE_KEYS],["Tasks",TASK_TYPE_KEYS]].map(([groupLabel,keys])=>(
              <div key={groupLabel} style={{ marginBottom:10 }}>
                <label style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:8 }}>{groupLabel}</label>
                <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
                  {keys.map(k=>{ const v=ACTIVITY_TYPES[k]; return (
                    <button key={k} onClick={()=>setType(k)}
                      style={{ padding:"8px 12px",borderRadius:9,border:`1.5px solid ${type===k?v.color:C.border}`,
                        background:type===k?v.bg:"#fff",color:type===k?v.color:C.muted,
                        fontSize:12,fontWeight:type===k?700:400,cursor:"pointer",fontFamily:"inherit",
                        display:"flex",alignItems:"center",gap:6,transition:"all 0.12s" }}>
                      <span style={{ fontSize:14 }}>{v.icon}</span>{v.label}
                    </button>
                  );})}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Title */}
        <div style={{ marginBottom:12 }}>
          <label style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:5 }}>
            {at.icon} {type==="call"?"Call subject":type==="email"?"Email subject":type==="note"?"Note title":"Meeting title"}
          </label>
          <input value={title} onChange={e=>setTitle(e.target.value)}
            placeholder={`e.g. Follow-up call with Sandra Richter`}
            style={{ width:"100%",padding:"9px 12px",borderRadius:8,border:`1.5px solid ${C.border}`,fontSize:13,fontFamily:"inherit",boxSizing:"border-box",outline:"none" }}/>
        </div>

        {/* Contact */}
        <div style={{ marginBottom:12 }}>
          <label style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:5 }}>Contact (optional)</label>
          <input value={lead} onChange={e=>setLead(e.target.value)}
            placeholder="Search contact name…"
            style={{ width:"100%",padding:"9px 12px",borderRadius:8,border:`1.5px solid ${C.border}`,fontSize:13,fontFamily:"inherit",boxSizing:"border-box",outline:"none" }}/>
        </div>

        {/* Date */}
        <div style={{ marginBottom:12 }}>
          <label style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:5 }}>Date *</label>
          <input type="date" value={date} onChange={e=>setDate(e.target.value)}
            style={{ width:"100%",padding:"9px 12px",borderRadius:8,border:`1.5px solid ${C.border}`,fontSize:12,fontFamily:"inherit",boxSizing:"border-box",outline:"none" }}/>
        </div>

        {/* Time fields — type-specific */}
        {at.timeLabel && (
          <div style={{ display:"grid",gridTemplateColumns:at.hasEnd?"1fr 1fr":"1fr",gap:10,marginBottom:12 }}>
            <div>
              <label style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:5 }}>{at.timeLabel} *</label>
              <input type="time" value={time} onChange={e=>setTime(e.target.value)}
                style={{ width:"100%",padding:"9px 12px",borderRadius:8,border:`1.5px solid ${C.border}`,fontSize:12,fontFamily:"inherit",boxSizing:"border-box",outline:"none" }}/>
            </div>
            {at.hasEnd && (
              <div>
                <label style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:5 }}>End time</label>
                <input type="time" value={end} onChange={e=>setEnd(e.target.value)}
                  style={{ width:"100%",padding:"9px 12px",borderRadius:8,border:`1.5px solid ${C.border}`,fontSize:12,fontFamily:"inherit",boxSizing:"border-box",outline:"none" }}/>
              </div>
            )}
          </div>
        )}

        {/* Call duration selector */}
        {at.durOptions && (
          <div style={{ marginBottom:12 }}>
            <label style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:5 }}>Duration</label>
            <div style={{ display:"flex",gap:6 }}>
              {at.durOptions.map(d=>(
                <button key={d} onClick={()=>setEnd(time?(()=>{const [h,m]=time.split(":").map(Number);const tot=h*60+m+d;return `${String(Math.floor(tot/60)).padStart(2,"0")}:${String(tot%60).padStart(2,"0")}`;})():"")}
                  style={{ padding:"5px 10px",borderRadius:7,border:`1px solid ${C.border}`,background:"#fff",color:C.slate,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>
                  {d}min
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Location — in-person + events */}
        {at.hasLocation && (
          <div style={{ marginBottom:12 }}>
            <label style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:5 }}>📍 Location</label>
            <input value={location} onChange={e=>setLocation(e.target.value)}
              placeholder="e.g. Hauptstraße 12, München or Office Room 3"
              style={{ width:"100%",padding:"9px 12px",borderRadius:8,border:`1.5px solid ${C.border}`,fontSize:12,fontFamily:"inherit",boxSizing:"border-box",outline:"none" }}/>
          </div>
        )}

        {/* Meeting link — video + events */}
        {at.hasLink && (
          <div style={{ marginBottom:12 }}>
            <label style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:5 }}>🔗 Meeting link</label>
            <input value={link} onChange={e=>setLink(e.target.value)}
              placeholder="https://meet.google.com/…"
              style={{ width:"100%",padding:"9px 12px",borderRadius:8,border:`1.5px solid ${C.border}`,fontSize:12,fontFamily:"inherit",boxSizing:"border-box",outline:"none" }}/>
          </div>
        )}

        {/* Priority + Recurrence */}
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12 }}>
          <div>
            <label style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:5 }}>Priority</label>
            <div style={{ position:"relative" }}>
              <select value={priority} onChange={e=>setPriority(e.target.value)}
                style={{ width:"100%",padding:"9px 28px 9px 12px",borderRadius:8,border:`1.5px solid ${C.border}`,fontSize:12,fontFamily:"inherit",appearance:"none",outline:"none",background:"#fff" }}>
                <option value="urgent">🚨 Urgent</option>
                <option value="high">🔴 High</option>
                <option value="normal">🟡 Normal</option>
                <option value="low">⚪ Low</option>
              </select>
              <div style={{ position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",pointerEvents:"none",fontSize:10,color:C.muted }}>▼</div>
            </div>
          </div>
          <div>
            <label style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:5 }}>Recurrence</label>
            <div style={{ position:"relative" }}>
              <select value={recur} onChange={e=>setRecur(e.target.value)}
                style={{ width:"100%",padding:"9px 28px 9px 12px",borderRadius:8,border:`1.5px solid ${C.border}`,fontSize:12,fontFamily:"inherit",appearance:"none",outline:"none",background:"#fff" }}>
                <option value="Once">Once</option>
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
                <option value="Yearly">Yearly</option>
              </select>
              <div style={{ position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",pointerEvents:"none",fontSize:10,color:C.muted }}>▼</div>
            </div>
          </div>
        </div>

        {/* Note */}
        <div style={{ marginBottom:14 }}>
          <label style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:5 }}>Note</label>
          <textarea value={note} onChange={e=>setNote(e.target.value)}
            placeholder="Any additional details…" rows={2}
            style={{ width:"100%",padding:"9px 12px",borderRadius:8,border:`1.5px solid ${C.border}`,fontSize:12,fontFamily:"inherit",boxSizing:"border-box",resize:"none",outline:"none",lineHeight:1.5 }}/>
        </div>

        {/* Push notification */}
        <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:18,padding:"10px 14px",
          borderRadius:9,background:"#F8FAFC",border:`1px solid ${C.border}` }}>
          <div onClick={()=>setPush(v=>!v)}
            style={{ width:36,height:20,borderRadius:10,background:push?"#7C3AED":"#CBD5E1",cursor:"pointer",position:"relative",transition:"background 0.2s" }}>
            <div style={{ position:"absolute",top:2,left:push?18:2,width:16,height:16,borderRadius:"50%",background:"#fff",transition:"left 0.2s",boxShadow:"0 1px 3px rgba(0,0,0,0.2)" }}/>
          </div>
          <span style={{ fontSize:12,color:C.slate,fontWeight:600 }}>📱 Push notification</span>
          <span style={{ fontSize:11,color:C.muted,marginLeft:"auto" }}>Remind me before this activity</span>
        </div>

        {saved ? (
          <div style={{ padding:"13px",borderRadius:9,background:C.green+"0A",border:`1px solid ${C.green}30`,textAlign:"center",fontSize:13,fontWeight:700,color:C.green }}>
            ✅ Activity added to calendar
          </div>
        ) : (
          <div style={{ display:"flex",gap:10 }}>
            <button onClick={onClose}
              style={{ flex:1,padding:"10px",borderRadius:9,border:`1px solid ${C.border}`,background:"#fff",color:C.slate,fontSize:13,fontWeight:600,cursor:"pointer" }}>
              Cancel
            </button>
            <button disabled={!canSave} onClick={()=>{
              const act = {
                id: `act_${Date.now()}`,
                type, title:title.trim(), lead:lead.trim()||null, leadId:null,
                date, time, end, gp:"Anna Klein", vd:"Thomas Müller",
                status:"upcoming", priority, note, recur, location, link,
                channels: push?["push","inapp"]:["inapp"],
                entityType: ["inperson","video","event"].includes(type)?"appointment":"reminder",
                category:   ["inperson","video","event"].includes(type)?"appointment":"reminder",
              };
              if(onAdd) onAdd(act);
              // Parent controls closing via setShowNew(false) in onAdd — don't call onClose here
            }}
              style={{ flex:2,padding:"10px",borderRadius:9,border:"none",
                background:canSave?at.color:"#E2E8F0",color:canSave?"#fff":C.muted,
                fontSize:13,fontWeight:700,cursor:canSave?"pointer":"default" }}>
              {initial?"✓ Save changes":`${at.icon} Add ${at.short}`}
            </button>
          </div>
        )}
      </div>
    </>
  );
};

// ─── Activities Page (list/agenda view of unified activities) ─────────────────
