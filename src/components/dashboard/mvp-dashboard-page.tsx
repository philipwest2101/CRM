import React, { useState } from "react";
import { C } from "../../theme";
import { PRIORITY_META, DONE_STATUSES, APPOINTMENT_TYPE_META, feedbackStatusLabel, getCallAttempts } from "../../lib/core";
import { useT } from "../../lib/i18n";
import { GPDashboard } from "./gp-dashboard";
import { ContactActions } from "../ui/contact-actions";

// ── Dashboard assignee list ───────────────────────────────────────────────────
const DASH_USERS = [
  { id: "u1", name: "Anna Klein",    role: "Berater" },
  { id: "u2", name: "Peter Schmidt", role: "Berater" },
  { id: "u3", name: "Maria Weber",   role: "Berater" },
  { id: "u4", name: "Kai Fischer",   role: "Berater" },
  { id: "u5", name: "Sophie Braun",  role: "Berater" },
];

// Teams a Super Admin can assign a lead to (team = a director's org).
const DASH_TEAMS = [
  { id: "t1", name: "Team Thomas Müller", director: "Thomas Müller" },
  { id: "t2", name: "Team Marc Fischer",  director: "Marc Fischer"  },
  { id: "t3", name: "Team Jana Kruse",    director: "Jana Kruse"    },
  { id: "t4", name: "Team Ralf Fischer",  director: "Ralf Fischer"  },
  { id: "t5", name: "Team Sabine Roth",   director: "Sabine Roth"   },
];

// ── Assign modal (dashboard) ──────────────────────────────────────────────────
// SA can assign a lead to a specific advisor OR a whole team; VD assigns to advisors.
const DashAssignModal = ({ lead, onClose, allowTeams = false }) => {
  const [mode, setMode]         = useState("advisor");   // "advisor" | "team"
  const [assignee, setAssignee] = useState("");
  const [confirm, setConfirm]   = useState(false);
  const target = mode === "team"
    ? DASH_TEAMS.find(t => t.id === assignee)
    : DASH_USERS.find(u => u.id === assignee);

  if (confirm) return (
    <>
      <div onClick={() => setConfirm(false)} style={{ position:"fixed",inset:0,background:"rgba(15,23,42,0.45)",zIndex:600 }}/>
      <div style={{ position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:400,maxWidth:"92vw",background:"#fff",borderRadius:16,zIndex:700,boxShadow:"0 24px 64px rgba(0,0,0,0.22)",padding:"22px 24px",fontFamily:"inherit" }}>
        <div style={{ fontSize:17,fontWeight:700,color:C.navy,marginBottom:8 }}>Confirm Assignment</div>
        <div style={{ fontSize:13,color:C.slate,marginBottom:22 }}>Assign <b>{lead?.name}</b> to <b>{target?.name}</b>?</div>
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
        {allowTeams && (
          <div style={{ display:"flex",border:`1px solid ${C.border}`,borderRadius:9,overflow:"hidden",marginBottom:14 }}>
            {[["advisor","Advisor"],["team","Team"]].map(([key,label],i)=>(
              <button key={key} onClick={()=>{ setMode(key); setAssignee(""); }}
                style={{ flex:1,padding:"8px 0",border:"none",borderLeft:i===0?"none":`1px solid ${C.border}`,
                  background:mode===key?C.primary:"#fff",color:mode===key?"#fff":C.muted,
                  fontSize:12,fontWeight:mode===key?700:500,cursor:"pointer",fontFamily:"inherit" }}>{label}</button>
            ))}
          </div>
        )}
        <label style={{ fontSize:13,fontWeight:600,color:C.navy,display:"block",marginBottom:6 }}>Assign to *</label>
        <select value={assignee} onChange={e=>setAssignee(e.target.value)}
          style={{ width:"100%",padding:"10px 12px",borderRadius:8,border:`1px solid ${C.border}`,fontSize:13,fontFamily:"inherit",color:assignee?C.text:C.muted,outline:"none",background:"#fff",marginBottom:22 }}>
          <option value="">{mode === "team" ? "Select a team..." : "Select a user..."}</option>
          {mode === "team"
            ? DASH_TEAMS.map(tm=><option key={tm.id} value={tm.id}>{tm.name} — {tm.director}</option>)
            : DASH_USERS.map(u=><option key={u.id} value={u.id}>{u.name} — {u.role}</option>)}
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

const CardHeader = ({ title, action = null, info = null }) => (
  <div style={{
    padding: "11px 16px 9px",
    borderBottom: `1px solid ${C.border}`,
    display: "flex", alignItems: "center", justifyContent: "space-between",
  }}>
    <div style={{ fontSize: 15, fontWeight: 600, color: C.text, display: "flex", alignItems: "center" }}>
      {title}
      {info && <InfoTip text={info} />}
    </div>
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

// Segmented time-slot selector shown in every dashboard header.
const PERIOD_KEYS = ["today", "week", "month", "quarter", "year"];
const PeriodTabs = ({ period, setPeriod, t }) => (
  <div title={t("tooltip_period")} style={{ display: "flex", border: `1px solid ${C.border}`, borderRadius: 9, overflow: "hidden", flexShrink: 0 }}>
    {PERIOD_KEYS.map((k, i) => (
      <button key={k} onClick={() => setPeriod(k)} style={{
        padding: "7px 14px", border: "none",
        borderLeft: i === 0 ? "none" : `1px solid ${C.border}`,
        background: period === k ? C.primary : "#fff",
        color: period === k ? "#fff" : C.muted,
        fontSize: 12, fontWeight: period === k ? 700 : 500,
        cursor: "pointer", fontFamily: "inherit",
      }}>
        {t(`period_${k}`)}
      </button>
    ))}
  </div>
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
  { id:"ap1", lead:"Sandra Richter",  date:"2026-06-29", start:"09:00", type:"call",     apptType:"Consultation Appointment", status:"upcoming",  gp:"Anna Klein",    vd:"Thomas Müller" },
  { id:"ap2", lead:"Hans Müller",     date:"2026-06-29", start:"10:30", type:"video",    apptType:"Investment Talk",          status:"confirmed", gp:"Anna Klein",    vd:"Thomas Müller" },
  { id:"ap3", lead:"Klaus Wagner",    date:"2026-06-29", start:"12:00", type:"inperson", apptType:"Business Opening",         status:"upcoming",  gp:"Anna Klein",    vd:"Thomas Müller" },
  { id:"ap4", lead:"Julia Weiss",     date:"2026-06-29", start:"14:00", type:"call",     apptType:"Finance Talk",             status:"confirmed", gp:"Anna Klein",    vd:"Thomas Müller" },
  // VD Thomas Müller — own appointments (gp === vd = Thomas Müller)
  { id:"ap5", lead:"Eva Gruber",      date:"2026-06-29", start:"09:30", type:"call",     apptType:"Consultation Appointment", status:"confirmed", gp:"Thomas Müller", vd:"Thomas Müller" },
  { id:"ap6", lead:"Klaus Richter",   date:"2026-06-29", start:"11:00", type:"video",    apptType:"Investment Talk",          status:"upcoming",  gp:"Thomas Müller", vd:"Thomas Müller" },
  { id:"ap7", lead:"Stefan Wolf",     date:"2026-06-29", start:"14:30", type:"inperson", apptType:"Business Opening",         status:"upcoming",  gp:"Thomas Müller", vd:"Thomas Müller" },
];

// ── Layout constants ──────────────────────────────────────────────────────────
// Fixed height so paired sections line up exactly; the body scrolls once its
// rows exceed what fits (~4 rows).
const SECTION_H = 300;
const ATTEMPT_LEVELS = [5, 4, 3, 2, 1];

// Multipliers applied to volume figures per selected time slot (month = baseline).
const PERIOD_FACTOR = { today: 0.05, week: 0.25, month: 1, quarter: 3, year: 12 };

// ── Time-slot → rolling window (in days, ending on the anchor day) ───────────
// Used to really filter the personal (GP / VD-My) lists by date, so the
// Today/Week/… pills change what the panels show — not just the mock scaling.
const PERIOD_WINDOW_DAYS = { today: 1, week: 7, month: 30, quarter: 90, year: 365 };
const MONTH_ABBR = { jan:0, feb:1, mar:2, apr:3, may:4, jun:5, jul:6, aug:7, sep:8, oct:9, nov:10, dec:11 };

// Normalise the various mock date formats to "YYYY-MM-DD".
// Relative labels ("Today", "Every Monday", …) return null → always shown.
const toISODate = (s) => {
  if (typeof s !== "string") return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const mt = s.match(/^(\d{1,2})\s+([A-Za-z]{3})[a-z]*\s+(\d{4})/); // "26 Feb 2026"
  if (mt && MONTH_ABBR[mt[2].toLowerCase()] != null) {
    return `${mt[3]}-${String(MONTH_ABBR[mt[2].toLowerCase()] + 1).padStart(2, "0")}-${String(Number(mt[1])).padStart(2, "0")}`;
  }
  return null;
};
const shiftISODate = (iso, days) => {
  const d = new Date(iso + "T12:00");
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

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

// ── SA: Campaign ROI — leads generated, spend, revenue per campaign (monthly
//    baseline; scaled by the selected time slot). ─────────────────────────────
const SA_CAMPAIGNS = [
  { name:"Q1 Finanz",    leads:486, closings:41, cost:12400, revenue:98400 },
  { name:"Webinar März", leads:352, closings:19, cost:6800,  revenue:45600 },
  { name:"Messe FFM",    leads:243, closings:11, cost:9500,  revenue:26400 },
  { name:"Partner Ref",  leads:189, closings:24, cost:3200,  revenue:57600 },
  { name:"Giveaway",     leads:167, closings:4,  cost:2100,  revenue:9600  },
];
const CAMPAIGN_COLORS = [C.primary, C.indigo, C.blue, C.green, C.amber, C.purple];

// ── SA: Missing Feedback — advisors who have not updated the status of leads
//    assigned to them (alert list with a notify action). ──────────────────────
const MISSING_FEEDBACK = [
  { id:"mf1", advisor:"Marc Otto",    team:"Thomas Müller", leads:6, days:5 },
  { id:"mf2", advisor:"Tanja Vogt",   team:"Jana Kruse",    leads:5, days:6 },
  { id:"mf3", advisor:"Nina Schmitt", team:"Thomas Müller", leads:4, days:3 },
  { id:"mf4", advisor:"Jonas Peters", team:"Marc Fischer",  leads:3, days:4 },
  { id:"mf5", advisor:"Ben Hartmann", team:"Ralf Fischer",  leads:2, days:2 },
];

const fmtEUR = (v) => "€" + (v >= 1000 ? (v / 1000).toFixed(1).replace(/\.0$/, "") + "k" : Math.round(v).toString());

// Campaign ROI table — tracks leads generated per campaign plus spend/revenue.
const CampaignRoiCard = ({ t, scaleP, action }) => (
  <Card style={{ height: SECTION_H, display: "flex", flexDirection: "column" }}>
    <CardHeader title={t("campaignRoi")} action={action} />
    <div style={{ flexShrink: 0, display: "grid", gridTemplateColumns: "1.5fr 0.7fr 0.8fr 0.9fr 0.8fr", padding: "8px 16px", borderBottom: `1px solid ${C.border}`, gap: 8 }}>
      {[t("campaignColumn"), "Leads", t("costCol"), t("revenueCol"), t("roiCol")].map((h, i) => (
        <div key={h} style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", textAlign: i === 0 ? "left" : "center" }}>{h}</div>
      ))}
    </div>
    <div style={{ flex: 1, overflowY: "auto", padding: "0 16px" }}>
      {SA_CAMPAIGNS.map((cp, i) => {
        const cost = scaleP(cp.cost), revenue = scaleP(cp.revenue);
        const roi = cost > 0 ? Math.round(((revenue - cost) / cost) * 100) : 0;
        const roiColor = roi >= 200 ? C.green : roi >= 100 ? C.amber : C.red;
        return (
          <div key={cp.name} style={{ display: "grid", gridTemplateColumns: "1.5fr 0.7fr 0.8fr 0.9fr 0.8fr", padding: "10px 0", borderBottom: i < SA_CAMPAIGNS.length - 1 ? `1px solid ${C.border}` : "none", gap: 8, alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: CAMPAIGN_COLORS[i % CAMPAIGN_COLORS.length], flexShrink: 0 }} />
              <span style={{ fontSize: 12.5, fontWeight: 500, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cp.name}</span>
            </div>
            <div style={{ textAlign: "center", fontFamily: "monospace", fontSize: 12.5, color: C.text }}>{scaleP(cp.leads)}</div>
            <div style={{ textAlign: "center", fontFamily: "monospace", fontSize: 12.5, color: C.text }}>{fmtEUR(cost)}</div>
            <div style={{ textAlign: "center", fontFamily: "monospace", fontSize: 12.5, color: C.text }}>{fmtEUR(revenue)}</div>
            <div style={{ textAlign: "center" }}>
              <span style={{ fontSize: 11, fontFamily: "monospace", fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: roiColor + "15", color: roiColor }}>
                {roi >= 0 ? "+" : ""}{roi}%
              </span>
            </div>
          </div>
        );
      })}
    </div>
  </Card>
);

// Missing Feedback alerts — advisors without status updates on assigned leads.
const MissingFeedbackCard = ({ t }) => {
  const [notified, setNotified] = useState({});
  return (
    <Card style={{ height: SECTION_H, display: "flex", flexDirection: "column" }}>
      <CardHeader
        title={t("missingFeedbackTitle")}
        info={t("tooltip_missingFeedback")}
        action={
          <span style={{ fontSize: 11, fontFamily: "monospace", fontWeight: 700, padding: "3px 9px", borderRadius: 20, background: C.red + "15", color: C.red }}>
            {MISSING_FEEDBACK.reduce((s, m) => s + m.leads, 0)}
          </span>
        }
      />
      <div style={{ flex: 1, overflowY: "auto", padding: "4px 16px 8px" }}>
        {MISSING_FEEDBACK.map((m, i) => (
          <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < MISSING_FEEDBACK.length - 1 ? `1px solid ${C.border}` : "none" }}>
            <span style={{ fontSize: 15, flexShrink: 0 }}>{m.days >= 5 ? "🔴" : "⚠️"}</span>
            <Avatar name={m.advisor} size={28} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 500, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {m.advisor} — {m.leads} {t("leadsWithoutFeedback")}
              </div>
              <div style={{ fontSize: 10.5, color: C.muted, marginTop: 1 }}>
                Team {m.team} · <span style={{ color: m.days >= 5 ? C.red : C.amber, fontWeight: 600 }}>{m.days} {t("daysOverdue")}</span>
              </div>
            </div>
            <button
              onClick={() => setNotified(prev => ({ ...prev, [m.id]: true }))}
              disabled={!!notified[m.id]}
              style={{
                padding: "4px 10px", borderRadius: 6, flexShrink: 0,
                border: notified[m.id] ? `1px solid ${C.green}40` : "none",
                background: notified[m.id] ? C.green + "12" : C.primary,
                color: notified[m.id] ? C.green : "#fff",
                fontSize: 10, fontFamily: "monospace", letterSpacing: "0.05em", textTransform: "uppercase",
                cursor: notified[m.id] ? "default" : "pointer", fontWeight: 600,
              }}>
              {notified[m.id] ? t("notified") : t("notify")}
            </button>
          </div>
        ))}
      </div>
    </Card>
  );
};

// Performance table (rows = teams for SA, advisors for VD).
// Closing % = closings / appointments; Success % = closings / leads.
const PerfTable = ({ title, rowLabel, rows, action, closingCol, successCol }) => (
  <Card style={{ height: SECTION_H, display: "flex", flexDirection: "column" }}>
    <CardHeader title={title} action={action} />
    <div style={{ flexShrink: 0, display: "grid", gridTemplateColumns: "1.5fr 0.7fr 0.7fr 0.8fr 0.9fr 0.9fr", padding: "8px 16px", borderBottom: `1px solid ${C.border}`, gap: 8 }}>
      {[rowLabel, "Leads", "Appts", "Closings", closingCol, successCol].map((h, i) => (
        <div key={h} style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", textAlign: i === 0 ? "left" : "center" }}>{h}</div>
      ))}
    </div>
    <div style={{ flex: 1, overflowY: "auto", padding: "0 16px" }}>
      {rows.map((r, i) => {
        const closingRate = r.appts > 0 ? ((r.closings / r.appts) * 100).toFixed(1) + "%" : "0%";
        const successRate = r.leads > 0 ? ((r.closings / r.leads) * 100).toFixed(1) + "%" : "0%";
        return (
          <div key={r.name} style={{ display: "grid", gridTemplateColumns: "1.5fr 0.7fr 0.7fr 0.8fr 0.9fr 0.9fr", padding: "9px 0", borderBottom: i < rows.length - 1 ? `1px solid ${C.border}` : "none", gap: 8, alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
              <Avatar name={r.name} size={26} />
              <span style={{ fontSize: 12.5, fontWeight: 500, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</span>
            </div>
            <div style={{ textAlign: "center", fontFamily: "monospace", fontSize: 12.5, color: C.text }}>{r.leads}</div>
            <div style={{ textAlign: "center", fontFamily: "monospace", fontSize: 12.5, color: C.text }}>{r.appts}</div>
            <div style={{ textAlign: "center", fontFamily: "monospace", fontSize: 12.5, color: C.text }}>{r.closings}</div>
            <div style={{ textAlign: "center", fontFamily: "monospace", fontSize: 12.5, fontWeight: 700, color: parseFloat(closingRate) >= 30 ? C.green : parseFloat(closingRate) >= 20 ? C.amber : C.red }}>{closingRate}</div>
            <div style={{ textAlign: "center", fontFamily: "monospace", fontSize: 12.5, fontWeight: 700, color: parseFloat(successRate) >= 10 ? C.green : parseFloat(successRate) >= 6 ? C.amber : C.red }}>{successRate}</div>
          </div>
        );
      })}
    </div>
  </Card>
);

// Call Attempts table — leads bucketed by how many call attempts were needed to
// reach them: 1–2 (fine), 3, 4, 5+ (problem zone highlighted).
const ATTEMPT_BUCKETS = [
  { key: "12",  label: "1–2" },
  { key: "3",   label: "3"   },
  { key: "4",   label: "4"   },
  { key: "5",   label: "5+"  },
];
const bucketCount = (ca, key) => key === "12" ? (ca?.[1] || 0) + (ca?.[2] || 0) : (ca?.[Number(key)] || 0);

const CallAttemptsTable = ({ title, rowLabel, rows, action, info }) => (
  <Card style={{ height: SECTION_H, display: "flex", flexDirection: "column" }}>
    <CardHeader title={title} action={action} info={info} />
    <div style={{ flexShrink: 0, display: "grid", gridTemplateColumns: "1.6fr repeat(4, 1fr)", padding: "8px 16px", borderBottom: `1px solid ${C.border}`, gap: 8 }}>
      {[rowLabel, ...ATTEMPT_BUCKETS.map(b => b.label)].map((h, i) => (
        <div key={h} style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", textAlign: i === 0 ? "left" : "center" }}>{h}</div>
      ))}
    </div>
    <div style={{ flex: 1, overflowY: "auto", padding: "0 16px" }}>
      {rows.map((r, i) => (
        <div key={r.name} style={{ display: "grid", gridTemplateColumns: "1.6fr repeat(4, 1fr)", padding: "9px 0", borderBottom: i < rows.length - 1 ? `1px solid ${C.border}` : "none", gap: 8, alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
            <Avatar name={r.name} size={26} />
            <span style={{ fontSize: 12.5, fontWeight: 500, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</span>
          </div>
          {ATTEMPT_BUCKETS.map(b => {
            const count = bucketCount(r.ca, b.key);
            const color = b.key === "5" || b.key === "4" ? C.red : b.key === "3" ? C.amber : C.navy;
            return <div key={b.key} style={{ textAlign: "center", fontFamily: "monospace", fontSize: 13, fontWeight: count > 0 ? 700 : 400, color: count === 0 ? C.muted : color }}>{count}</div>;
          })}
        </div>
      ))}
    </div>
  </Card>
);

// ── Shared status / feedback maps (VD Team "Assigned Leads" + Contact List) ────
// Broad Status labels (spec-aligned). Processing detail is shown separately.
const STATUS_META = {
  open:             { label: "New",             color: C.green },
  in_progress:      { label: "In Contact",      color: C.blue },
  first_contact:    { label: "In Contact",      color: C.blue },
  attempted:        { label: "In Contact",      color: C.amber },
  connected:        { label: "In Contact",      color: C.green },
  not_reached:      { label: "Not Reached",     color: C.red },
  followup:         { label: "Follow Up",       color: C.amber },
  appointment:      { label: "Appointment",     color: C.indigo },
  appt_completed:   { label: "Appointment",     color: C.indigo },
  no_show:          { label: "Appointment",     color: C.amber },
  qualified:        { label: "Qualified",       color: C.green },
  closed:           { label: "Closed",          color: C.green },
  partner:          { label: "Closed",          color: C.indigo },
  customer_partner: { label: "Closed",          color: C.green },
  lost:             { label: "Closed",          color: C.red },
  no_interest:      { label: "Not Interested",  color: C.slate },
  dnc:              { label: "Do Not Contact",  color: C.slate },
};
// Deterministic "messages sent" figure from the lead id (mock has no real counter).
const synthSms = (id) => { let h = 0; for (const ch of String(id)) h = (h * 31 + ch.charCodeAt(0)) & 0xffff; return 1 + (h % 3); };
// Feedback & Processing detail line — surfaces how much outreach has happened
// (calls placed, messages sent) so the stage isn't just a bare label.
const feedbackColDetail = (l) => {
  const calls = getCallAttempts(l), sms = synthSms(l.id);
  const c = `${calls} call${calls !== 1 ? "s" : ""}`;
  switch (l.status) {
    case "open":        return `${sms} SMS sent`;
    case "in_progress":
    case "attempted":
    case "not_reached": return `${c} · ${sms} SMS`;
    case "followup":    return `${c} · appt pending`;
    case "appointment": return `${c} · 1 appt`;
    case "closed":      return `${c} · closed`;
    default:            return `${sms} SMS sent`;
  }
};
const StatusPill = ({ status }) => {
  const m = STATUS_META[status] || STATUS_META.open;
  return <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: m.color + "16", color: m.color, whiteSpace: "nowrap" }}>{m.label}</span>;
};

// ── VD Team: Advisor Performance — compact horizontal bar chart by appointments.
const BAR_COLORS = [C.primary, C.indigo, C.blue, C.green, C.amber, C.purple];
const AdvisorApptChart = ({ title, rows, unit, action }) => {
  const max = Math.max(1, ...rows.map(r => r.appts || 0));
  return (
    <Card style={{ height: SECTION_H, display: "flex", flexDirection: "column" }}>
      <CardHeader title={title} action={action} />
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
        {rows.map((r, i) => {
          const pct = Math.round(((r.appts || 0) / max) * 100);
          const color = BAR_COLORS[i % BAR_COLORS.length];
          return (
            <div key={r.name}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 12.5, fontWeight: 500, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</span>
                <span style={{ fontSize: 12, fontFamily: "monospace", fontWeight: 700, color: C.navy }}>{r.appts} <span style={{ color: C.muted, fontWeight: 500 }}>{unit}</span></span>
              </div>
              <div style={{ height: 8, borderRadius: 6, background: C.light, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 6, transition: "width .3s ease" }} />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

// ── VD Team: Assigned Leads — leads delegated to team advisors, with their
//    feedback-flow stage, status and last activity. ─────────────────────────────
const AssignedLeadsTable = ({ title, rows, action, t }) => (
  <Card style={{ height: SECTION_H, display: "flex", flexDirection: "column" }}>
    <CardHeader title={title} action={action} />
    <div style={{ flexShrink: 0, display: "grid", gridTemplateColumns: "1.4fr 1.1fr 1.1fr 1fr 0.9fr", padding: "8px 16px", borderBottom: `1px solid ${C.border}`, gap: 8 }}>
      {[t("leadNameCol"), t("advisorNameCol"), t("feedbackStatusCol"), t("status"), t("lastActivityCol")].map((h, i) => (
        <div key={h} style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em", textAlign: i === 0 ? "left" : "left" }}>{h}</div>
      ))}
    </div>
    <div style={{ flex: 1, overflowY: "auto", padding: "0 16px" }}>
      {rows.length === 0 ? (
        <div style={{ padding: "16px 0", textAlign: "center", color: C.muted, fontSize: 13 }}>{t("noAssignedLeads")}</div>
      ) : rows.map((r, i) => (
        <div key={r.id} style={{ display: "grid", gridTemplateColumns: "1.4fr 1.1fr 1.1fr 1fr 0.9fr", padding: "9px 0", borderBottom: i < rows.length - 1 ? `1px solid ${C.border}` : "none", gap: 8, alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
            <Avatar name={r.name} size={26} />
            <span style={{ fontSize: 12.5, fontWeight: 500, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</span>
          </div>
          <span style={{ fontSize: 12, color: C.slate, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.advisor}</span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: C.indigo, whiteSpace: "nowrap" }}>{r.feedback}</div>
            <div style={{ fontSize: 10, color: C.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.detail}</div>
          </div>
          <div><StatusPill status={r.status} /></div>
          <span style={{ fontSize: 11.5, color: C.muted, whiteSpace: "nowrap" }}>{r.lastActivity}</span>
        </div>
      ))}
    </div>
  </Card>
);

// ── GP / VD (My): Contact List — a slice of the advisor's My Network. ──────────
const ContactListCard = ({ title, rows, action, t }) => (
  <Card style={{ height: SECTION_H, display: "flex", flexDirection: "column" }}>
    <CardHeader title={title} action={action} />
    <div style={{ flexShrink: 0, display: "grid", gridTemplateColumns: "1.4fr 1.2fr 1fr 0.9fr", padding: "8px 16px", borderBottom: `1px solid ${C.border}`, gap: 8 }}>
      {[t("name"), t("phone"), t("status"), t("lastActivityCol")].map(h => (
        <div key={h} style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</div>
      ))}
    </div>
    <div style={{ flex: 1, overflowY: "auto", padding: "0 16px" }}>
      {rows.length === 0 ? (
        <div style={{ padding: "16px 0", textAlign: "center", color: C.muted, fontSize: 13 }}>{t("noContactsYet")}</div>
      ) : rows.map((c, i) => (
        <div key={c.id} onClick={c.onOpen} style={{ display: "grid", gridTemplateColumns: "1.4fr 1.2fr 1fr 0.9fr", padding: "9px 0", borderBottom: i < rows.length - 1 ? `1px solid ${C.border}` : "none", gap: 8, alignItems: "center", cursor: "pointer" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
            <Avatar name={c.name} size={26} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 500, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</div>
              <div style={{ fontSize: 10, color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.city} · {c.source}</div>
            </div>
          </div>
          <span style={{ fontSize: 11.5, color: C.slate, fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.phone || "—"}</span>
          <div><StatusPill status={c.status} /></div>
          <span style={{ fontSize: 11.5, color: C.muted, whiteSpace: "nowrap" }}>{c.lastActivity}</span>
        </div>
      ))}
    </div>
  </Card>
);

// ── VD: Take Over confirmation — VD reassigns a pending lead to himself. ───────
const TakeOverModal = ({ lead, vdName, onClose, t }) => (
  <>
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", zIndex: 600 }} />
    <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 420, maxWidth: "92vw", background: "#fff", borderRadius: 16, zIndex: 700, boxShadow: "0 24px 64px rgba(0,0,0,0.22)", padding: "22px 24px", fontFamily: "inherit" }}>
      <div style={{ fontSize: 17, fontWeight: 700, color: C.navy, marginBottom: 8 }}>{t("takeOverConfirmTitle")}</div>
      <div style={{ fontSize: 13, color: C.slate, marginBottom: 22 }}><b>{lead?.name}</b> {t("takeOverConfirmMsg")}</div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
        <button onClick={onClose} style={{ padding: "9px 20px", borderRadius: 9, border: "none", background: "transparent", color: C.slate, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>{t("cancel")}</button>
        <button onClick={onClose} style={{ padding: "9px 24px", borderRadius: 9, border: "none", background: C.navy, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>{t("takeOver")}</button>
      </div>
    </div>
  </>
);

export const MVPDashboardPage = ({ role, navigateTo, leads = [], activities = [], setActivities, appointments = [] }) => {

  const t         = useT();
  // ── Time-slot selector (Today/Week/Month/Quarter/Year) ───────────────────────
  const [period, setPeriod] = useState("month");
  const pf     = PERIOD_FACTOR[period] ?? 1;
  const scaleP = (n) => Math.round(n * pf);
  const user      = ROLE_USER[role] || ROLE_USER.superadmin;
  const userName  = user.name;
  const isSA      = role === "superadmin" || role === "manager";
  const isVD      = role === "vd";
  const isGP      = role === "gp";

  // ── VD hybrid view — toggle between "My Dashboard" (personal CRM, like an
  //    Advisor) and "Team Dashboard" (assignments + advisor performance). ─────
  const [vdView, setVdView] = useState("my");
  const personal = isGP || (isVD && vdView === "my");   // personal (advisor-style) layout
  const teamView = isSA || (isVD && vdView === "team"); // team-management layout

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
  // GP            → only their own leads / appointments / activities
  // VD (My)       → only leads/appointments/tasks where the VD is personally the advisor
  // VD (Team)     → their entire team (everyone where assignedVD === their name)
  // SA            → everything
  const scopedLeads = personal
    ? allLeads.filter(l => l.assignedGP === userName)
    : isVD
      ? allLeads.filter(l => l.assignedVD === userName)
      : allLeads;

  const scopedAppts = personal
    ? allAppointments.filter(a => a.gp === userName)
    : isVD
      ? allAppointments.filter(a => a.vd === userName)
      : allAppointments;

  const scopedActivities = personal
    ? allActivities.filter(a => a.gp === userName)
    : isVD
      ? allActivities.filter(a => a.vd === userName)
      : allActivities;

  // ── KPI derivations ──────────────────────────────────────────────────────────
  const totalContacts  = scopedLeads.length;

  // New contacts = open status within scope
  // For VD (team) / SA also surface unassigned contacts (no GP assigned yet)
  const newLeads = personal
    ? scopedLeads.filter(l => l.status === "open")
    : isVD
      ? allLeads.filter(l => l.status === "open" && (l.assignedVD === userName || !l.assignedVD))
      : allLeads.filter(l => l.status === "open");

  const unassignedCount = newLeads.filter(l => !l.assignedGP && !l.assignedVD).length;

  // ── Time-slot date window ────────────────────────────────────────────────
  // Anchor day: the real today if the mock data has entries for it, otherwise
  // the latest data day that isn't in the future — so every period shows
  // sample data. The selected period then becomes a rolling window ending on
  // the anchor day, and appointments / tasks / activity are filtered by it.
  const activeAppts = scopedAppts.filter(a => a.status !== "cancelled");
  const todayStr    = new Date().toISOString().slice(0, 10);
  const dataDates   = [...activeAppts, ...scopedActivities].map(x => toISODate(x.date)).filter(Boolean).sort();
  const anchorDate  = dataDates.includes(todayStr) ? todayStr
    : (dataDates.filter(d => d <= todayStr).pop() || dataDates[dataDates.length - 1] || todayStr);
  const windowStart = shiftISODate(anchorDate, -((PERIOD_WINDOW_DAYS[period] ?? 30) - 1));
  const inPeriod    = (dateStr) => {
    const iso = toISODate(dateStr);
    return !iso || (iso >= windowStart && iso <= anchorDate);
  };

  // Appointments in the selected period — newest day first, mornings first.
  const periodAppts = activeAppts
    .filter(a => inPeriod(a.date))
    .sort((a, b) => (b.date || "").localeCompare(a.date || "") || (a.start || "").localeCompare(b.start || ""));

  // Tasks & reminders share one list (entityType reminder|task) and one "done" model.
  const isDone   = (a) => DONE_STATUSES.includes(a.status);
  const taskItems = scopedActivities
    .filter(a => (a.entityType === "reminder" || a.entityType === "task") && inPeriod(a.date))
    .sort((a, b) => Number(isDone(a)) - Number(isDone(b)));   // open first, done sink to bottom
  const openTasks  = taskItems.filter(a => !isDone(a));
  const tasksToShow = taskItems.slice(0, 7);

  // Recent activity excludes the task/reminder items shown in the Tasks panel.
  const recentActivity = scopedActivities
    .filter(a => a.entityType !== "reminder" && a.entityType !== "task" && inPeriod(a.date))
    .slice(0, 8);

  // Short date shown next to the time once the window spans more than one day.
  const fmtApptDay = (dateStr) => {
    const iso = toISODate(dateStr);
    return iso ? new Date(iso + "T12:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : dateStr;
  };

  // ── Panel titles per role / view ────────────────────────────────────────────
  const leadsTitle     = personal ? t("myLeads") : isVD ? t("pendingAssignment") : t("unassignedLeads");
  const contactsLabel  = personal ? t("myNetwork") : isVD ? t("myLeads") : t("totalContacts");
  const newLeadsLabel  = personal ? t("myLeads") : isVD ? t("pendingAssignments") : t("newContacts");
  const remindersTitle = t("remindersAndTasks");
  const apptsTitle     = t("appointments");

  // System view id the Leads page should open on when the "All" link is clicked —
  // keeps the dashboard's "My Leads / Pending Assignment / Unassigned Leads" panels
  // in sync with the matching Contacts view.
  const leadsViewId = personal ? "myleads" : isVD ? "pendingA" : "pending";

  // Contacts to show in panel (max 6) — SA: truly unassigned; VD (team): assigned to VD but no GP
  const panelLeads = personal
    ? newLeads
    : isSA
      ? allLeads.filter(l => !l.assignedGP)
      : allLeads.filter(l => l.assignedVD === userName && !l.assignedGP);
  const leadsToShow = panelLeads.slice(0, 25);

  // ── VD / SA aggregates — driven by the per-team / per-advisor mock so the KPI
  //    cards and tables show realistic org-scale numbers. ──────────────────────
  // Rows are scaled to the selected time slot so the KPI cards and the
  // Performance / Call Attempts tables stay in sync.
  const basePerfRows = isSA ? SA_TEAMS : isVD ? VD_ADVISORS : [];
  const perfRows     = basePerfRows.map(r => ({
    ...r,
    leads:    scaleP(r.leads),
    contacts: scaleP(r.contacts),
    appts:    scaleP(r.appts),
    closings: scaleP(r.closings),
    ca:       ATTEMPT_LEVELS.reduce((m, n) => { m[n] = scaleP(r.ca?.[n] || 0); return m; }, {}),
  }));
  const perfRowLabel = isSA ? t("teamCol") : t("advisorCol");
  const sumBy        = (k) => perfRows.reduce((s, r) => s + (r[k] || 0), 0);
  const aggLeads     = sumBy("leads");
  const aggContacts  = sumBy("contacts");
  const aggAppts     = sumBy("appts");
  const aggClosings  = sumBy("closings");
  const aggNotReached= perfRows.reduce((s, r) => s + (r.ca?.[5] || 0), 0);
  const aggConversion= aggLeads > 0 ? ((aggClosings / aggLeads) * 100).toFixed(1) + "%" : "0%";
  const unassignedAgg= isSA ? 47 : 12;

  // ── Assign / Take Over modals ───────────────────────────────────────────────
  const [assignTarget, setAssignTarget] = useState(null);
  const [takeOverTarget, setTakeOverTarget] = useState(null);

  // ── VD Team: Assigned Leads — leads this VD delegated to team advisors. ──────
  const assignedLeadRows = (isVD && teamView)
    ? allLeads
        .filter(l => l.assignedVD === userName && l.assignedGP && l.assignedGP !== userName)
        .slice(0, 12)
        .map(l => ({
          id: l.id, name: l.name, advisor: l.assignedGP,
          feedback: feedbackStatusLabel(l.status),
          detail: feedbackColDetail(l),
          status: l.status,
          lastActivity: l.created || "—",
        }))
    : [];

  // ── GP / VD (My): Contact List — a slice of the advisor's My Network. ────────
  const contactListRows = personal
    ? scopedLeads.slice(0, 10).map(l => ({
        id: l.id, name: l.name, city: l.city, source: l.source, phone: l.phone,
        status: l.status, lastActivity: l.created || "—",
        onOpen: () => navigateTo("LeadDetail", l, "my"),
      }))
    : [];

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

  // The VD "My" dashboard uses the same advisor layout as the GP dashboard,
  // scoped to the VD's own contacts. The My/Team toggle is injected into the
  // GP layout so the director can switch to the team view.
  const vdToggle = (
    <div title={t("tooltip_vdToggle")} style={{ display: "flex", border: `1px solid ${C.border}`, borderRadius: 9, overflow: "hidden", flexShrink: 0 }}>
      {[["my", t("myDashboard")], ["team", t("teamDashboard")]].map(([key, label], i) => (
        <button key={key} onClick={() => setVdView(key)} style={{
          padding: "7px 14px", border: "none",
          borderLeft: i === 0 ? "none" : `1px solid ${C.border}`,
          background: vdView === key ? C.navy : "#fff",
          color: vdView === key ? "#fff" : C.muted,
          fontSize: 12, fontWeight: vdView === key ? 700 : 500,
          cursor: "pointer", fontFamily: "inherit",
        }}>{label}</button>
      ))}
    </div>
  );
  if (isVD && vdView === "my") {
    return <GPDashboard navigateTo={navigateTo} userName={userName} role="vd" roleLabel={t("salesDirector")} toggle={vdToggle} />;
  }

  return (
    <>
    <div style={{ flex: 1, overflowY: "auto", fontFamily: "Inter, system-ui, sans-serif" }}>
      <div style={{ padding: "0 28px 36px" }}>

        {/* ── Page header ─────────────────────────────────────────────────── */}
        {/* Row 1: greeting + role-aware Add/Import (kept in the same top-right
            slot as the GP dashboard so the actions sit consistently). */}
        <div style={{ padding: "20px 0 0", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 400, letterSpacing: "-0.025em", color: C.text, margin: 0 }}>
              {greeting}, {user.firstName}<span style={{ color: C.primary }}>.</span>
            </h1>
            <div style={{ marginTop: 5, fontSize: 12, color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              {roleLabel} · {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </div>
          </div>
          {/* Role-aware Add / Import (SA: Company Leads only; VD: Lead or Network). */}
          <ContactActions role={role} navigateTo={navigateTo} view={leadsViewId} />
        </div>
        {/* Row 2: My/Team toggle (VD) + period selector, right-aligned. */}
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 10, margin: "16px 0", flexWrap: "wrap" }}>
          {isVD && (
            <div title={t("tooltip_vdToggle")} style={{ display: "flex", border: `1px solid ${C.border}`, borderRadius: 9, overflow: "hidden", flexShrink: 0 }}>
              {[["my", t("myDashboard")], ["team", t("teamDashboard")]].map(([key, label], i) => (
                <button key={key} onClick={() => setVdView(key)} style={{
                  padding: "7px 14px", border: "none",
                  borderLeft: i === 0 ? "none" : `1px solid ${C.border}`,
                  background: vdView === key ? C.navy : "#fff",
                  color: vdView === key ? "#fff" : C.muted,
                  fontSize: 12, fontWeight: vdView === key ? 700 : 500,
                  cursor: "pointer", fontFamily: "inherit",
                }}>
                  {label}
                </button>
              ))}
            </div>
          )}
          <PeriodTabs period={period} setPeriod={setPeriod} t={t} />
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
        ) : isVD && teamView ? (
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
            sub={personal ? t("assignedToMe") : t("inMyTeam")}
            info={t("tooltip_kpiMyNetwork")}
            color={C.navy}
          />
          <KpiCard
            label={newLeadsLabel}
            value={newLeads.length}
            sub={personal ? t("openAndAssigned") : unassignedCount > 0 ? `${unassignedCount} pending` : t("allAssigned")}
            info={t("tooltip_kpiMyLeads")}
            color={C.primary}
            warn={!personal && unassignedCount > 0}
          />
          <KpiCard
            label={t("appointments")}
            value={periodAppts.length}
            sub={t("mySchedule")}
            info={t("tooltip_kpiAppointmentsToday")}
            color={C.indigo}
          />
          <KpiCard
            label={t("openTasks")}
            value={openTasks.length}
            sub={t("remindersAndToDos")}
            info={t("tooltip_kpiOpenTasks")}
            color={openTasks.length > 0 ? C.amber : C.green}
          />
        </div>
        )}

        {/* ── Row 1: Leads | Appointments Today — equal size, scroll past ~4 rows ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>

          {/* ── Leads panel ─────────────────────────────────────────────────── */}
          <Card style={{ height: SECTION_H, display: "flex", flexDirection: "column" }}>
            <CardHeader
              title={<span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                {leadsTitle}
                <span style={{ fontSize: 11, fontWeight: 700, minWidth: 20, textAlign: "center", padding: "1px 7px", borderRadius: 20, background: C.primarySoft, color: C.primaryDark }}>{panelLeads.length}</span>
              </span>}
              action={<LinkBtn label={t("allContacts")} onClick={() => navigateTo("Leads", null, leadsViewId)} />}
            />
            <div style={{ flex: 1, overflowY: "auto", padding: "2px 16px 6px" }}>
              {leadsToShow.length === 0 ? (
                <div style={{ padding: "16px 0", textAlign: "center", color: C.muted, fontSize: 13 }}>
                  {personal ? t("noNewContactsAssigned") : t("noPendingContacts")}
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
                      {isVD && !personal && lead.assignedVD && <span style={{ marginLeft: 5, color: C.slate }}>· {lead.assignedVD}</span>}
                    </div>
                  </div>
                  {personal ? (
                    <button onClick={() => navigateTo("LeadDetail", lead, "feedback")}
                      style={{ padding:"5px 12px",background:"#fff",color:C.primaryDark,border:`1px solid ${C.primary}`,borderRadius:8,fontSize:11,cursor:"pointer",fontWeight:700,whiteSpace:"nowrap" }}>
                      {t("detailFeedback")}
                    </button>
                  ) : (
                    <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                      <button onClick={() => setAssignTarget(lead)}
                        style={{ padding:"4px 10px",background:C.primary,color:"#fff",border:"none",borderRadius:6,fontSize:10,fontFamily:"monospace",letterSpacing:"0.08em",textTransform:"uppercase",cursor:"pointer",fontWeight:600 }}>
                        {t("assignContact")}
                      </button>
                      {isVD && (
                        <button onClick={() => setTakeOverTarget(lead)}
                          style={{ padding:"4px 10px",background:"#fff",color:C.navy,border:`1px solid ${C.navy}`,borderRadius:6,fontSize:10,fontFamily:"monospace",letterSpacing:"0.08em",textTransform:"uppercase",cursor:"pointer",fontWeight:600 }}>
                          {t("takeOver")}
                        </button>
                      )}
                    </div>
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
                {periodAppts.length === 0 ? (
                  <div style={{ padding: "14px 0", textAlign: "center", color: C.muted, fontSize: 12.5 }}>
                    {t("noAppointments")}
                  </div>
                ) : periodAppts.map((appt, i) => {
                  const typeColor = { call: C.green, video: C.indigo, inperson: C.amber, email: C.blue }[appt.type] || C.indigo;
                  const appointment = APPOINTMENT_TYPE_META[appt.apptType] || APPOINTMENT_TYPE_META["Consultation Appointment"];
                  return (
                    <div key={appt.id} style={{
                      display: "flex", alignItems: "center", gap: 9,
                      padding: "8px 0",
                      borderBottom: i < periodAppts.length - 1 ? `1px solid ${C.border}` : "none",
                    }}>
                      <div style={{ width:32, height:32, borderRadius:8, background:typeColor+"18", display:"grid", placeItems:"center", fontSize:15, flexShrink:0 }}>
                        {TYPE_ICON[appt.type] || "📅"}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 500, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{appt.lead}</div>
                        <div style={{ fontSize: 10, color: C.muted, marginTop: 1 }}>
                          <span style={{ fontFamily: "monospace", color: typeColor, fontWeight: 600 }}>
                            {period !== "today" && <>{fmtApptDay(appt.date)} · </>}{appt.start}
                          </span>
                          {!personal && appt.gp && <> · {appt.gp}</>}
                        </div>
                      </div>
                      <span style={{
                        fontSize: 9, fontFamily: "monospace", padding: "2px 6px",
                        borderRadius: 20, fontWeight: 700, flexShrink: 0,
                        background: appointment.color + "18", color: appointment.color,
                      }}>
                        {appointment.short}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>
        </div>

        {/* ── Row 2: GP / VD (My) → Reminders & Tasks | Recent Activity ───── */}
        {personal && (
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
                          {!personal && rem.gp && <> · <span style={{ color: C.slate }}>{rem.gp}</span></>}
                        </div>
                      </div>
                      <span style={{ fontSize: 13 }}>{TYPE_ICON[rem.type] || "🔔"}</span>
                    </div>
                  );
                })}
              </div>
          </Card>

          {/* Recent Activity — a live window into the full audit log */}
          <Card style={{ height: SECTION_H, display: "flex", flexDirection: "column" }}>
            <CardHeader title={t("recentActivity")} action={<LinkBtn label={t("auditLogLink")} onClick={() => navigateTo("AuditLog")} />} />
            <div style={{ flex: 1, overflowY: "auto", padding: "4px 16px 10px" }}>
              {recentActivity.length === 0 ? (
                <div style={{ padding: "16px 0", textAlign: "center", color: C.muted, fontSize: 13 }}>{t("noRecentActivity")}</div>
              ) : recentActivity.map((act) => {
                const iconBg = { call: C.green, video: C.indigo, email: C.amber, inperson: C.blue, note: C.purple }[act.type] || C.muted;
                return (
                  <div key={act.id} onClick={() => navigateTo("AuditLog")} title={t("auditLogLink")} style={{ display: "flex", gap: 11, alignItems: "center", padding: "7px 0", borderBottom: `1px solid ${C.border}`, cursor: "pointer" }}>
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

        {/* ── Row 2: SA → Team Performance | Call Attempts ────────────────── */}
        {isSA && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <PerfTable title={t("teamPerformance")} rowLabel={perfRowLabel} rows={perfRows}
            closingCol={t("closingRateCol")} successCol={t("successRateCol")}
            action={<LinkBtn label={t("allLink")} onClick={() => navigateTo("Leads", null, "assigned")} />} />
          <CallAttemptsTable title={t("callAttemptsTitle")} rowLabel={perfRowLabel} rows={perfRows}
            info={t("tooltip_callAttemptsTable")}
            action={<LinkBtn label={t("allLink")} onClick={() => navigateTo("Leads", null, "assigned")} />} />
        </div>
        )}

        {/* ── Row 2: VD (Team) → Advisor Performance (visual) | Assigned Leads ── */}
        {isVD && teamView && (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(300px, 360px) 1fr", gap: 14, marginBottom: 14 }}>
          <AdvisorApptChart title={t("advisorPerformance")} rows={perfRows} unit={t("apptsByAdvisor")}
            action={<LinkBtn label={t("allLink")} onClick={() => navigateTo("Leads", null, "assigned")} />} />
          <AssignedLeadsTable title={t("assignedLeadsTitle")} rows={assignedLeadRows} t={t}
            action={<LinkBtn label={t("allContacts")} onClick={() => navigateTo("Leads", null, "assigned")} />} />
        </div>
        )}

        {/* ── Row 3: GP / VD (My) → Contact List (from My Network) ────────── */}
        {personal && (
        <div style={{ marginBottom: 14 }}>
          <ContactListCard title={t("myNetwork")} rows={contactListRows} t={t}
            action={<LinkBtn label={t("allContacts")} onClick={() => navigateTo("Leads", null, "my")} />} />
        </div>
        )}

        {/* ── Row 3: SA → Campaign ROI | Missing Feedback alerts ──────────── */}
        {isSA && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <CampaignRoiCard t={t} scaleP={scaleP}
            action={<LinkBtn label={t("reportsLink")} onClick={() => navigateTo("Reports")} />} />
          <MissingFeedbackCard t={t} />
        </div>
        )}

      </div>
    </div>
    {assignTarget && <DashAssignModal lead={assignTarget} allowTeams={isSA} onClose={() => setAssignTarget(null)} />}
    {takeOverTarget && <TakeOverModal lead={takeOverTarget} vdName={userName} t={t} onClose={() => setTakeOverTarget(null)} />}
    </>
  );
};
