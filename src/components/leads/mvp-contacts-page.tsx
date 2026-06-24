import React, { useState, useMemo, useRef } from "react";
import { ALL_LEADS } from "../../lib/core";
import { C } from "../../theme";

// ─────────────────────────────────────────────────────────────────────────────
// MVP CONTACTS PAGE
// A lightweight, import-first Contact List — the MVP counterpart to the rich
// "Full" Contact Management view. Layout follows the product design mockups:
// list view selector, sortable/filterable columns, and a multi-step import flow.
// ─────────────────────────────────────────────────────────────────────────────

// ── status → lifecycle / stage mapping ───────────────────────────────────────
const LIFECYCLE = {
  open:        { stage: "Lead",        status: "New",         tone: C.green },
  in_progress: { stage: "Lead",        status: "To Do",       tone: C.slate },
  attempted:   { stage: "Lead",        status: "To Do",       tone: C.slate },
  not_reached: { stage: "Lead",        status: "To Do",       tone: C.slate },
  followup:    { stage: "Lead",        status: "To Do",       tone: C.slate },
  appointment: { stage: "Opportunity", status: "New",         tone: C.green },
  closed:      { stage: "Customer",    status: "Won",         tone: C.green },
  no_interest: { stage: "N/A",         status: "N/A",         tone: null    },
  dnc:         { stage: "N/A",         status: "N/A",         tone: null    },
};

const LIFECYCLE_OPTIONS = ["Lead", "Opportunity", "Customer", "N/A"];
const STATUS_OPTIONS     = ["New", "To Do", "Won", "N/A"];

const toContact = (l) => {
  const [first, ...rest] = l.name.split(" ");
  const lc = LIFECYCLE[l.status] || LIFECYCLE.no_interest;
  return {
    id: l.id,
    first,
    last: rest.join(" "),
    name: l.name,
    lifecycle: lc.stage,
    stageStatus: lc.status,
    tone: lc.tone,
    phone: l.phone,
    email: l.email,
  };
};

// ── shared inline styles ─────────────────────────────────────────────────────
const fieldStyle = {
  width: "100%", padding: "9px 12px", borderRadius: 8,
  border: `1px solid ${C.border}`, fontSize: 13, fontFamily: "inherit",
  color: C.text, boxSizing: "border-box", outline: "none", background: "#fff",
};

// ── status / lifecycle pill ──────────────────────────────────────────────────
const StagePill = ({ label, tone }) => {
  if (!tone) return <span style={{ fontSize: 13, color: C.muted }}>{label}</span>;
  return (
    <span style={{
      display: "inline-block", padding: "3px 12px", borderRadius: 16,
      fontSize: 12, fontWeight: 600, background: tone + "1A", color: tone,
    }}>
      {label}
    </span>
  );
};

const IconBtn = ({ title, onClick, children }) => (
  <button title={title} onClick={onClick} style={{
    width: 32, height: 32, borderRadius: 8, border: `1px solid ${C.border}`,
    background: "#fff", color: C.slate, cursor: "pointer",
    display: "grid", placeItems: "center", fontSize: 15,
  }}>
    {children}
  </button>
);

const SortArrows = () => (
  <span style={{ display: "inline-flex", flexDirection: "column", lineHeight: 0.6, fontSize: 9, color: C.muted }}>
    <span>▲</span><span>▼</span>
  </span>
);

// ─────────────────────────────────────────────────────────────────────────────
// IMPORT WIZARD
// ─────────────────────────────────────────────────────────────────────────────
const ImportContactsModal = ({ onClose }) => {
  const [step, setStep]       = useState("source");   // source | upload | importing | done
  const [progress, setProgress] = useState(0);
  const timerRef = useRef(null);

  const runImport = () => {
    setStep("importing");
    setProgress(0);
    timerRef.current = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(timerRef.current);
          setStep("done");
          return 100;
        }
        return p + 8;
      });
    }, 120);
  };

  React.useEffect(() => () => clearInterval(timerRef.current), []);

  const Overlay = ({ children, width = 520 }) => (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", zIndex: 400 }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        width, maxWidth: "92vw", background: "#fff", borderRadius: 16, zIndex: 500,
        boxShadow: "0 24px 64px rgba(0,0,0,0.22)", fontFamily: "inherit",
        padding: "22px 24px", maxHeight: "90vh", overflowY: "auto",
      }}>
        {children}
      </div>
    </>
  );

  const Header = ({ title, back }) => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {back && (
          <button onClick={back} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: C.slate, lineHeight: 1 }}>←</button>
        )}
        <div style={{ fontSize: 17, fontWeight: 700, color: C.navy }}>{title}</div>
      </div>
      <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: C.muted, lineHeight: 1 }}>×</button>
    </div>
  );

  // ── Step 1: choose a source ────────────────────────────────────────────────
  if (step === "source") {
    const SourceCard = ({ icon, title, sub, hint, onClick }) => (
      <button onClick={onClick} style={{
        flex: 1, background: C.light, border: `1px solid ${C.border}`, borderRadius: 12,
        padding: "26px 18px", cursor: "pointer", textAlign: "center", fontFamily: "inherit",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
        transition: "border-color .15s",
      }}
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

  // ── Step 2: upload + map ────────────────────────────────────────────────────
  if (step === "upload") {
    return (
      <Overlay width={580}>
        <Header title="Import Contacts" back={() => setStep("source")} />

        {/* Rules box */}
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

        {/* Uploaded file */}
        <div style={{ fontSize: 13, fontWeight: 600, color: C.navy, marginBottom: 8 }}>Upload your CSV or Excel file</div>
        <div style={{
          display: "flex", alignItems: "center", gap: 12, padding: "14px 16px",
          border: `1px solid ${C.border}`, borderRadius: 12, marginBottom: 18,
        }}>
          <span style={{ fontSize: 22 }}>📗</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.navy }}>File name.xlsx</div>
            <div style={{ fontSize: 11, color: C.muted }}>123 KB</div>
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, color: C.green, display: "flex", alignItems: "center", gap: 5 }}>✓ Ready to Import</span>
          <button onClick={() => setStep("source")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: C.muted }}>×</button>
        </div>

        {/* Worksheet + view */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 8 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: C.navy, display: "block", marginBottom: 6 }}>Worksheet *</label>
            <select style={fieldStyle} defaultValue="Worksheet_1">
              <option>Worksheet_1</option>
              <option>Worksheet_2</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: C.navy, display: "block", marginBottom: 6 }}>Contacts View *</label>
            <select style={fieldStyle} defaultValue="">
              <option value="" disabled>Select Contacts View</option>
              <option>My Contacts</option>
              <option>All Contacts</option>
            </select>
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

  // ── Step 3: importing ───────────────────────────────────────────────────────
  if (step === "importing") {
    return (
      <Overlay width={460}>
        <div style={{ padding: "20px 8px", textAlign: "center" }}>
          <div style={{
            width: 52, height: 52, margin: "0 auto 18px", borderRadius: "50%",
            border: `4px solid ${C.border}`, borderTopColor: C.primary,
            animation: "mvpSpin 0.8s linear infinite",
          }} />
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

  // ── Step 4: completed ───────────────────────────────────────────────────────
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
        <StatCard dot={C.slate}  label="Total Records" value="248" color={C.navy} />
        <StatCard dot={C.green}  label="Imported"      value="244" color={C.green} />
        <StatCard dot={C.red}    label="Errors"        value="4"   color={C.red} />
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
        <button style={{ padding: "9px 18px", borderRadius: 9, border: "none", background: C.primarySoft, color: C.primaryDark, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>⬇ Download Error Report</button>
        <button onClick={onClose} style={{ padding: "9px 24px", borderRadius: 9, border: "none", background: C.primary, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Close</button>
      </div>
    </Overlay>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ADD CONTACT MODAL (minimal)
// ─────────────────────────────────────────────────────────────────────────────
const AddContactModal = ({ onClose, onAdd }) => {
  const [f, setF] = useState({ first: "", last: "", email: "", phone: "", lifecycle: "Lead" });
  const valid = f.first.trim() && f.last.trim();
  const set = (k) => (e) => setF(prev => ({ ...prev, [k]: e.target.value }));
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", zIndex: 400 }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 440, maxWidth: "92vw", background: "#fff", borderRadius: 16, zIndex: 500, boxShadow: "0 24px 64px rgba(0,0,0,0.22)", padding: "22px 24px", fontFamily: "inherit" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: C.navy }}>Add Contact</div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: C.muted }}>×</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: C.navy, display: "block", marginBottom: 6 }}>First Name *</label>
            <input style={fieldStyle} value={f.first} onChange={set("first")} placeholder="First name" />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: C.navy, display: "block", marginBottom: 6 }}>Last Name *</label>
            <input style={fieldStyle} value={f.last} onChange={set("last")} placeholder="Last name" />
          </div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: C.navy, display: "block", marginBottom: 6 }}>Email</label>
          <input style={fieldStyle} value={f.email} onChange={set("email")} placeholder="name@example.com" />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: C.navy, display: "block", marginBottom: 6 }}>Phone Number</label>
            <input style={fieldStyle} value={f.phone} onChange={set("phone")} placeholder="+41 1234 5678" />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: C.navy, display: "block", marginBottom: 6 }}>Lifecycle Stage</label>
            <select style={fieldStyle} value={f.lifecycle} onChange={set("lifecycle")}>
              {LIFECYCLE_OPTIONS.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <button onClick={onClose} style={{ padding: "9px 20px", borderRadius: 9, border: "none", background: "transparent", color: C.slate, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
          <button disabled={!valid} onClick={() => { onAdd(f); onClose(); }} style={{ padding: "9px 24px", borderRadius: 9, border: "none", background: valid ? C.primary : C.border, color: valid ? "#fff" : C.muted, fontSize: 13, fontWeight: 700, cursor: valid ? "pointer" : "default" }}>Add Contact</button>
        </div>
      </div>
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
export const MVPContactsPage = ({ navigateTo }) => {
  const [contacts, setContacts] = useState(() => ALL_LEADS.map(toContact));
  const [showImport, setShowImport] = useState(false);
  const [showAdd, setShowAdd]       = useState(false);
  const [selected, setSelected]     = useState(() => new Set());

  // filters (live)
  const [fName, setFName]           = useState("");
  const [fLifecycle, setFLifecycle] = useState("");
  const [fStatus, setFStatus]       = useState("");
  const [fPhone, setFPhone]         = useState("");
  const [fEmail, setFEmail]         = useState("");

  const resetFilters = () => { setFName(""); setFLifecycle(""); setFStatus(""); setFPhone(""); setFEmail(""); };

  const rows = useMemo(() => contacts.filter(c =>
    (!fName      || c.name.toLowerCase().includes(fName.toLowerCase())) &&
    (!fLifecycle || c.lifecycle === fLifecycle) &&
    (!fStatus    || c.stageStatus === fStatus) &&
    (!fPhone     || (c.phone || "").replace(/\s/g, "").includes(fPhone.replace(/\s/g, ""))) &&
    (!fEmail     || (c.email || "").toLowerCase().includes(fEmail.toLowerCase()))
  ), [contacts, fName, fLifecycle, fStatus, fPhone, fEmail]);

  const allChecked = rows.length > 0 && rows.every(r => selected.has(r.id));
  const toggleAll = () => {
    setSelected(prev => {
      const next = new Set(prev);
      if (allChecked) rows.forEach(r => next.delete(r.id));
      else            rows.forEach(r => next.add(r.id));
      return next;
    });
  };
  const toggleOne = (id) => setSelected(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const addContact = (f) => {
    const lc = LIFECYCLE[f.lifecycle === "Lead" ? "open" : "no_interest"];
    setContacts(prev => [{
      id: `NEW-${Date.now()}`,
      first: f.first, last: f.last, name: `${f.first} ${f.last}`.trim(),
      lifecycle: f.lifecycle,
      stageStatus: f.lifecycle === "N/A" ? "N/A" : "New",
      tone: f.lifecycle === "N/A" ? null : C.green,
      phone: f.phone || "—", email: f.email || "—",
    }, ...prev]);
  };

  const TH = ({ label, grow }) => (
    <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 13, fontWeight: 600, color: C.slate, whiteSpace: "nowrap", width: grow ? "auto" : undefined }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>{label} <SortArrows /></span>
    </th>
  );

  return (
    <div style={{ padding: "24px 28px", fontFamily: "inherit" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: C.navy, letterSpacing: "-0.02em" }}>Contact List</h1>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setShowImport(true)} style={{ padding: "9px 16px", borderRadius: 8, border: `1px solid ${C.primary}`, background: "#fff", color: C.primaryDark, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>⬇ Import</button>
          <button onClick={() => setShowAdd(true)} style={{ padding: "9px 18px", borderRadius: 8, border: "none", background: C.primary, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Add Contact</button>
        </div>
      </div>

      {/* View selector row */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <select defaultValue="my" style={{ ...fieldStyle, width: "auto", paddingRight: 28, fontWeight: 600, color: C.navy, cursor: "pointer" }}>
          <option value="my">{`My Contacts (${contacts.length})`}</option>
          <option value="all">{`All Contacts (${contacts.length})`}</option>
        </select>
        <IconBtn title="Rename view">✎</IconBtn>
        <IconBtn title="Delete view">🗑</IconBtn>
        <IconBtn title="Export view">⬆</IconBtn>
        {selected.size > 0 && (
          <span style={{ marginLeft: 8, fontSize: 12, color: C.slate, fontWeight: 600 }}>{selected.size} selected</span>
        )}
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
                <TH label="Name" />
                <TH label="Lifecycle Stage" />
                <TH label="Stage Status" />
                <TH label="Phone Number" />
                <TH label="Email" grow />
              </tr>
              {/* Filter row */}
              <tr style={{ background: "#fff", borderBottom: `1px solid ${C.border}` }}>
                <td />
                <td style={{ padding: "8px 16px" }}>
                  <input value={fName} onChange={e => setFName(e.target.value)} placeholder="Contact" style={{ ...fieldStyle, padding: "7px 10px", fontSize: 12 }} />
                </td>
                <td style={{ padding: "8px 16px" }}>
                  <select value={fLifecycle} onChange={e => setFLifecycle(e.target.value)} style={{ ...fieldStyle, padding: "7px 10px", fontSize: 12, color: fLifecycle ? C.text : C.muted }}>
                    <option value="">Select lifecycle...</option>
                    {LIFECYCLE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </td>
                <td style={{ padding: "8px 16px" }}>
                  <select value={fStatus} onChange={e => setFStatus(e.target.value)} style={{ ...fieldStyle, padding: "7px 10px", fontSize: 12, color: fStatus ? C.text : C.muted }}>
                    <option value="">Select status</option>
                    {STATUS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </td>
                <td style={{ padding: "8px 16px" }}>
                  <input value={fPhone} onChange={e => setFPhone(e.target.value)} placeholder="Phone number" style={{ ...fieldStyle, padding: "7px 10px", fontSize: 12 }} />
                </td>
                <td style={{ padding: "8px 16px" }}>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <input value={fEmail} onChange={e => setFEmail(e.target.value)} placeholder="Email" style={{ ...fieldStyle, padding: "7px 10px", fontSize: 12 }} />
                    <button title="Apply filters" style={{ width: 32, height: 32, flexShrink: 0, borderRadius: 8, border: `1px solid ${C.border}`, background: "#fff", color: C.green, cursor: "pointer" }}>✓</button>
                    <button title="Reset filters" onClick={resetFilters} style={{ width: 32, height: 32, flexShrink: 0, borderRadius: 8, border: `1px solid ${C.border}`, background: "#fff", color: C.slate, cursor: "pointer" }}>↺</button>
                  </div>
                </td>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={6} style={{ padding: "40px", textAlign: "center", color: C.muted, fontSize: 13 }}>No contacts match your filters.</td></tr>
              )}
              {rows.map((c) => (
                <tr key={c.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ padding: "14px 16px" }}>
                    <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggleOne(c.id)} style={{ width: 15, height: 15, accentColor: C.primary, cursor: "pointer" }} />
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span onClick={() => navigateTo("LeadDetail", ALL_LEADS.find(l => l.id === c.id) || { id: c.id, name: c.name, email: c.email, phone: c.phone })}
                      style={{ fontSize: 13, fontWeight: 500, color: C.navy, textDecoration: "underline", textUnderlineOffset: 2, cursor: "pointer" }}>
                      {c.name}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: 13, color: c.lifecycle === "N/A" ? C.muted : C.text }}>{c.lifecycle}</td>
                  <td style={{ padding: "14px 16px" }}><StagePill label={c.stageStatus} tone={c.tone} /></td>
                  <td style={{ padding: "14px 16px", fontSize: 13, color: C.slate }}>{c.phone}</td>
                  <td style={{ padding: "14px 16px", fontSize: 13, color: C.slate }}>{c.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: "12px 16px", borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 12, color: C.muted }}>Showing {rows.length} of {contacts.length} contacts</span>
          <div style={{ display: "flex", gap: 5 }}>
            {["←", "1", "2", "3", "→"].map(p => (
              <button key={p} style={{ padding: "5px 11px", borderRadius: 7, border: p === "1" ? "none" : `1px solid ${C.border}`, background: p === "1" ? C.primary : "#fff", color: p === "1" ? "#fff" : C.slate, fontSize: 12, cursor: "pointer" }}>{p}</button>
            ))}
          </div>
        </div>
      </div>

      {showImport && <ImportContactsModal onClose={() => setShowImport(false)} />}
      {showAdd    && <AddContactModal onClose={() => setShowAdd(false)} onAdd={addContact} />}
    </div>
  );
};
