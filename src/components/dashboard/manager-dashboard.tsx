import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { C } from "../../theme";
import { DateRangePicker } from "../ui/date-range-picker";

export const ManagerDashboard = ({ navigateTo }) => {
  const [period, setPeriod] = useState("week");
  const [vdChecks,setVdChecks] = useState([false,false,false,false,true]);

  const KPIS = [
    { label:"Team Contacts",    value:"890",  delta:"+34",  up:true,  sub:"active",          warn:false, good:false },
    { label:"Appointments",       value:"54",   delta:"+6",   up:true,  sub:"Month",          warn:false, good:false },
    { label:"Closings",    value:"34",   delta:"+4",   up:true,  sub:"MTD",            warn:false, good:true  },
    { label:"Not Reached",value:"125",  delta:"−18",  up:false, sub:"≥3 Attempts",    warn:true,  good:false },
    { label:"Opt-In Rate",   value:"76,4", delta:"+1,2pp",up:true, sub:"% GDPR",        warn:false, good:false },
    { label:"Conversion",    value:"7,1",  delta:"+0,3pp",up:true, sub:"% MTD",          warn:false, good:true  },
  ];

  const GPs = [
    { name:"Anna Klein",    leads:87, appts:12, close:7, conv:"8.0%", score:82, trend:"up",    color:C.green  },
    { name:"Ben Hartmann",  leads:74, appts:9,  close:5, conv:"6.7%", score:71, trend:"flat",  color:C.blue   },
    { name:"Marc Otto",     leads:68, appts:7,  close:3, conv:"4.4%", score:58, trend:"down",  color:C.red    },
    { name:"Kai Becker",    leads:92, appts:14, close:9, conv:"9.7%", score:91, trend:"up",    color:C.green  },
    { name:"Nina Schmitt",  leads:61, appts:6,  close:4, conv:"6.5%", score:63, trend:"down",  color:C.amber  },
  ];

  const PIPELINE = [
    { stage:"Open",          count:312, pct:35, color:C.muted  },
    { stage:"Contact Attempted",count:187,pct:21, color:C.amber  },
    { stage:"In Progress", count:156, pct:18, color:C.blue   },
    { stage:"Termin",         count:89,  pct:10, color:C.indigo },
    { stage:"Closing",      count:34,  pct:4,  color:C.green  },
    { stage:"Not Interested", count:112, pct:13, color:C.red    },
  ];

  const ALERTS = [
    { icon:"⚠️", text:"Marc Otto: 3 contacts without contact for 5 days",   sev:"warn"  },
    { icon:"🔴", text:"Nina Schmitt: Conversion below target (4.4% vs 7%)",sev:"crit"  },
    { icon:"💡", text:"80 Messe-FFM contacts can be assigned to Ralf Fischer", sev:"info" },
  ];

  const TEAM_PLAN = [
    { time:"09:00", gp:"Anna Klein",   task:"Sandra Richter — Call",      type:"call"  },
    { time:"10:30", gp:"Kai Becker",   task:"Review: 5 new Meta Contacts",    type:"review"},
    { time:"11:00", gp:"Ben Hartmann", task:"Video call P. Hoffmann",     type:"video" },
    { time:"14:00", gp:"Nina Schmitt", task:"Coaching session (VD)",        type:"coach" },
    { time:"15:00", gp:"Marc Otto",    task:"3 Nachfass-Calls",            type:"call"  },
  ];

  const taskColors = { call:C.green, review:C.blue, video:C.purple, coach:C.amber };

  const ACTIVITY_TEAM = [
    { icon:"🏆", text:"Kai Becker — Closing €4,800 · Q1 Finanz",     time:"20m"  },
    { icon:"📅", text:"Anna Klein — Appointment booked · Lars Dietrich",    time:"45m"  },
    { icon:"📞", text:"Ben Hartmann — Peter Hoffmann reached (2/5)",   time:"1h"   },
    { icon:"✉️", text:"Vion Nurture — Follow-up email sent · 12 Contacts", time:"2h"   },
    { icon:"⚠️", text:"Marc Otto — 4th attempt not reached · Weber",  time:"3h"   },
  ];

  return (
    <div style={{ padding:"0 28px 48px",fontFamily:"Inter,system-ui,sans-serif" }}>

      {/* Head */}
      <div style={{ padding:"28px 0 22px",display:"flex",alignItems:"flex-end",justifyContent:"space-between" }}>
        <div>
          <h1 style={{ fontSize:36,fontWeight:400,letterSpacing:"-0.025em",color:C.text,margin:0 }}>
            Hello, Thomas<span style={{ color:C.indigo }}>.</span>
          </h1>
        </div>
        <DateRangePicker period={period} onChange={(p)=>setPeriod(p)} />
      </div>

      {/* KPI Strip */}
      <div style={{ display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:12,marginBottom:22 }}>
        {KPIS.map(k=>(
          <div key={k.label} style={{ background:"#fff",border:`1px solid ${C.border}`,borderRadius:14,padding:"16px 18px" }}>
            <div style={{ fontSize:10,color:C.muted,fontWeight:600,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:10 }}>{k.label}</div>
            <div style={{ fontSize:38,fontWeight:400,letterSpacing:"-0.03em",lineHeight:1,
              color:k.warn?C.red:k.good?C.green:C.text }}>{k.value}</div>
            <div style={{ marginTop:8,display:"flex",alignItems:"center",gap:8 }}>
              <span style={{ fontSize:10,fontFamily:"monospace",padding:"2px 7px",borderRadius:20,fontWeight:500,
                background:k.up?C.green+"15":C.red+"15",color:k.up?C.green:C.red }}>{k.delta}</span>
              <span style={{ fontSize:11,color:C.muted }}>{k.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Alerts */}
      <div style={{ marginBottom:18,display:"flex",flexDirection:"column",gap:8 }}>
        {ALERTS.map((a,i)=>(
          <div key={i} style={{ display:"flex",alignItems:"center",gap:12,padding:"10px 16px",borderRadius:10,
            background:a.sev==="crit"?C.red+"06":a.sev==="warn"?C.amber+"08":C.blue+"06",
            border:`1px solid ${a.sev==="crit"?C.red+"30":a.sev==="warn"?C.amber+"30":C.blue+"25"}` }}>
            <span style={{ fontSize:16 }}>{a.icon}</span>
            <span style={{ fontSize:13,color:C.text,flex:1 }}>{a.text}</span>
            <button style={{ padding:"4px 10px",borderRadius:6,border:`1px solid ${C.border}`,background:"#fff",
              color:C.muted,fontSize:11,cursor:"pointer",fontFamily:"inherit" }}>Review</button>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div style={{ display:"grid",gridTemplateColumns:"1.5fr 1fr",gap:16,marginBottom:16 }}>

        {/* GP Performance table */}
        <div style={{ background:"#fff",border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden" }}>
          <div style={{ padding:"18px 22px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${C.border}` }}>
            <div style={{ fontSize:20,fontWeight:500,color:C.text }}>Advisor Performance <em style={{ color:C.indigo,fontWeight:400 }}>MTD</em></div>
            <button onClick={()=>navigateTo("Reports")} style={{ padding:"5px 12px",borderRadius:7,border:`1px solid ${C.border}`,background:"#fff",color:C.blue,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>Full Report →</button>
          </div>
          <div style={{ padding:"0 22px" }}>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 60px 60px 60px 70px 60px",
              padding:"8px 0",borderBottom:`1px solid ${C.border}`,gap:8 }}>
              {["Advisor","Leads","Appointments","Closing","Conv.","Score"].map(h=>(
                <div key={h} style={{ fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em",
                  textAlign:h==="Advisor"?"left":"center" }}>{h}</div>
              ))}
            </div>
            {GPs.map((gp,i)=>(
              <div key={i} style={{ display:"grid",gridTemplateColumns:"1fr 60px 60px 60px 70px 60px",
                padding:"11px 0",borderBottom:i<GPs.length-1?`1px solid ${C.border}`:"none",gap:8,alignItems:"center" }}>
                <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                  <div style={{ width:28,height:28,borderRadius:"50%",background:gp.color+"20",border:`1px solid ${gp.color}40`,
                    display:"grid",placeItems:"center",fontSize:10,fontWeight:600,color:gp.color,flexShrink:0 }}>
                    {gp.name.split(" ").map(w=>w[0]).join("")}
                  </div>
                  <div>
                    <div style={{ fontSize:13,fontWeight:500,color:C.text }}>{gp.name}</div>
                    <div style={{ fontSize:10,color:gp.trend==="up"?C.green:gp.trend==="down"?C.red:C.muted }}>
                      {gp.trend==="up"?"↑":gp.trend==="down"?"↓":"→"} {gp.conv}
                    </div>
                  </div>
                </div>
                {[gp.leads,gp.appts,gp.close,gp.conv].map((v,vi)=>(
                  <div key={vi} style={{ textAlign:"center",fontFamily:"monospace",fontSize:13,color:C.text }}>{v}</div>
                ))}
                <div style={{ textAlign:"center" }}>
                  <div style={{ fontSize:16,fontWeight:500,color:gp.score>=80?C.green:gp.score>=65?C.amber:C.red }}>{gp.score}</div>
                  <div style={{ height:3,background:"#F2F4F7",borderRadius:2,marginTop:3,overflow:"hidden" }}>
                    <div style={{ height:"100%",width:`${gp.score}%`,background:gp.score>=80?C.green:gp.score>=65?C.amber:C.red,borderRadius:2 }}/>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pipeline + Plan */}
        <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
          {/* Pipeline status */}
          <div style={{ background:"#fff",border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden" }}>
            <div style={{ padding:"16px 20px 12px",borderBottom:`1px solid ${C.border}` }}>
              <div style={{ fontSize:18,fontWeight:500,color:C.text }}>Pipeline <em style={{ color:C.indigo,fontWeight:400 }}>Status</em></div>
            </div>
            <div style={{ padding:"12px 18px 16px" }}>
              {PIPELINE.map((s,i)=>(
                <div key={i} style={{ marginBottom:10 }}>
                  <div style={{ display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4,color:C.text }}>
                    <span>{s.stage}</span>
                    <span style={{ fontFamily:"monospace",color:C.muted }}>{s.count}</span>
                  </div>
                  <div style={{ height:5,background:"#F2F4F7",borderRadius:3,overflow:"hidden" }}>
                    <div style={{ height:"100%",width:`${s.pct}%`,background:s.color,borderRadius:3 }}/>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Today's team plan */}
          <div style={{ background:"#fff",border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden" }}>
            <div style={{ padding:"16px 20px 12px",borderBottom:`1px solid ${C.border}` }}>
              <div style={{ fontSize:18,fontWeight:500,color:C.text }}>Today's <em style={{ color:C.indigo,fontWeight:400 }}>Team-Plan</em></div>
            </div>
            <div style={{ padding:"8px 18px 14px" }}>
              {TEAM_PLAN.map((item,i)=>(
                <div key={i} style={{ display:"flex",gap:10,alignItems:"center",padding:"8px 0",borderBottom:i<TEAM_PLAN.length-1?`1px solid ${C.border}`:"none" }}>
                  <div style={{ fontFamily:"monospace",fontSize:11,color:C.muted,width:40,flexShrink:0 }}>{item.time}</div>
                  <div style={{ width:6,height:6,borderRadius:"50%",background:taskColors[item.type],flexShrink:0 }}/>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ fontSize:12,fontWeight:500,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{item.task}</div>
                    <div style={{ fontSize:10,color:C.muted }}>{item.gp}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Team Activity */}
      <div style={{ background:"#fff",border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden" }}>
        <div style={{ padding:"16px 22px 12px",borderBottom:`1px solid ${C.border}` }}>
          <div style={{ fontSize:18,fontWeight:500,color:C.text }}>Team Activity</div>
        </div>
        <div style={{ padding:"12px 22px 16px",display:"flex",flexDirection:"column",gap:10 }}>
          {ACTIVITY_TEAM.map((a,i)=>(
            <div key={i} style={{ display:"flex",gap:12,alignItems:"center",padding:"8px 0",borderBottom:i<ACTIVITY_TEAM.length-1?`1px solid ${C.border}`:"none" }}>
              <span style={{ fontSize:18,flexShrink:0 }}>{a.icon}</span>
              <span style={{ fontSize:13,color:C.text,flex:1 }}>{a.text}</span>
              <span style={{ fontFamily:"monospace",fontSize:10,color:C.muted,flexShrink:0 }}>{a.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};



// ─── Dashboard Page (routes to role-specific dashboard) ───────────────────────
