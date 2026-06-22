import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { NewActivityModal } from "./new-activity-modal";
import { ACTIVITIES_STORE, ACTIVITY_STATUS_META, ACTIVITY_TYPES, APPOINTMENT_TYPE_KEYS, TASK_TYPE_KEYS } from "../../lib/core";
import { C } from "../../theme";

export const CalendarPage = ({ role, navigateTo, activities=[], setActivities, addAppointment, addReminder }) => {
  const TODAY    = "2026-02-24";
  const MONTHS   = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const [currentDate, setCurrentDate] = useState(new Date(2026,1,24));
  const [calFilter,   setCalFilter]   = useState("all");
  const [showEvents,  setShowEvents]  = useState(true);
  const [typeFilter,  setTypeFilter]  = useState("all");
  const [statusFilter,setStatusFilter]= useState("all");
  const [view,        setView]        = useState("month"); // month | week | day
  const [showNew,     setShowNew]     = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [editActivity,setEditActivity]= useState(null);
  const [selected,    setSelected]    = useState(null);    // activity detail modal
  const [selectedDate,setSelectedDate]= useState(TODAY);  // date whose list shows below

  const myGP = "Anna Klein"; const myVD = "Thomas Müller";

  // Calendar options per role
  const calOptions = {
    superadmin: [{v:"all",l:"Organisation Calendar"},{v:"mine",l:"My Calendar"},{v:"Thomas Müller",l:"Thomas Müller"},{v:"Marc Otto",l:"Marc Otto"},{v:"Anna Klein",l:"Anna Klein"},{v:"Ben Hartmann",l:"Ben Hartmann"}],
    vd:         [{v:"team",l:"Team Calendar"},{v:"mine",l:"My Calendar"},{v:"Anna Klein",l:"Anna Klein"},{v:"Ben Hartmann",l:"Ben Hartmann"},{v:"Marc Otto",l:"Marc Otto"}],
    gp:         [{v:"mine",l:"My Calendar"}],
    manager:    [{v:"all",l:"Organisation Calendar"},{v:"mine",l:"My Calendar"},{v:"Thomas Müller",l:"Thomas Müller"},{v:"Anna Klein",l:"Anna Klein"}],
  }[role] || [{v:"mine",l:"My Calendar"}];

  // Filter activities
  const visible = activities.filter(a => {
    if (typeFilter !== "all" && a.type !== typeFilter) return false;
    // "mine" filter: show activities belonging to current GP, OR activities with no gp set (unowned)
    if (calFilter === "mine" && a.gp && a.gp !== myGP) return false;
    if (calFilter === "team" && a.vd && a.vd !== myVD) return false;
    if (calFilter !== "all" && calFilter !== "mine" && calFilter !== "team" && a.gp && a.gp !== calFilter) return false;
    return true;
  });

  // Group by date for calendar grid
  const byDate = {};
  visible.forEach(a => {
    if (!byDate[a.date]) byDate[a.date] = [];
    byDate[a.date].push(a);
  });

  // Month grid helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;
  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;

  const fmtDate = (y,m,d) => `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;

  // Week view helpers
  const weekStart = new Date(currentDate);
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay()+6)%7));
  const weekDays = Array.from({length:7},(_,i)=>{
    const d = new Date(weekStart); d.setDate(d.getDate()+i); return d;
  });
  const HOURS = Array.from({length:13},(_,i)=>i+7); // 07:00–19:00

  const fmtDateObj = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;

  const NavBtn = ({onClick,children}) => (
    <button onClick={onClick} style={{ padding:"6px 10px",borderRadius:7,border:`1px solid ${C.border}`,background:"#fff",color:C.slate,fontSize:13,cursor:"pointer",fontFamily:"inherit" }}>{children}</button>
  );

  const ActivityChip = ({a, compact=false}) => {
    const at = ACTIVITY_TYPES[a.type] || ACTIVITY_TYPES.note;
    return (
      <div onClick={e=>{e.stopPropagation();setSelected(a);}}
        style={{ display:"flex",alignItems:"center",gap:4,padding:compact?"2px 5px":"4px 7px",
          borderRadius:5,background:at.bg,border:`1px solid ${at.color}30`,
          cursor:"pointer",overflow:"hidden",marginBottom:2,
          fontSize:compact?9:11,color:at.color,fontWeight:600 }}>
        <span style={{ flexShrink:0,fontSize:compact?9:11 }}>{at.icon}</span>
        <span style={{ overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1 }}>{a.title}</span>
        {!compact && a.time && <span style={{ flexShrink:0,fontSize:9,color:C.muted,fontWeight:400 }}>{a.time}</span>}
      </div>
    );
  };

  return (
    <div style={{ display:"flex",flexDirection:"column",height:"100%",fontFamily:"inherit",overflow:"hidden" }}>

      {/* ── Top bar ───────────────────────────────────────────────────────── */}
      <div style={{ padding:"12px 20px",borderBottom:`1px solid ${C.border}`,background:"#fff",
        display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",flexShrink:0 }}>
        <h1 style={{ margin:0,fontSize:18,fontWeight:800,color:C.navy }}>📅 Calendar & Activities</h1>

        {/* Calendar DDL */}
        <div style={{ position:"relative" }}>
          <select value={calFilter} onChange={e=>setCalFilter(e.target.value)}
            style={{ padding:"6px 28px 6px 10px",borderRadius:8,border:`1.5px solid ${C.indigo}40`,
              background:C.indigo+"08",color:C.indigo,fontSize:12,fontWeight:700,
              fontFamily:"inherit",appearance:"none",cursor:"pointer",outline:"none" }}>
            {calOptions.map(opt=><option key={opt.v} value={opt.v}>{opt.l}</option>)}
          </select>
          <div style={{ position:"absolute",right:7,top:"50%",transform:"translateY(-50%)",pointerEvents:"none",fontSize:9,color:C.indigo }}>▼</div>
        </div>

        {/* Type filter */}
        <div style={{ position:"relative" }}>
          <select value={typeFilter} onChange={e=>setTypeFilter(e.target.value)}
            style={{ padding:"6px 28px 6px 10px",borderRadius:8,border:`1px solid ${C.border}`,
              background:"#fff",color:C.slate,fontSize:12,fontFamily:"inherit",appearance:"none",cursor:"pointer",outline:"none" }}>
            <option value="all">All types</option>
            {Object.entries(ACTIVITY_TYPES).map(([k,v])=><option key={k} value={k}>{v.icon} {v.label}</option>)}
          </select>
          <div style={{ position:"absolute",right:7,top:"50%",transform:"translateY(-50%)",pointerEvents:"none",fontSize:9,color:C.muted }}>▼</div>
        </div>

        {/* Show Events toggle */}
        <div style={{ display:"flex",alignItems:"center",gap:6 }}>
          <div onClick={()=>setShowEvents(v=>!v)}
            style={{ width:36,height:20,borderRadius:10,background:showEvents?C.green:"#CBD5E1",cursor:"pointer",position:"relative",transition:"background 0.2s" }}>
            <div style={{ position:"absolute",top:2,left:showEvents?18:2,width:16,height:16,borderRadius:"50%",background:"#fff",transition:"left 0.2s",boxShadow:"0 1px 3px rgba(0,0,0,0.2)" }}/>
          </div>
          <span style={{ fontSize:11,color:C.slate,fontWeight:600 }}>Events</span>
        </div>

        <div style={{ marginLeft:"auto",display:"flex",gap:8,alignItems:"center" }}>
          {/* View switcher */}
          <div style={{ display:"flex",border:`1px solid ${C.border}`,borderRadius:8,overflow:"hidden",flexShrink:0 }}>
            {["month","week","day"].map(v=>(
              <button key={v} onClick={()=>setView(v)}
                style={{ padding:"6px 12px",border:"none",background:view===v?C.primary:"#fff",
                  color:view===v?"#fff":C.slate,fontSize:11,fontWeight:view===v?700:400,
                  cursor:"pointer",fontFamily:"inherit",textTransform:"capitalize" }}>{v}</button>
            ))}
          </div>

          {/* Nav arrows + label */}
          <button onClick={()=>{ const d=new Date(currentDate);
            if(view==="month") d.setMonth(d.getMonth()-1);
            else if(view==="week") d.setDate(d.getDate()-7);
            else d.setDate(d.getDate()-1);
            setCurrentDate(d); }}
            style={{ width:28,height:28,borderRadius:7,border:`1px solid ${C.border}`,background:"#fff",color:C.slate,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>‹</button>
          <span style={{ fontSize:13,fontWeight:700,color:C.text,minWidth:130,textAlign:"center" }}>
            {view==="month" ? `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`
             : view==="week" ? `${weekDays[0].getDate()} – ${weekDays[6].getDate()} ${MONTHS[weekDays[6].getMonth()]}`
             : currentDate.toLocaleDateString("en-GB",{weekday:"short",day:"numeric",month:"short"})}
          </span>
          <button onClick={()=>{ const d=new Date(currentDate);
            if(view==="month") d.setMonth(d.getMonth()+1);
            else if(view==="week") d.setDate(d.getDate()+7);
            else d.setDate(d.getDate()+1);
            setCurrentDate(d); }}
            style={{ width:28,height:28,borderRadius:7,border:`1px solid ${C.border}`,background:"#fff",color:C.slate,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>›</button>

          {/* Add Activity — split button with chevron dropdown */}
          <div style={{ position:"relative" }}>
            <div style={{ display:"flex",borderRadius:8,overflow:"hidden",border:`1px solid ${C.primary}` }}>
              <button onClick={()=>{ setEditActivity(null); setShowNew(true); setShowAddMenu(false); }}
                style={{ padding:"7px 14px",border:"none",background:C.primary,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit" }}>
                + Add Activity
              </button>
              <button onClick={()=>setShowAddMenu(v=>!v)}
                style={{ padding:"7px 10px",border:"none",borderLeft:"1px solid rgba(255,255,255,0.25)",background:C.primary,color:"#fff",fontSize:11,cursor:"pointer" }}>▾</button>
            </div>
            {showAddMenu && (<>
              <div onClick={()=>setShowAddMenu(false)} style={{ position:"fixed",inset:0,zIndex:200 }}/>
              <div style={{ position:"absolute",top:"calc(100% + 4px)",right:0,zIndex:201,background:"#fff",borderRadius:12,
                boxShadow:"0 8px 32px rgba(0,0,0,0.15)",border:`1px solid ${C.border}`,minWidth:240,padding:"6px 0" }}>
                <div style={{ padding:"6px 14px 4px",fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.08em" }}>Appointments</div>
                {APPOINTMENT_TYPE_KEYS.map(k=>{ const v=ACTIVITY_TYPES[k]; return (
                  <div key={k} onClick={()=>{ setShowAddMenu(false); setEditActivity({type:k,title:"",date:selectedDate}); setShowNew(true); }}
                    style={{ display:"flex",alignItems:"center",gap:10,padding:"8px 14px",cursor:"pointer" }}
                    onMouseEnter={e=>e.currentTarget.style.background="#F8FAFC"}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <span style={{ fontSize:16,width:22,textAlign:"center" }}>{v.icon}</span>
                    <div style={{ fontSize:12,fontWeight:600,color:C.text }}>{v.label}</div>
                  </div>
                );})}
                <div style={{ height:1,background:C.border,margin:"4px 0" }}/>
                <div style={{ padding:"6px 14px 4px",fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.08em" }}>Tasks</div>
                {TASK_TYPE_KEYS.map(k=>{ const v=ACTIVITY_TYPES[k]; return (
                  <div key={k} onClick={()=>{ setShowAddMenu(false); setEditActivity({type:k,title:"",date:selectedDate}); setShowNew(true); }}
                    style={{ display:"flex",alignItems:"center",gap:10,padding:"8px 14px",cursor:"pointer" }}
                    onMouseEnter={e=>e.currentTarget.style.background="#F8FAFC"}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <span style={{ fontSize:16,width:22,textAlign:"center" }}>{v.icon}</span>
                    <div style={{ fontSize:12,fontWeight:600,color:C.text }}>{v.label}</div>
                  </div>
                );})}
              </div>
            </>)}
          </div>
        </div>
      </div>

      {/* ── Main body: calendar top, day list bottom ─────────────────────────── */}
      <div style={{ flex:1,display:"flex",flexDirection:"column",overflow:"hidden" }}>

        {/* ── Calendar grid (Month / Week / Day views) ─────────────────────── */}
        <div style={{ flexShrink:0,borderBottom:`1px solid ${C.border}`,display:"flex",flexDirection:"column" }}>

          {/* ── MONTH VIEW ──────────────────────────────────────────────────── */}
          {view==="month" && (<>
            <div style={{ display:"grid",gridTemplateColumns:"repeat(7,1fr)" }}>
              {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d,i)=>(
                <div key={i} style={{ padding:"8px 0",textAlign:"center",fontSize:11,fontWeight:700,
                  color:i>=5?C.red:C.muted,background:"#FAFAFA",borderBottom:`1px solid ${C.border}` }}>{d}</div>
              ))}
            </div>
            <div style={{ display:"grid",gridTemplateColumns:"repeat(7,1fr)" }}>
              {Array.from({length:totalCells}).map((_,idx)=>{
                const dayNum  = idx - startOffset + 1;
                const isValid = dayNum >= 1 && dayNum <= daysInMonth;
                const dateStr = isValid ? fmtDate(year,month,dayNum) : "";
                const isToday = dateStr === TODAY;
                const isSel   = dateStr === selectedDate;
                const dayActs = byDate[dateStr] || [];
                const typeColors = [...new Set(dayActs.map(a=>ACTIVITY_TYPES[a.type]?.color||C.muted))].slice(0,3);
                return (
                  <div key={idx} onClick={()=>isValid&&setSelectedDate(dateStr)}
                    style={{ minHeight:72,padding:"5px 4px",borderBottom:`1px solid ${C.border}`,
                      borderRight:`1px solid ${C.border}`,
                      background:isSel?"#EFF6FF":isToday?"#F0FDF4":!isValid?"#FAFAFA":"#fff",
                      cursor:isValid?"pointer":"default" }}>
                    {isValid && (<>
                      <div style={{ display:"flex",justifyContent:"center",marginBottom:3 }}>
                        <div style={{ width:22,height:22,borderRadius:"50%",fontSize:11,fontWeight:isToday||isSel?800:500,
                          background:isToday?C.green:isSel?C.accent:"transparent",
                          color:isToday||isSel?"#fff":C.text,
                          display:"flex",alignItems:"center",justifyContent:"center" }}>{dayNum}</div>
                      </div>
                      {dayActs.slice(0,2).map(a=>{ const at=ACTIVITY_TYPES[a.type]||ACTIVITY_TYPES.note; return (
                        <div key={a.id} title={a.title}
                          style={{ fontSize:9,fontWeight:600,color:at.color,background:at.bg,
                            borderLeft:`2px solid ${at.color}`,padding:"1px 4px",
                            borderRadius:"0 3px 3px 0",marginBottom:2,
                            overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>
                          {at.icon} {a.time&&a.time.slice(0,5)} {a.title}
                        </div>
                      );})}
                      {dayActs.length>2&&<div style={{ fontSize:9,color:C.muted,textAlign:"center" }}>+{dayActs.length-2} more</div>}
                      {dayActs.length>0&&(
                        <div style={{ display:"flex",justifyContent:"center",gap:3,marginTop:2 }}>
                          {typeColors.map((c,i)=><div key={i} style={{ width:5,height:5,borderRadius:"50%",background:c }}/>)}
                        </div>
                      )}
                    </>)}
                  </div>
                );
              })}
            </div>
          </>)}

          {/* ── WEEK VIEW ───────────────────────────────────────────────────── */}
          {view==="week" && (
            <div style={{ overflowY:"auto",maxHeight:420 }}>
              {/* Week day headers */}
              <div style={{ display:"grid",gridTemplateColumns:"52px repeat(7,1fr)",position:"sticky",top:0,zIndex:2,background:"#fff",borderBottom:`1px solid ${C.border}` }}>
                <div style={{ background:"#FAFAFA" }}/>
                {weekDays.map((d,i)=>{
                  const ds=fmtDateObj(d); const isT=ds===TODAY; const isSel=ds===selectedDate;
                  return (
                    <div key={i} onClick={()=>setSelectedDate(ds)}
                      style={{ padding:"6px 0",textAlign:"center",cursor:"pointer",
                        background:isSel?"#EFF6FF":isT?"#F0FDF4":"#FAFAFA",
                        borderLeft:`1px solid ${C.border}` }}>
                      <div style={{ fontSize:10,fontWeight:700,color:i>=5?C.red:C.muted,textTransform:"uppercase" }}>
                        {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][i]}
                      </div>
                      <div style={{ width:26,height:26,borderRadius:"50%",margin:"2px auto 0",
                        background:isT?C.green:isSel?C.accent:"transparent",
                        display:"flex",alignItems:"center",justifyContent:"center",
                        fontSize:13,fontWeight:isT||isSel?800:500,
                        color:isT||isSel?"#fff":C.text }}>{d.getDate()}</div>
                    </div>
                  );
                })}
              </div>
              {/* Hour rows */}
              {HOURS.map(h=>(
                <div key={h} style={{ display:"grid",gridTemplateColumns:"52px repeat(7,1fr)",minHeight:52 }}>
                  <div style={{ padding:"4px 6px 0",fontSize:10,color:C.muted,textAlign:"right",
                    background:"#FAFAFA",borderBottom:`1px solid ${C.border}`,borderRight:`1px solid ${C.border}` }}>
                    {String(h).padStart(2,"0")}:00
                  </div>
                  {weekDays.map((d,di)=>{
                    const ds = fmtDateObj(d);
                    const slotActs = (byDate[ds]||[]).filter(a=>a.time&&parseInt(a.time)===h);
                    return (
                      <div key={di} onClick={()=>setSelectedDate(ds)}
                        style={{ borderBottom:`1px solid ${C.border}`,borderLeft:`1px solid ${C.border}`,
                          padding:"2px",cursor:"pointer",background:ds===selectedDate?"#EFF6FF20":"#fff",
                          position:"relative",minHeight:52 }}>
                        {slotActs.length===0 ? null :
                         slotActs.length===1 ? (()=>{ const a=slotActs[0]; const at=ACTIVITY_TYPES[a.type]||ACTIVITY_TYPES.note; return (
                           <div title={`${a.title} ${a.time||""}`}
                             style={{ fontSize:9,fontWeight:600,color:at.color,background:at.bg,
                               borderLeft:`2px solid ${at.color}`,padding:"2px 4px",borderRadius:"0 4px 4px 0",
                               overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",margin:1 }}>
                             {at.icon} {a.time&&a.time.slice(0,5)} {a.title}
                           </div>
                         );})() :
                         /* EDGE CASE: multiple activities in same slot */
                         (
                           <div style={{ position:"relative" }}>
                             {slotActs.slice(0,2).map((a,ai)=>{ const at=ACTIVITY_TYPES[a.type]||ACTIVITY_TYPES.note; return (
                               <div key={a.id} title={`${a.title} ${a.time||""}`}
                                 style={{ fontSize:8,fontWeight:600,color:at.color,background:at.bg,
                                   borderLeft:`2px solid ${at.color}`,padding:"1px 3px",
                                   borderRadius:"0 3px 3px 0",overflow:"hidden",
                                   textOverflow:"ellipsis",whiteSpace:"nowrap",margin:"1px",
                                   opacity:1-ai*0.15 }}>
                                 {at.icon} {a.title.slice(0,10)}{a.title.length>10?"…":""}
                               </div>
                             );})}
                             {slotActs.length>2&&(
                               <div style={{ fontSize:8,color:C.muted,padding:"0 3px",fontWeight:600 }}>
                                 +{slotActs.length-2} more
                               </div>
                             )}
                           </div>
                         )
                        }
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}

          {/* ── DAY VIEW ────────────────────────────────────────────────────── */}
          {view==="day" && (()=>{
            const ds = fmtDateObj(currentDate);
            const dayActs = byDate[ds]||[];
            // Sync selectedDate with day view
            if(selectedDate!==ds) setSelectedDate(ds);
            return (
              <div style={{ overflowY:"auto",maxHeight:380 }}>
                {HOURS.map(h=>{
                  const slotActs = dayActs.filter(a=>a.time&&parseInt(a.time)===h);
                  const hasConflict = slotActs.length>1;
                  return (
                    <div key={h} style={{ display:"flex",gap:0,minHeight:56,
                      borderBottom:`1px solid ${C.border}`,background:hasConflict?"#FFF7ED":"#fff" }}>
                      {/* Time label */}
                      <div style={{ width:60,flexShrink:0,padding:"6px 8px 0",
                        fontSize:11,color:C.muted,textAlign:"right",borderRight:`1px solid ${C.border}`,
                        background:"#FAFAFA" }}>
                        {String(h).padStart(2,"0")}:00
                        {hasConflict&&<div style={{ fontSize:8,color:C.amber,fontWeight:700 }}>⚠ conflict</div>}
                      </div>
                      {/* Activity slots */}
                      <div style={{ flex:1,padding:"4px 8px",display:"flex",
                        flexDirection:hasConflict?"row":"column",gap:4,flexWrap:"wrap" }}>
                        {slotActs.length===0 ? null : slotActs.map((a,ai)=>{
                          const at=ACTIVITY_TYPES[a.type]||ACTIVITY_TYPES.note;
                          return (
                            <div key={a.id}
                              style={{ flex:hasConflict?`0 0 calc(${100/Math.min(slotActs.length,3)}% - 4px)`:"1",
                                padding:"6px 10px",borderRadius:7,background:at.bg,
                                borderLeft:`3px solid ${at.color}`,cursor:"pointer",
                                outline:hasConflict&&ai>0?`1px dashed ${at.color}40`:"none" }}
                              onClick={()=>setSelected(a)}>
                              <div style={{ fontSize:11,fontWeight:700,color:at.color }}>
                                {at.icon} {a.time}{a.end?` – ${a.end}`:""} {hasConflict&&<span style={{ fontSize:9,background:C.amber+"20",color:C.amber,padding:"1px 5px",borderRadius:8,marginLeft:4 }}>overlap</span>}
                              </div>
                              <div style={{ fontSize:12,fontWeight:600,color:C.text,marginTop:2 }}>{a.title}</div>
                              {a.lead&&<div style={{ fontSize:10,color:C.muted }}>👤 {a.lead}</div>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                {dayActs.length===0&&(
                  <div style={{ padding:"32px 20px",textAlign:"center",color:C.muted }}>
                    <div style={{ fontSize:28,marginBottom:8 }}>📭</div>
                    <div style={{ fontSize:13 }}>No activities today</div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Type legend */}
          <div style={{ padding:"6px 12px",borderTop:`1px solid ${C.border}`,background:"#FAFAFA",
            display:"flex",gap:10,flexWrap:"wrap" }}>
            {Object.entries(ACTIVITY_TYPES).map(([k,v])=>(
              <div key={k} style={{ display:"flex",alignItems:"center",gap:4 }}>
                <div style={{ width:7,height:7,borderRadius:2,background:v.color }}/>
                <span style={{ fontSize:9,color:C.muted }}>{v.short}</span>
              </div>
            ))}
            <span style={{ marginLeft:"auto",fontSize:9,color:C.muted }}>{visible.length} activities total</span>
          </div>
        </div>

        {/* ── Day list panel ─────────────────────────────────────────────── */}
        <div style={{ flex:1,display:"flex",flexDirection:"column",overflow:"hidden" }}>

          {/* Day header */}
          <div style={{ padding:"12px 20px",borderBottom:`1px solid ${C.border}`,background:"#fff",
            display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0 }}>
            <div>
              <div style={{ fontSize:16,fontWeight:800,color:C.navy }}>
                {selectedDate===TODAY?"📅 Today":new Date(selectedDate+"T12:00").toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long"})}
              </div>
              <div style={{ fontSize:12,color:C.muted,marginTop:2 }}>
                {(byDate[selectedDate]||[]).length} {(byDate[selectedDate]||[]).length===1?"activity":"activities"}
              </div>
            </div>

            {/* Filters */}
            <div style={{ display:"flex",gap:6 }}>
              <div style={{ position:"relative" }}>
                <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}
                  style={{ padding:"5px 24px 5px 8px",borderRadius:7,border:`1px solid ${statusFilter!=="all"?C.accent:C.border}`,
                    background:statusFilter!=="all"?C.accent+"08":"#fff",
                    color:statusFilter!=="all"?C.accent:C.muted,
                    fontSize:11,fontFamily:"inherit",appearance:"none",cursor:"pointer",outline:"none" }}>
                  <option value="all">All status</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="done">Done</option>
                </select>
                <div style={{ position:"absolute",right:5,top:"50%",transform:"translateY(-50%)",pointerEvents:"none",fontSize:9,color:C.muted }}>▼</div>
              </div>
            </div>
          </div>

          {/* Activity list for selected date */}
          <div style={{ flex:1,overflowY:"auto",padding:"12px 16px" }}>

            {/* Future dates — show all activities */}
            {/* Past dates — show all (no Done button, just info) */}
            {(()=>{
              const dayItems = (byDate[selectedDate]||[])
                .filter(a => statusFilter==="all"||a.status===statusFilter)
                .sort((a,b)=>(a.time||"").localeCompare(b.time||""));

              if(dayItems.length===0) return (
                <div style={{ padding:"40px 20px",textAlign:"center",color:C.muted }}>
                  <div style={{ fontSize:32,marginBottom:10 }}>📭</div>
                  <div style={{ fontSize:13,fontWeight:600 }}>No activities on this day</div>
                  <div style={{ fontSize:12,marginTop:4 }}>Click "+ Add Activity" to schedule something</div>
                  <button onClick={()=>setShowNew(true)}
                    style={{ marginTop:16,padding:"8px 18px",borderRadius:8,border:"none",
                      background:C.primary,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit" }}>
                    + Add Activity
                  </button>
                </div>
              );

              return dayItems.map(a=>{
                const at = ACTIVITY_TYPES[a.type]||ACTIVITY_TYPES.note;
                const sm = ACTIVITY_STATUS_META[a.status]||ACTIVITY_STATUS_META.pending;
                return (
                  <div key={a.id} style={{ display:"flex",gap:12,marginBottom:10,
                    padding:"12px 14px",borderRadius:10,background:"#fff",
                    border:`1px solid ${C.border}`,borderLeft:`4px solid ${at.color}` }}>

                    {/* Time column */}
                    <div style={{ width:52,flexShrink:0,textAlign:"center" }}>
                      <div style={{ fontSize:13,fontWeight:800,color:at.color }}>{a.time||"—"}</div>
                      {a.end && <div style={{ fontSize:10,color:C.muted,marginTop:1 }}>{a.end}</div>}
                      <div style={{ width:28,height:28,borderRadius:"50%",background:at.bg,
                        display:"flex",alignItems:"center",justifyContent:"center",
                        fontSize:14,margin:"6px auto 0",border:`1px solid ${at.color}25` }}>
                        {at.icon}
                      </div>
                    </div>

                    {/* Content */}
                    <div style={{ flex:1,minWidth:0 }}>
                      <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:3,flexWrap:"wrap" }}>
                        <div style={{ fontSize:13,fontWeight:700,color:C.text }}>{a.title}</div>
                        <span style={{ fontSize:9,fontWeight:800,padding:"2px 7px",borderRadius:8,
                          background:at.color+"15",color:at.color,textTransform:"uppercase" }}>{at.short}</span>
                        <span style={{ fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:8,
                          background:sm.color+"15",color:sm.color,textTransform:"uppercase" }}>{sm.label}</span>
                        {a.recur&&a.recur!=="Once"&&(
                          <span style={{ fontSize:9,color:C.muted,fontWeight:600 }}>🔁 {a.recur}</span>
                        )}
                      </div>
                      {a.lead && <div style={{ fontSize:11,color:C.muted }}>👤 {a.lead}</div>}
                      {a.location && <div style={{ fontSize:11,color:C.muted }}>📍 {a.location}</div>}
                      {a.link && <div style={{ fontSize:11,color:C.blue }}>🔗 {a.link}</div>}
                      {a.note && <div style={{ fontSize:11,color:C.slate,marginTop:3,lineHeight:1.4 }}>{a.note}</div>}
                    </div>

                    {/* Actions — Edit + Delete only (no Done) */}
                    <div style={{ display:"flex",flexDirection:"column",gap:5,flexShrink:0 }}>
                      <button onClick={()=>{ setEditActivity(a); setShowNew(true); }}
                        style={{ padding:"5px 10px",borderRadius:7,border:`1px solid ${C.border}`,
                          background:"#fff",color:C.slate,fontSize:11,fontWeight:600,cursor:"pointer" }}>
                        ✏️
                      </button>
                      <button onClick={()=>{ if(window.confirm("Delete this activity?"))
                          setActivities(prev=>prev.filter(x=>x.id!==a.id)); }}
                        style={{ padding:"5px 10px",borderRadius:7,border:`1px solid ${C.red}25`,
                          background:C.red+"06",color:C.red,fontSize:11,fontWeight:600,cursor:"pointer" }}>
                        🗑
                      </button>
                    </div>
                  </div>
                );
              });
            })()}

            {/* All activities summary strip at bottom */}
            {(byDate[selectedDate]||[]).length > 0 && (
              <div style={{ marginTop:8,padding:"8px 12px",borderRadius:9,
                background:"#F8FAFC",border:`1px solid ${C.border}`,fontSize:11,color:C.muted }}>
                📊 {visible.filter(a=>a.date>=TODAY).length} upcoming · {visible.filter(a=>a.date<TODAY).length} past across all dates
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Activity detail modal ──────────────────────────────────────────── */}
      {selected && (()=>{
        const at = ACTIVITY_TYPES[selected.type]||ACTIVITY_TYPES.note;
        const sm = ACTIVITY_STATUS_META[selected.status]||ACTIVITY_STATUS_META.pending;
        return (
          <>
            <div onClick={()=>setSelected(null)} style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.3)",zIndex:300 }}/>
            <div style={{ position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",
              width:400,background:"#fff",borderRadius:14,zIndex:400,padding:"22px",
              boxShadow:"0 20px 60px rgba(0,0,0,0.18)" }}>
              <div style={{ display:"flex",justifyContent:"space-between",marginBottom:16 }}>
                <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                  <div style={{ width:34,height:34,borderRadius:9,background:at.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18 }}>{at.icon}</div>
                  <div><div style={{ fontSize:11,fontWeight:700,color:at.color,textTransform:"uppercase" }}>{at.label}</div>
                  <div style={{ fontSize:14,fontWeight:800,color:C.navy }}>{selected.title}</div></div>
                </div>
                <button onClick={()=>setSelected(null)} style={{ width:26,height:26,borderRadius:"50%",border:`1px solid ${C.border}`,background:"#F8FAFC",color:C.muted,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>×</button>
              </div>
              {[["📅","Date & Time",`${selected.date}${selected.time?` · ${selected.time}`:""}${selected.end?` – ${selected.end}`:""}`],["👤","Lead",selected.lead||"—"],["🔁","Recurrence",selected.recur||"Once"],["⚡","Status",sm.label]].filter(([,l,v])=>v&&v!=="—").map(([ic,l,v])=>(
                <div key={l} style={{ display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${C.border}`,fontSize:12 }}>
                  <span style={{ color:C.muted }}>{ic} {l}</span><span style={{ color:C.text,fontWeight:600 }}>{v}</span>
                </div>
              ))}
              <div style={{ display:"flex",gap:8,marginTop:14 }}>
                <button onClick={()=>{ setEditActivity(selected); setSelected(null); setShowNew(true); }}
                  style={{ flex:1,padding:"9px",borderRadius:9,border:`1px solid ${C.border}`,background:"#fff",color:C.slate,fontSize:12,fontWeight:600,cursor:"pointer" }}>✏️ Edit</button>
                <button onClick={()=>setSelected(null)} style={{ flex:1,padding:"9px",borderRadius:9,border:"none",background:C.primary,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer" }}>Close</button>
              </div>
            </div>
          </>
        );
      })()}

      {/* ── New / Edit Activity Modal ──────────────────────────────────────── */}
      {showNew && <NewActivityModal
        onClose={()=>{ setShowNew(false); setEditActivity(null); }}
        role={role}
        initial={editActivity}
        onAdd={act=>{
          if(editActivity){
            setActivities(prev=>prev.map(x=>x.id===editActivity.id?{...act,id:editActivity.id}:x));
          } else {
            const newAct = {
              ...act,
              id: act.id || `act_${Date.now()}`,
              gp: role==="gp"?"Anna Klein":act.gp||"Anna Klein",
              vd: act.vd||"Thomas Müller",
              status: act.status||"upcoming",
            };
            setActivities(prev=>[newAct,...prev]);
            ACTIVITIES_STORE.unshift(newAct);
            if(["inperson","video","event"].includes(newAct.type)){
              addAppointment({...newAct, lead:newAct.title, start:newAct.time, notes:newAct.note});
            } else {
              addReminder({...newAct, title:newAct.title, channels:newAct.channels||["push","inapp"]});
            }
          }
          setShowNew(false);
          setEditActivity(null);
          // Navigate calendar to the new activity's date so it's immediately visible
          if(act.date){
            const d = new Date(act.date+"T12:00");
            setCurrentDate(d);
            setSelectedDate(act.date);
          }
        }}/>}
    </div>
  );
};

