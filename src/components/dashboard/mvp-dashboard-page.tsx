import React, { useState, useMemo } from "react";
import { C } from "../../theme";
import { PRIORITY_META, DONE_STATUSES } from "../../lib/core";
import { useT } from "../../lib/i18n";

// ── Dashboard assignee list ───────────────────────────────────────────────────
const DASH_USERS = [
  { id: "u1", name: "Anna Klein",    role: "Berater" },
  { id: "u2", name: "Peter Schmidt", role: "Berater" },
  { id: "u3", name: "Maria Weber",   role: "Berater" },
  { id: "u4", name: "Kai Fischer",   role: "Berater" },
  { id: "u5", name: "Sophie Braun",  role: "Berater" },
];

// ── Simple SVG donut/pie chart ────────────────────────────────────────────────
const PieChart = ({ slices }) => {
  const total = slices.reduce((s, sl) => s + sl.value, 0);
  if (!total) return null;
  const R = 55, cx = 65, cy = 65, inner = 28;
  let cum = -Math.PI / 2;
  const paths = slices.map(sl => {
    const a = (sl.value / total) * 2 * Math.PI;
    const x1 = cx + R * Math.cos(cum), y1 = cy + R * Math.sin(cum);
    cum += a;
    const x2 = cx + R * Math.cos(cum), y2 = cy + R * Math.sin(cum);
    return { ...sl, path: `M${cx},${cy} L${x1},${y1} A${R},${R},0,${a > Math.PI ? 1 : 0},1,${x2},${y2} Z` };
  });
  return (
    <svg width={130} height={130} style={{ flexShrink: 0 }}>
      {paths.map((sl, i) => <path key={i} d={sl.path} fill={sl.color} />)}
      <circle cx={cx} cy={cy} r={inner} fill="#fff" />
    </svg>
  );
};

// ── Assign modal (dashboard) ──────────────────────────────────────────────────
const DashAssignModal = ({ lead, onClose }) => {
  const [assignee, setAssignee] = useState("");
  const [confirm, setConfirm]   = useState(false);
  const user = DASH_USERS.find(u => u.id === assignee);

  if (confirm) return (
    <>
      <div onClick={() => setConfirm(false)} style={{ position:"fixed",inset:0,background:"rgba(15,23,42,0.45)",zIndex:600 }}/>
      <div style={{ position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:400,maxWidth:"92vw",background:"#fff",borderRadius:16,zIndex:700,boxShadow:"0 24px 64px rgba(0,0,0,0.22)",padding:"22px 24px",fontFamily:"inherit" }}>
        <div style={{ fontSize:17,fontWeight:700,color:C.navy,marginBottom:8 }}>Confirm Assignment</div>
        <div style={{ fontSize:13,color:C.slate,marginBottom:22 }}>Assign <b>{lead?.name}</b> to <b>{user?.name}</b>?</div>
        <div style={{ display:"flex",justifyContent:"flex-end",gap:12 }}>
          <button onClick={()=>setConfirm(false)} style={{ padding:"9px 20px",borderRadius:9,border:"none",background:"transparent",color:C.slate,fontSize:13,fontWeight:600,cursor:"pointer" }}>Cancel</button>
          <button onClick={onClose} style={{ padding:"9px 24px",borderRadius:9,border:"none",background:C.primary,color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer" }}>Assign</button>
        </div>
      </div>
    </>
  );

  return (
    <>
      <div onClick={onClose} style={{ position:"fixed",inset:0,background:"rgba(15,23,42,0.45)",zIndex:400 }}/>
      <div style={{ position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:440,maxWidth:"92vw",background:"#fff",borderRadius:16,zIndex:500,boxShadow:"0 24px 64px rgba(0,0,0,0.22)",padding:"22px 24px",fontFamily:"inherit" }}>
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18 }}>
          <span style={{ fontSize:18,fontWeight:700,color:C.navy }}>Assign Contact</span>
          <button onClick={onClose} style={{ background:"none",border:"none",cursor:"pointer",fontSize:20,color:C.muted }}>×</button>
        </div>
        <div style={{ fontSize:13,color:C.slate,marginBottom:14 }}>Contact: <b>{lead?.name}</b></div>
        <label style={{ fontSize:13,fontWeight:600,color:C.navy,display:"block",marginBottom:6 }}>Assign to *</label>
        <select value={assignee} onChange={e=>setAssignee(e.target.value)}
          style={{ width:"100%",padding:"10px 12px",borderRadius:8,border:`1px solid ${C.border}`,fontSize:13,fontFamily:"inherit",color:assignee?C.text:C.muted,outline:"none",background:"#fff",marginBottom:22 }}>
          <option value="">Select a user...</option>
          {DASH_USERS.map(u=><option key={u.id} value={u.id}>{u.name} — {u.role}</option>)}
        </select>
        <div style={{ display:"flex",justifyContent:"flex-end",gap:12 }}>
          <button onClick={onClose} style={{ padding:"9px 20px",borderRadius:9,border:"none",background:"transparent",color:C.slate,fontSize:13,fontWeight:600,cursor:"pointer" }}>Cancel</button>
          <button disabled={!assignee} onClick={()=>setConfirm(true)}
            style={{ padding:"9px 24px",borderRadius:9,border:"none",background:assignee?C.primary:C.border,color:assignee?"#fff":C.muted,fontSize:13,fontWeight:700,cursor:assignee?"pointer":"default" }}>
            Assign
          </button>
        </div>
      </div>
    </>
  );
};

// ── Role → user mapping (matches mock data in CRMAppV5.jsx) ──────────────────
const ROLE_USER = {
  gp:         { name: "Anna Klein",     firstName: "Anna"    },
  vd:         { name: "Thomas Müller",  firstName: "Thomas"  },
  superadmin: { name: "Super Admin",    firstName: "Admin"   },
  manager:    { name: "Super Admin",    firstName: "Admin"   },
};

// ── Shared micro-components ───────────────────────────────────────────────────

const Avatar = ({ name, size = 32, color }) => {
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const palette  = [C.blue, C.indigo, C.green, C.amber, "#EC4899", C.purple];
  const bg       = color || palette[name.charCodeAt(0) % palette.length];
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", background: bg,
      color: "#fff", fontSize: size * 0.36, fontWeight: 700,
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    }}>
      {initials}
    </div>
  );
};

const Card = ({ children, style = {} }) => (
  <div style={{
    background: "#fff", borderRadius: 14,
    border: `1px solid ${C.border}`, ...style,
  }}>
    {children}
  </div>
);

const CardHeader = ({ title, action }) => (
  <div style={{
    padding: "11px 16px 9px",
    borderBottom: `1px solid ${C.border}`,
    display: "flex", alignItems: "center", justifyContent: "space-between",
  }}>
    <div style={{ fontSize: 15, fontWeight: 600, color: C.text }}>{title}</div>
    {action}
  </div>
);

const KpiCard = ({ label, value, sub, color = C.text, warn = false }) => (
  <Card>
    <div style={{ padding: "13px 16px" }}>
      <div style={{
        fontSize: 10, color: C.muted, fontWeight: 700,
        letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6,
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 30, fontWeight: 400, letterSpacing: "-0.03em",
        lineHeight: 1, color: warn ? C.red : color,
      }}>
        {value}
      </div>
      {sub && (
        <div style={{ marginTop: 5, fontSize: 11, color: C.muted }}>{sub}</div>
      )}
    </div>
  </Card>
);

const LinkBtn = ({ label, onClick }) => (
  <button onClick={onClick} style={{
    padding: "4px 10px", borderRadius: 7, border: `1px solid ${C.border}`,
    background: "#fff", color: C.blue, fontSize: 12, fontWeight: 600,
    cursor: "pointer", fontFamily: "inherit",
  }}>
    {label}
  </button>
);

const STATUS_COLOR = {
  open:        C.muted,
  in_progress: C.blue,
  attempted:   C.amber,
  not_reached: C.red,
  followup:    C.purple,
  appointment: C.green,
  closed:      C.green,
  no_interest: C.muted,
  dnc:         C.red,
};

const StatusPill = ({ status }) => {
  const color = STATUS_COLOR[status] || C.muted;
  return (
    <span style={{
      fontSize: 10, fontFamily: "monospace", padding: "2px 8px",
      borderRadius: 20, fontWeight: 600, textTransform: "capitalize",
      background: color + "18", color,
    }}>
      {status.replace(/_/g, " ")}
    </span>
  );
};

// Priority dot — colours come from the shared PRIORITY_META (low/normal/high/urgent)
const PriorityDot = ({ priority }) => (
  <span style={{
    width: 7, height: 7, borderRadius: "50%",
    background: (PRIORITY_META[priority] || PRIORITY_META.normal).color,
    display: "inline-block", flexShrink: 0,
  }} />
);

const TYPE_ICON = {
  call: "📞", email: "✉️", video: "📹",
  note: "📝", inperson: "🤝", import: "📥", assign: "🔀",
  consultation: "💼", recruiting: "🧑‍💼", business: "🤝", other: "📌", event: "🎟️",
};

// ─────────────────────────────────────────────────────────────────────────────
// MVP DASHBOARD — role-filtered, lightweight overview (same layout for all roles)
// ─────────────────────────────────────────────────────────────────────────────
// ── Mock data used when the parent passes no leads ───────────────────────────
const MOCK_LEADS = [
  { id:"m1",  name:"Sandra Richter",  status:"open",        assignedVD:"Thomas Müller", assignedGP:"Anna Klein",   city:"Berlin",  source:"Referral",    campaign:"Webinar Q1" },
  { id:"m2",  name:"Markus Bauer",    status:"open",        assignedVD:"Thomas Müller", assignedGP:"",             city:"Hamburg", source:"Landing Page", campaign:"Spring 2026" },
  { id:"m3",  name:"Julia Weiss",     status:"in_progress", assignedVD:"Thomas Müller", assignedGP:"Anna Klein",   city:"Munich",  source:"Event",        campaign:"Webinar Q1" },
  { id:"m4",  name:"Peter Schmidt",   status:"open",        assignedVD:"",              assignedGP:"",             city:"Cologne", source:"Referral",    campaign:"Spring 2026" },
  { id:"m5",  name:"Laura Fischer",   status:"open",        assignedVD:"Thomas Müller", assignedGP:"",             city:"Vienna",  source:"Social",       campaign:"Webinar Q1" },
  { id:"m6",  name:"Hans Müller",     status:"appointment", assignedVD:"Thomas Müller", assignedGP:"Anna Klein",   city:"Zurich",  source:"Referral",    campaign:"Gold VIP" },
  { id:"m7",  name:"Eva Braun",       status:"open",        assignedVD:"",              assignedGP:"",             city:"Berlin",  source:"Landing Page", campaign:"Spring 2026" },
  { id:"m8",  name:"Klaus Wagner",    status:"open",        assignedVD:"Thomas Müller", assignedGP:"Anna Klein",   city:"Munich",  source:"Event",        campaign:"Webinar Q1" },
  { id:"m9",  name:"Maria Huber",     status:"closed",      assignedVD:"Thomas Müller", assignedGP:"Anna Klein",   city:"Vienna",  source:"Referral",    campaign:"Gold VIP" },
  { id:"m10", name:"Thomas Berger",   status:"open",        assignedVD:"",              assignedGP:"",             city:"Hamburg", source:"Social",       campaign:"Spring 2026" },
  { id:"ml10", name:"Sandra Richter",   city:"Berlin",      source:"Meta Ads",     campaign:"General",           status:"open", assignedVD:null, assignedGP:null, lang:"de" },
  { id:"ml11", name:"Klaus Weber",      city:"Hamburg",     source:"Landing Page", campaign:"Gold",              status:"open", assignedVD:null, assignedGP:null, lang:"de" },
  { id:"ml12", name:"Petra Hoffmann",   city:"München",     source:"Referral",     campaign:"Financing",         status:"open", assignedVD:null, assignedGP:null, lang:"de" },
  { id:"ml13", name:"Jens Brinkmann",   city:"Frankfurt",   source:"Zapier",       campaign:"Securities",        status:"open", assignedVD:null, assignedGP:null, lang:"de" },
  { id:"ml14", name:"Maria Schneider",  city:"Düsseldorf",  source:"Meta Ads",     campaign:"Real Estate",       status:"open", assignedVD:null, assignedGP:null, lang:"de" },
  { id:"ml15", name:"Thomas Bauer",     city:"Stuttgart",   source:"Google Sheets",campaign:"Crypto",            status:"open", assignedVD:null, assignedGP:null, lang:"de" },
];
const MOCK_ACTIVITIES = [
  { id:"act1", entityType:"task",     title:"Follow up Sandra Richter",  status:"pending", priority:"high",   date:"2026-06-28", gp:"Anna Klein",   vd:"Thomas Müller", type:"call" },
  { id:"act2", entityType:"reminder", title:"Send proposal to Markus",   status:"pending", priority:"normal", date:"2026-06-29", gp:"Anna Klein",   vd:"Thomas Müller", type:"email" },
  { id:"act3", entityType:"task",     title:"Call Klaus Wagner",         status:"done",    priority:"low",    date:"2026-06-27", gp:"Anna Klein",   vd:"Thomas Müller", type:"call" },
  { id:"act4", entityType:"call",     title:"Intro call — Laura Fischer",status:"done",    priority:"normal", date:"2026-06-25", gp:"Anna Klein",   vd:"Thomas Müller", type:"call",  time:"10:00" },
  { id:"act5", entityType:"email",    title:"Welcome email sent",        status:"done",    priority:"low",    date:"2026-06-24", gp:"Anna Klein",   vd:"Thomas Müller", type:"email", time:"09:15" },
  { id:"act6", entityType:"task",     title:"Prepare documents for Hans",status:"pending", priority:"urgent", date:"2026-06-29", gp:"Anna Klein",   vd:"Thomas Müller", type:"todo" },
  { id:"act7", entityType:"call",     title:"Strategy call — Eva Braun", status:"pending", priority:"high",   date:"2026-06-28", gp:"Anna Klein",   vd:"Thomas Müller", type:"call",  time:"14:30" },
  { id:"act8", entityType:"note",     title:"Note added for Maria Huber",status:"done",    priority:"low",    date:"2026-06-23", gp:"Anna Klein",   vd:"Thomas Müller", type:"note" },
];
const MOCK_APPOINTMENTS = [
  { id:"ap1", lead:"Sandra Richter", date:"2026-06-28", start:"10:00", type:"call",      status:"upcoming",  gp:"Anna Klein",  vd:"Thomas Müller" },
  { id:"ap2", lead:"Hans Müller",    date:"2026-06-28", start:"14:00", type:"video",     status:"confirmed", gp:"Anna Klein",  vd:"Thomas Müller" },
  { id:"ap3", lead:"Klaus Wagner",   date:"2026-06-28", start:"16:30", type:"inperson",  status:"upcoming",  gp:"Anna Klein",  vd:"Thomas Müller" },
];

export const MVPDashboardPage = ({ role, navigateTo, leads = [], activities = [], setActivities, appointments = [] }) => {

  const t         = useT();
  const user      = ROLE_USER[role] || ROLE_USER.superadmin;
  const userName  = user.name;
  const isSA      = role === "superadmin" || role === "manager";
  const isVD      = role === "vd";
  const isGP      = role === "gp";

  // ── Greeting ────────────────────────────────────────────────────────────────
  const hour = new Date().getHours();
  const greeting = hour < 12 ? t("greeting_morning") : hour < 17 ? t("greeting_afternoon") : t("greeting_evening");

  const roleLabel = {
    gp: t("consultant"), vd: t("salesDirector"), superadmin: t("superAdmin"), manager: t("superAdmin"),
  }[role] || role;

  // ── Use mock data when parent provides nothing ───────────────────────────────
  const allLeads       = leads.length       > 0 ? leads       : MOCK_LEADS;
  const allActivities  = activities.length  > 0 ? activities  : MOCK_ACTIVITIES;
  const allAppointments= appointments.length> 0 ? appointments: MOCK_APPOINTMENTS;

  // ── Role-scoped data filters ─────────────────────────────────────────────────
  // GP  → only their own leads / appointments / activities
  // VD  → their entire team (everyone where assignedVD === their name)
  // SA  → everything
  const scopedLeads = isGP
    ? allLeads.filter(l => l.assignedGP === userName)
    : isVD
      ? allLeads.filter(l => l.assignedVD === userName)
      : allLeads;

  const scopedAppts = isGP
    ? allAppointments.filter(a => a.gp === userName)
    : isVD
      ? allAppointments.filter(a => a.vd === userName)
      : allAppointments;

  const scopedActivities = isGP
    ? allActivities.filter(a => a.gp === userName)
    : isVD
      ? allActivities.filter(a => a.vd === userName)
      : allActivities;

  // ── KPI derivations ──────────────────────────────────────────────────────────
  const totalContacts  = scopedLeads.length;

  // New contacts = open status within scope
  // For VD/SA also surface unassigned contacts (no GP assigned yet)
  const newLeads = isGP
    ? scopedLeads.filter(l => l.status === "open")
    : isVD
      ? allLeads.filter(l => l.status === "open" && (l.assignedVD === userName || !l.assignedVD))
      : allLeads.filter(l => l.status === "open");

  const unassignedCount = newLeads.filter(l => !l.assignedGP && !l.assignedVD).length;

  const todayStr       = new Date().toISOString().slice(0, 10);
  const todayAppts     = scopedAppts.filter(a => a.date === todayStr && a.status !== "cancelled");

  // Tasks & reminders share one list (entityType reminder|task) and one "done" model.
  const isDone   = (a) => DONE_STATUSES.includes(a.status);
  const taskItems = scopedActivities
    .filter(a => a.entityType === "reminder" || a.entityType === "task")
    .sort((a, b) => Number(isDone(a)) - Number(isDone(b)));   // open first, done sink to bottom
  const openTasks  = taskItems.filter(a => !isDone(a));
  const tasksToShow = taskItems.slice(0, 7);

  // Recent activity excludes the task/reminder items shown in the Tasks panel.
  const recentActivity = scopedActivities
    .filter(a => a.entityType !== "reminder" && a.entityType !== "task")
    .slice(0, 8);

  // ── Panel titles per role ────────────────────────────────────────────────────
  const leadsTitle     = isGP ? "My Leads" : isVD ? "Pending Assignment" : "Unassigned Leads";
  const contactsLabel  = isGP ? "My Network" : isVD ? "My Leads" : t("totalContacts");
  const newLeadsLabel  = isGP ? "My Leads" : isVD ? "Pending Assignments" : "New Contacts";
  const remindersTitle = isGP ? t("myTasks") : isVD ? t("teamTasks") : t("remindersAndTasks");
  const apptsTitle     = isGP ? t("myAppointmentsToday") : isVD ? "Appointments Today" : t("appointmentsToday");

  // Contacts to show in panel (max 6) — SA: truly unassigned; VD: assigned to VD but no GP
  const panelLeads = isSA
    ? allLeads.filter(l => !l.assignedGP)
    : isVD
      ? allLeads.filter(l => l.assignedVD === userName && !l.assignedGP)
      : newLeads;
  const leadsToShow = panelLeads.slice(0, 6);

  // ── Assign modal ────────────────────────────────────────────────────────────
  const [assignTarget, setAssignTarget] = useState(null);

  // ── Done toggle — writes to the shared activities store so the Calendar stays
  //    in sync. Falls back to local state if no setter is provided. ─────────────
  const [localDone, setLocalDone] = useState({});
  const itemDone   = (it) => isDone(it) || !!localDone[it.id];
  const toggleDone = (it) => {
    const next = !itemDone(it);
    if (setActivities) {
      setActivities(prev => prev.map(x => x.id === it.id ? { ...x, status: next ? "done" : "pending" } : x));
    } else {
      setLocalDone(prev => ({ ...prev, [it.id]: next }));
    }
  };

  return (
    <>
    <div style={{ flex: 1, overflowY: "auto", fontFamily: "Inter, system-ui, sans-serif" }}>
      <div style={{ padding: "0 28px 36px" }}>

        {/* ── Page header ─────────────────────────────────────────────────── */}
        <div style={{ padding: "20px 0 16px" }}>
          <h1 style={{ fontSize: 28, fontWeight: 400, letterSpacing: "-0.025em", color: C.text, margin: 0 }}>
            {greeting}, {user.firstName}<span style={{ color: C.primary }}>.</span>
          </h1>
          <div style={{ marginTop: 5, fontSize: 12, color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            {roleLabel} · {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </div>
        </div>

        {/* ── KPI row ─────────────────────────────────────────────────────── */}
        {isSA ? (() => {
          const SA_KPIS = [
            { label:"Total Contacts", value:"2.904", delta:"+127",   up:true,  sub:"active",            warn:false, good:false },
            { label:"Unassigned",     value:"47",    delta:"−12",    up:false, sub:"Pending assignment", warn:true,  good:false },
            { label:"Appointments",   value:"134",   delta:"+23",    up:true,  sub:"Month",              warn:false, good:false },
            { label:"Closings",       value:"81",    delta:"+11",    up:true,  sub:"MTD",                warn:false, good:true  },
            { label:"Conversion",     value:"6,2",   delta:"+0,4pp", up:true,  sub:"% Org MTD",         warn:false, good:true  },
          ];
          return (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:12, marginBottom:14 }}>
              {SA_KPIS.map(k => (
                <Card key={k.label}>
                  <div style={{ padding:"13px 16px" }}>
                    <div style={{ fontSize:10, color:C.muted, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:6 }}>{k.label}</div>
                    <div style={{ fontSize:28, fontWeight:400, letterSpacing:"-0.03em", lineHeight:1, color:k.warn?C.red:k.good?C.green:C.navy, marginBottom:4 }}>{k.value}</div>
                    <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
                      <span style={{ fontSize:10, fontWeight:700, padding:"2px 6px", borderRadius:10, background:k.up?"#DCFCE7":"#FEE2E2", color:k.up?C.green:C.red }}>{k.delta}</span>
                    </div>
                    <div style={{ fontSize:10, color:C.muted }}>{k.sub}</div>
                  </div>
                </Card>
              ))}
            </div>
          );
        })() : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 14 }}>
          <KpiCard
            label={contactsLabel}
            value={totalContacts}
            sub={isGP ? "assigned to me" : "in my team"}
            color={C.navy}
          />
          <KpiCard
            label={newLeadsLabel}
            value={newLeads.length}
            sub={isGP ? "open & assigned to me" : unassignedCount > 0 ? `${unassignedCount} pending` : "all assigned"}
            color={C.primary}
            warn={!isGP && unassignedCount > 0}
          />
          <KpiCard
            label="Appointments Today"
            value={todayAppts.length}
            sub={isGP ? "my schedule" : "team schedule"}
            color={C.indigo}
          />
          <KpiCard
            label="Open Tasks"
            value={openTasks.length}
            sub="reminders & to-dos"
            color={openTasks.length > 0 ? C.amber : C.green}
          />
        </div>
        )}

        {/* ── Main content row: Leads wide | right column (Appointments + Tasks) ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 14, marginBottom: 14, alignItems: "start" }}>

          {/* ── Leads panel ─────────────────────────────────────────────────── */}
          <Card>
            <CardHeader
              title={leadsTitle}
              action={<LinkBtn label={t("allContacts")} onClick={() => navigateTo("Leads")} />}
            />
            <div style={{ padding: "2px 16px 10px", maxHeight: 320, overflowY: "auto" }}>
              {leadsToShow.length === 0 ? (
                <div style={{ padding: "16px 0", textAlign: "center", color: C.muted, fontSize: 13 }}>
                  {isGP ? "No new contacts assigned to you." : "No pending contacts right now."}
                </div>
              ) : leadsToShow.map((lead, i) => (
                <div key={lead.id} style={{
                  display: "grid",
                  gridTemplateColumns: "32px 1fr auto",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 0",
                  borderBottom: i < leadsToShow.length - 1 ? `1px solid ${C.border}` : "none",
                }}>
                  <Avatar name={lead.name} size={32} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{lead.name}</div>
                    <div style={{ fontSize: 10.5, color: C.muted, marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {lead.city} · {lead.source}
                      {isVD && lead.assignedVD && <span style={{ marginLeft: 5, color: C.slate }}>· {lead.assignedVD}</span>}
                    </div>
                  </div>
                  {isGP ? (
                    <button onClick={() => navigateTo("Leads")}
                      style={{ padding:"4px 10px",background:C.primary,color:"#fff",border:"none",borderRadius:6,fontSize:10,fontFamily:"monospace",letterSpacing:"0.08em",textTransform:"uppercase",cursor:"pointer",fontWeight:600 }}>
                      Open
                    </button>
                  ) : (
                    <button onClick={() => setAssignTarget(lead)}
                      style={{ padding:"4px 10px",background:C.primary,color:"#fff",border:"none",borderRadius:6,fontSize:10,fontFamily:"monospace",letterSpacing:"0.08em",textTransform:"uppercase",cursor:"pointer",fontWeight:600 }}>
                      Assign
                    </button>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* ── Right column: Appointments Today + Tasks stacked ─────────────── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Appointments Today */}
            <Card>
              <CardHeader
                title={apptsTitle}
                action={<LinkBtn label="Calendar →" onClick={() => navigateTo("Calendar")} />}
              />
              <div style={{ padding: "2px 14px 8px", maxHeight: 200, overflowY: "auto" }}>
                {todayAppts.length === 0 ? (
                  <div style={{ padding: "14px 0", textAlign: "center", color: C.muted, fontSize: 12.5 }}>
                    No appointments today.
                  </div>
                ) : todayAppts.map((appt, i) => {
                  const typeColor = { call: C.green, video: C.indigo, inperson: C.amber, email: C.blue }[appt.type] || C.indigo;
                  const statusColor = { upcoming: C.blue, confirmed: C.green, done: C.muted, noshow: C.red }[appt.status] || C.muted;
                  return (
                    <div key={appt.id} style={{
                      display: "flex", alignItems: "center", gap: 9,
                      padding: "8px 0",
                      borderBottom: i < todayAppts.length - 1 ? `1px solid ${C.border}` : "none",
                    }}>
                      <div style={{ width:32, height:32, borderRadius:8, background:typeColor+"18", display:"grid", placeItems:"center", fontSize:15, flexShrink:0 }}>
                        {TYPE_ICON[appt.type] || "📅"}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 500, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{appt.lead}</div>
                        <div style={{ fontSize: 10, color: C.muted, marginTop: 1 }}>
                          <span style={{ fontFamily: "monospace", color: typeColor, fontWeight: 600 }}>{appt.start}</span>
                          {!isGP && appt.gp && <> · {appt.gp}</>}
                        </div>
                      </div>
                      <span style={{
                        fontSize: 9, fontFamily: "monospace", padding: "2px 6px",
                        borderRadius: 20, fontWeight: 700, flexShrink: 0,
                        background: statusColor + "18", color: statusColor,
                      }}>
                        {appt.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Reminders / Tasks */}
            <Card>
              <CardHeader
                title={remindersTitle}
                action={<LinkBtn label="All →" onClick={() => navigateTo("Calendar")} />}
              />
              <div style={{ padding: "2px 14px 12px", maxHeight: 240, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
                {tasksToShow.length === 0 ? (
                  <div style={{ padding: "16px 0", textAlign: "center", color: C.muted, fontSize: 13 }}>
                    {t("noOpenTasks")}
                  </div>
                ) : tasksToShow.map((rem) => {
                  const done = itemDone(rem);
                  return (
                    <div
                      key={rem.id}
                      onClick={() => toggleDone(rem)}
                      title={done ? "Mark as not done" : "Mark as done"}
                      style={{
                        display: "flex", alignItems: "flex-start", gap: 9,
                        padding: "7px 9px", borderRadius: 9, cursor: "pointer",
                        border: `1px solid ${done ? C.green + "40" : C.border}`,
                        background: done ? C.green + "08" : "#F8FAFC",
                      }}
                    >
                      <div style={{
                        width: 16, height: 16, borderRadius: 4, marginTop: 1,
                        border: `1.5px solid ${done ? C.green : C.muted}`,
                        background: done ? C.green : "transparent",
                        display: "grid", placeItems: "center",
                        fontSize: 9, color: "#fff", flexShrink: 0,
                      }}>
                        {done ? "✓" : ""}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 12.5, color: done ? C.muted : C.text,
                          textDecoration: done ? "line-through" : "none", lineHeight: 1.3,
                        }}>
                          {rem.title}
                        </div>
                        <div style={{ fontSize: 10, color: C.muted, marginTop: 2, display: "flex", alignItems: "center", gap: 5 }}>
                          <PriorityDot priority={rem.priority} />
                          {rem.time ? `${rem.time} · ` : ""}{rem.date}
                          {rem.lead && <> · {rem.lead}</>}
                          {!isGP && rem.gp && <> · <span style={{ color: C.slate }}>{rem.gp}</span></>}
                        </div>
                      </div>
                      <span style={{ fontSize: 13 }}>{TYPE_ICON[rem.type] || "🔔"}</span>
                    </div>
                  );
                })}
              </div>
            </Card>

          </div>{/* end right column */}
        </div>

        {/* ── SA: Campaign (pie) + Recent Activity side by side ────────────── */}
        {isSA && (() => {
          const campaignMap: Record<string, number> = {};
          allLeads.forEach(l => { if (l.campaign) campaignMap[l.campaign] = (campaignMap[l.campaign] || 0) + 1; });
          const campaigns = Object.entries(campaignMap).sort((a, b) => b[1] - a[1]).slice(0, 6);
          const PIE_COLORS = [C.primary, C.indigo, C.blue, C.green, C.amber, C.purple];
          const pieSlices = campaigns.map(([name, value], i) => ({ name, value, color: PIE_COLORS[i % PIE_COLORS.length] }));

          return (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1.4fr", gap:14, marginBottom:14, alignItems:"start" }}>
              {/* Campaign pie chart */}
              <Card>
                <CardHeader title="By Campaign" action={<LinkBtn label="Reports →" onClick={() => navigateTo("Reports")} />} />
                <div style={{ padding:"16px 20px", display:"flex", gap:18, alignItems:"center" }}>
                  <PieChart slices={pieSlices} />
                  <div style={{ flex:1, minWidth:0 }}>
                    {campaigns.map(([name, count], i) => (
                      <div key={name} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                        <span style={{ width:8, height:8, borderRadius:"50%", background:PIE_COLORS[i % PIE_COLORS.length], flexShrink:0 }}/>
                        <span style={{ flex:1, fontSize:12, color:C.text, fontWeight:500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{name}</span>
                        <span style={{ fontSize:12, fontWeight:700, color:C.slate }}>{count}</span>
                      </div>
                    ))}
                    {campaigns.length === 0 && <div style={{ textAlign:"center",color:C.muted,fontSize:13 }}>No data yet.</div>}
                  </div>
                </div>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader title="Recent Activity" action={<LinkBtn label="All →" onClick={() => navigateTo("Calendar")} />} />
                <div style={{ padding:"6px 16px 12px" }}>
                  {recentActivity.length === 0
                    ? <div style={{ padding:"16px 0",textAlign:"center",color:C.muted,fontSize:13 }}>No recent activity.</div>
                    : recentActivity.map(act => {
                        const iconBg = { call:C.green,video:C.indigo,email:C.amber,inperson:C.blue,note:C.purple }[act.type] || C.muted;
                        return (
                          <div key={act.id} style={{ display:"flex",gap:11,alignItems:"center",padding:"7px 0",borderBottom:`1px solid ${C.border}` }}>
                            <div style={{ width:30,height:30,borderRadius:"50%",background:iconBg+"18",display:"grid",placeItems:"center",fontSize:14,flexShrink:0 }}>{TYPE_ICON[act.type]||"📋"}</div>
                            <div style={{ flex:1,minWidth:0 }}>
                              <div style={{ fontSize:12.5,fontWeight:500,color:C.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{act.title}</div>
                              <div style={{ fontSize:10.5,color:C.muted,marginTop:1 }}>{act.gp && <>{act.gp} · </>}{act.date} {act.time}</div>
                            </div>
                            <span style={{ fontSize:9,fontFamily:"monospace",padding:"2px 7px",borderRadius:20,flexShrink:0,background:C.muted+"18",color:C.muted,fontWeight:600,textTransform:"capitalize" }}>{act.status}</span>
                          </div>
                        );
                      })
                  }
                </div>
              </Card>
            </div>
          );
        })()}

        {/* ── Recent Activity — VD/GP full width ───────────────────────────── */}
        {!isSA && (
        <Card>
          <CardHeader
            title={isGP ? "My Recent Activity" : "Team Recent Activity"}
            action={<LinkBtn label="All Activity →" onClick={() => navigateTo("Calendar")} />}
          />
          <div style={{ padding: "6px 16px 12px" }}>
            {recentActivity.length === 0 ? (
              <div style={{ padding: "16px 0", textAlign: "center", color: C.muted, fontSize: 13 }}>
                No recent activity.
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", columnGap: 24, rowGap: 0 }}>
                {recentActivity.map((act) => {
                  const iconBg = { call: C.green, video: C.indigo, email: C.amber, inperson: C.blue, note: C.purple }[act.type] || C.muted;
                  return (
                    <div key={act.id} style={{ display: "flex", gap: 11, alignItems: "center", padding: "7px 0", borderBottom: `1px solid ${C.border}` }}>
                      <div style={{ width: 30, height: 30, borderRadius: "50%", background: iconBg + "18", display: "grid", placeItems: "center", fontSize: 14, flexShrink: 0 }}>
                        {TYPE_ICON[act.type] || "📋"}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 500, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{act.title}</div>
                        <div style={{ fontSize: 10.5, color: C.muted, marginTop: 1 }}>
                          {!isGP && act.gp && <>{act.gp} · </>}
                          {act.date} {act.time}
                        </div>
                      </div>
                      <span style={{ fontSize: 9, fontFamily: "monospace", padding: "2px 7px", borderRadius: 20, flexShrink: 0, background: C.muted + "18", color: C.muted, fontWeight: 600, textTransform: "capitalize" }}>
                        {act.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>
        )}

      </div>
    </div>
    {assignTarget && <DashAssignModal lead={assignTarget} onClose={() => setAssignTarget(null)} />}
    </>
  );
};
