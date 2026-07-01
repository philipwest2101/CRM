import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { C } from "../../theme";

export const SAPeriodFilter = () => {
  const [period, setPeriod] = useState("month");
  const PERIODS = [
    { id:"today",    label:"Today"    },
    { id:"week",     label:"Week"     },
    { id:"month",    label:"Month"    },
    { id:"quarter",  label:"Quarter"  },
    { id:"year",     label:"Year"     },
  ];
  return (
    <div style={{ display:"flex",alignItems:"center",gap:8,flexWrap:"wrap" }}>
      {/* Period pills */}
      <div style={{ display:"flex",border:`1px solid ${C.border}`,borderRadius:9,overflow:"hidden" }}>
        {PERIODS.map((p,i)=>(
          <button key={p.id} onClick={()=>setPeriod(p.id)}
            style={{ padding:"7px 14px",border:"none",background:period===p.id?C.primary:"#fff",
              color:period===p.id?"#fff":C.muted,fontSize:12,fontWeight:period===p.id?700:400,
              cursor:"pointer",fontFamily:"inherit",borderLeft:i===0?"none":`1px solid ${C.border}` }}>{p.label}</button>
        ))}
      </div>
      {/* Export */}
      <button onClick={()=>alert("Exporting dashboard as PDF…")}
        style={{ padding:"7px 14px",borderRadius:9,border:`1px solid ${C.border}`,background:"#fff",
          color:C.muted,fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",gap:6,fontFamily:"inherit" }}>
        ⬇ Export
      </button>
    </div>
  );
};

// ─── Mini Donut / Pie helper ──────────────────────────────────────────────────
