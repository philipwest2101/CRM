import React, { useState, useMemo, useContext } from "react";
import { C } from "../../theme";
import { useT, LangContext } from "../../lib/i18n";
import { ALL_LEADS, enrichLead } from "../../lib/core";
import { ContactActions } from "../ui/contact-actions";

// ── Icons ─────────────────────────────────────────────────────────────────────
const IconNetwork = ({ c }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const IconTarget = ({ c }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8">
    <circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.4" fill={c} stroke="none"/>
  </svg>
);
const IconHandshake = ({ c }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 17l2 2a1 1 0 0 0 1.5-.1"/><path d="M8 11l3.5-3.5a1.4 1.4 0 0 1 2 0l3.5 3.5"/>
    <path d="M2 12l3-3 4 4-3 3z"/><path d="M22 12l-3-3-4 4 3 3z"/><path d="M14.5 18.9l-2-2M12.5 20.9l-1.5-1.5"/>
  </svg>
);
const IconTasks = ({ c }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 11l2 2 4-4"/><path d="M9 17l2 2 4-4"/><path d="M4 6h.01M4 12h.01M4 18h.01M20 6h-6"/>
  </svg>
);
const IconMail = ({ c }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>
  </svg>
);
const IconDoc = ({ c }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M9 13h6M9 17h6"/>
  </svg>
);
const IconPhone = ({ c }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2 4.2 2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.6a16 16 0 0 0 6 6l1.1-1.1a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>
  </svg>
);

// ── Soft avatar (light tint background, coloured initials) ─────────────────────
const SoftAvatar = ({ name, color, size = 36 }) => {
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div style={{ width:size,height:size,borderRadius:"50%",background:color+"1F",color,
      display:"grid",placeItems:"center",fontSize:size*0.35,fontWeight:700,flexShrink:0 }}>{initials}</div>
  );
};

const AV_PALETTE = [C.primary, C.blue, C.indigo, C.green, C.amber, C.purple];
const avColor = (name) => AV_PALETTE[name.charCodeAt(0) % AV_PALETTE.length];

// ── Widget-level error isolation ───────────────────────────────────────────────
// Spec (Faulty / Edge Cases): a failure to load one widget must NOT prevent the
// remaining widgets from loading. Each widget is wrapped in this boundary so a
// throw inside one panel degrades to a fallback instead of blanking the page.
class WidgetBoundary extends React.Component<{ fallback: React.ReactNode; children: React.ReactNode }, { failed: boolean }> {
  constructor(props) { super(props); this.state = { failed: false }; }
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

// ── Recency / due-date helpers (mock `created`/date strings → sortable) ─────────
// Leads carry human `created` strings ("Today, 08:30", "Yesterday", "3 days ago").
// Rank them so ascending sort = most recently created first.
const createdRank = (c = "") => {
  const s = c.toLowerCase();
  const tm = s.match(/(\d{1,2}):(\d{2})/);
  const frac = tm ? (Number(tm[1]) * 60 + Number(tm[2])) / 1440 : 0;
  let day: number;
  if (s.includes("today")) day = 0;
  else if (s.includes("yesterday")) day = 1;
  else { const m = s.match(/(\d+)\s*day/); day = m ? Number(m[1]) : 99; }
  return day - frac; // smaller = more recent
};
// "DD.MM.YYYY" (+ optional "HH:MM") → epoch ms, for nearest-first ordering.
const dateTimeTs = (date = "", time = "") => {
  const [d, m, y] = date.split(".").map(Number);
  const [hh, mm] = (time || "00:00").split(":").map(Number);
  return new Date(y || 0, (m || 1) - 1, d || 1, hh || 0, mm || 0).getTime();
};

export const GPDashboard = ({ navigateTo, userName = "Anna Klein", role = "gp", gpChecks = null, setGpChecks = null, roleLabel = null, toggle = null, notify = null }) => {
  const t = useT();
  const { lang } = useContext(LangContext);
  const locale = lang === "de" ? "de-DE" : "en-GB"; // en-GB → "Tuesday, 14 July 2026" (per spec example)
  const firstName = (userName || "").split(" ")[0];

  const [page,   setPage]   = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Today's date, localized per the active language (spec: header shows today's date).
  const todayLabel = new Date().toLocaleDateString(locale, {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  // ── My Leads (Lifecycle = Lead, assigned to the signed-in consultant) ─────────
  const myLeads = useMemo(() => ALL_LEADS.filter(l => l.assignedGP === userName), [userName]);
  // "Open" = not in a terminal/closed status (enrichLead sets closedDate on those).
  const openLeads = useMemo(
    () => myLeads.filter(l => !(l as any).closedDate).sort((a, b) => createdRank(a.created) - createdRank(b.created)),
    [myLeads]
  );
  const leadRows = openLeads.slice(0, 5); // preview: up to 5, most recent first

  // ── Appointments (upcoming, non-cancelled, organizer/attendee) ────────────────
  const APPTS = useMemo(() => ([
    { time:"09:00", date:"07.07.2026", name:"Sandra Richter", typeKey:"gpApptConsultation"     },
    { time:"11:30", date:"07.07.2026", name:"Tobias Fischer", typeKey:"gpApptBusinessOpening"  },
    { time:"14:00", date:"08.07.2026", name:"Petra Müller",   typeKey:"gpApptRecruiting"       },
    { time:"10:15", date:"09.07.2026", name:"Lars Dietrich",  typeKey:"gpApptInvestmentTalk"   },
    { time:"16:00", date:"09.07.2026", name:"Anna Bergmann",  typeKey:"gpApptFinanceTalk"      },
    { time:"09:30", date:"10.07.2026", name:"Klaus Wagner",   typeKey:"gpApptConsultation"     },
  ].sort((a, b) => dateTimeTs(a.date, a.time) - dateTimeTs(b.date, b.time))), []);
  const apptRows = APPTS.slice(0, 5); // preview: up to 5, nearest first

  // ── Open Tasks (not Done, sorted by due date/time, nearest first) ─────────────
  const TASKS = useMemo(() => ([
    { labelKey:"gpTaskEmail",    who:"Petra Müller",   date:"07.07.2026", time:"12:00", Icon:IconMail,  color:C.primary },
    { labelKey:"gpTaskGdpr",     who:"Lars Dietrich",  date:"07.07.2026", time:"15:30", Icon:IconDoc,   color:C.slate   },
    { labelKey:"gpTaskFollowUp", who:"Sandra Richter", date:"08.07.2026", time:"10:00", Icon:IconPhone, color:C.green   },
    { labelKey:"gpTaskEmail",    who:"Klaus Wagner",   date:"09.07.2026", time:"14:00", Icon:IconMail,  color:C.primary },
    { labelKey:"gpTaskFollowUp", who:"Anna Bergmann",  date:"10.07.2026", time:"09:00", Icon:IconPhone, color:C.green   },
  ].sort((a, b) => dateTimeTs(a.date, a.time) - dateTimeTs(b.date, b.time))), []);

  // Checked = done + removed from the panel. Persisted via the parent's gpChecks
  // when supplied (keeps state across dashboard remounts); local otherwise.
  const [localChecks, setLocalChecks] = useState<boolean[]>(
    () => (gpChecks && gpChecks.length === TASKS.length ? gpChecks : TASKS.map(() => false))
  );
  const checks = gpChecks && gpChecks.length === TASKS.length ? gpChecks : localChecks;
  const markDone = (i) => {
    setLocalChecks(prev => {
      const base = prev.length === TASKS.length ? prev : TASKS.map(() => false);
      return base.map((c, j) => (j === i ? true : c));
    });
    if (setGpChecks) setGpChecks(prev => {
      const base = prev && prev.length === TASKS.length ? prev : TASKS.map(() => false);
      return base.map((c, j) => (j === i ? true : c));
    });
  };
  const openTasks = TASKS.map((tk, i) => ({ ...tk, i })).filter(tk => !checks[tk.i]);

  // Confirmation dialog + toast for task completion (spec: confirm → done → toast).
  const [confirmIdx, setConfirmIdx] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg) => {
    if (notify) { notify(msg, "success"); return; }
    setToast(msg);
    window.setTimeout(() => setToast(null), 3500);
  };
  const confirmTaskDone = () => {
    if (confirmIdx !== null) { markDone(confirmIdx); showToast(t("taskDoneToast")); }
    setConfirmIdx(null);
  };

  // ── My Network (Lifecycle = Network — the consultant's private contacts) ───────
  const STATUS_KEYS   = ["gpStatusNA","gpStatusNew","gpStatusNew","gpStatusTodo","gpStatusTodo","gpStatusTodo","gpStatusTodo","gpStatusNew","gpStatusTodo","gpStatusNA"];
  const ACTIVITY_KEYS = ["gpActNA","gpActLead","gpActOpportunity","gpActLead","gpActLead","gpActLead","gpActLead","gpActOpportunity","gpActLead","gpActNA"];
  const STATUS_COLOR  = { gpStatusNew:C.green, gpStatusTodo:C.amber, gpStatusNA:C.muted };
  const NETWORK = useMemo(() => {
    const names = ["Michael Stein","Anna Bergmann","Tobias Fischer","Sandra Richter","Petra Müller",
      "Lars Dietrich","Julia Weiss","Klaus Wagner","Maria Huber","Felix Hartmann","Katrin Weber","Sophia Richter"];
    const cities = ["München","Hamburg","Köln","Berlin","Stuttgart","Leipzig","Nürnberg"];
    const sources = ["Referral","Event","Landing Page","Meta Ads","Partner Ref"];
    // A stable set of the consultant's own network contacts (not period-driven).
    return Array.from({ length: 128 }, (_, i) => enrichLead({
      id: `N-${1000 + i}`,
      lifecycle: "Network",
      name: names[i % names.length],
      phone: "+49 171 234 56 78",
      email: `${names[i % names.length].split(" ")[0].toLowerCase()}@example.com`,
      city: cities[i % cities.length],
      source: sources[i % sources.length],
      status: "open",
      assignedGP: userName,
      created: "5 days ago",
      consent: true,
      attempts: 0,
      statusKey: STATUS_KEYS[i % STATUS_KEYS.length],
      activityKey: ACTIVITY_KEYS[i % ACTIVITY_KEYS.length],
    }));
  }, [userName]);

  const totalPages = Math.max(1, Math.ceil(NETWORK.length / pageSize));
  const curPage    = Math.min(page, totalPages);
  const start      = (curPage - 1) * pageSize;
  const rows       = NETWORK.slice(start, start + pageSize);

  // ── KPIs (current totals — operational snapshot, NOT period-based) ────────────
  const kpis = [
    { label:t("myNetwork"),    value:NETWORK.length,    Icon:IconNetwork,   color:C.primary },
    { label:t("myLeads"),      value:myLeads.length,    Icon:IconTarget,    color:C.green   },
    { label:t("appointments"), value:APPTS.length,      Icon:IconHandshake, color:C.blue    },
    { label:t("openTasks"),    value:openTasks.length,  Icon:IconTasks,     color:C.amber   },
  ];

  // ── Shared bits ───────────────────────────────────────────────────────────────
  const cardStyle   = { background:"#fff",border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden" };
  const linkStyle   = { fontSize:12.5,color:C.primary,fontWeight:600,cursor:"pointer",fontFamily:"inherit" };
  const panelHeadStyle = { padding:"16px 20px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${C.border}` };
  const emptyStyle  = { padding:"36px 20px",textAlign:"center" as const,color:C.muted,fontSize:12.5 };
  const errFallback = (
    <div style={{ ...cardStyle, ...emptyStyle }}>⚠️ {t("widgetErrorMsg")}</div>
  );
  const EmptyState = ({ msg }) => (
    <div style={emptyStyle}>
      <div style={{ fontSize:22, marginBottom:6, opacity:0.5 }}>🗂️</div>{msg}
    </div>
  );

  return (
    <div style={{ padding:"0 28px 48px",fontFamily:"Inter,system-ui,sans-serif" }}>

      {/* ── Page Head: avatar · greeting · today's date · quick actions ───────── */}
      <div style={{ padding:"26px 0 20px",display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:24 }}>
        <div style={{ display:"flex",alignItems:"center",gap:16 }}>
          <div style={{ width:52,height:52,borderRadius:"50%",background:C.green,color:"#fff",
            display:"grid",placeItems:"center",fontSize:19,fontWeight:700,flexShrink:0 }}>
            {firstName ? userName.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase() : "?"}
          </div>
          <div>
            <h1 style={{ fontSize:30,fontWeight:500,letterSpacing:"-0.02em",color:C.navy,margin:0 }}>
              {t("helloGreeting")}, {firstName}<span style={{ color:C.primary }}>.</span>
            </h1>
            <div style={{ fontSize:13.5,color:C.muted,marginTop:4,textTransform:"capitalize" }}>{todayLabel}</div>
          </div>
        </div>
        <div style={{ display:"flex",alignItems:"center",gap:10,flexWrap:"wrap" }}>
          <ContactActions role={role} navigateTo={navigateTo} view="my" />
        </div>
      </div>

      {/* ── Optional My/Team toggle for VD ─────────────────────────────────── */}
      {toggle && (
        <div style={{ display:"flex",justifyContent:"flex-end",alignItems:"center",gap:10,marginBottom:20 }}>
          {toggle}
        </div>
      )}

      {/* ── KPI Strip ──────────────────────────────────────────────────────── */}
      <WidgetBoundary fallback={errFallback}>
        <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:20 }}>
          {kpis.map(k=>(
            <div key={k.label} style={{ ...cardStyle,padding:"20px 22px",display:"flex",alignItems:"center",gap:16 }}>
              <div style={{ width:48,height:48,borderRadius:12,background:k.color+"18",display:"grid",placeItems:"center",flexShrink:0 }}>
                <k.Icon c={k.color}/>
              </div>
              <div>
                <div style={{ fontSize:12.5,color:C.muted,fontWeight:500,marginBottom:2 }}>{k.label}</div>
                <div style={{ fontSize:32,fontWeight:700,letterSpacing:"-0.02em",lineHeight:1.1,color:C.navy }}>{k.value.toLocaleString(locale)}</div>
              </div>
            </div>
          ))}
        </div>
      </WidgetBoundary>

      {/* ── Three Panels: Open Leads · Appointments · Open Tasks ───────────── */}
      <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,marginBottom:20 }}>

        {/* Open Leads */}
        <WidgetBoundary fallback={errFallback}>
          <div style={cardStyle}>
            <div style={panelHeadStyle}>
              <div style={{ fontSize:16,fontWeight:600,color:C.navy }}>{t("openLeads")}</div>
              <span onClick={()=>navigateTo("Leads", null, "myleads")} style={linkStyle}>{t("allLink")}</span>
            </div>
            {leadRows.length === 0 ? <EmptyState msg={t("noOpenLeadsMsg")}/> : (
            <div style={{ padding:"6px 12px 12px" }}>
              {leadRows.map((l,i)=>(
                <div key={l.id} style={{ display:"flex",alignItems:"center",gap:12,padding:"12px 8px",
                  borderBottom:i<leadRows.length-1?`1px solid ${C.border}`:"none" }}>
                  <SoftAvatar name={l.name} color={avColor(l.name)}/>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ fontSize:13.5,fontWeight:600,color:C.navy }}>{l.name}</div>
                    <div style={{ fontSize:11.5,color:C.muted,marginTop:2 }}>{l.city} · {l.source}</div>
                  </div>
                  <button onClick={()=>navigateTo("LeadDetail", l, "myleads")}
                    style={{ padding:"6px 14px",borderRadius:8,border:`1px solid ${C.primary}`,background:"#fff",
                      color:C.primary,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit",flexShrink:0 }}>
                    {t("gpProcess")}
                  </button>
                </div>
              ))}
            </div>
            )}
          </div>
        </WidgetBoundary>

        {/* Appointments */}
        <WidgetBoundary fallback={errFallback}>
          <div style={cardStyle}>
            <div style={panelHeadStyle}>
              <div style={{ fontSize:16,fontWeight:600,color:C.navy }}>{t("appointments")}</div>
              <span onClick={()=>navigateTo("Calendar")} style={linkStyle}>{t("calendarLink")}</span>
            </div>
            {apptRows.length === 0 ? <EmptyState msg={t("noUpcomingApptsMsg")}/> : (
            <div style={{ padding:"6px 12px 12px" }}>
              {apptRows.map((a,i)=>(
                <div key={i} style={{ display:"flex",alignItems:"center",gap:14,padding:"12px 8px",
                  borderBottom:i<apptRows.length-1?`1px solid ${C.border}`:"none" }}>
                  <div style={{ flexShrink:0,width:64 }}>
                    <div style={{ fontSize:13.5,fontWeight:700,color:C.navy }}>{a.time}</div>
                    <div style={{ fontSize:11,color:C.muted,marginTop:2 }}>{a.date}</div>
                  </div>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ fontSize:13.5,fontWeight:600,color:C.navy }}>{a.name}</div>
                    <div style={{ fontSize:11.5,color:C.muted,marginTop:2 }}>{t(a.typeKey as any)}</div>
                  </div>
                </div>
              ))}
            </div>
            )}
          </div>
        </WidgetBoundary>

        {/* Open Tasks */}
        <WidgetBoundary fallback={errFallback}>
          <div style={cardStyle}>
            <div style={panelHeadStyle}>
              <div style={{ fontSize:16,fontWeight:600,color:C.navy }}>{t("openTasks")}</div>
              <span onClick={()=>navigateTo("Calendar")} style={linkStyle}>{t("calendarLink")}</span>
            </div>
            {openTasks.length === 0 ? <EmptyState msg={t("noOpenTasksMsg")}/> : (
            <div style={{ padding:"6px 12px 12px" }}>
              {openTasks.map((tk,idx)=>(
                <div key={tk.i} style={{ display:"flex",alignItems:"center",gap:12,padding:"12px 8px",
                  borderBottom:idx<openTasks.length-1?`1px solid ${C.border}`:"none" }}>
                  <div onClick={()=>setConfirmIdx(tk.i)}
                    style={{ width:18,height:18,borderRadius:5,cursor:"pointer",flexShrink:0,display:"grid",placeItems:"center",
                      border:`1.5px solid ${C.border}`,background:"#fff" }}/>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ fontSize:13,fontWeight:600,color:C.navy,
                      whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{t(tk.labelKey as any)} - {tk.who}</div>
                    <div style={{ fontSize:11,color:C.muted,marginTop:2 }}>{tk.date}, {tk.time}</div>
                  </div>
                  <tk.Icon c={tk.color}/>
                </div>
              ))}
            </div>
            )}
          </div>
        </WidgetBoundary>
      </div>

      {/* ── My Network Table ───────────────────────────────────────────────── */}
      <WidgetBoundary fallback={errFallback}>
      <div style={cardStyle}>
        <div style={panelHeadStyle}>
          <div style={{ fontSize:16,fontWeight:600,color:C.navy }}>{t("myNetwork")}</div>
          <span onClick={()=>navigateTo("Leads", null, "my")} style={linkStyle}>{t("allLink")}</span>
        </div>
        {NETWORK.length === 0 ? <EmptyState msg={t("noNetworkMsg")}/> : (<>
        <div style={{ overflowX:"auto" }}>
          <div style={{ minWidth:720 }}>
            {/* Header row — Name · Primary Email · Primary Phone · Status · Last Activity */}
            <div style={{ display:"grid",gridTemplateColumns:"1.6fr 1.8fr 1.4fr 1fr 1fr",gap:12,
              padding:"12px 22px",borderBottom:`1px solid ${C.border}`,background:C.light }}>
              {[t("name"),t("primaryEmail"),t("primaryPhone"),t("status"),t("lastActivityCol")].map(h=>(
                <div key={h} style={{ fontSize:11,fontWeight:600,color:C.muted,display:"flex",alignItems:"center",gap:5 }}>
                  {h}<span style={{ fontSize:9,opacity:0.6 }}>⇅</span>
                </div>
              ))}
            </div>
            {/* Body rows */}
            {rows.map((r,i)=>(
              <div key={r.id}
                style={{ display:"grid",gridTemplateColumns:"1.6fr 1.8fr 1.4fr 1fr 1fr",gap:12,
                padding:"12px 22px",borderBottom:i<rows.length-1?`1px solid ${C.border}`:"none",alignItems:"center" }}>
                <div style={{ display:"flex",alignItems:"center",gap:10,minWidth:0 }}>
                  <SoftAvatar name={r.name} color={avColor(r.name)}/>
                  {/* Clicking the underlined name opens the contact's details page. */}
                  <span onClick={()=>navigateTo("LeadDetail", r, "my")}
                    style={{ fontSize:13,fontWeight:600,color:C.navy,textDecoration:"underline",cursor:"pointer",
                      whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{r.name}</span>
                </div>
                <div style={{ fontSize:12.5,color:C.slate,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{r.email}</div>
                <div style={{ fontSize:12.5,color:C.slate,whiteSpace:"nowrap" }}>{r.phone}</div>
                <div style={{ fontSize:12.5,fontWeight:600,color:STATUS_COLOR[r.statusKey]||C.slate }}>{t(r.statusKey as any)}</div>
                <div style={{ fontSize:12.5,color:C.slate }}>{t(r.activityKey as any)}</div>
              </div>
            ))}
          </div>
        </div>
        {/* Pagination footer */}
        <div style={{ padding:"14px 22px",display:"flex",alignItems:"center",justifyContent:"space-between",
          borderTop:`1px solid ${C.border}`,flexWrap:"wrap",gap:12 }}>
          <div style={{ display:"flex",alignItems:"center",gap:10 }}>
            <span style={{ fontSize:12.5,color:C.slate }}>{t("page")} {curPage} {t("of")} {totalPages}</span>
            <button disabled={curPage<=1} onClick={()=>setPage(p=>Math.max(1,p-1))}
              style={{ width:28,height:28,borderRadius:7,border:`1px solid ${C.border}`,background:"#fff",
                color:curPage<=1?C.border:C.slate,cursor:curPage<=1?"default":"pointer",fontSize:14 }}>‹</button>
            <button disabled={curPage>=totalPages} onClick={()=>setPage(p=>Math.min(totalPages,p+1))}
              style={{ width:28,height:28,borderRadius:7,border:`1px solid ${C.border}`,background:"#fff",
                color:curPage>=totalPages?C.border:C.slate,cursor:curPage>=totalPages?"default":"pointer",fontSize:14 }}>›</button>
          </div>
          <div style={{ display:"flex",alignItems:"center",gap:14 }}>
            <select value={pageSize} onChange={e=>{ setPageSize(Number(e.target.value)); setPage(1); }}
              style={{ padding:"6px 10px",borderRadius:8,border:`1px solid ${C.border}`,fontSize:12.5,
                color:C.text,background:"#fff",fontFamily:"inherit",cursor:"pointer",outline:"none" }}>
              {[10,25,50].map(n=><option key={n} value={n}>{n}</option>)}
            </select>
            <span style={{ fontSize:12.5,color:C.slate }}>
              {t("displaying")} {NETWORK.length===0?0:start+1}–{Math.min(start+pageSize,NETWORK.length)} {t("of")} {NETWORK.length.toLocaleString(locale)} {t("records")}
            </span>
          </div>
        </div>
        </>)}
      </div>
      </WidgetBoundary>

      {/* ── Task-completion confirmation dialog ─────────────────────────────── */}
      {confirmIdx !== null && (
        <div onClick={()=>setConfirmIdx(null)}
          style={{ position:"fixed",inset:0,background:"rgba(15,23,42,0.45)",zIndex:1500,
            display:"grid",placeItems:"center",padding:20 }}>
          <div onClick={e=>e.stopPropagation()}
            style={{ background:"#fff",borderRadius:14,maxWidth:400,width:"100%",padding:"24px 24px 20px",
              boxShadow:"0 20px 60px rgba(0,0,0,0.25)" }}>
            <div style={{ fontSize:17,fontWeight:700,color:C.navy,marginBottom:8 }}>{t("taskDoneTitle")}</div>
            <div style={{ fontSize:13.5,color:C.slate,lineHeight:1.5,marginBottom:20 }}>{t("taskDoneMsg")}</div>
            <div style={{ display:"flex",justifyContent:"flex-end",gap:10 }}>
              <button onClick={()=>setConfirmIdx(null)}
                style={{ padding:"9px 16px",borderRadius:9,border:`1px solid ${C.border}`,background:"#fff",
                  color:C.slate,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>{t("cancel")}</button>
              <button onClick={confirmTaskDone}
                style={{ padding:"9px 16px",borderRadius:9,border:"none",background:C.green,
                  color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>{t("confirmAction")}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Local toast (used when no app-level notify is provided) ──────────── */}
      {toast && (
        <div style={{ position:"fixed",top:24,right:24,zIndex:2000,display:"flex",alignItems:"center",gap:10,
          background:"#fff",border:`1px solid ${C.border}`,borderLeft:`4px solid ${C.green}`,borderRadius:12,
          padding:"12px 16px",boxShadow:"0 8px 28px rgba(16,24,40,0.16)" }}>
          <div style={{ width:22,height:22,borderRadius:999,background:C.green,color:"#fff",display:"grid",
            placeItems:"center",fontSize:13,fontWeight:800,flexShrink:0 }}>✓</div>
          <div style={{ fontSize:13.5,fontWeight:600,color:C.navy }}>{toast}</div>
        </div>
      )}
    </div>
  );
};
