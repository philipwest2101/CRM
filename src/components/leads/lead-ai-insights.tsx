import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { C } from "../../theme";

export const LeadAIInsights = ({ lead }) => {
  const [status,  setStatus]  = useState("idle"); // idle | loading | done | error
  const [insights,setInsights]= useState(null);
  const [expanded,setExpanded]= useState(false);

  const generate = async () => {
    setStatus("loading");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: `You are an AI assistant for vion CRM, a German financial advisory platform. 
Analyse a lead profile and return a JSON object with actionable insights for the GP consultant.
Output ONLY valid JSON, no markdown or preamble:
{
  "score": <0-100>,
  "scoreLabel": "<Hot|Warm|Cold>",
  "scoreReason": "<2 sentences explaining the score>",
  "bestContactTime": "<e.g. Today 14:00–16:00>",
  "bestContactReason": "<1 sentence>",
  "talkingPoints": ["<point 1>", "<point 2>", "<point 3>"],
  "riskFlags": ["<risk 1 if any>"],
  "emailDraftSubject": "<suggested email subject line>",
  "recommendedAction": "<single most important next action>",
  "sentiment": "<Positive|Neutral|Cautious>"
}`,
          messages: [{
            role: "user",
            content: `Lead profile:
Name: ${lead.name}
Status: ${lead.status}
Product interest: ${lead.product || "Unknown"}
Source: ${lead.source || "Unknown"}
City: ${lead.city || "Unknown"}
Contact attempts: ${lead.attempts || 0}
Last contact: ${lead.lastContact || "Never"}
Preferred language: ${lead.lang === "en" ? "English" : "German"}
Campaign: ${lead.campaign || "Unknown"}
GDPR consent: ${lead.consent ? "Yes" : "No"}
Labels: ${lead.labels?.join(", ") || "None"}`
          }]
        })
      });
      const data = await res.json();
      const text = data.content?.[0]?.text || "{}";
      const json = JSON.parse(text.replace(/```json|```/g, "").trim());
      setInsights(json);
      setStatus("done");
      setExpanded(true);
    } catch (e) {
      setStatus("error");
    }
  };

  const scoreColor = insights
    ? insights.score >= 70 ? C.green : insights.score >= 45 ? C.amber : C.red
    : C.ai;
  const sentimentIcon = { Positive:"😊", Neutral:"😐", Cautious:"⚠️" };

  return (
    <div style={{ borderRadius:12,border:`1.5px solid ${C.ai}30`,
      background:`linear-gradient(135deg,${C.ai}08,${C.ai}04)`,overflow:"hidden" }}>

      {/* Header row */}
      <div style={{ padding:"14px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",
        borderBottom:expanded?`1px solid ${C.ai}20`:"none" }}>
        <div style={{ display:"flex",alignItems:"center",gap:10 }}>
          <div style={{ width:32,height:32,borderRadius:"50%",background:C.ai,
            display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0 }}>🤖</div>
          <div>
            <div style={{ fontSize:14,fontWeight:800,color:C.navy }}>AI Insights</div>
            <div style={{ fontSize:11,color:C.muted }}>
              {status==="idle"   && "Powered by Claude — click to generate"}
              {status==="loading"&& "Analysing lead profile…"}
              {status==="done"   && `Score: ${insights?.score}/100 · ${insights?.scoreLabel} · ${insights?.sentiment} ${sentimentIcon[insights?.sentiment]||""}`}
              {status==="error"  && "Error — check API connection"}
            </div>
          </div>
        </div>
        <div style={{ display:"flex",gap:8,alignItems:"center" }}>
          {status==="done" && insights && (
            <div style={{ fontFamily:"monospace",fontSize:22,fontWeight:800,color:scoreColor }}>
              {insights.score}
              <small style={{ fontSize:12,color:C.muted,fontWeight:400 }}>/100</small>
            </div>
          )}
          {status==="idle" || status==="error" ? (
            <button onClick={generate}
              style={{ padding:"7px 16px",borderRadius:8,border:"none",background:C.ai,color:"#fff",
                fontSize:12,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:6 }}>
              ✨ Generate
            </button>
          ) : status==="loading" ? (
            <div style={{ display:"flex",gap:4,alignItems:"center",padding:"7px 14px" }}>
              {[0,1,2].map(i=>(
                <div key={i} style={{ width:7,height:7,borderRadius:"50%",background:C.ai,opacity:0.4+i*0.3 }}/>
              ))}
            </div>
          ) : (
            <div style={{ display:"flex",gap:6 }}>
              <button onClick={generate}
                style={{ padding:"5px 10px",borderRadius:7,border:`1px solid ${C.border}`,background:"#fff",
                  color:C.muted,fontSize:11,fontWeight:600,cursor:"pointer" }}>🔁 Refresh</button>
              <button onClick={()=>setExpanded(v=>!v)}
                style={{ padding:"5px 10px",borderRadius:7,border:`1px solid ${C.border}`,background:"#fff",
                  color:C.muted,fontSize:11,cursor:"pointer" }}>{expanded?"▲":"▼"}</button>
            </div>
          )}
        </div>
      </div>

      {/* Expanded insights */}
      {status==="done" && insights && expanded && (
        <div style={{ padding:"16px 18px",display:"flex",flexDirection:"column",gap:14 }}>

          {/* Score reason */}
          <div style={{ padding:"10px 14px",borderRadius:9,background:scoreColor+"08",border:`1px solid ${scoreColor}25` }}>
            <div style={{ fontSize:10,fontWeight:700,color:scoreColor,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4 }}>
              Why {insights.score}/100?
            </div>
            <div style={{ fontSize:12,color:C.slate,lineHeight:1.5 }}>{insights.scoreReason}</div>
          </div>

          {/* 3-column grid: Best time + Recommended action + Email subject */}
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10 }}>
            <div style={{ padding:"10px 12px",borderRadius:9,background:"#fff",border:`1px solid ${C.border}` }}>
              <div style={{ fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:4 }}>⏰ Best Contact</div>
              <div style={{ fontSize:12,fontWeight:700,color:C.text }}>{insights.bestContactTime}</div>
              <div style={{ fontSize:10,color:C.muted,marginTop:2 }}>{insights.bestContactReason}</div>
            </div>
            <div style={{ padding:"10px 12px",borderRadius:9,background:"#fff",border:`1px solid ${C.border}` }}>
              <div style={{ fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:4 }}>⚡ Next Action</div>
              <div style={{ fontSize:12,fontWeight:700,color:C.navy,lineHeight:1.4 }}>{insights.recommendedAction}</div>
            </div>
            <div style={{ padding:"10px 12px",borderRadius:9,background:"#fff",border:`1px solid ${C.border}` }}>
              <div style={{ fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:4 }}>✉️ Email Subject</div>
              <div style={{ fontSize:11,color:C.text,lineHeight:1.4,fontStyle:"italic" }}>"{insights.emailDraftSubject}"</div>
            </div>
          </div>

          {/* Talking points */}
          <div>
            <div style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:8 }}>💬 Talking Points</div>
            <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
              {(insights.talkingPoints||[]).map((p,i)=>(
                <div key={i} style={{ display:"flex",gap:10,alignItems:"flex-start",padding:"8px 12px",
                  borderRadius:8,background:"#fff",border:`1px solid ${C.border}` }}>
                  <span style={{ fontSize:11,fontWeight:800,color:C.ai,flexShrink:0,marginTop:1 }}>{i+1}</span>
                  <span style={{ fontSize:12,color:C.slate,lineHeight:1.5 }}>{p}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Risk flags */}
          {insights.riskFlags?.length > 0 && (
            <div>
              <div style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:6 }}>🚩 Risk Flags</div>
              <div style={{ display:"flex",flexDirection:"column",gap:5 }}>
                {insights.riskFlags.map((f,i)=>(
                  <div key={i} style={{ display:"flex",gap:8,alignItems:"center",padding:"7px 12px",
                    borderRadius:8,background:C.red+"06",border:`1px solid ${C.red}25`,fontSize:12,color:C.red }}>
                    <span>⚠️</span>{f}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

