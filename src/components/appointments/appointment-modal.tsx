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
const REMINDER_OPTS = [["15","15 Minutes Before"],["30","30 Minutes Before"],["60","1 Hour Before"],["1440","1 Day Before"],["custom","Custom Date"]];
const reminderLabel = (r) => r.val==="custom"
  ? (r.custom ? `Custom · ${r.custom.replace("T"," ")}` : "Custom Date")
  : (REMINDER_OPTS.find(o=>o[0]===String(r.val))||[])[1];
const MEETING_TYPES = ["In Person", "Video Conference", "Custom"];
const LOCATION_PLACEHOLDER = {
  "In Person":      "ARTIST Boutique Hotel — Vienna",
  "Video Conference":"Auto-generated link · or paste https://meet.…",
  "Custom":         "Enter meeting location or link",
};

// ── Email helpers ───────────────────────────────────────────────────────────
// Attendees are stored as email addresses. A lead "has email integrated with
// the CRM" → in this prototype we treat consenting leads as integrated, and any
// valid external email is assumed reachable too.
const isEmail      = (s) => /^[^\s,()]+@[^\s,()]+\.[^\s,()]+$/.test(String(s||"").trim());
const extractEmail = (s) => { const mt = String(s||"").match(/[^\s,()]+@[^\s,()]+\.[^\s,()]+/); return mt ? mt[0] : null; };
const leadByEmail = (email) => ALL_LEADS.find(l => l.email.toLowerCase() === String(email).toLowerCase());
const leadByName  = (name)  => ALL_LEADS.find(l => name && name.includes(l.name));
const displayName = (email) => (leadByEmail(email)||{}).name || "";
const asEmail     = (entry) => extractEmail(entry) || ((leadByName(entry)||{}).email || entry);
const isIntegrated = (email) => { const l = leadByEmail(email); return l ? !!l.consent : isEmail(email); };
const toArr = (v) => Array.isArray(v) ? v.filter(Boolean)
  : (typeof v === "string" && v ? v.split(",").map(s=>s.trim()).filter(Boolean) : []);

const blank = (selectedDate) => ({
  title:"", contact:"", attendees:[], apptType:"Consultation Appointment",
  date:selectedDate||"", time:"09:00", end:"",
  meetingType:"In Person", location:"",
  attachments:[],
  autoCalendar:true, notify:[],
  reminderOn:true, reminders:[{ val:"30", custom:"" }],
  note:"",
});

export const AppointmentModal = ({ mode="create", appt=null, selectedDate, onClose, onSubmit, onCancelAppt, onSetOutcome }) => {
  const [m, setM] = useState(mode);
  const [f, setF] = useState(() => {
    const init = appt ? { ...blank(selectedDate), ...appt } : blank(selectedDate);
    if (!init.time) init.time = "09:00";                       // Time mandatory — default 9 AM
    // Unified attendees → array of emails (migrate legacy single Contact + string list)
    const emails = toArr(init.attendees).map(asEmail);
    if (init.contact) { const e = asEmail(init.contact); if (e && !emails.includes(e)) emails.unshift(e); }
    init.attendees = emails;
    init.contact = emails[0] || "";
    // Attachments → array (migrate legacy single attachment string)
    init.attachments = toArr(init.attachments).length ? toArr(init.attachments) : toArr(init.attachment);
    // Reminders → array (migrate legacy single reminder)
    init.reminders = Array.isArray(init.reminders) && init.reminders.length
      ? init.reminders
      : [{ val:init.reminder||"30", custom:init.reminderCustom||"" }];
    // Notify list defaults to every integrated attendee
    init.notify = Array.isArray(init.notify) ? init.notify.filter(e=>emails.includes(e)) : emails.filter(isIntegrated);
    if (!init.meetingType) init.meetingType = /^https?:|meet\.|zoom|teams/i.test(init.location||"") ? "Video Conference" : "In Person";
    return init;
  });
  const set = (k,v) => setF(prev => ({ ...prev, [k]:v }));
  const isView = m === "view";

  // ── Attendees: single searchable multiselect (contacts + free emails) ──────
  const attendeeArr = f.attendees;
  const writeAttendees = (arr) => setF(prev => {
    const keptNotify = prev.notify.filter(e => arr.includes(e));
    const newlyAdded = arr.filter(e => !prev.attendees.includes(e) && isIntegrated(e));
    return { ...prev, attendees:arr, contact:arr[0]||"", notify:[...keptNotify, ...newlyAdded] };
  });
  const toggleAttendee = (email) => writeAttendees(
    attendeeArr.includes(email) ? attendeeArr.filter(e=>e!==email) : [...attendeeArr, email]
  );
  const [attOpen, setAttOpen] = useState(false);
  const [attQuery, setAttQuery] = useState("");
  const q = attQuery.trim().toLowerCase();
  const leadOptions = ALL_LEADS.filter(l =>
    !q || l.email.toLowerCase().includes(q) || l.name.toLowerCase().includes(q));
  const extraSelected = attendeeArr.filter(e => !leadByEmail(e));   // typed emails not in leads
  const canAddTyped = isEmail(attQuery.trim()) && !attendeeArr.includes(attQuery.trim());

  const toggleNotify = (email) => setF(prev => ({
    ...prev,
    notify: prev.notify.includes(email) ? prev.notify.filter(e=>e!==email) : [...prev.notify, email],
  }));

  // ── Attachments: multiselect (system docs + uploads) ──────────────────────
  const fileRef = useRef(null);
  const addAttachment = (name) => setF(prev => prev.attachments.includes(name)
    ? prev : { ...prev, attachments:[...prev.attachments, name] });
  const removeAttachment = (name) => setF(prev => ({ ...prev, attachments:prev.attachments.filter(a=>a!==name) }));

  // ── Reminders: up to 3 ────────────────────────────────────────────────────
  const setReminder = (i,patch) => setF(prev => ({ ...prev, reminders:prev.reminders.map((r,idx)=>idx===i?{...r,...patch}:r) }));
  const addReminderRow = () => setF(prev => prev.reminders.length>=3 ? prev : { ...prev, reminders:[...prev.reminders,{ val:"60", custom:"" }] });
  const removeReminderRow = (i) => setF(prev => ({ ...prev, reminders:prev.reminders.filter((_,idx)=>idx!==i) }));

  const isVideo = f.meetingType === "Video Conference";
  const showCalToggle = isVideo;                              // calendar toggle only for Video Conference
  const calOn = showCalToggle && f.autoCalendar;
  const locationDisabled = calOn;                            // auto-generated link → lock the field

  const canSave = f.title.trim() && f.date && f.time;        // Time required

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

  const attLabelOf = (email) => { const n = displayName(email); return n ? `${email} (${n})` : email; };
  const invitable = attendeeArr.filter(isIntegrated);

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
            {rowR("👥 Attendees", attendeeArr.map(attLabelOf).join(", "))}
            {rowR("🎦 Meeting Type", f.meetingType)}
            {rowR("📍 Meeting Location", f.location)}
            {calOn && rowR("📆 Calendar", `Auto-added · invite to ${f.notify.length} attendee${f.notify.length!==1?"s":""}`)}
            {rowR("📎 Attachments", f.attachments.join(", "))}
            {f.reminderOn && f.reminders.length>0 && rowR("⏰ Reminders", f.reminders.map(reminderLabel).filter(Boolean).join(" · "))}
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

            {/* Attendees — one searchable multiselect (contacts + any email) */}
            <div style={{ marginBottom:12 }}>
              <label style={lbl}>Attendees *</label>
              <div style={{ position:"relative" }}>
                <div onClick={()=>setAttOpen(o=>!o)}
                  style={{ ...input, minHeight:38, display:"flex", alignItems:"center", flexWrap:"wrap", gap:6, cursor:"pointer", padding:attendeeArr.length?"6px 30px 6px 8px":"9px 30px 9px 12px" }}>
                  {attendeeArr.length===0 && <span style={{ color:C.muted }}>Select attendees</span>}
                  {attendeeArr.map((email,i)=>(
                    <span key={email} style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"3px 8px", borderRadius:20,
                      background:isIntegrated(email)?C.primary+"14":"#F1F5F9", border:`1px solid ${isIntegrated(email)?C.primary+"55":C.border}`, fontSize:11.5, fontWeight:600, color:C.text }}>
                      {isIntegrated(email) && <span title="Email integrated with CRM" style={{ fontSize:9 }}>📧</span>}
                      {displayName(email) || email}
                      {i===0 && <span style={{ fontSize:9, color:C.primaryDark, fontWeight:700 }}>· Primary</span>}
                      <span onClick={e=>{ e.stopPropagation(); toggleAttendee(email); }} style={{ color:C.muted, cursor:"pointer", fontSize:13, lineHeight:1 }}>×</span>
                    </span>
                  ))}
                  <span style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", color:C.muted, fontSize:11, pointerEvents:"none" }}>{attOpen?"▲":"▼"}</span>
                </div>

                {attOpen && (
                  <>
                    <div onClick={()=>setAttOpen(false)} style={{ position:"fixed", inset:0, zIndex:710 }}/>
                    <div style={{ position:"absolute", top:"calc(100% + 4px)", left:0, right:0, zIndex:720, background:"#fff",
                      border:`1.5px solid ${C.border}`, borderRadius:10, boxShadow:"0 12px 32px rgba(0,0,0,0.15)", overflow:"hidden" }}>
                      <div style={{ padding:8, borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:6 }}>
                        <input autoFocus value={attQuery} onChange={e=>setAttQuery(e.target.value)}
                          onKeyDown={e=>{ if(e.key==="Enter" && canAddTyped){ e.preventDefault(); toggleAttendee(attQuery.trim()); setAttQuery(""); } }}
                          placeholder="Search name or type an email…"
                          style={{ ...input, border:"none", padding:"4px 6px", fontSize:12.5 }}/>
                        <span style={{ color:C.muted, fontSize:13 }}>🔍</span>
                      </div>
                      <div style={{ maxHeight:200, overflowY:"auto" }}>
                        {canAddTyped && (
                          <div onClick={()=>{ toggleAttendee(attQuery.trim()); setAttQuery(""); }}
                            style={{ padding:"9px 12px", fontSize:12.5, color:C.primaryDark, fontWeight:600, cursor:"pointer", borderBottom:`1px solid ${C.border}` }}>
                            ＋ Add “{attQuery.trim()}”
                          </div>
                        )}
                        {extraSelected.filter(e=>!q||e.toLowerCase().includes(q)).map(email=>(
                          <label key={email} style={{ display:"flex", alignItems:"center", gap:9, padding:"8px 12px", cursor:"pointer", fontSize:12.5 }}>
                            <input type="checkbox" checked readOnly onChange={()=>toggleAttendee(email)} style={{ accentColor:C.primary, width:14, height:14 }}/>
                            <span style={{ color:C.text }}>{email}</span>
                          </label>
                        ))}
                        {leadOptions.map(l=>{ const checked = attendeeArr.includes(l.email); return (
                          <label key={l.id} onClick={e=>{ e.preventDefault(); toggleAttendee(l.email); }}
                            style={{ display:"flex", alignItems:"center", gap:9, padding:"8px 12px", cursor:"pointer", fontSize:12.5,
                              background:checked?C.primary+"08":"transparent" }}>
                            <input type="checkbox" checked={checked} readOnly style={{ accentColor:C.primary, width:14, height:14 }}/>
                            <span style={{ color:C.text }}>{l.email}</span>
                            <span style={{ color:C.muted }}>({l.name})</span>
                            {!l.consent && <span style={{ marginLeft:"auto", fontSize:10, color:C.amber, fontWeight:600 }}>no email sync</span>}
                          </label>
                        );})}
                        {leadOptions.length===0 && !canAddTyped && (
                          <div style={{ padding:"10px 12px", fontSize:12, color:C.muted }}>No matches</div>
                        )}
                      </div>
                    </div>
                  </>
                )}
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
            {field("Meeting Location *", <input value={locationDisabled?"":f.location} disabled={locationDisabled}
              onChange={e=>set("location",e.target.value)}
              placeholder={locationDisabled?"Video link generated automatically":LOCATION_PLACEHOLDER[f.meetingType]}
              style={{ ...input, background:locationDisabled?"#F8FAFC":"#fff", color:locationDisabled?C.muted:C.text, cursor:locationDisabled?"not-allowed":"text" }}/>)}

            {/* Calendar integration — Video Conference only, before attachments */}
            {showCalToggle && (
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
                      Generates a video-conference link and adds the appointment to your calendar and each notified attendee’s calendar (when their email is integrated with the CRM).
                    </div>
                  </div>
                </div>

                {/* Per-attendee email notification choice */}
                {f.autoCalendar && attendeeArr.length>0 && (
                  <div style={{ marginTop:10, paddingTop:10, borderTop:`1px solid ${C.primary}22` }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
                      <span style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.05em" }}>Email invite to</span>
                      <span style={{ display:"flex", gap:10 }}>
                        <button onClick={()=>set("notify",invitable)} style={{ background:"none", border:"none", color:C.primaryDark, fontSize:11, fontWeight:700, cursor:"pointer", padding:0 }}>All</button>
                        <button onClick={()=>set("notify",[])} style={{ background:"none", border:"none", color:C.slate, fontSize:11, fontWeight:700, cursor:"pointer", padding:0 }}>None</button>
                      </span>
                    </div>
                    <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                      {attendeeArr.map(email=>{ const ok = isIntegrated(email); return (
                        <label key={email} style={{ display:"flex", alignItems:"center", gap:8, fontSize:12, color:ok?C.slate:C.muted, cursor:ok?"pointer":"not-allowed" }}>
                          <input type="checkbox" disabled={!ok} checked={ok && f.notify.includes(email)} onChange={()=>toggleNotify(email)} style={{ accentColor:C.primary, width:14, height:14 }}/>
                          <span>{displayName(email)||email}</span>
                          {!ok && <span style={{ fontSize:10, color:C.amber, fontWeight:600 }}>no email sync</span>}
                        </label>
                      );})}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Attachments — multiselect: system docs + uploads */}
            <div style={{ marginBottom:12 }}>
              <label style={lbl}>Attachments</label>
              {f.attachments.length>0 && (
                <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:6 }}>
                  {f.attachments.map(a=>(
                    <span key={a} style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"4px 9px", borderRadius:7, background:"#F1F5F9", border:`1px solid ${C.border}`, fontSize:11.5, color:C.text, fontWeight:600 }}>
                      📎 {a}
                      <span onClick={()=>removeAttachment(a)} style={{ color:C.muted, cursor:"pointer", fontSize:13, lineHeight:1 }}>×</span>
                    </span>
                  ))}
                </div>
              )}
              <select value="" onChange={e=>{ const v=e.target.value; if(!v) return; if(v==="__upload__"){ fileRef.current&&fileRef.current.click(); } else { addAttachment(v.replace(/^sys:/,"")); } e.target.value=""; }} style={input}>
                <option value="">+ Add attachment…</option>
                <optgroup label="System attachments">
                  {DOCUMENT_TYPES_STORE.filter(d=>!f.attachments.includes(d.label)).map(d => <option key={d.id} value={`sys:${d.label}`}>{d.icon} {d.label}</option>)}
                </optgroup>
                <option value="__upload__">⬆ Upload from computer…</option>
              </select>
              <input ref={fileRef} type="file" multiple style={{ display:"none" }}
                onChange={e=>{ const files=Array.from(e.target.files||[]); files.forEach(file=>addAttachment(file.name)); e.target.value=""; }}/>
            </div>

            {/* Reminders — up to 3 */}
            <div style={{ marginBottom:12 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:f.reminderOn?8:0 }}>
                <label style={{ display:"flex", alignItems:"center", gap:7, fontSize:12, color:C.slate, cursor:"pointer" }}>
                  <input type="checkbox" checked={f.reminderOn} onChange={e=>set("reminderOn",e.target.checked)} style={{ accentColor:C.primary, width:14, height:14 }}/>
                  Reminders
                </label>
                {f.reminderOn && <span style={{ fontSize:11, color:C.muted }}>up to 3</span>}
              </div>
              {f.reminderOn && f.reminders.map((r,i)=>(
                <div key={i} style={{ marginBottom:8 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <select value={r.val} onChange={e=>setReminder(i,{ val:e.target.value })} style={input}>
                      {REMINDER_OPTS.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                    {f.reminders.length>1 && (
                      <button onClick={()=>removeReminderRow(i)} title="Remove reminder"
                        style={{ flexShrink:0, width:32, height:32, borderRadius:7, border:`1px solid ${C.border}`, background:"#fff", color:C.muted, cursor:"pointer", fontSize:14 }}>×</button>
                    )}
                  </div>
                  {r.val==="custom" && (
                    <input type="datetime-local" value={r.custom} onChange={e=>setReminder(i,{ custom:e.target.value })} style={{ ...input, marginTop:6 }}/>
                  )}
                </div>
              ))}
              {f.reminderOn && f.reminders.length<3 && (
                <button onClick={addReminderRow}
                  style={{ background:"none", border:"none", color:C.primaryDark, fontSize:12, fontWeight:700, cursor:"pointer", padding:0 }}>＋ Add reminder</button>
              )}
            </div>

            {field("Description", <textarea value={f.note} onChange={e=>set("note",e.target.value)} placeholder="Any details for this appointment…"
              style={{ ...input, minHeight:70, resize:"none", lineHeight:1.5 }}/>)}

            <div style={{ display:"flex", gap:10, marginTop:6 }}>
              <button onClick={onClose} style={{ flex:1, padding:"10px", borderRadius:9, border:`1px solid ${C.border}`, background:"#fff", color:C.slate, fontSize:13, fontWeight:600, cursor:"pointer" }}>Cancel</button>
              <button onClick={()=>canSave && onSubmit && onSubmit({
                  ...f,
                  contact: attendeeArr.length ? (displayName(attendeeArr[0])||attendeeArr[0]) : "",
                  attendees: attendeeArr.map(attLabelOf).join(", "),
                  attachment: f.attachments.join(", "),
                  autoCalendar: calOn,
                  kind:"appointment",
                }, m)} disabled={!canSave}
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
