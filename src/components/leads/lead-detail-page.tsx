import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { NewAppointmentModal } from "../appointments/new-appointment-modal";
import { LeadAIInsights } from "./lead-ai-insights";
import { LeadDrawerAITab } from "./lead-drawer-ai-tab";
import { OutboundCallModal } from "./outbound-call-modal";
import { Avatar } from "../ui/avatar";
import { SettingsCard } from "../ui/settings-card";
import { StatusBadge } from "../ui/status-badge";
import { ACTIVITIES_STORE, AI_SCORES, EMAIL_TEMPLATES_STORE, LABELS_STORE, LEAD_LABELS_STORE, LEAD_NOTES_STORE, LIFECYCLE_STORE, SCORE_TIER, STATUS_META, VD_GP_PERF } from "../../lib/core";
import { C } from "../../theme";

export const LeadDetailPage = ({ lead, role, navigateTo, addAppointment, addReminder, runWorkflow }) => {
  if (!lead) { navigateTo("Leads"); return null; }

  const [activeTab, setActiveTab] = useState("Overview");
  const [callLead,  setCallLead]  = useState(null);
  const [savedNotes, setSavedNotes] = useState(LEAD_NOTES_STORE[lead.id]||[]);
  const [comment,    setComment]    = useState("");
  const [hoveredFileIdx, setHoveredFileIdx] = useState(null);
  const [previewFile,    setPreviewFile]    = useState(null);
  const [showReminder,   setShowReminder]   = useState(false);
  const [remTitle,       setRemTitle]       = useState("");
  const [remDate,        setRemDate]        = useState("");
  const [remTime,        setRemTime]        = useState("");
  const [remNote,        setRemNote]        = useState("");
  const [remSaved,       setRemSaved]       = useState(false);
  const [showApptModal,  setShowApptModal]  = useState(false);
  const [leadLabels,     setLeadLabels]     = useState(LEAD_LABELS_STORE[lead.id] || []);
  const [personalTags,   setPersonalTags]   = useState([]); // GP-only free-text tags
  const [tagInput,       setTagInput]       = useState("");
  const [showLabelDDL,   setShowLabelDDL]   = useState(false);

  // ── New unified action modal state ────────────────────────────────────────
  const [actionModal,    setActionModal]    = useState(null); // "email"|"task"|"log"|"reminder"|"appointment"
  const [taskType,       setTaskType]       = useState("call");  // call|email
  const [logType,        setLogType]        = useState("call");  // call|email|appointment|offline
  const [actionTitle,    setActionTitle]    = useState("");
  const [actionDate,     setActionDate]     = useState("2026-02-24");
  const [actionTime,     setActionTime]     = useState("");
  const [actionNote,     setActionNote]     = useState("");
  const [actionOutcome,  setActionOutcome]  = useState("");
  const [actionSaved,    setActionSaved]    = useState(false);
  const [showMoreActions,setShowMoreActions]= useState(false);

  // ── Email template picker state ───────────────────────────────────────────
  const [emailChosenTpl,   setEmailChosenTpl]   = useState(null);
  const [emailTplPickerOpen, setEmailTplPickerOpen] = useState(false);
  const [emailTplLangFilter, setEmailTplLangFilter] = useState("all");

  const applyEmailTemplate = (tpl, lead) => {
    const myName = role==="gp"?"Anna Klein":role==="vd"?"Thomas Müller":"Super Admin";
    const merged = (tpl.body||"")
      .replace(/{{lead_name}}/gi, lead.name.split(" ")[0])
      .replace(/{{consultant_name}}/gi, myName)
      .replace(/{{company_name}}/gi, "vion gmbh")
      .replace(/{{appt_time}}/gi, "")
      .replace(/\{FirstName\}/gi, lead.name.split(" ")[0])
      .replace(/\{OwnerName\}/gi, myName);
    setActionTitle(tpl.subject||"");
    setActionNote(merged);
    setEmailChosenTpl(tpl);
    setEmailTplPickerOpen(false);
  };

  const clearEmailTemplate = () => {
    setEmailChosenTpl(null);
    setEmailTplPickerOpen(false);
    setActionTitle("");
    setActionNote("");
  };

  const availableEmailTpls = EMAIL_TEMPLATES_STORE.filter(t => {
    if(!t.published) return false;
    if(emailTplLangFilter!=="all" && t.lang!==emailTplLangFilter) return false;
    const myName = role==="gp"?"Anna Klein":role==="vd"?"Thomas Müller":"Super Admin";
    if(t.createdBy && t.createdBy!=="superadmin" && t.createdBy!==myName) return false;
    return true;
  });

  // Reset template state when email modal closes
  const closeAction = () => {
    setActionModal(null); setActionTitle(""); setActionDate("2026-02-24");
    setActionTime(""); setActionNote(""); setActionOutcome(""); setActionSaved(false);
    setShowMoreActions(false); setEmailChosenTpl(null); setEmailTplPickerOpen(false);
    setEmailTplLangFilter("all");
  };
  const saveAction = (type) => {
    setActionSaved(true);
    if(type==="reminder") {
      const rem = {
        id:`r_ld_${Date.now()}`,
        title: actionTitle || `Reminder — ${lead.name}`,
        lead: lead.name, leadId: lead.id,
        date: actionDate, time: actionTime,
        entityType:"lead", recur:"Once",
        priority:"normal", status:"pending",
        channels:["push","inapp"], type:"manual",
        note: actionNote,
        // Also store as activity so it shows in Calendar
        category:"reminder",
      };
      addReminder(rem);
      // Add to activities store so it appears on calendar
      const act = {
        id:`act_ld_${Date.now()}`, type:"note",
        title: rem.title, lead: lead.name,
        date: actionDate, time: actionTime, end:"",
        gp:"Anna Klein", vd:"Thomas Müller",
        status:"upcoming", priority:"normal",
        note: actionNote, recur:"Once",
        entityType:"reminder", category:"reminder",
      };
      ACTIVITIES_STORE.unshift(act);
    }
    setTimeout(()=>closeAction(), 1000);
  };

  const toggleLabel = (labelId) => {
    setLeadLabels(prev => {
      const next = prev.includes(labelId) ? prev.filter(x=>x!==labelId) : [...prev, labelId];
      LEAD_LABELS_STORE[lead.id] = next;
      return next;
    });
  };
  const [files,       setFiles]      = useState([
    { id:"f1", name:"Beratungsmappe_Q1.pdf",  type:"pdf", size:"2.4 MB", dir:"email",    sentByUs:true,  time:"Today 09:12", sender:"Anna Klein", note:"" },
    { id:"f2", name:"Einkommensnachweise.pdf", type:"pdf", size:"1.1 MB", dir:"email",    sentByUs:false, time:"Today 10:31", sender:lead.name,    note:"" },
    { id:"f3", name:"Produktübersicht.pdf",    type:"pdf", size:"0.8 MB", dir:"email",    sentByUs:true,  time:"Yesterday",   sender:"Anna Klein", note:"" },
    { id:"f4", name:"Ausweis_scan.jpg",        type:"img", size:"640 KB", dir:"uploaded", sentByUs:false, time:"22 Feb 2026", sender:"Anna Klein", note:"Received via WhatsApp" },
  ]);
  const [fileFilter,  setFileFilter] = useState("all");
  const [selDoc,      setSelDoc]     = useState(()=>EMAIL_TEMPLATES_STORE[0]?.id||"");

  const s    = STATUS_META[lead.status] || STATUS_META.open;
  const ai   = AI_SCORES[lead.id];
  const tier = ai ? SCORE_TIER[ai.tier] : null;

  const tabs = ["Overview", "🤖 AI", "Assign", "Schedule", "📎 Files"];

  return (
    <div style={{ padding:"0 0 60px" }}>

      {/* ── Breadcrumb + Header ───────────────────────────────────────────── */}
      <div style={{ background:"#fff",borderBottom:`1px solid ${C.border}`,padding:"14px 28px 0",position:"sticky",top:54,zIndex:90 }}>
        {/* Breadcrumb */}
        <div style={{ display:"flex",alignItems:"center",gap:6,fontSize:11,color:C.muted,marginBottom:12 }}>
          <span onClick={()=>navigateTo("Leads")} style={{ color:C.blue,fontWeight:600,cursor:"pointer" }}>Contacts</span>
          <span>›</span>
          <span style={{ color:C.text,fontWeight:600 }}>{lead.name}</span>
          <div style={{ marginLeft:"auto",display:"flex",gap:8 }}>
            <button onClick={()=>navigateTo("Leads")}
              style={{ padding:"6px 14px",borderRadius:7,border:`1px solid ${C.border}`,background:"#fff",color:C.slate,fontSize:12,fontWeight:600,cursor:"pointer" }}>
              ← Back
            </button>
          </div>
        </div>

        {/* Lead header row */}
        <div style={{ display:"flex",alignItems:"center",gap:16,marginBottom:14 }}>
          <Avatar name={lead.name} size={48} />
          <div style={{ flex:1 }}>
            <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:4,flexWrap:"wrap" }}>
              <h1 style={{ margin:0,fontSize:20,fontWeight:800,color:C.navy,letterSpacing:"-0.02em" }}>{lead.name}</h1>
              <StatusBadge status={lead.status} />
              {ai && tier && (
                <span style={{ fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:20,background:tier.color+"15",color:tier.color }}>
                  {tier.label} · {ai.score}/100
                </span>
              )}
              {leadLabels.map(id=>{ const lbl=LABELS_STORE.find(l=>l.id===id); return lbl?(<span key={id} style={{ fontSize:10,fontWeight:700,padding:"2px 9px",borderRadius:12,background:lbl.color+"18",color:lbl.color,border:`1px solid ${lbl.color}30` }}>{lbl.name}</span>):null; })}
            </div>
            <div style={{ display:"flex",gap:16,fontSize:12,color:C.muted }}>
              <span>📧 {lead.email}</span>
              <span>📞 {lead.phone}</span>
              <span>📍 {lead.city}, {lead.zip}</span>
              <span>📣 {lead.source} · {lead.campaign}</span>
            </div>

            {/* ── Labels dropdown — system (SA) + personal tags ── */}
            <div style={{ marginTop:8,display:"flex",alignItems:"center",gap:8,flexWrap:"wrap" }}>

              {/* Applied label/tag chips */}
              {leadLabels.map(id=>{
                const lbl = LABELS_STORE.find(l=>l.id===id);
                return lbl ? (
                  <span key={id} onClick={()=>toggleLabel(id)}
                    style={{ display:"inline-flex",alignItems:"center",gap:4,padding:"3px 9px",
                      borderRadius:20,background:lbl.color+"18",color:lbl.color,
                      border:`1.5px solid ${lbl.color}40`,fontSize:11,fontWeight:700,
                      cursor:"pointer" }} title="Click to remove">
                    {lbl.name} ×
                  </span>
                ) : null;
              })}
              {personalTags.map((tag,i)=>(
                <span key={`pt-${i}`} onClick={()=>setPersonalTags(prev=>prev.filter((_,j)=>j!==i))}
                  style={{ display:"inline-flex",alignItems:"center",gap:4,padding:"3px 9px",
                    borderRadius:20,background:C.indigo+"0D",color:C.indigo,
                    border:`1.5px dashed ${C.indigo}50`,fontSize:11,fontWeight:600,
                    cursor:"pointer" }} title="Click to remove">
                  {tag} ×
                </span>
              ))}

              {/* Dropdown trigger */}
              {(() => {
                const [open, setOpen] = [showLabelDDL, setShowLabelDDL];
                return (
                  <div style={{ position:"relative" }}>
                    <button onClick={()=>setOpen(v=>!v)}
                      style={{ padding:"3px 10px",borderRadius:20,border:`1.5px solid ${C.border}`,
                        background:"#fff",color:C.muted,fontSize:11,fontWeight:600,
                        cursor:"pointer",fontFamily:"inherit",
                        display:"flex",alignItems:"center",gap:5 }}>
                      🏷️ Add label {open?"▲":"▼"}
                    </button>

                    {open && (
                      <>
                        {/* Backdrop */}
                        <div onClick={()=>setOpen(false)}
                          style={{ position:"fixed",inset:0,zIndex:100 }}/>

                        {/* Dropdown panel */}
                        <div style={{ position:"absolute",top:"calc(100% + 6px)",left:0,
                          width:240,background:"#fff",borderRadius:10,
                          border:`1px solid ${C.border}`,zIndex:200,
                          boxShadow:"0 8px 24px rgba(0,0,0,0.12)",overflow:"hidden" }}>

                          {/* Search */}
                          <div style={{ padding:"8px 10px",borderBottom:`1px solid ${C.border}` }}>
                            <input value={tagInput} onChange={e=>setTagInput(e.target.value)}
                              placeholder="Search or create tag…"
                              autoFocus
                              style={{ width:"100%",border:"none",outline:"none",fontSize:12,
                                fontFamily:"inherit",color:C.text,background:"transparent" }}/>
                          </div>

                          <div style={{ maxHeight:220,overflowY:"auto" }}>

                            {/* System labels section */}
                            {LABELS_STORE.filter(l=>l.active&&(!tagInput||l.name.toLowerCase().includes(tagInput.toLowerCase()))).length>0 && (
                              <>
                                <div style={{ padding:"6px 12px 3px",fontSize:9,fontWeight:800,
                                  color:C.muted,textTransform:"uppercase",letterSpacing:"0.07em" }}>
                                  System Labels
                                </div>
                                {LABELS_STORE.filter(l=>l.active&&(!tagInput||l.name.toLowerCase().includes(tagInput.toLowerCase()))).map(lbl=>{
                                  const active = leadLabels.includes(lbl.id);
                                  return (
                                    <div key={lbl.id} onClick={()=>{ toggleLabel(lbl.id); }}
                                      style={{ display:"flex",alignItems:"center",gap:10,
                                        padding:"8px 12px",cursor:"pointer",
                                        background:active?"#F0FDF4":"#fff" }}
                                      onMouseEnter={e=>e.currentTarget.style.background=active?"#DCFCE7":"#F8FAFC"}
                                      onMouseLeave={e=>e.currentTarget.style.background=active?"#F0FDF4":"#fff"}>
                                      <div style={{ width:10,height:10,borderRadius:"50%",
                                        background:lbl.color,flexShrink:0 }}/>
                                      <span style={{ flex:1,fontSize:12,fontWeight:600,color:C.text }}>{lbl.name}</span>
                                      {active && <span style={{ fontSize:11,color:C.green,fontWeight:700 }}>✓</span>}
                                    </div>
                                  );
                                })}
                              </>
                            )}

                            {/* Personal tags section */}
                            {personalTags.filter(t=>!tagInput||t.toLowerCase().includes(tagInput.toLowerCase())).length>0 && (
                              <>
                                <div style={{ padding:"6px 12px 3px",fontSize:9,fontWeight:800,
                                  color:C.muted,textTransform:"uppercase",letterSpacing:"0.07em",
                                  borderTop:`1px solid ${C.border}` }}>
                                  My Tags
                                </div>
                                {personalTags.filter(t=>!tagInput||t.toLowerCase().includes(tagInput.toLowerCase())).map((tag,i)=>(
                                  <div key={`pt-${i}`}
                                    style={{ display:"flex",alignItems:"center",gap:10,
                                      padding:"8px 12px",cursor:"default",background:"#fff" }}>
                                    <div style={{ width:10,height:10,borderRadius:"50%",
                                      background:C.indigo,flexShrink:0,
                                      border:`2px dashed ${C.indigo}` }}/>
                                    <span style={{ flex:1,fontSize:12,color:C.indigo,fontWeight:600 }}>{tag}</span>
                                    <button onClick={()=>setPersonalTags(prev=>prev.filter((_,j)=>j!==i))}
                                      style={{ background:"none",border:"none",cursor:"pointer",
                                        color:C.muted,fontSize:13,lineHeight:1,padding:0 }}>×</button>
                                  </div>
                                ))}
                              </>
                            )}

                            {/* Create new personal tag */}
                            {tagInput.trim() && !personalTags.includes(tagInput.trim()) &&
                             !LABELS_STORE.some(l=>l.name.toLowerCase()===tagInput.trim().toLowerCase()) && (
                              <div onClick={()=>{
                                  setPersonalTags(prev=>[...prev, tagInput.trim()]);
                                  setTagInput("");
                                }}
                                style={{ display:"flex",alignItems:"center",gap:10,
                                  padding:"8px 12px",cursor:"pointer",
                                  borderTop:`1px solid ${C.border}`,background:"#F8FAFC" }}
                                onMouseEnter={e=>e.currentTarget.style.background="#EEF2FF"}
                                onMouseLeave={e=>e.currentTarget.style.background="#F8FAFC"}>
                                <span style={{ fontSize:14,color:C.indigo }}>+</span>
                                <span style={{ fontSize:12,color:C.indigo,fontWeight:600 }}>
                                  Create "{tagInput.trim()}"
                                </span>
                                <span style={{ marginLeft:"auto",fontSize:10,color:C.muted }}>My Tag</span>
                              </div>
                            )}

                            {/* Empty state */}
                            {LABELS_STORE.filter(l=>l.active&&(!tagInput||l.name.toLowerCase().includes(tagInput.toLowerCase()))).length===0 &&
                             personalTags.filter(t=>!tagInput||t.toLowerCase().includes(tagInput.toLowerCase())).length===0 &&
                             !tagInput.trim() && (
                              <div style={{ padding:"16px 12px",textAlign:"center",
                                fontSize:12,color:C.muted,fontStyle:"italic" }}>
                                No labels yet — type to create a personal tag
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* ── Action Icon Bar ─────────────────────────────────────────────── */}
        <div style={{ display:"flex",gap:0,alignItems:"center",paddingTop:10,paddingBottom:2,borderTop:`1px solid ${C.border}`,marginTop:6 }}>
          {[
            { id:"note",        icon:"✏️", label:"Note",    handler:()=>setActionModal("reminder") },
            { id:"email",       icon:"✉️", label:"Email",   handler:()=>setActionModal("email")    },
            { id:"call",        icon:"📞", label:"Call",    handler:()=>setCallLead(lead)          },
            { id:"task",        icon:"☑️", label:"Task",    handler:()=>setActionModal("task")     },
            { id:"appointment", icon:"📅", label:"Meeting", handler:()=>setShowApptModal(true)     },
            { id:"more",        icon:"···",label:"More",    handler:()=>setShowMoreActions(v=>!v), isMore:true },
          ].map(a=>(
            <div key={a.id} style={{ position:"relative" }}>
              <div onClick={a.handler}
                style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:4,
                  padding:"6px 18px",borderRadius:8,cursor:"pointer" }}
                onMouseEnter={e=>e.currentTarget.style.background="#F8FAFC"}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <div style={{ width:34,height:34,borderRadius:"50%",
                  background:showMoreActions&&a.isMore?"#E2E8F0":"#F1F5F9",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:a.isMore?13:15,color:C.slate,border:`1px solid ${C.border}` }}>
                  {a.icon}
                </div>
                <span style={{ fontSize:10,color:C.muted,fontWeight:500,whiteSpace:"nowrap" }}>{a.label}</span>
              </div>
              {/* More dropdown */}
              {a.isMore && showMoreActions && (
                <>
                  <div onClick={()=>setShowMoreActions(false)} style={{ position:"fixed",inset:0,zIndex:200 }}/>
                  <div style={{ position:"absolute",top:"100%",right:0,zIndex:201,
                    background:"#fff",borderRadius:12,boxShadow:"0 8px 32px rgba(0,0,0,0.15)",
                    border:`1px solid ${C.border}`,minWidth:210,padding:"6px 0" }}>
                    <div style={{ padding:"6px 14px 4px",fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.08em" }}>Log Activity</div>
                    {[
                      {label:"Log a Call",         icon:"📞", key:"call"       },
                      {label:"Log an Email",        icon:"✉️", key:"email"      },
                      {label:"Log an Appointment",  icon:"📅", key:"appointment"},
                      {label:"Offline Log",         icon:"📝", key:"offline"    },
                    ].map(item=>(
                      <div key={item.key} onClick={()=>{ setLogType(item.key); setActionModal("log"); setShowMoreActions(false); }}
                        style={{ display:"flex",alignItems:"center",gap:10,padding:"9px 14px",cursor:"pointer" }}
                        onMouseEnter={e=>e.currentTarget.style.background="#F8FAFC"}
                        onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                        <span style={{ fontSize:15,width:22,textAlign:"center" }}>{item.icon}</span>
                        <span style={{ fontSize:13,fontWeight:500,color:C.text }}>{item.label}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* ── Action Modals ─────────────────────────────────────────────────── */}
        {actionModal && (
          <>
            <div onClick={closeAction} style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.3)",zIndex:300 }}/>
            <div style={{ position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",
              width:480,maxHeight:"85vh",overflowY:"auto",background:"#fff",borderRadius:16,zIndex:400,
              boxShadow:"0 24px 64px rgba(0,0,0,0.2)",fontFamily:"inherit" }}>
              <div style={{ padding:"16px 20px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                <div>
                  <div style={{ fontSize:15,fontWeight:800,color:C.navy }}>
                    {actionModal==="email"    ?"✉️ Send Email"
                    :actionModal==="task"     ?"☑️ Create Task"
                    :actionModal==="reminder" ?"⏰ Set Reminder"
                    :`📝 Log ${logType==="call"?"Call":logType==="email"?"Email":logType==="appointment"?"Appointment":"Offline Interaction"}`}
                  </div>
                  <div style={{ fontSize:11,color:C.muted,marginTop:2 }}>{lead.name}</div>
                </div>
                <button onClick={closeAction} style={{ width:26,height:26,borderRadius:"50%",border:`1px solid ${C.border}`,background:"#F8FAFC",color:C.muted,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>×</button>
              </div>
              <div style={{ padding:"18px 20px",display:"flex",flexDirection:"column",gap:14 }}>

                {/* EMAIL */}
                {actionModal==="email"&&(<>
                  {/* ── Template picker ──────────────────────────────────── */}
                  <div>
                    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6 }}>
                      <label style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em" }}>Template <span style={{ fontWeight:400,textTransform:"none" }}>(optional)</span></label>
                      {emailChosenTpl && (
                        <button onClick={clearEmailTemplate}
                          style={{ fontSize:10,color:C.muted,border:"none",background:"none",cursor:"pointer",padding:0 }}>✕ Clear</button>
                      )}
                    </div>

                    {emailChosenTpl ? (
                      <div style={{ display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:8,
                        background:C.green+"06",border:`1.5px solid ${C.green}30` }}>
                        <span>✅</span>
                        <div style={{ flex:1,minWidth:0 }}>
                          <div style={{ fontSize:12,fontWeight:700,color:C.green }}>{emailChosenTpl.name}</div>
                          <div style={{ fontSize:10,color:C.muted,marginTop:1 }}>
                            {emailChosenTpl.lang==="en"?"🇬🇧 EN":"🇩🇪 DE"} · {emailChosenTpl.journey} · Applied — you can still edit below
                          </div>
                        </div>
                        <button onClick={()=>setEmailTplPickerOpen(v=>!v)}
                          style={{ fontSize:11,color:C.blue,border:"none",background:"none",cursor:"pointer",fontWeight:600 }}>Change</button>
                      </div>
                    ) : (
                      <button onClick={()=>setEmailTplPickerOpen(v=>!v)}
                        style={{ width:"100%",padding:"9px 12px",borderRadius:8,border:`1.5px dashed ${C.border}`,
                          background:"#F8FAFC",color:C.muted,fontSize:12,cursor:"pointer",fontFamily:"inherit",
                          textAlign:"left",display:"flex",alignItems:"center",gap:8 }}>
                        <span>📄</span> Choose a template to pre-fill subject &amp; body
                      </button>
                    )}

                    {/* Template dropdown */}
                    {emailTplPickerOpen && (
                      <div style={{ marginTop:6,borderRadius:10,border:`1.5px solid ${C.primary}`,background:"#fff",
                        boxShadow:"0 8px 24px rgba(0,0,0,0.12)",overflow:"hidden" }}>
                        {/* Language filter */}
                        <div style={{ display:"flex",gap:6,padding:"8px 12px",borderBottom:`1px solid ${C.border}`,background:"#F8FAFC",alignItems:"center" }}>
                          <span style={{ fontSize:10,fontWeight:700,color:C.muted }}>Language:</span>
                          {[["all","All"],["de","🇩🇪 DE"],["en","🇬🇧 EN"]].map(([k,l])=>(
                            <button key={k} onClick={()=>setEmailTplLangFilter(k)}
                              style={{ padding:"3px 9px",borderRadius:12,border:`1px solid ${emailTplLangFilter===k?C.primary:C.border}`,
                                background:emailTplLangFilter===k?C.primary:"#fff",color:emailTplLangFilter===k?"#fff":C.slate,
                                fontSize:10,cursor:"pointer",fontFamily:"inherit",fontWeight:emailTplLangFilter===k?700:400 }}>{l}</button>
                          ))}
                          <span style={{ marginLeft:"auto",fontSize:10,color:C.muted }}>{availableEmailTpls.length} available</span>
                        </div>

                        {/* Template list */}
                        <div style={{ maxHeight:220,overflowY:"auto" }}>
                          {availableEmailTpls.length===0 && (
                            <div style={{ padding:"16px",textAlign:"center",color:C.muted,fontSize:12 }}>No active templates match this filter.</div>
                          )}
                          {availableEmailTpls.map((tpl,i)=>{
                            const isMine = tpl.createdBy && tpl.createdBy!=="superadmin";
                            const jColor = {welcome:"#3B82F6",followup1:"#8B5CF6",followup2:"#EC4899",reminder:"#6366F1",postnurture:"#10B981",reengagement:"#F59E0B"}[tpl.journey]||C.navy;
                            const jLabel = {welcome:"Welcome",followup1:"Follow-up #1",followup2:"Follow-up #2",reminder:"Reminder",postnurture:"Post-Appt",reengagement:"Re-Engagement"}[tpl.journey]||tpl.journey;
                            return (
                              <div key={tpl.id} onClick={()=>applyEmailTemplate(tpl, lead)}
                                style={{ padding:"11px 14px",borderBottom:i<availableEmailTpls.length-1?`1px solid ${C.border}`:"none",
                                  cursor:"pointer",background:"#fff" }}
                                onMouseEnter={e=>e.currentTarget.style.background="#F0F4FF"}
                                onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
                                <div style={{ display:"flex",alignItems:"center",gap:7,marginBottom:3 }}>
                                  <span style={{ fontSize:13,fontWeight:700,color:C.text,flex:1 }}>{tpl.name}</span>
                                  <span style={{ fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:8,
                                    background:tpl.lang==="en"?"#EFF6FF":"#FFF7ED",color:tpl.lang==="en"?C.blue:C.amber }}>
                                    {tpl.lang==="en"?"🇬🇧 EN":"🇩🇪 DE"}
                                  </span>
                                  {isMine
                                    ? <span style={{ fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:8,background:C.green+"15",color:C.green }}>👤 Mine</span>
                                    : <span style={{ fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:8,background:C.primary+"10",color:C.navy }}>🏢 Org</span>}
                                </div>
                                <div style={{ fontSize:11,color:C.muted,display:"flex",gap:8 }}>
                                  <span style={{ fontWeight:700,color:jColor }}>{jLabel}</span>
                                  {tpl.subject && <span>· {tpl.subject.slice(0,44)}{tpl.subject.length>44?"…":""}</span>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ── Standard fields ──────────────────────────────────── */}
                  <div><label style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:5 }}>To</label>
                    <input value={lead.email||`${lead.name.toLowerCase().replace(" ",".")}@example.com`} readOnly
                      style={{ width:"100%",padding:"9px 12px",borderRadius:8,border:`1px solid ${C.border}`,fontSize:13,background:"#F8FAFC",boxSizing:"border-box" }}/></div>
                  <div><label style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:5 }}>Subject</label>
                    <input value={actionTitle} onChange={e=>setActionTitle(e.target.value)} placeholder="e.g. Your financial consultation"
                      style={{ width:"100%",padding:"9px 12px",borderRadius:8,border:`1.5px solid ${actionTitle?C.primary:C.border}`,fontSize:13,fontFamily:"inherit",boxSizing:"border-box",outline:"none" }}/></div>
                  <div><label style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:5 }}>Message</label>
                    <textarea value={actionNote} onChange={e=>setActionNote(e.target.value)} rows={5}
                      placeholder={`Dear ${lead.name.split(" ")[0]},\n\n\n\nKind regards,\nAnna Klein`}
                      style={{ width:"100%",padding:"9px 12px",borderRadius:8,border:`1.5px solid ${actionNote?C.primary:C.border}`,fontSize:12,fontFamily:"inherit",boxSizing:"border-box",resize:"vertical",outline:"none",lineHeight:1.5 }}/></div>
                  <div style={{ display:"flex",alignItems:"center",gap:8,fontSize:11,color:C.muted }}>
                    Language: <span style={{ fontWeight:700,padding:"2px 10px",borderRadius:8,background:lead.lang==="en"?"#EFF6FF":"#FFF7ED",color:lead.lang==="en"?C.blue:C.amber }}>{lead.lang==="en"?"🇬🇧 English":"🇩🇪 German"}</span>
                    {lead.lang && emailChosenTpl && lead.lang!==emailChosenTpl.lang && (
                      <span style={{ fontSize:10,color:C.amber,fontWeight:600 }}>⚠️ Template language differs from lead preference</span>
                    )}
                  </div>
                </>)}

                {/* TASK */}
                {actionModal==="task"&&(<>
                  <div><label style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:6 }}>Task Type</label>
                    <div style={{ display:"flex",gap:8 }}>
                      {[["call","📞 Call"],["email","✉️ Email"]].map(([k,l])=>(
                        <button key={k} onClick={()=>setTaskType(k)} style={{ flex:1,padding:"9px",borderRadius:9,border:`1.5px solid ${taskType===k?C.primary:C.border}`,background:taskType===k?C.primary+"08":"#fff",color:taskType===k?C.navy:C.muted,fontSize:13,fontWeight:taskType===k?700:400,cursor:"pointer",fontFamily:"inherit" }}>{l}</button>
                      ))}
                    </div></div>
                  <div><label style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:5 }}>Title</label>
                    <input value={actionTitle} onChange={e=>setActionTitle(e.target.value)} placeholder={taskType==="call"?`Call ${lead.name}`:`Email ${lead.name}`}
                      style={{ width:"100%",padding:"9px 12px",borderRadius:8,border:`1.5px solid ${C.border}`,fontSize:13,fontFamily:"inherit",boxSizing:"border-box",outline:"none" }}/></div>
                  <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
                    <div><label style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:5 }}>Due Date</label>
                      <input type="date" value={actionDate} onChange={e=>setActionDate(e.target.value)} style={{ width:"100%",padding:"9px 12px",borderRadius:8,border:`1.5px solid ${C.border}`,fontSize:12,fontFamily:"inherit",boxSizing:"border-box",outline:"none" }}/></div>
                    <div><label style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:5 }}>Due Time</label>
                      <input type="time" value={actionTime} onChange={e=>setActionTime(e.target.value)} style={{ width:"100%",padding:"9px 12px",borderRadius:8,border:`1.5px solid ${C.border}`,fontSize:12,fontFamily:"inherit",boxSizing:"border-box",outline:"none" }}/></div>
                  </div>
                  <div><label style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:5 }}>Notes</label>
                    <textarea value={actionNote} onChange={e=>setActionNote(e.target.value)} rows={2} placeholder="Optional notes…" style={{ width:"100%",padding:"9px 12px",borderRadius:8,border:`1.5px solid ${C.border}`,fontSize:12,fontFamily:"inherit",boxSizing:"border-box",resize:"none",outline:"none" }}/></div>
                </>)}

                {/* REMINDER */}
                {actionModal==="reminder"&&(<>
                  <div><label style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:5 }}>Reminder / Note</label>
                    <input value={actionTitle} onChange={e=>setActionTitle(e.target.value)} placeholder={`e.g. Follow up with ${lead.name.split(" ")[0]}`}
                      style={{ width:"100%",padding:"9px 12px",borderRadius:8,border:`1.5px solid ${C.border}`,fontSize:13,fontFamily:"inherit",boxSizing:"border-box",outline:"none" }}/></div>
                  <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
                    <div><label style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:5 }}>Date</label>
                      <input type="date" value={actionDate} onChange={e=>setActionDate(e.target.value)} style={{ width:"100%",padding:"9px 12px",borderRadius:8,border:`1.5px solid ${C.border}`,fontSize:12,fontFamily:"inherit",boxSizing:"border-box",outline:"none" }}/></div>
                    <div><label style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:5 }}>Time</label>
                      <input type="time" value={actionTime} onChange={e=>setActionTime(e.target.value)} style={{ width:"100%",padding:"9px 12px",borderRadius:8,border:`1.5px solid ${C.border}`,fontSize:12,fontFamily:"inherit",boxSizing:"border-box",outline:"none" }}/></div>
                  </div>
                  <div><label style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:5 }}>Note</label>
                    <textarea value={actionNote} onChange={e=>setActionNote(e.target.value)} rows={2} placeholder="What to remember…" style={{ width:"100%",padding:"9px 12px",borderRadius:8,border:`1.5px solid ${C.border}`,fontSize:12,fontFamily:"inherit",boxSizing:"border-box",resize:"none",outline:"none" }}/></div>
                  <div style={{ padding:"9px 12px",borderRadius:9,background:C.green+"06",border:`1px solid ${C.green}25`,fontSize:11,color:C.slate }}>
                    📅 This reminder will also appear on the Calendar on the selected date.
                  </div>
                </>)}

                {/* LOG */}
                {actionModal==="log"&&(<>
                  <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
                    {[["call","📞 Call"],["email","✉️ Email"],["appointment","📅 Appointment"],["offline","📝 Offline"]].map(([k,l])=>(
                      <button key={k} onClick={()=>setLogType(k)} style={{ padding:"6px 12px",borderRadius:8,border:`1.5px solid ${logType===k?C.primary:C.border}`,background:logType===k?C.primary+"08":"#fff",color:logType===k?C.navy:C.muted,fontSize:12,fontWeight:logType===k?700:400,cursor:"pointer",fontFamily:"inherit" }}>{l}</button>
                    ))}
                  </div>
                  <div><label style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:5 }}>Outcome</label>
                    <select value={actionOutcome} onChange={e=>setActionOutcome(e.target.value)} style={{ width:"100%",padding:"9px 12px",borderRadius:8,border:`1.5px solid ${C.border}`,fontSize:13,fontFamily:"inherit",appearance:"none",outline:"none" }}>
                      <option value="">— Select outcome —</option>
                      {logType==="call"&&<><option>✅ Reached — Interested</option><option>✅ Reached — Appointment set</option><option>👎 Reached — Not Interested</option><option>📵 Not Reached — No answer</option><option>📵 Not Reached — Voicemail</option><option>🔄 Callback Requested</option></>}
                      {logType==="email"&&<><option>📤 Email sent</option><option>📥 Positive response</option><option>📥 Negative response</option><option>🔄 Follow-up requested</option></>}
                      {logType==="appointment"&&<><option>✅ Completed</option><option>❌ No-show / Cancelled</option><option>🔄 Rescheduled</option><option>🕐 Follow-up required</option></>}
                      {logType==="offline"&&<><option>🤝 In-person meeting</option><option>💬 WhatsApp / SMS</option><option>📮 Letter / Post</option><option>📱 Other channel</option></>}
                    </select></div>
                  <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
                    <div><label style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:5 }}>Date</label>
                      <input type="date" value={actionDate} onChange={e=>setActionDate(e.target.value)} style={{ width:"100%",padding:"9px 12px",borderRadius:8,border:`1.5px solid ${C.border}`,fontSize:12,fontFamily:"inherit",boxSizing:"border-box",outline:"none" }}/></div>
                    <div><label style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:5 }}>Time</label>
                      <input type="time" value={actionTime} onChange={e=>setActionTime(e.target.value)} style={{ width:"100%",padding:"9px 12px",borderRadius:8,border:`1.5px solid ${C.border}`,fontSize:12,fontFamily:"inherit",boxSizing:"border-box",outline:"none" }}/></div>
                  </div>
                  <div><label style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:5 }}>Notes</label>
                    <textarea value={actionNote} onChange={e=>setActionNote(e.target.value)} rows={3} placeholder="What happened during this interaction…" style={{ width:"100%",padding:"9px 12px",borderRadius:8,border:`1.5px solid ${C.border}`,fontSize:12,fontFamily:"inherit",boxSizing:"border-box",resize:"none",outline:"none",lineHeight:1.5 }}/></div>
                </>)}

                {/* Save / Cancel */}
                {actionSaved
                  ? <div style={{ padding:"12px",borderRadius:9,background:C.green+"08",border:`1px solid ${C.green}25`,fontSize:13,fontWeight:700,color:C.green,textAlign:"center" }}>✅ Saved successfully</div>
                  : <div style={{ display:"flex",gap:10 }}>
                      <button onClick={closeAction} style={{ flex:1,padding:"10px",borderRadius:9,border:`1px solid ${C.border}`,background:"#fff",color:C.muted,fontSize:13,fontWeight:600,cursor:"pointer" }}>Cancel</button>
                      <button onClick={()=>saveAction(actionModal)} style={{ flex:2,padding:"10px",borderRadius:9,border:"none",background:C.primary,color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer" }}>
                        {actionModal==="email"?"✉️ Send Email":actionModal==="task"?"☑️ Create Task":actionModal==="reminder"?"⏰ Save Reminder":"📝 Save Log"}
                      </button>
                    </div>}
              </div>
            </div>
          </>
        )}

        {/* Tab bar */}
        <div style={{ display:"flex",gap:2 }}>
          {tabs.map(t => {
            const isAI = t.startsWith("🤖");
            const active = activeTab === t;
            return (
              <button key={t} onClick={()=>setActiveTab(t)}
                style={{ padding:"9px 18px",fontSize:13,fontWeight:active?700:500,
                  color:active?(isAI?C.ai:C.navy):C.muted,
                  background:"none",border:"none",
                  borderBottom:active?`2px solid ${isAI?C.ai:C.primary}`:"2px solid transparent",
                  marginBottom:-1,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap" }}>
                {t}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Tab content ──────────────────────────────────────────────────── */}
      <div style={{ padding:"28px 28px 0",maxWidth:1100,margin:"0 auto" }}>

        {/* ── OVERVIEW ── */}
        {activeTab==="Overview" && (()=>{
          const stuck = lead.status==="attempted" && lead.attempts>=3;
          const journeyStages = LIFECYCLE_STORE.filter(st=>!st.statuses.length||!st.statuses.every(x=>(x.flags||[]).includes("excludesOutreach")));
          const stagePalette  = [C.slate,C.blue,C.indigo,C.green,C.purple,C.amber];
          const stageOrder = journeyStages.map(st=>st.id);
          const currentStageIdx = Math.max(0, journeyStages.findIndex(st=>st.statuses.some(x=>x.key===lead.status)));
          const stageLabelMap = Object.fromEntries(journeyStages.map(st=>[st.id, st.nameEn]));

          const stageEvents = journeyStages
            .map((st,i)=>({kind:"stage",key:st.id,label:st.nameEn,color:stagePalette[i%stagePalette.length],idx:i}))
            .filter(e=>e.idx<=currentStageIdx);
          const noteEvents = savedNotes.map((n,i)=>({kind:"note",label:n.text,author:n.author,time:n.time,color:C.amber,idx:1.5+i*0.1}));
          const merged = [...stageEvents,...noteEvents].sort((a,b)=>a.idx-b.idx);

          return (
            <div style={{ display:"grid",gridTemplateColumns:"1fr 400px",gap:24 }}>
              {/* Left: summary cards */}
              <div style={{ display:"flex",flexDirection:"column",gap:16 }}>

                {/* AI Insights box */}
                <LeadAIInsights lead={lead}/>

                {/* Next best action */}
                {lead.status!=="closed" && lead.status!=="no_interest" && (
                  <div style={{ padding:"14px 18px",borderRadius:12,background:`linear-gradient(135deg,${C.ai}12,${C.ai}06)`,border:`1.5px solid ${C.ai}30`,display:"flex",alignItems:"center",gap:12 }}>
                    <span style={{ fontSize:22,flexShrink:0 }}>{lead.status==="appointment"?"📅":lead.status==="followup"?"📞":lead.status==="attempted"?"🔁":"📞"}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:11,fontWeight:700,color:C.ai,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:2 }}>Next Best Action</div>
                      <div style={{ fontSize:13,fontWeight:700,color:C.text }}>
                        {lead.status==="appointment"?"Prepare for advisory session — confirm appointment":lead.status==="followup"?"Follow-up call due — best window 14:00–16:00 today":lead.status==="attempted"?"Try again — 2nd attempt recommended within 24h":"Make first contact — no attempts yet"}
                      </div>
                    </div>
                    <button onClick={()=>setActiveTab("🤖 AI")} style={{ padding:"7px 14px",borderRadius:8,border:"none",background:C.ai,color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer",flexShrink:0 }}>Ask AI →</button>
                  </div>
                )}

                {/* 2×2 summary cards */}
                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
                  {/* AI Score */}
                  {ai && tier ? (
                    <SettingsCard style={{ padding:"16px 18px",borderLeft:`4px solid ${tier.color}` }}>
                      <div style={{ fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:6 }}>🤖 AI Score</div>
                      <div style={{ display:"flex",alignItems:"baseline",gap:4,marginBottom:8 }}>
                        <span style={{ fontSize:32,fontWeight:800,color:tier.color,lineHeight:1 }}>{ai.score}</span>
                        <span style={{ fontSize:13,color:C.muted }}>/100</span>
                        <span style={{ marginLeft:6,fontSize:10,fontWeight:700,padding:"2px 9px",borderRadius:20,background:tier.color+"18",color:tier.color }}>{tier.label}</span>
                      </div>
                      {ai.reasons.slice(0,2).map((r,i)=><div key={i} style={{ fontSize:11,color:C.slate,display:"flex",gap:5,marginBottom:3 }}><span style={{ color:tier.color,fontWeight:700 }}>+</span>{r}</div>)}
                    </SettingsCard>
                  ) : (
                    <SettingsCard style={{ padding:"16px 18px",display:"flex",alignItems:"center",justifyContent:"center" }}>
                      <span style={{ fontSize:12,color:C.muted,fontStyle:"italic" }}>No AI score yet</span>
                    </SettingsCard>
                  )}

                  {/* Current Stage */}
                  <SettingsCard style={{ padding:"16px 18px",borderLeft:`4px solid ${stuck?C.red:s.color}` }}>
                    <div style={{ fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:6 }}>Current Stage</div>
                    <div style={{ fontSize:18,fontWeight:800,color:s.color,marginBottom:6 }}>{s.label}</div>
                    <div style={{ fontSize:12,color:C.slate }}>{lead.attempts>0?`${lead.attempts} attempt${lead.attempts!==1?"s":""} made`:"No attempts yet"}</div>
                    {stuck && <div style={{ fontSize:11,fontWeight:700,color:C.red,marginTop:6 }}>⚠ Stuck — consider reassigning</div>}
                  </SettingsCard>

                  {/* Contact Attempts */}
                  <SettingsCard style={{ padding:"16px 18px" }}>
                    <div style={{ fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:10 }}>Contact Attempts</div>
                    <div style={{ display:"flex",gap:6,marginBottom:10 }}>
                      {[1,2,3,4,5].map(n=><div key={n} style={{ flex:1,height:28,borderRadius:6,background:n<=lead.attempts?(n===lead.attempts?C.amber:C.amber+"60"):"#E2E8F0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:n<=lead.attempts?"#fff":C.muted }}>{n<=lead.attempts?"✓":n}</div>)}
                    </div>
                    <div style={{ fontSize:12,color:C.slate }}>{lead.attempts===0?"No contact yet":lead.attempts>=5?"All 5 used":`${5-lead.attempts} remaining`}</div>
                    <button onClick={()=>setCallLead(lead)} style={{ marginTop:10,width:"100%",padding:"6px",borderRadius:7,border:"none",background:C.green,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer" }}>📞 Call now</button>
                  </SettingsCard>

                  {/* Qualification */}
                  <SettingsCard style={{ padding:"16px 18px" }}>
                    <div style={{ fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:10 }}>Qualification</div>
                    {[{label:"GDPR consent",ok:lead.consent,icon:"🔒"},{label:"Source",ok:!!lead.source,icon:"📣"},{label:"Campaign",ok:!!lead.campaign,icon:"🎯"},{label:"Assigned GP",ok:!!lead.assignedGP,icon:"👤"}].map(q=>(
                      <div key={q.label} style={{ display:"flex",alignItems:"center",gap:8,marginBottom:6 }}>
                        <span style={{ fontSize:13,width:18,textAlign:"center",flexShrink:0 }}>{q.icon}</span>
                        <span style={{ fontSize:12,flex:1,color:C.slate }}>{q.label}</span>
                        <span style={{ fontSize:12,fontWeight:700,color:q.ok?C.green:C.red }}>{q.ok?"✓":"✗"}</span>
                      </div>
                    ))}
                  </SettingsCard>
                </div>

                {/* Contact + Lead details */}
                <SettingsCard style={{ padding:"18px 20px" }}>
                  <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:0 }}>
                    <div>
                      <div style={{ fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:10 }}>Contact Details</div>
                      {/* Preferred Language — editable toggle */}
                      <div style={{ display:"flex",alignItems:"center",gap:10,padding:"6px 0",borderBottom:`1px solid ${C.border}` }}>
                        <span style={{ fontSize:13,width:20,textAlign:"center" }}>🗣️</span>
                        <span style={{ fontSize:12,color:C.muted,flex:1 }}>Preferred Language</span>
                        <div style={{ display:"flex",gap:4 }}>
                          {[["de","🇩🇪 DE"],["en","🇬🇧 EN"]].map(([k,l])=>(
                            <button key={k}
                              onClick={()=>{ lead.lang=k; }}
                              style={{ padding:"2px 10px",borderRadius:7,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit",
                                border:`1.5px solid ${(lead.lang||"de")===k?C.primary:C.border}`,
                                background:(lead.lang||"de")===k?C.primary:"#fff",
                                color:(lead.lang||"de")===k?"#fff":C.muted }}>
                              {l}
                            </button>
                          ))}
                        </div>
                      </div>
                      {[["📧",lead.email],["📞",lead.phone],["📍",`${lead.city} · ${lead.zip}`],["👤",lead.assignedGP||"Unassigned"],["📣",lead.source]].map(([icon,val])=>(
                        <div key={icon} style={{ display:"flex",gap:8,alignItems:"flex-start",marginBottom:7 }}>
                          <span style={{ fontSize:13,flexShrink:0,width:18,textAlign:"center" }}>{icon}</span>
                          <span style={{ fontSize:12,color:C.slate }}>{val}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ paddingLeft:20,borderLeft:`1px solid ${C.border}` }}>
                      <div style={{ fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:10 }}>Contact Details</div>
                      {[["Campaign",lead.campaign],["Lead ID",lead.id],["Assigned VD",lead.assignedVD||"—"],["Created",lead.created],...(lead.amount?[["Closing Amount",lead.amount]]:[])].map(([k,v])=>(
                        <div key={k} style={{ display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:`1px solid ${C.border}`,fontSize:12 }}>
                          <span style={{ color:C.muted }}>{k}</span>
                          <span style={{ color:k==="Closing Amount"?C.green:C.text,fontWeight:k==="Closing Amount"?700:400 }}>{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </SettingsCard>
              </div>

              {/* Right: Journey + Note composer */}
              <div>
                <SettingsCard style={{ padding:"18px 20px" }}>
                  <div style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:16 }}>Journey</div>
                  <div style={{ position:"relative",marginBottom:20 }}>
                    <div style={{ position:"absolute",left:10,top:0,bottom:0,width:2,background:"#E2E8F0",borderRadius:1,zIndex:0 }}/>
                    {merged.map((ev,i)=>{
                      const isNote   = ev.kind==="note";
                      const isActive = !isNote && ev.key===lead.status;
                      return (
                        <div key={i} style={{ display:"flex",alignItems:"flex-start",gap:12,marginBottom:i===merged.length-1?0:16,position:"relative",zIndex:1 }}>
                          <div style={{ width:22,height:22,borderRadius:"50%",flexShrink:0,background:isNote?"#FFFBEB":isActive?ev.color:"#F0FDF4",border:`2px solid ${isNote?"#FDE68A":isActive?ev.color:C.green}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,boxShadow:isActive?`0 0 0 3px ${ev.color}20`:"none" }}>
                            {isNote?"📝":isActive?<span style={{ width:6,height:6,borderRadius:"50%",background:"#fff",display:"inline-block" }}/>:<span style={{ fontSize:9,color:C.green,fontWeight:800 }}>✓</span>}
                          </div>
                          <div style={{ flex:1,minWidth:0,paddingTop:2 }}>
                            {isNote ? (
                              <>
                                <div style={{ fontSize:10,color:C.muted,marginBottom:3 }}><strong style={{ color:"#92400E" }}>{ev.author}</strong> · {ev.time}</div>
                                <div style={{ padding:"7px 10px",background:"#FFFBEB",border:"1px solid #FDE68A",borderRadius:7,fontSize:12,color:"#92400E",lineHeight:1.5 }}>{ev.label}</div>
                              </>
                            ) : (
                              <>
                                <div style={{ fontSize:12,fontWeight:isActive?700:500,color:isActive?ev.color:C.green }}>
                                  {ev.label}
                                  {isActive&&<span style={{ marginLeft:6,fontSize:9,fontWeight:700,padding:"1px 6px",borderRadius:8,background:ev.color+"15",color:ev.color }}>current</span>}
                                </div>
                                {isActive&&lead.attempts>0&&<div style={{ fontSize:10,color:C.muted,marginTop:2 }}>{lead.attempts} attempt{lead.attempts!==1?"s":""}</div>}
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {stageOrder.slice(currentStageIdx+1).map(key=>(
                      <div key={key} style={{ display:"flex",alignItems:"center",gap:12,marginTop:16,opacity:0.3,position:"relative",zIndex:1 }}>
                        <div style={{ width:22,height:22,borderRadius:"50%",background:"#F1F5F9",border:"2px solid #E2E8F0",flexShrink:0 }}/>
                        <div style={{ fontSize:12,color:C.muted }}>{stageLabelMap[key]}</div>
                      </div>
                    ))}
                  </div>

                  {/* Note composer */}
                  <div style={{ paddingTop:14,borderTop:`1px solid ${C.border}` }}>
                    <div style={{ fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:8 }}>📝 Add Note</div>
                    <div style={{ display:"flex",gap:8,alignItems:"flex-end" }}>
                      <textarea value={comment} onChange={e=>setComment(e.target.value)}
                        onKeyDown={e=>{if((e.ctrlKey||e.metaKey)&&e.key==="Enter"){e.preventDefault();if(!comment.trim())return;const note={text:comment.trim(),author:"Anna Klein",time:new Date().toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"})+" · Today"};const updated=[...savedNotes,note];setSavedNotes(updated);LEAD_NOTES_STORE[lead.id]=updated;setComment("");}}}
                        placeholder="Add a note… (Ctrl+Enter to save)"
                        style={{ flex:1,minHeight:52,borderRadius:8,border:`1px solid ${C.border}`,padding:"8px 12px",fontSize:12,fontFamily:"inherit",color:C.slate,resize:"none",boxSizing:"border-box",lineHeight:1.5 }}/>
                      <button onClick={()=>{if(!comment.trim())return;const note={text:comment.trim(),author:"Anna Klein",time:new Date().toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"})+" · Today"};const updated=[...savedNotes,note];setSavedNotes(updated);LEAD_NOTES_STORE[lead.id]=updated;setComment("");}}
                        disabled={!comment.trim()}
                        style={{ padding:"8px 16px",borderRadius:8,border:"none",background:comment.trim()?C.primary:"#E2E8F0",color:comment.trim()?"#fff":C.muted,fontSize:12,fontWeight:600,cursor:comment.trim()?"pointer":"default",flexShrink:0,height:36,transition:"all 0.15s" }}>Save</button>
                    </div>
                  </div>
                </SettingsCard>
              </div>
            </div>
          );
        })()}

        {/* ── AI TAB ── */}
        {activeTab==="🤖 AI" && (
          <div style={{ maxWidth:680 }}>
            <LeadDrawerAITab lead={lead} role={role} />
          </div>
        )}

        {/* ── ASSIGN ── */}
        {activeTab==="Assign" && (
          <div style={{ maxWidth:520 }}>
            <SettingsCard style={{ padding:"24px" }}>
              <div style={{ fontSize:14,fontWeight:700,color:C.text,marginBottom:16 }}>Assign Contact</div>
              <div style={{ fontSize:12,color:C.muted,marginBottom:16 }}>Currently assigned to: <strong style={{ color:C.text }}>{lead.assignedGP||"Unassigned"}</strong></div>
              <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                {VD_GP_PERF.map(gp=>(
                  <div key={gp.name} style={{ display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderRadius:10,border:`1.5px solid ${lead.assignedGP===gp.name?C.indigo:C.border}`,background:lead.assignedGP===gp.name?C.indigo+"06":"#fff",cursor:"pointer" }}>
                    <Avatar name={gp.name} size={32}/>
                    <div style={{ flex:1 }}><div style={{ fontSize:13,fontWeight:700 }}>{gp.name}</div><div style={{ fontSize:11,color:C.muted }}>{gp.leads} leads · {gp.rate} conv.</div></div>
                    {lead.assignedGP===gp.name&&<span style={{ fontSize:11,fontWeight:700,color:C.indigo }}>✓ Current</span>}
                  </div>
                ))}
              </div>
            </SettingsCard>
          </div>
        )}

        {/* ── SCHEDULE ── */}
        {activeTab==="Schedule" && (
          <div style={{ maxWidth:520 }}>
            <SettingsCard style={{ padding:"24px" }}>
              <div style={{ fontSize:14,fontWeight:700,color:C.text,marginBottom:16 }}>Schedule Appointment</div>
              <div style={{ fontSize:12,color:C.muted,marginBottom:18 }}>
                Book a call, video session, or in-person meeting for <strong>{lead.name}</strong>.
              </div>
              <button onClick={()=>setShowApptModal(true)}
                style={{ width:"100%",padding:"10px",borderRadius:9,border:"none",background:C.indigo,color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer" }}>
                📅 Book Appointment
              </button>
            </SettingsCard>
            {showApptModal && <NewAppointmentModal lead={lead} onClose={()=>setShowApptModal(false)} role={role} onAdd={addAppointment} />}
          </div>
        )}

        {/* ── FILES ── */}
        {activeTab==="📎 Files" && (
          <div style={{ maxWidth:680 }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16 }}>
              <div>
                <div style={{ fontSize:14,fontWeight:800,color:C.navy,marginBottom:2 }}>📎 Documents</div>
                <div style={{ fontSize:12,color:C.muted }}>Files exchanged by email or uploaded manually for this contact.</div>
              </div>
            </div>

            {/* Filters + Upload button */}
            <div style={{ display:"flex",gap:8,marginBottom:14,alignItems:"center" }}>
              {[
                ["all",      "All"],
                ["email",    "Email"],
                ["uploaded", "Uploaded"],
              ].map(([k,l])=>(
                <button key={k} onClick={()=>setFileFilter(k)}
                  style={{ padding:"5px 16px",borderRadius:20,
                    border:`1px solid ${fileFilter===k?C.primary:C.border}`,
                    background:fileFilter===k?C.primary:"#fff",
                    color:fileFilter===k?"#fff":C.slate,
                    fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>
                  {l}
                  {k!=="all" && (
                    <span style={{ marginLeft:5,fontSize:10,fontWeight:700,
                      color:fileFilter===k?"rgba(255,255,255,0.7)":C.muted }}>
                      ({files.filter(f=>f.dir===k).length})
                    </span>
                  )}
                </button>
              ))}

              {/* Upload button — always creates an "uploaded" entry */}
              <label style={{ marginLeft:"auto",padding:"7px 14px",borderRadius:8,border:"none",
                background:C.green,color:"#fff",fontSize:12,fontWeight:700,
                cursor:"pointer",display:"flex",alignItems:"center",gap:6 }}>
                <input type="file" style={{ display:"none" }} onChange={e=>{
                  const f=e.target.files[0];
                  if(f) setFiles(prev=>[...prev,{
                    id:`f${Date.now()}`,name:f.name,type:"pdf",
                    size:`${(f.size/1024).toFixed(0)} KB`,
                    dir:"uploaded",time:"Just now",sender:"Anna Klein",
                    note:"",
                  }]);
                  e.target.value="";
                }}/>
                ⬆ Upload File
              </label>
            </div>

            {/* Note input for uploaded files — appears when filter is "uploaded" */}
            {fileFilter==="uploaded" && (
              <div style={{ padding:"10px 14px",borderRadius:9,background:"#F0FDF4",
                border:`1px solid ${C.green}25`,marginBottom:14,fontSize:11,color:C.slate }}>
                💡 Upload files received outside email — WhatsApp, scan, in-person handover. Add a note to each file to record the source.
              </div>
            )}

            {/* File list */}
            <div style={{ display:"flex",flexDirection:"column",gap:8,marginBottom:20 }}>
              {(fileFilter==="all"
                ? files
                : files.filter(f=>f.dir===fileFilter)
              ).map(f=>{
                const isUploaded = f.dir==="uploaded";
                const isSent     = f.dir==="email" && f.sentByUs;
                const bgColor    = isUploaded?"#F0FDF4":isSent?"#F8FAFC":"#FFF7ED";
                const borderColor= isUploaded?C.green+"30":isSent?C.border:C.amber+"40";
                const iconBg     = isUploaded?C.green+"15":isSent?"#EFF6FF":C.amber+"15";
                const tagColor   = isUploaded?C.green:isSent?C.blue:C.amber;
                const tagLabel   = isUploaded?"Uploaded":isSent?"Sent":"Received";
                return (
                  <div key={f.id} style={{ borderRadius:10,border:`1px solid ${borderColor}`,overflow:"hidden" }}>
                    <div style={{ display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:bgColor }}>
                      <div style={{ width:38,height:38,borderRadius:9,background:iconBg,
                        display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0 }}>
                        {isUploaded?"📤":"📄"}
                      </div>
                      <div style={{ flex:1,minWidth:0 }}>
                        <div style={{ fontSize:13,fontWeight:700,color:C.text,
                          overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{f.name}</div>
                        <div style={{ fontSize:11,color:C.muted,marginTop:2 }}>
                          {isUploaded
                              ? <><span>Uploaded by </span><strong>{f.sender}</strong></>
                              : isSent
                                ? <><span>Sent for </span><strong>{lead.name}</strong><span> by {f.sender}</span></>
                                : <><span>Received from </span><strong>{f.sender}</strong></>
                            } · {f.time}
                          {f.size && f.size!=="—" && ` · ${f.size}`}
                        </div>
                      </div>
                      <span style={{ fontSize:10,fontWeight:800,padding:"2px 8px",borderRadius:8,
                        flexShrink:0,color:tagColor,background:tagColor+"15",
                        textTransform:"uppercase",letterSpacing:"0.05em" }}>
                        {tagLabel}
                      </span>
                      <button onClick={()=>{
                        const blob=new Blob([`[Mock: ${f.name}]`],{type:"application/pdf"});
                        const url=URL.createObjectURL(blob);
                        const a=document.createElement("a");a.href=url;a.download=f.name;a.click();URL.revokeObjectURL(url);
                      }} style={{ padding:"5px 10px",borderRadius:6,border:`1px solid ${C.border}`,
                        background:"#fff",color:C.slate,fontSize:11,fontWeight:600,cursor:"pointer",flexShrink:0 }}>⬇</button>
                      <button onClick={()=>setFiles(prev=>prev.filter(x=>x.id!==f.id))}
                        style={{ background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:16,flexShrink:0,lineHeight:1 }}>×</button>
                    </div>

                    {/* Note row for uploaded files */}
                    {isUploaded && (
                      <div style={{ padding:"8px 14px",borderTop:`1px solid ${C.green}20`,
                        background:"#fff",display:"flex",alignItems:"center",gap:8 }}>
                        <span style={{ fontSize:11,color:C.muted,flexShrink:0 }}>Note:</span>
                        <input
                          value={f.note||""}
                          onChange={e=>setFiles(prev=>prev.map(x=>x.id===f.id?{...x,note:e.target.value}:x))}
                          placeholder="e.g. Received via WhatsApp on 24 Feb"
                          style={{ flex:1,border:"none",outline:"none",fontSize:11,color:C.slate,
                            fontFamily:"inherit",background:"transparent" }}/>
                      </div>
                    )}
                  </div>
                );
              })}

              {(fileFilter==="all"?files:files.filter(f=>f.dir===fileFilter)).length===0 && (
                <div style={{ padding:"28px",textAlign:"center",color:C.muted,fontSize:12,
                  fontStyle:"italic",background:"#F8FAFC",borderRadius:10,border:`1px dashed ${C.border}` }}>
                  {fileFilter==="uploaded"
                    ? "No manually uploaded files yet — use the Upload File button above."
                    : fileFilter==="email"
                    ? "No email attachments yet for this contact."
                    : "No documents yet."}
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {callLead && <OutboundCallModal lead={callLead} onClose={()=>setCallLead(null)} onWorkflow={runWorkflow} />}

      {/* ── Create Reminder Modal ── */}
      {showReminder && (
        <>
          <div onClick={()=>setShowReminder(false)} style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.35)",zIndex:400 }}/>
          <div style={{ position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",
            width:440,background:"#fff",borderRadius:16,zIndex:500,
            boxShadow:"0 24px 64px rgba(0,0,0,0.2)",fontFamily:"inherit",padding:"22px 24px" }}>

            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18 }}>
              <div style={{ fontSize:15,fontWeight:800,color:C.navy }}>⏰ Set Reminder — {lead.name}</div>
              <button onClick={()=>setShowReminder(false)}
                style={{ width:26,height:26,borderRadius:"50%",border:`1px solid ${C.border}`,background:"#F8FAFC",color:C.muted,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>×</button>
            </div>

            <div style={{ marginBottom:12 }}>
              <label style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:5 }}>Title</label>
              <input value={remTitle} onChange={e=>setRemTitle(e.target.value)}
                placeholder={`e.g. Follow-up call with ${lead.name}`}
                style={{ width:"100%",padding:"9px 12px",borderRadius:8,border:`1.5px solid ${C.border}`,fontSize:13,fontFamily:"inherit",boxSizing:"border-box",outline:"none" }}/>
            </div>

            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12 }}>
              <div>
                <label style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:5 }}>Date</label>
                <input type="date" value={remDate} onChange={e=>setRemDate(e.target.value)}
                  style={{ width:"100%",padding:"9px 12px",borderRadius:8,border:`1.5px solid ${C.border}`,fontSize:13,fontFamily:"inherit",boxSizing:"border-box",outline:"none" }}/>
              </div>
              <div>
                <label style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:5 }}>Time</label>
                <input type="time" value={remTime} onChange={e=>setRemTime(e.target.value)}
                  style={{ width:"100%",padding:"9px 12px",borderRadius:8,border:`1.5px solid ${C.border}`,fontSize:13,fontFamily:"inherit",boxSizing:"border-box",outline:"none" }}/>
              </div>
            </div>

            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:5 }}>Note (optional)</label>
              <textarea value={remNote} onChange={e=>setRemNote(e.target.value)}
                placeholder="Any details for this reminder…"
                style={{ width:"100%",minHeight:56,padding:"9px 12px",borderRadius:8,border:`1.5px solid ${C.border}`,fontSize:12,fontFamily:"inherit",boxSizing:"border-box",resize:"none",outline:"none",lineHeight:1.5 }}/>
            </div>

            <div style={{ marginBottom:18,padding:"10px 14px",borderRadius:9,background:"#F8FAFC",border:`1px solid ${C.border}` }}>
              <div style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:7 }}>Deliver via</div>
              <div style={{ display:"flex",gap:16 }}>
                {[["📱 Push notification","push"],["🔔 In-app","inapp"]].map(([label,key])=>(
                  <label key={key} style={{ display:"flex",alignItems:"center",gap:7,cursor:"pointer",fontSize:12,color:C.slate }}>
                    <input type="checkbox" defaultChecked style={{ accentColor:"#7C3AED",width:14,height:14 }}/>{label}
                  </label>
                ))}
              </div>
            </div>

            {remSaved ? (
              <div style={{ padding:"12px",borderRadius:9,background:C.green+"0A",border:`1px solid ${C.green}30`,textAlign:"center",fontSize:13,fontWeight:700,color:C.green }}>
                ✅ Reminder saved — appears in Journey & notification centre
              </div>
            ) : (
              <div style={{ display:"flex",gap:10 }}>
                <button onClick={()=>setShowReminder(false)}
                  style={{ flex:1,padding:"10px",borderRadius:9,border:`1px solid ${C.border}`,background:"#fff",color:C.slate,fontSize:13,fontWeight:600,cursor:"pointer" }}>
                  Cancel
                </button>
                <button
                  disabled={!remTitle.trim()||!remDate}
                  onClick={()=>{
                    if(!remTitle.trim()||!remDate) return;
                    // Add to journey as a note entry
                    const note = {
                      text:`⏰ Reminder set: ${remTitle}${remTime?` at ${remTime}`:""}${remNote?` — ${remNote}`:""}`,
                      author:"Anna Klein",
                      time:new Date().toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"})+" · Today"
                    };
                    const updated = [...savedNotes, note];
                    setSavedNotes(updated);
                    LEAD_NOTES_STORE[lead.id] = updated;
                    setRemSaved(true);
                    setTimeout(()=>{ setRemSaved(false); setShowReminder(false); setRemTitle(""); setRemDate(""); setRemTime(""); setRemNote(""); }, 1800);
                  }}
                  style={{ flex:2,padding:"10px",borderRadius:9,border:"none",
                    background:remTitle.trim()&&remDate?"#7C3AED":"#E2E8F0",
                    color:remTitle.trim()&&remDate?"#fff":C.muted,
                    fontSize:13,fontWeight:700,
                    cursor:remTitle.trim()&&remDate?"pointer":"default" }}>
                  ⏰ Save Reminder
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// ─── Standalone AI tab for LeadDetailPage ─────────────────────────────────────
