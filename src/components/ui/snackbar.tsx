import React, { useState, useEffect, useCallback, useRef } from "react";
import { C } from "../../theme";

// ─────────────────────────────────────────────────────────────────────────────
// SnackbarHost — the app-wide toast/snackbar surface.
//
// Completes the push mechanism that already exists in CRMAppV5 (triggerPush →
// pushRef.current(title, body, variant)). Mount this once near the app root and
// bind it with `apiRef={pushRef}`; it registers its `show` fn on that ref so
// every existing triggerPush call becomes a visible snackbar.
//
// Mirrors the Figma "Snackbar" / "Toast Message" components and the LH-Vion
// design tokens: white card, Shadow/xs elevation, success #12B76A accent, the
// neutral gray ramp. Auto-dismisses; also closable. Newest on top, capped at 3.
// ─────────────────────────────────────────────────────────────────────────────

type Variant = "success" | "info" | "error" | "warning";

const VARIANT_COLOR: Record<Variant, string> = {
  success: C.green,
  info:    C.primary,
  error:   C.red,
  warning: C.amber,
};

const DEFAULT_DURATION = 4000;
const MAX_TOASTS = 3;

// Small white glyph inside the colored badge.
const Badge = ({ variant }: { variant: Variant }) => {
  const color = VARIANT_COLOR[variant];
  const svg = {
    width: 15, height: 15, viewBox: "0 0 24 24", fill: "none",
    stroke: "#fff", strokeWidth: 3, strokeLinecap: "round" as const, strokeLinejoin: "round" as const,
  };
  return (
    <div style={{
      width: 26, height: 26, borderRadius: 999, background: color, flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center", color: "#fff",
      fontSize: 15, fontWeight: 800, lineHeight: 1,
    }}>
      {variant === "success"
        ? <svg {...svg}><path d="M5 13l4 4L19 7" /></svg>
        : variant === "info" ? "i" : "!"}
    </div>
  );
};

type Toast = { id: number; title: string; body?: string; variant: Variant; duration: number };

export const SnackbarHost = ({ apiRef }: { apiRef: React.MutableRefObject<any> }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seq = useRef(0);
  const timers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    const tm = timers.current[id];
    if (tm) { clearTimeout(tm); delete timers.current[id]; }
  }, []);

  const show = useCallback((title: string, body?: string, variant: Variant = "info", opts: { duration?: number } = {}) => {
    const id = ++seq.current;
    const duration = opts.duration ?? DEFAULT_DURATION;
    setToasts(prev => [{ id, title, body, variant, duration }, ...prev].slice(0, MAX_TOASTS));
    if (duration > 0) {
      timers.current[id] = setTimeout(() => dismiss(id), duration);
    }
    return id;
  }, [dismiss]);

  // Register the imperative API on the shared ref so triggerPush() can reach it.
  useEffect(() => {
    apiRef.current = show;
    return () => { if (apiRef.current === show) apiRef.current = null; };
  }, [apiRef, show]);

  // Clear any pending timers on unmount.
  useEffect(() => () => { Object.values(timers.current).forEach(clearTimeout); }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      role="region"
      aria-live="polite"
      style={{
        position: "fixed", top: 24, right: 24,
        zIndex: 2000, display: "flex", flexDirection: "column", gap: 10,
        width: "min(420px, calc(100vw - 24px))", pointerEvents: "none",
      }}
    >
      <style>{`@keyframes snackIn{from{opacity:0;transform:translateX(16px) scale(0.98)}to{opacity:1;transform:none}}`}</style>
      {toasts.map(t => (
        <div
          key={t.id}
          style={{
            pointerEvents: "auto",
            display: "flex", alignItems: "flex-start", gap: 12,
            background: "#fff", border: `1px solid ${C.border}`,
            borderLeft: `4px solid ${VARIANT_COLOR[t.variant]}`,
            borderRadius: 12, padding: "12px 14px",
            boxShadow: "0 8px 28px rgba(16,24,40,0.16)",
            animation: "snackIn 220ms cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          <Badge variant={t.variant} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.navy, lineHeight: 1.3 }}>{t.title}</div>
            {t.body && <div style={{ fontSize: 12.5, color: C.slate, marginTop: 2, lineHeight: 1.4 }}>{t.body}</div>}
          </div>
          <button
            onClick={() => dismiss(t.id)}
            aria-label="Dismiss"
            style={{
              background: "none", border: "none", cursor: "pointer", color: C.muted,
              fontSize: 14, lineHeight: 1, padding: 2, flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
};
