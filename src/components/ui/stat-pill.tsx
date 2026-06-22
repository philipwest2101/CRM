import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { C } from "../../theme";

export const StatPill = ({label,value,color}) => (
  <div style={{ textAlign:"center",padding:"10px 14px",borderRadius:8,background:color+"0D",border:`1px solid ${color}20` }}>
    <div style={{ fontSize:18,fontWeight:800,color }}>{value!=null?value+"%":"—"}</div>
    <div style={{ fontSize:10,color:C.muted,fontWeight:600,marginTop:2,textTransform:"uppercase",letterSpacing:"0.04em" }}>{label}</div>
  </div>
  );

// ─── Education Page ───────────────────────────────────────────────────────────
// ─── Events Data ──────────────────────────────────────────────────────────────
