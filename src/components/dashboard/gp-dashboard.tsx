import React, { useState, useMemo, useContext } from "react";
import { C } from "../../theme";
import { useT, LangContext } from "../../lib/i18n";
import { ALL_LEADS, getCallAttempts, totalCallAttempts } from "../../lib/core";
import { ContactActions } from "../ui/contact-actions";
import { DateRangePicker } from "../ui/date-range-picker";

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
const IconPlus = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <path d="M12 5v14M5 12h14"/>
  </svg>
);
const IconImport = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v12M7 10l5 5 5-5"/><path d="M5 19h14"/>
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

// Period → mock figures, so the Today/Week/…/Year selector visibly changes the data.
const PERIOD_DATA = {
  today:   { network:248, leads:30,   appts:3,   tasks:5,  records:57   },
  week:    { network:263, leads:112,  appts:5,   tasks:14, records:184  },
  month:   { network:305, leads:340,  appts:14,  tasks:22, records:642  },
  quarter: { network:418, leads:940,  appts:41,  tasks:37, records:1730 },
  year:    { network:612, leads:3480, appts:168, tasks:63, records:5840 },
};

export const GPDashboard = ({ navigateTo, userName = "Anna Klein", role = "gp", gpChecks = null, setGpChecks = null, roleLabel = null, toggle = null }) => {
  const t = useT();
  const { lang } = useContext(LangContext);
  const firstName = (userName || "").split(" ")[0];

  const [period, setPeriod] = useState("today");
  const [page,   setPage]   = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const data = PERIOD_DATA[period] || PERIOD_DATA.today;

  // Time-based greeting + localised current date (like the rest of the app).
  const hour = new Date().getHours();
  const greeting = hour < 12 ? t("greeting_morning") : hour < 17 ? t("greeting_afternoon") : t("greeting_evening");
  const headerDate = new Date().toLocaleDateString(lang === "de" ? "de-DE" : "en-US",
    { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  // ── KPIs (period-driven) ──────────────────────────────────────────────────
  const kpis = [
    { label:t("myNetwork"),     value:data.network, Icon:IconNetwork,   color:C.primary },
    { label:t("myLeads"),       value:data.leads,   Icon:IconTarget,    color:C.green   },
    { label:t("appointments"),  value:data.appts,   Icon:IconHandshake, color:C.blue    },
    { label:t("openTasks"),     value:data.tasks,   Icon:IconTasks,     color:C.amber   },
  ];

  // ── My Leads — the advisor's real assigned leads ─────────────────────────────
  const myLeads = useMemo(() => ALL_LEADS.filter(l => l.assignedGP === userName), [userName]);
  const leadRows = myLeads.slice(0, 5);
  // Spec §4: call-attempts metric summed from the numeric callAttempts property.
  const myCallAttempts = useMemo(() => totalCallAttempts(myLeads), [myLeads]);

  // ── Appointments (list previews the selected period) ─────────────────────────
  const APPTS = [
    { time:"10:00", date:"07.07.2026", name:"Sandra Richter", typeKey:"gpApptConsultation"     },
    { time:"10:00", date:"07.07.2026", name:"Sandra Richter", typeKey:"gpApptRecruiting"       },
    { time:"10:00", date:"07.07.2026", name:"Tobias Fischer", typeKey:"gpApptBusinessOpening"  },
    { time:"10:00", date:"07.07.2026", name:"Tobias Fischer", typeKey:"gpApptInvestmentTalk"   },
    { time:"10:00", date:"07.07.2026", name:"Tobias Fischer", typeKey:"gpApptFinanceTalk"      },
  ];
  const apptRows = APPTS.slice(0, Math.min(data.appts, APPTS.length));

  // ── Open Tasks ────────────────────────────────────────────────────────────────
  const TASKS = [
    { labelKey:"gpTaskEmail",    who:"Petra Müller",   date:"09.07.2026, 14:00", Icon:IconMail,  color:C.primary },
    { labelKey:"gpTaskGdpr",     who:"Lars Dietrich",  date:"07.07.2026, 12:00", Icon:IconDoc,   color:C.slate   },
    { labelKey:"gpTaskEmail",    who:"Petra Müller",   date:"09.07.2026, 14:00", Icon:IconMail,  color:C.primary },
    { labelKey:"gpTaskFollowUp", who:"Sandra Richter", date:"09.07.2026, 14:00", Icon:IconPhone, color:C.green   },
    { labelKey:"gpTaskFollowUp", who:"Sandra Richter", date:"07.07.2026, 10:00", Icon:IconPhone, color:C.green   },
  ];
  // Works both when the parent supplies gpChecks/setGpChecks and standalone.
  const [localChecks, setLocalChecks] = useState(
    () => (gpChecks && gpChecks.length === TASKS.length ? gpChecks : [false, false, false, true, true])
  );
  const checks = gpChecks && gpChecks.length === TASKS.length ? gpChecks : localChecks;
  const toggleTask = (i) => {
    setLocalChecks(prev => prev.map((c, j) => j === i ? !c : c));
    if (setGpChecks) setGpChecks(prev => {
      const base = prev && prev.length === TASKS.length ? prev : TASKS.map(() => false);
      return base.map((c, j) => j === i ? !c : c);
    });
  };

  // ── My Network — mock records, count driven by the selected period ────────────
  const STATUS_KEYS   = ["gpStatusNA","gpStatusNew","gpStatusNew","gpStatusTodo","gpStatusTodo","gpStatusTodo","gpStatusTodo","gpStatusNew","gpStatusTodo","gpStatusNA"];
  const ACTIVITY_KEYS = ["gpActNA","gpActLead","gpActOpportunity","gpActLead","gpActLead","gpActLead","gpActLead","gpActOpportunity","gpActLead","gpActNA"];
  const STATUS_COLOR  = { gpStatusNew:C.green, gpStatusTodo:C.amber, gpStatusNA:C.muted };
  const NETWORK = useMemo(() => {
    const names = ["Michael Stein","Anna Bergmann","Tobias Fischer","Sandra Richter","Petra Müller",
      "Lars Dietrich","Julia Weiss","Klaus Wagner","Maria Huber","Felix Hartmann","Katrin Weber","Sophia Richter"];
    return Array.from({ length: data.records }, (_, i) => ({
      id: i,
      name: names[i % names.length],
      phone: "+41 1234 5678",
      email: "someone@example.com",
      statusKey: STATUS_KEYS[i % STATUS_KEYS.length],
      activityKey: ACTIVITY_KEYS[i % ACTIVITY_KEYS.length],
    }));
  }, [data.records]);

  const totalPages = Math.max(1, Math.ceil(NETWORK.length / pageSize));
  const curPage    = Math.min(page, totalPages);
  const start      = (curPage - 1) * pageSize;
  const rows       = NETWORK.slice(start, start + pageSize);

  // ── Shared bits ───────────────────────────────────────────────────────────────
  const cardStyle   = { background:"#fff",border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden" };
  const linkStyle   = { fontSize:12.5,color:C.primary,fontWeight:600,cursor:"pointer",fontFamily:"inherit" };
  const panelHeadStyle = { padding:"16px 20px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${C.border}` };

  return (
    <div style={{ padding:"0 28px 48px",fontFamily:"Inter,system-ui,sans-serif" }}>

      {/* ── Page Head ──────────────────────────────────────────────────────── */}
      <div style={{ padding:"26px 0 20px",display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:24 }}>
        <div style={{ display:"flex",alignItems:"center",gap:16 }}>
          <div style={{ width:52,height:52,borderRadius:"50%",background:C.green,color:"#fff",
            display:"grid",placeItems:"center",fontSize:19,fontWeight:700,flexShrink:0 }}>
            {firstName ? userName.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase() : "?"}
          </div>
          <div>
            <h1 style={{ fontSize:30,fontWeight:500,letterSpacing:"-0.02em",color:C.navy,margin:0 }}>
              {greeting}, {firstName}<span style={{ color:C.primary }}>.</span>
            </h1>
            <div style={{ marginTop:5,fontSize:12,color:C.muted,letterSpacing:"0.08em",textTransform:"uppercase" }}>
              {roleLabel || t("advisor")} · {headerDate}
            </div>
          </div>
        </div>
        <ContactActions role={role} navigateTo={navigateTo} view="my" />
      </div>

      {/* ── Period Selector (+ optional My/Team toggle for VD) ─────────────── */}
      <div style={{ display:"flex",justifyContent:"flex-end",alignItems:"center",gap:10,marginBottom:20 }}>
        {toggle}
        <DateRangePicker period={period} onChange={(p)=>{ setPeriod(p); setPage(1); }} />
      </div>

      {/* ── KPI Strip ──────────────────────────────────────────────────────── */}
      <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:20 }}>
        {kpis.map(k=>(
          <div key={k.label} style={{ ...cardStyle,padding:"20px 22px",display:"flex",alignItems:"center",gap:16 }}>
            <div style={{ width:48,height:48,borderRadius:12,background:k.color+"18",display:"grid",placeItems:"center",flexShrink:0 }}>
              <k.Icon c={k.color}/>
            </div>
            <div>
              <div style={{ fontSize:12.5,color:C.muted,fontWeight:500,marginBottom:2 }}>{k.label}</div>
              <div style={{ fontSize:32,fontWeight:700,letterSpacing:"-0.02em",lineHeight:1.1,color:C.navy }}>{k.value.toLocaleString(lang==="de"?"de-DE":"en-US")}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Three Panels: My Leads · Appointments · Open Tasks ─────────────── */}
      <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,marginBottom:20 }}>

        {/* My Leads */}
        <div style={cardStyle}>
          <div style={panelHeadStyle}>
            <div>
              <div style={{ fontSize:16,fontWeight:600,color:C.navy }}>{t("myLeads")}</div>
              <div style={{ fontSize:11,color:C.muted,marginTop:2 }}>{myCallAttempts} {myCallAttempts===1?t("mlCall"):t("mlCalls")} · {myLeads.length} {t("myLeads")}</div>
            </div>
            <span onClick={()=>navigateTo("Leads", null, "myleads")} style={linkStyle}>{t("allLink")}</span>
          </div>
          <div style={{ padding:"6px 12px 12px" }}>
            {leadRows.map((l,i)=>{
              const attempts = getCallAttempts(l);
              return (
              <div key={l.id} style={{ display:"flex",alignItems:"center",gap:12,padding:"12px 8px",
                borderBottom:i<leadRows.length-1?`1px solid ${C.border}`:"none" }}>
                <SoftAvatar name={l.name} color={avColor(l.name)}/>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ fontSize:13.5,fontWeight:600,color:C.navy }}>{l.name}</div>
                  <div style={{ fontSize:11.5,color:C.muted,marginTop:2 }}>{l.nextAction ? `→ ${l.nextAction}` : `${l.city} · ${l.source}`}{attempts>0?` · ${attempts} ${attempts===1?t("mlCall"):t("mlCalls")}`:""}</div>
                </div>
                <button onClick={()=>navigateTo("LeadDetail", l, "myleads")}
                  style={{ padding:"6px 14px",borderRadius:8,border:`1px solid ${C.primary}`,background:"#fff",
                    color:C.primary,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit",flexShrink:0 }}>
                  {t("gpProcess")}
                </button>
              </div>
            );})}
          </div>
        </div>

        {/* Appointments */}
        <div style={cardStyle}>
          <div style={panelHeadStyle}>
            <div style={{ fontSize:16,fontWeight:600,color:C.navy }}>{t("appointments")}</div>
            <span onClick={()=>navigateTo("Calendar")} style={linkStyle}>{t("calendarLink")}</span>
          </div>
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
        </div>

        {/* Open Tasks */}
        <div style={cardStyle}>
          <div style={panelHeadStyle}>
            <div style={{ fontSize:16,fontWeight:600,color:C.navy }}>{t("openTasks")}</div>
            <span onClick={()=>navigateTo("Calendar")} style={linkStyle}>{t("calendarLink")}</span>
          </div>
          <div style={{ padding:"6px 12px 12px" }}>
            {TASKS.map((tk,i)=>{
              const done = checks[i];
              return (
                <div key={i} style={{ display:"flex",alignItems:"center",gap:12,padding:"12px 8px",
                  borderBottom:i<TASKS.length-1?`1px solid ${C.border}`:"none" }}>
                  <div onClick={()=>toggleTask(i)}
                    style={{ width:18,height:18,borderRadius:5,cursor:"pointer",flexShrink:0,display:"grid",placeItems:"center",
                      border:`1.5px solid ${done?C.green:C.border}`,background:done?C.green:"#fff",
                      color:"#fff",fontSize:11,fontWeight:700 }}>{done?"✓":""}</div>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ fontSize:13,fontWeight:600,color:done?C.muted:C.navy,
                      textDecoration:done?"line-through":"none",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{t(tk.labelKey as any)} - {tk.who}</div>
                    <div style={{ fontSize:11,color:C.muted,marginTop:2 }}>{tk.date}</div>
                  </div>
                  <tk.Icon c={tk.color}/>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── My Network Table ───────────────────────────────────────────────── */}
      <div style={cardStyle}>
        <div style={panelHeadStyle}>
          <div style={{ fontSize:16,fontWeight:600,color:C.navy }}>{t("myNetwork")}</div>
          <span onClick={()=>navigateTo("Leads", null, "my")} style={linkStyle}>{t("allLink")}</span>
        </div>
        <div style={{ overflowX:"auto" }}>
          <div style={{ minWidth:720 }}>
            {/* Header row */}
            <div style={{ display:"grid",gridTemplateColumns:"1.6fr 1.2fr 1.6fr 1fr 1fr",gap:12,
              padding:"12px 22px",borderBottom:`1px solid ${C.border}`,background:C.light }}>
              {[t("name"),t("phone"),t("email"),t("status"),t("lastActivityCol")].map(h=>(
                <div key={h} style={{ fontSize:11,fontWeight:600,color:C.muted,display:"flex",alignItems:"center",gap:5 }}>
                  {h}<span style={{ fontSize:9,opacity:0.6 }}>⇅</span>
                </div>
              ))}
            </div>
            {/* Body rows */}
            {rows.map((r,i)=>(
              <div key={r.id} onClick={()=>navigateTo("Leads", null, "my")}
                style={{ display:"grid",gridTemplateColumns:"1.6fr 1.2fr 1.6fr 1fr 1fr",gap:12,cursor:"pointer",
                padding:"12px 22px",borderBottom:i<rows.length-1?`1px solid ${C.border}`:"none",alignItems:"center" }}>
                <div style={{ display:"flex",alignItems:"center",gap:10,minWidth:0 }}>
                  <SoftAvatar name={r.name} color={avColor(r.name)}/>
                  <span style={{ fontSize:13,fontWeight:600,color:C.navy,textDecoration:"underline",
                      whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{r.name}</span>
                </div>
                <div style={{ fontSize:12.5,color:C.slate,whiteSpace:"nowrap" }}>{r.phone}</div>
                <div style={{ fontSize:12.5,color:C.slate,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{r.email}</div>
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
              {t("displaying")} {NETWORK.length===0?0:start+1}–{Math.min(start+pageSize,NETWORK.length)} {t("of")} {NETWORK.length.toLocaleString(lang==="de"?"de-DE":"en-US")} {t("records")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SALES DIRECTOR DASHBOARD (VD — based on 02_director design)
// ─────────────────────────────────────────────────────────────────────────────
