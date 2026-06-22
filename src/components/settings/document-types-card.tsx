import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { DOCUMENT_TYPES_STORE, setDOCUMENT_TYPES_STORE } from "../../lib/core";
import { C } from "../../theme";

export const DocumentTypesCard = () => {
  const [types, setTypes]     = useState(DOCUMENT_TYPES_STORE);
  const [editing, setEditing] = useState(null); // id of type being edited, or "new"
  const [form, setForm]       = useState({});

  const persist = (updated) => { setTypes(updated); setDOCUMENT_TYPES_STORE(updated); };

  const openEdit = (t) => {
    setEditing(t.id);
    setForm({ ...t, instructions: t.instructions.join("\n") });
  };

  const openNew = () => {
    const blank = { id:`dt${Date.now()}`, icon:"📄", label:"", required:false, subject:"", body:`Dear {{lead_name}},\n\nPlease provide the requested document.\n\nBest regards,\n{{consultant_name}}`, instructions:"", acceptedFormats:"PDF · Max 10 MB" };
    setEditing("new");
    setForm({ ...blank, instructions:"" });
  };

  const saveForm = () => {
    const updated = { ...form, instructions: form.instructions.split("\n").map(s=>s.trim()).filter(Boolean) };
    if (editing === "new") {
      persist([...types, updated]);
    } else {
      persist(types.map(t => t.id === editing ? updated : t));
    }
    setEditing(null);
  };

  const remove = (id) => { if(window.confirm("Delete this document type?")) persist(types.filter(t=>t.id!==id)); };
  const F = ({label,children}) => <div style={{ marginBottom:12 }}><div style={{ fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:4 }}>{label}</div>{children}</div>;
  const inp = { border:`1px solid ${C.border}`,borderRadius:6,padding:"7px 10px",fontSize:12,fontFamily:"inherit",color:C.text,width:"100%",boxSizing:"border-box" };

  return (
    <div style={{ background:"#fff",borderRadius:12,border:`1px solid ${C.border}`,marginBottom:16,overflow:"hidden" }}>
      <div style={{ padding:"14px 20px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
        <div>
          <div style={{ fontSize:13,fontWeight:700,color:C.text }}>📎 Document Request Templates</div>
          <div style={{ fontSize:11,color:C.muted,marginTop:2 }}>Each type has a title, email body, checklist of what the lead must provide, and accepted formats.</div>
        </div>
        <button onClick={openNew} style={{ padding:"5px 13px",borderRadius:6,border:"none",background:C.primary,color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer",flexShrink:0 }}>+ New Type</button>
      </div>

      {/* Editor */}
      {editing && (
        <div style={{ padding:"18px 20px",borderBottom:`1px solid ${C.border}`,background:"#F8FAFF" }}>
          <div style={{ fontSize:12,fontWeight:800,color:C.navy,marginBottom:14 }}>
            {editing==="new" ? "➕ New document type" : `✏️ Edit — ${form.label||"Untitled"}`}
          </div>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12 }}>
            <F label="Title / Label">
              <input value={form.label||""} onChange={e=>setForm(f=>({...f,label:e.target.value}))} placeholder="e.g. Income verification" style={inp}/>
            </F>
            <F label="Icon (emoji)">
              <input value={form.icon||""} onChange={e=>setForm(f=>({...f,icon:e.target.value}))} placeholder="💰" style={{...inp,width:70}}/>
            </F>
          </div>
          <F label="Email subject line">
            <input value={form.subject||""} onChange={e=>setForm(f=>({...f,subject:e.target.value}))} placeholder="Please send us your income verification" style={inp}/>
          </F>
          <F label="Email body — use {{lead_name}} and {{consultant_name}} as placeholders">
            <textarea value={form.body||""} onChange={e=>setForm(f=>({...f,body:e.target.value}))}
              style={{...inp,minHeight:100,resize:"vertical"}} />
          </F>
          <F label="Checklist items — one per line (shown to the lead as what to provide)">
            <textarea value={form.instructions||""} onChange={e=>setForm(f=>({...f,instructions:e.target.value}))}
              placeholder={"Most recent payslip\nIf self-employed: last 2 years' tax returns\nIf retired: pension statement"}
              style={{...inp,minHeight:72,resize:"vertical"}} />
          </F>
          <F label="Accepted formats">
            <input value={form.acceptedFormats||""} onChange={e=>setForm(f=>({...f,acceptedFormats:e.target.value}))} placeholder="PDF, JPG, PNG · Max 10 MB" style={inp}/>
          </F>
          <label style={{ display:"flex",alignItems:"center",gap:7,fontSize:12,color:C.slate,cursor:"pointer",marginBottom:14 }}>
            <input type="checkbox" checked={!!form.required} onChange={e=>setForm(f=>({...f,required:e.target.checked}))} style={{ accentColor:C.navy }}/>
            Mark as required (shows * in the request dropdown)
          </label>
          <div style={{ display:"flex",gap:8 }}>
            <button onClick={saveForm} disabled={!form.label?.trim()||!form.subject?.trim()}
              style={{ padding:"7px 18px",borderRadius:7,border:"none",
                background:(form.label?.trim()&&form.subject?.trim())?C.green:"#E2E8F0",
                color:(form.label?.trim()&&form.subject?.trim())?"#fff":C.muted,
                fontSize:12,fontWeight:700,cursor:(form.label?.trim()&&form.subject?.trim())?"pointer":"default" }}>
              ✓ Save Template
            </button>
            <button onClick={()=>setEditing(null)} style={{ padding:"7px 14px",borderRadius:7,border:`1px solid ${C.border}`,background:"#fff",color:C.slate,fontSize:12,cursor:"pointer" }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Types list */}
      <div style={{ padding:"16px 20px",display:"flex",flexDirection:"column",gap:8 }}>
        {types.map(t=>(
          <div key={t.id} style={{ borderRadius:10,border:`1px solid ${C.border}`,overflow:"hidden" }}>
            {/* Row header */}
            <div style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:"#F8FAFC" }}>
              <span style={{ fontSize:18,flexShrink:0 }}>{t.icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex",alignItems:"center",gap:6 }}>
                  <span style={{ fontSize:12,fontWeight:700,color:C.text }}>{t.label}</span>
                  {t.required && <span style={{ fontSize:9,fontWeight:800,padding:"1px 6px",borderRadius:5,background:C.red+"15",color:C.red,textTransform:"uppercase" }}>Required</span>}
                </div>
                <div style={{ fontSize:11,color:C.muted,marginTop:1 }}>Subject: {t.subject}</div>
              </div>
              <button onClick={()=>openEdit(t)} style={{ padding:"4px 10px",borderRadius:6,border:`1px solid ${C.border}`,background:"#fff",color:C.slate,fontSize:11,fontWeight:600,cursor:"pointer" }}>Edit</button>
              <button onClick={()=>remove(t.id)} style={{ background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:16,lineHeight:1,padding:"0 2px" }}>×</button>
            </div>
            {/* Content preview */}
            <div style={{ padding:"10px 14px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
              <div>
                <div style={{ fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:4 }}>Checklist ({t.instructions.length} items)</div>
                {t.instructions.slice(0,3).map((ins,i)=>(
                  <div key={i} style={{ fontSize:11,color:C.slate,display:"flex",gap:4,marginBottom:2 }}>
                    <span style={{ color:C.green,fontWeight:700,flexShrink:0 }}>✓</span>{ins}
                  </div>
                ))}
                {t.instructions.length>3 && <div style={{ fontSize:10,color:C.muted,marginTop:2 }}>+{t.instructions.length-3} more…</div>}
              </div>
              <div>
                <div style={{ fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:4 }}>Email body (preview)</div>
                <div style={{ fontSize:11,color:C.slate,fontStyle:"italic",lineHeight:1.5,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:3,WebkitBoxOrient:"vertical" }}>
                  {t.body.slice(0,120)}…
                </div>
                <div style={{ fontSize:10,color:C.muted,marginTop:4 }}>📎 {t.acceptedFormats}</div>
              </div>
            </div>
          </div>
        ))}
        {types.length===0 && (
          <div style={{ padding:"24px",textAlign:"center",color:C.muted,fontSize:12,fontStyle:"italic" }}>
            No document types defined. Click "+ New Type" to create one.
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Workflow Rules Section ───────────────────────────────────────────────────
