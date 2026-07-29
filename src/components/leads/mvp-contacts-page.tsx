import React, { useState, useMemo, useRef } from "react";
import { ALL_LEADS, feedbackStatusLabel, getLeadState, getCallAttempts, NETWORK_OUTCOMES, networkOutcomeLabel } from "../../lib/core";
import { C } from "../../theme";
import { useT } from "../../lib/i18n";

// Hover tooltip — shows on hover next to view name or field label
const InfoTip = ({ text }) => {
  const [show, setShow] = React.useState(false);
  return (
    <span style={{ position: "relative", display: "inline-flex", marginLeft: 4 }}
      onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      <span style={{ fontSize: 11, color: C.muted, cursor: "help" }}>ⓘ</span>
      {show && (
        <div style={{ position: "absolute", bottom: "calc(100% + 5px)", left: "50%", transform: "translateX(-50%)", background: C.navy, color: "#fff", fontSize: 11, lineHeight: 1.4, padding: "8px 12px", borderRadius: 8, whiteSpace: "normal", wordBreak: "normal", width: 220, zIndex: 999, boxShadow: "0 4px 16px rgba(0,0,0,0.2)", pointerEvents: "none" }}>
          {text}
        </div>
      )}
    </span>
  );
};

// VIEW_TIPS is computed inside ViewSelector (after useT()) to support i18n.

// ─────────────────────────────────────────────────────────────────────────────
// MVP CONTACTS PAGE
// Import-first Contact List (the MVP counterpart to the rich "Full" view):
//  · multi-view selector with per-view column configuration (Edit View)
//  · sortable/filterable, column-driven table
//  · multi-step Import wizard
//  · full tabbed Add Contact page
// ─────────────────────────────────────────────────────────────────────────────

// ── status → Stage Status mapping ────────────────────────────────────────────
// Per the "Network vs. Lead" business rules, Lifecycle is a two-value field
// (Lead → Network, one-directional) and is INDEPENDENT of Stage Status, which
// tracks progress *within* the lifecycle. `closed` records represent Leads that
// completed the process and were converted to (always User-owned) Network
// contacts.
const STAGE_STATUS = {
  open:          { status: "New",            tone: C.green },
  in_progress:   { status: "In Contact",     tone: C.slate },
  first_contact: { status: "In Contact",     tone: C.slate },
  attempted:     { status: "In Contact",     tone: C.slate },
  connected:     { status: "In Contact",     tone: C.green },
  not_reached:   { status: "Not Reached",    tone: C.red   },
  followup:      { status: "Follow Up",      tone: C.slate },
  appointment:   { status: "Appointment",    tone: C.green },
  appt_completed:{ status: "Appointment",    tone: C.green },
  no_show:       { status: "Appointment",    tone: C.amber },
  qualified:     { status: "Qualified",      tone: C.green },
  closed:        { status: "Closed",         tone: C.green },   // converted → Network
  no_interest:   { status: "Not Interested", tone: null    },
  dnc:           { status: "Do Not Contact", tone: null    },
};

// A seeded contact becomes a Network once it has completed the process.
const isNetworkStatus = (status) => status === "closed";

// Lifecycle is strictly Lead → Network and is system-managed: it powers the
// My Network vs. My Leads views and Convert, but is never shown or set in the UI.
// Ownership is Company or User; Network is always User-owned and excluded from
// company reporting.
const OWNERSHIP_OPTIONS  = ["Company", "User"];
// Lead Status vocabulary is system-defined (not configurable). A Network member
// has no stage status — it carries an Outcome (Customer / Partner, both may
// apply) instead, chosen via checkboxes.
const LEAD_STATUSES    = ["New", "In Contact", "Appointment", "Follow Up", "Qualified", "Closed", "Not Interested", "Not Reached", "Do Not Contact"];
const STATUS_OPTIONS   = [...LEAD_STATUSES, ...NETWORK_OUTCOMES];

// deterministic DOB from id so the column has plausible values
const synthDob = (id) => {
  let h = 0; for (const ch of String(id)) h = (h * 31 + ch.charCodeAt(0)) & 0xffff;
  const y = 1960 + (h % 45), m = 1 + (h % 12), d = 1 + (h % 28);
  return `${y}/${String(m).padStart(2, "0")}/${String(d).padStart(2, "0")}`;
};

const GENDERS = ["Male", "Female", "Other"];
const NATIONALITIES = ["German", "Austrian", "Swiss", "French", "Italian", "Spanish", "Polish", "Czech"];

const synthGender = (id) => {
  let h = 0; for (const ch of String(id)) h = (h * 17 + ch.charCodeAt(0)) & 0xffff;
  return GENDERS[h % GENDERS.length];
};

const synthNationality = (id) => {
  let h = 0; for (const ch of String(id)) h = (h * 23 + ch.charCodeAt(0)) & 0xffff;
  return NATIONALITIES[h % NATIONALITIES.length];
};

const toContact = (l) => {
  const [first, ...rest] = l.name.split(" ");
  const last = rest.join(" ");
  const ss = STAGE_STATUS[l.status] || STAGE_STATUS.no_interest;
  // A lead converted at runtime (in Processing & Feedback) is promoted to Network
  // here so it drops out of the Leads views and appears in My Network.
  const override = getLeadState(l.id);
  const network = isNetworkStatus(l.status) || override.lifecycle === "Network";
  // Network members carry an Outcome (Customer / Partner, both possible; empty =
  // plain Contact) rather than a stage status.
  const outcome = network ? (Array.isArray(override.outcome) ? override.outcome : (l.status === "closed" ? ["Customer"] : [])) : [];
  const stageStatus = network ? networkOutcomeLabel(outcome) : ss.status;
  const tone = network ? (outcome.includes("Customer") ? C.green : outcome.includes("Partner") ? C.indigo : C.slate) : ss.tone;
  // Network is always User-owned; seeded pipeline Leads are Company-owned so they
  // surface in company reporting and the Unassigned/Assigned views.
  const ownership = network ? "User" : "Company";
  return {
    id: l.id, first, last, firstName: first, lastName: last, name: l.name,
    lifecycle: network ? "Network" : "Lead", stageStatus, outcome, tone,
    // A pipeline lead that reached Network (closed, or converted at runtime) was a
    // lead before → it gets the read-only "Lead Journey" tab in the contact view.
    wasLead: network,
    ownership, isCompanyOwned: ownership === "Company",
    phone: l.phone, email: l.email, primaryEmail: l.email,
    // Feedback & Processing shows the Processing value + a live call counter (§10).
    feedback: `${feedbackStatusLabel(l.status)}${getCallAttempts(l) > 0 ? ` · ${getCallAttempts(l)} call${getCallAttempts(l) !== 1 ? "s" : ""}` : ""}`,
    // Next Action column: the primary open task + its due date (§10 new field).
    nextAction: network ? "—" : (l.nextAction && l.nextAction !== "No open action"
      ? `${l.nextAction}${(l.nextActionDue || l.nextActionDueDate) ? ` · ${l.nextActionDue || l.nextActionDueDate}` : ""}`
      : "—"),
    lastActivity: l.created || "—",
    campaign: l.campaign || "—",
    dob: synthDob(l.id),
    gender: synthGender(l.id),
    nationality: synthNationality(l.id),
    website: l.website || "—",
    assignee: l.assignedGP || "Unassigned",
    create: l.created || "—",
    registration: l.registration || "—",
    linkedin: l.linkedin || "—",
    accountSource: l.source || "—",
    assigned: !!l.assignedGP,
    gdpr: l.consent === false,   // GDPR consent still pending
  };
};

// A handful of User-owned Network contacts so the "My Network" view (user-owned
// Network contacts assigned to the current user) is populated for the demo. The
// current advisor is "Anna Klein" (GP) or "Thomas Müller" (VD).
// A Network member's Outcome is any combination of Customer / Partner (both may
// apply). An empty set = a plain Network contact (the former "Prospect" seeds,
// which no longer have a stage status).
// `wasLead` records how the Network member arrived: true = converted from a Lead
// (their pre-Network history is shown on the read-only "Lead Journey" tab), false
// = created directly by a user (they never were a lead, so they get the editable
// "Overview" tab instead). Both keep Activities / Documents / Information.
const NETWORK_SEED = [
  { id: "NW-1", name: "Michael Braun",  phone: "+43 660 1234567", email: "m.braun@email.at",   assignee: "Anna Klein",    outcome: ["Customer"],            wasLead: true  },
  { id: "NW-2", name: "Sabine Hofer",   phone: "+43 664 2345678", email: "s.hofer@email.at",   assignee: "Anna Klein",    outcome: ["Partner"],             wasLead: false },
  { id: "NW-3", name: "Georg Steiner",  phone: "+43 699 3456789", email: "g.steiner@email.at", assignee: "Anna Klein",    outcome: ["Customer", "Partner"], wasLead: true  },
  { id: "NW-4", name: "Petra Wagner",   phone: "+43 650 4567890", email: "p.wagner@email.at",  assignee: "Thomas Müller", outcome: ["Customer"],            wasLead: true  },
  { id: "NW-5", name: "Klaus Berger",   phone: "+43 676 5678901", email: "k.berger@email.at",  assignee: "Thomas Müller", outcome: [],                      wasLead: false },
].map(n => {
  const [first, ...rest] = n.name.split(" ");
  const last = rest.join(" ");
  return {
    ...n, first, last, firstName: first, lastName: last, stageStatus: networkOutcomeLabel(n.outcome),
    primaryEmail: n.email, lifecycle: "Network", ownership: "User", isCompanyOwned: false,
    tone: n.outcome.includes("Customer") ? C.green : n.outcome.includes("Partner") ? C.indigo : C.slate,
    feedback: "—", campaign: "—", dob: synthDob(n.id), gender: synthGender(n.id),
    nationality: synthNationality(n.id), website: "—", create: "—", registration: "—",
    linkedin: "—", accountSource: "Referral", lastActivity: "2026-07-10", assigned: true, gdpr: false,
  };
});

// ── column registry ───────────────────────────────────────────────────────────
// filter: "text" | "lifecycle" | "status" | null   ·   locked columns are always
// present in every view and cannot be removed in the Edit View dialog.
const COLUMNS = {
  name:          { label: "Name",                locked: true,  filter: "text",      group: "Main Information" },
  firstName:     { label: "First Name",          locked: false, filter: "text",      group: "Main Information" },
  lastName:      { label: "Last Name",           locked: false, filter: "text",      group: "Main Information" },
  primaryEmail:  { label: "Primary Email",       locked: false, filter: "text",      group: "Main Information" },
  campaign:      { label: "Campaign",            locked: false, filter: "text",      group: "Main Information" },
  dob:           { label: "Date of Birth",       locked: false, filter: "date",      group: "Main Information" },
  email:         { label: "Email",               locked: false, filter: "text",      group: "Main Information" },
  phone:         { label: "Primary Phone",        locked: false, filter: "text",      group: "Main Information" },
  gender:        { label: "Gender",              locked: false, filter: "text",      group: "Main Information" },
  nationality:   { label: "Nationality",         locked: false, filter: "text",      group: "Main Information" },
  website:       { label: "Website",             locked: false, filter: null,        group: "Main Information" },
  assignee:      { label: "Assignee",            locked: false, filter: null,        group: "Main Information" },
  ownership:     { label: "Ownership",           locked: false, filter: "ownership", group: "Main Information" },
  stageStatus:   { label: "Status",              locked: false, filter: "status",    group: "Main Information" },
  outcomeType:   { label: "Type",                locked: false, filter: null,        group: "Main Information" },
  feedback:      { label: "Feedback & Processing",locked: false, filter: "text",      group: "Main Information" },
  nextAction:    { label: "Next Action",         locked: false, filter: "text",      group: "Main Information" },
  lastActivity:  { label: "Last Activity",       locked: false, filter: null,        group: "Main Information" },
  create:        { label: "Create Date",         locked: false, filter: null,        group: "Main Information" },
  registration:  { label: "Registration Number", locked: false, filter: null,        group: "Main Information" },
  linkedin:      { label: "LinkedIn",            locked: false, filter: null,        group: "Main Information" },
  accountSource: { label: "Source",              locked: false, filter: null,        group: "Main Information" },
};
const COLUMN_KEYS = Object.keys(COLUMNS);
const DEFAULT_COLS = ["name", "primaryEmail", "phone", "dob", "gender", "nationality"];
const LINK_COL = "name";   // frozen Name column links to contact detail

// View filters follow the "System Views" scenario matrix. Ownership + assignee
// decide visibility, so the filters are built for the current user.
const makeViewFilters = (me: string) => ({
  all:      () => true,
  // My Network: user-owned Network contacts assigned to the current user.
  my:       (c) => c.lifecycle === "Network" && c.ownership === "User" && c.assignee === me,
  // My Leads: Leads assigned to the current user.
  myleads:  (c) => c.lifecycle === "Lead" && c.assignee === me,
  // Unassigned / Pending: Company Leads with no active assignee.
  pending:  (c) => c.lifecycle === "Lead" && c.isCompanyOwned && !c.assigned,
  // Assigned Leads: Company Leads assigned to an active user.
  assigned: (c) => c.lifecycle === "Lead" && c.isCompanyOwned && c.assigned,
  custom1:  (c) => c.lifecycle === "Lead",
  custom2:  (c) => c.lifecycle === "Network",
});

const fieldStyle = {
  width: "100%", padding: "9px 12px", borderRadius: 8,
  border: `1px solid ${C.border}`, fontSize: 13, fontFamily: "inherit",
  color: C.text, boxSizing: "border-box", outline: "none", background: "#fff",
};

const Label = ({ children }) => (
  <label style={{ fontSize: 13, fontWeight: 600, color: C.navy, display: "block", marginBottom: 6 }}>{children}</label>
);

const StagePill = ({ label, tone }) => {
  if (!tone) return <span style={{ fontSize: 13, color: C.muted }}>{label}</span>;
  return (
    <span style={{ display: "inline-block", padding: "3px 12px", borderRadius: 16, fontSize: 12, fontWeight: 600, background: tone + "1A", color: tone }}>
      {label}
    </span>
  );
};

// Network Outcome badges — one pill per role (Customer / Partner). A person may
// be both; an empty set renders a neutral "Contact" chip.
const OUTCOME_TONE = { Customer: C.green, Partner: C.indigo };
const OutcomeBadges = ({ outcome }) => {
  const set = Array.isArray(outcome) ? outcome : [];
  if (set.length === 0) return <span style={{ display: "inline-block", padding: "3px 12px", borderRadius: 16, fontSize: 12, fontWeight: 600, background: C.light, color: C.muted }}>Contact</span>;
  return (
    <span style={{ display: "inline-flex", gap: 6, flexWrap: "wrap" }}>
      {set.map(o => <span key={o} style={{ display: "inline-block", padding: "3px 12px", borderRadius: 16, fontSize: 12, fontWeight: 600, background: (OUTCOME_TONE[o] || C.slate) + "1A", color: OUTCOME_TONE[o] || C.slate }}>{o}</span>)}
    </span>
  );
};

const renderCell = (key, c, isLink?: boolean) => {
  if (key === "name" || key === LINK_COL) return <span style={{ fontSize: 13, fontWeight: 500, color: C.navy, textDecoration: isLink ? "underline" : "none", textUnderlineOffset: 2 }}>{c[key]}</span>;
  if (key === "ownership")   return <span style={{ fontSize: 13, color: c.ownership === "Company" ? C.text : C.slate }}>{c.ownership}</span>;
  if (key === "stageStatus") return <StagePill label={c.stageStatus} tone={c.tone} />;
  if (key === "outcomeType") return <OutcomeBadges outcome={c.outcome} />;
  return <span style={{ fontSize: 13, color: C.slate }}>{c[key] ?? "—"}</span>;
};

const IconBtn = ({ title, onClick, active, children }) => {
  const [show, setShow] = useState(false);
  return (
    <span style={{ position: "relative", display: "inline-flex" }}
      onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      <button title={title} onClick={onClick} style={{
        width: 34, height: 34, borderRadius: 8, border: `1px solid ${C.border}`,
        background: active ? C.primarySoft : "#fff", color: active ? C.primaryDark : C.slate,
        cursor: "pointer", display: "grid", placeItems: "center", fontSize: 15,
      }}>{children}</button>
      {show && title && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)", background: C.navy, color: "#fff", fontSize: 11, lineHeight: 1.4, padding: "6px 10px", borderRadius: 8, whiteSpace: "nowrap", zIndex: 999, boxShadow: "0 4px 16px rgba(0,0,0,0.2)", pointerEvents: "none" }}>
          {title}
        </div>
      )}
    </span>
  );
};

const SortArrows = () => (
  <span style={{ display: "inline-flex", flexDirection: "column", lineHeight: 0.6, fontSize: 9, color: C.muted }}>
    <span>▲</span><span>▼</span>
  </span>
);

// ─────────────────────────────────────────────────────────────────────────────
// VIEW SELECTOR (dropdown)
// ─────────────────────────────────────────────────────────────────────────────
const ViewSelector = ({ views, activeId, counts, onSelect, onAddView, role }) => {
  const t = useT();
  const VIEW_TIPS = {
    my:       t("tooltip_myNetwork"),
    pending:  t("tooltip_unassignedLeads"),
    myleads:  t("tooltip_myLeads"),
    assigned: role === "vd" ? t("tooltip_assignedLeadsVD") : t("tooltip_assignedLeadsSA"),
    pendingA: t("tooltip_pendingAssignments"),
  };
  const [open, setOpen] = useState(false);
  const active = views.find(v => v.id === activeId);
  const systemViews = views.filter(v => v.system);
  const customViews = views.filter(v => !v.system);
  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => setOpen(o => !o)} style={{
        display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", borderRadius: 8,
        border: `1px solid ${open ? C.primary : C.border}`, background: "#fff", cursor: "pointer", fontFamily: "inherit",
      }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: C.primaryDark }}>{active?.name}</span>
        <span style={{ fontSize: 13, color: C.muted }}>({counts[active?.id] ?? 0})</span>
        <span style={{ fontSize: 10, color: C.slate, transform: open ? "rotate(180deg)" : "none" }}>▾</span>
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 250 }} />
          <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 260, background: "#fff", borderRadius: 12, boxShadow: "0 12px 36px rgba(0,0,0,0.16)", border: `1px solid ${C.border}`, minWidth: 240, padding: "6px 0" }}>
            {/* System views */}
            <div style={{ padding: "4px 16px 4px", fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>{t("systemViews")}</div>
            {systemViews.map(v => (
              <div key={v.id} onClick={() => { onSelect(v.id); setOpen(false); }}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 16px", cursor: "pointer", fontSize: 14, fontWeight: v.id === activeId ? 700 : 500, color: v.id === activeId ? C.primaryDark : C.text }}
                onMouseEnter={e => e.currentTarget.style.background = "#F8FAFC"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <span style={{ display: "flex", alignItems: "center" }}>{v.name}{VIEW_TIPS[v.id] && <InfoTip text={VIEW_TIPS[v.id]} />}</span>
                <span style={{ color: C.muted, fontWeight: 500 }}>({counts[v.id] ?? 0})</span>
              </div>
            ))}
            {/* Custom views */}
            {customViews.length > 0 && (
              <>
                <div style={{ borderTop: `1px solid ${C.border}`, margin: "4px 0" }} />
                <div style={{ padding: "4px 16px 4px", fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>{t("customViews")}</div>
                {customViews.map(v => (
                  <div key={v.id} onClick={() => { onSelect(v.id); setOpen(false); }}
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 16px", cursor: "pointer", fontSize: 14, fontWeight: v.id === activeId ? 700 : 500, color: v.id === activeId ? C.primaryDark : C.text }}
                    onMouseEnter={e => e.currentTarget.style.background = "#F8FAFC"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <span>{v.name}</span>
                    <span style={{ color: C.muted, fontWeight: 500 }}>({counts[v.id] ?? 0})</span>
                  </div>
                ))}
              </>
            )}
            {/* Add view */}
            <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 4 }}>
              <div onClick={() => { onAddView(); setOpen(false); }}
                style={{ display: "flex", alignItems: "center", gap: 7, padding: "11px 16px", cursor: "pointer", fontSize: 13, fontWeight: 700, color: C.primary }}
                onMouseEnter={e => e.currentTarget.style.background = "#F8FAFC"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                {t("addView")}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// EDIT VIEW (column picker)
// ─────────────────────────────────────────────────────────────────────────────
const EditViewModal = ({ view, onClose, onApply }) => {
  const [name, setName]         = useState(view.name);
  const [selected, setSelected] = useState(view.columns);          // ordered keys
  const [availChecked, setAvailChecked] = useState(() => new Set());
  const [selChecked, setSelChecked]     = useState(() => new Set());
  const [availSearch, setAvailSearch]   = useState("");
  const [selSearch, setSelSearch]       = useState("");

  const selSet = new Set(selected);

  const toggleAvail = (key) => setAvailChecked(prev => {
    const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n;
  });
  const toggleSel = (key) => setSelChecked(prev => {
    const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n;
  });

  const moveRight = () => {                       // available → selected
    const add = [...availChecked].filter(k => !selSet.has(k));
    if (!add.length) return;
    setSelected(prev => [...prev, ...add]);
    setAvailChecked(new Set());
  };
  const moveLeft = () => {                         // selected → available (non-locked)
    const rm = [...selChecked].filter(k => !COLUMNS[k].locked);
    if (!rm.length) return;
    setSelected(prev => prev.filter(k => !rm.includes(k)));
    setSelChecked(new Set());
  };
  const removeOne = (key) => { if (!COLUMNS[key].locked) setSelected(prev => prev.filter(k => k !== key)); };
  const reorder = (dir) => {                       // move checked selected up/down by one
    const idxs = selected.map((k, i) => selChecked.has(k) ? i : -1).filter(i => i >= 0);
    if (!idxs.length) return;
    const arr = [...selected];
    if (dir === "up") {
      idxs.forEach(i => { if (i > 0) { [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]; } });
    } else {
      idxs.reverse().forEach(i => { if (i < arr.length - 1) { [arr[i + 1], arr[i]] = [arr[i], arr[i + 1]]; } });
    }
    setSelected(arr);
  };

  const availList = COLUMN_KEYS.filter(k => COLUMNS[k].label.toLowerCase().includes(availSearch.toLowerCase()));
  const selList   = selected.filter(k => COLUMNS[k].label.toLowerCase().includes(selSearch.toLowerCase()));

  const Panel = ({ children }) => (
    <div style={{ flex: 1, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 16px 12px", minWidth: 0 }}>{children}</div>
  );
  const SearchBox = ({ value, onChange }) => (
    <div style={{ position: "relative", marginBottom: 12 }}>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder="Search"
        style={{ ...fieldStyle, paddingRight: 32 }} />
      <span style={{ position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)", color: C.muted, fontSize: 13 }}>🔍</span>
    </div>
  );

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", zIndex: 400 }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 840, maxWidth: "94vw", background: "#fff", borderRadius: 16, zIndex: 500, boxShadow: "0 24px 64px rgba(0,0,0,0.22)", padding: "24px 28px", fontFamily: "inherit", maxHeight: "92vh", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: C.navy }}>Edit View</div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, color: C.muted, lineHeight: 1 }}>×</button>
        </div>

        <div style={{ marginBottom: 18 }}>
          <label style={{ fontSize: 13, color: C.slate, display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>Name * <span title="Shown in the view selector" style={{ color: C.muted }}>ⓘ</span></label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="View name" style={{ ...fieldStyle, maxWidth: 360, background: C.light }} />
        </div>

        <div style={{ display: "flex", gap: 16, alignItems: "stretch" }}>
          {/* Available */}
          <Panel>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.navy, marginBottom: 12 }}>Available Columns</div>
            <SearchBox value={availSearch} onChange={setAvailSearch} />
            <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 12px", maxHeight: 230, overflowY: "auto" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13, fontWeight: 700, color: C.navy, marginBottom: 6 }}>
                Main Information <span style={{ color: C.muted }}>▲</span>
              </div>
              {availList.map(k => {
                const isSel = selSet.has(k);
                return (
                  <label key={k} style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 2px", cursor: isSel ? "default" : "pointer", opacity: isSel ? 0.45 : 1 }}>
                    <input type="checkbox" disabled={isSel} checked={isSel || availChecked.has(k)} onChange={() => toggleAvail(k)} style={{ width: 15, height: 15, accentColor: C.primary }} />
                    <span style={{ fontSize: 13, color: C.text }}>{COLUMNS[k].label}</span>
                  </label>
                );
              })}
            </div>
          </Panel>

          {/* Move buttons */}
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 12 }}>
            <button onClick={moveRight} title="Add to view" style={{ width: 40, height: 40, borderRadius: 9, border: `1px solid ${C.border}`, background: "#fff", cursor: "pointer", fontSize: 16, color: C.slate }}>›</button>
            <button onClick={moveLeft} title="Remove from view" style={{ width: 40, height: 40, borderRadius: 9, border: `1px solid ${C.border}`, background: "#fff", cursor: "pointer", fontSize: 16, color: C.slate }}>‹</button>
          </div>

          {/* Selected */}
          <Panel>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.navy }}>Selected Columns</div>
              <span style={{ fontSize: 14, fontWeight: 700, color: C.slate }}>{selected.length}</span>
            </div>
            <SearchBox value={selSearch} onChange={setSelSearch} />
            <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, padding: "6px 8px", maxHeight: 230, overflowY: "auto" }}>
              {selList.map(k => (
                <div key={k} style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 4px" }}>
                  <input type="checkbox" disabled={COLUMNS[k].locked} checked={selChecked.has(k)} onChange={() => toggleSel(k)} style={{ width: 15, height: 15, accentColor: C.primary }} />
                  <span style={{ flex: 1, fontSize: 13, color: COLUMNS[k].locked ? C.muted : C.text }}>{COLUMNS[k].label}</span>
                  {!COLUMNS[k].locked && (
                    <button onClick={() => removeOne(k)} title="Remove" style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, fontSize: 15 }}>×</button>
                  )}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 10 }}>
              <button onClick={() => reorder("up")} title="Move up" style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${C.border}`, background: "#fff", cursor: "pointer", color: C.slate }}>↑</button>
              <button onClick={() => reorder("down")} title="Move down" style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${C.border}`, background: "#fff", cursor: "pointer", color: C.slate }}>↓</button>
            </div>
          </Panel>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 22 }}>
          <button onClick={onClose} style={{ padding: "9px 22px", borderRadius: 9, border: "none", background: "transparent", color: C.slate, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
          <button disabled={!name.trim()} onClick={() => onApply({ ...view, name: name.trim(), columns: selected })}
            style={{ padding: "9px 28px", borderRadius: 9, border: "none", background: name.trim() ? C.primary : C.border, color: name.trim() ? "#fff" : C.muted, fontSize: 13, fontWeight: 700, cursor: name.trim() ? "pointer" : "default" }}>Apply</button>
        </div>
      </div>
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// IMPORT WIZARD
// ─────────────────────────────────────────────────────────────────────────────
export const ImportContactsModal = ({ onClose, role, importType = "Lead" }) => {
  const [step, setStep]       = useState("source");
  const [progress, setProgress] = useState(0);
  // The Lead-vs-Network choice is made at the Import button (SA imports Leads
  // only). All rows take this Lifecycle; Ownership, Assignee, Source and Stage
  // Status are system-set from role + type.
  const timerRef = useRef(null);

  const runImport = () => {
    setStep("importing"); setProgress(0);
    timerRef.current = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { clearInterval(timerRef.current); setStep("done"); return 100; }
        return p + 8;
      });
    }, 120);
  };
  React.useEffect(() => () => clearInterval(timerRef.current), []);

  const Overlay = ({ children, width = 520 }) => (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", zIndex: 400 }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width, maxWidth: "92vw", background: "#fff", borderRadius: 16, zIndex: 500, boxShadow: "0 24px 64px rgba(0,0,0,0.22)", fontFamily: "inherit", padding: "22px 24px", maxHeight: "90vh", overflowY: "auto" }}>
        {children}
      </div>
    </>
  );
  const Header = ({ title, back }) => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {back && <button onClick={back} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: C.slate, lineHeight: 1 }}>←</button>}
        <div style={{ fontSize: 17, fontWeight: 700, color: C.navy }}>{title}</div>
      </div>
      <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: C.muted, lineHeight: 1 }}>×</button>
    </div>
  );

  if (step === "source") {
    const SourceCard = ({ icon, title, sub, hint, onClick }) => (
      <button onClick={onClick} style={{ flex: 1, background: C.light, border: `1px solid ${C.border}`, borderRadius: 12, padding: "26px 18px", cursor: "pointer", textAlign: "center", fontFamily: "inherit", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}
        onMouseEnter={e => e.currentTarget.style.borderColor = C.primary}
        onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
        <div style={{ fontSize: 34 }}>{icon}</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: C.navy }}>{title}</div>
        <div style={{ fontSize: 12, color: C.slate }}>{sub}</div>
        <div style={{ fontSize: 11, color: C.muted }}>{hint}</div>
      </button>
    );
    return (
      <Overlay width={560}>
        <Header title={`Import ${importType}s`} />
        <div style={{ fontSize: 13, color: C.slate, marginBottom: 14 }}>Choose a source</div>
        <div style={{ display: "flex", gap: 16 }}>
          <SourceCard icon="📗" title="Excel File" sub="Max size: 5 MB" hint="Upload a file to continue" onClick={() => setStep("upload")} />
          <div style={{ flex: 1, background: C.light, border: `1px solid ${C.border}`, borderRadius: 12, padding: "26px 18px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, opacity: 0.5, cursor: "not-allowed" }}>
            <div style={{ fontSize: 34 }}>📄</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.navy }}>Google Sheets</div>
            <div style={{ fontSize: 12, color: C.slate }}>Google authorization needed</div>
            <div style={{ fontSize: 11, color: C.muted }}>Coming soon</div>
          </div>
        </div>
      </Overlay>
    );
  }
  if (step === "upload") {
    return (
      <Overlay width={580}>
        <Header title={`Import ${importType}s`} back={() => setStep("source")} />
        <div style={{ background: C.primarySoft, border: `1px solid ${C.primary}33`, borderRadius: 12, padding: "14px 16px", marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.navy }}>Import Rules &amp; Requirements</div>
            <button style={{ background: "none", border: "none", cursor: "pointer", color: C.primaryDark, fontSize: 12, fontWeight: 700 }}>⬇ Download Template</button>
          </div>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: C.slate, lineHeight: 1.7 }}>
            <li>Supported formats: XLS, XLSX. Max size: 5 MB.</li>
            <li>Use the provided template and do not modify the original column headers.</li>
            <li>Email addresses must follow a valid format; duplicates won't be checked.</li>
            <li>Dropdown values (e.g., Gender) must match the predefined options.</li>
            <li>Date fields must use the format YYYY-MM-DD.</li>
            <li>First Name and Last Name are required.</li>
            <li>Lifecycle Stage, Status, Ownership, Source and Assignee are system-set and are not importable columns — any such columns are ignored.</li>
          </ul>
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.navy, marginBottom: 8 }}>Upload your Excel file</div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", border: `1px solid ${C.border}`, borderRadius: 12, marginBottom: 18 }}>
          <span style={{ fontSize: 22 }}>📗</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.navy }}>File name.xlsx</div>
            <div style={{ fontSize: 11, color: C.muted }}>123 KB</div>
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, color: C.green, display: "flex", alignItems: "center", gap: 5 }}>✓ Ready to Import</span>
          <button onClick={() => setStep("source")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: C.muted }}>×</button>
        </div>
        <div style={{ marginBottom: 8 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: C.navy, display: "block", marginBottom: 6 }}>Worksheet *</label>
          <select style={fieldStyle} defaultValue="Worksheet_1"><option>Worksheet_1</option><option>Worksheet_2</option></select>
        </div>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 22 }}>Columns detected: 5 &nbsp;|&nbsp; Rows detected: 1,000</div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <button onClick={onClose} style={{ padding: "9px 20px", borderRadius: 9, border: "none", background: "transparent", color: C.slate, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
          <button onClick={runImport} style={{ padding: "9px 24px", borderRadius: 9, border: "none", background: C.primary, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Import</button>
        </div>
      </Overlay>
    );
  }
  if (step === "importing") {
    return (
      <Overlay width={460}>
        <div style={{ padding: "20px 8px", textAlign: "center" }}>
          <div style={{ width: 52, height: 52, margin: "0 auto 18px", borderRadius: "50%", border: `4px solid ${C.border}`, borderTopColor: C.primary, animation: "mvpSpin 0.8s linear infinite" }} />
          <div style={{ fontSize: 18, fontWeight: 700, color: C.navy, marginBottom: 16 }}>Importing 1,000 Records</div>
          <div style={{ height: 6, borderRadius: 4, background: C.border, overflow: "hidden", marginBottom: 12 }}>
            <div style={{ height: "100%", width: `${progress}%`, background: C.primary, borderRadius: 4, transition: "width .12s linear" }} />
          </div>
          <div style={{ fontSize: 13, color: C.muted }}>This may take a few moments.</div>
        </div>
        <style>{`@keyframes mvpSpin{to{transform:rotate(360deg)}}`}</style>
      </Overlay>
    );
  }
  const StatCard = ({ dot, label, value, color }) => (
    <div style={{ flex: 1, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.slate, marginBottom: 6 }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: dot }} /> {label}
      </div>
      <div style={{ fontSize: 30, fontWeight: 700, color }}>{value}</div>
    </div>
  );
  return (
    <Overlay width={560}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 30, height: 30, borderRadius: "50%", background: C.amber + "22", color: C.amber, display: "grid", placeItems: "center", fontSize: 16 }}>!</span>
          <div style={{ fontSize: 17, fontWeight: 700, color: C.navy }}>Import Completed with Errors</div>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: C.muted }}>×</button>
      </div>
      <div style={{ fontSize: 13, color: C.slate, margin: "4px 0 18px" }}>Download the error report, fix the issues, and re-import.</div>
      <div style={{ display: "flex", gap: 14, marginBottom: 22 }}>
        <StatCard dot={C.slate} label="Total Records" value="248" color={C.navy} />
        <StatCard dot={C.green} label="Imported" value="244" color={C.green} />
        <StatCard dot={C.red} label="Errors" value="4" color={C.red} />
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
        <button style={{ padding: "9px 18px", borderRadius: 9, border: "none", background: C.primarySoft, color: C.primaryDark, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>⬇ Download Error Report</button>
        <button onClick={onClose} style={{ padding: "9px 24px", borderRadius: 9, border: "none", background: C.primary, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Close</button>
      </div>
    </Overlay>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ADD CONTACT (full tabbed page)
// ─────────────────────────────────────────────────────────────────────────────
const ADD_TABS = ["Basic", "Personal", "Address", "Business", "Financial"];

const Field = ({ label, children }) => (
  <div style={{ marginBottom: 18 }}>
    <label style={{ fontSize: 13, fontWeight: 500, color: C.navy, display: "block", marginBottom: 7 }}>{label}</label>
    {children}
  </div>
);
const TextInput = (p) => <input {...p} style={{ ...fieldStyle, padding: "11px 13px" }} />;
const Select = ({ children, ...p }) => <select {...p} style={{ ...fieldStyle, padding: "11px 13px", color: p.value ? C.text : C.muted }}>{children}</select>;

const AddContactPage = ({ role, contactType = "Lead", onCancel, onSave }) => {
  const t = useT();
  // The Lead-vs-Network choice is made once at creation (SA can add Leads only;
  // VD/GP pick via the Add split-button). After creation Lifecycle is
  // system-managed — it changes only via Convert and is never shown/edited.
  const isSA = role === "superadmin";
  const isNetwork = contactType === "Network";
  const typeStatuses = LEAD_STATUSES;
  const [tab, setTab] = useState("Basic");
  // A Network member carries an Outcome (Customer / Partner, both possible) rather
  // than a stage status.
  const [outcome, setOutcome] = useState<string[]>([]);
  const toggleOutcome = (v) => setOutcome(o => o.includes(v) ? o.filter(x => x !== v) : [...o, v]);
  const [f, setF] = useState({
    first: "", last: "", email: "", phone: "", lifecycle: contactType, stageStatus: typeStatuses[0],
    assignee: "", product: "", productProvider: "", source: "Manual Entry", campaign: "",
    gdprConsent: false, gdprDate: "", newsletter: false, newsletterDate: "",
    salutation: "None", addressForm: "Formal", title: "", postTitle: "",
    dob: "", gender: "N/A", maritalStatus: "", numberOfChildren: "",
    estimatedIncome: "", estimatedHouseholdIncome: "", expectedPersonalChanges: "",
    potential: 0, interestsHobbies: "",
    street: "", zip: "", city: "", country: "",
    secondaryEmail: "", secondaryPhone: "", facebook: "", linkedin: "", instagram: "", tiktok: "", otherSocialMedia: "",
    company: "", employment: "", position: "", companySize: "", decisionRole: "None", industry: "",
    maximumBudget: "", existingContracts: "", risk: "", horizon: "", financialGoals: "", financialDescription: "",
    notes: "",
  });
  const set = (k) => (e) => setF(prev => ({ ...prev, [k]: e.target.value }));
  const valid = f.first.trim() && f.last.trim();

  const reset = () => setF(prev => Object.fromEntries(Object.keys(prev).map(k => [k,
    k === "lifecycle" ? contactType : k === "stageStatus" ? typeStatuses[0] : k === "decisionRole" ? "None" :
    k === "gdprConsent" || k === "newsletter" ? false :
    k === "salutation" ? "None" : k === "addressForm" ? "Formal" : k === "gender" ? "N/A" :
    k === "decisionRole" ? "None" : k === "potential" ? 0 : ""])));

  const Grid = ({ children, cols = 2 }) => (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 18 }}>{children}</div>
  );

  return (
    <div style={{ padding: "20px 28px 0", fontFamily: "inherit" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 18 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: C.navy, letterSpacing: "-0.02em" }}>Add {contactType}</h1>
        <span style={{ fontSize: 13, color: C.muted }}>Contacts . Add {contactType}</span>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 26, borderBottom: `1px solid ${C.border}`, marginBottom: 0 }}>
        {ADD_TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "10px 2px 14px", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit",
            fontSize: 14, fontWeight: tab === t ? 700 : 500, color: tab === t ? C.primaryDark : C.slate,
            borderBottom: tab === t ? `2px solid ${C.primary}` : "2px solid transparent", marginBottom: -1,
          }}>{t}</button>
        ))}
      </div>

      {/* Body */}
      <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 14, padding: "26px 80px", marginTop: 18, minHeight: 340 }}>
        {tab === "Basic" && (<>
          <Grid>
            <Field label="First Name *"><TextInput value={f.first} onChange={set("first")} placeholder="First name" /></Field>
            <Field label="Last Name *"><TextInput value={f.last} onChange={set("last")} placeholder="Last name" /></Field>
          </Grid>
          <Grid>
            <Field label="Primary Email"><TextInput value={f.email} onChange={set("email")} placeholder="name@example.com" /></Field>
            <Field label="Primary Phone"><TextInput value={f.phone} onChange={set("phone")} placeholder="+41 1234 5678" /></Field>
          </Grid>
          <Grid>
            {isNetwork ? (
              <Field label="Outcome — the person may be both">
                <div style={{ display: "flex", gap: 10 }}>
                  {NETWORK_OUTCOMES.map(v => {
                    const on = outcome.includes(v);
                    const tone = v === "Customer" ? C.green : C.indigo;
                    return (
                      <button key={v} type="button" onClick={() => toggleOutcome(v)} style={{
                        flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "11px 12px", borderRadius: 9,
                        border: `1.5px solid ${on ? tone : C.border}`, background: on ? tone + "12" : "#fff", color: on ? tone : C.slate,
                        fontSize: 13, fontWeight: on ? 700 : 500, cursor: "pointer", fontFamily: "inherit" }}>
                        <span style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${on ? tone : C.border}`, background: on ? tone : "#fff", display: "grid", placeItems: "center", fontSize: 10, color: "#fff" }}>{on ? "✓" : ""}</span>
                        {v}
                      </button>
                    );
                  })}
                </div>
              </Field>
            ) : (
              <Field label="Status"><Select value={f.stageStatus} disabled={isSA} onChange={set("stageStatus")}>{typeStatuses.map(o => <option key={o}>{o}</option>)}</Select></Field>
            )}
            <div />
          </Grid>
          <Grid>
            <Field label="Product"><TextInput value={f.product} onChange={set("product")} placeholder="Product name" /></Field>
            <Field label="Product Provider"><TextInput value={f.productProvider} onChange={set("productProvider")} placeholder="Provider" /></Field>
          </Grid>
          <Grid>
            {/* Source is system-set to the creation method and is not editable. */}
            <Field label="Source"><TextInput value={f.source} disabled readOnly style={{ ...fieldStyle, padding: "11px 13px", background: C.light, color: C.muted }} /></Field>
            <Field label="Campaign Assignment"><TextInput value={f.campaign} onChange={set("campaign")} placeholder="Campaign" /></Field>
          </Grid>
          <Grid>
            <Field label="Communication Consent (GDPR)">
              <div style={{ display: "flex", gap: 20, paddingTop: 4, marginBottom: f.gdprConsent ? 8 : 0 }}>
                {[["Yes", true], ["No", false]].map(([label, val]) => (
                  <label key={label} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14, color: C.text }}>
                    <input type="radio" name="gdpr" checked={f.gdprConsent === val}
                      onChange={() => setF(p => ({ ...p, gdprConsent: val, gdprDate: val ? p.gdprDate : "" }))}
                      style={{ accentColor: C.primary, width: 15, height: 15 }} />
                    {label}
                  </label>
                ))}
              </div>
              {f.gdprConsent && (
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 5 }}>Consent Date</label>
                  <input type="date" value={f.gdprDate} onChange={e => setF(p => ({ ...p, gdprDate: e.target.value }))}
                    style={{ ...fieldStyle, padding: "9px 12px" }} />
                </div>
              )}
            </Field>
            <Field label="Newsletter Subscription">
              <div style={{ display: "flex", gap: 20, paddingTop: 4, marginBottom: f.newsletter ? 8 : 0 }}>
                {[["Subscribed", true], ["Not subscribed", false]].map(([label, val]) => (
                  <label key={label} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14, color: C.text }}>
                    <input type="radio" name="newsletter" checked={f.newsletter === val}
                      onChange={() => setF(p => ({ ...p, newsletter: val, newsletterDate: val ? p.newsletterDate : "" }))}
                      style={{ accentColor: C.primary, width: 15, height: 15 }} />
                    {label}
                  </label>
                ))}
              </div>
              {f.newsletter && (
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 5 }}>Subscription Date</label>
                  <input type="date" value={f.newsletterDate} onChange={e => setF(p => ({ ...p, newsletterDate: e.target.value }))}
                    style={{ ...fieldStyle, padding: "9px 12px" }} />
                </div>
              )}
            </Field>
          </Grid>
        </>)}

        {tab === "Personal" && (<>
          <Grid>
            <Field label={t("salutation")}>
              <div style={{ display: "flex", gap: 20, paddingTop: 4 }}>
                {[["None", t("salutation_none")], ["Mr.", t("salutation_mr")], ["Mrs.", t("salutation_mrs")]].map(([val, lbl]) => (
                  <label key={val} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14, color: C.text }}>
                    <input type="radio" name="salutation" checked={f.salutation === val} onChange={() => setF(p => ({ ...p, salutation: val }))} style={{ accentColor: C.primary, width: 15, height: 15 }} />
                    {lbl}
                  </label>
                ))}
              </div>
            </Field>
            <Field label={t("addressForm")}>
              <div style={{ display: "flex", gap: 20, paddingTop: 4 }}>
                {[["Formal", t("addressForm_formal")], ["Informal", t("addressForm_informal")]].map(([val, lbl]) => (
                  <label key={val} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14, color: C.text }}>
                    <input type="radio" name="addressForm" checked={f.addressForm === val} onChange={() => setF(p => ({ ...p, addressForm: val }))} style={{ accentColor: C.primary, width: 15, height: 15 }} />
                    {lbl}
                  </label>
                ))}
              </div>
            </Field>
          </Grid>
          <Grid>
            <Field label={t("title")}><Select value={f.title} onChange={set("title")}><option value="">—</option><option>Dr.</option><option>Prof.</option><option>Prof. Dr.</option><option>Mag.</option><option>Ing.</option><option>DI</option></Select></Field>
            <Field label={t("postTitle")}><Select value={f.postTitle} onChange={set("postTitle")}><option value="">—</option><option>MBA</option><option>MSc</option><option>BSc</option><option>BA</option><option>MA</option></Select></Field>
          </Grid>
          <Grid>
            <Field label={t("gender")}>
              <div style={{ display: "flex", gap: 20, paddingTop: 4 }}>
                {[["N/A", t("gender_na")], ["Male", t("gender_male")], ["Female", t("gender_female")], ["Diverse", t("gender_diverse")]].map(([val, lbl]) => (
                  <label key={val} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14, color: C.text }}>
                    <input type="radio" name="gender" checked={f.gender === val} onChange={() => setF(p => ({ ...p, gender: val }))} style={{ accentColor: C.primary, width: 15, height: 15 }} />
                    {lbl}
                  </label>
                ))}
              </div>
            </Field>
            <Field label={t("dob")}><TextInput type="date" value={f.dob} onChange={set("dob")} /></Field>
          </Grid>
          <Grid>
            <Field label={t("maritalStatus")}><Select value={f.maritalStatus} onChange={set("maritalStatus")}>
              <option value="">—</option>
              <option value="Married">{t("marital_married")}</option>
              <option value="Registered Partnership">{t("marital_registeredPartnership")}</option>
              <option value="In a Relationship">{t("marital_inRelationship")}</option>
              <option value="Widowed">{t("marital_widowed")}</option>
              <option value="Single">{t("marital_single")}</option>
              <option value="Single Parent">{t("marital_singleParent")}</option>
              <option value="DINK">{t("marital_dink")}</option>
              <option value="Other">{t("marital_other")}</option>
            </Select></Field>
            <Field label={t("numberOfChildren")}><TextInput type="number" min={0} value={f.numberOfChildren} onChange={set("numberOfChildren")} placeholder="0" /></Field>
          </Grid>
          <Grid>
            <Field label={t("estimatedIncome")}><Select value={f.estimatedIncome} onChange={set("estimatedIncome")}>
              <option value="">—</option>
              <option>{"< €20,000"}</option><option>€20,000 – €40,000</option><option>€40,000 – €60,000</option>
              <option>€60,000 – €100,000</option><option>€100,000 – €150,000</option><option>{"> €150,000"}</option>
            </Select></Field>
            <Field label={t("estimatedHouseholdIncome")}><Select value={f.estimatedHouseholdIncome} onChange={set("estimatedHouseholdIncome")}>
              <option value="">—</option>
              <option>{"< €30,000"}</option><option>€30,000 – €60,000</option><option>€60,000 – €100,000</option>
              <option>€100,000 – €200,000</option><option>€200,000 – €300,000</option><option>{"> €300,000"}</option>
            </Select></Field>
          </Grid>
          <Field label={t("expectedPersonalChanges")}><TextInput value={f.expectedPersonalChanges} onChange={set("expectedPersonalChanges")} placeholder="e.g. Retirement, house purchase…" /></Field>
          <Field label={t("potential")}>
            <div style={{ display: "inline-flex", gap: 4, paddingTop: 2 }}>
              {[1,2,3,4,5].map(i => (
                <span key={i} onClick={() => setF(p => ({ ...p, potential: i }))}
                  style={{ fontSize: 22, cursor: "pointer", color: i <= f.potential ? C.amber : C.border, lineHeight: 1 }}>★</span>
              ))}
            </div>
          </Field>
          <Field label={t("interestsHobbies")}><textarea value={f.interestsHobbies} onChange={set("interestsHobbies")} placeholder="e.g. Golf, Travelling…" rows={3} style={{ ...fieldStyle, padding: "11px 13px", resize: "vertical" }} /></Field>
        </>)}

        {tab === "Address" && (<>
          <Grid>
            <Field label={t("street")}><TextInput value={f.street} onChange={set("street")} placeholder="Street" /></Field>
            <Field label={t("postalCode")}><TextInput value={f.zip} onChange={set("zip")} placeholder="ZIP" /></Field>
          </Grid>
          <Grid>
            <Field label={t("city")}><TextInput value={f.city} onChange={set("city")} placeholder="City" /></Field>
            <Field label={t("country")}><TextInput value={f.country} onChange={set("country")} placeholder="Country" /></Field>
          </Grid>
          <Grid>
            <Field label={t("secondaryEmail")}><TextInput type="email" value={f.secondaryEmail} onChange={set("secondaryEmail")} placeholder="secondary@example.com" /></Field>
            <Field label={t("secondaryPhone")}><TextInput value={f.secondaryPhone} onChange={set("secondaryPhone")} placeholder="+41 …" /></Field>
          </Grid>
          <Grid>
            <Field label={t("facebook")}><TextInput value={f.facebook} onChange={set("facebook")} placeholder="Facebook URL or username" /></Field>
            <Field label={t("linkedIn")}><TextInput value={f.linkedin} onChange={set("linkedin")} placeholder="LinkedIn URL or username" /></Field>
          </Grid>
          <Grid>
            <Field label={t("instagram")}><TextInput value={f.instagram} onChange={set("instagram")} placeholder="Instagram handle" /></Field>
            <Field label={t("tiktok")}><TextInput value={f.tiktok} onChange={set("tiktok")} placeholder="TikTok handle" /></Field>
          </Grid>
          <Field label={t("otherSocialMedia")}><TextInput value={f.otherSocialMedia} onChange={set("otherSocialMedia")} placeholder="Other social media link" /></Field>
        </>)}

        {tab === "Business" && (<>
          <Field label="Company"><TextInput value={f.company} onChange={set("company")} placeholder="Company" /></Field>
          <Grid>
            <Field label={t("employmentType")}><Select value={f.employment} onChange={set("employment")}>
              <option value="">{t("employmentType")}</option>
              <option value="Employed">{t("empl_employed")}</option>
              <option value="Self-employed">{t("empl_selfEmployed")}</option>
              <option value="Unemployed">{t("empl_unemployed")}</option>
              <option value="In Training">{t("empl_inTraining")}</option>
              <option value="Student">{t("empl_student")}</option>
              <option value="Retired">{t("empl_retired")}</option>
              <option value="Other">{t("empl_other")}</option>
            </Select></Field>
            <Field label={t("position")}><Select value={f.position} onChange={set("position")}>
              <option value="">{t("position")}</option>
              <option value="Senior Management">{t("pos_seniorMgmt")}</option>
              <option value="Executive">{t("pos_executive")}</option>
              <option value="Middle Management">{t("pos_middleMgmt")}</option>
              <option value="Employee">{t("pos_employee")}</option>
              <option value="Assistant">{t("pos_assistant")}</option>
              <option value="Other">{t("pos_other")}</option>
            </Select></Field>
          </Grid>
          <Field label={t("companySize")}><Select value={f.companySize} onChange={set("companySize")}>
            <option value="">{t("companySize")}</option>
            <option value="Corporation">{t("companySize_corporation")}</option>
            <option value="Large">{t("companySize_large")}</option>
            <option value="SME">{t("companySize_sme")}</option>
            <option value="Small">{t("companySize_small")}</option>
            <option value="EPU">{t("companySize_epu")}</option>
            <option value="Other">{t("companySize_other")}</option>
          </Select></Field>
          <Field label={t("decisionMakingRole")}>
            <div style={{ display: "flex", gap: 40, paddingTop: 4 }}>
              {[["None", t("dmr_none")], ["Decision Maker", t("dmr_decisionMaker")], ["Influencer", t("dmr_influencer")], ["User", t("dmr_endUser")]].map(([val, label]) => (
                <label key={val} style={{ display: "flex", alignItems: "center", gap: 9, cursor: "pointer", fontSize: 14, color: C.text }}>
                  <input type="radio" name="decisionRole" checked={f.decisionRole === val} onChange={() => setF(prev => ({ ...prev, decisionRole: val }))} style={{ accentColor: C.primary, width: 16, height: 16 }} />
                  {label}
                </label>
              ))}
            </div>
          </Field>
          <Field label="Industry"><TextInput value={f.industry} onChange={set("industry")} placeholder="Industry" /></Field>
        </>)}

        {tab === "Financial" && (<>
          <Grid>
            <Field label={t("maximumBudget")}><TextInput value={f.maximumBudget} onChange={set("maximumBudget")} placeholder="€ —" /></Field>
            <Field label={t("existingContracts")}><TextInput value={f.existingContracts} onChange={set("existingContracts")} placeholder="—" /></Field>
          </Grid>
          <Grid>
            <Field label={t("riskProfile")}><Select value={f.risk} onChange={set("risk")}>
              <option value="">—</option>
              <option value="Security Oriented">{t("risk_security")}</option>
              <option value="Balanced">{t("risk_balanced")}</option>
              <option value="Opportunity Oriented">{t("risk_opportunity")}</option>
            </Select></Field>
            <Field label={t("investmentHorizon")}><Select value={f.horizon} onChange={set("horizon")}>
              <option value="">—</option>
              <option value="Short">{t("horizon_short")}</option>
              <option value="Medium">{t("horizon_medium")}</option>
              <option value="Long">{t("horizon_long")}</option>
            </Select></Field>
          </Grid>
          <Field label={t("financialGoals")}><TextInput value={f.financialGoals} onChange={set("financialGoals")} placeholder="e.g. Retirement savings, property purchase…" /></Field>
          <Field label={t("description")}><textarea value={f.financialDescription} onChange={set("financialDescription")} placeholder="Additional notes…" maxLength={5000} rows={5} style={{ ...fieldStyle, padding: "11px 13px", resize: "vertical" }} /></Field>
        </>)}

      </div>

      {/* Footer */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 0 24px" }}>
        <button onClick={onCancel} style={{ padding: "10px 8px", background: "none", border: "none", color: C.slate, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
        <div style={{ display: "flex", gap: 12 }}>
          <button disabled={!valid} onClick={() => { onSave({ ...f, outcome }); reset(); setOutcome([]); setTab("Basic"); }}
            style={{ padding: "11px 22px", borderRadius: 9, border: "none", background: valid ? C.primarySoft : C.light, color: valid ? C.primaryDark : C.muted, fontSize: 14, fontWeight: 700, cursor: valid ? "pointer" : "default" }}>Save &amp; New</button>
          <button disabled={!valid} onClick={() => { onSave({ ...f, outcome }); onCancel(); }}
            style={{ padding: "11px 30px", borderRadius: 9, border: "none", background: valid ? C.primary : C.border, color: valid ? "#fff" : C.muted, fontSize: 14, fontWeight: 700, cursor: valid ? "pointer" : "default" }}>Save</button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// BULK EMAIL
// ─────────────────────────────────────────────────────────────────────────────
const Avatar = ({ name }) => (
  <div style={{ width: 40, height: 40, borderRadius: "50%", background: C.primarySoft, color: C.primaryDark, display: "grid", placeItems: "center", fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
    {name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase()}
  </div>
);

const GdprPill = () => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: C.primaryDark, background: C.primarySoft, padding: "4px 9px", borderRadius: 12 }}>ⓘ GDPR</span>
);

// Email preview — the rendered template a user sees before sending.
const EmailPreviewModal = ({ onClose }) => (
  <>
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", zIndex: 600 }} />
    <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 600, maxWidth: "94vw", maxHeight: "92vh", overflowY: "auto", background: "#fff", borderRadius: 16, zIndex: 700, boxShadow: "0 24px 64px rgba(0,0,0,0.22)", fontFamily: "inherit" }}>
      <div style={{ padding: "20px 26px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 14 }}>
          <span style={{ fontSize: 13, color: C.muted, width: 80 }}>Subject</span>
          <span style={{ flex: 1, fontSize: 17, fontWeight: 700, color: C.navy }}>Subject #1</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: C.muted }}>×</button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 16 }}>
          <span style={{ fontSize: 13, color: C.muted, width: 80 }}>Attachments</span>
          <div style={{ display: "flex", gap: 12 }}>
            {["FileName1.pdf", "FileName2.pdf"].map(f => (
              <span key={f} style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13, color: C.text, background: C.primarySoft, padding: "9px 14px", borderRadius: 8 }}>📎 {f}</span>
            ))}
          </div>
        </div>
      </div>
      <div style={{ height: 6, background: C.primary }} />
      <div style={{ padding: "30px 40px" }}>
        <div style={{ textAlign: "center", marginBottom: 26, fontSize: 22, fontWeight: 800 }}>
          <span style={{ color: C.primary }}>ⓧ vion</span><span style={{ color: C.slate }}>world</span>
        </div>
        <div style={{ fontSize: 14, color: C.text, lineHeight: 1.7 }}>
          <p style={{ margin: "0 0 16px" }}>Hi John,</p>
          <p style={{ margin: "0 0 16px" }}>Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.</p>
          <p style={{ margin: "0 0 16px" }}>Thank You,</p>
          <p style={{ margin: 0 }}>Vionworld - CRM Hub</p>
        </div>
      </div>
      <div style={{ background: C.primary, color: "#fff", padding: "22px 30px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 18, fontWeight: 800 }}>ⓧ vion<span style={{ fontWeight: 400 }}>world</span></span>
        <span style={{ fontSize: 13, opacity: 0.95 }}>2024© Lead Connect</span>
      </div>
    </div>
  </>
);

// Send Bulk Email — composer + recipients sub-view.
const BULK_STATUS_COLOR = { Sent: C.green, Scheduled: C.blue, Cancelled: C.muted };
const SendBulkEmailModal = ({ contacts, onClose }) => {
  const [view, setView]       = useState("main");   // main | recipients | history
  const [recipients, setRecipients] = useState(contacts);
  const [schedule, setSchedule] = useState(true);
  const [tpl, setTpl]         = useState("Email Template #1");
  const [preview, setPreview] = useState(false);
  const [history, setHistory] = useState([
    { id: "h1", template: "Welcome Email",   recipients: 50, status: "Sent",      date: "10.06.2026 - 09:00" },
    { id: "h2", template: "Q1 Finanz Update", recipients: 24, status: "Scheduled", date: "28.06.2026 - 08:00" },
    { id: "h3", template: "Gold Package",     recipients: 12, status: "Scheduled", date: "30.06.2026 - 10:30" },
    { id: "h4", template: "Follow-up",        recipients: 18, status: "Sent",      date: "02.06.2026 - 14:20" },
  ]);
  const cancelScheduled = (id) => setHistory(prev => prev.map(h => h.id === id ? { ...h, status: "Cancelled" } : h));
  const gdprCount = recipients.filter(r => r.gdpr).length;
  const removeRcpt = (id) => setRecipients(prev => prev.filter(r => r.id !== id));

  const Shell = ({ children }) => (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", zIndex: 400 }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 560, maxWidth: "94vw", maxHeight: "92vh", overflowY: "auto", background: "#fff", borderRadius: 16, zIndex: 500, boxShadow: "0 24px 64px rgba(0,0,0,0.22)", padding: "22px 26px", fontFamily: "inherit" }}>
        {children}
      </div>
    </>
  );

  if (view === "recipients") {
    return (
      <Shell>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={() => setView("main")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: C.slate }}>←</button>
            <span style={{ fontSize: 19, fontWeight: 700, color: C.navy }}>Send Bulk Email</span>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: C.muted }}>×</button>
        </div>
        <div style={{ maxHeight: 400, overflowY: "auto" }}>
          {recipients.map(r => (
            <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 2px", borderBottom: `1px solid ${C.border}` }}>
              <Avatar name={r.name} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: C.navy }}>{r.name}</div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 1 }}>{r.email}</div>
              </div>
              {r.gdpr && <GdprPill />}
              <button onClick={() => removeRcpt(r.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: C.muted }}>×</button>
            </div>
          ))}
          {recipients.length === 0 && <div style={{ padding: "30px", textAlign: "center", color: C.muted, fontSize: 13 }}>No recipients left.</div>}
        </div>
      </Shell>
    );
  }

  if (view === "history") {
    return (
      <Shell>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={() => setView("main")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: C.slate }}>←</button>
            <span style={{ fontSize: 19, fontWeight: 700, color: C.navy }}>Bulk Email History</span>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: C.muted }}>×</button>
        </div>
        <div>
          {history.map(h => (
            <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 2px", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.navy }}>{h.template}</div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 1 }}>{h.recipients} · {h.date}</div>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: BULK_STATUS_COLOR[h.status], background: BULK_STATUS_COLOR[h.status] + "18", padding: "4px 11px", borderRadius: 12 }}>{h.status}</span>
              {h.status === "Scheduled" && (
                <button onClick={() => cancelScheduled(h.id)} style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${C.red}40`, background: "#fff", color: C.red, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
              )}
            </div>
          ))}
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <span style={{ fontSize: 19, fontWeight: 700, color: C.navy }}>Send Bulk Email</span>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button onClick={() => setView("history")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, color: C.primaryDark }}>History</button>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: C.muted }}>×</button>
        </div>
      </div>

      {/* selection banner */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, background: C.primarySoft, borderRadius: 10, padding: "13px 16px", marginBottom: 20 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: C.navy }}>{contacts.length} contacts selected</span>
        {gdprCount > 0 && <GdprPill />}
        <button onClick={() => setView("recipients")} style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 700, color: C.primaryDark }}>
          Recipients ({recipients.length}) ›
        </button>
      </div>

      {/* template */}
      <Label>Email Template *</Label>
      <div style={{ position: "relative", marginBottom: 6 }}>
        <div style={{ ...fieldStyle, padding: "12px 14px", display: "flex", alignItems: "center" }}>
          <span style={{ flex: 1, fontSize: 14, color: tpl ? C.text : C.muted }}>{tpl || "Select Email Template"}</span>
          {tpl && <span onClick={() => setTpl("")} style={{ cursor: "pointer", color: C.muted }}>×</span>}
        </div>
      </div>
      <div style={{ textAlign: "right", marginBottom: 16 }}>
        <span onClick={() => setPreview(true)} style={{ fontSize: 13, fontWeight: 700, color: C.primaryDark, cursor: "pointer", textDecoration: "underline" }}>Preview Email Template</span>
      </div>

      {/* schedule */}
      <label style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 16, cursor: "pointer", fontSize: 14, fontWeight: 600, color: C.navy }}>
        <input type="checkbox" checked={schedule} onChange={e => setSchedule(e.target.checked)} style={{ width: 16, height: 16, accentColor: C.primary }} /> Schedule
      </label>
      {schedule && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
          <div><Label>Date *</Label><input type="date" style={{ ...fieldStyle, color: C.muted }} /></div>
          <div><Label>Time *</Label><input type="time" style={{ ...fieldStyle, color: C.muted }} /></div>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
        <button onClick={onClose} style={{ padding: "9px 20px", borderRadius: 9, border: "none", background: "transparent", color: C.slate, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
        <button onClick={onClose} style={{ padding: "9px 30px", borderRadius: 9, border: "none", background: C.primary, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Send</button>
      </div>

      {preview && <EmailPreviewModal onClose={() => setPreview(false)} />}
    </Shell>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// BULK ASSIGN MODAL
// ─────────────────────────────────────────────────────────────────────────────
const ASSIGNABLE_USERS = [
  { id: "u1", name: "Anna Klein",    role: "Berater" },
  { id: "u2", name: "Peter Schmidt", role: "Berater" },
  { id: "u3", name: "Maria Weber",   role: "Berater" },
  { id: "u4", name: "Kai Fischer",   role: "Berater" },
  { id: "u5", name: "Sophie Braun",  role: "Berater" },
];

const BulkAssignModal = ({ contacts, onClose, onAssign }) => {
  const [assignee, setAssignee] = useState("");
  const [confirm, setConfirm]   = useState(false);

  if (confirm) {
    const user = ASSIGNABLE_USERS.find(u => u.id === assignee);
    return (
      <>
        <div onClick={() => setConfirm(false)} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", zIndex: 600 }} />
        <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 420, maxWidth: "92vw", background: "#fff", borderRadius: 16, zIndex: 700, boxShadow: "0 24px 64px rgba(0,0,0,0.22)", padding: "22px 24px", fontFamily: "inherit" }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: C.navy, marginBottom: 8 }}>Confirm Assignment</div>
          <div style={{ fontSize: 13, color: C.slate, marginBottom: 22 }}>
            Assign {contacts.length} contact{contacts.length !== 1 ? "s" : ""} to <b>{user?.name}</b>?
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
            <button onClick={() => setConfirm(false)} style={{ padding: "9px 20px", borderRadius: 9, border: "none", background: "transparent", color: C.slate, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
            <button onClick={() => { onAssign(contacts.map(c => c.id), user?.name); onClose(); }}
              style={{ padding: "9px 24px", borderRadius: 9, border: "none", background: C.primary, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Assign</button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", zIndex: 400 }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 520, maxWidth: "92vw", background: "#fff", borderRadius: 16, zIndex: 500, boxShadow: "0 24px 64px rgba(0,0,0,0.22)", padding: "22px 26px", fontFamily: "inherit" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <span style={{ fontSize: 19, fontWeight: 700, color: C.navy }}>Bulk Assignment</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: C.muted }}>×</button>
        </div>

        <div style={{ marginBottom: 18 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: C.navy, display: "block", marginBottom: 6 }}>Assign to *</label>
          <select value={assignee} onChange={e => setAssignee(e.target.value)} style={{ ...fieldStyle, color: assignee ? C.text : C.muted }}>
            <option value="">Select a user...</option>
            {ASSIGNABLE_USERS.map(u => <option key={u.id} value={u.id}>{u.name} — {u.role}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.navy, marginBottom: 8 }}>Selected Contacts ({contacts.length})</div>
          <div style={{ maxHeight: 240, overflowY: "auto", border: `1px solid ${C.border}`, borderRadius: 10 }}>
            {contacts.map(c => (
              <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderBottom: `1px solid ${C.border}` }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.primarySoft, color: C.primaryDark, display: "grid", placeItems: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                  {c.name.split(" ").slice(0,2).map(w => w[0]).join("").toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.navy }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{c.email}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <button onClick={onClose} style={{ padding: "9px 20px", borderRadius: 9, border: "none", background: "transparent", color: C.slate, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
          <button disabled={!assignee} onClick={() => setConfirm(true)}
            style={{ padding: "9px 28px", borderRadius: 9, border: "none", background: assignee ? C.primary : C.border, color: assignee ? "#fff" : C.muted, fontSize: 13, fontWeight: 700, cursor: assignee ? "pointer" : "default" }}>
            Assign
          </button>
        </div>
      </div>
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// TAKE OVER MODAL (VD reassigns pending leads to himself)
// ─────────────────────────────────────────────────────────────────────────────
const TakeOverModal = ({ contacts, vdName, onClose, onTakeOver, t }) => (
  <>
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", zIndex: 400 }} />
    <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 460, maxWidth: "92vw", background: "#fff", borderRadius: 16, zIndex: 500, boxShadow: "0 24px 64px rgba(0,0,0,0.22)", padding: "22px 26px", fontFamily: "inherit" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <span style={{ fontSize: 18, fontWeight: 700, color: C.navy }}>{t("takeOverConfirmTitle")}</span>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: C.muted }}>×</button>
      </div>
      <div style={{ fontSize: 13, color: C.slate, marginBottom: 16 }}>
        {contacts.length} {contacts.length !== 1 ? t("recipients").toLowerCase() : t("nlContactCol").toLowerCase()} {t("takeOverConfirmMsg")}
      </div>
      <div style={{ maxHeight: 220, overflowY: "auto", border: `1px solid ${C.border}`, borderRadius: 10, marginBottom: 18 }}>
        {contacts.map(c => (
          <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderBottom: `1px solid ${C.border}` }}>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: C.primarySoft, color: C.primaryDark, display: "grid", placeItems: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
              {c.name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase()}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.navy }}>{c.name}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
        <button onClick={onClose} style={{ padding: "9px 20px", borderRadius: 9, border: "none", background: "transparent", color: C.slate, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>{t("cancel")}</button>
        <button onClick={() => { onTakeOver(contacts.map(c => c.id), vdName); onClose(); }}
          style={{ padding: "9px 24px", borderRadius: 9, border: "none", background: C.navy, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>{t("takeOver")}</button>
      </div>
    </div>
  </>
);

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
// Build role-specific system views. System views cannot be deleted.
const getSystemViews = (role, t?: (key: any) => string) => {
  const n = (key: string, fallback: string) => t ? t(key) : fallback;
  // Column sets follow the "System Views – Revisions & Definitions" spec.
  const MY_NETWORK_COLS   = ["name", "primaryEmail", "phone", "outcomeType", "lastActivity"];
  const MY_LEADS_COLS     = ["name", "primaryEmail", "phone", "stageStatus", "feedback"];
  const ASSIGNED_COLS     = ["name", "assignee", "stageStatus", "feedback", "lastActivity"];
  const PENDING_COLS      = ["name", "primaryEmail", "phone", "accountSource", "campaign"];        // VD Pending Assignments
  const SA_UNASSIGNED_COLS = ["name", "primaryEmail", "phone", "assignee", "accountSource", "campaign"]; // SA Unassigned (shows Assignee)
  const myNetwork     = { id: "my",       name: n("myNetwork", "My Network"),                filter: "my",       columns: MY_NETWORK_COLS,    system: true };
  const unassigned    = { id: "pending",  name: n("unassignedLeads", "Unassigned Leads"),    filter: "pending",  columns: SA_UNASSIGNED_COLS, system: true };
  const myLeads       = { id: "myleads",  name: n("myLeads", "My Leads"),                   filter: "myleads",  columns: MY_LEADS_COLS,      system: true };
  const assignedLeads = { id: "assigned", name: n("assignedLeads", "Assigned Leads"),        filter: "assigned", columns: ASSIGNED_COLS,      system: true };
  const pendingAssign = { id: "pendingA", name: n("pendingAssignmentsView", "Pending Assignments"), filter: "pending", columns: PENDING_COLS, system: true };

  // Default active view on load: SA → Unassigned Leads; GP/VD → My Network.
  if (role === "superadmin") return [unassigned, assignedLeads];
  if (role === "vd")         return [myNetwork, myLeads, assignedLeads, pendingAssign];
  // gp
  return [myNetwork, myLeads];
};

const CUSTOM_VIEWS = [
  { id: "cv1", name: "Custom View 1", filter: "custom1", columns: ["name", "email", "phone", "stageStatus"] },
  { id: "cv2", name: "Custom View 2", filter: "custom2", columns: ["name", "accountSource", "create"] },
];

// ── My Leads view (advisor) — processing-focused table matching the dashboard ──
const ML_AV = [C.primary, C.blue, C.indigo, C.green, C.amber, C.purple];
const mlAvColor = (name) => ML_AV[name.charCodeAt(0) % ML_AV.length];
const ML_DOT = { sms: { c: C.green, sq: true }, miss: { c: C.amber, sq: false }, reached: { c: C.green, sq: false }, open: { c: "#D0D5DD", sq: false } };
// Format a structured Next-Action due date (ISO) into a relative badge.
const fmtDue = (iso, t) => {
  if (!iso) return "";
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return String(iso);
  const days = Math.round((d.getTime() - today.getTime()) / 86400000);
  if (days < 0)  return t("mlOverdue");
  if (days === 0) return t("mlToday");
  if (days === 1) return t("mlTomorrow");
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
};
// Processing column — the Processing value plus a live call counter (spec §4),
// e.g. "Attempting Contact · 3 calls". Counters come from the numeric
// `callAttempts` property, never from parsing the status string.
const mlProcessing = (l, t) => {
  const a = getCallAttempts(l); const dots: string[] = []; let text;
  const callLbl = `${a} ${a === 1 ? t("mlCall") : t("mlCalls")}`;
  if (l.status === "open" && a === 0) { text = t("mlNotContacted"); }
  else if (l.status === "appointment") { text = t("mlApptScheduled"); dots.push("sms", "reached"); }
  else if (a === 0) { text = t("mlSmsSent"); dots.push("sms"); }
  else if (l.status === "connected") { text = `${t("mlConnected")} · ${callLbl}`; dots.push("sms", "reached"); for (let i = 0; i < a; i++) dots.push("miss"); }
  else if (l.status === "not_reached") { text = `${callLbl} · ${t("mlNotReachedLc")}`; dots.push("sms"); for (let i = 0; i < a; i++) dots.push("miss"); }
  else { text = `${t("mlAttemptingContact")} · ${callLbl}`; dots.push("sms"); for (let i = 0; i < a; i++) dots.push("miss"); }
  while (dots.length < 6) dots.push("open");
  return { text, dots: dots.slice(0, 6) };
};
const mlNextStep = (l, t) => {
  // Prefer the lead's structured Next Action + due date (spec §1/§4) over the
  // status-derived heuristic fallback below.
  if (l.nextAction && l.nextAction !== "No open action") {
    const due = l.nextActionDue || l.nextActionDueDate;
    return { dot: C.blue, text: l.nextAction, badge: due ? fmtDue(due, t) : t("mlToday"), tone: C.blue };
  }
  const a = getCallAttempts(l);
  switch (l.status) {
    case "open":        return { dot: C.amber, text: t("mlSendSmsCall"),  badge: t("mlToday"),     tone: C.amber };
    case "appointment": return { dot: C.green, text: t("mlConsultation"), badge: "02.07. · 11:00", tone: C.green };
    case "not_reached": return { dot: C.red,   text: `${a + 1}. ${t("mlCall")} · ${t("mlFollowUp")}`, badge: t("mlOverdue"), tone: C.red };
    case "followup":    return { dot: C.blue,  text: t("mlFollowUpCall"), badge: t("mlTomorrow"),  tone: C.blue };
    default:            return a >= 2 ? { dot: C.blue,  text: t("mlSecondCallFollow"), badge: t("mlTomorrow"), tone: C.blue }
                                      : { dot: C.amber, text: t("mlFirstCall"),        badge: t("mlToday"),    tone: C.amber };
  }
};
// Status shown in the My Leads list, derived so it stays consistent with the
// Processing column: a lead that has been called is never "New", a finalized lead
// reads "Finalized", etc.
const mlStatusOf = (l, t) => {
  if (getLeadState(l.id).finalized) return { key: "finalized", label: t("mlStFinalized"), color: C.slate };
  const a = getCallAttempts(l);
  const s = l.status;
  if (s === "appointment" || s === "closed") return { key: "appointment", label: t("mlStAppointment"), color: C.green };
  if (s === "not_reached")                   return { key: "notreached",  label: t("mlStNotReached"),  color: C.red   };
  if (s === "open" && a === 0)               return { key: "new",         label: t("mlStNew"),         color: C.blue  };
  return { key: "inprogress", label: t("mlStInProgress"), color: C.amber };
};
const MyLeadsView = ({ leads, navigateTo, t }) => {
  const [filter, setFilter] = useState("all");
  const chips = [["all", "mlAll"], ["new", "mlStNew"], ["inprogress", "mlStInProgress"], ["appointment", "mlStAppointment"], ["notreached", "mlStNotReached"]];
  const shown = leads.filter(l => filter === "all" || (mlStatusOf(l, t).key === filter));
  const GRID = "1.3fr 1fr 1.1fr 1.4fr 0.9fr 1.3fr 1.4fr 172px";
  return (
    <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
      {/* Status filter chips */}
      <div style={{ padding: "14px 20px", display: "flex", alignItems: "center", gap: 8, borderBottom: `1px solid ${C.border}`, flexWrap: "wrap" }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "flex", alignItems: "center", gap: 5, marginRight: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>▽ {t("status")}</span>
        {chips.map(([id, label]) => {
          const active = filter === id;
          return <button key={id} onClick={() => setFilter(id)} style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${active ? C.navy : C.border}`, background: active ? C.navy : "#fff", color: active ? "#fff" : C.slate, fontSize: 12.5, fontWeight: active ? 700 : 500, cursor: "pointer", fontFamily: "inherit" }}>{t(label as any)}</button>;
        })}
      </div>
      <div style={{ overflowX: "auto" }}>
        <div style={{ minWidth: 1180 }}>
          {/* Header */}
          <div style={{ display: "grid", gridTemplateColumns: GRID, gap: 14, padding: "12px 20px", borderBottom: `1px solid ${C.border}`, background: C.light }}>
            {[t("mlColLead"), t("mlColCampaign"), t("mlColPhone"), t("mlColEmail"), t("status"), t("mlColProcessing"), t("mlColNextStep"), ""].map((h, i) => (
              <div key={i} style={{ fontSize: 10.5, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</div>
            ))}
          </div>
          {shown.map((l, i) => {
            const st = mlStatusOf(l, t);
            const proc = mlProcessing(l, t); const ns = mlNextStep(l, t);
            const openDetail = () => navigateTo("LeadDetail", l, "myleads");
            const finalized = !!getLeadState(l.id).finalized;
            return (
              <div key={l.id} style={{ display: "grid", gridTemplateColumns: GRID, gap: 14, padding: "14px 20px", borderBottom: i < shown.length - 1 ? `1px solid ${C.border}` : "none", alignItems: "center" }}>
                {/* LEAD */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  <div style={{ width: 34, height: 34, borderRadius: "50%", background: mlAvColor(l.name) + "1F", color: mlAvColor(l.name), display: "grid", placeItems: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{l.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}</div>
                  <div style={{ minWidth: 0 }}>
                    <div onClick={openDetail} title={t("openContact")} style={{ fontSize: 13.5, fontWeight: 600, color: C.navy, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 2 }}>{l.name}</div>
                  </div>
                </div>
                {/* CAMPAIGN */}
                <div style={{ minWidth: 0, fontSize: 12.5, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{l.campaign}</div>
                {/* PHONE NUMBER */}
                <div style={{ minWidth: 0, fontSize: 12.5, color: C.text, fontFamily: "monospace", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{l.phone}</div>
                {/* PRIMARY EMAIL */}
                <div style={{ minWidth: 0, fontSize: 12.5, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={l.email}>{l.email}</div>
                {/* STATUS */}
                <div><span style={{ fontSize: 11.5, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: st.color + "18", color: st.color, whiteSpace: "nowrap" }}>{st.label}</span></div>
                {/* PROCESSING */}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: C.navy, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{proc.text}</div>
                  <div style={{ display: "flex", gap: 4, marginTop: 5 }}>
                    {proc.dots.map((d, di) => { const dot = ML_DOT[d]; return <span key={di} style={{ width: 9, height: 9, borderRadius: dot.sq ? 2 : "50%", background: dot.c, display: "inline-block" }} />; })}
                  </div>
                </div>
                {/* NEXT STEP */}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: C.navy, display: "flex", alignItems: "center", gap: 7, whiteSpace: "nowrap" }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: ns.dot, flexShrink: 0 }} />{ns.text}
                  </div>
                  <span style={{ display: "inline-block", marginTop: 5, fontSize: 10.5, fontWeight: 600, padding: "2px 8px", borderRadius: 6, background: ns.tone + "18", color: ns.tone }}>{ns.badge}</span>
                </div>
                {/* ACTION — finalized → Add to Network · step 2+ (not New) → Finalize Now · New → none */}
                {finalized
                  ? <button onClick={() => navigateTo("LeadDetail", l, "myleads", "convert")} style={{ padding: "7px 16px", borderRadius: 8, border: "none", background: C.navy, color: "#fff", fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>⇪ {t("mlAddToNetwork")}</button>
                  : st.key === "new"
                    ? <div />
                    : <button onClick={() => navigateTo("LeadDetail", l, "myleads", "finalize")} style={{ padding: "7px 16px", borderRadius: 8, border: `1px solid ${C.border}`, background: "#fff", color: C.navy, fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>🏁 {t("mlFinalizeNow")}</button>}
              </div>
            );
          })}
          {shown.length === 0 && <div style={{ padding: "32px", textAlign: "center", color: C.muted, fontSize: 13 }}>—</div>}
        </div>
      </div>
      {/* Legend */}
      <div style={{ padding: "12px 20px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 20, flexWrap: "wrap" }}>
        {[["sms", "mlSmsSent"], ["miss", "mlLegMiss"], ["reached", "mlLegReached"], ["open", "mlLegOpen"]].map(([d, label]) => { const dot = ML_DOT[d]; return (
          <span key={d} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: C.slate }}>
            <span style={{ width: 9, height: 9, borderRadius: dot.sq ? 2 : "50%", background: dot.c, display: "inline-block" }} />{t(label as any)}
          </span>
        ); })}
      </div>
    </div>
  );
};

export const MVPContactsPage = ({ navigateTo, role, initialView, clearInitialView, initialAction, clearInitialAction }) => {
  const t = useT();
  const [contacts, setContacts] = useState(() => [...NETWORK_SEED, ...ALL_LEADS.map(toContact)]);
  // System views are derived from role so they update whenever the role switcher changes.
  // Custom views live in state so users can add/edit/delete them independently.
  const systemViews = useMemo(() => getSystemViews(role, t), [role, t]);
  const [customViews, setCustomViews] = useState(CUSTOM_VIEWS);
  const views = [...systemViews, ...customViews];
  const [activeView, setActiveView] = useState(() => initialView || getSystemViews(role)[0]?.id || "my");

  // Consume a one-shot initial view requested by the caller (e.g. a dashboard "All" link),
  // then clear it upstream so a later plain navigation to this page doesn't reuse it.
  React.useEffect(() => {
    if (initialView) clearInitialView && clearInitialView();
  }, []);

  // Keep activeView in a valid system view when role changes
  React.useEffect(() => {
    const ids = new Set([...systemViews, ...customViews].map(v => v.id));
    if (!ids.has(activeView)) setActiveView(systemViews[0]?.id || "my");
  }, [role]);
  const [mode, setMode]         = useState("list");   // list | add
  const [addType, setAddType]   = useState("Lead");   // Lead | Network — chosen via the Add button
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importType, setImportType] = useState("Lead");   // Lead | Network — chosen via the Import button
  const [importMenuOpen, setImportMenuOpen] = useState(false);
  const startAdd = (type) => { setAddType(type); setAddMenuOpen(false); setMode("add"); };
  const startImport = (type) => { setImportType(type); setImportMenuOpen(false); setShowImport(true); };

  // Consume a one-shot action requested by the caller (e.g. a dashboard's
  // "Add Lead" / "Import Network" buttons) so they behave like this page's own
  // buttons. The action encodes the chosen type: "add:Lead" / "import:Network".
  // SA can create Leads only, so any type is clamped to Lead for that role.
  React.useEffect(() => {
    if (!initialAction) return;
    const [act, rawType] = String(initialAction).split(":");
    const type = (role === "superadmin" || role === "manager") ? "Lead" : (rawType || "Lead");
    if (act === "add")    { setAddType(type); setMode("add"); }
    if (act === "import") { setImportType(type); setShowImport(true); }
    clearInitialAction && clearInitialAction();
  }, []);
  const [showBulk, setShowBulk]     = useState(false);   // Send Bulk Email modal
  const [showAssign, setShowAssign] = useState(false);   // Bulk Assign modal
  const [showTakeOver, setShowTakeOver] = useState(false); // VD Take Over modal
  const [editView, setEditView]     = useState(null);    // view being edited / added
  const [selected, setSelected]     = useState(() => new Set());

  // filters (live) — generic map keyed by column
  const [filters, setFilters] = useState({});
  const setF = (k, v) => setFilters(prev => ({ ...prev, [k]: v }));
  const resetFilters = () => setFilters({});

  const view = views.find(v => v.id === activeView) || views[0];
  const cols = view.columns;

  // Bulk assign is available for SA on Assigned+Unassigned, VD on Assigned+Pending
  const bulkAssignViews = role === "superadmin" ? ["assigned","pending"]
    : role === "vd" ? ["assigned","pendingA"] : [];
  const showBulkAssignBtn = bulkAssignViews.includes(activeView);

  // My Leads view: the current advisor's own assigned leads (raw records so the
  // processing/next-step columns have status + attempts available).
  const advisorName = role === "vd" ? "Thomas Müller" : "Anna Klein";
  // Current user's display name — used both for self-assignment and for the
  // "assigned to me" system-view filters.
  const currentUserName = role === "vd" ? "Thomas Müller" : role === "gp" ? "Anna Klein" : "Super Admin";
  const viewFilters = useMemo(() => makeViewFilters(currentUserName), [currentUserName]);
  const myLeadsData = useMemo(
    // Converted leads have moved to My Network — drop them from My Leads.
    () => ALL_LEADS.filter(l => l.assignedGP === advisorName && getLeadState(l.id).lifecycle !== "Network"),
    [advisorName]
  );

  const counts = useMemo(() => Object.fromEntries(
    views.map(v => [v.id, contacts.filter(viewFilters[v.filter] || (() => true)).length])
  ), [views, contacts, viewFilters]);

  const rows = useMemo(() => {
    const base = contacts.filter(viewFilters[view.filter] || (() => true));
    return base.filter(c => Object.entries(filters).every(([k, val]) => {
      if (!val) return true;
      const ft = COLUMNS[k]?.filter;
      const cell = (c[k] ?? "").toString();
      if (ft === "status" || ft === "ownership") return c[k] === val;
      if (ft === "date") return cell.includes(val.replace(/-/g, "/"));
      return cell.toLowerCase().replace(/\s/g, "").includes(val.toString().toLowerCase().replace(/\s/g, ""));
    }));
  }, [contacts, view, filters, viewFilters]);

  const allChecked = rows.length > 0 && rows.every(r => selected.has(r.id));
  const toggleAll = () => setSelected(prev => {
    const next = new Set(prev);
    if (allChecked) rows.forEach(r => next.delete(r.id)); else rows.forEach(r => next.add(r.id));
    return next;
  });
  const toggleOne = (id) => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const addContact = (f) => {
    // Creation scenario matrix: SA Add Lead → Company / Unassigned; VD & GP add
    // Leads and Networks as User-owned and self-assigned. Network is always
    // User-owned (SA cannot create Network — enforced by the Add Contact form).
    const isNetwork = f.lifecycle === "Network";
    const ownership = (!isNetwork && role === "superadmin") ? "Company" : "User";
    const assignee  = (role === "superadmin" && !isNetwork) ? "Unassigned" : currentUserName;
    const outcome   = isNetwork ? (Array.isArray(f.outcome) ? f.outcome : []) : [];
    const stageStatus = isNetwork ? networkOutcomeLabel(outcome) : f.stageStatus;
    setContacts(prev => [{
      id: `NEW-${Date.now()}`, first: f.first, last: f.last, firstName: f.first, lastName: f.last, name: `${f.first} ${f.last}`.trim(),
      lifecycle: f.lifecycle, stageStatus, outcome,
      // Created directly by a user (never a lead) → the editable "Overview" tab.
      wasLead: false,
      ownership, isCompanyOwned: ownership === "Company",
      tone: isNetwork
          ? (outcome.includes("Customer") ? C.green : outcome.includes("Partner") ? C.indigo : C.slate)
          : f.stageStatus === "New" || f.stageStatus === "Appointment" || f.stageStatus === "Closed" ? C.green
          : f.stageStatus === "Not Interested" || f.stageStatus === "Do Not Contact" ? null : C.slate,
      phone: f.phone || "—", email: f.email || "—", primaryEmail: f.email || "—",
      campaign: f.campaign || "—", dob: f.dob || "—",
      website: "—", assignee, create: "Today",
      registration: "—", linkedin: "—", accountSource: f.source || "—", assigned: assignee !== "Unassigned", gdpr: false,
    }, ...prev]);
  };

  const applyView = (next) => {
    if (customViews.some(v => v.id === next.id)) setCustomViews(prev => prev.map(v => v.id === next.id ? next : v));
    else { setCustomViews(prev => [...prev, next]); setActiveView(next.id); }
    setEditView(null);
  };
  const deleteView = () => {
    const current = views.find(v => v.id === activeView);
    if (!current || current.system || customViews.length === 0) return;
    setCustomViews(prev => prev.filter(v => v.id !== activeView));
    setActiveView(systemViews[0]?.id || "my");
  };

  // ── Add Contact full page ───────────────────────────────────────────────────
  if (mode === "add") {
    return <AddContactPage role={role} contactType={addType} onCancel={() => setMode("list")} onSave={addContact} />;
  }

  const PLACEHOLDER = { firstName: "First name", lastName: "Last name", primaryEmail: "Email", campaign: "Campaign", phone: "Phone number", name: "Contact", email: "Email" };
  const filterCell = (key) => {
    const ft = COLUMNS[key].filter;
    const val = filters[key] || "";
    const base = { ...fieldStyle, padding: "7px 10px", fontSize: 12 };
    if (ft === "status") return (
      <select value={val} onChange={e => setF(key, e.target.value)} style={{ ...base, color: val ? C.text : C.muted }}>
        <option value="">Select status</option>{STATUS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    );
    if (ft === "ownership") return (
      <select value={val} onChange={e => setF(key, e.target.value)} style={{ ...base, color: val ? C.text : C.muted }}>
        <option value="">Select ownership</option>{OWNERSHIP_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    );
    if (ft === "date") return <input type="date" value={val} onChange={e => setF(key, e.target.value)} style={{ ...base, color: val ? C.text : C.muted }} />;
    if (ft === "text") return <input value={val} onChange={e => setF(key, e.target.value)} placeholder={PLACEHOLDER[key] || COLUMNS[key].label} style={base} />;
    return null;
  };

  return (
    <div style={{ padding: "24px 28px", fontFamily: "inherit" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: C.navy, letterSpacing: "-0.02em" }}>{t("contactList")}</h1>
        <div style={{ display: "flex", gap: 10 }}>
          {/* SA imports Company Leads only; VD/GP choose Lead or Network. */}
          {role === "superadmin" ? (
            <button onClick={() => startImport("Lead")} style={{ padding: "9px 16px", borderRadius: 8, border: `1px solid ${C.primary}`, background: "#fff", color: C.primaryDark, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>⬇ {t("importLead")}</button>
          ) : (
            <div style={{ position: "relative" }}>
              <button onClick={() => setImportMenuOpen(o => !o)} style={{ padding: "9px 16px", borderRadius: 8, border: `1px solid ${C.primary}`, background: "#fff", color: C.primaryDark, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>⬇ {t("import")} <span style={{ fontSize: 10 }}>▾</span></button>
              {importMenuOpen && (
                <>
                  <div onClick={() => setImportMenuOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 250 }} />
                  <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 260, background: "#fff", borderRadius: 10, boxShadow: "0 12px 36px rgba(0,0,0,0.16)", border: `1px solid ${C.border}`, minWidth: 180, padding: "6px 0" }}>
                    {[["Lead", t("importLead")], ["Network", t("importNetwork")]].map(([type, label]) => (
                      <div key={type} onClick={() => startImport(type)}
                        style={{ padding: "10px 16px", fontSize: 13, fontWeight: 600, color: C.text, cursor: "pointer" }}
                        onMouseEnter={e => e.currentTarget.style.background = "#F8FAFC"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        {label}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
          {/* SA can add Company Leads only; VD/GP choose Lead or Network. */}
          {role === "superadmin" ? (
            <button onClick={() => startAdd("Lead")} style={{ padding: "9px 18px", borderRadius: 8, border: "none", background: C.primary, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>{t("addLead")}</button>
          ) : (
            <div style={{ position: "relative" }}>
              <button onClick={() => setAddMenuOpen(o => !o)} style={{ padding: "9px 18px", borderRadius: 8, border: "none", background: C.primary, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                {t("addContact")} <span style={{ fontSize: 10 }}>▾</span>
              </button>
              {addMenuOpen && (
                <>
                  <div onClick={() => setAddMenuOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 250 }} />
                  <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 260, background: "#fff", borderRadius: 10, boxShadow: "0 12px 36px rgba(0,0,0,0.16)", border: `1px solid ${C.border}`, minWidth: 180, padding: "6px 0" }}>
                    {[["Lead", t("addLead")], ["Network", t("addNetwork")]].map(([type, label]) => (
                      <div key={type} onClick={() => startAdd(type)}
                        style={{ padding: "10px 16px", fontSize: 13, fontWeight: 600, color: C.text, cursor: "pointer" }}
                        onMouseEnter={e => e.currentTarget.style.background = "#F8FAFC"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        {label}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* View selector row */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <ViewSelector views={views} activeId={activeView} counts={counts} role={role}
          onSelect={setActiveView}
          onAddView={() => setEditView({ id: `v-${Date.now()}`, name: "", filter: "all", columns: DEFAULT_COLS })} />
        <IconBtn title="Edit view" onClick={() => setEditView(view)}>✎</IconBtn>
        <IconBtn title="Delete view" onClick={deleteView}>🗑</IconBtn>
        <IconBtn title="Export view">⬆</IconBtn>
        <IconBtn title="Send bulk email" active={selected.size > 0}
          onClick={() => { if (selected.size > 0) setShowBulk(true); }}>✉</IconBtn>
        {showBulkAssignBtn && (
          <IconBtn title="Bulk assign" active={selected.size > 0}
            onClick={() => { if (selected.size > 0) setShowAssign(true); }}>👤</IconBtn>
        )}
        {role === "vd" && activeView === "pendingA" && (
          <button title={t("takeOver")} onClick={() => { if (selected.size > 0) setShowTakeOver(true); }}
            style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${C.navy}`,
              background: selected.size > 0 ? C.navy : "#fff", color: selected.size > 0 ? "#fff" : C.navy,
              fontSize: 13, fontWeight: 700, cursor: selected.size > 0 ? "pointer" : "default", fontFamily: "inherit" }}>
            {t("takeOver")}
          </button>
        )}
        {selected.size > 0 && <span style={{ marginLeft: 8, fontSize: 12, color: C.slate, fontWeight: 600 }}>{selected.size} selected</span>}
      </div>

      {/* Table */}
      {activeView === "myleads" ? (
        <MyLeadsView leads={myLeadsData} navigateTo={navigateTo} t={t} />
      ) : (
      <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: C.light, borderBottom: `1px solid ${C.border}` }}>
                <th style={{ padding: "12px 16px", width: 44 }}>
                  {<input type="checkbox" checked={allChecked} onChange={toggleAll} style={{ width: 15, height: 15, accentColor: C.primary, cursor: "pointer" }} />}
                </th>
                {cols.map(k => {
                  const COL_KEY_MAP: Record<string, string> = {
                    name: "name", firstName: "firstName", lastName: "lastName",
                    primaryEmail: "primaryEmail", campaign: "campaign", dob: "dob",
                    email: "email", phone: "phone", gender: "gender",
                    nationality: "nationality", assignee: "assignee",
                    lifecycle: "lifecycleStage", stageStatus: "stageStatus",
                    feedback: "feedbackStatusCol", lastActivity: "lastActivityCol",
                    create: "createDate", registration: "registrationNumber",
                    linkedin: "linkedIn", accountSource: "accountSource",
                    website: "website",
                  };
                  const colLabel = COL_KEY_MAP[k] ? t(COL_KEY_MAP[k] as any) : COLUMNS[k].label;
                  return (
                    <th key={k} style={{ padding: "12px 16px", textAlign: "left", fontSize: 13, fontWeight: 600, color: C.slate, whiteSpace: "nowrap" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>{colLabel} <SortArrows /></span>
                    </th>
                  );
                })}
              </tr>
              {/* Filter row */}
              <tr style={{ background: "#fff", borderBottom: `1px solid ${C.border}` }}>
                <td />
                {cols.map((k, i) => (
                  <td key={k} style={{ padding: "8px 16px" }}>
                    {i === cols.length - 1 ? (
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        {filterCell(k)}
                        <IconBtn title="Apply filters">✓</IconBtn>
                        <IconBtn title="Reset filters" onClick={resetFilters}>↺</IconBtn>
                      </div>
                    ) : filterCell(k)}
                  </td>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={cols.length + 1} style={{ padding: "40px", textAlign: "center", color: C.muted, fontSize: 13 }}>No contacts match your filters.</td></tr>
              )}
              {rows.map(c => (
                <tr key={c.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ padding: "14px 16px" }}>
                    {<input type="checkbox" checked={selected.has(c.id)} onChange={() => toggleOne(c.id)} style={{ width: 15, height: 15, accentColor: C.primary, cursor: "pointer" }} />}
                  </td>
                  {cols.map(k => {
                    const isLink = (k === "name" || k === LINK_COL);   // Name links to detail on every view
                    return (
                    <td key={k} style={{ padding: "14px 16px", cursor: isLink ? "pointer" : "default" }}
                      onClick={isLink ? () => navigateTo("LeadDetail", ALL_LEADS.find(l => l.id === c.id) || { id: c.id, name: c.name, email: c.email, phone: c.phone, outcome: c.outcome, stageStatus: c.stageStatus, lifecycle: c.lifecycle, wasLead: c.wasLead }, activeView) : undefined}>
                      {renderCell(k, c, isLink)}
                    </td>);
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: "12px 16px", borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 12, color: C.muted }}>Showing {rows.length} of {counts[activeView] ?? contacts.length} contacts</span>
          <div style={{ display: "flex", gap: 5 }}>
            {["←", "1", "2", "3", "→"].map(p => (
              <button key={p} style={{ padding: "5px 11px", borderRadius: 7, border: p === "1" ? "none" : `1px solid ${C.border}`, background: p === "1" ? C.primary : "#fff", color: p === "1" ? "#fff" : C.slate, fontSize: 12, cursor: "pointer" }}>{p}</button>
            ))}
          </div>
        </div>
      </div>
      )}

      {showImport && <ImportContactsModal onClose={() => setShowImport(false)} role={role} importType={importType} />}
      {showBulk && <SendBulkEmailModal contacts={contacts.filter(c => selected.has(c.id))} onClose={() => setShowBulk(false)} />}
      {editView && <EditViewModal view={editView} onClose={() => setEditView(null)} onApply={applyView} />}
      {showAssign && <BulkAssignModal contacts={contacts.filter(c => selected.has(c.id))} onClose={() => setShowAssign(false)} onAssign={() => { setSelected(new Set()); }} />}
      {showTakeOver && (
        <TakeOverModal
          contacts={contacts.filter(c => selected.has(c.id))}
          vdName="Thomas Müller" t={t}
          onClose={() => setShowTakeOver(false)}
          onTakeOver={(ids, vdName) => {
            setContacts(prev => prev.map(c => ids.includes(c.id) ? { ...c, assignee: vdName, assigned: true } : c));
            setSelected(new Set());
          }} />
      )}
    </div>
  );
};
