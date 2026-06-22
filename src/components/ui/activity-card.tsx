import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { C } from "../../theme";

export const ActivityCard = ({ icon, color, bg, title, actor, time, detail, status, provider, defaultOpen=false }) => {
  const [open, setOpen] = useState(defaultOpen);
  const completed = ["completed","done","logged"].includes(status);
  return (
    <div style={{ borderRadius:10,border:`1px solid ${C.border}`,background:"#fff",
      boxShadow:"0 1px 2px #1018280D",marginBottom:10,overflow:"hidden",
      borderLeft:`3px solid ${completed?C.green:color}` }}>
      {/* Collapsed header (~64px) */}
      <div onClick={()=>setOpen(o=>!o)}
        style={{ display:"flex",alignItems:"center",gap:12,padding:"0 16px",height:64,cursor:"pointer" }}>
        <div style={{ width:32,height:32,borderRadius:8,background:bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0 }}>{icon}</div>
        <div style={{ flex:1,minWidth:0 }}>
          <div style={{ fontSize:13,fontWeight:700,color:C.navy,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{title}</div>
          <div style={{ fontSize:11,color:C.muted,marginTop:2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>
            {actor && <strong style={{ color:C.slate,fontWeight:600 }}>{actor}</strong>}{actor?" · ":""}{time}
          </div>
        </div>
        {provider && <span style={{ fontSize:9,fontWeight:700,padding:"2px 8px",borderRadius:8,background:C.light,color:C.slate,border:`1px solid ${C.border}`,flexShrink:0 }}>{provider}</span>}
        {completed && <span style={{ fontSize:9,fontWeight:800,padding:"2px 8px",borderRadius:8,background:C.green+"15",color:C.green,textTransform:"uppercase",flexShrink:0 }}>✓ Done</span>}
        <span style={{ fontSize:11,color:C.muted,flexShrink:0,transform:open?"rotate(90deg)":"none",transition:"transform 0.15s" }}>▸</span>
      </div>
      {/* Open body */}
      {open && detail && (
        <div style={{ padding:"12px 16px 14px 60px",borderTop:`1px solid ${C.border}`,fontSize:12,color:C.slate,lineHeight:1.55,background:C.light }}>
          {detail}
        </div>
      )}
    </div>
  );
};

