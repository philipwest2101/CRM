import React, { useState } from "react";
import { Avatar } from "../ui/avatar";
import { C } from "../../theme";
import { useT } from "../../lib/i18n";

export const TopNav = ({ page, setPage, role, setRole, version, setVersion, pushRef, lang, setLang, viewMode, setViewMode }) => {
  const t = useT();
  const roles = { superadmin:{label:t("superAdmin"),abbr:"SA",color:C.navy}, vd:{label:t("salesDirector"),abbr:"VD",color:C.indigo}, gp:{label:t("advisor"),abbr:"GP",color:C.green} };
  const r = roles[role];
  const userName = role==="gp"?"Anna Klein":role==="vd"?"Thomas Müller":role==="manager"?"Julia Bauer":"Super Admin";
  const [menuOpen,    setMenuOpen]    = useState(null);   // which top-menu dropdown is open
  const [profileOpen, setProfileOpen] = useState(false);  // profile dropdown
  const [drawerOpen,  setDrawerOpen]  = useState(false);  // mobile (responsive) menu

  const responsive = viewMode === "responsive";
  // Design system: solid orange chrome (#FF9000). See LH-Vion Design Ref §8.1.
  const headerBg = "#FF9000";

  // ── Nav items (shared by the desktop bar and the mobile drawer) ─────────────
  const navItems = [
    { label:t("dashboard"), page:"Dashboard" },
    { label:t("contacts"),  page:"Leads",           sub:[[t("contactsList"),"Leads"],[t("bulkEmailsHistory"),"BulkEmailHistory"],[t("importsHistory"),"LeadCapture"]] },
    { label:t("calendar"),  page:"Calendar" },
    { label:t("newsletter"),page:"Newsletter" },
    { label:t("reports"),   page:"Reports",         sub:[["Report 1","Reports"],["Report 2","Reports"],["Report 3","Reports"]] },
  ].filter((_,i)=> version!=="mvp" || i < 4);

  const isActive = (item) => page===item.page
    || (item.page==="Leads" && (page==="AutoAssign"||page==="LeadCapture"||page==="LeadDetail"||page==="BulkEmailHistory"))
    || (item.page==="Calendar" && (page==="Appointments"||page==="Reminders"||page==="Activities"));

  const go = (dest) => { setPage(dest); setMenuOpen(null); setDrawerOpen(false); };

  // ── Brand logo ──────────────────────────────────────────────────────────────
  const Logo = () => (
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
  );

  // ── Desktop ⇄ Responsive switch ─────────────────────────────────────────────
  // Segmented control on the desktop bar; a single "back to desktop" icon in the
  // compact mobile header. This is the requested top-menu view switcher.
  const ViewToggle = () => responsive ? (
    <button onClick={()=>setViewMode("desktop")} title={lang==="de"?"Zur Desktop-Ansicht wechseln":"Switch to desktop view"}
      style={{ background:"rgba(255,255,255,0.15)",border:"1px solid rgba(255,255,255,0.3)",borderRadius:7,padding:"5px 9px",cursor:"pointer",color:"#fff",fontSize:15,lineHeight:1,display:"flex",alignItems:"center" }}>
      🖥️
    </button>
  ) : (
    <div title={lang==="de"?"Desktop-/Mobil-Ansicht":"Desktop / mobile view"} style={{ display:"flex",gap:3,background:"rgba(255,255,255,0.18)",borderRadius:8,padding:3 }}>
      {[["desktop","🖥️"],["responsive","📱"]].map(([mode,icon])=>(
        <button key={mode} onClick={()=>setViewMode(mode)}
          title={mode==="desktop"?(lang==="de"?"Desktop-Ansicht":"Desktop view"):(lang==="de"?"Mobile Ansicht":"Mobile view")}
          style={{ padding:"4px 9px",borderRadius:6,border:"none",fontSize:13,lineHeight:1,cursor:"pointer",fontFamily:"inherit",background:viewMode===mode?"#fff":"transparent",opacity:viewMode===mode?1:0.7 }}>
          {icon}
        </button>
      ))}
    </div>
  );

  // ── Role switcher (shared) ──────────────────────────────────────────────────
  const RoleSwitch = ({ light=false }) => (
    <div style={{ display:"flex",gap:3,background:light?C.light:"rgba(255,255,255,0.18)",borderRadius:8,padding:3 }}>
      {Object.entries(roles).map(([key,v])=>(
        <button key={key} onClick={()=>setRole(key)}
          style={{ padding:"4px 11px",borderRadius:6,border:"none",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit",
            background: role===key ? (light?v.color:"#fff") : "transparent",
            color: role===key ? (light?"#fff":v.color) : (light?C.slate:"rgba(255,255,255,0.85)") }}>
          {v.abbr}
        </button>
      ))}
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // RESPONSIVE (mobile) header — logo, view switch and a hamburger that opens a
  // full-width menu sheet. Kept within the phone-width frame.
  // ─────────────────────────────────────────────────────────────────────────────
  if (responsive) {
    const rowBase = (active) => ({ padding:"13px 18px",fontSize:14.5,cursor:"pointer",display:"flex",alignItems:"center",gap:10,
      fontWeight: active?700:600, color: active?C.primaryDark:C.text, background: active?C.primarySoft:"#fff",
      borderLeft: active?`3px solid ${C.primary}`:"3px solid transparent" });
    const subRow = (active) => ({ padding:"10px 18px 10px 34px",fontSize:13,cursor:"pointer",background:"#fff",
      fontWeight: active?700:500, color: active?C.primaryDark:C.slate });

    return (
      <>
      <div style={{ background:headerBg,padding:"0 14px",display:"flex",alignItems:"center",height:54,gap:10,boxShadow:"0 1px 4px rgba(0,0,0,0.15)",position:"sticky",top:0,zIndex:200 }}>
        <Logo />
        <div style={{ marginLeft:"auto",display:"flex",alignItems:"center",gap:8 }}>
          <ViewToggle />
          <button onClick={()=>setDrawerOpen(o=>!o)} title={lang==="de"?"Menü":"Menu"} aria-label="Menu"
            style={{ background:"rgba(255,255,255,0.15)",border:"1px solid rgba(255,255,255,0.3)",borderRadius:7,padding:"6px 10px",cursor:"pointer",color:"#fff",fontSize:16,lineHeight:1,display:"flex",alignItems:"center" }}>
            {drawerOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {drawerOpen && (
        <div onClick={()=>setDrawerOpen(false)}
          style={{ position:"fixed",inset:0,zIndex:300,background:"rgba(0,0,0,0.35)",display:"flex",justifyContent:"center" }}>
          <div onClick={e=>e.stopPropagation()}
            style={{ width:430,maxWidth:"100%",marginTop:54,maxHeight:"calc(100vh - 54px)",overflowY:"auto",background:"#fff",boxShadow:"0 12px 34px rgba(0,0,0,0.22)" }}>
            {/* Nav */}
            {navItems.map(item=>(
              <div key={item.label}>
                <div onClick={()=> item.sub ? go(item.sub[0][1]) : go(item.page)} style={rowBase(isActive(item))}>
                  {item.label}
                </div>
                {item.sub && item.sub.map(([label,dest])=>(
                  <div key={label} onClick={()=>go(dest)} style={subRow(page===dest)}>{label}</div>
                ))}
              </div>
            ))}

            <div style={{ height:1,background:C.border,margin:"6px 0" }} />

            {/* View as (role) */}
            <div style={{ padding:"12px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:10 }}>
              <span style={{ fontSize:12,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.04em" }}>{t("viewAs")}</span>
              <RoleSwitch light />
            </div>

            {/* Language */}
            <div onClick={()=>{ setLang && setLang(lang==="en"?"de":"en"); }} style={{ ...rowBase(false),justifyContent:"space-between" }}>
              <span>🌐 {lang==="de"?"Sprache":"Language"}</span>
              <span style={{ fontSize:12,fontWeight:800,color:C.primaryDark }}>{lang==="en"?"EN":"DE"}</span>
            </div>

            {/* Settings */}
            <div onClick={()=>go("Settings")} style={rowBase(page==="Settings")}>⚙️ {lang==="de"?"Einstellungen":"Settings"}</div>

            <div style={{ height:1,background:C.border,margin:"6px 0" }} />

            {/* Profile */}
            <div style={{ padding:"12px 18px",display:"flex",alignItems:"center",gap:12 }}>
              <Avatar name={userName} size={36} color={r.color} />
              <div>
                <div style={{ fontSize:14,fontWeight:800,color:C.navy }}>{userName}</div>
                <div style={{ fontSize:12,color:C.muted }}>{r.label}</div>
              </div>
            </div>
            {version!=="mvp" && (
              <div onClick={()=>go("Settings")} style={rowBase(false)}>👤 {lang==="de"?"Mein Profil":"My Profile"}</div>
            )}
            <div onClick={()=>setDrawerOpen(false)} style={rowBase(false)}>↪️ {lang==="de"?"Abmelden":"Logout"}</div>
          </div>
        </div>
      )}
      </>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // DESKTOP header (default)
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <>
    <div style={{ background:headerBg,padding:"0 28px",display:"flex",alignItems:"center",height:80,gap:24,boxShadow:"0 1px 4px rgba(0,0,0,0.15)",position:"sticky",top:0,zIndex:200 }}>
      <Logo />
      <div style={{ display:"flex",gap:2 }}>
        {navItems.map(item=>{
          const active = isActive(item);
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
        <RoleSwitch />
        <ViewToggle />
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
