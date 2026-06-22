import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { CallAnalysisTab } from "./call-analysis-tab";
import { ActivityCard } from "../ui/activity-card";
import { Avatar } from "../ui/avatar";
import { ScoreBadge } from "../ui/score-badge";
import { StatusBadge } from "../ui/status-badge";
import { AI_CALL_SCRIPTS, AI_SCORES, GPS_BY_VD, LEAD_NOTES_STORE, LIFECYCLE_STORE, SCORE_TIER, STATUS_META, TIMELINE_EVENTS, TIMELINE_META, VDS, agentReply, buildLeadSystemPrompt, callClaudeAPI, classifyOutcome } from "../../lib/core";
import { C } from "../../theme";

export const LeadDrawer = ({ lead, onClose, openTab }) => {
  const [tab, setTab]           = useState(openTab || "Overview");
  const [comment, setComment]   = useState("");
  const [savedNotes, setSavedNotes] = useState(() => LEAD_NOTES_STORE[lead.id] || []);
  const [callNotes, setCallNotes]     = useState("");
  const [commsSent, setCommsSent]     = useState({ email:false, sms:false, docs:false });
  const [closingModal, setClosingModal] = useState(false);
  const [closingForm, setClosingForm]   = useState({ amount:"", product:"", date:new Date().toISOString().split("T")[0], notes:"" });
  const [classifying, setClassifying] = useState(false);
  const [classified, setClassified]   = useState(null);
  const [confirmed, setConfirmed]     = useState(false);
  const [copiedSection, setCopiedSection] = useState(null);
  const [agentInput, setAgentInput]     = useState("");
  const [agentThinking, setAgentThinking] = useState(false);
  const [agentMessages, setAgentMessages] = useState([{
    from:"agent",
    text:`Hi! Select an option below to get started with **${lead.name}**.`,
    chips:["📋 Show call script","📝 Log this call","📞 Analyse last call","💡 Explain AI score","✉️ Draft follow-up email","⏰ Best time to call"]
  }]);
  const agentBottomRef = useRef(null);
  useEffect(()=>{ agentBottomRef.current?.scrollIntoView({ behavior:"smooth" }); },[agentMessages, agentThinking]);
  // File management state (EF-01 to EF-04)
  const [files, setFiles] = useState([
    { id:"f1", name:"Beratungsmappe_Q1.pdf",  type:"pdf", size:"2.4 MB", dir:"email",    sentByUs:true,  time:"Today 09:12", sender:"Anna Klein", note:"" },
    { id:"f2", name:"Einkommensnachweise.pdf", type:"pdf", size:"1.1 MB", dir:"email",    sentByUs:false, time:"Today 10:31", sender:lead.name,    note:"" },
    { id:"f3", name:"Produktübersicht.pdf",    type:"pdf", size:"0.8 MB", dir:"email",    sentByUs:true,  time:"Yesterday",   sender:"Anna Klein", note:"" },
  ]);
  const [fileFilter, setFileFilter] = useState("all");

  const sendAgent = async (msg) => {
    if (!msg.trim() || agentThinking) return;
    setAgentMessages(prev=>[...prev,{ from:"user", text:msg }]);
    setAgentInput("");
    setAgentThinking(true);
    try {
      const text = await callClaudeAPI(buildLeadSystemPrompt(lead, "gp"), msg);
      setAgentMessages(prev=>[...prev,{ from:"agent", text }]);
    } catch(e) {
      const reply = agentReply(msg, lead, "gp");
      setAgentMessages(prev=>[...prev,{ from:"agent", ...reply }]);
    } finally {
      setAgentThinking(false);
    }
  };

  const renderAgentText = (text) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((p,i) =>
      p.startsWith("**") && p.endsWith("**")
        ? <strong key={i}>{p.slice(2,-2)}</strong>
        : p.split("\n").map((line,j,arr)=><span key={`${i}-${j}`}>{line}{j<arr.length-1&&<br/>}</span>)
    );
  };

  const iconFor = t => ({ call:"📞", attempt:"🔁", import:"📥", email:"✉️", assign:"👤" }[t]||"•");
  const script  = AI_CALL_SCRIPTS[lead.id] || AI_CALL_SCRIPTS["default"];
  const ai      = AI_SCORES[lead.id];
  const tier    = ai ? (SCORE_TIER[ai.tier]||SCORE_TIER.warm) : null;

  const handleClassify = () => {
    if (!callNotes.trim()) return;
    setClassifying(true);
    setClassified(null);
    setConfirmed(false);
    setTimeout(() => {
      setClassified(classifyOutcome(callNotes));
      setClassifying(false);
    }, 1400);
  };

  const copySection = (key, text) => {
    navigator.clipboard?.writeText(text).catch(()=>{});
    setCopiedSection(key);
    setTimeout(()=>setCopiedSection(null), 1800);
  };

  const ScriptSection = ({ sectionKey, label, icon, text }) => (
    <div style={{ marginBottom:14,borderRadius:10,border:`1px solid ${C.border}`,overflow:"hidden" }}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 14px",background:"#F8FAFC",borderBottom:`1px solid ${C.border}` }}>
        <span style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em" }}>{icon} {label}</span>
        <button onClick={()=>copySection(sectionKey,text)} style={{ padding:"3px 9px",borderRadius:5,border:`1px solid ${C.border}`,background:copiedSection===sectionKey?"#ECFDF5":"#fff",color:copiedSection===sectionKey?C.green:C.slate,fontSize:10,fontWeight:600,cursor:"pointer" }}>
          {copiedSection===sectionKey?"✓ Copied":"Copy"}
        </button>
      </div>
      <div style={{ padding:"12px 14px",fontSize:13,color:C.text,lineHeight:1.6,fontStyle:"italic",background:"#fff" }}>"{text}"</div>
    </div>
  );

  return (
    <>
      <div onClick={onClose} style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.3)",zIndex:300 }} />
      <div style={{ position:"fixed",top:0,right:0,bottom:0,width:480,background:"#fff",boxShadow:"-4px 0 32px rgba(0,0,0,0.15)",zIndex:400,display:"flex",flexDirection:"column",fontFamily:"inherit" }}>
        {/* Header */}
        <div style={{ padding:"20px 24px 0",borderBottom:`1px solid ${C.border}` }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12 }}>
            <div style={{ display:"flex",gap:12,alignItems:"center" }}>
              <Avatar name={lead.name} size={44} />
              <div>
                <div style={{ fontWeight:800,fontSize:16,color:C.text }}>{lead.name}</div>
                <div style={{ fontSize:12,color:C.slate }}>{lead.email} · {lead.phone}</div>
              </div>
            </div>
            <div style={{ display:"flex",alignItems:"center",gap:8 }}>
              {ai && ai.tier !== "closed" && <ScoreBadge leadId={lead.id} size="lg" showLabel />}
              <button onClick={()=>{
                const data = { lead_id:lead.id, name:lead.name, email:lead.email, phone:lead.phone, city:lead.city, zip:lead.zip, source:lead.source, campaign:lead.campaign, status:lead.status, consent:lead.consent, created:lead.created, assignedVD:lead.assignedVD, assignedGP:lead.assignedGP, attempts:lead.attempts, exported_at:new Date().toISOString(), gdpr_basis:"Article 15 – Right of Access" };
                const blob = new Blob([JSON.stringify(data, null, 2)], { type:"application/json" });
                const url  = URL.createObjectURL(blob);
                const a    = document.createElement("a"); a.href=url; a.download=`lead-${lead.id}-gdpr-export.json`; a.click(); URL.revokeObjectURL(url);
              }} title="GDPR Article 15 — Export lead data" style={{ padding:"4px 10px",borderRadius:6,border:`1px solid ${C.border}`,background:"#fff",color:C.muted,fontSize:10,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:4 }}>
                🔒 Export
              </button>
              <button onClick={onClose} style={{ background:"none",border:"none",fontSize:22,cursor:"pointer",color:C.muted }}>×</button>
            </div>
          </div>
          <div style={{ display:"flex",gap:6,marginBottom:12,flexWrap:"wrap" }}>
            <StatusBadge status={lead.status} />
            <span style={{ fontSize:11,background:"#F1F5F9",color:C.slate,padding:"3px 10px",borderRadius:20,fontWeight:600 }}>📍 {lead.city} · {lead.zip}</span>
            <span style={{ fontSize:11,background:"#F1F5F9",color:C.slate,padding:"3px 10px",borderRadius:20,fontWeight:600 }}>{lead.source}</span>
            <span style={{ fontSize:11,background:lead.consent?"#ECFDF5":"#FEF2F2",color:lead.consent?C.green:C.red,padding:"3px 10px",borderRadius:20,fontWeight:600 }}>🔒 {lead.consent?"GDPR ✓":"No Consent"}</span>
          </div>
          <div style={{ display:"flex",gap:0,marginBottom:-1,overflowX:"auto" }}>
            {["Overview","Timeline","🤖 AI","Assign","Schedule","📎 Files"].map(t=>{
              const isAI = t.startsWith("🤖");
              return (
                <button key={t} onClick={()=>setTab(t)} style={{ padding:"8px 10px",fontSize:11,fontWeight:tab===t?700:500,color:tab===t?(isAI?C.ai:C.navy):C.muted,background:"none",border:"none",borderBottom:tab===t?`2px solid ${isAI?C.ai:C.primary}`:"2px solid transparent",cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap",flexShrink:0 }}>{t}</button>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div style={{ flex:1,overflowY:"auto",padding:tab==="🤖 AI"?"0":24,display:"flex",flexDirection:"column" }}>

          {/* Overview */}
          {tab==="Overview" && (()=>{
            const s           = STATUS_META[lead.status]||Object.values(STATUS_META)[0]||{label:lead.status,color:C.slate,bg:"#F1F5F9"};
            const stuck       = lead.status==="attempted" && lead.attempts>=3;
            // Journey follows the configurable Lifecycle Stages (excludes the DNC/Excluded stage).
            const journeyStages = LIFECYCLE_STORE.filter(st=>!st.statuses.length||!st.statuses.every(x=>(x.flags||[]).includes("excludesOutreach")));
            const stagePalette  = [C.slate,C.blue,C.indigo,C.green,C.purple,C.amber];
            const stageOrder    = journeyStages.map(st=>st.id);
            const currentStageIdx = Math.max(0, journeyStages.findIndex(st=>st.statuses.some(x=>x.key===lead.status)));

            // Merged timeline: past stage checkpoints + notes interleaved by rough order
            const stageEvents = journeyStages
              .map((st,i)=>({ kind:"stage", key:st.id, label:st.nameEn, color:stagePalette[i%stagePalette.length], idx:i }))
              .filter(e => e.idx <= currentStageIdx);

            const noteEvents = savedNotes.map((n, i) => ({
              kind:"note", label:n.text, author:n.author, time:n.time,
              color:C.amber, idx: 1.5 + i * 0.1
            }));

            const merged = [...stageEvents, ...noteEvents].sort((a,b) => a.idx - b.idx);

            const stageLabelMap = Object.fromEntries(journeyStages.map(st=>[st.id, st.nameEn]));

            return (
            <div style={{ display:"flex",gap:14,minHeight:0 }}>

              {/* ── LEFT: cards ───────────────────────────────────────── */}
              <div style={{ flex:"0 0 57%",display:"flex",flexDirection:"column",gap:12 }}>

                {/* Next best action */}
                {lead.status!=="closed" && lead.status!=="no_interest" && (
                  <div style={{ padding:"11px 14px",borderRadius:10,background:`linear-gradient(135deg,${C.ai}10,${C.ai}06)`,border:`1.5px solid ${C.ai}30`,display:"flex",alignItems:"center",gap:10 }}>
                    <span style={{ fontSize:18,flexShrink:0 }}>
                      {lead.status==="appointment"?"📅":lead.status==="followup"?"📞":lead.status==="attempted"?"🔁":"📞"}
                    </span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:10,fontWeight:700,color:C.ai,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:1 }}>Next Best Action</div>
                      <div style={{ fontSize:12,fontWeight:700,color:C.text,lineHeight:1.4 }}>
                        {lead.status==="appointment"?"Prepare for advisory session — confirm appointment"
                         :lead.status==="followup"?"Follow-up call due — best window 14:00–16:00 today"
                         :lead.status==="attempted"?"Try again — 2nd attempt recommended within 24h"
                         :"Make first contact — no attempts yet"}
                      </div>
                    </div>
                    <button onClick={()=>setTab("🤖 AI")} style={{ padding:"5px 12px",borderRadius:7,border:"none",background:C.ai,color:"#fff",fontSize:10,fontWeight:700,cursor:"pointer",flexShrink:0 }}>Ask AI →</button>
                  </div>
                )}

                {/* 2×2 summary cards */}
                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>

                  {/* AI Score */}
                  {ai && ai.tier!=="closed" ? (
                    <div style={{ padding:"13px 14px",borderRadius:10,background:tier.color+"08",border:`1.5px solid ${tier.color}25` }}>
                      <div style={{ fontSize:9,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:5 }}>🤖 AI Score</div>
                      <div style={{ display:"flex",alignItems:"baseline",gap:4,marginBottom:6 }}>
                        <span style={{ fontSize:26,fontWeight:800,color:tier.color,lineHeight:1 }}>{ai.score}</span>
                        <span style={{ fontSize:11,color:C.muted }}>/100</span>
                        <span style={{ marginLeft:4,fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:20,background:tier.color+"18",color:tier.color }}>{tier.label}</span>
                      </div>
                      {ai.reasons.slice(0,2).map((r,i)=>(
                        <div key={i} style={{ fontSize:10,color:C.slate,display:"flex",gap:4,alignItems:"flex-start",marginBottom:2 }}>
                          <span style={{ color:tier.color,fontWeight:700,flexShrink:0 }}>+</span>{r}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ padding:"13px 14px",borderRadius:10,background:"#F8FAFC",border:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"center" }}>
                      <span style={{ fontSize:11,color:C.muted,fontStyle:"italic" }}>No AI score</span>
                    </div>
                  )}

                  {/* Current Stage */}
                  <div style={{ padding:"13px 14px",borderRadius:10,background:stuck?C.red+"06":s.color+"08",border:`1.5px solid ${stuck?C.red:s.color}25` }}>
                    <div style={{ fontSize:9,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:5 }}>Current Stage</div>
                    <div style={{ fontSize:15,fontWeight:800,color:s.color,marginBottom:4 }}>{s.label}</div>
                    <div style={{ fontSize:10,color:C.slate }}>{lead.attempts>0?`${lead.attempts} attempt${lead.attempts!==1?"s":""} made`:"No attempts yet"}</div>
                    {stuck && <div style={{ fontSize:10,fontWeight:700,color:C.red,marginTop:4 }}>⚠ Stuck — consider reassigning</div>}
                  </div>

                  {/* Contact Attempts */}
                  <div style={{ padding:"13px 14px",borderRadius:10,background:"#F8FAFC",border:`1px solid ${C.border}` }}>
                    <div style={{ fontSize:9,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:7 }}>Contact Attempts</div>
                    <div style={{ display:"flex",gap:4,marginBottom:7 }}>
                      {[1,2,3,4,5].map(n=>(
                        <div key={n} style={{ flex:1,height:24,borderRadius:5,background:n<=lead.attempts?(n===lead.attempts?C.amber:C.amber+"60"):"#E2E8F0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,color:n<=lead.attempts?"#fff":C.muted }}>
                          {n<=lead.attempts?"✓":n}
                        </div>
                      ))}
                    </div>
                    <div style={{ fontSize:10,color:C.slate,marginBottom:6 }}>
                      {lead.attempts===0?"No contact yet":lead.attempts>=5?"All 5 used":`${5-lead.attempts} remaining`}
                    </div>
                    <button onClick={()=>setTab("🤖 AI")} style={{ width:"100%",padding:"4px",borderRadius:5,border:`1px solid ${C.border}`,background:"#fff",color:C.slate,fontSize:9,fontWeight:600,cursor:"pointer" }}>
                      📝 Log call outcome
                    </button>
                  </div>

                  {/* Qualification */}
                  <div style={{ padding:"13px 14px",borderRadius:10,background:"#F8FAFC",border:`1px solid ${C.border}` }}>
                    <div style={{ fontSize:9,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:7 }}>Qualification</div>
                    {[
                      { label:"GDPR consent", ok:lead.consent,      icon:"🔒" },
                      { label:"Source",       ok:!!lead.source,     icon:"📣" },
                      { label:"Campaign",     ok:!!lead.campaign,   icon:"🎯" },
                      { label:"Assigned GP",  ok:!!lead.assignedGP, icon:"👤" },
                    ].map(q=>(
                      <div key={q.label} style={{ display:"flex",alignItems:"center",gap:6,marginBottom:4 }}>
                        <span style={{ fontSize:11,width:16,textAlign:"center",flexShrink:0 }}>{q.icon}</span>
                        <span style={{ fontSize:10,flex:1,color:C.slate }}>{q.label}</span>
                        <span style={{ fontSize:10,fontWeight:700,color:q.ok?C.green:C.red }}>{q.ok?"✓":"✗"}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Contact + Lead details */}
                <div style={{ padding:"13px 14px",borderRadius:10,border:`1px solid ${C.border}`,background:"#fff" }}>
                  <div style={{ fontSize:9,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:9 }}>Contact Details</div>
                  {[
                    ["📧", lead.email],
                    ["📞", lead.phone],
                    ["📍", `${lead.city} · ${lead.zip}`],
                    ["👤", lead.assignedGP||"Unassigned"],
                    ["📣", lead.source],
                  ].map(([icon,val])=>(
                    <div key={icon} style={{ display:"flex",gap:7,alignItems:"flex-start",marginBottom:5 }}>
                      <span style={{ fontSize:11,flexShrink:0,width:16,textAlign:"center" }}>{icon}</span>
                      <span style={{ fontSize:11,color:C.slate,wordBreak:"break-all",lineHeight:1.3 }}>{val}</span>
                    </div>
                  ))}
                  <div style={{ marginTop:8,paddingTop:8,borderTop:`1px solid ${C.border}` }}>
                    {[["Campaign",lead.campaign],["Lead ID",lead.id],["Assigned VD",lead.assignedVD||"—"],...(lead.amount?[["Closing Amount",lead.amount]]:[])].map(([k,v])=>(
                      <div key={k} style={{ display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:`1px solid ${C.border}`,fontSize:11 }}>
                        <span style={{ color:C.muted }}>{k}</span>
                        <span style={{ color:k==="Closing Amount"?C.green:C.text,fontWeight:k==="Closing Amount"?700:400 }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── RIGHT: merged status + notes journey ──────────────── */}
              <div style={{ flex:"0 0 41%",display:"flex",flexDirection:"column",gap:12 }}>
                <div style={{ padding:"14px 16px",borderRadius:10,border:`1px solid ${C.border}`,background:"#fff",flex:1,display:"flex",flexDirection:"column" }}>
                  <div style={{ fontSize:9,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:14 }}>Journey</div>

                  <div style={{ flex:1,overflowY:"auto",position:"relative",paddingBottom:4 }}>
                    {/* vertical spine */}
                    <div style={{ position:"absolute",left:10,top:0,bottom:0,width:2,background:"#E2E8F0",borderRadius:1,zIndex:0 }}/>

                    {merged.map((ev, i) => {
                      const isNote   = ev.kind==="note";
                      const isActive = !isNote && ev.key===lead.status;
                      const isLast   = i===merged.length-1;
                      return (
                        <div key={i} style={{ display:"flex",alignItems:"flex-start",gap:10,marginBottom:isLast?0:16,position:"relative",zIndex:1 }}>
                          <div style={{
                            width:22, height:22, borderRadius:"50%", flexShrink:0,
                            background: isNote?"#FFFBEB": isActive?ev.color:"#F0FDF4",
                            border:`2px solid ${isNote?"#FDE68A": isActive?ev.color:C.green}`,
                            display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,
                            boxShadow: isActive?`0 0 0 3px ${ev.color}20`:"none"
                          }}>
                            {isNote
                              ? "📝"
                              : isActive
                                ? <span style={{ width:6,height:6,borderRadius:"50%",background:"#fff",display:"inline-block" }}/>
                                : <span style={{ fontSize:9,color:C.green,fontWeight:800 }}>✓</span>
                            }
                          </div>
                          <div style={{ flex:1,minWidth:0,paddingTop:2 }}>
                            {isNote ? (
                              <>
                                <div style={{ fontSize:9,color:C.muted,marginBottom:4 }}>
                                  <strong style={{ color:"#92400E" }}>{ev.author}</strong> · {ev.time}
                                </div>
                                <div style={{ padding:"7px 10px",background:"#FFFBEB",border:"1px solid #FDE68A",borderRadius:7,fontSize:11,color:"#92400E",lineHeight:1.5 }}>
                                  {ev.label}
                                </div>
                              </>
                            ) : (
                              <>
                                <div style={{ fontSize:11,fontWeight:isActive?700:500,color:isActive?ev.color:C.green,lineHeight:1.2 }}>
                                  {ev.label}
                                  {isActive && <span style={{ marginLeft:6,fontSize:9,fontWeight:700,padding:"1px 6px",borderRadius:8,background:ev.color+"15",color:ev.color }}>current</span>}
                                </div>
                                {isActive && lead.attempts>0 && (
                                  <div style={{ fontSize:9,color:C.muted,marginTop:2 }}>{lead.attempts} attempt{lead.attempts!==1?"s":""}</div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* Future stages — greyed out */}
                    {stageOrder.slice(currentStageIdx+1).map((key,i)=>(
                      <div key={key} style={{ display:"flex",alignItems:"center",gap:10,marginTop:16,opacity:0.3,zIndex:1,position:"relative" }}>
                        <div style={{ width:22,height:22,borderRadius:"50%",background:"#F1F5F9",border:`2px solid #E2E8F0`,flexShrink:0 }}/>
                        <div style={{ fontSize:11,color:C.muted }}>{stageLabelMap[key]}</div>
                      </div>
                    ))}
                  </div>

                  {/* Note composer — docked at bottom of journey */}
                  <div style={{ marginTop:14,paddingTop:12,borderTop:`1px solid ${C.border}` }}>
                    <div style={{ display:"flex",gap:8,alignItems:"flex-end" }}>
                      <textarea
                        value={comment}
                        onChange={e=>setComment(e.target.value)}
                        onKeyDown={e=>{
                          if((e.ctrlKey||e.metaKey)&&e.key==="Enter"){
                            e.preventDefault();
                            if(!comment.trim()) return;
                            const note={ text:comment.trim(), author:"Anna Klein", time:new Date().toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"})+" · Today" };
                            const updated=[...savedNotes,note];
                            setSavedNotes(updated); LEAD_NOTES_STORE[lead.id]=updated; setComment("");
                          }
                        }}
                        placeholder="Add a note… (Ctrl+Enter to save)"
                        style={{ flex:1,minHeight:48,borderRadius:7,border:`1px solid ${C.border}`,padding:"7px 10px",fontSize:11,fontFamily:"inherit",color:C.slate,resize:"none",boxSizing:"border-box",lineHeight:1.5 }}
                      />
                      <button
                        onClick={()=>{
                          if(!comment.trim()) return;
                          const note={ text:comment.trim(), author:"Anna Klein", time:new Date().toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"})+" · Today" };
                          const updated=[...savedNotes,note];
                          setSavedNotes(updated); LEAD_NOTES_STORE[lead.id]=updated; setComment("");
                        }}
                        disabled={!comment.trim()}
                        style={{ padding:"7px 14px",borderRadius:6,border:"none",background:comment.trim()?C.primary:"#E2E8F0",color:comment.trim()?"#fff":C.muted,fontSize:11,fontWeight:600,cursor:comment.trim()?"pointer":"default",flexShrink:0,transition:"all 0.15s",alignSelf:"flex-end",height:34 }}>
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            );
          })()}


          {/* Timeline */}
          {tab==="Timeline" && (
            <div>
              {(() => {
                const SHORT = { call:"Call activity", attempt:"Contact attempt", assign:"Lead assigned", email:"Email sent", import:"Lead captured" };
                const noteItems = savedNotes.map((n,i)=>({ key:`note-${i}`, ...TIMELINE_META.note, title:"Note added", actor:n.author, time:n.time, detail:n.text }));
                const eventItems = TIMELINE_EVENTS.map((ev,i)=>{
                  const m = TIMELINE_META[ev.type] || TIMELINE_META.note;
                  return { key:`ev-${i}`, icon:m.icon, color:m.color, bg:m.bg, title:SHORT[ev.type]||ev.type,
                    actor:ev.actor, time:ev.time, detail:ev.action, status:"completed",
                    provider: ev.type==="email" ? "Gmail" : null };
                });
                return [...noteItems, ...eventItems].map((it,idx)=>(
                  <ActivityCard key={it.key} {...it} defaultOpen={idx===0} />
                ));
              })()}
            </div>
          )}

          {/* ── P0: AI CALL SCRIPT ── */}
          {/* Script, Call Analysis, Log Call — now all in the 🤖 AI tab */}

          {/* Assign */}
          {tab==="Assign" && (
            <div>
              <div style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:10 }}>Assign to Sales Director</div>
              <div style={{ display:"flex",flexDirection:"column",gap:8,marginBottom:20 }}>
                {VDS.map(vd=>(
                  <label key={vd} style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 14px",border:`1.5px solid ${lead.assignedVD===vd?C.blue:C.border}`,borderRadius:8,cursor:"pointer",background:lead.assignedVD===vd?"#EFF6FF":"#fff" }}>
                    <input type="radio" name="vd" defaultChecked={lead.assignedVD===vd} style={{ accentColor:C.blue }} />
                    <Avatar name={vd} size={28} /><span style={{ fontSize:13,fontWeight:600 }}>{vd}</span>
                    <span style={{ marginLeft:"auto",fontSize:11,color:C.muted }}>{GPS_BY_VD[vd]?.length} GPs</span>
                  </label>
                ))}
              </div>
              <div style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:6 }}>Assign to Consultant</div>
              <div style={{ fontSize:11,color:C.slate,marginBottom:10,padding:"8px 12px",background:C.indigo+"10",borderRadius:7,border:`1px solid ${C.indigo}20` }}>💡 Sales Directors can work leads directly — select the VD themselves.</div>
              <div style={{ display:"flex",flexDirection:"column",gap:8,marginBottom:20 }}>
                {(GPS_BY_VD[lead.assignedVD||VDS[0]]||[]).map(gp=>(
                  <label key={gp} style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 14px",border:`1.5px solid ${lead.assignedGP===gp?C.green:C.border}`,borderRadius:8,cursor:"pointer",background:lead.assignedGP===gp?"#ECFDF5":"#fff" }}>
                    <input type="radio" name="gp" defaultChecked={lead.assignedGP===gp} style={{ accentColor:C.green }} />
                    <Avatar name={gp} size={28} /><span style={{ fontSize:13,fontWeight:600 }}>{gp}</span>
                    {gp===lead.assignedVD&&<span style={{ fontSize:10,background:C.indigo+"15",color:C.indigo,padding:"1px 7px",borderRadius:8,fontWeight:700,marginLeft:4 }}>VD · Self</span>}
                  </label>
                ))}
              </div>
              <div style={{ padding:"12px 14px",borderRadius:8,background:"#FFFBEB",border:"1px solid #FDE68A",fontSize:12,color:"#92400E",marginBottom:14 }}>⚡ <strong>Auto-assign by ZIP:</strong> ZIP <strong>{lead.zip}</strong> → <strong>Thomas Müller</strong></div>
              <button onClick={()=>alert("Assignment confirmed — lead reassigned successfully")} style={{ width:"100%",padding:10,borderRadius:8,border:"none",background:C.primary,color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer" }}>Confirm Assignment</button>
            </div>
          )}

          {/* Schedule */}
          {tab==="Schedule" && (
            <div>
              <div style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:12 }}>Schedule Follow-up Call</div>
              {[["Date","date"],["Time","time"]].map(([label,type])=>(
                <div key={label} style={{ marginBottom:12 }}>
                  <label style={{ fontSize:12,color:C.slate,display:"block",marginBottom:4 }}>{label}</label>
                  <input type={type} style={{ width:"100%",border:`1px solid ${C.border}`,borderRadius:7,padding:"8px 12px",fontSize:13,fontFamily:"inherit",boxSizing:"border-box" }} />
                </div>
              ))}
              <div style={{ marginBottom:14 }}>
                <label style={{ fontSize:12,color:C.slate,display:"block",marginBottom:4 }}>Type</label>
                <select style={{ width:"100%",border:`1px solid ${C.border}`,borderRadius:7,padding:"8px 12px",fontSize:13,fontFamily:"inherit",boxSizing:"border-box" }}>
                  <option>📞 Phone Call</option><option>📹 Video Call</option><option>👥 In-Person</option>
                </select>
              </div>
              <button style={{ width:"100%",padding:10,borderRadius:8,border:"none",background:C.indigo,color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer" }}>Schedule & Notify</button>
            </div>
          )}

          {/* ── FILES TAB (EF-01 to EF-04) ── */}
          {tab==="📎 Files" && (
            <div>
              <div style={{ fontSize:13,fontWeight:800,color:C.navy,marginBottom:2 }}>📎 Documents</div>
              <div style={{ fontSize:11,color:C.muted,marginBottom:12 }}>Files for this lead. Use the lead detail page for full document management.</div>
              <div style={{ display:"flex",gap:6,marginBottom:12 }}>
                {[["all","All"],["email","Email"],["uploaded","Uploaded"]].map(([k,l])=>(
                  <button key={k} onClick={()=>setFileFilter(k)}
                    style={{ padding:"4px 11px",borderRadius:20,border:`1px solid ${fileFilter===k?C.primary:C.border}`,background:fileFilter===k?C.primary:"#fff",color:fileFilter===k?"#fff":C.slate,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>{l}</button>
                ))}
                <label style={{ marginLeft:"auto",padding:"5px 11px",borderRadius:7,border:"none",background:C.green,color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:4 }}>
                  <input type="file" style={{ display:"none" }} onChange={e=>{
                    const f=e.target.files[0];
                    if(f) setFiles(prev=>[...prev,{id:`f${Date.now()}`,name:f.name,type:"pdf",size:`${(f.size/1024).toFixed(0)} KB`,dir:"uploaded",time:"Just now",sender:"Anna Klein",note:"",sentByUs:false}]);
                    e.target.value="";
                  }}/>
                  ⬆ Upload
                </label>
              </div>
              <div style={{ display:"flex",flexDirection:"column",gap:7 }}>
                {(fileFilter==="all"?files:files.filter(f=>f.dir===fileFilter)).map(f=>{
                  const isUploaded=f.dir==="uploaded";
                  const isSent=f.dir==="email"&&f.sentByUs;
                  const tagColor=isUploaded?C.green:isSent?C.blue:C.amber;
                  const tagLabel=isUploaded?"Uploaded":isSent?"Sent":"Received";
                  return (
                    <div key={f.id} style={{ display:"flex",alignItems:"center",gap:9,padding:"9px 12px",borderRadius:9,background:"#F8FAFC",border:`1px solid ${C.border}` }}>
                      <span style={{ fontSize:18,flexShrink:0 }}>{isUploaded?"📤":"📄"}</span>
                      <div style={{ flex:1,minWidth:0 }}>
                        <div style={{ fontSize:11,fontWeight:700,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{f.name}</div>
                        <div style={{ fontSize:10,color:C.muted,marginTop:1 }}>{f.time} · {f.size||""}</div>
                      </div>
                      <span style={{ fontSize:9,fontWeight:800,padding:"2px 7px",borderRadius:8,color:tagColor,background:tagColor+"15",textTransform:"uppercase",flexShrink:0 }}>{tagLabel}</span>
                      <button onClick={()=>setFiles(prev=>prev.filter(x=>x.id!==f.id))} style={{ background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:14,flexShrink:0 }}>×</button>
                    </div>
                  );
                })}
                {(fileFilter==="all"?files:files.filter(f=>f.dir===fileFilter)).length===0&&(
                  <div style={{ padding:"20px",textAlign:"center",color:C.muted,fontSize:11,fontStyle:"italic",background:"#FAFAFA",borderRadius:9,border:`1px dashed ${C.border}` }}>No files yet.</div>
                )}
              </div>
            </div>
          )}

          {/* ── UNIFIED AI TAB ── script + log + analysis + free chat in one place */}
          {tab==="🤖 AI" && (
            <div style={{ display:"flex",flexDirection:"column",height:"100%",padding:"18px 20px 16px",marginTop:-24,marginLeft:-24,marginRight:-24,width:"calc(100% + 48px)" }}>
              {/* Lead context bar */}
              <div style={{ padding:"10px 14px",borderRadius:10,background:`linear-gradient(135deg,#4C1D95,${C.ai})`,marginBottom:14,display:"flex",alignItems:"center",gap:10,flexShrink:0 }}>
                <span style={{ fontSize:18 }}>🤖</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:11,fontWeight:800,color:"#fff" }}>AI — {lead.name}</div>
                  <div style={{ fontSize:10,color:"rgba(255,255,255,0.7)" }}>{lead.campaign} · {lead.source} · Score {ai?.score ?? "…"}/100</div>
                </div>
                {ai && <span style={{ fontSize:10,padding:"2px 10px",borderRadius:20,background:"rgba(255,255,255,0.2)",color:"#fff",fontWeight:700 }}>{SCORE_TIER[ai.tier]?.label}</span>}
              </div>

              {/* Messages */}
              <div style={{ flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:10,marginBottom:12,minHeight:0 }}>
                {agentMessages.map((m,i)=>{

                  /* ── Special: inline Call Script card ── */
                  if(m.type==="script") return (
                    <div key={i} style={{ alignSelf:"flex-start",width:"100%" }}>
                      <div style={{ fontSize:10,color:C.muted,marginBottom:4 }}>🤖 AI</div>
                      <div style={{ background:"#F8FAFC",borderRadius:12,border:`1px solid ${C.border}`,padding:"14px",overflow:"hidden" }}>
                        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12 }}>
                          <div style={{ fontSize:12,fontWeight:800,color:C.ai }}>📋 AI Call Script</div>
                          <span style={{ fontSize:10,padding:"2px 8px",borderRadius:10,background:C.ai+"12",color:C.ai,fontWeight:700 }}>AI Generated</span>
                        </div>
                        <ScriptSection sectionKey="greeting" label="Opening" icon="👋" text={script.greeting} />
                        <ScriptSection sectionKey="pitch"    label="Pitch"   icon="💼" text={script.pitch}    />
                        <ScriptSection sectionKey="hook"     label="Value Hook" icon="⚡" text={script.hook}  />
                        <div style={{ marginBottom:14,borderRadius:10,border:`1px solid ${C.border}`,overflow:"hidden" }}>
                          <div style={{ padding:"9px 14px",background:"#F8FAFC",borderBottom:`1px solid ${C.border}` }}>
                            <span style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em" }}>🛡️ Objection Handling</span>
                          </div>
                          <div style={{ border:`1px solid ${C.border}`,borderTop:"none",borderRadius:"0 0 10px 10px",overflow:"hidden" }}>
                            {script.objections.map((obj,j)=>(
                              <div key={j} style={{ padding:"11px 14px",borderBottom:j<script.objections.length-1?`1px solid ${C.border}`:"none",background:"#fff" }}>
                                <div style={{ fontSize:12,fontWeight:700,color:C.red,marginBottom:4 }}>"{obj.q}"</div>
                                <div style={{ fontSize:12,color:C.slate,fontStyle:"italic",lineHeight:1.5 }}>→ "{obj.a}"</div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <ScriptSection sectionKey="close" label="Close / Next Step" icon="🎯" text={script.close} />
                        <div style={{ padding:"10px 12px",borderRadius:8,background:C.ai+"08",border:`1px solid ${C.ai}20`,fontSize:11,color:C.slate }}>
                          💡 Tailored for <strong>{lead.source}</strong> · <strong>{lead.campaign}</strong> · {lead.attempts} prior attempt{lead.attempts!==1?"s":""}
                        </div>
                      </div>
                    </div>
                  );

                  /* ── Special: inline Log Call form ── */
                  if(m.type==="log") return (
                    <div key={i} style={{ alignSelf:"flex-start",width:"100%" }}>
                      <div style={{ fontSize:10,color:C.muted,marginBottom:4 }}>🤖 AI</div>
                      <div style={{ background:"#F8FAFC",borderRadius:12,border:`1px solid ${C.border}`,padding:"14px" }}>
                        <div style={{ fontSize:12,fontWeight:800,color:C.ai,marginBottom:4 }}>📝 Log this call</div>
                        <div style={{ fontSize:11,color:C.muted,marginBottom:12 }}>Write what happened — I'll classify the outcome and suggest next steps.</div>
                        <textarea
                          value={callNotes}
                          onChange={e=>{setCallNotes(e.target.value);setClassified(null);setConfirmed(false);}}
                          placeholder={"e.g. \"Reached Mr. Hoffmann — interested, wants callback next week\"\n\"Voicemail, no answer\"\n\"Appointment set for Monday 10am\""}
                          style={{ width:"100%",minHeight:90,borderRadius:8,border:`1.5px solid ${classified?C.ai:C.border}`,padding:"9px 11px",fontSize:12,fontFamily:"inherit",color:C.text,resize:"vertical",boxSizing:"border-box",lineHeight:1.6 }}
                        />
                        {/* Comms checklist */}
                        <div style={{ marginTop:10,marginBottom:12,padding:"10px 12px",borderRadius:9,background:"#fff",border:`1px solid ${C.border}` }}>
                          <div style={{ fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:8 }}>Communications sent</div>
                          {[{key:"email",icon:"✉️",label:"Email template sent"},{key:"sms",icon:"💬",label:"SMS / WhatsApp sent"},{key:"docs",icon:"📎",label:"Documents sent to lead"}].map(({key,icon,label})=>(
                            <label key={key} style={{ display:"flex",alignItems:"center",gap:9,marginBottom:6,cursor:"pointer" }}>
                              <input type="checkbox" checked={commsSent[key]} onChange={e=>setCommsSent(p=>({...p,[key]:e.target.checked}))} style={{ accentColor:C.indigo,width:14,height:14 }}/>
                              <span style={{ fontSize:11,color:commsSent[key]?C.text:C.slate }}>{icon} {label}</span>
                              {commsSent[key] && <span style={{ marginLeft:"auto",fontSize:10,color:C.green,fontWeight:700 }}>✓</span>}
                            </label>
                          ))}
                        </div>
                        <button onClick={handleClassify} disabled={!callNotes.trim()||classifying}
                          style={{ width:"100%",padding:"9px",borderRadius:8,border:"none",background:callNotes.trim()&&!classifying?C.ai:"#E2E8F0",color:callNotes.trim()&&!classifying?"#fff":C.muted,fontSize:12,fontWeight:700,cursor:callNotes.trim()&&!classifying?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",gap:8 }}>
                          {classifying?<><span style={{ display:"inline-block",width:13,height:13,border:"2px solid #fff6",borderTop:"2px solid #fff",borderRadius:"50%",animation:"spin 0.7s linear infinite" }}/>Analysing…</>:"🤖 Classify Outcome"}
                        </button>
                        {classified && !confirmed && (
                          <div style={{ marginTop:12,borderRadius:10,border:`1.5px solid ${C.ai}40`,overflow:"hidden" }}>
                            <div style={{ padding:"9px 13px",background:`${C.ai}0D`,borderBottom:`1px solid ${C.ai}20`,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                              <span style={{ fontSize:11,fontWeight:700,color:C.ai }}>🤖 Classification Result</span>
                              <span style={{ fontSize:10,padding:"2px 8px",borderRadius:10,background:C.ai+"15",color:C.ai,fontWeight:700 }}>{classified.confidence}% confidence</span>
                            </div>
                            <div style={{ padding:"12px",background:"#fff" }}>
                              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginBottom:10 }}>
                                <div style={{ padding:"9px 11px",borderRadius:8,background:classified.color+"0D",border:`1px solid ${classified.color}25` }}>
                                  <div style={{ fontSize:10,color:C.muted,fontWeight:700,textTransform:"uppercase",marginBottom:4 }}>Status</div>
                                  <StatusBadge status={classified.status} />
                                </div>
                                {classified.followup && (
                                  <div style={{ padding:"9px 11px",borderRadius:8,background:C.indigo+"0D",border:`1px solid ${C.indigo}25` }}>
                                    <div style={{ fontSize:10,color:C.muted,fontWeight:700,textTransform:"uppercase",marginBottom:4 }}>Follow-up</div>
                                    <span style={{ fontSize:12,fontWeight:700,color:C.indigo }}>{classified.followup}</span>
                                  </div>
                                )}
                              </div>
                              <div style={{ padding:"9px 11px",borderRadius:8,background:"#F8FAFC",border:`1px solid ${C.border}`,marginBottom:10 }}>
                                <div style={{ fontSize:10,color:C.muted,fontWeight:700,textTransform:"uppercase",marginBottom:3 }}>Next Action</div>
                                <div style={{ fontSize:12,color:C.text,fontWeight:600 }}>{classified.nextAction}</div>
                              </div>
                              <div style={{ fontSize:11,color:C.muted,fontStyle:"italic",marginBottom:10,lineHeight:1.5 }}>💭 {classified.reasoning}</div>
                              {classified.suggestAppointment && (
                                <button onClick={()=>setTab("Schedule")} style={{ width:"100%",padding:"8px",borderRadius:7,border:"none",background:C.ai,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",marginBottom:8 }}>📅 Set Appointment</button>
                              )}
                              <div style={{ display:"flex",gap:8 }}>
                                <button onClick={()=>setConfirmed(true)} style={{ flex:1,padding:"8px",borderRadius:7,border:"none",background:C.green,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer" }}>✓ Confirm & Save</button>
                                <button onClick={()=>setClassified(null)} style={{ padding:"8px 13px",borderRadius:7,border:`1px solid ${C.border}`,background:"#fff",color:C.slate,fontSize:12,fontWeight:600,cursor:"pointer" }}>Edit</button>
                              </div>
                            </div>
                          </div>
                        )}
                        {confirmed && (
                          <div style={{ marginTop:12,padding:"14px",borderRadius:10,background:C.green+"0D",border:`1.5px solid ${C.green}40`,textAlign:"center" }}>
                            <div style={{ fontSize:22,marginBottom:4 }}>✅</div>
                            <div style={{ fontSize:12,fontWeight:700,color:C.green }}>Saved to Timeline</div>
                            <div style={{ fontSize:11,color:C.slate,marginTop:3 }}>Status → <strong>{classified?.label}</strong></div>
                          </div>
                        )}
                        {!classified && !classifying && (
                          <div style={{ marginTop:12 }}>
                            <div style={{ fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:7 }}>Or set manually</div>
                            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:7 }}>
                              {[["✅ Reached – Interested","followup"],["🔴 Reached – No Interest","no_interest"],["📵 Not Reached","attempted"],["📅 Appointment Set","appointment"]].map(([lbl,st])=>(
                                <button key={lbl} onClick={()=>setClassified({status:st,label:STATUS_META[st]?.label||lbl,color:STATUS_META[st]?.color||C.slate,nextAction:"Update manually",followup:"",confidence:100,reasoning:"Manual."})} style={{ padding:"9px 7px",borderRadius:7,border:`1.5px solid ${C.border}`,background:"#FAFAFA",fontSize:11,fontWeight:600,color:C.slate,cursor:"pointer",textAlign:"center" }}>{lbl}</button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );

                  /* ── Special: inline Call Analysis ── */
                  if(m.type==="analysis") return (
                    <div key={i} style={{ alignSelf:"flex-start",width:"100%" }}>
                      <div style={{ fontSize:10,color:C.muted,marginBottom:4 }}>🤖 AI</div>
                      <div style={{ background:"#F8FAFC",borderRadius:12,border:`1px solid ${C.border}`,padding:"14px",overflow:"hidden" }}>
                        <CallAnalysisTab lead={lead} script={script} />
                      </div>
                    </div>
                  );

                  /* ── Default: text bubble ── */
                  return (
                    <div key={i} style={{ display:"flex",flexDirection:"column",alignItems:m.from==="user"?"flex-end":"flex-start",gap:5 }}>
                      <div style={{ maxWidth:"90%",padding:"10px 13px",borderRadius:m.from==="user"?"13px 13px 3px 13px":"13px 13px 13px 3px",background:m.from==="user"?C.ai:"#F1F5F9",color:m.from==="user"?"#fff":C.text,fontSize:12,lineHeight:1.65 }}>
                        {renderAgentText(m.text)}
                      </div>
                      {m.chips && (
                        <div style={{ display:"flex",flexWrap:"wrap",gap:5,maxWidth:"96%" }}>
                          {m.chips.map(c=>{
                            const isSpecial = ["📋 Show call script","📝 Log this call","📞 Analyse last call"].includes(c);
                            return (
                              <button key={c} onClick={()=>{
                                if(c==="📋 Show call script") {
                                  setAgentMessages(prev=>[...prev,{from:"user",text:"Show call script"},{type:"script",from:"agent",text:""}]);
                                } else if(c==="📝 Log this call") {
                                  setCallNotes(""); setClassified(null); setConfirmed(false);
                                  setAgentMessages(prev=>[...prev,{from:"user",text:"Log this call"},{type:"log",from:"agent",text:""}]);
                                } else if(c==="📞 Analyse last call") {
                                  setAgentMessages(prev=>[...prev,{from:"user",text:"Analyse last call"},{type:"analysis",from:"agent",text:""}]);
                                } else {
                                  sendAgent(c);
                                }
                              }} style={{ padding:"3px 9px",borderRadius:20,border:`1px solid ${isSpecial?C.primary:C.ai}35`,background:isSpecial?C.primary+"0A":C.ai+"0A",color:isSpecial?C.navy:C.ai,fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"inherit" }}>{c}</button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
                {agentThinking && (
                  <div style={{ display:"flex",alignItems:"flex-start" }}>
                    <div style={{ padding:"10px 16px",borderRadius:"13px 13px 13px 3px",background:"#F1F5F9",display:"flex",gap:5,alignItems:"center" }}>
                      {[0,1,2].map(i=>(<div key={i} style={{ width:7,height:7,borderRadius:"50%",background:C.ai,opacity:0.7,animation:`bounce 1.2s ${i*0.2}s infinite` }}/>))}
                    </div>
                  </div>
                )}
                <style>{`@keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-6px)}} @keyframes spin{to{transform:rotate(360deg)}}`}</style>
                <div ref={agentBottomRef}/>
              </div>

              {/* Input — freeform is secondary; chips are the primary path */}
              <div style={{ display:"flex",gap:8,alignItems:"center",paddingTop:10,borderTop:`1px solid ${C.border}`,flexShrink:0 }}>
                <input
                  value={agentInput}
                  onChange={e=>setAgentInput(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&sendAgent(agentInput)}
                  placeholder="Or type a work-related question…"
                  style={{ flex:1,border:`1.5px solid ${C.border}`,borderRadius:9,padding:"8px 12px",fontSize:12,fontFamily:"inherit",color:C.text,outline:"none",background:"#F8FAFC" }}
                />
                <button onClick={()=>sendAgent(agentInput)} disabled={!agentInput.trim()||agentThinking}
                  style={{ width:36,height:36,borderRadius:9,border:"none",background:agentInput.trim()&&!agentThinking?C.ai:"#E2E8F0",color:"#fff",fontSize:16,cursor:agentInput.trim()&&!agentThinking?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"background 0.2s" }}>↑</button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── Closing Details Modal (AP-07) ── */}
      {closingModal && (
        <>
          <div onClick={()=>setClosingModal(false)} style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:600 }}/>
          <div style={{ position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:420,background:"#fff",borderRadius:16,zIndex:700,boxShadow:"0 20px 60px rgba(0,0,0,0.25)",fontFamily:"inherit",overflow:"hidden" }}>
            <div style={{ padding:"18px 22px",background:`linear-gradient(135deg,${C.green},#059669)`,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
              <div>
                <div style={{ fontSize:11,fontWeight:700,color:"rgba(255,255,255,0.7)",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:2 }}>Closing Details</div>
                <div style={{ fontSize:17,fontWeight:800,color:"#fff" }}>🎉 Log Closed Deal — {lead.name}</div>
              </div>
              <button onClick={()=>setClosingModal(false)} style={{ background:"rgba(255,255,255,0.2)",border:"none",color:"#fff",fontSize:18,cursor:"pointer",borderRadius:8,width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center" }}>×</button>
            </div>
            <div style={{ padding:"20px 22px" }}>
              {[
                { label:"Closing Amount (€) *", key:"amount",  type:"number", placeholder:"e.g. 2000"                },
                { label:"Product / Strategy",   key:"product", type:"text",   placeholder:"e.g. Q1 Finanz portfolio" },
                { label:"Closing Date *",        key:"date",    type:"date",   placeholder:""                         },
              ].map(f=>(
                <div key={f.key} style={{ marginBottom:14 }}>
                  <label style={{ display:"block",fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:5 }}>{f.label}</label>
                  <input type={f.type} value={closingForm[f.key]} placeholder={f.placeholder}
                    onChange={e=>setClosingForm(p=>({...p,[f.key]:e.target.value}))}
                    style={{ width:"100%",border:`1px solid ${C.border}`,borderRadius:7,padding:"9px 11px",fontSize:13,fontFamily:"inherit",color:C.text,boxSizing:"border-box" }}/>
                </div>
              ))}
              <div>
                <label style={{ display:"block",fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:5 }}>Internal Notes</label>
                <textarea value={closingForm.notes} onChange={e=>setClosingForm(p=>({...p,notes:e.target.value}))}
                  placeholder="Any notes about the close…"
                  style={{ width:"100%",minHeight:60,border:`1px solid ${C.border}`,borderRadius:7,padding:"9px 11px",fontSize:12,fontFamily:"inherit",color:C.text,resize:"vertical",boxSizing:"border-box" }}/>
              </div>
            </div>
            <div style={{ padding:"14px 22px",borderTop:`1px solid ${C.border}`,display:"flex",gap:8,justifyContent:"flex-end",background:"#FAFAFA" }}>
              <button onClick={()=>setClosingModal(false)} style={{ padding:"8px 16px",borderRadius:7,border:`1px solid ${C.border}`,background:"#fff",color:C.slate,fontSize:12,fontWeight:600,cursor:"pointer" }}>Cancel</button>
              <button onClick={()=>{ setClosingModal(false); setConfirmed(true); }}
                disabled={!closingForm.amount||!closingForm.date}
                style={{ padding:"8px 18px",borderRadius:7,border:"none",background:closingForm.amount&&closingForm.date?C.green:"#E2E8F0",color:closingForm.amount&&closingForm.date?"#fff":C.muted,fontSize:12,fontWeight:700,cursor:"pointer" }}>
                ✓ Save & Close Deal
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
};
// ─── Call Transcripts (mock — would come from VoIP integration) ──────────────
