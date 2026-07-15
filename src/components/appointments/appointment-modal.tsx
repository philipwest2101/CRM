import React, { useState, useRef } from "react";
import { ALL_LEADS, DOCUMENT_TYPES_STORE, GPS_BY_VD } from "../../lib/core";
import { C } from "../../theme";

// Appointment modal — create | edit | view
// (matches "Schedule Appointment", "Edit Appointment", "Appointment" wireframes)

const lbl   = { fontSize:11, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.05em", display:"block", marginBottom:5 };
const input = { width:"100%", padding:"9px 12px", borderRadius:8, border:`1.5px solid ${C.border}`, fontSize:13, fontFamily:"inherit", boxSizing:"border-box", outline:"none", background:"#fff", color:C.text };

export const APPOINTMENT_TYPES = [
  "Consultation Appointment", "Recruiting", "Business Opening", "Investment Talk", "Finance Talk", "Other",
];
const REMINDER_OPTS = [["15","15 Minutes Before"],["30","30 Minutes Before"],["60","1 Hour Before"],["1440","1 Day Before"],["custom","Custom Date"]];
const reminderLabel = (val,custom) => val==="custom"
  ? (custom ? `Custom · ${custom.replace("T"," ")}` : "Custom Date")
  : (REMINDER_OPTS.find(o=>o[0]===String(val))||[])[1];

// ── Email helpers ───────────────────────────────────────────────────────────
// Attendees are stored as email addresses.
const isEmail      = (s) => /^[^\s,()]+@[^\s,()]+\.[^\s,()]+$/.test(String(s||"").trim());
const extractEmail = (s) => { const mt = String(s||"").match(/[^\s,()]+@[^\s,()]+\.[^\s,()]+/); return mt ? mt[0] : null; };
const leadByEmail = (email) => ALL_LEADS.find(l => l.email.toLowerCase() === String(email).toLowerCase());
const leadByName  = (name)  => ALL_LEADS.find(l => name && name.includes(l.name));
const displayName = (email) => (leadByEmail(email)||{}).name || "";
const asEmail     = (entry) => extractEmail(entry) || ((leadByName(entry)||{}).email || entry);
const toArr = (v) => Array.isArray(v) ? v.filter(Boolean)
  : (typeof v === "string" && v ? v.split(",").map(s=>s.trim()).filter(Boolean) : []);

// No explicit manager/superior field exists on user records, so the hierarchy is
// derived from the same role→name mapping used in top-nav.tsx plus GPS_BY_VD.
const nameToEmail = (name) => name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z\s]/g, "").trim().split(/\s+/).join(".") + "@firma.de";
export const getSuperiorEmails = (role) => {
  if (role === "gp") {
    const vd = Object.keys(GPS_BY_VD).find(v => GPS_BY_VD[v].includes("Anna Klein")) || "Thomas Müller";
    return [nameToEmail(vd)];
  }
  if (role === "vd") return [nameToEmail("Julia Bauer")];
  if (role === "manager") return [nameToEmail("Super Admin")];
  return [];
};

const blank = (selectedDate, role) => ({
  title:"", contact:"", attendees:[], apptType:"Consultation Appointment", apptTypeOther:"",
  date:selectedDate||"", time:"09:00", end:"",
  location:"",
  attachments:[],
  reminderOn:true, reminder:"30", reminderCustom:"",
  note:"",
});

export const AppointmentModal = ({ mode="create", appt=null, selectedDate, role, lockContact=false, onClose, onSubmit, onCancelAppt, onSetOutcome }) => {
  const [m, setM] = useState(mode);
  const [f, setF] = useState(() => {
    const init = appt ? { ...blank(selectedDate, role), ...appt } : blank(selectedDate, role);
    if (!init.time) init.time = "09:00";                       // Time mandatory — default 9 AM
    // Contact and Attendees are independent fields — Attendees → array of emails only.
    init.attendees = toArr(init.attendees).map(asEmail);
    // Attachments → array (migrate legacy single attachment string)
    init.attachments = toArr(init.attachments).length ? toArr(init.attachments) : toArr(init.attachment);
    // Single reminder (migrate legacy reminders array if present)
    if (Array.isArray(init.reminders) && init.reminders.length) { init.reminder = init.reminders[0].val||"30"; init.reminderCustom = init.reminders[0].custom||""; }
    if (init.reminder == null) init.reminder = "30";
    // Migrate a custom "Other" type into its own field
    if (init.apptType && !APPOINTMENT_TYPES.includes(init.apptType)) { init.apptTypeOther = init.apptType; init.apptType = "Other"; }
    return init;
  });
  const set = (k,v) => setF(prev => ({ ...prev, [k]:v }));
  const isView = m === "view";

  // ── Attendees: single searchable multiselect (contacts + free emails) ──────
  const attendeeArr = f.attendees;
  const writeAttendees = (arr) => setF(prev => ({ ...prev, attendees:arr }));
  const toggleAttendee = (email) => writeAttendees(
    attendeeArr.includes(email) ? attendeeArr.filter(e=>e!==email) : [...attendeeArr, email]
  );
  const [attOpen, setAttOpen] = useState(false);
  const [attQuery, setAttQuery] = useState("");
  const q = attQuery.trim().toLowerCase();
  // Attendee options are limited to the user's superiors (no picking arbitrary contacts) + free-text emails.
  const superiorOptions = getSuperiorEmails(role).filter(email =>
    !q || email.toLowerCase().includes(q) || displayName(email).toLowerCase().includes(q));
  const extraSelected = attendeeArr.filter(e => !getSuperiorEmails(role).includes(e));   // free-typed emails
  const canAddTyped = isEmail(attQuery.trim()) && !attendeeArr.includes(attQuery.trim());

  // ── Attachments: multiselect (system docs + uploads) ──────────────────────
  const fileRef = useRef(null);
  const addAttachment = (name) => setF(prev => prev.attachments.includes(name)
    ? prev : { ...prev, attachments:[...prev.attachments, name] });
  const removeAttachment = (name) => setF(prev => ({ ...prev, attachments:prev.attachments.filter(a=>a!==name) }));

  // "Other" appointment type requires a custom label
  const apptTypeOk = f.apptType !== "Other" || f.apptTypeOther.trim();
  const canSave = f.title.trim() && f.contact && f.date && f.time && apptTypeOk;   // Time + valid type required

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

  return (
    <>
      <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.35)", zIndex:600 }}/>
      <div style={{ position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%)",
        width:600, maxHeight:"92vh", overflowY:"auto", background:"#fff", borderRadius:16, zIndex:700,
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
            {rowR("👤 Contact", f.contact)}
            {rowR("🏷 Type", f.apptType==="Other" ? (f.apptTypeOther||"Other") : f.apptType)}
            {rowR("👥 Attendees", attendeeArr.map(attLabelOf).join(", "))}
            {rowR("📍 Meeting Location", f.location)}
            {rowR("📎 Attachments", f.attachments.join(", "))}
            {f.reminderOn && rowR("⏰ Reminder", reminderLabel(f.reminder,f.reminderCustom))}
            {f.note && (
              <div style={{ marginTop:12 }}>
                <label style={lbl}>Description</label>
                <div style={{ fontSize:12, color:C.slate, lineHeight:1.5 }}>{f.note}</div>
              </div>
            )}
            {/* A Lead is worked only in its Processing & Feedback tab, so its
                appointment is read-only here. Cancel / Set Outcome are available
                for Network contacts only. */}
            <div style={{ display:"flex", alignItems:"center", marginTop:20, gap:10 }}>
              {f.lifecycle === "Network" ? (
                <>
                  <button onClick={()=>onCancelAppt&&onCancelAppt(f)} style={{ background:"none", border:"none", color:C.red, fontSize:12, fontWeight:700, cursor:"pointer", padding:0 }}>Cancel Appointment</button>
                  <button onClick={()=>onSetOutcome&&onSetOutcome(f)}
                    style={{ marginLeft:"auto", padding:"9px 22px", borderRadius:9, border:"none", background:C.primary, color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer" }}>Set Outcome</button>
                </>
              ) : (
                <div style={{ fontSize:12, color:C.muted, lineHeight:1.5 }}>
                  This appointment belongs to a Lead — manage it from the lead's <b>Processing &amp; Feedback</b> tab.
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ── CREATE / EDIT ───────────────────────────────────── */
          <div>
            {field("Title *", <input value={f.title} onChange={e=>set("title",e.target.value)} placeholder="e.g. Consultation — Sandra Richter" style={input}/>)}

            {field("Contact *", lockContact ? (
              <input value={f.contact} disabled style={{ ...input, background:C.light, color:C.text, cursor:"not-allowed" }}/>
            ) : (
              <select value={f.contact} onChange={e=>set("contact",e.target.value)} style={input}>
                <option value="">Choose…</option>
                {ALL_LEADS.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
              </select>
            ))}

            {/* Attendees — one searchable multiselect (contacts + any email) */}
            <div style={{ marginBottom:12 }}>
              <label style={lbl}>Attendees *</label>
              <div style={{ position:"relative" }}>
                <div onClick={()=>setAttOpen(o=>!o)}
                  style={{ ...input, minHeight:38, display:"flex", alignItems:"center", flexWrap:"wrap", gap:6, cursor:"pointer", padding:attendeeArr.length?"6px 30px 6px 8px":"9px 30px 9px 12px" }}>
                  {attendeeArr.length===0 && <span style={{ color:C.muted }}>Select attendees</span>}
                  {attendeeArr.map((email,i)=>(
                    <span key={email} style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"3px 8px", borderRadius:20,
                      background:"#F1F5F9", border:`1px solid ${C.border}`, fontSize:11.5, fontWeight:600, color:C.text }}>
                      {displayName(email) || email}
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
                          placeholder="Search superiors or type an email…"
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
                        {superiorOptions.map(email=>{ const checked = attendeeArr.includes(email); const name = displayName(email); return (
                          <label key={email} onClick={e=>{ e.preventDefault(); toggleAttendee(email); }}
                            style={{ display:"flex", alignItems:"center", gap:9, padding:"8px 12px", cursor:"pointer", fontSize:12.5,
                              background:checked?C.primary+"08":"transparent" }}>
                            <input type="checkbox" checked={checked} readOnly style={{ accentColor:C.primary, width:14, height:14 }}/>
                            <span style={{ color:C.text }}>{email}</span>
                            {name && <span style={{ color:C.muted }}>({name})</span>}
                          </label>
                        );})}
                        {superiorOptions.length===0 && !canAddTyped && (
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
              {f.apptType==="Other" && (
                <input value={f.apptTypeOther} onChange={e=>set("apptTypeOther",e.target.value)} autoFocus
                  placeholder="Enter appointment type *" style={{ ...input, marginTop:8 }}/>
              )}
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:12 }}>
              <div><label style={lbl}>Date *</label><input type="date" value={f.date} onChange={e=>set("date",e.target.value)} style={input}/></div>
              <div><label style={lbl}>Start *</label><input type="time" value={f.time} onChange={e=>set("time",e.target.value)} style={input}/></div>
              <div><label style={lbl}>End</label><input type="time" value={f.end} onChange={e=>set("end",e.target.value)} style={input}/></div>
            </div>

            {field("Meeting Location *", <input value={f.location}
              onChange={e=>set("location",e.target.value)}
              placeholder="ARTIST Boutique Hotel — Vienna  ·  or https://meet.…" style={input}/>)}

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
              <select value="" onChange={e=>{ const v=e.target.value; if(!v) return; addAttachment(v); e.target.value=""; }} style={input}>
                <option value="">+ Add attachment…</option>
                {DOCUMENT_TYPES_STORE.filter(d=>!f.attachments.includes(d.label)).map(d => <option key={d.id} value={d.label}>{d.icon} {d.label}</option>)}
              </select>
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
              <button onClick={()=>canSave && onSubmit && onSubmit({
                  ...f,
                  apptType: f.apptType==="Other" ? f.apptTypeOther.trim() : f.apptType,
                  attendees: attendeeArr.map(attLabelOf).join(", "),
                  attachment: f.attachments.join(", "),
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
