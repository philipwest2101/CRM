import React, { useState } from "react";
import { ATTACHMENTS_STORE, JOURNEY_META } from "../../lib/core";
import { useT } from "../../lib/i18n";
import { C } from "../../theme";
import { CANVAS_BG, BlocksPalette, BlockCanvas, DeviceToggle, instantiateTpl, newBlock, newSection } from "./block-editor";

// ─────────────────────────────────────────────────────────────────────────────
// Unified email template editor — the same block-based editor the Newsletter
// page uses, plus template metadata: language, journey and attachments.
// Full-screen overlay; saves the whole template back via onSave.
// ─────────────────────────────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  fontSize:10.5, fontWeight:700, color:C.slate, textTransform:"uppercase",
  letterSpacing:"0.05em", display:"block", marginBottom:4,
};
const inputStyle: React.CSSProperties = {
  width:"100%", padding:"9px 11px", borderRadius:8, border:`1px solid ${C.border}`,
  fontSize:13, fontFamily:"inherit", boxSizing:"border-box", outline:"none", background:"#fff", color:C.text,
};

// showJourney=false hides the journey field (MVP settings — the journey/
// automation concept is not part of the MVP surface); the template keeps its
// existing journey untouched so newsletters stay newsletters.
export const EmailTemplateEditor = ({ template, onSave, onClose, showJourney = true }) => {
  const t = useT();
  const [name,        setName]        = useState(template.name||"");
  const [subject,     setSubject]     = useState(template.subject||"");
  const [lang,        setLang]        = useState(template.lang||"de");
  const [journey,     setJourney]     = useState(template.journey||"welcome");
  const [attachments, setAttachments] = useState(template.attachments||[]);
  const [blocks,      setBlocks]      = useState(() => instantiateTpl(template, template.lang||"de"));
  const [selId,       setSelId]       = useState(null);
  const [dragType,    setDragType]    = useState(null);
  const [dropIdx,     setDropIdx]     = useState(null);
  const [canvasMode,  setCanvasMode]  = useState("desktop");
  const [panelSec,    setPanelSec]    = useState("blocks");   // blocks | settings

  const selBlock = blocks.find(b=>b.id===selId);
  const canvasW  = canvasMode==="mobile" ? 375 : 600;

  // ── Block operations (spec: {type} for content, {ratios} for sections) ─────
  const addBlockAt = (spec, idx=null) => {
    const b = spec.ratios ? newSection(spec.ratios, lang) : newBlock(spec.type, lang);
    setBlocks(prev => { const next=[...prev]; next.splice(idx==null?next.length:idx, 0, b); return next; });
    setSelId(b.id);
  };
  const updateBlock = (id, patch) => setBlocks(prev => prev.map(b => b.id===id ? { ...b, ...patch } : b));
  const removeBlock = (id) => { setBlocks(prev => prev.filter(b=>b.id!==id)); if(selId===id) setSelId(null); };
  const moveBlock   = (id, dir) => setBlocks(prev => {
    const i = prev.findIndex(b=>b.id===id), j = i + (dir==="up"?-1:1);
    if (i<0 || j<0 || j>=prev.length) return prev;
    const next=[...prev]; [next[i],next[j]]=[next[j],next[i]]; return next;
  });

  const settingsPanel = (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
      {/* Language */}
      <div>
        <label style={labelStyle}>Language</label>
        <div style={{ display:"flex", gap:6 }}>
          {[["de","🇩🇪 DE"],["en","🇬🇧 EN"]].map(([k,l])=>(
            <button key={k} onClick={()=>setLang(k)}
              style={{ flex:1, padding:"7px 0", borderRadius:7,
                border:`1.5px solid ${lang===k?(k==="en"?C.blue:C.amber):C.border}`,
                background:lang===k?(k==="en"?"#EFF6FF":"#FFF7ED"):"#fff",
                color:lang===k?(k==="en"?C.blue:C.amber):C.muted,
                fontSize:12, fontWeight:lang===k?700:400, cursor:"pointer", fontFamily:"inherit" }}>{l}</button>
          ))}
        </div>
        <div style={{ fontSize:9.5, color:C.muted, marginTop:4 }}>
          {lang==="de"?"Sent to contacts with German preference":"Sent to contacts with English preference"}
        </div>
      </div>

      {/* Journey */}
      {showJourney && (
        <div>
          <label style={labelStyle}>Journey</label>
          <select value={journey} onChange={e=>setJourney(e.target.value)} style={{ ...inputStyle, cursor:"pointer" }}>
            {Object.entries(JOURNEY_META).map(([k,m])=><option key={k} value={k}>{m.label}</option>)}
          </select>
          <div style={{ fontSize:9.5, color:C.muted, marginTop:4 }}>
            Journeys drive workflow automation; "Newsletter" templates appear on the Newsletter page.
          </div>
        </div>
      )}

      {/* Attachments — from the central library (Settings → Attachments) */}
      <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:11 }}>
        <label style={labelStyle}>📎 Attachments ({attachments.length})</label>
        {attachments.length>0 && (
          <div style={{ display:"flex", flexDirection:"column", gap:5, marginBottom:8 }}>
            {attachments.map((a,i)=>{
              const tc = {PDF:C.red,DOCX:C.blue,XLSX:C.green,PNG:C.purple,JPG:C.amber}[a.type]||C.muted;
              return (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:7, padding:"6px 9px", borderRadius:8, background:"#F8FAFC", border:`1px solid ${C.border}` }}>
                  <span style={{ fontSize:9, fontWeight:800, padding:"2px 6px", borderRadius:5, background:tc+"18", color:tc, flexShrink:0 }}>{a.type||"FILE"}</span>
                  <span style={{ flex:1, fontSize:11, color:C.text, fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{a.name}</span>
                  <button onClick={()=>setAttachments(prev=>prev.filter((_,j)=>j!==i))}
                    style={{ background:"none", border:"none", cursor:"pointer", color:C.muted, fontSize:13, lineHeight:1, flexShrink:0, padding:"0 2px" }}>×</button>
                </div>
              );
            })}
          </div>
        )}
        <div style={{ fontSize:10, fontWeight:700, color:C.muted, marginBottom:5 }}>Library:</div>
        <div style={{ display:"flex", flexDirection:"column", gap:4, maxHeight:150, overflowY:"auto" }}>
          {ATTACHMENTS_STORE.filter(a=>!attachments.find(x=>x.id===a.id)).length===0 && (
            <div style={{ fontSize:10.5, color:C.muted, fontStyle:"italic", padding:"4px 0" }}>
              All library files attached, or the library is empty (Settings → Attachments).
            </div>
          )}
          {ATTACHMENTS_STORE.filter(a=>!attachments.find(x=>x.id===a.id)).map(a=>{
            const tc = {PDF:C.red,DOCX:C.blue,XLSX:C.green,PNG:C.purple,JPG:C.amber}[a.type]||C.muted;
            return (
              <div key={a.id} onClick={()=>setAttachments(prev=>[...prev,a])}
                style={{ display:"flex", alignItems:"center", gap:7, padding:"6px 9px", borderRadius:8,
                  background:"#fff", border:`1px solid ${C.border}`, cursor:"pointer" }}
                onMouseEnter={e=>{ e.currentTarget.style.background="#F0F4FF"; e.currentTarget.style.borderColor=C.navy; }}
                onMouseLeave={e=>{ e.currentTarget.style.background="#fff"; e.currentTarget.style.borderColor=C.border; }}>
                <span style={{ fontSize:9, fontWeight:800, padding:"2px 6px", borderRadius:5, background:tc+"18", color:tc, flexShrink:0 }}>{a.type}</span>
                <span style={{ flex:1, fontSize:11, color:C.text, fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{a.name}</span>
                <span style={{ fontSize:10, fontWeight:700, color:C.green, flexShrink:0 }}>+ Attach</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ position:"fixed", inset:0, zIndex:700, display:"flex", flexDirection:"column", background:CANVAS_BG }}>
      {/* ── Top bar ── */}
      <div style={{ background:"#fff", borderBottom:`1px solid ${C.border}`, padding:"0 16px", height:52,
        display:"flex", alignItems:"center", gap:12, flexShrink:0 }}>
        <button onClick={onClose}
          style={{ padding:"6px 12px", borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit",
            border:`1px solid ${C.border}`, background:"#fff", color:C.slate }}>✕ Cancel</button>
        <span style={{ fontSize:11, fontWeight:800, color:C.indigo, background:C.indigo+"12", padding:"3px 10px", borderRadius:12, flexShrink:0 }}>
          ✉️ Email Template
        </span>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="Template name"
          style={{ border:"none", outline:"none", fontSize:15, fontWeight:700, color:C.navy, fontFamily:"inherit",
            flex:1, background:"transparent" }}/>
        <DeviceToggle t={t} mode={canvasMode} setMode={setCanvasMode}/>
        <button onClick={()=>onSave({ ...template, name, subject, lang, journey, attachments, blocks })}
          style={{ padding:"7px 16px", borderRadius:8, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit",
            border:"none", background:C.primary, color:"#fff" }}>✓ Save Template</button>
      </div>

      <div style={{ flex:1, display:"flex", overflow:"hidden" }}>
        {/* ── Left panel: accordion — Content blocks / Template settings ── */}
        <div style={{ width:290, background:"#fff", borderRight:`1px solid ${C.border}`, overflowY:"auto", flexShrink:0,
          display:"flex", flexDirection:"column" }}>
          {[["blocks","🧱",t("nlContentBlocks")],["settings","⚙️","Template Settings"]].map(([id,icon,label])=>(
            <React.Fragment key={id}>
              <button onClick={()=>setPanelSec(id)}
                style={{ width:"100%", display:"flex", alignItems:"center", gap:8, padding:"12px 14px",
                  border:"none", borderBottom:`1px solid ${C.border}`, cursor:"pointer", fontFamily:"inherit",
                  background:panelSec===id?"#fff":C.light, textAlign:"left",
                  fontSize:12.5, fontWeight:800, color:panelSec===id?C.navy:C.slate, flexShrink:0 }}>
                <span>{icon}</span><span style={{ flex:1 }}>{label}</span>
                <span style={{ fontSize:10 }}>{panelSec===id?"▾":"▸"}</span>
              </button>
              {panelSec===id && (
                <div style={{ padding:id==="blocks"?12:"12px 14px", borderBottom:`1px solid ${C.border}` }}>
                  {id==="blocks"
                    ? <BlocksPalette t={t} onAdd={addBlockAt}
                        onDragStart={setDragType} onDragEnd={()=>{ setDragType(null); setDropIdx(null); }}
                        selBlock={selBlock}
                        onToken={tk=>updateBlock(selBlock.id, { text:(selBlock.text||"")+" "+tk })}/>
                    : settingsPanel}
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* ── Center: canvas with subject header ── */}
        <BlockCanvas t={t} width={canvasW} blocks={blocks} selId={selId} setSelId={setSelId}
          dragType={dragType} dropIdx={dropIdx} setDropIdx={setDropIdx}
          onDropAt={idx=>{ addBlockAt(dragType, idx); setDragType(null); setDropIdx(null); }}
          updateBlock={updateBlock} moveBlock={moveBlock} removeBlock={removeBlock}
          header={
            <div style={{ padding:"10px 14px", marginBottom:12, background:"#fff", borderRadius:8, border:`1px solid ${C.border}` }}>
              <label style={labelStyle}>{t("nlSubjectLine")}</label>
              <input value={subject} onChange={e=>setSubject(e.target.value)} placeholder={t("nlSubjectPh")} style={inputStyle}/>
            </div>
          }/>
      </div>
    </div>
  );
};
