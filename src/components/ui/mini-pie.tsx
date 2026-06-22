import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";

export const MiniPie = ({ data, size=80 }) => {
  const total = data.reduce((s,d)=>s+d.value,0);
  const r = (size/2) - 10;
  const circ = 2 * Math.PI * r;
  let offset = circ / 4; // start top
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {data.map((d,i)=>{
        const dash = (d.value/total) * circ;
        const el = (
          <circle key={i} cx={size/2} cy={size/2} r={r} fill="none"
            stroke={d.color} strokeWidth={10} strokeLinecap="butt"
            strokeDasharray={`${dash} ${circ-dash}`}
            strokeDashoffset={-offset+circ/4}/>
        );
        offset += dash;
        return el;
      })}
      <circle cx={size/2} cy={size/2} r={r-7} fill="#fff"/>
    </svg>
  );
};

// ─── AI Agents Panel with ON/OFF toggles ─────────────────────────────────────
