import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { C } from "../../theme";

export const EmailAutomationSection = ({ role, save }) => {
  const [mailingModal, setMailingModal] = useState(null);
  const [mailLead,     setMailLead]     = useState("");
  const [mailSubj,     setMailSubj]     = useState("");
  const [mailBody,     setMailBody]     = useState("");
  const [mailFiles,    setMailFiles]    = useState([]);
  const [mailSent,     setMailSent]     = useState(false);
  const [inviteEvent,  setInviteEvent]  = useState("");
  const [uploadLink,   setUploadLink]   = useState("");

  const mockEvents = ["Business Opening — 20 Mar 2026 · Lisbon","Finanz-Webinar — 15 Mar 2026 · Online","Team Evening — 5 Apr 2026 · Frankfurt","Q2 Infoevent — 28 Apr 2026 · München"];
  const close = () => { setMailingModal(null); setMailSent(false); setMailLead(""); setMailSubj(""); setMailBody(""); setMailFiles([]); setInviteEvent(""); setUploadLink(""); };
  const send  = () => { setMailSent(true); setTimeout(close, 1800); };
  const genLink = () => setUploadLink(`https://upload.vion.de/${Math.random().toString(36).slice(2,9)}`);

  return (
    <div>
      <div style={{ fontSize:20,fontWeight:800,color:C.navy,marginBottom:4 }}>✉️ Email Automation</div>
      <div style={{ fontSize:13,color:C.muted,marginBottom:24 }}>Manual mailing tools, sender identity, calendar sync and GDPR settings.</div>

      {/* Manual Mailing */}
      <div style={{ marginBottom:28 }}>
        <div style={{ fontSize:14,fontWeight:700,color:C.text,marginBottom:4 }}>📤 Manual Mailing Options</div>
        <div style={{ fontSize:12,color:C.muted,marginBottom:14 }}>Send one-off emails directly to a lead outside of automated workflows.</div>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14 }}>
          {[
            { id:"files",   icon:"📎", title:"Send Files",       desc:"Send PDFs, brochures or proposals directly to a contact's email.", action:"Compose & Send", color:C.blue   },
            { id:"collect", icon:"📥", title:"Collect Files",    desc:"Send the contact a secure upload link to collect their documents.", action:"Send Upload Link", color:C.green },
            { id:"invite",  icon:"🎟️", title:"Event Invitation", desc:"Invite a contact to a vion.world event, webinar or info evening.", action:"Send Invite", color:"#7C3AED" },
          ].map(card=>(
            <div key={card.id} style={{ padding:"18px",borderRadius:12,background:"#fff",border:`1px solid ${C.border}`,borderTop:`4px solid ${card.color}` }}>
              <div style={{ fontSize:28,marginBottom:10 }}>{card.icon}</div>
              <div style={{ fontSize:14,fontWeight:700,color:C.text,marginBottom:4 }}>{card.title}</div>
              <div style={{ fontSize:12,color:C.muted,lineHeight:1.5,marginBottom:14 }}>{card.desc}</div>
              <button onClick={()=>setMailingModal(card.id)} style={{ padding:"7px 16px",borderRadius:8,border:"none",background:card.color,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit" }}>{card.action}</button>
            </div>
          ))}
        </div>
      </div>

      {/* GP Sender Identity */}
      <div style={{ marginBottom:28,paddingTop:24,borderTop:`1px solid ${C.border}` }}>
        <div style={{ fontSize:14,fontWeight:700,color:C.text,marginBottom:4 }}>👤 GP Sender Identity</div>
        <div style={{ fontSize:12,color:C.muted,marginBottom:14 }}>Personalise the sender name, email address and mobile number used in your communications.</div>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,maxWidth:560 }}>
          {[["✉️","Sender Name","e.g. Anna Klein — vion","Anna Klein"],["📧","Sender Email","e.g. anna.klein@vion.de","anna.klein@vion.de"],["📱","Mobile Number","e.g. +49 176 1234 5678","+49 176 2345 6789"],["✍️","Email Signature","Your personal sign-off","Freundliche Grüße"]].map(([ic,lbl,ph,val])=>(
            <div key={lbl}>
              <label style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:5 }}>{ic} {lbl}</label>
              <input defaultValue={val} placeholder={ph} style={{ width:"100%",padding:"9px 12px",borderRadius:8,border:`1.5px solid ${C.border}`,fontSize:13,fontFamily:"inherit",boxSizing:"border-box",outline:"none" }}/>
            </div>
          ))}
        </div>
        <button onClick={save} style={{ marginTop:14,padding:"9px 22px",borderRadius:8,border:"none",background:C.primary,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer" }}>Save Sender Settings</button>
      </div>

      {/* Calendar Sync */}
      <div style={{ marginBottom:28,paddingTop:24,borderTop:`1px solid ${C.border}` }}>
        <div style={{ fontSize:14,fontWeight:700,color:C.text,marginBottom:4 }}>📅 Calendar Sync</div>
        <div style={{ fontSize:12,color:C.muted,marginBottom:14 }}>Sync appointment details automatically when booked in vion CRM.</div>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,maxWidth:560 }}>
          {[["📅","Google Calendar","#4285F4",true,"anna.klein@gmail.com"],["🌐","vion.world","#0F1F3D",true,"vion internal calendar"],["🔵","Outlook / Teams","#0078D4",false,"Not connected"],["🍎","Apple Calendar","#555",false,"Not connected"]].map(([ic,name,col,conn,detail])=>(
            <div key={name} style={{ display:"flex",alignItems:"center",gap:12,padding:"13px 15px",borderRadius:10,background:conn?col+"05":"#fff",border:`1px solid ${conn?col+"40":C.border}` }}>
              <span style={{ fontSize:22,flexShrink:0 }}>{ic}</span>
              <div style={{ flex:1 }}><div style={{ fontSize:13,fontWeight:700,color:C.text }}>{name}</div><div style={{ fontSize:11,color:conn?col:C.muted,marginTop:1 }}>{detail}</div></div>
              <button style={{ padding:"5px 12px",borderRadius:7,fontSize:11,fontWeight:700,cursor:"pointer",border:`1px solid ${conn?C.red+"30":col}`,background:conn?"#FFF5F5":col,color:conn?C.red:"#fff",flexShrink:0 }}>{conn?"Disconnect":"Connect"}</button>
            </div>
          ))}
        </div>
      </div>

      {/* GDPR — SA + VD only */}
      {(role==="superadmin"||role==="vd") && (
        <div style={{ paddingTop:24,borderTop:`1px solid ${C.border}` }}>
          <div style={{ fontSize:14,fontWeight:700,color:C.text,marginBottom:4 }}>🔒 GDPR Compliance</div>
          <div style={{ fontSize:12,color:C.muted,marginBottom:14 }}>All email communication must comply with GDPR. The CRM enforces these rules automatically.</div>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
            {[["✅","Double Opt-In","Active",C.green,"Every welcome email includes a Double Opt-In link."],["🗑️","Data Retention","3 years",C.blue,"Contact data anonymised after retention period."],["📤","Right of Access","Available",C.green,"Export all data held on a contact as JSON/PDF."],["🚫","Right to Erasure","Available",C.red,"Delete a contact and all data with full audit trail."]].map(([ic,title,status,col,desc])=>(
              <div key={title} style={{ padding:"14px",borderRadius:10,background:"#fff",border:`1px solid ${C.border}` }}>
                <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:8 }}><span style={{ fontSize:18 }}>{ic}</span><div style={{ fontSize:13,fontWeight:700,color:C.text,flex:1 }}>{title}</div><span style={{ fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:8,background:col+"15",color:col }}>{status}</span></div>
                <div style={{ fontSize:11,color:C.muted,lineHeight:1.5 }}>{desc}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop:12,padding:"10px 14px",borderRadius:8,background:"#FFF7ED",border:`1px solid ${C.amber}30`,fontSize:11,color:C.slate }}>⚠️ All automated emails only sent to leads with explicit consent. Non-consenting leads excluded from all journeys except transactional mails.</div>
        </div>
      )}

      {/* Send Files Modal */}
      {mailingModal==="files" && (<>
        <div onClick={close} style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.35)",zIndex:500 }}/>
        <div style={{ position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:480,background:"#fff",borderRadius:16,zIndex:600,padding:"24px",boxShadow:"0 24px 64px rgba(0,0,0,0.2)",fontFamily:"inherit",maxHeight:"90vh",overflowY:"auto" }}>
          <div style={{ display:"flex",justifyContent:"space-between",marginBottom:18 }}><div style={{ fontSize:15,fontWeight:800,color:C.navy }}>📎 Send Files</div><button onClick={close} style={{ width:26,height:26,borderRadius:"50%",border:`1px solid ${C.border}`,background:"#F8FAFC",color:C.muted,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>×</button></div>
          {mailSent ? <div style={{ padding:"20px",textAlign:"center",borderRadius:10,background:C.green+"0A",border:`1px solid ${C.green}30` }}><div style={{ fontSize:32,marginBottom:8 }}>✅</div><div style={{ fontSize:14,fontWeight:700,color:C.green }}>Email sent successfully</div></div> : (<>
            {[["Contact","text",mailLead,setMailLead,"Search contact name…"],["Subject","text",mailSubj,setMailSubj,"e.g. Ihre Unterlagen von Anna Klein"]].map(([lbl,tp,val,setter,ph])=>(<div key={lbl} style={{ marginBottom:12 }}><label style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:5 }}>{lbl}</label><input type={tp} value={val} onChange={e=>setter(e.target.value)} placeholder={ph} style={{ width:"100%",padding:"9px 12px",borderRadius:8,border:`1.5px solid ${C.border}`,fontSize:13,fontFamily:"inherit",boxSizing:"border-box",outline:"none" }}/></div>))}
            <div style={{ marginBottom:12 }}><label style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:5 }}>Message</label><textarea value={mailBody} onChange={e=>setMailBody(e.target.value)} rows={3} placeholder={"Hallo {{lead_name}},\n\nerbeten finden Sie anbei die Unterlagen.\n\nFreundliche Grüße,\nAnna Klein"} style={{ width:"100%",padding:"9px 12px",borderRadius:8,border:`1.5px solid ${C.border}`,fontSize:12,fontFamily:"inherit",boxSizing:"border-box",resize:"none",outline:"none",lineHeight:1.5 }}/></div>
            <div style={{ marginBottom:14 }}><label style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:6 }}>📎 Attachments</label>
              <div style={{ display:"flex",gap:6,flexWrap:"wrap",marginBottom:8 }}>{["Beratungsmappe Q1.pdf","Produktübersicht 2026.pdf","Goodie-Guide Finanz.pdf"].map(f=>{ const sel=mailFiles.includes(f); return <button key={f} onClick={()=>setMailFiles(prev=>sel?prev.filter(x=>x!==f):[...prev,f])} style={{ padding:"5px 12px",borderRadius:20,border:`1.5px solid ${sel?C.blue:C.border}`,background:sel?C.blue+"10":"#fff",color:sel?C.blue:C.slate,fontSize:11,fontWeight:sel?700:400,cursor:"pointer",fontFamily:"inherit" }}>{sel?"✓ ":""}{f}</button>; })}</div>
              <label style={{ display:"inline-flex",alignItems:"center",gap:6,padding:"5px 12px",borderRadius:8,border:`1px solid ${C.border}`,background:"#F8FAFC",color:C.slate,fontSize:11,fontWeight:600,cursor:"pointer" }}><input type="file" multiple style={{ display:"none" }} onChange={e=>{ Array.from(e.target.files).forEach(f=>setMailFiles(prev=>[...prev,f.name])); e.target.value=""; }}/>⬆ Upload file</label>
            </div>
            <div style={{ display:"flex",gap:10 }}><button onClick={close} style={{ flex:1,padding:"10px",borderRadius:9,border:`1px solid ${C.border}`,background:"#fff",color:C.slate,fontSize:13,fontWeight:600,cursor:"pointer" }}>Cancel</button><button onClick={send} disabled={!mailLead.trim()||!mailSubj.trim()} style={{ flex:2,padding:"10px",borderRadius:9,border:"none",background:mailLead.trim()&&mailSubj.trim()?C.blue:"#E2E8F0",color:mailLead.trim()&&mailSubj.trim()?"#fff":C.muted,fontSize:13,fontWeight:700,cursor:mailLead.trim()&&mailSubj.trim()?"pointer":"default" }}>📤 Send {mailFiles.length>0?`(${mailFiles.length} file${mailFiles.length>1?"s":""})`:""}  </button></div>
          </>)}
        </div>
      </>)}

      {/* Collect Files Modal */}
      {mailingModal==="collect" && (<>
        <div onClick={close} style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.35)",zIndex:500 }}/>
        <div style={{ position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:440,background:"#fff",borderRadius:16,zIndex:600,padding:"24px",boxShadow:"0 24px 64px rgba(0,0,0,0.2)",fontFamily:"inherit" }}>
          <div style={{ display:"flex",justifyContent:"space-between",marginBottom:18 }}><div style={{ fontSize:15,fontWeight:800,color:C.navy }}>📥 Send Upload Link</div><button onClick={close} style={{ width:26,height:26,borderRadius:"50%",border:`1px solid ${C.border}`,background:"#F8FAFC",color:C.muted,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>×</button></div>
          {mailSent ? <div style={{ padding:"20px",textAlign:"center",borderRadius:10,background:C.green+"0A",border:`1px solid ${C.green}30` }}><div style={{ fontSize:32,marginBottom:8 }}>✅</div><div style={{ fontSize:14,fontWeight:700,color:C.green }}>Upload link sent!</div></div> : (<>
            <div style={{ marginBottom:12 }}><label style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:5 }}>Contact</label><input value={mailLead} onChange={e=>setMailLead(e.target.value)} placeholder="Search contact name…" style={{ width:"100%",padding:"9px 12px",borderRadius:8,border:`1.5px solid ${C.border}`,fontSize:13,fontFamily:"inherit",boxSizing:"border-box",outline:"none" }}/></div>
            <div style={{ marginBottom:12 }}><label style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:8 }}>Documents to request</label>
              {["Personalausweis / Reisepass","Einkommensnachweis (letzte 3 Monate)","Lohnzettel","Kontoauszug","GDPR Einwilligungsformular"].map(doc=>{ const sel=mailFiles.includes(doc); return <div key={doc} onClick={()=>setMailFiles(prev=>sel?prev.filter(x=>x!==doc):[...prev,doc])} style={{ display:"flex",alignItems:"center",gap:10,padding:"8px 12px",borderRadius:8,border:`1px solid ${sel?C.green:C.border}`,background:sel?C.green+"06":"#fff",cursor:"pointer",marginBottom:5 }}><div style={{ width:16,height:16,borderRadius:4,border:`2px solid ${sel?C.green:C.border}`,background:sel?C.green:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#fff",flexShrink:0 }}>{sel?"✓":""}</div><span style={{ fontSize:12,color:C.text,fontWeight:sel?600:400 }}>{doc}</span></div>; })}
            </div>
            {!uploadLink?<button onClick={genLink} style={{ width:"100%",padding:"9px",borderRadius:9,border:`1px solid ${C.border}`,background:"#F8FAFC",color:C.slate,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit",marginBottom:10 }}>🔗 Generate Upload Link</button>
            :<div style={{ marginBottom:10,padding:"10px 12px",borderRadius:9,background:"#F0FDF4",border:`1px solid ${C.green}30`,display:"flex",alignItems:"center",gap:10 }}><span style={{ fontSize:11,color:C.green,fontWeight:600,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{uploadLink}</span><button onClick={()=>navigator.clipboard?.writeText(uploadLink)} style={{ padding:"4px 10px",borderRadius:6,border:`1px solid ${C.green}40`,background:"#fff",color:C.green,fontSize:10,fontWeight:700,cursor:"pointer",flexShrink:0 }}>Copy</button></div>}
            <div style={{ display:"flex",gap:10 }}><button onClick={close} style={{ flex:1,padding:"10px",borderRadius:9,border:`1px solid ${C.border}`,background:"#fff",color:C.slate,fontSize:13,fontWeight:600,cursor:"pointer" }}>Cancel</button><button onClick={send} disabled={!mailLead.trim()||mailFiles.length===0} style={{ flex:2,padding:"10px",borderRadius:9,border:"none",background:mailLead.trim()&&mailFiles.length>0?C.green:"#E2E8F0",color:mailLead.trim()&&mailFiles.length>0?"#fff":C.muted,fontSize:13,fontWeight:700,cursor:mailLead.trim()&&mailFiles.length>0?"pointer":"default" }}>📤 Send Link</button></div>
          </>)}
        </div>
      </>)}

      {/* Event Invite Modal */}
      {mailingModal==="invite" && (<>
        <div onClick={close} style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.35)",zIndex:500 }}/>
        <div style={{ position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:440,background:"#fff",borderRadius:16,zIndex:600,padding:"24px",boxShadow:"0 24px 64px rgba(0,0,0,0.2)",fontFamily:"inherit" }}>
          <div style={{ display:"flex",justifyContent:"space-between",marginBottom:18 }}><div style={{ fontSize:15,fontWeight:800,color:C.navy }}>🎟️ Event Invitation</div><button onClick={close} style={{ width:26,height:26,borderRadius:"50%",border:`1px solid ${C.border}`,background:"#F8FAFC",color:C.muted,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>×</button></div>
          {mailSent?<div style={{ padding:"20px",textAlign:"center",borderRadius:10,background:"#F5F3FF",border:"1px solid #DDD6FE" }}><div style={{ fontSize:32,marginBottom:8 }}>🎟️</div><div style={{ fontSize:14,fontWeight:700,color:"#7C3AED" }}>Invitation sent!</div></div>:(<>
            <div style={{ marginBottom:12 }}><label style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:5 }}>Contact</label><input value={mailLead} onChange={e=>setMailLead(e.target.value)} placeholder="Search contact name…" style={{ width:"100%",padding:"9px 12px",borderRadius:8,border:`1.5px solid ${C.border}`,fontSize:13,fontFamily:"inherit",boxSizing:"border-box",outline:"none" }}/></div>
            <div style={{ marginBottom:12 }}><label style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:8 }}>Select Event</label>{mockEvents.map(ev=><div key={ev} onClick={()=>setInviteEvent(ev)} style={{ display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:8,border:`1.5px solid ${inviteEvent===ev?"#7C3AED":C.border}`,background:inviteEvent===ev?"#7C3AED08":"#fff",cursor:"pointer",marginBottom:5 }}><div style={{ width:14,height:14,borderRadius:"50%",border:`2px solid ${inviteEvent===ev?"#7C3AED":C.border}`,background:inviteEvent===ev?"#7C3AED":"#fff",flexShrink:0 }}/><span style={{ fontSize:12,color:C.text,fontWeight:inviteEvent===ev?700:400 }}>{ev}</span></div>)}</div>
            <div style={{ marginBottom:14 }}><label style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:5 }}>Personal note (optional)</label><textarea value={mailBody} onChange={e=>setMailBody(e.target.value)} rows={2} placeholder="e.g. Ich würde mich freuen, Sie dort kennenzulernen!" style={{ width:"100%",padding:"9px 12px",borderRadius:8,border:`1.5px solid ${C.border}`,fontSize:12,fontFamily:"inherit",boxSizing:"border-box",resize:"none",outline:"none",lineHeight:1.5 }}/></div>
            <div style={{ display:"flex",gap:10 }}><button onClick={close} style={{ flex:1,padding:"10px",borderRadius:9,border:`1px solid ${C.border}`,background:"#fff",color:C.slate,fontSize:13,fontWeight:600,cursor:"pointer" }}>Cancel</button><button onClick={send} disabled={!mailLead.trim()||!inviteEvent} style={{ flex:2,padding:"10px",borderRadius:9,border:"none",background:mailLead.trim()&&inviteEvent?"#7C3AED":"#E2E8F0",color:mailLead.trim()&&inviteEvent?"#fff":C.muted,fontSize:13,fontWeight:700,cursor:mailLead.trim()&&inviteEvent?"pointer":"default" }}>🎟️ Send Invitation</button></div>
          </>)}
        </div>
      </>)}
    </div>
  );
};

// ─── Attachments Store ────────────────────────────────────────────────────────
