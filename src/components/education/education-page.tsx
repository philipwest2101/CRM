import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Avatar } from "../ui/avatar";
import { BarChart } from "../ui/bar-chart";
import { SectionTitle } from "../ui/section-title";
import { SettingsCard } from "../ui/settings-card";
import { EDU_CATEGORIES, EDU_MEMBERS, EDU_MONTHLY, EDU_VIDEOS } from "../../lib/core";
import { C } from "../../theme";

export const EducationPage = ({ role, navigateTo }) => {
  const [activeCategory, setActiveCategory] = useState("All");
  const [sortBy,         setSortBy]         = useState("views");
  const [search,         setSearch]         = useState("");
  const [selectedVideo,  setSelectedVideo]  = useState(null);

  const totalViews       = EDU_VIDEOS.reduce((a,v)=>a+v.views,0);
  const totalCompletions = EDU_VIDEOS.reduce((a,v)=>a+v.completions,0);
  const avgCompletion    = Math.round(totalCompletions/totalViews*100);

  const filtered = EDU_VIDEOS
    .filter(v => activeCategory==="All" || v.category===activeCategory)
    .filter(v => !search || v.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a,b) => sortBy==="views" ? b.views-a.views : sortBy==="completions" ? b.completions-a.completions : b.rating-a.rating);

  const topViewed   = [...EDU_VIDEOS].sort((a,b)=>b.views-a.views).slice(0,5);
  const leastViewed = [...EDU_VIDEOS].sort((a,b)=>a.views-b.views).slice(0,5);

  const RatingStars = ({ rating }) => (
    <span style={{ fontSize:10,color:C.amber }}>
      {"★".repeat(Math.floor(rating))}{"☆".repeat(5-Math.floor(rating))}
      <span style={{ color:C.muted,marginLeft:4 }}>{rating}</span>
    </span>
  );

  const completionColor = (v) => {
    const pct = Math.round(v.completions/v.views*100);
    return pct>=70 ? C.green : pct>=50 ? C.amber : C.red;
  };
  const completionPct = (v) => Math.round(v.completions/v.views*100);

  const VideoModal = ({ video, onClose }) => (
    <div onClick={e=>e.target===e.currentTarget&&onClose()}
         style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center" }}>
      <div style={{ background:"#fff",borderRadius:16,padding:"28px 32px",width:520,maxWidth:"90vw",boxShadow:"0 20px 60px rgba(0,0,0,0.25)" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20 }}>
          <div>
            <div style={{ fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:5 }}>{video.category}</div>
            <div style={{ fontSize:16,fontWeight:800,color:C.text,lineHeight:1.3 }}>{video.title}</div>
          </div>
          <button onClick={onClose} style={{ background:"#F1F5F9",border:"none",borderRadius:8,padding:"6px 10px",cursor:"pointer",fontSize:16,color:C.muted,flexShrink:0,marginLeft:16 }}>✕</button>
        </div>
        <div style={{ borderRadius:12,background:"linear-gradient(135deg,#1E3A5F,#3B82F6)",height:200,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:20,position:"relative",overflow:"hidden" }}>
          <div style={{ position:"absolute",inset:0,opacity:0.1,fontSize:80,display:"flex",alignItems:"center",justifyContent:"center" }}>{video.thumbnail}</div>
          <div style={{ width:56,height:56,borderRadius:"50%",background:"rgba(255,255,255,0.2)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",border:"2px solid rgba(255,255,255,0.4)" }}>
            <span style={{ fontSize:22,marginLeft:4 }}>▶</span>
          </div>
          <span style={{ position:"absolute",bottom:10,right:12,fontSize:11,fontWeight:700,color:"rgba(255,255,255,0.9)",background:"rgba(0,0,0,0.4)",padding:"2px 8px",borderRadius:6 }}>{video.duration}</span>
        </div>
        <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:16 }}>
          {[["👁 Views",video.views,C.blue],["✅ Completions",video.completions,C.green],["⭐ Rating",video.rating,C.amber]].map(([l,v,c])=>(
            <div key={l} style={{ textAlign:"center",padding:"10px",borderRadius:9,background:c+"08",border:"1px solid "+c+"20" }}>
              <div style={{ fontSize:16,fontWeight:800,color:c }}>{v}</div>
              <div style={{ fontSize:10,color:C.muted,marginTop:2 }}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6 }}>
          <span style={{ fontSize:11,color:C.muted }}>Completion rate</span>
          <span style={{ fontSize:12,fontWeight:700,color:C.indigo }}>{completionPct(video)}%</span>
        </div>
        <div style={{ height:6,borderRadius:3,background:"#F1F5F9",overflow:"hidden",marginBottom:20 }}>
          <div style={{ height:"100%",width:completionPct(video)+"%",background:C.indigo,borderRadius:3 }}/>
        </div>
        <div style={{ display:"flex",gap:8 }}>
          <button style={{ flex:1,padding:"9px",borderRadius:8,border:"none",background:C.primary,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer" }}>▶ Play Video</button>
          <button style={{ padding:"9px 14px",borderRadius:8,border:"1px solid "+C.border,background:"#fff",color:C.slate,fontSize:12,fontWeight:600,cursor:"pointer" }}>📊 Full Stats</button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ padding:"24px 28px" }}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24 }}>
        <div>
          <div style={{ fontSize:11,fontWeight:700,color:C.muted,letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:4 }}>
            <span onClick={()=>navigateTo("Dashboard")} style={{ cursor:"pointer",color:C.blue }}>Dashboard</span>
            <span style={{ margin:"0 6px",color:C.border }}>›</span>Education & Training
          </div>
          <h1 style={{ margin:0,fontSize:26,fontWeight:800,color:C.navy,letterSpacing:"-0.02em" }}>Education & Training</h1>
          <p style={{ margin:"4px 0 0",fontSize:13,color:C.slate }}>Training content performance · 560 active DION members</p>
        </div>
        <button style={{ padding:"8px 16px",borderRadius:8,border:"none",background:C.primary,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer" }}>+ Upload Video</button>
      </div>

      <div style={{ display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12,marginBottom:22 }}>
        {[
          { label:"Total Videos",      value:EDU_VIDEOS.length, color:C.navy,   sub:"2 new this month"  },
          { label:"Total Views (MTD)", value:totalViews,         color:C.blue,   sub:"+18% vs Jan"       },
          { label:"Completions (MTD)", value:totalCompletions,   color:C.green,  sub:avgCompletion+"% avg rate" },
          { label:"Active Consultants",value:EDU_MEMBERS.length, color:C.indigo, sub:"of 560 total"      },
          { label:"Avg. Rating",       value:"4.6 ★",            color:C.amber,  sub:"Across all videos" },
        ].map(k=>(
          <SettingsCard key={k.label} style={{ padding:"14px 16px" }}>
            <div style={{ fontSize:10,color:C.muted,fontWeight:600,marginBottom:5,textTransform:"uppercase",letterSpacing:"0.04em" }}>{k.label}</div>
            <div style={{ fontSize:22,fontWeight:800,color:k.color }}>{k.value}</div>
            <div style={{ fontSize:10,color:C.muted,marginTop:3 }}>{k.sub}</div>
          </SettingsCard>
        ))}
      </div>

      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:22 }}>
        <SettingsCard style={{ padding:"18px 20px" }}>
          <SectionTitle>Monthly Views Trend</SectionTitle>
          <BarChart data={EDU_MONTHLY.map(m=>({l:m.month,v:m.views}))} color={C.blue} height={80}/>
          <div style={{ display:"flex",justifyContent:"space-between",marginTop:10,fontSize:11,color:C.muted }}>
            <span>Aug 2025 — Feb 2026</span>
            <span style={{ color:C.green,fontWeight:700 }}>↑ +20% vs same period last year</span>
          </div>
        </SettingsCard>
        <SettingsCard style={{ padding:"18px 20px" }}>
          <SectionTitle>Top Active DION Members — Watch Time</SectionTitle>
          <div style={{ display:"flex",gap:16,alignItems:"flex-start" }}>
            <svg width={80} height={80} style={{ flexShrink:0,marginTop:4 }}>
              {(()=>{ const circ=2*Math.PI*28; let off=0; const total=EDU_MEMBERS.reduce((a,x)=>a+x.watched,0);
                return EDU_MEMBERS.map((m,i)=>{ const dash=(m.watched/total)*circ;
                  const el=<circle key={i} cx={40} cy={40} r={28} fill="none" stroke={m.color} strokeWidth={10}
                    strokeDasharray={dash+" "+(circ-dash)} strokeDashoffset={-off+circ/4}/>;
                  off+=dash; return el; }); })()}
              <circle cx={40} cy={40} r={21} fill="#fff"/>
              <text x={40} y={44} textAnchor="middle" fontSize={9} fontWeight="bold" fill={C.text}>560</text>
            </svg>
            <div style={{ flex:1 }}>
              {EDU_MEMBERS.map((m,i)=>(
                <div key={i} style={{ display:"flex",alignItems:"center",gap:8,marginBottom:7 }}>
                  <Avatar name={m.name} size={20}/>
                  <span style={{ fontSize:11,flex:1,fontWeight:600,color:C.text,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{m.name}</span>
                  <div style={{ width:54,height:4,borderRadius:2,background:"#F1F5F9",overflow:"hidden",flexShrink:0 }}>
                    <div style={{ height:"100%",width:m.pct+"%",background:m.color,borderRadius:2 }}/>
                  </div>
                  <span style={{ fontSize:10,fontWeight:700,color:m.color,width:20,textAlign:"right",flexShrink:0 }}>{m.watched}</span>
                  <span style={{ fontSize:9,color:C.muted,width:60,textAlign:"right",flexShrink:0 }}>{m.lastActive}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ fontSize:10,color:C.muted,textAlign:"center",paddingTop:8,borderTop:"1px solid "+C.border,marginTop:4 }}>
            Sorted by videos watched · No. of Members: 560
          </div>
        </SettingsCard>
      </div>

      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:22 }}>
        <SettingsCard style={{ padding:"18px 20px" }}>
          <SectionTitle>🔥 Top Most Viewed Videos</SectionTitle>
          <table style={{ width:"100%",borderCollapse:"collapse" }}>
            <thead><tr style={{ borderBottom:"2px solid "+C.border }}>
              {["#","Title","Views","Done","Rate"].map(h=><th key={h} style={{ padding:"6px 8px",textAlign:"left",fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase" }}>{h}</th>)}
            </tr></thead>
            <tbody>{topViewed.map((v,i)=>(
              <tr key={v.id} onClick={()=>setSelectedVideo(v)}
                  style={{ borderBottom:"1px solid "+C.border,cursor:"pointer",background:i%2?"#FAFAFA":"#fff" }}
                  onMouseEnter={e=>e.currentTarget.style.background="#EFF6FF"}
                  onMouseLeave={e=>e.currentTarget.style.background=i%2?"#FAFAFA":"#fff"}>
                <td style={{ padding:"9px 8px",fontWeight:800,color:i<3?C.amber:C.muted,fontSize:13 }}>{"#"+(i+1)}</td>
                <td style={{ padding:"9px 8px" }}>
                  <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                    <span style={{ fontSize:16 }}>{v.thumbnail}</span>
                    <div><div style={{ fontSize:11,fontWeight:700,color:C.text,lineHeight:1.3 }}>{v.title}</div>
                    <div style={{ fontSize:9,color:C.muted }}>{v.duration} · {v.category}</div></div>
                  </div>
                </td>
                <td style={{ padding:"9px 8px",fontWeight:700,color:C.blue,fontSize:12 }}>{v.views}</td>
                <td style={{ padding:"9px 8px",fontWeight:700,color:C.green,fontSize:12 }}>{v.completions}</td>
                <td style={{ padding:"9px 8px" }}><span style={{ fontSize:11,fontWeight:700,color:completionColor(v) }}>{completionPct(v)}%</span></td>
              </tr>
            ))}</tbody>
          </table>
        </SettingsCard>
        <SettingsCard style={{ padding:"18px 20px" }}>
          <SectionTitle action={<span style={{ fontSize:10,color:C.amber,fontWeight:700 }}>⚠ Needs attention</span>}>📉 Least Viewed Videos</SectionTitle>
          <table style={{ width:"100%",borderCollapse:"collapse" }}>
            <thead><tr style={{ borderBottom:"2px solid "+C.border }}>
              {["Title","Views","Done","Rate",""].map(h=><th key={h} style={{ padding:"6px 8px",textAlign:"left",fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase" }}>{h}</th>)}
            </tr></thead>
            <tbody>{leastViewed.map((v,i)=>(
              <tr key={v.id} onClick={()=>setSelectedVideo(v)}
                  style={{ borderBottom:"1px solid "+C.border,cursor:"pointer",background:i%2?"#FAFAFA":"#fff" }}
                  onMouseEnter={e=>e.currentTarget.style.background="#FFF7ED"}
                  onMouseLeave={e=>e.currentTarget.style.background=i%2?"#FAFAFA":"#fff"}>
                <td style={{ padding:"9px 8px" }}>
                  <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                    <span style={{ fontSize:16 }}>{v.thumbnail}</span>
                    <div><div style={{ fontSize:11,fontWeight:700,color:C.text,lineHeight:1.3 }}>{v.title}</div>
                    <div style={{ fontSize:9,color:C.muted }}>{v.duration} · {v.category}</div></div>
                  </div>
                </td>
                <td style={{ padding:"9px 8px",fontWeight:700,color:C.amber,fontSize:12 }}>{v.views}</td>
                <td style={{ padding:"9px 8px",color:C.muted,fontSize:12 }}>{v.completions}</td>
                <td style={{ padding:"9px 8px" }}><span style={{ fontSize:11,fontWeight:700,color:completionColor(v) }}>{completionPct(v)}%</span></td>
                <td style={{ padding:"9px 8px" }}><button style={{ padding:"3px 8px",borderRadius:5,border:"none",background:C.indigo+"15",color:C.indigo,fontSize:9,fontWeight:700,cursor:"pointer" }}>Promote</button></td>
              </tr>
            ))}</tbody>
          </table>
        </SettingsCard>
      </div>

      <SettingsCard style={{ padding:"18px 20px" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14 }}>
          <div style={{ fontSize:13,fontWeight:700,color:C.text }}>All Videos <span style={{ fontSize:11,color:C.muted,fontWeight:400,marginLeft:6 }}>{filtered.length} of {EDU_VIDEOS.length}</span></div>
          <div style={{ display:"flex",gap:8,alignItems:"center" }}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search videos…"
              style={{ padding:"6px 12px",borderRadius:7,border:"1px solid "+C.border,fontSize:12,outline:"none",width:180,fontFamily:"inherit" }}/>
            <select value={sortBy} onChange={e=>setSortBy(e.target.value)}
              style={{ padding:"6px 10px",borderRadius:7,border:"1px solid "+C.border,fontSize:12,fontFamily:"inherit",background:"#fff",cursor:"pointer" }}>
              <option value="views">Sort: Views</option>
              <option value="completions">Sort: Completions</option>
              <option value="rating">Sort: Rating</option>
            </select>
          </div>
        </div>
        <div style={{ display:"flex",gap:6,flexWrap:"wrap",marginBottom:14 }}>
          {EDU_CATEGORIES.map(cat=>(
            <button key={cat} onClick={()=>setActiveCategory(cat)}
              style={{ padding:"4px 12px",borderRadius:20,border:"1.5px solid "+(activeCategory===cat?C.indigo:C.border),
                background:activeCategory===cat?C.indigo:"#fff",color:activeCategory===cat?"#fff":C.slate,
                fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>
              {cat}
            </button>
          ))}
        </div>
        <table style={{ width:"100%",borderCollapse:"collapse" }}>
          <thead><tr style={{ borderBottom:"2px solid "+C.border }}>
            {["Video","Category","Duration","Views","Completions","Rate","Rating",""].map(h=>(
              <th key={h} style={{ padding:"8px 10px",textAlign:"left",fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.04em" }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {filtered.map((v,i)=>(
              <tr key={v.id} style={{ borderBottom:"1px solid "+C.border,cursor:"pointer",background:i%2?"#FAFAFA":"#fff" }}
                  onClick={()=>setSelectedVideo(v)}
                  onMouseEnter={e=>e.currentTarget.style.background="#EFF6FF"}
                  onMouseLeave={e=>e.currentTarget.style.background=i%2?"#FAFAFA":"#fff"}>
                <td style={{ padding:"10px" }}>
                  <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                    <div style={{ width:36,height:36,borderRadius:8,background:C.primary+"10",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0 }}>{v.thumbnail}</div>
                    <div>
                      <div style={{ fontSize:12,fontWeight:700,color:C.text }}>
                        {v.title}
                        {v.isNew&&<span style={{ marginLeft:6,fontSize:9,fontWeight:700,padding:"1px 5px",borderRadius:8,background:C.green+"20",color:C.green }}>NEW</span>}
                        {v.featured&&<span style={{ marginLeft:4,fontSize:9,fontWeight:700,padding:"1px 5px",borderRadius:8,background:C.amber+"20",color:C.amber }}>⭐</span>}
                      </div>
                    </div>
                  </div>
                </td>
                <td style={{ padding:"10px" }}><span style={{ fontSize:10,padding:"2px 8px",borderRadius:10,background:C.indigo+"10",color:C.indigo,fontWeight:600,whiteSpace:"nowrap" }}>{v.category}</span></td>
                <td style={{ padding:"10px",fontSize:11,color:C.muted,fontWeight:600 }}>{v.duration}</td>
                <td style={{ padding:"10px",fontWeight:700,color:C.blue,fontSize:12 }}>{v.views}</td>
                <td style={{ padding:"10px",fontWeight:700,color:C.green,fontSize:12 }}>{v.completions}</td>
                <td style={{ padding:"10px" }}>
                  <div style={{ display:"flex",alignItems:"center",gap:6 }}>
                    <div style={{ width:48,height:5,borderRadius:2,background:"#F1F5F9",overflow:"hidden" }}>
                      <div style={{ height:"100%",width:completionPct(v)+"%",background:completionColor(v),borderRadius:2 }}/>
                    </div>
                    <span style={{ fontSize:11,fontWeight:700,color:completionColor(v) }}>{completionPct(v)}%</span>
                  </div>
                </td>
                <td style={{ padding:"10px" }}><RatingStars rating={v.rating}/></td>
                <td style={{ padding:"10px" }}>
                  <div style={{ display:"flex",gap:5 }}>
                    <button onClick={e=>{e.stopPropagation();setSelectedVideo(v);}} style={{ padding:"4px 9px",borderRadius:5,border:"none",background:C.primary,color:"#fff",fontSize:10,fontWeight:700,cursor:"pointer" }}>▶ Play</button>
                    <button onClick={e=>e.stopPropagation()} style={{ padding:"4px 8px",borderRadius:5,border:"1px solid "+C.border,background:"#fff",color:C.muted,fontSize:10,cursor:"pointer" }}>✏️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </SettingsCard>

      {selectedVideo && <VideoModal video={selectedVideo} onClose={()=>setSelectedVideo(null)}/>}
    </div>
  );
};

// ─── Lead Detail Page ─────────────────────────────────────────────────────────
// ─── Lead AI Insights Box ─────────────────────────────────────────────────────
