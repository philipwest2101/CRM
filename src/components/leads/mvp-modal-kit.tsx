import React from "react";
import { C } from "../../theme";

// Shared modal kit for the MVP contact surface. Every activity modal (Send an
// Email, Log a Call, Create a Task, Schedule an Appointment, …) is built on this
// so they all read as one consistent system. Lives in its own module so the
// composer modals and the contact-detail page can both import it without a
// circular dependency.

export const fieldStyle = {
  width: "100%", padding: "10px 12px", borderRadius: 8,
  border: `1px solid ${C.border}`, fontSize: 13, fontFamily: "inherit",
  color: C.text, boxSizing: "border-box", outline: "none", background: "#fff",
};
export const placeholderSelect = { ...fieldStyle, color: C.muted };

export const Label = ({ children }) => (
  <label style={{ fontSize: 13, fontWeight: 600, color: C.navy, display: "block", marginBottom: 6 }}>{children}</label>
);

// One shell for every activity modal. Each modal passes a colour-coded `accent`
// (used for the header icon chip) so the different activities are instantly
// recognisable, while the primary action stays brand-orange everywhere for a
// consistent call-to-action. Closes on backdrop click or Escape.
export const ModalShell = ({ icon, title, subtitle, accent = C.primary, width = 520, onClose, children }) => {
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", zIndex: 400 }} />
      <div role="dialog" aria-modal="true" style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width, maxWidth: "94vw", maxHeight: "92vh", display: "flex", flexDirection: "column", background: "#fff", borderRadius: 16, zIndex: 500, boxShadow: "0 24px 64px rgba(0,0,0,0.22)", fontFamily: "inherit", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 20px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: `${accent}16`, color: accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{icon}</div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.navy, lineHeight: 1.25 }}>{title}</div>
            {subtitle && <div style={{ fontSize: 12, color: C.muted, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{subtitle}</div>}
          </div>
          <button onClick={onClose} aria-label="Close" style={{ width: 30, height: 30, borderRadius: 8, border: "none", background: "transparent", color: C.muted, fontSize: 20, lineHeight: 1, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
            onMouseEnter={e => { e.currentTarget.style.background = C.light; e.currentTarget.style.color = C.navy; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.muted; }}>×</button>
        </div>
        {/* Body */}
        <div style={{ padding: "18px 20px", overflowY: "auto" }}>{children}</div>
      </div>
    </>
  );
};

// Footer action row — sits at the bottom of a modal body with a divider above it.
export const FooterBtns = ({ onClose, label, disabled, onAction }) => (
  <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 20, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
    <button onClick={onClose} style={{ padding: "9px 20px", borderRadius: 9, border: `1px solid ${C.border}`, background: "#fff", color: C.slate, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
    <button disabled={disabled} onClick={onAction || onClose} style={{ padding: "9px 28px", borderRadius: 9, border: "none", background: disabled ? C.border : C.primary, color: disabled ? C.muted : "#fff", fontSize: 13, fontWeight: 700, cursor: disabled ? "default" : "pointer" }}>{label}</button>
  </div>
);
