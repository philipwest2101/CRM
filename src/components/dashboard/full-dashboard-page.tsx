import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { AIAgentsPanel } from "../ai/ai-agents-panel";
import { GPDashboard } from "./gp-dashboard";
import { ManagerDashboard } from "./manager-dashboard";
import { SAPeriodFilter } from "./sa-period-filter";
import { SASmartAssignment } from "./sa-smart-assignment";
import { Avatar } from "../ui/avatar";
import { MiniPie } from "../ui/mini-pie";
import { SA_EVENTS_DATA, SA_GOALS_DATA, SA_SOURCE_DATA, SA_VD_STATS, VD_GP_PERF, VD_PIPELINE, VD_SCHEDULE_FULL, VD_TODO } from "../../lib/core";
import { C } from "../../theme";

export const FullDashboardPage = ({ role, navigateTo }) => {
  const [gpChecks, setGpChecks] = useState([false,false,false,true,true]);
  const MGR_COLOR = "#0891B2";

  // ── MGR KPIs & data ─────────────────────────────────────────────────────────
  const MGR_KPIS = [
    { label:"Total Contacts", value:947, delta:"+42", up:true, color:C.navy  },
    { label:"Appointments",value:61,  delta:"+8",  up:true, color:C.indigo},
    { label:"Closings",    value:38,  delta:"+5",  up:true, color:C.green },
    { label:"Conversion",  value:"8.2%",delta:"+0.4pp",up:true,color:C.green},
  ];
  const MONTHLY_DATA = [
    {m:"Aug",leads:62, closed:3},{m:"Sep",leads:78,closed:5},{m:"Oct",leads:91,closed:6},
    {m:"Nov",leads:88,closed:9},{m:"Dec",leads:104,closed:8},{m:"Jan",leads:118,closed:11},{m:"Feb",leads:134,closed:14},
  ];
  const maxL = Math.max(...MONTHLY_DATA.map(m=>m.leads));

  const VD_TODO = [
    {label:"Review Marc Otto's 3 stale contacts", time:"Overdue", done:false},
    {label:"Approve Nina Schmitt's call plan",  time:"09:00",  done:false},
    {label:"Team call — 10:00",                 time:"10:00",  done:true },
    {label:"Update Q1 quota targets",           time:"Today",  done:false},
    {label:"GDPR SAR review #2026-04",          time:"Overdue",done:false},
  ];
  const [vdChecks, setVdChecks] = useState(VD_TODO.map(t=>t.done));

  const VD_GP_PERF = [
    {name:"Anna Klein",   leads:87, reached:72, appts:12, closed:7,  rate:"8.0%",adherence:82},
    {name:"Ben Hartmann", leads:74, reached:58, appts:9,  closed:5,  rate:"6.7%",adherence:71},
    {name:"Marc Otto",    leads:68, reached:41, appts:7,  closed:3,  rate:"4.4%",adherence:43},
    {name:"Kai Becker",   leads:92, reached:81, appts:14, closed:9,  rate:"9.7%",adherence:91},
    {name:"Nina Schmitt", leads:61, reached:44, appts:6,  closed:4,  rate:"6.5%",adherence:58},
  ];
  const VD_PIPELINE = [
    {label:"Open",      value:312,color:C.muted },{label:"Contacted",value:187,color:C.amber},
    {label:"Working",   value:156,color:C.blue  },{label:"Appointment",value:89,color:C.indigo},
    {label:"Closed",    value:34, color:C.green },{label:"Lost",      value:112,color:C.red  },
  ];
  const VD_SCHEDULE_FULL = [
    {time:"09:00",name:"Anna Klein",    task:"Sandra Richter – call", status:"upcoming"},
    {time:"10:00",name:"Team",          task:"Weekly team sync",      status:"upcoming"},
    {time:"11:00",name:"Ben Hartmann",  task:"Video – P. Hoffmann",   status:"upcoming"},
    {time:"14:00",name:"Nina Schmitt",  task:"Coaching session",      status:"done"    },
    {time:"15:30",name:"Marc Otto",     task:"Follow-up calls ×3",    status:"upcoming"},
  ];
  const SA_GOALS_DATA = [
    {label:"Monthly Quota",val:68,color:C.indigo},
    {label:"Conversion %", val:79,color:C.green },
    {label:"Appointment",  val:67,color:C.purple},
    {label:"Opt-In",       val:93,color:C.blue  },
  ];
  const SA_VD_STATS = [
    {name:"Thomas Müller",gps:5,appts:58,closed:31,rate:"7.5%"},
    {name:"Marc Fischer", gps:4,appts:42,closed:28,rate:"8.4%"},
    {name:"Jana Kruse",   gps:3,appts:22,closed:12,rate:"6.1%"},
    {name:"Ralf Fischer", gps:4,appts:34,closed:18,rate:"6.2%"},
  ];
  const SA_SOURCE_DATA = [
    {label:"Landing Pages",value:1203,color:C.indigo},
    {label:"Meta Ads",     value:748, color:C.blue  },
    {label:"Events",       value:412, color:C.amber },
    {label:"CSV Upload",   value:289, color:C.muted },
    {label:"Partner Ref.", value:252, color:C.green },
  ];
  const SA_EVENTS_DATA = [
    {name:"Q1 Investor Briefing",  jan:180,feb:248,capacity:300},
    {name:"Webinar March — Gold",   jan:0,  feb:186,capacity:250},
    {name:"FFP Roadshow Frankfurt",jan:120,feb:94, capacity:150},
    {name:"Advisortraining DACH",  jan:0,  feb:67, capacity:100},
  ];

  return (
    <div style={{ flex:1,overflowY:"auto" }}>
      {/* GP Dashboard */}
      {role==="gp" && <GPDashboard navigateTo={navigateTo} gpChecks={gpChecks} setGpChecks={setGpChecks}/>}

      {/* VD / Sales Director Dashboard */}
      {role==="vd" && <ManagerDashboard navigateTo={navigateTo}/>}

      {/* Super Admin Dashboard */}
      {role==="superadmin" && (()=>{
        const SA_KPIS_NEW = [
          { label:"Total Contacts",   value:"2.904", delta:"+127",   up:true,  sub:"active",          warn:false, good:false },
          { label:"Unassigned",   value:"47",    delta:"−12",    up:false, sub:"Pending assignment",warn:true,  good:false },
          { label:"Appointments",        value:"134",   delta:"+23",    up:true,  sub:"Month",          warn:false, good:false },
          { label:"Closings",     value:"81",    delta:"+11",    up:true,  sub:"MTD",            warn:false, good:true  },
          { label:"Opt-In Rate",    value:"79,8",  delta:"+2,4pp", up:true,  sub:"% GDPR",        warn:false, good:false },
          { label:"Conversion",     value:"6,2",   delta:"+0,4pp", up:true,  sub:"% Org MTD",      warn:false, good:true  },
        ];
        const VDS_SA = [
          { name:"Thomas Müller",  gps:5, leads:412, appts:58, closed:31, rate:"7.5%", score:88 },
          { name:"Marc Fischer",   gps:4, leads:334, appts:42, closed:28, rate:"8.4%", score:91 },
          { name:"Jana Kruse",     gps:3, leads:198, appts:22, closed:12, rate:"6.1%", score:72 },
          { name:"Ralf Fischer",   gps:4, leads:289, appts:34, closed:18, rate:"6.2%", score:69 },
        ];
        const SOURCES_SA = [
          { label:"Landing Pages",  value:1203, pct:41, color:C.indigo, conv:"7.2%" },
          { label:"Meta Ads",       value:748,  pct:26, color:C.blue,   conv:"5.8%" },
          { label:"Events",         value:412,  pct:14, color:C.amber,  conv:"9.1%" },
          { label:"CSV / Upload",   value:289,  pct:10, color:C.muted,  conv:"3.4%" },
          { label:"Partner Ref.",   value:252,  pct:9,  color:C.green,  conv:"11.2%"},
        ];
        const AI_AGENTS_SA = [
          { name:"Vion Scorer",     requests:1842, success:"99.2%", saved:"4.2h", color:C.green  },
          { name:"Vion Coach",      requests:386,  success:"98.7%", saved:"1.8h", color:C.green  },
          { name:"Vion Nurture",    requests:612,  success:"97.1%", saved:"2.9h", color:C.green  },
          { name:"Vion Voice",      requests:94,   success:"95.3%", saved:"0.7h", color:C.amber  },
          { name:"Vion Compliance", requests:127,  success:"100%",  saved:"1.1h", color:C.green  },
        ];
        const ORG_QUOTA_SA = [
          { label:"Appointments",       val:134, target:200, pct:67, color:C.purple },
          { label:"Closings",    val:81,  target:120, pct:68, color:C.amber  },
          { label:"New Contacts", val:412, target:600, pct:69, color:C.green  },
          { label:"Opt-In Rate",   val:79,  target:85,  pct:93, color:C.blue   },
        ];

        return (
          <div style={{ padding:"0 28px 48px",fontFamily:"Inter,system-ui,sans-serif" }}>
            {/* Head + Period Filter */}
            <div style={{ padding:"28px 0 16px",display:"flex",alignItems:"flex-end",justifyContent:"space-between",gap:16 }}>
              <div>
                <h1 style={{ fontSize:36,fontWeight:400,letterSpacing:"-0.025em",color:C.text,margin:0 }}>
                  Org Overview<span style={{ color:C.navy }}>.</span>
                </h1>
                <div style={{ marginTop:8,fontSize:11,color:C.muted,letterSpacing:"0.1em",textTransform:"uppercase" }}>
                  Super Admin · Organisation-wide · Q1 Quarter 2026
                </div>
              </div>
              <SAPeriodFilter/>
            </div>

            {/* KPI Strip */}
            <div style={{ display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:12,marginBottom:22 }}>
              {SA_KPIS_NEW.map(k=>(
                <div key={k.label} style={{ background:"#fff",border:`1px solid ${k.warn?C.red+"40":C.border}`,borderRadius:14,padding:"16px 18px" }}>
                  <div style={{ fontSize:10,color:C.muted,fontWeight:600,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:10 }}>{k.label}</div>
                  <div style={{ fontSize:36,fontWeight:400,letterSpacing:"-0.03em",lineHeight:1,color:k.warn?C.red:k.good?C.green:C.text }}>{k.value}</div>
                  <div style={{ marginTop:8,display:"flex",gap:8 }}>
                    <span style={{ fontSize:10,fontFamily:"monospace",padding:"2px 7px",borderRadius:20,fontWeight:500,
                      background:k.up?C.green+"15":C.red+"15",color:k.up?C.green:C.red }}>{k.delta}</span>
                    <span style={{ fontSize:11,color:C.muted }}>{k.sub}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Row 1 */}
            <div style={{ display:"grid",gridTemplateColumns:"2fr 1.2fr 1.2fr",gap:14,marginBottom:16 }}>
              <SASmartAssignment/>
              <div style={{ background:"#fff",border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden" }}>
                <div style={{ padding:"16px 20px 12px",borderBottom:`1px solid ${C.border}` }}>
                  <div style={{ fontSize:18,fontWeight:500,color:C.text }}>Org Quota <em style={{ color:C.indigo,fontWeight:400 }}>MTD</em></div>
                </div>
                <div style={{ padding:"14px 18px 18px" }}>
                  {ORG_QUOTA_SA.map(q=>(
                    <div key={q.label} style={{ marginBottom:14 }}>
                      <div style={{ display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:5 }}>
                        <span style={{ color:C.text }}>{q.label}</span>
                        <span style={{ fontFamily:"monospace",color:C.muted }}>{q.val} / {q.target}</span>
                      </div>
                      <div style={{ height:6,background:"#F2F4F7",borderRadius:3,overflow:"hidden" }}>
                        <div style={{ height:"100%",width:`${q.pct}%`,background:q.color,borderRadius:3 }}/>
                      </div>
                      <div style={{ fontSize:10,color:q.color,fontWeight:600,marginTop:3 }}>{q.pct}%</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ background:"#fff",border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden" }}>
                <div style={{ padding:"16px 20px 12px",borderBottom:`1px solid ${C.border}` }}>
                  <div style={{ fontSize:18,fontWeight:500,color:C.text }}>Sources <em style={{ color:C.indigo,fontWeight:400 }}>+ Conv.</em></div>
                </div>
                <div style={{ padding:"12px 18px 16px" }}>
                  <div style={{ display:"flex",alignItems:"center",gap:16,marginBottom:12 }}>
                    <MiniPie data={SOURCES_SA.map(s=>({value:s.pct,color:s.color}))} size={72}/>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:10,color:C.muted,marginBottom:4 }}>2,904 total leads this month</div>
                      <div style={{ display:"flex",flexWrap:"wrap",gap:"2px 10px" }}>
                        {SOURCES_SA.map(s=>(
                          <div key={s.label} style={{ display:"flex",alignItems:"center",gap:4,fontSize:10,color:C.muted }}>
                            <div style={{ width:7,height:7,borderRadius:2,background:s.color }}/>
                            {s.label} {s.pct}%
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  {SOURCES_SA.map((s,i)=>(
                    <div key={i} style={{ display:"flex",alignItems:"center",gap:10,padding:"7px 0",borderBottom:i<SOURCES_SA.length-1?`1px solid ${C.border}`:"none" }}>
                      <div style={{ width:8,height:8,borderRadius:2,background:s.color,flexShrink:0 }}/>
                      <div style={{ flex:1,fontSize:12,color:C.text }}>{s.label}</div>
                      <div style={{ fontFamily:"monospace",fontSize:11,color:C.muted,width:32,textAlign:"right" }}>{s.pct}%</div>
                      <div style={{ fontFamily:"monospace",fontSize:11,fontWeight:600,color:parseFloat(s.conv)>=8?C.green:parseFloat(s.conv)>=5?C.amber:C.red,width:40,textAlign:"right" }}>{s.conv}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Row 2: Directors + AI Agents */}
            <div style={{ display:"grid",gridTemplateColumns:"1.5fr 1fr",gap:14,marginBottom:16 }}>
              <div style={{ background:"#fff",border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden" }}>
                <div style={{ padding:"16px 22px 12px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:`1px solid ${C.border}` }}>
                  <div style={{ fontSize:18,fontWeight:500,color:C.text }}>Directoren <em style={{ color:C.indigo,fontWeight:400 }}>MTD</em></div>
                  <button onClick={()=>navigateTo("Reports")} style={{ padding:"5px 12px",borderRadius:7,border:`1px solid ${C.border}`,background:"#fff",color:C.blue,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>Full Report →</button>
                </div>
                <div style={{ padding:"0 22px" }}>
                  <div style={{ display:"grid",gridTemplateColumns:"1fr 50px 60px 60px 70px 60px",padding:"8px 0",borderBottom:`1px solid ${C.border}`,gap:8 }}>
                    {["Director","GPs","Appointments","Closings","Conv.","Score"].map(h=>(
                      <div key={h} style={{ fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em",textAlign:h==="Director"?"left":"center" }}>{h}</div>
                    ))}
                  </div>
                  {VDS_SA.map((vd,i)=>(
                    <div key={i} style={{ display:"grid",gridTemplateColumns:"1fr 50px 60px 60px 70px 60px",padding:"11px 0",borderBottom:i<VDS_SA.length-1?`1px solid ${C.border}`:"none",gap:8,alignItems:"center" }}>
                      <div style={{ display:"flex",alignItems:"center",gap:9 }}>
                        <Avatar name={vd.name} size={28}/>
                        <div><div style={{ fontSize:13,fontWeight:500,color:C.text }}>{vd.name.split(" ")[0]}</div><div style={{ fontSize:10,color:C.muted }}>{vd.gps} GPs</div></div>
                      </div>
                      {[vd.appts,vd.closed].map((v,vi)=>(<div key={vi} style={{ textAlign:"center",fontFamily:"monospace",fontSize:13,color:C.text }}>{v}</div>))}
                      <div style={{ textAlign:"center",fontFamily:"monospace",fontSize:12,color:C.text }}>{vd.leads}</div>
                      <div style={{ textAlign:"center",fontFamily:"monospace",fontSize:13,fontWeight:700,color:parseFloat(vd.rate)>=8?C.green:parseFloat(vd.rate)>=6?C.amber:C.red }}>{vd.rate}</div>
                      <div style={{ textAlign:"center" }}>
                        <div style={{ fontSize:15,fontWeight:500,color:vd.score>=80?C.green:vd.score>=65?C.amber:C.red }}>{vd.score}</div>
                        <div style={{ height:3,background:"#F2F4F7",borderRadius:2,marginTop:3,overflow:"hidden" }}><div style={{ height:"100%",width:`${vd.score}%`,background:vd.score>=80?C.green:vd.score>=65?C.amber:C.red,borderRadius:2 }}/></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ background:"#fff",border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden" }}>
                <div style={{ padding:"16px 20px 12px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${C.border}` }}>
                  <div style={{ fontSize:18,fontWeight:500,color:C.text }}>
                    AI Agents <em style={{ color:C.indigo,fontWeight:400 }}>Overview</em>
                    <span style={{ fontFamily:"monospace",fontSize:9,letterSpacing:"0.12em",textTransform:"uppercase",marginLeft:10,padding:"2px 6px",background:C.indigo+"15",borderRadius:4,color:C.indigo,fontWeight:500 }}>last 24h</span>
                  </div>
                </div>
                <div style={{ padding:"10px 18px 16px" }}>
                  <AIAgentsPanel agents={AI_AGENTS_SA}/>
                  <div style={{ marginTop:12,padding:"10px 14px",borderRadius:9,background:C.green+"06",border:`1px solid ${C.green}25`,textAlign:"center" }}>
                    <div style={{ fontSize:16,fontWeight:700,color:C.green }}>10,7h</div>
                    <div style={{ fontSize:10,color:C.muted,marginTop:2 }}>Total saved today</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 3: Events + Warnings + GDPR SAR */}
            <div style={{ display:"grid",gridTemplateColumns:"1.4fr 1fr 1fr",gap:14,marginBottom:16 }}>
              <div style={{ background:"#fff",border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden" }}>
                <div style={{ padding:"16px 20px 12px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${C.border}` }}>
                  <div style={{ fontSize:18,fontWeight:500,color:C.text }}>Events</div>
                  <span onClick={()=>navigateTo("Events")} style={{ fontSize:12,color:C.muted,cursor:"pointer" }}>All →</span>
                </div>
                <div style={{ padding:"10px 18px 14px" }}>
                  {[{name:"Q1 Investor Briefing",date:"25 Feb · Munich",reg:248},{name:"Webinar March — Gold",date:"8 Mar · Online",reg:186},{name:"FFP Roadshow Frankfurt",date:"14 Mar · Live",reg:94},{name:"Advisortraining DACH",date:"22 Mar · Vienna",reg:67},{name:"Investment Forum Berlin",date:"3 Apr · Live",reg:42}].map((ev,i)=>(
                    <div key={i} style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"9px 0",borderBottom:i<4?`1px solid ${C.border}`:"none" }}>
                      <div><div style={{ fontSize:13,fontWeight:500,color:C.text }}>{ev.name}</div><div style={{ fontSize:11,color:C.muted,marginTop:2 }}>{ev.date}</div></div>
                      <div style={{ fontFamily:"monospace",fontSize:15,fontWeight:700,color:C.indigo,flexShrink:0 }}>{ev.reg}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ background:"#fff",border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden" }}>
                <div style={{ padding:"16px 20px 12px",borderBottom:`1px solid ${C.border}` }}>
                  <div style={{ fontSize:18,fontWeight:500,color:C.text }}>Warnings</div>
                </div>
                <div style={{ padding:"10px 18px 14px",display:"flex",flexDirection:"column" }}>
                  {[{title:"47 contacts unassigned",meta:"Oldest open for 14h",sev:"red",time:"jetzt"},{title:"Zapier Sync Error",meta:"3 contacts failed",sev:"red",time:"2h"},{title:"14 contacts attempt 5/5",meta:"Auto-status tomorrow",sev:"gold",time:"today"},{title:"Appointment No-Show Rate",meta:"Nina Schmitt · 22%",sev:"gold",time:"3h"},{title:"Forecast updated",meta:"7,1% Conversion (+0,3pp)",sev:"blue",time:"5h"}].map((w,i)=>{
                    const col=w.sev==="red"?C.red:w.sev==="gold"?C.amber:C.blue;
                    return (<div key={i} style={{ display:"flex",gap:10,alignItems:"flex-start",padding:"9px 0",borderBottom:i<4?`1px solid ${C.border}`:"none" }}>
                      <div style={{ width:22,height:22,borderRadius:"50%",background:col+"15",border:`1px solid ${col}40`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:col,flexShrink:0,marginTop:1 }}>{w.sev==="blue"?"i":"!"}</div>
                      <div style={{ flex:1,minWidth:0 }}><div style={{ fontSize:12,fontWeight:600,color:C.text }}>{w.title}</div><div style={{ fontSize:10,color:C.muted,marginTop:2 }}>{w.meta}</div></div>
                      <div style={{ fontFamily:"monospace",fontSize:10,color:C.muted,flexShrink:0 }}>{w.time}</div>
                    </div>);
                  })}
                </div>
              </div>
              <div style={{ background:"#fff",border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden" }}>
                <div style={{ padding:"16px 20px 12px",borderBottom:`1px solid ${C.border}` }}>
                  <div style={{ fontSize:18,fontWeight:500,color:C.text }}>GDPR <em style={{ color:C.indigo,fontWeight:400 }}>SAR</em>
                    <span style={{ fontFamily:"monospace",fontSize:9,letterSpacing:"0.12em",textTransform:"uppercase",marginLeft:10,padding:"2px 6px",background:C.green+"15",borderRadius:4,color:C.green,fontWeight:500 }}>Vion Compliance</span>
                  </div>
                </div>
                <div style={{ padding:"10px 18px 14px" }}>
                  {[{title:"Data Request #2026-04",meta:"Hans Müller · Deadline in 3 days",sev:"red",time:"offen"},{title:"Data Request #2026-05",meta:"Lisa Wagner · Deadline in 12 days",sev:"gold",time:"offen"},{title:"Deletion completed",meta:"Peter Kraus · fully processed",sev:"blue",time:"done"},{title:"Data export ready",meta:"Maria Becker · PDF generated",sev:"blue",time:"today"}].map((r,i)=>{
                    const col=r.sev==="red"?C.red:r.sev==="gold"?C.amber:C.blue;
                    return (<div key={i} style={{ display:"flex",gap:10,alignItems:"flex-start",padding:"9px 0",borderBottom:i<3?`1px solid ${C.border}`:"none" }}>
                      <div style={{ width:22,height:22,borderRadius:"50%",background:col+"15",border:`1px solid ${col}40`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:col,flexShrink:0,marginTop:1 }}>{r.sev==="blue"?"i":"!"}</div>
                      <div style={{ flex:1,minWidth:0 }}><div style={{ fontSize:12,fontWeight:600,color:C.text }}>{r.title}</div><div style={{ fontSize:10,color:C.muted,marginTop:2 }}>{r.meta}</div></div>
                      <div style={{ fontFamily:"monospace",fontSize:10,color:r.time==="offen"?C.red:C.muted,flexShrink:0,fontWeight:r.time==="offen"?700:400 }}>{r.time}</div>
                    </div>);
                  })}
                  <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:12 }}>
                    <div style={{ padding:"8px 10px",borderRadius:9,background:C.green+"08",border:`1px solid ${C.green}25`,textAlign:"center" }}><div style={{ fontSize:18,fontWeight:700,color:C.green }}>12</div><div style={{ fontSize:9,color:C.muted,marginTop:1 }}>Done MTD</div></div>
                    <div style={{ padding:"8px 10px",borderRadius:9,background:C.red+"06",border:`1px solid ${C.red}25`,textAlign:"center" }}><div style={{ fontSize:18,fontWeight:700,color:C.red }}>3</div><div style={{ fontSize:9,color:C.muted,marginTop:1 }}>Open</div></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Intake Health */}
            <div style={{ background:"#fff",border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden" }}>
              <div style={{ padding:"16px 20px 12px",borderBottom:`1px solid ${C.border}` }}>
                <div style={{ fontSize:18,fontWeight:500,color:C.text }}>Intake Health</div>
              </div>
              <div style={{ padding:"10px 22px 16px",display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:14 }}>
                {[{label:"Meta Ad Forms",today:47,week:312,health:"good"},{label:"Landing Pages",today:89,week:587,health:"good"},{label:"CSV Upload",today:0,week:24,health:"warn"},{label:"Event Giveaway",today:12,week:68,health:"good"},{label:"Partner Ref.",today:7,week:43,health:"good"}].map((s,i)=>(
                  <div key={i} style={{ padding:"12px 14px",borderRadius:10,background:s.health==="warn"?C.amber+"06":"#FAFAFA",border:`1px solid ${s.health==="warn"?C.amber+"40":C.border}` }}>
                    <div style={{ display:"flex",alignItems:"center",gap:6,marginBottom:8 }}>
                      <span style={{ fontSize:10,color:s.health==="good"?C.green:C.amber,fontWeight:800 }}>{s.health==="good"?"●":"▲"}</span>
                      <div style={{ fontSize:11,fontWeight:600,color:C.text }}>{s.label}</div>
                    </div>
                    <div style={{ fontSize:22,fontWeight:700,color:s.today===0?C.muted:C.navy }}>{s.today}</div>
                    <div style={{ fontSize:10,color:C.muted,marginTop:2 }}>today · <strong style={{ color:C.text }}>{s.week}</strong> Week</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Manager Dashboard */}
      {role==="manager" && (
        <div style={{ padding:"24px 28px 48px" }}>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:22 }}>
            {MGR_KPIS.map(k=>(
              <div key={k.label} style={{ background:"#fff",border:`1px solid ${C.border}`,borderRadius:14,padding:"16px 18px" }}>
                <div style={{ fontSize:10,color:C.muted,fontWeight:600,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:10 }}>{k.label}</div>
                <div style={{ fontSize:36,fontWeight:400,letterSpacing:"-0.03em",lineHeight:1,color:k.color }}>{k.value}</div>
                <div style={{ marginTop:8,display:"flex",gap:8 }}>
                  <span style={{ fontSize:10,fontFamily:"monospace",padding:"2px 7px",borderRadius:20,fontWeight:500,background:k.up?C.green+"15":C.red+"15",color:k.up?C.green:C.red }}>{k.delta}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};


// ─────────────────────────────────────────────────────────────────────────────
// BULK EMAIL PAGE
// ─────────────────────────────────────────────────────────────────────────────
