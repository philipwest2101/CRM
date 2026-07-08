import React, { useState, useRef } from "react";
import { C } from "../../theme";
import { L, pick } from "../../lib/core";

// ─────────────────────────────────────────────────────────────────────────────
// Shared block-based email editor primitives.
//   One template model for the whole app: journey emails, newsletters, manual
//   sends and bulk campaigns all edit/render the same block layout. Used by
//   the Newsletter page and the Settings → Email Templates editor.
// ─────────────────────────────────────────────────────────────────────────────

export const CANVAS_BG = "#EAF0F6";

// Fields that may carry localised { de, en } seed values.
const LOC_FIELDS = ["text", "label", "left", "right", "html"];

// ── Block palette ────────────────────────────────────────────────────────────
export const CONTENT_BLOCKS = [
  { type:"logo",    icon:"🏷️", labelKey:"nlBlockLogo"    },
  { type:"image",   icon:"🖼️", labelKey:"nlBlockImage"   },
  { type:"heading", icon:"🔠", labelKey:"nlBlockHeading" },
  { type:"text",    icon:"📝", labelKey:"nlBlockText"    },
  { type:"button",  icon:"🔘", labelKey:"nlBlockButton"  },
  { type:"divider", icon:"➖", labelKey:"nlBlockDivider" },
  { type:"footer",  icon:"⚓", labelKey:"nlBlockFooter"  },
  { type:"html",    icon:"🧩", labelKey:"nlBlockHtml"    },
];
// Section presets (HubSpot-style "default sections"): column count / ratios.
export const SECTION_PRESETS = [
  { id:"s1",  label:"1",         ratios:[1] },
  { id:"s2",  label:"2",         ratios:[1,1] },
  { id:"s3",  label:"3",         ratios:[1,1,1] },
  { id:"s13", label:"1/3 : 2/3", ratios:[1,2] },
  { id:"s31", label:"2/3 : 1/3", ratios:[2,1] },
  { id:"s4",  label:"4",         ratios:[1,1,1,1] },
];
const SECTION_CELL_TEXT = L("Text eingeben…","Enter text…");

export const BLOCK_DEFAULTS = {
  logo:    { text:"vionworld" },
  image:   { label:"" },
  heading: { text:L("Ihre Überschrift","Your headline goes here") },
  text:    { text:L("Schreiben Sie hier Ihren Text. Mit {{lead_name}} personalisieren Sie die Anrede.","Write your paragraph here. Use {{lead_name}} to personalise the greeting.") },
  button:  { label:L("Jetzt mehr erfahren","Call to action"), url:"#" },
  divider: {},
  footer:  { text:"vion gmbh · Musterstraße 1 · 80331 München" },
  html:    { html:L('<p style="margin:0">Eigener <b>HTML</b>-Inhalt — Tags wie &lt;b&gt;, &lt;a&gt; oder &lt;table&gt; sind erlaubt.</p>','<p style="margin:0">Custom <b>HTML</b> content — tags like &lt;b&gt;, &lt;a&gt; or &lt;table&gt; are allowed.</p>') },
  imgtext: { label:L("Bild","Image"), text:L("Text neben dem Bild — ideal für Produkt-Highlights oder Team-Vorstellungen.","Text next to the image — great for product highlights or team introductions.") },
};

// Personalisation tokens — the unified {{...}} convention used by journey
// emails, manual sends (contact detail) and workflow automation.
export const PERSONALISATION_TOKENS = ["{{lead_name}}","{{advisor_name}}","{{company_name}}"];

let blockSeq = 0;
export const resolveBlock = (b, lang) => {
  const o = { ...b, id:`b${Date.now()}_${blockSeq++}` };
  for (const k of LOC_FIELDS) if (o[k] !== undefined) o[k] = pick(o[k], lang);
  if (Array.isArray(o.cells)) o.cells = o.cells.map(c => pick(c, lang));
  if (Array.isArray(o.ratios)) o.ratios = [...o.ratios];
  return o;
};
export const newBlock = (type, lang) => resolveBlock({ type, ...BLOCK_DEFAULTS[type] }, lang);
export const newSection = (ratios, lang) => resolveBlock({ type:"section", ratios, cells:ratios.map(()=>SECTION_CELL_TEXT) }, lang);
// A working copy of a template's blocks: fresh ids, localised seeds resolved.
export const instantiateTpl = (tpl, lang) => (tpl.blocks||[]).map(b => resolveBlock(b, lang));

// ── Email block renderer — inline-editable on the canvas ─────────────────────
const editableTextStyle = (base): React.CSSProperties => ({
  ...base, width:"100%", border:"none", outline:"none", background:"#FFF8EE",
  fontFamily:"inherit", boxSizing:"border-box", resize:"none", padding:0, borderRadius:4,
});
const textBodyStyle = { fontSize:13.5, color:"#33475B", lineHeight:1.7, whiteSpace:"pre-wrap" as const };

export const BlockView = ({ b, editing=false, onChange=null }) => {
  const stop = e => e.stopPropagation();
  const secRef = useRef(null);

  // Drag the handle between two section columns → shift width between them
  // (their combined share stays constant, so the other columns keep theirs).
  const startSecResize = (e, i) => {
    e.preventDefault(); e.stopPropagation();
    const width = secRef.current ? secRef.current.getBoundingClientRect().width : 600;
    const total = b.ratios.reduce((a,x)=>a+x,0);
    const startX = e.clientX;
    const r0 = [...b.ratios];
    const pair = r0[i] + r0[i+1];
    const move = (ev) => {
      const delta = (ev.clientX - startX) / width * total;
      const a = Math.min(Math.max(0.25, r0[i] + delta), pair - 0.25);
      const nr = [...r0]; nr[i] = +a.toFixed(2); nr[i+1] = +(pair - a).toFixed(2);
      onChange && onChange({ ratios: nr });
    };
    const up = () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };
  const ta = (field, style, extra={}) => (
    <textarea autoFocus value={b[field]||""} onClick={stop} onChange={e=>onChange({ [field]:e.target.value })}
      rows={Math.max(2, String(b[field]||"").split("\n").length)}
      style={{ ...editableTextStyle(style), ...extra }}/>
  );
  switch (b.type) {
    case "logo": {
      const style = { fontSize:20, fontWeight:800, letterSpacing:"-0.02em", textAlign:"center" as const };
      return (
        <div style={{ padding:"20px 24px 14px", textAlign:"center" }}>
          {editing
            ? <input autoFocus value={b.text||""} onClick={stop} onChange={e=>onChange({ text:e.target.value })}
                style={{ ...editableTextStyle(style), color:C.primary }}/>
            : <span style={style}>
                <span style={{ color:C.primary }}>{(b.text||"vionworld").slice(0,4)}</span>
                <span style={{ fontWeight:400, color:"#98A2B3" }}>{(b.text||"vionworld").slice(4)}</span>
              </span>}
        </div>);
    }
    case "image": return (
      <div style={{ margin:"8px 24px", height:150, borderRadius:8, display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center", gap:6, color:"#8CA3B8", fontSize:12,
        background:"linear-gradient(135deg,#F0F4F8,#DFE8F0)", border:"1.5px dashed #C3D1DE" }}>
        <span style={{ fontSize:26 }}>🖼️</span>
        {editing
          ? <input autoFocus value={b.label||""} onClick={stop} onChange={e=>onChange({ label:e.target.value })}
              placeholder="Caption" style={{ ...editableTextStyle({ fontSize:12, textAlign:"center" }), width:220, color:"#8CA3B8" }}/>
          : (b.label || "")}
      </div>);
    case "heading": {
      const style = { fontSize:23, fontWeight:800, color:"#1D2939", lineHeight:1.3 };
      return (
        <div style={{ padding:"14px 24px 6px" }}>
          {editing
            ? <input autoFocus value={b.text||""} onClick={stop} onChange={e=>onChange({ text:e.target.value })} style={editableTextStyle(style)}/>
            : <div style={style}>{b.text}</div>}
        </div>);
    }
    case "text": case "footer": {
      const isFooter = b.type==="footer";
      const style = isFooter
        ? { fontSize:10.5, color:"#8CA3B8", lineHeight:1.8, textAlign:"center" as const, whiteSpace:"pre-wrap" as const }
        : textBodyStyle;
      return (
        <div style={{ padding:isFooter?"16px 24px 22px":"8px 24px" }}>
          {editing ? ta("text", style) : <div style={style}>{b.text}</div>}
          {isFooter && !editing && (
            <div style={{ ...style, marginTop:2 }}>
              <span style={{ textDecoration:"underline" }}>Unsubscribe</span> · <span style={{ textDecoration:"underline" }}>Manage preferences</span>
            </div>)}
        </div>);
    }
    case "button": return (
      <div style={{ padding:"14px 24px", textAlign:"center" }}>
        <span style={{ display:"inline-block", padding:"11px 28px", borderRadius:6, background:C.primary, color:"#fff", fontSize:13.5, fontWeight:700 }}>
          {editing
            ? <input autoFocus value={b.label||""} onClick={stop} onChange={e=>onChange({ label:e.target.value })}
                style={{ border:"none", outline:"none", background:"transparent", color:"#fff", fontSize:13.5, fontWeight:700,
                  fontFamily:"inherit", textAlign:"center", width:`${Math.max(10, String(b.label||"").length+1)}ch` }}/>
            : b.label}
        </span>
      </div>);
    case "divider": return (
      <div style={{ padding:"10px 24px" }}><div style={{ height:1, background:"#E3EAF1" }}/></div>);
    case "html": return (
      <div style={{ padding:"8px 24px" }}>
        {editing
          ? ta("html", { fontSize:11.5, lineHeight:1.6 }, { fontFamily:"monospace", background:"#1D2939", color:"#A7F3D0", padding:"8px 10px" })
          : <div style={textBodyStyle} dangerouslySetInnerHTML={{ __html: b.html||"" }}/>}
      </div>);
    case "cols2": /* legacy 2-column block → render like a section */
    case "section": {
      const ratios = b.ratios || [1,1];
      const cells  = b.cells  || [b.left||"", b.right||""];
      const total  = ratios.reduce((a,x)=>a+x,0);
      return (
        <div ref={secRef} style={{ padding:"8px 24px", position:"relative" }}>
          <div style={{ display:"grid", gridTemplateColumns:ratios.map(r=>`${r}fr`).join(" "), gap:12 }}>
            {cells.map((c,i)=>(
              <div key={i} style={{ minWidth:0 }}>
                {editing
                  ? <textarea value={c} onClick={stop}
                      onChange={e=>{ const next=[...cells]; next[i]=e.target.value; onChange({ cells:next, ratios }); }}
                      rows={Math.max(2, String(c||"").split("\n").length)}
                      style={editableTextStyle(textBodyStyle)}/>
                  : <div style={textBodyStyle}>{c}</div>}
              </div>
            ))}
          </div>
          {/* Resize handles between columns (visible while the block is selected) */}
          {editing && ratios.slice(0,-1).map((_,i)=>{
            const pct = ratios.slice(0,i+1).reduce((a,x)=>a+x,0)/total*100;
            return (
              <div key={i} onMouseDown={e=>startSecResize(e, i)}
                title={ratios.map(r=>Math.round(r/total*100)+"%").join(" : ")}
                style={{ position:"absolute", top:4, bottom:4, left:`calc(24px + (100% - 48px) * ${pct/100})`,
                  width:12, marginLeft:-6, cursor:"col-resize", zIndex:6,
                  display:"flex", alignItems:"center", justifyContent:"center" }}>
                <div style={{ width:4, height:"72%", minHeight:22, borderRadius:2, background:C.primary+"66" }}/>
              </div>
            );
          })}
        </div>
      );
    }
    case "imgtext": return (
      <div style={{ padding:"8px 24px", display:"grid", gridTemplateColumns:"150px 1fr", gap:14, alignItems:"start" }}>
        <div style={{ height:110, borderRadius:8, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
          gap:4, color:"#8CA3B8", fontSize:10.5, background:"linear-gradient(135deg,#F0F4F8,#DFE8F0)", border:"1.5px dashed #C3D1DE" }}>
          <span style={{ fontSize:20 }}>🖼️</span>
          {editing
            ? <input value={b.label||""} onClick={stop} onChange={e=>onChange({ label:e.target.value })}
                style={{ ...editableTextStyle({ fontSize:10.5, textAlign:"center" }), width:110, color:"#8CA3B8" }}/>
            : (b.label || "")}
        </div>
        <div>{editing ? ta("text", textBodyStyle) : <div style={textBodyStyle}>{b.text}</div>}</div>
      </div>);
    default: return null;
  }
};

export const EmailFrame = ({ blocks, width=600 }) => (
  <div style={{ width, background:"#fff", borderRadius:4, overflow:"hidden", boxShadow:"0 1px 6px rgba(45,62,80,0.12)" }}>
    {blocks.map(b => <BlockView key={b.id} b={b} />)}
  </div>
);

export const TemplateThumb = ({ blocks, height=190, scale=0.4 }) => (
  <div style={{ height, overflow:"hidden", background:CANVAS_BG, display:"flex", justifyContent:"center", paddingTop:14 }}>
    <div style={{ transform:`scale(${scale})`, transformOrigin:"top center", flexShrink:0 }}>
      <EmailFrame blocks={blocks} />
    </div>
  </div>
);

// ── Device toggle (Desktop / Mobile) ─────────────────────────────────────────
export const DeviceToggle = ({ t, mode, setMode }) => (
  <div style={{ display:"flex", border:`1px solid ${C.border}`, borderRadius:8, overflow:"hidden", flexShrink:0 }}>
    {[["desktop",`🖥 ${t("nlDesktop")}`],["mobile",`📱 ${t("nlMobile")}`]].map(([k,l],i)=>(
      <button key={k} onClick={()=>setMode(k)}
        style={{ padding:"6px 12px", border:"none", borderLeft:i===0?"none":`1px solid ${C.border}`,
          background:mode===k?C.primary:"#fff", color:mode===k?"#fff":C.slate,
          fontSize:11.5, fontWeight:mode===k?700:500, cursor:"pointer", fontFamily:"inherit" }}>{l}</button>
    ))}
  </div>
);

// ── Preview modal — desktop / mobile rendering of a block set ────────────────
export const PreviewModal = ({ t, title, blocks, onClose }) => {
  const [device, setDevice] = useState("desktop");
  const w = device==="mobile" ? 375 : 600;
  return (<>
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.55)", zIndex:500 }}/>
    <div style={{ position:"fixed", top:"4vh", left:"50%", transform:"translateX(-50%)", width:720, maxWidth:"94vw",
      height:"90vh", display:"flex", flexDirection:"column", background:"#fff", borderRadius:16, zIndex:600,
      boxShadow:"0 24px 64px rgba(0,0,0,0.3)", overflow:"hidden" }}>
      <div style={{ padding:"12px 18px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:12 }}>
        <span style={{ fontSize:14, fontWeight:800, color:C.navy, flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
          👁 {t("nlPreviewBtn")}{title ? ` — ${title}` : ""}
        </span>
        <DeviceToggle t={t} mode={device} setMode={setDevice}/>
        <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", fontSize:20, color:C.muted }}>×</button>
      </div>
      <div style={{ flex:1, overflowY:"auto", background:CANVAS_BG, display:"flex", justifyContent:"center", padding:"22px 0 40px" }}>
        <div style={{ flexShrink:0 }}><EmailFrame blocks={blocks} width={w}/></div>
      </div>
    </div>
  </>);
};

// ── Palette panel — content blocks, layout sections, personalisation ─────────
export const BlocksPalette = ({ t, onAdd, onDragStart, onDragEnd, selBlock, onToken }) => {
  const paletteItemStyle: React.CSSProperties = {
    borderRadius:9, border:`1px solid ${C.border}`, background:"#fff",
    textAlign:"center", cursor:"grab", userSelect:"none",
  };
  const paletteHover = {
    onMouseEnter: e=>{ e.currentTarget.style.borderColor=C.primary; e.currentTarget.style.background=C.primarySoft; },
    onMouseLeave: e=>{ e.currentTarget.style.borderColor=C.border; e.currentTarget.style.background="#fff"; },
  };
  const draggableProps = (spec) => ({
    draggable:true,
    onDragStart:()=>onDragStart(spec),
    onDragEnd:()=>onDragEnd(),
    onClick:()=>onAdd(spec),
  });
  const paletteLabel: React.CSSProperties = { fontSize:10.5, fontWeight:800, color:C.slate, textTransform:"uppercase", letterSpacing:"0.07em", margin:"4px 2px 10px" };

  // Mini skeleton icon for a section preset (dotted header + column boxes).
  const SectionIcon = ({ ratios }) => (
    <div style={{ width:38, margin:"0 auto 4px" }}>
      <div style={{ display:"flex", gap:2, justifyContent:"center", marginBottom:3 }}>
        {[...Array(6)].map((_,i)=><div key={i} style={{ width:2.5, height:2.5, borderRadius:1, background:"#8CA3B8" }}/>)}
      </div>
      <div style={{ display:"flex", gap:2, height:15 }}>
        {ratios.map((r,i)=><div key={i} style={{ flex:r, background:"#D7E1EC", borderRadius:2 }}/>)}
      </div>
    </div>
  );

  return (<>
    <div style={paletteLabel}>{t("nlContentBlocks")}</div>
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:7, marginBottom:12 }}>
      {CONTENT_BLOCKS.map(bt=>(
        <div key={bt.type} {...draggableProps({ type:bt.type })} {...paletteHover}
          style={{ ...paletteItemStyle, padding:"12px 4px 9px" }}>
          <div style={{ fontSize:16, marginBottom:3 }}>{bt.icon}</div>
          <div style={{ fontSize:10.5, fontWeight:700, color:C.text }}>{t(bt.labelKey)}</div>
        </div>
      ))}
    </div>
    <div style={paletteLabel}>{t("nlLayoutSection")} — {t("nlSections")}</div>
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6, marginBottom:8 }}>
      {SECTION_PRESETS.map(p=>(
        <div key={p.id} {...draggableProps({ ratios:p.ratios })} {...paletteHover}
          style={{ ...paletteItemStyle, padding:"9px 4px 7px" }}>
          <SectionIcon ratios={p.ratios}/>
          <div style={{ fontSize:9.5, fontWeight:700, color:C.text, whiteSpace:"nowrap" }}>{p.label}</div>
        </div>
      ))}
    </div>
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:7, marginBottom:12 }}>
      <div {...draggableProps({ type:"imgtext" })} {...paletteHover}
        style={{ ...paletteItemStyle, padding:"12px 4px 9px" }}>
        <div style={{ fontSize:16, marginBottom:3 }}>🖼📝</div>
        <div style={{ fontSize:10.5, fontWeight:700, color:C.text }}>{t("nlBlockImgText")}</div>
      </div>
    </div>
    <div style={{ padding:"9px 11px", borderRadius:9, background:"#F0F6FF", border:"1px solid #D6E6FF", fontSize:10.5, color:"#33475B", lineHeight:1.55 }}>
      {t("nlBlocksHint")} {t("nlResizeHint")}
    </div>
    <div style={{ fontSize:10.5, fontWeight:800, color:C.slate, textTransform:"uppercase", letterSpacing:"0.07em", margin:"14px 2px 8px" }}>{t("nlPersonalisation")}</div>
    <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
      {PERSONALISATION_TOKENS.map(tk=>(
        <button key={tk} disabled={!selBlock || selBlock.text===undefined}
          onClick={()=>selBlock && selBlock.text!==undefined && onToken(tk)}
          style={{ padding:"4px 8px", borderRadius:6, border:`1px solid ${C.border}`, background:"#F8FAFC",
            fontSize:10.5, fontFamily:"monospace", color:(selBlock&&selBlock.text!==undefined)?C.indigo:C.muted, fontWeight:600,
            cursor:(selBlock&&selBlock.text!==undefined)?"pointer":"default" }}>{tk}</button>
      ))}
    </div>
  </>);
};

// ── Canvas — inline-editable email with drag-drop insertion ──────────────────
export const BlockCanvas = ({ t, width, blocks, selId, setSelId, dragType, dropIdx, setDropIdx, onDropAt,
  updateBlock, moveBlock, removeBlock, header=null }) => (
  <div style={{ flex:1, overflowY:"auto", padding:"24px 0 60px", display:"flex", justifyContent:"center" }}
    onClick={()=>setSelId(null)}
    onDragOver={e=>{ if(dragType){ e.preventDefault(); } }}
    onDrop={e=>{ if(dragType){ e.preventDefault(); onDropAt(dropIdx); } }}>
    <div style={{ width, flexShrink:0, transition:"width 0.2s" }} onClick={e=>e.stopPropagation()}>
      {header}
      <div style={{ background:"#fff", borderRadius:4, overflow:"hidden", boxShadow:"0 1px 6px rgba(45,62,80,0.12)" }}>
        {blocks.map((b, i)=>(
          <div key={b.id}
            onDragOver={e=>{ if(dragType){ e.preventDefault(); e.stopPropagation(); const r=e.currentTarget.getBoundingClientRect(); setDropIdx(e.clientY < r.top + r.height/2 ? i : i+1); } }}
            style={{ position:"relative" }}>
            {dragType && dropIdx===i && <div style={{ height:3, background:C.primary, margin:"0 8px", borderRadius:2 }}/>}
            <div onClick={e=>{ e.stopPropagation(); setSelId(b.id); }}
              style={{ position:"relative", cursor:selId===b.id?"auto":"pointer",
                outline:selId===b.id ? `2px solid ${C.primary}` : "2px solid transparent", outlineOffset:-2 }}
              onMouseEnter={e=>{ if(selId!==b.id) e.currentTarget.style.outline=`2px dashed ${C.primary}55`; }}
              onMouseLeave={e=>{ if(selId!==b.id) e.currentTarget.style.outline="2px solid transparent"; }}>
              {selId===b.id && (
                <div style={{ position:"absolute", top:4, right:6, zIndex:5, display:"flex", gap:3 }}>
                  {[["↑","up"],["↓","dn"]].map(([l,d])=>(
                    <button key={d} onClick={e=>{ e.stopPropagation(); moveBlock(b.id, d); }}
                      style={{ width:22, height:22, borderRadius:5, border:"none", background:C.primary, color:"#fff", fontSize:11, cursor:"pointer" }}>{l}</button>
                  ))}
                  <button onClick={e=>{ e.stopPropagation(); removeBlock(b.id); }}
                    style={{ width:22, height:22, borderRadius:5, border:"none", background:C.red, color:"#fff", fontSize:12, cursor:"pointer" }}>×</button>
                </div>
              )}
              <BlockView b={b} editing={selId===b.id} onChange={patch=>updateBlock(b.id, patch)} />
              {selId===b.id && b.type==="button" && (
                <div style={{ padding:"0 24px 12px", display:"flex", gap:8, alignItems:"center" }} onClick={e=>e.stopPropagation()}>
                  <span style={{ fontSize:10.5, fontWeight:700, color:C.slate, whiteSpace:"nowrap" }}>{t("nlButtonUrl")}</span>
                  <input value={b.url||""} onChange={e=>updateBlock(b.id,{ url:e.target.value })}
                    style={{ width:"100%", padding:"5px 9px", borderRadius:8, border:`1px solid ${C.border}`, fontSize:11.5,
                      fontFamily:"inherit", boxSizing:"border-box", outline:"none", background:"#fff", color:C.text }}/>
                </div>
              )}
            </div>
            {dragType && dropIdx===i+1 && i===blocks.length-1 && <div style={{ height:3, background:C.primary, margin:"0 8px", borderRadius:2 }}/>}
          </div>
        ))}
        {blocks.length===0 && (
          <div style={{ padding:"56px 20px", textAlign:"center", color:"#8CA3B8" }}
            onDragOver={e=>{ if(dragType){ e.preventDefault(); setDropIdx(0); } }}>
            <div style={{ fontSize:30, marginBottom:8 }}>📧</div>
            <div style={{ fontSize:13 }}>{t("nlBlocksHint")}</div>
          </div>
        )}
      </div>
    </div>
  </div>
);
