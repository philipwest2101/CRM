import React, { useState, useContext, useRef } from "react";
import { C } from "../../theme";
import { ALL_LEADS } from "../../lib/core";
import { useT, LangContext } from "../../lib/i18n";

// ─────────────────────────────────────────────────────────────────────────────
// Newsletter — HubSpot-style email editor (mock, client-side)
//   Tabs: Templates (gallery) / Groups (built from contacts) / Statistics.
//   Editor: single page — block palette, inline-editable canvas, settings &
//   send panel side by side.
// ─────────────────────────────────────────────────────────────────────────────

// Localised value helper — template content carries both languages.
const L = (de, en) => ({ de, en });
const pick = (v, lang) => (v && typeof v === "object" && v.de !== undefined) ? v[lang] : v;

// ── Block palette ────────────────────────────────────────────────────────────
const BLOCK_TYPES = [
  { type:"logo",    icon:"🏷️", labelKey:"nlBlockLogo"    },
  { type:"image",   icon:"🖼️", labelKey:"nlBlockImage"   },
  { type:"heading", icon:"🔠", labelKey:"nlBlockHeading" },
  { type:"text",    icon:"📝", labelKey:"nlBlockText"    },
  { type:"button",  icon:"🔘", labelKey:"nlBlockButton"  },
  { type:"divider", icon:"➖", labelKey:"nlBlockDivider" },
  { type:"footer",  icon:"⚓", labelKey:"nlBlockFooter"  },
];

const BLOCK_DEFAULTS = {
  logo:    { text:"vionworld" },
  image:   { label:"" },
  heading: { text:L("Ihre Überschrift","Your headline goes here") },
  text:    { text:L("Schreiben Sie hier Ihren Text. Mit {FirstName} personalisieren Sie die Anrede.","Write your paragraph here. Use {FirstName} to personalise the greeting.") },
  button:  { label:L("Jetzt mehr erfahren","Call to action"), url:"#" },
  divider: {},
  footer:  { text:"vion gmbh · Musterstraße 1 · 80331 München" },
};

let blockSeq = 0;
const resolveBlock = (b, lang) => {
  const o = { ...b, id:`b${Date.now()}_${blockSeq++}` };
  for (const k of ["text","label"]) if (o[k] !== undefined) o[k] = pick(o[k], lang);
  return o;
};
const newBlock = (type, lang) => resolveBlock({ type, ...BLOCK_DEFAULTS[type] }, lang);

// ── Pre-built templates (block sets, both languages) ─────────────────────────
const NL_TEMPLATES = [
  { id:"t1", name:L("Monatliches Markt-Update","Monthly Market Update"), desc:L("Regelmäßiger Finanzmarkt-Überblick","Regular financial market digest"),
    subject:L("Ihr monatliches Markt-Update von vion","Your monthly market update from vion"),
    blocks:[
      { type:"logo", text:"vionworld" },
      { type:"heading", text:L("📈 Markt-Update — {Monat}","📈 Market Update — {Month}") },
      { type:"text", text:L("Guten Tag {FirstName},\n\nhier ist Ihre Marktübersicht für diesen Monat — die wichtigsten Bewegungen, was sie für Sie bedeuten und der Ausblick unserer Analysten.","Dear {FirstName},\n\nHere is your market summary for this month — key movements, what they mean for you, and our analysts' outlook for the coming weeks.") },
      { type:"image", label:L("Marktchart","Market chart") },
      { type:"text", text:L("• Märkte im Überblick — die wichtigsten Bewegungen\n• Der Ausblick unserer Analysten für die kommenden Wochen\n• Ein praktischer Tipp für Ihr Portfolio","• Markets at a glance — key movements and what they mean for you\n• Our analysts' outlook for the coming weeks\n• One practical tip to strengthen your portfolio") },
      { type:"button", label:L("Zum vollständigen Bericht","Read the full report"), url:"#" },
      { type:"divider" },
      { type:"footer", text:"vion gmbh · Musterstraße 1 · 80331 München" },
    ]},
  { id:"t2", name:L("Produkt-Ankündigung","Product Announcement"), desc:L("Neues Produkt oder neue Leistung vorstellen","Introduce a new product or service"),
    subject:L("Neu bei vion: das sollten Sie kennen","New at vion: something we think you'll love"),
    blocks:[
      { type:"logo", text:"vionworld" },
      { type:"image", label:L("Produktbild","Product hero image") },
      { type:"heading", text:L("🎉 Unser neuestes Angebot","🎉 Introducing our newest offering") },
      { type:"text", text:L("Guten Tag {FirstName},\n\nwir haben Neuigkeiten — wir haben etwas Neues für Sie. Darum lohnt es sich:\n\n• Vorteil 1\n• Vorteil 2\n• Vorteil 3","Dear {FirstName},\n\nWe have exciting news — we've just launched something new. Here's why it matters for you:\n\n• Benefit 1\n• Benefit 2\n• Benefit 3") },
      { type:"button", label:L("Mehr erfahren","Learn more"), url:"#" },
      { type:"divider" },
      { type:"footer", text:"vion gmbh · Musterstraße 1 · 80331 München" },
    ]},
  { id:"t3", name:L("Event-Einladung","Event Invitation"), desc:L("Zu Webinar oder Veranstaltung einladen","Invite subscribers to a webinar or event"),
    subject:L("Sie sind eingeladen: [Veranstaltung]","You're invited: [Event name]"),
    blocks:[
      { type:"logo", text:"vionworld" },
      { type:"heading", text:L("📅 Sie sind eingeladen!","📅 You're invited!") },
      { type:"text", text:L("Guten Tag {FirstName},\n\nwir laden Sie herzlich zu unserer Veranstaltung ein:\n\n📅 Datum: [Datum]\n🕕 Uhrzeit: [Uhrzeit]\n📍 Ort: [Ort / Online]","Dear {FirstName},\n\nWe warmly invite you to our upcoming event:\n\n📅 Date: [Date]\n🕕 Time: [Time]\n📍 Location: [Location / Online]") },
      { type:"text", text:L("Die Plätze sind begrenzt — sichern Sie sich Ihren noch heute.","Seats are limited — reserve yours today.") },
      { type:"button", label:L("Platz reservieren","Reserve my seat"), url:"#" },
      { type:"divider" },
      { type:"footer", text:"vion gmbh · Musterstraße 1 · 80331 München" },
    ]},
  { id:"t4", name:L("Willkommens-Newsletter","Welcome Newsletter"), desc:L("Erster Newsletter für neue Abonnenten","First newsletter for new subscribers"),
    subject:L("Willkommen beim vion Newsletter, {FirstName}!","Welcome to the vion newsletter, {FirstName}!"),
    blocks:[
      { type:"logo", text:"vionworld" },
      { type:"heading", text:L("👋 Willkommen, {FirstName}!","👋 Welcome aboard, {FirstName}!") },
      { type:"text", text:L("Schön, dass Sie dabei sind! Das erwartet Sie in unserem Newsletter:\n\n• Monatliche Markt-Updates und Finanz-Einblicke\n• Praktische Tipps für Ihre Finanzplanung\n• Einladungen zu exklusiven Events und Webinaren","Great to have you with us! Here's what you can expect from our newsletter:\n\n• Monthly market updates and financial insights\n• Practical tips for your financial planning\n• Invitations to exclusive events and webinars") },
      { type:"button", label:L("Berater kennenlernen","Meet your advisor"), url:"#" },
      { type:"divider" },
      { type:"footer", text:"vion gmbh · Musterstraße 1 · 80331 München" },
    ]},
  { id:"t5", name:L("Tipps & Einblicke","Tips & Insights"), desc:L("Wissenswertes und praktische Ratschläge","Educational content and practical advice"),
    subject:L("3 Finanz-Tipps, die Sie sofort nutzen können","3 financial tips you can use right away"),
    blocks:[
      { type:"logo", text:"vionworld" },
      { type:"heading", text:L("💡 3 Tipps für Ihre Finanzen","💡 3 tips for your finances") },
      { type:"text", text:L("Guten Tag {FirstName},\n\n1️⃣ [Tipp eins — kurz und umsetzbar]\n\n2️⃣ [Tipp zwei — kurz und umsetzbar]\n\n3️⃣ [Tipp drei — kurz und umsetzbar]","Dear {FirstName},\n\n1️⃣ [Tip one — short and actionable]\n\n2️⃣ [Tip two — short and actionable]\n\n3️⃣ [Tip three — short and actionable]") },
      { type:"divider" },
      { type:"text", text:L("Sie möchten eine persönliche Empfehlung? Ihr Berater ist nur eine Antwort entfernt.","Want a personal recommendation? Your advisor is just one reply away.") },
      { type:"button", label:L("Kostenlose Beratung buchen","Book a free consultation"), url:"#" },
      { type:"footer", text:"vion gmbh · Musterstraße 1 · 80331 München" },
    ]},
  { id:"t6", name:L("Saisonale Grüße","Seasonal Greetings"), desc:L("Feiertags- und Saisongrüße an Ihre Kontakte","Holiday and season's greetings"),
    subject:L("Herzliche Grüße vom gesamten vion Team","Season's greetings from all of us at vion"),
    blocks:[
      { type:"image", label:L("Saisonales Banner","Seasonal banner") },
      { type:"heading", text:L("🎄 Herzliche Grüße, {FirstName}!","🎄 Season's greetings, {FirstName}!") },
      { type:"text", text:L("Zum Jahresende möchten wir Danke sagen — für Ihr Vertrauen und die gute Zusammenarbeit.\n\nWir wünschen Ihnen und Ihren Liebsten eine wunderbare Weihnachtszeit und ein gesundes, erfolgreiches neues Jahr.","As the year draws to a close, we want to say thank you — for your trust and the great cooperation.\n\nWe wish you and your loved ones a wonderful holiday season and a healthy, successful new year.") },
      { type:"divider" },
      { type:"footer", text:"vion gmbh · Musterstraße 1 · 80331 München" },
    ]},
];
const instantiateTpl = (tpl, lang) => tpl.blocks.map(b => resolveBlock(b, lang));

// ── Recipient groups (user data — seeded in German, the app default) ─────────
const NL_GROUPS = [
  { id:"g1", name:"Newsletter-Abonnenten", members:210, desc:"Alle Kontakte mit Newsletter-Opt-in" },
  { id:"g2", name:"Alle Kunden",           members:142, desc:"Aktive Kunden mit Vertrag" },
  { id:"g3", name:"Finanzierung Leads Q2", members:48,  desc:"Kampagne: Finanzierung · Q2" },
  { id:"g4", name:"Webinar-Teilnehmer",    members:198, desc:"Mind. ein Webinar besucht" },
];

// ── Send history + unsubscribes (mock, matches the stats wireframe) ──────────
const NL_ITEMS = [
  { id:"n1", name:"Frühjahrs-Update", subject:"Frühjahrs-Update: nachhaltige Vorsorge", groupId:"g1",
    blocks:instantiateTpl(NL_TEMPLATES[0], "de"), status:"sent", date:"24.06.2026",
    stats:{ rec:210, deliv:206, opened:84, clicked:23, unsub:3, bounces:4 } },
  { id:"n2", name:"Finanzierung 2026", subject:"Ihre Finanzierung 2026 – Konditionen", groupId:"g3",
    blocks:instantiateTpl(NL_TEMPLATES[1], "de"), status:"sent", date:"11.06.2026",
    stats:{ rec:48, deliv:47, opened:21, clicked:9, unsub:1, bounces:1 } },
  { id:"n3", name:"Sommer-Aktion", subject:"Sommer-Aktion Gold-Sparplan", groupId:"g2",
    blocks:instantiateTpl(NL_TEMPLATES[4], "de"), status:"scheduled", date:"02.07.2026",
    stats:{ rec:142, deliv:0, opened:0, clicked:0, unsub:0, bounces:0 } },
  { id:"n4", name:"Webinar-Einladung", subject:"Webinar-Einladung Altersvorsorge", groupId:"g1",
    blocks:instantiateTpl(NL_TEMPLATES[2], "de"), status:"draft", date:"—",
    stats:{ rec:210, deliv:0, opened:0, clicked:0, unsub:0, bounces:0 } },
];

const NL_UNSUBSCRIBED = [
  { id:"u1", name:"Peter Hofer",   email:"p.hofer@mail.de",   date:"24.06.2026" },
  { id:"u2", name:"Julia Mertens", email:"j.mertens@mail.de", date:"24.06.2026" },
  { id:"u3", name:"Stefan Koch",   email:"s.koch@mail.de",    date:"11.06.2026" },
];

const STATUS_COLOR = { draft:"#94A3B8", scheduled:C.amber, sent:C.green };

// ── Shared styles ────────────────────────────────────────────────────────────
const CANVAS_BG = "#EAF0F6";
const inputStyle: React.CSSProperties = {
  width:"100%", padding:"9px 11px", borderRadius:8, border:`1px solid ${C.border}`,
  fontSize:13, fontFamily:"inherit", boxSizing:"border-box", outline:"none", background:"#fff", color:C.text,
};
const labelStyle: React.CSSProperties = {
  fontSize:10.5, fontWeight:700, color:C.slate, textTransform:"uppercase",
  letterSpacing:"0.05em", display:"block", marginBottom:4,
};
const btn = (primary=false): React.CSSProperties => ({
  padding:"9px 16px", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit",
  border: primary ? "none" : `1px solid ${C.border}`,
  background: primary ? C.primary : "#fff",
  color: primary ? "#fff" : C.slate,
});
const Avatar = ({ name }) => {
  const initials = name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
  const palette = [C.blue, C.indigo, C.green, C.amber, "#EC4899", C.purple];
  return (
    <div style={{ width:34, height:34, borderRadius:"50%", background:palette[name.charCodeAt(0)%palette.length]+"22",
      color:palette[name.charCodeAt(0)%palette.length], fontSize:12, fontWeight:700,
      display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{initials}</div>
  );
};

// ── Email block renderer — inline-editable on the canvas ─────────────────────
const editableTextStyle = (base): React.CSSProperties => ({
  ...base, width:"100%", border:"none", outline:"none", background:"#FFF8EE",
  fontFamily:"inherit", boxSizing:"border-box", resize:"none", padding:0, borderRadius:4,
});

const BlockView = ({ b, editing=false, onChange=null }) => {
  const stop = e => e.stopPropagation();
  switch (b.type) {
    case "logo": {
      const style = { fontSize:20, fontWeight:800, letterSpacing:"-0.02em", textAlign:"center" as const };
      return (
        <div style={{ padding:"20px 24px 14px", textAlign:"center" }}>
          {editing
            ? <input autoFocus value={b.text||""} onClick={stop} onChange={e=>onChange({ text:e.target.value })}
                style={{ ...editableTextStyle(style), color:C.primary }}/>
            : <span style={style}>
                <span style={{ color:C.primary }}>{(b.text||"vionworld").slice(0,4)}</span>
                <span style={{ fontWeight:400, color:"#98A2B3" }}>{(b.text||"vionworld").slice(4)}</span>
              </span>}
        </div>);
    }
    case "image": return (
      <div style={{ margin:"8px 24px", height:150, borderRadius:8, display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center", gap:6, color:"#8CA3B8", fontSize:12,
        background:"linear-gradient(135deg,#F0F4F8,#DFE8F0)", border:"1.5px dashed #C3D1DE" }}>
        <span style={{ fontSize:26 }}>🖼️</span>
        {editing
          ? <input autoFocus value={b.label||""} onClick={stop} onChange={e=>onChange({ label:e.target.value })}
              placeholder="Caption" style={{ ...editableTextStyle({ fontSize:12, textAlign:"center" }), width:220, color:"#8CA3B8" }}/>
          : (b.label || "")}
      </div>);
    case "heading": {
      const style = { fontSize:23, fontWeight:800, color:"#1D2939", lineHeight:1.3 };
      return (
        <div style={{ padding:"14px 24px 6px" }}>
          {editing
            ? <input autoFocus value={b.text||""} onClick={stop} onChange={e=>onChange({ text:e.target.value })} style={editableTextStyle(style)}/>
            : <div style={style}>{b.text}</div>}
        </div>);
    }
    case "text": case "footer": {
      const isFooter = b.type==="footer";
      const style = isFooter
        ? { fontSize:10.5, color:"#8CA3B8", lineHeight:1.8, textAlign:"center" as const, whiteSpace:"pre-wrap" as const }
        : { fontSize:13.5, color:"#33475B", lineHeight:1.7, whiteSpace:"pre-wrap" as const };
      return (
        <div style={{ padding:isFooter?"16px 24px 22px":"8px 24px" }}>
          {editing
            ? <textarea autoFocus value={b.text||""} onClick={stop} onChange={e=>onChange({ text:e.target.value })}
                rows={Math.max(2, String(b.text||"").split("\n").length)}
                style={editableTextStyle(style)}/>
            : <div style={style}>{b.text}</div>}
          {isFooter && !editing && (
            <div style={{ ...style, marginTop:2 }}>
              <span style={{ textDecoration:"underline" }}>Unsubscribe</span> · <span style={{ textDecoration:"underline" }}>Manage preferences</span>
            </div>)}
        </div>);
    }
    case "button": return (
      <div style={{ padding:"14px 24px", textAlign:"center" }}>
        <span style={{ display:"inline-block", padding:"11px 28px", borderRadius:6, background:C.primary, color:"#fff", fontSize:13.5, fontWeight:700 }}>
          {editing
            ? <input autoFocus value={b.label||""} onClick={stop} onChange={e=>onChange({ label:e.target.value })}
                style={{ border:"none", outline:"none", background:"transparent", color:"#fff", fontSize:13.5, fontWeight:700,
                  fontFamily:"inherit", textAlign:"center", width:`${Math.max(10, String(b.label||"").length+1)}ch` }}/>
            : b.label}
        </span>
      </div>);
    case "divider": return (
      <div style={{ padding:"10px 24px" }}><div style={{ height:1, background:"#E3EAF1" }}/></div>);
    default: return null;
  }
};

const EmailFrame = ({ blocks }) => (
  <div style={{ width:600, background:"#fff", borderRadius:4, overflow:"hidden", boxShadow:"0 1px 6px rgba(45,62,80,0.12)" }}>
    {blocks.map(b => <BlockView key={b.id} b={b} />)}
  </div>
);

const TemplateThumb = ({ blocks }) => (
  <div style={{ height:190, overflow:"hidden", background:CANVAS_BG, display:"flex", justifyContent:"center", paddingTop:14 }}>
    <div style={{ transform:"scale(0.4)", transformOrigin:"top center", flexShrink:0 }}>
      <EmailFrame blocks={blocks} />
    </div>
  </div>
);

const Toast = ({ msg }) => (
  <div style={{ position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)", zIndex:700,
    background:C.navy, color:"#fff", padding:"11px 20px", borderRadius:10, fontSize:13, fontWeight:600,
    boxShadow:"0 8px 28px rgba(0,0,0,0.25)", whiteSpace:"nowrap" }}>
    {msg}
  </div>
);

// ── Add Group modal — filter all contacts and pick the members ───────────────
const AddGroupModal = ({ t, onClose, onCreate }) => {
  const [gName, setGName] = useState("");
  const [fCamp, setFCamp] = useState("all");
  const [fSrc,  setFSrc]  = useState("all");
  const [fCity, setFCity] = useState("all");
  const [q,     setQ]     = useState("");
  const [sel,   setSel]   = useState({});

  const uniq = (key) => [...new Set(ALL_LEADS.map(l=>l[key]).filter(Boolean))].sort();
  const campaigns = uniq("campaign"), sources = uniq("source"), cities = uniq("city");

  const filtered = ALL_LEADS.filter(l =>
    (fCamp==="all" || l.campaign===fCamp) &&
    (fSrc==="all"  || l.source===fSrc) &&
    (fCity==="all" || l.city===fCity) &&
    (!q || `${l.name} ${l.email}`.toLowerCase().includes(q.toLowerCase()))
  );
  const count = Object.values(sel).filter(Boolean).length;
  const allChecked = filtered.length>0 && filtered.every(l=>sel[l.id]);
  const toggleAll = () => setSel(prev => {
    const next = { ...prev };
    filtered.forEach(l => { next[l.id] = !allChecked; });
    return next;
  });

  const selStyle: React.CSSProperties = { ...inputStyle, padding:"8px 10px", fontSize:12, cursor:"pointer", width:"auto", minWidth:130 };

  const create = () => {
    if (!gName.trim() || count===0) { onCreate(null); return; }
    const parts = [fCamp!=="all"&&fCamp, fSrc!=="all"&&fSrc, fCity!=="all"&&fCity].filter(Boolean);
    onCreate({ id:`g${Date.now()}`, name:gName.trim(), members:count, desc:parts.join(" · ") || t("nlContactCol") });
  };

  return (<>
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.45)", zIndex:500 }}/>
    <div style={{ position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:760, maxWidth:"94vw",
      maxHeight:"86vh", display:"flex", flexDirection:"column", background:"#fff", borderRadius:16, zIndex:600,
      boxShadow:"0 24px 64px rgba(0,0,0,0.22)", overflow:"hidden" }}>
      {/* Header */}
      <div style={{ padding:"16px 22px 12px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:12 }}>
        <span style={{ fontSize:16, fontWeight:800, color:C.navy, flex:1 }}>👥 {t("nlAddGroup").replace("+ ","")}</span>
        <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", fontSize:20, color:C.muted }}>×</button>
      </div>
      {/* Name + filters */}
      <div style={{ padding:"14px 22px", borderBottom:`1px solid ${C.border}`, display:"flex", flexDirection:"column", gap:10 }}>
        <div>
          <label style={labelStyle}>{t("nlGroupName")}</label>
          <input value={gName} onChange={e=>setGName(e.target.value)} placeholder={t("nlGroupNamePh")} style={{ ...inputStyle, maxWidth:320 }}/>
        </div>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
          <select value={fCamp} onChange={e=>setFCamp(e.target.value)} style={selStyle}>
            <option value="all">{t("nlAllCampaigns")}</option>
            {campaigns.map(c=><option key={c} value={c}>{c}</option>)}
          </select>
          <select value={fSrc} onChange={e=>setFSrc(e.target.value)} style={selStyle}>
            <option value="all">{t("nlAllSources")}</option>
            {sources.map(s=><option key={s} value={s}>{s}</option>)}
          </select>
          <select value={fCity} onChange={e=>setFCity(e.target.value)} style={selStyle}>
            <option value="all">{t("nlAllCities")}</option>
            {cities.map(c=><option key={c} value={c}>{c}</option>)}
          </select>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder={t("nlSearchContacts")}
            style={{ ...inputStyle, padding:"8px 10px", fontSize:12, flex:1, minWidth:160 }}/>
        </div>
      </div>
      {/* Contact table */}
      <div style={{ flex:1, overflowY:"auto" }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr style={{ background:C.light, position:"sticky", top:0, zIndex:1 }}>
              <th style={{ padding:"9px 12px 9px 22px", width:34 }}>
                <input type="checkbox" checked={allChecked} onChange={toggleAll} style={{ cursor:"pointer" }}/>
              </th>
              {[t("nlContactCol"), t("nlAllCities").replace(/^Alle |^All /,""), "Quelle / Source", "Kampagne / Campaign", t("nlConsentCol")].map((h,i)=>(
                <th key={i} style={{ padding:"9px 10px", textAlign:"left", fontSize:11, fontWeight:700, color:C.navy, whiteSpace:"nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(l=>(
              <tr key={l.id} onClick={()=>setSel(prev=>({ ...prev, [l.id]:!prev[l.id] }))}
                style={{ borderBottom:`1px solid ${C.border}`, cursor:"pointer", background:sel[l.id]?C.primarySoft:"#fff" }}>
                <td style={{ padding:"8px 12px 8px 22px" }}>
                  <input type="checkbox" checked={!!sel[l.id]} readOnly style={{ cursor:"pointer" }}/>
                </td>
                <td style={{ padding:"8px 10px" }}>
                  <div style={{ fontSize:12.5, fontWeight:600, color:C.text }}>{l.name}</div>
                  <div style={{ fontSize:10.5, color:C.muted }}>{l.email}</div>
                </td>
                <td style={{ padding:"8px 10px", fontSize:12, color:C.slate }}>{l.city}</td>
                <td style={{ padding:"8px 10px", fontSize:12, color:C.slate }}>{l.source}</td>
                <td style={{ padding:"8px 10px", fontSize:12, color:C.slate }}>{l.campaign}</td>
                <td style={{ padding:"8px 10px", fontSize:13 }}>{l.consent ? "✅" : "—"}</td>
              </tr>
            ))}
            {filtered.length===0 && (
              <tr><td colSpan={6} style={{ padding:"28px", textAlign:"center", color:C.muted, fontSize:12.5 }}>—</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {/* Footer */}
      <div style={{ padding:"13px 22px", borderTop:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:12 }}>
        <span style={{ fontSize:12.5, color:C.slate }}>
          <b style={{ color:C.navy }}>{count}</b> / {filtered.length} {t("nlSelected")}
        </span>
        <div style={{ flex:1 }}/>
        <button onClick={onClose} style={btn()}>{t("nlCancel")}</button>
        <button onClick={create} style={{ ...btn(true), opacity:(!gName.trim()||count===0)?0.5:1 }}>
          👥 {t("nlCreateGroup")}
        </button>
      </div>
    </div>
  </>);
};

// ─────────────────────────────────────────────────────────────────────────────
export const NewsletterPage = () => {
  const t = useT();
  const { lang } = useContext(LangContext);

  const [tab, setTab]         = useState("templates");     // templates | groups | stats
  const [view, setView]       = useState("list");          // list | editor
  const [items, setItems]     = useState(NL_ITEMS);
  const [groups, setGroups]   = useState(NL_GROUPS);
  const [toast, setToast]     = useState(null);
  const [groupModal, setGroupModal] = useState(false);

  // ── Editor state ───────────────────────────────────────────────────────────
  const [editId, setEditId]       = useState(null);
  const [name, setName]           = useState("");
  const [subject, setSubject]     = useState("");
  const [preheader, setPreheader] = useState("");
  const [fromName, setFromName]   = useState("vion Newsletter");
  const [fromEmail, setFromEmail] = useState("newsletter@vion.de");
  const [groupId, setGroupId]     = useState("g1");
  const [blocks, setBlocks]       = useState([]);
  const [selId, setSelId]         = useState(null);
  const [dragType, setDragType]   = useState(null);
  const [dropIdx, setDropIdx]     = useState(null);
  const [sendOpt, setSendOpt]     = useState("now");
  const [schedDate, setSchedDate] = useState("2026-08-01");
  const [schedTime, setSchedTime] = useState("10:00");
  const [testSent, setTestSent]   = useState(false);

  const toastTimer = useRef(null);
  const showToast = (msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(()=>setToast(null), 2600);
  };
  const group     = groups.find(g=>g.id===groupId) || groups[0];
  const selBlock  = blocks.find(b=>b.id===selId);

  // ── Editor open / save / send ──────────────────────────────────────────────
  const openEditor = (item=null, template=null) => {
    setEditId(item?.id || null);
    setName(item?.name || (template ? pick(template.name, lang) : ""));
    setSubject(item?.subject || (template ? pick(template.subject, lang) : ""));
    setPreheader(item?.preheader || "");
    setGroupId(item?.groupId || groups[0]?.id || "g1");
    setBlocks(item?.blocks ? item.blocks.map(b=>({ ...b })) : template ? instantiateTpl(template, lang)
      : [newBlock("logo", lang), newBlock("heading", lang), newBlock("text", lang), newBlock("footer", lang)]);
    setSelId(null); setSendOpt("now"); setTestSent(false);
    setView("editor");
  };
  const closeEditor = () => { setView("list"); setEditId(null); setTab("stats"); };

  const upsert = (status, date, statsPatch={}) => {
    const entry = {
      id:editId||`n${Date.now()}`, name:name||t("nlUntitled"), subject, preheader, groupId, blocks, status, date,
      stats:{ rec:group?.members||0, deliv:0, opened:0, clicked:0, unsub:0, bounces:0, ...statsPatch },
    };
    setItems(prev => editId ? prev.map(i=>i.id===editId?entry:i) : [entry, ...prev]);
  };
  const saveDraft = () => { upsert("draft", "—"); showToast(t("nlDraftSaved")); };
  const sendTest  = () => { setTestSent(true); showToast(`${t("nlTestSentToast")} ${fromEmail}`); };
  const send = () => {
    if(!subject.trim() || blocks.length===0) { showToast(t("nlIncompleteToast")); return; }
    if(sendOpt==="scheduled") { upsert("scheduled", `${schedDate}, ${schedTime}`); closeEditor(); showToast(`${t("nlScheduledToast")} ${schedDate}, ${schedTime}`); }
    else {
      const m = group?.members||0;
      upsert("sent", new Date().toLocaleDateString("de-DE"), { deliv:m, opened:0, clicked:0 });
      closeEditor(); showToast(`${t("nlSentToast")} ${m.toLocaleString()} ${t("nlRecipients")}`);
    }
  };

  // ── Block operations ───────────────────────────────────────────────────────
  const addBlockAt = (type, idx=null) => {
    const b = newBlock(type, lang);
    setBlocks(prev => { const next=[...prev]; next.splice(idx==null?next.length:idx, 0, b); return next; });
    setSelId(b.id);
  };
  const updateBlock = (id, patch) => setBlocks(prev => prev.map(b => b.id===id ? { ...b, ...patch } : b));
  const removeBlock = (id) => { setBlocks(prev => prev.filter(b=>b.id!==id)); if(selId===id) setSelId(null); };
  const moveBlock   = (id, dir) => setBlocks(prev => {
    const i = prev.findIndex(b=>b.id===id), j = i + (dir==="up"?-1:1);
    if (i<0 || j<0 || j>=prev.length) return prev;
    const next=[...prev]; [next[i],next[j]]=[next[j],next[i]]; return next;
  });

  const removeGroup = (id) => {
    if(items.some(i=>i.groupId===id)) { showToast(t("nlGroupInUse")); return; }
    setGroups(prev=>prev.filter(g=>g.id!==id)); showToast(t("nlGroupDeleted"));
  };

  // ════════════════════════════════════════════════════════════════════════════
  // EDITOR — one page: palette | inline-editable canvas | settings & send
  // ════════════════════════════════════════════════════════════════════════════
  if(view==="editor") {
    const checklist = [
      { label:t("nlCheckSubject"), ok:!!subject.trim() },
      { label:t("nlCheckContent"), ok:blocks.length>0 },
      { label:t("nlCheckFooter"),  ok:blocks.some(b=>b.type==="footer") },
      { label:t("nlCheckTest"),    ok:testSent, soft:true },
    ];
    return (
      <div style={{ display:"flex", flexDirection:"column", height:"calc(100vh - 54px)", background:CANVAS_BG }}>
        {toast && <Toast msg={toast}/>}

        {/* ── Top bar ── */}
        <div style={{ background:"#fff", borderBottom:`1px solid ${C.border}`, padding:"0 16px", height:52,
          display:"flex", alignItems:"center", gap:12, flexShrink:0 }}>
          <button onClick={closeEditor} style={{ ...btn(), padding:"6px 12px", fontSize:12 }}>{t("nlExit")}</button>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder={t("nlUntitled")}
            style={{ border:"none", outline:"none", fontSize:15, fontWeight:700, color:C.navy, fontFamily:"inherit",
              flex:1, background:"transparent" }}/>
          <button onClick={saveDraft} style={{ ...btn(), padding:"7px 13px", fontSize:12 }}>{t("nlSaveDraft")}</button>
        </div>

        <div style={{ flex:1, display:"flex", overflow:"hidden" }}>
          {/* ── Left: block palette ── */}
          <div style={{ width:232, background:"#fff", borderRight:`1px solid ${C.border}`, overflowY:"auto", flexShrink:0, padding:12 }}>
            <div style={{ fontSize:10.5, fontWeight:800, color:C.slate, textTransform:"uppercase", letterSpacing:"0.07em", margin:"4px 2px 10px" }}>{t("nlContentBlocks")}</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:7 }}>
              {BLOCK_TYPES.map(bt=>(
                <div key={bt.type} draggable
                  onDragStart={()=>setDragType(bt.type)}
                  onDragEnd={()=>{ setDragType(null); setDropIdx(null); }}
                  onClick={()=>addBlockAt(bt.type)}
                  style={{ padding:"12px 4px 9px", borderRadius:9, border:`1px solid ${C.border}`, background:"#fff",
                    textAlign:"center", cursor:"grab", userSelect:"none" }}
                  onMouseEnter={e=>{ e.currentTarget.style.borderColor=C.primary; e.currentTarget.style.background=C.primarySoft; }}
                  onMouseLeave={e=>{ e.currentTarget.style.borderColor=C.border; e.currentTarget.style.background="#fff"; }}>
                  <div style={{ fontSize:18, marginBottom:3 }}>{bt.icon}</div>
                  <div style={{ fontSize:10.5, fontWeight:700, color:C.text }}>{t(bt.labelKey)}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop:12, padding:"9px 11px", borderRadius:9, background:"#F0F6FF", border:"1px solid #D6E6FF", fontSize:10.5, color:"#33475B", lineHeight:1.55 }}>
              {t("nlBlocksHint")}
            </div>
            <div style={{ fontSize:10.5, fontWeight:800, color:C.slate, textTransform:"uppercase", letterSpacing:"0.07em", margin:"14px 2px 8px" }}>{t("nlPersonalisation")}</div>
            <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
              {["{FirstName}","{LastName}","{City}"].map(tk=>(
                <button key={tk} disabled={!selBlock || selBlock.text===undefined}
                  onClick={()=>selBlock && selBlock.text!==undefined && updateBlock(selBlock.id,{ text:(selBlock.text||"")+" "+tk })}
                  style={{ padding:"4px 8px", borderRadius:6, border:`1px solid ${C.border}`, background:"#F8FAFC",
                    fontSize:10.5, fontFamily:"monospace", color:(selBlock&&selBlock.text!==undefined)?C.indigo:C.muted, fontWeight:600,
                    cursor:(selBlock&&selBlock.text!==undefined)?"pointer":"default" }}>{tk}</button>
              ))}
            </div>
          </div>

          {/* ── Center: canvas with inline editing ── */}
          <div style={{ flex:1, overflowY:"auto", padding:"24px 0 60px", display:"flex", justifyContent:"center" }}
            onClick={()=>setSelId(null)}
            onDragOver={e=>{ if(dragType){ e.preventDefault(); } }}
            onDrop={e=>{ if(dragType){ e.preventDefault(); addBlockAt(dragType, dropIdx); setDragType(null); setDropIdx(null); } }}>
            <div style={{ width:600, flexShrink:0 }} onClick={e=>e.stopPropagation()}>
              {/* Inbox preview line */}
              <div style={{ padding:"9px 14px", marginBottom:12, background:"#fff", borderRadius:8, border:`1px solid ${C.border}`, fontSize:12, color:C.slate, display:"flex", gap:8, alignItems:"baseline", overflow:"hidden", whiteSpace:"nowrap" }}>
                <span style={{ fontWeight:700, color:C.navy, flexShrink:0 }}>{fromName}</span>
                <span style={{ fontWeight:600, color:C.text, overflow:"hidden", textOverflow:"ellipsis" }}>{subject||t("nlNoSubjectYet")}</span>
                <span style={{ color:C.muted, overflow:"hidden", textOverflow:"ellipsis" }}>{preheader||t("nlPreviewTextDefault")}</span>
              </div>

              <div style={{ background:"#fff", borderRadius:4, overflow:"hidden", boxShadow:"0 1px 6px rgba(45,62,80,0.12)" }}>
                {blocks.map((b, i)=>(
                  <div key={b.id}
                    onDragOver={e=>{ if(dragType){ e.preventDefault(); e.stopPropagation(); const r=e.currentTarget.getBoundingClientRect(); setDropIdx(e.clientY < r.top + r.height/2 ? i : i+1); } }}
                    style={{ position:"relative" }}>
                    {dragType && dropIdx===i && <div style={{ height:3, background:C.primary, margin:"0 8px", borderRadius:2 }}/>}
                    <div onClick={e=>{ e.stopPropagation(); setSelId(b.id); }}
                      style={{ position:"relative", cursor:selId===b.id?"auto":"pointer",
                        outline:selId===b.id ? `2px solid ${C.primary}` : "2px solid transparent", outlineOffset:-2 }}
                      onMouseEnter={e=>{ if(selId!==b.id) e.currentTarget.style.outline=`2px dashed ${C.primary}55`; }}
                      onMouseLeave={e=>{ if(selId!==b.id) e.currentTarget.style.outline="2px solid transparent"; }}>
                      {selId===b.id && (
                        <div style={{ position:"absolute", top:4, right:6, zIndex:5, display:"flex", gap:3 }}>
                          {[["↑","up"],["↓","dn"]].map(([l,d])=>(
                            <button key={d} onClick={e=>{ e.stopPropagation(); moveBlock(b.id, d); }}
                              style={{ width:22, height:22, borderRadius:5, border:"none", background:C.primary, color:"#fff", fontSize:11, cursor:"pointer" }}>{l}</button>
                          ))}
                          <button onClick={e=>{ e.stopPropagation(); removeBlock(b.id); }}
                            style={{ width:22, height:22, borderRadius:5, border:"none", background:C.red, color:"#fff", fontSize:12, cursor:"pointer" }}>×</button>
                        </div>
                      )}
                      <BlockView b={b} editing={selId===b.id} onChange={patch=>updateBlock(b.id, patch)} />
                      {selId===b.id && b.type==="button" && (
                        <div style={{ padding:"0 24px 12px", display:"flex", gap:8, alignItems:"center" }} onClick={e=>e.stopPropagation()}>
                          <span style={{ fontSize:10.5, fontWeight:700, color:C.slate, whiteSpace:"nowrap" }}>{t("nlButtonUrl")}</span>
                          <input value={b.url||""} onChange={e=>updateBlock(b.id,{ url:e.target.value })}
                            style={{ ...inputStyle, padding:"5px 9px", fontSize:11.5 }}/>
                        </div>
                      )}
                    </div>
                    {dragType && dropIdx===i+1 && i===blocks.length-1 && <div style={{ height:3, background:C.primary, margin:"0 8px", borderRadius:2 }}/>}
                  </div>
                ))}
                {blocks.length===0 && (
                  <div style={{ padding:"56px 20px", textAlign:"center", color:"#8CA3B8" }}
                    onDragOver={e=>{ if(dragType){ e.preventDefault(); setDropIdx(0); } }}>
                    <div style={{ fontSize:30, marginBottom:8 }}>📧</div>
                    <div style={{ fontSize:13 }}>{t("nlBlocksHint")}</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Right: settings & send ── */}
          <div style={{ width:300, background:"#fff", borderLeft:`1px solid ${C.border}`, overflowY:"auto", flexShrink:0, padding:16 }}>
            <div style={{ fontSize:13, fontWeight:800, color:C.navy, marginBottom:12 }}>⚙️ {t("nlSettingsSend")}</div>
            <div style={{ display:"flex", flexDirection:"column", gap:11 }}>
              <div>
                <label style={labelStyle}>{t("nlSubjectLine")}</label>
                <input value={subject} onChange={e=>setSubject(e.target.value)} placeholder={t("nlSubjectPh")} style={inputStyle}/>
              </div>
              <div>
                <label style={labelStyle}>{t("nlPreviewText")}</label>
                <input value={preheader} onChange={e=>setPreheader(e.target.value)} placeholder={t("nlPreviewPh")} style={inputStyle}/>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                <div>
                  <label style={labelStyle}>{t("nlFromName")}</label>
                  <input value={fromName} onChange={e=>setFromName(e.target.value)} style={{ ...inputStyle, fontSize:12 }}/>
                </div>
                <div>
                  <label style={labelStyle}>{t("nlFromAddress")}</label>
                  <input value={fromEmail} onChange={e=>setFromEmail(e.target.value)} style={{ ...inputStyle, fontSize:12 }}/>
                </div>
              </div>
              <div>
                <label style={labelStyle}>{t("nlSendToGroup")}</label>
                <select value={groupId} onChange={e=>setGroupId(e.target.value)} style={{ ...inputStyle, cursor:"pointer" }}>
                  {groups.map(g=><option key={g.id} value={g.id}>{g.name} ({g.members.toLocaleString()})</option>)}
                </select>
              </div>

              {/* Checklist */}
              <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:11 }}>
                <label style={labelStyle}>{t("nlChecklist")}</label>
                {checklist.map((c,i)=>(
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:7, padding:"4px 0", fontSize:12 }}>
                    <span style={{ fontSize:12 }}>{c.ok ? "✅" : c.soft ? "⚠️" : "❌"}</span>
                    <span style={{ color:c.ok?C.text:c.soft?C.amber:C.red }}>{c.label}</span>
                  </div>
                ))}
                <button onClick={sendTest} style={{ ...btn(), width:"100%", marginTop:6, fontSize:12, padding:"8px",
                  color:testSent?C.green:C.slate, borderColor:testSent?C.green:C.border }}>
                  {testSent ? t("nlTestSent") : t("nlSendTest")}
                </button>
              </div>

              {/* When to send */}
              <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:11 }}>
                <label style={labelStyle}>{t("nlWhenToSend")}</label>
                {[["now",t("nlSendNow"),t("nlSendNowSub")],["scheduled",t("nlSchedule"),t("nlScheduleSub")]].map(([k,l,d])=>(
                  <div key={k} onClick={()=>setSendOpt(k)}
                    style={{ padding:"9px 11px", borderRadius:9, cursor:"pointer", marginBottom:7,
                      border:`1.5px solid ${sendOpt===k?C.primary:C.border}`, background:sendOpt===k?C.primarySoft:"#fff" }}>
                    <div style={{ fontSize:12.5, fontWeight:700, color:sendOpt===k?C.primaryDark:C.text }}>{l}</div>
                    <div style={{ fontSize:10.5, color:C.muted }}>{d}</div>
                    {k==="scheduled" && sendOpt==="scheduled" && (
                      <div style={{ display:"flex", gap:6, marginTop:7 }} onClick={e=>e.stopPropagation()}>
                        <input type="date" value={schedDate} onChange={e=>setSchedDate(e.target.value)} style={{ ...inputStyle, padding:"5px 7px", fontSize:11 }}/>
                        <input type="time" value={schedTime} onChange={e=>setSchedTime(e.target.value)} style={{ ...inputStyle, padding:"5px 7px", fontSize:11 }}/>
                      </div>
                    )}
                  </div>
                ))}
                <button onClick={send} style={{ ...btn(true), width:"100%", padding:"11px", fontSize:13, background:C.green }}>
                  {sendOpt==="now"
                    ? `${t("nlSendTo")} ${(group?.members||0).toLocaleString()} ${t("nlRecipients")}`
                    : `${t("nlScheduleFor")} ${schedDate}, ${schedTime}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // LIST VIEW — Templates | Groups | Statistics
  // ════════════════════════════════════════════════════════════════════════════
  const sentItems  = items.filter(i=>i.status==="sent");
  const rate = (num) => {
    const rates = sentItems.filter(i=>i.stats.deliv>0).map(i=>i.stats[num]/i.stats.deliv);
    return rates.length ? Math.round(rates.reduce((a,b)=>a+b,0)/rates.length*100) + " %" : "—";
  };
  const kpis = [
    { icon:"✉️", tint:C.blue,  value:String(sentItems.length),                              label:t("nlNewslettersSent") },
    { icon:"👁️", tint:C.green, value:rate("opened"),                                        label:t("nlOpenRate") },
    { icon:"🖱️", tint:C.amber, value:rate("clicked"),                                       label:t("nlClickRate") },
    { icon:"✖️", tint:C.red,   value:String(sentItems.reduce((s,i)=>s+i.stats.unsub,0)),    label:t("nlUnsubscribes") },
  ];
  const sectionLabel: React.CSSProperties = { fontSize:11, fontWeight:800, color:C.slate, textTransform:"uppercase", letterSpacing:"0.1em", margin:"18px 2px 8px" };
  const statusBadge = (s) => (
    <span style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:12,
      background:STATUS_COLOR[s]+"18", color:STATUS_COLOR[s] }}>
      {t(s==="sent"?"nlSent":s==="scheduled"?"nlScheduled":"nlDraft")}
    </span>
  );

  return (
    <div style={{ padding:"24px 28px 48px", maxWidth:1100, margin:"0 auto" }}>
      {toast && <Toast msg={toast}/>}
      {groupModal && <AddGroupModal t={t} onClose={()=>setGroupModal(false)}
        onCreate={g=>{ if(!g){ showToast(t("nlNeedNameAndContacts")); return; } setGroups(prev=>[...prev,g]); setGroupModal(false); showToast(t("nlGroupCreated")); }}/>}

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
        <h1 style={{ margin:0, fontSize:22, fontWeight:700, color:C.navy, letterSpacing:"-0.02em" }}>{t("newsletter")}</h1>
        <button onClick={()=>openEditor()} style={btn(true)}>{t("nlNewNewsletter")}</button>
      </div>

      {/* Tabs — Templates | Groups | Statistics */}
      <div style={{ display:"flex", gap:4, marginBottom:16, borderBottom:`1px solid ${C.border}` }}>
        {[["templates",`📋 ${t("nlTemplates")} (${NL_TEMPLATES.length})`],["groups",`👥 ${t("nlGroups")} (${groups.length})`],["stats",`📊 ${t("nlStats")}`]].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)}
            style={{ padding:"9px 16px", border:"none", background:"transparent", fontSize:13, fontFamily:"inherit", cursor:"pointer",
              fontWeight:tab===k?700:500, color:tab===k?C.primaryDark:C.slate,
              borderBottom:tab===k?`2px solid ${C.primary}`:"2px solid transparent", marginBottom:-1 }}>
            {l}
          </button>
        ))}
      </div>

      {/* ── Templates gallery ── */}
      {tab==="templates" && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(300px, 1fr))", gap:16 }}>
          <div onClick={()=>openEditor()}
            style={{ background:"#fff", border:`1.5px dashed ${C.border}`, borderRadius:14, overflow:"hidden", cursor:"pointer",
              display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:262, gap:8, color:C.slate }}
            onMouseEnter={e=>{ e.currentTarget.style.borderColor=C.primary; e.currentTarget.style.color=C.primaryDark; }}
            onMouseLeave={e=>{ e.currentTarget.style.borderColor=C.border; e.currentTarget.style.color=C.slate; }}>
            <div style={{ fontSize:34 }}>＋</div>
            <div style={{ fontSize:13, fontWeight:700 }}>{t("nlStartBlank")}</div>
            <div style={{ fontSize:11, color:C.muted }}>{t("nlStartBlankSub")}</div>
          </div>
          {NL_TEMPLATES.map(tpl=>(
            <div key={tpl.id} style={{ background:"#fff", border:`1px solid ${C.border}`, borderRadius:14, overflow:"hidden", display:"flex", flexDirection:"column" }}
              onMouseEnter={e=>e.currentTarget.style.boxShadow="0 6px 20px rgba(45,62,80,0.12)"}
              onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}>
              <div style={{ cursor:"pointer" }} onClick={()=>openEditor(null, tpl)}>
                <TemplateThumb blocks={instantiateTpl(tpl, lang)}/>
              </div>
              <div style={{ padding:"12px 14px", display:"flex", alignItems:"center", gap:10, borderTop:`1px solid ${C.border}` }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:C.text }}>{pick(tpl.name, lang)}</div>
                  <div style={{ fontSize:11, color:C.muted, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{pick(tpl.desc, lang)}</div>
                </div>
                <button onClick={()=>openEditor(null, tpl)} style={{ ...btn(true), padding:"7px 13px", fontSize:12, flexShrink:0 }}>{t("nlUse")}</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Groups ── */}
      {tab==="groups" && (
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <span style={{ fontSize:12, color:C.muted, flex:1 }}>{t("nlGroupsHint")}</span>
            <button onClick={()=>setGroupModal(true)} style={btn(true)}>{t("nlAddGroup")}</button>
          </div>
          <div style={{ background:"#fff", border:`1px solid ${C.border}`, borderRadius:14, overflow:"hidden" }}>
            {groups.map((g,idx)=>(
              <div key={g.id} style={{ display:"flex", alignItems:"center", gap:14, padding:"13px 16px", borderBottom:idx<groups.length-1?`1px solid ${C.border}`:"none" }}>
                <div style={{ width:36, height:36, borderRadius:10, background:C.primarySoft, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>👥</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:C.text }}>{g.name}</div>
                  <div style={{ fontSize:11, color:C.muted }}>{g.desc}</div>
                </div>
                <div style={{ textAlign:"right", marginRight:6 }}>
                  <div style={{ fontSize:15, fontWeight:700, color:C.navy }}>{g.members.toLocaleString()}</div>
                  <div style={{ fontSize:10, color:C.muted }}>{t("nlMembers")}</div>
                </div>
                <button onClick={()=>removeGroup(g.id)} style={{ ...btn(), padding:"5px 10px", fontSize:12, color:C.red, borderColor:C.red+"40" }}>🗑</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Statistics ── */}
      {tab==="stats" && (
        <div>
          {/* KPI cards */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:14 }}>
            {kpis.map((k,i)=>(
              <div key={i} style={{ background:"#fff", border:`1px solid ${C.border}`, borderRadius:14, padding:"16px 18px" }}>
                <div style={{ width:36, height:36, borderRadius:10, background:k.tint+"18", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, marginBottom:10 }}>{k.icon}</div>
                <div style={{ fontSize:26, fontWeight:800, color:C.navy, letterSpacing:"-0.02em" }}>{k.value}</div>
                <div style={{ fontSize:11.5, color:C.muted, marginTop:2 }}>{k.label}</div>
              </div>
            ))}
          </div>

          {/* Send history */}
          <div style={sectionLabel}>{t("nlSendHistory")}</div>
          <div style={{ background:"#fff", border:`1px solid ${C.border}`, borderRadius:14, overflow:"hidden" }}>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr style={{ background:C.light, borderBottom:`1px solid ${C.border}` }}>
                  {[t("nlSubjectCol"),t("nlDateCol"),t("nlGroupCol"),t("nlRecCol"),t("nlDelivCol"),t("nlOpenedCol"),t("nlClickedCol"),t("nlUnsubCol"),t("nlBouncesCol"),t("nlStatusCol"),""].map((h,i)=>(
                    <th key={i} style={{ padding:"10px 12px", textAlign:i>=3&&i<=8?"center":"left", fontSize:11, fontWeight:700, color:C.slate, textTransform:"uppercase", letterSpacing:"0.05em", whiteSpace:"nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map(i=>{
                  const g = groups.find(g=>g.id===i.groupId); const s = i.stats;
                  const num = (v, strong=false) => (
                    <td style={{ padding:"12px", textAlign:"center", fontFamily:"monospace", fontSize:12.5, fontWeight:strong?700:400, color:strong?C.navy:C.slate }}>{v}</td>
                  );
                  return (
                    <tr key={i.id} style={{ borderBottom:`1px solid ${C.border}` }}>
                      <td style={{ padding:"12px", fontSize:13, fontWeight:700, color:C.text }}>{i.subject}</td>
                      <td style={{ padding:"12px", fontSize:12.5, fontFamily:"monospace", color:C.muted, whiteSpace:"nowrap" }}>{i.date}</td>
                      <td style={{ padding:"12px", fontSize:12.5, color:C.slate, whiteSpace:"nowrap" }}>{g?.name||"—"}</td>
                      {num(s.rec, true)}{num(s.deliv)}{num(s.opened)}{num(s.clicked)}{num(s.unsub)}{num(s.bounces)}
                      <td style={{ padding:"12px", whiteSpace:"nowrap" }}>{statusBadge(i.status)}</td>
                      <td style={{ padding:"12px", textAlign:"right" }}>
                        {i.status!=="sent" && (
                          <button onClick={()=>openEditor(i)} title="Edit"
                            style={{ ...btn(), padding:"4px 10px", fontSize:12 }}>✏️</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {items.length===0 && (
                  <tr><td colSpan={11} style={{ padding:"36px", textAlign:"center", color:C.muted, fontSize:13 }}>{t("nlNoNewsletters")}</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Unsubscribes */}
          <div style={sectionLabel}>{t("nlUnsubscribes")}</div>
          <div style={{ background:"#fff", border:`1px solid ${C.border}`, borderRadius:14, overflow:"hidden" }}>
            <div style={{ display:"flex", justifyContent:"space-between", padding:"10px 16px", background:C.light, borderBottom:`1px solid ${C.border}` }}>
              <span style={{ fontSize:11, fontWeight:700, color:C.slate, textTransform:"uppercase", letterSpacing:"0.05em" }}>{t("nlContactCol")}</span>
              <span style={{ fontSize:11, fontWeight:700, color:C.slate, textTransform:"uppercase", letterSpacing:"0.05em" }}>{t("nlUnsubscribedOn")}</span>
            </div>
            {NL_UNSUBSCRIBED.map((u,idx)=>(
              <div key={u.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"11px 16px", borderBottom:idx<NL_UNSUBSCRIBED.length-1?`1px solid ${C.border}`:"none" }}>
                <Avatar name={u.name}/>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:C.text }}>{u.name}</div>
                  <div style={{ fontSize:11, color:C.blue }}>{u.email}</div>
                </div>
                <span style={{ fontSize:12.5, fontFamily:"monospace", color:C.muted }}>{u.date}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
