import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Avatar } from "../ui/avatar";
import { C } from "../../theme";

export const GPDashboard = ({ navigateTo, gpChecks, setGpChecks }) => {
  const [period,   setPeriod]   = useState("week");
  const [todoTab,  setTodoTab]  = useState("open");
  const [calMonth, setCalMonth] = useState("Feb 2026");

  // ── KPIs ─────────────────────────────────────────────────────────────────
  const kpis = [
    { label:"My Contacts",      value:62,     unit:"",    delta:"+8 Week",  up:true,  sub:"active",          warn:false, good:false },
    { label:"Due Today",     value:5,      unit:"",    delta:"2 overdue",up:false,sub:"Calls",         warn:true,  good:false },
    { label:"Not Reached",   value:9,      unit:"",    delta:"−2 Week",  up:false, sub:"Attempt ≥3",     warn:false, good:false },
    { label:"Conversion",       value:"8,1",  unit:"%",   delta:"+0,3 pp",   up:true,  sub:"MTD",            warn:false, good:true  },
    { label:"AI Time Saved", value:47,     unit:"m",   delta:"today",     up:true,  sub:"via Agents",  warn:false, good:false },
  ];

  // ── Priority leads ────────────────────────────────────────────────────────
  const PRIORITY_LEADS = [
    { initials:"SR", name:"Sandra Richter",  status:"In Progress", sub:"Q1 Finanz · Call today 14:00",  attempts:1, score:92, av:"indigo"  },
    { initials:"PH", name:"Peter Hoffmann",  status:"Contact Attempted",sub:"Webinar March · 3rd attempt",     attempts:3, score:87, av:"blue"    },
    { initials:"HV", name:"Hanna Vogel",     status:"Open",           sub:"Meta Ads · first contact",attempts:0, score:68, av:"gold"    },
    { initials:"LD", name:"Lars Dietrich",   status:"In Progress",  sub:"Appointment · Thu 15:00",             attempts:2, score:84, av:"green"   },
    { initials:"CB", name:"Claudia Becker",  status:"Contact Attempted",sub:"Send follow-up email",             attempts:4, score:74, av:"purple"  },
  ];
  const avColors = { indigo:C.indigo, blue:C.blue, gold:C.amber, green:C.green, purple:C.purple };
  const statusColors = { "In Progress":C.blue, "Contact Attempted":C.amber, "Open":C.muted, "Erreicht":C.green };

  // ── Calendar events ───────────────────────────────────────────────────────
  const CAL_EVENTS = [
    { time:"14:00", name:"Sandra Richter",        sub:"Phone · Q1 Finanz",    color:C.indigo },
    { time:"15:30", name:"Lars Dietrich",          sub:"Video · Webinar March",   color:C.blue   },
    { time:"17:00", name:"Follow-up P. Hoffmann",sub:"Phone · Follow-up",   color:C.amber  },
  ];

  // ── Todo ──────────────────────────────────────────────────────────────────
  const TODOS = [
    { text:"Call Sandra Richter (Q1 Finanz)",            meta:"Attempt 1/5 · assigned 08:12", badge:"now",   done:false },
    { text:"3rd Attempt — Peter Hoffmann",                   meta:"Last attempt: Wed 14:00",       badge:"today", done:false },
    { text:"Follow-up email to Claudia Becker (Email Automation)",meta:"Draft ready",               badge:"today", done:false },
    { text:"Log morning call result — Müller",          meta:"Vion Coach prepared a note",badge:"over",  done:false },
    { text:"Update status — Lars Dietrich",          meta:"→ In Progress · 09:42",        badge:"done",  done:true  },
  ];
  const [todoChecks, setTodoChecks] = useState(TODOS.map(t=>t.done));
  const badgeColors = { now:C.indigo, today:C.amber, over:C.navy, done:C.green };
  const badgeLabel  = { now:"Now", today:"Today", over:"Overdue", done:"Done" };

  // ── Recent Activity ───────────────────────────────────────────────────────
  const ACTIVITY = [
    { icon:"📞", type:"call", title:"Call — Sandra Richter reached",  meta:"Status: In Progress · Versuch 1/5", time:"30m" },
    { icon:"📅", type:"cal",  title:"Appointment booked",                   meta:"Lars Dietrich · Thu 15:00 · Phone",   time:"1h"  },
    { icon:"✉️", type:"mail", title:"Follow-up email sent",              meta:"Claudia Becker · via Vion Nurture",    time:"2h"  },
    { icon:"🏆", type:"deal", title:"Closing €3,200",                 meta:"Michael Braun · Q1 Finanz",            time:"3h"  },
  ];
  const actColors = { call:C.green, cal:C.blue, mail:C.amber, deal:C.indigo };

  // ── Calendar grid ─────────────────────────────────────────────────────────
  const CAL_DAYS = [
    { d:26,muted:true },{ d:27,muted:true },{ d:28,muted:true },{ d:29,muted:true },{ d:30,muted:true },{ d:31,muted:true },{ d:1 },
    { d:2 },{ d:3,ev:true },{ d:4 },{ d:5,ev:true },{ d:6 },{ d:7 },{ d:8 },
    { d:9 },{ d:10,ev:true },{ d:11 },{ d:12,ev:true },{ d:13,ev:true },{ d:14 },{ d:15 },
    { d:16 },{ d:17,ev:true },{ d:18 },{ d:19 },{ d:20,ev:true },{ d:21 },{ d:22,today:true,ev:true },
    { d:23 },{ d:24,ev:true },{ d:25 },{ d:26 },{ d:27,ev:true },{ d:28 },{ d:1,muted:true },
  ];

  return (
    <div style={{ padding:"0 28px 48px",fontFamily:"Inter,system-ui,sans-serif" }}>

      {/* ── Page Head ────────────────────────────────────────────────────── */}
      <div style={{ padding:"28px 0 22px",display:"flex",alignItems:"flex-end",justifyContent:"space-between",gap:24 }}>
        <div>
          <h1 style={{ fontSize:36,fontWeight:400,letterSpacing:"-0.025em",color:C.text,margin:0 }}>
            Good morning, Anna<span style={{ color:C.indigo }}>.</span>
          </h1>
          <div style={{ marginTop:8,fontSize:11,color:C.muted,letterSpacing:"0.1em",textTransform:"uppercase",display:"flex",gap:0 }}>
            <span>Sonntag, 22. February 2026</span>
            <span style={{ margin:"0 10px",opacity:0.4 }}>·</span>
            <span>Munich-South · DE-82</span>
            <span style={{ margin:"0 10px",opacity:0.4 }}>·</span>
            <span>Q1 Quarter</span>
          </div>
        </div>
        <div style={{ display:"flex",gap:8 }}>
          {["Today","Week","Month","Quarter","YTD"].map(p=>(
            <button key={p} onClick={()=>setPeriod(p.toLowerCase())}
              style={{ padding:"7px 14px",borderRadius:8,border:`1px solid ${period===p.toLowerCase()?C.primary:C.border}`,
                background:period===p.toLowerCase()?C.primary:"#fff",color:period===p.toLowerCase()?"#fff":C.muted,
                fontSize:12,cursor:"pointer",fontFamily:"inherit" }}>{p}</button>
          ))}
        </div>
      </div>

      {/* ── KPI Strip ────────────────────────────────────────────────────── */}
      <div style={{ display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:14,marginBottom:22 }}>
        {kpis.map(k=>(
          <div key={k.label} style={{ background:"#fff",border:`1px solid ${C.border}`,borderRadius:14,padding:"18px 20px",position:"relative",overflow:"hidden" }}>
            <div style={{ fontSize:10,color:C.muted,fontWeight:600,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:12 }}>{k.label}</div>
            <div style={{ fontSize:42,fontWeight:400,letterSpacing:"-0.03em",lineHeight:1,color:k.warn?C.indigo:k.good?C.green:C.text }}>
              {k.value}<small style={{ fontSize:22,color:C.muted }}>{k.unit}</small>
            </div>
            <div style={{ marginTop:10,display:"flex",alignItems:"center",gap:10 }}>
              <span style={{ fontSize:10,fontFamily:"monospace",padding:"2px 7px",borderRadius:20,fontWeight:500,
                background:k.up?C.green+"15":C.indigo+"15",color:k.up?C.green:C.indigo }}>{k.delta}</span>
              <span style={{ fontSize:11,color:C.muted }}>{k.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── AI Scorer Banner ─────────────────────────────────────────────── */}
      <div style={{ marginBottom:22,background:C.primary,borderRadius:14,padding:"20px 24px",
        display:"flex",alignItems:"center",justifyContent:"space-between",position:"relative",overflow:"hidden" }}>
        <div style={{ position:"absolute",right:-40,top:-40,width:220,height:220,borderRadius:"50%",
          background:`radial-gradient(circle,${C.indigo} 0%,transparent 70%)`,opacity:0.25,pointerEvents:"none" }}/>
        <div style={{ display:"flex",alignItems:"center",gap:18,position:"relative",zIndex:1 }}>
          <div style={{ width:44,height:44,borderRadius:"50%",background:C.indigo,display:"grid",placeItems:"center",
            fontStyle:"italic",fontWeight:500,fontSize:22,color:"#fff",fontFamily:"Inter" }}>V</div>
          <div>
            <div style={{ fontSize:17,fontWeight:500,color:"#fff" }}>Vion <em>Scorer</em> — today's prioritisation</div>
            <div style={{ fontSize:12,color:"rgba(246,242,236,0.65)",marginTop:2 }}>62 leads scored · Criteria: Source, Time Window, Opt-In, History</div>
          </div>
        </div>
        <div style={{ display:"flex",gap:10,position:"relative",zIndex:1 }}>
          {[["hot",C.indigo,"3","Hot"],["warm",C.amber,"11","Warm"],["cold","#93C5FD","48","Cold"]].map(([k,col,num,lbl])=>(
            <div key={k} style={{ padding:"8px 14px",borderRadius:20,background:"rgba(246,242,236,0.08)",
              border:"1px solid rgba(246,242,236,0.18)",fontSize:12,color:"#fff",display:"flex",alignItems:"center",gap:8 }}>
              <span style={{ width:7,height:7,borderRadius:"50%",background:col,display:"inline-block" }}/>
              <strong style={{ fontSize:14,fontWeight:500 }}>{num}</strong> {lbl}
            </div>
          ))}
        </div>
      </div>

      {/* ── Main Grid: Monthly + Calendar + Tasks ────────────────────────── */}
      <div style={{ display:"grid",gridTemplateColumns:"2fr 1.1fr 1.1fr",gap:16,marginBottom:18 }}>

        {/* Monthly overview */}
        <div style={{ background:"#fff",border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden" }}>
          <div style={{ padding:"18px 22px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${C.border}` }}>
            <div style={{ fontSize:20,fontWeight:500,letterSpacing:"-0.015em",color:C.text }}>
              February <em style={{ color:C.indigo,fontWeight:400 }}>at a Glance</em>
            </div>
            <button onClick={()=>navigateTo("Reports")} style={{ padding:"5px 12px",borderRadius:7,border:`1px solid ${C.border}`,background:"#fff",color:C.blue,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>Full Report →</button>
          </div>
          <div style={{ padding:"18px 22px 22px" }}>
            {/* Gauge */}
            <div style={{ display:"flex",flexDirection:"column",alignItems:"center",padding:"8px 0 4px" }}>
              <svg viewBox="0 0 180 100" width="180" height="100">
                <path d="M 14 90 A 76 76 0 0 1 166 90" fill="none" stroke="#F2F4F7" strokeWidth="14" strokeLinecap="round"/>
                <path d="M 14 90 A 76 76 0 0 1 166 90" fill="none" stroke={C.indigo} strokeWidth="14" strokeLinecap="round"
                  strokeDasharray="238.76" strokeDashoffset="85.95"/>
                <text x="90" y="88" textAnchor="middle" fontSize="34" fontFamily="Inter" fill={C.text} fontWeight="400">64</text>
                <text x="118" y="86" textAnchor="start" fontSize="14" fontFamily="Inter" fill={C.muted}>%</text>
              </svg>
              <div style={{ fontSize:10,color:C.muted,letterSpacing:"0.12em",textTransform:"uppercase",marginTop:-4 }}>Quota Reached</div>
            </div>
            {/* Progress bars */}
            {[["Appointments","9 / 15",60,C.purple],["Closings","5 / 8",62,C.amber],["New Contacts","14 / 20",70,C.green]].map(([lbl,val,pct,col])=>(
              <div key={lbl} style={{ marginBottom:12 }}>
                <div style={{ display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:5,color:C.text }}>
                  <span>{lbl}</span><span style={{ fontFamily:"monospace",color:C.muted }}>{val}</span>
                </div>
                <div style={{ height:6,background:"#F2F4F7",borderRadius:3,overflow:"hidden" }}>
                  <div style={{ height:"100%",width:`${pct}%`,background:col,borderRadius:3 }}/>
                </div>
              </div>
            ))}
            <div style={{ display:"flex",justifyContent:"space-between",marginTop:14,paddingTop:12,borderTop:`1px dashed ${C.border}`,fontSize:11,color:C.muted }}>
              <span>Daily pace <strong style={{ color:C.green,fontSize:14 }}>+2 ahead</strong></span>
              <span>Forecast end of Feb: <strong style={{ color:C.text }}>91%</strong></span>
            </div>
          </div>
        </div>

        {/* Calendar */}
        <div style={{ background:"#fff",border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden" }}>
          <div style={{ padding:"18px 22px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${C.border}` }}>
            <div style={{ fontSize:20,fontWeight:500,color:C.text }}>Calendar</div>
            <span style={{ fontSize:12,color:C.green,cursor:"pointer",fontWeight:600 }}>Sync ●</span>
          </div>
          <div style={{ padding:"14px 18px 18px" }}>
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10 }}>
              <div style={{ fontSize:17,fontWeight:500,color:C.text }}>February 2026</div>
              <div style={{ display:"flex",gap:4 }}>
                <button style={{ width:24,height:24,borderRadius:5,border:`1px solid ${C.border}`,background:"#fff",color:C.muted,cursor:"pointer",fontSize:12 }}>‹</button>
                <button style={{ width:24,height:24,borderRadius:5,border:`1px solid ${C.border}`,background:"#fff",color:C.muted,cursor:"pointer",fontSize:12 }}>›</button>
              </div>
            </div>
            {/* Cal grid */}
            <div style={{ display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,fontFamily:"monospace",fontSize:10 }}>
              {["M","D","M","D","F","S","S"].map((d,i)=>(
                <div key={i} style={{ textAlign:"center",color:C.muted,padding:"4px 0",fontSize:9,letterSpacing:"0.06em" }}>{d}</div>
              ))}
              {CAL_DAYS.map((day,i)=>(
                <div key={i} style={{ textAlign:"center",padding:"6px 0",borderRadius:5,cursor:"pointer",position:"relative",
                  background:day.today?C.primary:day.muted?"transparent":"transparent",
                  color:day.today?"#fff":day.muted?C.muted:C.text,opacity:day.muted?0.5:1,
                  fontSize:11,fontWeight:day.today?600:400 }}>
                  {day.d}
                  {day.ev && <span style={{ position:"absolute",left:"50%",bottom:2,transform:"translateX(-50%)",width:4,height:4,borderRadius:"50%",background:day.today?"#fff":C.indigo,display:"block" }}/>}
                </div>
              ))}
            </div>
            {/* Events */}
            <div style={{ marginTop:12,paddingTop:12,borderTop:`1px dashed ${C.border}` }}>
              {CAL_EVENTS.map((ev,i)=>(
                <div key={i} style={{ display:"flex",gap:10,padding:"8px 0",borderBottom:i<CAL_EVENTS.length-1?`1px solid ${C.border}`:"none" }}>
                  <div style={{ fontFamily:"monospace",fontSize:11,color:C.muted,width:40,flexShrink:0,paddingTop:1 }}>{ev.time}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13,fontWeight:500,color:C.text }}>{ev.name}</div>
                    <div style={{ fontSize:11,color:C.muted,marginTop:2,display:"flex",alignItems:"center",gap:6 }}>
                      <span style={{ width:5,height:5,borderRadius:"50%",background:ev.color,display:"inline-block" }}/>
                      {ev.sub}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tasks (Tasks Today) */}
        <div style={{ background:"#fff",border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden" }}>
          <div style={{ padding:"18px 22px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${C.border}` }}>
            <div style={{ fontSize:20,fontWeight:500,color:C.text }}>Tasks <em style={{ color:C.indigo,fontWeight:400 }}>Today</em></div>
            <div style={{ display:"flex",gap:4 }}>
              {["All","Open","Done"].map(t=>(
                <button key={t} onClick={()=>setTodoTab(t.toLowerCase())}
                  style={{ padding:"4px 8px",borderRadius:4,border:`1px solid ${todoTab===t.toLowerCase()?C.border:"transparent"}`,
                    background:todoTab===t.toLowerCase()?"#F2F4F7":"transparent",
                    color:todoTab===t.toLowerCase()?C.text:C.muted,fontSize:10,fontFamily:"monospace",cursor:"pointer",
                    letterSpacing:"0.08em",textTransform:"uppercase" }}>{t}</button>
              ))}
            </div>
          </div>
          <div style={{ padding:"14px 18px 18px",display:"flex",flexDirection:"column",gap:8 }}>
            {TODOS.filter(t=>{
              const done = todoChecks[TODOS.indexOf(t)];
              if(todoTab==="offen") return !done;
              if(todoTab==="erledigt") return done;
              return true;
            }).map((t,idx)=>{
              const i = TODOS.indexOf(t);
              const done = todoChecks[i];
              return (
                <div key={i} style={{ display:"flex",alignItems:"flex-start",gap:10,padding:"10px 12px",
                  border:`1px solid ${done?C.green+"30":t.badge==="over"?C.red+"25":C.border}`,borderRadius:9,
                  background:done?C.green+"05":t.badge==="over"?C.red+"03":"#F8FAFC",cursor:"pointer" }}
                  onClick={()=>setTodoChecks(prev=>prev.map((c,j)=>j===i?!c:c))}>
                  <div style={{ width:18,height:18,borderRadius:4,border:`1.5px solid ${done?C.green:C.muted}`,
                    background:done?C.green:"transparent",display:"grid",placeItems:"center",fontSize:9,color:"#fff",flexShrink:0,marginTop:1 }}>
                    {done?"✓":""}
                  </div>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ fontSize:13,color:done?C.muted:C.text,textDecoration:done?"line-through":"none",lineHeight:1.3 }}>{t.text}</div>
                    <div style={{ fontSize:10,color:C.muted,marginTop:3 }}>{t.meta}</div>
                  </div>
                  <span style={{ fontSize:9,fontFamily:"monospace",padding:"2px 7px",borderRadius:20,fontWeight:500,flexShrink:0,
                    background:badgeColors[t.badge]+"15",color:badgeColors[t.badge] }}>
                    {badgeLabel[t.badge]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Second Row: Priority Contacts + Right Column ─────────────────────── */}
      <div style={{ display:"grid",gridTemplateColumns:"1.7fr 1fr",gap:16 }}>

        {/* Priority Contacts */}
        <div style={{ background:"#fff",border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden" }}>
          <div style={{ padding:"18px 22px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${C.border}` }}>
            <div style={{ fontSize:20,fontWeight:500,color:C.text }}>
              Priority Contacts
              <span style={{ fontFamily:"monospace",fontSize:9,letterSpacing:"0.14em",textTransform:"uppercase",color:C.indigo,
                marginLeft:10,padding:"3px 7px",background:C.indigo+"15",borderRadius:4 }}>Vion Scorer</span>
            </div>
            <button onClick={()=>navigateTo("Leads")} style={{ padding:"5px 12px",borderRadius:7,border:`1px solid ${C.border}`,background:"#fff",color:C.blue,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>All Contacts →</button>
          </div>
          <div style={{ padding:"8px 22px 16px" }}>
            {PRIORITY_LEADS.map((lead,i)=>(
              <div key={i} style={{ display:"grid",gridTemplateColumns:"38px 1fr auto auto auto",gap:12,alignItems:"center",
                padding:"12px 0",borderBottom:i<PRIORITY_LEADS.length-1?`1px solid ${C.border}`:"none" }}>
                {/* Avatar */}
                <div style={{ width:38,height:38,borderRadius:"50%",background:avColors[lead.av],
                  display:"grid",placeItems:"center",fontSize:13,fontWeight:500,color:"#fff" }}>{lead.initials}</div>
                {/* Info */}
                <div>
                  <div style={{ fontSize:14,fontWeight:500,color:C.text }}>{lead.name}</div>
                  <div style={{ fontSize:11,color:C.muted,marginTop:2,display:"flex",alignItems:"center",gap:6 }}>
                    <span style={{ fontFamily:"monospace",fontSize:9,padding:"2px 6px",borderRadius:3,fontWeight:500,
                      background:(statusColors[lead.status]||C.muted)+"15",color:statusColors[lead.status]||C.muted }}>
                      {lead.status}
                    </span>
                    <span>{lead.sub}</span>
                  </div>
                </div>
                {/* Attempt dots */}
                <div style={{ display:"flex",gap:3,alignItems:"center" }}>
                  {Array.from({length:5}).map((_,di)=>(
                    <span key={di} style={{ width:7,height:7,borderRadius:"50%",display:"inline-block",
                      background:di<lead.attempts?(di===lead.attempts-1&&lead.attempts>=3?C.red:C.primary):"#F2F4F7",
                      border:`1px solid ${di<lead.attempts?"transparent":C.border}` }}/>
                  ))}
                  <span style={{ fontFamily:"monospace",fontSize:9,color:C.muted,marginLeft:5 }}>{lead.attempts}/5</span>
                </div>
                {/* Score */}
                <div style={{ display:"flex",flexDirection:"column",alignItems:"center",padding:"0 8px" }}>
                  <div style={{ fontSize:18,fontWeight:500,color:C.text }}>{lead.score}</div>
                  <div style={{ width:32,height:3,background:"#F2F4F7",borderRadius:2,marginTop:3,overflow:"hidden" }}>
                    <div style={{ height:"100%",width:`${lead.score}%`,background:lead.score>=80?C.indigo:lead.score>=70?C.amber:C.blue,borderRadius:2 }}/>
                  </div>
                </div>
                {/* Open button */}
                <button onClick={()=>navigateTo("Leads")}
                  style={{ padding:"5px 10px",background:C.primary,color:"#fff",border:"none",borderRadius:5,
                    fontSize:9,fontFamily:"monospace",letterSpacing:"0.12em",textTransform:"uppercase",cursor:"pointer",fontWeight:500 }}>
                  Open
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div style={{ display:"flex",flexDirection:"column",gap:16 }}>

          {/* AI Coach */}
          <div style={{ background:"linear-gradient(180deg,#F9FAFB 0%,#fff 100%)",border:`1px solid ${C.amber}`,borderRadius:14,overflow:"hidden" }}>
            <div style={{ padding:"16px 20px 12px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${C.amber}30` }}>
              <div style={{ fontSize:18,fontWeight:500,color:C.text }}>
                Vion <em style={{ color:C.indigo,fontWeight:400 }}>Coach</em>
                <span style={{ fontFamily:"monospace",fontSize:9,letterSpacing:"0.14em",textTransform:"uppercase",
                  marginLeft:10,padding:"2px 6px",background:C.amber+"20",borderRadius:4,color:C.amber,fontWeight:500 }}>Insight</span>
              </div>
            </div>
            <div style={{ padding:"16px 20px 18px" }}>
              <div style={{ fontStyle:"italic",fontSize:16,lineHeight:1.4,color:C.text,padding:"6px 0 12px",position:"relative" }}>
                <span style={{ position:"absolute",left:-6,top:-4,fontSize:36,color:C.amber,lineHeight:1 }}>"</span>
                Your conversion rate is highest between 10–11am. Schedule hot leads in this slot.
              </div>
              <div style={{ fontFamily:"monospace",fontSize:10,letterSpacing:"0.1em",textTransform:"uppercase",color:C.muted }}>
                Based on <strong style={{ color:C.amber }}>48 Callsn</strong> · last 30 days
              </div>
              <button style={{ marginTop:12,display:"inline-flex",alignItems:"center",gap:6,padding:"7px 12px",
                background:C.primary,color:"#fff",border:"none",borderRadius:6,cursor:"pointer",
                fontFamily:"monospace",fontSize:10,letterSpacing:"0.1em",textTransform:"uppercase",fontWeight:500 }}>
                Block slot →
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div style={{ background:"#fff",border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden" }}>
            <div style={{ padding:"16px 20px 12px",borderBottom:`1px solid ${C.border}` }}>
              <div style={{ fontSize:18,fontWeight:500,color:C.text }}>Recent Activity</div>
            </div>
            <div style={{ padding:"12px 18px 16px",display:"flex",flexDirection:"column",gap:12 }}>
              {ACTIVITY.map((a,i)=>(
                <div key={i} style={{ display:"flex",gap:10 }}>
                  <div style={{ width:30,height:30,borderRadius:"50%",background:actColors[a.type]+"15",
                    display:"grid",placeItems:"center",fontSize:13,flexShrink:0 }}>{a.icon}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13,fontWeight:500,color:C.text }}>{a.title}</div>
                    <div style={{ fontSize:11,color:C.muted,marginTop:2 }}>{a.meta}</div>
                  </div>
                  <div style={{ fontFamily:"monospace",fontSize:10,color:C.muted,flexShrink:0 }}>{a.time}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Education */}
          <div style={{ background:"#fff",border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden" }}>
            <div style={{ padding:"16px 20px 12px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${C.border}` }}>
              <div style={{ fontSize:18,fontWeight:500,color:C.text }}>Academy</div>
              <span onClick={()=>navigateTo("Education")} style={{ fontSize:12,color:C.muted,cursor:"pointer" }}>All →</span>
            </div>
            <div style={{ padding:"8px 18px 12px" }}>
              {[{bg:C.navy,icon:"▶",title:"Top Companies Strategy",meta:"16 min · Finance",prog:"60%"},
                {bg:C.amber,icon:"▶",title:"Gold Investment Basics",meta:"9 min · Intro",prog:"100%"},
                {bg:C.indigo,icon:"▶",title:"Objection Handling",meta:"22 min · Sales",prog:"0%"}].map((e,i)=>(
                <div key={i} style={{ display:"flex",gap:10,padding:"10px 0",borderBottom:i<2?`1px solid ${C.border}`:"none",alignItems:"center" }}>
                  <div style={{ width:38,height:38,borderRadius:7,background:e.bg,color:"#fff",display:"grid",placeItems:"center",fontSize:12,flexShrink:0 }}>{e.icon}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13,fontWeight:500,color:C.text }}>{e.title}</div>
                    <div style={{ fontSize:11,color:C.muted,marginTop:2 }}>{e.meta}</div>
                  </div>
                  <div style={{ fontFamily:"monospace",fontSize:11,color:C.muted }}>{e.prog}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SALES DIRECTOR DASHBOARD (VD — based on 02_director design)
// ─────────────────────────────────────────────────────────────────────────────
