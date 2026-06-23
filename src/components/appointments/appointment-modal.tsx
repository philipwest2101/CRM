import React, { useState, useRef } from "react";
import { ALL_LEADS, DOCUMENT_TYPES_STORE } from "../../lib/core";
import { C } from "../../theme";

// Appointment modal — create | edit | view
// (matches "Schedule Appointment", "Edit Appointment", "Appointment" wireframes)

const lbl   = { fontSize:11, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.05em", display:"block", marginBottom:5 };
const input = { width:"100%", padding:"9px 12px", borderRadius:8, border:`1.5px solid ${C.border}`, fontSize:13, fontFamily:"inherit", boxSizing:"border-box", outline:"none", background:"#fff", color:C.text };

export const APPOINTMENT_TYPES = [
  "Consultation Appointment", "Recruiting", "Business Opening", "Investment Talk", "Finance Talk",
];
const REMINDER_OPTS = [["15","15 Minutes Before"],["30","30 Minutes Before"],["60","1 Hour Before"],["custom","Custom Date"]];
const MEETING_TYPES = ["In Person", "Video Conference", "Custom"];
const LOCATION_PLACEHOLDER = {
  "In Person":      "ARTIST Boutique Hotel — Vienna",
  "Video Conference":"Auto-generated link · or paste https://meet.…",
  "Custom":         "Enter meeting location or link",
};

// A lead "has email integrated with the CRM" → in this prototype we treat
// consenting leads with an email on file as integrated.
const leadByName  = (name) => ALL_LEADS.find(l => name && name.includes(l.name));
const isIntegrated = (entry) => {
  const l = leadByName(entry);
  if (l) return !!l.consent && !!l.email;       // known contact → integrated if consented
  return /\S+@\S+\.\S+/.test(entry);             // free email → assume integrated
};

const blank = (selectedDate) => ({
  title:"", contact:"", attendees:"", apptType:"Consultation Appointment",
  date:selectedDate||"", time:"09:00", end:"",
  meetingType:"In Person", location:"",
  attachment:"", attachmentMode:"none",
  autoCalendar:true, reminderOn:true, reminder:"30", reminderCustom:"", note:"",
});

export const AppointmentModal = ({ mode="create", appt=null, selectedDate, onClose, onSubmit, onCancelAppt, onSetOutcome }) => {
  const [m, setM] = useState(mode);
  const [f, setF] = useState(() => {
    const init = appt ? { ...blank(selectedDate), ...appt } : blank(selectedDate);
    if (!init.time) init.time = "09:00";                       // Time mandatory — default 9 AM
    // Merge legacy single Contact into the unified Attendees list
    const list = init.attendees ? init.attendees.split(",").map(s=>s.trim()).filter(Boolean) : [];
    if (init.contact && !list.some(x=>x.includes(init.contact))) list.unshift(init.contact);
    init.attendees = list.join(", ");
    // Derive meeting type from legacy location/link if not set
    if (!init.meetingType) init.meetingType = /^https?:|meet\.|zoom|teams/i.test(init.location||"") ? "Video Conference" : "In Person";
    if (init.attachment && init.attachmentMode === "none") init.attachmentMode = "system";
    return init;
  });
  const set = (k,v) => setF(prev => ({ ...prev, [k]:v }));
  const isView = m === "view";

  // ── Attendees (merged Contact + Attendees) ────────────────────────────────
  const attendeeArr = f.attendees ? f.attendees.split(",").map(s=>s.trim()).filter(Boolean) : [];
  const writeAttendees = (arr) => setF(prev => ({ ...prev, attendees:arr.join(", "), contact:arr[0]||"" }));
  const [attInput, setAttInput] = useState("");
  const addAttendee = (val) => {
    const v = (val||"").trim();
    if (!v || attendeeArr.includes(v)) { setAttInput(""); return; }
    writeAttendees([...attendeeArr, v]);
    setAttInput("");
  };
  const removeAttendee = (i) => writeAttendees(attendeeArr.filter((_,idx)=>idx!==i));

  // ── Attachment (system doc OR upload from computer) ───────────────────────
  const fileRef = useRef(null);
  const attachSelectValue = f.attachmentMode==="upload" ? "__upload__"
    : f.attachmentMode==="system" && f.attachment ? `sys:${f.attachment}` : "";
  const onAttachSelect = (val) => {
    if (val==="") setF(prev=>({ ...prev, attachmentMode:"none", attachment:"" }));
    else if (val==="__upload__") { setF(prev=>({ ...prev, attachmentMode:"upload", attachment:"" })); setTimeout(()=>fileRef.current&&fileRef.current.click(),0); }
    else setF(prev=>({ ...prev, attachmentMode:"system", attachment:val.replace(/^sys:/,"") }));
  };

  const canSave = f.title.trim() && f.date && f.time;          // Time now required

  const titleText = m==="create" ? "Schedule Appointment"
    : m==="edit" ? `Edit Appointment — ${f.title||"Untitled"}`
    : `Appointment — ${f.title||"Untitled"}`;

  const field = (label, node) => (
    <div style={{ marginBottom:12 }}><label style={lbl}>{label}</label>{node}</div>
  );
  const rowR = (label, value) => value ? (
    <div style={{ display:"flex", justifyContent:"space-between", padding:"9px 0", borderBottom:`1px solid ${C.border}`, fontSize:12, gap:12 }}>
      <span style={{ color:C.muted }}>{label}</span>
      <span style={{ color:C.text, fontWeight:600, textAlign:"right" }}>{value}</span>
    </div>
  ) : null;

  // Who would actually receive the auto calendar invite
  const invitable = attendeeArr.filter(isIntegrated);
  const isVideo   = f.meetingType === "Video Conference";

  return (
    <>
      <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.35)", zIndex:600 }}/>
      <div style={{ position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%)",
        width:500, maxHeight:"92vh", overflowY:"auto", background:"#fff", borderRadius:16, zIndex:700,
        boxShadow:"0 24px 64px rgba(0,0,0,0.2)", fontFamily:"inherit", padding:"22px 24px" }}>

        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
          <div style={{ fontSize:15, fontWeight:800, color:C.navy, display:"flex", alignItems:"center", gap:8 }}>
            <span>📅</span>{titleText}
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
            {rowR("📅 Date & Time", `${f.date}${f.time?` · ${f.time}`:""}${f.end?` – ${f.end}`:""}`)}
            {rowR("🏷 Type", f.apptType)}
            {rowR("👥 Attendees", f.attendees)}
            {rowR("🎦 Meeting Type", f.meetingType)}
            {rowR("📍 Meeting Location", f.location)}
            {rowR("📎 Attachment", f.attachment)}
            {f.autoCalendar && rowR("📆 Calendar", "Auto-added to organiser & attendee calendars")}
            {f.reminderOn && rowR("⏰ Reminder", f.reminder==="custom"
              ? (f.reminderCustom ? `Custom · ${f.reminderCustom.replace("T"," ")}` : "Custom Date")
              : (REMINDER_OPTS.find(r=>r[0]===String(f.reminder))||[])[1])}
            {f.note && (
              <div style={{ marginTop:12 }}>
                <label style={lbl}>Description</label>
                <div style={{ fontSize:12, color:C.slate, lineHeight:1.5 }}>{f.note}</div>
              </div>
            )}
            <div style={{ display:"flex", alignItems:"center", marginTop:20, gap:10 }}>
              <button onClick={()=>onCancelAppt&&onCancelAppt(f)} style={{ background:"none", border:"none", color:C.red, fontSize:12, fontWeight:700, cursor:"pointer", padding:0 }}>Cancel Appointment</button>
              <button onClick={()=>onSetOutcome&&onSetOutcome(f)}
                style={{ marginLeft:"auto", padding:"9px 22px", borderRadius:9, border:"none", background:C.primary, color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer" }}>Set Outcome</button>
            </div>
          </div>
        ) : (
          /* ── CREATE / EDIT ───────────────────────────────────── */
          <div>
            {field("Title *", <input value={f.title} onChange={e=>set("title",e.target.value)} placeholder="e.g. Consultation — Sandra Richter" style={input}/>)}

            {/* Merged Contacts & Attendees */}
            <div style={{ marginBottom:12 }}>
              <label style={lbl}>Contacts &amp; Attendees *</label>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6, padding:attendeeArr.length?"6px 6px 2px":"0", marginBottom:attendeeArr.length?6:0 }}>
                {attendeeArr.map((a,i)=>(
                  <span key={i} style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"4px 8px", borderRadius:20,
                    background:isIntegrated(a)?C.primary+"14":"#F1F5F9", border:`1px solid ${isIntegrated(a)?C.primary+"55":C.border}`,
                    fontSize:12, color:C.text, fontWeight:600 }}>
                    {isIntegrated(a) && <span title="Email integrated with CRM" style={{ fontSize:10 }}>📧</span>}
                    {a}
                    <button onClick={()=>removeAttendee(i)} style={{ border:"none", background:"none", color:C.muted, cursor:"pointer", fontSize:13, lineHeight:1, padding:0 }}>×</button>
                  </span>
                ))}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                <select value="" onChange={e=>{ if(e.target.value) addAttendee(e.target.value); }} style={input}>
                  <option value="">+ Add contact…</option>
                  {ALL_LEADS.filter(l=>!attendeeArr.some(a=>a.includes(l.name))).map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
                </select>
                <input value={attInput} onChange={e=>setAttInput(e.target.value)}
                  onKeyDown={e=>{ if(e.key==="Enter"){ e.preventDefault(); addAttendee(attInput); } }}
                  onBlur={()=>addAttendee(attInput)}
                  placeholder="+ Add email & press Enter" style={input}/>
              </div>
            </div>

            <div style={{ marginBottom:12 }}>
              <label style={lbl}>Type *</label>
              <select value={f.apptType} onChange={e=>set("apptType",e.target.value)} style={input}>
                {APPOINTMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:12 }}>
              <div><label style={lbl}>Date *</label><input type="date" value={f.date} onChange={e=>set("date",e.target.value)} style={input}/></div>
              <div><label style={lbl}>Start *</label><input type="time" value={f.time} onChange={e=>set("time",e.target.value)} style={input}/></div>
              <div><label style={lbl}>End</label><input type="time" value={f.end} onChange={e=>set("end",e.target.value)} style={input}/></div>
            </div>

            {/* Meeting Type + Meeting Location (replaces "Location / Link") */}
            <div style={{ marginBottom:12 }}>
              <label style={lbl}>Meeting Type *</label>
              <select value={f.meetingType} onChange={e=>set("meetingType",e.target.value)} style={input}>
                {MEETING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            {field("Meeting Location *", <input value={f.location} onChange={e=>set("location",e.target.value)}
              placeholder={LOCATION_PLACEHOLDER[f.meetingType]} style={input}/>)}

            {/* Attachment — DDL: system document OR upload from computer */}
            <div style={{ marginBottom:12 }}>
              <label style={lbl}>Attachment</label>
              <select value={attachSelectValue} onChange={e=>onAttachSelect(e.target.value)} style={input}>
                <option value="">No attachment</option>
                <optgroup label="System attachments">
                  {DOCUMENT_TYPES_STORE.map(d => <option key={d.id} value={`sys:${d.label}`}>{d.icon} {d.label}</option>)}
                </optgroup>
                <option value="__upload__">⬆ Upload from computer…</option>
              </select>
              <input ref={fileRef} type="file" style={{ display:"none" }}
                onChange={e=>{ const file=e.target.files&&e.target.files[0]; if(file) setF(prev=>({ ...prev, attachmentMode:"upload", attachment:file.name })); }}/>
              {f.attachmentMode==="upload" && (
                <div style={{ marginTop:6, fontSize:12, color:f.attachment?C.text:C.muted, display:"flex", alignItems:"center", gap:8 }}>
                  <span>📎 {f.attachment || "No file chosen"}</span>
                  <button onClick={()=>fileRef.current&&fileRef.current.click()}
                    style={{ border:`1px solid ${C.border}`, background:"#fff", color:C.slate, borderRadius:7, padding:"3px 10px", fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
                    {f.attachment?"Replace file":"Choose file"}
                  </button>
                </div>
              )}
            </div>

            {/* Auto-add to calendars — redesigned, clearer replacement for "Remember me" */}
            <div style={{ marginBottom:12, padding:"12px 14px", borderRadius:10,
              background:f.autoCalendar?C.primary+"0A":"#F8FAFC", border:`1px solid ${f.autoCalendar?C.primary+"40":C.border}` }}>
              <div style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
                <div onClick={()=>set("autoCalendar",!f.autoCalendar)}
                  style={{ width:36, height:20, borderRadius:10, background:f.autoCalendar?C.primary:"#CBD5E1", cursor:"pointer", position:"relative", flexShrink:0, marginTop:1, transition:"background 0.2s" }}>
                  <div style={{ position:"absolute", top:2, left:f.autoCalendar?18:2, width:16, height:16, borderRadius:"50%", background:"#fff", transition:"left 0.2s", boxShadow:"0 1px 3px rgba(0,0,0,0.2)" }}/>
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12.5, fontWeight:700, color:C.navy }}>📆 Add to organiser &amp; contact calendars</div>
                  <div style={{ fontSize:11, color:C.slate, marginTop:3, lineHeight:1.45 }}>
                    Adds this appointment to your calendar and sends a calendar invite to every attendee whose email is integrated with the CRM.
                    {isVideo && f.autoCalendar && <span style={{ color:C.primaryDark, fontWeight:600 }}> A video-conference link is generated and shared automatically.</span>}
                  </div>
                  {f.autoCalendar && attendeeArr.length>0 && (
                    <div style={{ fontSize:11, color:invitable.length?C.green:C.amber, marginTop:5, fontWeight:600 }}>
                      {invitable.length
                        ? `✓ Invite will reach ${invitable.length} of ${attendeeArr.length} attendee${attendeeArr.length>1?"s":""} with integrated email`
                        : "⚠ No attendee has an integrated email yet — only your calendar will be updated"}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Reminder */}
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:f.reminderOn&&f.reminder==="custom"?8:12 }}>
              <label style={{ display:"flex", alignItems:"center", gap:7, fontSize:12, color:C.slate, cursor:"pointer", whiteSpace:"nowrap" }}>
                <input type="checkbox" checked={f.reminderOn} onChange={e=>set("reminderOn",e.target.checked)} style={{ accentColor:C.primary, width:14, height:14 }}/>
                Reminder
              </label>
              <select value={f.reminder} disabled={!f.reminderOn} onChange={e=>set("reminder",e.target.value)} style={{ ...input, opacity:f.reminderOn?1:0.5 }}>
                {REMINDER_OPTS.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            {f.reminderOn && f.reminder==="custom" && (
              <div style={{ marginBottom:12 }}>
                <label style={lbl}>Remind me on</label>
                <input type="datetime-local" value={f.reminderCustom} onChange={e=>set("reminderCustom",e.target.value)} style={input}/>
              </div>
            )}

            {field("Description", <textarea value={f.note} onChange={e=>set("note",e.target.value)} placeholder="Any details for this appointment…"
              style={{ ...input, minHeight:70, resize:"none", lineHeight:1.5 }}/>)}

            <div style={{ display:"flex", gap:10, marginTop:6 }}>
              <button onClick={onClose} style={{ flex:1, padding:"10px", borderRadius:9, border:`1px solid ${C.border}`, background:"#fff", color:C.slate, fontSize:13, fontWeight:600, cursor:"pointer" }}>Cancel</button>
              <button onClick={()=>canSave && onSubmit && onSubmit({ ...f, kind:"appointment" }, m)} disabled={!canSave}
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
