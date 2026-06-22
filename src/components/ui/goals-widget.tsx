import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Card } from "./card";
import { C } from "../../theme";

export const GoalsWidget = ({ goals, title="Monthly Goals" }) => {
  const totalPct = Math.round(goals.reduce((a,g)=>a+(g.current/g.target*100),0)/goals.length);
  const gaugeColor = totalPct>=80?C.green:totalPct>=50?C.amber:C.red;
  return (
    <Card style={{ padding:"18px 20px" }}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14 }}>
        <div style={{ fontSize:13,fontWeight:700,color:C.text }}>{title}</div>
        <span style={{ fontSize:16,fontWeight:800,color:gaugeColor }}>{totalPct}%</span>
      </div>
      <div style={{ display:"flex",justifyContent:"center",marginBottom:14 }}>
        <svg width={120} height={68} viewBox="0 0 120 68">
          <path d="M 10 60 A 50 50 0 0 1 110 60" fill="none" stroke="#E2E8F0" strokeWidth={10} strokeLinecap="round"/>
          <path d="M 10 60 A 50 50 0 0 1 110 60" fill="none" stroke={gaugeColor} strokeWidth={10} strokeLinecap="round"
            strokeDasharray={`${(totalPct/100)*157} 157`}/>
          <text x={60} y={63} textAnchor="middle" fontSize={13} fontWeight="bold" fill={C.navy}>{totalPct}%</text>
        </svg>
      </div>
      {goals.map((g,i)=>{
        const pct=Math.min(100,Math.round(g.current/g.target*100));
        return (
          <div key={i} style={{ marginBottom:10 }}>
            <div style={{ display:"flex",justifyContent:"space-between",marginBottom:3 }}>
              <span style={{ fontSize:11,color:C.slate }}>{g.label}</span>
              <span style={{ fontSize:11,fontWeight:700,color:g.color }}>{g.current}/{g.target}</span>
            </div>
            <div style={{ height:5,borderRadius:3,background:"#F1F5F9",overflow:"hidden" }}>
              <div style={{ height:"100%",width:`${pct}%`,background:g.color,borderRadius:3 }}/>
            </div>
          </div>
        );
      })}
      <div style={{ marginTop:10,display:"flex",gap:12,justifyContent:"center",fontSize:10,color:C.muted }}>
        <span style={{ color:C.green,fontWeight:700 }}>✓ Reached {goals.filter(g=>g.current>=g.target).length}/{goals.length}</span>
        <span>In Progress {goals.filter(g=>g.current>0&&g.current<g.target).length}/{goals.length}</span>
        <span>Not Started {goals.filter(g=>g.current===0).length}/{goals.length}</span>
      </div>
    </Card>
  );
};

// ─── Dashboard Page ────────────────────────────────────────────────────────────
