import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Avatar } from "../ui/avatar";
import { NOTIFICATIONS } from "../../lib/core";
import { C } from "../../theme";

export const TopNav = ({ page, setPage, role, setRole, pushRef }) => {
  const roles = { superadmin:{label:"Super Admin",abbr:"SA",color:C.navy}, vd:{label:"Sales Director",abbr:"VD",color:C.indigo}, gp:{label:"Consultant (GP)",abbr:"GP",color:C.green}, manager:{label:"Product Owner",abbr:"PO",color:"#0891B2"} };
  const r = roles[role];
  const userName = role==="gp"?"Anna Klein":role==="vd"?"Thomas Müller":role==="manager"?"Julia Bauer":"Super Admin";
  const [notifOpen,   setNotifOpen]   = useState(false);
  const [notifs,      setNotifs]      = useState(NOTIFICATIONS);
  const [notifFilter, setNotifFilter] = useState("all");
  const [lang,        setLang]        = useState("EN");
  const [menuOpen,    setMenuOpen]    = useState(null);   // which top-menu dropdown is open
  const [profileOpen, setProfileOpen] = useState(false);  // profile dropdown
  const [pushToast,   setPushToast]   = useState(null);   // simulated push notification
  // Expose setPushToast to parent via ref so any page can fire a toast
  React.useEffect(() => { if (pushRef) pushRef.current = (title,body) => { setPushToast({title,body}); setTimeout(()=>setPushToast(null),4500); }; }, []);
  const [snoozeId,    setSnoozeId]    = useState(null);   // which notif has snooze open
  const [showCreate,  setShowCreate]  = useState(false);  // create reminder modal
  // create reminder state
  const [remTitle, setRemTitle]  = useState("");
  const [remDate,  setRemDate]   = useState("");
  const [remTime,  setRemTime]   = useState("");
  const [remNote,  setRemNote]   = useState("");
  const [remRecur,    setRemRecur]    = useState("none");
  const [remPriority, setRemPriority] = useState("normal");
  const [remEntity,   setRemEntity]   = useState("lead");
  const [remPrivacy,  setRemPrivacy]  = useState("title_only");
  const [remSaved,    setRemSaved]    = useState(false);

  const unread = notifs.filter(n=>!n.read).length;
  const markAllRead = () => setNotifs(prev=>prev.map(n=>({...n,read:true})));
  const markRead    = (id) => setNotifs(prev=>prev.map(n=>n.id===id?{...n,read:true}:n));
  const dismiss     = (id) => setNotifs(prev=>prev.filter(n=>n.id!==id));
  const snooze      = (id, mins) => {
    setNotifs(prev=>prev.map(n=>n.id===id?{...n,read:true,time:`Snoozed ${mins}min`}:n));
    setSnoozeId(null);
  };

  // Simulate push notification arriving after 4 seconds
  useEffect(()=>{
    const t = setTimeout(()=>{
      setPushToast({ icon:"⏰", title:"Reminder: Call Sandra Richter", body:"Follow-up call due — best window closes at 15:00", time:"Now" });
    }, 4000);
    return ()=>clearTimeout(t);
  },[]);

  const filtered = notifFilter==="all" ? notifs : notifs.filter(n=>n.type===notifFilter);

  const saveReminder = () => {
    if (!remTitle.trim()) return;
    const priorityColors = { high:"#DC2626", normal:"#4338CA", low:"#64748B" };
    const newNotif = {
      id: Date.now(), type:"reminder", icon:"⏰",
      color: priorityColors[remPriority]||"#7C3AED",
      priority: remPriority,
      title:`Reminder: ${remTitle}`, body:`${remDate} ${remTime}${remNote?` — ${remNote}`:""}`,
      time:"Scheduled", read:false, leadId:null, action:null
    };
    setNotifs(prev=>[newNotif,...prev]);
    setRemSaved(true);
    setTimeout(()=>{ setRemSaved(false); setShowCreate(false); setRemTitle(""); setRemDate(""); setRemTime(""); setRemNote(""); setRemRecur("none"); setRemPriority("normal"); setRemEntity("lead"); setRemPrivacy("title_only"); },1500);
  };

  return (
    <>
    <div style={{ background:C.primary,padding:"0 28px",display:"flex",alignItems:"center",height:54,gap:24,boxShadow:"0 1px 4px rgba(0,0,0,0.3)",position:"sticky",top:0,zIndex:200 }}>
      <span style={{ color:"#fff",fontWeight:800,fontSize:16,letterSpacing:"-0.02em",flexShrink:0 }}>vion world <span style={{ color:"rgba(255,255,255,0.45)",fontWeight:400 }}>|</span> <span style={{ color:"#60A5FA" }}>CRM</span></span>
      <div style={{ display:"flex",gap:2 }}>
        {[
          { label:"Dashboard", page:"Dashboard" },
          { label:"Contacts",  page:"Leads",           sub:[["Contacts List","Leads"],["Imports History","LeadCapture"]] },
          { label:"Calendar",  page:"Calendar" },
          { label:"Newsletter",page:"Email Marketing", sub:[["Bulk Emails History","Email Marketing"]] },
          { label:"Reports",   page:"Reports",         sub:[["Report 1","Reports"],["Report 2","Reports"],["Report 3","Reports"]] },
        ].map(item=>{
          const active = page===item.page
            || (item.page==="Leads" && (page==="AutoAssign"||page==="LeadCapture"||page==="LeadDetail"))
            || (item.page==="Calendar" && (page==="Appointments"||page==="Reminders"||page==="Activities"));
          return (
            <div key={item.label} style={{ position:"relative" }}>
              <button onClick={()=>{ setPage(item.page); setMenuOpen(item.sub ? (menuOpen===item.label?null:item.label) : null); }}
                style={{ padding:"6px 14px",background:active?"rgba(255,255,255,0.12)":"transparent",border:"none",borderRadius:6,color:active?"#60A5FA":"#CBD5E1",fontSize:13,fontWeight:active?700:400,cursor:"pointer",fontFamily:"inherit",borderBottom:active?"2px solid #60A5FA":"2px solid transparent",display:"flex",alignItems:"center",gap:5 }}>
                {item.label}{item.sub && <span style={{ fontSize:9,opacity:0.7 }}>▾</span>}
              </button>
              {item.sub && menuOpen===item.label && (<>
                <div onClick={()=>setMenuOpen(null)} style={{ position:"fixed",inset:0,zIndex:250 }}/>
                <div style={{ position:"absolute",top:"calc(100% + 6px)",left:0,zIndex:260,background:"#fff",borderRadius:10,
                  boxShadow:"0 8px 28px rgba(0,0,0,0.18)",border:`1px solid ${C.border}`,minWidth:190,padding:"6px 0" }}>
                  {item.sub.map(([label,dest])=>(
                    <div key={label} onClick={()=>{ setMenuOpen(null); setPage(dest); }}
                      style={{ padding:"9px 16px",fontSize:13,color:C.text,cursor:"pointer",fontWeight:500 }}
                      onMouseEnter={e=>e.currentTarget.style.background="#F8FAFC"}
                      onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                      {label}
                    </div>
                  ))}
                </div>
              </>)}
            </div>
          );
        })}
      </div>
      <div style={{ marginLeft:"auto",display:"flex",alignItems:"center",gap:12 }}>
        <span style={{ fontSize:11,color:"#94A3B8" }}>View as:</span>
        <div style={{ display:"flex",gap:3,background:"rgba(255,255,255,0.1)",borderRadius:8,padding:3 }}>
          {Object.entries(roles).map(([key,v])=>(
            <button key={key} onClick={()=>setRole(key)} style={{ padding:"4px 11px",borderRadius:6,border:"none",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit",background:role===key?"#fff":"transparent",color:role===key?v.color:"#94A3B8" }}>{v.abbr}</button>
          ))}
        </div>
        <button onClick={()=>setLang(l=>l==="EN"?"DE":"EN")}
          style={{ background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:7,padding:"4px 10px",cursor:"pointer",color:"#CBD5E1",fontSize:11,fontWeight:700,display:"flex",alignItems:"center",gap:4 }}>
          🌐 {lang}
        </button>
        {/* ➕ Quick create reminder */}
        <button onClick={()=>{setShowCreate(true);setNotifOpen(false);}} title="Create reminder"
          style={{ background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:7,padding:"5px 10px",cursor:"pointer",color:"#CBD5E1",fontSize:13,fontWeight:700,display:"flex",alignItems:"center",gap:5 }}>
          ⏰ <span style={{ fontSize:11 }}>Remind</span>
        </button>
        {/* 🔔 Notification bell */}
        <button onClick={()=>setNotifOpen(o=>!o)} style={{ position:"relative",background:notifOpen?"rgba(255,255,255,0.15)":"rgba(255,255,255,0.08)",border:"none",borderRadius:8,width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"#fff",fontSize:17,transition:"background 0.15s" }}>
          🔔
          {unread>0 && <span style={{ position:"absolute",top:4,right:4,width:16,height:16,borderRadius:"50%",background:C.red,border:"2px solid "+C.navy,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:800,color:"#fff",lineHeight:1 }}>{unread}</span>}
        </button>
        {/* 👤 Profile dropdown */}
        <div style={{ position:"relative" }}>
          <button onClick={()=>setProfileOpen(o=>!o)}
            style={{ display:"flex",alignItems:"center",gap:8,background:profileOpen?"rgba(255,255,255,0.12)":"transparent",border:"none",borderRadius:8,padding:"3px 8px 3px 4px",cursor:"pointer" }}>
            <Avatar name={userName} size={28} color={r.color} />
            <span style={{ color:"#fff",fontSize:12,fontWeight:600 }}>Hi, {userName}</span>
            <span style={{ fontSize:9,color:"#CBD5E1" }}>▾</span>
          </button>
          {profileOpen && (<>
            <div onClick={()=>setProfileOpen(false)} style={{ position:"fixed",inset:0,zIndex:250 }}/>
            <div style={{ position:"absolute",top:"calc(100% + 6px)",right:0,zIndex:260,background:"#fff",borderRadius:10,
              boxShadow:"0 8px 28px rgba(0,0,0,0.18)",border:`1px solid ${C.border}`,minWidth:180,padding:"6px 0" }}>
              <div style={{ padding:"8px 16px 6px",borderBottom:`1px solid ${C.border}`,marginBottom:4 }}>
                <div style={{ fontSize:13,fontWeight:800,color:C.navy }}>{userName}</div>
                <div style={{ fontSize:11,color:C.muted }}>{r.label}</div>
              </div>
              {[["👤 My Profile",()=>setPage("Settings")],["⚙️ Settings",()=>setPage("Settings")],["↪️ Logout",()=>{}]].map(([label,fn])=>(
                <div key={label} onClick={()=>{ setProfileOpen(false); fn(); }}
                  style={{ padding:"9px 16px",fontSize:13,color:C.text,cursor:"pointer",fontWeight:500 }}
                  onMouseEnter={e=>e.currentTarget.style.background="#F8FAFC"}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  {label}
                </div>
              ))}
            </div>
          </>)}
        </div>
      </div>
    </div>

    {/* ── Push Toast (phone notification simulation) ── */}
    {pushToast && (
      <div style={{ position:"fixed",top:64,right:20,width:320,borderRadius:16,
        background:"rgba(30,40,60,0.96)",backdropFilter:"blur(20px)",
        boxShadow:"0 8px 32px rgba(0,0,0,0.35)",zIndex:500,
        padding:"12px 14px",fontFamily:"inherit",border:"1px solid rgba(255,255,255,0.12)",
        animation:"slideIn 0.3s ease-out" }}>
        <div style={{ display:"flex",alignItems:"flex-start",gap:10 }}>
          <div style={{ width:36,height:36,borderRadius:10,background:"#7C3AED",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0 }}>⏰</div>
          <div style={{ flex:1,minWidth:0 }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:2 }}>
              <div style={{ fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.5)",textTransform:"uppercase",letterSpacing:"0.05em" }}>vion CRM · Now</div>
              <button onClick={()=>setPushToast(null)} style={{ background:"none",border:"none",color:"rgba(255,255,255,0.4)",fontSize:16,cursor:"pointer",lineHeight:1,padding:0 }}>×</button>
            </div>
            <div style={{ fontSize:13,fontWeight:700,color:"#fff",marginBottom:3 }}>{pushToast.title}</div>
            <div style={{ fontSize:11,color:"rgba(255,255,255,0.7)",lineHeight:1.4,marginBottom:10 }}>{pushToast.body}</div>
            <div style={{ display:"flex",gap:8 }}>
              <button onClick={()=>setPushToast(null)} style={{ flex:1,padding:"6px",borderRadius:8,border:"none",background:"rgba(255,255,255,0.12)",color:"rgba(255,255,255,0.8)",fontSize:11,fontWeight:600,cursor:"pointer" }}>Snooze 15 min</button>
              <button onClick={()=>{ setPushToast(null); setPage("Leads"); }} style={{ flex:1,padding:"6px",borderRadius:8,border:"none",background:"#7C3AED",color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer" }}>Open →</button>
            </div>
          </div>
        </div>
        <style>{`@keyframes slideIn{from{opacity:0;transform:translateX(40px)}to{opacity:1;transform:translateX(0)}}`}</style>
      </div>
    )}

    {/* ── Create Reminder Modal ── */}
    {showCreate && (
      <>
        <div onClick={()=>setShowCreate(false)} style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.35)",zIndex:400 }}/>
        <div style={{ position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",
          width:440,background:"#fff",borderRadius:16,zIndex:500,
          boxShadow:"0 24px 64px rgba(0,0,0,0.2)",fontFamily:"inherit",padding:"22px 24px" }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18 }}>
            <div style={{ fontSize:15,fontWeight:800,color:C.navy }}>⏰ Create Reminder</div>
            <button onClick={()=>setShowCreate(false)} style={{ width:26,height:26,borderRadius:"50%",border:`1px solid ${C.border}`,background:"#F8FAFC",color:C.muted,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>×</button>
          </div>

          {/* Title */}
          <div style={{ marginBottom:12 }}>
            <label style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:5 }}>Title</label>
            <input value={remTitle} onChange={e=>setRemTitle(e.target.value)} placeholder="e.g. Follow-up call with Peter Hoffmann"
              style={{ width:"100%",padding:"9px 12px",borderRadius:8,border:`1.5px solid ${C.border}`,fontSize:13,fontFamily:"inherit",boxSizing:"border-box",outline:"none" }}/>
          </div>

          {/* Entity type + Priority row */}
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12 }}>
            <div>
              <label style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:5 }}>Linked to</label>
              <select value={remEntity} onChange={e=>setRemEntity(e.target.value)}
                style={{ width:"100%",padding:"9px 12px",borderRadius:8,border:`1.5px solid ${C.border}`,fontSize:12,fontFamily:"inherit",boxSizing:"border-box",outline:"none",background:"#fff",color:C.text }}>
                <option value="lead">📋 Contact</option>
                <option value="contact">👤 Contact</option>
                <option value="deal">💼 Deal</option>
                <option value="appointment">📅 Appointment</option>
                <option value="task">✅ Task</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:5 }}>Priority</label>
              <div style={{ display:"flex",gap:4 }}>
                {[["low","Low","#64748B"],["normal","Normal","#4338CA"],["high","High","#DC2626"]].map(([k,l,col])=>(
                  <button key={k} onClick={()=>setRemPriority(k)}
                    style={{ flex:1,padding:"8px 4px",borderRadius:7,border:`1.5px solid ${remPriority===k?col:C.border}`,
                      background:remPriority===k?col+"12":"#fff",color:remPriority===k?col:C.muted,
                      fontSize:11,fontWeight:remPriority===k?700:400,cursor:"pointer",fontFamily:"inherit" }}>{l}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Date + Time */}
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12 }}>
            <div>
              <label style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:5 }}>Date</label>
              <input type="date" value={remDate} onChange={e=>setRemDate(e.target.value)}
                style={{ width:"100%",padding:"9px 12px",borderRadius:8,border:`1.5px solid ${C.border}`,fontSize:13,fontFamily:"inherit",boxSizing:"border-box",outline:"none" }}/>
            </div>
            <div>
              <label style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:5 }}>Time</label>
              <input type="time" value={remTime} onChange={e=>setRemTime(e.target.value)}
                style={{ width:"100%",padding:"9px 12px",borderRadius:8,border:`1.5px solid ${C.border}`,fontSize:13,fontFamily:"inherit",boxSizing:"border-box",outline:"none" }}/>
            </div>
          </div>

          {/* Recurrence */}
          <div style={{ marginBottom:12 }}>
            <label style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:5 }}>Recurrence</label>
            <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
              {[["none","Once"],["daily","Daily"],["weekly","Weekly"],["monthly","Monthly"]].map(([k,l])=>(
                <button key={k} onClick={()=>setRemRecur(k)}
                  style={{ padding:"5px 13px",borderRadius:20,border:`1.5px solid ${remRecur===k?"#7C3AED":C.border}`,background:remRecur===k?"#7C3AED0D":"#fff",color:remRecur===k?"#7C3AED":C.slate,fontSize:12,fontWeight:remRecur===k?700:400,cursor:"pointer",fontFamily:"inherit" }}>{l}</button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div style={{ marginBottom:12 }}>
            <label style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:5 }}>Note (optional)</label>
            <textarea value={remNote} onChange={e=>setRemNote(e.target.value)} placeholder="Any details for this reminder…"
              style={{ width:"100%",minHeight:52,padding:"9px 12px",borderRadius:8,border:`1.5px solid ${C.border}`,fontSize:12,fontFamily:"inherit",boxSizing:"border-box",resize:"none",outline:"none",lineHeight:1.5 }}/>
          </div>

          {/* Delivery + Privacy */}
          <div style={{ marginBottom:16,padding:"11px 14px",borderRadius:9,background:"#F8FAFC",border:`1px solid ${C.border}` }}>
            <div style={{ display:"flex",gap:16,marginBottom:10 }}>
              {[["📱 Push","push"],["🔔 In-app","inapp"]].map(([label,key])=>(
                <label key={key} style={{ display:"flex",alignItems:"center",gap:7,cursor:"pointer",fontSize:12,color:C.slate }}>
                  <input type="checkbox" defaultChecked style={{ accentColor:"#7C3AED",width:14,height:14 }}/>{label}
                </label>
              ))}
            </div>
            <div style={{ display:"flex",alignItems:"center",gap:10,paddingTop:8,borderTop:`1px solid ${C.border}` }}>
              <span style={{ fontSize:11,color:C.muted,flexShrink:0 }}>🔒 Lock screen:</span>
              <div style={{ display:"flex",gap:4 }}>
                {[["title_only","Title only"],["full","Full details"]].map(([k,l])=>(
                  <button key={k} onClick={()=>setRemPrivacy(k)}
                    style={{ padding:"4px 11px",borderRadius:6,border:`1px solid ${remPrivacy===k?"#7C3AED":C.border}`,
                      background:remPrivacy===k?"#7C3AED0D":"#fff",color:remPrivacy===k?"#7C3AED":C.muted,
                      fontSize:11,fontWeight:remPrivacy===k?700:400,cursor:"pointer",fontFamily:"inherit" }}>{l}</button>
                ))}
              </div>
              <span style={{ fontSize:10,color:C.muted,fontStyle:"italic" }}>
                {remPrivacy==="title_only"?"Shows 'You have a reminder'":"Shows full title on lock screen"}
              </span>
            </div>
          </div>

          {/* Save */}
          {remSaved ? (
            <div style={{ padding:"11px",borderRadius:9,background:C.green+"0A",border:`1px solid ${C.green}30`,textAlign:"center",fontSize:13,fontWeight:700,color:C.green }}>✅ Reminder saved</div>
          ) : (
            <div style={{ display:"flex",gap:10 }}>
              <button onClick={()=>setShowCreate(false)} style={{ flex:1,padding:"10px",borderRadius:9,border:`1px solid ${C.border}`,background:"#fff",color:C.slate,fontSize:13,fontWeight:600,cursor:"pointer" }}>Cancel</button>
              <button onClick={saveReminder} disabled={!remTitle.trim()||!remDate}
                style={{ flex:2,padding:"10px",borderRadius:9,border:"none",background:remTitle.trim()&&remDate?"#7C3AED":"#E2E8F0",color:remTitle.trim()&&remDate?"#fff":C.muted,fontSize:13,fontWeight:700,cursor:remTitle.trim()&&remDate?"pointer":"default" }}>
                ⏰ Save Reminder
              </button>
            </div>
          )}
        </div>
      </>
    )}

    {/* ── Notification Panel ── */}
    {notifOpen && (
      <>
        <div onClick={()=>setNotifOpen(false)} style={{ position:"fixed",inset:0,zIndex:250 }}/>
        <div style={{ position:"fixed",top:54,right:20,width:400,maxHeight:"calc(100vh - 74px)",background:"#fff",borderRadius:14,boxShadow:"0 12px 40px rgba(0,0,0,0.18)",zIndex:300,display:"flex",flexDirection:"column",fontFamily:"inherit",overflow:"hidden",border:`1px solid ${C.border}` }}>

          {/* Header */}
          <div style={{ padding:"14px 18px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0 }}>
            <div>
              <div style={{ fontSize:14,fontWeight:800,color:C.navy }}>Notifications</div>
              {unread>0 && <div style={{ fontSize:11,color:C.muted,marginTop:1 }}>{unread} unread</div>}
            </div>
            <div style={{ display:"flex",gap:8,alignItems:"center" }}>
              {unread>0 && <button onClick={markAllRead} style={{ fontSize:11,fontWeight:700,color:C.indigo,background:"none",border:"none",cursor:"pointer",padding:0 }}>Mark all read</button>}
              <button onClick={()=>{setShowCreate(true);setNotifOpen(false);}}
                style={{ padding:"5px 11px",borderRadius:7,border:"none",background:"#7C3AED",color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer" }}>
                + Reminder
              </button>
            </div>
          </div>

          {/* Filter pills */}
          <div style={{ padding:"10px 18px",borderBottom:`1px solid ${C.border}`,display:"flex",gap:6,flexShrink:0,flexWrap:"wrap" }}>
            {[["all","All"],["reminder","Reminders"],["lead","Contacts"],["appt","Appointments"],["alert","Alerts"]].map(([k,l])=>(
              <button key={k} onClick={()=>setNotifFilter(k)}
                style={{ padding:"3px 10px",borderRadius:20,border:`1px solid ${notifFilter===k?(k==="reminder"?"#7C3AED":C.primary):C.border}`,
                  background:notifFilter===k?(k==="reminder"?"#7C3AED":C.primary):"#fff",
                  color:notifFilter===k?"#fff":C.slate,
                  fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>{l}
                {k==="reminder" && notifs.filter(n=>n.type==="reminder"&&!n.read).length>0 && (
                  <span style={{ marginLeft:4,background:k===notifFilter?"rgba(255,255,255,0.3)":"#7C3AED",color:"#fff",borderRadius:10,padding:"0 5px",fontSize:9,fontWeight:800 }}>
                    {notifs.filter(n=>n.type==="reminder"&&!n.read).length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Notification list */}
          <div style={{ overflowY:"auto",flex:1 }}>
            {filtered.length===0 && (
              <div style={{ padding:"32px",textAlign:"center",color:C.muted,fontSize:13 }}>No notifications</div>
            )}
            {filtered.map(n=>(
              <div key={n.id}
                style={{ borderBottom:`1px solid ${C.border}`,background:n.read?"#fff":"#F8FAFF",
                  borderLeft:`3px solid ${n.priority==="high"?C.red:n.read?"transparent":n.color}`,transition:"background 0.1s" }}>
                <div onClick={()=>markRead(n.id)} style={{ padding:"12px 16px 8px",display:"flex",gap:12,alignItems:"flex-start",cursor:"pointer" }}>
                  <div style={{ width:34,height:34,borderRadius:9,background:n.color+"18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0 }}>{n.icon}</div>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8 }}>
                      <div style={{ fontSize:12,fontWeight:n.read?600:800,color:C.text,lineHeight:1.3 }}>{n.title}</div>
                      {!n.read && <div style={{ width:7,height:7,borderRadius:"50%",background:n.color,flexShrink:0,marginTop:3 }}/>}
                    </div>
                    <div style={{ fontSize:11,color:C.slate,marginTop:3,lineHeight:1.4 }}>{n.body}</div>
                    <div style={{ fontSize:10,color:C.muted,marginTop:4,fontWeight:600 }}>{n.time}</div>
                  </div>
                </div>

                {/* Action row */}
                <div style={{ padding:"6px 16px 10px",display:"flex",gap:7,marginLeft:46 }}>
                  {n.type==="reminder" && (
                    <div style={{ position:"relative" }}>
                      <button onClick={()=>setSnoozeId(snoozeId===n.id?null:n.id)}
                        style={{ padding:"3px 10px",borderRadius:6,border:`1px solid ${C.border}`,background:"#fff",color:C.slate,fontSize:10,fontWeight:600,cursor:"pointer" }}>
                        💤 Snooze
                      </button>
                      {snoozeId===n.id && (
                        <div style={{ position:"absolute",top:26,left:0,background:"#fff",borderRadius:9,boxShadow:"0 4px 16px rgba(0,0,0,0.15)",border:`1px solid ${C.border}`,zIndex:10,overflow:"hidden" }}>
                          {[["15 min",15],["1 hour",60],["Tomorrow",1440]].map(([label,mins])=>(
                            <button key={label} onClick={()=>snooze(n.id,label)}
                              style={{ display:"block",width:"100%",padding:"8px 16px",border:"none",background:"#fff",fontSize:12,color:C.text,cursor:"pointer",textAlign:"left",borderBottom:`1px solid ${C.border}` }}>
                              {label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {n.leadId && (
                    <button onClick={()=>{ markRead(n.id); setNotifOpen(false); setPage("Leads"); }}
                      style={{ padding:"3px 10px",borderRadius:6,border:"none",background:n.color+"15",color:n.color,fontSize:10,fontWeight:700,cursor:"pointer" }}>
                      Open Contact →
                    </button>
                  )}
                  <button onClick={()=>dismiss(n.id)}
                    style={{ marginLeft:"auto",padding:"3px 8px",borderRadius:6,border:"none",background:"none",color:C.muted,fontSize:11,cursor:"pointer" }}>
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{ padding:"10px 18px",borderTop:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0 }}>
            <button onClick={()=>{ setNotifOpen(false); setPage("Reminders"); }}
              style={{ fontSize:12,color:C.indigo,background:"none",border:"none",cursor:"pointer",fontWeight:600 }}>
              View all reminders →
            </button>
            <span style={{ fontSize:10,color:C.muted }}>Push via FCM · APNs</span>
          </div>
        </div>
      </>
    )}
    </>
  );
};


// ─── P1 AI Data ───────────────────────────────────────────────────────────────
