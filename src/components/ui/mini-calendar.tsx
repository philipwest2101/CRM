import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Card } from "./card";
import { C } from "../../theme";

export const MiniCalendar = ({ highlightDays=[] }) => {
  const dayLabels = ["M","T","W","T","F","S","S"];
  const startOffset = 6; // Feb 1 2026 = Sunday → 6th slot in Mon-first grid
  const daysInMonth = 28;
  const cells = [];
  for (let i=0;i<startOffset;i++) cells.push(null);
  for (let d=1;d<=daysInMonth;d++) cells.push(d);
  return (
    <div>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10 }}>
        <span style={{ fontSize:12,color:C.muted,cursor:"pointer",fontWeight:700 }}>◀</span>
        <span style={{ fontSize:12,fontWeight:700,color:C.text }}>February 2026</span>
        <span style={{ fontSize:12,color:C.muted,cursor:"pointer",fontWeight:700 }}>▶</span>
      </div>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:1,marginBottom:4 }}>
        {dayLabels.map((d,i)=><div key={i} style={{ textAlign:"center",fontSize:9,fontWeight:700,color:C.muted,padding:"2px 0" }}>{d}</div>)}
      </div>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:1 }}>
        {cells.map((d,i)=>(
          <div key={i} style={{ textAlign:"center",fontSize:10,padding:"4px 2px",borderRadius:5,
            background:d===22?C.amber:highlightDays.includes(d)?C.indigo+"25":"transparent",
            color:d===22?"#fff":highlightDays.includes(d)?C.indigo:d?C.text:"transparent",
            fontWeight:d===22||highlightDays.includes(d)?700:400,cursor:d?"pointer":"default" }}>{d||""}</div>
        ))}
      </div>
    </div>
  );
};

// ─── Activity Feed ─────────────────────────────────────────────────────────────
// ─── DS Activity Card — lifecycle: collapsed (64px) → open → completed ───────
// The design system's flagship "card-centric activity model" (LH-Vion Design
// System §3.1): every activity type (call/email/meeting/task/note/logged) shares
// one card with a collapsed→open disclosure and a completed state.
