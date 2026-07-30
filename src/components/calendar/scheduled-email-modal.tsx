import React, { useState } from "react";
import { ATTACHMENTS_STORE, EMAIL_TEMPLATES_STORE } from "../../lib/core";
import { C } from "../../theme";

// Scheduled Email modal — view | edit (matches the "Scheduled Email" wireframes
// on the Calendar board). A scheduled email shows on the calendar like any other
// activity; clicking it opens the read-only view, and the edit pencil switches to
// the composer (Template · To · Cc · Attachment · Subject · Body · Schedule).

const lbl   = { fontSize:11, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.05em", display:"block", marginBottom:5 };
const input = { width:"100%", padding:"9px 12px", borderRadius:8, border:`1.5px solid ${C.border}`, fontSize:13, fontFamily:"inherit", boxSizing:"border-box", outline:"none", background:"#fff", color:C.text } as const;

const toArr = (v) => Array.isArray(v) ? v.filter(Boolean)
  : (typeof v === "string" && v ? v.split(",").map(s=>s.trim()).filter(Boolean) : []);

const blank = (selectedDate) => ({
  template:"", to:[], cc:[], attachments:[], subject:"", body:"",
  schedule:true, date:selectedDate||"", time:"09:00",
});

export const ScheduledEmailModal = ({ mode="view", email=null, selectedDate, onClose, onSubmit, onCancelEmail }) => {
  const [m, setM] = useState(mode);
  const [f, setF] = useState(() => {
    const init = email ? { ...blank(selectedDate), ...email } : blank(selectedDate);
    init.to  = toArr(init.to);
    init.cc  = toArr(init.cc);
    init.attachments = toArr(init.attachments).length ? toArr(init.attachments) : toArr(init.attachment);
    if (!init.time) init.time = "09:00";
    if (init.schedule === undefined) init.schedule = true;
    return init;
  });
  const set = (k,v) => setF(prev => ({ ...prev, [k]:v }));
  const isView = m === "view";

  const templates = EMAIL_TEMPLATES_STORE.filter(t => t.published !== false);
  const templateLabel = (id) => { const t = templates.find(x=>x.id===id); return t ? t.name : (id || "—"); };

  const canSave = f.to.length>0 && f.subject.trim() && f.body.trim() && (!f.schedule || (f.date && f.time));

  const toolBtns = ["B","I","U","•","1.","🔗","🖉"];

  // Recipient initials for the view avatar.
  const first = (f.to[0]||"").split("@")[0].replace(/\./g," ");
  const initials = first.split(/\s+/).filter(Boolean).slice(0,2).map(s=>s[0]?.toUpperCase()||"").join("") || "✉";
  const when = `${f.date||""}${f.time?` | ${f.time}`:""}`;

  const field = (label, node) => (<div style={{ marginBottom:12 }}><label style={lbl}>{label}</label>{node}</div>);
  const rowR = (label, value) => value ? (
    <div style={{ display:"flex", justifyContent:"space-between", padding:"9px 0", borderBottom:`1px solid ${C.border}`, fontSize:12, gap:12 }}>
      <span style={{ color:C.muted }}>{label}</span>
      <span style={{ color:C.text, fontWeight:600, textAlign:"right", maxWidth:300, wordBreak:"break-word" }}>{value}</span>
    </div>
  ) : null;

  // Chip multiselect for To / Cc (contacts + free emails) and Attachments.
  const ChipSelect = ({ values, onWrite, options, placeholder }) => {
    const [q, setQ] = useState("");
    const [open, setOpen] = useState(false);
    const add = (v) => { if (v && !values.includes(v)) onWrite([...values, v]); setQ(""); };
    const remove = (v) => onWrite(values.filter(x=>x!==v));
    const isEmail = (s) => /^[^\s,]+@[^\s,]+\.[^\s,]+$/.test(String(s||"").trim());
    return (
      <div style={{ position:"relative" }}>
        <div onClick={()=>setOpen(o=>!o)} style={{ ...input, minHeight:38, display:"flex", alignItems:"center", flexWrap:"wrap", gap:6, cursor:"pointer" }}>
          {values.length===0 && <span style={{ color:C.muted }}>{placeholder}</span>}
          {values.map(v=>(
            <span key={v} style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"3px 8px", borderRadius:20, background:"#F1F5F9", border:`1px solid ${C.border}`, fontSize:11.5, fontWeight:600, color:C.text }}>
              {v}<span onClick={e=>{ e.stopPropagation(); remove(v); }} style={{ color:C.muted, cursor:"pointer" }}>×</span>
            </span>
          ))}
        </div>
        {open && (<>
          <div onClick={()=>setOpen(false)} style={{ position:"fixed", inset:0, zIndex:710 }}/>
          <div style={{ position:"absolute", top:"calc(100% + 4px)", left:0, right:0, zIndex:720, background:"#fff", border:`1.5px solid ${C.border}`, borderRadius:10, boxShadow:"0 12px 32px rgba(0,0,0,0.15)", overflow:"hidden" }}>
            <div style={{ padding:8, borderBottom:`1px solid ${C.border}` }}>
              <input autoFocus value={q} onChange={e=>setQ(e.target.value)}
                onKeyDown={e=>{ if(e.key==="Enter" && isEmail(q)){ e.preventDefault(); add(q.trim()); } }}
                placeholder="Search or type an email…" style={{ ...input, border:"none", padding:"4px 6px" }}/>
            </div>
            <div style={{ maxHeight:180, overflowY:"auto" }}>
              {isEmail(q) && !values.includes(q.trim()) && (
                <div onClick={()=>add(q.trim())} style={{ padding:"9px 12px", fontSize:12.5, color:C.primaryDark, fontWeight:600, cursor:"pointer" }}>＋ Add “{q.trim()}”</div>
              )}
              {options.filter(o=>!values.includes(o) && (!q || o.toLowerCase().includes(q.toLowerCase()))).map(o=>(
                <div key={o} onClick={()=>add(o)} style={{ padding:"8px 12px", fontSize:12.5, cursor:"pointer", color:C.text }}
                  onMouseEnter={e=>e.currentTarget.style.background="#F8FAFC"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>{o}</div>
              ))}
            </div>
          </div>
        </>)}
      </div>
    );
  };

  return (
    <>
      <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.35)", zIndex:600 }}/>
      <div style={{ position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%)",
        width:600, maxHeight:"92vh", overflowY:"auto", background:"#fff", borderRadius:16, zIndex:700,
        boxShadow:"0 24px 64px rgba(0,0,0,0.2)", fontFamily:"inherit", padding:"22px 24px" }}>

        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
          <div style={{ fontSize:15, fontWeight:800, color:C.navy, display:"flex", alignItems:"center", gap:8 }}>
            <span>✉️</span>Scheduled Email
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            {isView && (
              <button onClick={()=>setM("edit")} title="Edit"
                style={{ width:28, height:28, borderRadius:7, border:`1px solid ${C.border}`, background:"#fff", color:C.slate, cursor:"pointer", fontSize:13 }}>✏️</button>
            )}
            <button onClick={onClose} style={{ width:28, height:28, borderRadius:"50%", border:`1px solid ${C.border}`, background:"#F8FAFC", color:C.muted, fontSize:15, cursor:"pointer" }}>×</button>
          </div>
        </div>

        {isView ? (
          /* ── VIEW ─────────────────────────────────────────────── */
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, color:C.text, marginBottom:12 }}>
              <span>🕐</span>{when}
            </div>
            {f.to[0] && (
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
                <span style={{ width:32, height:32, borderRadius:"50%", background:C.primary+"18", color:C.primaryDark, display:"grid", placeItems:"center", fontSize:11, fontWeight:700 }}>{initials}</span>
                <span style={{ fontSize:13, color:C.text }}>{f.to.join(", ")}</span>
              </div>
            )}
            {rowR("Template", templateLabel(f.template))}
            {rowR("From", f.from)}
            {rowR("To", f.to.join(", "))}
            {rowR("Cc", f.cc.join(", "))}
            {rowR("Subject", f.subject)}
            {f.body && (
              <div style={{ margin:"12px 0" }}>
                <label style={lbl}>Body</label>
                <div style={{ fontSize:12, color:C.slate, lineHeight:1.5, whiteSpace:"pre-wrap" }}>{f.body}</div>
              </div>
            )}
            {rowR("Attachment", f.attachments.map(a=>`📎 ${a}`).join(", "))}
            <div style={{ display:"flex", alignItems:"center", marginTop:20, gap:10 }}>
              <button onClick={()=>onCancelEmail&&onCancelEmail(f)}
                style={{ background:"none", border:"none", color:C.red, fontSize:12, fontWeight:700, cursor:"pointer", padding:0 }}>Cancel Scheduled Email</button>
              <button onClick={onClose}
                style={{ marginLeft:"auto", padding:"9px 22px", borderRadius:9, border:"none", background:C.primary, color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer" }}>Close</button>
            </div>
          </div>
        ) : (
          /* ── EDIT ─────────────────────────────────────────────── */
          <div>
            {field("Template *", (
              <select value={f.template} onChange={e=>set("template",e.target.value)} style={input}>
                <option value="">Select Template</option>
                {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            ))}
            {field("To *", <ChipSelect values={f.to} onWrite={v=>set("to",v)} options={[]} placeholder="Select recipients"/>)}
            {field("Cc", <ChipSelect values={f.cc} onWrite={v=>set("cc",v)} options={[]} placeholder="Select Cc"/>)}
            {field("Attachment", <ChipSelect values={f.attachments} onWrite={v=>set("attachments",v)} options={ATTACHMENTS_STORE.map(a=>a.name)} placeholder="Select attachments"/>)}
            {field("Subject *", <input value={f.subject} onChange={e=>set("subject",e.target.value)} placeholder="Enter subject line" style={input}/>)}
            <div style={{ marginBottom:12 }}>
              <label style={lbl}>Body *</label>
              <div style={{ border:`1.5px solid ${C.primary}`, borderRadius:10, overflow:"hidden" }}>
                <div style={{ display:"flex", gap:4, padding:"8px 10px", borderBottom:`1px solid ${C.border}`, color:C.slate, flexWrap:"wrap" }}>
                  {toolBtns.map((b,i)=><span key={i} style={{ width:26, height:26, display:"grid", placeItems:"center", borderRadius:6, fontSize:13, cursor:"pointer" }}>{b}</span>)}
                </div>
                <textarea value={f.body} onChange={e=>set("body",e.target.value)} placeholder="Enter email body"
                  style={{ width:"100%", border:"none", outline:"none", padding:"12px 14px", fontSize:13, fontFamily:"inherit", minHeight:120, resize:"vertical", boxSizing:"border-box", lineHeight:1.5 }}/>
              </div>
            </div>
            <label style={{ display:"flex", alignItems:"center", gap:9, marginBottom:12, cursor:"pointer", fontSize:13, fontWeight:600, color:C.navy }}>
              <input type="checkbox" checked={f.schedule} onChange={e=>set("schedule",e.target.checked)} style={{ width:16, height:16, accentColor:C.primary }}/> Schedule
            </label>
            {f.schedule && (
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:6 }}>
                <div><label style={lbl}>Date *</label><input type="date" value={f.date} onChange={e=>set("date",e.target.value)} style={input}/></div>
                <div><label style={lbl}>Time *</label><input type="time" value={f.time} onChange={e=>set("time",e.target.value)} style={input}/></div>
              </div>
            )}
            <div style={{ display:"flex", gap:10, marginTop:12 }}>
              <button onClick={onClose} style={{ flex:1, padding:"10px", borderRadius:9, border:`1px solid ${C.border}`, background:"#fff", color:C.slate, fontSize:13, fontWeight:600, cursor:"pointer" }}>Cancel</button>
              <button onClick={()=>canSave && onSubmit && onSubmit({
                  ...f, to:f.to.join(", "), cc:f.cc.join(", "), attachment:f.attachments.join(", "),
                }, m)} disabled={!canSave}
                style={{ flex:2, padding:"10px", borderRadius:9, border:"none", background:canSave?C.primary:"#E2E8F0", color:canSave?"#fff":C.muted, fontSize:13, fontWeight:700, cursor:canSave?"pointer":"default" }}>Update</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
