import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Card } from "./card";
import { SectionTitle } from "./section-title";
import { C } from "../../theme";

export const ActivityFeed = ({ items, title="Recent Activity" }) => (
  <Card style={{ padding:"18px 20px",height:"fit-content" }}>
    <SectionTitle>{title}</SectionTitle>
    {items.map((a,i)=>(
      <div key={i} style={{ display:"flex",gap:10,padding:"9px 0",borderBottom:i<items.length-1?`1px solid ${C.border}`:"none",alignItems:"flex-start" }}>
        <div style={{ width:30,height:30,borderRadius:8,background:a.color+"15",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,flexShrink:0,marginTop:1 }}>{a.icon}</div>
        <div style={{ flex:1,minWidth:0 }}>
          <div style={{ fontSize:12,fontWeight:600,color:C.text,marginBottom:1 }}>{a.title}</div>
          <div style={{ fontSize:10,color:C.muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{a.sub}</div>
        </div>
        <span style={{ fontSize:9,color:C.muted,whiteSpace:"nowrap",flexShrink:0,paddingTop:2 }}>{a.time}</span>
      </div>
    ))}
  </Card>
);

// ─── Goals Widget ──────────────────────────────────────────────────────────────
