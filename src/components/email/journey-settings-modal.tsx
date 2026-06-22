import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { C } from "../../theme";

export const JourneySettingsModal = ({ journey, onSave, onClose }) => {
  const [trigger, setTrigger] = useState(journey.trigger);
  const [delay,   setDelay]   = useState(journey.delay);
  const [sender,  setSender]  = useState("anna.klein@personalmail.de");
  const [replyTo, setReplyTo] = useState("anna.klein@personalmail.de");
  const [maxSend, setMaxSend] = useState("1");

  return (
    <>
      <div onClick={onClose} style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:500 }}/>
      <div style={{ position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:480,maxHeight:"85vh",background:"#fff",borderRadius:14,boxShadow:"0 20px 60px rgba(0,0,0,0.18)",zIndex:600,display:"flex",flexDirection:"column",fontFamily:"inherit",overflow:"hidden" }}>
        <div style={{ padding:"16px 20px",background:`linear-gradient(135deg,${journey.color},${journey.color}CC)`,display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0 }}>
          <div>
            <div style={{ fontSize:10,color:"rgba(255,255,255,0.7)",fontWeight:700,textTransform:"uppercase",marginBottom:2 }}>Journey Settings</div>
            <div style={{ fontSize:15,fontWeight:800,color:"#fff" }}>⚙ {journey.title}</div>
          </div>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,0.2)",border:"none",color:"#fff",fontSize:18,cursor:"pointer",borderRadius:8,width:30,height:30,display:"flex",alignItems:"center",justifyContent:"center" }}>×</button>
        </div>
        <div style={{ flex:1,overflowY:"auto",padding:"20px" }}>
          {[
            ["Trigger condition", trigger, setTrigger, "text"],
            ["Send delay",        delay,   setDelay,   "text"],
            ["Send from (email)", sender,  setSender,  "email"],
            ["Reply-to address",  replyTo, setReplyTo, "email"],
            ["Max sends per lead",maxSend, setMaxSend, "number"],
          ].map(([label,val,setter,type])=>(
            <div key={label} style={{ marginBottom:16 }}>
              <label style={{ display:"block",fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:5 }}>{label}</label>
              <input type={type} value={val} onChange={e=>setter(e.target.value)}
                style={{ width:"100%",border:`1px solid ${C.border}`,borderRadius:7,padding:"9px 11px",fontSize:13,fontFamily:"inherit",color:C.text,boxSizing:"border-box" }}/>
            </div>
          ))}
          <div style={{ padding:"12px 14px",borderRadius:8,background:"#FFFBEB",border:`1px solid ${C.amber}30`,fontSize:11,color:C.slate }}>
            ⚠️ Changes take effect on the next triggered send. Leads already in this journey are not affected.
          </div>
        </div>
        <div style={{ padding:"14px 20px",borderTop:`1px solid ${C.border}`,display:"flex",gap:10,justifyContent:"flex-end",flexShrink:0 }}>
          <button onClick={onClose} style={{ padding:"8px 18px",borderRadius:7,border:`1px solid ${C.border}`,background:"#fff",color:C.slate,fontSize:12,fontWeight:600,cursor:"pointer" }}>Cancel</button>
          <button onClick={()=>onSave({trigger,delay,sender,replyTo,maxSend})}
            style={{ padding:"8px 20px",borderRadius:7,border:"none",background:journey.color,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer" }}>
            ✓ Save Settings
          </button>
        </div>
      </div>
    </>
  );
};

