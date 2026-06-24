import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { EmailAutomationSection } from "../email/email-automation-section";
import { EmailTemplatesSection } from "../email/email-templates-section";
import { AuditLogSection } from "./audit-log-section";
import { LanguageSection } from "./language-section";
import { StatusesSection } from "./statuses-section";
import { WorkflowRulesSection } from "./workflow-rules-section";
import { Avatar } from "../ui/avatar";
import { Card } from "../ui/card";
import { SettingsCard } from "../ui/settings-card";
import { SettingsToggle } from "../ui/settings-toggle";
import { ATTACHMENTS_STORE, LABELS_STORE, LC_SOURCES, setATTACHMENTS_STORE, setLABELS_STORE } from "../../lib/core";
import { C } from "../../theme";

export const SettingsPage = ({ role, navigateTo }) => {
  const [activeSection, setActiveSection] = useState("Profile");
  const [saved, setSaved] = useState(false);
  const save = () => { setSaved(true); setTimeout(()=>setSaved(false),2000); };

  // Labels state
  const [labels, setLabels] = useState(LABELS_STORE);
  const [newLabelName,  setNewLabelName]  = useState("");
  const [newLabelColor, setNewLabelColor] = useState("#4338CA");
  const [newLabelDesc,  setNewLabelDesc]  = useState("");
  const [labelSearch,   setLabelSearch]   = useState("");
  const [labelFilterType, setLabelFilterType] = useState("all");
  const [labelFilterActive, setLabelFilterActive] = useState("all");
  const [labelSortCol,  setLabelSortCol]  = useState("name");
  const [labelSortDir,  setLabelSortDir]  = useState("asc");
  const [showNewLabel,  setShowNewLabel]  = useState(false);

  // Attachments state
  const [attachments,   setAttachments]   = useState(ATTACHMENTS_STORE);
  const [attSearch,     setAttSearch]     = useState("");
  const [attFilterLang, setAttFilterLang] = useState("all");
  const [attFilterType, setAttFilterType] = useState("all"); // all | mine | org
  const [attSortCol,    setAttSortCol]    = useState("name");
  const [attSortDir,    setAttSortDir]    = useState("asc");
  const [showNewAtt,    setShowNewAtt]    = useState(false);
  const [newAttName,    setNewAttName]    = useState("");
  const [newAttLang,    setNewAttLang]    = useState("de");
  const [newAttFile,    setNewAttFile]    = useState(null);

  const inp  = { border:`1px solid ${C.border}`,borderRadius:7,padding:"9px 11px",fontSize:13,fontFamily:"inherit",color:C.text,width:"100%",boxSizing:"border-box" };
  const Label = ({children}) => <label style={{ display:"block",fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:5 }}>{children}</label>;
  const Field = ({label,children}) => <div style={{ marginBottom:16 }}><Label>{label}</Label>{children}</div>;

  const SECTIONS = [
    { key:"Profile",              icon:"👤" },
    { key:"Labels",               icon:"🏷️" },
    { key:"Statuses",             icon:"🔄", saOnly:true },
    { key:"Attachments",          icon:"📎" },
    { key:"Notifications",        icon:"🔔" },
    { key:"Email Automation",     icon:"✉️" },
    { key:"Workflow & Automation",icon:"⚡", saOnly:true },
    { key:"Email Templates",      icon:"📝" },
    { key:"Integrations",         icon:"🔗" },
    { key:"Users & Roles",        icon:"👥" },
    { key:"Security",             icon:"🔒" },
    { key:"Audit Log",            icon:"📋" },
    { key:"Language",             icon:"🌐" },
  ];

  return (
    <div style={{ display:"flex",minHeight:"calc(100vh - 54px)" }}>
      {/* Sidebar */}
      <div style={{ width:200,background:"#fff",borderRight:`1px solid ${C.border}`,padding:"20px 0",flexShrink:0 }}>
        <div style={{ padding:"0 16px 14px",fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.07em" }}>Settings</div>
        {SECTIONS.filter(s=>!s.saOnly||role==="superadmin").map(s=>(
          <button key={s.key} onClick={()=>s.external?navigateTo("EmailAutomation"):setActiveSection(s.key)}
            style={{ display:"flex",alignItems:"center",gap:10,width:"100%",padding:"10px 16px",border:"none",
              background:activeSection===s.key?C.primary+"0D":"transparent",
              color:activeSection===s.key?C.navy:s.external?C.amber:C.slate,
              fontWeight:activeSection===s.key?700:400,fontSize:13,cursor:"pointer",fontFamily:"inherit",
              borderLeft:activeSection===s.key?`3px solid ${C.primary}`:"3px solid transparent",
              justifyContent:"space-between" }}>
            <span style={{ display:"flex",alignItems:"center",gap:10 }}><span>{s.icon}</span>{s.key}</span>
            {s.external && <span style={{ fontSize:10,fontWeight:700,color:C.amber }}>↗</span>}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex:1,padding:"28px",overflowY:"auto",minWidth:0 }}>
        {saved && (
          <div style={{ marginBottom:16,padding:"10px 16px",borderRadius:8,background:"#ECFDF5",border:`1px solid ${C.green}40`,display:"flex",alignItems:"center",gap:8,fontSize:12,fontWeight:700,color:C.green }}>
            ✅ Settings saved successfully
          </div>
        )}

        {activeSection==="Profile" && (
          <>
            <div style={{ fontSize:20,fontWeight:800,color:C.navy,marginBottom:20 }}>Profile & Account</div>
            <SettingsCard title="Personal Information">
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14 }}>
                <Field label="First Name"><input defaultValue={role==="gp"?"Anna":role==="vd"?"Thomas":"Super"} style={inp}/></Field>
                <Field label="Last Name"><input defaultValue={role==="gp"?"Klein":role==="vd"?"Müller":"Admin"} style={inp}/></Field>
                <Field label="Email Address"><input defaultValue={role==="gp"?"anna.klein@vion.world":role==="vd"?"t.mueller@vion.world":"admin@vion.world"} style={inp}/></Field>
                <Field label="Phone"><input defaultValue="+49 89 123456" style={inp}/></Field>
              </div>
              <Field label="Role"><input value={role==="gp"?"Consultant (GP)":role==="vd"?"Sales Director (VD)":"Super Admin"} readOnly style={{...inp,background:"#F8FAFC",color:C.muted}}/></Field>
            </SettingsCard>
            <SettingsCard title="White-Label Outreach (EF-05/06)">
              <Field label="Send emails from (display name)">
                <input defaultValue={role==="gp"?"Anna Klein":role==="vd"?"Thomas Müller":"vion CRM"} style={inp}/>
              </Field>
              <Field label="Send emails from (address)">
                <div style={{ display:"flex",gap:8 }}>
                  <input defaultValue={role==="gp"?"anna.klein@personalmail.de":role==="vd"?"t.mueller@personalmail.de":"admin@vion.world"} style={{...inp,flex:1}}/>
                  <span style={{ padding:"9px 11px",borderRadius:7,background:"#ECFDF5",border:`1px solid ${C.green}30`,fontSize:11,fontWeight:700,color:C.green,flexShrink:0,display:"flex",alignItems:"center" }}>✓ DKIM</span>
                </div>
              </Field>
              <Field label="Send SMS/WhatsApp from (number)">
                <input defaultValue="+49 171 9876543" style={inp}/>
              </Field>
              {/* Live preview */}
              <div style={{ borderRadius:9,border:`1px solid ${C.border}`,overflow:"hidden",marginBottom:4 }}>
                <div style={{ padding:"8px 14px",background:"#F8FAFC",borderBottom:`1px solid ${C.border}`,fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em" }}>📧 Email Preview — How leads see your messages</div>
                <div style={{ padding:"14px 16px",background:"#fff" }}>
                  <div style={{ display:"flex",gap:10,marginBottom:8 }}>
                    <div style={{ width:34,height:34,borderRadius:"50%",background:role==="gp"?C.green:C.indigo,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:13,fontWeight:800,flexShrink:0 }}>
                      {(role==="gp"?"AK":role==="vd"?"TM":"SA")}
                    </div>
                    <div>
                      <div style={{ fontSize:12,fontWeight:700,color:C.text }}>{role==="gp"?"Anna Klein":role==="vd"?"Thomas Müller":"vion CRM"}</div>
                      <div style={{ fontSize:11,color:C.muted }}>{role==="gp"?"anna.klein@personalmail.de":role==="vd"?"t.mueller@personalmail.de":"admin@vion.world"}</div>
                    </div>
                  </div>
                  <div style={{ fontSize:12,color:C.text,fontWeight:600,marginBottom:3 }}>Your personalised financial strategy is ready</div>
                  <div style={{ fontSize:11,color:C.muted }}>Dear Max, I wanted to follow up on our conversation about the Q1 Finanz…</div>
                </div>
              </div>
              <div style={{ fontSize:11,color:C.muted,marginTop:6 }}>Contacts will see <strong>{role==="gp"?"Anna Klein":role==="vd"?"Thomas Müller":"vion CRM"}</strong> as the sender — not a generic vion address.</div>
            </SettingsCard>
            <button onClick={save} style={{ padding:"10px 24px",borderRadius:8,border:"none",background:C.primary,color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer" }}>Save Changes</button>
          </>
        )}

        {activeSection==="Notifications" && (
          <>
            <div style={{ fontSize:20,fontWeight:800,color:C.navy,marginBottom:6 }}>Notification Preferences</div>
            <div style={{ fontSize:13,color:C.muted,marginBottom:20 }}>
              Showing notifications relevant to your role:
              <span style={{ marginLeft:6,fontWeight:700,color:C.navy,fontSize:12,
                padding:"2px 10px",borderRadius:12,background:C.primary+"12" }}>
                {{superadmin:"Super Admin",vd:"Sales Director",gp:"Consultant",manager:"Product Owner"}[role]}
              </span>
            </div>

            {/* ── Consultant + VD: personal workflow ── */}
            {(role==="gp"||role==="vd") && (
              <SettingsCard title="My Workflow">
                <SettingsToggle label="New contact assigned to me"  sub="Instant alert when a contact is assigned to your queue"      defaultOn={true} />
                <SettingsToggle label="Follow-up due today"      sub="Reminder each morning for contacts due for contact"          defaultOn={true} />
                <SettingsToggle label="Appointment reminder"     sub="Alert 1 hour before each scheduled appointment"          defaultOn={true} />
                <SettingsToggle label="Contact status changed"      sub="When a contact in your pipeline changes status"             defaultOn={false} />
              </SettingsCard>
            )}

            {/* ── VD only: team management ── */}
            {(role==="vd"||role==="superadmin") && (
              <SettingsCard title="Team Alerts">
                <SettingsToggle label="Contact assigned to my team"   sub="When any contact is assigned to a consultant in your team"  defaultOn={true} />
                <SettingsToggle label="GP conversion rate drop"    sub="Alert when a consultant's rate drops 10% week-on-week"   defaultOn={true} />
                <SettingsToggle label="Script adherence low"       sub="When a GP falls below the adherence threshold"           defaultOn={role==="vd"} />
              </SettingsCard>
            )}

            {/* ── SA only: system & org ── */}
            {role==="superadmin" && (
              <SettingsCard title="System & Organisation">
                <SettingsToggle label="GDPR consent expiry"         sub="Alert 30 days before any contact's consent expires"         defaultOn={true} />
                <SettingsToggle label="Zapier / integration errors" sub="Alert when a connected source fails to sync"             defaultOn={true} />
                <SettingsToggle label="New contact source connected"   sub="When a new integration or import is configured"          defaultOn={true} />
                <SettingsToggle label="User account changes"        sub="New users added, roles changed, or access revoked"       defaultOn={true} />
              </SettingsCard>
            )}

            {/* ── PO only: executive ── */}
            {role==="manager" && (
              <SettingsCard title="Executive Alerts">
                <SettingsToggle label="Weekly org performance"      sub="Monday summary: pipeline, closings, conversion vs target" defaultOn={true} />
                <SettingsToggle label="Conversion rate anomaly"     sub="Alert when org conversion drops below target by 1pp+"    defaultOn={true} />
                <SettingsToggle label="AI adoption drop"            sub="When AI feature usage drops significantly org-wide"       defaultOn={false} />
              </SettingsCard>
            )}

            {/* ── All roles: email digest ── */}
            <SettingsCard title="Email Digest">
              {(role==="gp"||role==="vd") && <>
                <SettingsToggle label="Daily pipeline summary"     sub="Morning email with your contact queue and appointments"     defaultOn={true} />
                <SettingsToggle label="Weekly performance report"  sub="Every Monday with your personal stats"                  defaultOn={true} />
              </>}
              {(role==="vd"||role==="superadmin"||role==="manager") && (
                <SettingsToggle label="Org-wide weekly summary"    sub="Monday org overview: pipeline, team performance, alerts" defaultOn={true} />
              )}
            </SettingsCard>

            <button onClick={save} style={{ padding:"10px 24px",borderRadius:8,border:"none",background:C.primary,color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer" }}>Save Preferences</button>
          </>
        )}

        {activeSection==="Integrations" && (
          <>
            <div style={{ fontSize:20,fontWeight:800,color:C.navy,marginBottom:20 }}>Integrations & Webhooks</div>
            <SettingsCard title="Connected Sources">
              {LC_SOURCES.map(s=>(
                <div key={s.id} style={{ display:"flex",alignItems:"center",gap:12,padding:"12px 0",borderBottom:`1px solid ${C.border}` }}>
                  <span style={{ fontSize:20 }}>{s.icon}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13,fontWeight:600,color:C.text }}>{s.label}</div>
                    <div style={{ fontSize:11,color:C.muted }}>{s.method} · Last sync: {s.lastSync}</div>
                  </div>
                  <span style={{ fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:10,
                    color:s.status==="connected"?C.green:s.status==="error"?C.red:C.amber,
                    background:(s.status==="connected"?C.green:s.status==="error"?C.red:C.amber)+"15" }}>
                    {s.status==="connected"?"Connected":s.status==="error"?"Error":"Idle"}
                  </span>
                  <button style={{ padding:"5px 12px",borderRadius:6,border:`1px solid ${C.border}`,background:"#fff",color:s.status==="error"?C.red:C.slate,fontSize:11,fontWeight:600,cursor:"pointer" }}>
                    {s.status==="error"?"Reconnect":"Configure"}
                  </button>
                </div>
              ))}
            </SettingsCard>
            <SettingsCard title="Calendar Sync (NF-05)">
              <SettingsToggle label="Sync with Google Calendar"   sub="Push all CRM appointments to Google Calendar"      defaultOn={true}  />
              <SettingsToggle label="Sync with vion.world calendar" sub="Bi-directional sync with vion.world platform"   defaultOn={true}  />
              <SettingsToggle label="Show personal calendar events" sub="Overlay personal events in CRM calendar"         defaultOn={false} />
            </SettingsCard>
            <SettingsCard title="Webhooks & API">
              <Field label="Zapier Webhook URL">
                <div style={{ display:"flex",gap:8 }}>
                  <input defaultValue="https://hooks.zapier.com/hooks/catch/12345678/abcdef/" style={{...inp,fontFamily:"monospace",fontSize:11}}/>
                  <button style={{ padding:"9px 14px",borderRadius:7,border:`1px solid ${C.border}`,background:"#fff",color:C.slate,fontSize:12,cursor:"pointer",flexShrink:0 }}>Test</button>
                </div>
              </Field>
              <Field label="Make.com Webhook URL">
                <input defaultValue="https://hook.eu1.make.com/xxxxxxxxxxxxxxxx" style={{...inp,fontFamily:"monospace",fontSize:11}}/>
              </Field>
            </SettingsCard>
            <button onClick={save} style={{ padding:"10px 24px",borderRadius:8,border:"none",background:C.primary,color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer" }}>Save Integration Settings</button>
          </>
        )}

        {activeSection==="Users & Roles" && (
          <>
            <div style={{ fontSize:20,fontWeight:800,color:C.navy,marginBottom:20 }}>Users & Roles</div>
            <SettingsCard title="Team Members">
              <div style={{ display:"flex",justifyContent:"flex-end",marginBottom:12 }}>
                <button style={{ padding:"7px 14px",borderRadius:7,border:"none",background:C.primary,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer" }}>+ Invite User</button>
              </div>
              {[
                { name:"Super Admin",    email:"admin@vion.world",          role:"Super Admin",    status:"active" },
                { name:"Thomas Müller", email:"t.mueller@vion.world",       role:"Sales Director", status:"active" },
                { name:"Lisa Weber",    email:"l.weber@vion.world",         role:"Sales Director", status:"active" },
                { name:"Anna Klein",    email:"a.klein@vion.world",         role:"Consultant",     status:"active" },
                { name:"Marc Otto",     email:"m.otto@vion.world",          role:"Consultant",     status:"active" },
                { name:"Nina Schmitt",  email:"n.schmitt@vion.world",       role:"Consultant",     status:"active" },
                { name:"Jana Kruse",    email:"j.kruse@vion.world",         role:"Sales Director", status:"inactive" },
              ].map((u,i)=>(
                <div key={i} style={{ display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:`1px solid ${C.border}` }}>
                  <Avatar name={u.name} size={32}/>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13,fontWeight:600,color:C.text }}>{u.name}</div>
                    <div style={{ fontSize:11,color:C.muted }}>{u.email}</div>
                  </div>
                  <span style={{ fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:10,
                    color:u.role==="Super Admin"?C.navy:u.role==="Sales Director"?C.indigo:C.green,
                    background:(u.role==="Super Admin"?C.primary:u.role==="Sales Director"?C.indigo:C.green)+"15" }}>
                    {u.role}
                  </span>
                  <span style={{ fontSize:10,color:u.status==="active"?C.green:C.muted,fontWeight:600 }}>
                    {u.status==="active"?"● Active":"○ Inactive"}
                  </span>
                  <button style={{ padding:"4px 10px",borderRadius:6,border:`1px solid ${C.border}`,background:"#fff",color:C.slate,fontSize:11,cursor:"pointer" }}>Edit</button>
                </div>
              ))}
            </SettingsCard>
          </>
        )}

        {activeSection==="Security" && (
          <>
            <div style={{ fontSize:20,fontWeight:800,color:C.navy,marginBottom:20 }}>Security & Privacy</div>
            <SettingsCard title="Password">
              <Field label="Current Password"><input type="password" placeholder="••••••••" style={inp}/></Field>
              <Field label="New Password"><input type="password" placeholder="••••••••" style={inp}/></Field>
              <Field label="Confirm New Password"><input type="password" placeholder="••••••••" style={inp}/></Field>
              <button onClick={save} style={{ padding:"8px 20px",borderRadius:7,border:"none",background:C.primary,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer" }}>Update Password</button>
            </SettingsCard>
            <SettingsCard title="Data & Privacy (GDPR)">
              <SettingsToggle label="Audit log (NF-11)"              sub="Log all user actions on contact records"                        defaultOn={true}  />
              <SettingsToggle label="Session timeout after 30 min"   sub="Auto-logout on inactivity"                                  defaultOn={true}  />
              <SettingsToggle label="Two-factor authentication"       sub="Require 2FA on login"                                      defaultOn={false} />
              <div style={{ marginTop:14,padding:"12px 16px",borderRadius:8,background:"#EFF6FF",border:`1px solid ${C.blue}30`,fontSize:12,color:"#1E40AF" }}>
                🔒 All data in transit is encrypted (TLS 1.3). Data at rest is AES-256 encrypted. GDPR-compliant deletion available per Article 17 from the individual lead record.
              </div>
            </SettingsCard>
          </>
        )}

        {/* ── Email Templates ── */}
        {activeSection==="Workflow & Automation" && <WorkflowRulesSection role={role} />}
        {activeSection==="Statuses" && <StatusesSection role={role} />}
        {activeSection==="Email Templates" && <EmailTemplatesSection navigateTo={navigateTo} role={role} />}
        {activeSection==="Email Automation" && <EmailAutomationSection role={role} save={save}/>}
{/* ── Audit Log (GDPR-09, NF-11) ── */}
        {activeSection==="Audit Log" && <AuditLogSection />}

        {/* ── Language (NF-10) ── */}
        {activeSection==="Language" && <LanguageSection save={save} role={role} inp={inp} Card={Card} Field={Field} Label={Label} />}

        {/* ── Labels (SA only) ── */}
        {/* ═══ LABELS ═══ */}
        {activeSection==="Labels" && ["superadmin","vd","gp"].includes(role) && (()=>{
          const PALETTE = ["#DC2626","#D97706","#059669","#0891B2","#4338CA","#7C3AED","#64748B","#1E3A5F","#0F766E","#BE185D"];
          const myName  = role==="gp"?"Anna Klein":role==="vd"?"Thomas Müller":"Super Admin";

          const saveNew = () => {
            if(!newLabelName.trim()) return;
            const lbl = { id:`lbl${Date.now()}`, name:newLabelName.trim(), color:newLabelColor,
              desc:newLabelDesc.trim(), active:true, lang:"all",
              createdBy:role==="superadmin"?"superadmin":myName,
              type:role==="superadmin"?"org":"personal" };
            const u=[...labels,lbl]; setLabels(u); setLABELS_STORE(u);
            setShowNewLabel(false); setNewLabelName(""); setNewLabelDesc(""); setNewLabelColor("#4338CA");
          };
          const toggleActive = (id) => { const u=labels.map(l=>l.id===id?{...l,active:!l.active}:l); setLabels(u); setLABELS_STORE(u); };
          const deleteLabel  = (id) => { if(!window.confirm(`Permanently delete this label? This will remove it from all leads.`)) return; const u=labels.filter(l=>l.id!==id); setLabels(u); setLABELS_STORE(u); };
          const canDelete    = (lbl) => role==="superadmin"||role==="vd"||(role==="gp"&&(lbl.createdBy===myName||lbl.createdBy==="gp"||!lbl.createdBy));

          // Sort & filter
          const sorted = [...labels]
            .filter(l=>{
              if(labelFilterType==="org"  && l.createdBy!=="superadmin") return false;
              if(labelFilterType==="mine" && l.createdBy!==myName)       return false;
              if(labelFilterActive==="active"   && !l.active) return false;
              if(labelFilterActive==="inactive" && l.active)  return false;
              if(labelSearch && !l.name.toLowerCase().includes(labelSearch.toLowerCase()) &&
                 !(l.desc||"").toLowerCase().includes(labelSearch.toLowerCase())) return false;
              return true;
            })
            .sort((a,b)=>{
              const av = labelSortCol==="active"?+a.active:a[labelSortCol]||"";
              const bv = labelSortCol==="active"?+b.active:b[labelSortCol]||"";
              const c  = typeof av==="number"?av-bv:String(av).localeCompare(String(bv));
              return labelSortDir==="asc"?c:-c;
            });

          const thS = (col) => ({
            padding:"10px 14px",textAlign:"left",fontSize:10,fontWeight:700,
            color:labelSortCol===col?C.navy:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",
            whiteSpace:"nowrap",cursor:"pointer",userSelect:"none",background:"#FAFAFA",
            borderBottom:`2px solid ${C.border}`,
          });
          const si = (col) => labelSortCol===col?(labelSortDir==="asc"?" ↑":" ↓"):"";
          const ts = (col) => ()=>{ setLabelSortCol(col); setLabelSortDir(d=>labelSortCol===col?(d==="asc"?"desc":"asc"):"asc"); };

          return (<>
            {/* Header */}
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16 }}>
              <div>
                <div style={{ fontSize:20,fontWeight:800,color:C.navy,marginBottom:4 }}>🏷️ Labels</div>
                <div style={{ fontSize:12,color:C.muted }}>
                  {labels.length} total · <span style={{ color:C.green }}>{labels.filter(l=>l.active).length} active</span>
                  {labels.filter(l=>!l.active).length>0 && <> · <span style={{ color:C.muted }}>{labels.filter(l=>!l.active).length} inactive</span></>}
                </div>
              </div>
              <button onClick={()=>setShowNewLabel(v=>!v)}
                style={{ padding:"8px 18px",borderRadius:9,border:"none",background:C.primary,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer" }}>
                {showNewLabel?"✕ Cancel":"+ New Label"}
              </button>
            </div>

            {/* New label form */}
            {showNewLabel && (
              <div style={{ padding:"18px 20px",borderRadius:12,border:`1.5px solid ${C.indigo}30`,background:C.indigo+"04",marginBottom:16 }}>
                <div style={{ fontSize:13,fontWeight:700,color:C.text,marginBottom:14 }}>New Label</div>
                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12 }}>
                  <div>
                    <label style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:5 }}>Name *</label>
                    <input value={newLabelName} onChange={e=>setNewLabelName(e.target.value)} placeholder="e.g. VIP Client"
                      style={{ width:"100%",padding:"9px 12px",borderRadius:8,border:`1.5px solid ${C.border}`,fontSize:13,fontFamily:"inherit",boxSizing:"border-box",outline:"none" }}/>
                  </div>
                  <div>
                    <label style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:5 }}>Description</label>
                    <input value={newLabelDesc} onChange={e=>setNewLabelDesc(e.target.value)} placeholder="Optional"
                      style={{ width:"100%",padding:"9px 12px",borderRadius:8,border:`1.5px solid ${C.border}`,fontSize:13,fontFamily:"inherit",boxSizing:"border-box",outline:"none" }}/>
                  </div>
                </div>
                <div style={{ marginBottom:14 }}>
                  <label style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:8 }}>Colour</label>
                  <div style={{ display:"flex",gap:8,flexWrap:"wrap",alignItems:"center" }}>
                    {PALETTE.map(c=>(
                      <button key={c} onClick={()=>setNewLabelColor(c)}
                        style={{ width:26,height:26,borderRadius:"50%",background:c,border:`3px solid ${newLabelColor===c?"#1E293B":"transparent"}`,cursor:"pointer",padding:0 }}/>
                    ))}
                    <span style={{ padding:"3px 12px",borderRadius:20,background:newLabelColor+"20",border:`1.5px solid ${newLabelColor}`,fontSize:12,fontWeight:700,color:newLabelColor,marginLeft:6 }}>
                      {newLabelName||"Preview"}
                    </span>
                  </div>
                </div>
                <div style={{ display:"flex",justifyContent:"flex-end",gap:10 }}>
                  <button onClick={()=>setShowNewLabel(false)} style={{ padding:"8px 18px",borderRadius:8,border:`1px solid ${C.border}`,background:"#fff",color:C.slate,fontSize:13,fontWeight:600,cursor:"pointer" }}>Cancel</button>
                  <button onClick={saveNew} disabled={!newLabelName.trim()}
                    style={{ padding:"8px 18px",borderRadius:8,border:"none",background:newLabelName.trim()?C.primary:"#E2E8F0",color:newLabelName.trim()?"#fff":C.muted,fontSize:13,fontWeight:700,cursor:newLabelName.trim()?"pointer":"default" }}>
                    Save Label
                  </button>
                </div>
              </div>
            )}

            {/* Search + Filters */}
            <div style={{ display:"flex",gap:8,marginBottom:14,alignItems:"center",flexWrap:"wrap" }}>
              <div style={{ display:"flex",alignItems:"center",gap:8,padding:"7px 12px",background:"#fff",borderRadius:9,border:`1px solid ${C.border}`,flex:"0 1 220px" }}>
                <span style={{ color:C.muted,fontSize:13 }}>🔍</span>
                <input value={labelSearch} onChange={e=>setLabelSearch(e.target.value)} placeholder="Search labels…"
                  style={{ border:"none",background:"transparent",fontSize:12,fontFamily:"inherit",color:C.text,outline:"none",width:"100%" }}/>
                {labelSearch && <button onClick={()=>setLabelSearch("")} style={{ border:"none",background:"none",color:C.muted,cursor:"pointer",fontSize:13,padding:0 }}>×</button>}
              </div>
              {/* Type DDL */}
              {(()=>{ const a=labelFilterType!=="all"; return (
                <div style={{ position:"relative" }}>
                  <select value={labelFilterType} onChange={e=>setLabelFilterType(e.target.value)}
                    style={{ padding:"7px 26px 7px 10px",borderRadius:8,border:`1.5px solid ${a?C.primary:C.border}`,background:a?C.primary+"08":"#fff",color:a?C.navy:C.muted,fontSize:11,fontFamily:"inherit",appearance:"none",cursor:"pointer",outline:"none",fontWeight:a?700:400 }}>
                    <option value="all">Type</option>
                    <option value="org">🏢 Org-wide</option>
                    <option value="mine">👤 Mine</option>
                  </select>
                  <span style={{ position:"absolute",right:7,top:"50%",transform:"translateY(-50%)",pointerEvents:"none",fontSize:9,color:C.muted }}>▼</span>
                </div>
              );})()}
              {/* Active DDL */}
              {(()=>{ const a=labelFilterActive!=="all"; return (
                <div style={{ position:"relative" }}>
                  <select value={labelFilterActive} onChange={e=>setLabelFilterActive(e.target.value)}
                    style={{ padding:"7px 26px 7px 10px",borderRadius:8,border:`1.5px solid ${a?C.primary:C.border}`,background:a?C.primary+"08":"#fff",color:a?C.navy:C.muted,fontSize:11,fontFamily:"inherit",appearance:"none",cursor:"pointer",outline:"none",fontWeight:a?700:400 }}>
                    <option value="all">Status</option>
                    <option value="active">● Active</option>
                    <option value="inactive">○ Inactive</option>
                  </select>
                  <span style={{ position:"absolute",right:7,top:"50%",transform:"translateY(-50%)",pointerEvents:"none",fontSize:9,color:C.muted }}>▼</span>
                </div>
              );})()}
              {(labelSearch||labelFilterType!=="all"||labelFilterActive!=="all") && (
                <button onClick={()=>{ setLabelSearch(""); setLabelFilterType("all"); setLabelFilterActive("all"); }}
                  style={{ padding:"7px 12px",borderRadius:8,border:`1px solid ${C.border}`,background:"#fff",color:C.muted,fontSize:11,cursor:"pointer",fontFamily:"inherit" }}>✕ Clear</button>
              )}
              <span style={{ marginLeft:"auto",fontSize:11,color:C.muted }}>{sorted.length} of {labels.length}</span>
            </div>

            {/* Table */}
            <div style={{ background:"#fff",border:`1px solid ${C.border}`,borderRadius:12,overflowX:"auto" }}>
              <table style={{ width:"100%",minWidth:640,borderCollapse:"collapse",fontSize:12 }}>
                <thead>
                  <tr>
                    <th onClick={ts("name")}  style={{...thS("name"), minWidth:160}}>Name{si("name")}</th>
                    <th style={{ padding:"10px 14px",fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",background:"#FAFAFA",borderBottom:`2px solid ${C.border}`,minWidth:200 }}>Description</th>
                    <th onClick={ts("color")} style={{...thS("color"),width:80,textAlign:"center"}}>Colour{si("color")}</th>
                    <th style={{ padding:"10px 14px",fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",background:"#FAFAFA",borderBottom:`2px solid ${C.border}`,width:120,cursor:"default",textAlign:"center" }}>Type</th>
                    <th onClick={ts("active")} style={{...thS("active"),width:88,textAlign:"center"}}>Active{si("active")}</th>
                    <th style={{ padding:"10px 14px",fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",background:"#FAFAFA",borderBottom:`2px solid ${C.border}`,width:130,textAlign:"center",cursor:"default" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.length===0 && (
                    <tr><td colSpan={6} style={{ padding:"40px",textAlign:"center",color:C.muted,fontSize:13 }}>
                      No labels match your filters.
                    </td></tr>
                  )}
                  {sorted.map((lbl,i)=>{
                    const isOrg = !lbl.createdBy || lbl.createdBy==="superadmin";
                    const rowBg = i%2===0?"#fff":"#FAFAFA";
                    return (
                      <tr key={lbl.id} style={{ borderBottom:`1px solid ${C.border}`,background:rowBg }}
                        onMouseEnter={e=>e.currentTarget.style.background="#F0F4FF"}
                        onMouseLeave={e=>e.currentTarget.style.background=rowBg}>
                        {/* Name */}
                        <td style={{ padding:"11px 14px" }}>
                          <span style={{ fontSize:12,fontWeight:700,padding:"3px 11px",borderRadius:20,background:lbl.color+"18",color:lbl.color }}>
                            {lbl.name}
                          </span>
                        </td>
                        {/* Description */}
                        <td style={{ padding:"11px 14px",color:C.muted,fontSize:12 }}>
                          {lbl.desc||<em style={{ color:C.border }}>No description</em>}
                        </td>
                        {/* Colour */}
                        <td style={{ padding:"11px 14px",textAlign:"center" }}>
                          <div style={{ width:20,height:20,borderRadius:"50%",background:lbl.color,margin:"0 auto",boxShadow:"0 1px 4px rgba(0,0,0,0.15)" }}/>
                        </td>
                        {/* Type */}
                        <td style={{ padding:"11px 14px",textAlign:"center" }}>
                          {isOrg
                            ? <span style={{ fontSize:10,fontWeight:700,padding:"2px 9px",borderRadius:20,background:C.primary+"10",color:C.navy }}>🏢 Org-wide</span>
                            : <span style={{ fontSize:10,fontWeight:700,padding:"2px 9px",borderRadius:20,background:C.green+"15",color:C.green }}>👤 Personal</span>}
                        </td>
                        {/* Active toggle */}
                        <td style={{ padding:"11px 14px",textAlign:"center" }}>
                          <div onClick={()=>toggleActive(lbl.id)}
                            style={{ display:"inline-flex",alignItems:"center",gap:5,cursor:"pointer" }}>
                            <div style={{ width:32,height:18,borderRadius:9,background:lbl.active?C.green:"#CBD5E1",position:"relative",transition:"background 0.2s" }}>
                              <div style={{ position:"absolute",top:2,left:lbl.active?16:2,width:14,height:14,borderRadius:"50%",background:"#fff",transition:"left 0.2s",boxShadow:"0 1px 3px rgba(0,0,0,0.2)" }}/>
                            </div>
                            <span style={{ fontSize:10,fontWeight:700,color:lbl.active?C.green:"#94A3B8" }}>{lbl.active?"On":"Off"}</span>
                          </div>
                        </td>
                        {/* Actions */}
                        <td style={{ padding:"11px 14px",textAlign:"center" }}>
                          {canDelete(lbl)
                            ? <button onClick={()=>deleteLabel(lbl.id)}
                                style={{ padding:"5px 12px",borderRadius:7,border:`1px solid ${C.red}30`,background:C.red+"06",color:C.red,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit" }}>
                                🗑 Delete
                              </button>
                            : <span style={{ fontSize:11,color:C.muted }}>—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop:14,padding:"9px 14px",borderRadius:9,background:"#F8FAFC",border:`1px solid ${C.border}`,fontSize:11,color:C.muted }}>
              <strong style={{ color:C.navy }}>Permissions: </strong>
              {role==="superadmin"&&"Admin — create org-wide labels; edit, toggle, and delete all labels."}
              {role==="vd"&&"Director — create personal labels; toggle and delete your own and your team's labels."}
              {role==="gp"&&"Consultant — create personal labels; toggle and delete your own labels."}
            </div>
          </>);
        })()}

        {/* ═══ ATTACHMENTS ═══ */}
        {activeSection==="Attachments" && (()=>{
          const myName = role==="gp"?"Anna Klein":role==="vd"?"Thomas Müller":"Super Admin";
          const isOrg  = (a) => !a.createdBy||a.createdBy==="superadmin";
          const isMine = (a) => a.createdBy===myName;
          const canDel = (a) => role==="superadmin"||(role==="vd"&&!isOrg(a))||isMine(a);

          const deleteAtt = (id) => {
            const att = attachments.find(a=>a.id===id);
            if(att?.usedIn>0 && !window.confirm(`"${att.name}" is used in ${att.usedIn} template(s). Remove anyway?`)) return;
            const u=attachments.filter(a=>a.id!==id); setAttachments(u); setATTACHMENTS_STORE(u);
          };
          const saveNewAtt = () => {
            if(!newAttName.trim()) return;
            const fileName = newAttFile?.name||`${newAttName.toLowerCase().replace(/\s+/g,"_")}.pdf`;
            const size = newAttFile ? `${(newAttFile.size/1048576).toFixed(1)} MB` : "—";
            const ext  = fileName.split(".").pop().toUpperCase();
            const a = { id:`att-${Date.now()}`, name:newAttName.trim(), file:fileName, size, type:ext, lang:newAttLang, createdBy:myName, usedIn:0 };
            const u=[...attachments,a]; setAttachments(u); setATTACHMENTS_STORE(u);
            setShowNewAtt(false); setNewAttName(""); setNewAttLang("de"); setNewAttFile(null);
          };

          const TYPE_COLOR = { PDF:C.red, DOCX:C.blue, XLSX:C.green, PNG:C.purple, JPG:C.amber };

          const filtered = [...attachments]
            .filter(a=>{
              if(attFilterLang!=="all" && a.lang!==attFilterLang) return false;
              if(attFilterType==="org"  && !isOrg(a))  return false;
              if(attFilterType==="mine" && !isMine(a)) return false;
              if(attSearch && !a.name.toLowerCase().includes(attSearch.toLowerCase()) &&
                 !a.file.toLowerCase().includes(attSearch.toLowerCase())) return false;
              return true;
            })
            .sort((a,b)=>{
              const av=a[attSortCol]||""; const bv=b[attSortCol]||"";
              const c=typeof av==="number"?av-bv:String(av).localeCompare(String(bv));
              return attSortDir==="asc"?c:-c;
            });

          const thA = (col) => ({
            padding:"10px 14px",textAlign:"left",fontSize:10,fontWeight:700,
            color:attSortCol===col?C.navy:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",
            whiteSpace:"nowrap",cursor:"pointer",userSelect:"none",background:"#FAFAFA",
            borderBottom:`2px solid ${C.border}`,
          });
          const siA = (col) => attSortCol===col?(attSortDir==="asc"?" ↑":" ↓"):"";
          const tsA = (col) => ()=>{ setAttSortCol(col); setAttSortDir(d=>attSortCol===col?(d==="asc"?"desc":"asc"):"asc"); };

          return (<>
            {/* Header */}
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16 }}>
              <div>
                <div style={{ fontSize:20,fontWeight:800,color:C.navy,marginBottom:4 }}>📎 Attachments</div>
                <div style={{ fontSize:12,color:C.muted }}>
                  {attachments.length} files · Upload PDFs, docs, or images to attach to email templates
                </div>
              </div>
              <button onClick={()=>setShowNewAtt(v=>!v)}
                style={{ padding:"8px 18px",borderRadius:9,border:"none",background:C.primary,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer" }}>
                {showNewAtt?"✕ Cancel":"⬆ Upload Attachment"}
              </button>
            </div>

            {/* Upload form */}
            {showNewAtt && (
              <div style={{ padding:"18px 20px",borderRadius:12,border:`1.5px solid ${C.indigo}30`,background:C.indigo+"04",marginBottom:16 }}>
                <div style={{ fontSize:13,fontWeight:700,color:C.text,marginBottom:14 }}>Upload New Attachment</div>
                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12 }}>
                  <div>
                    <label style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:5 }}>Display Name *</label>
                    <input value={newAttName} onChange={e=>setNewAttName(e.target.value)} placeholder="e.g. Product Brochure 2026"
                      style={{ width:"100%",padding:"9px 12px",borderRadius:8,border:`1.5px solid ${C.border}`,fontSize:13,fontFamily:"inherit",boxSizing:"border-box",outline:"none" }}/>
                  </div>
                  <div>
                    <label style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:5 }}>Language</label>
                    <div style={{ position:"relative" }}>
                      <select value={newAttLang} onChange={e=>setNewAttLang(e.target.value)}
                        style={{ width:"100%",padding:"9px 26px 9px 12px",borderRadius:8,border:`1.5px solid ${C.border}`,fontSize:13,fontFamily:"inherit",appearance:"none",outline:"none",background:"#fff" }}>
                        <option value="de">🇩🇪 German (DE)</option>
                        <option value="en">🇬🇧 English (EN)</option>
                        <option value="all">🌐 Both / Universal</option>
                      </select>
                      <span style={{ position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",pointerEvents:"none",fontSize:9,color:C.muted }}>▼</span>
                    </div>
                  </div>
                </div>
                {/* File drop zone */}
                <div>
                  <label style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:6 }}>File *</label>
                  <label style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:8,padding:"22px",borderRadius:10,
                    border:`2px dashed ${newAttFile?C.green:C.border}`,background:newAttFile?C.green+"04":"#F8FAFC",
                    cursor:"pointer",textAlign:"center" }}>
                    <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg" onChange={e=>setNewAttFile(e.target.files[0])}
                      style={{ display:"none" }}/>
                    <span style={{ fontSize:24 }}>{newAttFile?"✅":"📂"}</span>
                    <span style={{ fontSize:12,fontWeight:600,color:newAttFile?C.green:C.slate }}>
                      {newAttFile?newAttFile.name:"Click to select a file"}
                    </span>
                    <span style={{ fontSize:10,color:C.muted }}>PDF, DOCX, XLSX, PNG, JPG · max 10 MB</span>
                  </label>
                </div>
                <div style={{ display:"flex",justifyContent:"flex-end",gap:10,marginTop:14 }}>
                  <button onClick={()=>{ setShowNewAtt(false); setNewAttName(""); setNewAttFile(null); }}
                    style={{ padding:"8px 18px",borderRadius:8,border:`1px solid ${C.border}`,background:"#fff",color:C.slate,fontSize:13,fontWeight:600,cursor:"pointer" }}>Cancel</button>
                  <button onClick={saveNewAtt} disabled={!newAttName.trim()}
                    style={{ padding:"8px 18px",borderRadius:8,border:"none",background:newAttName.trim()?C.primary:"#E2E8F0",color:newAttName.trim()?"#fff":C.muted,fontSize:13,fontWeight:700,cursor:newAttName.trim()?"pointer":"default" }}>
                    ⬆ Upload
                  </button>
                </div>
              </div>
            )}

            {/* Search + Filters */}
            <div style={{ display:"flex",gap:8,marginBottom:14,alignItems:"center",flexWrap:"wrap" }}>
              <div style={{ display:"flex",alignItems:"center",gap:8,padding:"7px 12px",background:"#fff",borderRadius:9,border:`1px solid ${C.border}`,flex:"0 1 220px" }}>
                <span style={{ color:C.muted,fontSize:13 }}>🔍</span>
                <input value={attSearch} onChange={e=>setAttSearch(e.target.value)} placeholder="Search attachments…"
                  style={{ border:"none",background:"transparent",fontSize:12,fontFamily:"inherit",color:C.text,outline:"none",width:"100%" }}/>
                {attSearch && <button onClick={()=>setAttSearch("")} style={{ border:"none",background:"none",color:C.muted,cursor:"pointer",fontSize:13,padding:0 }}>×</button>}
              </div>
              {(()=>{ const a=attFilterLang!=="all"; return (
                <div style={{ position:"relative" }}>
                  <select value={attFilterLang} onChange={e=>setAttFilterLang(e.target.value)}
                    style={{ padding:"7px 26px 7px 10px",borderRadius:8,border:`1.5px solid ${a?C.primary:C.border}`,background:a?C.primary+"08":"#fff",color:a?C.navy:C.muted,fontSize:11,fontFamily:"inherit",appearance:"none",cursor:"pointer",outline:"none",fontWeight:a?700:400 }}>
                    <option value="all">Language</option>
                    <option value="de">🇩🇪 German (DE)</option>
                    <option value="en">🇬🇧 English (EN)</option>
                    <option value="all2">🌐 Universal</option>
                  </select>
                  <span style={{ position:"absolute",right:7,top:"50%",transform:"translateY(-50%)",pointerEvents:"none",fontSize:9,color:C.muted }}>▼</span>
                </div>
              );})()}
              {(()=>{ const a=attFilterType!=="all"; return (
                <div style={{ position:"relative" }}>
                  <select value={attFilterType} onChange={e=>setAttFilterType(e.target.value)}
                    style={{ padding:"7px 26px 7px 10px",borderRadius:8,border:`1.5px solid ${a?C.primary:C.border}`,background:a?C.primary+"08":"#fff",color:a?C.navy:C.muted,fontSize:11,fontFamily:"inherit",appearance:"none",cursor:"pointer",outline:"none",fontWeight:a?700:400 }}>
                    <option value="all">Type</option>
                    <option value="org">🏢 Org-wide</option>
                    <option value="mine">👤 Mine</option>
                  </select>
                  <span style={{ position:"absolute",right:7,top:"50%",transform:"translateY(-50%)",pointerEvents:"none",fontSize:9,color:C.muted }}>▼</span>
                </div>
              );})()}
              {(attSearch||attFilterLang!=="all"||attFilterType!=="all") && (
                <button onClick={()=>{ setAttSearch(""); setAttFilterLang("all"); setAttFilterType("all"); }}
                  style={{ padding:"7px 12px",borderRadius:8,border:`1px solid ${C.border}`,background:"#fff",color:C.muted,fontSize:11,cursor:"pointer",fontFamily:"inherit" }}>✕ Clear</button>
              )}
              <span style={{ marginLeft:"auto",fontSize:11,color:C.muted }}>{filtered.length} of {attachments.length}</span>
            </div>

            {/* Table */}
            <div style={{ background:"#fff",border:`1px solid ${C.border}`,borderRadius:12,overflowX:"auto" }}>
              <table style={{ width:"100%",minWidth:700,borderCollapse:"collapse",fontSize:12 }}>
                <thead>
                  <tr>
                    <th onClick={tsA("name")} style={{...thA("name"),minWidth:180}}>Name{siA("name")}</th>
                    <th onClick={tsA("file")} style={{...thA("file"),minWidth:160}}>File{siA("file")}</th>
                    <th onClick={tsA("type")} style={{...thA("type"),width:72,textAlign:"center"}}>Format{siA("type")}</th>
                    <th onClick={tsA("size")} style={{...thA("size"),width:80,textAlign:"center"}}>Size{siA("size")}</th>
                    <th onClick={tsA("lang")} style={{...thA("lang"),width:96,textAlign:"center"}}>Language{siA("lang")}</th>
                    <th style={{ padding:"10px 14px",fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",background:"#FAFAFA",borderBottom:`2px solid ${C.border}`,width:110,textAlign:"center",cursor:"default" }}>Owner</th>
                    <th onClick={tsA("usedIn")} style={{...thA("usedIn"),width:90,textAlign:"center"}}>Used In{siA("usedIn")}</th>
                    <th style={{ padding:"10px 14px",fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",background:"#FAFAFA",borderBottom:`2px solid ${C.border}`,width:120,textAlign:"center",cursor:"default" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length===0 && (
                    <tr><td colSpan={8} style={{ padding:"40px",textAlign:"center",color:C.muted,fontSize:13 }}>
                      No attachments match your filters.
                      {showNewAtt===false&&<><br/><button onClick={()=>setShowNewAtt(true)} style={{ marginTop:10,padding:"7px 16px",borderRadius:8,border:"none",background:C.primary,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer" }}>⬆ Upload first attachment</button></>}
                    </td></tr>
                  )}
                  {filtered.map((a,i)=>{
                    const tc = TYPE_COLOR[a.type]||C.muted;
                    const rowBg = i%2===0?"#fff":"#FAFAFA";
                    return (
                      <tr key={a.id} style={{ borderBottom:`1px solid ${C.border}`,background:rowBg }}
                        onMouseEnter={e=>e.currentTarget.style.background="#F0F4FF"}
                        onMouseLeave={e=>e.currentTarget.style.background=rowBg}>
                        {/* Name */}
                        <td style={{ padding:"11px 14px" }}>
                          <div style={{ fontWeight:700,color:C.text }}>{a.name}</div>
                        </td>
                        {/* Filename */}
                        <td style={{ padding:"11px 14px",fontFamily:"monospace",fontSize:11,color:C.muted,maxWidth:160,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>
                          {a.file}
                        </td>
                        {/* Format badge */}
                        <td style={{ padding:"11px 14px",textAlign:"center" }}>
                          <span style={{ fontSize:10,fontWeight:800,padding:"2px 8px",borderRadius:6,background:tc+"18",color:tc }}>
                            {a.type}
                          </span>
                        </td>
                        {/* Size */}
                        <td style={{ padding:"11px 14px",textAlign:"center",fontFamily:"monospace",fontSize:11,color:C.muted }}>
                          {a.size}
                        </td>
                        {/* Language */}
                        <td style={{ padding:"11px 14px",textAlign:"center" }}>
                          <span style={{ fontSize:11,fontWeight:700,padding:"2px 9px",borderRadius:20,
                            background:a.lang==="en"?"#EFF6FF":a.lang==="de"?"#FFF7ED":"#F0FDF4",
                            color:a.lang==="en"?C.blue:a.lang==="de"?C.amber:C.green }}>
                            {a.lang==="en"?"🇬🇧 EN":a.lang==="de"?"🇩🇪 DE":"🌐 All"}
                          </span>
                        </td>
                        {/* Owner */}
                        <td style={{ padding:"11px 14px",textAlign:"center" }}>
                          {isOrg(a)
                            ? <span style={{ fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:20,background:C.primary+"10",color:C.navy }}>🏢 Org-wide</span>
                            : <span style={{ fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:20,background:C.green+"15",color:C.green }}>👤 {a.createdBy?.split(" ")[0]}</span>}
                        </td>
                        {/* Used In */}
                        <td style={{ padding:"11px 14px",textAlign:"center" }}>
                          {a.usedIn>0
                            ? <span style={{ fontSize:12,fontWeight:700,color:C.indigo }}>{a.usedIn} template{a.usedIn!==1?"s":""}</span>
                            : <span style={{ fontSize:11,color:C.muted }}>—</span>}
                        </td>
                        {/* Actions */}
                        <td style={{ padding:"11px 14px",textAlign:"center" }}>
                          <div style={{ display:"flex",gap:6,justifyContent:"center" }}>
                            <button onClick={()=>alert(`Downloading "${a.file}"…`)}
                              style={{ padding:"4px 10px",borderRadius:6,border:`1px solid ${C.border}`,background:"#fff",color:C.slate,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>
                              ⬇
                            </button>
                            {canDel(a) && (
                              <button onClick={()=>deleteAtt(a.id)}
                                style={{ padding:"4px 10px",borderRadius:6,border:`1px solid ${C.red}30`,background:C.red+"06",color:C.red,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit" }}>
                                🗑
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Usage note */}
            <div style={{ marginTop:14,padding:"10px 14px",borderRadius:9,background:"#F8FAFC",border:`1px solid ${C.border}`,fontSize:11,color:C.muted,lineHeight:1.7 }}>
              <strong style={{ color:C.navy }}>How to use: </strong>
              Go to <strong>Email Templates</strong> → Edit any template → click <strong>📎 Attach File</strong> to attach files from this library.
              Attachments are sent alongside the email when triggered by automation or bulk campaign.
              Files uploaded here are stored centrally — deleting a file removes it from all templates using it.
            </div>
          </>);
        })()}

      </div>
    </div>
  );
};

// ─── Email Automation Page (EM-01 to EM-07) ───────────────────────────────────
// ─── Email Template Data ──────────────────────────────────────────────────────
