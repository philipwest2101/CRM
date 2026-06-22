import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { ROLEPLAY_PERSONAS } from "../../lib/core";
import { C } from "../../theme";

export const AIObjectionRoleplay = () => {
  const [persona,    setPersona]    = useState(null);
  const [messages,   setMessages]   = useState([]);
  const [input,      setInput]      = useState("");
  const [loading,    setLoading]    = useState(false);
  const [sessionEnd, setSessionEnd] = useState(false);
  const [feedback,   setFeedback]   = useState(null);
  const [turnCount,  setTurnCount]  = useState(0);
  const MAX_TURNS = 4;

  const startSession = (p) => {
    setPersona(p);
    setMessages([{ role:"lead", text:p.opener }]);
    setSessionEnd(false);
    setFeedback(null);
    setTurnCount(0);
  };

  const sendReply = async () => {
    if(!input.trim()||loading) return;
    const userMsg = input.trim();
    setInput("");
    const newMessages = [...messages, { role:"gp", text:userMsg }];
    setMessages(newMessages);
    setLoading(true);

    const history = newMessages.map(m=>`${m.role==="gp"?"GP":"Lead"}: ${m.text}`).join("\n");
    const isLast = turnCount + 1 >= MAX_TURNS;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:1000,
          system:`You are roleplaying as a skeptical German lead for a vion financial advisory CRM training session.
Persona: "${persona.label}" — your opening objection was: "${persona.opener}"
Stay in character as this lead. React authentically to what the GP says.
${isLast ? `This is the FINAL exchange. After the GP's response, output EXACTLY this JSON structure (no other text):
{"reaction": "<lead's final reaction in 1 sentence>", "verdict": "<Convinced|Not Convinced|Partial>", "score": <0-100>, "feedback": {"pitch": <0-100>, "empathy": <0-100>, "close": <0-100>}, "coaching": "<2-3 specific coaching sentences for the GP>", "highlight": "<quote the best thing the GP said>", "improve": "<quote what could be improved and why>"}` 
: `Reply as the lead in 1-2 sentences. Stay resistant but authentic. Don't be convinced too easily.`}`,
          messages:[{ role:"user", content: isLast
            ? `Conversation so far:\n${history}\n\nNow output the final JSON evaluation.`
            : `The GP just said: "${userMsg}"\n\nRespond as the lead (1-2 sentences, stay in character).` }],
        })
      });
      const data = await res.json();
      const text = data.content?.[0]?.text || "";

      if(isLast) {
        try {
          const clean = text.replace(/```json|```/g,"").trim();
          const json  = JSON.parse(clean);
          setMessages(prev=>[...prev, { role:"lead", text:json.reaction }]);
          setFeedback(json);
          setSessionEnd(true);
        } catch {
          setMessages(prev=>[...prev, { role:"ai-error", text:"Could not parse evaluation. Try again." }]);
        }
      } else {
        setMessages(prev=>[...prev, { role:"lead", text:text }]);
        setTurnCount(t=>t+1);
      }
    } catch {
      setMessages(prev=>[...prev, { role:"ai-error", text:"API error — check connection." }]);
    }
    setLoading(false);
  };

  if(!persona) return (
    <div style={{ padding:"24px" }}>
      <div style={{ fontSize:14,fontWeight:800,color:C.navy,marginBottom:4 }}>🎭 AI Objection Roleplay</div>
      <div style={{ fontSize:12,color:C.muted,marginBottom:20,lineHeight:1.5,maxWidth:560 }}>
        Practice handling real objections. The AI plays a skeptical lead. You respond as the GP.
        After {MAX_TURNS} exchanges, the AI grades your performance and gives coaching notes.
      </div>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12 }}>
        {ROLEPLAY_PERSONAS.map(p=>(
          <div key={p.id} onClick={()=>startSession(p)}
            style={{ padding:"16px",borderRadius:12,background:"#fff",border:`1px solid ${C.border}`,
              cursor:"pointer",transition:"all 0.15s" }}
            onMouseEnter={e=>e.currentTarget.style.borderColor=C.ai}
            onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
            <div style={{ fontSize:24,marginBottom:8 }}>{p.icon}</div>
            <div style={{ fontSize:13,fontWeight:700,color:C.text,marginBottom:3 }}>{p.label}</div>
            <div style={{ fontSize:11,color:C.muted,marginBottom:8,lineHeight:1.4 }}>"{p.opener.slice(0,60)}…"</div>
            <span style={{ fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:8,
              background:p.difficulty==="Easy"?C.green+"15":p.difficulty==="Medium"?C.amber+"15":p.difficulty==="Hard"?C.red+"15":"#7C3AED15",
              color:p.difficulty==="Easy"?C.green:p.difficulty==="Medium"?C.amber:p.difficulty==="Hard"?C.red:"#7C3AED" }}>
              {p.difficulty}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ padding:"24px" }}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
        <div>
          <div style={{ fontSize:14,fontWeight:800,color:C.navy }}>🎭 Roleplay — {persona.label} {persona.icon}</div>
          <div style={{ fontSize:11,color:C.muted }}>Turn {Math.min(turnCount+1,MAX_TURNS)} of {MAX_TURNS} · Difficulty: {persona.difficulty}</div>
        </div>
        <button onClick={()=>{ setPersona(null); setMessages([]); setSessionEnd(false); setFeedback(null); setTurnCount(0); }}
          style={{ padding:"5px 14px",borderRadius:8,border:`1px solid ${C.border}`,background:"#fff",color:C.muted,fontSize:11,fontWeight:600,cursor:"pointer" }}>
          ← Change Persona
        </button>
      </div>

      {/* Chat */}
      <div style={{ background:"#F8FAFC",borderRadius:12,border:`1px solid ${C.border}`,padding:"16px",marginBottom:14,maxHeight:280,overflowY:"auto",display:"flex",flexDirection:"column",gap:10 }}>
        {messages.map((m,i)=>(
          <div key={i} style={{ display:"flex",justifyContent:m.role==="gp"?"flex-end":"flex-start",gap:8 }}>
            {m.role!=="gp" && <div style={{ width:28,height:28,borderRadius:"50%",background:m.role==="lead"?C.amber+"20":"#F3F4F6",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0 }}>{m.role==="lead"?persona.icon:"⚠️"}</div>}
            <div style={{ maxWidth:"75%",padding:"9px 13px",borderRadius:m.role==="gp"?"14px 14px 3px 14px":"14px 14px 14px 3px",
              background:m.role==="gp"?C.ai:"#fff",color:m.role==="gp"?"#fff":C.text,fontSize:12,lineHeight:1.5,
              boxShadow:"0 1px 3px rgba(0,0,0,0.07)" }}>
              {m.role==="lead"&&<div style={{ fontSize:10,fontWeight:700,color:C.amber,marginBottom:3 }}>Lead ({persona.label})</div>}
              {m.role==="gp"&&<div style={{ fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.7)",marginBottom:3 }}>You (GP)</div>}
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display:"flex",gap:8 }}>
            <div style={{ width:28,height:28,borderRadius:"50%",background:C.amber+"20",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14 }}>{persona.icon}</div>
            <div style={{ padding:"9px 13px",borderRadius:"14px 14px 14px 3px",background:"#fff",boxShadow:"0 1px 3px rgba(0,0,0,0.07)",display:"flex",gap:4,alignItems:"center" }}>
              {[0,1,2].map(i=><div key={i} style={{ width:6,height:6,borderRadius:"50%",background:C.amber,opacity:0.4+i*0.3 }}/>)}
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      {!sessionEnd && (
        <div style={{ display:"flex",gap:10 }}>
          <input value={input} onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&sendReply()}
            placeholder="Type your response as the GP…"
            style={{ flex:1,padding:"10px 14px",borderRadius:9,border:`1.5px solid ${C.border}`,fontSize:13,fontFamily:"inherit",outline:"none" }}/>
          <button onClick={sendReply} disabled={!input.trim()||loading}
            style={{ padding:"10px 20px",borderRadius:9,border:"none",background:input.trim()&&!loading?C.ai:"#E2E8F0",color:input.trim()&&!loading?"#fff":C.muted,fontSize:13,fontWeight:700,cursor:input.trim()&&!loading?"pointer":"default" }}>
            {turnCount+1>=MAX_TURNS?"Finish →":"Reply →"}
          </button>
        </div>
      )}

      {/* AI Feedback */}
      {sessionEnd && feedback && (
        <div style={{ borderRadius:12,border:`2px solid ${C.ai}30`,background:C.ai+"04",padding:"20px",marginTop:8 }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
            <div style={{ fontSize:14,fontWeight:800,color:C.navy }}>🤖 AI Coach Feedback</div>
            <div style={{ fontSize:28,fontWeight:800,color:feedback.score>=70?C.green:feedback.score>=50?C.amber:C.red }}>{feedback.score}<span style={{ fontSize:16,fontWeight:400,color:C.muted }}>/100</span></div>
          </div>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:14 }}>
            {[["Pitch",feedback.feedback?.pitch],["Empathy",feedback.feedback?.empathy],["Close",feedback.feedback?.close]].map(([lbl,val])=>(
              <div key={lbl} style={{ background:"#fff",borderRadius:9,padding:"10px 12px",textAlign:"center",border:`1px solid ${C.border}` }}>
                <div style={{ fontSize:16,fontWeight:800,color:val>=70?C.green:val>=50?C.amber:C.red }}>{val}</div>
                <div style={{ fontSize:10,color:C.muted,marginTop:2 }}>{lbl}</div>
              </div>
            ))}
          </div>
          <div style={{ marginBottom:10,padding:"10px 14px",borderRadius:9,background:C.green+"08",border:`1px solid ${C.green}25`,fontSize:12,color:C.slate }}>
            <strong style={{ color:C.green }}>✅ What worked:</strong> {feedback.highlight}
          </div>
          <div style={{ marginBottom:10,padding:"10px 14px",borderRadius:9,background:C.amber+"08",border:`1px solid ${C.amber}25`,fontSize:12,color:C.slate }}>
            <strong style={{ color:C.amber }}>🔧 Improve:</strong> {feedback.improve}
          </div>
          <div style={{ padding:"10px 14px",borderRadius:9,background:C.ai+"08",border:`1px solid ${C.ai}25`,fontSize:12,color:C.slate }}>
            <strong style={{ color:C.ai }}>📋 Coaching notes:</strong> {feedback.coaching}
          </div>
          <button onClick={()=>startSession(persona)}
            style={{ marginTop:14,width:"100%",padding:"10px",borderRadius:9,border:"none",background:C.ai,color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer" }}>
            🔁 Try Again
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Voice-to-CRM ─────────────────────────────────────────────────────────────
