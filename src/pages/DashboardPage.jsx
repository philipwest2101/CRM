import React, { useState } from "react";

// LH-Vion Design System colour tokens (mirrors CRMAppV5.jsx)
const C = {
  primary:"#FF9000", primaryDark:"#E07F00", primarySoft:"#FFF4E0",
  navy:"#1D2939",
  blue:"#0075FF",
  indigo:"#6366F1", purple:"#8B5CF6",
  green:"#12B76A",
  amber:"#FDB022",
  red:"#F04438",
  slate:"#667085",
  light:"#F9FAFB",
  border:"#EAECF0",
  text:"#222730",
  muted:"#98A2B3",
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
    padding: "16px 20px 12px",
    borderBottom: `1px solid ${C.border}`,
    display: "flex", alignItems: "center", justifyContent: "space-between",
  }}>
    <div style={{ fontSize: 16, fontWeight: 600, color: C.text }}>{title}</div>
    {action}
  </div>
);

const KpiCard = ({ label, value, sub, color = C.text, warn = false }) => (
  <Card>
    <div style={{ padding: "18px 20px" }}>
      <div style={{
        fontSize: 10, color: C.muted, fontWeight: 700,
        letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10,
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 38, fontWeight: 400, letterSpacing: "-0.03em",
        lineHeight: 1, color: warn ? C.red : color,
      }}>
        {value}
      </div>
      {sub && (
        <div style={{ marginTop: 8, fontSize: 11, color: C.muted }}>{sub}</div>
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

const PRIORITY_COLOR = { high: C.red, normal: C.amber, low: C.muted };
const PriorityDot = ({ priority }) => (
  <span style={{
    width: 7, height: 7, borderRadius: "50%",
    background: PRIORITY_COLOR[priority] || C.muted,
    display: "inline-block", flexShrink: 0,
  }} />
);

const TYPE_ICON = {
  call: "📞", email: "✉️", video: "📹",
  note: "📝", inperson: "🤝", import: "📥", assign: "🔀",
};

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 1 DASHBOARD — role-filtered, same layout for all roles
// ─────────────────────────────────────────────────────────────────────────────
const DashboardPage = ({ role, navigateTo, leads = [], activities = [], appointments = [] }) => {

  const user      = ROLE_USER[role] || ROLE_USER.superadmin;
  const userName  = user.name;
  const isSA      = role === "superadmin" || role === "manager";
  const isVD      = role === "vd";
  const isGP      = role === "gp";

  // ── Greeting ────────────────────────────────────────────────────────────────
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const roleLabel = {
    gp: "Consultant", vd: "Sales Director", superadmin: "Super Admin", manager: "Manager",
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

  // New leads = open status within scope
  // For VD/SA also surface unassigned leads (no GP assigned yet)
  const newLeads = isGP
    ? scopedLeads.filter(l => l.status === "open")
    : isVD
      ? leads.filter(l => l.status === "open" && (l.assignedVD === userName || !l.assignedVD))
      : leads.filter(l => l.status === "open");

  const unassignedCount = newLeads.filter(l => !l.assignedGP && !l.assignedVD).length;

  const todayStr       = "2026-02-24"; // matches mock data; use new Date().toISOString().slice(0,10) in prod
  const todayAppts     = scopedAppts.filter(a => a.date === todayStr && a.status !== "cancelled");

  const openReminders  = scopedActivities.filter(a =>
    a.entityType === "reminder" && a.status !== "done" && a.status !== "cancelled"
  );

  const recentActivity = [...scopedActivities]
    .filter(a => a.entityType !== "reminder")
    .slice(0, 6);

  // ── Leads panel title & sub-label per role ───────────────────────────────────
  const leadsTitle = isGP ? "My New Leads" : isVD ? "Team New Leads" : "New Leads";
  const contactsLabel = isGP ? "My Contacts" : isVD ? "Team Contacts" : "Total Contacts";
  const remindersTitle = isGP ? "My Reminders & Tasks" : isVD ? "Team Reminders" : "Reminders & Tasks";

  // Leads to show in panel (max 5)
  const leadsToShow = newLeads.slice(0, 5);

  // ── Reminder checklist state ─────────────────────────────────────────────────
  const [doneReminders, setDoneReminders] = useState({});
  const toggleReminder = id => setDoneReminders(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div style={{ flex: 1, overflowY: "auto", fontFamily: "Inter, system-ui, sans-serif" }}>
      <div style={{ padding: "0 28px 48px" }}>

        {/* ── Page header ─────────────────────────────────────────────────── */}
        <div style={{ padding: "28px 0 24px" }}>
          <h1 style={{ fontSize: 32, fontWeight: 400, letterSpacing: "-0.025em", color: C.text, margin: 0 }}>
            {greeting}, {user.firstName}<span style={{ color: C.primary }}>.</span>
          </h1>
          <div style={{ marginTop: 6, fontSize: 12, color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            {roleLabel} · {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </div>
        </div>

        {/* ── KPI row ─────────────────────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
          <KpiCard
            label={contactsLabel}
            value={totalContacts}
            sub={isGP ? "assigned to me" : isVD ? "in my team" : "in CRM"}
            color={C.navy}
          />
          <KpiCard
            label="New Leads"
            value={newLeads.length}
            sub={
              isGP
                ? "open & assigned to me"
                : unassignedCount > 0
                  ? `${unassignedCount} unassigned`
                  : "all assigned"
            }
            color={C.primary}
            warn={!isGP && unassignedCount > 0}
          />
          <KpiCard
            label="Appointments Today"
            value={todayAppts.length}
            sub={isGP ? "my schedule" : isVD ? "team schedule" : "org-wide"}
            color={C.indigo}
          />
          <KpiCard
            label="Open Reminders"
            value={openReminders.length}
            sub="pending tasks"
            color={openReminders.length > 0 ? C.amber : C.green}
          />
        </div>

        {/* ── Main two-column layout ───────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 16, marginBottom: 16 }}>

          {/* ── New Leads panel ───────────────────────────────────────────── */}
          <Card>
            <CardHeader
              title={leadsTitle}
              action={<LinkBtn label="All Contacts →" onClick={() => navigateTo("Leads")} />}
            />
            <div style={{ padding: "4px 20px 16px" }}>
              {/* VD/SA: unassigned warning banner */}
              {!isGP && unassignedCount > 0 && (
                <div style={{
                  margin: "8px 0 10px",
                  padding: "8px 12px", borderRadius: 8,
                  background: C.red + "08", border: `1px solid ${C.red}30`,
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  <span style={{ fontSize: 13 }}>⚠️</span>
                  <span style={{ fontSize: 12, color: C.red, fontWeight: 600 }}>
                    {unassignedCount} lead{unassignedCount > 1 ? "s" : ""} not yet assigned to a consultant
                  </span>
                </div>
              )}

              {leadsToShow.length === 0 ? (
                <div style={{ padding: "24px 0", textAlign: "center", color: C.muted, fontSize: 13 }}>
                  {isGP ? "No new leads assigned to you." : "No new leads right now."}
                </div>
              ) : leadsToShow.map((lead, i) => (
                <div key={lead.id} style={{
                  display: "grid",
                  gridTemplateColumns: "36px 1fr auto auto",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 0",
                  borderBottom: i < leadsToShow.length - 1 ? `1px solid ${C.border}` : "none",
                }}>
                  <Avatar name={lead.name} size={36} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: C.text }}>{lead.name}</div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                      {lead.city} · {lead.source} · {lead.created}
                      {/* VD/SA: show who it's assigned to (or flag as unassigned) */}
                      {!isGP && (
                        <span style={{
                          marginLeft: 6,
                          color: lead.assignedGP ? C.muted : C.red,
                          fontWeight: lead.assignedGP ? 400 : 600,
                        }}>
                          · {lead.assignedGP ? `→ ${lead.assignedGP}` : "⚠ unassigned"}
                        </span>
                      )}
                    </div>
                  </div>
                  <StatusPill status={lead.status} />
                  <button
                    onClick={() => navigateTo("Leads")}
                    style={{
                      padding: "4px 10px", background: C.primary, color: "#fff",
                      border: "none", borderRadius: 6, fontSize: 10, fontFamily: "monospace",
                      letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer",
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
            <div style={{ padding: "4px 20px 16px", display: "flex", flexDirection: "column", gap: 4 }}>
              {openReminders.length === 0 ? (
                <div style={{ padding: "24px 0", textAlign: "center", color: C.muted, fontSize: 13 }}>
                  No open reminders.
                </div>
              ) : openReminders.slice(0, 6).map((rem) => {
                const done = !!doneReminders[rem.id];
                return (
                  <div
                    key={rem.id}
                    onClick={() => toggleReminder(rem.id)}
                    style={{
                      display: "flex", alignItems: "flex-start", gap: 10,
                      padding: "10px 10px", borderRadius: 9, cursor: "pointer",
                      border: `1px solid ${done ? C.green + "40" : C.border}`,
                      background: done ? C.green + "06" : "#F8FAFC",
                      marginBottom: 6,
                    }}
                  >
                    <div style={{
                      width: 17, height: 17, borderRadius: 4, marginTop: 1,
                      border: `1.5px solid ${done ? C.green : C.muted}`,
                      background: done ? C.green : "transparent",
                      display: "grid", placeItems: "center",
                      fontSize: 9, color: "#fff", flexShrink: 0,
                    }}>
                      {done ? "✓" : ""}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 13, color: done ? C.muted : C.text,
                        textDecoration: done ? "line-through" : "none", lineHeight: 1.3,
                      }}>
                        {rem.title}
                      </div>
                      <div style={{ fontSize: 10, color: C.muted, marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
                        <PriorityDot priority={rem.priority} />
                        {rem.time} · {rem.date}
                        {rem.lead && <> · {rem.lead}</>}
                        {/* VD/SA: show which GP the reminder belongs to */}
                        {!isGP && rem.gp && <> · <span style={{ color: C.slate }}>{rem.gp}</span></>}
                      </div>
                    </div>
                    <span style={{ fontSize: 14 }}>{TYPE_ICON[rem.type] || "🔔"}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* ── Today's Appointments ─────────────────────────────────────────── */}
        {todayAppts.length > 0 && (
          <Card style={{ marginBottom: 16 }}>
            <CardHeader
              title={isGP ? "My Appointments Today" : isVD ? "Team Appointments Today" : "Appointments Today"}
              action={<LinkBtn label="Calendar →" onClick={() => navigateTo("Calendar")} />}
            />
            <div style={{ padding: "4px 20px 16px", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {todayAppts.map((appt) => {
                const typeColor = { call: C.green, video: C.indigo, inperson: C.amber, email: C.blue }[appt.type] || C.muted;
                const statusColor = { upcoming: C.blue, confirmed: C.green, done: C.muted, noshow: C.red }[appt.status] || C.muted;
                return (
                  <div key={appt.id} style={{
                    padding: "12px 14px", borderRadius: 10,
                    border: `1px solid ${typeColor}30`,
                    background: typeColor + "06",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 16 }}>{TYPE_ICON[appt.type] || "📅"}</span>
                      <div style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 600, color: typeColor }}>
                        {appt.start}
                      </div>
                      <span style={{
                        marginLeft: "auto", fontSize: 9, fontFamily: "monospace", padding: "2px 6px",
                        borderRadius: 20, fontWeight: 700, background: statusColor + "18", color: statusColor,
                      }}>
                        {appt.status}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{appt.lead}</div>
                    {/* VD/SA: show which consultant owns the appointment */}
                    {!isGP && (
                      <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{appt.gp}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* ── Recent Activity ──────────────────────────────────────────────── */}
        <Card>
          <CardHeader
            title={isGP ? "My Recent Activity" : isVD ? "Team Recent Activity" : "Recent Activity"}
            action={<LinkBtn label="All Activity →" onClick={() => navigateTo("Calendar")} />}
          />
          <div style={{ padding: "4px 20px 16px" }}>
            {recentActivity.length === 0 ? (
              <div style={{ padding: "24px 0", textAlign: "center", color: C.muted, fontSize: 13 }}>
                No recent activity.
              </div>
            ) : recentActivity.map((act, i) => {
              const iconBg = { call: C.green, video: C.indigo, email: C.amber, inperson: C.blue, note: C.purple }[act.type] || C.muted;
              return (
                <div key={act.id} style={{
                  display: "flex", gap: 12, alignItems: "flex-start",
                  padding: "10px 0",
                  borderBottom: i < recentActivity.length - 1 ? `1px solid ${C.border}` : "none",
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%",
                    background: iconBg + "18", display: "grid", placeItems: "center",
                    fontSize: 14, flexShrink: 0,
                  }}>
                    {TYPE_ICON[act.type] || "📋"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{act.title}</div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                      {/* VD/SA: show GP name in activity feed */}
                      {!isGP && act.gp && <>{act.gp} · </>}
                      {act.date} {act.time}
                    </div>
                  </div>
                  <span style={{
                    fontSize: 9, fontFamily: "monospace", padding: "2px 7px",
                    borderRadius: 20, flexShrink: 0, marginTop: 2,
                    background: C.muted + "18", color: C.muted, fontWeight: 600,
                    textTransform: "capitalize",
                  }}>
                    {act.status}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

      </div>
    </div>
  );
};

export default DashboardPage;
