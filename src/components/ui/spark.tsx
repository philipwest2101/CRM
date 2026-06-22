import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";

export const Spark = ({ data, color }) => {
  const max=Math.max(...data), min=Math.min(...data), w=80, h=32;
  const pts=data.map((v,i)=>`${(i/(data.length-1))*w},${h-((v-min)/(max-min||1))*(h-4)-2}`).join(" ");
  return (
    <svg width={w} height={h} style={{ overflow:"visible" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      <polyline points={`0,${h} ${pts} ${w},${h}`} fill={color+"20"} stroke="none" />
    </svg>
  );
};
