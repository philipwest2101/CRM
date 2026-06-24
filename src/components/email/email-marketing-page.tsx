import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { BE_SEGMENTS, BULK_EMAIL_CAMPAIGNS, EMAIL_TEMPLATES_STORE, EM_STATUS_META, NL_BUILDER_BLOCKS, NL_CAMPAIGNS_STORE, NL_LISTS, SUPPRESSION_LIST } from "../../lib/core";
import { C } from "../../theme";

export const EmailMarketingPage = ({ role, navigateTo }) => {
  const myName = role==="gp"?"Anna Klein":role==="vd"?"Thomas Müller":"Super Admin";

  // ── Role permissions ──────────────────────────────────────────────────────
  const canCampaigns     = role==="superadmin";
  const canNewsletter    = ["superadmin","vd","gp"].includes(role);
  const canViewInteg     = ["superadmin","vd"].includes(role);
  const myLists          = role==="gp"
    ? NL_LISTS.filter(l=>l.gpOwner===myName)
    : role==="vd"
    ? NL_LISTS.filter(l=>!l.gpOwner||l.gpOwner===myName)
    : NL_LISTS;

  // ── Main tab ───────────────────────────────────────────────────────────────
  const [mainTab, setMainTab] = useState(canCampaigns?"campaigns":"newsletters");

  // ── Bulk Campaign state ────────────────────────────────────────────────────
  const [beView,    setBeView]    = useState("list");
  const [beCamps,   setBeCamps]   = useState(BULK_EMAIL_CAMPAIGNS);
  const [beSel,     setBeSel]     = useState(null);
  const [beSearch,  setBeSearch]  = useState("");
  const [beSF,      setBeSF]      = useState("all");
  // Campaign detail sub-tabs
  const [beDetTab,  setBeDetTab]  = useState("details");
  const [beMob,     setBeMob]     = useState(false);
  const [beTestSent,setBeTestSent]= useState(false);
  const [beRS,      setBeRS]      = useState("");
  const [beRF,      setBeRF]      = useState("all");
  // Campaign wizard
  const [beStep,    setBeStep]    = useState(1);
  const [cName,     setCName]     = useState("");
  const [cType,     setCType]     = useState("marketing");
  const [cFName,    setCFName]    = useState("vion Financial Team");
  const [cFEmail,   setCFEmail]   = useState("newsletter@vion.de");
  const [cReply,    setCReply]    = useState("support@vion.de");
  const [cSubj,     setCSubj]     = useState("");
  const [cPrev,     setCPrev]     = useState("");
  const [cAud,      setCAud]      = useState("segment");
  const [cSeg,      setCSeg]      = useState("active_leads");
  const [cBody,     setCBody]     = useState("");
  const [cTpl,      setCTpl]      = useState(null);
  const [cTestSent, setCTestSent] = useState(false);
  const [cSendOpt,  setCSendOpt]  = useState("now");
  const [cSchedD,   setCSchedD]   = useState("2026-03-01");
  const [cSchedT,   setCSchedT]   = useState("10:00");
  const [beLaunch,  setBeLaunch]  = useState(false);
  const [beDone,    setBeDone]    = useState(false);
  const [cMobPrev,  setCMobPrev]  = useState(false);

  // ── Newsletter state ───────────────────────────────────────────────────────
  const [nlView,    setNlView]    = useState("list");
  const [nlCamps,   setNlCamps]   = useState(NL_CAMPAIGNS_STORE);
  const [nlSearch,  setNlSearch]  = useState("");
  const [nlSF,      setNlSF]      = useState("all");
  // NL wizard
  const [nlStep,    setNlStep]    = useState(1);
  const [nlName,    setNlName]    = useState("");
  const [nlSubj,    setNlSubj]    = useState("");
  const [nlList,    setNlList]    = useState(myLists[0]?.id||"l1");
  const [nlSched,   setNlSched]   = useState("now");
  const [nlDate,    setNlDate]    = useState("2026-03-01");
  const [nlTime,    setNlTime]    = useState("10:00");
  const [nlLaunch,  setNlLaunch]  = useState(false);
  const [nlDone,    setNlDone]    = useState(false);
  // Builder
  const [canvas,    setCanvas]    = useState([
    { id:"b1", type:"hero",   content:"📈 Your Financial Future Starts Here", sub:"Exclusive insights from vion advisory", cta:"Read More →" },
    { id:"b2", type:"text",   content:"Dear {FirstName},\n\nThis month we share our latest market insights tailored for you." },
    { id:"b3", type:"cta",    content:"Schedule Your Free Consultation", sub:"Limited slots this month", url:"#" },
    { id:"b4", type:"footer", content:"vion gmbh · Musterstraße 1 · 80331 München · Unsubscribe" },
  ]);
  const [selBlock,  setSelBlock]  = useState(null);
  const [bldMode,   setBldMode]   = useState("desktop");

  // ── Helpers ────────────────────────────────────────────────────────────────
  const fmt = n => !n?"—":n>=1000?(n/1000).toFixed(1)+"k":String(n);
  const pct = (a,b) => (!a||!b)?"—":Math.round(a/b*100)+"%";
  const seg = BE_SEGMENTS[cSeg]||BE_SEGMENTS.active_leads;

  const addBlock = (type) => {
    const defs = { hero:{content:"Headline",sub:"Subheadline",cta:"Click →"}, text:{content:"Start typing..."}, "2col":{content:"Left col",contentR:"Right col"}, cta:{content:"Call to action",sub:"Supporting text",url:"#"}, divider:{content:""}, image:{content:"[Image]",caption:"Caption"}, footer:{content:"Company · Address · Unsubscribe"} };
    const b = { id:`b${Date.now()}`, type, ...defs[type] };
    setCanvas(c=>[...c,b]); setSelBlock(b.id);
  };
  const removeBlock = (id) => { setCanvas(c=>c.filter(b=>b.id!==id)); setSelBlock(null); };
  const moveBlock   = (id, dir) => setCanvas(c=>{ const i=c.findIndex(b=>b.id===id); if((dir==="up"&&i===0)||(dir==="dn"&&i===c.length-1)) return c; const n=[...c],t=n[i]; n[i]=n[i+(dir==="up"?-1:1)]; n[i+(dir==="up"?-1:1)]=t; return n; });

  const selBlock_ = canvas.find(b=>b.id===selBlock);
  const selNlList = myLists.find(l=>l.id===nlList)||myLists[0];

  const beChecks = [
    { label:"From email verified",       ok:cFEmail.includes("@vion") },
    { label:"Subject line added",        ok:cSubj.trim().length>0 },
    { label:"Reply-to added",            ok:cReply.includes("@") },
    { label:"Unsubscribe included",      ok:true },
    { label:"Company address included",  ok:true },
    { label:"Recipient list cleaned",    ok:seg.valid>0 },
    { label:"Suppression applied",       ok:true },
    { label:"Test email sent",           ok:cTestSent },
    { label:"SPF/DKIM/DMARC configured", ok:true },
  ];

  const TABS = [
    canCampaigns    && { id:"campaigns",   label:"📤 Campaigns",        n:beCamps.length        },
    canNewsletter   && { id:"newsletters", label:"📰 Newsletters",      n:nlCamps.length        },
    canNewsletter   && { id:"lists",       label:"👥 Subscriber Lists", n:myLists.length        },
    canCampaigns    && { id:"suppression", label:"🚫 Suppression",      n:SUPPRESSION_LIST.length },
  ].filter(Boolean);

  // ══════════════════════════════════════════════════════════════════════════
  // OWNER: no access
  // ══════════════════════════════════════════════════════════════════════════
  if(role==="manager") return (
    <div style={{ padding:"60px 28px",textAlign:"center",color:C.muted }}>
      <div style={{ fontSize:36,marginBottom:12 }}>📊</div>
      <div style={{ fontSize:16,fontWeight:600,color:C.text,marginBottom:8 }}>Reports only</div>
      <div style={{ fontSize:13 }}>Email Marketing performance is delivered to your inbox automatically on schedule.</div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // NEWSLETTER BUILDER (full-screen)
  // ══════════════════════════════════════════════════════════════════════════
  if(nlView==="builder") return (
    <div style={{ display:"flex",flexDirection:"column",height:"calc(100vh - 54px)",fontFamily:"inherit" }}>
      {/* Top bar */}
      <div style={{ background:C.primary,padding:"0 14px",height:46,display:"flex",alignItems:"center",gap:10,flexShrink:0 }}>
        <button onClick={()=>setNlView("create")} style={{ padding:"4px 10px",borderRadius:7,border:"1px solid rgba(255,255,255,0.2)",background:"transparent",color:"#fff",fontSize:11,fontWeight:600,cursor:"pointer" }}>← Back</button>
        <div style={{ flex:1,fontSize:13,fontWeight:700,color:"#fff" }}>
          ✉️ Newsletter Builder — <span style={{ fontWeight:300,opacity:0.6 }}>{nlName||"Untitled"}</span>
          <span style={{ marginLeft:10,fontSize:10,padding:"2px 8px",borderRadius:8,background:"rgba(99,102,241,0.5)",color:"#fff" }}>GrapesJS + MJML</span>
        </div>
        <div style={{ display:"flex",gap:5 }}>
          {[["desktop","🖥"],["mobile","📱"]].map(([m,ic])=>(
            <button key={m} onClick={()=>setBldMode(m)} style={{ padding:"4px 9px",borderRadius:6,border:`1px solid ${bldMode===m?"#fff":"rgba(255,255,255,0.2)"}`,background:bldMode===m?"rgba(255,255,255,0.15)":"transparent",color:"#fff",fontSize:11,cursor:"pointer" }}>{ic} {m.charAt(0).toUpperCase()+m.slice(1)}</button>
          ))}
        </div>
        <button onClick={()=>{ alert("Saved. MJML compiled to HTML."); setNlView("create"); }} style={{ padding:"5px 14px",borderRadius:7,border:"none",background:C.green,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer" }}>💾 Save & Continue →</button>
      </div>

      <div style={{ display:"flex",flex:1,overflow:"hidden" }}>
        {/* Block palette */}
        <div style={{ width:200,background:"#F8FAFC",borderRight:`1px solid ${C.border}`,overflowY:"auto",flexShrink:0,padding:"6px" }}>
          <div style={{ fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.1em",padding:"6px 6px 8px" }}>Blocks</div>
          {NL_BUILDER_BLOCKS.map(b=>(
            <div key={b.id} onClick={()=>addBlock(b.id)}
              style={{ display:"flex",alignItems:"center",gap:8,padding:"8px 10px",borderRadius:8,border:`1px solid ${C.border}`,background:"#fff",marginBottom:4,cursor:"pointer" }}
              onMouseEnter={e=>{e.currentTarget.style.background="#F0F4FF";e.currentTarget.style.borderColor=C.navy;}}
              onMouseLeave={e=>{e.currentTarget.style.background="#fff";e.currentTarget.style.borderColor=C.border;}}>
              <span style={{ fontSize:14,flexShrink:0 }}>{b.icon}</span>
              <div><div style={{ fontSize:11,fontWeight:700,color:C.text }}>{b.label}</div><div style={{ fontSize:9,color:C.muted }}>{b.desc}</div></div>
            </div>
          ))}
          <div style={{ fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.1em",padding:"10px 6px 6px" }}>Merge Fields</div>
          {["{FirstName}","{LastName}","{Email}","{City}","{OwnerName}","{Unsubscribe}"].map(f=>(
            <div key={f} onClick={()=>{ if(selBlock) setCanvas(c=>c.map(b=>b.id===selBlock?{...b,content:(b.content||"")+f}:b)); }}
              style={{ padding:"5px 8px",borderRadius:6,border:`1px solid ${C.border}`,background:"#fff",cursor:"pointer",fontSize:11,fontFamily:"monospace",color:C.indigo,fontWeight:600,marginBottom:3 }}>{f}</div>
          ))}
        </div>

        {/* Canvas */}
        <div style={{ flex:1,background:"#E5E7EB",overflowY:"auto",display:"flex",justifyContent:"center",padding:"20px 0" }}>
          <div style={{ width:bldMode==="mobile"?380:590,background:"#fff",borderRadius:bldMode==="mobile"?14:4,overflow:"hidden",boxShadow:"0 8px 28px rgba(0,0,0,0.14)" }}>
            {canvas.map((b)=>{
              const sel=b.id===selBlock;
              return (
                <div key={b.id} style={{ position:"relative",cursor:"pointer",outline:sel?`2px solid ${C.primary}`:"2px solid transparent" }} onClick={()=>setSelBlock(b.id)}>
                  {sel&&<>
                    <div style={{ position:"absolute",top:4,right:6,zIndex:10,display:"flex",gap:3 }}>
                      {[["↑","up"],["↓","dn"]].map(([l,d])=><button key={d} onClick={e=>{e.stopPropagation();moveBlock(b.id,d);}} style={{ width:20,height:20,borderRadius:4,border:"none",background:C.primary,color:"#fff",fontSize:11,cursor:"pointer" }}>{l}</button>)}
                      <button onClick={e=>{e.stopPropagation();removeBlock(b.id);}} style={{ width:20,height:20,borderRadius:4,border:"none",background:C.red,color:"#fff",fontSize:12,cursor:"pointer" }}>×</button>
                    </div>
                    <div style={{ position:"absolute",top:4,left:6,zIndex:10,fontSize:9,fontWeight:700,background:C.primary,color:"#fff",padding:"2px 6px",borderRadius:4 }}>{b.type.toUpperCase()}</div>
                  </>}
                  {b.type==="hero"&&<div style={{ background:`linear-gradient(135deg,${C.navy},${C.indigo})`,padding:"32px 26px",textAlign:"center" }}><div style={{ fontSize:bldMode==="mobile"?16:21,fontWeight:800,color:"#fff",marginBottom:8 }}>{b.content}</div>{b.sub&&<div style={{ fontSize:12,color:"rgba(255,255,255,0.7)",marginBottom:14 }}>{b.sub}</div>}{b.cta&&<button style={{ padding:"8px 20px",borderRadius:24,border:"none",background:"#fff",color:C.navy,fontSize:12,fontWeight:700,cursor:"pointer" }}>{b.cta}</button>}</div>}
                  {b.type==="text"&&<div style={{ padding:"16px 24px",fontSize:13,lineHeight:1.7,color:C.text,whiteSpace:"pre-wrap",fontFamily:"Georgia,serif" }}>{b.content}</div>}
                  {b.type==="2col"&&<div style={{ display:"grid",gridTemplateColumns:"1fr 1fr" }}><div style={{ padding:"16px 20px",fontSize:12,color:C.text,borderRight:`1px solid ${C.border}` }}>{b.content}</div><div style={{ padding:"16px 20px",fontSize:12,color:C.text }}>{b.contentR||"Right col"}</div></div>}
                  {b.type==="cta"&&<div style={{ padding:"24px 26px",textAlign:"center",background:"#F8FAFC" }}><button style={{ padding:"10px 24px",borderRadius:24,border:"none",background:C.primary,color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer" }}>{b.content}</button>{b.sub&&<div style={{ marginTop:6,fontSize:11,color:C.muted }}>{b.sub}</div>}</div>}
                  {b.type==="divider"&&<div style={{ padding:"8px 0" }}><div style={{ height:1,background:C.border,margin:"0 24px" }}/></div>}
                  {b.type==="image"&&<div style={{ padding:"12px 24px",textAlign:"center" }}><div style={{ height:100,background:"#F0F4FF",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:C.muted,border:`1.5px dashed ${C.border}` }}>🖼 Click to upload</div>{b.caption&&<div style={{ fontSize:10,color:C.muted,marginTop:4 }}>{b.caption}</div>}</div>}
                  {b.type==="footer"&&<div style={{ padding:"12px 24px",textAlign:"center",background:"#FAFAFA",borderTop:`1px solid ${C.border}`,fontSize:10,color:C.muted,lineHeight:1.8 }}>vion gmbh · Musterstraße 1 · 80331 München<br/><span style={{ textDecoration:"underline",color:C.blue,cursor:"pointer" }}>Unsubscribe</span> · <span style={{ textDecoration:"underline",color:C.blue,cursor:"pointer" }}>Preferences</span></div>}
                </div>
              );
            })}
            {canvas.length===0&&<div style={{ padding:"50px",textAlign:"center",color:C.muted }}><div style={{ fontSize:30,marginBottom:8 }}>📧</div>Click a block to start</div>}
          </div>
        </div>

        {/* Properties */}
        <div style={{ width:210,background:"#F8FAFC",borderLeft:`1px solid ${C.border}`,overflowY:"auto",flexShrink:0,padding:"6px" }}>
          <div style={{ fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.1em",padding:"6px 6px 8px" }}>Properties</div>
          {selBlock_?<div style={{ display:"flex",flexDirection:"column",gap:8 }}>
            <div style={{ fontSize:11,fontWeight:700,color:C.navy }}>{selBlock_.type?.toUpperCase()}</div>
            {["content","sub","cta","caption","contentR"].filter(f=>selBlock_[f]!==undefined).map(field=>(
              <div key={field}>
                <label style={{ fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:3 }}>{field}</label>
                <textarea value={selBlock_[field]||""} rows={field==="content"?4:2} onChange={e=>setCanvas(c=>c.map(b=>b.id===selBlock?{...b,[field]:e.target.value}:b))}
                  style={{ width:"100%",padding:"6px 8px",borderRadius:7,border:`1px solid ${C.border}`,fontSize:11,fontFamily:"inherit",resize:"none",outline:"none",boxSizing:"border-box" }}/>
              </div>
            ))}
            <button onClick={()=>removeBlock(selBlock)} style={{ padding:"6px",borderRadius:7,border:`1px solid ${C.red}30`,background:C.red+"08",color:C.red,fontSize:11,fontWeight:700,cursor:"pointer" }}>🗑 Remove</button>
          </div>:<div style={{ fontSize:11,color:C.muted,padding:"4px 6px",lineHeight:1.6 }}>Click any block to edit.</div>}
          {/* Canvas map */}
          <div style={{ marginTop:10,paddingTop:8,borderTop:`1px solid ${C.border}` }}>
            <div style={{ fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:5 }}>Canvas ({canvas.length})</div>
            {canvas.map((b,i)=><div key={b.id} onClick={()=>setSelBlock(b.id)} style={{ display:"flex",alignItems:"center",gap:5,padding:"4px 6px",borderRadius:5,cursor:"pointer",background:selBlock===b.id?C.primary+"0D":"transparent",marginBottom:2 }}><span style={{ fontSize:10 }}>{NL_BUILDER_BLOCKS.find(x=>x.id===b.type)?.icon||"▪"}</span><span style={{ fontSize:11,color:C.text,flex:1 }}>{b.type}</span><span style={{ fontSize:9,color:C.muted }}>#{i+1}</span></div>)}
          </div>
          <div style={{ margin:"8px 0 0",padding:"8px 9px",borderRadius:9,background:C.indigo+"08",border:`1px solid ${C.indigo}25`,fontSize:10,color:C.indigo,lineHeight:1.5 }}>
            <strong>MJML</strong> — auto-compiles to responsive HTML for all email clients.
          </div>
        </div>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // NEWSLETTER WIZARD
  // ══════════════════════════════════════════════════════════════════════════
  if(nlView==="create") {
    const NL_STEPS=["Details","List","Design","Review","Send"];
    return (
      <div style={{ padding:"0 28px 48px" }}>
        <div style={{ padding:"20px 0",display:"flex",alignItems:"center",gap:12 }}>
          <button onClick={()=>{ setNlView("list"); setNlStep(1); setNlDone(false); setNlName(""); setNlSubj(""); }} style={{ padding:"6px 14px",borderRadius:7,border:`1px solid ${C.border}`,background:"#fff",color:C.slate,fontSize:12,fontWeight:600,cursor:"pointer" }}>← Cancel</button>
          <h1 style={{ fontSize:22,fontWeight:500,color:C.text,margin:0 }}>{nlDone?"✅ Newsletter Launched!":"Create Newsletter"}</h1>
          {role==="gp"&&<span style={{ fontSize:11,padding:"3px 10px",borderRadius:20,background:C.green+"15",color:C.green,fontWeight:700 }}>👤 Your contacts only</span>}
        </div>
        {/* Steps */}
        {!nlDone&&<div style={{ display:"flex",marginBottom:24 }}>
          {NL_STEPS.map((s,i)=>{ const n=i+1,done=n<nlStep,active=n===nlStep; return (
            <div key={s} style={{ display:"flex",alignItems:"center",flex:i<NL_STEPS.length-1?1:"auto" }}>
              <div style={{ display:"flex",flexDirection:"column",alignItems:"center",cursor:done?"pointer":"default" }} onClick={()=>done&&setNlStep(n)}>
                <div style={{ width:28,height:28,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",background:done?C.green:active?C.primary:"#F1F5F9",color:done||active?"#fff":C.muted,fontSize:done?13:11,fontWeight:700,border:`2px solid ${done?C.green:active?C.primary:C.border}` }}>{done?"✓":n}</div>
                <div style={{ fontSize:10,fontWeight:active?700:400,color:active?C.navy:done?C.green:C.muted,marginTop:3,whiteSpace:"nowrap" }}>{s}</div>
              </div>
              {i<NL_STEPS.length-1&&<div style={{ flex:1,height:2,background:done?C.green:C.border,margin:"0 5px",marginBottom:14 }}/>}
            </div>
          );})}
        </div>}

        {nlDone?(
          <div style={{ textAlign:"center",padding:"60px",background:"#fff",borderRadius:16,border:`1px solid ${C.border}` }}>
            <div style={{ fontSize:52,marginBottom:14 }}>📰</div>
            <h2 style={{ fontSize:22,fontWeight:700,color:C.navy,marginBottom:8 }}>{nlSched==="now"?"Newsletter sent!":"Newsletter scheduled!"}</h2>
            <div style={{ fontSize:13,color:C.muted,marginBottom:22 }}>{nlSched==="now"?`Dispatched to ${selNlList?.active||0} subscribers via Listmonk.`:`Scheduled for ${nlDate} at ${nlTime}.`}</div>
            <button onClick={()=>{ setNlView("list"); setNlStep(1); setNlDone(false); setNlName(""); setNlSubj(""); }} style={{ padding:"11px 28px",borderRadius:10,border:"none",background:C.primary,color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer" }}>View Newsletters</button>
          </div>
        ):(
          <div style={{ display:"grid",gridTemplateColumns:"1fr 260px",gap:18 }}>
            <div style={{ background:"#fff",border:`1px solid ${C.border}`,borderRadius:14,padding:"24px" }}>
              {/* Step 1 */}
              {nlStep===1&&<div style={{ display:"flex",flexDirection:"column",gap:14 }}>
                <div style={{ fontSize:15,fontWeight:700,color:C.text }}>Newsletter Details</div>
                {[["Name *",nlName,setNlName,"e.g. February Market Update"],["Subject *",nlSubj,setNlSubj,"e.g. Your financial digest for February"]].map(([lbl,val,set,ph])=>(
                  <div key={lbl}><label style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:5 }}>{lbl}</label>
                  <input value={val} onChange={e=>set(e.target.value)} placeholder={ph} style={{ width:"100%",padding:"10px 12px",borderRadius:9,border:`1.5px solid ${val?C.primary:C.border}`,fontSize:13,fontFamily:"inherit",boxSizing:"border-box",outline:"none" }}/></div>
                ))}
                <div><label style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:5 }}>From</label>
                <input defaultValue={role==="gp"?`${myName} <${myName.toLowerCase().replace(" ",".")}@vion.de>`:"vion Newsletter <newsletter@vion.de>"} style={{ width:"100%",padding:"10px 12px",borderRadius:9,border:`1px solid ${C.border}`,fontSize:13,fontFamily:"inherit",boxSizing:"border-box",outline:"none",background:"#F8FAFC",color:C.muted }}/></div>
              </div>}
              {/* Step 2 */}
              {nlStep===2&&<div style={{ display:"flex",flexDirection:"column",gap:12 }}>
                <div style={{ fontSize:15,fontWeight:700,color:C.text }}>Subscriber List</div>
                {role==="gp"&&<div style={{ padding:"9px 12px",borderRadius:9,background:C.green+"06",border:`1px solid ${C.green}25`,fontSize:11,color:C.slate }}>👤 You can only send to your own opted-in contacts.</div>}
                {myLists.map(l=>(
                  <div key={l.id} onClick={()=>setNlList(l.id)} style={{ padding:"13px 14px",borderRadius:10,border:`1.5px solid ${nlList===l.id?C.primary:C.border}`,background:nlList===l.id?C.primary+"05":"#fff",cursor:"pointer" }}>
                    <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                      <div style={{ width:17,height:17,borderRadius:"50%",border:`2px solid ${nlList===l.id?C.primary:C.border}`,background:nlList===l.id?C.primary:"#fff",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>{nlList===l.id&&<div style={{ width:6,height:6,borderRadius:"50%",background:"#fff" }}/>}</div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13,fontWeight:700,color:nlList===l.id?C.navy:C.text }}>{l.name}</div>
                        <div style={{ fontSize:11,color:C.muted,marginTop:2,display:"flex",gap:10 }}>
                          <span style={{ color:C.green }}>✅ {l.active} active</span>
                          <span>⏳ {l.pending}</span>
                          <span style={{ fontSize:10,fontWeight:700,padding:"1px 6px",borderRadius:8,background:l.lang==="en"?"#EFF6FF":"#FFF7ED",color:l.lang==="en"?C.blue:C.amber }}>{l.lang==="en"?"🇬🇧":"🇩🇪"}</span>
                        </div>
                      </div>
                      <div style={{ textAlign:"right" }}><div style={{ fontSize:17,fontWeight:700,color:C.navy }}>{l.count}</div><div style={{ fontSize:9,color:C.muted }}>total</div></div>
                    </div>
                  </div>
                ))}
              </div>}
              {/* Step 3 */}
              {nlStep===3&&<div style={{ display:"flex",flexDirection:"column",gap:14 }}>
                <div style={{ fontSize:15,fontWeight:700,color:C.text }}>Design Newsletter</div>
                <div style={{ padding:"18px",borderRadius:12,background:"linear-gradient(135deg,#F0F4FF,#EFF6FF)",border:`1px solid ${C.primary}20`,textAlign:"center" }}>
                  <div style={{ fontSize:26,marginBottom:8 }}>🧱</div>
                  <div style={{ fontSize:13,fontWeight:700,color:C.navy,marginBottom:5 }}>GrapesJS Drag-and-Drop Builder</div>
                  <div style={{ fontSize:11,color:C.muted,marginBottom:14 }}>Build visually. Blocks compile to MJML automatically — responsive on all clients.</div>
                  <button onClick={()=>setNlView("builder")} style={{ padding:"9px 22px",borderRadius:9,border:"none",background:C.primary,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer" }}>🧱 Open Builder</button>
                </div>
                <div style={{ padding:"10px 12px",borderRadius:10,background:"#F8FAFC",border:`1px solid ${C.border}` }}>
                  <div style={{ fontSize:11,fontWeight:700,color:C.text,marginBottom:5 }}>Canvas: {canvas.length} blocks</div>
                  <div style={{ display:"flex",gap:5,flexWrap:"wrap" }}>{canvas.map(b=><span key={b.id} style={{ fontSize:10,padding:"2px 7px",borderRadius:6,background:C.indigo+"10",color:C.indigo,fontWeight:600 }}>{NL_BUILDER_BLOCKS.find(x=>x.id===b.type)?.icon} {b.type}</span>)}</div>
                </div>
                <button onClick={()=>alert(`Test sent to ${myName.toLowerCase().replace(" ",".")}@vion.de`)} style={{ padding:"8px 14px",borderRadius:8,border:`1px solid ${C.border}`,background:"#fff",color:C.slate,fontSize:12,fontWeight:600,cursor:"pointer",alignSelf:"flex-start" }}>📧 Send Test Email</button>
              </div>}
              {/* Step 4 */}
              {nlStep===4&&<div style={{ display:"flex",flexDirection:"column",gap:14 }}>
                <div style={{ fontSize:15,fontWeight:700,color:C.text }}>Review</div>
                <div style={{ padding:"14px",borderRadius:10,background:"#F8FAFC",border:`1px solid ${C.border}` }}>
                  {[["Name",nlName||"—"],["Subject",nlSubj||"—"],["List",selNlList?.name||"—"],["Active subs",(selNlList?.active||0).toString()],["Blocks",`${canvas.length}`]].map(([k,v])=>(
                    <div key={k} style={{ display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:`1px solid ${C.border}`,fontSize:12 }}>
                      <span style={{ color:C.muted }}>{k}</span><span style={{ fontWeight:600,color:C.text }}>{v}</span>
                    </div>
                  ))}
                </div>
                <div style={{ padding:"14px",borderRadius:10,background:"#F8FAFC",border:`1px solid ${C.border}` }}>
                  <div style={{ fontSize:12,fontWeight:700,color:C.text,marginBottom:8 }}>Checklist</div>
                  {[["Subject added",!!nlSubj],["List selected",!!(selNlList&&selNlList.active>0)],["Body designed",canvas.length>0],["Footer/unsubscribe",canvas.some(b=>b.type==="footer")],["GDPR (Listmonk)",true],["SPF/DKIM verified",true]].map(([lbl,ok],i)=>(
                    <div key={i} style={{ display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:`1px solid ${C.border}`,fontSize:12 }}>
                      <span>{ok?"✅":"❌"}</span><span style={{ color:ok?C.text:C.red }}>{lbl}</span>
                    </div>
                  ))}
                </div>
              </div>}
              {/* Step 5 */}
              {nlStep===5&&<div style={{ display:"flex",flexDirection:"column",gap:14 }}>
                <div style={{ fontSize:15,fontWeight:700,color:C.text }}>Send via Listmonk</div>
                {[["now","Send Now","Dispatch immediately"],["scheduled","Schedule","Pick date & time"]].map(([k,l,d])=>(
                  <div key={k} onClick={()=>setNlSched(k)} style={{ padding:"14px 16px",borderRadius:10,border:`1.5px solid ${nlSched===k?C.primary:C.border}`,background:nlSched===k?C.primary+"05":"#fff",cursor:"pointer",display:"flex",gap:12,alignItems:"flex-start" }}>
                    <div style={{ width:18,height:18,borderRadius:"50%",border:`2px solid ${nlSched===k?C.primary:C.border}`,background:nlSched===k?C.primary:"#fff",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1 }}>{nlSched===k&&<div style={{ width:7,height:7,borderRadius:"50%",background:"#fff" }}/>}</div>
                    <div><div style={{ fontSize:13,fontWeight:700,color:nlSched===k?C.navy:C.text }}>{l}</div><div style={{ fontSize:11,color:C.muted }}>{d}</div>
                    {k==="scheduled"&&nlSched==="scheduled"&&<div style={{ display:"flex",gap:8,marginTop:8 }}><input type="date" value={nlDate} onChange={e=>setNlDate(e.target.value)} style={{ padding:"6px 10px",borderRadius:7,border:`1px solid ${C.border}`,fontSize:12,fontFamily:"inherit",outline:"none" }}/><input type="time" value={nlTime} onChange={e=>setNlTime(e.target.value)} style={{ padding:"6px 10px",borderRadius:7,border:`1px solid ${C.border}`,fontSize:12,fontFamily:"inherit",outline:"none" }}/></div>}
                    </div>
                  </div>
                ))}
              </div>}
              {/* Wizard nav */}
              <div style={{ display:"flex",justifyContent:"space-between",marginTop:22,paddingTop:18,borderTop:`1px solid ${C.border}` }}>
                <div style={{ display:"flex",gap:8 }}>
                  {nlStep>1&&<button onClick={()=>setNlStep(s=>s-1)} style={{ padding:"8px 16px",borderRadius:9,border:`1px solid ${C.border}`,background:"#fff",color:C.slate,fontSize:12,fontWeight:600,cursor:"pointer" }}>← Back</button>}
                  <button onClick={()=>alert("Draft saved")} style={{ padding:"8px 16px",borderRadius:9,border:`1px solid ${C.border}`,background:"#fff",color:C.slate,fontSize:12,fontWeight:600,cursor:"pointer" }}>Save Draft</button>
                </div>
                {nlStep<5
                  ?<button onClick={()=>setNlStep(s=>s+1)} style={{ padding:"8px 22px",borderRadius:9,border:"none",background:C.primary,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer" }}>Next: {NL_STEPS[nlStep]} →</button>
                  :<button onClick={()=>{ setNlLaunch(true); setTimeout(()=>{ const n={id:`nl${Date.now()}`,name:nlName,status:nlSched==="now"?"sent":"scheduled",list:nlList,sent:nlSched==="now"?selNlList?.active||0:0,opens:0,clicks:0,unsubs:0,created:"Today",subject:nlSubj,createdBy:myName}; setNlCamps(p=>[n,...p]); setNlLaunch(false); setNlDone(true); },1200); }} disabled={nlLaunch}
                      style={{ padding:"8px 22px",borderRadius:9,border:"none",background:C.green,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:8 }}>
                      {nlLaunch?<><div style={{ display:"flex",gap:3 }}>{[0,1,2].map(i=><div key={i} style={{ width:5,height:5,borderRadius:"50%",background:"#fff",opacity:0.5+i*0.25 }}/>)}</div>Sending…</>:"📰 Send Newsletter"}
                    </button>}
              </div>
            </div>
            {/* Sidebar */}
            <div style={{ background:"#fff",border:`1px solid ${C.border}`,borderRadius:12,padding:"14px 16px",height:"fit-content" }}>
              <div style={{ fontSize:12,fontWeight:700,color:C.text,marginBottom:10 }}>Summary</div>
              {[["Name",nlName||"—"],["Subject",nlSubj||"—"],["List",selNlList?.name||"—"],["Subscribers",(selNlList?.active||0).toString()],["Engine","Listmonk"],["Builder","GrapesJS+MJML"]].map(([k,v])=>(
                <div key={k} style={{ display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:`1px solid ${C.border}`,fontSize:11 }}>
                  <span style={{ color:C.muted }}>{k}</span><span style={{ color:C.text,fontWeight:600,maxWidth:"55%",textAlign:"right",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{v}</span>
                </div>
              ))}
              {role==="gp"&&<div style={{ marginTop:10,padding:"8px 10px",borderRadius:9,background:C.green+"06",border:`1px solid ${C.green}25`,fontSize:10,color:C.slate,lineHeight:1.5 }}>
                Sending to <strong>your own contacts</strong> only. Opt-in verified by Listmonk.
              </div>}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // BULK CAMPAIGN WIZARD
  // ══════════════════════════════════════════════════════════════════════════
  if(beView==="create") {
    const BE_STEPS=["Details","Recipients","Design","Review","Send"];
    return (
      <div style={{ padding:"0 28px 48px" }}>
        <div style={{ padding:"20px 0",display:"flex",alignItems:"center",gap:12 }}>
          <button onClick={()=>{ setBeView("list"); setBeStep(1); setBeDone(false); }} style={{ padding:"6px 14px",borderRadius:7,border:`1px solid ${C.border}`,background:"#fff",color:C.slate,fontSize:12,fontWeight:600,cursor:"pointer" }}>← Cancel</button>
          <div style={{ fontSize:20,fontWeight:500,color:C.text }}>{beDone?"✅ Campaign Launched!":"Create Bulk Campaign"}</div>
        </div>
        {beDone?(
          <div style={{ textAlign:"center",padding:"60px",background:"#fff",borderRadius:16,border:`1px solid ${C.border}` }}>
            <div style={{ fontSize:52,marginBottom:14 }}>🚀</div>
            <h2 style={{ fontSize:22,fontWeight:700,color:C.navy,marginBottom:8 }}>{cSendOpt==="now"?"Campaign launched!":"Campaign scheduled!"}</h2>
            <div style={{ fontSize:13,color:C.muted,marginBottom:22 }}>{cSendOpt==="now"?`Sending to ${fmt(seg.valid)} valid recipients.`:`Scheduled for ${cSchedD} at ${cSchedT}.`}</div>
            <button onClick={()=>{ setBeView("list"); setBeStep(1); setBeDone(false); setCName(""); setCSubj(""); }} style={{ padding:"11px 28px",borderRadius:10,border:"none",background:C.primary,color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer" }}>View Campaigns</button>
          </div>
        ):(
          <div style={{ display:"grid",gridTemplateColumns:"1fr 280px",gap:18 }}>
            <div>
              {/* Step progress */}
              <div style={{ display:"flex",marginBottom:22 }}>
                {BE_STEPS.map((s,i)=>{ const n=i+1,done=n<beStep,active=n===beStep; return (
                  <div key={s} style={{ display:"flex",alignItems:"center",flex:i<BE_STEPS.length-1?1:"auto" }}>
                    <div style={{ display:"flex",flexDirection:"column",alignItems:"center",cursor:done?"pointer":"default" }} onClick={()=>done&&setBeStep(n)}>
                      <div style={{ width:26,height:26,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",background:done?C.green:active?C.primary:"#F1F5F9",color:done||active?"#fff":C.muted,fontSize:done?12:11,fontWeight:700,border:`2px solid ${done?C.green:active?C.primary:C.border}` }}>{done?"✓":n}</div>
                      <div style={{ fontSize:10,fontWeight:active?700:400,color:active?C.navy:done?C.green:C.muted,marginTop:3,whiteSpace:"nowrap" }}>{s}</div>
                    </div>
                    {i<BE_STEPS.length-1&&<div style={{ flex:1,height:2,background:done?C.green:C.border,margin:"0 5px",marginBottom:14 }}/>}
                  </div>
                );})}
              </div>
              <div style={{ background:"#fff",border:`1px solid ${C.border}`,borderRadius:14,padding:"22px" }}>
                {beStep===1&&<div style={{ display:"flex",flexDirection:"column",gap:14 }}>
                  <div style={{ fontSize:15,fontWeight:700,color:C.text }}>Campaign Details</div>
                  {[["Campaign Name *",cName,setCName,"e.g. Q1 Finanz Welcome"],["Subject Line *",cSubj,setCSubj,"e.g. Your financial future starts here"]].map(([lbl,val,set,ph])=>(
                    <div key={lbl}><label style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:5 }}>{lbl}</label>
                    <input value={val} onChange={e=>set(e.target.value)} placeholder={ph} style={{ width:"100%",padding:"10px 12px",borderRadius:9,border:`1.5px solid ${val?C.primary:C.border}`,fontSize:13,fontFamily:"inherit",boxSizing:"border-box",outline:"none" }}/></div>
                  ))}
                  <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
                    {[["From Name",cFName,setCFName],["From Email",cFEmail,setCFEmail]].map(([lbl,val,set])=>(
                      <div key={lbl}><label style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:5 }}>{lbl}</label>
                      <input value={val} onChange={e=>set(e.target.value)} style={{ width:"100%",padding:"9px 12px",borderRadius:9,border:`1px solid ${C.border}`,fontSize:12,fontFamily:"inherit",boxSizing:"border-box",outline:"none" }}/></div>
                    ))}
                  </div>
                  <div><label style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:7 }}>Campaign Type</label>
                  <div style={{ display:"flex",gap:8 }}>{["marketing","announcement","newsletter"].map(t=>(
                    <button key={t} onClick={()=>setCType(t)} style={{ flex:1,padding:"8px",borderRadius:9,border:`1.5px solid ${cType===t?C.primary:C.border}`,background:cType===t?C.primary+"08":"#fff",color:cType===t?C.navy:C.muted,fontSize:12,fontWeight:cType===t?700:400,cursor:"pointer",fontFamily:"inherit",textTransform:"capitalize" }}>{t}</button>
                  ))}</div></div>
                </div>}

                {beStep===2&&<div style={{ display:"flex",flexDirection:"column",gap:14 }}>
                  <div style={{ fontSize:15,fontWeight:700,color:C.text }}>Choose Recipients</div>
                  {[["segment","Use CRM Segment"],["filters","Use Filters"],["csv","Upload CSV"]].map(([k,l])=>(
                    <div key={k} onClick={()=>setCAud(k)} style={{ padding:"11px 14px",borderRadius:10,border:`1.5px solid ${cAud===k?C.primary:C.border}`,background:cAud===k?C.primary+"05":"#fff",cursor:"pointer",display:"flex",gap:12,alignItems:"center" }}>
                      <div style={{ width:15,height:15,borderRadius:"50%",border:`2px solid ${cAud===k?C.primary:C.border}`,background:cAud===k?C.primary:"#fff",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>{cAud===k&&<div style={{ width:6,height:6,borderRadius:"50%",background:"#fff" }}/>}</div>
                      <span style={{ fontWeight:cAud===k?700:400,fontSize:13,color:cAud===k?C.navy:C.text }}>{l}</span>
                    </div>
                  ))}
                  {cAud==="segment"&&<div style={{ position:"relative" }}>
                    <select value={cSeg} onChange={e=>setCSeg(e.target.value)} style={{ width:"100%",padding:"9px 28px 9px 12px",borderRadius:9,border:`1.5px solid ${C.primary}`,fontSize:13,fontFamily:"inherit",appearance:"none",outline:"none" }}>
                      {Object.entries(BE_SEGMENTS).map(([k,v])=><option key={k} value={k}>{v.label} ({v.total.toLocaleString()})</option>)}
                    </select>
                    <span style={{ position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",pointerEvents:"none",fontSize:10,color:C.muted }}>▼</span>
                  </div>}
                  <div style={{ padding:"13px",borderRadius:10,background:"#F8FAFC",border:`1px solid ${C.border}` }}>
                    <div style={{ fontSize:12,fontWeight:700,color:C.text,marginBottom:8 }}>Recipient Summary</div>
                    {[["Total",seg.total.toLocaleString(),C.text],["✅ Valid",seg.valid.toLocaleString(),C.green],["— Unsubscribed",seg.unsub,C.muted],["— Invalid",seg.invalid,C.red],["— Duplicates",seg.dupe,C.amber]].map(([k,v,col])=>(
                      <div key={k} style={{ display:"flex",justifyContent:"space-between",padding:"4px 0",fontSize:11 }}>
                        <span style={{ color:k.startsWith("—")?C.muted:C.text }}>{k}</span><span style={{ fontFamily:"monospace",fontWeight:600,color:col }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>}

                {beStep===3&&<div style={{ display:"flex",flexDirection:"column",gap:14 }}>
                  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                    <div style={{ fontSize:15,fontWeight:700,color:C.text }}>Design Email</div>
                    <div style={{ display:"flex",gap:6 }}>
                      {[["desktop","🖥"],["mobile","📱"]].map(([m,ic])=><button key={m} onClick={()=>setCMobPrev(m==="mobile")} style={{ padding:"5px 9px",borderRadius:7,border:`1px solid ${(cMobPrev?"mobile":"desktop")===m?C.primary:C.border}`,background:(cMobPrev?"mobile":"desktop")===m?C.primary+"08":"#fff",color:(cMobPrev?"mobile":"desktop")===m?C.navy:C.muted,fontSize:10,cursor:"pointer",fontFamily:"inherit" }}>{ic}</button>)}
                    </div>
                  </div>
                  {/* Template picker */}
                  <div style={{ padding:"10px 12px",borderRadius:10,background:"#F8FAFC",border:`1px solid ${C.border}` }}>
                    <div style={{ fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:7 }}>Start from template (optional)</div>
                    {cTpl?<div style={{ display:"flex",alignItems:"center",gap:10,padding:"8px 10px",borderRadius:8,background:C.green+"06",border:`1px solid ${C.green}30` }}>
                      <span>✅</span><div style={{ flex:1 }}><div style={{ fontSize:11,fontWeight:700,color:C.green }}>{cTpl.name}</div><div style={{ fontSize:10,color:C.muted }}>Applied — edit below</div></div>
                      <button onClick={()=>{setCTpl(null);setCBody("");setCSubj("");}} style={{ fontSize:10,color:C.muted,border:"none",background:"none",cursor:"pointer" }}>✕</button>
                    </div>:<div style={{ display:"flex",gap:5,flexWrap:"wrap" }}>
                      {EMAIL_TEMPLATES_STORE.filter(t=>t.published).slice(0,4).map(t=>(
                        <div key={t.id} onClick={()=>{setCTpl(t);setCBody(t.body||"");if(t.subject)setCSubj(t.subject);}} style={{ padding:"6px 10px",borderRadius:8,border:`1px solid ${C.border}`,background:"#fff",cursor:"pointer",fontSize:11,fontWeight:600,color:C.text }}
                          onMouseEnter={e=>{e.currentTarget.style.borderColor=C.navy;e.currentTarget.style.background="#F0F4FF";}}
                          onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.background="#fff";}}>
                          {t.name.slice(0,22)}
                        </div>
                      ))}
                    </div>}
                  </div>
                  <textarea value={cBody} onChange={e=>setCBody(e.target.value)} rows={7} placeholder="Dear {FirstName},\n\nWrite your email here…" style={{ width:"100%",padding:"12px 14px",borderRadius:9,border:`1.5px solid ${cBody?C.primary:C.border}`,fontSize:12,fontFamily:"monospace",lineHeight:1.6,resize:"vertical",outline:"none",boxSizing:"border-box" }}/>
                  <div style={{ border:`1px solid ${C.border}`,borderRadius:10,overflow:"hidden" }}>
                    <div style={{ padding:"6px 12px",fontSize:10,fontWeight:700,color:C.muted,background:"#FAFAFA",borderBottom:`1px solid ${C.border}` }}>📧 Preview · {cFName} &lt;{cFEmail}&gt; · {cSubj||"(no subject)"}</div>
                    <div style={{ padding:"12px",margin:"0 auto",maxWidth:cMobPrev?310:"100%",background:"#fff" }}>
                      <div style={{ fontSize:12,lineHeight:1.7,color:C.text,whiteSpace:"pre-wrap",fontFamily:"Georgia,serif" }}>{cBody||"(empty)"}</div>
                      <div style={{ marginTop:8,paddingTop:8,borderTop:`1px solid ${C.border}`,fontSize:10,color:C.muted }}>vion gmbh · Musterstraße 1 · 80331 München · <span style={{ textDecoration:"underline" }}>Unsubscribe</span></div>
                    </div>
                  </div>
                  <div style={{ display:"flex",gap:8,alignItems:"center" }}>
                    <button onClick={()=>{alert("Test sent.");setCTestSent(true);}} style={{ padding:"7px 13px",borderRadius:8,border:`1px solid ${C.border}`,background:"#fff",color:C.slate,fontSize:11,fontWeight:600,cursor:"pointer" }}>📧 Send Test</button>
                    {cTestSent&&<span style={{ fontSize:11,color:C.green,fontWeight:700 }}>✅ Sent</span>}
                  </div>
                </div>}

                {beStep===4&&<div style={{ display:"flex",flexDirection:"column",gap:14 }}>
                  <div style={{ fontSize:15,fontWeight:700,color:C.text }}>Review Campaign</div>
                  <div style={{ padding:"13px",borderRadius:10,background:"#F8FAFC",border:`1px solid ${C.border}` }}>
                    {[["Name",cName||"—"],["Type",cType],["Subject",cSubj||"—"],["From",`${cFName} <${cFEmail}>`],["Audience",BE_SEGMENTS[cSeg]?.label||cSeg],["Valid",seg.valid.toLocaleString()]].map(([k,v])=>(
                      <div key={k} style={{ display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${C.border}`,fontSize:12 }}><span style={{ color:C.muted }}>{k}</span><span style={{ fontWeight:600,color:C.text }}>{v}</span></div>
                    ))}
                  </div>
                  <div style={{ padding:"13px",borderRadius:10,background:"#F8FAFC",border:`1px solid ${C.border}` }}>
                    <div style={{ fontSize:12,fontWeight:700,color:C.text,marginBottom:7 }}>Pre-Send Checklist</div>
                    {beChecks.map((ch,i)=><div key={i} style={{ display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:`1px solid ${C.border}`,fontSize:12 }}><span>{ch.ok?"✅":"❌"}</span><span style={{ color:ch.ok?C.text:C.red }}>{ch.label}</span></div>)}
                  </div>
                </div>}

                {beStep===5&&<div style={{ display:"flex",flexDirection:"column",gap:14 }}>
                  <div style={{ fontSize:15,fontWeight:700,color:C.text }}>Send Options</div>
                  {[["now","Send Now","Dispatch immediately"],["scheduled","Schedule","Pick date & time"]].map(([k,l,d])=>(
                    <div key={k} onClick={()=>setCSendOpt(k)} style={{ padding:"14px",borderRadius:10,border:`1.5px solid ${cSendOpt===k?C.primary:C.border}`,background:cSendOpt===k?C.primary+"05":"#fff",cursor:"pointer",display:"flex",gap:12,alignItems:"flex-start" }}>
                      <div style={{ width:17,height:17,borderRadius:"50%",border:`2px solid ${cSendOpt===k?C.primary:C.border}`,background:cSendOpt===k?C.primary:"#fff",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1 }}>{cSendOpt===k&&<div style={{ width:6,height:6,borderRadius:"50%",background:"#fff" }}/>}</div>
                      <div><div style={{ fontSize:13,fontWeight:700,color:cSendOpt===k?C.navy:C.text }}>{l}</div><div style={{ fontSize:11,color:C.muted }}>{d}</div>
                      {k==="scheduled"&&cSendOpt==="scheduled"&&<div style={{ display:"flex",gap:8,marginTop:8 }}><input type="date" value={cSchedD} onChange={e=>setCSchedD(e.target.value)} style={{ padding:"6px 10px",borderRadius:7,border:`1px solid ${C.border}`,fontSize:12,fontFamily:"inherit",outline:"none" }}/><input type="time" value={cSchedT} onChange={e=>setCSchedT(e.target.value)} style={{ padding:"6px 10px",borderRadius:7,border:`1px solid ${C.border}`,fontSize:12,fontFamily:"inherit",outline:"none" }}/></div>}
                      </div>
                    </div>
                  ))}
                  <div style={{ padding:"10px 12px",borderRadius:9,background:C.green+"06",border:`1px solid ${C.green}25`,fontSize:11,color:C.slate }}>✅ Ready to send to {fmt(seg.valid)} valid recipients · Suppression applied · GDPR checked</div>
                </div>}

                <div style={{ display:"flex",justifyContent:"space-between",marginTop:20,paddingTop:16,borderTop:`1px solid ${C.border}` }}>
                  <div style={{ display:"flex",gap:8 }}>
                    {beStep>1&&<button onClick={()=>setBeStep(s=>s-1)} style={{ padding:"8px 16px",borderRadius:9,border:`1px solid ${C.border}`,background:"#fff",color:C.slate,fontSize:12,fontWeight:600,cursor:"pointer" }}>← Back</button>}
                    <button onClick={()=>alert("Draft saved")} style={{ padding:"8px 16px",borderRadius:9,border:`1px solid ${C.border}`,background:"#fff",color:C.slate,fontSize:12,fontWeight:600,cursor:"pointer" }}>Save Draft</button>
                  </div>
                  {beStep<5
                    ?<button onClick={()=>setBeStep(s=>s+1)} style={{ padding:"8px 20px",borderRadius:9,border:"none",background:C.primary,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer" }}>Next: {BE_STEPS[beStep]} →</button>
                    :<button onClick={()=>{ setBeLaunch(true); setTimeout(()=>{ const n={id:`c${Date.now()}`,name:cName,status:cSendOpt==="now"?"sending":"scheduled",recipients:seg.total,valid:seg.valid,sent:0,delivered:0,opens:0,clicks:0,bounces:0,unsubs:0,created:"Today",subject:cSubj,type:cType}; setBeCamps(p=>[n,...p]); setBeLaunch(false); setBeDone(true); },1200); }} disabled={beLaunch}
                        style={{ padding:"8px 20px",borderRadius:9,border:"none",background:C.green,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:8 }}>
                        {beLaunch?<><div style={{ display:"flex",gap:3 }}>{[0,1,2].map(i=><div key={i} style={{ width:5,height:5,borderRadius:"50%",background:"#fff",opacity:0.5+i*0.25 }}/>)}</div>Launching…</>:"🚀 Send Campaign"}
                      </button>}
                </div>
              </div>
            </div>
            {/* Sidebar */}
            <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
              <div style={{ background:"#fff",border:`1px solid ${C.border}`,borderRadius:12,padding:"14px 16px" }}>
                <div style={{ fontSize:12,fontWeight:700,color:C.text,marginBottom:10 }}>Summary</div>
                {[["Name",cName||"—"],["Type",cType],["Subject",cSubj||"—"],["Audience",BE_SEGMENTS[cSeg]?.label||"—"],["Valid",seg.valid.toLocaleString()]].map(([k,v])=>(
                  <div key={k} style={{ display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:`1px solid ${C.border}`,fontSize:11 }}><span style={{ color:C.muted }}>{k}</span><span style={{ color:C.text,fontWeight:600,maxWidth:"55%",textAlign:"right",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{v}</span></div>
                ))}
              </div>
              <div style={{ background:"#fff",border:`1px solid ${C.border}`,borderRadius:12,padding:"14px 16px" }}>
                <div style={{ fontSize:11,fontWeight:700,color:C.text,marginBottom:8 }}>Compliance</div>
                {[["GDPR","✅"],["Suppression","✅"],["Unsubscribe","✅ Auto"],["SPF/DKIM","✅"]].map(([k,v])=>(
                  <div key={k} style={{ display:"flex",justifyContent:"space-between",padding:"4px 0",fontSize:11,borderBottom:`1px solid ${C.border}` }}><span style={{ color:C.muted }}>{k}</span><span style={{ color:C.green,fontWeight:600 }}>{v}</span></div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // CAMPAIGN DETAIL (bulk)
  // ══════════════════════════════════════════════════════════════════════════
  if(beSel) {
    const sm = EM_STATUS_META[beSel.status]||EM_STATUS_META.draft;
    return (
      <div style={{ padding:"0 28px 48px" }}>
        <div style={{ display:"flex",alignItems:"center",gap:10,padding:"20px 0 16px",flexWrap:"wrap" }}>
          <button onClick={()=>setBeSel(null)} style={{ padding:"6px 12px",borderRadius:7,border:`1px solid ${C.border}`,background:"#fff",color:C.slate,fontSize:12,fontWeight:600,cursor:"pointer" }}>← Back</button>
          <div style={{ flex:1 }}><div style={{ fontSize:20,fontWeight:700,color:C.text }}>{beSel.name}</div><div style={{ fontSize:11,color:C.muted,marginTop:1 }}>{beSel.subject}</div></div>
          <span style={{ fontSize:11,fontWeight:700,padding:"4px 11px",borderRadius:20,background:sm.color+"18",color:sm.color }}>{sm.label}</span>
          {beSel.status==="sending"&&<button onClick={()=>{setBeCamps(p=>p.map(c=>c.id===beSel.id?{...c,status:"paused"}:c));setBeSel(p=>({...p,status:"paused"}));}} style={{ padding:"5px 12px",borderRadius:8,border:`1px solid ${C.red}30`,background:C.red+"08",color:C.red,fontSize:11,fontWeight:700,cursor:"pointer" }}>⏸ Pause</button>}
          {beSel.status==="paused"&&<button onClick={()=>{setBeCamps(p=>p.map(c=>c.id===beSel.id?{...c,status:"sending"}:c));setBeSel(p=>({...p,status:"sending"}));}} style={{ padding:"5px 12px",borderRadius:8,border:"none",background:C.green,color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer" }}>▶ Resume</button>}
          <button onClick={()=>alert("Exporting…")} style={{ padding:"5px 12px",borderRadius:8,border:`1px solid ${C.border}`,background:"#fff",color:C.slate,fontSize:11,fontWeight:600,cursor:"pointer" }}>⬇ Export</button>
        </div>
        {/* KPIs */}
        <div style={{ display:"grid",gridTemplateColumns:"repeat(8,1fr)",gap:10,marginBottom:16 }}>
          {[["📤 Sent",fmt(beSel.sent),C.navy],["📬 Del.",fmt(beSel.delivered),C.green],["📊 Del%",pct(beSel.delivered,beSel.sent),C.green],["👁 Opens",fmt(beSel.opens),C.blue],["📈 Open%",pct(beSel.opens,beSel.delivered),C.blue],["🔗 Clicks",fmt(beSel.clicks),C.indigo],["↩ Bounced",fmt(beSel.bounces),C.muted],["🚫 Unsubs",fmt(beSel.unsubs),C.amber]].map(([lbl,val,col])=>(
            <div key={lbl} style={{ background:"#fff",border:`1px solid ${C.border}`,borderRadius:10,padding:"11px 13px" }}>
              <div style={{ fontSize:9,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:5 }}>{lbl}</div>
              <div style={{ fontSize:18,fontWeight:600,color:col }}>{val}</div>
            </div>
          ))}
        </div>
        {/* Sub-tabs */}
        <div style={{ display:"flex",borderBottom:`2px solid ${C.border}`,marginBottom:16 }}>
          {[{id:"details",label:"📋 Details"},{id:"preview",label:"✉️ Preview Template"},{id:"recipients",label:"👥 Recipients"}].map(t=>(
            <button key={t.id} onClick={()=>setBeDetTab(t.id)} style={{ padding:"9px 18px",border:"none",background:"transparent",cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:beDetTab===t.id?700:400,color:beDetTab===t.id?C.navy:C.muted,borderBottom:`2px solid ${beDetTab===t.id?C.primary:"transparent"}`,marginBottom:-2 }}>{t.label}</button>
          ))}
        </div>

        {beDetTab==="details"&&<div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14 }}>
          <div style={{ background:"#fff",border:`1px solid ${C.border}`,borderRadius:14,padding:"18px 22px" }}>
            <div style={{ fontSize:13,fontWeight:700,color:C.text,marginBottom:12 }}>Campaign Info</div>
            {[["Name",beSel.name],["Type",beSel.type],["Status",sm.label],["Subject",beSel.subject],["From","vion Financial Team <newsletter@vion.de>"],["Created",beSel.created],["Sent",beSel.sent>0?"10 Feb 2026 · 09:00":"—"]].map(([k,v])=>(
              <div key={k} style={{ display:"flex",padding:"8px 0",borderBottom:`1px solid ${C.border}`,fontSize:12,gap:14 }}>
                <span style={{ color:C.muted,width:120,flexShrink:0 }}>{k}</span><span style={{ color:C.text,fontWeight:500,flex:1 }}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
            {beSel.sent>0&&<div style={{ background:"#fff",border:`1px solid ${C.border}`,borderRadius:14,padding:"18px 22px" }}>
              <div style={{ fontSize:13,fontWeight:700,color:C.text,marginBottom:12 }}>Delivery Funnel</div>
              {[{l:"Sent",v:beSel.sent,c:C.navy},{l:"Delivered",v:beSel.delivered,c:C.green},{l:"Opened",v:beSel.opens,c:C.blue},{l:"Clicked",v:beSel.clicks,c:C.indigo}].map(r=>(
                <div key={r.l} style={{ marginBottom:10 }}>
                  <div style={{ display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:3 }}><span>{r.l}</span><span style={{ fontFamily:"monospace",color:C.muted }}>{fmt(r.v)} · {pct(r.v,beSel.sent)}</span></div>
                  <div style={{ height:6,background:"#F2F4F7",borderRadius:3,overflow:"hidden" }}><div style={{ height:"100%",width:`${Math.round(r.v/beSel.sent*100)||0}%`,background:r.c,borderRadius:3 }}/></div>
                </div>
              ))}
            </div>}
            <div style={{ background:"#fff",border:`1px solid ${C.border}`,borderRadius:14,padding:"18px 22px" }}>
              <div style={{ fontSize:13,fontWeight:700,color:C.text,marginBottom:12 }}>Audience</div>
              {[["Source","Active Contacts — CRM segment"],["Total",fmt(beSel.recipients||0)],["✅ Valid",fmt(beSel.valid||0)],["— Unsubscribed","23"],["— Invalid","12"]].map(([k,v])=>(
                <div key={k} style={{ display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${C.border}`,fontSize:12 }}><span style={{ color:k.startsWith("—")?C.muted:C.text }}>{k}</span><span style={{ fontFamily:"monospace",fontWeight:600,color:k.startsWith("✅")?C.green:k.startsWith("—")?C.red:C.text }}>{v}</span></div>
              ))}
            </div>
          </div>
        </div>}

        {beDetTab==="preview"&&<div style={{ display:"grid",gridTemplateColumns:"210px 1fr",gap:14 }}>
          <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
            <div style={{ background:"#fff",border:`1px solid ${C.border}`,borderRadius:12,padding:"14px" }}>
              <div style={{ fontSize:12,fontWeight:700,color:C.text,marginBottom:10 }}>Template Info</div>
              {[["Name","Q1 Finanz Welcome"],["Journey","Welcome"],["Language","🇩🇪 DE"],["Status","Active ✓"]].map(([k,v])=>(
                <div key={k} style={{ display:"flex",flexDirection:"column",padding:"6px 0",borderBottom:`1px solid ${C.border}`,fontSize:11 }}><span style={{ color:C.muted,marginBottom:2 }}>{k}</span><span style={{ color:C.text,fontWeight:600 }}>{v}</span></div>
              ))}
            </div>
            <div style={{ display:"flex",gap:5 }}>
              <button onClick={()=>setBeMob(false)} style={{ flex:1,padding:"5px",borderRadius:7,border:`1px solid ${!beMob?C.primary:C.border}`,background:!beMob?C.primary+"08":"#fff",color:!beMob?C.navy:C.muted,fontSize:10,fontWeight:!beMob?700:400,cursor:"pointer",fontFamily:"inherit" }}>🖥 Desktop</button>
              <button onClick={()=>setBeMob(true)} style={{ flex:1,padding:"5px",borderRadius:7,border:`1px solid ${beMob?C.primary:C.border}`,background:beMob?C.primary+"08":"#fff",color:beMob?C.navy:C.muted,fontSize:10,fontWeight:beMob?700:400,cursor:"pointer",fontFamily:"inherit" }}>📱 Mobile</button>
            </div>
            <button onClick={()=>{setBeTestSent(true);setTimeout(()=>setBeTestSent(false),2500);}} style={{ padding:"7px",borderRadius:8,border:`1px solid ${C.border}`,background:"#fff",color:beTestSent?C.green:C.slate,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>{beTestSent?"✅ Sent!":"📧 Send Test"}</button>
          </div>
          <div style={{ background:beMob?"#E5E7EB":"#F8FAFC",borderRadius:12,padding:beMob?"16px":"0",display:"flex",justifyContent:"center",alignItems:"flex-start",border:`1px solid ${C.border}`,minHeight:360 }}>
            <div style={{ width:beMob?360:"100%",background:"#fff",borderRadius:beMob?12:0,overflow:"hidden",boxShadow:beMob?"0 8px 20px rgba(0,0,0,0.1)":"none" }}>
              <div style={{ background:C.primary,padding:"14px 20px",textAlign:"center" }}><div style={{ fontSize:15,fontWeight:700,color:"#fff",fontStyle:"italic" }}>vion<span style={{ fontWeight:300 }}>world</span></div></div>
              <div style={{ padding:"20px 24px",fontSize:12,lineHeight:1.7,color:C.text,fontFamily:"Georgia,serif" }}>
                Dear Sandra,{"\n\n"}We have an exciting opportunity for you regarding your financial future.{"\n\n"}Best regards,{"\n"}Anna Klein
              </div>
              <div style={{ padding:"12px 24px 16px",borderTop:`1px solid ${C.border}`,background:"#FAFAFA",textAlign:"center",fontSize:10,color:C.muted,lineHeight:1.7 }}>
                vion gmbh · Musterstraße 1 · 80331 München<br/><span style={{ textDecoration:"underline",color:C.blue,cursor:"pointer" }}>Unsubscribe</span> · <span style={{ textDecoration:"underline",color:C.blue,cursor:"pointer" }}>Preferences</span>
              </div>
            </div>
          </div>
        </div>}

        {beDetTab==="recipients"&&<div>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:10,marginBottom:12 }}>
            {[["Total",fmt(beSel.valid||0),C.navy],["Delivered",fmt(beSel.delivered),C.green],["Opened",fmt(beSel.opens),C.blue],["Clicked",fmt(beSel.clicks),C.indigo],["Bounced",fmt(beSel.bounces),C.red],["Unsubs",fmt(beSel.unsubs),C.amber]].map(([lbl,val,col])=>(
              <div key={lbl} onClick={()=>setBeRF(lbl==="Total"?"all":lbl.toLowerCase())} style={{ background:beRF===(lbl==="Total"?"all":lbl.toLowerCase())?col+"12":"#fff",border:`1.5px solid ${beRF===(lbl==="Total"?"all":lbl.toLowerCase())?col:C.border}`,borderRadius:10,padding:"10px 12px",cursor:"pointer" }}>
                <div style={{ fontSize:9,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:4 }}>{lbl}</div>
                <div style={{ fontSize:18,fontWeight:700,color:col }}>{val}</div>
              </div>
            ))}
          </div>
          <div style={{ display:"flex",gap:8,marginBottom:10 }}>
            <div style={{ flex:1,display:"flex",alignItems:"center",gap:8,padding:"7px 12px",background:"#fff",borderRadius:9,border:`1px solid ${C.border}` }}>
              <span style={{ color:C.muted }}>🔍</span><input value={beRS} onChange={e=>setBeRS(e.target.value)} placeholder="Search…" style={{ flex:1,border:"none",background:"transparent",fontSize:12,fontFamily:"inherit",color:C.text,outline:"none" }}/>
            </div>
            <button onClick={()=>alert("Exporting CSV…")} style={{ padding:"7px 13px",borderRadius:8,border:`1px solid ${C.border}`,background:"#fff",color:C.slate,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>⬇ Export</button>
          </div>
          <div style={{ background:"#fff",border:`1px solid ${C.border}`,borderRadius:12,overflow:"hidden" }}>
            <table style={{ width:"100%",borderCollapse:"collapse",fontSize:12 }}>
              <thead><tr style={{ background:"#FAFAFA",borderBottom:`2px solid ${C.border}` }}>
                {["Name","Email","Lang","Status","Sent","Opened","Clicked",""].map(h=><th key={h} style={{ padding:"9px 12px",textAlign:"left",fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.04em" }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {[{name:"Sandra Richter",email:"s.richter@web.de",lang:"de",status:"opened",sent:"09:01",opened:"11:23",clicked:"11:24"},{name:"Klaus Weber",email:"k.weber@gmx.de",lang:"de",status:"clicked",sent:"09:01",opened:"14:05",clicked:"14:07"},{name:"Maria Hoffmann",email:"m.hoffmann@gmail.com",lang:"en",status:"delivered",sent:"09:02",opened:"—",clicked:"—"},{name:"Petra Müller",email:"p.mueller@t-online.de",lang:"de",status:"bounced",sent:"09:03",opened:"—",clicked:"—"}]
                .filter(r=>(beRF==="all"||r.status===beRF)&&(!beRS||r.name.toLowerCase().includes(beRS.toLowerCase())))
                .map((r,i)=>{
                  const rc={delivered:{label:"Delivered",color:C.blue},opened:{label:"Opened",color:C.green},clicked:{label:"Clicked",color:C.indigo},bounced:{label:"Bounced",color:C.red}}[r.status]||{label:r.status,color:C.muted};
                  return (<tr key={i} style={{ borderBottom:`1px solid ${C.border}`,background:i%2?"#FAFAFA":"#fff" }}>
                    <td style={{ padding:"9px 12px",fontWeight:600,color:C.text }}>{r.name}</td>
                    <td style={{ padding:"9px 12px",fontFamily:"monospace",fontSize:11,color:C.muted }}>{r.email}</td>
                    <td style={{ padding:"9px 12px",textAlign:"center",fontSize:12 }}>{r.lang==="en"?"🇬🇧":"🇩🇪"}</td>
                    <td style={{ padding:"9px 12px" }}><span style={{ fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:20,background:rc.color+"18",color:rc.color }}>{rc.label}</span></td>
                    <td style={{ padding:"9px 12px",fontSize:11,color:C.muted }}>{r.sent}</td>
                    <td style={{ padding:"9px 12px",fontSize:11,color:r.opened==="—"?C.border:C.green,fontWeight:r.opened!=="—"?600:400 }}>{r.opened}</td>
                    <td style={{ padding:"9px 12px",fontSize:11,color:r.clicked==="—"?C.border:C.indigo,fontWeight:r.clicked!=="—"?600:400 }}>{r.clicked}</td>
                    <td style={{ padding:"9px 12px" }}>{r.status==="bounced"&&<button onClick={()=>alert(r.email+" suppressed.")} style={{ padding:"3px 8px",borderRadius:6,border:`1px solid ${C.red}30`,background:C.red+"08",color:C.red,fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>+ Suppress</button>}</td>
                  </tr>);
                })}
              </tbody>
            </table>
          </div>
        </div>}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // MAIN DASHBOARD
  // ══════════════════════════════════════════════════════════════════════════
  const beTotSent = beCamps.reduce((s,c)=>s+(c.sent||0),0);
  const beTotDel  = beCamps.reduce((s,c)=>s+(c.delivered||0),0);
  const beTotOp   = beCamps.reduce((s,c)=>s+(c.opens||0),0);
  const beTotCl   = beCamps.reduce((s,c)=>s+(c.clicks||0),0);
  const nlTotSent = nlCamps.reduce((s,c)=>s+(c.sent||0),0);
  const nlTotOp   = nlCamps.reduce((s,c)=>s+(c.opens||0),0);
  const nlTotCl   = nlCamps.reduce((s,c)=>s+(c.clicks||0),0);

  const beShown = beCamps.filter(c=>(beSF==="all"||c.status===beSF)&&(!beSearch||c.name.toLowerCase().includes(beSearch.toLowerCase())));
  const nlVisible = nlCamps
    .filter(c=> role==="gp"?c.createdBy===myName : role==="vd"?!c.createdBy||c.createdBy!=="Anna Klein"||true:true)
    .filter(c=>(nlSF==="all"||c.status===nlSF)&&(!nlSearch||c.name.toLowerCase().includes(nlSearch.toLowerCase())));

  return (
    <div style={{ padding:"0 28px 48px" }}>
      {/* Header */}
      <div style={{ padding:"24px 0 18px",display:"flex",alignItems:"flex-end",justifyContent:"space-between" }}>
        <div>
          <h1 style={{ fontSize:30,fontWeight:400,letterSpacing:"-0.02em",color:C.text,margin:0 }}>
            Email <em style={{ color:C.indigo,fontWeight:400 }}>Marketing</em>
          </h1>
          <div style={{ marginTop:5,fontSize:11,color:C.muted,letterSpacing:"0.1em",textTransform:"uppercase",display:"flex",gap:10 }}>
            {canCampaigns&&<span>Bulk Campaigns</span>}
            {canNewsletter&&<span>Newsletters · Listmonk + GrapesJS</span>}
            <span style={{ color:C.green }}>● Connected</span>
          </div>
        </div>
        <div style={{ display:"flex",gap:8 }}>
          {canViewInteg&&<button onClick={()=>alert("⚙️ Integration: Listmonk · GrapesJS · Amazon SES — configure in Settings → Integrations.")} style={{ padding:"8px 14px",borderRadius:9,border:`1px solid ${C.border}`,background:"#fff",color:C.slate,fontSize:12,fontWeight:600,cursor:"pointer" }}>⚙️ Integration</button>}
          {mainTab==="campaigns"&&canCampaigns&&<button onClick={()=>{ setBeView("create"); setBeStep(1); setBeDone(false); setCName(""); setCSubj(""); setCBody(""); setCTpl(null); }} style={{ padding:"8px 16px",borderRadius:9,border:"none",background:C.primary,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer" }}>+ New Campaign</button>}
          {mainTab==="newsletters"&&canNewsletter&&<button onClick={()=>{ setNlView("create"); setNlStep(1); setNlDone(false); setNlName(""); setNlSubj(""); }} style={{ padding:"8px 16px",borderRadius:9,border:"none",background:C.indigo,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer" }}>+ New Newsletter</button>}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex",borderBottom:`2px solid ${C.border}`,marginBottom:20 }}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setMainTab(t.id)}
            style={{ padding:"9px 18px",border:"none",background:"transparent",cursor:"pointer",fontFamily:"inherit",
              fontSize:13,fontWeight:mainTab===t.id?700:400,color:mainTab===t.id?C.navy:C.muted,
              borderBottom:`2px solid ${mainTab===t.id?C.primary:"transparent"}`,marginBottom:-2,display:"flex",alignItems:"center",gap:7 }}>
            {t.label}
            <span style={{ fontSize:10,fontWeight:700,padding:"1px 6px",borderRadius:20,background:mainTab===t.id?C.primary:C.border,color:mainTab===t.id?"#fff":C.muted }}>{t.n}</span>
          </button>
        ))}
      </div>

      {/* ── CAMPAIGNS ── */}
      {mainTab==="campaigns"&&canCampaigns&&<>
        <div style={{ display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:12,marginBottom:18 }}>
          {[["📤 Sent",fmt(beTotSent),C.navy],["📬 Del. Rate",pct(beTotDel,beTotSent),C.green],["👁 Avg Open",pct(beTotOp,beTotDel),C.blue],["🔗 Avg Click",pct(beTotCl,beTotDel),C.indigo],["📨 Total",beCamps.length,C.purple],["⚡ Active",beCamps.filter(c=>c.status==="sending").length,C.amber]].map(([lbl,val,col])=>(
            <div key={lbl} style={{ background:"#fff",border:`1px solid ${C.border}`,borderRadius:12,padding:"13px 15px" }}>
              <div style={{ fontSize:9,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:7 }}>{lbl}</div>
              <div style={{ fontSize:22,fontWeight:500,color:col }}>{val}</div>
            </div>
          ))}
        </div>
        <div style={{ display:"flex",gap:8,marginBottom:12 }}>
          <div style={{ flex:1,display:"flex",alignItems:"center",gap:8,padding:"7px 12px",background:"#fff",borderRadius:9,border:`1px solid ${C.border}` }}>
            <span style={{ color:C.muted }}>🔍</span><input value={beSearch} onChange={e=>setBeSearch(e.target.value)} placeholder="Search campaigns…" style={{ flex:1,border:"none",background:"transparent",fontSize:12,fontFamily:"inherit",color:C.text,outline:"none" }}/>
          </div>
          <div style={{ display:"flex",border:`1px solid ${C.border}`,borderRadius:9,overflow:"hidden" }}>
            {["all","draft","sending","sent","scheduled","paused"].map(s=>(
              <button key={s} onClick={()=>setBeSF(s)} style={{ padding:"7px 10px",border:"none",background:beSF===s?C.primary:"#fff",color:beSF===s?"#fff":C.muted,fontSize:10,fontWeight:beSF===s?700:400,cursor:"pointer",fontFamily:"inherit",textTransform:"capitalize" }}>{s==="all"?"All":s}</button>
            ))}
          </div>
        </div>
        <div style={{ background:"#fff",border:`1px solid ${C.border}`,borderRadius:14,overflowX:"auto" }}>
          <table style={{ width:"100%",minWidth:800,borderCollapse:"collapse",fontSize:12 }}>
            <thead><tr style={{ background:"#FAFAFA",borderBottom:`2px solid ${C.border}` }}>
              {["Campaign","Type","Status","Recipients","Delivered","Open","Click","Bounce","Created",""].map(h=><th key={h} style={{ padding:"9px 12px",textAlign:"left",fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.04em",whiteSpace:"nowrap" }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {beShown.length===0&&<tr><td colSpan={10} style={{ padding:"40px",textAlign:"center",color:C.muted }}>No campaigns match.</td></tr>}
              {beShown.map((c,i)=>{ const sm=EM_STATUS_META[c.status]||EM_STATUS_META.draft; return (
                <tr key={c.id} style={{ borderBottom:`1px solid ${C.border}`,cursor:"pointer",background:i%2?"#FAFAFA":"#fff" }}
                  onMouseEnter={e=>e.currentTarget.style.background="#F0F4FF"}
                  onMouseLeave={e=>e.currentTarget.style.background=i%2?"#FAFAFA":"#fff"}>
                  <td style={{ padding:"10px 12px" }}><div style={{ fontWeight:700,color:C.text }}>{c.name}</div><div style={{ fontSize:10,color:C.muted,marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:190 }}>{c.subject}</div></td>
                  <td style={{ padding:"10px 12px" }}><span style={{ fontSize:10,padding:"2px 7px",borderRadius:8,background:C.border,color:C.slate,textTransform:"capitalize" }}>{c.type}</span></td>
                  <td style={{ padding:"10px 12px" }}><span style={{ fontSize:10,fontWeight:700,padding:"2px 9px",borderRadius:20,background:sm.color+"18",color:sm.color }}>{sm.label}</span></td>
                  <td style={{ padding:"10px 12px",fontFamily:"monospace" }}>{fmt(c.valid)}</td>
                  <td style={{ padding:"10px 12px",fontFamily:"monospace",color:C.green }}>{c.sent>0?pct(c.delivered,c.sent):"—"}</td>
                  <td style={{ padding:"10px 12px",fontFamily:"monospace",color:C.blue }}>{c.sent>0?pct(c.opens,c.delivered):"—"}</td>
                  <td style={{ padding:"10px 12px",fontFamily:"monospace",color:C.indigo }}>{c.sent>0?pct(c.clicks,c.delivered):"—"}</td>
                  <td style={{ padding:"10px 12px",fontFamily:"monospace",color:C.muted }}>{c.sent>0?pct(c.bounces,c.sent):"—"}</td>
                  <td style={{ padding:"10px 12px",fontSize:11,color:C.muted,whiteSpace:"nowrap" }}>{c.created}</td>
                  <td style={{ padding:"10px 12px" }}><button onClick={()=>{ setBeSel(c); setBeDetTab("details"); setBeMob(false); setBeTestSent(false); setBeRS(""); setBeRF("all"); }} style={{ padding:"4px 10px",borderRadius:6,border:`1px solid ${C.border}`,background:"#fff",color:C.blue,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit" }}>View →</button></td>
                </tr>);
              })}
            </tbody>
          </table>
        </div>
      </>}

      {/* ── NEWSLETTERS ── */}
      {mainTab==="newsletters"&&canNewsletter&&<>
        {role==="gp"&&<div style={{ marginBottom:14,padding:"9px 13px",borderRadius:9,background:C.green+"06",border:`1px solid ${C.green}25`,fontSize:11,color:C.slate }}>
          <strong style={{ color:C.green }}>👤 Your Newsletter Workspace</strong> — Send newsletters to <strong>{myLists[0]?.name||"My Contacts"}</strong> ({myLists[0]?.active||0} active subscribers). GDPR-compliant via Listmonk.
        </div>}
        <div style={{ display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12,marginBottom:18 }}>
          {[["📰 Newsletters",nlCamps.filter(c=>role==="gp"?c.createdBy===myName:true).length,C.navy],["📧 Sent",fmt(nlTotSent),C.green],["👁 Avg Open",pct(nlTotOp,nlTotSent),C.blue],["🔗 Avg Click",pct(nlTotCl,nlTotSent),C.indigo],["👥 My Subs",myLists.reduce((s,l)=>s+l.active,0),C.purple]].map(([lbl,val,col])=>(
            <div key={lbl} style={{ background:"#fff",border:`1px solid ${C.border}`,borderRadius:12,padding:"13px 15px" }}>
              <div style={{ fontSize:9,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:7 }}>{lbl}</div>
              <div style={{ fontSize:22,fontWeight:500,color:col }}>{val}</div>
            </div>
          ))}
        </div>
        <div style={{ display:"flex",gap:8,marginBottom:12 }}>
          <div style={{ flex:1,display:"flex",alignItems:"center",gap:8,padding:"7px 12px",background:"#fff",borderRadius:9,border:`1px solid ${C.border}` }}>
            <span style={{ color:C.muted }}>🔍</span><input value={nlSearch} onChange={e=>setNlSearch(e.target.value)} placeholder="Search newsletters…" style={{ flex:1,border:"none",background:"transparent",fontSize:12,fontFamily:"inherit",color:C.text,outline:"none" }}/>
          </div>
          <div style={{ display:"flex",border:`1px solid ${C.border}`,borderRadius:9,overflow:"hidden" }}>
            {["all","draft","sending","sent","scheduled"].map(s=>(
              <button key={s} onClick={()=>setNlSF(s)} style={{ padding:"7px 10px",border:"none",background:nlSF===s?C.primary:"#fff",color:nlSF===s?"#fff":C.muted,fontSize:10,fontWeight:nlSF===s?700:400,cursor:"pointer",fontFamily:"inherit",textTransform:"capitalize" }}>{s==="all"?"All":s}</button>
            ))}
          </div>
        </div>
        <div style={{ background:"#fff",border:`1px solid ${C.border}`,borderRadius:14,overflowX:"auto" }}>
          <table style={{ width:"100%",minWidth:680,borderCollapse:"collapse",fontSize:12 }}>
            <thead><tr style={{ background:"#FAFAFA",borderBottom:`2px solid ${C.border}` }}>
              {["Newsletter","List","Status","Sent","Open Rate","Click Rate","Unsubs","Created",""].map(h=><th key={h} style={{ padding:"9px 12px",textAlign:"left",fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.04em",whiteSpace:"nowrap" }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {nlVisible.length===0&&<tr><td colSpan={9} style={{ padding:"40px",textAlign:"center",color:C.muted }}>
                {role==="gp"?"No newsletters yet. Click \"+ New Newsletter\" to get started.":"No newsletters match."}
              </td></tr>}
              {nlVisible.map((c,i)=>{ const sm=EM_STATUS_META[c.status]||EM_STATUS_META.draft; const lst=NL_LISTS.find(l=>l.id===c.list); return (
                <tr key={c.id} style={{ borderBottom:`1px solid ${C.border}`,background:i%2?"#FAFAFA":"#fff" }}
                  onMouseEnter={e=>e.currentTarget.style.background="#F0F4FF"}
                  onMouseLeave={e=>e.currentTarget.style.background=i%2?"#FAFAFA":"#fff"}>
                  <td style={{ padding:"10px 12px" }}><div style={{ fontWeight:700,color:C.text }}>{c.name}</div><div style={{ fontSize:10,color:C.muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:170,marginTop:1 }}>{c.subject}</div></td>
                  <td style={{ padding:"10px 12px",fontSize:11,color:C.muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:130 }}>{lst?.name||"—"}</td>
                  <td style={{ padding:"10px 12px" }}><span style={{ fontSize:10,fontWeight:700,padding:"2px 9px",borderRadius:20,background:sm.color+"18",color:sm.color }}>{sm.label}</span></td>
                  <td style={{ padding:"10px 12px",fontFamily:"monospace" }}>{fmt(c.sent)}</td>
                  <td style={{ padding:"10px 12px",fontFamily:"monospace",color:C.blue }}>{c.sent>0?pct(c.opens,c.sent):"—"}</td>
                  <td style={{ padding:"10px 12px",fontFamily:"monospace",color:C.indigo }}>{c.sent>0?pct(c.clicks,c.sent):"—"}</td>
                  <td style={{ padding:"10px 12px",fontFamily:"monospace",color:C.amber }}>{fmt(c.unsubs)||"—"}</td>
                  <td style={{ padding:"10px 12px",fontSize:11,color:C.muted }}>{c.created}</td>
                  <td style={{ padding:"10px 12px" }}>
                    <div style={{ display:"flex",gap:5 }}>
                      {c.status==="draft"&&(role==="superadmin"||(role==="gp"&&c.createdBy===myName))&&<button onClick={()=>{ setNlName(c.name); setNlSubj(c.subject); setNlView("create"); setNlStep(1); }} style={{ padding:"3px 8px",borderRadius:6,border:`1px solid ${C.border}`,background:"#fff",color:C.muted,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>Edit</button>}
                      <button onClick={()=>alert(`Analytics for "${c.name}"`)} style={{ padding:"3px 9px",borderRadius:6,border:`1px solid ${C.border}`,background:"#fff",color:C.blue,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit" }}>View →</button>
                    </div>
                  </td>
                </tr>);
              })}
            </tbody>
          </table>
        </div>
      </>}

      {/* ── SUBSCRIBER LISTS ── */}
      {mainTab==="lists"&&canNewsletter&&<div>
        <div style={{ display:"flex",justifyContent:"space-between",marginBottom:12 }}>
          <div style={{ fontSize:12,color:C.muted }}>{role==="gp"?"Your personal list — auto-populated from opted-in contacts.":"Listmonk-synced lists. Auto-sync every 15 min."}</div>
          <button onClick={()=>alert("Syncing with Listmonk…")} style={{ padding:"7px 12px",borderRadius:8,border:`1px solid ${C.border}`,background:"#fff",color:C.slate,fontSize:12,fontWeight:600,cursor:"pointer" }}>🔄 Sync Now</button>
        </div>
        <div style={{ background:"#fff",border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden" }}>
          <table style={{ width:"100%",borderCollapse:"collapse",fontSize:12 }}>
            <thead><tr style={{ background:"#FAFAFA",borderBottom:`2px solid ${C.border}` }}>
              {["List","Language","Total","Active","Pending","Unsubscribed","Owner",""].map(h=><th key={h} style={{ padding:"9px 12px",textAlign:"left",fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.04em" }}>{h}</th>)}
            </tr></thead>
            <tbody>{myLists.map((l,i)=>(
              <tr key={l.id} style={{ borderBottom:`1px solid ${C.border}`,background:i%2?"#FAFAFA":"#fff" }}>
                <td style={{ padding:"10px 12px",fontWeight:700,color:C.text }}>{l.name}</td>
                <td style={{ padding:"10px 12px" }}><span style={{ fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:20,background:l.lang==="en"?"#EFF6FF":"#FFF7ED",color:l.lang==="en"?C.blue:C.amber }}>{l.lang==="en"?"🇬🇧 EN":"🇩🇪 DE"}</span></td>
                <td style={{ padding:"10px 12px",fontFamily:"monospace",fontWeight:700,color:C.text }}>{l.count.toLocaleString()}</td>
                <td style={{ padding:"10px 12px",fontFamily:"monospace",color:C.green,fontWeight:700 }}>{l.active}</td>
                <td style={{ padding:"10px 12px",fontFamily:"monospace",color:C.amber }}>{l.pending}</td>
                <td style={{ padding:"10px 12px",fontFamily:"monospace",color:C.red }}>{l.unsub}</td>
                <td style={{ padding:"10px 12px",fontSize:11 }}>{l.gpOwner?<span style={{ color:C.green,fontWeight:600 }}>👤 {l.gpOwner.split(" ")[0]}</span>:<span style={{ color:C.navy,fontWeight:600 }}>🏢 Org</span>}</td>
                <td style={{ padding:"10px 12px" }}><button onClick={()=>alert(`"${l.name}" — open in Listmonk`)} style={{ padding:"4px 9px",borderRadius:6,border:`1px solid ${C.border}`,background:"#fff",color:C.muted,fontSize:11,cursor:"pointer",fontFamily:"inherit" }}>Manage →</button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div style={{ marginTop:10,padding:"9px 12px",borderRadius:9,background:C.indigo+"06",border:`1px solid ${C.indigo}25`,fontSize:11,color:C.slate,lineHeight:1.6 }}>
          <strong style={{ color:C.indigo }}>Listmonk sync:</strong> Contacts with <code>newsletter_consent = true</code> sync automatically. Unsubscribes reflect in CRM within 15 min via webhook.
        </div>
      </div>}

      {/* ── SUPPRESSION ── */}
      {mainTab==="suppression"&&canCampaigns&&<div>
        <div style={{ display:"flex",justifyContent:"space-between",marginBottom:12 }}>
          <div style={{ fontSize:12,color:C.muted }}>Addresses excluded from all campaigns and newsletters.</div>
          <button onClick={()=>alert("Exporting…")} style={{ padding:"7px 12px",borderRadius:8,border:`1px solid ${C.border}`,background:"#fff",color:C.slate,fontSize:12,fontWeight:600,cursor:"pointer" }}>⬇ Export</button>
        </div>
        <div style={{ background:"#fff",border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden" }}>
          <table style={{ width:"100%",borderCollapse:"collapse" }}>
            <thead><tr style={{ background:"#FAFAFA",borderBottom:`2px solid ${C.border}` }}>
              {["Email","Reason","Date Added",""].map(h=><th key={h} style={{ padding:"9px 12px",textAlign:"left",fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.04em" }}>{h}</th>)}
            </tr></thead>
            <tbody>{SUPPRESSION_LIST.map((s,i)=>{
              const rm={unsubscribed:{l:"Unsubscribed",c:C.muted},hard_bounce:{l:"Hard Bounce",c:C.red},complaint:{l:"Complaint",c:C.red},manual_block:{l:"Manual Block",c:C.amber}}[s.reason]||{l:s.reason,c:C.muted};
              return (<tr key={i} style={{ borderBottom:`1px solid ${C.border}`,background:i%2?"#FAFAFA":"#fff" }}>
                <td style={{ padding:"10px 12px",fontFamily:"monospace",fontSize:12,color:C.text }}>{s.email}</td>
                <td style={{ padding:"10px 12px" }}><span style={{ fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:8,background:rm.c+"18",color:rm.c }}>{rm.l}</span></td>
                <td style={{ padding:"10px 12px",fontSize:12,color:C.muted }}>{s.date}</td>
                <td style={{ padding:"10px 12px" }}>{role==="superadmin"&&<button style={{ padding:"3px 9px",borderRadius:6,border:`1px solid ${C.border}`,background:"#fff",color:C.muted,fontSize:11,cursor:"pointer",fontFamily:"inherit" }}>Remove</button>}</td>
              </tr>);
            })}</tbody>
          </table>
        </div>
      </div>}
    </div>
  );
};


