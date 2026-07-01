import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { CALL_TRANSCRIPTS } from "../../lib/core";
import { C } from "../../theme";

export const CallAnalysisTab = ({ lead, script }) => {
  const transcript = CALL_TRANSCRIPTS[lead.id];
  const [analysis,  setAnalysis]  = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);

  const runAnalysis = async () => {
    if (!transcript) return;
    setLoading(true); setError(null);
    try {
      const transcriptText = transcript.lines.map(l=>`${l.speaker}: "${l.text}"`).join("\n");
      const scriptText = `Greeting: "${script.greeting}"\nPitch: "${script.pitch}"\nHook: "${script.hook}"\nObjections: ${script.objections.map(o=>`Q:"${o.q}" A:"${o.a}"`).join("; ")}\nClose: "${script.close}"`;

      const prompt = `You are an expert sales coach analyzing a call transcript from a financial services advisor against their prepared call script.

SCRIPT:
${scriptText}

TRANSCRIPT (${transcript.duration}, ${transcript.date}):
${transcriptText}

Analyze how well the advisor followed the script. Respond ONLY with valid JSON, no markdown:
{
  "overallScore": <0-100>,
  "grade": "<A|B|C|D|F>",
  "summary": "<2 sentence overall assessment>",
  "sections": [
    { "name": "Greeting", "score": <0-100>, "used": <true|false>, "note": "<short specific observation max 12 words>" },
    { "name": "Pitch", "score": <0-100>, "used": <true|false>, "note": "<short specific observation>" },
    { "name": "Value Hook", "score": <0-100>, "used": <true|false>, "note": "<short specific observation>" },
    { "name": "Objection Handling", "score": <0-100>, "used": <true|false>, "note": "<short specific observation>" },
    { "name": "Close", "score": <0-100>, "used": <true|false>, "note": "<short specific observation>" }
  ],
  "strengths": ["<strength 1 max 10 words>", "<strength 2>"],
  "improvements": ["<improvement 1 max 10 words>", "<improvement 2>"],
  "coachingNote": "<1 actionable coaching tip for the GP, max 20 words>"
}`;

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:600,
          messages:[{ role:"user", content:prompt }],
        }),
      });
      if (!response.ok) throw new Error(`API ${response.status}`);
      const data = await response.json();
      const text = data.content?.find(b=>b.type==="text")?.text||"";
      const clean = text.replace(/```json|```/g,"").trim();
      setAnalysis(JSON.parse(clean));
    } catch(e) {
      setError("Analysis failed — please try again.");
    }
    setLoading(false);
  };

  const GradeColor = { A:C.green, B:"#22C55E", C:C.amber, D:"#F97316", F:C.red };

  if (!transcript) return (
    <div style={{ textAlign:"center", padding:"40px 20px" }}>
      <div style={{ fontSize:36, marginBottom:12 }}>📵</div>
      <div style={{ fontSize:13, fontWeight:700, color:C.text, marginBottom:6 }}>No Call Recording Available</div>
      <div style={{ fontSize:12, color:C.muted, lineHeight:1.7, marginBottom:20 }}>
        Call analysis requires a recorded call via your VoIP integration (Aircall, Sipgate, NFON).<br/>
        Once a call is recorded and consent confirmed, the transcript will appear here automatically.
      </div>
      <div style={{ padding:"12px 16px", borderRadius:9, background:C.amber+"10", border:`1px solid ${C.amber}25`, fontSize:11, color:C.slate, textAlign:"left" }}>
        <strong>🔒 GDPR Note:</strong> Call recording requires explicit two-party consent under BDSG §201. An automated disclaimer must play at the start of every recorded call.
      </div>
    </div>
  );

  return (
    <div>
      {/* Call header */}
      <div style={{ padding:"12px 16px", borderRadius:10, background:"#F8FAFC", border:`1px solid ${C.border}`, marginBottom:16 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
          <div style={{ fontSize:13, fontWeight:700, color:C.text }}>📞 {transcript.date}</div>
          <div style={{ display:"flex", gap:6 }}>
            <span style={{ fontSize:10, padding:"2px 8px", borderRadius:8, background:C.green+"15", color:C.green, fontWeight:700 }}>🔒 Consent ✓</span>
            <span style={{ fontSize:10, padding:"2px 8px", borderRadius:8, background:"#F1F5F9", color:C.slate, fontWeight:600 }}>{transcript.duration}</span>
          </div>
        </div>
        <div style={{ fontSize:11, color:C.muted }}>Advisor: <strong style={{ color:C.text }}>{transcript.gp}</strong> · Contact: <strong style={{ color:C.text }}>{lead.name}</strong></div>
      </div>

      {/* Transcript */}
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:10 }}>Transcript</div>
        <div style={{ maxHeight:220, overflowY:"auto", display:"flex", flexDirection:"column", gap:8, paddingRight:4 }}>
          {transcript.lines.map((line,i)=>{
            const isGP = line.speaker==="GP";
            return (
              <div key={i} style={{ display:"flex", gap:8, alignItems:"flex-start", flexDirection:isGP?"row":"row-reverse" }}>
                <div style={{ width:26, height:26, borderRadius:"50%", background:isGP?C.primary+"15":C.indigo+"15", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:700, color:isGP?C.navy:C.indigo, flexShrink:0 }}>
                  {isGP?"GP":"L"}
                </div>
                <div style={{ maxWidth:"80%", padding:"8px 12px", borderRadius:isGP?"4px 12px 12px 12px":"12px 4px 12px 12px", background:isGP?C.primary+"0D":C.indigo+"0D", border:`1px solid ${isGP?C.primary+"20":C.indigo+"20"}`, fontSize:11, color:C.text, lineHeight:1.5 }}>
                  {line.text}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Analyse button */}
      {!analysis && (
        <button onClick={runAnalysis} disabled={loading}
          style={{ width:"100%", padding:"11px", borderRadius:9, border:"none", background:loading?"#E2E8F0":C.ai, color:loading?C.muted:"#fff", fontSize:13, fontWeight:700, cursor:loading?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8, marginBottom:16 }}>
          {loading
            ? <><span style={{ display:"inline-block",width:14,height:14,border:"2px solid #fff6",borderTop:"2px solid #fff",borderRadius:"50%",animation:"spin 0.7s linear infinite" }}/> Analysing call against script…</>
            : "🤖 Analyse Script Adherence"}
        </button>
      )}

      {error && <div style={{ padding:"12px", borderRadius:8, background:C.red+"10", color:C.red, fontSize:12, marginBottom:16 }}>{error}</div>}

      {/* Analysis results */}
      {analysis && (
        <div>
          {/* Overall score */}
          <div style={{ display:"flex", gap:12, alignItems:"center", padding:"14px 16px", borderRadius:10, background:`linear-gradient(135deg,${C.ai}08,${C.ai}04)`, border:`1.5px solid ${C.ai}25`, marginBottom:14 }}>
            <div style={{ width:56, height:56, borderRadius:12, background:C.ai+"15", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <span style={{ fontSize:20, fontWeight:800, color:GradeColor[analysis.grade]||C.ai }}>{analysis.grade}</span>
              <span style={{ fontSize:9, color:C.muted }}>{analysis.overallScore}/100</span>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:12, fontWeight:700, color:C.text, marginBottom:3 }}>Script Adherence Score</div>
              <div style={{ fontSize:11, color:C.slate, lineHeight:1.5 }}>{analysis.summary}</div>
            </div>
          </div>

          {/* Section breakdown */}
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:8 }}>Section Breakdown</div>
            {analysis.sections.map(s=>{
              const col = s.score>=80?C.green:s.score>=50?C.amber:C.red;
              return (
                <div key={s.name} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom:`1px solid ${C.border}` }}>
                  <span style={{ fontSize:14 }}>{s.used?"✅":"❌"}</span>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:11, fontWeight:700, color:C.text }}>{s.name}</div>
                    <div style={{ fontSize:10, color:C.muted }}>{s.note}</div>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0 }}>
                    <div style={{ width:52, height:5, borderRadius:3, background:"#F1F5F9", overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${s.score}%`, background:col, borderRadius:3 }}/>
                    </div>
                    <span style={{ fontSize:11, fontWeight:700, color:col, width:28, textAlign:"right" }}>{s.score}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Strengths & improvements */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
            <div style={{ padding:"10px 12px", borderRadius:8, background:C.green+"08", border:`1px solid ${C.green}20` }}>
              <div style={{ fontSize:10, fontWeight:700, color:C.green, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:6 }}>✓ Strengths</div>
              {analysis.strengths.map((s,i)=><div key={i} style={{ fontSize:11, color:C.text, marginBottom:4 }}>• {s}</div>)}
            </div>
            <div style={{ padding:"10px 12px", borderRadius:8, background:C.amber+"08", border:`1px solid ${C.amber}20` }}>
              <div style={{ fontSize:10, fontWeight:700, color:C.amber, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:6 }}>⚡ Improve</div>
              {analysis.improvements.map((s,i)=><div key={i} style={{ fontSize:11, color:C.text, marginBottom:4 }}>• {s}</div>)}
            </div>
          </div>

          {/* Coaching note */}
          <div style={{ padding:"11px 14px", borderRadius:9, background:C.ai+"08", border:`1px solid ${C.ai}20`, display:"flex", gap:10, alignItems:"flex-start" }}>
            <span style={{ fontSize:18, flexShrink:0 }}>🎯</span>
            <div>
              <div style={{ fontSize:10, fontWeight:700, color:C.ai, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:3 }}>Coaching Note</div>
              <div style={{ fontSize:12, color:C.slate, lineHeight:1.5 }}>{analysis.coachingNote}</div>
            </div>
          </div>

          <button onClick={()=>setAnalysis(null)} style={{ marginTop:10, width:"100%", padding:"7px", borderRadius:7, border:`1px solid ${C.border}`, background:"#fff", color:C.muted, fontSize:11, cursor:"pointer" }}>↺ Re-analyse</button>
        </div>
      )}
    </div>
  );
};
