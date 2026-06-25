import React, { useState } from "react";
import { C } from "../../theme";
import { PRIORITY_META, DONE_STATUSES } from "../../lib/core";
import { useT } from "../../lib/i18n";

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

  // ── Role-scoped data filters ─────────────────────────────────────────────────
  // GP  → only their own leads / appointments / activities
  // VD  → their entire team (everyone where assignedVD === their name)
  // SA  → everything
  const scopedLeads = isGP
    ? leads.filter(l => l.assignedGP === userName)
    : isVD
      ? leads.filter(l => l.assignedVD === userName)
      : leads;

  const scopedAppts = isGP
    ? appointments.filter(a => a.gp === userName)
    : isVD
      ? appointments.filter(a => a.vd === userName)
      : appointments;

  const scopedActivities = isGP
    ? activities.filter(a => a.gp === userName)
    : isVD
      ? activities.filter(a => a.vd === userName)
      : activities;

  // ── KPI derivations ──────────────────────────────────────────────────────────
  const totalContacts  = scopedLeads.length;

  // New contacts = open status within scope
  // For VD/SA also surface unassigned contacts (no GP assigned yet)
  const newLeads = isGP
    ? scopedLeads.filter(l => l.status === "open")
    : isVD
      ? leads.filter(l => l.status === "open" && (l.assignedVD === userName || !l.assignedVD))
      : leads.filter(l => l.status === "open");

  const unassignedCount = newLeads.filter(l => !l.assignedGP && !l.assignedVD).length;

  const todayStr       = "2026-02-24"; // matches mock data; use new Date().toISOString().slice(0,10) in prod
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
  const leadsTitle    = isGP ? t("myNetwork") : isVD ? t("myNetwork") : t("newContacts");
  const contactsLabel = isGP ? t("totalContacts") : isVD ? t("totalContacts") : t("totalContacts");
  const remindersTitle = isGP ? t("myTasks") : isVD ? t("teamTasks") : t("remindersAndTasks");
  const apptsTitle    = isGP ? t("myAppointmentsToday") : isVD ? t("teamAppointmentsToday") : t("appointmentsToday");

  // Contacts to show in panel (max 6)
  const leadsToShow = newLeads.slice(0, 6);

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
            { label:"Opt-In Rate",    value:"79,8",  delta:"+2,4pp", up:true,  sub:"% GDPR",            warn:false, good:false },
            { label:"Conversion",     value:"6,2",   delta:"+0,4pp", up:true,  sub:"% Org MTD",         warn:false, good:true  },
          ];
          return (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:12, marginBottom:14 }}>
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
            label="New Contacts"
            value={newLeads.length}
            sub={isGP ? "open & assigned to me" : unassignedCount > 0 ? `${unassignedCount} unassigned` : "all assigned"}
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

        {/* ── Top row: New Contacts | Reminders & Tasks | Appointments Today ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1.25fr 1fr 1fr", gap: 14, marginBottom: 14, alignItems: "start" }}>

          {/* ── New Contacts panel ───────────────────────────────────────────── */}
          <Card>
            <CardHeader
              title={leadsTitle}
              action={<LinkBtn label={t("allContacts")} onClick={() => navigateTo("Leads")} />}
            />
            <div style={{ padding: "2px 16px 10px" }}>
              {/* VD/SA: unassigned warning banner */}
              {!isGP && unassignedCount > 0 && (
                <div style={{
                  margin: "8px 0 8px",
                  padding: "7px 12px", borderRadius: 8,
                  background: C.red + "08", border: `1px solid ${C.red}30`,
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  <span style={{ fontSize: 13 }}>⚠️</span>
                  <span style={{ fontSize: 12, color: C.red, fontWeight: 600 }}>
                    {unassignedCount} contact{unassignedCount > 1 ? "s" : ""} not yet assigned to a consultant
                  </span>
                </div>
              )}

              {leadsToShow.length === 0 ? (
                <div style={{ padding: "16px 0", textAlign: "center", color: C.muted, fontSize: 13 }}>
                  {isGP ? "No new contacts assigned to you." : "No new contacts right now."}
                </div>
              ) : leadsToShow.map((lead, i) => (
                <div key={lead.id} style={{
                  display: "grid",
                  gridTemplateColumns: "32px 1fr auto",
                  alignItems: "center",
                  gap: 10,
                  padding: "7px 0",
                  borderBottom: i < leadsToShow.length - 1 ? `1px solid ${C.border}` : "none",
                }}>
                  <Avatar name={lead.name} size={32} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{lead.name}</div>
                    <div style={{ fontSize: 10.5, color: C.muted, marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {lead.city} · {lead.source}
                      {/* VD/SA: show who it's assigned to (or flag as unassigned) */}
                      {!isGP && (
                        <span style={{
                          marginLeft: 5,
                          color: lead.assignedGP ? C.muted : C.red,
                          fontWeight: lead.assignedGP ? 400 : 600,
                        }}>
                          · {lead.assignedGP ? `→ ${lead.assignedGP}` : "⚠ unassigned"}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => navigateTo("Leads")}
                    style={{
                      padding: "4px 10px", background: C.primary, color: "#fff",
                      border: "none", borderRadius: 6, fontSize: 10, fontFamily: "monospace",
                      letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    Open
                  </button>
                </div>
              ))}
            </div>
          </Card>

          {/* ── Reminders / Tasks panel ───────────────────────────────────── */}
          <Card>
            <CardHeader
              title={remindersTitle}
              action={<LinkBtn label="All →" onClick={() => navigateTo("Calendar")} />}
            />
            <div style={{ padding: "2px 14px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
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
                        {/* VD/SA: show which GP the task belongs to */}
                        {!isGP && rem.gp && <> · <span style={{ color: C.slate }}>{rem.gp}</span></>}
                      </div>
                    </div>
                    <span style={{ fontSize: 13 }}>{TYPE_ICON[rem.type] || "🔔"}</span>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* ── Appointments Today — third column ────────────────────────────── */}
          <Card>
            <CardHeader
              title={apptsTitle}
              action={<LinkBtn label="Calendar →" onClick={() => navigateTo("Calendar")} />}
            />
            <div style={{ padding: "2px 14px 8px" }}>
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
                      <span style={{ fontSize: 15, flexShrink: 0 }}>{TYPE_ICON[appt.type] || "📅"}</span>
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

        {/* ── SA: Pending Assignments + Campaign/Lead Source Stats ─────────── */}
        {isSA && (() => {
          const unassigned = leads.filter(l => !l.assignedGP && !l.assignedVD);
          // Campaign stats
          const campaignMap: Record<string, number> = {};
          const sourceMap: Record<string, number> = {};
          leads.forEach(l => {
            if (l.campaign) campaignMap[l.campaign] = (campaignMap[l.campaign] || 0) + 1;
            if (l.source)   sourceMap[l.source]     = (sourceMap[l.source]     || 0) + 1;
          });
          const campaigns = Object.entries(campaignMap).sort((a, b) => b[1] - a[1]).slice(0, 6);
          const sources   = Object.entries(sourceMap).sort((a, b) => b[1] - a[1]).slice(0, 6);
          const maxCamp   = Math.max(...campaigns.map(([,v]) => v), 1);
          const maxSrc    = Math.max(...sources.map(([,v]) => v), 1);
          const BAR_COLORS = [C.primary, C.indigo, C.blue, C.green, C.amber, C.purple];

          return (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14, alignItems: "start" }}>

              {/* Pending Assignments */}
              <Card>
                <CardHeader
                  title="Pending Assignments"
                  action={<LinkBtn label="Assign →" onClick={() => navigateTo("Leads")} />}
                />
                <div style={{ padding: "4px 16px 12px" }}>
                  {unassigned.length === 0 ? (
                    <div style={{ padding: "16px 0", textAlign: "center", color: C.green, fontSize: 13, fontWeight: 600 }}>
                      ✓ All contacts are assigned
                    </div>
                  ) : unassigned.slice(0, 6).map((lead, i) => (
                    <div key={lead.id} style={{
                      display: "grid", gridTemplateColumns: "30px 1fr auto auto",
                      alignItems: "center", gap: 10, padding: "7px 0",
                      borderBottom: i < Math.min(unassigned.length, 6) - 1 ? `1px solid ${C.border}` : "none",
                    }}>
                      <Avatar name={lead.name} size={30} color={C.indigo} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{lead.name}</div>
                        <div style={{ fontSize: 10.5, color: C.muted }}>{lead.campaign || "—"}</div>
                      </div>
                      <span style={{ fontSize: 11, color: C.red, fontWeight: 600, whiteSpace: "nowrap" }}>⚠ Unassigned</span>
                      <button onClick={() => navigateTo("Leads")} style={{ padding: "4px 10px", borderRadius: 6, border: "none", background: C.primary, color: "#fff", fontSize: 10, fontWeight: 600, cursor: "pointer" }}>Assign</button>
                    </div>
                  ))}
                  {unassigned.length > 6 && (
                    <div style={{ paddingTop: 8, fontSize: 12, color: C.muted, textAlign: "center" }}>+{unassigned.length - 6} more</div>
                  )}
                </div>
              </Card>

              {/* Campaign / Lead Source Statistics */}
              <Card>
                <CardHeader title="Campaign / Lead Source Statistics" action={<LinkBtn label="Reports →" onClick={() => navigateTo("Reports")} />} />
                <div style={{ padding: "12px 20px 12px" }}>
                  {/* Campaigns */}
                  {campaigns.length > 0 && (<>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>By Campaign</div>
                    {campaigns.map(([name, count], i) => (
                      <div key={name} style={{ marginBottom: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
                          <span style={{ color: C.text, fontWeight: 500 }}>{name}</span>
                          <span style={{ color: C.slate, fontWeight: 600 }}>{count}</span>
                        </div>
                        <div style={{ height: 6, borderRadius: 4, background: C.border }}>
                          <div style={{ height: "100%", width: `${(count / maxCamp) * 100}%`, borderRadius: 4, background: BAR_COLORS[i % BAR_COLORS.length] }} />
                        </div>
                      </div>
                    ))}
                  </>)}
                  {/* Sources */}
                  {sources.length > 0 && (<>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", margin: "14px 0 8px" }}>By Lead Source</div>
                    {sources.map(([name, count], i) => (
                      <div key={name} style={{ marginBottom: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
                          <span style={{ color: C.text, fontWeight: 500 }}>{name}</span>
                          <span style={{ color: C.slate, fontWeight: 600 }}>{count}</span>
                        </div>
                        <div style={{ height: 6, borderRadius: 4, background: C.border }}>
                          <div style={{ height: "100%", width: `${(count / maxSrc) * 100}%`, borderRadius: 4, background: BAR_COLORS[i % BAR_COLORS.length] }} />
                        </div>
                      </div>
                    ))}
                  </>)}
                  {campaigns.length === 0 && sources.length === 0 && (
                    <div style={{ textAlign: "center", color: C.muted, fontSize: 13, padding: "16px 0" }}>No data yet.</div>
                  )}
                </div>
              </Card>

            </div>
          );
        })()}

        {/* ── Recent Activity — full width below the top row ────────────────── */}
        <Card>
          <CardHeader
            title={isGP ? "My Recent Activity" : isVD ? "Team Recent Activity" : "Recent Activity"}
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
                    <div key={act.id} style={{
                      display: "flex", gap: 11, alignItems: "center",
                      padding: "7px 0",
                      borderBottom: `1px solid ${C.border}`,
                    }}>
                      <div style={{
                        width: 30, height: 30, borderRadius: "50%",
                        background: iconBg + "18", display: "grid", placeItems: "center",
                        fontSize: 14, flexShrink: 0,
                      }}>
                        {TYPE_ICON[act.type] || "📋"}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 500, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{act.title}</div>
                        <div style={{ fontSize: 10.5, color: C.muted, marginTop: 1 }}>
                          {!isGP && act.gp && <>{act.gp} · </>}
                          {act.date} {act.time}
                        </div>
                      </div>
                      <span style={{
                        fontSize: 9, fontFamily: "monospace", padding: "2px 7px",
                        borderRadius: 20, flexShrink: 0,
                        background: C.muted + "18", color: C.muted, fontWeight: 600,
                        textTransform: "capitalize",
                      }}>
                        {act.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>

      </div>
    </div>
  );
};
