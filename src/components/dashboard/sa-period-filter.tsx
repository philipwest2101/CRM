import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { C } from "../../theme";
import { DateRangePicker } from "../ui/date-range-picker";

export const SAPeriodFilter = () => {
  const [period, setPeriod] = useState("week");
  return (
    <div style={{ display:"flex",alignItems:"center",gap:8,flexWrap:"wrap" }}>
      {/* Date range picker */}
      <DateRangePicker period={period} onChange={(p)=>setPeriod(p)} />
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
