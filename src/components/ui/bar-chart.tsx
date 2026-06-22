import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { C } from "../../theme";

export const BarChart = ({ data, color, height=60 }) => {
  const max=Math.max(...data.map(d=>d.v),1), w=420, barW=Math.floor(w/data.length)-4;
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${height+24}`} style={{ overflow:"visible" }}>
      {data.map((d,i)=>{
        const bh=Math.max((d.v/max)*height,2), x=i*(w/data.length)+2;
        return (<g key={i}>
          <rect x={x} y={height-bh} width={barW} height={bh} rx={3} fill={color} opacity={0.85} />
          <text x={x+barW/2} y={height+16} textAnchor="middle" fontSize={9} fill={C.muted}>{d.l}</text>
          <text x={x+barW/2} y={height-bh-4} textAnchor="middle" fontSize={9} fontWeight="bold" fill={color}>{d.v}</text>
        </g>);
      })}
    </svg>
  );
};
