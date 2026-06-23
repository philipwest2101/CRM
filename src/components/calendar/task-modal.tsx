import React, { useState } from "react";
import { ALL_LEADS, EMAIL_TEMPLATES_STORE } from "../../lib/core";
import { C } from "../../theme";

// Task modal — supports three states: create | edit | view
// (matches the "Create Task", "Edit Call Task", "Call Task" wireframes)

const lbl   = { fontSize:11, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.05em", display:"block", marginBottom:5 };
const input = { width:"100%", padding:"9px 12px", borderRadius:8, border:`1.5px solid ${C.border}`, fontSize:13, fontFamily:"inherit", boxSizing:"border-box", outline:"none", background:"#fff", color:C.text };

const TYPE_META = {
  call:  { icon:"📞", label:"Call"  },
  email: { icon:"✉️", label:"Email" },
  note:  { icon:"📝", label:"Note"  },
};
const PRIORITIES = [["low","Low",C.slate],["medium","Medium",C.amber],["high","High",C.red]];
const REMINDER_OPTS = [["15","15 Minutes Before"],["30","30 Minutes Before"],["60","1 Hour Before"]];

const blank = (selectedDate) => ({
  type:"call", title:"", contact:"", priority:"medium",
  date:selectedDate||"", time:"", reminderOn:true, reminder:"30",
  emailTemplate:"", recur:"Once", note:"",
});

export const TaskModal = ({ mode="create", task=null, selectedDate, onClose, onSubmit, onDone, onLogCall, onMakeCall }) => {
  const [m, setM]   = useState(mode);                       // active mode (view can switch to edit)
  const [f, setF]   = useState(task ? { ...blank(selectedDate), ...task } : blank(selectedDate));
  const set = (k,v) => setF(prev => ({ ...prev, [k]:v }));
  const isView = m === "view";
  const canSave = f.title.trim() && f.date;
  const tm = TYPE_META[f.type] || TYPE_META.note;

  const titleText = m==="create" ? "Create Task"
    : m==="edit" ? `Edit ${tm.label} Task — ${f.title||"Untitled"}`
    : `${tm.label} Task — ${f.title||"Untitled"}`;

  const field = (label, node) => (
    <div style={{ marginBottom:12 }}>
      <label style={lbl}>{label}</label>
      {node}
    </div>
  );

  const row = (label, value) => value ? (
    <div style={{ display:"flex", justifyContent:"space-between", padding:"9px 0", borderBottom:`1px solid ${C.border}`, fontSize:12, gap:12 }}>
      <span style={{ color:C.muted }}>{label}</span>
      <span style={{ color:C.text, fontWeight:600, textAlign:"right" }}>{value}</span>
    </div>
  ) : null;

  return (
    <>
      <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.35)", zIndex:600 }}/>
      <div style={{ position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%)",
        width:480, maxHeight:"92vh", overflowY:"auto", background:"#fff", borderRadius:16, zIndex:700,
        boxShadow:"0 24px 64px rgba(0,0,0,0.2)", fontFamily:"inherit", padding:"22px 24px" }}>

        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
          <div style={{ fontSize:15, fontWeight:800, color:C.navy, display:"flex", alignItems:"center", gap:8 }}>
            <span>{tm.icon}</span>{titleText}
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
            {row("📅 Date & Time", `${f.date}${f.time?` · ${f.time}`:""}`)}
            {row("👤 Contact", f.contact)}
            {row("⚡ Priority", (PRIORITIES.find(p=>p[0]===f.priority)||[])[1])}
            {f.reminderOn && row("⏰ Reminder", (REMINDER_OPTS.find(r=>r[0]===String(f.reminder))||[])[1])}
            {row("🔁 Recurring", f.recur && f.recur!=="Once" ? f.recur : null)}
            {f.note && (
              <div style={{ marginTop:12 }}>
                <label style={lbl}>Description</label>
                <div style={{ fontSize:12, color:C.slate, lineHeight:1.5 }}>{f.note}</div>
              </div>
            )}
            <div style={{ display:"flex", alignItems:"center", marginTop:20, gap:10 }}>
              {f.type==="call" && (
                <>
                  <button onClick={()=>onLogCall&&onLogCall(f)} style={{ background:"none", border:"none", color:C.indigo, fontSize:12, fontWeight:700, cursor:"pointer", padding:0 }}>Log a Call</button>
                  <button onClick={()=>onMakeCall&&onMakeCall(f)} style={{ background:"none", border:"none", color:C.indigo, fontSize:12, fontWeight:700, cursor:"pointer", padding:0 }}>Make a Call</button>
                </>
              )}
              <button onClick={()=>onDone&&onDone(f)} title="Done = remove from the calendar (task is done)"
                style={{ marginLeft:"auto", padding:"9px 22px", borderRadius:9, border:"none", background:C.green, color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer" }}>✓ Done</button>
            </div>
          </div>
        ) : (
          /* ── CREATE / EDIT ───────────────────────────────────── */
          <div>
            {field("Title *", <input value={f.title} onChange={e=>set("title",e.target.value)} placeholder="e.g. Follow-up call — Sandra Richter" style={input}/>)}

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 }}>
              <div>
                <label style={lbl}>Contact *</label>
                <select value={f.contact} onChange={e=>set("contact",e.target.value)} style={input}>
                  <option value="">Choose…</option>
                  {ALL_LEADS.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Type *</label>
                <div style={{ display:"flex", gap:4 }}>
                  {Object.entries(TYPE_META).map(([k,v]) => (
                    <button key={k} onClick={()=>set("type",k)}
                      style={{ flex:1, padding:"8px 4px", borderRadius:7, border:`1.5px solid ${f.type===k?C.primary:C.border}`,
                        background:f.type===k?C.primary+"12":"#fff", color:f.type===k?C.primaryDark:C.muted,
                        fontSize:11, fontWeight:f.type===k?700:400, cursor:"pointer", fontFamily:"inherit" }}>{v.icon} {v.label}</button>
                  ))}
                </div>
              </div>
            </div>

            {field("Priority", (
              <div style={{ display:"flex", gap:6 }}>
                {PRIORITIES.map(([k,l,col]) => (
                  <button key={k} onClick={()=>set("priority",k)}
                    style={{ flex:1, padding:"8px 4px", borderRadius:7, border:`1.5px solid ${f.priority===k?col:C.border}`,
                      background:f.priority===k?col+"12":"#fff", color:f.priority===k?col:C.muted,
                      fontSize:12, fontWeight:f.priority===k?700:400, cursor:"pointer", fontFamily:"inherit" }}>{l}</button>
                ))}
              </div>
            ))}

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 }}>
              <div><label style={lbl}>Date *</label><input type="date" value={f.date} onChange={e=>set("date",e.target.value)} style={input}/></div>
              <div><label style={lbl}>Time</label><input type="time" value={f.time} onChange={e=>set("time",e.target.value)} style={input}/></div>
            </div>

            {/* Reminder */}
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
              <label style={{ display:"flex", alignItems:"center", gap:7, fontSize:12, color:C.slate, cursor:"pointer", whiteSpace:"nowrap" }}>
                <input type="checkbox" checked={f.reminderOn} onChange={e=>set("reminderOn",e.target.checked)} style={{ accentColor:C.primary, width:14, height:14 }}/>
                Reminder
              </label>
              <select value={f.reminder} disabled={!f.reminderOn} onChange={e=>set("reminder",e.target.value)} style={{ ...input, opacity:f.reminderOn?1:0.5 }}>
                {REMINDER_OPTS.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>

            {/* Edit-only extras: Email Template + Recurring */}
            {m==="edit" && (
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 }}>
                <div>
                  <label style={lbl}>Email Template</label>
                  <select value={f.emailTemplate} onChange={e=>set("emailTemplate",e.target.value)} style={input}>
                    <option value="">None</option>
                    {EMAIL_TEMPLATES_STORE.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Recurring</label>
                  <select value={f.recur} onChange={e=>set("recur",e.target.value)} style={input}>
                    {["Once","Daily","Weekly","Monthly","Yearly"].map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>
            )}

            {field("Description", <textarea value={f.note} onChange={e=>set("note",e.target.value)} placeholder="Any details for this task…"
              style={{ ...input, minHeight:70, resize:"none", lineHeight:1.5 }}/>)}

            <div style={{ display:"flex", gap:10, marginTop:6 }}>
              <button onClick={onClose} style={{ flex:1, padding:"10px", borderRadius:9, border:`1px solid ${C.border}`, background:"#fff", color:C.slate, fontSize:13, fontWeight:600, cursor:"pointer" }}>Cancel</button>
              <button onClick={()=>canSave && onSubmit && onSubmit({ ...f, kind:"task" }, m)} disabled={!canSave}
                style={{ flex:2, padding:"10px", borderRadius:9, border:"none", background:canSave?C.primary:"#E2E8F0", color:canSave?"#fff":C.muted, fontSize:13, fontWeight:700, cursor:canSave?"pointer":"default" }}>
                {m==="edit" ? "Update" : "Save"}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
