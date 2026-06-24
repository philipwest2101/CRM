import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { AI_NARRATIVES, agentReply, buildPipelineSystemPrompt, callClaudeAPI } from "../../lib/core";
import { C } from "../../theme";

export const FloatingAgentChat = ({ role }) => {
  const [open, setOpen]       = useState(false);
  const [messages, setMessages] = useState([{
    from:"agent",
    text:`Hi! I'm your **vion AI Agent**. Ask me anything about your leads, pipeline, or performance — or click a suggestion below.`,
    chips:["📊 My performance narrative","Which contacts should I call today?","Show hot contacts","How is my team performing?"]
  }]);
  const [input, setInput]     = useState("");
  const [thinking, setThinking] = useState(false);
  const bottomRef = useRef(null);

  useEffect(()=>{ bottomRef.current?.scrollIntoView({ behavior:"smooth" }); },[messages, thinking]);

  const send = async (msg) => {
    if (!msg.trim() || thinking) return;
    setMessages(prev=>[...prev, { from:"user", text:msg }]);
    setInput("");

    // ── Narrative chip — rich local response, no API needed ──
    if(msg==="📊 My performance narrative") {
      const n = AI_NARRATIVES[role] || AI_NARRATIVES.gp;
      setMessages(prev=>[...prev, { from:"agent", type:"narrative", narrative:n }]);
      return;
    }

    setThinking(true);
    try {
      const text = await callClaudeAPI(buildPipelineSystemPrompt(role), msg);
      setMessages(prev=>[...prev, { from:"agent", text }]);
    } catch(e) {
      // Fallback to local engine if API unavailable
      const reply = agentReply(msg, null, role);
      setMessages(prev=>[...prev, { from:"agent", ...reply }]);
    } finally {
      setThinking(false);
    }
  };

  const renderText = (text) => {
    // Bold (**text**) and newlines
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((p,i) =>
      p.startsWith("**") && p.endsWith("**")
        ? <strong key={i}>{p.slice(2,-2)}</strong>
        : p.split("\n").map((line,j)=><span key={`${i}-${j}`}>{line}{j<p.split("\n").length-1&&<br/>}</span>)
    );
  };

  return (
    <>
      {/* Floating button */}
      <button onClick={()=>setOpen(o=>!o)} style={{ position:"fixed",bottom:28,right:28,width:54,height:54,borderRadius:"50%",background:open?"#5B21B6":C.ai,border:"none",color:"#fff",fontSize:22,cursor:"pointer",boxShadow:"0 4px 20px rgba(124,58,237,0.45)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.2s" }}
        title="AI Agent">
        {open ? "×" : "🤖"}
      </button>
      {!open && (
        <div style={{ position:"fixed",bottom:90,right:28,background:C.ai,color:"#fff",fontSize:11,fontWeight:700,padding:"5px 12px",borderRadius:20,zIndex:499,whiteSpace:"nowrap",boxShadow:"0 2px 10px rgba(124,58,237,0.3)",pointerEvents:"none" }}>
          Ask AI anything ✨
        </div>
      )}

      {/* Chat panel */}
      {open && (
        <div style={{ position:"fixed",bottom:96,right:28,width:380,height:530,borderRadius:16,background:"#fff",boxShadow:"0 8px 40px rgba(0,0,0,0.18)",zIndex:500,display:"flex",flexDirection:"column",overflow:"hidden",border:`1px solid ${C.border}`,fontFamily:"inherit" }}>
          {/* Header */}
          <div style={{ padding:"14px 18px",background:`linear-gradient(135deg,#4C1D95,${C.ai})`,display:"flex",alignItems:"center",gap:10 }}>
            <div style={{ width:34,height:34,borderRadius:"50%",background:"rgba(255,255,255,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18 }}>🤖</div>
            <div>
              <div style={{ fontSize:13,fontWeight:800,color:"#fff" }}>vion AI Agent</div>
              <div style={{ fontSize:10,color:"rgba(255,255,255,0.7)" }}>Contact management assistant · always on</div>
            </div>
            <div style={{ marginLeft:"auto",width:8,height:8,borderRadius:"50%",background:"#4ADE80",boxShadow:"0 0 0 3px rgba(74,222,128,0.3)" }} />
          </div>

          {/* Messages */}
          <div style={{ flex:1,overflowY:"auto",padding:"14px 16px",display:"flex",flexDirection:"column",gap:10 }}>
            {messages.map((m,i)=>{
              /* ── Narrative card ── */
              if(m.type==="narrative" && m.narrative) {
                const n = m.narrative;
                const alertColors = { warning:C.red, insight:C.amber, success:C.green };
                return (
                  <div key={i} style={{ alignSelf:"flex-start",width:"100%" }}>
                    <div style={{ borderRadius:12,overflow:"hidden",border:`1px solid ${C.ai}30` }}>
                      {/* Header */}
                      <div style={{ padding:"12px 14px",background:`linear-gradient(135deg,#4C1D95,${C.ai})`,display:"flex",alignItems:"center",gap:8 }}>
                        <span style={{ fontSize:16 }}>📊</span>
                        <div>
                          <div style={{ fontSize:9,color:"rgba(255,255,255,0.65)",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em" }}>AI Performance Narrative</div>
                          <div style={{ fontSize:12,fontWeight:800,color:"#fff",marginTop:1 }}>{n.headline}</div>
                        </div>
                      </div>
                      {/* Body */}
                      <div style={{ padding:"12px 14px",background:"#F8FAFC",borderBottom:`1px solid ${C.border}` }}>
                        <p style={{ fontSize:11,color:C.text,lineHeight:1.65,margin:0 }}>{n.body}</p>
                      </div>
                      {/* Alert pills */}
                      <div style={{ padding:"10px 14px",display:"flex",flexDirection:"column",gap:6,background:"#fff" }}>
                        {n.alerts.map((a,j)=>(
                          <div key={j} style={{ display:"flex",alignItems:"flex-start",gap:8,padding:"7px 10px",borderRadius:8,background:(alertColors[a.type]||C.muted)+"0A",border:`1px solid ${(alertColors[a.type]||C.muted)}25` }}>
                            <span style={{ fontSize:13,flexShrink:0 }}>{a.icon}</span>
                            <span style={{ fontSize:11,color:C.text,lineHeight:1.5 }}>{a.msg}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              }
              /* ── Default text bubble ── */
              return (
                <div key={i} style={{ display:"flex",flexDirection:"column",alignItems:m.from==="user"?"flex-end":"flex-start",gap:6 }}>
                  <div style={{ maxWidth:"88%",padding:"10px 14px",borderRadius:m.from==="user"?"14px 14px 4px 14px":"14px 14px 14px 4px",background:m.from==="user"?C.ai:"#F1F5F9",color:m.from==="user"?"#fff":C.text,fontSize:12,lineHeight:1.6 }}>
                    {renderText(m.text)}
                  </div>
                  {m.chips && (
                    <div style={{ display:"flex",flexWrap:"wrap",gap:5,maxWidth:"94%" }}>
                      {m.chips.map(c=>(
                        <button key={c} onClick={()=>send(c)} style={{ padding:"4px 10px",borderRadius:20,border:`1px solid ${C.ai}40`,background:C.ai+"0C",color:C.ai,fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"inherit" }}>{c}</button>
                      ))}
                    </div>
                  )}
                  {m.actions && (
                    <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
                      {m.actions.map(a=>(
                        <button key={a.key} style={{ padding:"5px 11px",borderRadius:7,border:"none",background:C.ai,color:"#fff",fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"inherit" }}>{a.label}</button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            {thinking && (
              <div style={{ display:"flex",alignItems:"flex-start" }}>
                <div style={{ padding:"10px 16px",borderRadius:"14px 14px 14px 4px",background:"#F1F5F9",display:"flex",gap:5,alignItems:"center" }}>
                  {[0,1,2].map(i=>(
                    <div key={i} style={{ width:7,height:7,borderRadius:"50%",background:C.ai,opacity:0.7,animation:`bounce 1.2s ${i*0.2}s infinite` }}/>
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef}/>
          </div>
          <style>{`@keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-6px)}}`}</style>

          {/* Input */}
          <div style={{ padding:"10px 14px",borderTop:`1px solid ${C.border}`,display:"flex",gap:8,alignItems:"center" }}>
            <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send(input)} placeholder="Ask about contacts, pipeline, performance…" style={{ flex:1,border:`1.5px solid ${C.border}`,borderRadius:10,padding:"8px 12px",fontSize:12,fontFamily:"inherit",color:C.text,outline:"none" }} />
            <button onClick={()=>send(input)} disabled={!input.trim()||thinking} style={{ width:36,height:36,borderRadius:10,border:"none",background:input.trim()&&!thinking?C.ai:"#E2E8F0",color:"#fff",fontSize:16,cursor:input.trim()&&!thinking?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",transition:"background 0.2s",flexShrink:0 }}>↑</button>
          </div>
        </div>
      )}
    </>
  );
};

// ─── Contact Drawer ─────────────────────────────────────────────────────────────
// Module-level notes store — persists across drawer re-opens within the session
