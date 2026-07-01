import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { BLANK_RULE, UNASSIGNED_LEADS_POOL, ZIP_RULES } from "../../lib/core";
import { C } from "../../theme";

export const AutoAssignPage = ({ role, navigateTo }) => {
  const [rules, setRules]             = useState(ZIP_RULES.map((r,i)=>({...r, _id:i})));
  const [assignments, setAssignments] = useState(() =>
    UNASSIGNED_LEADS_POOL.map(lead => {
      const rule = ZIP_RULES.find(r => lead.zip.startsWith(r.prefix));
      return { lead, rule: rule||null, selected: true, assigned: false };
    })
  );
  const [filterVD, setFilterVD]         = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [committed, setCommitted]       = useState(false);
  const [overrides, setOverrides]       = useState({});
  const [showRules, setShowRules]       = useState(false);
  // Modal state — null = closed, object = rule being edited (has _id) or new (no _id)
  const [ruleModal, setRuleModal]       = useState(null);
  const [ruleForm, setRuleForm]         = useState(BLANK_RULE);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const ALL_GPS = [...new Set(rules.map(r=>r.gp))];
  const ALL_VDS = [...new Set(rules.map(r=>r.vd))];
  const GP_LIST = ["Anna Klein","Marc Otto","Nina Schmitt","Kai Becker","Tanja Vogt","Ben Hartmann","Thomas Müller"];
  const VD_LIST = ["Thomas Müller","Lisa Weber","Ralf Fischer","Jana Kruse"];

  const getAssignedGP = (item) => overrides[item.lead.id] || item.rule?.gp || null;
  const getAssignedVD = (item) => item.rule?.vd || null;

  const filtered = assignments.filter(item => {
    if(filterStatus==="matched" && !item.rule) return false;
    if(filterStatus==="unmatched" && item.rule) return false;
    if(filterVD!=="all" && item.rule?.vd !== filterVD) return false;
    return true;
  });

  const matched   = assignments.filter(a=>a.rule).length;
  const unmatched = assignments.filter(a=>!a.rule).length;
  const selected  = assignments.filter(a=>a.selected).length;

  const toggleAll = (val) => setAssignments(prev => prev.map(a => ({ ...a, selected: val })));
  const toggleOne = (id)  => setAssignments(prev => prev.map(a => a.lead.id===id ? {...a, selected:!a.selected} : a));

  const handleCommit = () => {
    setAssignments(prev => prev.map(a =>
      a.selected && getAssignedGP(a) ? { ...a, assigned: true, selected: false } : a
    ));
    setCommitted(true);
    setTimeout(() => setCommitted(false), 3000);
  };

  const openAdd  = () => { setRuleForm({...BLANK_RULE}); setRuleModal("new"); };
  const openEdit = (r) => { setRuleForm({...r}); setRuleModal(r._id); };
  const closeModal = () => { setRuleModal(null); setDeleteConfirm(null); };

  const handleSaveRule = () => {
    if(!ruleForm.prefix.trim() || !ruleForm.gp || !ruleForm.vd) return;
    if(ruleModal==="new") {
      const newRule = { ...ruleForm, _id: Date.now(), convRate: parseFloat(ruleForm.convRate)||0, capacity: parseInt(ruleForm.capacity)||50, used: parseInt(ruleForm.used)||0 };
      setRules(prev => [...prev, newRule]);
    } else {
      setRules(prev => prev.map(r => r._id===ruleModal ? { ...ruleForm, _id: ruleModal, convRate: parseFloat(ruleForm.convRate)||0, capacity: parseInt(ruleForm.capacity)||50, used: parseInt(ruleForm.used)||0 } : r));
    }
    closeModal();
  };

  const handleDeleteRule = (_id) => {
    setRules(prev => prev.filter(r => r._id !== _id));
    closeModal();
  };

  const priorityColor = p => ({ high:C.green, medium:C.amber, low:C.red }[p] || C.muted);
  const capacityPct   = r => Math.round((r.used / r.capacity) * 100);

  const Field = ({ label, children }) => (
    <div style={{ marginBottom:14 }}>
      <label style={{ display:"block",fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:5 }}>{label}</label>
      {children}
    </div>
  );
  const inp = { border:`1px solid ${C.border}`,borderRadius:7,padding:"8px 10px",fontSize:13,fontFamily:"inherit",color:C.text,width:"100%",boxSizing:"border-box",outline:"none" };
  const sel = { ...inp, cursor:"pointer",background:"#fff" };

  return (
    <div style={{ padding:"24px 28px" }}>

      {/* Header */}
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20 }}>
        <div>
          <div style={{ fontSize:11,fontWeight:700,color:C.muted,letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:4 }}>Contacts · Auto-Assignment</div>
          <h1 style={{ margin:0,fontSize:26,fontWeight:800,color:C.navy,letterSpacing:"-0.02em" }}>Auto-Assign by ZIP</h1>
          <p style={{ margin:"4px 0 0",fontSize:13,color:C.slate }}>Automatically route unassigned leads to advisors based on ZIP code rules.</p>
        </div>
        <div style={{ display:"flex",gap:8 }}>
          <button onClick={()=>setShowRules(r=>!r)}
            style={{ padding:"8px 14px",borderRadius:7,border:`1px solid ${C.border}`,background:"#fff",color:C.slate,fontSize:12,fontWeight:600,cursor:"pointer" }}>
            {showRules?"Hide":"View"} ZIP Rules
          </button>
          <button onClick={()=>navigateTo("Leads")}
            style={{ padding:"8px 14px",borderRadius:7,border:`1px solid ${C.border}`,background:"#fff",color:C.slate,fontSize:12,fontWeight:600,cursor:"pointer" }}>
            ← Back to Contacts
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20 }}>
        {[
          { label:"Unassigned Contacts", value:assignments.length, color:C.red,    sub:"awaiting assignment" },
          { label:"ZIP Matched",      value:matched,            color:C.green,  sub:`${assignments.length?Math.round(matched/assignments.length*100):0}% auto-routable` },
          { label:"No ZIP Match",     value:unmatched,          color:C.amber,  sub:"manual assignment needed" },
          { label:"Selected",         value:selected,           color:C.navy,   sub:"ready to assign" },
        ].map(k=>(
          <div key={k.label} style={{ padding:"14px 18px",borderRadius:10,background:k.color+"0D",border:`1px solid ${k.color}25` }}>
            <div style={{ fontSize:10,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:4 }}>{k.label}</div>
            <div style={{ fontSize:26,fontWeight:800,color:k.color }}>{k.value}</div>
            <div style={{ fontSize:11,color:C.muted,marginTop:2 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* ZIP Rules Panel */}
      {showRules && (
        <div style={{ marginBottom:20,padding:"18px 20px",background:"#fff",borderRadius:12,border:`1px solid ${C.border}` }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14 }}>
            <div style={{ fontSize:13,fontWeight:700,color:C.text }}>ZIP Routing Rules <span style={{ fontSize:11,fontWeight:500,color:C.muted }}>({rules.length} active)</span></div>
            <button onClick={openAdd} style={{ padding:"6px 14px",borderRadius:6,border:"none",background:C.primary,color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer" }}>+ Add Rule</button>
          </div>
          <table style={{ width:"100%",borderCollapse:"collapse",fontSize:12 }}>
            <thead>
              <tr style={{ borderBottom:`2px solid ${C.border}` }}>
                {["ZIP Prefix","Region","Assigned GP","VD","Conv. Rate","Capacity","Priority",""].map(h=>(
                  <th key={h} style={{ padding:"6px 10px",textAlign:"left",fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rules.map((r,i)=>{
                const pct = capacityPct(r);
                const capColor = pct>=90 ? C.red : pct>=70 ? C.amber : C.green;
                return (
                  <tr key={r._id} style={{ borderBottom:`1px solid ${C.border}`,background:i%2?"#FAFAFA":"#fff" }}>
                    <td style={{ padding:"8px 10px",fontWeight:700,color:C.navy,fontFamily:"monospace" }}>{r.prefix}xxx</td>
                    <td style={{ padding:"8px 10px",color:C.text }}>{r.city}</td>
                    <td style={{ padding:"8px 10px",fontWeight:600,color:C.blue }}>{r.gp}</td>
                    <td style={{ padding:"8px 10px",color:C.slate }}>{r.vd}</td>
                    <td style={{ padding:"8px 10px",fontWeight:700,color:C.green }}>{r.convRate}%</td>
                    <td style={{ padding:"8px 10px" }}>
                      <div style={{ display:"flex",alignItems:"center",gap:6 }}>
                        <div style={{ flex:1,height:5,background:C.border,borderRadius:3,overflow:"hidden",minWidth:50 }}>
                          <div style={{ height:"100%",width:`${pct}%`,background:capColor,borderRadius:3 }}/>
                        </div>
                        <span style={{ fontSize:11,color:capColor,fontWeight:700,whiteSpace:"nowrap" }}>{r.used}/{r.capacity}</span>
                      </div>
                    </td>
                    <td style={{ padding:"8px 10px" }}>
                      <span style={{ fontSize:10,fontWeight:700,color:priorityColor(r.priority),background:priorityColor(r.priority)+"15",padding:"2px 8px",borderRadius:10,textTransform:"capitalize" }}>{r.priority}</span>
                    </td>
                    <td style={{ padding:"8px 10px" }}>
                      <button onClick={()=>openEdit(r)} style={{ padding:"4px 10px",borderRadius:5,border:`1px solid ${C.border}`,background:"#fff",color:C.slate,fontSize:11,fontWeight:600,cursor:"pointer" }}>Edit</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Success banner */}
      {committed && (
        <div style={{ marginBottom:16,padding:"12px 18px",borderRadius:10,background:"#ECFDF5",border:"1px solid #6EE7B7",display:"flex",alignItems:"center",gap:10 }}>
          <span style={{ fontSize:18 }}>✅</span>
          <div>
            <div style={{ fontSize:13,fontWeight:700,color:C.green }}>Assignments committed successfully</div>
            <div style={{ fontSize:12,color:"#065F46" }}>Selected leads have been assigned and advisors notified.</div>
          </div>
        </div>
      )}

      {/* Filter bar + action */}
      <div style={{ display:"flex",gap:10,alignItems:"center",marginBottom:14,padding:"12px 16px",background:"#fff",borderRadius:10,border:`1px solid ${C.border}` }}>
        <div style={{ display:"flex",background:"#F1F5F9",borderRadius:8,padding:3,gap:2 }}>
          {[["all","All Contacts"],["matched","ZIP Matched"],["unmatched","No Match"]].map(([v,l])=>(
            <button key={v} onClick={()=>setFilterStatus(v)}
              style={{ padding:"5px 12px",borderRadius:6,border:"none",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit",
                background:filterStatus===v?"#fff":"transparent",color:filterStatus===v?C.navy:C.muted,
                boxShadow:filterStatus===v?"0 1px 3px rgba(0,0,0,0.08)":"none" }}>{l}</button>
          ))}
        </div>
        {role!=="gp" && (
          <select value={filterVD} onChange={e=>setFilterVD(e.target.value)}
            style={{ border:`1px solid ${C.border}`,borderRadius:7,padding:"6px 10px",fontSize:12,fontFamily:"inherit",color:C.slate }}>
            <option value="all">All Directors</option>
            {ALL_VDS.map(v=><option key={v}>{v}</option>)}
          </select>
        )}
        <label style={{ display:"flex",alignItems:"center",gap:6,fontSize:12,color:C.slate,cursor:"pointer",marginLeft:4 }}>
          <input type="checkbox" onChange={e=>toggleAll(e.target.checked)} defaultChecked style={{ accentColor:C.navy,width:14,height:14 }}/>
          Select all
        </label>
        <div style={{ marginLeft:"auto",display:"flex",gap:8,alignItems:"center" }}>
          <span style={{ fontSize:12,color:C.muted }}>{selected} lead{selected!==1?"s":""} selected</span>
          <button onClick={handleCommit} disabled={selected===0}
            style={{ padding:"8px 18px",borderRadius:7,border:"none",
              background:selected>0?C.green:"#E2E8F0",color:selected>0?"#fff":C.muted,
              fontSize:12,fontWeight:700,cursor:selected>0?"pointer":"default",transition:"all 0.2s" }}>
            ⚡ Assign {selected>0?`${selected} Contact${selected!==1?"s":""}`:""} →
          </button>
        </div>
      </div>

      {/* Contact assignment table */}
      <div style={{ background:"#fff",borderRadius:12,border:`1px solid ${C.border}`,overflow:"hidden" }}>
        <table style={{ width:"100%",borderCollapse:"collapse",fontSize:12 }}>
          <thead>
            <tr style={{ background:"#F8FAFC",borderBottom:`2px solid ${C.border}` }}>
              <th style={{ padding:"10px 14px",width:36 }}/>
              {["Contact","Location","Source / Campaign","Assign To","VD","ZIP Match","Created",""].map(h=>(
                <th key={h} style={{ padding:"10px 12px",textAlign:"left",fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((item,i)=>{
              const { lead, rule } = item;
              const assignedGP = getAssignedGP(item);
              const assignedVD = getAssignedVD(item);
              const isAssigned = item.assigned;
              return (
                <tr key={lead.id} style={{ borderBottom:`1px solid ${C.border}`,background:isAssigned?"#F0FDF4":item.selected?"#F0F7FF":i%2?"#FAFAFA":"#fff",opacity:isAssigned?0.6:1 }}>
                  <td style={{ padding:"10px 14px" }}>
                    <input type="checkbox" checked={item.selected && !isAssigned} disabled={isAssigned}
                      onChange={()=>toggleOne(lead.id)}
                      style={{ accentColor:C.navy,width:14,height:14,cursor:"pointer" }}/>
                  </td>
                  <td style={{ padding:"10px 12px" }}>
                    <div style={{ fontWeight:700,color:C.text }}>{lead.name}</div>
                    <div style={{ fontSize:10,color:C.muted,marginTop:1 }}>{lead.id}</div>
                  </td>
                  <td style={{ padding:"10px 12px" }}>
                    <div style={{ fontWeight:600,color:C.slate }}>{lead.city}</div>
                    <div style={{ fontSize:11,fontFamily:"monospace",color:C.muted }}>{lead.zip}</div>
                  </td>
                  <td style={{ padding:"10px 12px" }}>
                    <div style={{ color:C.slate }}>{lead.source}</div>
                    <div style={{ fontSize:10,color:C.indigo,fontWeight:600 }}>{lead.campaign}</div>
                  </td>
                  <td style={{ padding:"10px 12px" }}>
                    {isAssigned ? (
                      <div style={{ display:"flex",alignItems:"center",gap:5,color:C.green,fontWeight:700,fontSize:11 }}>✓ {assignedGP}</div>
                    ) : (
                      <select
                        value={overrides[lead.id] || (rule?.gp || "")}
                        onChange={e=>setOverrides(prev=>({...prev,[lead.id]:e.target.value}))}
                        style={{ border:`1px solid ${rule?C.green+"60":C.amber+"60"}`,borderRadius:6,padding:"4px 8px",fontSize:11,
                          fontFamily:"inherit",background:rule?"#F0FDF4":"#FFFBEB",
                          color:rule?C.green:C.amber,fontWeight:600,cursor:"pointer" }}>
                        <option value="">— Select GP —</option>
                        {GP_LIST.map(gp=><option key={gp}>{gp}</option>)}
                      </select>
                    )}
                  </td>
                  <td style={{ padding:"10px 12px",color:C.slate,fontSize:11 }}>
                    {assignedVD || <span style={{ color:C.muted }}>—</span>}
                  </td>
                  <td style={{ padding:"10px 12px" }}>
                    {rule ? (
                      <span style={{ display:"inline-flex",alignItems:"center",gap:4,fontSize:10,fontWeight:700,color:C.green,background:"#ECFDF5",padding:"3px 8px",borderRadius:10 }}>
                        ✓ {rule.prefix}xxx → {rule.gp}
                      </span>
                    ) : (
                      <span style={{ fontSize:10,fontWeight:700,color:C.amber,background:"#FFFBEB",padding:"3px 8px",borderRadius:10 }}>⚠ No rule</span>
                    )}
                  </td>
                  <td style={{ padding:"10px 12px",color:C.muted,fontSize:11,whiteSpace:"nowrap" }}>{lead.created}</td>
                  <td style={{ padding:"10px 12px" }}>
                    {!lead.consent && <span style={{ fontSize:10,fontWeight:700,color:C.red,background:"#FEF2F2",padding:"2px 7px",borderRadius:8 }}>No consent</span>}
                    {isAssigned && <span style={{ fontSize:10,fontWeight:700,color:C.green }}>✓ Done</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length===0 && (
          <div style={{ padding:"48px 24px",textAlign:"center",color:C.muted }}>
            <div style={{ fontSize:28,marginBottom:10 }}>🎉</div>
            <div style={{ fontSize:14,fontWeight:700 }}>All leads assigned!</div>
          </div>
        )}
      </div>

      {/* ── Add / Edit Rule Modal ─────────────────────────────────────────────── */}
      {ruleModal !== null && (
        <>
          <div onClick={closeModal} style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:600 }}/>
          <div style={{ position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",
            width:480,background:"#fff",borderRadius:16,zIndex:700,
            boxShadow:"0 20px 60px rgba(0,0,0,0.2)",overflow:"hidden",fontFamily:"inherit" }}>

            {/* Modal header */}
            <div style={{ padding:"18px 22px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
              <div>
                <div style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:2 }}>ZIP Routing</div>
                <div style={{ fontSize:17,fontWeight:800,color:C.navy }}>{ruleModal==="new" ? "Add New Rule" : "Edit Rule"}</div>
              </div>
              <button onClick={closeModal} style={{ background:"#F1F5F9",border:"none",color:C.slate,fontSize:18,cursor:"pointer",borderRadius:8,width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center" }}>×</button>
            </div>

            {/* Modal body */}
            <div style={{ padding:"20px 22px" }}>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:0 }}>
                <Field label="ZIP Prefix *">
                  <input value={ruleForm.prefix} onChange={e=>setRuleForm(f=>({...f,prefix:e.target.value}))}
                    placeholder="e.g. 80" maxLength={5} style={inp}/>
                  <div style={{ fontSize:10,color:C.muted,marginTop:3 }}>Contacts whose ZIP starts with this will match</div>
                </Field>
                <Field label="Region / City *">
                  <input value={ruleForm.city} onChange={e=>setRuleForm(f=>({...f,city:e.target.value}))}
                    placeholder="e.g. München (80xxx)" style={inp}/>
                </Field>
                <Field label="Assign to GP *">
                  <select value={ruleForm.gp} onChange={e=>setRuleForm(f=>({...f,gp:e.target.value}))} style={sel}>
                    <option value="">— Select —</option>
                    {GP_LIST.map(g=><option key={g}>{g}</option>)}
                  </select>
                </Field>
                <Field label="Sales Director *">
                  <select value={ruleForm.vd} onChange={e=>setRuleForm(f=>({...f,vd:e.target.value}))} style={sel}>
                    <option value="">— Select —</option>
                    {VD_LIST.map(v=><option key={v}>{v}</option>)}
                  </select>
                </Field>
                <Field label="Conv. Rate (%)">
                  <input value={ruleForm.convRate} onChange={e=>setRuleForm(f=>({...f,convRate:e.target.value}))}
                    placeholder="e.g. 7.5" type="number" step="0.1" min="0" max="100" style={inp}/>
                </Field>
                <Field label="Capacity (max contacts)">
                  <input value={ruleForm.capacity} onChange={e=>setRuleForm(f=>({...f,capacity:e.target.value}))}
                    placeholder="e.g. 80" type="number" min="1" style={inp}/>
                </Field>
                <Field label="Current Load">
                  <input value={ruleForm.used} onChange={e=>setRuleForm(f=>({...f,used:e.target.value}))}
                    placeholder="e.g. 62" type="number" min="0" style={inp}/>
                </Field>
                <Field label="Priority">
                  <select value={ruleForm.priority} onChange={e=>setRuleForm(f=>({...f,priority:e.target.value}))} style={sel}>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </Field>
              </div>
            </div>

            {/* Modal footer */}
            <div style={{ padding:"14px 22px",borderTop:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",background:"#FAFAFA" }}>
              <div>
                {ruleModal!=="new" && !deleteConfirm && (
                  <button onClick={()=>setDeleteConfirm(ruleModal)}
                    style={{ padding:"7px 14px",borderRadius:7,border:`1px solid ${C.red}40`,background:"#FEF2F2",color:C.red,fontSize:12,fontWeight:600,cursor:"pointer" }}>
                    Delete Rule
                  </button>
                )}
                {deleteConfirm && (
                  <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                    <span style={{ fontSize:12,color:C.red,fontWeight:600 }}>Delete this rule?</span>
                    <button onClick={()=>handleDeleteRule(ruleModal)} style={{ padding:"5px 12px",borderRadius:6,border:"none",background:C.red,color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer" }}>Yes, Delete</button>
                    <button onClick={()=>setDeleteConfirm(null)} style={{ padding:"5px 12px",borderRadius:6,border:`1px solid ${C.border}`,background:"#fff",color:C.muted,fontSize:11,fontWeight:600,cursor:"pointer" }}>Cancel</button>
                  </div>
                )}
              </div>
              <div style={{ display:"flex",gap:8 }}>
                <button onClick={closeModal} style={{ padding:"8px 16px",borderRadius:7,border:`1px solid ${C.border}`,background:"#fff",color:C.slate,fontSize:12,fontWeight:600,cursor:"pointer" }}>Cancel</button>
                <button onClick={handleSaveRule}
                  disabled={!ruleForm.prefix.trim()||!ruleForm.gp||!ruleForm.vd}
                  style={{ padding:"8px 18px",borderRadius:7,border:"none",
                    background:ruleForm.prefix.trim()&&ruleForm.gp&&ruleForm.vd?C.primary:"#E2E8F0",
                    color:ruleForm.prefix.trim()&&ruleForm.gp&&ruleForm.vd?"#fff":C.muted,
                    fontSize:12,fontWeight:700,cursor:"pointer" }}>
                  {ruleModal==="new" ? "Add Rule" : "Save Changes"}
                </button>
              </div>
            </div>

          </div>
        </>
      )}

    </div>
  );
};

// ─── Contact Capture Page (LC-01 to LC-07, LDM-01 to LDM-05) ───────────────────
