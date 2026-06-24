import React, { useState, useMemo } from "react";
import { C } from "../../theme";

// ─────────────────────────────────────────────────────────────────────────────
// MVP SETTINGS PAGE (Super Admin)
// Left-rail section nav + a CRUD list per section. Language-bearing sections
// (Products, Campaigns, …) show a flag set; configuration sections (Lifecycle
// Stages, Stage Statuses) show a colour swatch instead.
// ─────────────────────────────────────────────────────────────────────────────

const LANGS = [
  { key: "de", flag: "🇩🇪", label: "German"  },
  { key: "en", flag: "🇬🇧", label: "English" },
  { key: "fr", flag: "🇫🇷", label: "French"  },
  { key: "cz", flag: "🇨🇿", label: "Czech"   },
];

const L = (...keys) => Object.fromEntries(LANGS.map(l => [l.key, keys.includes(l.key)]));

// ── seed data ─────────────────────────────────────────────────────────────────
const SEED = {
  products: [
    { id: "p1", name: "Financing",                    langs: L("de", "en", "fr") },
    { id: "p2", name: "Debt Restructuring (Refinancing)", langs: L("de", "en") },
    { id: "p3", name: "ETFs - Securities",            langs: L("de", "en", "fr") },
    { id: "p4", name: "Funds",                        langs: L("de", "en", "fr") },
    { id: "p5", name: "Gold - Precious Metals",       langs: L("de", "en") },
    { id: "p6", name: "Crypto",                       langs: L("de", "en", "fr", "cz") },
    { id: "p7", name: "Life Insurance",               langs: L("de", "en", "fr") },
    { id: "p8", name: "Asset Management",             langs: L("de", "en", "fr") },
    { id: "p9", name: "Other Insurance",              langs: L("de", "en", "fr") },
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
    { id: "c1", name: "General",                            langs: L("de", "en", "fr") },
    { id: "c2", name: "Securities",                         langs: L("de") },
    { id: "c3", name: "Financing",                          langs: L("de", "fr") },
    { id: "c4", name: "Participation in Customer Presentation", langs: L("de", "en", "fr") },
    { id: "c5", name: "Real Estate",                        langs: L("de", "en") },
    { id: "c6", name: "Fee-based Consulting",               langs: L("de", "en", "fr", "cz") },
    { id: "c7", name: "Prospective Client",                 langs: L("de", "en", "fr") },
    { id: "c8", name: "Participation in Business Opening",  langs: L("de", "en", "fr") },
    { id: "c9", name: "Gold",                               langs: L("de", "en", "fr") },
  ],
  templates: [
    { id: "t1", name: "Welcome Email",        langs: L("de", "en", "fr") },
    { id: "t2", name: "Appointment Reminder", langs: L("de", "en") },
    { id: "t3", name: "Follow-up",            langs: L("de", "en", "fr") },
    { id: "t4", name: "GDPR Consent",         langs: L("de", "en") },
    { id: "t5", name: "Birthday Greeting",    langs: L("de", "en", "fr", "cz") },
  ],
  attachments: [
    { id: "a1", name: "GDPR Consent Form",  langs: L("de", "en") },
    { id: "a2", name: "Product Brochure",   langs: L("de", "en", "fr") },
    { id: "a3", name: "Contract Template",  langs: L("de", "en") },
    { id: "a4", name: "ID Verification",    langs: L("de", "en") },
  ],
  labels: [
    { id: "lb1", name: "Hot Contact",  langs: L("de", "en"), color: "#F04438" },
    { id: "lb2", name: "VIP",          langs: L("de", "en"), color: "#7C3AED" },
    { id: "lb3", name: "GDPR Pending", langs: L("de", "en"), color: "#FDB022" },
    { id: "lb4", name: "Campaign Q1",  langs: L("de", "en"), color: "#0891B2" },
    { id: "lb5", name: "Do Not Call",  langs: L("de", "en"), color: "#667085" },
  ],
  lifecycle: [
    { id: "ls1", name: "New",         color: C.slate  },
    { id: "ls2", name: "In Contact",  color: C.blue   },
    { id: "ls3", name: "Appointment", color: C.indigo },
    { id: "ls4", name: "Closing",     color: C.green  },
    { id: "ls5", name: "Excluded",    color: C.muted  },
  ],
  statuses: [
    { id: "ss1", name: "New / Open",             color: C.slate  },
    { id: "ss2", name: "In Progress",            color: C.blue   },
    { id: "ss3", name: "Attempted",              color: C.amber  },
    { id: "ss4", name: "Not Reached",            color: C.red    },
    { id: "ss5", name: "Not Interested",         color: C.muted  },
    { id: "ss6", name: "Appointment Scheduled",  color: C.indigo },
    { id: "ss7", name: "Follow Up",              color: C.purple },
    { id: "ss8", name: "Closed / Customer",      color: C.green  },
    { id: "ss9", name: "Do Not Contact",         color: C.slate  },
  ],
};

const SECTIONS = [
  { key: "products",   label: "Products",        singular: "Product",       kind: "lang"  },
  { key: "sources",    label: "Lead Sources",    singular: "Lead Source",   kind: "lang"  },
  { key: "campaigns",  label: "Campaigns",       singular: "Campaign",      kind: "lang"  },
  { key: "templates",  label: "Email Templates", singular: "Email Template",kind: "lang"  },
  { key: "attachments",label: "Attachements",    singular: "Attachment",    kind: "lang"  },
  { key: "labels",     label: "Labels",          singular: "Label",         kind: "color" },
  { key: "lifecycle",  label: "Lifecycle Stages",singular: "Lifecycle Stage",kind: "color" },
  { key: "statuses",   label: "Stage Statuses",  singular: "Stage Status",  kind: "color" },
];

const fieldStyle = {
  width: "100%", padding: "10px 12px", borderRadius: 8,
  border: `1px solid ${C.border}`, fontSize: 13, fontFamily: "inherit",
  color: C.text, boxSizing: "border-box", outline: "none", background: "#fff",
};

// ── language flag set ─────────────────────────────────────────────────────────
const FlagSet = ({ langs }) => (
  <div style={{ display: "flex", gap: 6 }}>
    {LANGS.map(l => (
      <span key={l.key} title={l.label} style={{ fontSize: 17, opacity: langs[l.key] ? 1 : 0.25, filter: langs[l.key] ? "none" : "grayscale(1)" }}>
        {l.flag}
      </span>
    ))}
  </div>
);

// ── row 3-dot menu ────────────────────────────────────────────────────────────
const RowMenu = ({ onEdit, onDelete }) => {
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
          <div style={{ position: "absolute", top: 32, right: 0, zIndex: 260, background: "#fff", borderRadius: 10, boxShadow: "0 8px 28px rgba(0,0,0,0.16)", border: `1px solid ${C.border}`, minWidth: 130, padding: "5px 0" }}>
            {[["Edit", onEdit], ["Delete", onDelete]].map(([label, fn]) => (
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

// ── add / edit modal ──────────────────────────────────────────────────────────
const ItemModal = ({ section, item, onClose, onSave }) => {
  const isColor = section.kind === "color";
  const [name, setName] = useState(item?.name || "");
  const [langs, setLangs] = useState(item?.langs || L("de"));
  const [color, setColor] = useState(item?.color || C.indigo);
  const valid = name.trim();
  const palette = [C.slate, C.blue, C.indigo, C.purple, C.amber, C.red, C.green, "#0891B2"];

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", zIndex: 400 }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 440, maxWidth: "92vw", background: "#fff", borderRadius: 16, zIndex: 500, boxShadow: "0 24px 64px rgba(0,0,0,0.22)", padding: "22px 24px", fontFamily: "inherit" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: C.navy }}>{item ? "Edit" : "Add"} {section.singular}</div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: C.muted }}>×</button>
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: C.navy, display: "block", marginBottom: 6 }}>Name *</label>
          <input style={fieldStyle} value={name} onChange={e => setName(e.target.value)} placeholder={`${section.singular} name`} autoFocus />
        </div>
        {isColor ? (
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: C.navy, display: "block", marginBottom: 8 }}>Colour</label>
            <div style={{ display: "flex", gap: 8 }}>
              {palette.map(col => (
                <button key={col} onClick={() => setColor(col)} style={{
                  width: 28, height: 28, borderRadius: "50%", background: col, cursor: "pointer",
                  border: color === col ? `3px solid ${C.navy}` : `2px solid #fff`, boxShadow: `0 0 0 1px ${C.border}`,
                }} />
              ))}
            </div>
          </div>
        ) : (
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: C.navy, display: "block", marginBottom: 8 }}>Languages</label>
            <div style={{ display: "flex", gap: 8 }}>
              {LANGS.map(l => (
                <button key={l.key} onClick={() => setLangs(prev => ({ ...prev, [l.key]: !prev[l.key] }))}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 20, cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 600,
                    border: `1.5px solid ${langs[l.key] ? C.primary : C.border}`, background: langs[l.key] ? C.primarySoft : "#fff", color: langs[l.key] ? C.primaryDark : C.slate }}>
                  <span style={{ fontSize: 15 }}>{l.flag}</span> {l.key.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <button onClick={onClose} style={{ padding: "9px 20px", borderRadius: 9, border: "none", background: "transparent", color: C.slate, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
          <button disabled={!valid} onClick={() => onSave({ ...item, id: item?.id || `new-${Date.now()}`, name: name.trim(), langs, color })}
            style={{ padding: "9px 24px", borderRadius: 9, border: "none", background: valid ? C.primary : C.border, color: valid ? "#fff" : C.muted, fontSize: 13, fontWeight: 700, cursor: valid ? "pointer" : "default" }}>
            {item ? "Save" : `Add ${section.singular}`}
          </button>
        </div>
      </div>
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
export const MVPSettingsPage = () => {
  const [active, setActive]   = useState("products");
  const [data, setData]       = useState(SEED);
  const [search, setSearch]   = useState("");
  const [editing, setEditing] = useState(null);   // { item } | { item:null } when adding

  const section = SECTIONS.find(s => s.key === active);
  const items   = data[active] || [];
  const rows = useMemo(
    () => items.filter(i => i.name.toLowerCase().includes(search.toLowerCase())),
    [items, search]
  );

  const upsert = (item) => {
    setData(prev => {
      const list = prev[active];
      const exists = list.some(x => x.id === item.id);
      return { ...prev, [active]: exists ? list.map(x => x.id === item.id ? item : x) : [item, ...list] };
    });
    setEditing(null);
  };
  const remove = (id) => setData(prev => ({ ...prev, [active]: prev[active].filter(x => x.id !== id) }));

  return (
    <div style={{ padding: "24px 28px", fontFamily: "inherit" }}>
      <h1 style={{ margin: "0 0 18px", fontSize: 22, fontWeight: 700, color: C.navy, letterSpacing: "-0.02em" }}>Settings</h1>

      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 18, alignItems: "start" }}>
        {/* Left rail */}
        <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 14, padding: 10 }}>
          {SECTIONS.map(s => {
            const on = s.key === active;
            return (
              <div key={s.key} onClick={() => { setActive(s.key); setSearch(""); }}
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
            <button onClick={() => setEditing({ item: null })} style={{ padding: "9px 18px", borderRadius: 8, border: "none", background: C.primary, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              Add {section.singular}
            </button>
          </div>

          <div style={{ position: "relative", marginBottom: 14 }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: C.muted, fontSize: 14 }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search"
              style={{ ...fieldStyle, paddingLeft: 34, maxWidth: 360 }} />
          </div>

          <div style={{ border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: C.light, borderBottom: `1px solid ${C.border}` }}>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 13, fontWeight: 600, color: C.slate }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>Name <span style={{ color: C.muted }}>⇅</span></span>
                  </th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 13, fontWeight: 600, color: C.slate }}>
                    {section.kind === "color" ? "Colour" : "Language"}
                  </th>
                  <th style={{ width: 56 }} />
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr><td colSpan={3} style={{ padding: "36px", textAlign: "center", color: C.muted, fontSize: 13 }}>No {section.label.toLowerCase()} found.</td></tr>
                )}
                {rows.map(item => (
                  <tr key={item.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: "13px 16px", fontSize: 14, color: C.text }}>{item.name}</td>
                    <td style={{ padding: "13px 16px" }}>
                      {section.kind === "color"
                        ? <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, color: C.slate }}>
                            <span style={{ width: 12, height: 12, borderRadius: "50%", background: item.color, display: "inline-block" }} />
                            {item.color}
                          </span>
                        : <FlagSet langs={item.langs} />}
                    </td>
                    <td style={{ padding: "13px 16px" }}>
                      <RowMenu onEdit={() => setEditing({ item })} onDelete={() => remove(item.id)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {editing && (
        <ItemModal section={section} item={editing.item} onClose={() => setEditing(null)} onSave={upsert} />
      )}
    </div>
  );
};
