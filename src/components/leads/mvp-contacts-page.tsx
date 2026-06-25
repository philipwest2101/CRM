import React, { useState, useMemo, useRef } from "react";
import { ALL_LEADS } from "../../lib/core";
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
        <div style={{ position: "absolute", bottom: "calc(100% + 5px)", left: "50%", transform: "translateX(-50%)", background: C.navy, color: "#fff", fontSize: 11, lineHeight: 1.4, padding: "6px 10px", borderRadius: 8, whiteSpace: "nowrap", maxWidth: 240, zIndex: 999, boxShadow: "0 4px 16px rgba(0,0,0,0.2)", pointerEvents: "none" }}>
          {text}
        </div>
      )}
    </span>
  );
};

// Tooltip text per system view id
const VIEW_TIPS = {
  my:       "All contacts in your personal network.",
  pending:  "Leads not yet assigned to any consultant. Requires immediate action.",
  myleads:  "Contacts currently assigned to you as active leads.",
  pendingA: "Contacts awaiting assignment to a consultant.",
};

// ─────────────────────────────────────────────────────────────────────────────
// MVP CONTACTS PAGE
// Import-first Contact List (the MVP counterpart to the rich "Full" view):
//  · multi-view selector with per-view column configuration (Edit View)
//  · sortable/filterable, column-driven table
//  · multi-step Import wizard
//  · full tabbed Add Contact page
// ─────────────────────────────────────────────────────────────────────────────

// ── status → lifecycle / stage mapping ───────────────────────────────────────
const LIFECYCLE = {
  open:        { stage: "Lead",        status: "New",   tone: C.green },
  in_progress: { stage: "Lead",        status: "To Do", tone: C.slate },
  attempted:   { stage: "Lead",        status: "To Do", tone: C.slate },
  not_reached: { stage: "Lead",        status: "To Do", tone: C.slate },
  followup:    { stage: "Lead",        status: "To Do", tone: C.slate },
  appointment: { stage: "Opportunity", status: "New",   tone: C.green },
  closed:      { stage: "Customer",    status: "Won",   tone: C.green },
  no_interest: { stage: "N/A",         status: "N/A",   tone: null    },
  dnc:         { stage: "N/A",         status: "N/A",   tone: null    },
};

const LIFECYCLE_OPTIONS = ["Lead", "Opportunity", "Customer", "N/A"];
const STATUS_OPTIONS     = ["New", "To Do", "Won", "N/A"];

// deterministic DOB from id so the column has plausible values
const synthDob = (id) => {
  let h = 0; for (const ch of String(id)) h = (h * 31 + ch.charCodeAt(0)) & 0xffff;
  const y = 1960 + (h % 45), m = 1 + (h % 12), d = 1 + (h % 28);
  return `${y}/${String(m).padStart(2, "0")}/${String(d).padStart(2, "0")}`;
};

const toContact = (l) => {
  const [first, ...rest] = l.name.split(" ");
  const last = rest.join(" ");
  const lc = LIFECYCLE[l.status] || LIFECYCLE.no_interest;
  return {
    id: l.id, first, last, firstName: first, lastName: last, name: l.name,
    lifecycle: lc.stage, stageStatus: lc.status, tone: lc.tone,
    phone: l.phone, email: l.email, primaryEmail: l.email,
    campaign: l.campaign || "—",
    dob: synthDob(l.id),
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
  phone:         { label: "Phone Number",        locked: false, filter: "text",      group: "Main Information" },
  website:       { label: "Website",             locked: false, filter: null,        group: "Main Information" },
  assignee:      { label: "Assignee",            locked: false, filter: null,        group: "Main Information" },
  lifecycle:     { label: "Lifecycle Stage",     locked: false, filter: "lifecycle", group: "Main Information" },
  stageStatus:   { label: "Stage Status",        locked: false, filter: "status",    group: "Main Information" },
  create:        { label: "Create Date",         locked: false, filter: null,        group: "Main Information" },
  registration:  { label: "Registration Number", locked: false, filter: null,        group: "Main Information" },
  linkedin:      { label: "LinkedIn",            locked: false, filter: null,        group: "Main Information" },
  accountSource: { label: "Account Source",      locked: false, filter: null,        group: "Main Information" },
};
const COLUMN_KEYS = Object.keys(COLUMNS);
const DEFAULT_COLS = ["name", "primaryEmail", "campaign", "dob"];
const LINK_COL = "name";   // frozen Name column links to contact detail

const VIEW_FILTERS = {
  all:     () => true,
  pending: (c) => !c.assigned,
  custom1: (c) => c.lifecycle === "Lead",
  custom2: (c) => c.lifecycle === "Opportunity",
  // alias keys used by some system views
  myleads: (c) => c.lifecycle === "Lead",
};

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

const renderCell = (key, c) => {
  if (key === "name" || key === LINK_COL) return <span style={{ fontSize: 13, fontWeight: 500, color: C.navy, textDecoration: "underline", textUnderlineOffset: 2 }}>{c[key]}</span>;
  if (key === "lifecycle")   return <span style={{ fontSize: 13, color: c.lifecycle === "N/A" ? C.muted : C.text }}>{c.lifecycle}</span>;
  if (key === "stageStatus") return <StagePill label={c.stageStatus} tone={c.tone} />;
  return <span style={{ fontSize: 13, color: C.slate }}>{c[key] ?? "—"}</span>;
};

const IconBtn = ({ title, onClick, active, children }) => (
  <button title={title} onClick={onClick} style={{
    width: 34, height: 34, borderRadius: 8, border: `1px solid ${C.border}`,
    background: active ? C.primarySoft : "#fff", color: active ? C.primaryDark : C.slate,
    cursor: "pointer", display: "grid", placeItems: "center", fontSize: 15,
  }}>{children}</button>
);

const SortArrows = () => (
  <span style={{ display: "inline-flex", flexDirection: "column", lineHeight: 0.6, fontSize: 9, color: C.muted }}>
    <span>▲</span><span>▼</span>
  </span>
);

// ─────────────────────────────────────────────────────────────────────────────
// VIEW SELECTOR (dropdown)
// ─────────────────────────────────────────────────────────────────────────────
const ViewSelector = ({ views, activeId, counts, onSelect, onAddView }) => {
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
            <div style={{ padding: "4px 16px 4px", fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>System Views</div>
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
                <div style={{ padding: "4px 16px 4px", fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>Custom Views</div>
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
                <span style={{ fontSize: 14 }}>＋</span> Add View
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
const ImportContactsModal = ({ onClose }) => {
  const [step, setStep]       = useState("source");
  const [progress, setProgress] = useState(0);
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
        <Header title="Import Contacts" />
        <div style={{ fontSize: 13, color: C.slate, marginBottom: 14 }}>Choose a source</div>
        <div style={{ display: "flex", gap: 16 }}>
          <SourceCard icon="📗" title="CSV or Excel File" sub="Max size: 5 MB" hint="Upload a file to continue" onClick={() => setStep("upload")} />
          <SourceCard icon="📄" title="Google Sheets" sub="Google authorization needed" hint="Paste a Google Sheets link" onClick={() => setStep("upload")} />
        </div>
      </Overlay>
    );
  }
  if (step === "upload") {
    return (
      <Overlay width={580}>
        <Header title="Import Contacts" back={() => setStep("source")} />
        <div style={{ background: C.primarySoft, border: `1px solid ${C.primary}33`, borderRadius: 12, padding: "14px 16px", marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.navy }}>Import Rules &amp; Requirements</div>
            <button style={{ background: "none", border: "none", cursor: "pointer", color: C.primaryDark, fontSize: 12, fontWeight: 700 }}>⬇ Download Template</button>
          </div>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: C.slate, lineHeight: 1.7 }}>
            <li>Supported formats: CSV, XLS, XLSX, and Google Sheets. Max size: 5 MB.</li>
            <li>Use the provided template and do not modify the original column headers.</li>
            <li>Email addresses must follow a valid format; duplicates won't be checked.</li>
            <li>Dropdown values (e.g., Gender) must match the predefined options.</li>
            <li>Date fields must use the format YYYY-MM-DD.</li>
            <li>First Name and Last Name are required.</li>
          </ul>
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.navy, marginBottom: 8 }}>Upload your CSV or Excel file</div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", border: `1px solid ${C.border}`, borderRadius: 12, marginBottom: 18 }}>
          <span style={{ fontSize: 22 }}>📗</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.navy }}>File name.xlsx</div>
            <div style={{ fontSize: 11, color: C.muted }}>123 KB</div>
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, color: C.green, display: "flex", alignItems: "center", gap: 5 }}>✓ Ready to Import</span>
          <button onClick={() => setStep("source")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: C.muted }}>×</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 8 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: C.navy, display: "block", marginBottom: 6 }}>Worksheet *</label>
            <select style={fieldStyle} defaultValue="Worksheet_1"><option>Worksheet_1</option><option>Worksheet_2</option></select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: C.navy, display: "block", marginBottom: 6 }}>Contacts View *</label>
            <select style={fieldStyle} defaultValue=""><option value="" disabled>Select Contacts View</option><option>My Contacts</option><option>All Contacts</option></select>
          </div>
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

const AddContactPage = ({ onCancel, onSave }) => {
  const [tab, setTab] = useState("Basic");
  const [f, setF] = useState({
    first: "", last: "", email: "", phone: "", lifecycle: "Lead", stageStatus: "New",
    assignee: "", product: "", productProvider: "", source: "", campaign: "",
    gdprConsent: false, newsletter: false,
    salutation: "", dob: "", gender: "", nationality: "", language: "",
    street: "", houseNo: "", zip: "", city: "", country: "",
    company: "", employment: "", position: "", companySize: "", decisionRole: "None", industry: "",
    income: "", netWorth: "", risk: "", horizon: "",
    notes: "",
  });
  const set = (k) => (e) => setF(prev => ({ ...prev, [k]: e.target.value }));
  const valid = f.first.trim() && f.last.trim();

  const reset = () => setF(prev => Object.fromEntries(Object.keys(prev).map(k => [k,
    k === "lifecycle" ? "Lead" : k === "stageStatus" ? "New" : k === "decisionRole" ? "None" :
    k === "gdprConsent" || k === "newsletter" ? false : ""])));

  const Grid = ({ children, cols = 2 }) => (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 18 }}>{children}</div>
  );

  return (
    <div style={{ padding: "20px 28px 0", fontFamily: "inherit" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 18 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: C.navy, letterSpacing: "-0.02em" }}>Add Contact</h1>
        <span style={{ fontSize: 13, color: C.muted }}>Contacts . Add Contact</span>
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
            <Field label="Lifecycle Stage"><Select value={f.lifecycle} onChange={set("lifecycle")}>{LIFECYCLE_OPTIONS.map(o => <option key={o}>{o}</option>)}</Select></Field>
            <Field label="Stage Status"><Select value={f.stageStatus} onChange={set("stageStatus")}>{STATUS_OPTIONS.map(o => <option key={o}>{o}</option>)}</Select></Field>
          </Grid>
          <Grid>
            <Field label="Product"><TextInput value={f.product} onChange={set("product")} placeholder="Product name" /></Field>
            <Field label="Product Provider"><TextInput value={f.productProvider} onChange={set("productProvider")} placeholder="Provider" /></Field>
          </Grid>
          <Grid>
            <Field label="Lead Source"><TextInput value={f.source} onChange={set("source")} placeholder="e.g. Referral" /></Field>
            <Field label="Campaign Assignment"><TextInput value={f.campaign} onChange={set("campaign")} placeholder="Campaign" /></Field>
          </Grid>
          <Grid>
            <Field label="Communication Consent (GDPR)">
              <div style={{ display: "flex", gap: 20, paddingTop: 4 }}>
                {[["Yes", true], ["No", false]].map(([label, val]) => (
                  <label key={label} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14, color: C.text }}>
                    <input type="radio" name="gdpr" checked={f.gdprConsent === val} onChange={() => setF(p => ({ ...p, gdprConsent: val }))} style={{ accentColor: C.primary, width: 15, height: 15 }} />
                    {label}
                  </label>
                ))}
              </div>
            </Field>
            <Field label="Newsletter Subscription">
              <div style={{ display: "flex", gap: 20, paddingTop: 4 }}>
                {[["Subscribed", true], ["Not subscribed", false]].map(([label, val]) => (
                  <label key={label} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14, color: C.text }}>
                    <input type="radio" name="newsletter" checked={f.newsletter === val} onChange={() => setF(p => ({ ...p, newsletter: val }))} style={{ accentColor: C.primary, width: 15, height: 15 }} />
                    {label}
                  </label>
                ))}
              </div>
            </Field>
          </Grid>
        </>)}

        {tab === "Personal" && (<>
          <Grid>
            <Field label="Salutation"><Select value={f.salutation} onChange={set("salutation")}><option value="">Select Salutation</option><option>Mr.</option><option>Ms.</option><option>Dr.</option></Select></Field>
            <Field label="Date of Birth"><TextInput type="date" value={f.dob} onChange={set("dob")} /></Field>
          </Grid>
          <Grid>
            <Field label="Gender"><Select value={f.gender} onChange={set("gender")}><option value="">Select Gender</option><option>Male</option><option>Female</option><option>Other</option></Select></Field>
            <Field label="Nationality"><TextInput value={f.nationality} onChange={set("nationality")} placeholder="Nationality" /></Field>
          </Grid>
          <Field label="Preferred Language"><Select value={f.language} onChange={set("language")}><option value="">Select Language</option><option>German</option><option>English</option><option>French</option><option>Czech</option></Select></Field>
        </>)}

        {tab === "Address" && (<>
          <Grid cols={3}>
            <div style={{ gridColumn: "span 2" }}><Field label="Street"><TextInput value={f.street} onChange={set("street")} placeholder="Street" /></Field></div>
            <Field label="House No."><TextInput value={f.houseNo} onChange={set("houseNo")} placeholder="No." /></Field>
          </Grid>
          <Grid cols={3}>
            <Field label="ZIP"><TextInput value={f.zip} onChange={set("zip")} placeholder="ZIP" /></Field>
            <Field label="City"><TextInput value={f.city} onChange={set("city")} placeholder="City" /></Field>
            <Field label="Country"><TextInput value={f.country} onChange={set("country")} placeholder="Country" /></Field>
          </Grid>
        </>)}

        {tab === "Business" && (<>
          <Field label="Company"><TextInput value={f.company} onChange={set("company")} placeholder="Company" /></Field>
          <Grid>
            <Field label="Employment Type"><Select value={f.employment} onChange={set("employment")}><option value="">Select Employment Type</option><option>Employed</option><option>Self-employed</option><option>Business Owner</option><option>Retired</option></Select></Field>
            <Field label="Position"><Select value={f.position} onChange={set("position")}><option value="">Select Position</option><option>Manager</option><option>Director</option><option>C-Level</option><option>Staff</option></Select></Field>
          </Grid>
          <Field label="Company Size"><Select value={f.companySize} onChange={set("companySize")}><option value="">Select Company Size</option><option>1–10</option><option>11–50</option><option>51–200</option><option>200+</option></Select></Field>
          <Field label="Decision Making Role">
            <div style={{ display: "flex", gap: 40, paddingTop: 4 }}>
              {["None", "Decision Maker", "Influencer", "End User"].map(r => (
                <label key={r} style={{ display: "flex", alignItems: "center", gap: 9, cursor: "pointer", fontSize: 14, color: C.text }}>
                  <input type="radio" name="decisionRole" checked={f.decisionRole === r} onChange={() => setF(prev => ({ ...prev, decisionRole: r }))} style={{ accentColor: C.primary, width: 16, height: 16 }} />
                  {r}
                </label>
              ))}
            </div>
          </Field>
          <Field label="Industry"><TextInput value={f.industry} onChange={set("industry")} placeholder="Industry" /></Field>
        </>)}

        {tab === "Financial" && (<>
          <Grid>
            <Field label="Annual Income"><TextInput value={f.income} onChange={set("income")} placeholder="€ —" /></Field>
            <Field label="Net Worth"><TextInput value={f.netWorth} onChange={set("netWorth")} placeholder="€ —" /></Field>
          </Grid>
          <Grid>
            <Field label="Risk Appetite"><Select value={f.risk} onChange={set("risk")}><option value="">Select Risk Appetite</option><option>Conservative</option><option>Balanced</option><option>Growth</option><option>Aggressive</option></Select></Field>
            <Field label="Investment Horizon"><Select value={f.horizon} onChange={set("horizon")}><option value="">Select Horizon</option><option>Short (&lt; 3y)</option><option>Medium (3–7y)</option><option>Long (7y+)</option></Select></Field>
          </Grid>
        </>)}

      </div>

      {/* Footer */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 0 24px" }}>
        <button onClick={onCancel} style={{ padding: "10px 8px", background: "none", border: "none", color: C.slate, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
        <div style={{ display: "flex", gap: 12 }}>
          <button disabled={!valid} onClick={() => { onSave(f); reset(); setTab("Basic"); }}
            style={{ padding: "11px 22px", borderRadius: 9, border: "none", background: valid ? C.primarySoft : C.light, color: valid ? C.primaryDark : C.muted, fontSize: 14, fontWeight: 700, cursor: valid ? "pointer" : "default" }}>Save &amp; New</button>
          <button disabled={!valid} onClick={() => { onSave(f); onCancel(); }}
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
          <span style={{ fontSize: 13, color: C.muted, width: 80 }}>Attachements</span>
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
        <div>
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
                <div style={{ fontSize: 12, color: C.muted, marginTop: 1 }}>{h.recipients} recipients · {h.date}</div>
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
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
// Build role-specific system views. System views cannot be deleted.
const getSystemViews = (role) => {
  const myNetwork    = { id: "my",      name: "My Network",          filter: "all",     columns: DEFAULT_COLS, system: true };
  const unassigned   = { id: "pending", name: "Unassigned Leads",    filter: "pending", columns: ["name", "lifecycle", "stageStatus", "campaign", "assignee"], system: true };
  const myLeads      = { id: "myleads", name: "My Leads",            filter: "custom1", columns: ["name", "primaryEmail", "lifecycle", "stageStatus", "campaign"], system: true };
  const pendingAssign= { id: "pendingA",name: "Pending Assignments", filter: "pending", columns: ["name", "lifecycle", "stageStatus", "assignee", "create"], system: true };

  if (role === "superadmin") return [myNetwork, unassigned];
  if (role === "vd")         return [myNetwork, myLeads, pendingAssign];
  // gp
  return [myNetwork, myLeads];
};

const CUSTOM_VIEWS = [
  { id: "cv1", name: "Custom View 1", filter: "custom1", columns: ["name", "email", "phone", "stageStatus"] },
  { id: "cv2", name: "Custom View 2", filter: "custom2", columns: ["name", "lifecycle", "accountSource", "create"] },
];

export const MVPContactsPage = ({ navigateTo, role }) => {
  const t = useT();
  const [contacts, setContacts] = useState(() => ALL_LEADS.map(toContact));
  const [views, setViews]       = useState(() => [...getSystemViews(role), ...CUSTOM_VIEWS]);
  const [activeView, setActiveView] = useState(() => getSystemViews(role)[0]?.id || "my");
  const [mode, setMode]         = useState("list");   // list | add
  const [showImport, setShowImport] = useState(false);
  const [showBulk, setShowBulk] = useState(false);    // Send Bulk Email modal
  const [editView, setEditView] = useState(null);     // view being edited / added
  const [selected, setSelected] = useState(() => new Set());

  // filters (live) — generic map keyed by column
  const [filters, setFilters] = useState({});
  const setF = (k, v) => setFilters(prev => ({ ...prev, [k]: v }));
  const resetFilters = () => setFilters({});

  const view = views.find(v => v.id === activeView) || views[0];
  const cols = view.columns;

  const counts = useMemo(() => Object.fromEntries(
    views.map(v => [v.id, contacts.filter(VIEW_FILTERS[v.filter] || (() => true)).length])
  ), [views, contacts]);

  const rows = useMemo(() => {
    const base = contacts.filter(VIEW_FILTERS[view.filter] || (() => true));
    return base.filter(c => Object.entries(filters).every(([k, val]) => {
      if (!val) return true;
      const ft = COLUMNS[k]?.filter;
      const cell = (c[k] ?? "").toString();
      if (ft === "lifecycle" || ft === "status") return c[k] === val;
      if (ft === "date") return cell.includes(val.replace(/-/g, "/"));
      return cell.toLowerCase().replace(/\s/g, "").includes(val.toString().toLowerCase().replace(/\s/g, ""));
    }));
  }, [contacts, view, filters]);

  const allChecked = rows.length > 0 && rows.every(r => selected.has(r.id));
  const toggleAll = () => setSelected(prev => {
    const next = new Set(prev);
    if (allChecked) rows.forEach(r => next.delete(r.id)); else rows.forEach(r => next.add(r.id));
    return next;
  });
  const toggleOne = (id) => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const addContact = (f) => {
    setContacts(prev => [{
      id: `NEW-${Date.now()}`, first: f.first, last: f.last, firstName: f.first, lastName: f.last, name: `${f.first} ${f.last}`.trim(),
      lifecycle: f.lifecycle, stageStatus: f.stageStatus,
      tone: f.stageStatus === "Won" || f.stageStatus === "New" ? C.green : f.stageStatus === "N/A" ? null : C.slate,
      phone: f.phone || "—", email: f.email || "—", primaryEmail: f.email || "—",
      campaign: f.campaign || "—", dob: f.dob || "—",
      website: "—", assignee: "Unassigned", create: "Today",
      registration: "—", linkedin: "—", accountSource: f.source || "—", assigned: false, gdpr: false,
    }, ...prev]);
  };

  const applyView = (next) => {
    if (views.some(v => v.id === next.id)) setViews(prev => prev.map(v => v.id === next.id ? next : v));
    else { setViews(prev => [...prev, next]); setActiveView(next.id); }
    setEditView(null);
  };
  const deleteView = () => {
    const current = views.find(v => v.id === activeView);
    if (!current || current.system || views.length <= 1) return;
    setViews(prev => prev.filter(v => v.id !== activeView));
    setActiveView(views[0].id === activeView ? views[1].id : views[0].id);
  };

  // ── Add Contact full page ───────────────────────────────────────────────────
  if (mode === "add") {
    return <AddContactPage onCancel={() => setMode("list")} onSave={addContact} />;
  }

  const PLACEHOLDER = { firstName: "First name", lastName: "Last name", primaryEmail: "Email", campaign: "Campaign", phone: "Phone number", name: "Contact", email: "Email" };
  const filterCell = (key) => {
    const ft = COLUMNS[key].filter;
    const val = filters[key] || "";
    const base = { ...fieldStyle, padding: "7px 10px", fontSize: 12 };
    if (ft === "lifecycle") return (
      <select value={val} onChange={e => setF(key, e.target.value)} style={{ ...base, color: val ? C.text : C.muted }}>
        <option value="">Select lifecycle...</option>{LIFECYCLE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    );
    if (ft === "status") return (
      <select value={val} onChange={e => setF(key, e.target.value)} style={{ ...base, color: val ? C.text : C.muted }}>
        <option value="">Select status</option>{STATUS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
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
          <button onClick={() => setShowImport(true)} style={{ padding: "9px 16px", borderRadius: 8, border: `1px solid ${C.primary}`, background: "#fff", color: C.primaryDark, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>⬇ {t("import")}</button>
          <button onClick={() => setMode("add")} style={{ padding: "9px 18px", borderRadius: 8, border: "none", background: C.primary, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>{t("addContact")}</button>
        </div>
      </div>

      {/* View selector row */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <ViewSelector views={views} activeId={activeView} counts={counts}
          onSelect={setActiveView}
          onAddView={() => setEditView({ id: `v-${Date.now()}`, name: "", filter: "all", columns: DEFAULT_COLS })} />
        <IconBtn title="Edit view" onClick={() => setEditView(view)}>✎</IconBtn>
        <IconBtn title="Delete view" onClick={deleteView}>🗑</IconBtn>
        <IconBtn title="Export view">⬆</IconBtn>
        <IconBtn title="Send bulk email" active={selected.size > 0}
          onClick={() => { if (selected.size > 0) setShowBulk(true); }}>✉</IconBtn>
        {selected.size > 0 && <span style={{ marginLeft: 8, fontSize: 12, color: C.slate, fontWeight: 600 }}>{selected.size} selected</span>}
      </div>

      {/* Table */}
      <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: C.light, borderBottom: `1px solid ${C.border}` }}>
                <th style={{ padding: "12px 16px", width: 44 }}>
                  <input type="checkbox" checked={allChecked} onChange={toggleAll} style={{ width: 15, height: 15, accentColor: C.primary, cursor: "pointer" }} />
                </th>
                {cols.map(k => (
                  <th key={k} style={{ padding: "12px 16px", textAlign: "left", fontSize: 13, fontWeight: 600, color: C.slate, whiteSpace: "nowrap" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>{COLUMNS[k].label} <SortArrows /></span>
                  </th>
                ))}
              </tr>
              {/* Filter row */}
              <tr style={{ background: "#fff", borderBottom: `1px solid ${C.border}` }}>
                <td />
                {cols.map((k, i) => (
                  <td key={k} style={{ padding: "8px 16px" }}>
                    {i === cols.length - 1 ? (
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        {filterCell(k)}
                        <button title="Apply filters" style={{ width: 32, height: 32, flexShrink: 0, borderRadius: 8, border: `1px solid ${C.border}`, background: "#fff", color: C.green, cursor: "pointer" }}>✓</button>
                        <button title="Reset filters" onClick={resetFilters} style={{ width: 32, height: 32, flexShrink: 0, borderRadius: 8, border: `1px solid ${C.border}`, background: "#fff", color: C.slate, cursor: "pointer" }}>↺</button>
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
                    <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggleOne(c.id)} style={{ width: 15, height: 15, accentColor: C.primary, cursor: "pointer" }} />
                  </td>
                  {cols.map(k => {
                    const isLink = k === "name" || k === LINK_COL;
                    return (
                    <td key={k} style={{ padding: "14px 16px", cursor: isLink ? "pointer" : "default" }}
                      onClick={isLink ? () => navigateTo("LeadDetail", ALL_LEADS.find(l => l.id === c.id) || { id: c.id, name: c.name, email: c.email, phone: c.phone }) : undefined}>
                      {renderCell(k, c)}
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

      {showImport && <ImportContactsModal onClose={() => setShowImport(false)} />}
      {showBulk && <SendBulkEmailModal contacts={contacts.filter(c => selected.has(c.id))} onClose={() => setShowBulk(false)} />}
      {editView && <EditViewModal view={editView} onClose={() => setEditView(null)} onApply={applyView} />}
    </div>
  );
};
