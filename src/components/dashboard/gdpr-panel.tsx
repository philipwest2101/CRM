import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Avatar } from "../ui/avatar";
import { C } from "../../theme";

export const GDPRPanel = () => {
  const [open, setOpen] = useState(true);
  const [leads, setLeads] = useState([
    { id:"g1", name:"Werner Schäfer",  email:"w.schaefer@mail.de",  campaign:"Q1 Finanz",   expired:"14 Jan 2026" },
    { id:"g2", name:"Britta Lange",    email:"b.lange@gmx.de",      campaign:"Messe FFM",   expired:"18 Jan 2026" },
    { id:"g3", name:"Holger Braun",    email:"h.braun@web.de",      campaign:"Webinar März", expired:"21 Jan 2026" },
  ]);
  const [actions, setActions] = useState({});  // id → "deleted" | "reconsented"
  const pending = leads.filter(l=>!actions[l.id]).length;

  const act = (id, action) => setActions(prev=>({...prev,[id]:action}));
  const allDone = pending === 0;

  return (
    <div style={{ marginBottom:14,borderRadius:10,border:`1.5px solid ${allDone?C.green:C.red}30`,overflow:"hidden" }}>
      {/* Header — always visible */}
      <div
        onClick={()=>setOpen(o=>!o)}
        style={{ padding:"12px 18px",background:allDone?C.green+"08":C.red+"06",display:"flex",alignItems:"center",gap:12,cursor:"pointer" }}>
        <span style={{ fontSize:18 }}>🔒</span>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:12,fontWeight:700,color:allDone?C.green:C.red }}>
            {allDone?"GDPR — All resolved ✓":`GDPR — ${pending} lead${pending!==1?"s":""} with expired consent`}
          </div>
          <div style={{ fontSize:11,color:C.muted }}>
            {allDone?"No further action required.":"Retention period reached. Delete or send a re-consent email per lead."}
          </div>
        </div>
        <span style={{ fontSize:12,color:C.muted,fontWeight:600 }}>{open?"▲ Collapse":"▼ Review"}</span>
      </div>

      {/* Expandable rows */}
      {open && (
        <div style={{ background:"#fff",borderTop:`1px solid ${C.border}` }}>
          {leads.map((l,i)=>{
            const done = actions[l.id];
            return (
              <div key={l.id} style={{ display:"flex",alignItems:"center",gap:14,padding:"12px 18px",borderBottom:i<leads.length-1?`1px solid ${C.border}`:"none",background:done?"#F0FDF4":"#fff" }}>
                <Avatar name={l.name} size={32}/>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ fontSize:12,fontWeight:700,color:done?C.muted:C.text,textDecoration:done?"line-through":"none" }}>{l.name}</div>
                  <div style={{ fontSize:11,color:C.muted }}>{l.email} · {l.campaign}</div>
                </div>
                <div style={{ fontSize:10,color:C.muted,flexShrink:0,textAlign:"right" }}>
                  <div style={{ fontWeight:600,color:C.red }}>Expired {l.expired}</div>
                </div>
                {done ? (
                  <span style={{ fontSize:11,fontWeight:700,color:C.green,minWidth:100,textAlign:"center" }}>
                    {done==="deleted"?"🗑 Deleted":"✉️ Re-consent sent"}
                  </span>
                ) : (
                  <div style={{ display:"flex",gap:7,flexShrink:0 }}>
                    <button onClick={()=>act(l.id,"reconsented")}
                      style={{ padding:"6px 12px",borderRadius:7,border:`1px solid ${C.indigo}30`,background:C.indigo+"08",color:C.indigo,fontSize:11,fontWeight:700,cursor:"pointer" }}>
                      ✉️ Re-consent
                    </button>
                    <button onClick={()=>act(l.id,"deleted")}
                      style={{ padding:"6px 12px",borderRadius:7,border:`1px solid ${C.red}30`,background:C.red+"08",color:C.red,fontSize:11,fontWeight:700,cursor:"pointer" }}>
                      🗑 Delete
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          {allDone && (
            <div style={{ padding:"10px 18px",background:C.green+"08",fontSize:11,color:C.green,fontWeight:600,textAlign:"center" }}>
              ✓ All 3 leads resolved · GDPR log updated
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── SA: Smart Assignment full table ─────────────────────────────────────────
// ─── SA Period Filter + Date Picker ──────────────────────────────────────────
