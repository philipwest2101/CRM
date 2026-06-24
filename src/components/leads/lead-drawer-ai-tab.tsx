import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { SettingsCard } from "../ui/settings-card";
import { AI_CALL_SCRIPTS, AI_SCORES, SCORE_TIER, buildLeadSystemPrompt, callClaudeAPI } from "../../lib/core";
import { C } from "../../theme";

export const LeadDrawerAITab = ({ lead, role }) => {
  const ai    = AI_SCORES[lead.id];
  const tier  = ai ? SCORE_TIER[ai.tier] : null;
  const script= AI_CALL_SCRIPTS[lead.id] || AI_CALL_SCRIPTS["default"];

  const [agentMessages, setAgentMessages] = useState([{
    from:"agent",
    text:`Hi! Select an option below to get started with **${lead.name}**.`,
    chips:["📋 Show call script","📝 Log this call","📞 Analyse last call","💡 Explain AI score","✉️ Draft follow-up email","⏰ Best time to call"]
  }]);
  const [agentInput,   setAgentInput]   = useState("");
  const [agentThinking,setAgentThinking]= useState(false);
  const [callNotes,    setCallNotes]    = useState("");
  const [classified,   setClassified]   = useState(null);
  const [confirmed,    setConfirmed]    = useState(false);
  const [classifying,  setClassifying]  = useState(false);
  const [commsSent,    setCommsSent]    = useState({email:false,sms:false,docs:false});
  const agentBottomRef = useRef(null);

  useEffect(()=>{ agentBottomRef.current?.scrollIntoView({behavior:"smooth"}); },[agentMessages,agentThinking]);

  const sendAgent = async (msg) => {
    if (!msg?.trim() || agentThinking) return;
    setAgentInput("");
    setAgentMessages(prev=>[...prev,{from:"user",text:msg}]);
    setAgentThinking(true);
    try {
      const text = await callClaudeAPI(buildLeadSystemPrompt(lead,role), msg);
      setAgentMessages(prev=>[...prev,{from:"agent",text}]);
    } catch {
      setAgentMessages(prev=>[...prev,{from:"agent",text:"Sorry, I couldn't reach the AI. Please try again."}]);
    }
    setAgentThinking(false);
  };

  const handleClassify = async () => {
    if (!callNotes.trim()) return;
    setClassifying(true);
    try {
      const raw = await callClaudeAPI(
        `You classify call outcomes for a CRM. Return ONLY JSON: {"status":"followup"|"appointment"|"no_interest"|"attempted"|"closed","label":"human label","color":"hex","followup":"date or empty","nextAction":"string","reasoning":"string","confidence":0-100,"suggestAppointment":bool}`,
        `Call note: "${callNotes}". Contact: ${lead.name}, campaign: ${lead.campaign}, attempts: ${lead.attempts}.`
      );
      setClassified(JSON.parse(raw.replace(/```json|```/g,"").trim()));
    } catch {
      setClassified({status:"followup",label:"Follow-up",color:C.indigo,followup:"Next week",nextAction:"Schedule a callback",reasoning:"Consultant indicated interest.",confidence:80,suggestAppointment:false});
    }
    setClassifying(false);
  };

  const renderAgentText = (text) => text.split(/(\*\*[^*]+\*\*)/g).map((p,i)=>
    p.startsWith("**")&&p.endsWith("**")
      ? <strong key={i}>{p.slice(2,-2)}</strong>
      : p
  );

  return (
    <SettingsCard style={{ padding:0,overflow:"hidden" }}>
      {/* Context bar */}
      <div style={{ padding:"12px 18px",background:`linear-gradient(135deg,#4C1D95,${C.ai})`,display:"flex",alignItems:"center",gap:10 }}>
        <span style={{ fontSize:18 }}>🤖</span>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:12,fontWeight:800,color:"#fff" }}>AI — {lead.name}</div>
          <div style={{ fontSize:10,color:"rgba(255,255,255,0.7)" }}>{lead.campaign} · {lead.source} · Score {ai?.score ?? "…"}/100</div>
        </div>
        {ai && <span style={{ fontSize:10,padding:"2px 10px",borderRadius:20,background:"rgba(255,255,255,0.2)",color:"#fff",fontWeight:700 }}>{tier?.label}</span>}
      </div>

      {/* Messages */}
      <div style={{ padding:"16px 18px",display:"flex",flexDirection:"column",gap:10,minHeight:300,maxHeight:500,overflowY:"auto" }}>
        {agentMessages.map((m,i)=>{
          if (m.type==="script") return (
            <div key={i} style={{ alignSelf:"flex-start",width:"100%" }}>
              <div style={{ fontSize:10,color:C.muted,marginBottom:4 }}>🤖 AI</div>
              <SettingsCard style={{ padding:"14px" }}>
                <div style={{ fontSize:12,fontWeight:800,color:C.ai,marginBottom:12 }}>📋 AI Call Script</div>
                {[["👋 Opening",script.greeting],["💼 Pitch",script.pitch],["⚡ Value Hook",script.hook],["🎯 Close",script.close]].map(([label,text])=>(
                  <div key={label} style={{ marginBottom:10,padding:"9px 12px",borderRadius:8,background:"#F8FAFC",border:`1px solid ${C.border}` }}>
                    <div style={{ fontSize:10,fontWeight:700,color:C.muted,marginBottom:4 }}>{label}</div>
                    <div style={{ fontSize:12,color:C.text,lineHeight:1.5 }}>{text}</div>
                  </div>
                ))}
                {script.objections?.map((obj,j)=>(
                  <div key={j} style={{ marginBottom:8,padding:"9px 12px",borderRadius:8,background:"#FFF5F5",border:`1px solid ${C.red}20` }}>
                    <div style={{ fontSize:12,fontWeight:700,color:C.red,marginBottom:3 }}>"{obj.q}"</div>
                    <div style={{ fontSize:12,color:C.slate,fontStyle:"italic" }}>→ "{obj.a}"</div>
                  </div>
                ))}
              </SettingsCard>
            </div>
          );
          if (m.type==="log") return (
            <div key={i} style={{ alignSelf:"flex-start",width:"100%" }}>
              <div style={{ fontSize:10,color:C.muted,marginBottom:4 }}>🤖 AI</div>
              <SettingsCard style={{ padding:"14px" }}>
                <div style={{ fontSize:12,fontWeight:800,color:C.ai,marginBottom:4 }}>📝 Log this call</div>
                <textarea value={callNotes} onChange={e=>{setCallNotes(e.target.value);setClassified(null);setConfirmed(false);}}
                  placeholder="What happened? e.g. 'Reached him, interested, callback Thursday'"
                  style={{ width:"100%",minHeight:72,borderRadius:8,border:`1px solid ${C.border}`,padding:"8px 10px",fontSize:12,fontFamily:"inherit",resize:"none",boxSizing:"border-box",lineHeight:1.5 }}/>
                <button onClick={handleClassify} disabled={!callNotes.trim()||classifying}
                  style={{ marginTop:8,width:"100%",padding:"8px",borderRadius:7,border:"none",background:callNotes.trim()&&!classifying?C.ai:"#E2E8F0",color:callNotes.trim()&&!classifying?"#fff":C.muted,fontSize:12,fontWeight:700,cursor:callNotes.trim()&&!classifying?"pointer":"default" }}>
                  {classifying?"Analysing…":"🤖 Classify Outcome"}
                </button>
                {classified && !confirmed && (
                  <div style={{ marginTop:10,padding:"12px",borderRadius:9,border:`1.5px solid ${C.ai}30`,background:C.ai+"06" }}>
                    <div style={{ fontSize:11,fontWeight:700,color:C.ai,marginBottom:8 }}>Result · {classified.confidence}% confidence</div>
                    <div style={{ fontSize:12,color:C.text,marginBottom:4 }}>Status: <strong>{classified.label}</strong></div>
                    <div style={{ fontSize:12,color:C.text,marginBottom:8 }}>Next: {classified.nextAction}</div>
                    <div style={{ display:"flex",gap:7 }}>
                      <button onClick={()=>setConfirmed(true)} style={{ flex:1,padding:"7px",borderRadius:7,border:"none",background:C.green,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer" }}>✓ Confirm</button>
                      <button onClick={()=>setClassified(null)} style={{ padding:"7px 12px",borderRadius:7,border:`1px solid ${C.border}`,background:"#fff",color:C.slate,fontSize:12,cursor:"pointer" }}>Edit</button>
                    </div>
                  </div>
                )}
                {confirmed && <div style={{ marginTop:10,padding:"12px",borderRadius:9,background:C.green+"0A",border:`1px solid ${C.green}30`,textAlign:"center",fontSize:12,fontWeight:700,color:C.green }}>✅ Saved to Journey</div>}
              </SettingsCard>
            </div>
          );
          return (
            <div key={i} style={{ display:"flex",flexDirection:"column",alignItems:m.from==="user"?"flex-end":"flex-start",gap:5 }}>
              <div style={{ maxWidth:"88%",padding:"10px 14px",borderRadius:m.from==="user"?"13px 13px 3px 13px":"13px 13px 13px 3px",background:m.from==="user"?C.ai:"#F1F5F9",color:m.from==="user"?"#fff":C.text,fontSize:12,lineHeight:1.65 }}>
                {renderAgentText(m.text)}
              </div>
              {m.chips && (
                <div style={{ display:"flex",flexWrap:"wrap",gap:5,maxWidth:"96%" }}>
                  {m.chips.map(c=>{
                    const isSpecial = ["📋 Show call script","📝 Log this call","📞 Analyse last call"].includes(c);
                    return (
                      <button key={c} onClick={()=>{
                        if(c==="📋 Show call script") setAgentMessages(prev=>[...prev,{from:"user",text:"Show call script"},{type:"script",from:"agent",text:""}]);
                        else if(c==="📝 Log this call"){setCallNotes("");setClassified(null);setConfirmed(false);setAgentMessages(prev=>[...prev,{from:"user",text:"Log this call"},{type:"log",from:"agent",text:""}]);}
                        else sendAgent(c);
                      }} style={{ padding:"3px 10px",borderRadius:20,border:`1px solid ${isSpecial?C.primary:C.ai}35`,background:isSpecial?C.primary+"0A":C.ai+"0A",color:isSpecial?C.navy:C.ai,fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"inherit" }}>{c}</button>
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
              {[0,1,2].map(i=><div key={i} style={{ width:7,height:7,borderRadius:"50%",background:C.ai,opacity:0.7,animation:`bounce 1.2s ${i*0.2}s infinite` }}/>)}
            </div>
          </div>
        )}
        <div ref={agentBottomRef}/>
      </div>

      {/* Input */}
      <div style={{ display:"flex",gap:8,alignItems:"center",padding:"12px 18px",borderTop:`1px solid ${C.border}`,background:"#F8FAFC" }}>
        <input value={agentInput} onChange={e=>setAgentInput(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&sendAgent(agentInput)}
          placeholder="Or type a work-related question…"
          style={{ flex:1,border:`1.5px solid ${C.border}`,borderRadius:9,padding:"9px 14px",fontSize:12,fontFamily:"inherit",color:C.text,outline:"none",background:"#fff" }}/>
        <button onClick={()=>sendAgent(agentInput)} disabled={!agentInput.trim()||agentThinking}
          style={{ width:38,height:38,borderRadius:9,border:"none",background:agentInput.trim()&&!agentThinking?C.ai:"#E2E8F0",color:"#fff",fontSize:16,cursor:agentInput.trim()&&!agentThinking?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>↑</button>
      </div>
      <style>{`@keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-6px)}}`}</style>
    </SettingsCard>
  );
};

// ─── Reminders Page ───────────────────────────────────────────────────────────
