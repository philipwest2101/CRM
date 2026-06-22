import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { C } from "../../theme";

export const SAPeriodFilter = () => {
  const [period,    setPeriod]    = useState("mtd");
  const [dateFrom,  setDateFrom]  = useState("2026-02-01");
  const [dateTo,    setDateTo]    = useState("2026-02-24");
  const [showRange, setShowRange] = useState(false);
  const PERIODS = [
    { id:"today",    label:"Today"    },
    { id:"week",     label:"Week"     },
    { id:"mtd",      label:"MTD"      },
    { id:"quarter",  label:"Quarter"  },
    { id:"ytd",      label:"YTD"      },
    { id:"custom",   label:"Custom"   },
  ];
  return (
    <div style={{ display:"flex",alignItems:"center",gap:8,flexWrap:"wrap" }}>
      {/* Period pills */}
      <div style={{ display:"flex",border:`1px solid ${C.border}`,borderRadius:9,overflow:"hidden" }}>
        {PERIODS.map(p=>(
          <button key={p.id} onClick={()=>{ setPeriod(p.id); if(p.id==="custom") setShowRange(true); else setShowRange(false); }}
            style={{ padding:"7px 14px",border:"none",background:period===p.id?C.primary:"#fff",
              color:period===p.id?"#fff":C.muted,fontSize:12,fontWeight:period===p.id?700:400,
              cursor:"pointer",fontFamily:"inherit",borderRight:`1px solid ${C.border}` }}>{p.label}</button>
        ))}
      </div>
      {/* Date range — shown when Custom selected */}
      {showRange && (
        <div style={{ display:"flex",alignItems:"center",gap:6,padding:"4px 12px",borderRadius:9,
          border:`1.5px solid ${C.primary}`,background:"#F8FAFC" }}>
          <span style={{ fontSize:11,color:C.muted }}>From</span>
          <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)}
            style={{ border:"none",background:"transparent",fontSize:12,fontFamily:"inherit",color:C.text,outline:"none" }}/>
          <span style={{ fontSize:11,color:C.muted }}>to</span>
          <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)}
            style={{ border:"none",background:"transparent",fontSize:12,fontFamily:"inherit",color:C.text,outline:"none" }}/>
          <button onClick={()=>alert(`Filtering: ${dateFrom} → ${dateTo}`)}
            style={{ padding:"3px 10px",borderRadius:6,border:"none",background:C.primary,color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer" }}>Apply</button>
        </div>
      )}
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
