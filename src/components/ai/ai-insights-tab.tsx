import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { AIMeetingPrepBrief } from "./ai-meeting-prep-brief";
import { AIObjectionRoleplay } from "./ai-objection-roleplay";
import { VoiceToCRM } from "./voice-to-crm";
import { Avatar } from "../ui/avatar";
import { AI_BEST_TIMES, AI_EMAIL_DRAFTS, ALL_LEADS } from "../../lib/core";
import { C } from "../../theme";

export const AIInsightsTab = ({ role }) => {
  const [emailLead, setEmailLead]   = useState(null);
  const [emailCopied, setEmailCopied] = useState(false);
  const [aiSubTab,  setAiSubTab]    = useState("insights"); // insights | roleplay | voice | brief
  const myLeads   = ALL_LEADS.filter(l=>l.assignedGP==="Anna Klein");
  const myVDLeads = ALL_LEADS.filter(l=>l.assignedGP==="Thomas Müller");
  const emailDraft = emailLead ? (AI_EMAIL_DRAFTS[emailLead.id]||AI_EMAIL_DRAFTS.default) : null;

  const copyEmail = () => {
    if(emailDraft) { navigator.clipboard?.writeText(`${emailDraft.subject}\n\n${emailDraft.body}`).catch(()=>{}); setEmailCopied(true); setTimeout(()=>setEmailCopied(false),2000); }
  };

  const SUB_TABS = [
    { id:"insights",  label:"📊 Insights",       desc:"Scores, timing, email drafts"    },
    { id:"roleplay",  label:"🎭 Objection Roleplay", desc:"Practice with AI as contact"     },
    { id:"voice",     label:"🎙️ Voice-to-CRM",    desc:"Dictate call notes"             },
    { id:"brief",     label:"📋 Appointment Prep",    desc:"AI brief before appointments"   },
  ];

  return (
    <div style={{ padding:"24px 0" }}>
      {/* Sub-tab nav */}
      <div style={{ display:"flex",gap:8,marginBottom:24,flexWrap:"wrap" }}>
        {SUB_TABS.map(t=>(
          <button key={t.id} onClick={()=>setAiSubTab(t.id)}
            style={{ padding:"8px 16px",borderRadius:9,border:`1.5px solid ${aiSubTab===t.id?C.ai:C.border}`,
              background:aiSubTab===t.id?C.ai+"08":"#fff",
              color:aiSubTab===t.id?C.ai:C.muted,
              fontSize:12,fontWeight:aiSubTab===t.id?700:400,cursor:"pointer",fontFamily:"inherit",
              display:"flex",flexDirection:"column",alignItems:"flex-start",gap:2,minWidth:130 }}>
            <span style={{ fontSize:13 }}>{t.label}</span>
            <span style={{ fontSize:10,color:aiSubTab===t.id?C.ai:C.muted,fontWeight:400 }}>{t.desc}</span>
          </button>
        ))}
      </div>

      {/* New AI features */}
      {aiSubTab==="roleplay" && <AIObjectionRoleplay/>}
      {aiSubTab==="voice"    && <VoiceToCRM leads={role==="gp"?myLeads:myVDLeads}/>}
      {aiSubTab==="brief"    && <AIMeetingPrepBrief leads={role==="gp"?myLeads:myVDLeads}/>}

      {/* Existing insights grid */}
      {aiSubTab==="insights" && (
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:16 }}>

        {/* Best Contact Time */}
        <div style={{ padding:"20px 24px",borderRadius:12,background:"#fff",border:`1px solid ${C.border}` }}>
          <div style={{ fontSize:13,fontWeight:800,color:C.text,marginBottom:4 }}>⏰ Best Contact Windows</div>
          <div style={{ fontSize:11,color:C.muted,marginBottom:14 }}>AI analysis of ZIP code + campaign reach patterns + time-of-day data.</div>
          {(role==="gp"?myLeads:myVDLeads).filter(l=>AI_BEST_TIMES[l.id]).slice(0,4).map((l)=>{
            const bt=AI_BEST_TIMES[l.id];
            return (
              <div key={l.id} style={{ padding:"11px 14px",borderRadius:10,border:`1px solid ${C.border}`,background:"#FAFAFA",marginBottom:8,display:"flex",gap:12,alignItems:"center" }}>
                <Avatar name={l.name} size={32} />
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12,fontWeight:700,color:C.text }}>{l.name}</div>
                  <div style={{ fontSize:11,color:C.muted,marginTop:1 }}>{bt.reason}</div>
                </div>
                <div style={{ textAlign:"right",flexShrink:0 }}>
                  <div style={{ fontSize:13,fontWeight:800,color:C.navy }}>{bt.window}</div>
                  <div style={{ fontSize:10,color:C.muted }}>{bt.day} · {bt.confidence}% match</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Email Draft Generator */}
        <div style={{ padding:"20px 24px",borderRadius:12,background:"#fff",border:`1px solid ${C.border}` }}>
          <div style={{ fontSize:13,fontWeight:800,color:C.text,marginBottom:4 }}>✉️ AI Email Drafts</div>
          <div style={{ fontSize:11,color:C.muted,marginBottom:14 }}>Personalised follow-up emails per lead. Review, edit, then send.</div>
          <div style={{ display:"flex",flexDirection:"column",gap:6,marginBottom:emailLead?14:0 }}>
            {(role==="gp"?myLeads:myVDLeads).filter(l=>!["closed","no_interest"].includes(l.status)).slice(0,4).map(l=>(
              <div key={l.id} onClick={()=>setEmailLead(l===emailLead?null:l)} style={{ padding:"9px 14px",borderRadius:9,border:`1.5px solid ${emailLead?.id===l.id?C.ai:C.border}`,background:emailLead?.id===l.id?C.ai+"08":"#FAFAFA",cursor:"pointer",display:"flex",alignItems:"center",gap:10 }}>
                <Avatar name={l.name} size={28} />
                <div style={{ flex:1 }}><div style={{ fontSize:12,fontWeight:700,color:C.text }}>{l.name}</div><div style={{ fontSize:11,color:C.muted }}>{l.campaign}</div></div>
                <span style={{ fontSize:11,color:emailLead?.id===l.id?C.ai:C.muted,fontWeight:700 }}>{emailLead?.id===l.id?"▲ Hide":"Draft →"}</span>
              </div>
            ))}
          </div>
          {emailLead && emailDraft && (
            <div style={{ padding:"14px",borderRadius:10,background:C.ai+"06",border:`1.5px solid ${C.ai}25`,marginTop:6 }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10 }}>
                <div style={{ fontSize:11,fontWeight:700,color:C.ai }}>🤖 Generated for {emailLead.name}</div>
                <span style={{ fontSize:10,padding:"2px 8px",borderRadius:10,background:C.ai+"15",color:C.ai,fontWeight:700 }}>{emailDraft.tone}</span>
              </div>
              <div style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",marginBottom:4 }}>Subject</div>
              <div style={{ padding:"7px 10px",borderRadius:6,background:"#fff",border:`1px solid ${C.border}`,fontSize:12,fontWeight:600,color:C.text,marginBottom:10 }}>{emailDraft.subject}</div>
              <div style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",marginBottom:4 }}>Body</div>
              <pre style={{ padding:"10px 12px",borderRadius:6,background:"#fff",border:`1px solid ${C.border}`,fontSize:11,color:C.slate,lineHeight:1.7,whiteSpace:"pre-wrap",fontFamily:"inherit",margin:"0 0 12px" }}>{emailDraft.body}</pre>
              <div style={{ display:"flex",gap:8 }}>
                <button onClick={copyEmail} style={{ flex:1,padding:"8px",borderRadius:7,border:"none",background:emailCopied?C.green:C.ai,color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer" }}>{emailCopied?"✓ Copied!":"📋 Copy Email"}</button>
                <button style={{ padding:"8px 14px",borderRadius:7,border:`1px solid ${C.border}`,background:"#fff",color:C.slate,fontSize:11,fontWeight:600,cursor:"pointer" }}>✏️ Edit</button>
                <button style={{ padding:"8px 14px",borderRadius:7,border:"none",background:C.green,color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer" }}>📤 Send</button>
              </div>
            </div>
          )}
        </div>

      </div>
      )} {/* end aiSubTab==="insights" */}
    </div>
  );
};
