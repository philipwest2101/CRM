import React, { useState, useContext, useRef } from "react";
import { C } from "../../theme";
import { ALL_LEADS, L, pick, NL_TEMPLATES_STORE, setNL_TEMPLATES_STORE } from "../../lib/core";
import { useT, LangContext } from "../../lib/i18n";

// ─────────────────────────────────────────────────────────────────────────────
// Newsletter — HubSpot-style email editor (mock, client-side)
//   Tabs: Newsletters (instances) / Templates (masters) / Groups / Statistics.
//   A newsletter is created as an INSTANCE of a template — editing it never
//   touches the template. Templates are managed (create/edit/delete) in their
//   own tab with an editor that has no send options.
// ─────────────────────────────────────────────────────────────────────────────

// L/pick (localised seed content helpers) live in core.tsx next to the shared
// NL_TEMPLATES_STORE, so Settings → Email Templates can read the same data.
const LOC_FIELDS = ["text", "label", "left", "right", "html"];

// ── Block palette ────────────────────────────────────────────────────────────
const CONTENT_BLOCKS = [
  { type:"logo",    icon:"🏷️", labelKey:"nlBlockLogo"    },
  { type:"image",   icon:"🖼️", labelKey:"nlBlockImage"   },
  { type:"heading", icon:"🔠", labelKey:"nlBlockHeading" },
  { type:"text",    icon:"📝", labelKey:"nlBlockText"    },
  { type:"button",  icon:"🔘", labelKey:"nlBlockButton"  },
  { type:"divider", icon:"➖", labelKey:"nlBlockDivider" },
  { type:"footer",  icon:"⚓", labelKey:"nlBlockFooter"  },
  { type:"html",    icon:"🧩", labelKey:"nlBlockHtml"    },
];
// Section presets (HubSpot-style "default sections"): column count / ratios.
const SECTION_PRESETS = [
  { id:"s1",  label:"1",         ratios:[1] },
  { id:"s2",  label:"2",         ratios:[1,1] },
  { id:"s3",  label:"3",         ratios:[1,1,1] },
  { id:"s13", label:"1/3 : 2/3", ratios:[1,2] },
  { id:"s31", label:"2/3 : 1/3", ratios:[2,1] },
  { id:"s4",  label:"4",         ratios:[1,1,1,1] },
];
const SECTION_CELL_TEXT = L("Text eingeben…","Enter text…");

const BLOCK_DEFAULTS = {
  logo:    { text:"vionworld" },
  image:   { label:"" },
  heading: { text:L("Ihre Überschrift","Your headline goes here") },
  text:    { text:L("Schreiben Sie hier Ihren Text. Mit {FirstName} personalisieren Sie die Anrede.","Write your paragraph here. Use {FirstName} to personalise the greeting.") },
  button:  { label:L("Jetzt mehr erfahren","Call to action"), url:"#" },
  divider: {},
  footer:  { text:"vion gmbh · Musterstraße 1 · 80331 München" },
  html:    { html:L('<p style="margin:0">Eigener <b>HTML</b>-Inhalt — Tags wie &lt;b&gt;, &lt;a&gt; oder &lt;table&gt; sind erlaubt.</p>','<p style="margin:0">Custom <b>HTML</b> content — tags like &lt;b&gt;, &lt;a&gt; or &lt;table&gt; are allowed.</p>') },
  imgtext: { label:L("Bild","Image"), text:L("Text neben dem Bild — ideal für Produkt-Highlights oder Team-Vorstellungen.","Text next to the image — great for product highlights or team introductions.") },
};

let blockSeq = 0;
const resolveBlock = (b, lang) => {
  const o = { ...b, id:`b${Date.now()}_${blockSeq++}` };
  for (const k of LOC_FIELDS) if (o[k] !== undefined) o[k] = pick(o[k], lang);
  if (Array.isArray(o.cells)) o.cells = o.cells.map(c => pick(c, lang));
  if (Array.isArray(o.ratios)) o.ratios = [...o.ratios];
  return o;
};
const newBlock = (type, lang) => resolveBlock({ type, ...BLOCK_DEFAULTS[type] }, lang);
const newSection = (ratios, lang) => resolveBlock({ type:"section", ratios, cells:ratios.map(()=>SECTION_CELL_TEXT) }, lang);

const instantiateTpl = (tpl, lang) => tpl.blocks.map(b => resolveBlock(b, lang));

// ── Recipient groups (user data — seeded in German, the app default) ─────────
const NL_GROUPS = [
  { id:"g1", name:"Newsletter-Abonnenten", members:210, desc:"Alle Kontakte mit Newsletter-Opt-in", memberIds:[] },
  { id:"g2", name:"Alle Kunden",           members:142, desc:"Aktive Kunden mit Vertrag",           memberIds:[] },
  { id:"g3", name:"Finanzierung Leads Q2", members:48,  desc:"Kampagne: Finanzierung · Q2",         memberIds:[] },
  { id:"g4", name:"Webinar-Teilnehmer",    members:198, desc:"Mind. ein Webinar besucht",           memberIds:[] },
];

// ── Send history + unsubscribes (mock, matches the stats wireframe) ──────────
const NL_ITEMS = [
  { id:"n1", name:"Frühjahrs-Update", subject:"Frühjahrs-Update: nachhaltige Vorsorge", groupId:"g1",
    blocks:instantiateTpl(NL_TEMPLATES_STORE[0], "de"), status:"sent", date:"24.06.2026",
    stats:{ rec:210, deliv:206, opened:84, clicked:23, unsub:3, bounces:4 } },
  { id:"n2", name:"Finanzierung 2026", subject:"Ihre Finanzierung 2026 – Konditionen", groupId:"g3",
    blocks:instantiateTpl(NL_TEMPLATES_STORE[1], "de"), status:"sent", date:"11.06.2026",
    stats:{ rec:48, deliv:47, opened:21, clicked:9, unsub:1, bounces:1 } },
  { id:"n3", name:"Sommer-Aktion", subject:"Sommer-Aktion Gold-Sparplan", groupId:"g2",
    blocks:instantiateTpl(NL_TEMPLATES_STORE[4], "de"), status:"scheduled", date:"02.07.2026",
    stats:{ rec:142, deliv:0, opened:0, clicked:0, unsub:0, bounces:0 } },
  { id:"n4", name:"Webinar-Einladung", subject:"Webinar-Einladung Altersvorsorge", groupId:"g1",
    blocks:instantiateTpl(NL_TEMPLATES_STORE[2], "de"), status:"draft", date:"—",
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
const iconBtn = (color=C.slate): React.CSSProperties => ({
  padding:"5px 9px", borderRadius:7, fontSize:12, cursor:"pointer", fontFamily:"inherit",
  border:`1px solid ${color===C.red?C.red+"40":C.border}`, background:"#fff", color,
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
const textBodyStyle = { fontSize:13.5, color:"#33475B", lineHeight:1.7, whiteSpace:"pre-wrap" as const };

const BlockView = ({ b, editing=false, onChange=null }) => {
  const stop = e => e.stopPropagation();
  const secRef = useRef(null);

  // Drag the handle between two section columns → shift width between them
  // (their combined share stays constant, so the other columns keep theirs).
  const startSecResize = (e, i) => {
    e.preventDefault(); e.stopPropagation();
    const width = secRef.current ? secRef.current.getBoundingClientRect().width : 600;
    const total = b.ratios.reduce((a,x)=>a+x,0);
    const startX = e.clientX;
    const r0 = [...b.ratios];
    const pair = r0[i] + r0[i+1];
    const move = (ev) => {
      const delta = (ev.clientX - startX) / width * total;
      const a = Math.min(Math.max(0.25, r0[i] + delta), pair - 0.25);
      const nr = [...r0]; nr[i] = +a.toFixed(2); nr[i+1] = +(pair - a).toFixed(2);
      onChange && onChange({ ratios: nr });
    };
    const up = () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };
  const ta = (field, style, extra={}) => (
    <textarea autoFocus value={b[field]||""} onClick={stop} onChange={e=>onChange({ [field]:e.target.value })}
      rows={Math.max(2, String(b[field]||"").split("\n").length)}
      style={{ ...editableTextStyle(style), ...extra }}/>
  );
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
        : textBodyStyle;
      return (
        <div style={{ padding:isFooter?"16px 24px 22px":"8px 24px" }}>
          {editing ? ta("text", style) : <div style={style}>{b.text}</div>}
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
    case "html": return (
      <div style={{ padding:"8px 24px" }}>
        {editing
          ? ta("html", { fontSize:11.5, lineHeight:1.6 }, { fontFamily:"monospace", background:"#1D2939", color:"#A7F3D0", padding:"8px 10px" })
          : <div style={textBodyStyle} dangerouslySetInnerHTML={{ __html: b.html||"" }}/>}
      </div>);
    case "cols2": /* legacy 2-column block → render like a section */
    case "section": {
      const ratios = b.ratios || [1,1];
      const cells  = b.cells  || [b.left||"", b.right||""];
      const total  = ratios.reduce((a,x)=>a+x,0);
      return (
        <div ref={secRef} style={{ padding:"8px 24px", position:"relative" }}>
          <div style={{ display:"grid", gridTemplateColumns:ratios.map(r=>`${r}fr`).join(" "), gap:12 }}>
            {cells.map((c,i)=>(
              <div key={i} style={{ minWidth:0 }}>
                {editing
                  ? <textarea value={c} onClick={stop}
                      onChange={e=>{ const next=[...cells]; next[i]=e.target.value; onChange({ cells:next, ratios }); }}
                      rows={Math.max(2, String(c||"").split("\n").length)}
                      style={editableTextStyle(textBodyStyle)}/>
                  : <div style={textBodyStyle}>{c}</div>}
              </div>
            ))}
          </div>
          {/* Resize handles between columns (visible while the block is selected) */}
          {editing && ratios.slice(0,-1).map((_,i)=>{
            const pct = ratios.slice(0,i+1).reduce((a,x)=>a+x,0)/total*100;
            return (
              <div key={i} onMouseDown={e=>startSecResize(e, i)}
                title={ratios.map(r=>Math.round(r/total*100)+"%").join(" : ")}
                style={{ position:"absolute", top:4, bottom:4, left:`calc(24px + (100% - 48px) * ${pct/100})`,
                  width:12, marginLeft:-6, cursor:"col-resize", zIndex:6,
                  display:"flex", alignItems:"center", justifyContent:"center" }}>
                <div style={{ width:4, height:"72%", minHeight:22, borderRadius:2, background:C.primary+"66" }}/>
              </div>
            );
          })}
        </div>
      );
    }
    case "imgtext": return (
      <div style={{ padding:"8px 24px", display:"grid", gridTemplateColumns:"150px 1fr", gap:14, alignItems:"start" }}>
        <div style={{ height:110, borderRadius:8, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
          gap:4, color:"#8CA3B8", fontSize:10.5, background:"linear-gradient(135deg,#F0F4F8,#DFE8F0)", border:"1.5px dashed #C3D1DE" }}>
          <span style={{ fontSize:20 }}>🖼️</span>
          {editing
            ? <input value={b.label||""} onClick={stop} onChange={e=>onChange({ label:e.target.value })}
                style={{ ...editableTextStyle({ fontSize:10.5, textAlign:"center" }), width:110, color:"#8CA3B8" }}/>
            : (b.label || "")}
        </div>
        <div>{editing ? ta("text", textBodyStyle) : <div style={textBodyStyle}>{b.text}</div>}</div>
      </div>);
    default: return null;
  }
};

const EmailFrame = ({ blocks, width=600 }) => (
  <div style={{ width, background:"#fff", borderRadius:4, overflow:"hidden", boxShadow:"0 1px 6px rgba(45,62,80,0.12)" }}>
    {blocks.map(b => <BlockView key={b.id} b={b} />)}
  </div>
);

const TemplateThumb = ({ blocks, height=190, scale=0.4 }) => (
  <div style={{ height, overflow:"hidden", background:CANVAS_BG, display:"flex", justifyContent:"center", paddingTop:14 }}>
    <div style={{ transform:`scale(${scale})`, transformOrigin:"top center", flexShrink:0 }}>
      <EmailFrame blocks={blocks} />
    </div>
  </div>
);

const Toast = ({ msg }) => (
  <div style={{ position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)", zIndex:900,
    background:C.navy, color:"#fff", padding:"11px 20px", borderRadius:10, fontSize:13, fontWeight:600,
    boxShadow:"0 8px 28px rgba(0,0,0,0.25)", whiteSpace:"nowrap" }}>
    {msg}
  </div>
);

// ── Device toggle (Desktop / Mobile) ─────────────────────────────────────────
const DeviceToggle = ({ t, mode, setMode }) => (
  <div style={{ display:"flex", border:`1px solid ${C.border}`, borderRadius:8, overflow:"hidden", flexShrink:0 }}>
    {[["desktop",`🖥 ${t("nlDesktop")}`],["mobile",`📱 ${t("nlMobile")}`]].map(([k,l],i)=>(
      <button key={k} onClick={()=>setMode(k)}
        style={{ padding:"6px 12px", border:"none", borderLeft:i===0?"none":`1px solid ${C.border}`,
          background:mode===k?C.primary:"#fff", color:mode===k?"#fff":C.slate,
          fontSize:11.5, fontWeight:mode===k?700:500, cursor:"pointer", fontFamily:"inherit" }}>{l}</button>
    ))}
  </div>
);

// ── Preview modal — desktop / mobile rendering of a block set ────────────────
const PreviewModal = ({ t, title, blocks, onClose }) => {
  const [device, setDevice] = useState("desktop");
  const w = device==="mobile" ? 375 : 600;
  return (<>
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.55)", zIndex:500 }}/>
    <div style={{ position:"fixed", top:"4vh", left:"50%", transform:"translateX(-50%)", width:720, maxWidth:"94vw",
      height:"90vh", display:"flex", flexDirection:"column", background:"#fff", borderRadius:16, zIndex:600,
      boxShadow:"0 24px 64px rgba(0,0,0,0.3)", overflow:"hidden" }}>
      <div style={{ padding:"12px 18px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:12 }}>
        <span style={{ fontSize:14, fontWeight:800, color:C.navy, flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
          👁 {t("nlPreviewBtn")}{title ? ` — ${title}` : ""}
        </span>
        <DeviceToggle t={t} mode={device} setMode={setDevice}/>
        <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", fontSize:20, color:C.muted }}>×</button>
      </div>
      <div style={{ flex:1, overflowY:"auto", background:CANVAS_BG, display:"flex", justifyContent:"center", padding:"22px 0 40px" }}>
        <div style={{ flexShrink:0 }}><EmailFrame blocks={blocks} width={w}/></div>
      </div>
    </div>
  </>);
};

// ── Template picker — "get an instance" when creating a newsletter ───────────
const TemplatePicker = ({ t, lang, tpls, onPick, onClose }) => {
  const [q, setQ] = useState("");
  const filtered = tpls.filter(tpl =>
    !q || `${pick(tpl.name, lang)} ${pick(tpl.desc, lang)}`.toLowerCase().includes(q.toLowerCase()));
  return (<>
  <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.55)", zIndex:500 }}/>
  <div style={{ position:"fixed", top:"6vh", left:"50%", transform:"translateX(-50%)", width:860, maxWidth:"94vw",
    maxHeight:"86vh", display:"flex", flexDirection:"column", background:"#fff", borderRadius:16, zIndex:600,
    boxShadow:"0 24px 64px rgba(0,0,0,0.3)", overflow:"hidden" }}>
    <div style={{ padding:"14px 20px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:12 }}>
      <span style={{ fontSize:15, fontWeight:800, color:C.navy, flexShrink:0 }}>📋 {t("nlChooseTemplate")}</span>
      <input autoFocus value={q} onChange={e=>setQ(e.target.value)} placeholder={t("nlSearchTemplates")}
        style={{ ...inputStyle, flex:1, maxWidth:320, padding:"8px 11px", fontSize:12.5 }}/>
      <div style={{ flex:1 }}/>
      <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", fontSize:20, color:C.muted }}>×</button>
    </div>
    <div style={{ flex:1, overflowY:"auto", padding:18, display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(240px, 1fr))", gap:14 }}>
      <div onClick={()=>onPick(null)}
        style={{ border:`1.5px dashed ${C.border}`, borderRadius:12, cursor:"pointer", minHeight:196,
          display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:6, color:C.slate }}
        onMouseEnter={e=>{ e.currentTarget.style.borderColor=C.primary; e.currentTarget.style.color=C.primaryDark; }}
        onMouseLeave={e=>{ e.currentTarget.style.borderColor=C.border; e.currentTarget.style.color=C.slate; }}>
        <div style={{ fontSize:28 }}>＋</div>
        <div style={{ fontSize:12.5, fontWeight:700 }}>{t("nlStartBlank")}</div>
      </div>
      {filtered.map(tpl=>(
        <div key={tpl.id} onClick={()=>onPick(tpl)}
          style={{ border:`1px solid ${C.border}`, borderRadius:12, overflow:"hidden", cursor:"pointer", background:"#fff" }}
          onMouseEnter={e=>e.currentTarget.style.boxShadow="0 6px 20px rgba(45,62,80,0.14)"}
          onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}>
          <TemplateThumb blocks={instantiateTpl(tpl, lang)} height={140} scale={0.3}/>
          <div style={{ padding:"9px 12px", borderTop:`1px solid ${C.border}` }}>
            <div style={{ fontSize:12.5, fontWeight:700, color:C.text }}>{pick(tpl.name, lang)}</div>
            <div style={{ fontSize:10.5, color:C.muted, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{pick(tpl.desc, lang)}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
  </>);
};

// ── Group modal — create or edit a group from filtered contacts ──────────────
const GroupModal = ({ t, initial=null, onClose, onSave }) => {
  const [gName, setGName] = useState(initial?.name || "");
  const [fCamp, setFCamp] = useState("all");
  const [fSrc,  setFSrc]  = useState("all");
  const [fCity, setFCity] = useState("all");
  const [q,     setQ]     = useState("");
  const [sel,   setSel]   = useState(() => Object.fromEntries((initial?.memberIds||[]).map(id=>[id,true])));

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

  const save = () => {
    if (!gName.trim() || (!initial && count===0)) { onSave(null); return; }
    const memberIds = Object.keys(sel).filter(id=>sel[id]);
    const parts = [fCamp!=="all"&&fCamp, fSrc!=="all"&&fSrc, fCity!=="all"&&fCity].filter(Boolean);
    onSave({
      id: initial?.id || `g${Date.now()}`,
      name: gName.trim(),
      // Editing a seeded group with an empty selection keeps its member count.
      members: count>0 ? count : (initial?.members || 0),
      memberIds: count>0 ? memberIds : (initial?.memberIds || []),
      desc: parts.join(" · ") || initial?.desc || t("nlContactCol"),
    });
  };

  return (<>
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.45)", zIndex:500 }}/>
    <div style={{ position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:760, maxWidth:"94vw",
      maxHeight:"86vh", display:"flex", flexDirection:"column", background:"#fff", borderRadius:16, zIndex:600,
      boxShadow:"0 24px 64px rgba(0,0,0,0.22)", overflow:"hidden" }}>
      <div style={{ padding:"16px 22px 12px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:12 }}>
        <span style={{ fontSize:16, fontWeight:800, color:C.navy, flex:1 }}>
          👥 {initial ? t("nlEditGroup") : t("nlAddGroup").replace("+ ","")}
        </span>
        <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", fontSize:20, color:C.muted }}>×</button>
      </div>
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
        {initial && count===0 && (
          <div style={{ fontSize:11, color:C.amber }}>{t("nlKeepMembers")}</div>
        )}
      </div>
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
      <div style={{ padding:"13px 22px", borderTop:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:12 }}>
        <span style={{ fontSize:12.5, color:C.slate }}>
          <b style={{ color:C.navy }}>{count}</b> / {filtered.length} {t("nlSelected")}
        </span>
        <div style={{ flex:1 }}/>
        <button onClick={onClose} style={btn()}>{t("nlCancel")}</button>
        <button onClick={save} style={{ ...btn(true), opacity:(!gName.trim()||(!initial&&count===0))?0.5:1 }}>
          👥 {initial ? t("nlSaveGroup") : t("nlCreateGroup")}
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
  const [tpls, setTpls]       = useState(NL_TEMPLATES_STORE);
  const [groups, setGroups]   = useState(NL_GROUPS);
  const [toast, setToast]     = useState(null);
  const [groupModal, setGroupModal] = useState(null);      // null | { initial? }
  const [preview, setPreview] = useState(null);            // null | { title, blocks }
  const [picker, setPicker]   = useState(false);

  // ── Editor state ───────────────────────────────────────────────────────────
  const [editorMode, setEditorMode] = useState("newsletter"); // newsletter | template
  const [canvasMode, setCanvasMode] = useState("desktop");    // desktop | mobile
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
  const [panelSec, setPanelSec]   = useState("blocks");      // left-panel accordion: blocks | settings

  const toastTimer = useRef(null);
  const showToast = (msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(()=>setToast(null), 2600);
  };
  const group     = groups.find(g=>g.id===groupId) || groups[0];
  const selBlock  = blocks.find(b=>b.id===selId);
  const isTplMode = editorMode==="template";
  const canvasW   = canvasMode==="mobile" ? 375 : 600;

  // ── Editor open / save / send ──────────────────────────────────────────────
  // Newsletter = INSTANCE of a template: blocks are deep-copied, so edits never
  // change the template master.
  const openEditor = (item=null, template=null) => {
    setEditorMode("newsletter"); setCanvasMode("desktop");
    setEditId(item?.id || null);
    setName(item?.name || (template ? pick(template.name, lang) : ""));
    setSubject(item?.subject || (template ? pick(template.subject, lang) : ""));
    setPreheader(item?.preheader || "");
    setGroupId(item?.groupId || groups[0]?.id || "g1");
    setBlocks(item?.blocks ? item.blocks.map(b=>({ ...b })) : template ? instantiateTpl(template, lang)
      : [newBlock("logo", lang), newBlock("heading", lang), newBlock("text", lang), newBlock("footer", lang)]);
    setSelId(null); setSendOpt("now"); setTestSent(false); setPanelSec("blocks");
    setView("editor");
  };
  const openTplEditor = (tpl=null) => {
    setEditorMode("template"); setCanvasMode("desktop");
    setEditId(tpl?.id || null);
    setName(tpl ? pick(tpl.name, lang) : "");
    setSubject(tpl ? pick(tpl.subject, lang) : "");
    setBlocks(tpl ? instantiateTpl(tpl, lang)
      : [newBlock("logo", lang), newBlock("heading", lang), newBlock("text", lang), newBlock("footer", lang)]);
    setSelId(null);
    setView("editor");
  };
  const closeEditor = (targetTab=null) => {
    setView("list"); setEditId(null);
    setTab(targetTab || (isTplMode ? "templates" : "stats"));
  };

  const upsertItem = (status, date, statsPatch={}) => {
    const entry = {
      id:editId||`n${Date.now()}`, name:name||t("nlUntitled"), subject, preheader, groupId, blocks, status, date,
      stats:{ rec:group?.members||0, deliv:0, opened:0, clicked:0, unsub:0, bounces:0, ...statsPatch },
    };
    setItems(prev => editId ? prev.map(i=>i.id===editId?entry:i) : [entry, ...prev]);
  };
  const saveDraft = () => { upsertItem("draft", "—"); showToast(t("nlDraftSaved")); };
  const sendTest  = () => { setTestSent(true); showToast(`${t("nlTestSentToast")} ${fromEmail}`); };
  const send = () => {
    if(!subject.trim() || blocks.length===0) { showToast(t("nlIncompleteToast")); return; }
    if(sendOpt==="scheduled") { upsertItem("scheduled", `${schedDate}, ${schedTime}`); closeEditor("stats"); showToast(`${t("nlScheduledToast")} ${schedDate}, ${schedTime}`); }
    else {
      const m = group?.members||0;
      upsertItem("sent", new Date().toLocaleDateString("de-DE"), { deliv:m, opened:0, clicked:0 });
      closeEditor("stats"); showToast(`${t("nlSentToast")} ${m.toLocaleString()} ${t("nlRecipients")}`);
    }
  };
  const saveTemplate = () => {
    const existing = editId ? tpls.find(x=>x.id===editId) : null;
    const entry = {
      id: editId || `t${Date.now()}`,
      name: name || t("nlUntitledTemplate"),
      desc: existing ? pick(existing.desc, lang) : "",
      subject, blocks,
    };
    const next = editId ? tpls.map(x=>x.id===editId?entry:x) : [...tpls, entry];
    setTpls(next); setNL_TEMPLATES_STORE(next);
    closeEditor("templates"); showToast(t("nlTemplateSaved"));
  };
  const deleteTemplate = (id) => {
    const next = tpls.filter(x=>x.id!==id);
    setTpls(next); setNL_TEMPLATES_STORE(next); showToast(t("nlTemplateDeleted"));
  };

  // ── Block operations ─────────────────────────────────────────────────────
  // spec: { type } for content blocks, { ratios } for layout sections.
  const addBlockAt = (spec, idx=null) => {
    const b = spec.ratios ? newSection(spec.ratios, lang) : newBlock(spec.type, lang);
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

  const paletteItemStyle: React.CSSProperties = {
    borderRadius:9, border:`1px solid ${C.border}`, background:"#fff",
    textAlign:"center", cursor:"grab", userSelect:"none",
  };
  const paletteHover = {
    onMouseEnter: e=>{ e.currentTarget.style.borderColor=C.primary; e.currentTarget.style.background=C.primarySoft; },
    onMouseLeave: e=>{ e.currentTarget.style.borderColor=C.border; e.currentTarget.style.background="#fff"; },
  };
  const draggableProps = (spec) => ({
    draggable:true,
    onDragStart:()=>setDragType(spec),
    onDragEnd:()=>{ setDragType(null); setDropIdx(null); },
    onClick:()=>addBlockAt(spec),
  });
  const paletteLabel: React.CSSProperties = { fontSize:10.5, fontWeight:800, color:C.slate, textTransform:"uppercase", letterSpacing:"0.07em", margin:"4px 2px 10px" };

  // Mini skeleton icon for a section preset (dotted header + column boxes).
  const SectionIcon = ({ ratios }) => (
    <div style={{ width:38, margin:"0 auto 4px" }}>
      <div style={{ display:"flex", gap:2, justifyContent:"center", marginBottom:3 }}>
        {[...Array(6)].map((_,i)=><div key={i} style={{ width:2.5, height:2.5, borderRadius:1, background:"#8CA3B8" }}/>)}
      </div>
      <div style={{ display:"flex", gap:2, height:15 }}>
        {ratios.map((r,i)=><div key={i} style={{ flex:r, background:"#D7E1EC", borderRadius:2 }}/>)}
      </div>
    </div>
  );

  const blocksPanel = (<>
    <div style={paletteLabel}>{t("nlContentBlocks")}</div>
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:7, marginBottom:12 }}>
      {CONTENT_BLOCKS.map(bt=>(
        <div key={bt.type} {...draggableProps({ type:bt.type })} {...paletteHover}
          style={{ ...paletteItemStyle, padding:"12px 4px 9px" }}>
          <div style={{ fontSize:16, marginBottom:3 }}>{bt.icon}</div>
          <div style={{ fontSize:10.5, fontWeight:700, color:C.text }}>{t(bt.labelKey)}</div>
        </div>
      ))}
    </div>
    <div style={paletteLabel}>{t("nlLayoutSection")} — {t("nlSections")}</div>
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6, marginBottom:8 }}>
      {SECTION_PRESETS.map(p=>(
        <div key={p.id} {...draggableProps({ ratios:p.ratios })} {...paletteHover}
          style={{ ...paletteItemStyle, padding:"9px 4px 7px" }}>
          <SectionIcon ratios={p.ratios}/>
          <div style={{ fontSize:9.5, fontWeight:700, color:C.text, whiteSpace:"nowrap" }}>{p.label}</div>
        </div>
      ))}
    </div>
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:7, marginBottom:12 }}>
      <div {...draggableProps({ type:"imgtext" })} {...paletteHover}
        style={{ ...paletteItemStyle, padding:"12px 4px 9px" }}>
        <div style={{ fontSize:16, marginBottom:3 }}>🖼📝</div>
        <div style={{ fontSize:10.5, fontWeight:700, color:C.text }}>{t("nlBlockImgText")}</div>
      </div>
    </div>
    <div style={{ padding:"9px 11px", borderRadius:9, background:"#F0F6FF", border:"1px solid #D6E6FF", fontSize:10.5, color:"#33475B", lineHeight:1.55 }}>
      {t("nlBlocksHint")} {t("nlResizeHint")}
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
  </>);

  // ════════════════════════════════════════════════════════════════════════════
  // EDITOR — palette | inline-editable canvas | (newsletter only) settings & send
  // ════════════════════════════════════════════════════════════════════════════
  if(view==="editor") {
    const checklist = [
      { label:t("nlCheckSubject"), ok:!!subject.trim() },
      { label:t("nlCheckContent"), ok:blocks.length>0 },
      { label:t("nlCheckFooter"),  ok:blocks.some(b=>b.type==="footer") },
      { label:t("nlCheckTest"),    ok:testSent, soft:true },
    ];

    const settingsPanel = (
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
    );

    return (
      <div style={{ display:"flex", flexDirection:"column", height:"calc(100vh - 54px)", background:CANVAS_BG }}>
        {toast && <Toast msg={toast}/>}

        {/* ── Top bar ── */}
        <div style={{ background:"#fff", borderBottom:`1px solid ${C.border}`, padding:"0 16px", height:52,
          display:"flex", alignItems:"center", gap:12, flexShrink:0 }}>
          <button onClick={()=>closeEditor()} style={{ ...btn(), padding:"6px 12px", fontSize:12 }}>{t("nlExit")}</button>
          {isTplMode && <span style={{ fontSize:11, fontWeight:800, color:C.indigo, background:C.indigo+"12", padding:"3px 10px", borderRadius:12, flexShrink:0 }}>📋 {t("nlTemplates")}</span>}
          <input value={name} onChange={e=>setName(e.target.value)} placeholder={isTplMode?t("nlUntitledTemplate"):t("nlUntitled")}
            style={{ border:"none", outline:"none", fontSize:15, fontWeight:700, color:C.navy, fontFamily:"inherit",
              flex:1, background:"transparent" }}/>
          <DeviceToggle t={t} mode={canvasMode} setMode={setCanvasMode}/>
          {isTplMode
            ? <button onClick={saveTemplate} style={{ ...btn(true), padding:"7px 14px", fontSize:12 }}>{t("nlSaveTemplate")}</button>
            : <button onClick={saveDraft} style={{ ...btn(), padding:"7px 13px", fontSize:12 }}>{t("nlSaveDraft")}</button>}
        </div>

        <div style={{ flex:1, display:"flex", overflow:"hidden" }}>
          {/* ── Left panel: accordion — Content blocks / Settings & send ── */}
          <div style={{ width:290, background:"#fff", borderRight:`1px solid ${C.border}`, overflowY:"auto", flexShrink:0,
            display:"flex", flexDirection:"column" }}>
            {isTplMode ? (
              <div style={{ padding:12 }}>{blocksPanel}</div>
            ) : (<>
              {[["blocks","🧱",t("nlContentBlocks")],["settings","⚙️",t("nlSettingsSend")]].map(([id,icon,label])=>(
                <React.Fragment key={id}>
                  <button onClick={()=>setPanelSec(id)}
                    style={{ width:"100%", display:"flex", alignItems:"center", gap:8, padding:"12px 14px",
                      border:"none", borderBottom:`1px solid ${C.border}`, cursor:"pointer", fontFamily:"inherit",
                      background:panelSec===id?"#fff":C.light, textAlign:"left",
                      fontSize:12.5, fontWeight:800, color:panelSec===id?C.navy:C.slate, flexShrink:0 }}>
                    <span>{icon}</span><span style={{ flex:1 }}>{label}</span>
                    <span style={{ fontSize:10 }}>{panelSec===id?"▾":"▸"}</span>
                  </button>
                  {panelSec===id && (
                    <div style={{ padding:id==="blocks"?12:"12px 14px", borderBottom:`1px solid ${C.border}` }}>
                      {id==="blocks" ? blocksPanel : settingsPanel}
                    </div>
                  )}
                </React.Fragment>
              ))}
            </>)}
          </div>

          {/* ── Center: canvas with inline editing ── */}
          <div style={{ flex:1, overflowY:"auto", padding:"24px 0 60px", display:"flex", justifyContent:"center" }}
            onClick={()=>setSelId(null)}
            onDragOver={e=>{ if(dragType){ e.preventDefault(); } }}
            onDrop={e=>{ if(dragType){ e.preventDefault(); addBlockAt(dragType, dropIdx); setDragType(null); setDropIdx(null); } }}>
            <div style={{ width:canvasW, flexShrink:0, transition:"width 0.2s" }} onClick={e=>e.stopPropagation()}>
              {/* Subject line: template mode = editable field; newsletter mode = inbox preview */}
              {isTplMode ? (
                <div style={{ padding:"10px 14px", marginBottom:12, background:"#fff", borderRadius:8, border:`1px solid ${C.border}` }}>
                  <label style={labelStyle}>{t("nlSubjectLine")}</label>
                  <input value={subject} onChange={e=>setSubject(e.target.value)} placeholder={t("nlSubjectPh")} style={inputStyle}/>
                </div>
              ) : (
                <div style={{ padding:"9px 14px", marginBottom:12, background:"#fff", borderRadius:8, border:`1px solid ${C.border}`, fontSize:12, color:C.slate, display:"flex", gap:8, alignItems:"baseline", overflow:"hidden", whiteSpace:"nowrap" }}>
                  <span style={{ fontWeight:700, color:C.navy, flexShrink:0 }}>{fromName}</span>
                  <span style={{ fontWeight:600, color:C.text, overflow:"hidden", textOverflow:"ellipsis" }}>{subject||t("nlNoSubjectYet")}</span>
                  <span style={{ color:C.muted, overflow:"hidden", textOverflow:"ellipsis" }}>{preheader||t("nlPreviewTextDefault")}</span>
                </div>
              )}

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

        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // LIST VIEW — Newsletters | Templates | Groups | Statistics
  // ════════════════════════════════════════════════════════════════════════════
  const sentItems = items.filter(i=>i.status==="sent");
  const rateOf = (num) => {
    const rates = sentItems.filter(i=>i.stats.deliv>0).map(i=>i.stats[num]/i.stats.deliv);
    return rates.length ? Math.round(rates.reduce((a,b)=>a+b,0)/rates.length*100) + " %" : "—";
  };
  const kpis = [
    { icon:"✉️", tint:C.blue,  value:String(sentItems.length),                           label:t("nlNewslettersSent") },
    { icon:"👁️", tint:C.green, value:rateOf("opened"),                                   label:t("nlOpenRate") },
    { icon:"🖱️", tint:C.amber, value:rateOf("clicked"),                                  label:t("nlClickRate") },
    { icon:"✖️", tint:C.red,   value:String(sentItems.reduce((s,i)=>s+i.stats.unsub,0)), label:t("nlUnsubscribes") },
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
      {groupModal && <GroupModal t={t} initial={groupModal.initial||null} onClose={()=>setGroupModal(null)}
        onSave={g=>{
          if(!g){ showToast(t("nlNeedNameAndContacts")); return; }
          setGroups(prev => prev.some(x=>x.id===g.id) ? prev.map(x=>x.id===g.id?g:x) : [...prev, g]);
          setGroupModal(null); showToast(groupModal.initial ? t("nlGroupSaved") : t("nlGroupCreated"));
        }}/>}
      {preview && <PreviewModal t={t} title={preview.title} blocks={preview.blocks} onClose={()=>setPreview(null)}/>}
      {picker && <TemplatePicker t={t} lang={lang} tpls={tpls} onClose={()=>setPicker(false)}
        onPick={tpl=>{ setPicker(false); openEditor(null, tpl); }}/>}

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
        <h1 style={{ margin:0, fontSize:22, fontWeight:700, color:C.navy, letterSpacing:"-0.02em" }}>{t("newsletter")}</h1>
        <button onClick={()=>setPicker(true)} style={btn(true)}>{t("nlNewNewsletter")}</button>
      </div>

      {/* Tabs — Templates | Groups | Newsletters & Statistics */}
      <div style={{ display:"flex", gap:4, marginBottom:16, borderBottom:`1px solid ${C.border}` }}>
        {[["templates",`📋 ${t("nlTemplates")} (${tpls.length})`],["groups",`👥 ${t("nlGroups")} (${groups.length})`],["stats",`📊 ${t("nlNewsStats")} (${items.length})`]].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)}
            style={{ padding:"9px 16px", border:"none", background:"transparent", fontSize:13, fontFamily:"inherit", cursor:"pointer",
              fontWeight:tab===k?700:500, color:tab===k?C.primaryDark:C.slate,
              borderBottom:tab===k?`2px solid ${C.primary}`:"2px solid transparent", marginBottom:-1 }}>
            {l}
          </button>
        ))}
      </div>

      {/* ── Templates (masters: create / edit / delete / preview) ── */}
      {tab==="templates" && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(300px, 1fr))", gap:16 }}>
          <div onClick={()=>openTplEditor()}
            style={{ background:"#fff", border:`1.5px dashed ${C.border}`, borderRadius:14, overflow:"hidden", cursor:"pointer",
              display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:262, gap:8, color:C.slate }}
            onMouseEnter={e=>{ e.currentTarget.style.borderColor=C.primary; e.currentTarget.style.color=C.primaryDark; }}
            onMouseLeave={e=>{ e.currentTarget.style.borderColor=C.border; e.currentTarget.style.color=C.slate; }}>
            <div style={{ fontSize:34 }}>＋</div>
            <div style={{ fontSize:13, fontWeight:700 }}>{t("nlNewTemplate").replace("+ ","")}</div>
            <div style={{ fontSize:11, color:C.muted }}>{t("nlStartBlankSub")}</div>
          </div>
          {tpls.map(tpl=>{
            const tplBlocks = instantiateTpl(tpl, lang);
            return (
              <div key={tpl.id} style={{ background:"#fff", border:`1px solid ${C.border}`, borderRadius:14, overflow:"hidden", display:"flex", flexDirection:"column" }}
                onMouseEnter={e=>e.currentTarget.style.boxShadow="0 6px 20px rgba(45,62,80,0.12)"}
                onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}>
                <div style={{ cursor:"pointer" }} onClick={()=>setPreview({ title:pick(tpl.name, lang), blocks:tplBlocks })}>
                  <TemplateThumb blocks={tplBlocks}/>
                </div>
                <div style={{ padding:"12px 14px", display:"flex", alignItems:"center", gap:8, borderTop:`1px solid ${C.border}` }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:C.text }}>{pick(tpl.name, lang)}</div>
                    <div style={{ fontSize:11, color:C.muted, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{pick(tpl.desc, lang)||"—"}</div>
                  </div>
                  <button onClick={()=>setPreview({ title:pick(tpl.name, lang), blocks:tplBlocks })} title={t("nlPreviewBtn")} style={iconBtn()}>👁</button>
                  <button onClick={()=>openTplEditor(tpl)} title="✏️" style={iconBtn()}>✏️</button>
                  <button onClick={()=>deleteTemplate(tpl.id)} title="🗑" style={iconBtn(C.red)}>🗑</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Groups ── */}
      {tab==="groups" && (
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <span style={{ fontSize:12, color:C.muted, flex:1 }}>{t("nlGroupsHint")}</span>
            <button onClick={()=>setGroupModal({})} style={btn(true)}>{t("nlAddGroup")}</button>
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
                <button onClick={()=>setGroupModal({ initial:g })} title={t("nlEditGroup")} style={iconBtn()}>✏️</button>
                <button onClick={()=>removeGroup(g.id)} title="🗑" style={iconBtn(C.red)}>🗑</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Statistics ── */}
      {tab==="stats" && (
        <div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:14 }}>
            {kpis.map((k,i)=>(
              <div key={i} style={{ background:"#fff", border:`1px solid ${C.border}`, borderRadius:14, padding:"16px 18px" }}>
                <div style={{ width:36, height:36, borderRadius:10, background:k.tint+"18", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, marginBottom:10 }}>{k.icon}</div>
                <div style={{ fontSize:26, fontWeight:800, color:C.navy, letterSpacing:"-0.02em" }}>{k.value}</div>
                <div style={{ fontSize:11.5, color:C.muted, marginTop:2 }}>{k.label}</div>
              </div>
            ))}
          </div>

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
                      <td style={{ padding:"12px", textAlign:"right", whiteSpace:"nowrap" }}>
                        <button onClick={()=>setPreview({ title:i.name, blocks:i.blocks })} title={t("nlPreviewBtn")}
                          style={{ ...iconBtn(), marginRight:i.status!=="sent"?6:0 }}>👁</button>
                        {i.status!=="sent" && (
                          <button onClick={()=>openEditor(i)} title="✏️" style={iconBtn()}>✏️</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

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
