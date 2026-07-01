import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { AUDIT_EVENTS } from "../../lib/core";
import { C } from "../../theme";

export const AuditLogSection = () => {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const roleColor = r => ({ GP:C.green, VD:C.indigo, SA:C.navy, Auto:C.muted }[r] || C.muted);
  const filtered = AUDIT_EVENTS.filter(e =>
    (filter==="all" || e.role===filter || (filter==="system" && e.role==="Auto")) &&
    (!search || [e.user,e.action,e.target].some(s=>s.toLowerCase().includes(search.toLowerCase())))
  );
  return (
    <>
      <div style={{ fontSize:20,fontWeight:800,color:C.navy,marginBottom:20 }}>Audit Log</div>
      <div style={{ padding:"10px 16px",borderRadius:8,background:"#EFF6FF",border:`1px solid ${C.blue}30`,fontSize:12,color:"#1E40AF",marginBottom:16 }}>
        📋 All lead access, modifications, exports, and system events are logged here for GDPR compliance (GDPR-09, NF-11). Retained for 12 months.
      </div>
      <div style={{ display:"flex",gap:8,marginBottom:14,flexWrap:"wrap" }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search user, action, target…"
          style={{ border:`1px solid ${C.border}`,borderRadius:7,padding:"7px 12px",fontSize:12,fontFamily:"inherit",width:220 }}/>
        {[["all","All"],["GP","Advisors"],["VD","Directors"],["SA","Admin"],["system","System"]].map(([k,l])=>(
          <button key={k} onClick={()=>setFilter(k)}
            style={{ padding:"6px 12px",borderRadius:20,border:`1px solid ${filter===k?C.primary:C.border}`,
              background:filter===k?C.primary:"#fff",color:filter===k?"#fff":C.slate,
              fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>{l}</button>
        ))}
        <button style={{ marginLeft:"auto",padding:"6px 12px",borderRadius:7,border:`1px solid ${C.border}`,background:"#fff",color:C.slate,fontSize:11,fontWeight:600,cursor:"pointer" }}>⬇ Export CSV</button>
      </div>
      <div style={{ background:"#fff",borderRadius:12,border:`1px solid ${C.border}`,overflow:"hidden" }}>
        <table style={{ width:"100%",borderCollapse:"collapse",fontSize:12 }}>
          <thead>
            <tr style={{ background:"#F8FAFC",borderBottom:`2px solid ${C.border}` }}>
              {["Time","User","Role","Action","Target","IP"].map(h=>(
                <th key={h} style={{ padding:"9px 14px",textAlign:"left",fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((e,i)=>(
              <tr key={i} style={{ borderBottom:`1px solid ${C.border}`,background:i%2===0?"#fff":"#FAFAFA" }}>
                <td style={{ padding:"9px 14px",color:C.muted,whiteSpace:"nowrap" }}>{e.time}</td>
                <td style={{ padding:"9px 14px",fontWeight:600,color:C.text }}>{e.user}</td>
                <td style={{ padding:"9px 14px" }}>
                  <span style={{ fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:8,color:roleColor(e.role),background:roleColor(e.role)+"18" }}>{e.role}</span>
                </td>
                <td style={{ padding:"9px 14px",color:C.text }}>{e.action}</td>
                <td style={{ padding:"9px 14px",color:C.slate,fontFamily:"monospace",fontSize:11 }}>{e.target}</td>
                <td style={{ padding:"9px 14px",color:C.muted,fontFamily:"monospace",fontSize:11 }}>{e.ip}</td>
              </tr>
            ))}
            {filtered.length===0 && (
              <tr><td colSpan={6} style={{ padding:"24px",textAlign:"center",color:C.muted }}>No matching log entries</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop:10,fontSize:11,color:C.muted }}>Showing {filtered.length} of {AUDIT_EVENTS.length} events · Retained 12 months per GDPR Article 5(1)(e)</div>
    </>
  );
};

// ─── Language Section ─────────────────────────────────────────────────────────
