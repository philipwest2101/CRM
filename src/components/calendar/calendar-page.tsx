import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { NewActivityModal } from "./new-activity-modal";
import { TaskModal } from "./task-modal";
import { AppointmentModal } from "../appointments/appointment-modal";
import { AppointmentOutcomeModal } from "../appointments/appointment-outcome-modal";
import { ACTIVITIES_STORE, ACTIVITY_STATUS_META, ACTIVITY_TYPES, APPOINTMENT_TYPE_KEYS, TASK_TYPE_KEYS, EVENTS_LIST } from "../../lib/core";
import { C } from "../../theme";

// Tasks are coloured by priority; appointments and events (which have no
// priority) each get one fixed colour.
const PRIORITY_COLOR   = { urgent:"#B42318", high:"#F04438", medium:"#F79009", normal:"#F79009", low:"#667085" };
const APPOINTMENT_COLOR = "#0E9384";   // teal
const EVENT_COLOR       = "#BE185D";   // magenta
const PRIORITY_LEGEND  = [["urgent","Urgent"],["high","High"],["medium","Medium"],["low","Low"]];

export const CalendarPage = ({ role, navigateTo, activities=[], setActivities, addAppointment, addReminder }) => {
  const TODAY    = "2026-02-24";
  const MONTHS   = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const [currentDate, setCurrentDate] = useState(new Date(2026,1,24));
  const [calFilter,   setCalFilter]   = useState("mine");   // each role sees only its own calendar
  const [showEvents,  setShowEvents]  = useState(true);
  const [typeFilter,  setTypeFilter]  = useState("all");
  const [statusFilter,setStatusFilter]= useState("all");
  const [view,        setView]        = useState("month"); // month | week | day
  const [showNew,     setShowNew]     = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [editActivity,setEditActivity]= useState(null);
  const [selected,    setSelected]    = useState(null);    // activity detail modal
  const [selectedDate,setSelectedDate]= useState(TODAY);  // date whose list shows below
  const [sortBy,      setSortBy]      = useState("time");  // time | priority
  const [taskModal,   setTaskModal]   = useState(null);    // { mode, data }
  const [apptModal,   setApptModal]   = useState(null);    // { mode, data }
  const [outcomeAppt, setOutcomeAppt] = useState(null);

  const myGP = "Anna Klein"; const myVD = "Thomas Müller";

  // Every role sees only its own calendar
  const calOptions = [{v:"mine",l:"My Calendar"}];

  // ── Events on the calendar ────────────────────────────────────────────────
  // Events have no priority, so each one carries its own colour (defined in
  // EVENTS_LIST). We flatten every event date into a calendar entry that keeps
  // its event colour, and surface a colour legend so they stay distinguishable.
  const MONTH_IDX = { january:0,february:1,march:2,april:3,may:4,june:5,july:6,august:7,september:8,october:9,november:10,december:11 };
  const parseEventDate = (label) => {
    const mt = String(label||"").match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
    if (!mt) return null;
    const mo = MONTH_IDX[mt[2].toLowerCase()];
    if (mo == null) return null;
    return `${mt[3]}-${String(mo+1).padStart(2,"0")}-${String(Number(mt[1])).padStart(2,"0")}`;
  };
  const eventActivities = useMemo(() => EVENTS_LIST.flatMap(ev => ev.dates.map(d => {
    const [start, end] = String(d.time||"").split("–").map(s=>s.trim());
    return {
      id:`ev_${d.id}`, type:"event", title:ev.name, lead:null,
      date:parseEventDate(d.label), time:start||"", end:end||"", location:d.location,
      status:d.status==="past"?"done":"upcoming", recur:"Once", priority:null,
      isEvent:true, eventId:ev.id, eventColor:ev.color, eventIcon:ev.icon,
      entityType:"event", category:"event",
    };
  })).filter(x => x.date), []);

  // Effective type meta for an activity — colour depends on category: tasks by
  // priority, appointments one colour, events one colour. Type drives the icon.
  const metaOf = (a) => {
    const base = ACTIVITY_TYPES[a?.type] || ACTIVITY_TYPES.note;
    const col = a?.isEvent ? EVENT_COLOR
      : base.category === "task" ? (PRIORITY_COLOR[a?.priority] || PRIORITY_COLOR.medium)
      : APPOINTMENT_COLOR;
    return { ...base, color:col, bg:col+"18" };
  };

  const baseActs = showEvents ? [...activities, ...eventActivities] : activities;

  // Filter activities
  const visible = baseActs.filter(a => {
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

  // ── Task / Appointment modal helpers ──────────────────────────────────────
  const NOW_TIME  = "12:00";
  const PRIO_RANK = { urgent:-1, high:0, medium:1, normal:1, low:2 };
  const isAppt = (a) => APPOINTMENT_TYPE_KEYS.includes(a?.type) || a?.entityType==="appointment" || a?.category==="appointment";
  const focusDate = (d) => { if(!d) return; setCurrentDate(new Date(d+"T12:00")); setSelectedDate(d); };

  const openActivity = (a) => {
    if (a.isEvent) { setSelected(a); return; }   // events are read-only → detail panel
    if (isAppt(a)) {
      setApptModal({ mode:"view", data:{
        id:a.id, title:a.title, contact:a.lead, apptType:a.apptType||"Consultation Appointment",
        date:a.date, time:a.time, end:a.end, location:a.location, attendees:a.attendees,
        attachment:a.attachment, attachments:a.attachments,
        reminder:a.reminder, reminderCustom:a.reminderCustom, note:a.note, reminderOn:true }});
    } else {
      setTaskModal({ mode:"view", data:{
        id:a.id, type:TASK_TYPE_KEYS.includes(a.type)?a.type:"note", title:a.title, contact:a.lead,
        priority:a.priority||"medium", date:a.date, time:a.time, note:a.note, recur:a.recur||"Once",
        reminderOn:true, reminder:"30" }});
    }
  };

  const submitTask = (f, mode) => {
    if (mode==="edit") {
      setActivities(prev=>prev.map(x=>x.id===f.id ? { ...x, type:f.type, title:f.title, lead:f.contact, priority:f.priority, date:f.date, time:f.time, note:f.note, recur:f.recur } : x));
    } else {
      const act = { id:`act_${Date.now()}`, type:f.type, title:f.title, lead:f.contact, leadId:null,
        date:f.date, time:f.time, end:"", priority:f.priority, note:f.note, recur:f.recur||"Once",
        status:"upcoming", entityType:"task", category:"task", gp:myGP, vd:myVD,
        channels:f.reminderOn?["push","inapp"]:["inapp"] };
      setActivities(prev=>[act,...prev]); ACTIVITIES_STORE.unshift(act);
      addReminder && addReminder({ ...act });
    }
    setTaskModal(null); focusDate(f.date);
  };
  const doneTask = (f) => { setActivities(prev=>prev.filter(x=>x.id!==f.id)); setTaskModal(null); };

  const submitAppt = (f, mode) => {
    if (mode==="edit") {
      setActivities(prev=>prev.map(x=>x.id===f.id ? { ...x, type:"consultation", title:f.title, lead:f.contact, apptType:f.apptType, date:f.date, time:f.time, end:f.end, location:f.location, attendees:f.attendees, attachment:f.attachment, attachments:f.attachments, reminder:f.reminder, reminderCustom:f.reminderCustom, note:f.note } : x));
    } else {
      const act = { id:`appt_${Date.now()}`, type:"consultation", title:f.title, lead:f.contact, leadId:null,
        apptType:f.apptType, date:f.date, time:f.time, end:f.end, location:f.location, attendees:f.attendees,
        attachment:f.attachment, attachments:f.attachments,
        reminder:f.reminder, reminderCustom:f.reminderCustom, note:f.note, recur:"Once", status:"upcoming", entityType:"appointment",
        category:"appointment", gp:myGP, vd:myVD, channels:f.reminderOn?["push","inapp"]:["inapp"] };
      setActivities(prev=>[act,...prev]); ACTIVITIES_STORE.unshift(act);
      addAppointment && addAppointment({ ...act, start:f.time, notes:f.note });
    }
    setApptModal(null); focusDate(f.date);
  };
  const cancelAppt = (f) => { setActivities(prev=>prev.filter(x=>x.id!==f.id)); setApptModal(null); };

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
    const at = metaOf(a);
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

          {/* + Add ▾ — Create Task / Schedule Appointment */}
          <div style={{ position:"relative" }}>
            <button onClick={()=>setShowAddMenu(v=>!v)}
              style={{ padding:"7px 16px",border:"none",borderRadius:8,background:C.primary,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:6 }}>
              + Add <span style={{ fontSize:10 }}>▾</span>
            </button>
            {showAddMenu && (<>
              <div onClick={()=>setShowAddMenu(false)} style={{ position:"fixed",inset:0,zIndex:200 }}/>
              <div style={{ position:"absolute",top:"calc(100% + 4px)",right:0,zIndex:201,background:"#fff",borderRadius:12,
                boxShadow:"0 8px 32px rgba(0,0,0,0.15)",border:`1px solid ${C.border}`,minWidth:220,padding:"6px 0" }}>
                {[["✅ Create Task",()=>setTaskModal({mode:"create"})],["📅 Schedule Appointment",()=>setApptModal({mode:"create"})]].map(([label,fn])=>(
                  <div key={label} onClick={()=>{ setShowAddMenu(false); fn(); }}
                    style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 16px",cursor:"pointer",fontSize:13,fontWeight:600,color:C.text }}
                    onMouseEnter={e=>e.currentTarget.style.background="#F8FAFC"}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    {label}
                  </div>
                ))}
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
                const typeColors = [...new Set(dayActs.map(a=>metaOf(a).color))].slice(0,3);
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
                      {dayActs.slice(0,2).map(a=>{ const at=metaOf(a); return (
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
                         slotActs.length===1 ? (()=>{ const a=slotActs[0]; const at=metaOf(a); return (
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
                             {slotActs.slice(0,2).map((a,ai)=>{ const at=metaOf(a); return (
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
                          const at=metaOf(a);
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

          {/* Legend — tasks by priority; appointments + events one colour each */}
          <div style={{ padding:"6px 12px",borderTop:`1px solid ${C.border}`,background:"#FAFAFA",
            display:"flex",gap:12,flexWrap:"wrap",alignItems:"center" }}>
            <span style={{ fontSize:9,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em" }}>Tasks</span>
            {PRIORITY_LEGEND.map(([k,l])=>(
              <div key={k} style={{ display:"flex",alignItems:"center",gap:4 }}>
                <div style={{ width:8,height:8,borderRadius:3,background:PRIORITY_COLOR[k] }}/>
                <span style={{ fontSize:9,color:C.slate }}>{l}</span>
              </div>
            ))}
            <div style={{ display:"flex",alignItems:"center",gap:4,paddingLeft:6,borderLeft:`1px solid ${C.border}` }}>
              <div style={{ width:8,height:8,borderRadius:3,background:APPOINTMENT_COLOR }}/>
              <span style={{ fontSize:9,color:C.slate }}>📅 Appointments</span>
            </div>
            {showEvents && (
              <div style={{ display:"flex",alignItems:"center",gap:4 }}>
                <div style={{ width:8,height:8,borderRadius:3,background:EVENT_COLOR }}/>
                <span style={{ fontSize:9,color:C.slate }}>🎟️ Events</span>
              </div>
            )}
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

          {/* Activity list for selected date — grouped Overdue / Upcoming, two columns */}
          <div style={{ flex:1,overflowY:"auto",padding:"12px 16px" }}>
            {(()=>{
              const dayItems = (byDate[selectedDate]||[]).filter(a => statusFilter==="all"||a.status===statusFilter);

              if(dayItems.length===0) return (
                <div style={{ padding:"40px 20px",textAlign:"center",color:C.muted }}>
                  <div style={{ fontSize:32,marginBottom:10 }}>📭</div>
                  <div style={{ fontSize:13,fontWeight:600 }}>No activities on this day</div>
                  <div style={{ fontSize:12,marginTop:4 }}>Use "+ Add" to create a task or schedule an appointment</div>
                  <div style={{ display:"flex",gap:8,justifyContent:"center",marginTop:16 }}>
                    <button onClick={()=>setTaskModal({mode:"create"})}
                      style={{ padding:"8px 16px",borderRadius:8,border:`1px solid ${C.border}`,background:"#fff",color:C.slate,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit" }}>✅ Create Task</button>
                    <button onClick={()=>setApptModal({mode:"create"})}
                      style={{ padding:"8px 16px",borderRadius:8,border:"none",background:C.primary,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit" }}>📅 Schedule Appointment</button>
                  </div>
                </div>
              );

              const isOverdue = (a) => a.status!=="done" && (selectedDate < TODAY || (selectedDate===TODAY && (a.time||"99:99") < NOW_TIME));
              const sortFn = (a,b) => sortBy==="priority"
                ? ((PRIO_RANK[a.priority]??1)-(PRIO_RANK[b.priority]??1)) || (a.time||"").localeCompare(b.time||"")
                : (a.time||"").localeCompare(b.time||"");
              const overdue  = dayItems.filter(isOverdue).sort(sortFn);
              const upcoming = dayItems.filter(a=>!isOverdue(a)).sort(sortFn);

              const card = (a) => {
                const at = metaOf(a);
                const prioCol = a.priority==="high"?C.red:a.priority==="low"?C.slate:C.amber;
                return (
                  <div key={a.id} onClick={()=>openActivity(a)}
                    style={{ cursor:"pointer",display:"flex",gap:10,padding:"10px 12px",borderRadius:10,
                      background:"#fff",border:`1px solid ${C.border}`,borderLeft:`4px solid ${at.color}`,minWidth:0 }}>
                    <div style={{ fontSize:16,flexShrink:0 }}>{at.icon}</div>
                    <div style={{ flex:1,minWidth:0 }}>
                      <div style={{ display:"flex",alignItems:"center",gap:6 }}>
                        <span style={{ fontSize:11,fontWeight:800,color:at.color }}>{a.time||"—"}{a.end?` – ${a.end}`:""}</span>
                        <span style={{ width:7,height:7,borderRadius:"50%",background:prioCol,flexShrink:0 }} title={`${a.priority||"normal"} priority`}/>
                        {a.recur&&a.recur!=="Once" && <span style={{ fontSize:9,color:C.muted }}>🔁</span>}
                      </div>
                      <div style={{ fontSize:12,fontWeight:700,color:C.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{a.title}</div>
                      {a.lead && <div style={{ fontSize:10,color:C.muted,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>👤 {a.lead}</div>}
                      {a.note && <div style={{ fontSize:10,color:C.slate,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{a.note}</div>}
                    </div>
                    <button onClick={(e)=>{ e.stopPropagation(); openActivity(a); }}
                      style={{ alignSelf:"flex-start",border:"none",background:"none",color:C.muted,fontSize:16,cursor:"pointer",lineHeight:1,padding:"0 2px",flexShrink:0 }}>⋯</button>
                  </div>
                );
              };

              const group = (title,col,items) => items.length===0 ? null : (
                <div style={{ marginBottom:18 }}>
                  <div style={{ fontSize:11,fontWeight:800,color:col,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:8 }}>
                    {title} <span style={{ color:C.muted }}>({items.length})</span>
                  </div>
                  <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
                    {items.map(card)}
                  </div>
                </div>
              );

              return (
                <>
                  {/* Sort control */}
                  <div style={{ display:"flex",justifyContent:"flex-end",alignItems:"center",gap:8,marginBottom:12 }}>
                    <span style={{ fontSize:11,color:C.muted,fontWeight:600 }}>Sort by</span>
                    <div style={{ display:"inline-flex",border:`1px solid ${C.border}`,borderRadius:8,overflow:"hidden" }}>
                      {[["time","Time"],["priority","Priority"]].map(([k,l])=>(
                        <button key={k} onClick={()=>setSortBy(k)}
                          style={{ padding:"5px 12px",border:"none",background:sortBy===k?C.primary:"#fff",
                            color:sortBy===k?"#fff":C.slate,fontSize:11,fontWeight:sortBy===k?700:400,cursor:"pointer",fontFamily:"inherit" }}>{l}</button>
                      ))}
                    </div>
                  </div>
                  {group("Overdue",C.red,overdue)}
                  {group("Upcoming",C.green,upcoming)}
                </>
              );
            })()}
          </div>
        </div>
      </div>

      {/* ── Activity detail modal ──────────────────────────────────────────── */}
      {selected && (()=>{
        const at = metaOf(selected);
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

      {/* ── Task modal (create / edit / view) ──────────────────────────────── */}
      {taskModal && <TaskModal
        mode={taskModal.mode}
        task={taskModal.data}
        selectedDate={selectedDate}
        onClose={()=>setTaskModal(null)}
        onSubmit={submitTask}
        onDone={doneTask}
        onLogCall={()=>{}}
        onMakeCall={()=>{}}
      />}

      {/* ── Appointment modal (create / edit / view) ───────────────────────── */}
      {apptModal && <AppointmentModal
        mode={apptModal.mode}
        appt={apptModal.data}
        selectedDate={selectedDate}
        onClose={()=>setApptModal(null)}
        onSubmit={submitAppt}
        onCancelAppt={cancelAppt}
        onSetOutcome={(f)=>{ setApptModal(null); setOutcomeAppt(f); }}
      />}

      {/* ── Appointment outcome modal ──────────────────────────────────────── */}
      {outcomeAppt && <AppointmentOutcomeModal
        appt={outcomeAppt}
        onClose={()=>setOutcomeAppt(null)}
        onSave={()=>{ if(outcomeAppt?.id) setActivities(prev=>prev.map(x=>x.id===outcomeAppt.id?{...x,status:"done"}:x)); setOutcomeAppt(null); }}
      />}
    </div>
  );
};

