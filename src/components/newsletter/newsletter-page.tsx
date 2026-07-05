import React, { useState } from "react";
import { C } from "../../theme";

// ─── Pre-built standard templates ────────────────────────────────────────────
const NL_TEMPLATES = [
  { id:"t1", icon:"📈", name:"Monthly Market Update",
    desc:"Regular financial market digest for subscribers",
    subject:"Your monthly market update from vion",
    body:"Dear {FirstName},\n\nHere is your market summary for this month:\n\n• Markets at a glance — key movements and what they mean for you\n• Our analysts' outlook for the coming weeks\n• One practical tip to strengthen your portfolio\n\nQuestions? Simply reply to this email — we're happy to help.\n\nBest regards,\nYour vion Team\n\n—\nvion gmbh · Musterstraße 1 · 80331 München · {Unsubscribe}" },
  { id:"t2", icon:"🎉", name:"Product Announcement",
    desc:"Introduce a new product or service",
    subject:"New at vion: something we think you'll love",
    body:"Dear {FirstName},\n\nWe have exciting news — we've just launched something new:\n\n[Describe your new product or service here]\n\nWhy it matters for you:\n• Benefit 1\n• Benefit 2\n• Benefit 3\n\nWant to know more? Book a free consultation with your advisor.\n\nBest regards,\nYour vion Team\n\n—\nvion gmbh · Musterstraße 1 · 80331 München · {Unsubscribe}" },
  { id:"t3", icon:"📅", name:"Event Invitation",
    desc:"Invite subscribers to a webinar or event",
    subject:"You're invited: [Event name]",
    body:"Dear {FirstName},\n\nWe warmly invite you to our upcoming event:\n\n📅 Date: [Date]\n🕕 Time: [Time]\n📍 Location: [Location / Online]\n\nWhat to expect:\n• [Agenda point 1]\n• [Agenda point 2]\n\nSeats are limited — reserve yours today by replying to this email.\n\nWe look forward to seeing you!\nYour vion Team\n\n—\nvion gmbh · Musterstraße 1 · 80331 München · {Unsubscribe}" },
  { id:"t4", icon:"👋", name:"Welcome Newsletter",
    desc:"First newsletter for new subscribers",
    subject:"Welcome to the vion newsletter, {FirstName}!",
    body:"Dear {FirstName},\n\nWelcome aboard — great to have you with us!\n\nHere's what you can expect from our newsletter:\n• Monthly market updates and financial insights\n• Practical tips for your financial planning\n• Invitations to exclusive events and webinars\n\nIn the meantime, feel free to reach out to your personal advisor with any questions.\n\nBest regards,\nYour vion Team\n\n—\nvion gmbh · Musterstraße 1 · 80331 München · {Unsubscribe}" },
  { id:"t5", icon:"💡", name:"Tips & Insights",
    desc:"Educational content and practical advice",
    subject:"3 financial tips you can use right away",
    body:"Dear {FirstName},\n\nToday we're sharing three practical tips:\n\n1️⃣ [Tip one — short and actionable]\n\n2️⃣ [Tip two — short and actionable]\n\n3️⃣ [Tip three — short and actionable]\n\nWant a personal recommendation? Your advisor is just one reply away.\n\nBest regards,\nYour vion Team\n\n—\nvion gmbh · Musterstraße 1 · 80331 München · {Unsubscribe}" },
  { id:"t6", icon:"🎄", name:"Seasonal Greetings",
    desc:"Holiday and season's greetings to your contacts",
    subject:"Season's greetings from all of us at vion",
    body:"Dear {FirstName},\n\nAs the year draws to a close, we want to say thank you — for your trust and the great cooperation.\n\nWe wish you and your loved ones a wonderful holiday season and a healthy, successful new year.\n\nWe look forward to continuing our journey together.\n\nWarm regards,\nYour vion Team\n\n—\nvion gmbh · Musterstraße 1 · 80331 München · {Unsubscribe}" },
];

// ─── Recipient groups ────────────────────────────────────────────────────────
const NL_GROUPS = [
  { id:"g1", name:"All Subscribers",     members:2847, desc:"Everyone who opted in to the newsletter" },
  { id:"g2", name:"Clients",             members:412,  desc:"Active clients with a signed contract"   },
  { id:"g3", name:"Prospects",           members:876,  desc:"Interested contacts, not yet clients"    },
  { id:"g4", name:"Webinar Attendees",   members:198,  desc:"Attended at least one webinar"           },
  { id:"g5", name:"English Subscribers", members:384,  desc:"Contacts who prefer English content"     },
];

// ─── Existing newsletters (mock) ─────────────────────────────────────────────
const NL_ITEMS = [
  { id:"n1", name:"February Market Update", subject:"Your monthly market update from vion", groupId:"g1", body:NL_TEMPLATES[0].body, status:"sent",      sent:2610, date:"12 Feb 2026" },
  { id:"n2", name:"Spring Event Invitation", subject:"You're invited: Spring Finance Forum", groupId:"g4", body:NL_TEMPLATES[2].body, status:"scheduled", sent:0,    date:"15 Mar 2026, 10:00" },
  { id:"n3", name:"March Product News",      subject:"New at vion: something we think you'll love", groupId:"g2", body:NL_TEMPLATES[1].body, status:"draft", sent:0, date:"22 Feb 2026" },
];

const STATUS = {
  draft:     { label:"Draft",     color:C.amber },
  scheduled: { label:"Scheduled", color:C.blue  },
  sent:      { label:"Sent",      color:C.green },
};

const inputStyle: React.CSSProperties = {
  width:"100%", padding:"10px 12px", borderRadius:9, border:`1px solid ${C.border}`,
  fontSize:13, fontFamily:"inherit", boxSizing:"border-box", outline:"none", background:"#fff", color:C.text,
};
const labelStyle: React.CSSProperties = {
  fontSize:11, fontWeight:700, color:C.muted, textTransform:"uppercase",
  letterSpacing:"0.05em", display:"block", marginBottom:5,
};
const btn = (primary=false): React.CSSProperties => ({
  padding:"9px 16px", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit",
  border: primary ? "none" : `1px solid ${C.border}`,
  background: primary ? C.primary : "#fff",
  color: primary ? "#fff" : C.slate,
});

export const NewsletterPage = () => {
  const [tab, setTab]             = useState("newsletters");   // newsletters | groups | templates
  const [view, setView]           = useState("list");          // list | edit
  const [items, setItems]         = useState(NL_ITEMS);
  const [groups, setGroups]       = useState(NL_GROUPS);
  const [toast, setToast]         = useState(null);

  // Editor state
  const [editId, setEditId]       = useState(null);
  const [name, setName]           = useState("");
  const [subject, setSubject]     = useState("");
  const [groupId, setGroupId]     = useState("g1");
  const [body, setBody]           = useState("");
  const [sendOpt, setSendOpt]     = useState("now");           // now | scheduled
  const [schedDate, setSchedDate] = useState("2026-03-01");
  const [schedTime, setSchedTime] = useState("10:00");
  const [testSent, setTestSent]   = useState(false);

  // Groups editor state
  const [newGroup, setNewGroup]   = useState("");

  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(null), 2600); };
  const group = groups.find(g=>g.id===groupId) || groups[0];

  const openEditor = (item=null, template=null) => {
    setEditId(item?.id || null);
    setName(item?.name || "");
    setSubject(item?.subject || template?.subject || "");
    setBody(item?.body || template?.body || "");
    setGroupId(item?.groupId || groups[0]?.id || "g1");
    setSendOpt("now"); setTestSent(false);
    setView("edit"); setTab("newsletters");
  };

  const closeEditor = () => { setView("list"); setEditId(null); };

  const upsert = (status, date, sent=0) => {
    const entry = { id:editId||`n${Date.now()}`, name:name||"Untitled", subject, groupId, body, status, sent, date };
    setItems(prev => editId ? prev.map(i=>i.id===editId?entry:i) : [entry, ...prev]);
  };

  const saveDraft = () => { upsert("draft", "Today"); closeEditor(); showToast("💾 Draft saved"); };
  const sendTest  = () => { setTestSent(true); showToast("📧 Test email sent to your inbox"); };
  const send = () => {
    if(!subject.trim() || !body.trim()) { showToast("⚠️ Add a subject and body before sending"); return; }
    if(sendOpt==="scheduled") { upsert("scheduled", `${schedDate}, ${schedTime}`); closeEditor(); showToast(`⏰ Scheduled for ${schedDate} at ${schedTime}`); }
    else { upsert("sent", "Today", group?.members||0); closeEditor(); showToast(`🚀 Newsletter sent to ${(group?.members||0).toLocaleString()} recipients`); }
  };

  const addGroup = () => {
    if(!newGroup.trim()) return;
    setGroups(prev=>[...prev, { id:`g${Date.now()}`, name:newGroup.trim(), members:0, desc:"Custom group" }]);
    setNewGroup(""); showToast("👥 Group created");
  };
  const removeGroup = (id) => {
    if(items.some(i=>i.groupId===id)) { showToast("⚠️ Group is used by a newsletter and can't be deleted"); return; }
    setGroups(prev=>prev.filter(g=>g.id!==id)); showToast("🗑 Group deleted");
  };

  // ══════════════════════════════════════════════════════════════════════════
  // EDITOR
  // ══════════════════════════════════════════════════════════════════════════
  if(view==="edit") return (
    <div style={{ padding:"24px 28px 48px", maxWidth:1060, margin:"0 auto" }}>
      {toast && <Toast msg={toast}/>}
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:18 }}>
        <button onClick={closeEditor} style={btn()}>← Back</button>
        <h1 style={{ margin:0, fontSize:22, fontWeight:700, color:C.navy, letterSpacing:"-0.02em" }}>
          {editId ? "Edit Newsletter" : "New Newsletter"}
        </h1>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 280px", gap:18, alignItems:"start" }}>
        {/* Form */}
        <div style={{ background:"#fff", border:`1px solid ${C.border}`, borderRadius:14, padding:22, display:"flex", flexDirection:"column", gap:16 }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div>
              <label style={labelStyle}>Name *</label>
              <input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. March Market Update" style={inputStyle}/>
            </div>
            <div>
              <label style={labelStyle}>Send to Group *</label>
              <select value={groupId} onChange={e=>setGroupId(e.target.value)} style={{ ...inputStyle, cursor:"pointer" }}>
                {groups.map(g=><option key={g.id} value={g.id}>{g.name} ({g.members.toLocaleString()})</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={labelStyle}>Subject *</label>
            <input value={subject} onChange={e=>setSubject(e.target.value)} placeholder="e.g. Your financial digest for March" style={inputStyle}/>
          </div>

          {/* Template picker */}
          <div>
            <label style={labelStyle}>Start from a template</label>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {NL_TEMPLATES.map(t=>(
                <button key={t.id} onClick={()=>{ setSubject(t.subject); setBody(t.body); showToast(`📋 Template "${t.name}" applied`); }}
                  style={{ ...btn(), padding:"6px 11px", fontSize:12 }}>
                  {t.icon} {t.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={labelStyle}>Message *</label>
            <textarea value={body} onChange={e=>setBody(e.target.value)} rows={14}
              placeholder={"Dear {FirstName},\n\nWrite your newsletter here…"}
              style={{ ...inputStyle, fontFamily:"monospace", fontSize:12, lineHeight:1.65, resize:"vertical" }}/>
            <div style={{ fontSize:11, color:C.muted, marginTop:5 }}>
              Merge fields: <code style={{ color:C.indigo }}>{"{FirstName}"}</code> <code style={{ color:C.indigo }}>{"{LastName}"}</code> <code style={{ color:C.indigo }}>{"{Unsubscribe}"}</code>
            </div>
          </div>

          {/* Send options */}
          <div>
            <label style={labelStyle}>Sending</label>
            <div style={{ display:"flex", gap:10 }}>
              {[["now","🚀 Send now","Dispatch immediately"],["scheduled","⏰ Schedule","Pick date & time"]].map(([k,l,d])=>(
                <div key={k} onClick={()=>setSendOpt(k)}
                  style={{ flex:1, padding:"12px 14px", borderRadius:10, cursor:"pointer",
                    border:`1.5px solid ${sendOpt===k?C.primary:C.border}`, background:sendOpt===k?C.primarySoft:"#fff" }}>
                  <div style={{ fontSize:13, fontWeight:700, color:sendOpt===k?C.primaryDark:C.text }}>{l}</div>
                  <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{d}</div>
                  {k==="scheduled" && sendOpt==="scheduled" && (
                    <div style={{ display:"flex", gap:8, marginTop:8 }} onClick={e=>e.stopPropagation()}>
                      <input type="date" value={schedDate} onChange={e=>setSchedDate(e.target.value)} style={{ ...inputStyle, padding:"6px 9px", fontSize:12 }}/>
                      <input type="time" value={schedTime} onChange={e=>setSchedTime(e.target.value)} style={{ ...inputStyle, padding:"6px 9px", fontSize:12 }}/>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display:"flex", gap:10, paddingTop:14, borderTop:`1px solid ${C.border}` }}>
            <button onClick={saveDraft} style={btn()}>💾 Save Draft</button>
            <button onClick={sendTest} style={{ ...btn(), color:testSent?C.green:C.slate, borderColor:testSent?C.green:C.border }}>
              {testSent?"✅ Test sent":"📧 Send Test Email"}
            </button>
            <div style={{ flex:1 }}/>
            <button onClick={send} style={{ ...btn(true), background:sendOpt==="now"?C.green:C.primary }}>
              {sendOpt==="now" ? `🚀 Send to ${(group?.members||0).toLocaleString()} recipients` : "⏰ Schedule Newsletter"}
            </button>
          </div>
        </div>

        {/* Preview */}
        <div style={{ background:"#fff", border:`1px solid ${C.border}`, borderRadius:14, overflow:"hidden", position:"sticky", top:72 }}>
          <div style={{ padding:"9px 14px", fontSize:11, fontWeight:700, color:C.muted, background:C.light, borderBottom:`1px solid ${C.border}` }}>
            📧 Preview
          </div>
          <div style={{ padding:14 }}>
            <div style={{ fontSize:11, color:C.muted }}>From: vion Newsletter &lt;newsletter@vion.de&gt;</div>
            <div style={{ fontSize:11, color:C.muted }}>To: {group?.name||"—"}</div>
            <div style={{ fontSize:13, fontWeight:700, color:C.navy, margin:"8px 0 10px" }}>{subject||"(no subject)"}</div>
            <div style={{ fontSize:11, color:C.text, whiteSpace:"pre-wrap", lineHeight:1.6, maxHeight:360, overflowY:"auto",
              padding:"10px 12px", background:C.light, borderRadius:8, border:`1px solid ${C.border}` }}>
              {(body||"Your message appears here…").replace(/\{FirstName\}/g,"Max").replace(/\{LastName\}/g,"Mustermann").replace(/\{Unsubscribe\}/g,"Unsubscribe")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // LIST VIEW (Newsletters / Groups / Templates tabs)
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div style={{ padding:"24px 28px 48px", maxWidth:1060, margin:"0 auto" }}>
      {toast && <Toast msg={toast}/>}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
        <h1 style={{ margin:0, fontSize:22, fontWeight:700, color:C.navy, letterSpacing:"-0.02em" }}>Newsletter</h1>
        <button onClick={()=>openEditor()} style={btn(true)}>+ New Newsletter</button>
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
                  📰 No newsletters yet — create your first one.
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

      {/* ── Templates ── */}
      {tab==="templates" && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(310px, 1fr))", gap:14 }}>
          {NL_TEMPLATES.map(t=>(
            <div key={t.id} style={{ background:"#fff", border:`1px solid ${C.border}`, borderRadius:14, padding:16, display:"flex", flexDirection:"column", gap:10 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:38, height:38, borderRadius:10, background:C.primarySoft, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>{t.icon}</div>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:C.text }}>{t.name}</div>
                  <div style={{ fontSize:11, color:C.muted }}>{t.desc}</div>
                </div>
              </div>
              <div style={{ fontSize:11, color:C.slate, whiteSpace:"pre-wrap", lineHeight:1.55, maxHeight:110, overflow:"hidden",
                padding:"9px 11px", background:C.light, borderRadius:8, border:`1px solid ${C.border}`,
                maskImage:"linear-gradient(to bottom, black 60%, transparent)" }}>
                {t.body}
              </div>
              <button onClick={()=>openEditor(null, t)} style={{ ...btn(true), alignSelf:"flex-start", padding:"7px 14px", fontSize:12 }}>
                Use Template →
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const Toast = ({ msg }) => (
  <div style={{ position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)", zIndex:400,
    background:C.navy, color:"#fff", padding:"11px 20px", borderRadius:10, fontSize:13, fontWeight:600,
    boxShadow:"0 8px 28px rgba(0,0,0,0.25)", whiteSpace:"nowrap" }}>
    {msg}
  </div>
);
