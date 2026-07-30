import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { NewActivityModal } from "./new-activity-modal";
import { TaskModal } from "./task-modal";
import { AppointmentModal } from "../appointments/appointment-modal";
import { LeadAppointmentModal } from "../appointments/lead-appointment-modal";
import { AppointmentOutcomeModal } from "../appointments/appointment-outcome-modal";
import { ACTIVITIES_STORE, ACTIVITY_STATUS_META, ACTIVITY_TYPES, ALL_LEADS, APPOINTMENT_TYPE_KEYS, TASK_TYPE_KEYS, EVENTS_LIST, PRIORITY_META, DONE_STATUSES } from "../../lib/core";
import { C } from "../../theme";
import { useT } from "../../lib/i18n";

// ── Calendar taxonomy: 4 colour CATEGORIES ───────────────────────────────────
// Colour encodes the *category*, not the individual type — one calm hue each
// for Appointments, Tasks, Google and Vion events, instead of a 10-hue rainbow.
// Within a category the icon (and text label) tells the subtypes apart, so the
// grid stays readable. Brand orange is reserved for chrome (today marker,
// selection, buttons) so events never blend into navigation.
//
//   Appointments → blue    Tasks → amber    Google → green    Vion → violet
//
// The three toggleable "calendars" (My Calendars) map onto these categories:
//   • CRM = Appointments + Tasks    • Google    • Vion (company events)
const CATEGORY_META = {
  appointment: { label:"Appointments",  color:"#2563EB", calendar:"crm"    },
  task:        { label:"Tasks",         color:"#F59E0B", calendar:"crm"    },
  google:      { label:"Google Events", color:"#34A853", calendar:"google" },
  vion:        { label:"Vion Events",   color:"#7C3AED", calendar:"vion"   },
};

// Individual types keep an icon + label but inherit their category's colour.
const TYPE_META = {
  // Appointment types (CRM)
  consultation: { label:"Consultation",     icon:"💼",  category:"appointment" },
  recruiting:   { label:"Recruiting",        icon:"🧑‍💼", category:"appointment" },
  business:     { label:"Business Opening",  icon:"🏢",  category:"appointment" },
  investment:   { label:"Investment",        icon:"📈",  category:"appointment" },
  finance:      { label:"Finance",           icon:"💰",  category:"appointment" },
  other:        { label:"Other",             icon:"📌",  category:"appointment" },
  // Task types (CRM)
  call:         { label:"Call",              icon:"📞",  category:"task" },
  email:        { label:"Email",             icon:"✉️",  category:"task" },
  note:         { label:"To-Do",             icon:"📝",  category:"task" },
  // External calendars (single-type sources)
  google:       { label:"Google Event",      icon:"🗓️",  category:"google" },
  vion:         { label:"Vion Event",        icon:"🏢",  category:"vion" },
};

// A few sample Google-calendar entries so the "Google events" toggle is
// meaningful (there is no live Google sync in this mock).
const GOOGLE_EVENTS = [
  { id:"g1", title:"Mittagessen Team",  date:"2026-06-29", time:"12:30", end:"13:30" },
  { id:"g2", title:"Messe Finanzforum", date:"2026-06-30", time:"10:00", end:"16:00" },
  { id:"g3", title:"Video-Call",        date:"2026-06-30", time:"14:00", end:"14:30" },
  { id:"g4", title:"Zahnarzt",          date:"2026-07-01", time:"11:00", end:"11:45" },
  { id:"g5", title:"Team-Meeting",      date:"2026-07-02", time:"15:00", end:"16:00" },
  { id:"g6", title:"Video-Beratung",    date:"2026-07-04", time:"10:00", end:"11:00" },
];

// ── Demo seed: one of every calendar type in the current week ─────────────────
// So all six appointment types, all three task types, plus Google and Vion, are
// visible on the calendar (Mon 29 Jun – Fri 3 Jul 2026). Owned by the signed-in
// GP (Anna Klein) so they show under the default "mine" filter. Appointments
// carry entityType "appointment" (→ Appointment modal); tasks carry entityType
// "task" (→ Task modal); Vion samples use isEvent (→ read-only detail).
const mkAppt = (id,date,start,end,apptType,lead) => ({
  id, type:"inperson", apptType, title:lead, lead, leadId:null,
  date, time:start, end, gp:"Anna Klein", vd:"Thomas Müller",
  status:"upcoming", lifecycle:"Lead", recur:"Once", priority:"normal",
  entityType:"appointment", category:"appointment",
});
const mkTask = (id,type,date,time,title,lead,priority) => ({
  id, type, title, lead, leadId:null, date, time, end:"",
  gp:"Anna Klein", vd:"Thomas Müller", status:"pending", priority, recur:"Once",
  entityType:"task", category:"task", channels:["push","inapp"],
});
const SAMPLE_ACTIVITIES = [
  // Appointment types (Consultation/Investment/Business/Finance already exist on
  // 29 Jun in the real data — add Recruiting + Other, plus a fuller spread).
  mkAppt("s-ap-recruiting","2026-06-30","10:00","10:45","Recruiting",            "Jonas Vogel"),
  mkAppt("s-ap-business",  "2026-06-30","14:00","15:00","Business Opening",      "Ilka Brand"),
  mkAppt("s-ap-finance",   "2026-07-02","10:00","10:30","Finance Talk",         "Sven Alt"),
  mkAppt("s-ap-other",     "2026-07-02","15:00","15:45","Other",                "Nora Baumann"),
  mkAppt("s-ap-consult",   "2026-07-03","09:00","09:45","Consultation Appointment","Mara Ebert"),
  mkAppt("s-ap-invest",    "2026-07-03","11:00","12:00","Investment Talk",      "Timo Reich"),
  // Task types
  mkTask("s-tk-call", "call", "2026-06-30","09:00","Call back — Jonas Vogel",     "Jonas Vogel", "high"),
  mkTask("s-tk-email","email","2026-07-02","09:30","Send brochure — Nora Baumann","Nora Baumann","normal"),
  mkTask("s-tk-note", "note", "2026-07-03","08:30","Prepare weekly report",       null,          "low"),
];
const VION_SAMPLES = [
  { id:"vs-business", isEvent:true, eventIcon:"🏢", title:"Business Opening — Lisbon",   date:"2026-06-30", time:"09:00", end:"19:30", location:"Marriott Hotel, Lisbon", status:"upcoming", recur:"Once", entityType:"event", category:"event" },
  { id:"vs-invest",   isEvent:true, eventIcon:"📈", title:"Investment Talk — Frankfurt", date:"2026-07-02", time:"18:00", end:"20:30", location:"vion Office Frankfurt", status:"upcoming", recur:"Once", entityType:"event", category:"event" },
  { id:"vs-gold",     isEvent:true, eventIcon:"🥇", title:"Gold Vortrag — München",      date:"2026-07-03", time:"19:00", end:"21:00", location:"vion Office München",   status:"upcoming", recur:"Once", entityType:"event", category:"event" },
];

export const CalendarPage = ({ role, navigateTo, activities=[], setActivities, addAppointment, addReminder, viewMode }) => {
  const t = useT();
  const mobile   = viewMode === "responsive";   // stack the app-shell layout for mobile
  const TODAY    = "2026-06-29";
  const MONTHS   = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const [currentDate, setCurrentDate] = useState(new Date(2026,5,29));
  const [calFilter,   setCalFilter]   = useState("mine");   // each role sees only its own calendar
  const [view,        setView]        = useState("month"); // month | week | day
  const [showNew,     setShowNew]     = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [editActivity,setEditActivity]= useState(null);
  const [selected,    setSelected]    = useState(null);    // activity detail modal
  const [selectedDate,setSelectedDate]= useState(TODAY);  // highlighted day
  const [taskModal,   setTaskModal]   = useState(null);    // { mode, data }
  const [apptModal,   setApptModal]   = useState(null);    // { mode, data } — Network appointments (actionable)
  const [leadAppt,    setLeadAppt]    = useState(null);    // Lead appointment (read-only detail)
  const [outcomeAppt, setOutcomeAppt] = useState(null);
  const [cellMenu,    setCellMenu]    = useState(null);    // { x, y, date, time } — create-here popover
  const [dayPopover,  setDayPopover]  = useState(null);    // { date, x, y, items } — "+N more" day list
  const [miniDate,    setMiniDate]    = useState(new Date(2026,5,29)); // month shown by the sidebar mini-calendar

  // "My calendars" toggles (CRM vs Google) + per-type visibility.
  const [showCRM,     setShowCRM]     = useState(true);
  const [showGoogle,  setShowGoogle]  = useState(true);
  const [showVion,    setShowVion]    = useState(true);
  // Event-Types filter is category-level only (Appointments / Tasks). Appointment
  // and task subtypes are no longer enumerated in the filter — the grid icon
  // still tells appointment subtypes apart, but you toggle whole categories here.
  const [hiddenCats, setHiddenCats] = useState<Set<string>>(() => new Set());
  const toggleCat = (k) => setHiddenCats(prev => {
    const next = new Set(prev);
    next.has(k) ? next.delete(k) : next.add(k);
    return next;
  });

  // Week/Day cell click → select the date and offer to create something in
  // that slot (task or appointment, date + hour prefilled).
  const openCellMenu = (e, date, hour) => {
    e.stopPropagation();
    setSelectedDate(date);
    setCellMenu({
      x: Math.min(e.clientX, window.innerWidth - 240),
      y: Math.min(e.clientY, window.innerHeight - 150),
      date,
      time: hour != null ? `${String(hour).padStart(2, "0")}:00` : "09:00",
    });
  };

  // "+N more" click → open a day popover listing all events for that day/slot
  // (FullCalendar's moreLinkClick behaviour). stopPropagation so the cell's
  // "create here" menu does not also fire.
  const openMore = (e, date, items) => {
    e.stopPropagation();
    setSelectedDate(date);
    setDayPopover({
      date,
      x: Math.min(e.clientX, window.innerWidth - 300),
      y: Math.min(e.clientY, window.innerHeight - 340),
      items,
    });
  };

  const myGP = "Anna Klein"; const myVD = "Thomas Müller";

  // ── Events on the calendar ────────────────────────────────────────────────
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
      isEvent:true, eventId:ev.id, eventType:ev.type, eventColor:ev.color, eventIcon:ev.icon,
      entityType:"event", category:"event",
    };
  })).filter(x => x.date), []);

  // Google events → activity shape.
  const googleActivities = useMemo(() => GOOGLE_EVENTS.map(g => ({
    ...g, type:"google", lead:null, priority:null, recur:"Once",
    status:"upcoming", source:"google", calendar:"google",
    entityType:"google", category:"google", gp:myGP,
  })), []);

  // Map any activity onto one of the canonical calendar types.
  const typeKeyOf = (a) => {
    if (a?.source==="google" || a?.calendar==="google" || a?.type==="google") return "google";
    if (a?.isEvent) return "vion";   // EVENTS_LIST = Vion company events
    const ty = a?.type;
    // Appointments — including phone/video appointments — are keyed by their
    // apptType, so all six appointment types get their own icon inside the
    // (blue) Appointments category and a phone appointment is never mistaken
    // for a Call task. Tasks are disambiguated by entityType/category.
    const isApptEntity = a?.entityType==="appointment" || a?.category==="appointment"
      || ["consultation","recruiting","business","investment","finance","inperson","video"].includes(ty);
    if (isApptEntity) {
      const at = `${a?.apptType||""} ${ty||""}`.toLowerCase();
      if (at.includes("recruit"))    return "recruiting";
      if (at.includes("business"))   return "business";
      if (at.includes("investment")) return "investment";
      if (at.includes("finance"))    return "finance";
      if (at.includes("consult") || ty==="inperson" || ty==="video" || ty==="call") return "consultation";
      if (ty==="other" || at.includes("other")) return "other";
      return "other";
    }
    // Tasks / reminders
    if (ty==="call")  return "call";
    if (ty==="email") return "email";
    if (["note","whatsapp","document"].includes(ty)) return "note";
    return "note";
  };

  // Which "calendar" (My Calendars source) an activity belongs to.
  const calendarOf = (a) => CATEGORY_META[TYPE_META[typeKeyOf(a)]?.category || "task"].calendar;

  // Effective meta (colour + icon + label) for an activity. Colour comes from
  // the CATEGORY; Vion events keep their own event icon for the subtype cue.
  const metaOf = (a) => {
    const key = typeKeyOf(a);
    const tm  = TYPE_META[key] || TYPE_META.note;
    const color = CATEGORY_META[tm.category].color;
    const icon  = (key==="vion" && a?.eventIcon) ? a.eventIcon : tm.icon;
    return { key, category:tm.category, label:tm.label, icon, color, bg: color+"18" };
  };

  const baseActs = [...activities, ...eventActivities, ...googleActivities, ...SAMPLE_ACTIVITIES, ...VION_SAMPLES];

  // Filter activities: calendar (CRM/Google/Vion) → per-type → owner.
  const visible = baseActs.filter(a => {
    const key = typeKeyOf(a);
    const cal = calendarOf(a);
    if (cal==="google" && !showGoogle) return false;
    if (cal==="vion"   && !showVion)   return false;
    if (cal==="crm"    && !showCRM)    return false;
    const cat = TYPE_META[key]?.category;
    if ((cat==="appointment" || cat==="task") && hiddenCats.has(cat)) return false;
    if (cal==="crm") {
      // "mine" filter: current GP's items, or unowned items
      if (calFilter === "mine" && a.gp && a.gp !== myGP) return false;
      if (calFilter === "team" && a.vd && a.vd !== myVD) return false;
      if (calFilter !== "all" && calFilter !== "mine" && calFilter !== "team" && a.gp && a.gp !== calFilter) return false;
    }
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
  const focusDate = (d) => { if(!d) return; const dt=new Date(d+"T12:00"); setCurrentDate(dt); setMiniDate(dt); setSelectedDate(d); };

  // Route the click to the right modal by CATEGORY — the same taxonomy that
  // drives the colour: Google/Vion → read-only detail, Appointments → the
  // appointment modal, Tasks → the task modal. (A phone "call" appointment is
  // an appointment, not a Call task, so it no longer opens the wrong modal.)
  const openActivity = (a) => {
    const cat = TYPE_META[typeKeyOf(a)]?.category;
    if (cat==="google" || cat==="vion" || a.isEvent || a.source==="google") { setSelected(a); return; }
    if (cat==="appointment") {
      const lifecycle = a.lifecycle || "Lead";
      const data = {
        id:a.id, title:a.title, contact:a.lead, leadId:a.leadId, lifecycle,
        apptType:a.apptType||"Consultation Appointment",
        date:a.date, time:a.time, end:a.end, location:a.location, attendees:a.attendees,
        attachment:a.attachment, attachments:a.attachments,
        reminder:a.reminder, reminderCustom:a.reminderCustom, note:a.note, reminderOn:true };
      // Lead vs Network appointments open different modals: Leads are read-only
      // (worked in Processing & Feedback), Network appointments are actionable.
      if (lifecycle === "Network") setApptModal({ mode:"view", data });
      else                         setLeadAppt(data);
    } else {
      setTaskModal({ mode:"view", data:{
        id:a.id, type:TASK_TYPE_KEYS.includes(a.type)?a.type:"note", title:a.title, contact:a.lead,
        priority:a.priority||"normal", date:a.date, time:a.time, note:a.note, recur:a.recur||"Once",
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
  // Done = mark the task complete and keep it (stays in sync with the dashboard),
  // rather than deleting it. Reversible via the dashboard checkbox.
  const doneTask = (f) => {
    setActivities(prev=>prev.map(x=>x.id===f.id ? { ...x, status:"done" } : x));
    const i = ACTIVITIES_STORE.findIndex(x=>x.id===f.id); if (i>=0) ACTIVITIES_STORE[i] = { ...ACTIVITIES_STORE[i], status:"done" };
    setTaskModal(null);
  };
  const deleteTask = (f) => {
    setActivities(prev=>prev.filter(x=>x.id!==f.id));
    const i = ACTIVITIES_STORE.findIndex(x=>x.id===f.id); if (i>=0) ACTIVITIES_STORE.splice(i,1);
    setTaskModal(null);
  };

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
  const totalRows  = totalCells / 7;

  const fmtDate = (y,m,d) => `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;

  // Week view helpers
  const weekStart = new Date(currentDate);
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay()+6)%7));
  const weekDays = Array.from({length:7},(_,i)=>{
    const d = new Date(weekStart); d.setDate(d.getDate()+i); return d;
  });
  const HOURS = Array.from({length:13},(_,i)=>i+7); // 07:00–19:00

  const fmtDateObj = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;

  const DE_DOW = ["MO","DI","MI","DO","FR","SA","SO"];

  // Select a day (from grid or mini-calendar) and keep both calendars in sync.
  const selectDay = (dateStr) => {
    if (!dateStr) return;
    setSelectedDate(dateStr);
    const d = new Date(dateStr+"T12:00");
    setCurrentDate(d);
    setMiniDate(new Date(d.getFullYear(), d.getMonth(), 1));
  };

  // ── Sidebar mini-calendar ──────────────────────────────────────────────────
  const MiniCal = () => {
    const my = miniDate.getFullYear();
    const mm = miniDate.getMonth();
    const mFirst = new Date(my, mm, 1).getDay();
    const mOffset = mFirst === 0 ? 6 : mFirst - 1;
    const mDays = new Date(my, mm+1, 0).getDate();
    const cells = [];
    for (let i=0;i<mOffset;i++) cells.push(null);
    for (let d=1;d<=mDays;d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    const go = (delta) => setMiniDate(new Date(my, mm+delta, 1));
    return (
      <div>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8 }}>
          <button onClick={()=>go(-1)} aria-label="Previous month"
            style={{ border:"none",background:"none",cursor:"pointer",color:C.muted,fontSize:12,fontWeight:700,padding:2 }}>◀</button>
          <span style={{ fontSize:12,fontWeight:800,color:C.navy }}>{MONTHS[mm]} {my}</span>
          <button onClick={()=>go(1)} aria-label="Next month"
            style={{ border:"none",background:"none",cursor:"pointer",color:C.muted,fontSize:12,fontWeight:700,padding:2 }}>▶</button>
        </div>
        <div style={{ display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:1,marginBottom:3 }}>
          {["M","D","M","D","F","S","S"].map((d,i)=>(
            <div key={i} style={{ textAlign:"center",fontSize:9,fontWeight:700,color:i>=5?C.red:C.muted,padding:"2px 0" }}>{d}</div>
          ))}
        </div>
        <div style={{ display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:1 }}>
          {cells.map((d,i)=>{
            if (d==null) return <div key={i} />;
            const ds = fmtDate(my,mm,d);
            const isToday = ds===TODAY;
            const isSel   = ds===selectedDate;
            const dayActs = byDate[ds] || [];
            const dots = [...new Set(dayActs.map(a=>metaOf(a).color))].slice(0,3);
            return (
              <button key={i} onClick={()=>selectDay(ds)} title={dayActs.length?`${dayActs.length} event(s)`:""}
                style={{ position:"relative",border:"none",cursor:"pointer",borderRadius:6,
                  padding:"4px 0 6px",fontFamily:"inherit",
                  background:isToday?C.primary:isSel?C.primarySoft:"transparent",
                  color:isToday?"#fff":isSel?C.primaryDark:C.text,
                  fontSize:10,fontWeight:isToday||isSel?800:500 }}>
                {d}
                {dayActs.length>0 && (
                  <div style={{ position:"absolute",bottom:1,left:0,right:0,display:"flex",justifyContent:"center",gap:2 }}>
                    {dots.map((c,di)=><span key={di} style={{ width:4,height:4,borderRadius:"50%",background:isToday?"#fff":c }}/>)}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // Sidebar section wrapper
  const SideSection = ({title, children}) => (
    <div style={{ border:`1px solid ${C.border}`,borderRadius:12,background:"#fff",padding:"12px 14px" }}>
      {title && <div style={{ fontSize:10,fontWeight:800,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:10 }}>{title}</div>}
      {children}
    </div>
  );

  const CalCheck = ({checked, onChange, label, color=C.primary}) => (
    <label style={{ display:"flex",alignItems:"center",gap:9,cursor:"pointer",padding:"3px 0",fontSize:13,color:C.text,fontWeight:600 }}>
      <span onClick={(e)=>{e.preventDefault();onChange();}}
        style={{ width:18,height:18,borderRadius:5,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",
          background:checked?color:"#fff",border:`1.5px solid ${checked?color:C.border}`,color:"#fff",fontSize:12,fontWeight:800 }}>
        {checked?"✓":""}
      </span>
      <span style={{ flex:1 }}>{label}</span>
    </label>
  );

  return (
    <div style={{ display:"flex",flexDirection:"column",height:mobile?"auto":"100%",fontFamily:"inherit",overflow:mobile?"visible":"hidden" }}>

      {/* ── Top bar ───────────────────────────────────────────────────────── */}
      <div style={{ padding:"12px 20px",borderBottom:`1px solid ${C.border}`,background:"#fff",
        display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",flexShrink:0 }}>
        <h1 style={{ margin:0,fontSize:18,fontWeight:800,color:C.navy }}>📅 {t("calendarTitle")||"Calendar"}</h1>

        <div style={{ marginLeft:"auto",display:"flex",gap:8,alignItems:"center" }}>
          {/* View switcher */}
          <div style={{ display:"flex",border:`1px solid ${C.border}`,borderRadius:8,overflow:"hidden",flexShrink:0 }}>
            {["month","week","day","year"].map(v=>(
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
            else if(view==="year") d.setFullYear(d.getFullYear()-1);
            else d.setDate(d.getDate()-1);
            setCurrentDate(d); setMiniDate(new Date(d.getFullYear(),d.getMonth(),1)); }}
            style={{ width:28,height:28,borderRadius:7,border:`1px solid ${C.border}`,background:"#fff",color:C.slate,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>‹</button>
          <span style={{ fontSize:13,fontWeight:700,color:C.text,minWidth:130,textAlign:"center" }}>
            {view==="month" ? `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`
             : view==="week" ? `${weekDays[0].getDate()} – ${weekDays[6].getDate()} ${MONTHS[weekDays[6].getMonth()]}`
             : view==="year" ? `${currentDate.getFullYear()}`
             : currentDate.toLocaleDateString("en-GB",{weekday:"short",day:"numeric",month:"short"})}
          </span>
          <button onClick={()=>{ const d=new Date(currentDate);
            if(view==="month") d.setMonth(d.getMonth()+1);
            else if(view==="week") d.setDate(d.getDate()+7);
            else if(view==="year") d.setFullYear(d.getFullYear()+1);
            else d.setDate(d.getDate()+1);
            setCurrentDate(d); setMiniDate(new Date(d.getFullYear(),d.getMonth(),1)); }}
            style={{ width:28,height:28,borderRadius:7,border:`1px solid ${C.border}`,background:"#fff",color:C.slate,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>›</button>

          <button onClick={()=>focusDate(TODAY)}
            style={{ padding:"6px 12px",borderRadius:8,border:`1px solid ${C.border}`,background:"#fff",color:C.slate,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit" }}>Today</button>

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
                {[[`✅ ${t("createTask")||"Create Task"}`,()=>setTaskModal({mode:"create"})],[`📅 ${t("scheduleAppointment")||"Schedule Appointment"}`,()=>setApptModal({mode:"create"})]].map(([label,fn])=>(
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

      {/* ── Main body: sidebar + calendar ─────────────────────────────────── */}
      <div style={{ flex:1,display:"flex",flexDirection:mobile?"column":"row",overflow:mobile?"visible":"hidden",background:"#F9FAFB" }}>

        {/* ── Left sidebar ─────────────────────────────────────────────────── */}
        <div style={{ width:mobile?"auto":250,flexShrink:mobile?1:0,
          borderRight:mobile?"none":`1px solid ${C.border}`,borderBottom:mobile?`1px solid ${C.border}`:"none",background:"#F9FAFB",
          padding:"14px",display:"flex",flexDirection:"column",gap:14,overflowY:mobile?"visible":"auto" }}>

          {/* Mini-calendar is a desktop-only convenience — on mobile the main
              grid already fills the screen, so we drop it to save vertical space. */}
          {!mobile && <SideSection><MiniCal/></SideSection>}

          <SideSection title="My Calendars">
            <CalCheck checked={showCRM}    onChange={()=>setShowCRM(v=>!v)}    label="CRM Events"    color={C.primary}/>
            <CalCheck checked={showGoogle} onChange={()=>setShowGoogle(v=>!v)} label="Google Events" color={CATEGORY_META.google.color}/>
            <CalCheck checked={showVion}   onChange={()=>setShowVion(v=>!v)}   label="Vion Events"   color={CATEGORY_META.vion.color}/>
          </SideSection>

          <SideSection title="Event Types">
            <CalCheck checked={!hiddenCats.has("appointment")} onChange={()=>toggleCat("appointment")}
              label={CATEGORY_META.appointment.label} color={CATEGORY_META.appointment.color}/>
            <CalCheck checked={!hiddenCats.has("task")} onChange={()=>toggleCat("task")}
              label={CATEGORY_META.task.label} color={CATEGORY_META.task.color}/>
          </SideSection>
        </div>

        {/* ── Calendar area ────────────────────────────────────────────────── */}
        <div style={{ flex:1,display:"flex",flexDirection:"column",overflow:mobile?"visible":"hidden",background:"#fff",minHeight:mobile?"70vh":undefined }}>

          {/* ── MONTH VIEW ──────────────────────────────────────────────────── */}
          {view==="month" && (
            <div style={{ flex:1,display:"flex",flexDirection:"column",overflow:mobile?"visible":"hidden" }}>
              <div style={{ display:"grid",gridTemplateColumns:"repeat(7,1fr)",flexShrink:0 }}>
                {DE_DOW.map((d,i)=>(
                  <div key={i} style={{ padding:"9px 12px",textAlign:"right",fontSize:11,fontWeight:700,
                    color:i>=5?C.red:C.muted,letterSpacing:"0.05em",borderBottom:`1px solid ${C.border}` }}>{d}</div>
                ))}
              </div>
              <div style={{ flex:1,display:"grid",gridTemplateColumns:"repeat(7,1fr)",
                gridTemplateRows:`repeat(${totalRows},${mobile?"minmax(64px,auto)":"1fr"})`,overflow:mobile?"visible":"auto" }}>
                {Array.from({length:totalCells}).map((_,idx)=>{
                  const dayNum  = idx - startOffset + 1;
                  const isValid = dayNum >= 1 && dayNum <= daysInMonth;
                  const dateStr = isValid ? fmtDate(year,month,dayNum) : "";
                  const isToday = dateStr === TODAY;
                  const isSel   = dateStr === selectedDate;
                  const dayActs = byDate[dateStr] || [];
                  return (
                    <div key={idx} onClick={(e)=>{ if(isValid){ selectDay(dateStr); openCellMenu(e, dateStr); } }}
                      style={{ minHeight:96,padding:"6px 7px",borderBottom:`1px solid ${C.border}`,
                        borderRight:(idx%7!==6)?`1px solid ${C.border}`:"none",
                        background:isSel?"#FFF9F0":!isValid?"#FAFAFA":"#fff",
                        cursor:isValid?"pointer":"default",overflow:"hidden" }}>
                      {isValid && (<>
                        <div style={{ display:"flex",justifyContent:"flex-end",marginBottom:4 }}>
                          <div style={{ minWidth:22,height:22,padding:"0 6px",borderRadius:isToday?11:6,fontSize:12,
                            fontWeight:isToday||isSel?800:600,
                            background:isToday?C.primary:isSel?C.primarySoft:"transparent",
                            color:isToday?"#fff":isSel?C.primaryDark:(idx%7>=5?C.red:C.text),
                            display:"flex",alignItems:"center",justifyContent:"center" }}>{dayNum}</div>
                        </div>
                        {dayActs.slice(0,3).map(a=>{ const at=metaOf(a); return (
                          <div key={a.id} title={a.title}
                            onClick={e=>{e.stopPropagation(); setSelectedDate(dateStr); openActivity(a);}}
                            style={{ display:"flex",alignItems:"center",gap:4,fontSize:10.5,fontWeight:600,
                              color:at.color,background:at.bg,
                              borderLeft:`3px solid ${at.color}`,padding:"2px 6px",
                              borderRadius:"0 4px 4px 0",marginBottom:3,
                              overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",lineHeight:1.4 }}>
                            <span style={{ flexShrink:0 }}>{at.icon}</span>
                            <span style={{ overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{a.title}</span>
                          </div>
                        );})}
                        {dayActs.length>3&&(
                          <div onClick={e=>openMore(e, dateStr, dayActs)}
                            style={{ fontSize:9,fontWeight:800,color:C.primaryDark,padding:"1px 4px",cursor:"pointer" }}>
                            +{dayActs.length-3} more
                          </div>
                        )}
                      </>)}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── WEEK VIEW ───────────────────────────────────────────────────── */}
          {view==="week" && (
            <div style={{ flex:1,overflowY:"auto" }}>
              {/* Week day headers */}
              <div style={{ display:"grid",gridTemplateColumns:"52px repeat(7,1fr)",position:"sticky",top:0,zIndex:2,background:"#fff",borderBottom:`1px solid ${C.border}` }}>
                <div style={{ background:"#FAFAFA" }}/>
                {weekDays.map((d,i)=>{
                  const ds=fmtDateObj(d); const isT=ds===TODAY; const isSel=ds===selectedDate;
                  return (
                    <div key={i} onClick={()=>selectDay(ds)}
                      style={{ padding:"6px 0",textAlign:"center",cursor:"pointer",
                        background:isSel?"#FFF9F0":"#FAFAFA",
                        borderLeft:`1px solid ${C.border}` }}>
                      <div style={{ fontSize:10,fontWeight:700,color:i>=5?C.red:C.muted,textTransform:"uppercase" }}>
                        {DE_DOW[i]}
                      </div>
                      <div style={{ width:26,height:26,borderRadius:"50%",margin:"2px auto 0",
                        background:isT?C.primary:isSel?C.primarySoft:"transparent",
                        display:"flex",alignItems:"center",justifyContent:"center",
                        fontSize:13,fontWeight:isT||isSel?800:500,
                        color:isT?"#fff":isSel?C.primaryDark:C.text }}>{d.getDate()}</div>
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
                      <div key={di} onClick={(e)=>openCellMenu(e, ds, h)}
                        style={{ borderBottom:`1px solid ${C.border}`,borderLeft:`1px solid ${C.border}`,
                          padding:"2px",cursor:"pointer",background:ds===selectedDate?"#FFF9F080":"#fff",
                          position:"relative",minHeight:52 }}>
                        {slotActs.slice(0,2).map((a,ai)=>{ const at=metaOf(a); return (
                          <div key={a.id} title={`${a.title} ${a.time||""}`}
                            onClick={e=>{ e.stopPropagation(); setSelectedDate(ds); openActivity(a); }}
                            style={{ fontSize:10,fontWeight:600,color:at.color,background:at.bg,
                              borderLeft:`2px solid ${at.color}`,padding:"2px 5px",
                              borderRadius:"0 4px 4px 0",overflow:"hidden",
                              textOverflow:"ellipsis",whiteSpace:"nowrap",margin:"1px",
                              lineHeight:1.4 }}>
                            {at.icon} {a.time&&a.time.slice(0,5)} {a.title}
                          </div>
                        );})}
                        {slotActs.length>2&&(
                          <div onClick={e=>openMore(e, ds, slotActs)}
                            style={{ fontSize:9,fontWeight:800,color:C.primaryDark,padding:"1px 5px",cursor:"pointer" }}>
                            +{slotActs.length-2} more
                          </div>
                        )}
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
            return (
              <div style={{ flex:1,overflowY:"auto" }}>
                {HOURS.map(h=>{
                  const slotActs = dayActs.filter(a=>a.time&&parseInt(a.time)===h);
                  const hasConflict = slotActs.length>1;
                  return (
                    <div key={h} onClick={(e)=>openCellMenu(e, ds, h)}
                      style={{ display:"flex",gap:0,minHeight:56,cursor:"pointer",
                      borderBottom:`1px solid ${C.border}`,background:hasConflict?"#FFF7ED":"#fff" }}>
                      <div style={{ width:60,flexShrink:0,padding:"6px 8px 0",
                        fontSize:11,color:C.muted,textAlign:"right",borderRight:`1px solid ${C.border}`,
                        background:"#FAFAFA" }}>
                        {String(h).padStart(2,"0")}:00
                        {hasConflict&&<div style={{ fontSize:8,color:C.amber,fontWeight:700 }}>⚠ conflict</div>}
                      </div>
                      <div style={{ flex:1,padding:"4px 8px",display:"flex",
                        flexDirection:hasConflict?"row":"column",gap:4,flexWrap:"wrap" }}>
                        {slotActs.map((a,ai)=>{
                          const at=metaOf(a);
                          return (
                            <div key={a.id}
                              style={{ flex:hasConflict?`0 0 calc(${100/Math.min(slotActs.length,3)}% - 4px)`:"1",
                                padding:"6px 10px",borderRadius:7,background:at.bg,
                                borderLeft:`3px solid ${at.color}`,cursor:"pointer",
                                outline:hasConflict&&ai>0?`1px dashed ${at.color}40`:"none" }}
                              onClick={(e)=>{ e.stopPropagation(); openActivity(a); }}>
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
                    <div style={{ fontSize:13 }}>No activities on this day</div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* ── YEAR VIEW ───────────────────────────────────────────────────── */}
          {view==="year" && (
            <div style={{ flex:1,overflow:"auto",padding:"14px",display:"grid",
              gridTemplateColumns:"repeat(4,1fr)",gap:14,alignContent:"start" }}>
              {MONTHS.map((mName,mi)=>{
                const my = currentDate.getFullYear();
                const mFirst = new Date(my, mi, 1).getDay();
                const mOffset = mFirst === 0 ? 6 : mFirst - 1;
                const mDays = new Date(my, mi+1, 0).getDate();
                const cells = [];
                for (let i=0;i<mOffset;i++) cells.push(null);
                for (let d=1;d<=mDays;d++) cells.push(d);
                while (cells.length % 7 !== 0) cells.push(null);
                return (
                  <div key={mi} style={{ border:`1px solid ${C.border}`,borderRadius:10,background:"#fff",padding:"10px 11px" }}>
                    <div onClick={()=>{ const d=new Date(my,mi,1); setCurrentDate(d); setMiniDate(d); setView("month"); }}
                      style={{ fontSize:12,fontWeight:800,color:C.navy,marginBottom:7,cursor:"pointer" }}
                      title={`Open ${mName} ${my}`}>{mName}</div>
                    <div style={{ display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:1,marginBottom:2 }}>
                      {["M","D","M","D","F","S","S"].map((d,i)=>(
                        <div key={i} style={{ textAlign:"center",fontSize:8,fontWeight:700,color:i>=5?C.red:C.muted }}>{d}</div>
                      ))}
                    </div>
                    <div style={{ display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:1 }}>
                      {cells.map((d,i)=>{
                        if (d==null) return <div key={i} />;
                        const ds = fmtDate(my,mi,d);
                        const isToday = ds===TODAY;
                        const isSel   = ds===selectedDate;
                        const dayActs = byDate[ds] || [];
                        const dots = [...new Set(dayActs.map(a=>metaOf(a).color))].slice(0,3);
                        return (
                          <button key={i}
                            onClick={()=>{ const dt=new Date(my,mi,d); setSelectedDate(ds); setCurrentDate(dt); setMiniDate(new Date(my,mi,1)); setView("day"); }}
                            title={dayActs.length?`${dayActs.length} event(s)`:""}
                            style={{ position:"relative",border:"none",cursor:"pointer",borderRadius:5,
                              padding:"3px 0 6px",fontFamily:"inherit",
                              background:isToday?C.primary:isSel?C.primarySoft:"transparent",
                              color:isToday?"#fff":isSel?C.primaryDark:C.text,
                              fontSize:9,fontWeight:isToday||isSel?800:500 }}>
                            {d}
                            {dayActs.length>0 && (
                              <div style={{ position:"absolute",bottom:1,left:0,right:0,display:"flex",justifyContent:"center",gap:1.5 }}>
                                {dots.map((c,di)=><span key={di} style={{ width:3,height:3,borderRadius:"50%",background:isToday?"#fff":c }}/>)}
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer summary */}
          <div style={{ padding:"6px 16px",borderTop:`1px solid ${C.border}`,background:"#FAFAFA",
            display:"flex",gap:12,alignItems:"center",flexShrink:0 }}>
            <span style={{ fontSize:11,fontWeight:700,color:C.navy }}>
              {selectedDate===TODAY?"Today":new Date(selectedDate+"T12:00").toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long"})}
            </span>
            <span style={{ fontSize:11,color:C.muted }}>
              {(byDate[selectedDate]||[]).length} on this day
            </span>
            <span style={{ marginLeft:"auto",fontSize:11,color:C.muted }}>{visible.length} shown</span>
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
              {[["📅","Date & Time",`${selected.date}${selected.time?` · ${selected.time}`:""}${selected.end?` – ${selected.end}`:""}`],["📍","Location",selected.location||"—"],["👤","Contact",selected.lead||"—"],["🔁","Recurrence",selected.recur||"Once"],["⚡","Status",sm.label]].filter(([,l,v])=>v&&v!=="—").map(([ic,l,v])=>(
                <div key={l} style={{ display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${C.border}`,fontSize:12 }}>
                  <span style={{ color:C.muted }}>{ic} {l}</span><span style={{ color:C.text,fontWeight:600,maxWidth:240,textAlign:"right" }}>{v}</span>
                </div>
              ))}
              <div style={{ display:"flex",gap:8,marginTop:14 }}>
                {!selected.isEvent && selected.source!=="google" && (
                  <button onClick={()=>{ setEditActivity(selected); setSelected(null); setShowNew(true); }}
                    style={{ flex:1,padding:"9px",borderRadius:9,border:`1px solid ${C.border}`,background:"#fff",color:C.slate,fontSize:12,fontWeight:600,cursor:"pointer" }}>✏️ Edit</button>
                )}
                <button onClick={()=>setSelected(null)} style={{ flex:1,padding:"9px",borderRadius:9,border:"none",background:C.primary,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer" }}>Close</button>
              </div>
            </div>
          </>
        );
      })()}

      {/* ── Cell create-here popover (Week/Day views) ──────────────────────── */}
      {cellMenu && (<>
        <div onClick={()=>setCellMenu(null)} style={{ position:"fixed",inset:0,zIndex:300 }}/>
        <div style={{ position:"fixed",top:cellMenu.y,left:cellMenu.x,zIndex:301,background:"#fff",
          borderRadius:12,boxShadow:"0 8px 32px rgba(0,0,0,0.15)",border:`1px solid ${C.border}`,
          minWidth:220,padding:"6px 0",overflow:"hidden" }}>
          <div style={{ padding:"7px 16px 6px",borderBottom:`1px solid ${C.border}`,fontSize:11,fontWeight:700,color:C.muted }}>
            📅 {new Date(cellMenu.date+"T12:00").toLocaleDateString("en-GB",{weekday:"short",day:"numeric",month:"short"})} · {cellMenu.time}
          </div>
          {[[`✅ ${t("createTask")||"Create Task"}`,()=>setTaskModal({mode:"create",data:{date:cellMenu.date,time:cellMenu.time}})],
            [`📅 ${t("scheduleAppointment")||"Schedule Appointment"}`,()=>setApptModal({mode:"create",data:{date:cellMenu.date,time:cellMenu.time}})]].map(([label,fn])=>(
            <div key={label} onClick={()=>{ setCellMenu(null); fn(); }}
              style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 16px",cursor:"pointer",fontSize:13,fontWeight:600,color:C.text }}
              onMouseEnter={e=>e.currentTarget.style.background="#F8FAFC"}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              {label}
            </div>
          ))}
        </div>
      </>)}

      {/* ── "+N more" day popover — lists all events for the day/slot ───────── */}
      {dayPopover && (<>
        <div onClick={()=>setDayPopover(null)} style={{ position:"fixed",inset:0,zIndex:320 }}/>
        <div style={{ position:"fixed",top:dayPopover.y,left:dayPopover.x,zIndex:321,background:"#fff",
          borderRadius:12,boxShadow:"0 8px 32px rgba(0,0,0,0.18)",border:`1px solid ${C.border}`,
          width:280,maxHeight:340,display:"flex",flexDirection:"column",overflow:"hidden" }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 14px",borderBottom:`1px solid ${C.border}` }}>
            <span style={{ fontSize:12,fontWeight:800,color:C.navy }}>
              {new Date(dayPopover.date+"T12:00").toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long"})}
              <span style={{ color:C.muted,fontWeight:600,marginLeft:6 }}>· {dayPopover.items.length}</span>
            </span>
            <button onClick={()=>setDayPopover(null)}
              style={{ width:22,height:22,borderRadius:"50%",border:`1px solid ${C.border}`,background:"#F8FAFC",color:C.muted,fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1 }}>×</button>
          </div>
          <div style={{ overflowY:"auto",padding:"6px 0" }}>
            {dayPopover.items.map(a=>{ const at=metaOf(a); return (
              <div key={a.id} title={a.title}
                onClick={()=>{ const d=dayPopover.date; setDayPopover(null); setSelectedDate(d); openActivity(a); }}
                style={{ display:"flex",alignItems:"center",gap:8,padding:"7px 14px",cursor:"pointer",fontSize:12 }}
                onMouseEnter={e=>e.currentTarget.style.background="#F8FAFC"}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <span style={{ width:8,height:8,borderRadius:2,background:at.color,flexShrink:0 }}/>
                <span style={{ flexShrink:0 }}>{at.icon}</span>
                {a.time && <span style={{ color:C.muted,fontSize:11,flexShrink:0 }}>{a.time.slice(0,5)}</span>}
                <span style={{ flex:1,fontWeight:600,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{a.title}</span>
              </div>
            );})}
          </div>
        </div>
      </>)}

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
          if(act.date){ focusDate(act.date); }
        }}/>}

      {/* ── Task modal (create / edit / view) ──────────────────────────────── */}
      {taskModal && <TaskModal
        mode={taskModal.mode}
        task={taskModal.data}
        selectedDate={selectedDate}
        onClose={()=>setTaskModal(null)}
        onSubmit={submitTask}
        onDone={doneTask}
        onDelete={deleteTask}
        onLogCall={()=>{}}
        onMakeCall={()=>{}}
      />}

      {/* ── Appointment modal (create / edit / view) ───────────────────────── */}
      {apptModal && <AppointmentModal
        mode={apptModal.mode}
        appt={apptModal.data}
        selectedDate={selectedDate}
        role={role}
        onClose={()=>setApptModal(null)}
        onSubmit={submitAppt}
        onCancelAppt={cancelAppt}
        onSetOutcome={(f)=>{ setApptModal(null); setOutcomeAppt(f); }}
      />}

      {/* ── Lead appointment modal (read-only detail) ──────────────────────── */}
      {leadAppt && <LeadAppointmentModal
        appt={leadAppt}
        onClose={()=>setLeadAppt(null)}
        onOpenProcessing={(f)=>{
          setLeadAppt(null);
          if(!navigateTo) return;
          // Deep-link into the contact's detail (Processing & Feedback) when we
          // can resolve the lead; otherwise fall back to the Contacts list.
          const lead = ALL_LEADS.find(l => (f.leadId && l.id===f.leadId) || (f.contact && l.name===f.contact));
          if(lead) navigateTo("LeadDetail", lead);
          else     navigateTo("Leads");
        }}
      />}

      {/* ── Appointment outcome modal ──────────────────────────────────────── */}
      {outcomeAppt && <AppointmentOutcomeModal
        appt={outcomeAppt}
        onClose={()=>setOutcomeAppt(null)}
        onSave={(result={})=>{
          if(outcomeAppt?.id) setActivities(prev=>prev.map(x=>{
            if(x.id!==outcomeAppt.id) return x;
            // Record the outcome + note on the appointment. "Rescheduled" moves it
            // to the new slot and keeps it upcoming; every other outcome closes it.
            const moved = result.outcome==="Rescheduled" && result.date;
            return { ...x, outcome:result.outcome, note:result.note,
              ...(moved ? { date:result.date, time:result.time, status:"upcoming" } : { status:"done" }) };
          }));
          setOutcomeAppt(null);
        }}
      />}
    </div>
  );
};
