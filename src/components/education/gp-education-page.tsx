import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Avatar } from "../ui/avatar";
import { SectionTitle } from "../ui/section-title";
import { SettingsCard } from "../ui/settings-card";
import { EDU_CATEGORIES, EDU_MEMBERS, EDU_VIDEOS, GP_EDU_PROGRESS } from "../../lib/core";
import { C } from "../../theme";

export const GPEducationPage = ({ navigateTo }) => {
  const [catFilter,     setCatFilter]     = useState("All");
  const [search,        setSearch]        = useState("");
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [progress,      setProgress]      = useState(GP_EDU_PROGRESS);

  const myProgress = EDU_VIDEOS.map(v => ({ ...v, my: progress[v.id] || { status:"not_started", progressPct:0, lastWatched:null, timeSpent:null } }));

  const completed   = myProgress.filter(v => v.my.status === "completed");
  const inProgress  = myProgress.filter(v => v.my.status === "in_progress");
  const notStarted  = myProgress.filter(v => v.my.status === "not_started");
  const totalPct    = Math.round(completed.length / EDU_VIDEOS.length * 100);
  const myRank      = EDU_MEMBERS.findIndex(m => m.name === "Anna Klein") + 1;

  const catColor = { "Investment Strategy":C.indigo, "Sales Techniques":C.green, "Finance Basics":C.blue, "Product Knowledge":C.amber, "Compliance":C.purple };

  const filtered = myProgress
    .filter(v => catFilter === "All" || v.category === catFilter)
    .filter(v => !search || v.title.toLowerCase().includes(search.toLowerCase()));

  const markComplete = (id) => {
    setProgress(p => ({ ...p, [id]: { status:"completed", progressPct:100, lastWatched:"Just now", timeSpent:"—" } }));
    setSelectedVideo(null);
  };

  const StatusRing = ({ pct, size=40, strokeW=4 }) => {
    const r = (size - strokeW * 2) / 2;
    const circ = 2 * Math.PI * r;
    const color = pct === 100 ? C.green : pct > 0 ? C.blue : "#E2E8F0";
    return (
      <svg width={size} height={size} style={{ transform:"rotate(-90deg)", flexShrink:0 }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#E2E8F0" strokeWidth={strokeW}/>
        {pct > 0 && <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={strokeW}
          strokeDasharray={`${(pct/100)*circ} ${circ}`} strokeLinecap="round"/>}
      </svg>
    );
  };

  const VideoModal = ({ video, onClose }) => {
    const prog = video.my;
    return (
      <div onClick={e=>e.target===e.currentTarget&&onClose()}
           style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center" }}>
        <div style={{ background:"#fff",borderRadius:16,padding:"28px 32px",width:540,maxWidth:"90vw",boxShadow:"0 20px 60px rgba(0,0,0,0.25)" }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:18 }}>
            <div>
              <span style={{ fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:8,background:(catColor[video.category]||C.indigo)+"15",color:catColor[video.category]||C.indigo,textTransform:"uppercase",letterSpacing:"0.05em" }}>{video.category}</span>
              <div style={{ fontSize:17,fontWeight:800,color:C.text,marginTop:6,lineHeight:1.3 }}>{video.title}</div>
            </div>
            <button onClick={onClose} style={{ background:"#F1F5F9",border:"none",borderRadius:8,padding:"6px 10px",cursor:"pointer",fontSize:16,color:C.muted,flexShrink:0,marginLeft:16 }}>✕</button>
          </div>
          {/* Player area */}
          <div style={{ borderRadius:12,background:`linear-gradient(135deg,${C.navy},${C.blue})`,height:180,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:18,position:"relative",overflow:"hidden" }}>
            <div style={{ position:"absolute",inset:0,opacity:0.12,fontSize:80,display:"flex",alignItems:"center",justifyContent:"center" }}>{video.thumbnail}</div>
            <div style={{ width:54,height:54,borderRadius:"50%",background:"rgba(255,255,255,0.2)",display:"flex",alignItems:"center",justifyContent:"center",border:"2px solid rgba(255,255,255,0.4)",cursor:"pointer" }}>
              <span style={{ fontSize:22,marginLeft:4 }}>▶</span>
            </div>
            <span style={{ position:"absolute",bottom:10,right:12,fontSize:11,fontWeight:700,color:"rgba(255,255,255,0.9)",background:"rgba(0,0,0,0.4)",padding:"2px 8px",borderRadius:6 }}>{video.duration}</span>
            {prog.status==="in_progress" && (
              <div style={{ position:"absolute",bottom:0,left:0,right:0,height:4,background:"rgba(255,255,255,0.2)" }}>
                <div style={{ height:"100%",width:`${prog.progressPct}%`,background:C.amber }}/>
              </div>
            )}
          </div>
          {/* My progress */}
          <div style={{ display:"flex",alignItems:"center",gap:10,padding:"12px 16px",borderRadius:10,background:prog.status==="completed"?C.green+"08":prog.status==="in_progress"?C.amber+"08":"#F8FAFC",border:`1px solid ${prog.status==="completed"?C.green:prog.status==="in_progress"?C.amber:C.border}`,marginBottom:18 }}>
            <div style={{ position:"relative",width:44,height:44,flexShrink:0 }}>
              <StatusRing pct={prog.progressPct} size={44} strokeW={4}/>
              <div style={{ position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,color:prog.status==="completed"?C.green:C.blue }}>{prog.progressPct}%</div>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:12,fontWeight:700,color:C.text }}>
                {prog.status==="completed"?"✅ Completed":prog.status==="in_progress"?"▶ In Progress — resume watching":"Not started yet"}
              </div>
              {prog.lastWatched && <div style={{ fontSize:10,color:C.muted,marginTop:1 }}>Last watched: {prog.lastWatched}{prog.timeSpent?` · ${prog.timeSpent} watched`:""}</div>}
            </div>
          </div>
          {/* Stats */}
          <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:18 }}>
            {[["⭐ Rating",video.rating,C.amber],["👁 Total Views",video.views,C.blue],["✅ Team Completions",video.completions,C.green]].map(([l,v,c])=>(
              <div key={l} style={{ textAlign:"center",padding:"10px",borderRadius:9,background:c+"08",border:`1px solid ${c}20` }}>
                <div style={{ fontSize:16,fontWeight:800,color:c }}>{v}</div>
                <div style={{ fontSize:9,color:C.muted,marginTop:2 }}>{l}</div>
              </div>
            ))}
          </div>
          <div style={{ display:"flex",gap:8 }}>
            <button style={{ flex:1,padding:"9px",borderRadius:8,border:"none",background:C.primary,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer" }}>
              {prog.status==="in_progress"?"▶ Resume":"▶ Play Video"}
            </button>
            {prog.status !== "completed" && (
              <button onClick={()=>markComplete(video.id)} style={{ padding:"9px 14px",borderRadius:8,border:"none",background:C.green,color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer" }}>✓ Mark Complete</button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding:"24px 28px" }}>
      {/* Header */}
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24 }}>
        <div>
          <div style={{ fontSize:11,fontWeight:700,color:C.muted,letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:4 }}>
            <span onClick={()=>navigateTo("Dashboard")} style={{ cursor:"pointer",color:C.blue }}>Dashboard</span>
            <span style={{ margin:"0 6px",color:C.border }}>›</span>My Education
          </div>
          <h1 style={{ margin:0,fontSize:26,fontWeight:800,color:C.navy,letterSpacing:"-0.02em" }}>My Education</h1>
          <p style={{ margin:"4px 0 0",fontSize:13,color:C.slate }}>Track your learning progress, continue where you left off, and earn your certifications.</p>
        </div>
      </div>

      {/* KPI strip */}
      <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:22 }}>
        {[
          { label:"Videos Completed",  value:`${completed.length}/${EDU_VIDEOS.length}`, color:C.green,  sub:`${totalPct}% of library`, icon:"✅" },
          { label:"In Progress",       value:inProgress.length,                           color:C.amber,  sub:"Resume where you left off", icon:"▶️" },
          { label:"Team Rank",         value:`#${myRank}`,                                color:C.indigo, sub:"of 6 consultants · Feb",    icon:"🏆" },
          { label:"Time Spent",        value:"3.8h",                                      color:C.blue,   sub:"This month",                icon:"⏱" },
        ].map(k=>(
          <SettingsCard key={k.label} style={{ padding:"16px 20px" }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8 }}>
              <span style={{ fontSize:20 }}>{k.icon}</span>
              <div style={{ width:36,height:36,position:"relative",flexShrink:0 }}>
                {k.label==="Videos Completed" && <>
                  <StatusRing pct={totalPct} size={36} strokeW={3}/>
                  <div style={{ position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:7,fontWeight:700,color:C.green }}>{totalPct}%</div>
                </>}
              </div>
            </div>
            <div style={{ fontSize:24,fontWeight:800,color:k.color,marginBottom:3 }}>{k.value}</div>
            <div style={{ fontSize:11,fontWeight:600,color:C.text,marginBottom:2 }}>{k.label}</div>
            <div style={{ fontSize:10,color:C.muted }}>{k.sub}</div>
          </SettingsCard>
        ))}
      </div>

      <div style={{ display:"grid",gridTemplateColumns:"1fr 320px",gap:16 }}>
        {/* Left: main content */}
        <div>
          {/* Continue Watching */}
          {inProgress.length > 0 && (
            <div style={{ marginBottom:22 }}>
              <div style={{ fontSize:13,fontWeight:800,color:C.text,marginBottom:12 }}>▶ Continue Watching</div>
              <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                {inProgress.map(v=>(
                  <SettingsCard key={v.id} style={{ padding:"14px 18px",cursor:"pointer",border:`1.5px solid ${C.amber}30` }} onClick={()=>setSelectedVideo(v)}>
                    <div style={{ display:"flex",alignItems:"center",gap:14 }}>
                      <div style={{ width:44,height:44,borderRadius:10,background:`${catColor[v.category]||C.indigo}15`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0 }}>{v.thumbnail}</div>
                      <div style={{ flex:1,minWidth:0 }}>
                        <div style={{ fontSize:13,fontWeight:700,color:C.text,marginBottom:2 }}>{v.title}</div>
                        <div style={{ fontSize:10,color:C.muted }}>{v.category} · {v.duration}</div>
                        <div style={{ marginTop:6,height:4,borderRadius:2,background:"#F1F5F9",overflow:"hidden" }}>
                          <div style={{ height:"100%",width:`${v.my.progressPct}%`,background:C.amber,borderRadius:2 }}/>
                        </div>
                        <div style={{ fontSize:9,color:C.muted,marginTop:3 }}>Last watched: {v.my.lastWatched} · {v.my.progressPct}% complete</div>
                      </div>
                      <div style={{ flexShrink:0,textAlign:"right" }}>
                        <div style={{ fontSize:11,fontWeight:700,color:C.amber }}>{v.my.progressPct}%</div>
                        <button style={{ marginTop:6,padding:"5px 12px",borderRadius:6,border:"none",background:C.amber,color:"#fff",fontSize:10,fontWeight:700,cursor:"pointer" }}>Resume →</button>
                      </div>
                    </div>
                  </SettingsCard>
                ))}
              </div>
            </div>
          )}

          {/* Recommended Next */}
          <div style={{ marginBottom:22 }}>
            <div style={{ fontSize:13,fontWeight:800,color:C.text,marginBottom:12 }}>⭐ Recommended for You</div>
            <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12 }}>
              {notStarted.filter(v=>v.featured||v.isNew).slice(0,3).concat(notStarted.filter(v=>!v.featured&&!v.isNew)).slice(0,3).map(v=>(
                <SettingsCard key={v.id} style={{ cursor:"pointer" }} onClick={()=>setSelectedVideo(v)}>
                  <div style={{ height:72,background:`linear-gradient(135deg,${catColor[v.category]||C.indigo}20,${catColor[v.category]||C.indigo}08)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28 }}>{v.thumbnail}</div>
                  <div style={{ padding:"12px 14px" }}>
                    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5 }}>
                      <span style={{ fontSize:9,fontWeight:700,padding:"2px 6px",borderRadius:6,background:(catColor[v.category]||C.indigo)+"15",color:catColor[v.category]||C.indigo }}>{v.category}</span>
                      {v.isNew && <span style={{ fontSize:9,fontWeight:700,padding:"1px 5px",borderRadius:6,background:C.green+"20",color:C.green }}>NEW</span>}
                    </div>
                    <div style={{ fontSize:12,fontWeight:700,color:C.text,marginBottom:4,lineHeight:1.3 }}>{v.title}</div>
                    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                      <span style={{ fontSize:10,color:C.muted }}>{v.duration}</span>
                      <span style={{ fontSize:10,color:C.amber }}>{"★".repeat(Math.floor(v.rating))}{v.rating}</span>
                    </div>
                  </div>
                </SettingsCard>
              ))}
            </div>
          </div>

          {/* All videos table */}
          <SettingsCard style={{ padding:"18px 20px" }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14 }}>
              <div style={{ fontSize:13,fontWeight:700,color:C.text }}>All Videos <span style={{ fontSize:11,color:C.muted,fontWeight:400 }}>{filtered.length} of {EDU_VIDEOS.length}</span></div>
              <div style={{ display:"flex",gap:8 }}>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search…"
                  style={{ padding:"5px 10px",borderRadius:7,border:`1px solid ${C.border}`,fontSize:11,fontFamily:"inherit",width:160,outline:"none" }}/>
              </div>
            </div>
            {/* Category pills */}
            <div style={{ display:"flex",gap:5,flexWrap:"wrap",marginBottom:14 }}>
              {EDU_CATEGORIES.map(cat=>(
                <button key={cat} onClick={()=>setCatFilter(cat)} style={{
                  padding:"4px 11px",borderRadius:20,border:`1.5px solid ${catFilter===cat?(catColor[cat]||C.primary):C.border}`,
                  background:catFilter===cat?(catColor[cat]||C.primary)+"12":"#fff",
                  color:catFilter===cat?(catColor[cat]||C.navy):C.slate,
                  fontSize:11,fontWeight:catFilter===cat?700:400,cursor:"pointer",fontFamily:"inherit",
                }}>{cat}</button>
              ))}
            </div>
            <table style={{ width:"100%",borderCollapse:"collapse" }}>
              <thead>
                <tr style={{ borderBottom:`2px solid ${C.border}`,background:"#F8FAFC" }}>
                  {["Video","Category","Duration","Rating","My Progress","Status",""].map(h=>(
                    <th key={h} style={{ padding:"8px 10px",textAlign:"left",fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.04em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((v,i)=>{
                  const prog = v.my;
                  const statusColor = prog.status==="completed"?C.green:prog.status==="in_progress"?C.amber:C.muted;
                  const statusLabel = prog.status==="completed"?"✅ Done":prog.status==="in_progress"?"▶ In Progress":"Not started";
                  return (
                    <tr key={v.id} style={{ borderBottom:`1px solid ${C.border}`,cursor:"pointer",background:i%2?"#FAFAFA":"#fff" }}
                        onClick={()=>setSelectedVideo(v)}
                        onMouseEnter={e=>e.currentTarget.style.background="#EFF6FF"}
                        onMouseLeave={e=>e.currentTarget.style.background=i%2?"#FAFAFA":"#fff"}>
                      <td style={{ padding:"10px" }}>
                        <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                          <div style={{ width:34,height:34,borderRadius:8,background:(catColor[v.category]||C.indigo)+"15",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0 }}>{v.thumbnail}</div>
                          <div>
                            <div style={{ fontSize:12,fontWeight:700,color:C.text }}>
                              {v.title}
                              {v.isNew&&<span style={{ marginLeft:5,fontSize:9,fontWeight:700,padding:"1px 5px",borderRadius:6,background:C.green+"20",color:C.green }}>NEW</span>}
                              {v.featured&&<span style={{ marginLeft:4,fontSize:9,fontWeight:700,padding:"1px 5px",borderRadius:6,background:C.amber+"20",color:C.amber }}>⭐</span>}
                            </div>
                            {prog.lastWatched&&<div style={{ fontSize:9,color:C.muted,marginTop:1 }}>Last watched: {prog.lastWatched}</div>}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding:"10px" }}><span style={{ fontSize:10,padding:"2px 7px",borderRadius:8,background:(catColor[v.category]||C.indigo)+"12",color:catColor[v.category]||C.indigo,fontWeight:600 }}>{v.category}</span></td>
                      <td style={{ padding:"10px",fontSize:11,color:C.muted,fontWeight:600,whiteSpace:"nowrap" }}>{v.duration}</td>
                      <td style={{ padding:"10px",fontSize:11,color:C.amber,whiteSpace:"nowrap" }}>{"★".repeat(Math.floor(v.rating))} {v.rating}</td>
                      <td style={{ padding:"10px",minWidth:100 }}>
                        <div style={{ display:"flex",alignItems:"center",gap:6 }}>
                          <div style={{ flex:1,height:5,borderRadius:3,background:"#F1F5F9",overflow:"hidden" }}>
                            <div style={{ height:"100%",width:`${prog.progressPct}%`,background:statusColor,borderRadius:3 }}/>
                          </div>
                          <span style={{ fontSize:10,fontWeight:700,color:statusColor,width:28,textAlign:"right",flexShrink:0 }}>{prog.progressPct}%</span>
                        </div>
                      </td>
                      <td style={{ padding:"10px" }}>
                        <span style={{ fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:8,
                          background:prog.status==="completed"?C.green+"15":prog.status==="in_progress"?C.amber+"15":"#F1F5F9",
                          color:statusColor,whiteSpace:"nowrap" }}>{statusLabel}</span>
                      </td>
                      <td style={{ padding:"10px" }}>
                        <button onClick={e=>{e.stopPropagation();setSelectedVideo(v);}} style={{ padding:"4px 9px",borderRadius:5,border:"none",background:prog.status==="in_progress"?C.amber:C.primary,color:"#fff",fontSize:10,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap" }}>
                          {prog.status==="in_progress"?"Resume":"▶ Play"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </SettingsCard>
        </div>

        {/* Right sidebar */}
        <div style={{ display:"flex",flexDirection:"column",gap:14,alignSelf:"flex-start",position:"sticky",top:24 }}>
          {/* My progress gauge */}
          <SettingsCard style={{ padding:"18px 20px" }}>
            <SectionTitle>My Progress</SectionTitle>
            <div style={{ display:"flex",flexDirection:"column",alignItems:"center",padding:"8px 0 12px" }}>
              <div style={{ position:"relative",width:110,height:110,marginBottom:12 }}>
                <svg width={110} height={110} style={{ transform:"rotate(-90deg)" }}>
                  <circle cx={55} cy={55} r={44} fill="none" stroke="#E2E8F0" strokeWidth={10}/>
                  <circle cx={55} cy={55} r={44} fill="none" stroke={totalPct===100?C.green:C.green} strokeWidth={10}
                    strokeDasharray={`${(totalPct/100)*2*Math.PI*44} ${2*Math.PI*44}`} strokeLinecap="round"/>
                </svg>
                <div style={{ position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center" }}>
                  <span style={{ fontSize:22,fontWeight:800,color:C.green }}>{totalPct}%</span>
                  <span style={{ fontSize:9,color:C.muted }}>complete</span>
                </div>
              </div>
              {[
                { label:"Completed",   value:completed.length,  color:C.green },
                { label:"In Progress", value:inProgress.length, color:C.amber },
                { label:"Not Started", value:notStarted.length, color:C.muted },
              ].map(s=>(
                <div key={s.label} style={{ display:"flex",justifyContent:"space-between",width:"100%",padding:"5px 0",borderBottom:`1px solid ${C.border}` }}>
                  <div style={{ display:"flex",alignItems:"center",gap:6 }}>
                    <div style={{ width:8,height:8,borderRadius:2,background:s.color }}/>
                    <span style={{ fontSize:11,color:C.text }}>{s.label}</span>
                  </div>
                  <span style={{ fontSize:12,fontWeight:700,color:s.color }}>{s.value}</span>
                </div>
              ))}
            </div>
          </SettingsCard>

          {/* Team leaderboard */}
          <SettingsCard style={{ padding:"18px 20px" }}>
            <SectionTitle>Team Leaderboard 🏆</SectionTitle>
            {EDU_MEMBERS.map((m,i)=>{
              const isMe = m.name === "Anna Klein";
              return (
                <div key={m.name} style={{ display:"flex",alignItems:"center",gap:9,padding:"8px 10px",borderRadius:9,
                  background:isMe?C.green+"08":i%2===0?"#fff":"#FAFAFA",
                  border:`1px solid ${isMe?C.green+"30":C.border}`,marginBottom:5 }}>
                  <span style={{ fontSize:12,fontWeight:800,color:i<3?C.amber:C.muted,width:18,textAlign:"center",flexShrink:0 }}>#{i+1}</span>
                  <Avatar name={m.name} size={26}/>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ fontSize:11,fontWeight:isMe?800:600,color:isMe?C.green:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>
                      {m.name}{isMe&&<span style={{ fontSize:9,marginLeft:5,color:C.green }}>(you)</span>}
                    </div>
                    <div style={{ fontSize:9,color:C.muted }}>{m.completions} completed · {m.lastActive}</div>
                  </div>
                  <span style={{ fontSize:11,fontWeight:700,color:m.color,flexShrink:0 }}>{m.watched} <span style={{ fontSize:9,fontWeight:400,color:C.muted }}>videos</span></span>
                </div>
              );
            })}
          </SettingsCard>

          {/* Progress by category */}
          <SettingsCard style={{ padding:"18px 20px" }}>
            <SectionTitle>Progress by Category</SectionTitle>
            {Object.entries(catColor).map(([cat, color])=>{
              const catVideos = myProgress.filter(v=>v.category===cat);
              const done = catVideos.filter(v=>v.my.status==="completed").length;
              const pct = catVideos.length ? Math.round(done/catVideos.length*100) : 0;
              return (
                <div key={cat} style={{ marginBottom:11 }}>
                  <div style={{ display:"flex",justifyContent:"space-between",marginBottom:3 }}>
                    <span style={{ fontSize:11,color:C.text,fontWeight:600 }}>{cat}</span>
                    <span style={{ fontSize:10,fontWeight:700,color }}>{done}/{catVideos.length}</span>
                  </div>
                  <div style={{ height:5,borderRadius:3,background:"#F1F5F9",overflow:"hidden" }}>
                    <div style={{ height:"100%",width:`${pct}%`,background:color,borderRadius:3 }}/>
                  </div>
                </div>
              );
            })}
          </SettingsCard>
        </div>
      </div>

      {selectedVideo && <VideoModal video={selectedVideo} onClose={()=>setSelectedVideo(null)}/>}
    </div>
  );
};


