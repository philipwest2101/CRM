import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { LIFECYCLE_STORE, STATUS_FLAGS, STATUS_META, setLIFECYCLE_STORE } from "../../lib/core";
import { C } from "../../theme";

export const StatusesSection = ({ role }) => {
  const [stages, setStages]       = useState(LIFECYCLE_STORE.map(s=>({ ...s, statuses:s.statuses.map(x=>({...x})) })));
  const [editing, setEditing]     = useState(null);   // status id being edited
  const [addingTo, setAddingTo]   = useState(null);   // stage id we're adding a status to
  const [showNewStage, setShowNewStage] = useState(false);
  const [draft, setDraft]         = useState({ nameDe:"", nameEn:"", manual:true, flags:[] });
  const [stageDraft, setStageDraft] = useState({ nameDe:"", nameEn:"" });
  const [saved, setSaved]         = useState("");

  const persist = (next) => { setStages(next); setLIFECYCLE_STORE(next); };
  const flash   = (m) => { setSaved(m); setTimeout(()=>setSaved(""),1800); };

  // Stage operations
  const moveStage = (i,dir) => { const j=i+dir; if(j<0||j>=stages.length) return; const n=[...stages]; [n[i],n[j]]=[n[j],n[i]]; persist(n); flash("Order updated"); };
  const deleteStage = (id) => { const st=stages.find(s=>s.id===id); if(st.statuses.length && !window.confirm(`Delete "${st.nameEn}" and its ${st.statuses.length} status(es)?`)) return; persist(stages.filter(s=>s.id!==id)); flash("Lifecycle stage deleted"); };
  const addStage = () => { if(!stageDraft.nameDe.trim()) return; persist([...stages,{ id:`lc${Date.now()}`, nameDe:stageDraft.nameDe.trim(), nameEn:(stageDraft.nameEn||stageDraft.nameDe).trim(), statuses:[] }]); setStageDraft({nameDe:"",nameEn:""}); setShowNewStage(false); flash("Lifecycle stage added"); };

  // Status operations
  const startAdd  = (stageId) => { setAddingTo(stageId); setEditing(null); setDraft({ nameDe:"", nameEn:"", manual:true, flags:[] }); };
  const startEdit = (st) => { setEditing(st.id); setAddingTo(null); setDraft({ ...st, manual:st.manual!==false, flags:[...(st.flags||[])] }); };
  const cancelDraft = () => { setEditing(null); setAddingTo(null); };
  const toggleFlag  = (f) => setDraft(d=>({ ...d, flags:d.flags.includes(f)?d.flags.filter(x=>x!==f):[...d.flags,f] }));
  const saveStatus  = (stageId) => {
    if(!draft.nameDe.trim()) return;
    // Derive a stable key + color for new statuses so they flow into STATUS_META.
    const flagColor = (draft.flags||[]).includes("isWon")?C.green
      :(draft.flags||[]).includes("isNotReachedTerminal")?C.red
      :(draft.flags||[]).includes("excludesOutreach")?C.slate
      :(draft.flags||[]).includes("isAppointment")?C.indigo
      :(draft.flags||[]).includes("isNewDefault")?C.slate:C.blue;
    const key = draft.key || ((draft.nameEn||draft.nameDe).toLowerCase().replace(/[^a-z0-9]+/g,"_").replace(/^_+|_+$/g,"")||`st_${Date.now()}`);
    const clean = { ...draft, key, color:draft.color||flagColor, bg:draft.bg||"#F1F5F9",
      nameDe:draft.nameDe.trim(), nameEn:(draft.nameEn||draft.nameDe).trim() };
    let next;
    if(editing) next = stages.map(s=>({ ...s, statuses:s.statuses.map(x=>x.id===editing?{...clean,id:editing}:x) }));
    else        next = stages.map(s=>s.id===stageId?{ ...s, statuses:[...s.statuses,{...clean,id:`st${Date.now()}`}] }:s);
    persist(next); cancelDraft(); flash("Status saved");
  };
  const deleteStatus = (id) => { if(!window.confirm("Delete this status? Contacts currently in it would need reassigning.")) return; persist(stages.map(s=>({ ...s, statuses:s.statuses.filter(x=>x.id!==id) }))); flash("Status deleted"); };

  if(role!=="superadmin") return <div style={{ padding:"40px",textAlign:"center",color:C.muted,fontSize:13 }}>Only the Super Admin can configure statuses.</div>;

  const lab  = { display:"block",fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:6 };
  const inp  = { width:"100%",padding:"9px 12px",borderRadius:8,border:`1.5px solid ${C.border}`,fontSize:13,fontFamily:"inherit",boxSizing:"border-box",outline:"none",color:C.text };
  const btnGhost   = { padding:"8px 18px",borderRadius:8,border:`1px solid ${C.border}`,background:"#fff",color:C.slate,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit" };
  const btnPrimary = { padding:"8px 18px",borderRadius:8,border:"none",fontSize:13,fontWeight:700,fontFamily:"inherit" };
  const arrowBtn = (d) => ({ border:"none",background:"transparent",cursor:d?"default":"pointer",color:d?C.border:C.slate,fontSize:9,lineHeight:1,padding:"1px 3px",fontFamily:"inherit" });

  // Editor rendered via a function (not a nested component) so inputs keep focus.
  const renderEditor = (stageId) => (
    <div style={{ padding:"16px",borderRadius:10,border:`1.5px solid ${C.indigo}30`,background:C.indigo+"05",margin:"8px 0" }}>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12 }}>
        <div><label style={lab}>German name *</label><input value={draft.nameDe} onChange={e=>setDraft(d=>({...d,nameDe:e.target.value}))} placeholder="z. B. Nicht erreicht" style={inp}/></div>
        <div><label style={lab}>English name</label><input value={draft.nameEn} onChange={e=>setDraft(d=>({...d,nameEn:e.target.value}))} placeholder="e.g. Not Reached" style={inp}/></div>
      </div>
      <div style={{ marginBottom:12 }}>
        <label style={lab}>How it's set</label>
        <div onClick={()=>setDraft(d=>({...d,manual:!d.manual}))}
          style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:8,cursor:"pointer",
            border:`1.5px solid ${draft.manual?C.indigo:C.border}`,background:draft.manual?C.indigo+"08":"#fff" }}>
          <div style={{ width:18,height:18,borderRadius:5,border:`2px solid ${draft.manual?C.indigo:C.border}`,background:draft.manual?C.indigo:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#fff",flexShrink:0 }}>{draft.manual?"✓":""}</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:12,fontWeight:700,color:draft.manual?C.indigo:C.text }}>Advisors can set this status manually</div>
            <div style={{ fontSize:10,color:C.muted,marginTop:1 }}>Automatic transitions are configured in Workflow &amp; Automation, not here.</div>
          </div>
        </div>
      </div>
      <div style={{ marginBottom:14 }}>
        <label style={lab}>Status flags — automation targets these, not the name</label>
        <div style={{ display:"flex",flexWrap:"wrap",gap:8 }}>
          {STATUS_FLAGS.map(f=>(
            <button key={f.id} onClick={()=>toggleFlag(f.id)}
              style={{ padding:"6px 12px",borderRadius:20,cursor:"pointer",fontFamily:"inherit",fontSize:11,fontWeight:700,
                border:`1.5px solid ${draft.flags.includes(f.id)?C.green:C.border}`,background:draft.flags.includes(f.id)?C.green+"12":"#fff",
                color:draft.flags.includes(f.id)?C.green:C.slate }}>
              {draft.flags.includes(f.id)?"✓ ":""}{f.label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display:"flex",justifyContent:"flex-end",gap:10 }}>
        <button onClick={cancelDraft} style={btnGhost}>Cancel</button>
        <button onClick={()=>saveStatus(stageId)} disabled={!draft.nameDe.trim()}
          style={{...btnPrimary,background:draft.nameDe.trim()?C.primary:"#E2E8F0",color:draft.nameDe.trim()?"#fff":C.muted,cursor:draft.nameDe.trim()?"pointer":"default"}}>Save status</button>
      </div>
    </div>
  );

  return (<>
    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8 }}>
      <div>
        <div style={{ fontSize:20,fontWeight:800,color:C.navy,marginBottom:4 }}>🔄 Statuses</div>
        <div style={{ fontSize:12,color:C.muted }}>Define the lead pipeline: Lifecycle Stages and the Statuses grouped under them.</div>
      </div>
      <button onClick={()=>{setShowNewStage(v=>!v);setStageDraft({nameDe:"",nameEn:""});}}
        style={{ padding:"8px 18px",borderRadius:9,border:"none",background:C.primary,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",flexShrink:0 }}>
        {showNewStage?"✕ Cancel":"+ Lifecycle stage"}
      </button>
    </div>

    {saved && <div style={{ marginBottom:16,padding:"10px 16px",borderRadius:8,background:"#ECFDF5",border:`1px solid ${C.green}40`,fontSize:12,fontWeight:700,color:C.green }}>✅ {saved}</div>}

    <div style={{ padding:"12px 16px",borderRadius:10,background:C.blue+"08",border:`1px solid ${C.blue}25`,marginBottom:16,fontSize:12,color:C.text,lineHeight:1.5 }}>
      This page defines the status vocabulary — names, order, Lifecycle Stage grouping, and the <strong>flags</strong> automation targets. Whether a status is set <strong>manually</strong> by an advisor is toggled per status here; <strong>automatic</strong> transitions (and the not-reached threshold) live in <strong>Workflow &amp; Automation</strong>. Automation reads the flags, never the name, so renaming or reordering never breaks a rule.
    </div>

    {showNewStage && (
      <div style={{ padding:"16px 18px",borderRadius:12,border:`1.5px solid ${C.indigo}30`,background:C.indigo+"05",marginBottom:16 }}>
        <div style={{ fontSize:13,fontWeight:700,color:C.text,marginBottom:12 }}>New lifecycle stage</div>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12 }}>
          <div><label style={lab}>German name *</label><input value={stageDraft.nameDe} onChange={e=>setStageDraft(d=>({...d,nameDe:e.target.value}))} placeholder="z. B. In Kontakt" style={inp}/></div>
          <div><label style={lab}>English name</label><input value={stageDraft.nameEn} onChange={e=>setStageDraft(d=>({...d,nameEn:e.target.value}))} placeholder="e.g. In Contact" style={inp}/></div>
        </div>
        <div style={{ display:"flex",justifyContent:"flex-end",gap:10 }}>
          <button onClick={()=>setShowNewStage(false)} style={btnGhost}>Cancel</button>
          <button onClick={addStage} disabled={!stageDraft.nameDe.trim()} style={{...btnPrimary,background:stageDraft.nameDe.trim()?C.primary:"#E2E8F0",color:stageDraft.nameDe.trim()?"#fff":C.muted,cursor:stageDraft.nameDe.trim()?"pointer":"default"}}>Add stage</button>
        </div>
      </div>
    )}

    {stages.map((s,i)=>(
      <div key={s.id} style={{ borderRadius:12,border:`1px solid ${C.border}`,background:"#fff",marginBottom:14,overflow:"hidden" }}>
        <div style={{ display:"flex",alignItems:"center",gap:10,padding:"12px 16px",background:"#FAFAFA",borderBottom:`1px solid ${C.border}` }}>
          <div style={{ display:"flex",flexDirection:"column" }}>
            <button onClick={()=>moveStage(i,-1)} disabled={i===0} style={arrowBtn(i===0)}>▲</button>
            <button onClick={()=>moveStage(i,1)} disabled={i===stages.length-1} style={arrowBtn(i===stages.length-1)}>▼</button>
          </div>
          <div style={{ flex:1,minWidth:0 }}>
            <div style={{ fontSize:14,fontWeight:800,color:C.navy }}>{s.nameEn}</div>
            <div style={{ fontSize:11,color:C.muted }}>{s.nameDe} · {s.statuses.length} status{s.statuses.length===1?"":"es"}</div>
          </div>
          <button onClick={()=>startAdd(s.id)} style={{ padding:"6px 12px",borderRadius:7,border:`1px solid ${C.primary}`,background:"#fff",color:C.navy,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit" }}>+ Status</button>
          <button onClick={()=>deleteStage(s.id)} style={{ padding:"6px 10px",borderRadius:7,border:`1px solid ${C.border}`,background:"#fff",color:C.red,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit" }}>Delete</button>
        </div>
        <div style={{ padding:"8px 16px 14px" }}>
          {s.statuses.length===0 && addingTo!==s.id && <div style={{ padding:"14px",textAlign:"center",fontSize:12,color:C.muted }}>No statuses yet. Add one to start.</div>}
          {s.statuses.map(st=>(
            <div key={st.id}>
              {editing===st.id ? renderEditor(s.id) : (
                <div style={{ display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:`1px solid ${C.border}50` }}>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ fontSize:13,fontWeight:700,color:C.text }}>{st.nameEn}</div>
                    <div style={{ fontSize:11,color:C.muted }}>{st.nameDe}</div>
                    {(st.flags||[]).length>0 && (
                      <div style={{ display:"flex",flexWrap:"wrap",gap:5,marginTop:5 }}>
                        {st.flags.map(f=>{ const meta=STATUS_FLAGS.find(x=>x.id===f); return <span key={f} style={{ fontSize:10,fontWeight:700,color:C.green,background:C.green+"12",border:`1px solid ${C.green}30`,borderRadius:5,padding:"2px 7px" }}>{meta?meta.label:f}</span>; })}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign:"right",flexShrink:0 }}>
                    <span style={{ fontSize:10,fontWeight:700,color:st.manual!==false?C.indigo:C.slate,background:(st.manual!==false?C.indigo:C.slate)+"12",border:`1px solid ${(st.manual!==false?C.indigo:C.slate)}30`,borderRadius:6,padding:"3px 9px" }}>{st.manual!==false?"Manual ✓":"Automation only"}</span>
                  </div>
                  <div style={{ display:"flex",gap:6,flexShrink:0 }}>
                    <button onClick={()=>startEdit(st)} style={{ padding:"5px 10px",borderRadius:6,border:`1px solid ${C.border}`,background:"#fff",color:C.slate,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit" }}>Edit</button>
                    <button onClick={()=>deleteStatus(st.id)} style={{ padding:"5px 10px",borderRadius:6,border:`1px solid ${C.border}`,background:"#fff",color:C.red,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit" }}>✕</button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {addingTo===s.id && renderEditor(s.id)}
        </div>
      </div>
    ))}
  </>);
};


