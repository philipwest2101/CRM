import React, { useState, useMemo, useRef, useEffect } from "react";
import { EMAIL_TEMPLATES_STORE, setEMAIL_TEMPLATES_STORE } from "../../lib/core";
import { EmailTemplateEditor } from "../email/email-template-editor";
import { C } from "../../theme";

// ─────────────────────────────────────────────────────────────────────────────
// MVP SETTINGS PAGE (Super Admin)
// Left-rail section nav + a CRUD list per section. Every section shows a
// Name + Language pair, except Attachments (file list with pagination).
// Add/Edit uses a per-language name editor (German is the required default).
// ─────────────────────────────────────────────────────────────────────────────

const LANGS = [
  { key: "de", flag: "DE", label: "German", def: true },
  { key: "en", flag: "EN", label: "English"           },
];

const L = (...keys) => Object.fromEntries(LANGS.map(l => [l.key, keys.includes(l.key)]));

// ── seed data ─────────────────────────────────────────────────────────────────
const SEED = {
  products: [
    { id: "p1", name: "Financing",                        langs: L("de", "en", "fr") },
    { id: "p2", name: "Debt Restructuring (Refinancing)", langs: L("de", "en") },
    { id: "p3", name: "ETFs - Securities",                langs: L("de", "en", "fr") },
    { id: "p4", name: "Funds",                            langs: L("de", "en", "fr") },
    { id: "p5", name: "Gold - Precious Metals",           langs: L("de", "en") },
    { id: "p6", name: "Crypto",                           langs: L("de", "en", "fr", "cz") },
    { id: "p7", name: "Life Insurance",                   langs: L("de", "en", "fr") },
    { id: "p8", name: "Asset Management",                 langs: L("de", "en", "fr") },
    { id: "p9", name: "Other Insurance",                  langs: L("de", "en", "fr") },
  ],
  sources: [
    { id: "s1", name: "Meta Ads",      langs: L("de", "en") },
    { id: "s2", name: "Landing Page",  langs: L("de", "en", "fr") },
    { id: "s3", name: "Google Sheets", langs: L("de", "en") },
    { id: "s4", name: "CSV Import",    langs: L("de", "en") },
    { id: "s5", name: "Zapier",        langs: L("de", "en") },
    { id: "s6", name: "Referral",      langs: L("de", "en", "fr") },
    { id: "s7", name: "Event",         langs: L("de", "en") },
  ],
  campaigns: [
    { id: "c1", name: "General",                                langs: L("de", "en", "fr") },
    { id: "c2", name: "Securities",                             langs: L("de") },
    { id: "c3", name: "Financing",                              langs: L("de", "fr") },
    { id: "c4", name: "Participation in Customer Presentation", langs: L("de", "en", "fr") },
    { id: "c5", name: "Real Estate",                            langs: L("de", "en") },
    { id: "c6", name: "Fee-based Consulting",                   langs: L("de", "en", "fr", "cz") },
    { id: "c7", name: "Prospective Client",                     langs: L("de", "en", "fr") },
    { id: "c8", name: "Participation in Business Opening",      langs: L("de", "en", "fr") },
    { id: "c9", name: "Gold",                                   langs: L("de", "en", "fr") },
  ],
  templates: [
    { id: "t1", name: "Welcome Email",        langs: L("de", "en", "fr"), system: true, subject: "", attachments: [], body: "", description: "", visible: true },
    { id: "t2", name: "Appointment Reminder", langs: L("de", "en"), system: true, subject: "", attachments: [], body: "", description: "", visible: true },
    { id: "t3", name: "Follow-up",            langs: L("de", "en", "fr"), subject: "", attachments: [], body: "", description: "", visible: true },
    { id: "t4", name: "GDPR Consent",         langs: L("de", "en"), system: true, subject: "", attachments: [], body: "", description: "", visible: true },
    { id: "t5", name: "Birthday Greeting",    langs: L("de", "en", "fr", "cz"), subject: "", attachments: [], body: "", description: "", visible: true },
  ],
  attachments: Array.from({ length: 57 }, (_, i) => ({
    id: `att${i + 1}`, name: `Attachment Name ${i + 1}`, type: i % 6 === 1 ? "img" : "pdf",
    ...(i < 3 ? { system: true } : {}),
  })),
  labels: [
    { id: "lb1", name: "Hot Contact",  langs: L("de", "en") },
    { id: "lb2", name: "VIP",          langs: L("de", "en", "fr") },
    { id: "lb3", name: "GDPR Pending", langs: L("de", "en"), system: true },
    { id: "lb4", name: "Campaign Q1",  langs: L("de", "en") },
    { id: "lb5", name: "Do Not Call",  langs: L("de", "en"), system: true },
  ],
  lifecycle: [
    { id: "ls1", name: "New",         langs: L("de", "en", "fr") },
    { id: "ls2", name: "In Contact",  langs: L("de", "en", "fr") },
    { id: "ls3", name: "Appointment", langs: L("de", "en") },
    { id: "ls4", name: "Closing",     langs: L("de", "en", "fr") },
    { id: "ls5", name: "Excluded",    langs: L("de", "en") },
  ],
  statuses: [
    { id: "ss1", name: "New / Open",            parent: "New",         langs: L("de", "en", "fr") },
    { id: "ss2", name: "In Progress",           parent: "In Contact",  langs: L("de", "en") },
    { id: "ss3", name: "Attempted",             parent: "In Contact",  langs: L("de", "en", "fr") },
    { id: "ss4", name: "Not Reached",           parent: "In Contact",  langs: L("de", "en") },
    { id: "ss5", name: "Not Interested",        parent: "In Contact",  langs: L("de", "en", "fr") },
    { id: "ss6", name: "Appointment Scheduled", parent: "Appointment", langs: L("de", "en") },
    { id: "ss7", name: "Follow Up",             parent: "Appointment", langs: L("de", "en", "fr") },
    { id: "ss8", name: "Closed / Customer",     parent: "Closing",     langs: L("de", "en", "fr", "cz") },
    { id: "ss9", name: "Do Not Contact",        parent: "Excluded",    langs: L("de", "en") },
  ],
};

// Source, Lifecycle Stage and Stage Status are now system-defined (no longer
// configurable), so their admin config pages have been removed. The underlying
// backend/database structure is unchanged.
const SECTIONS = [
  { key: "products",     label: "Products",        singular: "Product",        kind: "lang"         },
  { key: "campaigns",    label: "Campaigns",       singular: "Campaign",       kind: "lang"         },
  { key: "templates",    label: "Email Templates", singular: "Email Template", kind: "lang"         },
  { key: "attachments",  label: "Attachments",     singular: "Attachment",     kind: "files"        },
  { key: "labels",       label: "Labels",          singular: "Label",          kind: "lang"         },
  { key: "integrations", label: "Integrations",    singular: "Integration",    kind: "integrations" },
];

const fieldStyle = {
  width: "100%", padding: "10px 12px", borderRadius: 8,
  border: `1px solid ${C.border}`, fontSize: 13, fontFamily: "inherit",
  color: C.text, boxSizing: "border-box", outline: "none", background: "#fff",
};

// ── language flag set — shows only active languages as uniform pill badges ────
const FlagSet = ({ langs }) => (
  <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
    {LANGS.filter(l => langs[l.key]).map(l => (
      <span key={l.key} title={l.label} style={{
        fontSize: 10, fontWeight: 700,
        padding: "2px 7px", borderRadius: 5,
        background: "#DBEAFE", color: "#1D4ED8",
        display: "inline-flex", alignItems: "center", letterSpacing: "0.03em",
      }}>
        {l.flag}
      </span>
    ))}
  </div>
);

// ── file-type icon (Attachments) ─────────────────────────────────────────────
const FileIcon = ({ type }) => {
  const pdf = type === "pdf";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      width: 26, height: 30, borderRadius: 4, fontSize: 7, fontWeight: 800, color: "#fff",
      background: pdf ? C.red : C.amber, letterSpacing: "0.02em",
    }}>{pdf ? "PDF" : "IMG"}</span>
  );
};

// ── row 3-dot menu ────────────────────────────────────────────────────────────
const RowMenu = ({ actions }) => {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: "relative", display: "flex", justifyContent: "flex-end" }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width: 30, height: 30, borderRadius: 8, border: "none", cursor: "pointer",
        background: open ? C.primarySoft : "transparent", color: open ? C.primaryDark : C.slate,
        fontSize: 18, lineHeight: 1, display: "grid", placeItems: "center",
      }}>⋮</button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 250 }} />
          <div style={{ position: "absolute", top: 32, right: 0, zIndex: 260, background: "#fff", borderRadius: 10, boxShadow: "0 8px 28px rgba(0,0,0,0.16)", border: `1px solid ${C.border}`, minWidth: 140, padding: "5px 0" }}>
            {actions.map(([label, fn]) => (
              <div key={label} onClick={() => { setOpen(false); fn(); }}
                style={{ padding: "9px 16px", fontSize: 13, color: label === "Delete" ? C.red : C.text, cursor: "pointer", fontWeight: 500 }}
                onMouseEnter={e => e.currentTarget.style.background = "#F8FAFC"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                {label}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// ── add / edit modal — per-language name editor ───────────────────────────────
const ItemModal = ({ section, item, lifecycleNames, onClose, onSave }) => {
  const [names, setNames] = useState(() => {
    const base = Object.fromEntries(LANGS.map(l => [l.key, ""]));
    if (item) { base.de = item.name; LANGS.forEach(l => { if (item.langs?.[l.key]) base[l.key] = base[l.key] || (l.def ? item.name : ""); }); }
    return base;
  });
  const [parent, setParent] = useState(item?.parent || "");
  const setName = (k) => (e) => setNames(prev => ({ ...prev, [k]: e.target.value }));

  const valid = names.de.trim() && (!section.parent || parent);

  const save = () => {
    const langs = Object.fromEntries(LANGS.map(l => [l.key, !!names[l.key].trim()]));
    langs.de = true;
    onSave({ ...item, id: item?.id || `new-${Date.now()}`, name: names.de.trim(), langs, ...(section.parent ? { parent } : {}) });
  };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", zIndex: 400 }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 460, maxWidth: "92vw", background: "#fff", borderRadius: 16, zIndex: 500, boxShadow: "0 24px 64px rgba(0,0,0,0.22)", padding: "22px 24px", fontFamily: "inherit" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.navy }}>{item ? "Edit" : "Add"} {section.singular}</div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: C.muted }}>×</button>
        </div>

        {section.parent && (
          <div style={{ marginBottom: 18 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: C.navy, display: "block", marginBottom: 7 }}>Lifecycle Stage *</label>
            <select value={parent} onChange={e => setParent(e.target.value)} style={{ ...fieldStyle, color: parent ? C.text : C.muted }}>
              <option value="">Select Lifecycle Stage</option>
              {(lifecycleNames || []).map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        )}

        <label style={{ fontSize: 13, fontWeight: 600, color: C.navy, display: "block", marginBottom: 9 }}>Name *</label>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 22 }}>
          {LANGS.map(l => (
            <div key={l.key} style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <span style={{ position: "absolute", left: 12, fontSize: 10, fontWeight: 700, color: "#1D4ED8", background: "#DBEAFE", padding: "2px 5px", borderRadius: 4, letterSpacing: "0.03em" }}>{l.flag}</span>
              <input value={names[l.key]} onChange={setName(l.key)} placeholder={l.def ? "German (Default)" : l.label}
                style={{ ...fieldStyle, paddingLeft: 40, paddingRight: l.def ? 86 : 12 }} />
              {l.def && (
                <span style={{ position: "absolute", right: 10, fontSize: 11, fontWeight: 600, color: C.primaryDark, background: C.primarySoft, padding: "3px 9px", borderRadius: 12 }}>Required</span>
              )}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <button onClick={onClose} style={{ padding: "9px 20px", borderRadius: 9, border: "none", background: "transparent", color: C.slate, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
          <button disabled={!valid} onClick={save}
            style={{ padding: "9px 28px", borderRadius: 9, border: "none", background: valid ? C.primary : C.border, color: valid ? "#fff" : C.muted, fontSize: 13, fontWeight: 700, cursor: valid ? "pointer" : "default" }}>Save</button>
        </div>
      </div>
    </>
  );
};

// ── add attachment modal ──────────────────────────────────────────────────────
const AttachmentModal = ({ onClose, onSave }) => {
  const [name, setName] = useState("");
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", zIndex: 400 }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 440, maxWidth: "92vw", background: "#fff", borderRadius: 16, zIndex: 500, boxShadow: "0 24px 64px rgba(0,0,0,0.22)", padding: "22px 24px", fontFamily: "inherit" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.navy }}>Add Attachment</div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: C.muted }}>×</button>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: C.navy, display: "block", marginBottom: 7 }}>Name *</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Attachment name" style={fieldStyle} autoFocus />
        </div>
        <div style={{ border: `1.5px dashed ${C.border}`, borderRadius: 10, padding: "22px", textAlign: "center", color: C.muted, fontSize: 13, marginBottom: 20 }}>
          ⬆ Drag &amp; drop a file here, or click to browse
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <button onClick={onClose} style={{ padding: "9px 20px", borderRadius: 9, border: "none", background: "transparent", color: C.slate, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
          <button disabled={!name.trim()} onClick={() => onSave({ id: `att-${Date.now()}`, name: name.trim(), type: "pdf" })}
            style={{ padding: "9px 28px", borderRadius: 9, border: "none", background: name.trim() ? C.primary : C.border, color: name.trim() ? "#fff" : C.muted, fontSize: 13, fontWeight: 700, cursor: name.trim() ? "pointer" : "default" }}>Save</button>
        </div>
      </div>
    </>
  );
};

// ── seed integrations data ─────────────────────────────────────────────────────
const INTEGRATIONS_SEED = [
  { id: "google-calendar", provider: "Google", service: "Calendar", icon: "📅", bg: "#FEF9C3", iconBg: "#FEF08A", color: "#854D0E",
    connected: true, account: "anna.klein@gmail.com", desc: "Google Calendar — bidirectional sync" },
  { id: "google-email", provider: "Google", service: "Email", icon: "✉️", bg: "#DCFCE7", iconBg: "#BBF7D0", color: "#166534",
    connected: true, account: "anna.klein@gmail.com", desc: "Gmail — bidirectional sync" },
  { id: "microsoft-calendar", provider: "Microsoft", service: "Calendar", icon: "📅", bg: "#EFF6FF", iconBg: "#BFDBFE", color: "#1E40AF",
    connected: false, account: "", desc: "Outlook Calendar — bidirectional sync" },
  { id: "microsoft-email", provider: "Microsoft", service: "Email", icon: "✉️", bg: "#F5F3FF", iconBg: "#DDD6FE", color: "#5B21B6",
    connected: false, account: "", desc: "Outlook / Exchange — bidirectional sync" },
];

// ── connect-account modal (simulated OAuth — asks which account to link) ───────
const ConnectModal = ({ card, onClose, onConnect }) => {
  const [account, setAccount] = useState("");
  const valid = /\S+@\S+\.\S+/.test(account);
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", zIndex: 400 }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 420, maxWidth: "92vw", background: "#fff", borderRadius: 16, zIndex: 500, boxShadow: "0 24px 64px rgba(0,0,0,0.22)", padding: "22px 24px", fontFamily: "inherit" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.navy }}>Connect {card.provider} {card.service}</div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: C.muted }}>×</button>
        </div>
        <div style={{ fontSize: 13, color: C.slate, marginBottom: 16 }}>Sign in with your {card.provider} account to enable {card.desc.toLowerCase()}.</div>
        <label style={{ fontSize: 13, fontWeight: 600, color: C.navy, display: "block", marginBottom: 7 }}>Account email *</label>
        <input value={account} onChange={e => setAccount(e.target.value)} placeholder="name@example.com" style={fieldStyle} autoFocus />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 22 }}>
          <button onClick={onClose} style={{ padding: "9px 20px", borderRadius: 9, border: "none", background: "transparent", color: C.slate, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
          <button disabled={!valid} onClick={() => onConnect(account.trim())}
            style={{ padding: "9px 28px", borderRadius: 9, border: "none", background: valid ? C.primary : C.border, color: valid ? "#fff" : C.muted, fontSize: 13, fontWeight: 700, cursor: valid ? "pointer" : "default" }}>Connect</button>
        </div>
      </div>
    </>
  );
};

// ── disconnect confirmation modal ───────────────────────────────────────────────
const DisconnectModal = ({ card, onClose, onConfirm }) => (
  <>
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", zIndex: 400 }} />
    <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 400, maxWidth: "92vw", background: "#fff", borderRadius: 16, zIndex: 500, boxShadow: "0 24px 64px rgba(0,0,0,0.22)", padding: "22px 24px", fontFamily: "inherit" }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: C.navy, marginBottom: 10 }}>Disconnect {card.provider} {card.service}?</div>
      <div style={{ fontSize: 13, color: C.slate, marginBottom: 22 }}>
        {card.account} will be unlinked and sync will stop. You can reconnect at any time.
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
        <button onClick={onClose} style={{ padding: "9px 20px", borderRadius: 9, border: "none", background: "transparent", color: C.slate, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
        <button onClick={onConfirm} style={{ padding: "9px 24px", borderRadius: 9, border: "none", background: C.red, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Disconnect</button>
      </div>
    </div>
  </>
);

// ── table header cell ─────────────────────────────────────────────────────────
const Th = ({ children, sort }) => (
  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 13, fontWeight: 600, color: C.slate }}>
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>{children}{sort && <span style={{ color: C.muted }}>⇅</span>}</span>
  </th>
);

// ─────────────────────────────────────────────────────────────────────────────
const VD_GP_SECTIONS = new Set(["templates", "attachments", "labels", "integrations"]);

// ── system badge ──────────────────────────────────────────────────────────────
const SystemBadge = () => (
  <span style={{ fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:10,background:"#F1F5F9",color:"#64748B",border:"1px solid #CBD5E1",letterSpacing:"0.04em",textTransform:"uppercase" }}>System</span>
);

export const MVPSettingsPage = ({ role = "superadmin", navigateTo = null }) => {
  const isSA = role === "superadmin" || role === "manager";
  const visibleSections = isSA ? SECTIONS : SECTIONS.filter(s => VD_GP_SECTIONS.has(s.key));
  const [active, setActive]   = useState(() => (isSA ? "products" : "templates"));
  const [data, setData]       = useState(SEED);
  // Email templates live in the unified block-based store shared with the
  // full Settings page, the Newsletter page, contact detail and campaigns.
  const [emailTpls, setEmailTpls] = useState(EMAIL_TEMPLATES_STORE);
  const [search, setSearch]   = useState("");
  const [visFilter, setVisFilter] = useState("all"); // templates only: all | visible | hidden
  const [editing, setEditing] = useState(null);   // { item } | { item:null }
  const [addingFile, setAddingFile] = useState(false);
  const [page, setPage]       = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [integrations, setIntegrations] = useState(INTEGRATIONS_SEED);
  const [connecting, setConnecting] = useState(null);   // card being connected
  const [disconnecting, setDisconnecting] = useState(null); // card being disconnected
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const confirmConnect = (account) => {
    setIntegrations(prev => prev.map(c => c.id === connecting.id ? { ...c, connected: true, account } : c));
    setToast(`✅ ${connecting.provider} ${connecting.service} connected`);
    setConnecting(null);
  };
  const confirmDisconnect = () => {
    setIntegrations(prev => prev.map(c => c.id === disconnecting.id ? { ...c, connected: false, account: "" } : c));
    setToast(`${disconnecting.provider} ${disconnecting.service} disconnected`);
    setDisconnecting(null);
  };

  const section = visibleSections.find(s => s.key === active) || visibleSections[0];
  const isTemplates = section.key === "templates";
  // Unified templates are adapted to the generic table shape (langs / visible /
  // system); org-wide templates are read-only for non-admins like elsewhere.
  const items   = isTemplates
    ? emailTpls.map(t => ({ ...t, langs:{ [t.lang]:true }, visible: t.published !== false, system: !t.createdBy || t.createdBy === "superadmin" }))
    : (data[active] || []);
  const filtered = useMemo(() => items
    .filter(i => i.name.toLowerCase().includes(search.toLowerCase()))
    .filter(i => !isTemplates || visFilter === "all" || (visFilter === "visible" ? i.visible !== false : i.visible === false)),
    [items, search, isTemplates, visFilter]);

  const switchSection = (key) => { setActive(key); setSearch(""); setVisFilter("all"); setPage(1); };

  const toggleVisible = (item) => {
    const next = emailTpls.map(t => t.id === item.id ? { ...t, published: t.published === false } : t);
    setEmailTpls(next); setEMAIL_TEMPLATES_STORE(next);
  };

  const freshTemplate = () => ({
    id:`et-${Date.now()}`, lang:"de", journey:"welcome", name:"New Template", subject:"",
    blocks:[{ type:"text", text:"Hallo {{lead_name}},\n\n\n\nFreundliche Grüße,\n{{advisor_name}}" }],
    attachments:[], variables:["{{lead_name}}","{{advisor_name}}"], published:true,
  });
  const saveTemplate = (updated) => {
    const exists = emailTpls.some(t => t.id === updated.id);
    const next = exists ? emailTpls.map(t => t.id === updated.id ? updated : t) : [updated, ...emailTpls];
    setEmailTpls(next); setEMAIL_TEMPLATES_STORE(next); setEditing(null);
  };

  const upsert = (item) => {
    setData(prev => {
      const list = prev[active];
      const exists = list.some(x => x.id === item.id);
      return { ...prev, [active]: exists ? list.map(x => x.id === item.id ? item : x) : [item, ...list] };
    });
    setEditing(null);
  };
  const addFile = (item) => { setData(prev => ({ ...prev, attachments: [item, ...prev.attachments] })); setAddingFile(false); };
  const remove = (id) => {
    if (isTemplates) {
      const next = emailTpls.filter(t => t.id !== id);
      setEmailTpls(next); setEMAIL_TEMPLATES_STORE(next);
      return;
    }
    setData(prev => ({ ...prev, [active]: prev[active].filter(x => x.id !== id) }));
  };

  const isFiles = section.kind === "files";

  // pagination (attachments)
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageItems = isFiles ? filtered.slice((page - 1) * pageSize, page * pageSize) : filtered;
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div style={{ padding: "24px 28px", fontFamily: "inherit" }}>
      <h1 style={{ margin: "0 0 18px", fontSize: 22, fontWeight: 700, color: C.navy, letterSpacing: "-0.02em" }}>Settings</h1>

      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 18, alignItems: "start" }}>
        {/* Left rail */}
        <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 14, padding: 10 }}>
          {visibleSections.map(s => {
            const on = s.key === active;
            return (
              <div key={s.key} onClick={() => switchSection(s.key)}
                style={{ padding: "11px 14px", borderRadius: 9, cursor: "pointer", fontSize: 14, marginBottom: 2,
                  fontWeight: on ? 700 : 500, color: on ? C.primaryDark : C.slate, background: on ? C.primarySoft : "transparent" }}
                onMouseEnter={e => { if (!on) e.currentTarget.style.background = "#F8FAFC"; }}
                onMouseLeave={e => { if (!on) e.currentTarget.style.background = "transparent"; }}>
                {s.label}
              </div>
            );
          })}
        </div>

        {/* Right panel */}
        <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 14, padding: "20px 22px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.navy }}>{section.label}</div>
            {section.kind !== "integrations" && (
              <button onClick={() => isFiles ? setAddingFile(true) : setEditing({ item: isTemplates ? freshTemplate() : null })} style={{ padding: "9px 18px", borderRadius: 8, border: "none", background: C.primary, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                Add {section.singular}
              </button>
            )}
          </div>

          {section.kind !== "integrations" && (
            <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
              <div style={{ position: "relative", flex: 1, maxWidth: 360 }}>
                <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: C.muted, fontSize: 14 }}>🔍</span>
                <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search" style={{ ...fieldStyle, paddingLeft: 34 }} />
              </div>
              {isTemplates && (
                <select value={visFilter} onChange={e => { setVisFilter(e.target.value); setPage(1); }} style={{ ...fieldStyle, width: "auto" }}>
                  <option value="all">All</option>
                  <option value="visible">Visible</option>
                  <option value="hidden">Hidden</option>
                </select>
              )}
            </div>
          )}

          {section.kind === "integrations" ? (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, padding:"4px 0" }}>
              {integrations.map(card => (
                <div key={card.id} style={{
                  borderRadius:14, border:`1px solid ${C.border}`, padding:"20px",
                  background:card.connected ? card.bg+"80" : "#fff",
                  display:"flex", flexDirection:"column", gap:14,
                }}>
                  <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                      <div style={{ width:44, height:44, borderRadius:12, background:card.iconBg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22 }}>
                        {card.icon}
                      </div>
                      <div>
                        <div style={{ fontSize:10, fontWeight:700, color:C.slate, letterSpacing:"0.04em", textTransform:"uppercase" }}>{card.provider}</div>
                        <div style={{ fontSize:16, fontWeight:800, color:C.navy }}>{card.service}</div>
                      </div>
                    </div>
                    <span style={{ fontSize:10, fontWeight:700, padding:"3px 10px", borderRadius:20,
                      background:card.connected ? C.green+"20" : "#F1F5F9",
                      color:card.connected ? C.green : C.muted }}>
                      {card.connected ? "● Connected" : "○ Not connected"}
                    </span>
                  </div>
                  <div>
                    <div style={{ fontSize:12, color:C.slate }}>{card.desc}</div>
                    {card.connected && <div style={{ fontSize:11, color:C.muted, marginTop:4 }}>↳ {card.account}</div>}
                  </div>
                  <div style={{ marginTop:"auto" }}>
                    {card.connected ? (
                      <button onClick={() => setDisconnecting(card)} style={{ padding:"7px 16px", borderRadius:8, border:`1px solid ${C.border}`, background:"#fff", color:C.slate, fontSize:12, fontWeight:600, cursor:"pointer" }}>
                        Disconnect
                      </button>
                    ) : (
                      <button onClick={() => setConnecting(card)} style={{ padding:"7px 18px", borderRadius:8, border:"none", background:C.primary, color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer" }}>
                        Connect {card.service}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
          <div style={{ border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: C.light, borderBottom: `1px solid ${C.border}` }}>
                  <Th sort>Name</Th>
                  {!isFiles && <Th>Language</Th>}
                  {isTemplates && <th style={{ width: 90, padding: "12px 16px", textAlign: "left", fontSize: 13, fontWeight: 600, color: C.slate }}>Visible</th>}
                  <th style={{ width: 56 }} />
                </tr>
              </thead>
              <tbody>
                {section.key === "statuses" ? (() => {
                  // Group statuses by lifecycle stage (parent)
                  const lifecycleOrder = data.lifecycle.map(l => l.name);
                  const grouped: Record<string, typeof pageItems> = {};
                  lifecycleOrder.forEach(n => { grouped[n] = []; });
                  pageItems.forEach(item => { if (grouped[item.parent]) grouped[item.parent].push(item); else { grouped[item.parent] = grouped[item.parent] || []; grouped[item.parent].push(item); } });
                  const entries = lifecycleOrder.filter(n => (grouped[n]||[]).length > 0 || !pageItems.length);
                  if (pageItems.length === 0) return <tr><td colSpan={3} style={{ padding:"36px",textAlign:"center",color:C.muted,fontSize:13 }}>No statuses found.</td></tr>;
                  return entries.flatMap(stage => [
                    <tr key={`hdr-${stage}`} style={{ background:C.light }}>
                      <td colSpan={3} style={{ padding:"10px 16px",fontSize:13,fontWeight:700,color:C.navy }}>{stage}</td>
                    </tr>,
                    ...(grouped[stage]||[]).map(item => (
                      <tr key={item.id} style={{ borderBottom:`1px solid ${C.border}` }}>
                        <td style={{ padding:"11px 16px 11px 28px",fontSize:13,color:C.text }}>{item.name}</td>
                        <td style={{ padding:"11px 16px" }}><FlagSet langs={item.langs} /></td>
                        <td style={{ padding:"11px 16px" }}><RowMenu actions={[["Edit",()=>setEditing({item})],["Delete",()=>remove(item.id)]]} /></td>
                      </tr>
                    )),
                  ]);
                })() : (
                  <>
                  {pageItems.length === 0 && (
                    <tr><td colSpan={isFiles ? 2 : isTemplates ? 4 : 3} style={{ padding: "36px", textAlign: "center", color: C.muted, fontSize: 13 }}>No {section.label.toLowerCase()} found.</td></tr>
                  )}
                  {pageItems.map(item => {
                    const rowActions = isFiles
                      ? [["Preview", () => {}], ["Download", () => {}], ["Delete", () => remove(item.id)]] as [string, () => void][]
                      : [["Edit", () => setEditing({ item })], ["Delete", () => remove(item.id)]] as [string, () => void][];
                    return (
                      <tr key={item.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                        <td style={{ padding: "13px 16px", fontSize: 14, color: C.text }}>
                          <span style={{ display:"inline-flex", alignItems:"center", gap:8 }}>
                            {isFiles
                              ? <span style={{ display: "inline-flex", alignItems: "center", gap: 12 }}><FileIcon type={item.type} />{item.name}</span>
                              : item.name}
                            {item.system && !isSA && <SystemBadge />}
                          </span>
                        </td>
                        {!isFiles && <td style={{ padding: "13px 16px" }}><FlagSet langs={item.langs} /></td>}
                        {isTemplates && (
                          <td style={{ padding: "13px 16px" }}>
                            <button type="button" onClick={() => toggleVisible(item)}
                              disabled={item.system && !isSA}
                              title={item.visible === false ? "Hidden" : "Visible"}
                              style={{ width: 34, height: 20, borderRadius: 10, border: "none", padding: 0, position: "relative",
                                background: item.visible === false ? C.border : C.primary,
                                cursor: item.system && !isSA ? "default" : "pointer", opacity: item.system && !isSA ? 0.6 : 1 }}>
                              <span style={{ position: "absolute", top: 2, left: item.visible === false ? 2 : 16, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 0.15s" }} />
                            </button>
                          </td>
                        )}
                        <td style={{ padding: "13px 16px" }}>
                          {item.system && !isSA ? null : <RowMenu actions={rowActions} />}
                        </td>
                      </tr>
                    );
                  })}
                  </>
                )}
              </tbody>
            </table>

            {/* Pagination footer (Attachments) */}
            {isFiles && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderTop: `1px solid ${C.border}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <span style={{ fontSize: 13, color: C.slate }}>Page {page} of {totalPages}</span>
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${C.border}`, background: "#fff", cursor: page <= 1 ? "default" : "pointer", color: page <= 1 ? C.muted : C.slate }}>‹</button>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${C.border}`, background: "#fff", cursor: page >= totalPages ? "default" : "pointer", color: page >= totalPages ? C.muted : C.slate }}>›</button>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }} style={{ ...fieldStyle, width: "auto", padding: "6px 10px" }}>
                    {[10, 25, 50].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                  <span style={{ fontSize: 13, color: C.slate }}>Displaying {from}-{to} of {total} records</span>
                </div>
              </div>
            )}
          </div>
          )}

        </div>
      </div>

      {editing && section.key === "templates" && (
        <EmailTemplateEditor
          template={emailTpls.find(t => t.id === editing.item?.id) || editing.item}
          showJourney={false}
          onSave={saveTemplate} onClose={() => setEditing(null)} />
      )}
      {editing && section.key !== "templates" && (
        <ItemModal section={section} item={editing.item}
          lifecycleNames={data.lifecycle.map(l => l.name)}
          onClose={() => setEditing(null)} onSave={upsert} />
      )}
      {addingFile && <AttachmentModal onClose={() => setAddingFile(false)} onSave={addFile} />}
      {connecting && <ConnectModal card={connecting} onClose={() => setConnecting(null)} onConnect={confirmConnect} />}
      {disconnecting && <DisconnectModal card={disconnecting} onClose={() => setDisconnecting(null)} onConfirm={confirmDisconnect} />}
      {toast && (
        <div style={{ position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", background: C.navy, color: "#fff", padding: "10px 20px", borderRadius: 10, fontSize: 13, fontWeight: 600, zIndex: 600, boxShadow: "0 8px 24px rgba(0,0,0,0.25)" }}>
          {toast}
        </div>
      )}
    </div>
  );
};
