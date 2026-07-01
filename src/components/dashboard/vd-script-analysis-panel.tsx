import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Avatar } from "../ui/avatar";
import { Card } from "../ui/card";
import { VD_GP_PERF } from "../../lib/core";
import { C } from "../../theme";

export const VDScriptAnalysisPanel = () => {
  const [selectedGP, setSelectedGP] = useState(VD_GP_PERF[0].name);
  const [aiInsight,  setAiInsight]  = useState(null);
  const [loading,    setLoading]    = useState(false);

  const gp = VD_GP_PERF.find(g => g.name === selectedGP);
  const usageRate = Math.round((gp.scriptOpens / gp.callsLogged) * 100);
  const adherenceColor = gp.adherence >= 75 ? C.green : gp.adherence >= 50 ? C.amber : C.red;
  const usageColor     = usageRate >= 75 ? C.green : usageRate >= 50 ? C.amber : C.red;

  const GAP_LABELS = { greeting:"Opening", pitch:"Pitch delivery", objection:"Objection handling", hook:"Value hook", close:"Closing / appointment ask" };

  const runAIInsight = async () => {
    setLoading(true); setAiInsight(null);
    try {
      const prompt = `You are a sales coaching director analyzing a financial services advisor's call script performance.

Advisor: ${gp.name}
Calls logged this month: ${gp.callsLogged}
Script opens: ${gp.scriptOpens} (usage rate: ${usageRate}%)
Script adherence score (from call analysis): ${gp.adherence}/100
Biggest gap identified: ${GAP_LABELS[gp.topGap] || gp.topGap}
Conversion rate: ${gp.rate}
Contacts reached: ${gp.reached} / ${gp.leads}
Appointments set: ${gp.appts}
Deals closed: ${gp.closed}
Known issue: "${gp.coachNote}"

Write a concise coaching assessment for their Sales Director. Respond ONLY with valid JSON, no markdown:
{
"headline": "<one sentence verdict max 15 words>",
"diagnosis": "<2 sentences explaining root cause of the gap>",
"impact": "<1 sentence quantifying how fixing this would affect conversion>",
"action": "<1 specific action the VD should take with this GP this week, max 20 words>",
"priority": "<high|medium|low>"
}`;

      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:400, messages:[{ role:"user", content:prompt }] }),
      });
      if (!resp.ok) throw new Error();
      const data = await resp.json();
      const text = data.content?.find(b=>b.type==="text")?.text||"";
      setAiInsight(JSON.parse(text.replace(/```json|```/g,"").trim()));
    } catch { setAiInsight({ headline:"Analysis unavailable", diagnosis:"Could not reach AI — try again.", impact:"", action:"Retry later.", priority:"low" }); }
    setLoading(false);
  };

  const PriorityColors = { high:C.red, medium:C.amber, low:C.green };

  return (
    <Card style={{ padding:"20px 22px", marginBottom:14 }}>
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
        <div>
          <div style={{ fontSize:14, fontWeight:800, color:C.text }}>📞 Script Adherence Analysis</div>
          <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>Based on recorded call analysis · {VD_GP_PERF.reduce((s,g)=>s+g.callsLogged,0)} calls this month</div>
        </div>
        <span style={{ fontSize:10, padding:"3px 10px", borderRadius:10, background:C.ai+"12", color:C.ai, fontWeight:700 }}>AI Powered</span>
      </div>

      {/* Summary row — all 3 GPs at a glance */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:18 }}>
        {VD_GP_PERF.map(g => {
          const rate = Math.round((g.scriptOpens / g.callsLogged) * 100);
          const adCol = g.adherence >= 75 ? C.green : g.adherence >= 50 ? C.amber : C.red;
          const isSelected = g.name === selectedGP;
          return (
            <div key={g.name} onClick={()=>{ setSelectedGP(g.name); setAiInsight(null); }}
              style={{ padding:"12px 14px", borderRadius:10, border:`2px solid ${isSelected ? C.ai : C.border}`, background:isSelected ? C.ai+"06" : "#FAFAFA", cursor:"pointer", transition:"all 0.15s" }}>
              <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:10 }}>
                <Avatar name={g.name} size={26}/>
                <div style={{ fontSize:12, fontWeight:700, color:C.text }}>{g.name.split(" ")[0]}</div>
                {isSelected && <span style={{ marginLeft:"auto", fontSize:9, background:C.ai, color:"#fff", padding:"1px 6px", borderRadius:8, fontWeight:700 }}>Selected</span>}
              </div>
              {/* Usage rate bar */}
              <div style={{ marginBottom:6 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                  <span style={{ fontSize:9, color:C.muted, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.04em" }}>Script Usage</span>
                  <span style={{ fontSize:10, fontWeight:700, color:rate>=75?C.green:rate>=50?C.amber:C.red }}>{rate}%</span>
                </div>
                <div style={{ height:5, borderRadius:3, background:"#F1F5F9" }}>
                  <div style={{ height:"100%", width:`${rate}%`, borderRadius:3, background:rate>=75?C.green:rate>=50?C.amber:C.red }}/>
                </div>
              </div>
              {/* Adherence bar */}
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                  <span style={{ fontSize:9, color:C.muted, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.04em" }}>Adherence</span>
                  <span style={{ fontSize:10, fontWeight:700, color:adCol }}>{g.adherence}/100</span>
                </div>
                <div style={{ height:5, borderRadius:3, background:"#F1F5F9" }}>
                  <div style={{ height:"100%", width:`${g.adherence}%`, borderRadius:3, background:adCol }}/>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail for selected GP */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
        {/* Left: stats breakdown */}
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:10 }}>
            {gp.name} — Detail
          </div>

          {/* KPI chips */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
            {[
              ["Script Opens", gp.scriptOpens, C.indigo, "📋"],
              ["Calls Logged", gp.callsLogged, C.blue,   "📞"],
              ["Usage Rate",   `${usageRate}%`, usageColor, "📊"],
              ["Adherence",    `${gp.adherence}/100`, adherenceColor, "🎯"],
            ].map(([label, val, color, icon])=>(
              <div key={label} style={{ padding:"10px 12px", borderRadius:9, background:color+"08", border:`1px solid ${color}20` }}>
                <div style={{ fontSize:10, color:C.muted, marginBottom:3 }}>{icon} {label}</div>
                <div style={{ fontSize:17, fontWeight:800, color }}>{val}</div>
              </div>
            ))}
          </div>

          {/* Gap tag */}
          <div style={{ padding:"10px 14px", borderRadius:9, background:C.red+"08", border:`1px solid ${C.red}20`, marginBottom:12 }}>
            <div style={{ fontSize:10, color:C.muted, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.04em", marginBottom:4 }}>⚠ Biggest Gap</div>
            <div style={{ fontSize:12, fontWeight:700, color:C.red }}>{GAP_LABELS[gp.topGap] || gp.topGap}</div>
            <div style={{ fontSize:11, color:C.slate, marginTop:3, lineHeight:1.5 }}>{gp.coachNote}</div>
          </div>

          {/* Script section breakdown (static representative data per GP) */}
          <div style={{ fontSize:10, color:C.muted, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.04em", marginBottom:6 }}>Section Scores (avg across calls)</div>
          {[
            { label:"Opening",      score: gp.name==="Anna Klein"?91:gp.name==="Marc Otto"?72:55 },
            { label:"Pitch",        score: gp.name==="Anna Klein"?88:gp.name==="Marc Otto"?66:40 },
            { label:"Value Hook",   score: gp.name==="Anna Klein"?85:gp.name==="Marc Otto"?60:44 },
            { label:"Objections",   score: gp.name==="Anna Klein"?79:gp.name==="Marc Otto"?41:50 },
            { label:"Close / Ask",  score: gp.name==="Anna Klein"?62:gp.name==="Marc Otto"?69:48 },
          ].map(s => {
            const col = s.score>=75?C.green:s.score>=50?C.amber:C.red;
            return (
              <div key={s.label} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                <span style={{ fontSize:11, color:C.slate, width:90, flexShrink:0 }}>{s.label}</span>
                <div style={{ flex:1, height:6, borderRadius:3, background:"#F1F5F9" }}>
                  <div style={{ height:"100%", width:`${s.score}%`, borderRadius:3, background:col }}/>
                </div>
                <span style={{ fontSize:10, fontWeight:700, color:col, width:26, textAlign:"right" }}>{s.score}</span>
              </div>
            );
          })}
        </div>

        {/* Right: AI coaching */}
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:10 }}>
            AI Coaching Assessment
          </div>

          {!aiInsight && !loading && (
            <div style={{ padding:"20px", borderRadius:10, border:`1.5px dashed ${C.ai}40`, textAlign:"center", marginBottom:10 }}>
              <div style={{ fontSize:28, marginBottom:8 }}>🤖</div>
              <div style={{ fontSize:12, fontWeight:700, color:C.text, marginBottom:4 }}>Generate Coaching Insight</div>
              <div style={{ fontSize:11, color:C.muted, marginBottom:14, lineHeight:1.5 }}>
                AI will diagnose the root cause of {gp.name.split(" ")[0]}'s gap and recommend a specific action for this week.
              </div>
              <button onClick={runAIInsight}
                style={{ padding:"9px 20px", borderRadius:8, border:"none", background:C.ai, color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer" }}>
                Analyse {gp.name.split(" ")[0]} →
              </button>
            </div>
          )}

          {loading && (
            <div style={{ padding:"30px", display:"flex", flexDirection:"column", alignItems:"center", gap:12 }}>
              <div style={{ width:36, height:36, border:`3px solid ${C.ai}30`, borderTop:`3px solid ${C.ai}`, borderRadius:"50%", animation:"spin 0.8s linear infinite" }}/>
              <div style={{ fontSize:12, color:C.muted }}>Analysing {gp.name.split(" ")[0]}'s call patterns…</div>
            </div>
          )}

          {aiInsight && (
            <div>
              {/* Priority badge + headline */}
              <div style={{ padding:"12px 14px", borderRadius:10, background:PriorityColors[aiInsight.priority]+"08", border:`1.5px solid ${PriorityColors[aiInsight.priority]}30`, marginBottom:10 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                  <span style={{ fontSize:10, fontWeight:700, color:PriorityColors[aiInsight.priority], textTransform:"uppercase", letterSpacing:"0.05em" }}>
                    {aiInsight.priority === "high" ? "🔴" : aiInsight.priority === "medium" ? "🟡" : "🟢"} {aiInsight.priority} priority
                  </span>
                  <span style={{ fontSize:9, background:C.ai+"15", color:C.ai, padding:"2px 7px", borderRadius:8, fontWeight:700 }}>AI</span>
                </div>
                <div style={{ fontSize:12, fontWeight:700, color:C.text, lineHeight:1.5 }}>{aiInsight.headline}</div>
              </div>

              {/* Diagnosis */}
              <div style={{ padding:"10px 12px", borderRadius:8, background:"#F8FAFC", border:`1px solid ${C.border}`, marginBottom:8 }}>
                <div style={{ fontSize:10, color:C.muted, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.04em", marginBottom:4 }}>🔍 Diagnosis</div>
                <div style={{ fontSize:11, color:C.text, lineHeight:1.6 }}>{aiInsight.diagnosis}</div>
              </div>

              {/* Impact */}
              {aiInsight.impact && (
                <div style={{ padding:"10px 12px", borderRadius:8, background:C.green+"08", border:`1px solid ${C.green}20`, marginBottom:8 }}>
                  <div style={{ fontSize:10, color:C.green, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.04em", marginBottom:4 }}>📈 Expected Impact</div>
                  <div style={{ fontSize:11, color:C.text, lineHeight:1.6 }}>{aiInsight.impact}</div>
                </div>
              )}

              {/* Action */}
              <div style={{ padding:"10px 12px", borderRadius:8, background:C.ai+"08", border:`1px solid ${C.ai}20`, marginBottom:10 }}>
                <div style={{ fontSize:10, color:C.ai, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.04em", marginBottom:4 }}>🎯 Action This Week</div>
                <div style={{ fontSize:12, fontWeight:600, color:C.text, lineHeight:1.5 }}>{aiInsight.action}</div>
              </div>

              <button onClick={()=>{ setAiInsight(null); }} style={{ width:"100%", padding:"7px", borderRadius:7, border:`1px solid ${C.border}`, background:"#fff", color:C.muted, fontSize:11, cursor:"pointer" }}>↺ Re-analyse</button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

// ─── SA: GDPR Expired Consent inline panel ────────────────────────────────────
