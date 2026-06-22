import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { StatsPanel } from "../dashboard/stats-panel";
import { ReportsPage } from "../reports/reports-page";
import { C } from "../../theme";

export const AIAgentsPanel = ({ agents: initialAgents }) => {
  const [agents, setAgents] = useState(initialAgents.map(a=>({...a, enabled:true})));
  const toggle = (i) => setAgents(prev=>prev.map((a,j)=>j===i?{...a,enabled:!a.enabled}:a));
  const totalSaved = agents.filter(a=>a.enabled).reduce((s,a)=>s+parseFloat(a.saved),0).toFixed(1);
  return (
    <div>
      {agents.map((a,i)=>(
        <div key={i} style={{ display:"flex",alignItems:"center",gap:10,padding:"9px 0",
          borderBottom:i<agents.length-1?`1px solid ${C.border}`:"none",
          opacity:a.enabled?1:0.45,transition:"opacity 0.2s" }}>
          <div style={{ width:8,height:8,borderRadius:"50%",background:a.enabled?a.color:C.muted,flexShrink:0,transition:"background 0.2s" }}/>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13,fontWeight:500,color:C.text }}>{a.name}</div>
            <div style={{ fontSize:10,color:C.muted,marginTop:1 }}>
              {a.enabled ? `${a.requests.toLocaleString()} req · ${a.success} OK` : "Paused — no requests processing"}
            </div>
          </div>
          <div style={{ textAlign:"right",marginRight:10 }}>
            <div style={{ fontSize:13,fontWeight:700,color:a.enabled?C.green:C.muted }}>{a.enabled?a.saved:"—"}</div>
            <div style={{ fontSize:9,color:C.muted }}>saved</div>
          </div>
          {/* Toggle */}
          <div onClick={()=>toggle(i)} style={{ width:36,height:20,borderRadius:10,
            background:a.enabled?C.green:"#CBD5E1",cursor:"pointer",position:"relative",
            flexShrink:0,transition:"background 0.2s" }}>
            <div style={{ position:"absolute",top:2,left:a.enabled?18:2,width:16,height:16,
              borderRadius:"50%",background:"#fff",transition:"left 0.2s",
              boxShadow:"0 1px 3px rgba(0,0,0,0.2)" }}/>
          </div>
        </div>
      ))}
      <div style={{ marginTop:10,padding:"8px 12px",borderRadius:9,background:C.green+"06",
        border:`1px solid ${C.green}25`,display:"flex",justifyContent:"space-between" }}>
        <span style={{ fontSize:11,color:C.muted }}>{agents.filter(a=>a.enabled).length}/{agents.length} agents active</span>
        <span style={{ fontSize:13,fontWeight:700,color:C.green }}>{totalSaved}h saved today</span>
      </div>
    </div>
  );
};

// ─── StatsPanel (used by ReportsPage) ────────────────────────────────────────
