import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { ReportDetail } from "../reports/report-detail";
import { C } from "../../theme";

export const AnalyticsTab = ({ role }) => {
  const [activeReport, setActiveReport] = useState(null);
  const isVD = role==="vd";
  const REPORTS = [
    { key:"vd_performance", icon:"👥", title:isVD?"Team Performance":"VD Performance Report",   desc:"Director comparison: leads, appointments, closings and conversion rates.",     color:C.navy   },
    { key:"campaign_roi",   icon:"📣", title:"Campaign & Source ROI",    desc:"Lead volume, cost-per-lead, and conversion by campaign and source channel.",    color:C.indigo },
    { key:"appointments",   icon:"📅", title:"Appointment Analytics",    desc:"Booking rate, show rate, cancellation rate by VD, GP, and campaign.",          color:C.blue   },
    { key:"closing",        icon:"✅", title:"Closing & Revenue Report", desc:"Closed deals, deal value, cycle length, and revenue attribution.",              color:C.green  },
    { key:"gdpr",           icon:"🔒", title:"GDPR Compliance",          desc:"Consent rates, opt-out trends, retargeting eligibility and retention.",        color:C.purple },
    { key:"email",          icon:"✉️", title:"Email Automation Stats",   desc:"Open rates, click rates, and conversion by automated journey.",                color:C.amber  },
  ];
  const quickMetrics = isVD
    ? [{label:"Team Leads",value:"890",color:C.navy},{label:"Appointments",value:"54",color:C.indigo},{label:"Closed",value:"34",color:C.green},{label:"Not Reached",value:"125",color:C.red},{label:"Opt-in Rate",value:"76.4%",color:C.purple},{label:"Conv. Rate",value:"7.1%",color:C.amber}]
    : [{label:"Total Leads",value:"2.904",color:C.navy},{label:"Appointments",value:"134",color:C.indigo},{label:"Closed",value:"89",color:C.green},{label:"Not Reached",value:"203",color:C.red},{label:"Opt-in Rate",value:"79.8%",color:C.purple},{label:"Conv. Rate",value:"6.2%",color:C.amber}];
  if(activeReport) return <ReportDetail report={activeReport} role={role} onBack={()=>setActiveReport(null)} />;
  return (
    <div style={{ padding:"24px 0" }}>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:12,marginBottom:20 }}>
        {quickMetrics.map(k=>(
          <div key={k.label} style={{ padding:"14px",borderRadius:10,background:k.color+"08",border:`1px solid ${k.color}20`,textAlign:"center" }}>
            <div style={{ fontSize:10,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:6 }}>{k.label}</div>
            <div style={{ fontSize:20,fontWeight:800,color:k.color }}>{k.value}</div>
          </div>
        ))}
      </div>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14 }}>
        {REPORTS.map(s=>(
          <div key={s.key} style={{ padding:"20px",borderRadius:12,background:"#fff",border:`1px solid ${C.border}`,cursor:"pointer" }}
            onMouseEnter={e=>e.currentTarget.style.boxShadow="0 4px 20px rgba(0,0,0,0.08)"}
            onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}>
            <div style={{ width:38,height:38,borderRadius:10,background:s.color+"15",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,marginBottom:12 }}>{s.icon}</div>
            <div style={{ fontSize:14,fontWeight:700,color:C.text,marginBottom:5 }}>{s.title}</div>
            <div style={{ fontSize:12,color:C.muted,lineHeight:1.5,marginBottom:14 }}>{s.desc}</div>
            <button onClick={()=>setActiveReport(s)} style={{ padding:"6px 12px",borderRadius:7,border:"none",background:s.color,color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer" }}>View Report →</button>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Dashboard Data ────────────────────────────────────────────────────────────
