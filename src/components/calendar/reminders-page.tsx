import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Card } from "../ui/card";
import { SettingsCard } from "../ui/settings-card";
import { C } from "../../theme";

export const RemindersPage = ({ role, navigateTo, reminders:remindersFromRoot, setReminders:setRemindersFromRoot, addReminder }) => {
  // Use root-level reminders if passed in (so new reminders from any page appear here)
  const [_localReminders, _setLocalReminders] = useState([]);
  const reminders    = remindersFromRoot ?? _localReminders;
  const setReminders = setRemindersFromRoot ?? _setLocalReminders;

  const [filter,         setFilter]         = useState("all");
  const [statusFilter,   setStatusFilter]   = useState("all_status");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [editId,     setEditId]     = useState(null);
  const [deleteId,   setDeleteId]   = useState(null);
  // form state
  const [fTitle,    setFTitle]    = useState("");
  const [fDate,     setFDate]     = useState("");
  const [fTime,     setFTime]     = useState("");
  const [fRecur,    setFRecur]    = useState("none");
  const [fNote,     setFNote]     = useState("");
  const [fPush,     setFPush]     = useState(true);
  const [fInapp,    setFInapp]    = useState(true);
  const [fPriority, setFPriority] = useState("normal");
  const [fEntity,   setFEntity]   = useState("lead");
  const [fPrivacy,  setFPrivacy]  = useState("title_only");

  const typeColor    = { manual:"#3B82F6", workflow:"#7C3AED", template:"#D97706" };
  const priorityColor= { high:C.red, normal:C.amber, low:C.muted };
  const priorityIcon = { high:"🔴", normal:"🟡", low:"⚪" };
  const typeLabel  = { manual:"Manual",  workflow:"Workflow", template:"Template" };
  const statusColor= { pending:C.amber,  active:C.green,     completed:C.muted  };

  const resetForm = () => { setFTitle(""); setFDate(""); setFTime(""); setFRecur("none"); setFNote(""); setFPush(true); setFInapp(true); setFPriority("normal"); setFEntity("lead"); setFPrivacy("title_only"); };
  const openCreate = () => { resetForm(); setEditId(null); setShowCreate(true); };
  const openEdit   = (r) => { setFTitle(r.title); setFDate(r.date); setFTime(r.time); setFRecur(r.recur==="Once"?"none":r.recur.toLowerCase()); setFNote(""); setFPush(r.channels.includes("push")); setFInapp(r.channels.includes("inapp")); setFPriority(r.priority||"normal"); setFEntity(r.entity||"lead"); setFPrivacy(r.privacy||"title_only"); setEditId(r.id); setShowCreate(true); };
  const saveForm   = () => {
    const chs = [...(fPush?["push"]:[]),...(fInapp?["inapp"]:[])];
    if (editId) {
      setReminders(prev=>prev.map(r=>r.id===editId?{...r,title:fTitle,date:fDate,time:fTime,recur:fRecur==="none"?"Once":fRecur.charAt(0).toUpperCase()+fRecur.slice(1),channels:chs,priority:fPriority,entity:fEntity,privacy:fPrivacy}:r));
    } else {
      const newR = {id:`r${Date.now()}`,title:fTitle,lead:null,entityType:fEntity,date:fDate,time:fTime,recur:fRecur==="none"?"Once":fRecur.charAt(0).toUpperCase()+fRecur.slice(1),status:"pending",channels:chs,type:"manual",priority:fPriority,privacy:fPrivacy};
      setReminders(prev=>[newR,...prev]);
      if (addReminder) addReminder(newR);
    }
    setShowCreate(false);
  };

  const TEMPLATES = [
    // date-derived templates — no manual date picking, date comes from lead field
    { id:"tpl1", name:"Birthday reminder",     icon:"🎂", desc:"3 days before contact's birthday",                 recur:"Yearly",  triggerBasis:"lead_field", dateSource:"lead.birthday",    dateSourceLabel:"Contact's birthday"     },
    { id:"tpl7", name:"Anniversary reminder",  icon:"🥂", desc:"3 days before contact's contract anniversary",     recur:"Yearly",  triggerBasis:"lead_field", dateSource:"lead.anniversary", dateSourceLabel:"Contract anniversary" },
    { id:"tpl6", name:"GDPR renewal",          icon:"🔒", desc:"30 days before consent expiry",                 recur:"Once",    triggerBasis:"lead_field", dateSource:"lead.gdprExpiry",  dateSourceLabel:"GDPR consent expiry" },
    // event-driven templates — fired by CRM event, no date needed
    { id:"tpl2", name:"Follow-up after call",  icon:"📞", desc:"24h after a 'Callback requested' call log",     recur:"Once",    triggerBasis:"crm_event",  dateSource:null,               dateSourceLabel:"After call logged"   },
    { id:"tpl3", name:"Appointment reminder",  icon:"📅", desc:"1 hour before scheduled appointment",           recur:"Once",    triggerBasis:"crm_event",  dateSource:null,               dateSourceLabel:"Before appointment"  },
    { id:"tpl4", name:"Inactivity alert",      icon:"💤", desc:"Contact idle for 7+ days with no activity",        recur:"Weekly",  triggerBasis:"crm_event",  dateSource:null,               dateSourceLabel:"On inactivity"       },
    { id:"tpl5", name:"Welcome series day 3",  icon:"👋", desc:"3 days after first contact registered",         recur:"Once",    triggerBasis:"crm_event",  dateSource:null,               dateSourceLabel:"After first contact" },
  ];
  const [tplActive, setTplActive] = useState({tpl1:true,tpl2:true,tpl3:false,tpl4:false,tpl5:false,tpl6:false,tpl7:false});
  const [showNewTpl, setShowNewTpl] = useState(false);
  const [newTplData, setNewTplData] = useState({ name:"", icon:"⏰", desc:"", triggerBasis:"crm_event", dateSource:"", dateSourceLabel:"", recur:"Once", priority:"normal" });
  const [notifPrefs, setNotifPrefs] = useState({
    manual:{push:true,inapp:true}, workflow:{push:true,inapp:true},
    assign:{push:true,inapp:true}, appt:{push:true,inapp:true},
    mention:{push:true,inapp:true}, gdpr:{push:true,inapp:true},
    quiet:{push:false,inapp:false}, digest:{push:false,inapp:false},
  });
  const [privacyMode, setPrivacyMode] = useState("full"); // full | titleonly

  const filtered = reminders.filter(r => {
    if (filter         !== "all"        && r.type     !== filter)         return false;
    if (statusFilter   !== "all_status" && r.status   !== statusFilter)   return false;
    if (priorityFilter !== "all"        && r.priority !== priorityFilter) return false;
    return true;
  });

  return (
    <div style={{ padding:"28px 28px 60px",maxWidth:960,margin:"0 auto" }}>

      {/* Header */}
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:28 }}>
        <div>
          <h1 style={{ margin:0,fontSize:24,fontWeight:800,color:C.navy,letterSpacing:"-0.02em" }}>⏰ Reminders</h1>
          <p style={{ margin:"4px 0 0",fontSize:13,color:C.slate }}>Schedule one-off and recurring reminders. Delivered via push and in-app notifications.</p>
        </div>
        <button onClick={openCreate}
          style={{ padding:"9px 20px",borderRadius:9,border:"none",background:"#7C3AED",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer" }}>
          + New Reminder
        </button>
      </div>

      {/* ── 3 Filters (DDLs) ── */}
      <div style={{ display:"flex",gap:10,marginBottom:20,flexWrap:"wrap",alignItems:"center" }}>

        {/* Origin */}
        <div style={{ position:"relative" }}>
          <select value={filter} onChange={e=>setFilter(e.target.value)}
            style={{ padding:"8px 32px 8px 12px",borderRadius:9,border:`1.5px solid ${filter!=="all"?"#7C3AED":C.border}`,
              background:filter!=="all"?"#7C3AED0A":"#fff",color:filter!=="all"?"#7C3AED":C.slate,
              fontSize:12,fontWeight:filter!=="all"?700:400,fontFamily:"inherit",
              appearance:"none",cursor:"pointer",outline:"none" }}>
            <option value="all">Origin: All</option>
            <option value="manual">Manual — created by user</option>
            <option value="workflow">Workflow — auto by CRM event</option>
            <option value="template">Template — from activatable template</option>
          </select>
          <div style={{ position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",
            pointerEvents:"none",fontSize:10,color:filter!=="all"?"#7C3AED":C.muted }}>▼</div>
        </div>

        {/* Status */}
        <div style={{ position:"relative" }}>
          <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}
            style={{ padding:"8px 32px 8px 12px",borderRadius:9,border:`1.5px solid ${statusFilter!=="all_status"?"#7C3AED":C.border}`,
              background:statusFilter!=="all_status"?"#7C3AED0A":"#fff",color:statusFilter!=="all_status"?"#7C3AED":C.slate,
              fontSize:12,fontWeight:statusFilter!=="all_status"?700:400,fontFamily:"inherit",
              appearance:"none",cursor:"pointer",outline:"none" }}>
            <option value="all_status">Status: All</option>
            <option value="pending">Pending — scheduled, not yet fired</option>
            <option value="active">Active — recurring, currently running</option>
            <option value="completed">Completed — fired and done</option>
          </select>
          <div style={{ position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",
            pointerEvents:"none",fontSize:10,color:statusFilter!=="all_status"?"#7C3AED":C.muted }}>▼</div>
        </div>

        {/* Priority */}
        <div style={{ position:"relative" }}>
          <select value={priorityFilter} onChange={e=>setPriorityFilter(e.target.value)}
            style={{ padding:"8px 32px 8px 12px",borderRadius:9,border:`1.5px solid ${priorityFilter!=="all"?"#7C3AED":C.border}`,
              background:priorityFilter!=="all"?"#7C3AED0A":"#fff",color:priorityFilter!=="all"?"#7C3AED":C.slate,
              fontSize:12,fontWeight:priorityFilter!=="all"?700:400,fontFamily:"inherit",
              appearance:"none",cursor:"pointer",outline:"none" }}>
            <option value="all">Priority: All</option>
            <option value="high">🔴 High — bypasses quiet hours</option>
            <option value="normal">🟡 Normal — respects quiet hours</option>
            <option value="low">⚪ Low — bundled in digest</option>
          </select>
          <div style={{ position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",
            pointerEvents:"none",fontSize:10,color:priorityFilter!=="all"?"#7C3AED":C.muted }}>▼</div>
        </div>

        {/* Clear all — only shown if any filter active */}
        {(filter!=="all"||statusFilter!=="all_status"||priorityFilter!=="all") && (
          <button onClick={()=>{ setFilter("all"); setStatusFilter("all_status"); setPriorityFilter("all"); }}
            style={{ padding:"8px 14px",borderRadius:9,border:`1px solid ${C.border}`,
              background:"#fff",color:C.muted,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>
            ✕ Clear filters
          </button>
        )}

        <span style={{ fontSize:11,color:C.muted,marginLeft:"auto" }}>
          {filtered.length} reminder{filtered.length!==1?"s":""}
        </span>
      </div>

      {/* Reminder list */}
      <div style={{ display:"flex",flexDirection:"column",gap:10,marginBottom:32 }}>
        {filtered.map(r=>(
          <SettingsCard key={r.id} style={{ padding:"14px 18px" }}>
            <div style={{ display:"flex",alignItems:"center",gap:14 }}>
              {/* Icon */}
              <div style={{ width:40,height:40,borderRadius:10,flexShrink:0,
                background:typeColor[r.type]+"12",border:`1px solid ${typeColor[r.type]}25`,
                display:"flex",alignItems:"center",justifyContent:"center",fontSize:18 }}>
                {r.type==="workflow"?"🤖":r.type==="template"?"📋":"⏰"}
              </div>

              {/* Info */}
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ display:"flex",alignItems:"center",gap:8,flexWrap:"wrap" }}>
                  <div style={{ fontSize:13,fontWeight:700,color:C.text }}>{r.title}</div>
                  {/* Priority badge */}
                  <span style={{ fontSize:9,fontWeight:800,padding:"2px 7px",borderRadius:8,
                    background:priorityColor[r.priority||"normal"]+"15",
                    color:priorityColor[r.priority||"normal"],textTransform:"uppercase",letterSpacing:"0.05em" }}>
                    {priorityIcon[r.priority||"normal"]} {r.priority||"normal"}
                  </span>
                  <span style={{ fontSize:9,fontWeight:800,padding:"2px 7px",borderRadius:8,
                    background:typeColor[r.type]+"15",color:typeColor[r.type],textTransform:"uppercase",letterSpacing:"0.05em" }}>
                    {typeLabel[r.type]}
                  </span>
                  <span style={{ fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:8,
                    background:statusColor[r.status]+"15",color:statusColor[r.status],textTransform:"uppercase" }}>
                    {r.status}
                  </span>
                </div>
                <div style={{ fontSize:11,color:C.muted,marginTop:3,display:"flex",gap:12,flexWrap:"wrap" }}>
                  <span>📅 {r.date} at {r.time}</span>
                  <span>🔁 {r.recur}</span>
                  {r.lead && <span>👤 {r.lead}</span>}
                  {r.entityType && r.entityType!=="lead" && <span style={{ color:C.indigo,fontWeight:600 }}>📌 {r.entityType}</span>}
                  <span>{r.channels.map(c=>c==="push"?"📱":"🔔").join(" ")}</span>
                </div>
              </div>

              {/* Actions */}
              {r.status!=="completed" && (
                <div style={{ display:"flex",gap:7,flexShrink:0 }}>
                  <button onClick={()=>openEdit(r)}
                    style={{ padding:"5px 12px",borderRadius:7,border:`1px solid ${C.border}`,background:"#fff",color:C.slate,fontSize:11,fontWeight:600,cursor:"pointer" }}>Edit</button>
                  <button onClick={()=>setDeleteId(r.id)}
                    style={{ padding:"5px 10px",borderRadius:7,border:"none",background:C.red+"10",color:C.red,fontSize:11,fontWeight:600,cursor:"pointer" }}>×</button>
                </div>
              )}
            </div>

            {/* Undo delete */}
            {deleteId===r.id && (
              <div style={{ marginTop:10,padding:"9px 14px",borderRadius:8,background:C.red+"08",border:`1px solid ${C.red}20`,display:"flex",alignItems:"center",justifyContent:"space-between" }}>
                <span style={{ fontSize:12,color:C.red }}>Delete this reminder?</span>
                <div style={{ display:"flex",gap:8 }}>
                  <button onClick={()=>setDeleteId(null)} style={{ padding:"4px 12px",borderRadius:6,border:`1px solid ${C.border}`,background:"#fff",color:C.slate,fontSize:11,cursor:"pointer" }}>Cancel</button>
                  <button onClick={()=>{ setReminders(prev=>prev.filter(x=>x.id!==r.id)); setDeleteId(null); }}
                    style={{ padding:"4px 12px",borderRadius:6,border:"none",background:C.red,color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer" }}>Delete</button>
                </div>
              </div>
            )}
          </SettingsCard>
        ))}
        {filtered.length===0 && (
          <div style={{ padding:"40px",textAlign:"center",color:C.muted,fontSize:13,fontStyle:"italic",background:"#F8FAFC",borderRadius:12,border:`1px dashed ${C.border}` }}>
            No reminders found for this filter.
          </div>
        )}
      </div>

      {/* ── Activatable Templates ─────────────────────────────────────── */}
      <div style={{ marginBottom:28 }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12 }}>
          <div>
            <div style={{ fontSize:15,fontWeight:800,color:C.navy,marginBottom:4 }}>📋 Activatable Templates</div>
            <div style={{ fontSize:12,color:C.muted }}>
              {role==="superadmin"
                ? "Create, edit, and activate system-wide reminder templates. Once active, they fire automatically for every qualifying lead."
                : "Toggle templates on or off for your leads. Templates are defined by your administrator."}
            </div>
          </div>
          {role==="superadmin" && (
            <button onClick={()=>{ setNewTplData({ name:"", icon:"⏰", desc:"", triggerBasis:"crm_event", dateSource:"", dateSourceLabel:"", recur:"Once", priority:"normal" }); setShowNewTpl(true); }}
              style={{ padding:"7px 16px",borderRadius:8,border:"none",background:C.primary,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",flexShrink:0,marginLeft:16 }}>
              + New Template
            </button>
          )}
        </div>

        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12 }}>
          {TEMPLATES.map((tpl)=>{
            const on = tplActive[tpl.id];
            return (
              <div key={tpl.id} style={{ padding:"14px 16px",borderRadius:11,
                border:`1.5px solid ${on?"#7C3AED40":C.border}`,
                background:on?"#7C3AED06":"#fff",transition:"all 0.2s" }}>
                {/* Header: icon + toggle */}
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8 }}>
                  <div style={{ fontSize:20 }}>{tpl.icon}</div>
                  <div onClick={()=>setTplActive(prev=>({...prev,[tpl.id]:!prev[tpl.id]}))}
                    style={{ width:36,height:20,borderRadius:10,background:on?"#7C3AED":"#CBD5E1",
                      cursor:"pointer",position:"relative",transition:"background 0.2s",flexShrink:0 }}>
                    <div style={{ position:"absolute",top:2,left:on?18:2,width:16,height:16,borderRadius:"50%",
                      background:"#fff",transition:"left 0.2s",boxShadow:"0 1px 3px rgba(0,0,0,0.2)" }}/>
                  </div>
                </div>

                {/* Name + description */}
                <div style={{ fontSize:12,fontWeight:700,color:C.text,marginBottom:3 }}>{tpl.name}</div>
                <div style={{ fontSize:11,color:C.muted,marginBottom:8,lineHeight:1.4 }}>{tpl.desc}</div>

                {/* Trigger basis badge — explains why no date is needed */}
                <div style={{ marginBottom:8 }}>
                  {tpl.triggerBasis==="lead_field" ? (
                    <div style={{ display:"inline-flex",alignItems:"center",gap:4,padding:"3px 8px",
                      borderRadius:7,background:"#EFF6FF",border:"1px solid #BFDBFE" }}>
                      <span style={{ fontSize:10 }}>📋</span>
                      <span style={{ fontSize:10,fontWeight:700,color:C.blue }}>Auto from lead field</span>
                      <span style={{ fontSize:10,color:C.muted }}> — {tpl.dateSourceLabel}</span>
                    </div>
                  ) : (
                    <div style={{ display:"inline-flex",alignItems:"center",gap:4,padding:"3px 8px",
                      borderRadius:7,background:"#F0FDF4",border:"1px solid #BBF7D0" }}>
                      <span style={{ fontSize:10 }}>⚡</span>
                      <span style={{ fontSize:10,fontWeight:700,color:C.green }}>CRM event trigger</span>
                      <span style={{ fontSize:10,color:C.muted }}> — {tpl.dateSourceLabel}</span>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between" }}>
                  <span style={{ fontSize:10,fontWeight:600,color:on?"#7C3AED":C.muted }}>
                    🔁 {tpl.recur} · {on?"Active":"Off"}
                  </span>
                  {role==="superadmin" && (
                    <div style={{ display:"flex",gap:5 }}>
                      <button onClick={()=>openEdit({
                          id:tpl.id,title:tpl.name,date:"",time:"",
                          recur:tpl.recur==="Once"?"none":tpl.recur.toLowerCase(),
                          channels:["push","inapp"],priority:"normal",entity:"lead",privacy:"title_only",_isTpl:true,
                        })}
                        style={{ padding:"2px 8px",borderRadius:5,border:`1px solid ${C.border}`,background:"#fff",color:C.muted,fontSize:9,fontWeight:600,cursor:"pointer" }}>
                        ✏️ Edit
                      </button>
                      <button onClick={()=>{ if(window.confirm(`Delete "${tpl.name}"?`)) setTplActive(prev=>{const n={...prev};delete n[tpl.id];return n;}); }}
                        style={{ padding:"2px 8px",borderRadius:5,border:`1px solid ${C.red}30`,background:C.red+"06",color:C.red,fontSize:9,fontWeight:600,cursor:"pointer" }}>
                        🗑
                      </button>
                    </div>
                  )}
                </div>
                {role!=="superadmin" && (
                  <div style={{ marginTop:6,fontSize:9,color:C.muted,fontStyle:"italic" }}>
                    Managed by Super Admin
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Notification Preferences — role-filtered ──────────────────── */}
      {(()=>{
        // Each role only sees preferences relevant to them
        const ALL_PREFS = {
          gp: [
            { id:"manual",   label:"Manual reminders",        locked:false },
            { id:"assign",   label:"Contact assignments",        locked:false },
            { id:"appt",     label:"Appointment reminders",   locked:false },
            { id:"workflow", label:"Workflow reminders",      locked:false },
            { id:"quiet",    label:"Quiet hours (22:00–08:00)",locked:false },
            { id:"digest",   label:"Daily digest (08:00)",    locked:false },
          ],
          vd: [
            { id:"manual",   label:"Manual reminders",        locked:false },
            { id:"assign",   label:"Contact assignments",        locked:false },
            { id:"appt",     label:"Appointment reminders",   locked:false },
            { id:"workflow", label:"Workflow reminders",      locked:false },
            { id:"mention",  label:"Mentions",                locked:false },
            { id:"quiet",    label:"Quiet hours (22:00–08:00)",locked:false },
            { id:"digest",   label:"Daily digest (08:00)",    locked:false },
          ],
          superadmin: [
            { id:"gdpr",     label:"GDPR / consent expiry",   locked:true  },
            { id:"assign",   label:"Contact assignments",        locked:false },
            { id:"workflow", label:"Workflow reminders",      locked:false },
            { id:"mention",  label:"Mentions",                locked:false },
            { id:"manual",   label:"Manual reminders",        locked:false },
            { id:"quiet",    label:"Quiet hours (22:00–08:00)",locked:false },
            { id:"digest",   label:"Org weekly digest",       locked:false },
          ],
          manager: [
            { id:"workflow", label:"Org performance alerts",  locked:false },
            { id:"mention",  label:"Mentions",                locked:false },
            { id:"manual",   label:"Manual reminders",        locked:false },
            { id:"quiet",    label:"Quiet hours (22:00–08:00)",locked:false },
            { id:"digest",   label:"Org weekly digest",       locked:false },
          ],
        };
        const PREF_ROWS = ALL_PREFS[role] || ALL_PREFS.gp;
        const prefs    = notifPrefs;
        const toggle = (id, channel) => {
          setNotifPrefs(prev=>({...prev,[id]:{...prev[id],[channel]:!prev[id][channel]}}));
        };
        return (
          <Card style={{ padding:"18px 20px" }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4 }}>
              <div style={{ fontSize:13,fontWeight:700,color:C.text }}>📱 Notification Preferences</div>
              <span style={{ fontSize:10,fontWeight:700,color:C.navy,padding:"2px 9px",borderRadius:10,background:C.primary+"12" }}>
                {{superadmin:"Super Admin",vd:"Sales Director",gp:"Consultant",manager:"Product Owner"}[role]}
              </span>
            </div>
            <div style={{ fontSize:11,color:C.muted,marginBottom:14 }}>
              Showing preferences relevant to your role. GDPR and system alerts cannot be disabled.
            </div>

            {/* Column headers */}
            <div style={{ display:"grid",gridTemplateColumns:"1fr 60px 60px",marginBottom:6,
              paddingBottom:6,borderBottom:`1px solid ${C.border}` }}>
              <div style={{ fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em" }}>Type</div>
              <div style={{ fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",textAlign:"center" }}>📱 Push</div>
              <div style={{ fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",textAlign:"center" }}>🔔 In-app</div>
            </div>

            {PREF_ROWS.map(row=>(
              <div key={row.id} style={{ display:"grid",gridTemplateColumns:"1fr 60px 60px",
                padding:"7px 0",borderBottom:`1px solid ${C.border}` }}>
                <span style={{ fontSize:12,color:C.text,alignSelf:"center" }}>
                  {row.label}
                  {row.locked && <span style={{ marginLeft:6,fontSize:9,color:C.red,fontWeight:700 }}>Required</span>}
                </span>
                {["push","inapp"].map(ch=>{
                  const on     = prefs[row.id]?.[ch] ?? true;
                  const locked = row.locked;
                  return (
                    <div key={ch} style={{ display:"flex",justifyContent:"center",alignItems:"center" }}>
                      <div onClick={()=>!locked&&toggle(row.id,ch)}
                        style={{ width:32,height:18,borderRadius:9,
                          background:on?"#7C3AED":"#CBD5E1",
                          cursor:locked?"default":"pointer",
                          position:"relative",transition:"background 0.2s",
                          opacity:locked?0.6:1 }}>
                        <div style={{ position:"absolute",top:2,left:on?16:2,width:14,height:14,
                          borderRadius:"50%",background:"#fff",transition:"left 0.2s",
                          boxShadow:"0 1px 2px rgba(0,0,0,0.2)" }}/>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}

            {/* Privacy + footer */}
            <div style={{ marginTop:10,padding:"10px 14px",borderRadius:8,background:"#FFFBEB",border:`1px solid ${C.amber}30` }}>
              <div style={{ fontSize:11,fontWeight:700,color:C.amber,marginBottom:6 }}>🔒 Lock Screen Privacy</div>
              <div style={{ fontSize:11,color:C.slate,marginBottom:8 }}>Controls what appears in push notifications on the lock screen.</div>
              <div style={{ display:"flex",gap:8 }}>
                {[["full","Full details"],["titleonly","Title only"]].map(([k,l])=>(
                  <button key={k} onClick={()=>setPrivacyMode(k)}
                    style={{ padding:"5px 14px",borderRadius:8,
                      border:`1.5px solid ${privacyMode===k?C.amber:C.border}`,
                      background:privacyMode===k?"#FFFBEB":"#fff",
                      color:privacyMode===k?C.amber:C.muted,
                      fontSize:12,fontWeight:privacyMode===k?700:400,
                      cursor:"pointer",fontFamily:"inherit" }}>{l}</button>
                ))}
              </div>
              <div style={{ fontSize:10,color:C.muted,marginTop:6,fontStyle:"italic" }}>
                {privacyMode==="full"
                  ? "Push shows: 'Follow-up call — Sandra Richter · Q1 Finanz'"
                  : "Push shows: 'You have a reminder' — contact details hidden on lock screen"}
              </div>
            </div>
            <div style={{ marginTop:8,padding:"9px 14px",borderRadius:8,background:"#F0FDF4",
              border:`1px solid ${C.green}25`,fontSize:11,color:C.slate }}>
              📱 Push via <strong>FCM</strong> (Android) · <strong>APNs</strong> (iOS) · Deep links open the relevant lead or reminder directly
            </div>
          </Card>
        );
      })()}

      {/* ── New Template Modal ── */}
      {showNewTpl && (
        <>
          <div onClick={()=>setShowNewTpl(false)} style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.35)",zIndex:400 }}/>
          <div style={{ position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",
            width:500,background:"#fff",borderRadius:16,zIndex:500,
            boxShadow:"0 24px 64px rgba(0,0,0,0.2)",fontFamily:"inherit",padding:"24px",maxHeight:"90vh",overflowY:"auto" }}>

            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
              <div style={{ fontSize:15,fontWeight:800,color:C.navy }}>📋 New Reminder Template</div>
              <button onClick={()=>setShowNewTpl(false)}
                style={{ width:26,height:26,borderRadius:"50%",border:`1px solid ${C.border}`,background:"#F8FAFC",color:C.muted,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>×</button>
            </div>

            {/* Icon + Name */}
            <div style={{ display:"grid",gridTemplateColumns:"80px 1fr",gap:10,marginBottom:14 }}>
              <div>
                <label style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:5 }}>Icon</label>
                <input value={newTplData.icon} onChange={e=>setNewTplData(p=>({...p,icon:e.target.value}))}
                  style={{ width:"100%",padding:"9px 8px",borderRadius:8,border:`1.5px solid ${C.border}`,fontSize:20,fontFamily:"inherit",boxSizing:"border-box",outline:"none",textAlign:"center" }}/>
              </div>
              <div>
                <label style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:5 }}>Template Name</label>
                <input value={newTplData.name} onChange={e=>setNewTplData(p=>({...p,name:e.target.value}))}
                  placeholder="e.g. Anniversary reminder"
                  style={{ width:"100%",padding:"9px 12px",borderRadius:8,border:`1.5px solid ${C.border}`,fontSize:13,fontFamily:"inherit",boxSizing:"border-box",outline:"none" }}/>
              </div>
            </div>

            {/* Description */}
            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:5 }}>Description</label>
              <input value={newTplData.desc} onChange={e=>setNewTplData(p=>({...p,desc:e.target.value}))}
                placeholder="e.g. 3 days before the contact's contract anniversary"
                style={{ width:"100%",padding:"9px 12px",borderRadius:8,border:`1.5px solid ${C.border}`,fontSize:13,fontFamily:"inherit",boxSizing:"border-box",outline:"none" }}/>
            </div>

            {/* Trigger basis */}
            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:8 }}>How is the date determined?</label>
              <div style={{ display:"flex",gap:10 }}>
                {[["lead_field","📋 From contact field","Date comes from a field on the contact's profile (e.g. birthday, anniversary)"],
                  ["crm_event", "⚡ CRM event",      "Fires when something happens in the CRM (e.g. call logged, idle 7 days)"]
                ].map(([k,l,hint])=>(
                  <button key={k} onClick={()=>setNewTplData(p=>({...p,triggerBasis:k,dateSource:"",dateSourceLabel:""}))}
                    style={{ flex:1,padding:"10px 12px",borderRadius:9,textAlign:"left",
                      border:`1.5px solid ${newTplData.triggerBasis===k?C.indigo:C.border}`,
                      background:newTplData.triggerBasis===k?C.indigo+"0A":"#fff",
                      cursor:"pointer",fontFamily:"inherit" }}>
                    <div style={{ fontSize:12,fontWeight:700,color:newTplData.triggerBasis===k?C.indigo:C.text,marginBottom:3 }}>{l}</div>
                    <div style={{ fontSize:10,color:C.muted,lineHeight:1.4 }}>{hint}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Contact field selector */}
            {newTplData.triggerBasis==="lead_field" && (
              <div style={{ marginBottom:14,padding:"12px 14px",borderRadius:9,background:"#EFF6FF",border:"1px solid #BFDBFE" }}>
                <label style={{ fontSize:11,fontWeight:700,color:C.blue,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:8 }}>Contact profile field</label>
                <div style={{ position:"relative" }}>
                  <select value={newTplData.dateSource}
                    onChange={e=>{
                      const opts = {"lead.birthday":"Contact's birthday","lead.anniversary":"Contract anniversary","lead.gdprExpiry":"GDPR consent expiry","lead.trialEnd":"Trial end date","lead.contractEnd":"Contract end date"};
                      setNewTplData(p=>({...p,dateSource:e.target.value,dateSourceLabel:opts[e.target.value]||e.target.value}));
                    }}
                    style={{ width:"100%",padding:"9px 32px 9px 12px",borderRadius:8,border:`1.5px solid #BFDBFE`,background:"#fff",fontSize:12,fontFamily:"inherit",appearance:"none",outline:"none" }}>
                    <option value="">Select lead field…</option>
                    <option value="lead.birthday">Birthday (lead.birthday)</option>
                    <option value="lead.anniversary">Contract anniversary (lead.anniversary)</option>
                    <option value="lead.gdprExpiry">GDPR consent expiry (lead.gdprExpiry)</option>
                    <option value="lead.trialEnd">Trial end date (lead.trialEnd)</option>
                    <option value="lead.contractEnd">Contract end date (lead.contractEnd)</option>
                  </select>
                  <div style={{ position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",pointerEvents:"none",color:C.muted,fontSize:10 }}>▼</div>
                </div>
                <div style={{ fontSize:10,color:C.blue,marginTop:6 }}>
                  The scheduler reads this field from each lead's profile and calculates the reminder date automatically.
                </div>
              </div>
            )}

            {/* CRM event selector */}
            {newTplData.triggerBasis==="crm_event" && (
              <div style={{ marginBottom:14,padding:"12px 14px",borderRadius:9,background:"#F0FDF4",border:"1px solid #BBF7D0" }}>
                <label style={{ fontSize:11,fontWeight:700,color:C.green,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:8 }}>Triggering event</label>
                <div style={{ position:"relative" }}>
                  <select value={newTplData.dateSource}
                    onChange={e=>{
                      const opts = {"after_call_logged":"After call logged","before_appointment":"Before appointment","on_inactivity":"On contact inactivity","after_first_contact":"After first contact","on_lead_assigned":"On contact assigned"};
                      setNewTplData(p=>({...p,dateSource:e.target.value,dateSourceLabel:opts[e.target.value]||e.target.value}));
                    }}
                    style={{ width:"100%",padding:"9px 32px 9px 12px",borderRadius:8,border:`1.5px solid #BBF7D0`,background:"#fff",fontSize:12,fontFamily:"inherit",appearance:"none",outline:"none" }}>
                    <option value="">Select CRM event…</option>
                    <option value="after_call_logged">After call logged (Callback requested)</option>
                    <option value="before_appointment">Before scheduled appointment</option>
                    <option value="on_inactivity">On lead inactivity (7+ days)</option>
                    <option value="after_first_contact">After first contact registered</option>
                    <option value="on_lead_assigned">On lead assigned to GP</option>
                  </select>
                  <div style={{ position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",pointerEvents:"none",color:C.muted,fontSize:10 }}>▼</div>
                </div>
              </div>
            )}

            {/* Recurrence + Priority */}
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20 }}>
              <div>
                <label style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:5 }}>Recurrence</label>
                <div style={{ position:"relative" }}>
                  <select value={newTplData.recur} onChange={e=>setNewTplData(p=>({...p,recur:e.target.value}))}
                    style={{ width:"100%",padding:"9px 32px 9px 12px",borderRadius:8,border:`1.5px solid ${C.border}`,background:"#fff",fontSize:12,fontFamily:"inherit",appearance:"none",outline:"none" }}>
                    <option value="Once">Once — fires one time</option>
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Yearly">Yearly — e.g. birthday</option>
                  </select>
                  <div style={{ position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",pointerEvents:"none",color:C.muted,fontSize:10 }}>▼</div>
                </div>
              </div>
              <div>
                <label style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:5 }}>Default Priority</label>
                <div style={{ position:"relative" }}>
                  <select value={newTplData.priority} onChange={e=>setNewTplData(p=>({...p,priority:e.target.value}))}
                    style={{ width:"100%",padding:"9px 32px 9px 12px",borderRadius:8,border:`1.5px solid ${C.border}`,background:"#fff",fontSize:12,fontFamily:"inherit",appearance:"none",outline:"none" }}>
                    <option value="high">🔴 High — bypasses quiet hours</option>
                    <option value="normal">🟡 Normal — respects quiet hours</option>
                    <option value="low">⚪ Low — bundled in digest</option>
                  </select>
                  <div style={{ position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",pointerEvents:"none",color:C.muted,fontSize:10 }}>▼</div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display:"flex",gap:10 }}>
              <button onClick={()=>setShowNewTpl(false)}
                style={{ flex:1,padding:"10px",borderRadius:9,border:`1px solid ${C.border}`,background:"#fff",color:C.slate,fontSize:13,fontWeight:600,cursor:"pointer" }}>
                Cancel
              </button>
              <button
                disabled={!newTplData.name.trim()||!newTplData.dateSource}
                onClick={()=>{
                  const id = `tpl_${Date.now()}`;
                  TEMPLATES.push({
                    id, name:newTplData.name.trim(), icon:newTplData.icon||"⏰",
                    desc:newTplData.desc.trim(), recur:newTplData.recur,
                    triggerBasis:newTplData.triggerBasis,
                    dateSource:newTplData.dateSource,
                    dateSourceLabel:newTplData.dateSourceLabel,
                    priority:newTplData.priority,
                  });
                  setTplActive(prev=>({...prev,[id]:false}));
                  setShowNewTpl(false);
                }}
                style={{ flex:2,padding:"10px",borderRadius:9,border:"none",
                  background:newTplData.name.trim()&&newTplData.dateSource?C.primary:"#E2E8F0",
                  color:newTplData.name.trim()&&newTplData.dateSource?"#fff":C.muted,
                  fontSize:13,fontWeight:700,
                  cursor:newTplData.name.trim()&&newTplData.dateSource?"pointer":"default" }}>
                📋 Save Template
              </button>
            </div>
          </div>
        </>
      )}

      {/* Create / Edit modal */}
      {showCreate && (
        <>
          <div onClick={()=>setShowCreate(false)} style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.35)",zIndex:400 }}/>
          <div style={{ position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:460,background:"#fff",borderRadius:16,zIndex:500,boxShadow:"0 24px 64px rgba(0,0,0,0.2)",fontFamily:"inherit",padding:"22px 24px" }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18 }}>
              <div style={{ fontSize:15,fontWeight:800,color:C.navy }}>{editId?"Edit Reminder":"New Reminder"}</div>
              <button onClick={()=>setShowCreate(false)} style={{ width:26,height:26,borderRadius:"50%",border:`1px solid ${C.border}`,background:"#F8FAFC",color:C.muted,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>×</button>
            </div>
            <div style={{ marginBottom:12 }}>
              <label style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:5 }}>Title</label>
              <input value={fTitle} onChange={e=>setFTitle(e.target.value)} placeholder="Reminder title…"
                style={{ width:"100%",padding:"9px 12px",borderRadius:8,border:`1.5px solid ${C.border}`,fontSize:13,fontFamily:"inherit",boxSizing:"border-box",outline:"none" }}/>
            </div>

            {/* Entity type + Priority */}
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12 }}>
              <div>
                <label style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:5 }}>Linked to</label>
                <select value={fEntity} onChange={e=>setFEntity(e.target.value)}
                  style={{ width:"100%",padding:"9px 12px",borderRadius:8,border:`1.5px solid ${C.border}`,fontSize:12,fontFamily:"inherit",boxSizing:"border-box",outline:"none",background:"#fff",color:C.text }}>
                  <option value="lead">📋 Contact</option>
                  <option value="contact">👤 Contact</option>
                  <option value="deal">💼 Deal</option>
                  <option value="appointment">📅 Appointment</option>
                  <option value="task">✅ Task</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:5 }}>Priority</label>
                <div style={{ display:"flex",gap:4 }}>
                  {[["low","Low","#64748B"],["normal","Normal","#4338CA"],["high","High","#DC2626"]].map(([k,l,col])=>(
                    <button key={k} onClick={()=>setFPriority(k)}
                      style={{ flex:1,padding:"8px 4px",borderRadius:7,border:`1.5px solid ${fPriority===k?col:C.border}`,
                        background:fPriority===k?col+"12":"#fff",color:fPriority===k?col:C.muted,
                        fontSize:11,fontWeight:fPriority===k?700:400,cursor:"pointer",fontFamily:"inherit" }}>{l}</button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12 }}>
              <div>
                <label style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:5 }}>Date</label>
                <input type="date" value={fDate} onChange={e=>setFDate(e.target.value)} style={{ width:"100%",padding:"9px 12px",borderRadius:8,border:`1.5px solid ${C.border}`,fontSize:13,fontFamily:"inherit",boxSizing:"border-box",outline:"none" }}/>
              </div>
              <div>
                <label style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:5 }}>Time</label>
                <input type="time" value={fTime} onChange={e=>setFTime(e.target.value)} style={{ width:"100%",padding:"9px 12px",borderRadius:8,border:`1.5px solid ${C.border}`,fontSize:13,fontFamily:"inherit",boxSizing:"border-box",outline:"none" }}/>
              </div>
            </div>
            <div style={{ marginBottom:12 }}>
              <label style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:5 }}>Recurrence</label>
              <div style={{ display:"flex",gap:6 }}>
                {[["none","Once"],["daily","Daily"],["weekly","Weekly"],["monthly","Monthly"]].map(([k,l])=>(
                  <button key={k} onClick={()=>setFRecur(k)}
                    style={{ padding:"5px 12px",borderRadius:20,border:`1.5px solid ${fRecur===k?"#7C3AED":C.border}`,background:fRecur===k?"#7C3AED0D":"#fff",color:fRecur===k?"#7C3AED":C.slate,fontSize:12,fontWeight:fRecur===k?700:400,cursor:"pointer",fontFamily:"inherit" }}>{l}</button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom:12 }}>
              <label style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:5 }}>Note</label>
              <textarea value={fNote} onChange={e=>setFNote(e.target.value)} placeholder="Optional note…" rows={2}
                style={{ width:"100%",padding:"9px 12px",borderRadius:8,border:`1.5px solid ${C.border}`,fontSize:12,fontFamily:"inherit",boxSizing:"border-box",resize:"none",outline:"none" }}/>
            </div>
            <div style={{ marginBottom:16,padding:"11px 14px",borderRadius:9,background:"#F8FAFC",border:`1px solid ${C.border}` }}>
              <div style={{ display:"flex",gap:16,marginBottom:10 }}>
                {[["📱 Push notification",fPush,setFPush],["🔔 In-app",fInapp,setFInapp]].map(([label,val,setter])=>(
                  <label key={label} style={{ display:"flex",alignItems:"center",gap:7,cursor:"pointer",fontSize:12,color:C.slate }}>
                    <input type="checkbox" checked={val} onChange={e=>setter(e.target.checked)} style={{ accentColor:"#7C3AED",width:14,height:14 }}/>{label}
                  </label>
                ))}
              </div>
              <div style={{ display:"flex",alignItems:"center",gap:10,paddingTop:8,borderTop:`1px solid ${C.border}` }}>
                <span style={{ fontSize:11,color:C.muted,flexShrink:0 }}>🔒 Lock screen:</span>
                {[["title_only","Title only"],["full","Full details"]].map(([k,l])=>(
                  <button key={k} onClick={()=>setFPrivacy(k)}
                    style={{ padding:"4px 11px",borderRadius:6,border:`1px solid ${fPrivacy===k?"#7C3AED":C.border}`,
                      background:fPrivacy===k?"#7C3AED0D":"#fff",color:fPrivacy===k?"#7C3AED":C.muted,
                      fontSize:11,fontWeight:fPrivacy===k?700:400,cursor:"pointer",fontFamily:"inherit" }}>{l}</button>
                ))}
              </div>
            </div>
            <div style={{ display:"flex",gap:10 }}>
              <button onClick={()=>setShowCreate(false)} style={{ flex:1,padding:"10px",borderRadius:9,border:`1px solid ${C.border}`,background:"#fff",color:C.slate,fontSize:13,fontWeight:600,cursor:"pointer" }}>Cancel</button>
              <button onClick={saveForm} disabled={!fTitle.trim()||!fDate}
                style={{ flex:2,padding:"10px",borderRadius:9,border:"none",background:fTitle.trim()&&fDate?"#7C3AED":"#E2E8F0",color:fTitle.trim()&&fDate?"#fff":C.muted,fontSize:13,fontWeight:700,cursor:fTitle.trim()&&fDate?"pointer":"default" }}>
                {editId?"Save Changes":"⏰ Create Reminder"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ─── Workflow Rules Section (Settings — SA only) ─────────────────────────────
// ─── App Root ─────────────────────────────────────────────────────────────────
// ─── Calendar Page ────────────────────────────────────────────────────────────
