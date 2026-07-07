import React, { useState, useEffect, useRef, useCallback, useMemo, useContext } from "react";
import { EmailTemplateEditor } from "./email-template-editor";
import { EMAIL_TEMPLATES_STORE, JOURNEY_META, NL_TEMPLATES_STORE, pick, setEMAIL_TEMPLATES_STORE, setNL_TEMPLATES_STORE } from "../../lib/core";
import { LangContext } from "../../lib/i18n";
import { C } from "../../theme";

export const EmailTemplatesSection = ({ navigateTo, role }) => {
  const { lang: uiLang } = useContext(LangContext);
  const [kind,        setKind]        = useState("journey");   // journey | newsletter
  const [templates,   setTemplates]   = useState(EMAIL_TEMPLATES_STORE);
  const [nlTpls,      setNlTpls]      = useState(NL_TEMPLATES_STORE);
  const [editingTpl,  setEditingTpl]  = useState(null);
  const [search,      setSearch]      = useState("");
  const [filterLang,  setFilterLang]  = useState("all");
  const [filterType,  setFilterType]  = useState("all");   // all | mine | org
  const [filterActive,setFilterActive]= useState("all");   // all | active | inactive
  const [filterJourney,setFilterJourney]=useState("all");
  const [sortCol,     setSortCol]     = useState("name");
  const [sortDir,     setSortDir]     = useState("asc");

  const myName = role==="gp" ? "Anna Klein" : role==="vd" ? "Thomas Müller" : "Super Admin";
  const myRole = role;

  // ── Permissions ─────────────────────────────────────────────────────────────
  const isPersonal   = (t) => !!t.createdBy && t.createdBy !== "superadmin";
  const canCreate    = ["superadmin","vd","gp"].includes(role);
  const canEdit      = (t) => {
    if(role==="superadmin") return true;
    if(role==="vd") return !t.createdBy || t.createdBy===myName || t.createdByRole==="gp";
    if(role==="gp") return t.createdBy===myName;
    return false;
  };
  const canDelete = (t) => {
    if(role==="superadmin") return true;
    if(role==="vd") return t.createdBy && t.createdBy!=="superadmin";
    if(role==="gp") return t.createdBy===myName;
    return false;
  };
  const canToggle = (t) => role==="superadmin" || t.createdBy===myName;

  // ── CRUD ────────────────────────────────────────────────────────────────────
  const saveTemplate = (updated) => {
    const next = templates.map(t => t.id===updated.id ? updated : t);
    setTemplates(next); setEMAIL_TEMPLATES_STORE(next); setEditingTpl(null);
  };
  const deleteTemplate = (id) => {
    if(!window.confirm("Permanently delete this template? This cannot be undone.")) return;
    const next = templates.filter(t => t.id!==id);
    setTemplates(next); setEMAIL_TEMPLATES_STORE(next);
  };
  const toggleActive = (t) => {
    if(!canToggle(t)) return;
    const next = templates.map(x => x.id===t.id ? {...x, published:!x.published} : x);
    setTemplates(next); setEMAIL_TEMPLATES_STORE(next);
  };
  const addTemplate = () => {
    const fresh = {
      id:`et-${Date.now()}`, lang:filterLang==="all"?"de":filterLang,
      journey:filterJourney==="all"?"welcome":filterJourney,
      name:"New Template", subject:"", body:`Dear {{lead_name}},\n\n\n\nBest regards,\n{{advisor_name}}`,
      variables:["{{lead_name}}","{{advisor_name}}"], published:true,
      createdBy:myName, createdByRole:myRole, personal:role!=="superadmin",
    };
    const next = [...templates, fresh];
    setTemplates(next); setEMAIL_TEMPLATES_STORE(next); setEditingTpl(fresh);
  };

  // ── Newsletter templates (shared store with the Newsletter page) ────────────
  const deleteNlTemplate = (id) => {
    if(!window.confirm("Permanently delete this newsletter template? It will also disappear from the Newsletter page.")) return;
    const next = nlTpls.filter(t => t.id!==id);
    setNlTpls(next); setNL_TEMPLATES_STORE(next);
  };
  // Flatten a block-based newsletter template into a plain-text email template:
  // text-carrying blocks become paragraphs, {FirstName} becomes {{lead_name}},
  // purely visual blocks (logo, image, divider) are dropped.
  const convertNlTemplate = (tpl) => {
    const v = (x) => pick(x, uiLang) || "";
    const vars = (s) => s.replace(/\{FirstName\}/g, "{{lead_name}}");
    const body = (tpl.blocks||[]).map(b => {
      switch(b.type){
        case "heading": case "text": case "footer": case "imgtext": return v(b.text);
        case "button":  return `→ ${v(b.label)}${b.url && b.url!=="#" ? `: ${b.url}` : ""}`;
        case "html":    return v(b.html).replace(/<[^>]*>/g, "").trim();
        case "cols2": case "section": return (b.cells || [b.left, b.right]).map(v).filter(Boolean).join("\n");
        default:        return "";
      }
    }).filter(Boolean).join("\n\n");
    const fresh = {
      id:`et-nl-${Date.now()}`, lang:uiLang, journey:"newsletter",
      name:v(tpl.name), subject:vars(v(tpl.subject)), body:vars(body),
      variables:["{{lead_name}}","{{advisor_name}}"], published:true,
      createdBy:myName, createdByRole:myRole, personal:role!=="superadmin",
    };
    const next = [...templates, fresh];
    setTemplates(next); setEMAIL_TEMPLATES_STORE(next);
    setKind("journey"); setEditingTpl(fresh);
  };

  // ── Journey metadata ─────────────────────────────────────────────────────────
  // ── Filter + sort ─────────────────────────────────────────────────────────────
  const filtered = templates
    .filter(t => {
      if(filterLang!=="all"   && t.lang!==filterLang)                    return false;
      if(filterType==="mine"  && t.createdBy!==myName)                   return false;
      if(filterType==="org"   && (t.createdBy && t.createdBy!=="superadmin")) return false;
      if(filterActive==="active"   && t.published===false)               return false;
      if(filterActive==="inactive" && t.published!==false)               return false;
      if(filterJourney!=="all"     && t.journey!==filterJourney)         return false;
      if(role==="gp" && t.createdBy && t.createdBy!==myName && t.createdByRole!==undefined) return false;
      if(search) {
        const q = search.toLowerCase();
        if(!t.name.toLowerCase().includes(q) &&
           !(t.subject||"").toLowerCase().includes(q) &&
           !(t.journey||"").toLowerCase().includes(q)) return false;
      }
      return true;
    })
    .sort((a,b) => {
      let av = a[sortCol]||""; let bv = b[sortCol]||"";
      if(sortCol==="published") { av = a.published!==false?1:0; bv = b.published!==false?1:0; }
      const cmp = typeof av==="number" ? av-bv : String(av).localeCompare(String(bv));
      return sortDir==="asc" ? cmp : -cmp;
    });

  const thStyle = (col) => ({
    padding:"10px 14px", textAlign:"left", fontSize:10, fontWeight:700,
    color: sortCol===col ? C.navy : C.muted,
    textTransform:"uppercase", letterSpacing:"0.05em", whiteSpace:"nowrap",
    cursor:"pointer", userSelect:"none", background:"#FAFAFA",
    borderBottom:`2px solid ${C.border}`,
  });
  const sortIcon = (col) => sortCol===col ? (sortDir==="asc"?" ↑":" ↓") : "";

  const activeCount   = templates.filter(t=>t.published!==false).length;
  const inactiveCount = templates.filter(t=>t.published===false).length;
  const mineCount     = templates.filter(t=>t.createdBy===myName).length;
  const orgCount      = templates.filter(t=>!t.createdBy||t.createdBy==="superadmin").length;

  return (
    <>
      {editingTpl && (
        <EmailTemplateEditor
          template={editingTpl} journeyColor={JOURNEY_META[editingTpl.journey]?.color||C.navy}
          onSave={saveTemplate} onClose={()=>setEditingTpl(null)}/>
      )}

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16 }}>
        <div>
          <div style={{ fontSize:20,fontWeight:800,color:C.navy,marginBottom:4 }}>📝 Email Templates</div>
          {kind==="journey" ? (
            <div style={{ fontSize:12,color:C.muted,display:"flex",gap:14 }}>
              <span>{templates.length} total</span>
              <span style={{ color:C.green }}>● {activeCount} active</span>
              {inactiveCount>0 && <span style={{ color:C.red }}>● {inactiveCount} inactive</span>}
              <span>🏢 {orgCount} org-wide</span>
              {mineCount>0 && <span>👤 {mineCount} mine</span>}
            </div>
          ) : (
            <div style={{ fontSize:12,color:C.muted }}>
              {nlTpls.length} block-based templates · shared with the Newsletter page
            </div>
          )}
        </div>
        {kind==="journey" ? (canCreate && (
          <button onClick={addTemplate}
            style={{ padding:"8px 18px",borderRadius:9,border:"none",background:C.primary,color:"#fff",
              fontSize:12,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:6 }}>
            + New Template
          </button>
        )) : (
          <button onClick={()=>navigateTo && navigateTo("Newsletter")}
            style={{ padding:"8px 18px",borderRadius:9,border:"none",background:C.primary,color:"#fff",
              fontSize:12,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:6 }}>
            📰 Open Newsletter Editor →
          </button>
        )}
      </div>

      {/* ── Kind tabs — plain-text journey emails vs block-based newsletters ── */}
      <div style={{ display:"flex",gap:4,marginBottom:16,borderBottom:`1px solid ${C.border}` }}>
        {[["journey",`✉️ Journey Emails (${templates.length})`],["newsletter",`📰 Newsletter Templates (${nlTpls.length})`]].map(([k,l])=>(
          <button key={k} onClick={()=>setKind(k)}
            style={{ padding:"9px 16px",border:"none",background:"transparent",fontSize:13,fontFamily:"inherit",cursor:"pointer",
              fontWeight:kind===k?700:500,color:kind===k?C.navy:C.slate,
              borderBottom:kind===k?`2px solid ${C.primary}`:"2px solid transparent",marginBottom:-1 }}>
            {l}
          </button>
        ))}
      </div>

      {kind==="journey" && (<>
      {/* ── Role banner ────────────────────────────────────────────────── */}
      {role!=="superadmin" && (
        <div style={{ marginBottom:16,padding:"10px 14px",borderRadius:9,
          background:role==="gp"?C.green+"06":C.indigo+"06",
          border:`1px solid ${role==="gp"?C.green+"30":C.indigo+"30"}`,fontSize:11,color:C.slate,lineHeight:1.6 }}>
          {role==="gp" && <><strong style={{color:C.green}}>Your personal templates</strong> are available for both manual sends (Contact Detail) and bulk email campaigns. Org-wide templates are read-only.</>}
          {role==="vd" && <><strong style={{color:C.indigo}}>Your personal templates</strong> are available for both manual sends and bulk email campaigns. You can also manage your team's personal templates. Org-wide templates are read-only.</>}
        </div>
      )}

      {/* ── Search + Filters ───────────────────────────────────────────── */}
      <div style={{ display:"flex",gap:8,marginBottom:14,alignItems:"center",flexWrap:"wrap" }}>

        {/* Search */}
        <div style={{ display:"flex",alignItems:"center",gap:8,padding:"7px 12px",background:"#fff",
          borderRadius:9,border:`1px solid ${C.border}`,flex:"0 1 220px" }}>
          <span style={{ color:C.muted,fontSize:13 }}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name, subject…"
            style={{ border:"none",background:"transparent",fontSize:12,fontFamily:"inherit",color:C.text,outline:"none",width:"100%" }}/>
          {search && <button onClick={()=>setSearch("")} style={{ border:"none",background:"none",color:C.muted,cursor:"pointer",fontSize:13,padding:0 }}>×</button>}
        </div>

        {/* Language DDL */}
        {(()=>{ const active=filterLang!=="all";
          return <div style={{ position:"relative" }}>
            <select value={filterLang} onChange={e=>setFilterLang(e.target.value)}
              style={{ padding:"7px 26px 7px 10px",borderRadius:8,border:`1.5px solid ${active?C.primary:C.border}`,
                background:active?C.primary+"08":"#fff",color:active?C.navy:C.muted,
                fontSize:11,fontFamily:"inherit",appearance:"none",cursor:"pointer",outline:"none",fontWeight:active?700:400 }}>
              <option value="all">Language</option>
              <option value="de">🇩🇪 German (DE)</option>
              <option value="en">🇬🇧 English (EN)</option>
            </select>
            <span style={{ position:"absolute",right:7,top:"50%",transform:"translateY(-50%)",pointerEvents:"none",fontSize:9,color:C.muted }}>▼</span>
          </div>;
        })()}

        {/* Type DDL */}
        {(()=>{ const active=filterType!=="all";
          return <div style={{ position:"relative" }}>
            <select value={filterType} onChange={e=>setFilterType(e.target.value)}
              style={{ padding:"7px 26px 7px 10px",borderRadius:8,border:`1.5px solid ${active?C.primary:C.border}`,
                background:active?C.primary+"08":"#fff",color:active?C.navy:C.muted,
                fontSize:11,fontFamily:"inherit",appearance:"none",cursor:"pointer",outline:"none",fontWeight:active?700:400 }}>
              <option value="all">Type</option>
              <option value="org">🏢 Org-wide</option>
              <option value="mine">👤 My Templates</option>
            </select>
            <span style={{ position:"absolute",right:7,top:"50%",transform:"translateY(-50%)",pointerEvents:"none",fontSize:9,color:C.muted }}>▼</span>
          </div>;
        })()}

        {/* Visible DDL */}
        {(()=>{ const active=filterActive!=="all";
          return <div style={{ position:"relative" }}>
            <select value={filterActive} onChange={e=>setFilterActive(e.target.value)}
              style={{ padding:"7px 26px 7px 10px",borderRadius:8,border:`1.5px solid ${active?C.primary:C.border}`,
                background:active?C.primary+"08":"#fff",color:active?C.navy:C.muted,
                fontSize:11,fontFamily:"inherit",appearance:"none",cursor:"pointer",outline:"none",fontWeight:active?700:400 }}>
              <option value="all">Visible</option>
              <option value="active">● Active (On)</option>
              <option value="inactive">○ Inactive (Off)</option>
            </select>
            <span style={{ position:"absolute",right:7,top:"50%",transform:"translateY(-50%)",pointerEvents:"none",fontSize:9,color:C.muted }}>▼</span>
          </div>;
        })()}

        {/* Clear all */}
        {(search||filterLang!=="all"||filterType!=="all"||filterActive!=="all") && (
          <button onClick={()=>{ setSearch(""); setFilterLang("all"); setFilterType("all"); setFilterActive("all"); setFilterJourney("all"); }}
            style={{ padding:"7px 12px",borderRadius:8,border:`1px solid ${C.border}`,background:"#fff",color:C.muted,fontSize:11,cursor:"pointer",fontFamily:"inherit" }}>
            ✕ Clear
          </button>
        )}

        <span style={{ marginLeft:"auto",fontSize:11,color:C.muted }}>{filtered.length} of {templates.length}</span>
      </div>

      {/* ── Table ──────────────────────────────────────────────────────── */}
      <div style={{ background:"#fff",border:`1px solid ${C.border}`,borderRadius:12,overflowX:"auto" }}>
        <table style={{ width:"100%",minWidth:860,borderCollapse:"collapse",fontSize:12 }}>
          <thead>
            <tr>
              <th onClick={()=>{ setSortCol("name"); setSortDir(s=>sortCol==="name"?(s==="asc"?"desc":"asc"):"asc"); }} style={{...thStyle("name"),minWidth:160,maxWidth:220}}>Name{sortIcon("name")}</th>
              <th onClick={()=>{ setSortCol("subject"); setSortDir(s=>sortCol==="subject"?(s==="asc"?"desc":"asc"):"asc"); }} style={{...thStyle("subject"),minWidth:160,maxWidth:220}}>Subject{sortIcon("subject")}</th>
              <th onClick={()=>{ setSortCol("lang"); setSortDir(s=>sortCol==="lang"?(s==="asc"?"desc":"asc"):"asc"); }} style={{...thStyle("lang"),width:96,textAlign:"center"}}>Language{sortIcon("lang")}</th>
              <th onClick={()=>{ setSortCol("journey"); setSortDir(s=>sortCol==="journey"?(s==="asc"?"desc":"asc"):"asc"); }} style={{...thStyle("journey"),width:148}}>Journey{sortIcon("journey")}</th>
              <th style={{...thStyle("type"),width:128,cursor:"default"}}>Type</th>
              <th onClick={()=>{ setSortCol("published"); setSortDir(s=>sortCol==="published"?(s==="asc"?"desc":"asc"):"asc"); }} style={{...thStyle("published"),width:88,textAlign:"center"}}>Visible{sortIcon("published")}</th>
              <th style={{...thStyle("actions"),width:148,cursor:"default",textAlign:"center"}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length===0 && (
              <tr>
                <td colSpan={7} style={{ padding:"40px",textAlign:"center",color:C.muted,fontSize:13 }}>
                  {search ? `No templates match "${search}".` : "No templates match your filters."}
                  {canCreate && <><br/><button onClick={addTemplate} style={{ marginTop:12,padding:"7px 16px",borderRadius:8,border:"none",background:C.primary,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer" }}>+ Create first template</button></>}
                </td>
              </tr>
            )}
            {filtered.map((t,i) => {
              const meta     = JOURNEY_META[t.journey]||{label:t.journey||"—",color:C.navy};
              const isActive = t.published !== false;
              const isMine   = t.createdBy === myName;
              const isOrg    = !t.createdBy || t.createdBy==="superadmin";
              const rowBg    = i%2===0 ? "#fff" : "#FAFAFA";

              return (
                <tr key={t.id} style={{ borderBottom:`1px solid ${C.border}`,background:rowBg }}
                  onMouseEnter={e=>e.currentTarget.style.background="#F0F4FF"}
                  onMouseLeave={e=>e.currentTarget.style.background=rowBg}>

                  {/* Name */}
                  <td style={{ padding:"12px 14px",maxWidth:220 }}>
                    <div style={{ fontWeight:700,color:C.text,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{t.name}</div>
                    {t.body && <div style={{ fontSize:10,color:C.muted,marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>
                      {t.body.replace(/\{\{[^}]+\}\}/g,"…").replace(/\{[^}]+\}/g,"…").slice(0,55)}…
                    </div>}
                  </td>

                  {/* Subject */}
                  <td style={{ padding:"12px 14px",maxWidth:220 }}>
                    <div style={{ overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",color:C.slate }}>
                      {t.subject||<span style={{ color:C.muted,fontStyle:"italic" }}>No subject</span>}
                    </div>
                  </td>

                  {/* Language */}
                  <td style={{ padding:"12px 14px",textAlign:"center" }}>
                    <span style={{ fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:20,
                      background:t.lang==="en"?"#EFF6FF":"#FFF7ED",color:t.lang==="en"?C.blue:C.amber }}>
                      {t.lang==="en"?"🇬🇧 EN":"🇩🇪 DE"}
                    </span>
                  </td>

                  {/* Journey */}
                  <td style={{ padding:"12px 14px" }}>
                    <span style={{ fontSize:11,fontWeight:600,padding:"3px 10px",borderRadius:20,
                      background:meta.color+"18",color:meta.color }}>
                      {meta.label}
                    </span>
                  </td>

                  {/* Type */}
                  <td style={{ padding:"12px 14px",textAlign:"center" }}>
                    {isOrg
                      ? <span style={{ fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:20,background:C.primary+"10",color:C.navy }}>🏢 Org-wide</span>
                      : isMine
                        ? <span style={{ fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:20,background:C.green+"15",color:C.green }}>👤 My Template</span>
                        : <span style={{ fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:20,background:C.purple+"15",color:C.purple }}>👤 {t.createdBy?.split(" ")[0]}</span>}
                  </td>

                  {/* Visible toggle */}
                  <td style={{ padding:"12px 14px",textAlign:"center" }}>
                    {canToggle(t) ? (
                      <div onClick={()=>toggleActive(t)}
                        style={{ display:"inline-flex",alignItems:"center",gap:6,cursor:"pointer" }}
                        title={isActive?"Click to deactivate":"Click to activate"}>
                        <div style={{ width:34,height:19,borderRadius:10,background:isActive?C.green:"#CBD5E1",
                          position:"relative",transition:"background 0.2s",flexShrink:0 }}>
                          <div style={{ position:"absolute",top:2,left:isActive?17:2,width:15,height:15,
                            borderRadius:"50%",background:"#fff",transition:"left 0.2s",
                            boxShadow:"0 1px 3px rgba(0,0,0,0.2)" }}/>
                        </div>
                        <span style={{ fontSize:10,fontWeight:700,color:isActive?C.green:"#94A3B8" }}>
                          {isActive?"On":"Off"}
                        </span>
                      </div>
                    ) : (
                      <span style={{ fontSize:11,fontWeight:700,color:isActive?C.green:"#94A3B8" }}>
                        {isActive?"● On":"○ Off"}
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td style={{ padding:"12px 14px",textAlign:"center" }}>
                    <div style={{ display:"flex",gap:6,justifyContent:"center" }}>
                      {canEdit(t) ? (
                        <button onClick={()=>setEditingTpl(t)}
                          style={{ padding:"5px 12px",borderRadius:7,border:"none",background:meta.color,
                            color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit" }}>
                          ✏️ Edit
                        </button>
                      ) : (
                        <button onClick={()=>setEditingTpl(t)}
                          style={{ padding:"5px 12px",borderRadius:7,border:`1px solid ${C.border}`,background:"#fff",
                            color:C.muted,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>
                          👁 Preview
                        </button>
                      )}
                      {canDelete(t) && (
                        <button onClick={()=>deleteTemplate(t.id)}
                          style={{ padding:"5px 10px",borderRadius:7,border:`1px solid ${C.red}30`,background:C.red+"06",
                            color:C.red,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit" }}>
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

      {/* ── Permission footer ───────────────────────────────────────────── */}
      <div style={{ marginTop:16,padding:"10px 14px",borderRadius:9,background:"#F8FAFC",
        border:`1px solid ${C.border}`,fontSize:11,color:C.muted,lineHeight:1.7 }}>
        <strong style={{ color:C.navy }}>Permissions: </strong>
        {role==="superadmin" && "Admin — full access: create, edit, toggle visibility, and delete all templates."}
        {role==="vd"         && "Director — create personal templates; use in manual sends and bulk campaigns; edit & delete your own and your team's templates; org-wide templates are read-only."}
        {role==="gp"         && "Advisor — create personal templates; use in manual sends and bulk campaigns; edit & delete your own; org-wide templates are read-only."}
      </div>
      </>)}

      {/* ── Newsletter templates (shared with the Newsletter page) ───────── */}
      {kind==="newsletter" && (<>
        <div style={{ marginBottom:16,padding:"10px 14px",borderRadius:9,background:C.blue+"06",
          border:`1px solid ${C.blue}30`,fontSize:11,color:C.slate,lineHeight:1.6 }}>
          These <strong style={{ color:C.blue }}>block-based templates</strong> are shared with the Newsletter page — create and design them in the Newsletter editor.
          Use <strong>⇢ Convert</strong> to turn one into a plain-text email template for journeys, manual sends and bulk campaigns
          (text blocks become paragraphs, <code>{"{FirstName}"}</code> becomes <code>{"{{lead_name}}"}</code>).
        </div>

        <div style={{ background:"#fff",border:`1px solid ${C.border}`,borderRadius:12,overflowX:"auto" }}>
          <table style={{ width:"100%",minWidth:720,borderCollapse:"collapse",fontSize:12 }}>
            <thead>
              <tr>
                {([["Name",{minWidth:160}],["Description",{minWidth:180}],["Subject",{minWidth:180}],["Blocks",{width:72,textAlign:"center"}],["Actions",{width:250,textAlign:"center"}]] as [string, React.CSSProperties][]).map(([h,extra])=>(
                  <th key={h} style={{ padding:"10px 14px",textAlign:"left",fontSize:10,fontWeight:700,color:C.muted,
                    textTransform:"uppercase",letterSpacing:"0.05em",whiteSpace:"nowrap",background:"#FAFAFA",
                    borderBottom:`2px solid ${C.border}`,...extra }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {nlTpls.length===0 && (
                <tr>
                  <td colSpan={5} style={{ padding:"40px",textAlign:"center",color:C.muted,fontSize:13 }}>
                    No newsletter templates yet.
                    <br/><button onClick={()=>navigateTo && navigateTo("Newsletter")}
                      style={{ marginTop:12,padding:"7px 16px",borderRadius:8,border:"none",background:C.primary,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer" }}>
                      Create one in the Newsletter editor →
                    </button>
                  </td>
                </tr>
              )}
              {nlTpls.map((tpl,i)=>{
                const rowBg = i%2===0 ? "#fff" : "#FAFAFA";
                return (
                  <tr key={tpl.id} style={{ borderBottom:`1px solid ${C.border}`,background:rowBg }}
                    onMouseEnter={e=>e.currentTarget.style.background="#F0F4FF"}
                    onMouseLeave={e=>e.currentTarget.style.background=rowBg}>
                    <td style={{ padding:"12px 14px",fontWeight:700,color:C.text,fontSize:13 }}>{pick(tpl.name, uiLang)}</td>
                    <td style={{ padding:"12px 14px",color:C.slate }}>{pick(tpl.desc, uiLang)||<span style={{ color:C.muted,fontStyle:"italic" }}>—</span>}</td>
                    <td style={{ padding:"12px 14px",color:C.slate,maxWidth:240 }}>
                      <div style={{ overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>
                        {pick(tpl.subject, uiLang)||<span style={{ color:C.muted,fontStyle:"italic" }}>No subject</span>}
                      </div>
                    </td>
                    <td style={{ padding:"12px 14px",textAlign:"center" }}>
                      <span style={{ fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:20,background:C.blue+"12",color:C.blue }}>
                        🧱 {(tpl.blocks||[]).length}
                      </span>
                    </td>
                    <td style={{ padding:"12px 14px",textAlign:"center" }}>
                      <div style={{ display:"flex",gap:6,justifyContent:"center" }}>
                        {canCreate && (
                          <button onClick={()=>convertNlTemplate(tpl)} title="Create a plain-text email template from this newsletter"
                            style={{ padding:"5px 12px",borderRadius:7,border:"none",background:JOURNEY_META.newsletter.color,
                              color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit" }}>
                            ⇢ Convert
                          </button>
                        )}
                        <button onClick={()=>navigateTo && navigateTo("Newsletter")} title="Edit in the Newsletter block editor"
                          style={{ padding:"5px 12px",borderRadius:7,border:`1px solid ${C.border}`,background:"#fff",
                            color:C.slate,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>
                          ✏️ Edit in Newsletter
                        </button>
                        {role==="superadmin" && (
                          <button onClick={()=>deleteNlTemplate(tpl.id)}
                            style={{ padding:"5px 10px",borderRadius:7,border:`1px solid ${C.red}30`,background:C.red+"06",
                              color:C.red,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit" }}>
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
      </>)}
    </>
  );
};

// ─── Audit Log Section ────────────────────────────────────────────────────────
