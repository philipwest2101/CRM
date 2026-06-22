import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { RuleEditor } from "./rule-editor";
import { Card } from "../ui/card";
import { AUTOMATION_TRIGGERS, CATEGORIES, EMAIL_TEMPLATES_STORE, LIFECYCLE_STORE, STATUS_META, WORKFLOW_RULES_STORE } from "../../lib/core";
import { C } from "../../theme";

export const WorkflowRulesSection = ({ role }) => {
  const [rules, setRules] = useState(WORKFLOW_RULES_STORE);
  const [editId, setEditId] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [testLog, setTestLog] = useState([]);
  const [catFilter, setCatFilter] = useState("all");

  const persist = (updated) => {
    setRules(updated);
    WORKFLOW_RULES_STORE.splice(0, WORKFLOW_RULES_STORE.length, ...updated);
  };

  const toggleRule = (id) => persist(rules.map(r => r.id===id ? {...r, active:!r.active} : r));
  const deleteRule = (id) => { if(window.confirm("Delete this rule? Its trigger event will become available again.")) persist(rules.filter(r => r.id!==id)); };
  // Super Admin defines every rule. Each trigger event can have at most one rule;
  // the editor only offers events that don't already have one.
  const saveRule   = (rule) => {
    if (editId) persist(rules.map(r => r.id===editId ? {...rule, id:editId} : r));
    else        persist([...rules, {...rule, id:`wf${Date.now()}`, active:true}]);
    setEditId(null); setShowNew(false);
  };

  const allTriggers = AUTOMATION_TRIGGERS.flatMap(g => g.items.map(t => ({...t, groupColor:g.color})));
  const getTrigger  = (key) => allTriggers.find(t => t.key===key) || { label:key, icon:"⚡", groupColor:C.navy };
  const shown = catFilter==="all" ? rules : rules.filter(r => r.category===catFilter);
  // One rule per trigger event: events already used aren't offered again.
  const usedTriggerKeys = new Set(rules.map(r => r.trigger));
  const availableCount  = allTriggers.length - usedTriggerKeys.size;

  // Status coverage check (item: notify Super Admin about statuses unused by automation).
  // A rule "covers" a status via an explicit set_status action, or — for legacy rules —
  // via the status its trigger implies.
  const TRIGGER_SETS_STATUS = { lead_not_reached_1_4:"attempted", lead_not_reached_5:"not_reached",
    lead_not_interested:"no_interest", appointment_scheduled:"appointment", lead_closed:"closed",
    lead_followup:"followup", new_lead_submitted:"open", consent_withdrawn:"dnc" };
  const coveredKeys = new Set();
  rules.forEach(r => {
    if ((r.setStatus || (r.actions||[]).includes("set_status")) && r.setStatusKey) coveredKeys.add(r.setStatusKey);
    else if (TRIGGER_SETS_STATUS[r.trigger]) coveredKeys.add(TRIGGER_SETS_STATUS[r.trigger]);
  });
  const allStatuses = LIFECYCLE_STORE.flatMap(s => s.statuses).filter(st => st.key);
  const unreachableStatuses = allStatuses.filter(st => !coveredKeys.has(st.key) && !st.manual && !(st.flags||[]).includes("isNewDefault"));
  const manualOnlyStatuses  = allStatuses.filter(st => !coveredKeys.has(st.key) && st.manual);

  return (
    <div>
      {/* Header */}
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6 }}>
        <div>
          <div style={{ fontSize:20,fontWeight:800,color:C.navy,marginBottom:4 }}>⚡ Workflow & Automation</div>
          <div style={{ fontSize:12,color:C.muted,maxWidth:600,lineHeight:1.6 }}>
            Super Admin defines the automation — one rule per trigger event. A rule can set the lead's status, send an email, create a task for the consultant, and/or fire a push notification. Once an event has a rule it's no longer offered when adding the next one. Statuses are defined in Settings → Statuses.
          </div>
        </div>
        <button onClick={()=>{ if(availableCount>0){ setEditId(null); setShowNew(true); } }}
          disabled={availableCount===0}
          title={availableCount===0 ? "Every trigger event already has a rule" : "Define a rule for a trigger event"}
          style={{ padding:"8px 18px",borderRadius:8,border:"none",
            background:availableCount===0?"#E2E8F0":C.primary, color:availableCount===0?C.muted:"#fff",
            fontSize:12,fontWeight:700,cursor:availableCount===0?"default":"pointer",flexShrink:0,marginLeft:16 }}>
          + New Rule{availableCount>0 ? ` (${availableCount} event${availableCount===1?"":"s"} left)` : ""}
        </button>
      </div>

      {/* Status coverage check — surfaces statuses no automation touches */}
      {unreachableStatuses.length>0 && (
        <div style={{ marginTop:14,padding:"12px 16px",borderRadius:10,background:C.red+"0A",border:`1px solid ${C.red}40` }}>
          <div style={{ fontSize:12,fontWeight:800,color:C.red,marginBottom:4 }}>⚠️ {unreachableStatuses.length} status{unreachableStatuses.length===1?"":"es"} unreachable</div>
          <div style={{ fontSize:11,color:C.text,lineHeight:1.5 }}>
            No rule sets {unreachableStatuses.length===1?"this status":"these statuses"} and {unreachableStatuses.length===1?"it isn't":"they aren't"} manually selectable, so {unreachableStatuses.length===1?"a lead can":"leads can"} never enter {unreachableStatuses.length===1?"it":"them"}: {unreachableStatuses.map(s=>s.nameEn).join(", ")}. Add a rule with a “Set status” action, or mark them manually selectable in Settings → Statuses.
          </div>
        </div>
      )}
      {unreachableStatuses.length===0 && manualOnlyStatuses.length>0 && (
        <div style={{ marginTop:14,padding:"12px 16px",borderRadius:10,background:C.amber+"0A",border:`1px solid ${C.amber}40` }}>
          <div style={{ fontSize:12,fontWeight:800,color:C.amber,marginBottom:4 }}>ℹ️ {manualOnlyStatuses.length} status{manualOnlyStatuses.length===1?"":"es"} set manually only</div>
          <div style={{ fontSize:11,color:C.text,lineHeight:1.5 }}>
            No automated workflow sets {manualOnlyStatuses.length===1?"this status":"these statuses"} — {manualOnlyStatuses.length===1?"it's":"they're"} reached only when a consultant sets {manualOnlyStatuses.length===1?"it":"them"} by hand: {manualOnlyStatuses.map(s=>s.nameEn).join(", ")}. That may be intentional; add a rule if you want automation to handle {manualOnlyStatuses.length===1?"it":"them"}.
          </div>
        </div>
      )}
      {unreachableStatuses.length===0 && manualOnlyStatuses.length===0 && (
        <div style={{ marginTop:14,padding:"10px 16px",borderRadius:10,background:C.green+"0A",border:`1px solid ${C.green}30`,fontSize:11,fontWeight:700,color:C.green }}>
          ✓ Every status is reachable — covered by a workflow, manual entry, or new-lead default.
        </div>
      )}

      {/* How it works explainer */}
      <div style={{ display:"flex",gap:8,marginTop:14,marginBottom:18,padding:"12px 16px",borderRadius:10,background:"#F8FAFC",border:`1px solid ${C.border}`,alignItems:"flex-start" }}>
        {[
          { icon:"⚡", color:C.navy,    label:"Trigger", desc:"A CRM event fires the rule (new lead, call logged, appointment set…)" },
          { icon:"🔄", color:"#0EA5E9", label:"→ Set status", desc:"Moves the lead to a configured status" },
          { icon:"✉️", color:C.blue,    label:"→ Email", desc:"System auto-sends an email template to the lead" },
          { icon:"✅", color:"#D97706", label:"→ Task", desc:"Creates a task (with optional reminder) for the consultant" },
          { icon:"📱", color:C.green,   label:"→ Push", desc:"Sends a push notification to the consultant" },
        ].map((s,i)=>(
          <div key={s.label} style={{ display:"flex",alignItems:"center",gap:6,flex:1 }}>
            {i>0 && <div style={{ fontSize:14,color:C.muted,flexShrink:0 }}>→</div>}
            <div style={{ padding:"7px 10px",borderRadius:8,background:s.color+"10",border:`1px solid ${s.color}25`,flex:1 }}>
              <div style={{ fontSize:13,marginBottom:2 }}>{s.icon}</div>
              <div style={{ fontSize:11,fontWeight:700,color:s.color }}>{s.label}</div>
              <div style={{ fontSize:10,color:C.muted,lineHeight:1.3,marginTop:2 }}>{s.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Category filter */}
      <div style={{ display:"flex",gap:6,marginBottom:16,flexWrap:"wrap" }}>
        {CATEGORIES.map(c=>(
          <button key={c.id} onClick={()=>setCatFilter(c.id)}
            style={{ padding:"5px 14px",borderRadius:20,border:`1px solid ${catFilter===c.id?C.primary:C.border}`,
              background:catFilter===c.id?C.primary:"#fff",color:catFilter===c.id?"#fff":C.muted,
              fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>{c.label}</button>
        ))}
      </div>

      {/* Rules list */}
      <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
        {shown.map(r=>{
          const trig = getTrigger(r.trigger);
          const hasEmail    = r.sendEmail || (r.actions||[]).includes("auto_email");
          const hasStatus   = r.setStatus || (r.actions||[]).includes("set_status");
          const hasTask     = r.createTask || r.createReminder || (r.actions||[]).includes("reminder") || (r.actions||[]).includes("task");
          const hasPush     = r.sendPush     || (r.actions||[]).includes("push");
          const statusMeta  = hasStatus && r.setStatusKey ? STATUS_META[r.setStatusKey] : null;
          const tpl = hasEmail ? EMAIL_TEMPLATES_STORE.find(t=>t.id===r.emailTemplateId) : null;
          return (
            <div key={r.id} style={{ borderRadius:12,border:`1px solid ${r.active?C.border:"#F1F5F9"}`,
              background:r.active?"#fff":"#FAFAFA",overflow:"hidden",opacity:r.active?1:0.65 }}>

              {/* Card header */}
              <div style={{ display:"flex",alignItems:"center",gap:12,padding:"13px 18px",
                borderBottom:r.active?`1px solid ${C.border}`:"none",
                background:r.active?"#fff":"#F8FAFC" }}>
                <div style={{ width:34,height:34,borderRadius:9,background:trig.groupColor+"15",
                  border:`1px solid ${trig.groupColor}25`,display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:16,flexShrink:0 }}>{trig.icon}</div>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ fontSize:13,fontWeight:800,color:C.text }}>{r.name}</div>
                  <div style={{ fontSize:11,color:C.muted,marginTop:1 }}>Trigger: {trig.label}</div>
                </div>

                {/* Action pills */}
                <div style={{ display:"flex",gap:5,flexShrink:0,flexWrap:"wrap" }}>
                  {hasEmail    && <span style={{ fontSize:9,fontWeight:800,padding:"3px 8px",borderRadius:8,background:C.blue+"15",color:C.blue,textTransform:"uppercase" }}>✉️ Email</span>}
                  {hasStatus   && <span style={{ fontSize:9,fontWeight:800,padding:"3px 8px",borderRadius:8,background:"#0EA5E915",color:"#0EA5E9",textTransform:"uppercase" }}>🔄 {statusMeta?statusMeta.label:"Status"}</span>}
                  {hasTask     && <span style={{ fontSize:9,fontWeight:800,padding:"3px 8px",borderRadius:8,background:"#D9770615",color:"#D97706",textTransform:"uppercase" }}>✅ Task</span>}
                  {hasPush     && <span style={{ fontSize:9,fontWeight:800,padding:"3px 8px",borderRadius:8,background:C.green+"15",color:C.green,textTransform:"uppercase" }}>📱 Push</span>}
                  {/* Inactive template warning badge */}
                  {hasEmail && tpl && tpl.published===false && (
                    <span title="Template is inactive — email will not send" style={{ fontSize:9,fontWeight:800,padding:"3px 8px",borderRadius:8,background:C.red+"15",color:C.red,textTransform:"uppercase",display:"flex",alignItems:"center",gap:3 }}>
                      ⚠️ Template inactive
                    </span>
                  )}
                  {/* Missing template warning */}
                  {hasEmail && !tpl && (
                    <span style={{ fontSize:9,fontWeight:800,padding:"3px 8px",borderRadius:8,background:C.red+"15",color:C.red,textTransform:"uppercase" }}>
                      ⚠️ No template
                    </span>
                  )}
                </div>

                {/* Edit / Delete — always available (Super Admin), works for inactive rules too */}
                <button onClick={()=>{ setEditId(r.id); setShowNew(true); }} title="Edit rule"
                  style={{ padding:"5px 10px",borderRadius:7,border:`1px solid ${C.border}`,background:"#fff",color:C.slate,fontSize:11,fontWeight:600,cursor:"pointer",flexShrink:0 }}>✏️ Edit</button>
                <button onClick={()=>deleteRule(r.id)} title="Delete rule"
                  style={{ padding:"5px 10px",borderRadius:7,border:`1px solid ${C.red}30`,background:C.red+"06",color:C.red,fontSize:11,fontWeight:600,cursor:"pointer",flexShrink:0 }}>🗑 Delete</button>

                {/* Toggle — blocked if template is inactive */}
                <div onClick={()=>{
                  if(!r.active && hasEmail && tpl && tpl.published===false){
                    alert("Cannot activate: the email template is inactive.\nPlease reactivate the template in Settings → Email Templates first.");
                    return;
                  }
                  toggleRule(r.id);
                }}
                  style={{ width:38,height:22,borderRadius:11,background:r.active?C.green:"#CBD5E1",
                    cursor:"pointer",position:"relative",transition:"background 0.2s",flexShrink:0 }}>
                  <div style={{ position:"absolute",top:3,left:r.active?18:3,width:16,height:16,
                    borderRadius:"50%",background:"#fff",transition:"left 0.2s",boxShadow:"0 1px 3px rgba(0,0,0,0.2)" }}/>
                </div>
              </div>

              {/* Card body */}
              {r.active && (
                <div style={{ padding:"10px 18px 12px",display:"flex",alignItems:"flex-start",gap:14,flexWrap:"wrap" }}>
                  <div style={{ flex:1,fontSize:11,color:C.slate,lineHeight:1.5,minWidth:200 }}>
                    {r.description}
                    {(hasEmail) && (()=>{
                const journey = r.emailJourney;
                if (journey) {
                  const deTpl = EMAIL_TEMPLATES_STORE.find(t=>t.journey===journey&&t.lang==="de"&&t.published!==false);
                  const enTpl = EMAIL_TEMPLATES_STORE.find(t=>t.journey===journey&&t.lang==="en"&&t.published!==false);
                  return (
                    <div style={{ marginTop:4 }}>
                      <div style={{ fontSize:11,fontWeight:700,color:C.blue,marginBottom:3 }}>
                        ✉️ Journey: <span style={{ color:C.navy }}>{journey}</span> — auto-matches lead language
                      </div>
                      <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
                        <span style={{ fontSize:10,padding:"2px 8px",borderRadius:7,
                          background:deTpl?"#FFF7ED":"#FFF5F5",
                          color:deTpl?C.amber:C.red,border:`1px solid ${deTpl?C.amber+"30":C.red+"30"}` }}>
                          🇩🇪 {deTpl?deTpl.name:"No DE template"}
                        </span>
                        <span style={{ fontSize:10,padding:"2px 8px",borderRadius:7,
                          background:enTpl?"#EFF6FF":enTpl===undefined?"#FFF7ED":"#FFF5F5",
                          color:enTpl?C.blue:C.amber,border:`1px solid ${enTpl?C.blue+"30":C.amber+"30"}` }}>
                          🇬🇧 {enTpl?enTpl.name:"Falls back to DE"}
                        </span>
                      </div>
                    </div>
                  );
                }
                // legacy templateId
                if (tpl) return (
                  <div style={{ marginTop:4,display:"flex",alignItems:"center",gap:8 }}>
                    <span style={{ fontSize:11,color:tpl.published===false?C.red:C.blue,fontWeight:600 }}>
                      ✉️ {tpl.name}
                    </span>
                    <span style={{ fontSize:10,padding:"1px 7px",borderRadius:8,
                      background:tpl.lang==="en"?"#EFF6FF":"#FFF7ED",
                      color:tpl.lang==="en"?C.blue:C.amber,fontWeight:700 }}>
                      {tpl.lang==="en"?"🇬🇧 EN":"🇩🇪 DE"}
                    </span>
                    {tpl.published===false&&<span style={{ fontSize:10,color:C.red,fontWeight:700 }}>· inactive</span>}
                  </div>
                );
                return null;
              })()}
                    {hasTask && (r.taskTitle||r.reminderTitle) && <div style={{ marginTop:4,color:"#D97706",fontWeight:600 }}>✅ {r.taskTitle||r.reminderTitle}</div>}
                  </div>
                  <div style={{ display:"flex",gap:6,alignItems:"center",flexShrink:0 }}>
                    {hasEmail && r.emailToLead!==false && ((r.delay||0)===0
                      ? <span style={{ fontSize:10,fontWeight:700,color:C.green,padding:"2px 8px",borderRadius:8,background:C.green+"10",border:`1px solid ${C.green}25` }}>⚡ Email now</span>
                      : <span style={{ fontSize:10,fontWeight:700,color:C.muted,padding:"2px 8px",borderRadius:8,background:C.light,border:`1px solid ${C.border}` }}>⏱ Email +{r.delay} {r.delayUnit}</span>)}
                    {hasTask && <span style={{ fontSize:10,fontWeight:700,color:"#D97706",padding:"2px 8px",borderRadius:8,background:"#D9770610",border:`1px solid #D9770625` }}>📋 Due {(r.taskDueValue||0)===0?"same day":`+${r.taskDueValue} ${r.taskDueUnit}`}</span>}
                    {(() => {
                      const ab = ro => ({gp:"GP",vd:"VD",superadmin:"SA"}[ro]||ro);
                      const parts = [];
                      if (hasTask) parts.push(`📋 ${(r.taskRoles||["gp"]).map(ab).join("/")}`);
                      if (hasPush) parts.push(`📱 ${(r.pushRoles||["gp"]).map(ab).join("/")}`);
                      if (hasEmail && (r.emailRoles||[]).length) parts.push(`✉️ ${(r.emailRoles).map(ab).join("/")}`);
                      return <span style={{ fontSize:10,color:C.muted }}>{parts.length?parts.join(" · "):"→ Lead"}</span>;
                    })()}
                    <button onClick={()=>{
                      const actions=[]; const tpl=EMAIL_TEMPLATES_STORE.find(t=>t.id===r.emailTemplateId);
                      if(hasStatus && statusMeta) actions.push(`🔄 Status set: "${statusMeta.label}"`);
                      if(hasEmail) actions.push(`✉️ Email sent: "${tpl?.name||"template"}" → Test Lead`);
                      if(hasTask) actions.push(`✅ Task created: "${(r.taskTitle||r.reminderTitle)?.replace("{lead}","Test Lead")||r.name}"`);
                      if(hasPush) actions.push(`📱 Push: "${r.name} — Test Lead"`);
                      setTestLog(prev=>[{id:Date.now(),rule:r.name,trigger:trig.label,time:new Date().toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"}),actions,lead:"Test Lead (Anna Muster)"},...prev.slice(0,9)]);
                    }} style={{ padding:"5px 12px",borderRadius:7,border:`1px solid ${C.green}30`,background:C.green+"06",color:C.green,fontSize:11,fontWeight:600,cursor:"pointer" }}>▶ Test</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {shown.length===0 && (
          <div style={{ padding:"32px",textAlign:"center",color:C.muted,fontSize:12,fontStyle:"italic",background:"#F8FAFC",borderRadius:10,border:`1px dashed ${C.border}` }}>
            {rules.length===0
              ? 'No automation rules yet. Click "+ New Rule" to define a workflow for a trigger event.'
              : "No rules in this category."}
          </div>
        )}
      </div>

      {/* Live test log */}
      {testLog.length>0 && (
        <div style={{ marginTop:28 }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10 }}>
            <div style={{ fontSize:13,fontWeight:700,color:C.navy }}>⚡ Test Log</div>
            <button onClick={()=>setTestLog([])} style={{ padding:"4px 10px",borderRadius:7,border:`1px solid ${C.border}`,background:"#fff",color:C.muted,fontSize:11,fontWeight:600,cursor:"pointer" }}>Clear</button>
          </div>
          {testLog.map(e=>(
            <div key={e.id} style={{ borderRadius:10,border:`1px solid ${C.border}`,overflow:"hidden",marginBottom:8 }}>
              <div style={{ display:"flex",alignItems:"center",gap:10,padding:"9px 14px",background:"#F8FAFC",borderBottom:`1px solid ${C.border}` }}>
                <span style={{ fontSize:13 }}>⚡</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12,fontWeight:700,color:C.text }}>{e.rule}</div>
                  <div style={{ fontSize:10,color:C.muted }}>Trigger: {e.trigger} · Lead: {e.lead}</div>
                </div>
                <span style={{ fontSize:10,color:C.muted }}>{e.time}</span>
                <span style={{ fontSize:9,fontWeight:700,padding:"2px 8px",borderRadius:8,background:C.green+"15",color:C.green,textTransform:"uppercase" }}>Simulated</span>
              </div>
              <div style={{ padding:"9px 14px",display:"flex",flexDirection:"column",gap:4 }}>
                {e.actions.map((a,i)=>(
                  <div key={i} style={{ display:"flex",alignItems:"center",gap:8,fontSize:12,color:C.slate }}>
                    <span style={{ width:6,height:6,borderRadius:"50%",background:C.green,flexShrink:0 }}/>
                    {a}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rule editor modal */}
      {showNew && (
        <RuleEditor
          initial={editId ? rules.find(r=>r.id===editId) : null}
          takenTriggers={new Set(rules.filter(r=>r.id!==editId).map(r=>r.trigger))}
          onSave={saveRule}
          onCancel={()=>{ setShowNew(false); setEditId(null); }}
        />
      )}
    </div>
  );
};


