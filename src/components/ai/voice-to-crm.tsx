import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { ALL_LEADS } from "../../lib/core";
import { C } from "../../theme";

export const VoiceToCRM = ({ leads=ALL_LEADS }) => {
  const [step,       setStep]       = useState("idle"); // idle | recording | processing | done
  const [transcript, setTranscript] = useState("");
  const [result,     setResult]     = useState(null);
  const [selectedLead, setSelectedLead] = useState(null);
  const [timer,      setTimer]      = useState(0);
  const timerRef = useRef(null);
  const DEMO_TRANSCRIPTS = [
    "Reached Herr Müller, he's interested in the Gold package, wants a follow-up call next Tuesday at 10am. He asked about monthly returns and seemed very open.",
    "Called Sandra Richter twice, no answer. Left a voicemail. Will try again tomorrow morning.",
    "Appointment with Klaus Weber went well. He signed the consultation agreement. Very happy customer. Will refer a colleague.",
  ];

  const startRecording = () => {
    setStep("recording");
    setTimer(0);
    timerRef.current = setInterval(()=>setTimer(t=>t+1),1000);
    // Auto-stop at 30s in demo
    setTimeout(stopRecording, 6000);
  };

  const stopRecording = () => {
    clearInterval(timerRef.current);
    // Pick a random demo transcript
    const demo = DEMO_TRANSCRIPTS[Math.floor(Math.random()*DEMO_TRANSCRIPTS.length)];
    setTranscript(demo);
    setStep("processing");
    processTranscript(demo);
  };

  const processTranscript = async (text) => {
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:1000,
          system:`You are the vion CRM post-call processor. Given a GP's dictated call note, extract structured data.
Output ONLY valid JSON, no markdown:
{"status": "<in_progress|not_reached|appointment|customer|followup|not_interested>", "lifecycle": "<Nurturing|Qualifying|Sales|Won|Lost>", "summary": "<professional 1-2 sentence summary>", "nextAction": "<specific next action>", "nextDate": "<e.g. Tuesday 10:00|Tomorrow morning|Immediately>", "sentiment": "<Positive|Neutral|Negative>", "keyPoints": ["<point1>","<point2>"]}`,
          messages:[{ role:"user", content:`Dictated call note: "${text}"` }],
        })
      });
      const data = await res.json();
      const text2 = data.content?.[0]?.text || "{}";
      const json  = JSON.parse(text2.replace(/```json|```/g,"").trim());
      setResult(json);
      setStep("done");
    } catch {
      setResult({ status:"in_progress", lifecycle:"Qualifying", summary:text, nextAction:"Review manually", nextDate:"ASAP", sentiment:"Neutral", keyPoints:[] });
      setStep("done");
    }
  };

  const statusColors = { in_progress:C.blue, not_reached:C.red, appointment:C.purple, customer:C.green, followup:C.amber, not_interested:C.muted };

  return (
    <div style={{ padding:"24px" }}>
      <div style={{ fontSize:14,fontWeight:800,color:C.navy,marginBottom:4 }}>🎙️ Voice-to-CRM</div>
      <div style={{ fontSize:12,color:C.muted,marginBottom:20,lineHeight:1.5,maxWidth:560 }}>
        Dictate your call notes aloud — AI automatically formats them, sets the lead status, and creates the next follow-up action. No typing needed.
      </div>

      {/* Lead selector */}
      <div style={{ marginBottom:16 }}>
        <label style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:6 }}>Lead (optional — links note to lead)</label>
        <div style={{ position:"relative" }}>
          <select value={selectedLead||""} onChange={e=>setSelectedLead(e.target.value||null)}
            style={{ width:"100%",padding:"9px 30px 9px 12px",borderRadius:9,border:`1.5px solid ${C.border}`,fontSize:13,fontFamily:"inherit",appearance:"none",outline:"none",background:"#fff" }}>
            <option value="">— No lead selected —</option>
            {leads.slice(0,8).map(l=><option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
          <div style={{ position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",pointerEvents:"none",fontSize:10,color:C.muted }}>▼</div>
        </div>
      </div>

      {/* Recording UI */}
      {step==="idle" && (
        <div style={{ textAlign:"center",padding:"32px 20px",background:"#F8FAFC",borderRadius:14,border:`1px dashed ${C.border}` }}>
          <div style={{ fontSize:48,marginBottom:12 }}>🎙️</div>
          <div style={{ fontSize:14,fontWeight:700,color:C.text,marginBottom:6 }}>Tap to start recording</div>
          <div style={{ fontSize:12,color:C.muted,marginBottom:20 }}>Speak your call notes naturally — AI does the rest</div>
          <button onClick={startRecording}
            style={{ padding:"12px 32px",borderRadius:24,border:"none",background:C.red,color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:8 }}>
            ⏺ Start Recording
          </button>
        </div>
      )}

      {step==="recording" && (
        <div style={{ textAlign:"center",padding:"32px 20px",background:"#FFF5F5",borderRadius:14,border:`2px solid ${C.red}40` }}>
          <div style={{ fontSize:48,marginBottom:8 }}>🔴</div>
          <div style={{ fontSize:16,fontWeight:800,color:C.red }}>{String(Math.floor(timer/60)).padStart(2,"0")}:{String(timer%60).padStart(2,"0")}</div>
          <div style={{ fontSize:13,color:C.red,marginBottom:4,fontWeight:600 }}>Recording…</div>
          <div style={{ fontSize:12,color:C.muted,marginBottom:20 }}>Speak clearly — "Called Herr Müller, interested in Gold package…"</div>
          <div style={{ display:"flex",justifyContent:"center",gap:3,marginBottom:20 }}>
            {Array.from({length:12}).map((_,i)=>(
              <div key={i} style={{ width:4,borderRadius:2,background:C.red,
                height:8+Math.sin(Date.now()/200+i)*8,opacity:0.5+Math.sin(i)*0.5,transition:"height 0.1s" }}/>
            ))}
          </div>
          <button onClick={stopRecording}
            style={{ padding:"12px 32px",borderRadius:24,background:"#fff",color:C.red,border:`2px solid ${C.red}`,fontSize:14,fontWeight:700,cursor:"pointer" }}>
            ⏹ Stop
          </button>
        </div>
      )}

      {step==="processing" && (
        <div style={{ padding:"20px",borderRadius:12,background:"#F8FAFC",border:`1px solid ${C.border}` }}>
          <div style={{ marginBottom:12 }}>
            <div style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:5 }}>Transcript</div>
            <div style={{ fontSize:13,color:C.slate,lineHeight:1.6,fontStyle:"italic" }}>"{transcript}"</div>
          </div>
          <div style={{ display:"flex",alignItems:"center",gap:10,color:C.ai,fontSize:13,fontWeight:600 }}>
            <div style={{ display:"flex",gap:4 }}>{[0,1,2].map(i=><div key={i} style={{ width:7,height:7,borderRadius:"50%",background:C.ai,opacity:0.4+i*0.3 }}/>)}</div>
            AI is classifying your call note…
          </div>
        </div>
      )}

      {step==="done" && result && (
        <>
          <div style={{ padding:"12px 14px",borderRadius:9,background:"#F8FAFC",border:`1px solid ${C.border}`,marginBottom:14 }}>
            <div style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:5 }}>Transcript</div>
            <div style={{ fontSize:12,color:C.slate,fontStyle:"italic" }}>"{transcript}"</div>
          </div>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14 }}>
            {[
              ["📊 Status",      result.status?.replace(/_/g," ")||"—",  statusColors[result.status]||C.muted],
              ["🔄 Lifecycle",   result.lifecycle||"—",                   C.indigo],
              ["😊 Sentiment",   result.sentiment||"—",                   result.sentiment==="Positive"?C.green:result.sentiment==="Negative"?C.red:C.amber],
              ["📅 Next action", result.nextDate||"—",                    C.navy],
            ].map(([lbl,val,col])=>(
              <div key={lbl} style={{ padding:"10px 14px",borderRadius:9,background:"#fff",border:`1px solid ${C.border}` }}>
                <div style={{ fontSize:10,color:C.muted,marginBottom:3 }}>{lbl}</div>
                <div style={{ fontSize:13,fontWeight:700,color:col,textTransform:"capitalize" }}>{val}</div>
              </div>
            ))}
          </div>
          <div style={{ padding:"12px 14px",borderRadius:9,background:C.ai+"06",border:`1px solid ${C.ai}25`,marginBottom:12 }}>
            <div style={{ fontSize:11,fontWeight:700,color:C.ai,marginBottom:4 }}>🤖 Professional Summary</div>
            <div style={{ fontSize:13,color:C.slate,lineHeight:1.5 }}>{result.summary}</div>
          </div>
          {result.keyPoints?.length>0 && (
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:6 }}>Key points</div>
              {result.keyPoints.map((p,i)=>(
                <div key={i} style={{ display:"flex",gap:8,marginBottom:5,fontSize:12,color:C.slate }}>
                  <span style={{ color:C.green,fontWeight:700,flexShrink:0 }}>✓</span>{p}
                </div>
              ))}
            </div>
          )}
          <div style={{ padding:"10px 14px",borderRadius:9,background:C.amber+"08",border:`1px solid ${C.amber}30`,marginBottom:14,fontSize:12,color:C.slate }}>
            <strong style={{ color:C.amber }}>⚡ Next:</strong> {result.nextAction} — {result.nextDate}
          </div>
          <div style={{ display:"flex",gap:10 }}>
            <button onClick={()=>alert("Call note saved to CRM and lead status updated.")}
              style={{ flex:2,padding:"10px",borderRadius:9,border:"none",background:C.primary,color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer" }}>
              ✅ Save to CRM
            </button>
            <button onClick={()=>{ setStep("idle"); setTranscript(""); setResult(null); }}
              style={{ flex:1,padding:"10px",borderRadius:9,border:`1px solid ${C.border}`,background:"#fff",color:C.muted,fontSize:13,fontWeight:600,cursor:"pointer" }}>
              🔁 Redo
            </button>
          </div>
        </>
      )}
    </div>
  );
};

// ─── AI Meeting Prep Brief ─────────────────────────────────────────────────────
