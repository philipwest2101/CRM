import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { C } from "../../theme";

export const ModePill = ({ mode, onChange }) => (
  <div style={{ display:"inline-flex",background:"#F1F5F9",borderRadius:10,padding:3,gap:2 }}>
    {[{key:"personal",label:"👤 My Leads",color:C.indigo},{key:"team",label:"👥 My Team",color:C.navy}].map(m=>(
      <button key={m.key} onClick={()=>onChange(m.key)} style={{ padding:"6px 14px",borderRadius:8,border:"none",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",background:mode===m.key?"#fff":"transparent",color:mode===m.key?m.color:C.muted,boxShadow:mode===m.key?"0 1px 4px rgba(0,0,0,0.1)":"none" }}>{m.label}</button>
    ))}
  </div>
);
