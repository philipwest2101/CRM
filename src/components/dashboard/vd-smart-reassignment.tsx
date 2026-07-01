import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Avatar } from "../ui/avatar";
import { C } from "../../theme";

export const VDSmartReassignment = () => {
  const [approvedIds, setApprovedIds] = useState([]);
  const suggestions = [
    {lead:"Nina Hartmann",  from:"Marc Otto", reason:"Anna Klein: 64% reach rate for Messe FFM contacts — Marc is at capacity", score:89},
    {lead:"Claudia Becker", from:"Marc Otto", reason:"Giveaway campaign performs 2× better under Anna Klein historically",    score:83},
  ];
  return (
    <div style={{ padding:"16px 20px",borderRadius:12,background:"#fff",border:`1px solid ${C.border}`,marginBottom:14 }}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12 }}>
        <div>
          <div style={{ fontSize:13,fontWeight:800,color:C.text }}>🤖 Smart Reassignment</div>
          <div style={{ fontSize:11,color:C.muted,marginTop:2 }}>AI suggests redistributing overloaded leads from Marc Otto to Anna Klein this week.</div>
        </div>
        <button onClick={()=>setApprovedIds(suggestions.map(s=>s.lead))} style={{ padding:"6px 14px",borderRadius:7,border:"none",background:C.ai,color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer" }}>✓ Approve All</button>
      </div>
      {suggestions.map((s)=>{
        const approved=approvedIds.includes(s.lead);
        return (
          <div key={s.lead} style={{ padding:"12px 14px",borderRadius:10,border:`1.5px solid ${approved?C.green:C.border}`,background:approved?C.green+"06":"#FAFAFA",marginBottom:8,display:"flex",gap:12,alignItems:"center" }}>
            <Avatar name={s.lead} size={34}/>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:12,fontWeight:700,color:C.text,marginBottom:2 }}>{s.lead} <span style={{ fontSize:11,color:C.muted,fontWeight:400 }}>← {s.from}</span></div>
              <div style={{ fontSize:11,color:C.slate }}>{s.reason}</div>
            </div>
            <span style={{ fontSize:12,fontWeight:700,color:C.ai,flexShrink:0 }}>{s.score}%</span>
            <button onClick={()=>setApprovedIds(prev=>approved?prev.filter(x=>x!==s.lead):[...prev,s.lead])} style={{ padding:"6px 12px",borderRadius:7,border:"none",background:approved?C.green:"#F1F5F9",color:approved?"#fff":C.slate,fontSize:11,fontWeight:700,cursor:"pointer",flexShrink:0,transition:"all 0.15s" }}>{approved?"✓ Approved":"Approve"}</button>
          </div>
        );
      })}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// GP DASHBOARD  (Berater — based on 01_advisor design)
// ─────────────────────────────────────────────────────────────────────────────
