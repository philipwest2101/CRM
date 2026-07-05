import React, { useState } from "react";
import { C } from "../../theme";

// ─────────────────────────────────────────────────────────────────────────────
// Newsletter — HubSpot-style email editor (mock, client-side)
//   List (Newsletters / Groups / Templates gallery) → block editor with
//   Edit / Settings / Send workflow and a live email canvas.
// ─────────────────────────────────────────────────────────────────────────────

// ── Block palette ────────────────────────────────────────────────────────────
const BLOCK_TYPES = [
  { type:"logo",    icon:"🏷️", label:"Logo"    },
  { type:"image",   icon:"🖼️", label:"Image"   },
  { type:"heading", icon:"🔠", label:"Heading" },
  { type:"text",    icon:"📝", label:"Text"    },
  { type:"button",  icon:"🔘", label:"Button"  },
  { type:"divider", icon:"➖", label:"Divider" },
  { type:"footer",  icon:"⚓", label:"Footer"  },
];

const BLOCK_DEFAULTS = {
  logo:    { text:"vionworld" },
  image:   { label:"Drop an image here or click to upload" },
  heading: { text:"Your headline goes here" },
  text:    { text:"Write your paragraph here. Use {FirstName} to personalise the greeting." },
  button:  { label:"Call to action", url:"#" },
  divider: {},
  footer:  { text:"vion gmbh · Musterstraße 1 · 80331 München" },
};

let blockSeq = 0;
const newBlock = (type, props={}) => ({ id:`b${Date.now()}_${blockSeq++}`, type, ...BLOCK_DEFAULTS[type], ...props });
const instantiate = (blocks) => blocks.map(b => ({ ...b, id:`b${Date.now()}_${blockSeq++}` }));

// ── Pre-built templates (block sets, HubSpot-gallery style) ──────────────────
const NL_TEMPLATES = [
  { id:"t1", name:"Monthly Market Update", desc:"Regular financial market digest",
    subject:"Your monthly market update from vion",
    blocks:[
      { type:"logo" },
      { type:"heading", text:"📈 Market Update — {Month}" },
      { type:"text", text:"Dear {FirstName},\n\nHere is your market summary for this month — key movements, what they mean for you, and our analysts' outlook for the coming weeks." },
      { type:"image", label:"Market chart" },
      { type:"text", text:"• Markets at a glance — key movements and what they mean for you\n• Our analysts' outlook for the coming weeks\n• One practical tip to strengthen your portfolio" },
      { type:"button", label:"Read the full report", url:"#" },
      { type:"divider" },
      { type:"footer", text:"vion gmbh · Musterstraße 1 · 80331 München" },
    ]},
  { id:"t2", name:"Product Announcement", desc:"Introduce a new product or service",
    subject:"New at vion: something we think you'll love",
    blocks:[
      { type:"logo" },
      { type:"image", label:"Product hero image" },
      { type:"heading", text:"🎉 Introducing our newest offering" },
      { type:"text", text:"Dear {FirstName},\n\nWe have exciting news — we've just launched something new. Here's why it matters for you:\n\n• Benefit 1\n• Benefit 2\n• Benefit 3" },
      { type:"button", label:"Learn more", url:"#" },
      { type:"divider" },
      { type:"footer", text:"vion gmbh · Musterstraße 1 · 80331 München" },
    ]},
  { id:"t3", name:"Event Invitation", desc:"Invite subscribers to a webinar or event",
    subject:"You're invited: [Event name]",
    blocks:[
      { type:"logo" },
      { type:"heading", text:"📅 You're invited!" },
      { type:"text", text:"Dear {FirstName},\n\nWe warmly invite you to our upcoming event:\n\n📅 Date: [Date]\n🕕 Time: [Time]\n📍 Location: [Location / Online]" },
      { type:"text", text:"Seats are limited — reserve yours today." },
      { type:"button", label:"Reserve my seat", url:"#" },
      { type:"divider" },
      { type:"footer", text:"vion gmbh · Musterstraße 1 · 80331 München" },
    ]},
  { id:"t4", name:"Welcome Newsletter", desc:"First newsletter for new subscribers",
    subject:"Welcome to the vion newsletter, {FirstName}!",
    blocks:[
      { type:"logo" },
      { type:"heading", text:"👋 Welcome aboard, {FirstName}!" },
      { type:"text", text:"Great to have you with us! Here's what you can expect from our newsletter:\n\n• Monthly market updates and financial insights\n• Practical tips for your financial planning\n• Invitations to exclusive events and webinars" },
      { type:"button", label:"Meet your advisor", url:"#" },
      { type:"divider" },
      { type:"footer", text:"vion gmbh · Musterstraße 1 · 80331 München" },
    ]},
  { id:"t5", name:"Tips & Insights", desc:"Educational content and practical advice",
    subject:"3 financial tips you can use right away",
    blocks:[
      { type:"logo" },
      { type:"heading", text:"💡 3 tips for your finances" },
      { type:"text", text:"Dear {FirstName},\n\n1️⃣ [Tip one — short and actionable]\n\n2️⃣ [Tip two — short and actionable]\n\n3️⃣ [Tip three — short and actionable]" },
      { type:"divider" },
      { type:"text", text:"Want a personal recommendation? Your advisor is just one reply away." },
      { type:"button", label:"Book a free consultation", url:"#" },
      { type:"footer", text:"vion gmbh · Musterstraße 1 · 80331 München" },
    ]},
  { id:"t6", name:"Seasonal Greetings", desc:"Holiday and season's greetings",
    subject:"Season's greetings from all of us at vion",
    blocks:[
      { type:"image", label:"Seasonal banner" },
      { type:"heading", text:"🎄 Season's greetings, {FirstName}!" },
      { type:"text", text:"As the year draws to a close, we want to say thank you — for your trust and the great cooperation.\n\nWe wish you and your loved ones a wonderful holiday season and a healthy, successful new year." },
      { type:"divider" },
      { type:"footer", text:"vion gmbh · Musterstraße 1 · 80331 München" },
    ]},
];

// ── Recipient groups ─────────────────────────────────────────────────────────
const NL_GROUPS = [
  { id:"g1", name:"All Subscribers",     members:2847, desc:"Everyone who opted in to the newsletter" },
  { id:"g2", name:"Clients",             members:412,  desc:"Active clients with a signed contract"   },
  { id:"g3", name:"Prospects",           members:876,  desc:"Interested contacts, not yet clients"    },
  { id:"g4", name:"Webinar Attendees",   members:198,  desc:"Attended at least one webinar"           },
  { id:"g5", name:"English Subscribers", members:384,  desc:"Contacts who prefer English content"     },
];

// ── Existing newsletters (mock) ──────────────────────────────────────────────
const NL_ITEMS = [
  { id:"n1", name:"February Market Update",  subject:"Your monthly market update from vion",       groupId:"g1", blocks:instantiate(NL_TEMPLATES[0].blocks), status:"sent",      sent:2610, date:"12 Feb 2026" },
  { id:"n2", name:"Spring Event Invitation", subject:"You're invited: Spring Finance Forum",        groupId:"g4", blocks:instantiate(NL_TEMPLATES[2].blocks), status:"scheduled", sent:0,    date:"15 Mar 2026, 10:00" },
  { id:"n3", name:"March Product News",      subject:"New at vion: something we think you'll love", groupId:"g2", blocks:instantiate(NL_TEMPLATES[1].blocks), status:"draft",     sent:0,    date:"22 Feb 2026" },
];

const STATUS = {
  draft:     { label:"Draft",     color:C.amber },
  scheduled: { label:"Scheduled", color:C.blue  },
  sent:      { label:"Sent",      color:C.green },
};

// ── Shared styles ────────────────────────────────────────────────────────────
const CANVAS_BG = "#EAF0F6";   // HubSpot editor gray-blue
const inputStyle: React.CSSProperties = {
  width:"100%", padding:"10px 12px", borderRadius:8, border:`1px solid ${C.border}`,
  fontSize:13, fontFamily:"inherit", boxSizing:"border-box", outline:"none", background:"#fff", color:C.text,
};
const labelStyle: React.CSSProperties = {
  fontSize:11, fontWeight:700, color:C.slate, textTransform:"uppercase",
  letterSpacing:"0.05em", display:"block", marginBottom:5,
};
const btn = (primary=false): React.CSSProperties => ({
  padding:"9px 16px", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit",
  border: primary ? "none" : `1px solid ${C.border}`,
  background: primary ? C.primary : "#fff",
  color: primary ? "#fff" : C.slate,
});

// ── Email block renderer (canvas, thumbnails and review all share this) ──────
const BlockView = ({ b }) => {
  switch (b.type) {
    case "logo": return (
      <div style={{ padding:"20px 24px 14px", textAlign:"center", fontSize:20, letterSpacing:"-0.02em" }}>
        <span style={{ fontWeight:800, color:C.primary }}>{(b.text||"vionworld").slice(0,4)}</span>
        <span style={{ fontWeight:400, color:"#98A2B3" }}>{(b.text||"vionworld").slice(4)}</span>
      </div>);
    case "image": return (
      <div style={{ margin:"8px 24px", height:150, borderRadius:8, display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center", gap:6, color:"#8CA3B8", fontSize:12,
        background:"linear-gradient(135deg,#F0F4F8,#DFE8F0)", border:"1.5px dashed #C3D1DE" }}>
        <span style={{ fontSize:26 }}>🖼️</span>{b.label}
      </div>);
    case "heading": return (
      <div style={{ padding:"14px 24px 6px", fontSize:23, fontWeight:800, color:"#1D2939", lineHeight:1.3 }}>{b.text}</div>);
    case "text": return (
      <div style={{ padding:"8px 24px", fontSize:13.5, color:"#33475B", lineHeight:1.7, whiteSpace:"pre-wrap" }}>{b.text}</div>);
    case "button": return (
      <div style={{ padding:"14px 24px", textAlign:"center" }}>
        <span style={{ display:"inline-block", padding:"11px 28px", borderRadius:6, background:C.primary,
          color:"#fff", fontSize:13.5, fontWeight:700 }}>{b.label}</span>
      </div>);
    case "divider": return (
      <div style={{ padding:"10px 24px" }}><div style={{ height:1, background:"#E3EAF1" }}/></div>);
    case "footer": return (
      <div style={{ padding:"16px 24px 22px", textAlign:"center", fontSize:10.5, color:"#8CA3B8", lineHeight:1.8, whiteSpace:"pre-wrap" }}>
        {b.text}
        {"\n"}<span style={{ textDecoration:"underline" }}>Unsubscribe</span> · <span style={{ textDecoration:"underline" }}>Manage preferences</span>
      </div>);
    default: return null;
  }
};

const EmailFrame = ({ blocks, width=600 }) => (
  <div style={{ width, background:"#fff", borderRadius:4, overflow:"hidden", boxShadow:"0 1px 6px rgba(45,62,80,0.12)" }}>
    {blocks.map(b => <BlockView key={b.id||b.type+Math.random()} b={b} />)}
  </div>
);

// Scaled-down thumbnail used in the template gallery
const TemplateThumb = ({ blocks }) => (
  <div style={{ height:190, overflow:"hidden", background:CANVAS_BG, display:"flex", justifyContent:"center", paddingTop:14 }}>
    <div style={{ transform:"scale(0.4)", transformOrigin:"top center", flexShrink:0 }}>
      <EmailFrame blocks={blocks} />
    </div>
  </div>
);

const Toast = ({ msg }) => (
  <div style={{ position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)", zIndex:400,
    background:C.navy, color:"#fff", padding:"11px 20px", borderRadius:10, fontSize:13, fontWeight:600,
    boxShadow:"0 8px 28px rgba(0,0,0,0.25)", whiteSpace:"nowrap" }}>
    {msg}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
export const NewsletterPage = () => {
  const [tab, setTab]         = useState("newsletters");   // newsletters | groups | templates
  const [view, setView]       = useState("list");          // list | editor
  const [items, setItems]     = useState(NL_ITEMS);
  const [groups, setGroups]   = useState(NL_GROUPS);
  const [toast, setToast]     = useState(null);

  // ── Editor state ───────────────────────────────────────────────────────────
  const [editorTab, setEditorTab] = useState("edit");      // edit | settings | send
  const [editId, setEditId]       = useState(null);
  const [name, setName]           = useState("");
  const [subject, setSubject]     = useState("");
  const [preheader, setPreheader] = useState("");
  const [fromName, setFromName]   = useState("vion Newsletter");
  const [fromEmail, setFromEmail] = useState("newsletter@vion.de");
  const [groupId, setGroupId]     = useState("g1");
  const [blocks, setBlocks]       = useState([]);
  const [selId, setSelId]         = useState(null);
  const [dragType, setDragType]   = useState(null);        // block type being dragged from palette
  const [dropIdx, setDropIdx]     = useState(null);        // insertion index indicator
  const [sendOpt, setSendOpt]     = useState("now");
  const [schedDate, setSchedDate] = useState("2026-03-01");
  const [schedTime, setSchedTime] = useState("10:00");
  const [testSent, setTestSent]   = useState(false);

  const [newGroup, setNewGroup]   = useState("");

  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(null), 2600); };
  const group     = groups.find(g=>g.id===groupId) || groups[0];
  const selBlock  = blocks.find(b=>b.id===selId);

  // ── Editor open / close / save ─────────────────────────────────────────────
  const openEditor = (item=null, template=null) => {
    setEditId(item?.id || null);
    setName(item?.name || (template ? template.name : ""));
    setSubject(item?.subject || template?.subject || "");
    setPreheader(item?.preheader || "");
    setGroupId(item?.groupId || groups[0]?.id || "g1");
    setBlocks(item?.blocks ? item.blocks.map(b=>({ ...b })) : template ? instantiate(template.blocks) : [newBlock("logo"), newBlock("heading"), newBlock("text"), newBlock("footer")]);
    setSelId(null); setEditorTab("edit"); setSendOpt("now"); setTestSent(false);
    setView("editor");
  };
  const closeEditor = () => { setView("list"); setEditId(null); setTab("newsletters"); };

  const upsert = (status, date, sent=0) => {
    const entry = { id:editId||`n${Date.now()}`, name:name||"Untitled newsletter", subject, preheader, groupId, blocks, status, sent, date };
    setItems(prev => editId ? prev.map(i=>i.id===editId?entry:i) : [entry, ...prev]);
  };
  const saveDraft = () => { upsert("draft", "Today"); showToast("💾 Draft saved"); };
  const sendTest  = () => { setTestSent(true); showToast(`📧 Test email sent to ${fromEmail}`); };
  const send = () => {
    if(!subject.trim() || blocks.length===0) { showToast("⚠️ Add a subject and content before sending"); setEditorTab(subject.trim()?"edit":"settings"); return; }
    if(sendOpt==="scheduled") { upsert("scheduled", `${schedDate}, ${schedTime}`); closeEditor(); showToast(`⏰ Scheduled for ${schedDate} at ${schedTime}`); }
    else { upsert("sent", "Today", group?.members||0); closeEditor(); showToast(`🚀 Newsletter sent to ${(group?.members||0).toLocaleString()} recipients`); }
  };

  // ── Block operations ───────────────────────────────────────────────────────
  const addBlockAt = (type, idx=null) => {
    const b = newBlock(type);
    setBlocks(prev => {
      const next = [...prev];
      next.splice(idx==null ? next.length : idx, 0, b);
      return next;
    });
    setSelId(b.id);
  };
  const updateBlock = (id, patch) => setBlocks(prev => prev.map(b => b.id===id ? { ...b, ...patch } : b));
  const removeBlock = (id) => { setBlocks(prev => prev.filter(b=>b.id!==id)); if(selId===id) setSelId(null); };
  const moveBlock   = (id, dir) => setBlocks(prev => {
    const i = prev.findIndex(b=>b.id===id);
    const j = i + (dir==="up" ? -1 : 1);
    if (i<0 || j<0 || j>=prev.length) return prev;
    const next = [...prev]; [next[i], next[j]] = [next[j], next[i]];
    return next;
  });

  // ── Group operations ───────────────────────────────────────────────────────
  const addGroup = () => {
    if(!newGroup.trim()) return;
    setGroups(prev=>[...prev, { id:`g${Date.now()}`, name:newGroup.trim(), members:0, desc:"Custom group" }]);
    setNewGroup(""); showToast("👥 Group created");
  };
  const removeGroup = (id) => {
    if(items.some(i=>i.groupId===id)) { showToast("⚠️ Group is used by a newsletter and can't be deleted"); return; }
    setGroups(prev=>prev.filter(g=>g.id!==id)); showToast("🗑 Group deleted");
  };

  // ════════════════════════════════════════════════════════════════════════════
  // EDITOR (full-screen, HubSpot-style: top bar + Edit / Settings / Send tabs)
  // ════════════════════════════════════════════════════════════════════════════
  if(view==="editor") {
    const checklist = [
      { label:"Subject line set",            ok:!!subject.trim() },
      { label:"Recipient group selected",    ok:!!group && group.members>0 },
      { label:"Email has content",           ok:blocks.length>0 },
      { label:"Footer with unsubscribe",     ok:blocks.some(b=>b.type==="footer") },
      { label:"Test email sent",             ok:testSent, soft:true },
    ];
    const editableFields = { logo:[["text","Logo text"]], image:[["label","Caption"]], heading:[["text","Heading"]],
      text:[["text","Text"]], button:[["label","Button label"],["url","Link URL"]], footer:[["text","Footer text"]], divider:[] };

    return (
      <div style={{ display:"flex", flexDirection:"column", height:"calc(100vh - 54px)", background:CANVAS_BG }}>
        {toast && <Toast msg={toast}/>}

        {/* ── Top bar ── */}
        <div style={{ background:"#fff", borderBottom:`1px solid ${C.border}`, padding:"0 16px", height:52,
          display:"flex", alignItems:"center", gap:12, flexShrink:0 }}>
          <button onClick={closeEditor} style={{ ...btn(), padding:"6px 12px", fontSize:12 }}>← Exit</button>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Untitled newsletter"
            style={{ border:"none", outline:"none", fontSize:15, fontWeight:700, color:C.navy, fontFamily:"inherit",
              width:230, background:"transparent" }}/>
          {/* Workflow tabs */}
          <div style={{ display:"flex", gap:2, margin:"0 auto", height:"100%" }}>
            {[["edit","Edit"],["settings","Settings"],["send","Send"]].map(([k,l])=>(
              <button key={k} onClick={()=>setEditorTab(k)}
                style={{ padding:"0 22px", border:"none", background:"transparent", fontSize:13, fontFamily:"inherit",
                  cursor:"pointer", fontWeight:editorTab===k?700:500, color:editorTab===k?C.primaryDark:C.slate,
                  borderBottom:editorTab===k?`3px solid ${C.primary}`:"3px solid transparent" }}>
                {l}
              </button>
            ))}
          </div>
          <button onClick={sendTest} style={{ ...btn(), padding:"7px 13px", fontSize:12, color:testSent?C.green:C.slate, borderColor:testSent?C.green:C.border }}>
            {testSent?"✅ Test sent":"📧 Send test"}
          </button>
          <button onClick={saveDraft} style={{ ...btn(), padding:"7px 13px", fontSize:12 }}>💾 Save draft</button>
          {editorTab!=="send"
            ? <button onClick={()=>setEditorTab("send")} style={{ ...btn(true), padding:"7px 16px", fontSize:12 }}>Review & send →</button>
            : <button onClick={send} style={{ ...btn(true), padding:"7px 16px", fontSize:12, background:C.green }}>
                {sendOpt==="now" ? "🚀 Send now" : "⏰ Schedule"}
              </button>}
        </div>

        {/* ══ EDIT TAB — palette / settings sidebar + canvas ══ */}
        {editorTab==="edit" && (
        <div style={{ flex:1, display:"flex", overflow:"hidden" }}>
          {/* Sidebar */}
          <div style={{ width:264, background:"#fff", borderRight:`1px solid ${C.border}`, overflowY:"auto", flexShrink:0, padding:14 }}>
            {selBlock ? (
              <>
                <button onClick={()=>setSelId(null)} style={{ border:"none", background:"none", color:C.blue, fontSize:12, fontWeight:600, cursor:"pointer", padding:0, marginBottom:10, fontFamily:"inherit" }}>← All blocks</button>
                <div style={{ fontSize:13, fontWeight:800, color:C.navy, marginBottom:12, textTransform:"capitalize" }}>
                  {BLOCK_TYPES.find(t=>t.type===selBlock.type)?.icon} {selBlock.type} block
                </div>
                {(editableFields[selBlock.type]||[]).map(([field,label])=>(
                  <div key={field} style={{ marginBottom:12 }}>
                    <label style={labelStyle}>{label}</label>
                    {field==="text" && (selBlock.type==="text"||selBlock.type==="footer")
                      ? <textarea value={selBlock[field]||""} rows={7} onChange={e=>updateBlock(selBlock.id,{[field]:e.target.value})}
                          style={{ ...inputStyle, resize:"vertical", lineHeight:1.6 }}/>
                      : <input value={selBlock[field]||""} onChange={e=>updateBlock(selBlock.id,{[field]:e.target.value})} style={inputStyle}/>}
                  </div>
                ))}
                {(selBlock.type==="text"||selBlock.type==="heading") && (
                  <div style={{ marginBottom:12 }}>
                    <label style={labelStyle}>Personalisation</label>
                    <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                      {["{FirstName}","{LastName}","{City}"].map(tk=>(
                        <button key={tk} onClick={()=>updateBlock(selBlock.id,{ text:(selBlock.text||"")+" "+tk })}
                          style={{ padding:"4px 9px", borderRadius:6, border:`1px solid ${C.border}`, background:"#F8FAFC",
                            fontSize:11, fontFamily:"monospace", color:C.indigo, fontWeight:600, cursor:"pointer" }}>{tk}</button>
                      ))}
                    </div>
                  </div>
                )}
                <button onClick={()=>removeBlock(selBlock.id)}
                  style={{ ...btn(), width:"100%", color:C.red, borderColor:C.red+"40", fontSize:12 }}>🗑 Delete block</button>
              </>
            ) : (
              <>
                <div style={{ fontSize:11, fontWeight:800, color:C.slate, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:10 }}>Content blocks</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                  {BLOCK_TYPES.map(bt=>(
                    <div key={bt.type} draggable
                      onDragStart={()=>setDragType(bt.type)}
                      onDragEnd={()=>{ setDragType(null); setDropIdx(null); }}
                      onClick={()=>addBlockAt(bt.type)}
                      style={{ padding:"13px 6px 10px", borderRadius:9, border:`1px solid ${C.border}`, background:"#fff",
                        textAlign:"center", cursor:"grab", userSelect:"none" }}
                      onMouseEnter={e=>{ e.currentTarget.style.borderColor=C.primary; e.currentTarget.style.background=C.primarySoft; }}
                      onMouseLeave={e=>{ e.currentTarget.style.borderColor=C.border; e.currentTarget.style.background="#fff"; }}>
                      <div style={{ fontSize:19, marginBottom:4 }}>{bt.icon}</div>
                      <div style={{ fontSize:11, fontWeight:700, color:C.text }}>{bt.label}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop:14, padding:"10px 12px", borderRadius:9, background:"#F0F6FF", border:"1px solid #D6E6FF", fontSize:11, color:"#33475B", lineHeight:1.55 }}>
                  💡 Drag a block onto the canvas — or click it to add it at the end. Click any block in the email to edit it.
                </div>
              </>
            )}
          </div>

          {/* Canvas */}
          <div style={{ flex:1, overflowY:"auto", padding:"28px 0 60px", display:"flex", justifyContent:"center" }}
            onDragOver={e=>{ if(dragType){ e.preventDefault(); } }}
            onDrop={e=>{ if(dragType){ e.preventDefault(); addBlockAt(dragType, dropIdx); setDragType(null); setDropIdx(null); } }}>
            <div style={{ width:600, flexShrink:0 }}>
              {/* Inbox preview line */}
              <div style={{ padding:"9px 14px", marginBottom:12, background:"#fff", borderRadius:8, border:`1px solid ${C.border}`, fontSize:12, color:C.slate, display:"flex", gap:8, alignItems:"baseline", overflow:"hidden", whiteSpace:"nowrap" }}>
                <span style={{ fontWeight:700, color:C.navy, flexShrink:0 }}>{fromName}</span>
                <span style={{ fontWeight:600, color:C.text, overflow:"hidden", textOverflow:"ellipsis" }}>{subject||"(no subject — set it under Settings)"}</span>
                <span style={{ color:C.muted, overflow:"hidden", textOverflow:"ellipsis" }}>{preheader||"Preview text…"}</span>
              </div>

              <div style={{ background:"#fff", borderRadius:4, overflow:"hidden", boxShadow:"0 1px 6px rgba(45,62,80,0.12)" }}>
                {blocks.map((b, i)=>(
                  <div key={b.id}
                    onDragOver={e=>{ if(dragType){ e.preventDefault(); e.stopPropagation(); const r=e.currentTarget.getBoundingClientRect(); setDropIdx(e.clientY < r.top + r.height/2 ? i : i+1); } }}
                    style={{ position:"relative" }}>
                    {dragType && dropIdx===i && <div style={{ height:3, background:C.primary, margin:"0 8px", borderRadius:2 }}/>}
                    <div onClick={()=>setSelId(b.id)}
                      style={{ position:"relative", cursor:"pointer",
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
                      <BlockView b={b}/>
                    </div>
                    {dragType && dropIdx===i+1 && i===blocks.length-1 && <div style={{ height:3, background:C.primary, margin:"0 8px", borderRadius:2 }}/>}
                  </div>
                ))}
                {blocks.length===0 && (
                  <div style={{ padding:"56px 20px", textAlign:"center", color:"#8CA3B8" }}
                    onDragOver={e=>{ if(dragType){ e.preventDefault(); setDropIdx(0); } }}>
                    <div style={{ fontSize:30, marginBottom:8 }}>📧</div>
                    <div style={{ fontSize:13 }}>Drag blocks here to build your email</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        )}

        {/* ══ SETTINGS TAB ══ */}
        {editorTab==="settings" && (
        <div style={{ flex:1, overflowY:"auto", padding:"32px 20px" }}>
          <div style={{ maxWidth:620, margin:"0 auto", background:"#fff", borderRadius:12, border:`1px solid ${C.border}`, padding:26 }}>
            <div style={{ fontSize:16, fontWeight:800, color:C.navy, marginBottom:18 }}>Email settings</div>
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              <div>
                <label style={labelStyle}>Subject line *</label>
                <input value={subject} onChange={e=>setSubject(e.target.value)} placeholder="e.g. Your financial digest for March" style={inputStyle}/>
              </div>
              <div>
                <label style={labelStyle}>Preview text</label>
                <input value={preheader} onChange={e=>setPreheader(e.target.value)} placeholder="Shown next to the subject in the inbox" style={inputStyle}/>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <div>
                  <label style={labelStyle}>From name</label>
                  <input value={fromName} onChange={e=>setFromName(e.target.value)} style={inputStyle}/>
                </div>
                <div>
                  <label style={labelStyle}>From address</label>
                  <input value={fromEmail} onChange={e=>setFromEmail(e.target.value)} style={inputStyle}/>
                </div>
              </div>
              <div>
                <label style={labelStyle}>Send to group *</label>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {groups.map(g=>(
                    <div key={g.id} onClick={()=>setGroupId(g.id)}
                      style={{ display:"flex", alignItems:"center", gap:10, padding:"11px 13px", borderRadius:9, cursor:"pointer",
                        border:`1.5px solid ${groupId===g.id?C.primary:C.border}`, background:groupId===g.id?C.primarySoft:"#fff" }}>
                      <div style={{ width:16, height:16, borderRadius:"50%", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center",
                        border:`2px solid ${groupId===g.id?C.primary:C.border}`, background:groupId===g.id?C.primary:"#fff" }}>
                        {groupId===g.id && <div style={{ width:6, height:6, borderRadius:"50%", background:"#fff" }}/>}
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13, fontWeight:700, color:groupId===g.id?C.primaryDark:C.text }}>{g.name}</div>
                        <div style={{ fontSize:11, color:C.muted }}>{g.desc}</div>
                      </div>
                      <div style={{ fontSize:13, fontWeight:700, color:C.navy }}>{g.members.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* ══ SEND TAB — review checklist + schedule ══ */}
        {editorTab==="send" && (
        <div style={{ flex:1, overflowY:"auto", padding:"32px 20px" }}>
          <div style={{ maxWidth:920, margin:"0 auto", display:"grid", gridTemplateColumns:"1fr 340px", gap:18, alignItems:"start" }}>
            {/* Review */}
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div style={{ background:"#fff", borderRadius:12, border:`1px solid ${C.border}`, padding:22 }}>
                <div style={{ fontSize:15, fontWeight:800, color:C.navy, marginBottom:14 }}>Review before sending</div>
                {checklist.map((c,i)=>(
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:9, padding:"9px 0", borderBottom:i<checklist.length-1?`1px solid ${C.border}`:"none", fontSize:13 }}>
                    <span style={{ fontSize:14 }}>{c.ok ? "✅" : c.soft ? "⚠️" : "❌"}</span>
                    <span style={{ color:c.ok?C.text:c.soft?C.amber:C.red, flex:1 }}>{c.label}</span>
                    {!c.ok && !c.soft && (
                      <button onClick={()=>setEditorTab(c.label.startsWith("Subject")||c.label.startsWith("Recipient")?"settings":"edit")}
                        style={{ ...btn(), padding:"3px 10px", fontSize:11 }}>Fix</button>
                    )}
                    {!c.ok && c.soft && <button onClick={sendTest} style={{ ...btn(), padding:"3px 10px", fontSize:11 }}>Send test</button>}
                  </div>
                ))}
              </div>
              {/* Mini preview */}
              <div style={{ background:"#fff", borderRadius:12, border:`1px solid ${C.border}`, padding:"14px 18px" }}>
                <div style={{ fontSize:11, fontWeight:800, color:C.slate, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:10 }}>Preview</div>
                <div style={{ background:CANVAS_BG, borderRadius:8, padding:"14px 0", display:"flex", justifyContent:"center", maxHeight:330, overflow:"hidden" }}>
                  <div style={{ transform:"scale(0.5)", transformOrigin:"top center", flexShrink:0 }}>
                    <EmailFrame blocks={blocks}/>
                  </div>
                </div>
              </div>
            </div>

            {/* Send panel */}
            <div style={{ background:"#fff", borderRadius:12, border:`1px solid ${C.border}`, padding:22, position:"sticky", top:16 }}>
              <div style={{ fontSize:15, fontWeight:800, color:C.navy, marginBottom:6 }}>Recipients</div>
              <div style={{ fontSize:13, color:C.slate, marginBottom:16 }}>
                <b style={{ color:C.navy }}>{(group?.members||0).toLocaleString()}</b> contacts in <b style={{ color:C.navy }}>{group?.name}</b>
              </div>
              <div style={{ fontSize:11, fontWeight:800, color:C.slate, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:8 }}>When to send</div>
              {[["now","🚀 Send now","Dispatch immediately"],["scheduled","⏰ Schedule for later","Pick date & time"]].map(([k,l,d])=>(
                <div key={k} onClick={()=>setSendOpt(k)}
                  style={{ padding:"11px 13px", borderRadius:9, cursor:"pointer", marginBottom:8,
                    border:`1.5px solid ${sendOpt===k?C.primary:C.border}`, background:sendOpt===k?C.primarySoft:"#fff" }}>
                  <div style={{ fontSize:13, fontWeight:700, color:sendOpt===k?C.primaryDark:C.text }}>{l}</div>
                  <div style={{ fontSize:11, color:C.muted, marginTop:1 }}>{d}</div>
                  {k==="scheduled" && sendOpt==="scheduled" && (
                    <div style={{ display:"flex", gap:8, marginTop:8 }} onClick={e=>e.stopPropagation()}>
                      <input type="date" value={schedDate} onChange={e=>setSchedDate(e.target.value)} style={{ ...inputStyle, padding:"6px 9px", fontSize:12 }}/>
                      <input type="time" value={schedTime} onChange={e=>setSchedTime(e.target.value)} style={{ ...inputStyle, padding:"6px 9px", fontSize:12 }}/>
                    </div>
                  )}
                </div>
              ))}
              <button onClick={send} style={{ ...btn(true), width:"100%", marginTop:8, padding:"12px", fontSize:14, background:C.green }}>
                {sendOpt==="now" ? `🚀 Send to ${(group?.members||0).toLocaleString()} recipients` : `⏰ Schedule for ${schedDate}, ${schedTime}`}
              </button>
              <div style={{ display:"flex", gap:8, marginTop:10 }}>
                <button onClick={saveDraft} style={{ ...btn(), flex:1, fontSize:12 }}>💾 Save draft</button>
                <button onClick={sendTest} style={{ ...btn(), flex:1, fontSize:12, color:testSent?C.green:C.slate, borderColor:testSent?C.green:C.border }}>
                  {testSent?"✅ Test sent":"📧 Send test"}
                </button>
              </div>
            </div>
          </div>
        </div>
        )}
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // LIST VIEW (Newsletters / Groups / Templates gallery)
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div style={{ padding:"24px 28px 48px", maxWidth:1100, margin:"0 auto" }}>
      {toast && <Toast msg={toast}/>}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
        <h1 style={{ margin:0, fontSize:22, fontWeight:700, color:C.navy, letterSpacing:"-0.02em" }}>Newsletter</h1>
        <button onClick={()=>setTab("templates")} style={btn(true)}>+ New Newsletter</button>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:4, marginBottom:16, borderBottom:`1px solid ${C.border}` }}>
        {[["newsletters",`📰 Newsletters (${items.length})`],["groups",`👥 Groups (${groups.length})`],["templates",`📋 Templates (${NL_TEMPLATES.length})`]].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)}
            style={{ padding:"9px 16px", border:"none", background:"transparent", fontSize:13, fontFamily:"inherit", cursor:"pointer",
              fontWeight:tab===k?700:500, color:tab===k?C.primaryDark:C.slate,
              borderBottom:tab===k?`2px solid ${C.primary}`:"2px solid transparent", marginBottom:-1 }}>
            {l}
          </button>
        ))}
      </div>

      {/* ── Newsletters ── */}
      {tab==="newsletters" && (
        <div style={{ background:"#fff", border:`1px solid ${C.border}`, borderRadius:14, overflow:"hidden" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ background:C.light, borderBottom:`1px solid ${C.border}` }}>
                {["Name","Group","Status","Recipients","Date",""].map(h=>(
                  <th key={h} style={{ padding:"11px 14px", textAlign:"left", fontSize:12, fontWeight:600, color:C.navy, whiteSpace:"nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map(i=>{
                const st = STATUS[i.status]; const g = groups.find(g=>g.id===i.groupId);
                return (
                  <tr key={i.id} style={{ borderBottom:`1px solid ${C.border}` }}>
                    <td style={{ padding:"12px 14px" }}>
                      <div style={{ fontSize:13, fontWeight:600, color:C.text }}>{i.name}</div>
                      <div style={{ fontSize:11, color:C.muted, marginTop:1 }}>{i.subject}</div>
                    </td>
                    <td style={{ padding:"12px 14px", fontSize:12, color:C.slate }}>{g?.name||"—"}</td>
                    <td style={{ padding:"12px 14px" }}>
                      <span style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:12, background:st.color+"15", color:st.color }}>{st.label}</span>
                    </td>
                    <td style={{ padding:"12px 14px", fontSize:12, color:C.slate }}>{i.status==="sent"?i.sent.toLocaleString():(g?.members||0).toLocaleString()}</td>
                    <td style={{ padding:"12px 14px", fontSize:12, color:C.slate, whiteSpace:"nowrap" }}>{i.date}</td>
                    <td style={{ padding:"12px 14px", textAlign:"right" }}>
                      {i.status!=="sent" && <button onClick={()=>openEditor(i)} style={{ ...btn(), padding:"5px 12px", fontSize:12 }}>✏️ Edit</button>}
                    </td>
                  </tr>
                );
              })}
              {items.length===0 && (
                <tr><td colSpan={6} style={{ padding:"40px", textAlign:"center", color:C.muted, fontSize:13 }}>
                  📰 No newsletters yet — start from a template.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Groups ── */}
      {tab==="groups" && (
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div style={{ display:"flex", gap:8 }}>
            <input value={newGroup} onChange={e=>setNewGroup(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addGroup()}
              placeholder="New group name, e.g. VIP Clients" style={{ ...inputStyle, maxWidth:320 }}/>
            <button onClick={addGroup} style={btn(true)}>+ Add Group</button>
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
                  <div style={{ fontSize:10, color:C.muted }}>members</div>
                </div>
                <button onClick={()=>removeGroup(g.id)} title="Delete group"
                  style={{ ...btn(), padding:"5px 10px", fontSize:12, color:C.red, borderColor:C.red+"40" }}>🗑</button>
              </div>
            ))}
          </div>
          <div style={{ fontSize:11, color:C.muted }}>Members are added automatically from contacts who opted in to the newsletter.</div>
        </div>
      )}

      {/* ── Templates gallery (HubSpot-style visual cards) ── */}
      {tab==="templates" && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(300px, 1fr))", gap:16 }}>
          {/* Blank canvas card */}
          <div onClick={()=>openEditor()}
            style={{ background:"#fff", border:`1.5px dashed ${C.border}`, borderRadius:14, overflow:"hidden", cursor:"pointer",
              display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:262, gap:8, color:C.slate }}
            onMouseEnter={e=>{ e.currentTarget.style.borderColor=C.primary; e.currentTarget.style.color=C.primaryDark; }}
            onMouseLeave={e=>{ e.currentTarget.style.borderColor=C.border; e.currentTarget.style.color=C.slate; }}>
            <div style={{ fontSize:34 }}>＋</div>
            <div style={{ fontSize:13, fontWeight:700 }}>Start from blank</div>
            <div style={{ fontSize:11, color:C.muted }}>Build your own layout block by block</div>
          </div>
          {NL_TEMPLATES.map(t=>(
            <div key={t.id} style={{ background:"#fff", border:`1px solid ${C.border}`, borderRadius:14, overflow:"hidden", display:"flex", flexDirection:"column" }}
              onMouseEnter={e=>e.currentTarget.style.boxShadow="0 6px 20px rgba(45,62,80,0.12)"}
              onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}>
              <div style={{ cursor:"pointer" }} onClick={()=>openEditor(null, t)}>
                <TemplateThumb blocks={t.blocks}/>
              </div>
              <div style={{ padding:"12px 14px", display:"flex", alignItems:"center", gap:10, borderTop:`1px solid ${C.border}` }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:C.text }}>{t.name}</div>
                  <div style={{ fontSize:11, color:C.muted, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{t.desc}</div>
                </div>
                <button onClick={()=>openEditor(null, t)} style={{ ...btn(true), padding:"7px 13px", fontSize:12, flexShrink:0 }}>Use →</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
