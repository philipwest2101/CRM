import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { C } from "../../theme";

export const PeriodSelector = ({ period, setPeriod, activeColor }) => (
  <div style={{ display:"flex",background:"#F1F5F9",borderRadius:8,padding:3,gap:2 }}>
    {[["month","This Month"],["q","This Quarter"],["all","All Time"]].map(([k,l])=>(
      <button key={k} onClick={()=>setPeriod(k)} style={{ padding:"5px 12px",borderRadius:6,border:"none",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit",background:period===k?"#fff":"transparent",color:period===k?(activeColor||C.navy):C.muted,boxShadow:period===k?"0 1px 3px rgba(0,0,0,0.1)":"none" }}>{l}</button>
    ))}
  </div>
);

// ─── P0 AI: Score Badge (live) ────────────────────────────────────────────────
