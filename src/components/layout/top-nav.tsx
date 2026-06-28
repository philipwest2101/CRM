import React, { useState } from "react";
import { Avatar } from "../ui/avatar";
import { C } from "../../theme";
import { useT } from "../../lib/i18n";

export const TopNav = ({ page, setPage, role, setRole, version, setVersion, pushRef, lang, setLang }) => {
  const t = useT();
  const roles = { superadmin:{label:t("superAdmin"),abbr:"SA",color:C.navy}, vd:{label:t("salesDirector"),abbr:"VD",color:C.indigo}, gp:{label:t("consultant"),abbr:"GP",color:C.green} };
  const r = roles[role];
  const userName = role==="gp"?"Anna Klein":role==="vd"?"Thomas Müller":role==="manager"?"Julia Bauer":"Super Admin";
  const [menuOpen,    setMenuOpen]    = useState(null);   // which top-menu dropdown is open
  const [profileOpen, setProfileOpen] = useState(false);  // profile dropdown

  return (
    <>
    <div style={{ background:"linear-gradient(90deg, #FF9000 0%, #FFB733 55%, #FFC94F 100%)",padding:"0 28px",display:"flex",alignItems:"center",height:54,gap:24,boxShadow:"0 1px 4px rgba(0,0,0,0.15)",position:"sticky",top:0,zIndex:200 }}>
      <div style={{ display:"flex",alignItems:"center",gap:9,flexShrink:0 }}>
        <svg width="30" height="30" viewBox="0 0 30 30" fill="none" style={{ flexShrink:0 }} aria-hidden="true">
          <circle cx="15" cy="15" r="13" stroke="#fff" strokeWidth="2" />
          <path d="M9.5 9.5 L20.5 20.5 M20.5 9.5 L9.5 20.5" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
        <span style={{ color:"#fff",fontSize:17,letterSpacing:"-0.02em" }}>
          <span style={{ fontWeight:800 }}>vion</span><span style={{ fontWeight:400,color:"rgba(255,255,255,0.92)" }}>world</span>
          <span style={{ color:"rgba(255,255,255,0.5)",fontWeight:300,margin:"0 7px" }}>|</span>
          <span style={{ fontWeight:600,letterSpacing:"0.04em" }}>CRM</span>
        </span>
      </div>
      <div style={{ display:"flex",gap:2 }}>
        {[
          { label:t("dashboard"), page:"Dashboard" },
          { label:t("contacts"),  page:"Leads",           sub:[[t("contactsList"),"Leads"],[t("bulkEmailsHistory"),"BulkEmailHistory"],[t("importsHistory"),"LeadCapture"]] },
          { label:t("calendar"),  page:"Calendar" },
          { label:t("newsletter"),page:"Email Marketing" },
          { label:t("reports"),   page:"Reports",         sub:[["Report 1","Reports"],["Report 2","Reports"],["Report 3","Reports"]] },
        ].filter((_,i)=> version!=="mvp" || i < 3).map(item=>{
          const active = page===item.page
            || (item.page==="Leads" && (page==="AutoAssign"||page==="LeadCapture"||page==="LeadDetail"||page==="BulkEmailHistory"))
            || (item.page==="Calendar" && (page==="Appointments"||page==="Reminders"||page==="Activities"));
          return (
            <div key={item.label} style={{ position:"relative" }}>
              <button onClick={()=>{ if(item.sub){ setMenuOpen(menuOpen===item.label?null:item.label); } else { setPage(item.page); setMenuOpen(null); } }}
                style={{ padding:"6px 14px",background:active?"rgba(255,255,255,0.18)":"transparent",border:"none",borderRadius:6,color:"#fff",fontSize:13,fontWeight:active?700:500,cursor:"pointer",fontFamily:"inherit",borderBottom:active?"2px solid #fff":"2px solid transparent",display:"flex",alignItems:"center",gap:5 }}>
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
        {/* Version toggle hidden during MVP review phase — re-enable by restoring this block */}
        <span style={{ fontSize:11,color:"rgba(255,255,255,0.8)" }}>{t("viewAs")}</span>
        <div style={{ display:"flex",gap:3,background:"rgba(255,255,255,0.18)",borderRadius:8,padding:3 }}>
          {Object.entries(roles).map(([key,v])=>(
            <button key={key} onClick={()=>setRole(key)} style={{ padding:"4px 11px",borderRadius:6,border:"none",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit",background:role===key?"#fff":"transparent",color:role===key?v.color:"rgba(255,255,255,0.85)" }}>{v.abbr}</button>
          ))}
        </div>
        <button onClick={()=>setLang && setLang(lang==="en"?"de":"en")}
          title={lang==="en"?"Auf Deutsch wechseln":"Switch to English"}
          style={{ background:"rgba(255,255,255,0.15)",border:"1px solid rgba(255,255,255,0.3)",borderRadius:7,padding:"4px 10px",cursor:"pointer",color:"#fff",fontSize:14,display:"flex",alignItems:"center",gap:4 }}>
          🌐<span style={{ fontSize:10,fontWeight:700 }}>{lang==="en"?"EN":"DE"}</span>
        </button>
        <button onClick={()=>setPage("Settings")} title="Settings"
          style={{ background:"rgba(255,255,255,0.15)",border:"1px solid rgba(255,255,255,0.3)",borderRadius:7,padding:"5px 10px",cursor:"pointer",color:"#fff",fontSize:16,display:"flex",alignItems:"center" }}>
          ⚙️
        </button>
        {/* 👤 Profile dropdown */}
        <div style={{ position:"relative" }}>
          <button onClick={()=>setProfileOpen(o=>!o)}
            style={{ display:"flex",alignItems:"center",gap:8,background:profileOpen?"rgba(255,255,255,0.22)":"transparent",border:"none",borderRadius:8,padding:"3px 8px 3px 4px",cursor:"pointer" }}>
            <Avatar name={userName} size={28} color={r.color} />
            <span style={{ color:"#fff",fontSize:12,fontWeight:600 }}>Hi, {userName}</span>
            <span style={{ fontSize:9,color:"rgba(255,255,255,0.85)" }}>▾</span>
          </button>
          {profileOpen && (<>
            <div onClick={()=>setProfileOpen(false)} style={{ position:"fixed",inset:0,zIndex:250 }}/>
            <div style={{ position:"absolute",top:"calc(100% + 6px)",right:0,zIndex:260,background:"#fff",borderRadius:10,
              boxShadow:"0 8px 28px rgba(0,0,0,0.18)",border:`1px solid ${C.border}`,minWidth:180,padding:"6px 0" }}>
              <div style={{ padding:"8px 16px 6px",borderBottom:`1px solid ${C.border}`,marginBottom:4 }}>
                <div style={{ fontSize:13,fontWeight:800,color:C.navy }}>{userName}</div>
                <div style={{ fontSize:11,color:C.muted }}>{r.label}</div>
              </div>
              {[["👤 My Profile",()=>setPage("Settings")],["↪️ Logout",()=>{}]].filter(([label])=> version!=="mvp" || label!=="👤 My Profile").map(([label,fn])=>(
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

    </>
  );
};


// ─── P1 AI Data ───────────────────────────────────────────────────────────────
