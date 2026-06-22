import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { C } from "../../theme";

export const HBar = ({ value, max, color, label, sub }) => (
  <div style={{ marginBottom:11 }}>
    <div style={{ display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4 }}>
      <span style={{ fontWeight:600,color:C.text }}>{label}</span>
      <span style={{ color:C.muted }}>{sub}</span>
    </div>
    <div style={{ height:6,background:C.border,borderRadius:4,overflow:"hidden" }}>
      <div style={{ height:"100%",width:`${Math.round((value/(max||1))*100)}%`,background:color,borderRadius:4 }} />
    </div>
  </div>
);
