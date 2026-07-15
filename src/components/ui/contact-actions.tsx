import React, { useState } from "react";
import { C } from "../../theme";
import { useT } from "../../lib/i18n";

// ─────────────────────────────────────────────────────────────────────────────
// Role-aware Add / Import contact actions, shared across dashboards.
// Per the Network vs. Lead Role Capabilities:
//   · SA can create Company Leads only — plain "Add Lead" / "Import Lead"
//     (no Network).
//   · VD & GP can add or import both Leads and Networks — split-button menu.
// Choosing a type navigates to the Contacts page and opens the matching Add
// form / Import wizard for that Lifecycle (encoded as "add:<type>" / "import:<type>").
// ─────────────────────────────────────────────────────────────────────────────

const Menu = ({ open, onClose, items }) => open ? (
  <>
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 250 }} />
    <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 260, background: "#fff", borderRadius: 10, boxShadow: "0 12px 36px rgba(0,0,0,0.16)", border: `1px solid ${C.border}`, minWidth: 180, padding: "6px 0" }}>
      {items.map(([label, fn]) => (
        <div key={label} onClick={fn}
          style={{ padding: "10px 16px", fontSize: 13, fontWeight: 600, color: C.text, cursor: "pointer" }}
          onMouseEnter={e => e.currentTarget.style.background = "#F8FAFC"}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}>{label}</div>
      ))}
    </div>
  </>
) : null;

export const ContactActions = ({ role, navigateTo, view = "my" }) => {
  const t = useT();
  const [addOpen, setAddOpen] = useState(false);
  const [impOpen, setImpOpen] = useState(false);
  const isSA = role === "superadmin" || role === "manager";
  const go = (action) => { setAddOpen(false); setImpOpen(false); navigateTo("Leads", null, view, action); };

  const addBtn = { display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 9, border: "none", background: C.primary, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" };
  const impBtn = { display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 9, border: `1px solid ${C.border}`, background: "#fff", color: C.slate, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" };

  return (
    <div style={{ display: "flex", gap: 10 }}>
      {/* Add */}
      <div style={{ position: "relative" }}>
        {isSA ? (
          <button onClick={() => go("add:Lead")} style={addBtn}>+ {t("addLead")}</button>
        ) : (<>
          <button onClick={() => setAddOpen(o => !o)} style={addBtn}>+ {t("addContact")} <span style={{ fontSize: 10 }}>▾</span></button>
          <Menu open={addOpen} onClose={() => setAddOpen(false)} items={[[t("addLead"), () => go("add:Lead")], [t("addNetwork"), () => go("add:Network")]]} />
        </>)}
      </div>
      {/* Import */}
      <div style={{ position: "relative" }}>
        {isSA ? (
          <button onClick={() => go("import:Lead")} style={impBtn}>⬇ {t("importLead")}</button>
        ) : (<>
          <button onClick={() => setImpOpen(o => !o)} style={impBtn}>⬇ {t("import")} <span style={{ fontSize: 10 }}>▾</span></button>
          <Menu open={impOpen} onClose={() => setImpOpen(false)} items={[[t("importLead"), () => go("import:Lead")], [t("importNetwork"), () => go("import:Network")]]} />
        </>)}
      </div>
    </div>
  );
};
