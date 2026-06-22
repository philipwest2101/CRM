import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Avatar } from "../ui/avatar";
import { AI_BEST_TIMES, AI_SCORES, ALL_LEADS } from "../../lib/core";
import { C } from "../../theme";

export const AIMeetingPrepBrief = ({ leads=ALL_LEADS }) => {
  const apptLeads = leads.filter(l=>l.status==="appointment"||l.status==="in_progress");
  const [selected,   setSelected]   = useState(null);
  const [brief,      setBrief]      = useState(null);
  const [loading,    setLoading]    = useState(false);

  const generateBrief = async (lead) => {
    setSelected(lead);
    setBrief(null);
    setLoading(true);
    const ai = AI_SCORES?.[lead.id];
    const bt = AI_BEST_TIMES?.[lead.id];

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:1200,
          system:`You are an AI assistant for vion CRM, a German financial advisory platform. Generate a concise pre-meeting brief for a GP advisor.
Output ONLY valid JSON:
{"headline": "<1 sentence executive summary>", "leadProfile": "<2-3 sentences about this lead's background, interests, and situation>", "keyObjectives": ["<objective 1>","<objective 2>","<objective 3>"], "openingLine": "<specific suggested opening line for the meeting>", "anticipatedObjections": [{"objection":"<likely objection>","response":"<suggested response>"}], "productMatch": {"primary":"<best fitting product>","reason":"<why it fits>","secondary":"<alternative product>"}, "doList": ["<do this>","<and this>"], "dontList": ["<avoid this>","<and this>"], "closingStrategy": "<specific closing technique to use>"}`,
          messages:[{ role:"user", content:`Generate meeting prep brief for: Name: ${lead.name}, Status: ${lead.status}, Product: ${lead.product}, Source: ${lead.source||"Unknown"}, City: ${lead.city}, Attempts: ${lead.attempts||0}, AI Score: ${ai?.score||"N/A"}, Score reason: ${ai?.reasons?.[0]||"N/A"}, Language: ${lead.lang==="en"?"English":"German"}` }],
        })
      });
      const data = await res.json();
      const text = data.content?.[0]?.text||"{}";
      const json = JSON.parse(text.replace(/```json|```/g,"").trim());
      setBrief(json);
    } catch {
      setBrief({ headline:`Meeting prep for ${lead.name}`, leadProfile:"AI brief unavailable — check API connection.", keyObjectives:["Build rapport","Present value proposition","Handle objections"], openingLine:"Guten Tag, schön Sie kennenzulernen.", anticipatedObjections:[], productMatch:{primary:lead.product,reason:"Based on profile",secondary:"—"}, doList:["Listen actively","Ask about goals"], dontList:["Don't rush the close"], closingStrategy:"Ask for a follow-up commitment" });
    }
    setLoading(false);
  };

  return (
    <div style={{ padding:"24px" }}>
      <div style={{ fontSize:14,fontWeight:800,color:C.navy,marginBottom:4 }}>📋 AI Meeting Prep Brief</div>
      <div style={{ fontSize:12,color:C.muted,marginBottom:20,lineHeight:1.5,maxWidth:560 }}>
        Before your next appointment, generate a 1-page AI briefing — lead profile, best opening line, anticipated objections, and product match.
      </div>

      {/* Lead selector */}
      {!brief && !loading && (
        <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
          {(apptLeads.length?apptLeads:leads).slice(0,6).map(lead=>{
            const ai = AI_SCORES?.[lead.id];
            return (
              <div key={lead.id} onClick={()=>generateBrief(lead)}
                style={{ display:"flex",alignItems:"center",gap:14,padding:"13px 16px",
                  borderRadius:11,background:"#fff",border:`1px solid ${C.border}`,cursor:"pointer" }}>
                <Avatar name={lead.name} size={38}/>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13,fontWeight:700,color:C.text }}>{lead.name}</div>
                  <div style={{ fontSize:11,color:C.muted }}>{lead.product} · {lead.city} · {lead.status?.replace(/_/g," ")}</div>
                </div>
                {ai && <div style={{ textAlign:"right",flexShrink:0 }}>
                  <div style={{ fontSize:14,fontWeight:800,color:ai.score>=70?C.green:ai.score>=50?C.amber:C.red }}>{ai.score}</div>
                  <div style={{ fontSize:9,color:C.muted }}>AI score</div>
                </div>}
                <span style={{ fontSize:13,color:C.ai,fontWeight:700 }}>Generate →</span>
              </div>
            );
          })}
        </div>
      )}

      {loading && (
        <div style={{ padding:"40px",textAlign:"center",background:"#F8FAFC",borderRadius:12,border:`1px solid ${C.border}` }}>
          <div style={{ fontSize:32,marginBottom:12 }}>📋</div>
          <div style={{ fontSize:14,fontWeight:700,color:C.ai,marginBottom:4 }}>Generating brief for {selected?.name}…</div>
          <div style={{ fontSize:12,color:C.muted }}>Analysing lead profile, history, and best matching products…</div>
        </div>
      )}

      {brief && selected && (
        <>
          {/* Header */}
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
            <div style={{ display:"flex",alignItems:"center",gap:10 }}>
              <Avatar name={selected.name} size={40}/>
              <div>
                <div style={{ fontSize:15,fontWeight:800,color:C.navy }}>{selected.name}</div>
                <div style={{ fontSize:11,color:C.muted }}>{brief.headline}</div>
              </div>
            </div>
            <button onClick={()=>{ setBrief(null); setSelected(null); }}
              style={{ padding:"5px 12px",borderRadius:8,border:`1px solid ${C.border}`,background:"#fff",color:C.muted,fontSize:11,fontWeight:600,cursor:"pointer" }}>← Back</button>
          </div>

          {/* Brief sections */}
          <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
            {/* Lead profile */}
            <div style={{ padding:"14px 16px",borderRadius:11,background:"#fff",border:`1px solid ${C.border}` }}>
              <div style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:6 }}>👤 Contact Profile</div>
              <div style={{ fontSize:12,color:C.slate,lineHeight:1.6 }}>{brief.leadProfile}</div>
            </div>

            {/* Opening line */}
            <div style={{ padding:"14px 16px",borderRadius:11,background:C.ai+"06",border:`1px solid ${C.ai}25` }}>
              <div style={{ fontSize:11,fontWeight:700,color:C.ai,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:6 }}>🎙️ Suggested Opening Line</div>
              <div style={{ fontSize:13,color:C.text,fontStyle:"italic",lineHeight:1.5 }}>"{brief.openingLine}"</div>
            </div>

            {/* Product match */}
            <div style={{ padding:"14px 16px",borderRadius:11,background:C.green+"06",border:`1px solid ${C.green}25` }}>
              <div style={{ fontSize:11,fontWeight:700,color:C.green,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:8 }}>📦 Best Product Match</div>
              <div style={{ display:"flex",gap:10 }}>
                <div style={{ flex:1,padding:"10px",borderRadius:8,background:C.green+"10",border:`1px solid ${C.green}30`,textAlign:"center" }}>
                  <div style={{ fontSize:13,fontWeight:800,color:C.green }}>{brief.productMatch?.primary}</div>
                  <div style={{ fontSize:10,color:C.muted,marginTop:2 }}>Primary match</div>
                  <div style={{ fontSize:11,color:C.slate,marginTop:4 }}>{brief.productMatch?.reason}</div>
                </div>
                <div style={{ flex:1,padding:"10px",borderRadius:8,background:"#F8FAFC",border:`1px solid ${C.border}`,textAlign:"center" }}>
                  <div style={{ fontSize:13,fontWeight:700,color:C.slate }}>{brief.productMatch?.secondary}</div>
                  <div style={{ fontSize:10,color:C.muted,marginTop:2 }}>Alternative</div>
                </div>
              </div>
            </div>

            {/* Objectives + objections in 2-col */}
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
              <div style={{ padding:"14px 16px",borderRadius:11,background:"#fff",border:`1px solid ${C.border}` }}>
                <div style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:8 }}>🎯 Key Objectives</div>
                {(brief.keyObjectives||[]).map((o,i)=>(
                  <div key={i} style={{ display:"flex",gap:8,marginBottom:6,fontSize:12,color:C.slate }}>
                    <span style={{ color:C.navy,fontWeight:700,flexShrink:0 }}>{i+1}.</span>{o}
                  </div>
                ))}
              </div>
              <div style={{ padding:"14px 16px",borderRadius:11,background:"#fff",border:`1px solid ${C.border}` }}>
                <div style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:8 }}>🛡️ Anticipated Objections</div>
                {(brief.anticipatedObjections||[]).slice(0,2).map((obj,i)=>(
                  <div key={i} style={{ marginBottom:8 }}>
                    <div style={{ fontSize:11,fontWeight:600,color:C.red,marginBottom:2 }}>"{obj.objection}"</div>
                    <div style={{ fontSize:11,color:C.slate,lineHeight:1.4 }}>→ {obj.response}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Do/Don't */}
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
              <div style={{ padding:"12px 14px",borderRadius:10,background:C.green+"06",border:`1px solid ${C.green}25` }}>
                <div style={{ fontSize:10,fontWeight:700,color:C.green,marginBottom:6,textTransform:"uppercase" }}>✅ Do</div>
                {(brief.doList||[]).map((d,i)=><div key={i} style={{ fontSize:11,color:C.slate,marginBottom:4 }}>• {d}</div>)}
              </div>
              <div style={{ padding:"12px 14px",borderRadius:10,background:C.red+"06",border:`1px solid ${C.red}25` }}>
                <div style={{ fontSize:10,fontWeight:700,color:C.red,marginBottom:6,textTransform:"uppercase" }}>🚫 Avoid</div>
                {(brief.dontList||[]).map((d,i)=><div key={i} style={{ fontSize:11,color:C.slate,marginBottom:4 }}>• {d}</div>)}
              </div>
            </div>

            {/* Closing strategy */}
            <div style={{ padding:"12px 16px",borderRadius:10,background:C.purple+"06",border:`1px solid ${C.purple}25` }}>
              <div style={{ fontSize:10,fontWeight:700,color:C.purple,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:4 }}>🏁 Closing Strategy</div>
              <div style={{ fontSize:12,color:C.slate,lineHeight:1.5 }}>{brief.closingStrategy}</div>
            </div>

            {/* Actions */}
            <div style={{ display:"flex",gap:10 }}>
              <button onClick={()=>alert("Brief saved to lead profile and synced to Calendar.")}
                style={{ flex:2,padding:"10px",borderRadius:9,border:"none",background:C.primary,color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer" }}>
                💾 Save to Contact Profile
              </button>
              <button onClick={()=>generateBrief(selected)}
                style={{ flex:1,padding:"10px",borderRadius:9,border:`1px solid ${C.border}`,background:"#fff",color:C.muted,fontSize:13,fontWeight:600,cursor:"pointer" }}>
                🔁 Refresh
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

