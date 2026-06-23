import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { SASmartAssignment } from "../dashboard/sa-smart-assignment";
import { StatsPanel } from "../dashboard/stats-panel";
import { VDScriptAnalysisPanel } from "../dashboard/vd-script-analysis-panel";
import { Avatar } from "../ui/avatar";
import { BarChart } from "../ui/bar-chart";
import { Card } from "../ui/card";
import { HBar } from "../ui/h-bar";
import { VDS, VD_GP_PERF, VD_PIPELINE } from "../../lib/core";
import { C } from "../../theme";

export const ReportsPage = ({ role, navigateTo }) => {
  const cfg       = {superadmin:C.navy,vd:C.indigo,gp:C.green,manager:"#0891B2"}[role];
  const roleLabel = {superadmin:"Super Admin",vd:"Sales Director",gp:"Consultant",manager:"Product Owner"}[role];

  // Section definitions per role — id must match the div id used below
  const sections = role==="gp" ? [
    { id:"stats",    label:"My Stats" },
    { id:"funnel",   label:"Conversion Funnel" },
  ] : role==="vd" ? [
    { id:"stats",    label:"My Stats" },
    { id:"funnel",   label:"Conversion Funnel" },
    { id:"team",     label:"Team Performance" },
    { id:"pipeline", label:"Team Pipeline" },
    { id:"script",   label:"Script Analysis" },
  ] : role==="superadmin" ? [
    { id:"analytics",  label:"Analytics" },
    { id:"directors",  label:"Director Performance" },
    { id:"sources",    label:"Lead Sources" },
  ] : /* manager */ [
    { id:"overview",   label:"Org Overview" },
    { id:"team",       label:"Team Performance" },
    { id:"campaign",   label:"Campaign ROI" },
    { id:"script",     label:"Script Adherence" },
    { id:"adoption",   label:"AI Adoption" },
  ];

  const scrollTo = (id) => {
    const el = document.getElementById(`report-section-${id}`);
    if (el) el.scrollIntoView({ behavior:"smooth", block:"start" });
  };

  // ── Section heading component ───────────────────────────────────────────────
  const SectionHeading = ({ id, label }) => (
    <div id={`report-section-${id}`} style={{ display:"flex",alignItems:"center",gap:12,marginBottom:20,scrollMarginTop:70 }}>
      <div style={{ fontSize:15,fontWeight:800,color:C.navy }}>{label}</div>
      <div style={{ flex:1,height:1,background:C.border }}/>
    </div>
  );

  // ── Shared sub-components ───────────────────────────────────────────────────
  const TEAM_PERF_DATA = [
    {vd:"Thomas Müller",gps:3,leads:890, closed:34,rate:"7.1%",aiAvg:74,adherence:61,trend:"up"},
    {vd:"Lisa Weber",   gps:3,leads:820, closed:28,rate:"6.8%",aiAvg:71,adherence:68,trend:"up"},
    {vd:"Jana Kruse",   gps:2,leads:710, closed:16,rate:"3.9%",aiAvg:58,adherence:39,trend:"down"},
    {vd:"Ralf Fischer", gps:2,leads:484, closed:9, rate:"4.2%",aiAvg:62,adherence:44,trend:"flat"},
  ];
  const CAMPAIGN_DATA = [
    {name:"Q1 Finanz",  leads:820,closed:71,rate:"8.6%",cost:"€12.4K",cpl:"€15", revenue:"€128K",roi:"932%"},
    {name:"Partner Ref",leads:310,closed:17,rate:"5.5%",cost:"€3.2K", cpl:"€10", revenue:"€31K", roi:"869%"},
    {name:"Messe FFM",  leads:480,closed:23,rate:"4.8%",cost:"€18.1K",cpl:"€38", revenue:"€41K", roi:"127%"},
    {name:"Webinar März",leads:640,closed:27,rate:"4.2%",cost:"€8.6K", cpl:"€13", revenue:"€49K", roi:"470%"},
    {name:"Giveaway",   leads:280,closed:6, rate:"2.1%",cost:"€9.4K", cpl:"€34", revenue:"€11K", roi:"17%"},
  ];
  const MONTHLY_DATA = [
    {m:"Aug",leads:310,closed:18},{m:"Sep",leads:340,closed:22},
    {m:"Oct",leads:390,closed:28},{m:"Nov",leads:420,closed:31},
    {m:"Dec",leads:360,closed:24},{m:"Jan",leads:480,closed:41},{m:"Feb",leads:530,closed:49},
  ];
  const maxL = Math.max(...MONTHLY_DATA.map(m=>m.leads));
  const MGR_COLOR = "#0891B2";

  return (
    <div style={{ padding:"0 28px 40px" }}>
      {/* ── Sticky anchor nav ─────────────────────────────────────────────── */}
      <div style={{ position:"sticky",top:54,zIndex:100,background:"#fff",borderBottom:`1px solid ${C.border}`,marginLeft:-28,marginRight:-28,paddingLeft:28,paddingRight:28 }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:16,paddingBottom:10 }}>
          <div>
            <div style={{ display:"flex",alignItems:"center",gap:8,fontSize:12,color:C.muted,marginBottom:3 }}>
              <span onClick={()=>navigateTo("Dashboard")} style={{ cursor:"pointer",color:C.blue,fontWeight:600 }}>Dashboard</span>
              <span>›</span><span style={{ color:C.text,fontWeight:600 }}>Reports</span>
              <span style={{ fontSize:11,padding:"2px 8px",borderRadius:12,background:cfg+"18",color:cfg,fontWeight:700 }}>{roleLabel}</span>
            </div>
            <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
              {sections.map(s=>(
                <button key={s.id} onClick={()=>scrollTo(s.id)}
                  style={{ padding:"5px 13px",borderRadius:20,border:`1.5px solid ${C.border}`,background:"#fff",color:C.slate,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit",transition:"all 0.15s" }}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=cfg;e.currentTarget.style.color=cfg;e.currentTarget.style.background=cfg+"0A";}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.slate;e.currentTarget.style.background="#fff";}}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Page title ────────────────────────────────────────────────────── */}
      <div style={{ paddingTop:28,marginBottom:28 }}>
        <h1 style={{ margin:0,fontSize:24,fontWeight:800,color:C.navy,letterSpacing:"-0.02em" }}>Reports</h1>
        <p style={{ margin:"4px 0 0",fontSize:13,color:C.slate }}>Performance data, analytics, and AI insights · February 2026</p>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          GP SECTIONS
      ═══════════════════════════════════════════════════════════════════ */}
      {role==="gp" && (<>
        <SectionHeading id="stats" label="My Stats" />
        <StatsPanel isVD={false} />
        <div style={{ height:40 }}/>

        <SectionHeading id="funnel" label="Conversion Funnel" />
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14 }}>
          <Card style={{ padding:"18px 20px" }}>
            {[
              {label:"Assigned",   value:62, pct:100,  color:C.slate},
              {label:"Contacted",  value:48, pct:77,   color:C.blue},
              {label:"Reached",    value:33, pct:53,   color:C.indigo},
              {label:"Appointment",value:21, pct:34,   color:C.purple},
              {label:"Closed",     value:14, pct:22,   color:C.green},
            ].map(row=>(
              <div key={row.label} style={{ display:"flex",alignItems:"center",gap:10,marginBottom:10 }}>
                <div style={{ width:90,fontSize:11,color:C.muted,fontWeight:600,textAlign:"right",flexShrink:0 }}>{row.label}</div>
                <div style={{ flex:1,height:22,borderRadius:5,background:"#F1F5F9",overflow:"hidden" }}>
                  <div style={{ height:"100%",width:`${row.pct}%`,background:row.color,borderRadius:5 }}/>
                </div>
                <div style={{ width:80,fontSize:11,fontWeight:700,color:row.color,textAlign:"right",flexShrink:0 }}>{row.value} <span style={{ color:C.muted,fontWeight:400 }}>({row.pct}%)</span></div>
              </div>
            ))}
          </Card>
          <Card style={{ padding:"18px 20px" }}>
            <div style={{ fontSize:13,fontWeight:700,color:C.text,marginBottom:12 }}>Campaign Performance</div>
            <table style={{ width:"100%",borderCollapse:"collapse",fontSize:12 }}>
              <thead><tr style={{ borderBottom:`2px solid ${C.border}` }}>
                {["Campaign","Leads","Appts","Closed","Rate"].map(h=><th key={h} style={{ padding:"6px 8px",textAlign:"left",fontSize:10,fontWeight:700,color:C.muted }}>{h}</th>)}
              </tr></thead>
              <tbody>{[
                {name:"Q1 Finanz",leads:24,appts:10,closed:6,rate:"25.0%"},
                {name:"Webinar März",leads:20,appts:7,closed:5,rate:"25.0%"},
                {name:"Partner Ref",leads:12,appts:3,closed:2,rate:"16.7%"},
                {name:"Messe FFM",leads:6,appts:1,closed:1,rate:"16.7%"},
              ].map((c,i)=>(
                <tr key={c.name} style={{ borderBottom:`1px solid ${C.border}`,background:i%2?"#FAFAFA":"#fff" }}>
                  <td style={{ padding:"8px",fontWeight:600,fontSize:11 }}>{c.name}</td>
                  <td style={{ padding:"8px",color:C.slate }}>{c.leads}</td>
                  <td style={{ padding:"8px",color:C.purple,fontWeight:600 }}>{c.appts}</td>
                  <td style={{ padding:"8px",color:C.green,fontWeight:700 }}>{c.closed}</td>
                  <td style={{ padding:"8px" }}><span style={{ fontWeight:700,color:parseFloat(c.rate)>=20?C.green:parseFloat(c.rate)>=10?C.amber:C.red }}>{c.rate}</span></td>
                </tr>
              ))}</tbody>
            </table>
          </Card>
        </div>
        <Card style={{ padding:"18px 20px",marginBottom:14 }}>
          <div style={{ fontSize:13,fontWeight:700,color:C.text,marginBottom:14 }}>Monthly Closings Trend</div>
          <BarChart data={[{l:"Aug",v:2},{l:"Sep",v:4},{l:"Okt",v:3},{l:"Nov",v:6},{l:"Dez",v:5},{l:"Jan",v:7},{l:"Feb",v:14}]} color={C.green} height={70} />
        </Card>
        <div style={{ height:40 }}/>

      </>)}

      {/* ════════════════════════════════════════════════════════════════════
          VD SECTIONS
      ═══════════════════════════════════════════════════════════════════ */}
      {role==="vd" && (<>
        <SectionHeading id="stats" label="My Stats" />
        <StatsPanel isVD={true} />
        <div style={{ height:40 }}/>

        <SectionHeading id="funnel" label="Conversion Funnel" />
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14 }}>
          <Card style={{ padding:"18px 20px" }}>
            {[
              {label:"Assigned",   value:6, pct:100, color:C.slate},
              {label:"Contacted",  value:5, pct:83,  color:C.blue},
              {label:"Reached",    value:4, pct:67,  color:C.indigo},
              {label:"Appointment",value:2, pct:33,  color:C.purple},
              {label:"Closed",     value:1, pct:17,  color:C.green},
            ].map(row=>(
              <div key={row.label} style={{ display:"flex",alignItems:"center",gap:10,marginBottom:10 }}>
                <div style={{ width:90,fontSize:11,color:C.muted,fontWeight:600,textAlign:"right",flexShrink:0 }}>{row.label}</div>
                <div style={{ flex:1,height:22,borderRadius:5,background:"#F1F5F9",overflow:"hidden" }}><div style={{ height:"100%",width:`${row.pct}%`,background:row.color,borderRadius:5 }}/></div>
                <div style={{ width:80,fontSize:11,fontWeight:700,color:row.color,textAlign:"right",flexShrink:0 }}>{row.value} <span style={{ color:C.muted,fontWeight:400 }}>({row.pct}%)</span></div>
              </div>
            ))}
          </Card>
          <Card style={{ padding:"18px 20px" }}>
            <div style={{ fontSize:13,fontWeight:700,color:C.text,marginBottom:14 }}>Monthly Closings Trend</div>
            <BarChart data={[{l:"Aug",v:0},{l:"Sep",v:0},{l:"Okt",v:0},{l:"Nov",v:1},{l:"Dez",v:1},{l:"Jan",v:0},{l:"Feb",v:1}]} color={C.indigo} height={70} />
          </Card>
        </div>
        <div style={{ height:40 }}/>

        <SectionHeading id="team" label="Team Performance" />
        <Card style={{ padding:"18px 20px",marginBottom:14 }}>
          {VD_GP_PERF.map((gp,i)=>(
            <div key={gp.name} style={{ marginBottom:14,paddingBottom:14,borderBottom:i<VD_GP_PERF.length-1?`1px solid ${C.border}`:"none" }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10 }}>
                <div style={{ display:"flex",alignItems:"center",gap:9 }}><Avatar name={gp.name} size={32}/><div><div style={{ fontSize:13,fontWeight:700 }}>{gp.name}</div><div style={{ fontSize:11,color:C.muted }}>{gp.leads} leads assigned</div></div></div>
                <span style={{ fontSize:16,fontWeight:800,color:parseFloat(gp.rate)>=7?C.green:C.amber }}>{gp.rate}</span>
              </div>
              <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8 }}>
                {[["Reached",gp.reached,C.blue],["Appts",gp.appts,C.indigo],["Closed",gp.closed,C.green],["Adherence",`${gp.adherence}%`,gp.adherence>=65?C.green:gp.adherence>=45?C.amber:C.red]].map(([label,val,color])=>(
                  <div key={label} style={{ background:color+"10",borderRadius:8,padding:"10px 12px",textAlign:"center" }}>
                    <div style={{ fontSize:18,fontWeight:800,color }}>{val}</div>
                    <div style={{ fontSize:10,color:C.muted,marginTop:2 }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </Card>
        <div style={{ height:40 }}/>

        <SectionHeading id="pipeline" label="Team Pipeline" />
        <Card style={{ padding:"18px 20px",marginBottom:14 }}>
          {VD_PIPELINE.slice(0,6).map(p=><HBar key={p.label} value={p.value} max={Math.max(...VD_PIPELINE.map(x=>x.value))} color={p.color} label={p.label} sub={`${p.value}`}/>)}
        </Card>
        <div style={{ height:40 }}/>

        <SectionHeading id="script" label="Script Analysis" />
        <VDScriptAnalysisPanel />
      </>)}

      {/* ════════════════════════════════════════════════════════════════════
          SA SECTIONS — updated from 03_super_admin design
      ═══════════════════════════════════════════════════════════════════ */}
      {role==="superadmin" && (()=>{
        const SA_KPIS_NEW = [
          { label:"Gesamt Leads",   value:"2.904", delta:"+127",   up:true,  sub:"aktiv",        warn:false, good:false },
          { label:"Unzugewiesen",   value:"47",    delta:"−12",    up:false, sub:"Zuteilung offen",warn:true, good:false },
          { label:"Termine",        value:"134",   delta:"+23",    up:true,  sub:"Monat",        warn:false, good:false },
          { label:"Abschlüsse",     value:"81",    delta:"+11",    up:true,  sub:"MTD",          warn:false, good:true  },
          { label:"Opt-In Rate",    value:"79,8",  delta:"+2,4pp", up:true,  sub:"% DSGVO",      warn:false, good:false },
          { label:"Konversion",     value:"6,2",   delta:"+0,4pp", up:true,  sub:"% Org MTD",    warn:false, good:true  },
        ];
        const VDS = [
          { name:"Thomas Müller",  gps:5, leads:412, appts:58, closed:31, rate:"7.5%", score:88, trend:"up" },
          { name:"Marc Fischer",   gps:4, leads:334, appts:42, closed:28, rate:"8.4%", score:91, trend:"up" },
          { name:"Jana Kruse",     gps:3, leads:198, appts:22, closed:12, rate:"6.1%", score:72, trend:"flat" },
          { name:"Ralf Fischer",   gps:4, leads:289, appts:34, closed:18, rate:"6.2%", score:69, trend:"down" },
        ];
        const SOURCES = [
          { label:"Landing Pages",  value:1203, pct:41, color:C.indigo, conv:"7.2%" },
          { label:"Meta Ads",       value:748,  pct:26, color:C.blue,   conv:"5.8%" },
          { label:"Events",         value:412,  pct:14, color:C.amber,  conv:"9.1%" },
          { label:"CSV / Upload",   value:289,  pct:10, color:C.muted,  conv:"3.4%" },
          { label:"Partner Ref.",   value:252,  pct:9,  color:C.green,  conv:"11.2%"},
        ];
        const AI_AGENTS = [
          { name:"Vion Scorer",     requests:1842, success:"99.2%", saved:"4.2h", status:"active",  color:C.green  },
          { name:"Vion Coach",      requests:386,  success:"98.7%", saved:"1.8h", status:"active",  color:C.green  },
          { name:"Vion Nurture",    requests:612,  success:"97.1%", saved:"2.9h", status:"active",  color:C.green  },
          { name:"Vion Voice",      requests:94,   success:"95.3%", saved:"0.7h", status:"active",  color:C.amber  },
          { name:"Vion Compliance", requests:127,  success:"100%",  saved:"1.1h", status:"active",  color:C.green  },
        ];
        const ORG_QUOTA = [
          { label:"Termine",       val:134, target:200, pct:67, color:C.purple },
          { label:"Abschlüsse",    val:81,  target:120, pct:68, color:C.amber  },
          { label:"Neue Kontakte", val:412, target:600, pct:69, color:C.green  },
          { label:"Opt-In Rate",   val:79,  target:85,  pct:93, color:C.blue   },
        ];
        const GDPR_ITEMS = [
          { title:"SAR offen",       count:3,  color:C.red,    action:"Bearbeiten" },
          { title:"Löschanfragen",   count:1,  color:C.amber,  action:"Ausführen"  },
          { title:"Daten exportiert",count:12, color:C.green,  action:"Ansehen"    },
          { title:"Einwilligung abg.",count:47,color:C.muted,  action:"Prüfen"     },
        ];

        return (<>
          {/* ── Page Head ─────────────────────────────────────────────── */}
          <div style={{ padding:"0 28px 22px",display:"flex",alignItems:"flex-end",justifyContent:"space-between",gap:24 }}>
            <div>
              <h1 style={{ fontSize:36,fontWeight:400,letterSpacing:"-0.025em",color:C.text,margin:0 }}>
                Org Overview<span style={{ color:C.navy }}>.</span>
              </h1>
              <div style={{ marginTop:8,fontSize:11,color:C.muted,letterSpacing:"0.1em",textTransform:"uppercase" }}>
                Super Admin · Gesamtorganisation · Quartal Q1 2026
              </div>
            </div>
            <div style={{ display:"flex",gap:8 }}>
              {["Heute","Woche","MTD","Quartal","YTD"].map(p=>(
                <button key={p} style={{ padding:"7px 14px",borderRadius:8,border:`1px solid ${C.border}`,
                  background:"#fff",color:C.muted,fontSize:12,cursor:"pointer",fontFamily:"inherit" }}>{p}</button>
              ))}
            </div>
          </div>

          {/* ── KPI Strip ─────────────────────────────────────────────── */}
          <div style={{ padding:"0 28px",display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:12,marginBottom:22 }}>
            {SA_KPIS_NEW.map(k=>(
              <div key={k.label} style={{ background:"#fff",border:`1px solid ${k.warn?C.red+"40":C.border}`,borderRadius:14,padding:"16px 18px",position:"relative" }}>
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

          {/* ── Main Grid ─────────────────────────────────────────────── */}
          <div style={{ padding:"0 28px" }}>

            {/* Row 1: Unassigned leads + Org Quota + Sources */}
            <div style={{ display:"grid",gridTemplateColumns:"2fr 1.2fr 1.2fr",gap:14,marginBottom:16 }}>

              {/* Unassigned Contacts */}
              <SASmartAssignment />

              {/* Org Quota MTD */}
              <div style={{ background:"#fff",border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden" }}>
                <div style={{ padding:"16px 20px 12px",borderBottom:`1px solid ${C.border}` }}>
                  <div style={{ fontSize:18,fontWeight:500,color:C.text }}>Org Quota <em style={{ color:C.indigo,fontWeight:400 }}>MTD</em></div>
                </div>
                <div style={{ padding:"14px 18px 18px" }}>
                  {ORG_QUOTA.map(q=>(
                    <div key={q.label} style={{ marginBottom:14 }}>
                      <div style={{ display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:5 }}>
                        <span style={{ color:C.text }}>{q.label}</span>
                        <span style={{ fontFamily:"monospace",color:C.muted }}>{q.val} / {q.target}</span>
                      </div>
                      <div style={{ height:6,background:"#F2F4F7",borderRadius:3,overflow:"hidden" }}>
                        <div style={{ height:"100%",width:`${q.pct}%`,background:q.color,borderRadius:3 }}/>
                      </div>
                      <div style={{ fontSize:10,color:q.color,fontWeight:600,marginTop:3 }}>{q.pct}% of target</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Lead Sources + Conversion */}
              <div style={{ background:"#fff",border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden" }}>
                <div style={{ padding:"16px 20px 12px",borderBottom:`1px solid ${C.border}` }}>
                  <div style={{ fontSize:18,fontWeight:500,color:C.text }}>Quellen <em style={{ color:C.indigo,fontWeight:400 }}>+ Konv.</em></div>
                </div>
                <div style={{ padding:"12px 18px 16px" }}>
                  {SOURCES.map((s,i)=>(
                    <div key={i} style={{ display:"flex",alignItems:"center",gap:10,padding:"7px 0",borderBottom:i<SOURCES.length-1?`1px solid ${C.border}`:"none" }}>
                      <div style={{ width:8,height:8,borderRadius:2,background:s.color,flexShrink:0 }}/>
                      <div style={{ flex:1,fontSize:12,color:C.text }}>{s.label}</div>
                      <div style={{ fontFamily:"monospace",fontSize:11,color:C.muted,width:36,textAlign:"right" }}>{s.pct}%</div>
                      <div style={{ fontFamily:"monospace",fontSize:11,fontWeight:600,color:parseFloat(s.conv)>=8?C.green:parseFloat(s.conv)>=5?C.amber:C.red,width:40,textAlign:"right" }}>{s.conv}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Row 2: Director Performance + AI Agents */}
            <div style={{ display:"grid",gridTemplateColumns:"1.5fr 1fr",gap:14,marginBottom:16 }}>

              {/* Director Performance */}
              <div style={{ background:"#fff",border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden" }}>
                <div style={{ padding:"16px 22px 12px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:`1px solid ${C.border}` }}>
                  <div style={{ fontSize:18,fontWeight:500,color:C.text }}>Direktoren <em style={{ color:C.indigo,fontWeight:400 }}>MTD</em></div>
                  <span onClick={()=>navigateTo("Reports")} style={{ fontSize:12,color:C.muted,cursor:"pointer" }}>Full Report →</span>
                </div>
                <div style={{ padding:"0 22px" }}>
                  <div style={{ display:"grid",gridTemplateColumns:"1fr 50px 60px 60px 70px 60px",
                    padding:"8px 0",borderBottom:`1px solid ${C.border}`,gap:8 }}>
                    {["Direktor","GPs","Termine","Abschl.","Konv.","Score"].map(h=>(
                      <div key={h} style={{ fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em",
                        textAlign:h==="Direktor"?"left":"center" }}>{h}</div>
                    ))}
                  </div>
                  {VDS.map((vd,i)=>(
                    <div key={i} style={{ display:"grid",gridTemplateColumns:"1fr 50px 60px 60px 70px 60px",
                      padding:"11px 0",borderBottom:i<VDS.length-1?`1px solid ${C.border}`:"none",gap:8,alignItems:"center" }}>
                      <div style={{ display:"flex",alignItems:"center",gap:9 }}>
                        <Avatar name={vd.name} size={28}/>
                        <div>
                          <div style={{ fontSize:13,fontWeight:500,color:C.text }}>{vd.name.split(" ")[0]}</div>
                          <div style={{ fontSize:10,color:C.muted }}>{vd.gps} GPs</div>
                        </div>
                      </div>
                      {[vd.appts,vd.closed].map((v,vi)=>(
                        <div key={vi} style={{ textAlign:"center",fontFamily:"monospace",fontSize:13,color:C.text }}>{v}</div>
                      ))}
                      <div style={{ textAlign:"center",fontFamily:"monospace",fontSize:12,color:C.text }}>{vd.leads}</div>
                      <div style={{ textAlign:"center",fontFamily:"monospace",fontSize:13,fontWeight:700,
                        color:parseFloat(vd.rate)>=8?C.green:parseFloat(vd.rate)>=6?C.amber:C.red }}>{vd.rate}</div>
                      <div style={{ textAlign:"center" }}>
                        <div style={{ fontSize:15,fontWeight:500,color:vd.score>=80?C.green:vd.score>=65?C.amber:C.red }}>{vd.score}</div>
                        <div style={{ height:3,background:"#F2F4F7",borderRadius:2,marginTop:3,overflow:"hidden" }}>
                          <div style={{ height:"100%",width:`${vd.score}%`,background:vd.score>=80?C.green:vd.score>=65?C.amber:C.red,borderRadius:2 }}/>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Agents Overview */}
              <div style={{ background:"#fff",border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden" }}>
                <div style={{ padding:"16px 20px 12px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${C.border}` }}>
                  <div style={{ fontSize:18,fontWeight:500,color:C.text }}>
                    AI-Agenten <em style={{ color:C.indigo,fontWeight:400 }}>Übersicht</em>
                    <span style={{ fontFamily:"monospace",fontSize:9,letterSpacing:"0.12em",textTransform:"uppercase",
                      marginLeft:10,padding:"2px 6px",background:C.indigo+"15",borderRadius:4,color:C.indigo,fontWeight:500 }}>letzte 24h</span>
                  </div>
                </div>
                <div style={{ padding:"10px 18px 16px" }}>
                  {AI_AGENTS.map((a,i)=>(
                    <div key={i} style={{ display:"flex",alignItems:"center",gap:10,padding:"9px 0",borderBottom:i<AI_AGENTS.length-1?`1px solid ${C.border}`:"none" }}>
                      <div style={{ width:8,height:8,borderRadius:"50%",background:a.color,flexShrink:0 }}/>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13,fontWeight:500,color:C.text }}>{a.name}</div>
                        <div style={{ fontSize:10,color:C.muted,marginTop:1 }}>{a.requests.toLocaleString()} req · {a.success} OK</div>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontSize:13,fontWeight:700,color:C.green }}>{a.saved}</div>
                        <div style={{ fontSize:9,color:C.muted }}>eingespart</div>
                      </div>
                    </div>
                  ))}
                  <div style={{ marginTop:12,padding:"10px 14px",borderRadius:9,background:C.green+"06",border:`1px solid ${C.green}25`,textAlign:"center" }}>
                    <div style={{ fontSize:16,fontWeight:700,color:C.green }}>10,7h</div>
                    <div style={{ fontSize:10,color:C.muted,marginTop:2 }}>Gesamtersparnis heute · alle Agenten</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 3: Events + Warnungen + DSGVO SAR (matching HTML design) */}
            <div style={{ display:"grid",gridTemplateColumns:"1.4fr 1fr 1fr",gap:14,marginBottom:16 }}>

              {/* Events */}
              <div style={{ background:"#fff",border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden" }}>
                <div style={{ padding:"16px 20px 12px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${C.border}` }}>
                  <div style={{ fontSize:18,fontWeight:500,color:C.text }}>Events</div>
                  <button onClick={()=>navigateTo("Events")} style={{ padding:"5px 12px",borderRadius:7,border:`1px solid ${C.border}`,background:"#fff",color:C.blue,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>View All →</button>
                </div>
                <div style={{ padding:"10px 18px 14px" }}>
                  {[
                    { name:"Q1 Investor Briefing",  date:"25. Feb · München",  reg:248 },
                    { name:"Webinar März — Gold",    date:"8. März · Online",   reg:186 },
                    { name:"FFP Roadshow Frankfurt", date:"14. März · live",    reg:94  },
                    { name:"Beratertraining DACH",   date:"22. März · Wien",    reg:67  },
                    { name:"Investmentforum Berlin", date:"3. April · live",    reg:42  },
                  ].map((ev,i)=>(
                    <div key={i} style={{ display:"flex",alignItems:"center",justifyContent:"space-between",
                      padding:"9px 0",borderBottom:i<4?`1px solid ${C.border}`:"none" }}>
                      <div>
                        <div style={{ fontSize:13,fontWeight:500,color:C.text }}>{ev.name}</div>
                        <div style={{ fontSize:11,color:C.muted,marginTop:2 }}>{ev.date}</div>
                      </div>
                      <div style={{ fontFamily:"monospace",fontSize:15,fontWeight:700,color:C.indigo,flexShrink:0 }}>{ev.reg}</div>
                    </div>
                  ))}
                  <div style={{ marginTop:12,paddingTop:12,borderTop:`1px dashed ${C.border}`,display:"flex",justifyContent:"space-between",fontSize:11,color:C.muted }}>
                    <span>Ges. Registrierungen</span>
                    <strong style={{ color:C.navy,fontSize:14 }}>637</strong>
                  </div>
                </div>
              </div>

              {/* Warnungen */}
              <div style={{ background:"#fff",border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden" }}>
                <div style={{ padding:"16px 20px 12px",borderBottom:`1px solid ${C.border}` }}>
                  <div style={{ fontSize:18,fontWeight:500,color:C.text }}>Warnungen</div>
                </div>
                <div style={{ padding:"10px 18px 14px",display:"flex",flexDirection:"column",gap:0 }}>
                  {[
                    { title:"47 Leads unzugewiesen",      meta:"Älteste seit 14h offen",                   sev:"red",  time:"jetzt" },
                    { title:"Zapier Sync-Fehler",          meta:"3 Leads fehlgeschlagen · Sonstige",        sev:"red",  time:"2h"    },
                    { title:"14 Leads Versuch 5/5",        meta:"Auto-Status → \"Nicht erreicht\" morgen",  sev:"gold", time:"heute" },
                    { title:"Termin No-Show Quote",        meta:"Nina Schmitt · 22% diese Woche",           sev:"gold", time:"3h"    },
                    { title:"Forecast aktualisiert",       meta:"Monatsende: 7,1% Konversion (+0,3pp)",     sev:"blue", time:"5h"    },
                  ].map((w,i)=>{
                    const col = w.sev==="red"?C.red:w.sev==="gold"?C.amber:C.blue;
                    const lbl = w.sev==="red"?"!":w.sev==="gold"?"!":"i";
                    return (
                      <div key={i} style={{ display:"flex",gap:10,alignItems:"flex-start",
                        padding:"9px 0",borderBottom:i<4?`1px solid ${C.border}`:"none" }}>
                        <div style={{ width:22,height:22,borderRadius:"50%",background:col+"15",border:`1px solid ${col}40`,
                          display:"flex",alignItems:"center",justifyContent:"center",
                          fontSize:11,fontWeight:800,color:col,flexShrink:0,marginTop:1 }}>{lbl}</div>
                        <div style={{ flex:1,minWidth:0 }}>
                          <div style={{ fontSize:12,fontWeight:600,color:C.text }}>{w.title}</div>
                          <div style={{ fontSize:10,color:C.muted,marginTop:2 }}>{w.meta}</div>
                        </div>
                        <div style={{ fontFamily:"monospace",fontSize:10,color:C.muted,flexShrink:0 }}>{w.time}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* DSGVO SAR */}
              <div style={{ background:"#fff",border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden" }}>
                <div style={{ padding:"16px 20px 12px",borderBottom:`1px solid ${C.border}` }}>
                  <div style={{ fontSize:18,fontWeight:500,color:C.text }}>
                    DSGVO <em style={{ color:C.indigo,fontWeight:400 }}>SAR</em>
                    <span style={{ fontFamily:"monospace",fontSize:9,letterSpacing:"0.12em",textTransform:"uppercase",
                      marginLeft:10,padding:"2px 6px",background:C.green+"15",borderRadius:4,color:C.green,fontWeight:500 }}>Vion Compliance</span>
                  </div>
                </div>
                <div style={{ padding:"10px 18px 14px" }}>
                  {[
                    { title:"Auskunftsanfrage #2026-04", meta:"Hans Müller · Frist in 3 Tagen",   sev:"red",  time:"offen" },
                    { title:"Auskunftsanfrage #2026-05", meta:"Lisa Wagner · Frist in 12 Tagen",  sev:"gold", time:"offen" },
                    { title:"Löschung abgeschlossen",    meta:"Peter Kraus · vollständig",         sev:"blue", time:"done"  },
                    { title:"Datenexport bereit",        meta:"Maria Becker · PDF generiert",      sev:"blue", time:"heute" },
                  ].map((r,i)=>{
                    const col = r.sev==="red"?C.red:r.sev==="gold"?C.amber:C.blue;
                    const lbl = r.sev==="red"?"!":r.sev==="gold"?"!":"i";
                    return (
                      <div key={i} style={{ display:"flex",gap:10,alignItems:"flex-start",
                        padding:"9px 0",borderBottom:i<3?`1px solid ${C.border}`:"none" }}>
                        <div style={{ width:22,height:22,borderRadius:"50%",background:col+"15",border:`1px solid ${col}40`,
                          display:"flex",alignItems:"center",justifyContent:"center",
                          fontSize:11,fontWeight:800,color:col,flexShrink:0,marginTop:1 }}>{lbl}</div>
                        <div style={{ flex:1,minWidth:0 }}>
                          <div style={{ fontSize:12,fontWeight:600,color:C.text }}>{r.title}</div>
                          <div style={{ fontSize:10,color:C.muted,marginTop:2 }}>{r.meta}</div>
                        </div>
                        <div style={{ fontFamily:"monospace",fontSize:10,color:r.time==="offen"?C.red:C.muted,flexShrink:0,fontWeight:r.time==="offen"?700:400 }}>{r.time}</div>
                      </div>
                    );
                  })}
                  <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:12 }}>
                    <div style={{ padding:"8px 10px",borderRadius:9,background:C.green+"08",border:`1px solid ${C.green}25`,textAlign:"center" }}>
                      <div style={{ fontSize:18,fontWeight:700,color:C.green }}>12</div>
                      <div style={{ fontSize:9,color:C.muted,marginTop:1 }}>Erledigt MTD</div>
                    </div>
                    <div style={{ padding:"8px 10px",borderRadius:9,background:C.red+"06",border:`1px solid ${C.red}25`,textAlign:"center" }}>
                      <div style={{ fontSize:18,fontWeight:700,color:C.red }}>3</div>
                      <div style={{ fontSize:9,color:C.muted,marginTop:1 }}>Offen</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Intake-Health — full width bottom row */}
            <div style={{ background:"#fff",border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden",marginBottom:16 }}>
              <div style={{ padding:"16px 20px 12px",borderBottom:`1px solid ${C.border}` }}>
                <div style={{ fontSize:18,fontWeight:500,color:C.text }}>Intake-Health</div>
              </div>
              <div style={{ padding:"10px 22px 16px",display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:14 }}>
                {[
                  { label:"Meta Ad Forms",    today:47,  week:312, health:"good" },
                  { label:"Landing Pages",    today:89,  week:587, health:"good" },
                  { label:"CSV Upload",       today:0,   week:24,  health:"warn" },
                  { label:"Event Giveaway",   today:12,  week:68,  health:"good" },
                  { label:"Partner Ref.",     today:7,   week:43,  health:"good" },
                ].map((s,i)=>(
                  <div key={i} style={{ padding:"12px 14px",borderRadius:10,
                    background:s.health==="warn"?C.amber+"06":"#FAFAFA",
                    border:`1px solid ${s.health==="warn"?C.amber+"40":C.border}` }}>
                    <div style={{ display:"flex",alignItems:"center",gap:6,marginBottom:8 }}>
                      <span style={{ fontSize:10,color:s.health==="good"?C.green:C.amber,fontWeight:800 }}>{s.health==="good"?"●":"▲"}</span>
                      <div style={{ fontSize:11,fontWeight:600,color:C.text }}>{s.label}</div>
                    </div>
                    <div style={{ fontSize:22,fontWeight:700,color:s.today===0?C.muted:C.navy }}>{s.today}</div>
                    <div style={{ fontSize:10,color:C.muted,marginTop:2 }}>heute · <strong style={{ color:C.text }}>{s.week}</strong> Woche</div>
                  </div>
                ))}
              </div>
            </div>

          </div>
          <div style={{ height:40 }}/>
        </>);
      })()}

      {/* ════════════════════════════════════════════════════════════════════
          MANAGER / PO SECTIONS
      ═══════════════════════════════════════════════════════════════════ */}
      {role==="manager" && (<>
        {/* Org KPIs */}
        <SectionHeading id="overview" label="Org Overview" />
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14 }}>
          <Card style={{ padding:"18px 20px" }}>
            <div style={{ fontSize:13,fontWeight:700,color:C.text,marginBottom:12 }}>Pipeline Trend (Aug–Feb)</div>
            {MONTHLY_DATA.map((m)=>(
              <div key={m.m} style={{ display:"flex",alignItems:"center",gap:8,marginBottom:8 }}>
                <span style={{ fontSize:11,color:C.muted,width:26,flexShrink:0 }}>{m.m}</span>
                <div style={{ flex:1,display:"flex",flexDirection:"column",gap:3 }}>
                  <div style={{ height:6,borderRadius:3,background:"#F1F5F9" }}><div style={{ height:"100%",width:`${(m.leads/maxL)*100}%`,background:MGR_COLOR+"60",borderRadius:3 }}/></div>
                  <div style={{ height:6,borderRadius:3,background:"#F1F5F9" }}><div style={{ height:"100%",width:`${(m.closed/maxL)*100}%`,background:C.green,borderRadius:3 }}/></div>
                </div>
                <div style={{ display:"flex",flexDirection:"column",alignItems:"flex-end",flexShrink:0,width:68 }}>
                  <span style={{ fontSize:10,color:MGR_COLOR,fontWeight:700 }}>{m.leads}</span>
                  <span style={{ fontSize:10,color:C.green,fontWeight:700 }}>{m.closed} closed</span>
                </div>
              </div>
            ))}
            <div style={{ marginTop:8,display:"flex",gap:14 }}>
              <div style={{ display:"flex",alignItems:"center",gap:5 }}><div style={{ width:10,height:6,borderRadius:2,background:MGR_COLOR+"60" }}/><span style={{ fontSize:10,color:C.muted }}>Contacts</span></div>
              <div style={{ display:"flex",alignItems:"center",gap:5 }}><div style={{ width:10,height:6,borderRadius:2,background:C.green }}/><span style={{ fontSize:10,color:C.muted }}>Closed</span></div>
            </div>
          </Card>
          <Card style={{ padding:"18px 20px" }}>
            <div style={{ fontSize:13,fontWeight:700,color:C.text,marginBottom:14 }}>AI Contact Score Distribution</div>
            {[{label:"Hot (80–100)",count:312,pct:37,color:C.red},{label:"Warm (40–79)",count:490,pct:46,color:C.amber},{label:"Cold (0–39)",count:145,pct:17,color:C.muted}].map(s=>(
              <div key={s.label} style={{ marginBottom:14 }}>
                <div style={{ display:"flex",justifyContent:"space-between",marginBottom:5 }}><span style={{ fontSize:12,fontWeight:700 }}>{s.label}</span><span style={{ fontSize:12,fontWeight:800,color:s.color }}>{s.count} leads</span></div>
                <div style={{ height:10,borderRadius:5,background:"#F1F5F9" }}><div style={{ height:"100%",width:`${s.pct}%`,background:s.color,borderRadius:5 }}/></div>
                <div style={{ fontSize:10,color:C.muted,marginTop:3 }}>{s.pct}% of pipeline</div>
              </div>
            ))}
          </Card>
        </div>
        <div style={{ height:40 }}/>

        <SectionHeading id="team" label="Team Performance" />
        <Card style={{ padding:"18px 20px",marginBottom:14 }}>
          <table style={{ width:"100%",borderCollapse:"collapse" }}>
            <thead><tr style={{ borderBottom:`2px solid ${C.border}` }}>
              {["Director","GPs","Leads","Closed","Conv.","AI Score","Adherence","Trend"].map(h=>(
                <th key={h} style={{ padding:"8px 10px",textAlign:"left",fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.04em" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>{TEAM_PERF_DATA.map((t,i)=>{
              const rCol=parseFloat(t.rate)>=7?C.green:parseFloat(t.rate)>=5?C.amber:C.red;
              const aCol=t.adherence>=65?C.green:t.adherence>=45?C.amber:C.red;
              const aiCol=t.aiAvg>=70?C.green:t.aiAvg>=60?C.amber:C.red;
              return (
                <tr key={t.vd} style={{ borderBottom:`1px solid ${C.border}`,background:i%2?"#FAFAFA":"#fff" }}>
                  <td style={{ padding:"10px" }}><div style={{ display:"flex",alignItems:"center",gap:7 }}><Avatar name={t.vd} size={24}/><span style={{ fontSize:12,fontWeight:700 }}>{t.vd.split(" ")[0]}</span></div></td>
                  <td style={{ padding:"10px",fontSize:11,color:C.slate,textAlign:"center" }}>{t.gps}</td>
                  <td style={{ padding:"10px",fontSize:12,fontWeight:600 }}>{t.leads.toLocaleString("de-DE")}</td>
                  <td style={{ padding:"10px",fontSize:12,fontWeight:700,color:C.green }}>{t.closed}</td>
                  <td style={{ padding:"10px" }}><span style={{ fontSize:12,fontWeight:800,color:rCol }}>{t.rate}</span></td>
                  <td style={{ padding:"10px" }}><div style={{ display:"flex",alignItems:"center",gap:5 }}><div style={{ width:40,height:5,borderRadius:2,background:"#F1F5F9" }}><div style={{ height:"100%",width:`${t.aiAvg}%`,background:aiCol,borderRadius:2 }}/></div><span style={{ fontSize:10,fontWeight:700,color:aiCol }}>{t.aiAvg}</span></div></td>
                  <td style={{ padding:"10px" }}><div style={{ display:"flex",alignItems:"center",gap:5 }}><div style={{ width:40,height:5,borderRadius:2,background:"#F1F5F9" }}><div style={{ height:"100%",width:`${t.adherence}%`,background:aCol,borderRadius:2 }}/></div><span style={{ fontSize:10,fontWeight:700,color:aCol }}>{t.adherence}%</span></div></td>
                  <td style={{ padding:"10px" }}><span style={{ fontSize:14 }}>{t.trend==="up"?"📈":t.trend==="down"?"📉":"➡️"}</span></td>
                </tr>
              );
            })}</tbody>
          </table>
        </Card>
        <div style={{ height:40 }}/>

        <SectionHeading id="campaign" label="Campaign ROI" />
        <Card style={{ padding:"18px 20px",marginBottom:14 }}>
          <table style={{ width:"100%",borderCollapse:"collapse" }}>
            <thead><tr style={{ borderBottom:`2px solid ${C.border}` }}>
              {["Campaign","Leads","Closed","Conv.","CPL","Revenue","ROI"].map(h=>(
                <th key={h} style={{ padding:"8px 10px",textAlign:"left",fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.04em" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>{CAMPAIGN_DATA.map((c,i)=>{
              const rCol=parseFloat(c.rate)>=7?C.green:parseFloat(c.rate)>=5?C.amber:C.red;
              const roiCol=parseFloat(c.roi)>=400?C.green:parseFloat(c.roi)>=100?C.amber:C.red;
              return (
                <tr key={c.name} style={{ borderBottom:`1px solid ${C.border}`,background:i%2?"#FAFAFA":"#fff" }}>
                  <td style={{ padding:"10px",fontSize:12,fontWeight:700 }}>{c.name}</td>
                  <td style={{ padding:"10px",fontSize:11,color:C.slate }}>{c.leads}</td>
                  <td style={{ padding:"10px",fontSize:11,fontWeight:700,color:C.green }}>{c.closed}</td>
                  <td style={{ padding:"10px" }}><span style={{ fontSize:11,fontWeight:800,color:rCol }}>{c.rate}</span></td>
                  <td style={{ padding:"10px",fontSize:11,color:C.slate }}>{c.cpl}</td>
                  <td style={{ padding:"10px",fontSize:11,fontWeight:700 }}>{c.revenue}</td>
                  <td style={{ padding:"10px" }}><span style={{ fontSize:12,fontWeight:800,color:roiCol }}>{c.roi}</span></td>
                </tr>
              );
            })}</tbody>
          </table>
          <div style={{ marginTop:10,padding:"10px 14px",borderRadius:8,background:C.red+"08",border:`1px solid ${C.red}20`,fontSize:11,color:C.slate }}>
            ⚠ <strong>Giveaway</strong>: €9.4K spend · 17% ROI · 2.1% conversion. Consider reallocating to Q1 Finanz or Partner Ref.
          </div>
        </Card>
        <div style={{ height:40 }}/>

        <SectionHeading id="script" label="Script Adherence" />
        <Card style={{ padding:"18px 20px",marginBottom:14 }}>
          {TEAM_PERF_DATA.map(t=>{
            const col=t.adherence>=65?C.green:t.adherence>=45?C.amber:C.red;
            return (
              <div key={t.vd} style={{ marginBottom:14 }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5 }}>
                  <div style={{ display:"flex",alignItems:"center",gap:8 }}><Avatar name={t.vd} size={22}/><span style={{ fontSize:12,fontWeight:700 }}>{t.vd.split(" ")[0]}'s team</span></div>
                  <span style={{ fontSize:13,fontWeight:800,color:col }}>{t.adherence}%</span>
                </div>
                <div style={{ height:9,borderRadius:4,background:"#F1F5F9" }}><div style={{ height:"100%",width:`${t.adherence}%`,background:col,borderRadius:4 }}/></div>
              </div>
            );
          })}
          <div style={{ padding:"10px 14px",borderRadius:8,background:C.amber+"08",border:`1px solid ${C.amber}20`,fontSize:12,color:C.slate }}>
            📉 Org adherence dropped 4pp this month. Jana Kruse team at 39% — critical. Coaching intervention recommended.
          </div>
        </Card>
        <div style={{ height:40 }}/>

        <SectionHeading id="adoption" label="AI Adoption" />
        <Card style={{ padding:"18px 20px" }}>
          {[
            {label:"Lead Scoring",    pct:100,note:"All leads auto-scored",        color:C.green},
            {label:"AI Call Script",  pct:72, note:"18/25 consultants this month", color:C.indigo},
            {label:"AI Call Logger",  pct:68, note:"Used on 68% of logged calls",  color:C.indigo},
            {label:"Call Analysis",   pct:41, note:"VoIP active",                  color:C.amber},
            {label:"AI Agent",        pct:55, note:"Active in lead drawers",       color:C.blue},
            {label:"Email Automation",pct:84, note:"3 active journeys running",    color:C.green},
          ].map(f=>(
            <div key={f.label} style={{ marginBottom:14 }}>
              <div style={{ display:"flex",justifyContent:"space-between",marginBottom:4 }}>
                <span style={{ fontSize:12,color:C.text }}>{f.label}</span>
                <span style={{ fontSize:12,fontWeight:700,color:f.color }}>{f.pct}%</span>
              </div>
              <div style={{ height:7,borderRadius:3,background:"#F1F5F9" }}><div style={{ height:"100%",width:`${f.pct}%`,background:f.color,borderRadius:3 }}/></div>
              <div style={{ fontSize:10,color:C.muted,marginTop:3 }}>{f.note}</div>
            </div>
          ))}
        </Card>
      </>)}
    </div>
  );
};

