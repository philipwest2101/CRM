import React, { useState } from "react";
import { C } from "../../theme";
import { PRIORITY_META, DONE_STATUSES } from "../../lib/core";

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
  const leadsTitle    = isGP ? "My New Contacts" : isVD ? "Team New Contacts" : "New Contacts";
  const contactsLabel = isGP ? "My Contacts" : isVD ? "Team Contacts" : "Total Contacts";
  const remindersTitle = isGP ? "My Tasks" : isVD ? "Team Tasks" : "Reminders & Tasks";
  const apptsTitle    = isGP ? "My Appointments Today" : isVD ? "Team Appointments Today" : "Appointments Today";

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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 14 }}>
          <KpiCard
            label={contactsLabel}
            value={totalContacts}
            sub={isGP ? "assigned to me" : isVD ? "in my team" : "in CRM"}
            color={C.navy}
          />
          <KpiCard
            label="New Contacts"
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
            label="Open Tasks"
            value={openTasks.length}
            sub="reminders & to-dos"
            color={openTasks.length > 0 ? C.amber : C.green}
          />
        </div>

        {/* ── Top row: New Contacts | Reminders & Tasks | Appointments Today ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1.25fr 1fr 1fr", gap: 14, marginBottom: 14, alignItems: "start" }}>

          {/* ── New Contacts panel ───────────────────────────────────────────── */}
          <Card>
            <CardHeader
              title={leadsTitle}
              action={<LinkBtn label="All Contacts →" onClick={() => navigateTo("Leads")} />}
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
                  No open tasks.
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
