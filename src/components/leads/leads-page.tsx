import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { StatsPanel } from "../dashboard/stats-panel";
import { FloatingAgentChat } from "../layout/floating-agent-chat";
import { LeadDrawer } from "./lead-drawer";
import { OutboundCallModal } from "./outbound-call-modal";
import { Avatar } from "../ui/avatar";
import { Card } from "../ui/card";
import { ModePill } from "../ui/mode-pill";
import { ScoreBadge } from "../ui/score-badge";
import { StatusBadge } from "../ui/status-badge";
import { AI_SCORES, ALL_LEADS, ALL_SOURCES, LABELS_STORE, LEAD_LABELS_STORE, STATUS_META } from "../../lib/core";
import { C } from "../../theme";

export const LeadsPage = ({ role, navigateTo }) => {
  const [vdMode, setVdMode]           = useState("personal");
  const [activeTab, setActiveTab]     = useState(role==="superadmin"?"All Leads":"My Leads");
  const [selectedLead, setSelectedLead] = useState(null);
  const [drawerTab, setDrawerTab]     = useState("Overview");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSource, setFilterSource] = useState("all");
  const [filterLabel,  setFilterLabel]  = useState("all");
  const [search, setSearch]           = useState("");
  const [callLead, setCallLead]       = useState(null);
  const [leadLabels,  setLeadLabels]  = useState(Object.assign({}, LEAD_LABELS_STORE));

  const toggleLeadLabel = (leadId, labelId) => {
    setLeadLabels(prev => {
      const cur = prev[leadId] || [];
      const next = cur.includes(labelId) ? cur.filter(x=>x!==labelId) : [...cur, labelId];
      LEAD_LABELS_STORE[leadId] = next;
      return { ...prev, [leadId]: next };
    });
  };

  const handleModeChange=(m)=>{setVdMode(m);setActiveTab(m==="personal"?"My Leads":"All Leads");setFilterStatus("all");setFilterSource("all");setSearch("");};
  const openDrawer=(lead, tab="Overview")=>{ setSelectedLead(lead); setDrawerTab(tab); };

  const tabsFor=()=>{
    if(role==="superadmin") return ["All Leads","Unassigned","By VD","By Campaign"];
    if(role==="gp")         return ["My Leads","Follow-Up","Appointments"];
    return vdMode==="personal"
      ? ["My Leads","Follow-Up","Appointments"]
      : ["All Leads","Unassigned","By Consultant"];
  };
  const isStatsTab = false;
  const cfg={superadmin:C.navy,vd:C.indigo,gp:C.green}[role];
  const myPersonal=ALL_LEADS.filter(l=>l.assignedVD==="Thomas Müller"&&l.assignedGP==="Thomas Müller");
  const myGP=ALL_LEADS.filter(l=>l.assignedGP==="Anna Klein");

  const filteredLeads=ALL_LEADS.filter(l=>{
    if(role==="gp"&&l.assignedGP!=="Anna Klein") return false;
    if(role==="vd"){if(l.assignedVD!=="Thomas Müller") return false; if(vdMode==="personal"&&l.assignedGP!=="Thomas Müller") return false;}
    if(activeTab==="Unassigned")   return !l.assignedGP;
    if(activeTab==="My Leads")     return role==="gp"?l.assignedGP==="Anna Klein":l.assignedGP==="Thomas Müller";
    if(activeTab==="Follow-Up")    return l.status==="followup";
    if(activeTab==="Appointments") return l.status==="appointment";
    if(filterStatus!=="all"&&l.status!==filterStatus) return false;
    if(filterSource!=="all"&&l.source!==filterSource)  return false;
    if(filterLabel!=="all"&&!(l.labels||[]).includes(filterLabel)) return false;
    if(search&&!l.name.toLowerCase().includes(search.toLowerCase())&&!l.email.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }).sort((a,b)=>(AI_SCORES[b.id]?.score||0)-(AI_SCORES[a.id]?.score||0));

  const kpis=
    role==="superadmin"?[{l:"Total Leads",v:ALL_LEADS.length,c:C.navy},{l:"Unassigned",v:ALL_LEADS.filter(l=>!l.assignedGP).length,c:C.red},{l:"In Progress",v:ALL_LEADS.filter(l=>["in_progress","attempted"].includes(l.status)).length,c:C.blue},{l:"Closed (MTD)",v:ALL_LEADS.filter(l=>l.status==="closed").length,c:C.green}]
    :role==="vd"&&vdMode==="personal"?[{l:"My Leads",v:myPersonal.length,c:C.indigo},{l:"Follow-Ups",v:myPersonal.filter(l=>l.status==="followup").length,c:C.amber},{l:"Appointments",v:myPersonal.filter(l=>l.status==="appointment").length,c:C.blue},{l:"Closed (MTD)",v:myPersonal.filter(l=>l.status==="closed").length,c:C.green}]
    :role==="vd"?[{l:"Team Leads",v:"890",c:C.navy},{l:"Unassigned",v:"12",c:C.red},{l:"Appointments",v:"54",c:C.blue},{l:"Closed (MTD)",v:"34",c:C.green}]
    :[{l:"My Leads",v:myGP.length,c:C.green},{l:"Follow-Ups",v:myGP.filter(l=>l.status==="followup").length,c:C.amber},{l:"Appointments",v:myGP.filter(l=>l.status==="appointment").length,c:C.indigo},{l:"Closed",v:myGP.filter(l=>l.status==="closed").length,c:C.navy}];

  const showAssignCol=role==="superadmin"||(role==="vd"&&vdMode==="team");
  return (
    <div style={{ padding:"24px 28px" }}>
      {/* Breadcrumb */}
      <div style={{ display:"flex",alignItems:"center",gap:6,fontSize:12,color:C.muted,marginBottom:20 }}>
        <span onClick={()=>navigateTo("Dashboard")} style={{ cursor:"pointer",color:C.blue,fontWeight:600 }}>Dashboard</span>
        <span>›</span><span style={{ color:C.text,fontWeight:600 }}>Lead Management</span>
        <span style={{ marginLeft:6,fontSize:11,padding:"2px 8px",borderRadius:12,background:cfg+"18",color:cfg,fontWeight:700 }}>{{superadmin:"Super Admin",vd:"Sales Director",gp:"Consultant"}[role]}</span>
        {role==="vd"&&<span style={{ fontSize:11,padding:"2px 8px",borderRadius:12,background:vdMode==="personal"?C.indigo+"15":C.primary+"15",color:vdMode==="personal"?C.indigo:C.navy,fontWeight:700 }}>{vdMode==="personal"?"👤 My Leads":"👥 My Team"}</span>}
      </div>
      {/* Header */}
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:22 }}>
        <div>
          <h1 style={{ margin:0,fontSize:24,fontWeight:800,color:C.navy,letterSpacing:"-0.02em" }}>Lead Management</h1>
          <p style={{ margin:"4px 0 0",fontSize:13,color:C.slate }}>
            {role==="superadmin"&&"Full org view — assign, monitor and control all leads."}
            {role==="vd"&&vdMode==="personal"&&"Your personal pipeline — contact, schedule, and log outcomes."}
            {role==="vd"&&vdMode==="team"&&"Your team's pipeline — assign to consultants and track progress."}
            {role==="gp"&&"Your personal pipeline — sorted by AI priority score."}
          </p>
        </div>
        <div style={{ display:"flex",gap:10,alignItems:"center" }}>
          {role==="vd"&&<ModePill mode={vdMode} onChange={handleModeChange} />}
          {role==="superadmin" && <button onClick={()=>navigateTo("LeadCapture")} style={{ padding:"8px 14px",borderRadius:7,border:`1px solid ${C.border}`,background:"#fff",color:C.slate,fontSize:12,fontWeight:600,cursor:"pointer" }}>📥 Lead Capture</button>}
          {(role==="superadmin"||(role==="vd"&&vdMode==="team"))
            ?<button onClick={()=>navigateTo("AutoAssign")} style={{ padding:"8px 14px",borderRadius:7,border:"none",background:C.primary,color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer" }}>⚡ Auto-Assign by ZIP</button>
            :<button onClick={()=>{ const top=filteredLeads.find(l=>!["closed","no_interest"].includes(l.status)); if(top)openDrawer(top,"🤖 AI"); }} style={{ padding:"8px 14px",borderRadius:7,border:"none",background:C.ai,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:6 }}>🤖 AI Call Script</button>}
        </div>
      </div>
      {/* KPI cards */}
      <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:22 }}>
        {kpis.map(k=>(
          <Card key={k.l} style={{ padding:"16px 20px",borderLeft:`4px solid ${k.c}` }}>
            <div style={{ fontSize:11,color:C.muted,fontWeight:600,marginBottom:6 }}>{k.l}</div>
            <div style={{ fontSize:28,fontWeight:800,color:k.c,letterSpacing:"-0.02em" }}>{k.v}</div>
          </Card>
        ))}
      </div>
      {/* AI info banner for GP/VD personal */}
      {(role==="gp"||(role==="vd"&&vdMode==="personal")) && (
        <div style={{ padding:"11px 16px",borderRadius:8,background:C.ai+"08",border:`1px solid ${C.ai}20`,marginBottom:16,display:"flex",alignItems:"center",gap:10 }}>
          <span style={{ fontSize:16 }}>🤖</span>
          <span style={{ fontSize:12,color:C.ai,fontWeight:600 }}>Leads sorted by AI Priority Score — highest opportunity first.</span>
          <span style={{ marginLeft:"auto",fontSize:11,color:C.muted }}>Score = source intent + campaign + region + engagement history</span>
        </div>
      )}
      {/* Main card */}
      <Card>
        <div style={{ display:"flex",borderBottom:`2px solid ${C.border}`,padding:"0 20px" }}>
          {tabsFor().map(t=>{
            const isStats=t.startsWith("📊");
            return <button key={t} onClick={()=>setActiveTab(t)} style={{ padding:"12px 18px",fontSize:13,fontWeight:activeTab===t?700:500,color:activeTab===t?(isStats?C.purple:C.navy):C.muted,background:"none",border:"none",borderBottom:activeTab===t?`2px solid ${isStats?C.purple:cfg}`:"2px solid transparent",marginBottom:-2,cursor:"pointer",fontFamily:"inherit" }}>{t}</button>;
          })}
        </div>
        {isStatsTab && <StatsPanel isVD={role==="vd"} />}
        {!isStatsTab && (<>
          <div style={{ padding:"14px 20px",borderBottom:`1px solid ${C.border}`,display:"flex",gap:10,alignItems:"center",flexWrap:"wrap" }}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍  Search by name or email…" style={{ border:`1px solid ${C.border}`,borderRadius:7,padding:"7px 12px",fontSize:12,fontFamily:"inherit",width:220,color:C.slate }} />
            <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} style={{ border:`1px solid ${C.border}`,borderRadius:7,padding:"7px 12px",fontSize:12,fontFamily:"inherit",color:C.slate }}>
              <option value="all">All Statuses</option>
              {Object.entries(STATUS_META).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
            </select>
            <select value={filterLabel} onChange={e=>setFilterLabel(e.target.value)} style={{ border:`1px solid ${C.border}`,borderRadius:7,padding:"7px 12px",fontSize:12,fontFamily:"inherit",color:C.slate }}>
              <option value="all">All Labels</option>
              {LABELS_STORE.filter(l=>l.active).map(l=><option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
            <select value={filterSource} onChange={e=>setFilterSource(e.target.value)} style={{ border:`1px solid ${C.border}`,borderRadius:7,padding:"7px 12px",fontSize:12,fontFamily:"inherit",color:C.slate }}>
              <option value="all">All Sources</option>
              {ALL_SOURCES.map(s=><option key={s}>{s}</option>)}
            </select>
            <span style={{ marginLeft:"auto",fontSize:12,color:C.muted }}>{filteredLeads.length} leads · sorted by AI score</span>
          </div>
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%",borderCollapse:"collapse",fontSize:13 }}>
              <thead>
                <tr style={{ background:"#F8FAFC",borderBottom:`2px solid ${C.border}` }}>
                  {["Lead","Source / Campaign","Status","AI Score","Attempts",showAssignCol&&"Assigned To","Created",""].filter(Boolean).map(h=>(
                    <th key={h} style={{ padding:"10px 14px",textAlign:"left",fontSize:11,fontWeight:700,color:h==="AI Score"?C.ai:C.muted,letterSpacing:"0.05em",textTransform:"uppercase",whiteSpace:"nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredLeads.length===0&&<tr><td colSpan={8} style={{ padding:"40px",textAlign:"center",color:C.muted,fontSize:13 }}>No leads match your filters.</td></tr>}
                {filteredLeads.map((lead,i)=>(
                  <tr key={lead.id} onClick={()=>navigateTo("LeadDetail", lead)} style={{ background:selectedLead?.id===lead.id?"#EFF6FF":i%2===0?"#fff":"#FAFAFA",borderBottom:`1px solid ${C.border}`,cursor:"pointer" }}>
                    <td style={{ padding:"12px 14px" }}>
                      <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                        <Avatar name={lead.name} />
                        <div><div style={{ fontWeight:600,color:C.text }}>{lead.name}</div><div style={{ fontSize:11,color:C.muted }}>{lead.email}</div></div>
                      </div>
                    </td>
                    <td style={{ padding:"12px 14px" }}><div style={{ fontWeight:500,color:C.slate }}>{lead.source}</div><div style={{ fontSize:11,color:C.muted }}>{lead.campaign}</div></td>
                    <td style={{ padding:"12px 14px" }}><StatusBadge status={lead.status} /></td>
                    <td style={{ padding:"12px 14px" }}>
                      <div style={{ display:"flex",alignItems:"center",gap:6 }}>
                        <ScoreBadge leadId={lead.id} />
                        <button onClick={e=>{e.stopPropagation();openDrawer(lead,"🤖 AI");}} title="Open AI" style={{ padding:"3px 8px",borderRadius:5,border:`1px solid ${C.ai}30`,background:C.ai+"0D",color:C.ai,fontSize:10,fontWeight:700,cursor:"pointer",flexShrink:0 }}>🤖 AI</button>
                      </div>
                    </td>
                    <td style={{ padding:"12px 14px" }}><div style={{ display:"flex",gap:3 }}>{[1,2,3,4,5].map(n=><div key={n} style={{ width:8,height:8,borderRadius:"50%",background:n<=lead.attempts?C.amber:C.border }} />)}</div></td>
                    {showAssignCol&&(
                      <td style={{ padding:"12px 14px" }}>
                        {lead.assignedGP
                          ?<div style={{ display:"flex",alignItems:"center",gap:6 }}><Avatar name={lead.assignedGP} size={22} /><span style={{ fontSize:12,color:C.slate }}>{lead.assignedGP}</span>{lead.assignedGP===lead.assignedVD&&<span style={{ fontSize:10,background:C.indigo+"15",color:C.indigo,padding:"1px 6px",borderRadius:8,fontWeight:700 }}>VD</span>}</div>
                          :<span style={{ fontSize:12,color:C.red,fontWeight:600 }}>Unassigned</span>}
                      </td>
                    )}
                    <td style={{ padding:"12px 14px",fontSize:12,color:C.muted,whiteSpace:"nowrap" }}>{lead.created}</td>
                    <td style={{ padding:"12px 14px" }}>
                      <div style={{ display:"flex",gap:4 }}>
                        <button onClick={e=>{e.stopPropagation();setCallLead(lead);}} style={{ padding:"4px 10px",borderRadius:5,border:`1px solid ${C.green}30`,background:C.green+"0D",color:C.green,fontSize:10,fontWeight:700,cursor:"pointer" }}>📞 Call</button>
                        <button onClick={e=>{e.stopPropagation();openDrawer(lead,"🤖 AI");}} style={{ padding:"4px 10px",borderRadius:5,border:`1px solid ${C.ai}30`,background:C.ai+"0D",color:C.ai,fontSize:10,fontWeight:700,cursor:"pointer" }}>🤖 AI</button>
                        <button onClick={e=>{e.stopPropagation();navigateTo("LeadDetail",lead);}} style={{ padding:"4px 10px",borderRadius:5,border:`1px solid ${C.border}`,background:C.primary,color:"#fff",fontSize:10,fontWeight:600,cursor:"pointer" }}>Open →</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding:"14px 20px",borderTop:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
            <span style={{ fontSize:12,color:C.muted }}>Showing {filteredLeads.length} of {ALL_LEADS.length} leads</span>
            <div style={{ display:"flex",gap:5 }}>
              {["←","1","2","3","→"].map(p=><button key={p} style={{ padding:"5px 10px",borderRadius:5,border:p==="1"?"none":`1px solid ${C.border}`,background:p==="1"?cfg:"#fff",color:p==="1"?"#fff":C.slate,fontSize:12,cursor:"pointer" }}>{p}</button>)}
            </div>
          </div>
        </>)}
      </Card>
      {selectedLead && <LeadDrawer lead={selectedLead} onClose={()=>setSelectedLead(null)} openTab={drawerTab} />}
      {callLead     && <OutboundCallModal lead={callLead} onClose={()=>setCallLead(null)} />}
      <FloatingAgentChat role={role} />
    </div>
  );
};


// ─── Appointments Page ────────────────────────────────────────────────────────
// ─── Outbound Call Modal ──────────────────────────────────────────────────────
