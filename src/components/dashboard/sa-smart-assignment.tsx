import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Avatar } from "../ui/avatar";
import { AI_SMART_ASSIGNMENTS } from "../../lib/core";
import { C } from "../../theme";

export const SASmartAssignment = () => {
  const [approvedIds, setApprovedIds] = useState([]);
  const [showAll,     setShowAll]     = useState(false);
  const [confirmed,   setConfirmed]   = useState(false);

  const ALL_ASSIGNMENTS = [
    ...AI_SMART_ASSIGNMENTS,
    { id:"sa3", lead:"Laura Becker",   source:"Landing Page",  campaign:"Q1 Finanz",   city:"Köln",       suggestedGP:"Ben Hartmann", reason:"Closest region match, capacity available",   confidence:78 },
    { id:"sa4", lead:"Marco Richter",  source:"Meta Ads",      campaign:"Webinar März", city:"Stuttgart",  suggestedGP:"Kai Becker",   reason:"High conversion history for this campaign",  confidence:85 },
    { id:"sa5", lead:"Petra Schulz",   source:"Event",         campaign:"Messe FFM",    city:"Frankfurt",  suggestedGP:"Anna Klein",   reason:"Regional GP with highest Messe close rate",  confidence:91 },
  ];
  const shown = showAll ? ALL_ASSIGNMENTS : AI_SMART_ASSIGNMENTS;
  const approvedCount = approvedIds.length;

  const handleConfirm = () => {
    const toAssign = approvedIds.length ? approvedIds : shown.map(a=>a.id);
    setConfirmed(true);
    setTimeout(()=>{
      setConfirmed(false);
      alert(`✅ ${toAssign.length} leads assigned successfully.\n\nWorkflows triggered:\n• Welcome email queued (language-matched)\n• 24h follow-up reminder created\n• GP notified via push notification`);
    }, 800);
  };

  return (
    <div style={{ background:"#fff",border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden" }}>
      {/* Header */}
      <div style={{ padding:"18px 22px 14px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"flex-start" }}>
        <div>
          <div style={{ fontSize:14,fontWeight:700,color:C.text,display:"flex",alignItems:"center",gap:8 }}>
            🤖 Smart Assignment
            <span style={{ fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:8,background:C.ai+"15",color:C.ai }}>AI Powered</span>
          </div>
          <div style={{ fontSize:11,color:C.muted,marginTop:3 }}>
            47 unassigned leads · AI matched by campaign, region, and GP capacity
          </div>
        </div>
        <div style={{ display:"flex",gap:8,alignItems:"center" }}>
          {/* Step 1 */}
          <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:2 }}>
            <button onClick={()=>setApprovedIds(shown.map(a=>a.id))}
              style={{ padding:"7px 14px",borderRadius:7,border:`1px solid ${C.border}`,background:"#F8FAFC",
                color:C.slate,fontSize:11,fontWeight:700,cursor:"pointer" }}>
              ☑ Select All
            </button>
            <span style={{ fontSize:9,color:C.muted }}>Step 1: review rows</span>
          </div>
          <div style={{ color:C.muted,fontSize:14 }}>→</div>
          {/* Step 2 */}
          <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:2 }}>
            <button onClick={handleConfirm} disabled={confirmed}
              style={{ padding:"7px 14px",borderRadius:7,border:"none",
                background:confirmed?"#ECFDF5":approvedCount>0?C.green:"#E2E8F0",
                color:confirmed?C.green:approvedCount>0?"#fff":C.muted,
                fontSize:11,fontWeight:700,cursor:approvedCount>0?"pointer":"default" }}>
              {confirmed?"✓ Assigned!": `⚡ Assign${approvedCount>0?` (${approvedCount})`:" Selected"}`}
            </button>
            <span style={{ fontSize:9,color:C.muted }}>Step 2: trigger workflows</span>
          </div>
        </div>
      </div>

      {/* Info strip: difference between the two buttons */}
      <div style={{ padding:"8px 22px",background:"#F8FAFC",borderBottom:`1px solid ${C.border}`,
        fontSize:11,color:C.muted,display:"flex",gap:20 }}>
        <span><strong style={{ color:C.slate }}>Select All</strong> — marks all rows as approved (visual review)</span>
        <span><strong style={{ color:C.green }}>Assign Selected</strong> — commits assignments, triggers welcome emails + reminders</span>
      </div>

      {/* Table */}
      <div style={{ overflowX:"auto" }}>
        <table style={{ width:"100%",borderCollapse:"collapse",fontSize:12 }}>
          <thead>
            <tr style={{ borderBottom:`2px solid ${C.border}`,background:"#FAFAFA" }}>
              <th style={{ width:32,padding:"8px 12px" }}/>
              {["Lead","Source · Campaign","City","Suggested GP","AI Reasoning","Confidence"].map(h=>(
                <th key={h} style={{ padding:"8px 12px",textAlign:"left",fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.04em",whiteSpace:"nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map(a=>{
              const approved = approvedIds.includes(a.id);
              return (
                <tr key={a.id} style={{ borderBottom:`1px solid ${C.border}`,background:approved?C.green+"06":"#fff",cursor:"pointer" }}
                  onClick={()=>setApprovedIds(prev=>approved?prev.filter(x=>x!==a.id):[...prev,a.id])}>
                  <td style={{ padding:"10px 12px",textAlign:"center" }}>
                    <div style={{ width:18,height:18,borderRadius:4,border:`2px solid ${approved?C.green:C.border}`,
                      background:approved?C.green:"#fff",display:"flex",alignItems:"center",justifyContent:"center",
                      fontSize:11,color:"#fff",margin:"0 auto" }}>{approved?"✓":""}</div>
                  </td>
                  <td style={{ padding:"10px 12px" }}><div style={{ display:"flex",alignItems:"center",gap:8 }}><Avatar name={a.lead} size={26}/><span style={{ fontWeight:700 }}>{a.lead}</span></div></td>
                  <td style={{ padding:"10px 12px",color:C.muted }}>{a.source} · {a.campaign}</td>
                  <td style={{ padding:"10px 12px",color:C.slate }}>{a.city}</td>
                  <td style={{ padding:"10px 12px" }}><div style={{ display:"flex",alignItems:"center",gap:6 }}><Avatar name={a.suggestedGP} size={22}/><span style={{ fontWeight:700 }}>{a.suggestedGP}</span></div></td>
                  <td style={{ padding:"10px 12px",color:C.slate,fontSize:11 }}>{a.reason}</td>
                  <td style={{ padding:"10px 12px" }}>
                    <div style={{ display:"flex",alignItems:"center",gap:6 }}>
                      <div style={{ width:40,height:4,background:"#F2F4F7",borderRadius:2,overflow:"hidden" }}>
                        <div style={{ height:"100%",width:`${a.confidence}%`,background:a.confidence>=80?C.green:a.confidence>=65?C.amber:C.red,borderRadius:2 }}/>
                      </div>
                      <span style={{ fontSize:11,fontWeight:700,color:C.ai }}>{a.confidence}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer: View All */}
      <div style={{ padding:"10px 22px",borderTop:`1px solid ${C.border}`,
        display:"flex",justifyContent:"space-between",alignItems:"center",background:"#FAFAFA" }}>
        <span style={{ fontSize:11,color:C.muted }}>
          Showing <strong style={{ color:C.text }}>{shown.length}</strong> of <strong style={{ color:C.text }}>47</strong> unassigned ·
          {approvedCount>0?<span style={{ color:C.green,fontWeight:700 }}> {approvedCount} selected</span>:" None selected"}
        </span>
        <button onClick={()=>setShowAll(v=>!v)}
          style={{ padding:"5px 14px",borderRadius:7,border:`1px solid ${C.border}`,background:"#fff",
            color:C.ai,fontSize:11,fontWeight:700,cursor:"pointer" }}>
          {showAll?"Show fewer ↑":"View all 47 →"}
        </button>
      </div>
    </div>
  );
};


// ─── VD: Smart Reassignment full cards ───────────────────────────────────────
