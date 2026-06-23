import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { C } from "../../theme";

export const AutomationsSection = ({ role }) => {
  const TEMPLATES = [
    { id:"tpl1", name:"Birthday reminder",     icon:"🎂", desc:"3 days before lead's birthday",               recur:"Yearly", triggerBasis:"lead_field", dateSource:"lead.birthday",    dateSourceLabel:"Lead's birthday"      },
    { id:"tpl7", name:"Anniversary reminder",  icon:"🥂", desc:"3 days before contract anniversary",          recur:"Yearly", triggerBasis:"lead_field", dateSource:"lead.anniversary", dateSourceLabel:"Contract anniversary"  },
    { id:"tpl6", name:"GDPR renewal",          icon:"🔒", desc:"30 days before consent expiry",               recur:"Once",   triggerBasis:"lead_field", dateSource:"lead.gdprExpiry",  dateSourceLabel:"GDPR consent expiry"  },
    { id:"tpl2", name:"Follow-up after call",  icon:"📞", desc:"24h after a Callback requested call log",     recur:"Once",   triggerBasis:"crm_event",  dateSource:"after_call",       dateSourceLabel:"After call logged"    },
    { id:"tpl3", name:"Appointment reminder",  icon:"📅", desc:"1 hour before scheduled appointment",         recur:"Once",   triggerBasis:"crm_event",  dateSource:"before_appt",      dateSourceLabel:"Before appointment"   },
    { id:"tpl4", name:"Inactivity alert",      icon:"💤", desc:"Lead idle for 7+ days with no activity",      recur:"Weekly", triggerBasis:"crm_event",  dateSource:"on_inactivity",    dateSourceLabel:"On inactivity"        },
    { id:"tpl5", name:"Welcome series day 3",  icon:"👋", desc:"3 days after first contact registered",       recur:"Once",   triggerBasis:"crm_event",  dateSource:"after_first",      dateSourceLabel:"After first contact"  },
  ];
  const [tplActive,   setTplActive]   = useState({tpl1:true,tpl2:true,tpl3:false,tpl4:false,tpl5:false,tpl6:false,tpl7:false});
  const [showNewTpl,  setShowNewTpl]  = useState(false);
  const [newTpl,      setNewTpl]      = useState({ name:"", icon:"⏰", desc:"", triggerBasis:"crm_event", dateSource:"", dateSourceLabel:"", recur:"Once", priority:"normal" });

  return (
    <div>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6 }}>
        <div>
          <div style={{ fontSize:20,fontWeight:800,color:C.navy,marginBottom:4 }}>🔄 Automations</div>
          <div style={{ fontSize:12,color:C.muted,maxWidth:560 }}>
            Define activatable reminder templates. When activated, the system automatically creates activities for qualifying leads — no manual setup per lead required.
          </div>
        </div>
        {role==="superadmin" && (
          <button onClick={()=>setShowNewTpl(true)}
            style={{ padding:"8px 18px",borderRadius:8,border:"none",background:C.primary,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",flexShrink:0,marginLeft:16 }}>
            + New Template
          </button>
        )}
      </div>

      {/* Two groups: lead field vs CRM event */}
      {[
        { title:"📋 From lead field", subtitle:"Date is read automatically from the lead's profile — no date picking needed", filter:"lead_field", color:C.blue, bg:"#EFF6FF" },
        { title:"⚡ CRM event triggers", subtitle:"Fires automatically when something happens in the CRM", filter:"crm_event", color:C.green, bg:"#F0FDF4" },
      ].map(group=>(
        <div key={group.filter} style={{ marginTop:20 }}>
          <div style={{ padding:"8px 14px",borderRadius:8,background:group.bg,border:`1px solid ${group.color}20`,marginBottom:12 }}>
            <div style={{ fontSize:12,fontWeight:700,color:group.color }}>{group.title}</div>
            <div style={{ fontSize:11,color:C.muted,marginTop:2 }}>{group.subtitle}</div>
          </div>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12 }}>
            {TEMPLATES.filter(t=>t.triggerBasis===group.filter).map(tpl=>{
              const on = tplActive[tpl.id];
              return (
                <div key={tpl.id} style={{ padding:"14px 16px",borderRadius:11,
                  border:`1.5px solid ${on?group.color+"40":C.border}`,
                  background:on?group.color+"06":"#fff",transition:"all 0.2s" }}>
                  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8 }}>
                    <div style={{ fontSize:22 }}>{tpl.icon}</div>
                    <div onClick={()=>setTplActive(prev=>({...prev,[tpl.id]:!prev[tpl.id]}))}
                      style={{ width:36,height:20,borderRadius:10,background:on?group.color:"#CBD5E1",
                        cursor:"pointer",position:"relative",transition:"background 0.2s",flexShrink:0 }}>
                      <div style={{ position:"absolute",top:2,left:on?18:2,width:16,height:16,borderRadius:"50%",
                        background:"#fff",transition:"left 0.2s",boxShadow:"0 1px 3px rgba(0,0,0,0.2)" }}/>
                    </div>
                  </div>
                  <div style={{ fontSize:12,fontWeight:700,color:C.text,marginBottom:3 }}>{tpl.name}</div>
                  <div style={{ fontSize:11,color:C.muted,marginBottom:8,lineHeight:1.4 }}>{tpl.desc}</div>
                  <div style={{ fontSize:10,fontWeight:600,color:group.color,marginBottom:6 }}>
                    {tpl.dateSourceLabel} · 🔁 {tpl.recur} · {on?"Active":"Off"}
                  </div>
                  {role==="superadmin" && (
                    <div style={{ display:"flex",gap:5 }}>
                      <button style={{ padding:"2px 8px",borderRadius:5,border:`1px solid ${C.border}`,background:"#fff",color:C.muted,fontSize:9,fontWeight:600,cursor:"pointer" }}>✏️ Edit</button>
                      <button onClick={()=>{ if(window.confirm(`Delete "${tpl.name}"?`)) setTplActive(prev=>{const n={...prev};delete n[tpl.id];return n;}); }}
                        style={{ padding:"2px 8px",borderRadius:5,border:`1px solid ${C.red}30`,background:C.red+"06",color:C.red,fontSize:9,fontWeight:600,cursor:"pointer" }}>🗑</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* New Template Modal */}
      {showNewTpl && (
        <>
          <div onClick={()=>setShowNewTpl(false)} style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.35)",zIndex:400 }}/>
          <div style={{ position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",
            width:480,background:"#fff",borderRadius:16,zIndex:500,padding:"24px",
            boxShadow:"0 24px 64px rgba(0,0,0,0.2)",maxHeight:"90vh",overflowY:"auto",fontFamily:"inherit" }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18 }}>
              <div style={{ fontSize:15,fontWeight:800,color:C.navy }}>🔄 New Automation Template</div>
              <button onClick={()=>setShowNewTpl(false)} style={{ width:26,height:26,borderRadius:"50%",border:`1px solid ${C.border}`,background:"#F8FAFC",color:C.muted,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>×</button>
            </div>
            <div style={{ display:"grid",gridTemplateColumns:"70px 1fr",gap:10,marginBottom:12 }}>
              <div>
                <label style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:5 }}>Icon</label>
                <input value={newTpl.icon} onChange={e=>setNewTpl(p=>({...p,icon:e.target.value}))}
                  style={{ width:"100%",padding:"9px 8px",borderRadius:8,border:`1.5px solid ${C.border}`,fontSize:20,fontFamily:"inherit",boxSizing:"border-box",outline:"none",textAlign:"center" }}/>
              </div>
              <div>
                <label style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:5 }}>Name</label>
                <input value={newTpl.name} onChange={e=>setNewTpl(p=>({...p,name:e.target.value}))}
                  placeholder="e.g. Anniversary reminder"
                  style={{ width:"100%",padding:"9px 12px",borderRadius:8,border:`1.5px solid ${C.border}`,fontSize:13,fontFamily:"inherit",boxSizing:"border-box",outline:"none" }}/>
              </div>
            </div>
            <div style={{ marginBottom:12 }}>
              <label style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:5 }}>Description</label>
              <input value={newTpl.desc} onChange={e=>setNewTpl(p=>({...p,desc:e.target.value}))}
                placeholder="e.g. 3 days before contract anniversary"
                style={{ width:"100%",padding:"9px 12px",borderRadius:8,border:`1.5px solid ${C.border}`,fontSize:13,fontFamily:"inherit",boxSizing:"border-box",outline:"none" }}/>
            </div>
            <div style={{ marginBottom:12 }}>
              <label style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:8 }}>Trigger type</label>
              <div style={{ display:"flex",gap:10 }}>
                {[["lead_field","📋 From lead field","Date comes from lead profile"],["crm_event","⚡ CRM event","Fires on a CRM action"]].map(([k,l,h])=>(
                  <button key={k} onClick={()=>setNewTpl(p=>({...p,triggerBasis:k,dateSource:""}))}
                    style={{ flex:1,padding:"10px",borderRadius:9,textAlign:"left",
                      border:`1.5px solid ${newTpl.triggerBasis===k?C.indigo:C.border}`,
                      background:newTpl.triggerBasis===k?C.indigo+"0A":"#fff",cursor:"pointer",fontFamily:"inherit" }}>
                    <div style={{ fontSize:12,fontWeight:700,color:newTpl.triggerBasis===k?C.indigo:C.text,marginBottom:2 }}>{l}</div>
                    <div style={{ fontSize:10,color:C.muted }}>{h}</div>
                  </button>
                ))}
              </div>
            </div>
            {newTpl.triggerBasis==="lead_field" && (
              <div style={{ marginBottom:12,padding:"10px 12px",borderRadius:9,background:"#EFF6FF",border:"1px solid #BFDBFE" }}>
                <label style={{ fontSize:11,fontWeight:700,color:C.blue,display:"block",marginBottom:6 }}>Contact field</label>
                <select value={newTpl.dateSource} onChange={e=>setNewTpl(p=>({...p,dateSource:e.target.value,dateSourceLabel:e.target.options[e.target.selectedIndex].text}))}
                  style={{ width:"100%",padding:"8px 12px",borderRadius:8,border:"1px solid #BFDBFE",background:"#fff",fontSize:12,fontFamily:"inherit",outline:"none" }}>
                  <option value="">Select field…</option>
                  <option value="lead.birthday">Birthday</option>
                  <option value="lead.anniversary">Contract anniversary</option>
                  <option value="lead.gdprExpiry">GDPR consent expiry</option>
                  <option value="lead.contractEnd">Contract end date</option>
                </select>
              </div>
            )}
            {newTpl.triggerBasis==="crm_event" && (
              <div style={{ marginBottom:12,padding:"10px 12px",borderRadius:9,background:"#F0FDF4",border:"1px solid #BBF7D0" }}>
                <label style={{ fontSize:11,fontWeight:700,color:C.green,display:"block",marginBottom:6 }}>CRM event</label>
                <select value={newTpl.dateSource} onChange={e=>setNewTpl(p=>({...p,dateSource:e.target.value,dateSourceLabel:e.target.options[e.target.selectedIndex].text}))}
                  style={{ width:"100%",padding:"8px 12px",borderRadius:8,border:"1px solid #BBF7D0",background:"#fff",fontSize:12,fontFamily:"inherit",outline:"none" }}>
                  <option value="">Select event…</option>
                  <option value="after_call">After call logged (Callback requested)</option>
                  <option value="before_appt">Before scheduled appointment</option>
                  <option value="on_inactivity">On lead inactivity (7+ days)</option>
                  <option value="after_first">After first contact registered</option>
                  <option value="on_assigned">On lead assigned to GP</option>
                </select>
              </div>
            )}
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:18 }}>
              {[["Recurrence",["Once","Daily","Weekly","Monthly","Yearly"],"recur"],["Priority",["high","normal","low"],"priority"]].map(([label,opts,key])=>(
                <div key={key}>
                  <label style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:5 }}>{label}</label>
                  <select value={newTpl[key]} onChange={e=>setNewTpl(p=>({...p,[key]:e.target.value}))}
                    style={{ width:"100%",padding:"9px 12px",borderRadius:8,border:`1.5px solid ${C.border}`,fontSize:12,fontFamily:"inherit",outline:"none",background:"#fff" }}>
                    {opts.map(o=><option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              ))}
            </div>
            <div style={{ display:"flex",gap:10 }}>
              <button onClick={()=>setShowNewTpl(false)} style={{ flex:1,padding:"10px",borderRadius:9,border:`1px solid ${C.border}`,background:"#fff",color:C.slate,fontSize:13,fontWeight:600,cursor:"pointer" }}>Cancel</button>
              <button disabled={!newTpl.name.trim()||!newTpl.dateSource}
                onClick={()=>{
                  TEMPLATES.push({ id:`tpl_${Date.now()}`, ...newTpl });
                  setTplActive(p=>({...p,[`tpl_${Date.now()}`]:false}));
                  setShowNewTpl(false);
                  setNewTpl({ name:"", icon:"⏰", desc:"", triggerBasis:"crm_event", dateSource:"", dateSourceLabel:"", recur:"Once", priority:"normal" });
                }}
                style={{ flex:2,padding:"10px",borderRadius:9,border:"none",
                  background:newTpl.name.trim()&&newTpl.dateSource?C.primary:"#E2E8F0",
                  color:newTpl.name.trim()&&newTpl.dateSource?"#fff":C.muted,
                  fontSize:13,fontWeight:700,cursor:newTpl.name.trim()&&newTpl.dateSource?"pointer":"default" }}>
                🔄 Save Automation Template
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ─── Email Automation Section ────────────────────────────────────────────────
