import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { RoleChips } from "../ui/role-chips";
import { AUTOMATION_TRIGGERS, EMAIL_TEMPLATES_STORE, JOURNEY_META, LIFECYCLE_STORE, STATUS_AUTOMATION_CONFIG, TRIGGER_CATEGORY, TRIGGER_COMPLIANCE } from "../../lib/core";
import { C } from "../../theme";

export const RuleEditor = ({ initial, onSave, onCancel, takenTriggers }) => {
  const blank = { name:"", trigger:"", category:"contact", emailTemplateId:null, emailJourney:null,
                  sendEmail:false, emailToLead:true, emailRoles:[],
                  setStatus:false, setStatusKey:"",
                  createTask:false, taskType:"call", taskTitle:"", taskPriority:"normal",
                  taskRoles:["gp"], taskDueValue:0, taskDueUnit:"days",
                  taskRemind:true, taskRemindLead:"1 hour before",
                  sendPush:false, pushRoles:["gp"],
                  threshold:STATUS_AUTOMATION_CONFIG.notReachedThreshold,
                  delay:0, delayUnit:"minutes", description:"" };
  const [form, setForm] = useState(initial ? {
    ...blank, ...initial,
    sendEmail:    (initial.actions||[]).includes("auto_email") || !!initial.sendEmail,
    emailToLead:  initial.emailToLead!==undefined ? initial.emailToLead : true,
    emailRoles:   initial.emailRoles || [],
    // legacy "reminder" action / createReminder maps forward to the task block
    createTask:   (initial.actions||[]).includes("reminder") || (initial.actions||[]).includes("task") || !!initial.createReminder || !!initial.createTask,
    taskTitle:    initial.taskTitle || initial.reminderTitle || "",
    taskPriority: initial.taskPriority || initial.reminderPriority || "normal",
    taskRoles:    initial.taskRoles || initial.roles || ["gp"],
    taskDueValue: initial.taskDueValue ?? 0,
    taskDueUnit:  initial.taskDueUnit || "days",
    setStatus:    (initial.actions||[]).includes("set_status") || !!initial.setStatus,
    sendPush:     (initial.actions||[]).includes("push")       || !!initial.sendPush,
    pushRoles:    initial.pushRoles || initial.roles || ["gp"],
  } : blank);
  const f = (k,v) => setForm(p => ({...p, [k]:v}));
  const allTemplates = EMAIL_TEMPLATES_STORE.filter(t => t.published !== false);
  // Journey dropdown is derived from the journeys that actually have published
  // templates (ordered by JOURNEY_META, unknowns last) — never a hard-coded list.
  const journeyTemplateCount = allTemplates.reduce((m,t)=>{ if(t.journey) m[t.journey]=(m[t.journey]||0)+1; return m; }, {});
  const presentJourneys = Object.keys(journeyTemplateCount);
  const journeyOptions = [
    ...Object.keys(JOURNEY_META).filter(k => presentJourneys.includes(k)),
    ...presentJourneys.filter(k => !JOURNEY_META[k]),
  ];
  const ALL_STATUSES = LIFECYCLE_STORE.flatMap(s=>s.statuses.map(x=>({...x, stage:s.nameEn})));
  const isNotReachedTrigger = form.trigger==="lead_not_reached_5" || form.trigger==="lead_not_reached_1_4";
  const leadEmailWarning = TRIGGER_COMPLIANCE[form.trigger]?.leadEmail;
  // Validation: at least one action, and any chosen action must have a target.
  const anyAction   = form.sendEmail || form.setStatus || form.createTask || form.sendPush;
  const emailValid  = !form.sendEmail  || form.emailToLead || (form.emailRoles||[]).length>0;
  const statusValid = !form.setStatus  || !!form.setStatusKey;
  const taskValid   = !form.createTask || (form.taskRoles||[]).length>0;
  const pushValid   = !form.sendPush   || (form.pushRoles||[]).length>0;
  const canSave = form.name.trim() && form.trigger && anyAction && emailValid && statusValid && taskValid && pushValid;

  return (
    <>
      <div onClick={onCancel} style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:500 }}/>
      <div style={{ position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",
        width:600,maxHeight:"92vh",overflowY:"auto",background:"#fff",borderRadius:16,zIndex:600,
        boxShadow:"0 24px 64px rgba(0,0,0,0.2)",fontFamily:"inherit" }}>
        <div style={{ padding:"18px 24px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
          <div style={{ fontSize:15,fontWeight:800,color:C.navy }}>⚡ {initial?"Edit":"New"} Automation Rule</div>
          <button onClick={onCancel} style={{ width:26,height:26,borderRadius:"50%",border:`1px solid ${C.border}`,background:"#F8FAFC",color:C.muted,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>×</button>
        </div>
        <div style={{ padding:"20px 24px",display:"flex",flexDirection:"column",gap:14 }}>
          {/* Name */}
          <div>
            <label style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:5 }}>Rule Name *</label>
            <input value={form.name} onChange={e=>f("name",e.target.value)} placeholder="e.g. New Contact Assigned"
              style={{ width:"100%",padding:"9px 12px",borderRadius:8,border:`1.5px solid ${C.border}`,fontSize:13,fontFamily:"inherit",boxSizing:"border-box",outline:"none" }}/>
          </div>
          {/* Trigger — only events that don't yet have a rule are selectable (one rule per event) */}
          <div>
            <label style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:6 }}>Trigger Event *</label>
            <div style={{ position:"relative" }}>
              <select value={form.trigger} onChange={e=>f("trigger",e.target.value)}
                style={{ width:"100%",padding:"10px 32px 10px 12px",borderRadius:9,
                  border:`1.5px solid ${form.trigger?C.primary:C.border}`,
                  background:form.trigger?"#F8FAFF":"#fff",
                  color:form.trigger?C.navy:C.muted,
                  fontSize:13,fontFamily:"inherit",appearance:"none",cursor:"pointer",outline:"none",
                  fontWeight:form.trigger?700:400 }}>
                <option value="">— Select a trigger event —</option>
                {AUTOMATION_TRIGGERS.map(group=>{
                  const items = group.items.filter(t => !(takenTriggers && takenTriggers.has(t.key)));
                  if (items.length===0) return null;
                  return (
                    <optgroup key={group.group} label={group.group}>
                      {items.map(t=>(
                        <option key={t.key} value={t.key}>{t.icon} {t.label}</option>
                      ))}
                    </optgroup>
                  );
                })}
              </select>
              <div style={{ position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",
                pointerEvents:"none",fontSize:11,color:form.trigger?C.navy:C.muted }}>▼</div>
            </div>
            {form.trigger && (() => {
              const trig = AUTOMATION_TRIGGERS.flatMap(g=>g.items).find(t=>t.key===form.trigger);
              return trig ? (
                <div style={{ marginTop:6,padding:"8px 12px",borderRadius:8,
                  background:"#F0FDF4",border:`1px solid ${C.green}30`,
                  display:"flex",alignItems:"center",gap:8,fontSize:11 }}>
                  <span style={{ fontSize:16 }}>{trig.icon}</span>
                  <div>
                    <div style={{ fontWeight:700,color:C.green }}>{trig.label}</div>
                    <div style={{ color:C.muted,marginTop:1 }}>{trig.desc}</div>
                  </div>
                </div>
              ) : null;
            })()}
            {isNotReachedTrigger && (
              <div style={{ marginTop:8,padding:"10px 12px",borderRadius:8,background:"#FFF7ED",border:`1px solid ${C.amber}40`,display:"flex",alignItems:"center",gap:10 }}>
                <div style={{ flex:1,fontSize:11,color:C.text }}>Not-Reached threshold — failed attempts before the final not-reached track fires.</div>
                <input type="number" min={1} max={20} value={form.threshold}
                  onChange={e=>f("threshold",Math.max(1,Math.min(20,parseInt(e.target.value,10)||1)))}
                  style={{ width:60,padding:"7px 10px",borderRadius:7,border:`1.5px solid ${C.border}`,fontSize:13,fontWeight:700,textAlign:"center",fontFamily:"inherit",outline:"none" }}/>
                <span style={{ fontSize:11,color:C.muted }}>attempts</span>
              </div>
            )}
          </div>
          {/* Actions */}
          <div>
            <label style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:8 }}>Actions * (select at least one)</label>
            <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
              {/* Set Status */}
              <div style={{ borderRadius:10,border:`1.5px solid ${form.setStatus?"#0EA5E9":C.border}`,overflow:"hidden" }}>
                <div onClick={()=>f("setStatus",!form.setStatus)}
                  style={{ display:"flex",alignItems:"center",gap:12,padding:"11px 14px",background:form.setStatus?"#0EA5E908":"#F8FAFC",cursor:"pointer" }}>
                  <div style={{ width:20,height:20,borderRadius:5,border:`2px solid ${form.setStatus?"#0EA5E9":C.border}`,background:form.setStatus?"#0EA5E9":"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#fff",flexShrink:0 }}>{form.setStatus?"✓":""}</div>
                  <span style={{ fontSize:15 }}>🔄</span>
                  <div style={{ flex:1 }}><div style={{ fontSize:12,fontWeight:700,color:form.setStatus?"#0EA5E9":C.text }}>Set the lead's status</div><div style={{ fontSize:10,color:C.muted }}>Moves the lead to a status defined in Settings → Statuses</div></div>
                </div>
                {form.setStatus && (
                  <div style={{ padding:"12px 14px",borderTop:"1px solid #0EA5E920",background:"#fff" }}>
                    <label style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:6 }}>Move lead to</label>
                    <div style={{ position:"relative" }}>
                      <select value={form.setStatusKey} onChange={e=>f("setStatusKey",e.target.value)}
                        style={{ width:"100%",padding:"8px 30px 8px 12px",borderRadius:8,border:`1.5px solid ${form.setStatusKey?"#0EA5E9":C.border}`,fontSize:12,fontFamily:"inherit",appearance:"none",outline:"none",background:"#fff",color:form.setStatusKey?C.navy:C.muted }}>
                        <option value="">— Select status —</option>
                        {LIFECYCLE_STORE.map(stage=>(
                          <optgroup key={stage.id} label={stage.nameEn}>
                            {stage.statuses.map(st=><option key={st.key||st.id} value={st.key||st.id}>{st.nameEn} ({st.nameDe})</option>)}
                          </optgroup>
                        ))}
                      </select>
                      <div style={{ position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",pointerEvents:"none",fontSize:10,color:C.muted }}>▼</div>
                    </div>
                  </div>
                )}
              </div>
              {/* Email */}
              <div style={{ borderRadius:10,border:`1.5px solid ${form.sendEmail?C.blue:C.border}`,overflow:"hidden" }}>
                <div onClick={()=>f("sendEmail",!form.sendEmail)}
                  style={{ display:"flex",alignItems:"center",gap:12,padding:"11px 14px",background:form.sendEmail?C.blue+"08":"#F8FAFC",cursor:"pointer" }}>
                  <div style={{ width:20,height:20,borderRadius:5,border:`2px solid ${form.sendEmail?C.blue:C.border}`,background:form.sendEmail?C.blue:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#fff",flexShrink:0 }}>{form.sendEmail?"✓":""}</div>
                  <span style={{ fontSize:15 }}>✉️</span>
                  <div style={{ flex:1 }}><div style={{ fontSize:12,fontWeight:700,color:form.sendEmail?C.blue:C.text }}>Send email to lead automatically</div><div style={{ fontSize:10,color:C.muted }}>System sends an email template to the lead</div></div>
                </div>
                {form.sendEmail && (
                  <div style={{ padding:"12px 14px",borderTop:`1px solid ${C.blue}20`,background:"#fff",display:"flex",flexDirection:"column",gap:12 }}>
                    {/* Recipients — lead and/or internal roles */}
                    <div>
                      <label style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:6 }}>Send to</label>
                      <button type="button" onClick={()=>f("emailToLead",!form.emailToLead)}
                        style={{ padding:"6px 14px",borderRadius:20,border:`1.5px solid ${form.emailToLead?C.blue:C.border}`,background:form.emailToLead?C.blue:"#fff",color:form.emailToLead?"#fff":C.muted,fontSize:11,fontWeight:form.emailToLead?700:400,cursor:"pointer",fontFamily:"inherit" }}>
                        {form.emailToLead?"✓ ":""}👤 Contact (journey email)
                      </button>
                      {form.emailToLead && leadEmailWarning && (
                        <div style={{ marginTop:8,padding:"8px 12px",borderRadius:8,background:C.red+"0A",border:`1px solid ${C.red}40`,display:"flex",gap:8,fontSize:11,color:C.text,lineHeight:1.45 }}>
                          <span style={{ fontSize:14,flexShrink:0 }}>⚠️</span>
                          <div><span style={{ fontWeight:700,color:C.red }}>Compliance warning. </span>{leadEmailWarning}</div>
                        </div>
                      )}
                      <div style={{ marginTop:10 }}>
                        <label style={{ fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:6 }}>Also email internal roles (optional)</label>
                        <RoleChips value={form.emailRoles} onChange={v=>f("emailRoles",v)} activeColor={C.blue}/>
                      </div>
                      {!emailValid && <div style={{ marginTop:8,fontSize:10,fontWeight:700,color:C.red }}>Choose at least one recipient (lead or a role).</div>}
                    </div>
                    {/* Contact journey config — only when the lead is a recipient */}
                    {form.emailToLead && (<>
                    {/* Journey selector — system auto-matches lead language */}
                    <label style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:6 }}>
                      Email Journey (auto-match lead language)
                    </label>
                    <div style={{ position:"relative" }}>
                      <select value={form.emailJourney||""} onChange={e=>f("emailJourney",e.target.value||null)}
                        style={{ width:"100%",padding:"8px 30px 8px 12px",borderRadius:8,
                          border:`1.5px solid ${form.emailJourney?C.blue:C.border}`,
                          fontSize:12,fontFamily:"inherit",appearance:"none",outline:"none",background:"#fff",
                          color:form.emailJourney?C.navy:C.muted }}>
                        <option value="">— Select journey —</option>
                        {journeyOptions.map(j => (
                          <option key={j} value={j}>{(JOURNEY_META[j]?.label) || j} ({journeyTemplateCount[j]} template{journeyTemplateCount[j]===1?"":"s"})</option>
                        ))}
                      </select>
                      <div style={{ position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",pointerEvents:"none",fontSize:10,color:C.muted }}>▼</div>
                    </div>

                    {/* Preview — show what each language will send */}
                    {form.emailJourney && (()=>{
                      const deTpls = EMAIL_TEMPLATES_STORE.filter(t=>t.journey===form.emailJourney&&t.lang==="de"&&t.published!==false);
                      const enTpls = EMAIL_TEMPLATES_STORE.filter(t=>t.journey===form.emailJourney&&t.lang==="en"&&t.published!==false);
                      const deInactive = EMAIL_TEMPLATES_STORE.filter(t=>t.journey===form.emailJourney&&t.lang==="de"&&t.published===false);
                      const enInactive = EMAIL_TEMPLATES_STORE.filter(t=>t.journey===form.emailJourney&&t.lang==="en"&&t.published===false);
                      return (
                        <div style={{ marginTop:8,display:"flex",flexDirection:"column",gap:6 }}>
                          <div style={{ fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em" }}>
                            How it resolves at send time:
                          </div>
                          {/* DE */}
                          <div style={{ padding:"8px 12px",borderRadius:8,
                            background:deTpls.length>0?"#FFF7ED":"#FFF5F5",
                            border:`1px solid ${deTpls.length>0?C.amber+"40":C.red+"30"}`,
                            display:"flex",alignItems:"center",gap:8,fontSize:11 }}>
                            <span>🇩🇪</span>
                            {deTpls.length>0
                              ? <><span style={{ fontWeight:600,color:C.amber }}>German lead</span><span style={{ color:C.muted }}>→</span><span style={{ color:C.text }}>{deTpls[0].name}</span></>
                              : deInactive.length>0
                                ? <><span style={{ fontWeight:600,color:C.red }}>German lead</span><span style={{ color:C.muted }}>→</span><span style={{ color:C.red }}>⚠️ {deInactive[0].name} (inactive)</span></>
                                : <><span style={{ fontWeight:600,color:C.red }}>German lead</span><span style={{ color:C.red }}>→ No DE template found — email will not send</span></>}
                          </div>
                          {/* EN */}
                          <div style={{ padding:"8px 12px",borderRadius:8,
                            background:enTpls.length>0?"#EFF6FF":"#FFF5F5",
                            border:`1px solid ${enTpls.length>0?C.blue+"30":C.red+"30"}`,
                            display:"flex",alignItems:"center",gap:8,fontSize:11 }}>
                            <span>🇬🇧</span>
                            {enTpls.length>0
                              ? <><span style={{ fontWeight:600,color:C.blue }}>English lead</span><span style={{ color:C.muted }}>→</span><span style={{ color:C.text }}>{enTpls[0].name}</span></>
                              : <><span style={{ fontWeight:600,color:C.amber }}>English lead</span><span style={{ color:C.muted }}>→ no EN template, </span><span style={{ color:C.amber }}>falls back to DE: {deTpls[0]?.name||"none"}</span></>}
                          </div>
                        </div>
                      );
                    })()}
                    <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:8 }}>
                      <div><label style={{ fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",display:"block",marginBottom:4 }}>Delay</label><input type="number" min="0" value={form.delay} onChange={e=>f("delay",Number(e.target.value))} style={{ width:"100%",padding:"7px 10px",borderRadius:7,border:`1px solid ${C.border}`,fontSize:12,fontFamily:"inherit",boxSizing:"border-box",outline:"none" }}/></div>
                      <div><label style={{ fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",display:"block",marginBottom:4 }}>Unit</label>
                        <div style={{ position:"relative" }}><select value={form.delayUnit} onChange={e=>f("delayUnit",e.target.value)} style={{ width:"100%",padding:"7px 28px 7px 10px",borderRadius:7,border:`1px solid ${C.border}`,fontSize:12,fontFamily:"inherit",appearance:"none",outline:"none",background:"#fff" }}>{["minutes","hours","days"].map(u=><option key={u} value={u}>{u}</option>)}</select><div style={{ position:"absolute",right:6,top:"50%",transform:"translateY(-50%)",pointerEvents:"none",fontSize:10,color:C.muted }}>▼</div></div>
                      </div>
                    </div>
                    </>)}
                  </div>
                )}
              </div>
              {/* Task */}
              <div style={{ borderRadius:10,border:`1.5px solid ${form.createTask?"#D97706":C.border}`,overflow:"hidden" }}>
                <div onClick={()=>f("createTask",!form.createTask)}
                  style={{ display:"flex",alignItems:"center",gap:12,padding:"11px 14px",background:form.createTask?"#D9770608":"#F8FAFC",cursor:"pointer" }}>
                  <div style={{ width:20,height:20,borderRadius:5,border:`2px solid ${form.createTask?"#D97706":C.border}`,background:form.createTask?"#D97706":"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#fff",flexShrink:0 }}>{form.createTask?"✓":""}</div>
                  <span style={{ fontSize:15 }}>✅</span>
                  <div style={{ flex:1 }}><div style={{ fontSize:12,fontWeight:700,color:form.createTask?"#D97706":C.text }}>Create a task</div><div style={{ fontSize:10,color:C.muted }}>Adds a task (Call / Email / Note) for the selected role(s)</div></div>
                </div>
                {form.createTask && (
                  <div style={{ padding:"12px 14px",borderTop:"1px solid #D9770620",background:"#fff",display:"flex",flexDirection:"column",gap:10 }}>
                    <div><label style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:5 }}>Assign to</label>
                      <RoleChips value={form.taskRoles} onChange={v=>f("taskRoles",v)} activeColor="#D97706"/>
                      {!taskValid && <div style={{ marginTop:6,fontSize:10,fontWeight:700,color:C.red }}>Select at least one role to assign the task to.</div>}
                    </div>
                    <div><label style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:5 }}>Task type</label>
                      <div style={{ display:"flex",gap:6 }}>{[["call","📞 Call"],["email","✉️ Email"],["note","📝 Note"]].map(([k,l])=>(
                        <button key={k} onClick={()=>f("taskType",k)} style={{ flex:1,padding:"7px",borderRadius:7,border:`1.5px solid ${form.taskType===k?"#D97706":C.border}`,background:form.taskType===k?"#D9770610":"#fff",color:form.taskType===k?"#D97706":C.muted,fontSize:11,fontWeight:form.taskType===k?700:400,cursor:"pointer",fontFamily:"inherit" }}>{l}</button>
                      ))}</div>
                    </div>
                    <div><label style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:5 }}>Task title</label>
                      <input value={form.taskTitle||""} onChange={e=>f("taskTitle",e.target.value)} placeholder="e.g. Follow up with {contact} within 24h"
                        style={{ width:"100%",padding:"8px 12px",borderRadius:8,border:`1.5px solid ${C.border}`,fontSize:12,fontFamily:"inherit",boxSizing:"border-box",outline:"none" }}/>
                      <div style={{ fontSize:10,color:C.muted,marginTop:3 }}>Use {"{contact}"} to insert the contact name automatically</div>
                    </div>
                    <div><label style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:5 }}>Priority</label>
                      <div style={{ display:"flex",gap:6 }}>{[["high","🔴 High"],["normal","🟡 Normal"],["low","⚪ Low"]].map(([k,l])=>(
                        <button key={k} onClick={()=>f("taskPriority",k)} style={{ flex:1,padding:"6px",borderRadius:7,border:`1.5px solid ${form.taskPriority===k?"#D97706":C.border}`,background:form.taskPriority===k?"#D9770610":"#fff",color:form.taskPriority===k?"#D97706":C.muted,fontSize:11,fontWeight:form.taskPriority===k?700:400,cursor:"pointer",fontFamily:"inherit" }}>{l}</button>
                      ))}</div>
                    </div>
                    {/* Relative due date — rules fire at unknown future times, so the due date is relative */}
                    <div><label style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:5 }}>Due date</label>
                      <div style={{ display:"flex",alignItems:"center",gap:8,flexWrap:"wrap" }}>
                        <input type="number" min={0} value={form.taskDueValue}
                          onChange={e=>f("taskDueValue",Math.max(0,parseInt(e.target.value,10)||0))}
                          style={{ width:64,padding:"7px 10px",borderRadius:7,border:`1.5px solid ${C.border}`,fontSize:12,fontWeight:700,textAlign:"center",fontFamily:"inherit",outline:"none" }}/>
                        <div style={{ position:"relative" }}>
                          <select value={form.taskDueUnit} onChange={e=>f("taskDueUnit",e.target.value)}
                            style={{ padding:"7px 28px 7px 10px",borderRadius:7,border:`1.5px solid ${C.border}`,fontSize:12,fontFamily:"inherit",appearance:"none",outline:"none",background:"#fff" }}>
                            {["hours","days","weeks"].map(u=><option key={u} value={u}>{u}</option>)}
                          </select>
                          <div style={{ position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",pointerEvents:"none",fontSize:10,color:C.muted }}>▼</div>
                        </div>
                        <span style={{ fontSize:11,color:C.muted }}>after the trigger fires</span>
                      </div>
                      <div style={{ fontSize:10,color:C.muted,marginTop:3 }}>0 = due the same day the rule fires.</div>
                    </div>
                    {/* Embedded reminder for the task */}
                    <div style={{ borderRadius:8,border:`1px solid ${C.border}`,padding:"10px 12px",background:"#FAFAFA" }}>
                      <div onClick={()=>f("taskRemind",!form.taskRemind)} style={{ display:"flex",alignItems:"center",gap:10,cursor:"pointer" }}>
                        <div style={{ width:18,height:18,borderRadius:5,border:`2px solid ${form.taskRemind?"#D97706":C.border}`,background:form.taskRemind?"#D97706":"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#fff",flexShrink:0 }}>{form.taskRemind?"✓":""}</div>
                        <span style={{ fontSize:14 }}>⏰</span>
                        <div style={{ flex:1,fontSize:12,fontWeight:700,color:form.taskRemind?"#D97706":C.text }}>Remind the assignee(s)</div>
                      </div>
                      {form.taskRemind && (
                        <div style={{ marginTop:8,paddingLeft:28 }}>
                          <div style={{ position:"relative" }}>
                            <select value={form.taskRemindLead} onChange={e=>f("taskRemindLead",e.target.value)}
                              style={{ width:"100%",padding:"7px 28px 7px 10px",borderRadius:7,border:`1px solid ${C.border}`,fontSize:12,fontFamily:"inherit",appearance:"none",outline:"none",background:"#fff" }}>
                              {["at due time","15 minutes before","1 hour before","1 day before","2 days before"].map(o=><option key={o} value={o}>{o}</option>)}
                            </select>
                            <div style={{ position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",pointerEvents:"none",fontSize:10,color:C.muted }}>▼</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              {/* Push */}
              <div style={{ borderRadius:10,border:`1.5px solid ${form.sendPush?C.green:C.border}`,overflow:"hidden" }}>
                <div onClick={()=>f("sendPush",!form.sendPush)}
                  style={{ display:"flex",alignItems:"center",gap:12,padding:"11px 14px",background:form.sendPush?C.green+"08":"#F8FAFC",cursor:"pointer" }}>
                  <div style={{ width:20,height:20,borderRadius:5,border:`2px solid ${form.sendPush?C.green:C.border}`,background:form.sendPush?C.green:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#fff",flexShrink:0 }}>{form.sendPush?"✓":""}</div>
                  <span style={{ fontSize:15 }}>📱</span>
                  <div style={{ flex:1 }}><div style={{ fontSize:12,fontWeight:700,color:form.sendPush?C.green:C.text }}>Send push notification</div><div style={{ fontSize:10,color:C.muted }}>Instant alert on the selected role(s)' phone</div></div>
                </div>
                {form.sendPush && (
                  <div style={{ padding:"12px 14px",borderTop:`1px solid ${C.green}20`,background:"#fff" }}>
                    <label style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:6 }}>Send to</label>
                    <RoleChips value={form.pushRoles} onChange={v=>f("pushRoles",v)} activeColor={C.green}/>
                    {!pushValid && <div style={{ marginTop:6,fontSize:10,fontWeight:700,color:C.red }}>Select at least one role to notify.</div>}
                  </div>
                )}
              </div>
            </div>
            {!anyAction && <div style={{ marginTop:8,fontSize:11,fontWeight:600,color:C.muted }}>Select at least one action for this rule.</div>}
          </div>
          {/* Description */}
          <div>
            <label style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:5 }}>Description (internal note)</label>
            <textarea value={form.description||""} onChange={e=>f("description",e.target.value)} rows={2} placeholder="Explain when and why this rule fires…"
              style={{ width:"100%",padding:"9px 12px",borderRadius:8,border:`1.5px solid ${C.border}`,fontSize:12,fontFamily:"inherit",boxSizing:"border-box",resize:"none",outline:"none",lineHeight:1.5 }}/>
          </div>
          {/* Footer */}
          <div style={{ display:"flex",gap:10,paddingTop:4 }}>
            <button onClick={onCancel} style={{ flex:1,padding:"10px",borderRadius:9,border:`1px solid ${C.border}`,background:"#fff",color:C.slate,fontSize:13,fontWeight:600,cursor:"pointer" }}>Cancel</button>
            <button onClick={()=>canSave&&onSave({ ...form, category: TRIGGER_CATEGORY[form.trigger] || "contact" })} disabled={!canSave}
              style={{ flex:2,padding:"10px",borderRadius:9,border:"none",background:canSave?C.primary:"#E2E8F0",color:canSave?"#fff":C.muted,fontSize:13,fontWeight:700,cursor:canSave?"pointer":"default" }}>
              ⚡ {initial?"Save changes":"Create Rule"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};


// ─── Unified Workflow & Automation Section ────────────────────────────────────
