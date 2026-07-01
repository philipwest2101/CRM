import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Avatar } from "../ui/avatar";
import { BarChart } from "../ui/bar-chart";
import { SectionTitle } from "../ui/section-title";
import { SettingsCard } from "../ui/settings-card";
import { StatusBadge } from "../ui/status-badge";
import { EVENTS_LIST, EVENTS_MONTHLY, EVENTS_REGISTRANTS } from "../../lib/core";
import { C } from "../../theme";

export const EventsPage = ({ role, navigateTo }) => {
  const [selectedEvent,    setSelectedEvent]    = useState(null);
  const [selectedDate,     setSelectedDate]     = useState(null);
  const [filterType,       setFilterType]       = useState("All");
  const [filterStatus,     setFilterStatus]     = useState("All");
  const [regSearch,        setRegSearch]        = useState("");

  const eventTypes  = ["All", "Business Opening", "Investment Talk", "Others"];
  const statusTypes = ["All", "upcoming", "past"];

  const allDates = EVENTS_LIST.flatMap(ev =>
    ev.dates.map(d => ({ ...d, eventName: ev.name, eventColor: ev.color, eventIcon: ev.icon, eventType: ev.type }))
  );

  const filteredEvents = EVENTS_LIST.filter(ev =>
    (filterType === "All" || ev.type === filterType)
  );

  const totalRegistrants = EVENTS_LIST.reduce((a, ev) =>
    a + ev.dates.reduce((b, d) => b + d.present + d.absent + d.unspecified, 0), 0);
  const totalPresent = EVENTS_LIST.reduce((a, ev) =>
    a + ev.dates.reduce((b, d) => b + d.present, 0), 0);
  const upcomingCount = allDates.filter(d => d.status === "upcoming").length;
  const showRate = Math.round(totalPresent / (totalRegistrants - EVENTS_LIST.reduce((a,ev)=>a+ev.dates.reduce((b,d)=>b+d.unspecified,0),0)) * 100);

  // registrants for selected session
  const sessionRegs = selectedDate ? (EVENTS_REGISTRANTS[selectedDate.id] || []) : [];
  const filteredRegs = sessionRegs.filter(r =>
    !regSearch || r.name.toLowerCase().includes(regSearch.toLowerCase()) || r.gp.toLowerCase().includes(regSearch.toLowerCase())
  );


  const FillBar = ({ present, absent, unspecified, capacity }) => {
    const total = present + absent + unspecified;
    const pct = Math.round(total / capacity * 100);
    return (
      <div>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
          <span style={{ fontSize:10, color:C.muted }}>{total}/{capacity} registered</span>
          <span style={{ fontSize:10, fontWeight:700, color: pct>=80?C.green:pct>=50?C.amber:C.red }}>{pct}%</span>
        </div>
        <div style={{ height:6, borderRadius:3, background:"#F1F5F9", overflow:"hidden", display:"flex" }}>
          <div style={{ width:`${Math.round(present/capacity*100)}%`,  background:C.green,  transition:"width 0.4s" }}/>
          <div style={{ width:`${Math.round(absent/capacity*100)}%`,   background:C.red,    transition:"width 0.4s" }}/>
          <div style={{ width:`${Math.round(unspecified/capacity*100)}%`, background:C.amber, transition:"width 0.4s" }}/>
        </div>
        <div style={{ display:"flex", gap:10, marginTop:4 }}>
          {[[C.green,"Present",present],[C.red,"Absent",absent],[C.amber,"Registered",unspecified]].map(([c,l,v])=>(
            <div key={l} style={{ display:"flex", alignItems:"center", gap:3 }}>
              <div style={{ width:7, height:7, borderRadius:2, background:c }}/>
              <span style={{ fontSize:9, color:C.muted }}>{l}: <strong style={{ color:C.text }}>{v}</strong></span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding:"24px 28px" }}>
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24 }}>
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:C.muted, letterSpacing:"0.07em", textTransform:"uppercase", marginBottom:4 }}>
            <span onClick={()=>navigateTo("Dashboard")} style={{ cursor:"pointer", color:C.blue }}>Dashboard</span>
            <span style={{ margin:"0 6px", color:C.border }}>›</span>Events & Registrants
          </div>
          <h1 style={{ margin:0, fontSize:26, fontWeight:800, color:C.navy, letterSpacing:"-0.02em" }}>Events & Registrants</h1>
          <p style={{ margin:"4px 0 0", fontSize:13, color:C.slate }}>Manage event sessions, track registrations, and monitor attendance across all event types.</p>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button style={{ padding:"8px 16px", borderRadius:8, border:`1px solid ${C.border}`, background:"#fff", color:C.slate, fontSize:12, fontWeight:600, cursor:"pointer" }}>⬇ Export</button>
          <button style={{ padding:"8px 16px", borderRadius:8, border:"none", background:C.primary, color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer" }}>+ New Event</button>
        </div>
      </div>

      {/* KPI strip */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:22 }}>
        {[
          { label:"Total Registrants", value:totalRegistrants, sub:"Across all events & sessions",     color:C.indigo, icon:"📋" },
          { label:"Total Present",     value:totalPresent,     sub:`Show rate: ${showRate}%`,           color:C.green,  icon:"✅" },
          { label:"Upcoming Sessions", value:upcomingCount,    sub:"Next 60 days",                     color:C.blue,   icon:"📅" },
          { label:"Active Event Types",value:EVENTS_LIST.length,sub:"Business Opening, Inv. Talk +2", color:C.amber,  icon:"🗂" },
        ].map(k=>(
          <SettingsCard key={k.label} style={{ padding:"16px 20px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
              <span style={{ fontSize:20 }}>{k.icon}</span>
              <span style={{ fontSize:10, color:C.green, fontWeight:700 }}>↑ MTD</span>
            </div>
            <div style={{ fontSize:24, fontWeight:800, color:k.color, marginBottom:3 }}>{k.value}</div>
            <div style={{ fontSize:11, fontWeight:600, color:C.text, marginBottom:2 }}>{k.label}</div>
            <div style={{ fontSize:10, color:C.muted }}>{k.sub}</div>
          </SettingsCard>
        ))}
      </div>

      {/* Main layout */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 340px", gap:16 }}>
        {/* Left: events + sessions */}
        <div>
          {/* Filters */}
          <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap", alignItems:"center" }}>
            <div style={{ display:"flex", gap:5 }}>
              {eventTypes.map(t=>(
                <button key={t} onClick={()=>setFilterType(t)} style={{
                  padding:"5px 13px", borderRadius:20, border:`1.5px solid ${filterType===t?C.primary:C.border}`,
                  background:filterType===t?C.primary:"#fff", color:filterType===t?"#fff":C.slate,
                  fontSize:11, fontWeight:filterType===t?700:400, cursor:"pointer", fontFamily:"inherit",
                }}>{t}</button>
              ))}
            </div>
            <div style={{ width:1, height:20, background:C.border, margin:"0 4px" }}/>
            {statusTypes.map(s=>(
              <button key={s} onClick={()=>setFilterStatus(s)} style={{
                padding:"5px 13px", borderRadius:20, border:`1.5px solid ${filterStatus===s?C.indigo:C.border}`,
                background:filterStatus===s?C.indigo+"12":"#fff", color:filterStatus===s?C.indigo:C.slate,
                fontSize:11, fontWeight:filterStatus===s?700:400, cursor:"pointer", fontFamily:"inherit",
              }}>{s==="All"?"All status":s.charAt(0).toUpperCase()+s.slice(1)}</button>
            ))}
          </div>

          {/* Event cards */}
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {filteredEvents.map(ev=>(
              <SettingsCard key={ev.id} style={{ overflow:"visible" }}>
                {/* Event header */}
                <div style={{ padding:"16px 20px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:12 }}>
                  <div style={{ width:42, height:42, borderRadius:10, background:ev.color+"18", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>{ev.icon}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:14, fontWeight:800, color:C.text }}>{ev.name}</div>
                    <div style={{ fontSize:11, color:C.muted, marginTop:1 }}>{ev.description.slice(0,90)}…</div>
                  </div>
                  <div style={{ display:"flex", gap:16, textAlign:"center", flexShrink:0 }}>
                    <div><div style={{ fontSize:16, fontWeight:800, color:C.slate }}>Jan</div><div style={{ fontSize:20, fontWeight:800, color:ev.color }}>{ev.jan}</div></div>
                    <div><div style={{ fontSize:16, fontWeight:800, color:C.slate }}>Feb</div><div style={{ fontSize:20, fontWeight:800, color:ev.color }}>{ev.feb}</div></div>
                  </div>
                </div>

                {/* Session rows */}
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead>
                    <tr style={{ background:"#F8FAFC", borderBottom:`1px solid ${C.border}` }}>
                      {["Date","Time","Location","Present","Absent","Registered","Capacity Fill","Status",""].map(h=>(
                        <th key={h} style={{ padding:"8px 12px", textAlign:"left", fontSize:9, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.04em", whiteSpace:"nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ev.dates
                      .filter(d => filterStatus==="All" || d.status===filterStatus)
                      .map((d,i)=>{
                        const isActive = selectedDate?.id === d.id;
                        const total = d.present + d.absent + d.unspecified;
                        const fillPct = Math.round(total/d.capacity*100);
                        const hasRegs = !!(EVENTS_REGISTRANTS[d.id]);
                        return (
                          <tr key={d.id} style={{ borderBottom:`1px solid ${C.border}`, background:isActive?ev.color+"08":"#fff", cursor:"pointer" }}
                            onClick={()=>{ setSelectedDate(isActive ? null : d); setSelectedEvent(ev); setRegSearch(""); }}>
                            <td style={{ padding:"11px 12px", fontWeight:700, fontSize:12, color:C.text, whiteSpace:"nowrap" }}>{d.label}</td>
                            <td style={{ padding:"11px 12px", fontSize:11, color:C.muted, whiteSpace:"nowrap" }}>{d.time}</td>
                            <td style={{ padding:"11px 12px", fontSize:11, color:C.slate, maxWidth:180, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{d.location}</td>
                            <td style={{ padding:"11px 12px", fontWeight:700, fontSize:12, color:C.green }}>{d.status==="upcoming"?"—":d.present}</td>
                            <td style={{ padding:"11px 12px", fontWeight:700, fontSize:12, color:d.absent>0?C.red:C.muted }}>{d.status==="upcoming"?"—":d.absent}</td>
                            <td style={{ padding:"11px 12px", fontWeight:700, fontSize:12, color:C.amber }}>{d.unspecified}</td>
                            <td style={{ padding:"11px 12px", minWidth:100 }}>
                              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                                <div style={{ flex:1, height:5, borderRadius:3, background:"#F1F5F9", overflow:"hidden" }}>
                                  <div style={{ height:"100%", width:`${fillPct}%`, background:fillPct>=80?C.green:fillPct>=50?C.amber:C.red, borderRadius:3 }}/>
                                </div>
                                <span style={{ fontSize:10, fontWeight:700, color:fillPct>=80?C.green:fillPct>=50?C.amber:C.red, width:28, textAlign:"right", flexShrink:0 }}>{fillPct}%</span>
                              </div>
                            </td>
                            <td style={{ padding:"11px 12px" }}><StatusBadge status={d.status}/></td>
                            <td style={{ padding:"11px 12px" }}>
                              <button style={{ padding:"4px 9px", borderRadius:6, border:"none",
                                background:isActive?ev.color:hasRegs?C.primary+"10":"#F1F5F9",
                                color:isActive?"#fff":hasRegs?C.navy:C.muted,
                                fontSize:10, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap" }}>
                                {isActive?"▲ Hide":"👥 Registrants"}
                              </button>
                            </td>
                          </tr>
                        );
                    })}
                  </tbody>
                </table>

                {/* Inline registrants panel */}
                {selectedDate && selectedDate.id.startsWith(ev.id) && (
                  <div style={{ borderTop:`2px solid ${ev.color}30`, background:ev.color+"04", padding:"16px 20px" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                      <div>
                        <div style={{ fontSize:12, fontWeight:700, color:C.text }}>
                          Registrants — {selectedDate.label}
                          <span style={{ fontSize:11, color:C.muted, fontWeight:400, marginLeft:8 }}>
                            {filteredRegs.length} {regSearch ? "matching" : "total"}
                          </span>
                        </div>
                        {selectedDate.status==="past" && (
                          <FillBar present={selectedDate.present} absent={selectedDate.absent} unspecified={selectedDate.unspecified} capacity={selectedDate.capacity}/>
                        )}
                      </div>
                      <div style={{ display:"flex", gap:8 }}>
                        <input value={regSearch} onChange={e=>setRegSearch(e.target.value)}
                          placeholder="Search name or GP…"
                          style={{ padding:"5px 10px", borderRadius:7, border:`1px solid ${C.border}`, fontSize:11, fontFamily:"inherit", width:180 }}/>
                        <button style={{ padding:"5px 12px", borderRadius:7, border:`1px solid ${C.border}`, background:"#fff", color:C.slate, fontSize:11, cursor:"pointer" }}>⬇ Export</button>
                      </div>
                    </div>
                    {filteredRegs.length > 0 ? (
                      <table style={{ width:"100%", borderCollapse:"collapse" }}>
                        <thead>
                          <tr style={{ borderBottom:`2px solid ${C.border}` }}>
                            {["Contact","Advisor","Director","Campaign","Registered","Status"].map(h=>(
                              <th key={h} style={{ padding:"7px 10px", textAlign:"left", fontSize:10, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.04em" }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredRegs.map((r,i)=>(
                            <tr key={i} style={{ borderBottom:`1px solid ${C.border}`, background:i%2===0?"#fff":"#FAFAFA" }}>
                              <td style={{ padding:"9px 10px" }}>
                                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                                  <Avatar name={r.name} size={24}/>
                                  <span style={{ fontSize:12, fontWeight:600, color:C.text }}>{r.name}</span>
                                </div>
                              </td>
                              <td style={{ padding:"9px 10px" }}>
                                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                                  <Avatar name={r.gp} size={20}/>
                                  <span style={{ fontSize:11, color:C.slate }}>{r.gp}</span>
                                </div>
                              </td>
                              <td style={{ padding:"9px 10px", fontSize:11, color:C.muted }}>{r.vd}</td>
                              <td style={{ padding:"9px 10px" }}><span style={{ fontSize:10, padding:"2px 7px", borderRadius:8, background:C.indigo+"10", color:C.indigo, fontWeight:600 }}>{r.campaign}</span></td>
                              <td style={{ padding:"9px 10px", fontSize:11, color:C.muted }}>{r.registered}</td>
                              <td style={{ padding:"9px 10px" }}><StatusBadge status={r.status}/></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div style={{ textAlign:"center", padding:"20px", color:C.muted, fontSize:12 }}>
                        {regSearch ? "No registrants match your search." : "Registrant data will appear after the event."}
                      </div>
                    )}
                  </div>
                )}
              </SettingsCard>
            ))}
          </div>
        </div>

        {/* Right sidebar */}
        <div style={{ display:"flex", flexDirection:"column", gap:14, alignSelf:"flex-start", position:"sticky", top:24 }}>
          {/* Monthly trend */}
          <SettingsCard style={{ padding:"18px 20px" }}>
            <SectionTitle>Monthly Registrations</SectionTitle>
            <BarChart data={EVENTS_MONTHLY.map(m=>({l:m.month,v:m.registrants}))} color={C.indigo} height={80}/>
            <div style={{ marginTop:8, display:"flex", justifyContent:"space-between", fontSize:11, color:C.muted }}>
              <span>Aug 2025 – Feb 2026</span>
              <span style={{ color:C.green, fontWeight:700 }}>↑ +61% vs Jan</span>
            </div>
          </SettingsCard>

          {/* Show rate by event */}
          <SettingsCard style={{ padding:"18px 20px" }}>
            <SectionTitle>Show Rate by Event</SectionTitle>
            {EVENTS_LIST.map(ev=>{
              const allPresent = ev.dates.filter(d=>d.status==="past").reduce((a,d)=>a+d.present,0);
              const allTotal   = ev.dates.filter(d=>d.status==="past").reduce((a,d)=>a+d.present+d.absent,0);
              const rate = allTotal > 0 ? Math.round(allPresent/allTotal*100) : 0;
              return (
                <div key={ev.id} style={{ marginBottom:14 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:5 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <span style={{ fontSize:14 }}>{ev.icon}</span>
                      <span style={{ fontSize:11, fontWeight:600, color:C.text }}>{ev.name}</span>
                    </div>
                    <span style={{ fontSize:13, fontWeight:800, color:rate>=80?C.green:rate>=60?C.amber:C.red }}>{rate}%</span>
                  </div>
                  <div style={{ height:7, borderRadius:4, background:"#F1F5F9", overflow:"hidden" }}>
                    <div style={{ height:"100%", width:`${rate}%`, background:ev.color, borderRadius:4, transition:"width 0.4s" }}/>
                  </div>
                  <div style={{ display:"flex", justifyContent:"space-between", marginTop:3, fontSize:10, color:C.muted }}>
                    <span>{allPresent} present</span>
                    <span>{allTotal} attended</span>
                  </div>
                </div>
              );
            })}
          </SettingsCard>

          {/* Upcoming events mini list */}
          <SettingsCard style={{ padding:"18px 20px" }}>
            <SectionTitle>Upcoming Sessions</SectionTitle>
            {allDates.filter(d=>d.status==="upcoming").map((d,i, arr)=>(
              <div key={d.id} style={{ display:"flex", gap:10, padding:"10px 0", borderBottom:i<arr.length-1?`1px solid ${C.border}`:"none", alignItems:"flex-start" }}>
                <div style={{ width:36, height:36, borderRadius:9, background:d.eventColor+"18", display:"flex", alignItems:"center", justifyContent:"center", fontSize:17, flexShrink:0 }}>{d.eventIcon}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:C.text, marginBottom:2 }}>{d.eventName}</div>
                  <div style={{ fontSize:10, color:C.muted }}>📅 {d.label}</div>
                  <div style={{ fontSize:10, color:C.muted }}>🕐 {d.time}</div>
                  <div style={{ marginTop:5 }}>
                    <span style={{ fontSize:9, fontWeight:700, padding:"2px 7px", borderRadius:6, background:d.eventColor+"15", color:d.eventColor }}>
                      {d.unspecified} registered
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </SettingsCard>
        </div>
      </div>
    </div>
  );
};

