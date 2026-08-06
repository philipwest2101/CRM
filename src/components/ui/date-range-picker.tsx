import React, { useState, useMemo, useRef, useEffect, useContext } from "react";
import { C } from "../../theme";
import { useT, LangContext } from "../../lib/i18n";

// ─── Shared date-range picker ─────────────────────────────────────────────────
// Replaces the old Today/Week/Month/… period pills on every dashboard. Shows the
// selected range as a text field that opens a calendar popover for free range
// selection, plus quick suggestions (Today · Last 7 days · Last 30 days ·
// This Month · This Year). Each suggestion maps to one of the existing period
// buckets (today/week/month/quarter/year) so the dashboards' data scaling keeps
// working unchanged — `onChange` hands the parent that period key and the range.

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d, n) => { const x = startOfDay(d); x.setDate(x.getDate() + n); return x; };
const sameDay = (a, b) => !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();

// Quick suggestions. `id` is unique (used for highlighting); `period` is the
// bucket the dashboards understand; `range(today)` returns [start, end].
const PRESETS = [
  { id: "today",     labelKey: "dateToday",     period: "today", range: (t) => [t, t] },
  { id: "last7",     labelKey: "dateLast7",     period: "week",  range: (t) => [addDays(t, -6), t] },
  { id: "last30",    labelKey: "dateLast30",    period: "month", range: (t) => [addDays(t, -29), t] },
  { id: "thisMonth", labelKey: "dateThisMonth", period: "month", range: (t) => [new Date(t.getFullYear(), t.getMonth(), 1), t] },
  { id: "thisYear",  labelKey: "dateThisYear",  period: "year",  range: (t) => [new Date(t.getFullYear(), 0, 1), t] },
];

// Map a freely-picked range's length onto the nearest period bucket so custom
// selections still scale the mock data sensibly.
const spanToPeriod = (start, end) => {
  const days = Math.round((startOfDay(end).getTime() - startOfDay(start).getTime()) / 86400000) + 1;
  if (days <= 1) return "today";
  if (days <= 7) return "week";
  if (days <= 31) return "month";
  if (days <= 92) return "quarter";
  return "year";
};

export const DateRangePicker = ({ period = "month", onChange, activeColor = C.primary }) => {
  const t = useT();
  const { lang } = useContext(LangContext);
  const locale = lang === "de" ? "de-DE" : "en-GB";
  const today = useMemo(() => startOfDay(new Date()), []);

  // Initial suggestion: match the incoming period bucket, but prefer the
  // calendar-aligned "This Month" over "Last 30 days" when both qualify.
  const initial = (period === "month" ? PRESETS.find(p => p.id === "thisMonth") : PRESETS.find(p => p.period === period)) || PRESETS[3];
  const [range, setRange] = useState(() => {
    const [s, e] = initial.range(today);
    return { start: s, end: e };
  });
  const [activeId, setActiveId] = useState(initial.id);
  const [pendingStart, setPendingStart] = useState(null);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => ({ y: range.end.getFullYear(), m: range.end.getMonth() }));

  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const fmt = (d) => d.toLocaleDateString(locale, { day: "2-digit", month: "short", year: "numeric" });
  const label = sameDay(range.start, range.end) ? fmt(range.start) : `${fmt(range.start)} – ${fmt(range.end)}`;

  const applyPreset = (preset) => {
    const [s, e] = preset.range(today);
    setRange({ start: s, end: e });
    setActiveId(preset.id);
    setPendingStart(null);
    setView({ y: e.getFullYear(), m: e.getMonth() });
    onChange && onChange(preset.period, { start: s, end: e });
    setOpen(false);
  };

  const pickDay = (day) => {
    const clicked = new Date(view.y, view.m, day);
    if (!pendingStart) {
      setPendingStart(clicked);
      setRange({ start: clicked, end: clicked });
      return;
    }
    // Second click completes the range (order-independent).
    const start = clicked < pendingStart ? clicked : pendingStart;
    const end = clicked < pendingStart ? pendingStart : clicked;
    setRange({ start, end });
    setPendingStart(null);
    setActiveId(null);
    onChange && onChange(spanToPeriod(start, end), { start, end });
    setOpen(false);
  };

  // Weekday headers (Su..Sa) in the active locale.
  const weekdays = useMemo(() => {
    const base = new Date(2026, 10, 1); // a Sunday
    return Array.from({ length: 7 }, (_, i) => addDays(base, i).toLocaleDateString(locale, { weekday: "short" }).slice(0, 2));
  }, [locale]);

  const monthLabel = new Date(view.y, view.m, 1).toLocaleDateString(locale, { month: "short", year: "numeric" });
  const firstWeekday = new Date(view.y, view.m, 1).getDay();
  const total = daysInMonth(view.y, view.m);
  const cells = [...Array(firstWeekday).fill(null), ...Array.from({ length: total }, (_, i) => i + 1)];

  const inRange = (day) => {
    const d = new Date(view.y, view.m, day);
    return d >= startOfDay(range.start) && d <= startOfDay(range.end);
  };
  const isEnd = (day) => sameDay(new Date(view.y, view.m, day), range.start) || sameDay(new Date(view.y, view.m, day), range.end);

  const shiftMonth = (delta) => setView(v => {
    const d = new Date(v.y, v.m + delta, 1);
    return { y: d.getFullYear(), m: d.getMonth() };
  });

  const navBtn = { border: "none", background: "transparent", cursor: "pointer", color: C.muted, fontSize: 16, padding: "2px 8px", borderRadius: 6, fontFamily: "inherit" };

  return (
    <div ref={ref} style={{ position: "relative", flexShrink: 0 }}>
      {/* Trigger — reads like a date field */}
      <button onClick={() => setOpen(o => !o)} style={{
        display: "flex", alignItems: "center", gap: 8, padding: "8px 12px",
        border: `1px solid ${open ? activeColor : C.border}`, borderRadius: 9,
        background: "#fff", color: C.text, fontSize: 12.5, fontWeight: 500,
        cursor: "pointer", fontFamily: "inherit", minWidth: 210, justifyContent: "space-between",
      }}>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 14 }}>📅</span>{label}
        </span>
        <span style={{ color: C.muted, fontSize: 10 }}>▾</span>
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 60,
          background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12,
          boxShadow: "0 10px 32px rgba(0,0,0,0.14)", padding: 14, width: 280,
        }}>
          {/* Month header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <button onClick={() => shiftMonth(-1)} style={navBtn}>‹</button>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{monthLabel}</span>
            <button onClick={() => shiftMonth(1)} style={navBtn}>›</button>
          </div>

          {/* Weekday row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, marginBottom: 4 }}>
            {weekdays.map((w, i) => (
              <div key={i} style={{ textAlign: "center", fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase" }}>{w}</div>
            ))}
          </div>

          {/* Day grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
            {cells.map((day, i) => {
              if (day === null) return <div key={i} />;
              const end = isEnd(day);
              const within = inRange(day);
              return (
                <button key={i} onClick={() => pickDay(day)} style={{
                  height: 30, border: "none", borderRadius: 7, cursor: "pointer", fontFamily: "inherit",
                  fontSize: 12, fontWeight: end ? 700 : 500,
                  background: end ? activeColor : within ? activeColor + "22" : "transparent",
                  color: end ? "#fff" : C.text,
                }}>{day}</button>
              );
            })}
          </div>

          {/* Quick suggestions */}
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.border}`, display: "flex", flexWrap: "wrap", gap: "8px 16px" }}>
            {PRESETS.map(p => (
              <button key={p.id} onClick={() => applyPreset(p)} style={{
                border: "none", background: "transparent", cursor: "pointer", fontFamily: "inherit",
                fontSize: 12.5, fontWeight: activeId === p.id ? 700 : 500,
                color: activeId === p.id ? activeColor : C.blue, padding: 0,
              }}>{t(p.labelKey as any)}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
