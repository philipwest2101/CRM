import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { ATTACHMENTS_STORE } from "../../lib/core";
import { C } from "../../theme";

export const EmailTemplateEditor = ({ template, journeyColor, onSave, onClose }) => {
  const [subject,     setSubject]     = useState(template.subject);
  const [body,        setBody]        = useState(template.body);
  const [name,        setName]        = useState(template.name);
  const [lang,        setLang]        = useState(template.lang||"de");
  const [copied,      setCopied]      = useState(null);
  const [attachments, setAttachments] = useState(template.attachments||[]);
  const [newAttach,   setNewAttach]   = useState("");

  const insertVar = (v) => {
    setBody(b => b + v);
  };
  const copyVar = (v) => {
    navigator.clipboard?.writeText(v).catch(()=>{});
    setCopied(v); setTimeout(()=>setCopied(null),1500);
  };

  return (
    <>
      <div onClick={onClose} style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:500 }}/>
      <div style={{ position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:680,maxHeight:"90vh",background:"#fff",borderRadius:16,boxShadow:"0 24px 60px rgba(0,0,0,0.2)",zIndex:600,display:"flex",flexDirection:"column",fontFamily:"inherit",overflow:"hidden" }}>
        {/* Header */}
        <div style={{ padding:"16px 22px",background:`linear-gradient(135deg,${journeyColor},${journeyColor}CC)`,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0 }}>
          <div>
            <div style={{ fontSize:10,color:"rgba(255,255,255,0.7)",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:2 }}>Email Template Editor</div>
            <div style={{ fontSize:15,fontWeight:800,color:"#fff" }}>✉️ {name}</div>
          </div>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,0.2)",border:"none",color:"#fff",fontSize:18,cursor:"pointer",borderRadius:8,width:30,height:30,display:"flex",alignItems:"center",justifyContent:"center" }}>×</button>
        </div>

        {/* Body */}
        <div style={{ flex:1,overflowY:"auto",padding:"20px 22px" }}>
          {/* Name + Language row */}
          <div style={{ display:"grid",gridTemplateColumns:"1fr auto",gap:10,marginBottom:14 }}>
            <div>
              <label style={{ display:"block",fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:5 }}>Template Name</label>
              <input value={name} onChange={e=>setName(e.target.value)}
                style={{ width:"100%",border:`1px solid ${C.border}`,borderRadius:7,padding:"8px 11px",fontSize:13,fontFamily:"inherit",color:C.text,boxSizing:"border-box" }}/>
            </div>
            <div>
              <label style={{ display:"block",fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:5 }}>Language</label>
              <div style={{ display:"flex",gap:6 }}>
                {[["de","🇩🇪 DE"],["en","🇬🇧 EN"]].map(([k,l])=>(
                  <button key={k} onClick={()=>{ setLang(k);
                    // Auto-update body placeholder language hint
                    if(k==="en" && body.includes("Hallo {{lead_name}}")) setBody(b=>b.replace("Hallo {{lead_name}},\n\n\n\nFreundliche Grüße,\n","Dear {{lead_name}},\n\n\n\nKind regards,\n"));
                    if(k==="de" && body.includes("Dear {{lead_name}}")) setBody(b=>b.replace("Dear {{lead_name}},\n\n\n\nKind regards,\n","Hallo {{lead_name}},\n\n\n\nFreundliche Grüße,\n"));
                  }}
                    style={{ padding:"7px 14px",borderRadius:7,
                      border:`1.5px solid ${lang===k?(k==="en"?C.blue:C.amber):C.border}`,
                      background:lang===k?(k==="en"?"#EFF6FF":"#FFF7ED"):"#fff",
                      color:lang===k?(k==="en"?C.blue:C.amber):C.muted,
                      fontSize:12,fontWeight:lang===k?700:400,cursor:"pointer",fontFamily:"inherit" }}>{l}</button>
                ))}
              </div>
              <div style={{ fontSize:9,color:C.muted,marginTop:4 }}>
                {lang==="de"?"Sent to leads with German preference":"Sent to leads with English preference"}
              </div>
            </div>
          </div>

          {/* Subject */}
          <div style={{ marginBottom:14 }}>
            <label style={{ display:"block",fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:5 }}>Subject Line</label>
            <input value={subject} onChange={e=>setSubject(e.target.value)}
              style={{ width:"100%",border:`1px solid ${C.border}`,borderRadius:7,padding:"8px 11px",fontSize:13,fontFamily:"inherit",color:C.text,boxSizing:"border-box" }}/>
          </div>

          {/* Variables */}
          <div style={{ marginBottom:14 }}>
            <label style={{ display:"block",fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:6 }}>Available Variables</label>
            <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
              {template.variables.map(v=>(
                <button key={v} onClick={()=>{insertVar(v); copyVar(v);}}
                  style={{ padding:"3px 10px",borderRadius:6,border:`1px solid ${journeyColor}40`,
                    background:copied===v?journeyColor+"15":"#F8FAFC",
                    color:journeyColor,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"monospace" }}>
                  {copied===v?"✓ Inserted":v}
                </button>
              ))}
            </div>
            <div style={{ fontSize:10,color:C.muted,marginTop:5 }}>Click a variable to insert it at the end of the body, or type it manually.</div>
          </div>

          {/* Body */}
          <div style={{ marginBottom:14 }}>
            <label style={{ display:"block",fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:5 }}>Email Body</label>
            <textarea value={body} onChange={e=>setBody(e.target.value)}
              style={{ width:"100%",minHeight:240,border:`1px solid ${C.border}`,borderRadius:7,padding:"10px 12px",fontSize:13,fontFamily:"monospace",color:C.text,lineHeight:1.6,resize:"vertical",boxSizing:"border-box" }}/>
          </div>


          {/* Attachments — from central library */}
          <div style={{ marginBottom:14 }}>
            <label style={{ display:"block",fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:8 }}>📎 Attachments</label>
            <div style={{ fontSize:11,color:C.muted,marginBottom:10 }}>
              Select from the <strong>Attachments library</strong> (Settings → Attachments). Files are sent with this template automatically.
            </div>

            {/* Attached files */}
            {attachments.length>0 && (
              <div style={{ display:"flex",flexDirection:"column",gap:6,marginBottom:10 }}>
                {attachments.map((a,i)=>{
                  const tc = {PDF:C.red,DOCX:C.blue,XLSX:C.green,PNG:C.purple,JPG:C.amber}[a.type]||C.muted;
                  return (
                    <div key={i} style={{ display:"flex",alignItems:"center",gap:10,padding:"8px 12px",borderRadius:8,background:"#F8FAFC",border:`1px solid ${C.border}` }}>
                      <span style={{ fontSize:10,fontWeight:800,padding:"2px 7px",borderRadius:5,background:tc+"18",color:tc,flexShrink:0 }}>{a.type||"FILE"}</span>
                      <span style={{ flex:1,fontSize:12,color:C.text,fontWeight:600 }}>{a.name}</span>
                      <span style={{ fontSize:11,color:C.muted,flexShrink:0 }}>{a.size}</span>
                      <button onClick={()=>setAttachments(prev=>prev.filter((_,j)=>j!==i))}
                        style={{ background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:14,lineHeight:1,flexShrink:0,padding:"0 2px" }}>×</button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Picker from ATTACHMENTS_STORE */}
            <div>
              <div style={{ fontSize:11,fontWeight:700,color:C.muted,marginBottom:6 }}>Available in library:</div>
              <div style={{ display:"flex",flexDirection:"column",gap:5,maxHeight:160,overflowY:"auto",padding:"2px 0" }}>
                {ATTACHMENTS_STORE.filter(a=>!attachments.find(x=>x.id===a.id)).length===0 && (
                  <div style={{ fontSize:11,color:C.muted,fontStyle:"italic",padding:"8px 0" }}>
                    All library files are already attached, or the library is empty.
                    <button onClick={()=>alert("Go to Settings → Attachments to upload files.")}
                      style={{ marginLeft:8,fontSize:11,color:C.blue,border:"none",background:"none",cursor:"pointer",fontFamily:"inherit",textDecoration:"underline" }}>
                      Upload files →
                    </button>
                  </div>
                )}
                {ATTACHMENTS_STORE.filter(a=>!attachments.find(x=>x.id===a.id)).map(a=>{
                  const tc = {PDF:C.red,DOCX:C.blue,XLSX:C.green,PNG:C.purple,JPG:C.amber}[a.type]||C.muted;
                  return (
                    <div key={a.id} onClick={()=>setAttachments(prev=>[...prev,a])}
                      style={{ display:"flex",alignItems:"center",gap:10,padding:"8px 12px",borderRadius:8,
                        background:"#fff",border:`1px solid ${C.border}`,cursor:"pointer" }}
                      onMouseEnter={e=>{ e.currentTarget.style.background="#F0F4FF"; e.currentTarget.style.borderColor=C.navy; }}
                      onMouseLeave={e=>{ e.currentTarget.style.background="#fff"; e.currentTarget.style.borderColor=C.border; }}>
                      <span style={{ fontSize:10,fontWeight:800,padding:"2px 7px",borderRadius:5,background:tc+"18",color:tc,flexShrink:0 }}>{a.type}</span>
                      <span style={{ flex:1,fontSize:12,color:C.text,fontWeight:600 }}>{a.name}</span>
                      <span style={{ fontSize:11,color:C.muted,flexShrink:0 }}>{a.size}</span>
                      <span style={{ fontSize:11,color:a.lang==="en"?C.blue:a.lang==="de"?C.amber:C.green,flexShrink:0 }}>
                        {a.lang==="en"?"🇬🇧":a.lang==="de"?"🇩🇪":"🌐"}
                      </span>
                      <span style={{ fontSize:11,fontWeight:700,color:C.green,flexShrink:0 }}>+ Attach</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Preview */}
          <div style={{ borderRadius:10,border:`1px solid ${C.border}`,overflow:"hidden" }}>
            <div style={{ padding:"8px 14px",background:"#F8FAFC",borderBottom:`1px solid ${C.border}`,fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em" }}>📧 Preview (variables replaced with examples)</div>
            <div style={{ padding:"14px 16px",background:"#fff" }}>
              <div style={{ fontSize:12,fontWeight:700,color:C.text,marginBottom:8 }}>
                {subject.replace("{{lead_name}}","Max Müller").replace("{{appt_time}}","14:00").replace("{{consultant_name}}","Anna Klein")}
              </div>
              <div style={{ fontSize:12,color:C.slate,whiteSpace:"pre-wrap",lineHeight:1.7 }}>
                {body.replace(/{{lead_name}}/g,"Max Müller").replace(/{{consultant_name}}/g,"Anna Klein").replace(/{{sender_email}}/g,"anna.klein@personalmail.de").replace(/{{appt_time}}/g,"14:00 Uhr").replace(/{{meeting_link}}/g,"https://zoom.us/j/123456").replace(/{{meeting_location}}/g,"Musterstraße 1, 80331 München")}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding:"14px 22px",borderTop:`1px solid ${C.border}`,display:"flex",gap:10,justifyContent:"flex-end",flexShrink:0 }}>
          <button onClick={onClose} style={{ padding:"8px 18px",borderRadius:7,border:`1px solid ${C.border}`,background:"#fff",color:C.slate,fontSize:12,fontWeight:600,cursor:"pointer" }}>Cancel</button>
          <button onClick={()=>onSave({...template,name,subject,body,lang,attachments})}
            style={{ padding:"8px 20px",borderRadius:7,border:"none",background:journeyColor,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer" }}>
            ✓ Save Template
          </button>
        </div>
      </div>
    </>
  );
};

// ─── Journey Settings Modal ───────────────────────────────────────────────────
