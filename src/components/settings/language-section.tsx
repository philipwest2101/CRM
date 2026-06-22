import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Card } from "../ui/card";
import { C } from "../../theme";

export const LanguageSection = ({ save, role, inp, Card, Field, Label }) => {
  const [previewLang, setPreviewLang] = useState("en");
  const PREVIEW = {
    en: { dash:"Dashboard", leads:"Leads", appts:"Appointments", settings:"Settings", status:"Status", source:"Source", campaign:"Campaign", assign:"Assign", score:"AI Score", save:"Save Changes" },
    de: { dash:"Übersicht", leads:"Leads", appts:"Termine", settings:"Einstellungen", status:"Status", source:"Quelle", campaign:"Kampagne", assign:"Zuweisen", score:"KI-Bewertung", save:"Änderungen speichern" },
  };
  const p = PREVIEW[previewLang];
  return (
    <>
      <div style={{ fontSize:20,fontWeight:800,color:C.navy,marginBottom:20 }}>Language & Localisation</div>
      <Card title="Interface Language (NF-10)">
        <div style={{ marginBottom:16 }}>
          <Label>Select Language</Label>
          <div style={{ display:"flex",gap:10 }}>
            {[["en","🇬🇧 English"],["de","🇩🇪 Deutsch"]].map(([k,l])=>(
              <button key={k} onClick={()=>setPreviewLang(k)}
                style={{ flex:1,padding:"12px",borderRadius:9,border:`2px solid ${previewLang===k?C.primary:C.border}`,
                  background:previewLang===k?C.primary+"08":"#fff",fontWeight:previewLang===k?700:400,
                  fontSize:14,cursor:"pointer",fontFamily:"inherit",color:previewLang===k?C.navy:C.slate }}>
                {l}{previewLang===k?" ✓":""}
              </button>
            ))}
          </div>
        </div>
        <div style={{ padding:"16px",borderRadius:10,background:"#F8FAFC",border:`1px solid ${C.border}`,marginBottom:16 }}>
          <div style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:10 }}>UI Preview</div>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
            {[
              ["Navigation",`${p.dash} · ${p.leads} · ${p.appts} · ${p.settings}`],
              ["Lead fields",`${p.status} · ${p.source} · ${p.campaign}`],
              ["Actions",`${p.assign} · ${p.score}`],
              ["Buttons",p.save],
            ].map(([k,v])=>(
              <div key={k} style={{ padding:"8px 10px",borderRadius:7,background:"#fff",border:`1px solid ${C.border}` }}>
                <div style={{ fontSize:10,color:C.muted,fontWeight:700,marginBottom:3 }}>{k}</div>
                <div style={{ fontSize:12,color:C.text,fontWeight:500 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ fontSize:11,color:C.muted,marginBottom:16 }}>
          Changing the language applies to your account only. Other team members keep their own preference.
        </div>
        <button onClick={save} style={{ padding:"9px 20px",borderRadius:7,border:"none",background:C.primary,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer" }}>
          Apply Language — {previewLang==="en"?"English":"Deutsch"}
        </button>
      </Card>
      <Card title="Date & Number Format">
        <Field label="Date Format">
          <select style={inp}>
            <option>DD.MM.YYYY (German)</option>
            <option>DD/MM/YYYY (British)</option>
            <option>MM/DD/YYYY (US)</option>
          </select>
        </Field>
        <Field label="Number Format">
          <select style={inp}>
            <option>1.234,56 (German — period thousands, comma decimal)</option>
            <option>1,234.56 (International)</option>
          </select>
        </Field>
        <Field label="Currency">
          <select style={inp}><option>€ Euro (EUR)</option><option>$ Dollar (USD)</option><option>£ Pound (GBP)</option></select>
        </Field>
        <button onClick={save} style={{ padding:"9px 20px",borderRadius:7,border:"none",background:C.primary,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer" }}>Save Format Settings</button>
      </Card>
    </>
  );
};

// ─── Document Types Card (used in Settings → Profile) ─────────────────────────
// ─── Document Types Card (used in Settings → Profile) ─────────────────────────
