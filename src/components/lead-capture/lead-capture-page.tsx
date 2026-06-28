import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { LC_DUPLICATES, LC_FIELD_MAPPINGS, LC_IMPORTS, LC_SOURCES } from "../../lib/core";
import { C } from "../../theme";

export const LeadCapturePage = ({ role, navigateTo }) => {
  const [activeTab, setActiveTab] = useState("Sources");
  const [csvDrag, setCsvDrag]     = useState(false);
  const [dupes, setDupes]         = useState(LC_DUPLICATES);
  const [dupeActions, setDupeActions] = useState({});
  const totalLeads = LC_SOURCES.reduce((a,s)=>a+s.leads,0);
  const connected  = LC_SOURCES.filter(s=>s.status==="connected").length;
  const statusDot = s => {
    const m = { connected:{bg:C.green,label:"Connected"}, idle:{bg:C.amber,label:"Idle"}, error:{bg:C.red,label:"Error"} }[s]||{bg:C.muted,label:s};
    return <span style={{ display:"inline-flex",alignItems:"center",gap:5 }}><span style={{ width:8,height:8,borderRadius:"50%",background:m.bg,boxShadow:`0 0 0 3px ${m.bg}30`,display:"inline-block" }}/><span style={{ fontSize:11,color:m.bg,fontWeight:600 }}>{m.label}</span></span>;
  };
  const Bdg = ({c,bg,children})=><span style={{ fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:5,background:bg||c+"18",color:c }}>{children}</span>;

  return (
    <div style={{ padding:"24px 28px" }}>
      {/* Header */}
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20 }}>
        <div>
          <div style={{ fontSize:11,fontWeight:700,color:C.muted,letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:4 }}>Contacts · Integration</div>
          <h1 style={{ margin:0,fontSize:26,fontWeight:800,color:C.navy,letterSpacing:"-0.02em" }}>Contact Capture & Integration</h1>
          <p style={{ margin:"4px 0 0",fontSize:13,color:C.slate }}>Manage all lead sources, field mappings, and import history.</p>
        </div>
        <div style={{ display:"flex",gap:8 }}>
          <label style={{ padding:"8px 16px",borderRadius:8,border:`1.5px solid ${C.border}`,background:"#fff",color:C.slate,fontSize:12,fontWeight:600,cursor:"pointer",display:"inline-flex",gap:6 }}><input type="file" accept=".csv" style={{ display:"none" }} onChange={e=>{if(e.target.files[0]) alert("CSV uploaded: "+e.target.files[0].name);e.target.value="";}}/>⬆ CSV Upload</label>
          <button style={{ padding:"8px 16px",borderRadius:8,border:"none",background:C.primary,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer" }}>+ Add Source</button>
        </div>
      </div>

      {/* KPI Strip */}
      <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:22 }}>
        {[
          { label:"Total Contacts Captured", value:totalLeads.toLocaleString(), icon:"👥", color:C.blue   },
          { label:"Active Sources",       value:`${connected} / ${LC_SOURCES.length}`, icon:"🔗", color:C.green  },
          { label:"Contacts Today",          value:"46",  icon:"📥", color:C.indigo },
          { label:"Errors / Warnings",    value:"1",   icon:"⚠️", color:C.red   },
        ].map(k=>(
          <div key={k.label} style={{ background:"#fff",borderRadius:12,padding:"18px 20px",border:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:16 }}>
            <div style={{ width:44,height:44,borderRadius:10,background:k.color+"12",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20 }}>{k.icon}</div>
            <div>
              <div style={{ fontSize:22,fontWeight:800,color:C.navy,letterSpacing:"-0.02em" }}>{k.value}</div>
              <div style={{ fontSize:11,color:C.muted,marginTop:1 }}>{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ background:"#fff",borderRadius:12,border:`1px solid ${C.border}`,overflow:"hidden" }}>
        <div style={{ display:"flex",borderBottom:`2px solid ${C.border}`,background:"#F8FAFC" }}>
          {["Sources","Field Mapping","Import History","Duplicates"].map(t=>(
            <button key={t} onClick={()=>setActiveTab(t)}
              style={{ padding:"12px 22px",fontSize:13,fontWeight:activeTab===t?700:500,
                color:activeTab===t?C.navy:C.muted,background:"none",border:"none",
                borderBottom:activeTab===t?`2px solid ${C.primary}`:"2px solid transparent",
                marginBottom:-2,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:6 }}>
              {t}
              {t==="Duplicates" && dupes.filter(d=>!dupeActions[d.id]).length>0 && (
                <span style={{ fontSize:9,fontWeight:800,padding:"1px 6px",borderRadius:8,background:C.red,color:"#fff" }}>
                  {dupes.filter(d=>!dupeActions[d.id]).length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div style={{ padding:"20px 22px" }}>

          {/* Sources tab */}
          {activeTab==="Sources" && (
            <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14 }}>
              {LC_SOURCES.map(s=>(
                <div key={s.id} style={{ padding:"18px 20px",borderRadius:12,background:"#fff",border:`1.5px solid ${s.status==="error"?C.red+"50":C.border}`,position:"relative" }}>
                  {s.status==="error" && <div style={{ position:"absolute",top:10,right:10,width:8,height:8,borderRadius:"50%",background:C.red,boxShadow:`0 0 0 3px ${C.red}30` }}/>}
                  <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:12 }}>
                    <div style={{ width:40,height:40,borderRadius:10,background:s.color+"15",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20 }}>{s.icon}</div>
                    <div>
                      <div style={{ fontSize:14,fontWeight:700,color:C.text }}>{s.label}</div>
                      <div style={{ fontSize:11,color:C.muted }}>{s.method}</div>
                    </div>
                  </div>
                  <div style={{ display:"flex",justifyContent:"space-between",marginBottom:10 }}>
                    {statusDot(s.status)}
                    <span style={{ fontSize:11,color:C.muted }}>Last sync: {s.lastSync}</span>
                  </div>
                  <div style={{ fontSize:22,fontWeight:800,color:s.color,marginBottom:4 }}>{s.leads.toLocaleString()}</div>
                  <div style={{ fontSize:11,color:C.muted,marginBottom:12 }}>leads captured</div>
                  {s.status==="error" && (
                    <div style={{ padding:"8px 10px",borderRadius:7,background:C.red+"0A",border:`1px solid ${C.red}25`,fontSize:11,color:C.red,marginBottom:10 }}>
                      ⚠ Webhook disconnected — reconnect in Settings → Integrations
                    </div>
                  )}
                  <div style={{ display:"flex",gap:6 }}>
                    <button style={{ flex:1,padding:"6px",borderRadius:7,border:`1px solid ${C.border}`,background:"#fff",color:C.slate,fontSize:11,fontWeight:600,cursor:"pointer" }}>Configure</button>
                    {s.method==="Manual" && <button style={{ flex:1,padding:"6px",borderRadius:7,border:"none",background:s.color,color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer" }}>Upload</button>}
                    {s.status==="error" && <button style={{ flex:1,padding:"6px",borderRadius:7,border:"none",background:C.red,color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer" }}>Reconnect</button>}
                    {s.status==="connected" && <button style={{ flex:1,padding:"6px",borderRadius:7,border:"none",background:C.green,color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer" }}>Sync Now</button>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Field Mapping tab */}
          {activeTab==="Field Mapping" && (
            <div>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14 }}>
                <div style={{ fontSize:12,color:C.slate }}>Mapping incoming source fields → CRM fields. Applied globally to all sources.</div>
                <div style={{ display:"flex",gap:8 }}>
                  <select style={{ border:`1px solid ${C.border}`,borderRadius:7,padding:"6px 10px",fontSize:12,fontFamily:"inherit",color:C.slate }}>
                    <option>All Sources</option>{LC_SOURCES.map(s=><option key={s.id}>{s.label}</option>)}
                  </select>
                  <button style={{ padding:"6px 14px",borderRadius:7,border:"none",background:C.primary,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer" }}>+ Add Field</button>
                </div>
              </div>
              <table style={{ width:"100%",borderCollapse:"collapse",fontSize:12 }}>
                <thead>
                  <tr style={{ background:"#F8FAFC",borderBottom:`2px solid ${C.border}` }}>
                    {["Source Field","→","CRM Field","Type","Required",""].map(h=>(
                      <th key={h} style={{ padding:"9px 12px",textAlign:"left",fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {LC_FIELD_MAPPINGS.map((row,i)=>(
                    <tr key={row.source} style={{ borderBottom:`1px solid ${C.border}`,background:i%2?"#FAFAFA":"#fff" }}>
                      <td style={{ padding:"10px 12px",fontFamily:"monospace",color:C.indigo,fontSize:12 }}>{row.source}</td>
                      <td style={{ padding:"10px 8px",color:C.muted,fontSize:16 }}>→</td>
                      <td style={{ padding:"10px 12px",fontWeight:600,color:C.text }}>{row.crm}</td>
                      <td style={{ padding:"10px 12px" }}><Bdg c={C.muted}>{row.type}</Bdg></td>
                      <td style={{ padding:"10px 12px" }}>{row.required ? <Bdg c={C.red}>Required</Bdg> : <Bdg c={C.muted}>Optional</Bdg>}</td>
                      <td style={{ padding:"10px 12px" }}><button style={{ background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:12 }}>Edit</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ marginTop:16,padding:"12px 16px",borderRadius:8,background:"#EFF6FF",border:`1px solid ${C.blue}30`,display:"flex",gap:10,alignItems:"flex-start" }}>
                <span style={{ fontSize:16 }}>🔒</span>
                <div style={{ fontSize:12,color:"#1E40AF" }}>
                  <strong>GDPR Note:</strong> The fields <code>consent_newsletter</code> and <code>email</code> are required for Double Opt-In.
                  Contacts without newsletter consent will not receive marketing emails.
                </div>
              </div>
            </div>
          )}

          {/* Import History tab */}
          {activeTab==="Import History" && (()=>{
            const IMP_ROWS = [
              { id:"IMP-0091", name:"Q1_Campaign.xlsx",    type:"CSV / Excel",   total:1234, count:1234, date:"2026-02-03 · 14:22", resp:"John Smith",  status:"success" },
              { id:"IMP-0090", name:"Partner Companies",   type:"Google Sheets", total:150,  count:145,  date:"2026-02-02 · 09:15", resp:"Anna Müller",  status:"partial" },
              { id:"IMP-0089", name:"Partners",            type:"Google Sheets", total:67,   count:0,    date:"2026-02-01 · 16:40", resp:"John Smith",  status:"error"   },
              { id:"IMP-0088", name:"Other_2025.xlsx",     type:"CSV / Excel",   total:25,   count:25,   date:"2025-01-02 · 10:01", resp:"Anna Müller",  status:"success" },
              { id:"IMP-0087", name:"Q2 Subs 2025.xlsx",  type:"CSV / Excel",   total:4321, count:4321, date:"2026-02-03 · 14:22", resp:"John Smith",  status:"success" },
              { id:"IMP-0086", name:"Sales Deals Q2",      type:"Google Sheets", total:150,  count:90,   date:"2026-02-02 · 09:15", resp:"Anna Müller",  status:"partial" },
              { id:"IMP-0085", name:"Q1 Leads",            type:"Google Sheets", total:79,   count:0,    date:"2026-02-01 · 16:40", resp:"John Smith",  status:"error"   },
            ];
            const statusMeta = { success:{label:"Imported",color:C.green}, partial:{label:"Partial",color:C.amber}, error:{label:"Failed",color:C.red} };
            return (
            <div>
              {/* Header row with title + Import button */}
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
                <div style={{ fontSize:17,fontWeight:800,color:C.navy }}>Imports History</div>
                <label style={{ padding:"8px 20px",borderRadius:8,border:"none",background:C.primary,color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",display:"inline-flex",gap:6,alignItems:"center" }}>
                  <input type="file" accept=".csv,.xlsx" style={{ display:"none" }} onChange={e=>{if(e.target.files[0]) alert("Import started: "+e.target.files[0].name);e.target.value="";}}/>
                  Import
                </label>
              </div>

              {/* Table */}
              <div style={{ border:`1px solid ${C.border}`,borderRadius:12,overflow:"hidden" }}>
                <table style={{ width:"100%",borderCollapse:"collapse" }}>
                  <thead>
                    {/* Column headers */}
                    <tr style={{ background:"#F8FAFC",borderBottom:`1px solid ${C.border}` }}>
                      {[["Name","2fr"],["Type","1fr"],["Imported / Total","1fr"],["Date & Time","1fr"],["Responsible","1fr"],["Status","auto"],["","56px"]].map(([h])=>(
                        <th key={h} style={{ padding:"10px 14px",textAlign:"left",fontSize:12,fontWeight:700,color:C.navy,whiteSpace:"nowrap",userSelect:"none",cursor:h?"pointer":"default" }}>
                          {h}{h && <span style={{ marginLeft:4,fontSize:10,color:C.muted }}>⇅</span>}
                        </th>
                      ))}
                    </tr>
                    {/* Filter row */}
                    <tr style={{ background:"#F8FAFC",borderBottom:`2px solid ${C.border}` }}>
                      <td style={{ padding:"6px 10px" }}>
                        <div style={{ position:"relative" }}>
                          <span style={{ position:"absolute",left:8,top:"50%",transform:"translateY(-50%)",color:C.muted,fontSize:12 }}>🔍</span>
                          <input placeholder="Search name…" style={{ width:"100%",border:`1px solid ${C.border}`,borderRadius:6,padding:"5px 8px 5px 26px",fontSize:12,fontFamily:"inherit",outline:"none",boxSizing:"border-box" }}/>
                        </div>
                      </td>
                      <td style={{ padding:"6px 10px" }}>
                        <select style={{ width:"100%",border:`1px solid ${C.border}`,borderRadius:6,padding:"5px 8px",fontSize:12,fontFamily:"inherit",color:C.slate,outline:"none" }}>
                          <option value="">All Types</option>
                          <option>CSV / Excel</option>
                          <option>Google Sheets</option>
                        </select>
                      </td>
                      <td style={{ padding:"6px 10px" }}>
                        <input placeholder="e.g. 100" style={{ width:"100%",border:`1px solid ${C.border}`,borderRadius:6,padding:"5px 8px",fontSize:12,fontFamily:"inherit",outline:"none",boxSizing:"border-box" }}/>
                      </td>
                      <td style={{ padding:"6px 10px" }}>
                        <input type="text" placeholder="YYYY-MM-DD" style={{ width:"100%",border:`1px solid ${C.border}`,borderRadius:6,padding:"5px 8px",fontSize:12,fontFamily:"inherit",outline:"none",boxSizing:"border-box" }}/>
                      </td>
                      <td style={{ padding:"6px 10px" }}>
                        <select style={{ width:"100%",border:`1px solid ${C.border}`,borderRadius:6,padding:"5px 8px",fontSize:12,fontFamily:"inherit",color:C.slate,outline:"none" }}>
                          <option value="">All</option>
                          <option>John Smith</option>
                          <option>Anna Müller</option>
                        </select>
                      </td>
                      <td style={{ padding:"6px 10px" }}>
                        <select style={{ width:"100%",border:`1px solid ${C.border}`,borderRadius:6,padding:"5px 8px",fontSize:12,fontFamily:"inherit",color:C.slate,outline:"none" }}>
                          <option value="">All</option>
                          <option>Imported</option>
                          <option>Partial</option>
                          <option>Failed</option>
                        </select>
                      </td>
                      <td style={{ padding:"6px 10px",textAlign:"right" }}>
                        <div style={{ display:"inline-flex",gap:4 }}>
                          <button title="Apply" style={{ width:26,height:26,borderRadius:6,border:"none",background:C.primary,color:"#fff",cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center" }}>✓</button>
                          <button title="Reset" style={{ width:26,height:26,borderRadius:6,border:`1px solid ${C.border}`,background:"#fff",color:C.slate,cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center" }}>↺</button>
                        </div>
                      </td>
                    </tr>
                  </thead>
                  <tbody>
                    {IMP_ROWS.map((row,i)=>{
                      const sm = statusMeta[row.status];
                      const needsDownload = row.status==="partial" || row.status==="error";
                      return (
                        <tr key={row.id} style={{ borderBottom:`1px solid ${C.border}`,background:"#fff" }}
                          onMouseEnter={e=>(e.currentTarget.style.background="#F8FAFC")}
                          onMouseLeave={e=>(e.currentTarget.style.background="#fff")}>
                          <td style={{ padding:"11px 14px",fontSize:13,fontWeight:600,color:C.text }}>{row.name}</td>
                          <td style={{ padding:"11px 14px",fontSize:12,color:C.slate }}>{row.type}</td>
                          <td style={{ padding:"11px 14px",fontSize:13,fontWeight:600,color:C.text }}>
                            <span style={{ color:row.count===row.total?C.green:row.count===0?C.red:C.amber }}>
                              {row.count.toLocaleString()}
                            </span>
                            <span style={{ color:C.muted,fontWeight:400 }}> of {row.total.toLocaleString()}</span>
                          </td>
                          <td style={{ padding:"11px 14px",fontSize:12,color:C.slate,whiteSpace:"nowrap" }}>{row.date}</td>
                          <td style={{ padding:"11px 14px",fontSize:12,color:C.text }}>{row.resp}</td>
                          <td style={{ padding:"11px 14px" }}>
                            <span style={{ display:"inline-flex",alignItems:"center",gap:5,fontSize:12,fontWeight:600,
                              padding:"4px 10px",borderRadius:20,
                              background:sm.color+"15",color:sm.color,
                              border:`1px solid ${sm.color}40` }}>
                              {row.status==="success"?"✓":row.status==="partial"?"ℹ":"✗"} {sm.label}
                            </span>
                          </td>
                          <td style={{ padding:"11px 14px",textAlign:"center" }}>
                            {needsDownload && (
                              <button title="Download the error file"
                                style={{ width:28,height:28,borderRadius:7,border:`1px solid ${C.border}`,background:"#fff",color:C.slate,fontSize:14,cursor:"pointer",display:"inline-flex",alignItems:"center",justifyContent:"center" }}>
                                ↓
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Footer */}
              <div style={{ marginTop:14,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                  <span style={{ fontSize:12,color:C.text,fontWeight:500 }}>Page <span style={{ color:C.primary,textDecoration:"underline",cursor:"pointer" }}>1</span> of 1</span>
                  <button style={{ width:26,height:26,borderRadius:6,border:`1px solid ${C.border}`,background:"#fff",color:C.slate,fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>‹</button>
                  <button style={{ width:26,height:26,borderRadius:6,border:`1px solid ${C.border}`,background:"#fff",color:C.slate,fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>›</button>
                </div>
                <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                  <select style={{ border:`1px solid ${C.border}`,borderRadius:6,padding:"4px 8px",fontSize:12,fontFamily:"inherit",color:C.slate }}>
                    <option>10</option><option>25</option><option>50</option>
                  </select>
                  <span style={{ fontSize:12,color:C.slate }}>Displaying 1–7 of 7 records</span>
                </div>
              </div>
            </div>
            );
          })()}

          {/* Duplicates tab (LDM-03) */}
          {activeTab==="Duplicates" && (
            <div>
              {/* Banner */}
              {dupes.filter(d=>!dupeActions[d.id]).length > 0 ? (
                <div style={{ display:"flex",alignItems:"center",gap:12,padding:"12px 16px",borderRadius:10,background:"#FEF2F2",border:`1px solid ${C.red}30`,marginBottom:16 }}>
                  <span style={{ fontSize:22 }}>⚠️</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13,fontWeight:700,color:C.red }}>
                      {dupes.filter(d=>!dupeActions[d.id]).length} duplicate lead{dupes.filter(d=>!dupeActions[d.id]).length>1?"s":""} detected
                    </div>
                    <div style={{ fontSize:11,color:"#7f1d1d",marginTop:2 }}>
                      These leads share an email or phone number with an existing CRM record. Review and resolve to keep your pipeline clean.
                    </div>
                  </div>
                  <button onClick={()=>{const actions={}; dupes.forEach(d=>{actions[d.id]="skip";}); setDupeActions(actions);}}
                    style={{ padding:"6px 12px",borderRadius:7,border:`1px solid ${C.red}40`,background:"#fff",color:C.red,fontSize:11,fontWeight:700,cursor:"pointer",flexShrink:0 }}>
                    Skip All
                  </button>
                </div>
              ) : (
                <div style={{ display:"flex",alignItems:"center",gap:10,padding:"12px 16px",borderRadius:10,background:"#ECFDF5",border:`1px solid ${C.green}30`,marginBottom:16 }}>
                  <span>✅</span>
                  <div style={{ fontSize:13,fontWeight:700,color:C.green }}>All duplicates resolved — pipeline is clean.</div>
                </div>
              )}

              {/* Duplicate cards */}
              <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
                {dupes.map(d => {
                  const action = dupeActions[d.id];
                  return (
                    <div key={d.id} style={{ borderRadius:12,border:`1.5px solid ${action?"#E2E8F0":C.red+"40"}`,background:action?"#FAFAFA":"#fff",overflow:"hidden",opacity:action?0.65:1,transition:"opacity 0.2s" }}>
                      <div style={{ padding:"10px 16px",background:action?"#F8FAFC":C.red+"06",borderBottom:`1px solid ${action?C.border:C.red+"20"}`,display:"flex",alignItems:"center",justifyContent:"space-between" }}>
                        <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                          <span style={{ fontSize:10,fontWeight:800,padding:"2px 8px",borderRadius:8,
                            background:d.matchField==="email+phone"?C.red+"20":C.amber+"20",
                            color:d.matchField==="email+phone"?C.red:C.amber }}>
                            {d.matchField==="email"?"📧 Email match":d.matchField==="phone"?"📞 Phone match":"📧📞 Email + Phone match"}
                          </span>
                          <span style={{ fontSize:10,color:C.muted }}>from {d.source} · {d.importId}</span>
                        </div>
                        {action && <span style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase" }}>
                          {action==="merge"?"✓ Merged":action==="keep_both"?"✓ Kept both":"✗ Skipped"}
                        </span>}
                      </div>
                      <div style={{ padding:"14px 16px" }}>
                        <div style={{ display:"grid",gridTemplateColumns:"1fr auto 1fr",gap:12,alignItems:"center",marginBottom:12 }}>
                          {/* New lead */}
                          <div style={{ padding:"10px 12px",borderRadius:8,background:"#FEF2F2",border:`1px solid ${C.red}20` }}>
                            <div style={{ fontSize:9,fontWeight:800,color:C.red,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4 }}>New (incoming)</div>
                            <div style={{ fontSize:13,fontWeight:700,color:C.text }}>{d.name}</div>
                            <div style={{ fontSize:11,color:C.muted,marginTop:2 }}>{d.email}</div>
                            <div style={{ fontSize:11,color:C.muted }}>{d.phone}</div>
                          </div>
                          <div style={{ fontSize:20,color:C.muted,textAlign:"center" }}>⟷</div>
                          {/* Existing lead */}
                          <div style={{ padding:"10px 12px",borderRadius:8,background:"#EFF6FF",border:`1px solid ${C.blue}20` }}>
                            <div style={{ fontSize:9,fontWeight:800,color:C.blue,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4 }}>Existing ({d.existing})</div>
                            <div style={{ fontSize:13,fontWeight:700,color:C.text }}>{d.existingName}</div>
                            <div style={{ fontSize:11,color:C.muted,marginTop:2 }}>{d.email}</div>
                            <div style={{ fontSize:11,color:C.muted }}>{d.phone}</div>
                          </div>
                        </div>
                        {!action && (
                          <div style={{ display:"flex",gap:8 }}>
                            <button onClick={()=>setDupeActions(p=>({...p,[d.id]:"merge"}))}
                              style={{ flex:1,padding:"7px",borderRadius:7,border:"none",background:C.primary,color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer" }}>
                              🔀 Merge into existing
                            </button>
                            <button onClick={()=>setDupeActions(p=>({...p,[d.id]:"keep_both"}))}
                              style={{ flex:1,padding:"7px",borderRadius:7,border:`1px solid ${C.border}`,background:"#fff",color:C.slate,fontSize:11,fontWeight:600,cursor:"pointer" }}>
                              📋 Keep both
                            </button>
                            <button onClick={()=>setDupeActions(p=>({...p,[d.id]:"skip"}))}
                              style={{ padding:"7px 12px",borderRadius:7,border:`1px solid ${C.red}30`,background:"#fff",color:C.red,fontSize:11,fontWeight:600,cursor:"pointer" }}>
                              ✗ Skip
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
// ─── Email Templates Section (Settings → Email Templates) ────────────────────
// Journey vocabulary (label + accent colour). Single source of truth shared by
// the Email Templates screen and the Workflow rule modal.
