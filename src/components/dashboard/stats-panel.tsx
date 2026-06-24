import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { C } from "../../theme";

export const StatsPanel = ({ isVD }) => {
  const gpStats = [
    { label:"Contacts Assigned", value:62,    unit:"",   color:C.navy  },
    { label:"Contacted",      value:48,    unit:"",   color:C.blue  },
    { label:"Appointments",   value:9,     unit:"",   color:C.indigo},
    { label:"Closings MTD",   value:5,     unit:"",   color:C.green },
    { label:"Conversion",     value:"8.1", unit:"%",  color:C.green },
    { label:"AI Time Saved",  value:47,    unit:"min",color:C.ai    },
  ];
  const vdStats = [
    { label:"Team Contacts",     value:890,   unit:"",   color:C.navy  },
    { label:"Appointments",   value:54,    unit:"",   color:C.indigo},
    { label:"Closings MTD",   value:34,    unit:"",   color:C.green },
    { label:"Not Reached",    value:125,   unit:"",   color:C.red   },
    { label:"Conversion",     value:"7.1", unit:"%",  color:C.green },
    { label:"Opt-In Rate",    value:"76.4",unit:"%",  color:C.blue  },
  ];
  const stats = isVD ? vdStats : gpStats;
  return (
    <div style={{ display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:12,marginBottom:14 }}>
      {stats.map(s=>(
        <div key={s.label} style={{ background:"#fff",border:`1px solid ${C.border}`,borderRadius:12,padding:"16px 18px" }}>
          <div style={{ fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8 }}>{s.label}</div>
          <div style={{ fontSize:32,fontWeight:400,letterSpacing:"-0.03em",color:s.color }}>{s.value}<small style={{ fontSize:14,color:C.muted }}>{s.unit}</small></div>
        </div>
      ))}
    </div>
  );
};

// ─── SA Smart Assignment ─────────────────────────────────────────────────────
