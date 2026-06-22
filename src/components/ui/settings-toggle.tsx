import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { C } from "../../theme";

export const SettingsToggle = ({label,sub,defaultOn=false}) => {
  const [on,setOn]=useState(defaultOn);
  return (
    <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0",borderBottom:`1px solid ${C.border}` }}>
      <div><div style={{ fontSize:13,fontWeight:600,color:C.text }}>{label}</div>{sub&&<div style={{ fontSize:11,color:C.muted,marginTop:1 }}>{sub}</div>}</div>
      <div onClick={()=>setOn(o=>!o)} style={{ width:42,height:24,borderRadius:12,background:on?C.green:C.border,cursor:"pointer",position:"relative",transition:"background 0.2s",flexShrink:0 }}>
        <div style={{ position:"absolute",top:3,left:on?20:3,width:18,height:18,borderRadius:"50%",background:"#fff",transition:"left 0.2s",boxShadow:"0 1px 3px rgba(0,0,0,0.2)" }}/>
      </div>
    </div>
  );
};

// ─── Automations Section (Settings → Automations, SA only) ───────────────────
