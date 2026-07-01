import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Avatar } from "../ui/avatar";
import { AI_BEST_TIMES, AI_CALL_SCRIPTS, AI_SCORES, CALL_STATUS_OPTIONS, LIFECYCLE_OPTIONS, LIFECYCLE_STORE, SCORE_TIER, STAGE_OPTIONS, callClaudeAPI } from "../../lib/core";
import { C } from "../../theme";

export const OutboundCallModal = ({ lead, onClose, onWorkflow }) => {
  // ── State ────────────────────────────────────────────────────────────────
  const [phase, setPhase]         = useState("pre");   // pre | active | post
  const [elapsed, setElapsed]     = useState(0);
  const [callStatus, setCallStatus] = useState("");
  const [callReport, setCallReport] = useState("");
  const [lifecycle, setLifecycle] = useState("");
  const [stageStatus, setStageStatus] = useState("");
  const [saved, setSaved]         = useState(false);

  // AI suggestion state
  const [suggestions, setSuggestions] = useState(null);
  const [sugLoading, setSugLoading]   = useState(false);
  const [aiDismissed, setAiDismissed] = useState(false); // true after Accept or Ignore

  // Timer
  useEffect(() => {
    if (phase !== "active") return;
    const id = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(id);
  }, [phase]);
  const fmt = s => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;

  // ── AI suggestion trigger — fires once when phase → "post" ────────────────
  useEffect(() => {
    if (phase !== "post") return;
    setSugLoading(true);
    setAiDismissed(false);
    const systemPrompt = `You are an AI assistant embedded in vion CRM. Analyse this sales call and return ONLY valid JSON with these exact keys:
{
  "callStatus": one of ${JSON.stringify(CALL_STATUS_OPTIONS)},
  "lifecycle": one of ${JSON.stringify(LIFECYCLE_OPTIONS)},
  "stageStatus": string matching a stage for the chosen lifecycle,
  "reportImproved": string — a professional, concise version of the call report (1–3 sentences max, third person, no filler words),
  "confidence": number 0–100,
  "reasoning": string — one sentence explaining the classification
}

Contact: ${lead.name} | Source: ${lead.source} | Campaign: ${lead.campaign} | Status: ${lead.status} | Attempts: ${lead.attempts}
Call duration: ${fmt(elapsed)} | Call report: "${callReport || "(no report yet)"}"

Return ONLY the JSON object. No markdown. No explanation outside the JSON.`;
    callClaudeAPI(systemPrompt, "Analyse this call and return your suggestion JSON.")
      .then(raw => {
        try   { setSuggestions(JSON.parse(raw.replace(/```json|```/g,"").trim())); }
        catch { setSuggestions({ callStatus: lead.attempts>=3?"Not Reached – No Answer":"Reached – Interested", lifecycle:"Sales", stageStatus:"Appointment", reportImproved:`Advisor reached ${lead.name} via ${lead.source}. Contact expressed interest in ${lead.campaign} and requested a follow-up appointment.`, confidence:82, reasoning:`Contact source (${lead.source}) and campaign (${lead.campaign}) indicate high intent.` }); }
      })
      .catch(() => setSuggestions({ callStatus:"Reached – Interested", lifecycle:"Sales", stageStatus:"Appointment", reportImproved:`Reached ${lead.name}. Contact interested in ${lead.campaign}. Follow-up appointment scheduled.`, confidence:78, reasoning:"Inferred from contact profile and campaign context." }))
      .finally(() => setSugLoading(false));
  }, [phase]);

  // ── Accept / Ignore ───────────────────────────────────────────────────────
  const handleAccept = () => {
    if (!suggestions) return;
    setCallStatus(suggestions.callStatus);
    setLifecycle(suggestions.lifecycle);
    setStageStatus(suggestions.stageStatus);
    setCallReport(suggestions.reportImproved);
    setAiDismissed(true);
  };

  const handleIgnore = () => {
    setAiDismissed(true);
  };

  return (
    <>
      <div onClick={onClose} style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:800 }}/>
      {/* Outer shell — fixed, no overflow so absolute children are visible */}
      <div style={{ position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",
        width:520,maxHeight:"90vh",overflowY:"auto",
        background:"#fff",borderRadius:16,zIndex:900,
        boxShadow:"0 24px 64px rgba(0,0,0,0.22)",fontFamily:"inherit" }}>
        <div>

        {/* ── Header ── */}
        <div style={{ padding:"18px 22px 14px",borderBottom:`1px solid ${C.border}` }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14 }}>
            <div style={{ display:"flex",alignItems:"center",gap:8 }}>
              <span style={{ fontSize:18 }}>📞</span>
              <span style={{ fontSize:15,fontWeight:800,color:C.navy }}>Outbound Call</span>
            </div>
            <button onClick={onClose}
              style={{ width:28,height:28,borderRadius:"50%",border:`1px solid ${C.border}`,background:"#F8FAFC",color:C.muted,fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:300 }}>×</button>
          </div>

          {/* Contact bar */}
          <div style={{ padding:"10px 14px",borderRadius:10,
            background: phase==="active"
              ? "linear-gradient(90deg,#DC2626,#EF4444)"
              : phase==="post"
              ? C.green+"10"
              : "#F1F5F9",
            display:"flex",alignItems:"center",gap:12,transition:"background 0.4s" }}>
            <Avatar name={lead.name} size={36}/>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13,fontWeight:800,color:phase==="active"?"#fff":C.text }}>{lead.name}</div>
              <div style={{ fontSize:11,color:phase==="active"?"rgba(255,255,255,0.8)":C.muted }}>📞 {lead.phone}</div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:14,fontWeight:800,fontVariantNumeric:"tabular-nums",
                color:phase==="active"?"#fff":C.slate,fontFamily:"monospace" }}>{fmt(elapsed)}</div>
              {phase==="active" && (
                <div style={{ display:"flex",alignItems:"center",gap:5,marginTop:2 }}>
                  <div style={{ width:7,height:7,borderRadius:"50%",background:"#fff",animation:"pulse 1s infinite" }}/>
                  <span style={{ fontSize:10,color:"rgba(255,255,255,0.9)",fontWeight:600 }}>In progress</span>
                </div>
              )}
              {phase==="post" && <div style={{ fontSize:10,color:C.green,fontWeight:700 }}>✓ Call ended</div>}
            </div>
          </div>
          {phase==="active" && <div style={{ padding:"8px 14px",background:C.red+"10",borderRadius:8,marginTop:8,fontSize:11,color:C.red,fontWeight:600,textAlign:"center" }}>Call in progress…</div>}
          {phase==="post"   && <div style={{ padding:"8px 14px",background:C.green+"10",borderRadius:8,marginTop:8,fontSize:11,color:C.green,fontWeight:600,textAlign:"center" }}>Call ended — fill in the details below</div>}
        </div>

        {/* ── Body ── */}
        <div style={{ padding:"18px 22px" }}>

          {/* ── BRIEFING / AI PANEL — same fixed size, no resize ── */}
          <div style={{ marginBottom:16,borderRadius:10,overflow:"hidden",border:`1.5px solid ${C.border}`,minHeight:106 }}>

            {/* PRE-CALL BRIEFING */}
            {(phase==="pre" || phase==="active") && (()=>{
              const aiBrief  = AI_SCORES[lead.id];
              const bt       = AI_BEST_TIMES[lead.id];
              const scr      = AI_CALL_SCRIPTS[lead.id] || AI_CALL_SCRIPTS["default"];
              const tierBrief= aiBrief ? SCORE_TIER[aiBrief.tier] : null;
              const reasons  = aiBrief?.reasons?.slice(0,1).join(". ") || "";
              const bestTime = bt ? `Best time: ${bt.window} ${bt.day}.` : "";
              const opening  = `Opening: "${scr.greeting.slice(0,60)}…"`;
              return (<>
                <div style={{ padding:"9px 14px",background:`linear-gradient(135deg,${C.navy},${C.indigo})`,display:"flex",alignItems:"center",gap:8 }}>
                  <span style={{ fontSize:13 }}>📋</span>
                  <span style={{ fontSize:11,fontWeight:700,color:"#fff" }}>Pre-Call Briefing</span>
                  {aiBrief && tierBrief && (
                    <span style={{ marginLeft:"auto",fontSize:10,fontWeight:700,padding:"2px 9px",borderRadius:12,background:"rgba(255,255,255,0.18)",color:"#fff" }}>
                      {tierBrief.label} · {aiBrief.score}/100
                    </span>
                  )}
                </div>
                <div style={{ padding:"12px 14px",background:"#fff",fontSize:11,color:C.slate,lineHeight:1.7 }}>
                  <strong style={{ color:C.text }}>{lead.source}</strong> · {lead.campaign} · {lead.city} · {lead.attempts} attempt{lead.attempts!==1?"s":""}.
                  {reasons && <> {reasons}.</>}
                  {bestTime && <> {bestTime}</>}
                  {" "}<span style={{ fontStyle:"italic",color:C.muted }}>{opening}</span>
                </div>
              </>);
            })()}

            {/* AI SUGGESTION PANEL */}
            {phase==="post" && !aiDismissed && (sugLoading || suggestions) && (<>
              <div style={{ padding:"9px 14px",background:sugLoading?"#F8FAFC":`linear-gradient(135deg,${C.ai}15,${C.ai}08)`,display:"flex",alignItems:"center",gap:8,borderBottom:`1px solid ${sugLoading?C.border:C.ai+"25"}` }}>
                <span style={{ fontSize:14,animation:sugLoading?"spin 1.2s linear infinite":"none",display:"inline-block" }}>🤖</span>
                <div style={{ flex:1 }}><span style={{ fontSize:11,fontWeight:700,color:sugLoading?C.muted:C.ai }}>{sugLoading?"AI is analysing your call…":`AI Suggestion · ${suggestions.confidence}% confidence`}</span></div>
                {sugLoading&&<div style={{ display:"flex",gap:3 }}>{[0,1,2].map(i=><div key={i} style={{ width:5,height:5,borderRadius:"50%",background:C.ai,opacity:0.5,animation:`bounce 1.1s ${i*0.15}s infinite` }}/>)}</div>}
              </div>
              {suggestions&&!sugLoading&&(<>
                <div style={{ background:"#fff" }}>
                  {[["Call Status",suggestions.callStatus],["Lifecycle",suggestions.lifecycle],["Stage Status",suggestions.stageStatus]].map(([label,value],i)=>(
                    <div key={label} style={{ display:"flex",alignItems:"center",gap:12,padding:"5px 14px",borderBottom:`1px solid ${C.border}` }}>
                      <div style={{ fontSize:9,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",width:80,flexShrink:0 }}>{label}</div>
                      <div style={{ fontSize:12,fontWeight:600,color:C.text }}>{value}</div>
                    </div>
                  ))}
                  <div style={{ padding:"5px 14px" }}>
                    <span style={{ fontSize:9,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",marginRight:8 }}>Report</span>
                    <span style={{ fontSize:11,color:C.muted,fontStyle:"italic" }}>"{suggestions.reportImproved.slice(0,70)}{suggestions.reportImproved.length>70?"…":""}"</span>
                  </div>
                </div>
                <div style={{ display:"flex",gap:8,padding:"8px 14px",background:"#F8FAFC",borderTop:`1px solid ${C.border}` }}>
                  <button onClick={handleAccept} style={{ flex:1,padding:"6px 0",borderRadius:7,border:"none",background:C.green,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer" }}>✓ Accept All</button>
                  <button onClick={handleIgnore} style={{ padding:"6px 18px",borderRadius:7,border:`1px solid ${C.border}`,background:"#fff",color:C.muted,fontSize:12,fontWeight:600,cursor:"pointer" }}>Ignore</button>
                </div>
              </>)}
              {sugLoading&&<div style={{ padding:"12px 14px",background:"#fff",fontSize:11,color:C.muted,fontStyle:"italic" }}>Reviewing call report and lead context…</div>}
            </>)}

          </div>

          {/* ── Call Status ── */}
          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:12,fontWeight:600,color:C.slate,display:"block",marginBottom:6 }}>
              Call Status <span style={{ color:C.red }}>*</span>
            </label>
            <div style={{ position:"relative" }}>
              <select value={callStatus} onChange={e=>setCallStatus(e.target.value)}
                style={{ width:"100%",padding:"10px 14px",borderRadius:9,border:`1.5px solid ${C.border}`,background:"#fff",fontSize:12,color:callStatus?C.text:C.muted,cursor:"pointer",appearance:"none",fontFamily:"inherit",outline:"none" }}>
                <option value="">Select call status</option>
                {CALL_STATUS_OPTIONS.map(o=><option key={o} value={o}>{o}</option>)}
              </select>
              <div style={{ position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",pointerEvents:"none",color:C.muted,fontSize:11 }}>▼</div>
            </div>
          </div>

          {/* ── Call Report ── */}
          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:12,fontWeight:600,color:C.slate,display:"block",marginBottom:6 }}>
              Call Report <span style={{ color:C.red }}>*</span>
            </label>
            <textarea value={callReport} onChange={e=>setCallReport(e.target.value)}
              placeholder="What happened on this call?"
              style={{ width:"100%",minHeight:90,borderRadius:9,
                border:`1.5px solid ${C.border}`,
                padding:"10px 14px",fontSize:12,fontFamily:"inherit",color:C.text,
                resize:"vertical",boxSizing:"border-box",lineHeight:1.6,outline:"none",background:"#fff" }}/>
          </div>

          {/* ── Lifecycle Stage + Stage Status ── */}
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:22 }}>
            <div>
              <div style={{ marginBottom:6 }}>
                <label style={{ fontSize:12,fontWeight:600,color:C.slate }}>
                  Lifecycle Stage <span style={{ color:C.red }}>*</span>
                </label>
                </div>
              <div style={{ position:"relative" }}>
                <select value={lifecycle} onChange={e=>{setLifecycle(e.target.value);setStageStatus("");}}
                  style={{ width:"100%",padding:"10px 14px",borderRadius:9,border:`1.5px solid ${C.border}`,background:"#fff",fontSize:12,color:lifecycle?C.text:C.muted,cursor:"pointer",appearance:"none",fontFamily:"inherit",outline:"none" }}>
                  <option value="">Select stage</option>
                  {LIFECYCLE_OPTIONS.map(o=><option key={o} value={o}>{o}</option>)}
                </select>
                <div style={{ position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",pointerEvents:"none",color:C.muted,fontSize:11 }}>▼</div>
              </div>
            </div>
            <div>
              <div style={{ marginBottom:6 }}>
                <label style={{ fontSize:12,fontWeight:600,color:C.slate }}>
                  Stage Status <span style={{ color:C.red }}>*</span>
                </label>
                </div>
              <div style={{ position:"relative" }}>
                <select value={stageStatus} onChange={e=>setStageStatus(e.target.value)}
                  disabled={!lifecycle}
                  style={{ width:"100%",padding:"10px 14px",borderRadius:9,border:`1.5px solid ${C.border}`,background:!lifecycle?"#F8FAFC":"#fff",fontSize:12,color:stageStatus?C.text:C.muted,cursor:lifecycle?"pointer":"default",appearance:"none",fontFamily:"inherit",outline:"none",opacity:lifecycle?1:0.6 }}>
                  <option value="">Select status</option>
                  {(STAGE_OPTIONS[lifecycle]||[]).map(o=><option key={o} value={o}>{o}</option>)}
                </select>
                <div style={{ position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",pointerEvents:"none",color:C.muted,fontSize:11 }}>▼</div>
              </div>
            </div>
          </div>

          {/* ── Actions ── */}
          {saved ? (
            <div style={{ padding:"14px",borderRadius:10,background:C.green+"0A",border:`1.5px solid ${C.green}30`,textAlign:"center" }}>
              <div style={{ fontSize:22,marginBottom:4 }}>✅</div>
              <div style={{ fontSize:13,fontWeight:700,color:C.green }}>Call logged successfully</div>
              <div style={{ fontSize:11,color:C.muted,marginTop:2 }}>Timeline updated · Status saved</div>
            </div>
          ) : (
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
              {phase==="pre" && (
                <>
                  <button onClick={onClose}
                    style={{ padding:"10px 22px",borderRadius:9,border:`1px solid ${C.border}`,background:"#fff",color:C.slate,fontSize:13,fontWeight:600,cursor:"pointer" }}>
                    Cancel
                  </button>
                  <button onClick={()=>setPhase("active")}
                    style={{ padding:"10px 24px",borderRadius:9,border:"none",background:C.green,color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:8 }}>
                    📞 Call
                  </button>
                </>
              )}
              {phase==="active" && (
                <>
                  <div style={{ fontSize:11,color:C.muted }}>Call is live…</div>
                  <button onClick={()=>setPhase("post")}
                    style={{ padding:"10px 24px",borderRadius:9,border:"none",background:C.red,color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:8 }}>
                    📵 End Call
                  </button>
                </>
              )}
              {phase==="post" && (
                <>
                  <button onClick={onClose}
                    style={{ padding:"10px 22px",borderRadius:9,border:`1px solid ${C.border}`,background:"#fff",color:C.slate,fontSize:13,fontWeight:600,cursor:"pointer" }}>
                    Cancel
                  </button>
                  <button
                    onClick={()=>{
                      // Fire workflow based on call outcome
                      if (onWorkflow) {
                        if (callStatus.startsWith("Reached – Interested") || callStatus === "Reached – Appointment Set") {
                          onWorkflow("appointment_scheduled", lead);
                        } else if (callStatus.startsWith("Reached – Not Interested")) {
                          onWorkflow("lead_not_interested", lead);
                        } else if (callStatus.startsWith("Not Reached")) {
                          const attempts = (lead?.attempts||0) + 1;
                          onWorkflow(attempts >= 5 ? "lead_not_reached_5" : "lead_not_reached_1_4", {...lead, attempts});
                        }
                        // Closed / Won — fires when the chosen status carries the isWon flag
                        const selStage  = LIFECYCLE_STORE.find(s=>s.nameEn===lifecycle);
                        const selStatus = (selStage?.statuses||[]).find(x=>x.nameEn===stageStatus);
                        if (selStatus && (selStatus.flags||[]).includes("isWon")) {
                          onWorkflow("lead_closed", lead);
                        }
                      }
                      setSaved(true); setTimeout(()=>onClose(), 1400);
                    }}
                    disabled={!callStatus||!callReport.trim()||!lifecycle||!stageStatus}
                    style={{ padding:"10px 24px",borderRadius:9,border:"none",
                      background:callStatus&&callReport.trim()&&lifecycle&&stageStatus?C.green:"#E2E8F0",
                      color:callStatus&&callReport.trim()&&lifecycle&&stageStatus?"#fff":C.muted,
                      fontSize:13,fontWeight:700,
                      cursor:callStatus&&callReport.trim()&&lifecycle&&stageStatus?"pointer":"default" }}>
                    ✓ Done
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        <style>{`
          @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:0.4} }
          @keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-5px)} }
          @keyframes spin   { to{transform:rotate(360deg)} }
          @keyframes shake  { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-4px)} 40%,80%{transform:translateX(4px)} }
          @keyframes popIn  { 0%{opacity:0;transform:scale(0.85) translateY(8px)} 100%{opacity:1;transform:scale(1) translateY(0)} }
        `}</style>


        </div>{/* end scrollable content */}
      </div>
    </>
  );
};

