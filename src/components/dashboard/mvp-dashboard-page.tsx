import React, { useState } from "react";
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

const Avatar = ({ name, size = 32, color = null }) => {
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

const CardHeader = ({ title, action = null }) => (
  <div style={{
    padding: "11px 16px 9px",
    borderBottom: `1px solid ${C.border}`,
    display: "flex", alignItems: "center", justifyContent: "space-between",
  }}>
    <div style={{ fontSize: 15, fontWeight: 600, color: C.text }}>{title}</div>
    {action}
  </div>
);

// Hover tooltip for KPI card info icons.
const InfoTip = ({ text }) => {
  const [show, setShow] = useState(false);
  if (!text) return null;
  return (
    <span style={{ position: "relative", display: "inline-flex", marginLeft: 5 }}
      onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      <span style={{ fontSize: 11, color: C.muted, cursor: "help" }}>ⓘ</span>
      {show && (
        <div style={{
          position: "absolute", bottom: "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)",
          background: C.navy, color: "#fff", fontSize: 11, lineHeight: 1.4, padding: "8px 12px",
          borderRadius: 8, whiteSpace: "normal", width: 200, zIndex: 30,
          boxShadow: "0 4px 16px rgba(0,0,0,0.2)", pointerEvents: "none", textTransform: "none", letterSpacing: "normal",
        }}>
          {text}
        </div>
      )}
    </span>
  );
};

const KpiCard = ({ label, value, sub = null, info = null, color = C.text, warn = false }) => (
  <Card>
    <div style={{ padding: "13px 16px" }}>
      <div style={{
        display: "flex", alignItems: "center",
        fontSize: 10, color: C.muted, fontWeight: 700,
        letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6,
      }}>
        {label}
        <InfoTip text={info} />
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
  // GP "Anna Klein" assigned leads (My Leads panel)
  { id:"m1",  name:"Sandra Richter",   status:"open",        assignedVD:"Thomas Müller", assignedGP:"Anna Klein",  city:"Berlin",    source:"Referral",    campaign:"Webinar Q1"  },
  { id:"m3",  name:"Julia Weiss",      status:"in_progress", assignedVD:"Thomas Müller", assignedGP:"Anna Klein",  city:"Munich",    source:"Event",        campaign:"Webinar Q1"  },
  { id:"m6",  name:"Hans Müller",      status:"appointment", assignedVD:"Thomas Müller", assignedGP:"Anna Klein",  city:"Zurich",    source:"Referral",     campaign:"Gold VIP"    },
  { id:"m8",  name:"Klaus Wagner",     status:"open",        assignedVD:"Thomas Müller", assignedGP:"Anna Klein",  city:"Munich",    source:"Event",        campaign:"Webinar Q1"  },
  { id:"m9",  name:"Maria Huber",      status:"closed",      assignedVD:"Thomas Müller", assignedGP:"Anna Klein",  city:"Vienna",    source:"Referral",     campaign:"Gold VIP"    },
  { id:"m20", name:"Lena Brandt",      status:"followup",    assignedVD:"Thomas Müller", assignedGP:"Anna Klein",  city:"Stuttgart", source:"Google Ads",   campaign:"Spring 2026" },
  // VD "Thomas Müller" pending (no GP yet) — Pending Assignments panel
  { id:"m2",  name:"Markus Bauer",     status:"open", assignedVD:"Thomas Müller", assignedGP:"", city:"Hamburg",   source:"Landing Page", campaign:"Spring 2026" },
  { id:"m5",  name:"Laura Fischer",    status:"open", assignedVD:"Thomas Müller", assignedGP:"", city:"Vienna",    source:"Social",       campaign:"Webinar Q1"  },
  { id:"m16", name:"Robert Keller",    status:"open", assignedVD:"Thomas Müller", assignedGP:"", city:"Dresden",   source:"Referral",     campaign:"Webinar Q1"  },
  { id:"m17", name:"Christine Wolff",  status:"open", assignedVD:"Thomas Müller", assignedGP:"", city:"Leipzig",   source:"Landing Page", campaign:"Spring 2026" },
  { id:"m18", name:"Dieter Schulz",    status:"open", assignedVD:"Thomas Müller", assignedGP:"", city:"Bremen",    source:"Social",       campaign:"Gold VIP"    },
  { id:"m19", name:"Ursula Neumann",   status:"open", assignedVD:"Thomas Müller", assignedGP:"", city:"Nuremberg", source:"Event",        campaign:"Webinar Q1"  },
  // SA unassigned leads (Unassigned Leads panel — no VD or GP assigned)
  { id:"ml10", name:"Felix Hartmann",  city:"Berlin",     source:"Meta Ads",      campaign:"General",      status:"open", assignedVD:null, assignedGP:null },
  { id:"ml11", name:"Katrin Weber",    city:"Hamburg",    source:"Landing Page",  campaign:"Gold",         status:"open", assignedVD:null, assignedGP:null },
  { id:"ml12", name:"Petra Hoffmann",  city:"München",    source:"Referral",      campaign:"Financing",    status:"open", assignedVD:null, assignedGP:null },
  { id:"ml13", name:"Jens Brinkmann",  city:"Frankfurt",  source:"Zapier",        campaign:"Securities",   status:"open", assignedVD:null, assignedGP:null },
  { id:"ml14", name:"Sophia Richter",  city:"Düsseldorf", source:"Meta Ads",      campaign:"Real Estate",  status:"open", assignedVD:null, assignedGP:null },
  { id:"ml15", name:"Dominik Meier",   city:"Stuttgart",  source:"Google Ads",    campaign:"Crypto",       status:"open", assignedVD:null, assignedGP:null },
];
const MOCK_ACTIVITIES = [
  // GP Anna Klein — tasks & recent activity
  { id:"act1", entityType:"task",     title:"Follow up Sandra Richter",        status:"pending", priority:"high",   date:"2026-06-29", gp:"Anna Klein",    vd:"Thomas Müller", type:"call" },
  { id:"act2", entityType:"reminder", title:"Send proposal to Markus Bauer",   status:"pending", priority:"normal", date:"2026-06-29", gp:"Anna Klein",    vd:"Thomas Müller", type:"email" },
  { id:"act3", entityType:"task",     title:"Prepare documents for Hans Müller",status:"pending",priority:"urgent", date:"2026-06-29", gp:"Anna Klein",    vd:"Thomas Müller", type:"note" },
  { id:"act4", entityType:"task",     title:"Call Klaus Wagner (3rd attempt)",  status:"done",    priority:"low",    date:"2026-06-28", gp:"Anna Klein",    vd:"Thomas Müller", type:"call" },
  { id:"act5", entityType:"call",     title:"Intro call — Laura Fischer",       status:"done",    priority:"normal", date:"2026-06-27", gp:"Anna Klein",    vd:"Thomas Müller", type:"call",  time:"10:00" },
  { id:"act6", entityType:"email",    title:"Welcome email — Lena Brandt",      status:"done",    priority:"low",    date:"2026-06-26", gp:"Anna Klein",    vd:"Thomas Müller", type:"email", time:"09:15" },
  { id:"act7", entityType:"note",     title:"Note added for Maria Huber",       status:"done",    priority:"low",    date:"2026-06-25", gp:"Anna Klein",    vd:"Thomas Müller", type:"note" },
  // VD Thomas Müller — own tasks & recent activity (gp === vd)
  { id:"act8", entityType:"task",     title:"Q2 team targets review",           status:"pending", priority:"high",   date:"2026-06-29", gp:"Thomas Müller", vd:"Thomas Müller", type:"note" },
  { id:"act9", entityType:"reminder", title:"Call Eva Gruber — contract prep",  status:"pending", priority:"urgent", date:"2026-06-29", gp:"Thomas Müller", vd:"Thomas Müller", type:"call" },
  { id:"act10",entityType:"task",     title:"Approve Marc Otto's proposals",    status:"done",    priority:"normal", date:"2026-06-28", gp:"Thomas Müller", vd:"Thomas Müller", type:"note" },
  { id:"act11",entityType:"call",     title:"Strategy call with Anna Klein",    status:"done",    priority:"normal", date:"2026-06-28", gp:"Thomas Müller", vd:"Thomas Müller", type:"call",  time:"11:00" },
  { id:"act12",entityType:"email",    title:"Weekly digest sent to team",       status:"done",    priority:"low",    date:"2026-06-27", gp:"Thomas Müller", vd:"Thomas Müller", type:"email" },
  { id:"act13",entityType:"note",     title:"Performance note — Marc Otto",     status:"done",    priority:"normal", date:"2026-06-26", gp:"Thomas Müller", vd:"Thomas Müller", type:"note" },
];
const MOCK_APPOINTMENTS = [
  // GP Anna Klein — today
  { id:"ap1", lead:"Sandra Richter",  date:"2026-06-29", start:"09:00", type:"call",     status:"upcoming",  gp:"Anna Klein",    vd:"Thomas Müller" },
  { id:"ap2", lead:"Hans Müller",     date:"2026-06-29", start:"10:30", type:"video",    status:"confirmed", gp:"Anna Klein",    vd:"Thomas Müller" },
  { id:"ap3", lead:"Klaus Wagner",    date:"2026-06-29", start:"12:00", type:"inperson", status:"upcoming",  gp:"Anna Klein",    vd:"Thomas Müller" },
  { id:"ap4", lead:"Julia Weiss",     date:"2026-06-29", start:"14:00", type:"call",     status:"confirmed", gp:"Anna Klein",    vd:"Thomas Müller" },
  // VD Thomas Müller — own appointments (gp === vd = Thomas Müller)
  { id:"ap5", lead:"Eva Gruber",      date:"2026-06-29", start:"09:30", type:"call",     status:"confirmed", gp:"Thomas Müller", vd:"Thomas Müller" },
  { id:"ap6", lead:"Klaus Richter",   date:"2026-06-29", start:"11:00", type:"video",    status:"upcoming",  gp:"Thomas Müller", vd:"Thomas Müller" },
  { id:"ap7", lead:"Stefan Wolf",     date:"2026-06-29", start:"14:30", type:"inperson", status:"upcoming",  gp:"Thomas Müller", vd:"Thomas Müller" },
];

// ── Layout constants ──────────────────────────────────────────────────────────
// Fixed height so paired sections line up exactly; the body scrolls once its
// rows exceed what fits (~4 rows).
const SECTION_H = 300;
const ATTEMPT_LEVELS = [5, 4, 3, 2, 1];

// ── Aggregate figures behind the Performance / Call Attempts tables and the
//    VD/SA KPI cards. Illustrative but realistic (org totals in the thousands).
//    `ca` = how many of that row's leads sit at 5,4,3,2,1 call attempts. ────────
const SA_TEAMS = [
  { name:"Thomas Müller", leads:412, contacts:468, appts:134, closings:38, ca:{5:31,4:44,3:78,2:96,1:74} },
  { name:"Marc Fischer",  leads:389, contacts:441, appts:121, closings:44, ca:{5:24,4:39,3:71,2:88,1:69} },
  { name:"Jana Kruse",    leads:274, contacts:318, appts:82,  closings:22, ca:{5:29,4:41,3:52,2:60,1:41} },
  { name:"Ralf Fischer",  leads:331, contacts:377, appts:98,  closings:29, ca:{5:27,4:36,3:63,2:79,1:58} },
  { name:"Sabine Roth",   leads:298, contacts:339, appts:104, closings:33, ca:{5:22,4:33,3:57,2:71,1:55} },
];
const VD_ADVISORS = [
  { name:"Anna Klein",   leads:97,  contacts:112, appts:34, closings:12, ca:{5:5,4:9,3:18,2:24,1:19} },
  { name:"Ben Hartmann", leads:82,  contacts:94,  appts:27, closings:8,  ca:{5:7,4:11,3:15,2:21,1:16} },
  { name:"Marc Otto",    leads:71,  contacts:83,  appts:19, closings:5,  ca:{5:9,4:12,3:14,2:16,1:12} },
  { name:"Kai Becker",   leads:104, contacts:119, appts:41, closings:15, ca:{5:3,4:7,3:19,2:28,1:23} },
  { name:"Nina Schmitt", leads:63,  contacts:74,  appts:18, closings:6,  ca:{5:6,4:9,3:12,2:15,1:11} },
];

// Performance table (rows = teams for SA, advisors for VD).
const PerfTable = ({ title, rowLabel, rows, action }) => (
  <Card style={{ height: SECTION_H, display: "flex", flexDirection: "column" }}>
    <CardHeader title={title} action={action} />
    <div style={{ flexShrink: 0, display: "grid", gridTemplateColumns: "1.6fr 0.8fr 0.8fr 1fr 0.9fr", padding: "8px 16px", borderBottom: `1px solid ${C.border}`, gap: 8 }}>
      {[rowLabel, "Leads", "Appts", "Closings", "Rate"].map((h, i) => (
        <div key={h} style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", textAlign: i === 0 ? "left" : "center" }}>{h}</div>
      ))}
    </div>
    <div style={{ flex: 1, overflowY: "auto", padding: "0 16px" }}>
      {rows.map((r, i) => {
        const rate = r.leads > 0 ? ((r.closings / r.leads) * 100).toFixed(1) + "%" : "0%";
        return (
          <div key={r.name} style={{ display: "grid", gridTemplateColumns: "1.6fr 0.8fr 0.8fr 1fr 0.9fr", padding: "9px 0", borderBottom: i < rows.length - 1 ? `1px solid ${C.border}` : "none", gap: 8, alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
              <Avatar name={r.name} size={26} />
              <span style={{ fontSize: 12.5, fontWeight: 500, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</span>
            </div>
            <div style={{ textAlign: "center", fontFamily: "monospace", fontSize: 12.5, color: C.text }}>{r.leads}</div>
            <div style={{ textAlign: "center", fontFamily: "monospace", fontSize: 12.5, color: C.text }}>{r.appts}</div>
            <div style={{ textAlign: "center", fontFamily: "monospace", fontSize: 12.5, color: C.text }}>{r.closings}</div>
            <div style={{ textAlign: "center", fontFamily: "monospace", fontSize: 12.5, fontWeight: 700, color: parseFloat(rate) >= 10 ? C.green : parseFloat(rate) >= 6 ? C.amber : C.red }}>{rate}</div>
          </div>
        );
      })}
    </div>
  </Card>
);

// Call Attempts table — one column per attempt level (5/5 … 1/5).
const CallAttemptsTable = ({ title, rowLabel, rows, action }) => (
  <Card style={{ height: SECTION_H, display: "flex", flexDirection: "column" }}>
    <CardHeader title={title} action={action} />
    <div style={{ flexShrink: 0, display: "grid", gridTemplateColumns: "1.6fr repeat(5, 1fr)", padding: "8px 16px", borderBottom: `1px solid ${C.border}`, gap: 8 }}>
      {[rowLabel, ...ATTEMPT_LEVELS.map(n => `${n}/5`)].map((h, i) => (
        <div key={h} style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", textAlign: i === 0 ? "left" : "center" }}>{h}</div>
      ))}
    </div>
    <div style={{ flex: 1, overflowY: "auto", padding: "0 16px" }}>
      {rows.map((r, i) => (
        <div key={r.name} style={{ display: "grid", gridTemplateColumns: "1.6fr repeat(5, 1fr)", padding: "9px 0", borderBottom: i < rows.length - 1 ? `1px solid ${C.border}` : "none", gap: 8, alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
            <Avatar name={r.name} size={26} />
            <span style={{ fontSize: 12.5, fontWeight: 500, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</span>
          </div>
          {ATTEMPT_LEVELS.map(n => {
            const count = r.ca?.[n] || 0;
            const color = n >= 4 ? C.red : n === 3 ? C.amber : C.navy;
            return <div key={n} style={{ textAlign: "center", fontFamily: "monospace", fontSize: 13, fontWeight: count > 0 ? 700 : 400, color: count === 0 ? C.muted : color }}>{count}</div>;
          })}
        </div>
      ))}
    </div>
  </Card>
);

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
    gp: t("advisor"), vd: t("salesDirector"), superadmin: t("superAdmin"), manager: t("superAdmin"),
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
  const leadsTitle     = isGP ? t("myLeads") : isVD ? t("pendingAssignment") : t("unassignedLeads");
  const contactsLabel  = isGP ? t("myNetwork") : isVD ? t("myLeads") : t("totalContacts");
  const newLeadsLabel  = isGP ? t("myLeads") : isVD ? t("pendingAssignments") : t("newContacts");
  const remindersTitle = t("remindersAndTasks");
  const apptsTitle     = t("appointmentsToday");

  // System view id the Leads page should open on when the "All" link is clicked —
  // keeps the dashboard's "My Leads / Pending Assignment / Unassigned Leads" panels
  // in sync with the matching Contacts view.
  const leadsViewId = isGP ? "myleads" : isVD ? "pendingA" : "pending";

  // Contacts to show in panel (max 6) — SA: truly unassigned; VD: assigned to VD but no GP
  const panelLeads = isSA
    ? allLeads.filter(l => !l.assignedGP)
    : isVD
      ? allLeads.filter(l => l.assignedVD === userName && !l.assignedGP)
      : newLeads;
  const leadsToShow = panelLeads.slice(0, 25);

  // ── VD / SA aggregates — driven by the per-team / per-advisor mock so the KPI
  //    cards and tables show realistic org-scale numbers. ──────────────────────
  const perfRows     = isSA ? SA_TEAMS : isVD ? VD_ADVISORS : [];
  const perfRowLabel = isSA ? t("teamCol") : t("advisorCol");
  const sumBy        = (k) => perfRows.reduce((s, r) => s + (r[k] || 0), 0);
  const aggLeads     = sumBy("leads");
  const aggContacts  = sumBy("contacts");
  const aggAppts     = sumBy("appts");
  const aggClosings  = sumBy("closings");
  const aggNotReached= perfRows.reduce((s, r) => s + (r.ca?.[5] || 0), 0);
  const aggConversion= aggLeads > 0 ? ((aggClosings / aggLeads) * 100).toFixed(1) + "%" : "0%";
  const unassignedAgg= isSA ? 47 : 12;

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

        {/* ── KPI row — same KpiCard everywhere so all three roles line up ─── */}
        {isSA ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 14 }}>
            <KpiCard label={t("kpiTotalLeads")}    value={aggLeads.toLocaleString()}    info={t("tooltip_kpiTotalLeads")}       color={C.navy} />
            <KpiCard label={t("kpiTotalContacts")} value={aggContacts.toLocaleString()} info={t("tooltip_kpiTotalContacts")}    color={C.navy} />
            <KpiCard label={t("unassignedLeads")}  value={unassignedAgg}          info={t("tooltip_kpiUnassignedLeads")}  color={C.primary} warn={unassignedAgg > 0} />
            <KpiCard label={t("kpiTotalAppointments")} value={aggAppts.toLocaleString()} info={t("tooltip_kpiTotalAppointments")} color={C.indigo} />
            <KpiCard label={t("kpiCallAttemptsNotReached")} value={aggNotReached} info={t("tooltip_kpiCallAttempts")} color={C.red} />
            <KpiCard label={t("kpiClosings")}      value={aggClosings}            info={t("tooltip_kpiClosings")}         color={C.green} />
            <KpiCard label={t("kpiConversionRate")} value={aggConversion}         info={t("tooltip_kpiConversionRate")}   color={C.green} />
          </div>
        ) : isVD ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 14 }}>
            <KpiCard label={t("kpiTotalLeads")}    value={aggLeads.toLocaleString()}    info={t("tooltip_kpiTotalLeads")}       color={C.navy} />
            <KpiCard label={t("kpiTotalContacts")} value={aggContacts.toLocaleString()} info={t("tooltip_kpiTotalContacts")}    color={C.navy} />
            <KpiCard label={t("pendingAssignments")} value={unassignedAgg}        info={t("tooltip_kpiPendingAssignments")} color={C.primary} warn={unassignedAgg > 0} />
            <KpiCard label={t("kpiTotalAppointments")} value={aggAppts.toLocaleString()} info={t("tooltip_kpiTotalAppointments")} color={C.indigo} />
            <KpiCard label={t("kpiCallAttemptsNotReached")} value={aggNotReached} info={t("tooltip_kpiCallAttempts")} color={C.red} />
          </div>
        ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 14 }}>
          <KpiCard
            label={contactsLabel}
            value={totalContacts}
            sub={isGP ? t("assignedToMe") : t("inMyTeam")}
            color={C.navy}
          />
          <KpiCard
            label={newLeadsLabel}
            value={newLeads.length}
            sub={isGP ? t("openAndAssigned") : unassignedCount > 0 ? `${unassignedCount} pending` : t("allAssigned")}
            color={C.primary}
            warn={!isGP && unassignedCount > 0}
          />
          <KpiCard
            label={t("appointmentsToday")}
            value={todayAppts.length}
            sub={t("mySchedule")}
            color={C.indigo}
          />
          <KpiCard
            label={t("openTasks")}
            value={openTasks.length}
            sub={t("remindersAndToDos")}
            color={openTasks.length > 0 ? C.amber : C.green}
          />
        </div>
        )}

        {/* ── Row 1: Leads | Appointments Today — equal size, scroll past ~4 rows ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>

          {/* ── Leads panel ─────────────────────────────────────────────────── */}
          <Card style={{ height: SECTION_H, display: "flex", flexDirection: "column" }}>
            <CardHeader
              title={leadsTitle}
              action={<LinkBtn label={t("allContacts")} onClick={() => navigateTo("Leads", null, leadsViewId)} />}
            />
            <div style={{ flex: 1, overflowY: "auto", padding: "2px 16px 6px" }}>
              {leadsToShow.length === 0 ? (
                <div style={{ padding: "16px 0", textAlign: "center", color: C.muted, fontSize: 13 }}>
                  {isGP ? t("noNewContactsAssigned") : t("noPendingContacts")}
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
                      {t("openContact")}
                    </button>
                  ) : (
                    <button onClick={() => setAssignTarget(lead)}
                      style={{ padding:"4px 10px",background:C.primary,color:"#fff",border:"none",borderRadius:6,fontSize:10,fontFamily:"monospace",letterSpacing:"0.08em",textTransform:"uppercase",cursor:"pointer",fontWeight:600 }}>
                      {t("assignContact")}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* ── Appointments Today ──────────────────────────────────────────── */}
          <Card style={{ height: SECTION_H, display: "flex", flexDirection: "column" }}>
            <CardHeader
              title={apptsTitle}
              action={<LinkBtn label={t("calendarLink")} onClick={() => navigateTo("Calendar")} />}
            />
            <div style={{ flex: 1, overflowY: "auto", padding: "2px 14px 6px" }}>
                {todayAppts.length === 0 ? (
                  <div style={{ padding: "14px 0", textAlign: "center", color: C.muted, fontSize: 12.5 }}>
                    {t("noAppointmentsToday")}
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
        </div>

        {/* ── Row 2: GP → Reminders & Tasks | Recent Activity ─────────────── */}
        {isGP && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          {/* Reminders & Tasks */}
          <Card style={{ height: SECTION_H, display: "flex", flexDirection: "column" }}>
              <CardHeader
                title={remindersTitle}
                action={<LinkBtn label={t("allLink")} onClick={() => navigateTo("Calendar")} />}
              />
              <div style={{ flex: 1, overflowY: "auto", padding: "6px 14px 10px", display: "flex", flexDirection: "column", gap: 4 }}>
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
                      title={done ? t("markAsNotDone") : t("markAsDone")}
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

          {/* Recent Activity */}
          <Card style={{ height: SECTION_H, display: "flex", flexDirection: "column" }}>
            <CardHeader title={t("recentActivity")} />
            <div style={{ flex: 1, overflowY: "auto", padding: "4px 16px 10px" }}>
              {recentActivity.length === 0 ? (
                <div style={{ padding: "16px 0", textAlign: "center", color: C.muted, fontSize: 13 }}>{t("noRecentActivity")}</div>
              ) : recentActivity.map((act) => {
                const iconBg = { call: C.green, video: C.indigo, email: C.amber, inperson: C.blue, note: C.purple }[act.type] || C.muted;
                return (
                  <div key={act.id} style={{ display: "flex", gap: 11, alignItems: "center", padding: "7px 0", borderBottom: `1px solid ${C.border}` }}>
                    <div style={{ width: 30, height: 30, borderRadius: "50%", background: iconBg + "18", display: "grid", placeItems: "center", fontSize: 14, flexShrink: 0 }}>
                      {TYPE_ICON[act.type] || "📋"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 500, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{act.title}</div>
                      <div style={{ fontSize: 10.5, color: C.muted, marginTop: 1 }}>{act.date} {act.time}</div>
                    </div>
                    <span style={{ fontSize: 9, fontFamily: "monospace", padding: "2px 7px", borderRadius: 20, flexShrink: 0, background: C.muted + "18", color: C.muted, fontWeight: 600, textTransform: "capitalize" }}>{act.status}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
        )}

        {/* ── Row 2: VD / SA → Performance | Call Attempts ────────────────── */}
        {(isVD || isSA) && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <PerfTable title={t("performance")} rowLabel={perfRowLabel} rows={perfRows}
            action={<LinkBtn label={t("allLink")} onClick={() => navigateTo("Leads", null, "assigned")} />} />
          <CallAttemptsTable title={t("callAttemptsTitle")} rowLabel={perfRowLabel} rows={perfRows}
            action={<LinkBtn label={t("allLink")} onClick={() => navigateTo("Leads", null, "assigned")} />} />
        </div>
        )}

        {/* ── Row 3: SA → By Campaign (full width) ────────────────────────── */}
        {isSA && (() => {
          const campaignMap: Record<string, number> = {};
          allLeads.forEach(l => { if (l.campaign) campaignMap[l.campaign] = (campaignMap[l.campaign] || 0) + 1; });
          const campaigns = Object.entries(campaignMap).sort((a, b) => b[1] - a[1]).slice(0, 6);
          const PIE_COLORS = [C.primary, C.indigo, C.blue, C.green, C.amber, C.purple];
          const pieSlices = campaigns.map(([name, value], i) => ({ name, value, color: PIE_COLORS[i % PIE_COLORS.length] }));
          return (
            <Card style={{ height: SECTION_H, display: "flex", flexDirection: "column", marginBottom: 14 }}>
              <CardHeader title={t("byCampaign")} />
              <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px", display: "flex", gap: 28, alignItems: "center" }}>
                <PieChart slices={pieSlices} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  {campaigns.map(([name, count], i) => (
                    <div key={name} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: 12, color: C.text, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: C.slate }}>{count}</span>
                    </div>
                  ))}
                  {campaigns.length === 0 && <div style={{ textAlign: "center", color: C.muted, fontSize: 13 }}>{t("noDataYet")}</div>}
                </div>
              </div>
            </Card>
          );
        })()}

      </div>
    </div>
    {assignTarget && <DashAssignModal lead={assignTarget} onClose={() => setAssignTarget(null)} />}
    </>
  );
};
