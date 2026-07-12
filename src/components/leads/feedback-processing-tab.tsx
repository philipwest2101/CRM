import React, { useState } from "react";
import { C } from "../../theme";
import { AppointmentModal } from "../appointments/appointment-modal";

// ─────────────────────────────────────────────────────────────────────────────
// FEEDBACK & PROCESSING TAB  (controlled)
// A guided, bottom-to-top stepper that walks an advisor through everything that
// happens to a lead — from the first outreach to the final processing outcome.
// Completed steps collapse below the current one; the current step stays closest
// to the user (just above the automatic status log).
//
// Flow:
//   1 Initial Contact  →  2 Phone Contact Attempts  →  3 Contact Outcome
//   →  4 Schedule Appointment  →  5 Appointment Outcome  →  6 Finalize
//
// · Phone attempts are capped at 5; the 5th failed attempt sends the lead to
//   Finalize as "Not Reached".
// · Contact Outcome: Appointment Scheduled, Not Interested, Currently Not
//   Interested, Difficult Case. Anything but "Appointment Scheduled" skips
//   straight to Finalize.
// · Appointment Outcome: Qualified, Reschedule, Attending Event, Not Interested,
//   Currently Not Interested, Difficult Case. "Reschedule" re-opens the
//   scheduling pop-up and stays on the step; everything else goes to Finalize.
// · If a negative outcome (Not Interested / Currently Not Interested / Difficult
//   Case) was chosen, the Finalize step shows a persistent "Do Not Contact"
//   toggle — so DNC is set here, not on the convert modal.
// · Every step commits only on "Continue"; selections are correctable first.
// ─────────────────────────────────────────────────────────────────────────────

export const STEPS = [
  { key: "initial",     title: "Initial Contact" },
  { key: "phone",       title: "Phone Contact Attempts" },
  { key: "outcome",     title: "Contact Outcome" },
  { key: "schedule",    title: "Schedule Appointment" },
  { key: "appointment", title: "Appointment Outcome" },
  { key: "finish",      title: "Finalize Process" },
];
const IDX = Object.fromEntries(STEPS.map((s, i) => [s.key, i]));
const stepNo = (key) => IDX[key] + 1;

// Result stages only (not actions) — where the convert-to-contact CTA appears.
const RESULT_STEPS = new Set(["outcome", "appointment", "finish"]);
// Negative outcomes that end processing and enable the Do-Not-Contact toggle.
const NEGATIVE = new Set(["notinterested", "currentlynot", "difficult"]);

// A lead may be called at most 5 times; after that it is marked "Not Reached".
const MAX_CALL_ATTEMPTS = 5;

// Short label shown as the "Feedback & Processing status" elsewhere.
export const FEEDBACK_STEP_LABEL = {
  initial:     "Initial Contact",
  phone:       "Phone Attempts",
  outcome:     "Contact Outcome",
  schedule:    "Scheduling",
  appointment: "Appointment",
  finish:      "Finalized",
};

const CHANNELS = [
  { key: "sms",      label: "SMS",      icon: "💬" },
  { key: "whatsapp", label: "WhatsApp", icon: "📱" },
  { key: "email",    label: "Email",    icon: "✉️" },
];
const channelLabel = (k) => CHANNELS.find(c => c.key === k)?.label || k;

// ── time / seed helpers ───────────────────────────────────────────────────────
const nowTime = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
const today   = () => new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

// Map a lead's mock status → the step it should open on.
const STATUS_STEP = {
  open: 0, in_progress: 1, attempted: 1, not_reached: 5,
  followup: 2, appointment: 4, closed: 5, no_interest: 5, dnc: 5,
};

// Build the initial processing state from a lead. `alreadyContact` is true when
// opened from a contacts view (My Network) — those are contacts already.
export const makeInitialFeedback = (lead, alreadyContact = false) => {
  const status  = lead?.status || "open";
  const current = STATUS_STEP[status] ?? 0;
  const notReached = status === "not_reached";
  const negative = status === "no_interest" || status === "dnc";
  const finished = status === "closed";
  const calls   = lead?.attempts || 0;
  const isContact = alreadyContact || status === "appointment" || status === "closed";
  const channels = { sms: current > 0 ? 1 : 0, whatsapp: 0, email: 0 };
  // Which steps have actually been visited (drives the collapsed "done" rows).
  const doneSteps = notReached ? ["initial", "phone"]
    : negative ? ["initial", "phone", "outcome"]
    : STEPS.slice(0, current).map(s => s.key);
  const log = [{ text: "Lead assigned → status set to New", time: "12:58:29 PM" }];
  if (current > 0) log.push({ text: "Initial Contact → Sent via SMS", time: "12:59:05 PM" });
  return {
    current, finished, isContact, channels, calls,
    reached: current >= IDX.outcome && !notReached,
    notReached,
    contactOutcome: null, apptOutcome: null,
    negativeOutcome: negative, dnc: status === "dnc",
    appointment: current >= IDX.appointment && !notReached ? { type: "Consultation Appointment", date: "—", time: "—" } : null,
    reschedules: 0,
    doneSteps,
    summaries: {},
    lastAction: current > 0 ? { icon: "✉️", label: "Initial contact sent", date: today() } : null,
    log,
  };
};

// Derived one-liner with counts for the current stage (used by Overview).
export const feedbackDetail = (s) => {
  const msgs = (s.channels.sms || 0) + (s.channels.whatsapp || 0) + (s.channels.email || 0);
  const step = STEPS[s.current]?.key;
  if (s.notReached) return `Not reached (${s.calls}/${MAX_CALL_ATTEMPTS})`;
  if (s.finished)   return s.apptOutcome || s.contactOutcome || "Processing complete";
  if (step === "initial")     return `${msgs} message${msgs !== 1 ? "s" : ""} sent`;
  if (step === "phone")       return `${s.calls} call${s.calls !== 1 ? "s" : ""}${s.reached ? " · reached" : ""}`;
  if (step === "outcome")     return "Recording outcome";
  if (step === "schedule")    return s.reschedules ? `Re-scheduling (×${s.reschedules})` : "Booking appointment";
  if (step === "appointment") return "Awaiting appointment result";
  if (step === "finish")      return s.contactOutcome || "Finalizing";
  return "";
};

const card = { background: "#fff", border: `1px solid ${C.border}`, borderRadius: 14 };
const fieldStyle = {
  width: "100%", padding: "9px 12px", borderRadius: 8,
  border: `1px solid ${C.border}`, fontSize: 13, fontFamily: "inherit",
  color: C.text, boxSizing: "border-box" as const, outline: "none", background: "#fff",
};

const PrimaryBtn = ({ children, onClick, icon, disabled }: any) => (
  <button onClick={onClick} disabled={disabled} style={{
    display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 18px", borderRadius: 9,
    border: "none", background: disabled ? C.border : C.navy, color: disabled ? C.muted : "#fff",
    fontSize: 13, fontWeight: 700, cursor: disabled ? "default" : "pointer", fontFamily: "inherit",
  }}>{icon && <span>{icon}</span>}{children}</button>
);

// Numbered stage dot — the number is shown in every state (locked / current / done).
const StepDot = ({ n, bg, color = "#fff", ring = false }) => (
  <span style={{
    width: 26, height: 26, borderRadius: "50%", background: bg, color, fontSize: 12, fontWeight: 700,
    display: "grid", placeItems: "center", flexShrink: 0, border: ring ? `1.5px solid ${C.border}` : "none",
  }}>{n}</span>
);

const LockedStep = ({ num, title }) => (
  <div style={{ ...card, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12, opacity: 0.75 }}>
    <StepDot n={num} bg={C.light} color={C.muted} ring />
    <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: C.muted }}>{title}</span>
    <span title="Locked" style={{ fontSize: 12, color: C.muted }}>🔒</span>
  </div>
);

// Completed steps are committed — corrections are made in-step before pressing
// Continue, so there's no per-step Edit affordance.
const DoneStep = ({ num, title, summary }) => (
  <div style={{ ...card, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12, background: C.green + "08", borderColor: C.green + "40" }}>
    <StepDot n={num} bg={C.green} color="#fff" />
    <div style={{ flex: 1, minWidth: 0 }}>
      <span style={{ fontSize: 14, fontWeight: 600, color: C.navy }}>{title}</span>
      {summary && <span style={{ fontSize: 12.5, color: C.slate, marginLeft: 8 }}>· {summary}</span>}
    </div>
    <span style={{ color: C.green, fontSize: 13 }}>✓</span>
  </div>
);

const CurrentStepShell = ({ num, title, children }) => (
  <div style={{ ...card, borderColor: C.navy, boxShadow: "0 6px 22px rgba(29,41,57,0.10)" }}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${C.border}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <StepDot n={num} bg={C.navy} color="#fff" />
        <span style={{ fontSize: 16, fontWeight: 700, color: C.navy }}>{title}</span>
      </div>
      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: C.green, background: C.green + "18", padding: "4px 10px", borderRadius: 20 }}>Current</span>
    </div>
    <div style={{ padding: "18px 20px" }}>{children}</div>
  </div>
);

// ── Confirmation dialog (lead → contact conversion) ──────────────────────────
const ConfirmDialog = ({ title, message, confirmLabel, onCancel, onConfirm }) => (
  <>
    <div onClick={onCancel} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", zIndex: 600 }} />
    <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 430, maxWidth: "92vw", background: "#fff", borderRadius: 16, zIndex: 700, boxShadow: "0 24px 64px rgba(0,0,0,0.22)", padding: "22px 24px", fontFamily: "inherit" }}>
      <div style={{ fontSize: 17, fontWeight: 700, color: C.navy, marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 13, color: C.slate, marginBottom: 22, lineHeight: 1.5 }}>{message}</div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
        <button onClick={onCancel} style={{ padding: "9px 20px", borderRadius: 9, border: "none", background: "transparent", color: C.slate, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
        <button onClick={onConfirm} style={{ padding: "9px 24px", borderRadius: 9, border: "none", background: C.navy, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>{confirmLabel}</button>
      </div>
    </div>
  </>
);

// Labelled on/off switch (used for the Do-Not-Contact flag).
const Toggle = ({ on, onChange, danger = false }) => (
  <button role="switch" aria-checked={on} onClick={onChange} style={{
    position: "relative", width: 42, height: 24, borderRadius: 20, border: "none", cursor: "pointer", flexShrink: 0,
    background: on ? (danger ? C.red : C.green) : C.border, transition: "background .15s", padding: 0,
  }}>
    <span style={{ position: "absolute", top: 3, left: on ? 21 : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left .15s", boxShadow: "0 1px 3px rgba(0,0,0,0.25)" }} />
  </button>
);

// Reusable option-chip row.
const OptionChips = ({ options, value, onChange }) => (
  <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
    {options.map(o => {
      const on = value === o.v;
      return (
        <button key={o.v} onClick={() => onChange(o.v)} style={{
          padding: "9px 16px", borderRadius: 9, border: `1.5px solid ${on ? o.tone : C.border}`,
          background: on ? o.tone + "14" : "#fff", color: on ? o.tone : C.slate,
          fontSize: 13, fontWeight: on ? 700 : 500, cursor: "pointer", fontFamily: "inherit",
        }}>{o.label}</button>
      );
    })}
  </div>
);

// ── Step bodies ───────────────────────────────────────────────────────────────
const CHANNEL_TEMPLATE = {
  sms:      "Hi {first}, this is {advisor} from Nordpfeil Finance. Thanks for your interest in a consultation — I'll try to reach you by phone shortly. Feel free to reply with a time that suits you best.",
  whatsapp: "Hello {first}! 👋 {advisor} here from Nordpfeil Finance. Great to connect — when would be a good moment for a short call about your request?",
  email:    "Dear {first},\n\nThank you for your interest in a consultation with Nordpfeil Finance. I'd be glad to walk you through the next steps. When would be a convenient time for a brief call?\n\nBest regards,\n{advisor}",
};

const InitialContactStep = ({ contact, sent, onSend }) => {
  const [channels, setChannels] = useState<string[]>(["sms"]);
  const [copied, setCopied] = useState(false);
  const primary = channels[0] || "sms";
  const first = (contact?.name || "there").replace(/^(Ms|Mr|Mrs|Dr)\.?\s+/i, "").split(" ")[0];
  const advisor = contact?.assignee || "your advisor";
  const template = (CHANNEL_TEMPLATE[primary] || "").replace(/{first}/g, first).replace(/{advisor}/g, advisor);
  const toggle = (k) => setChannels(prev => prev.includes(k) ? prev.filter(x => x !== k) : [...prev, k]);
  const totalSent = (sent.sms || 0) + (sent.whatsapp || 0) + (sent.email || 0);
  return (
    <>
      <div style={{ fontSize: 13, color: C.slate, marginBottom: 14 }}>Choose one or more communication methods and send the prepared template.</div>
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        {CHANNELS.map(ch => {
          const on = channels.includes(ch.key);
          return (
            <button key={ch.key} onClick={() => toggle(ch.key)} style={{
              display: "inline-flex", alignItems: "center", gap: 7, padding: "8px 14px", borderRadius: 9,
              border: `1.5px solid ${on ? C.navy : C.border}`, background: on ? C.navy + "0D" : "#fff",
              color: on ? C.navy : C.slate, fontSize: 13, fontWeight: on ? 700 : 500, cursor: "pointer", fontFamily: "inherit",
            }}>{ch.icon} {ch.label}{sent[ch.key] > 0 && <span style={{ marginLeft: 2, fontSize: 11, fontWeight: 700, color: C.green }}>·{sent[ch.key]}</span>}</button>
          );
        })}
      </div>
      <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, background: C.light, padding: "14px 16px", marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: C.muted }}>{channelLabel(primary)} Template</span>
          <button onClick={() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", color: copied ? C.green : C.slate, fontSize: 12, fontWeight: 600 }}>
            {copied ? "✓ Copied" : "⧉ Copy message"}
          </button>
        </div>
        <div style={{ fontSize: 13, color: C.text, lineHeight: 1.55, whiteSpace: "pre-wrap" }}>{template}</div>
      </div>
      {totalSent > 0 && (
        <div style={{ fontSize: 12, color: C.slate, marginBottom: 12 }}>
          Already sent: {CHANNELS.filter(c => sent[c.key] > 0).map(c => `${sent[c.key]} ${c.label}`).join(" · ")}
        </div>
      )}
      <PrimaryBtn icon="✓" onClick={() => onSend(channels)} disabled={channels.length === 0}>Continue</PrimaryBtn>
    </>
  );
};

const CALL_RESULTS = [
  { v: "notreached", label: "Not Reached", tone: C.red },
  { v: "reached",    label: "Reached",     tone: C.green },
];
// Select the result of a call attempt (correctable), then Continue to commit it.
const PhoneAttemptsStep = ({ calls, notReached, onLog }) => {
  const [sel, setSel] = useState("");
  return (
    <>
      <div style={{ fontSize: 13, color: C.slate, marginBottom: 14 }}>Make a call attempt (max {MAX_CALL_ATTEMPTS}), pick the result and press <b>Continue</b>.</div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", border: `1px solid ${notReached ? C.red + "55" : C.border}`, borderRadius: 10, marginBottom: 12, background: notReached ? C.red + "0C" : C.light }}>
        <span style={{ fontSize: 22 }}>{notReached ? "🚫" : "📞"}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: notReached ? C.red : C.navy }}>{calls} of {MAX_CALL_ATTEMPTS} call attempt{calls !== 1 ? "s" : ""}{notReached ? " · Not Reached" : ""}</div>
          <div style={{ fontSize: 11.5, color: C.muted }}>{notReached ? "Maximum attempts reached — sent to Finalize as Not Reached." : "Keep trying until the contact answers."}</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {Array.from({ length: MAX_CALL_ATTEMPTS }).map((_, i) => (
          <span key={i} style={{ flex: 1, height: 6, borderRadius: 4, background: i < calls ? (notReached ? C.red : C.amber) : C.border }} />
        ))}
      </div>
      {!notReached && (
        <>
          <OptionChips options={CALL_RESULTS} value={sel} onChange={setSel} />
          <PrimaryBtn icon="✓" disabled={!sel} onClick={() => onLog(sel === "reached")}>Continue</PrimaryBtn>
        </>
      )}
    </>
  );
};

// Contact Outcome (after the contact is reached).
const CONTACT_OUTCOMES = [
  { v: "appointment",  label: "Appointment Scheduled",    tone: C.green },
  { v: "notinterested",label: "Not Interested",           tone: C.red },
  { v: "currentlynot", label: "Currently Not Interested", tone: C.amber },
  { v: "difficult",    label: "Difficult Case",           tone: C.slate },
];
// Appointment Outcome (flat, single-select).
const APPT_OUTCOMES = [
  { v: "qualified",    label: "Qualified",                tone: C.green },
  { v: "reschedule",   label: "Reschedule",               tone: C.amber },
  { v: "attending",    label: "Attending Event",          tone: C.indigo },
  { v: "notinterested",label: "Not Interested",           tone: C.red },
  { v: "currentlynot", label: "Currently Not Interested", tone: C.amber },
  { v: "difficult",    label: "Difficult Case",           tone: C.slate },
];

const OutcomeSelectStep = ({ prompt, options, headerInfo, onComplete }) => {
  const [choice, setChoice] = useState("");
  const [note, setNote] = useState("");
  const sel = options.find(o => o.v === choice);
  const hint = choice === "reschedule"
    ? "↩ Re-opens scheduling — you'll re-book a new appointment and stay on this step."
    : NEGATIVE.has(choice)
      ? "↩ Ends processing — you can set Do Not Contact in the Finalize step."
      : null;
  return (
    <>
      {headerInfo}
      <div style={{ fontSize: 13, color: C.slate, marginBottom: 14 }}>{prompt}</div>
      <OptionChips options={options} value={choice} onChange={setChoice} />
      {hint && <div style={{ fontSize: 12, color: C.amber, fontWeight: 600, marginBottom: 12 }}>{hint}</div>}
      <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Briefly describe the outcome (optional)…"
        style={{ ...fieldStyle, minHeight: 70, resize: "vertical", lineHeight: 1.5, marginBottom: 16 }} />
      <PrimaryBtn icon="✓" onClick={() => sel && onComplete(sel.v, sel.label)} disabled={!sel}>Continue</PrimaryBtn>
    </>
  );
};

// Scheduling opens the full Appointment modal (same one used across the app).
const ScheduleStep = ({ reschedules, onOpenModal }) => (
  <>
    <div style={{ fontSize: 13, color: C.slate, marginBottom: 16 }}>
      {reschedules > 0 ? `Re-book the consultation appointment (rescheduled ${reschedules}×).` : "Book the consultation appointment with the contact."}
    </div>
    <PrimaryBtn icon="📅" onClick={onOpenModal}>Open Scheduling</PrimaryBtn>
  </>
);

const FinalizeStep = ({ done, negativeOutcome, dnc, onToggleDnc, onComplete }) => (
  <>
    {negativeOutcome && (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "12px 14px", borderRadius: 10, border: `1px solid ${dnc ? C.red + "55" : C.border}`, background: dnc ? C.red + "0C" : C.light, marginBottom: 16 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: dnc ? C.red : C.navy }}>Do Not Contact (DNC)</div>
          <div style={{ fontSize: 11.5, color: C.muted }}>Flag this lead so no further outreach is attempted.</div>
        </div>
        <Toggle on={dnc} onChange={onToggleDnc} danger />
      </div>
    )}
    {done ? (
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "6px 0" }}>
        <span style={{ width: 34, height: 34, borderRadius: "50%", background: C.green, display: "grid", placeItems: "center", fontSize: 16, color: "#fff", flexShrink: 0 }}>✓</span>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.navy }}>Lead ready — processed</div>
          <div style={{ fontSize: 12.5, color: C.slate, marginTop: 2 }}>Feedback has been fed into the campaign statistics.{dnc ? " Marked Do Not Contact." : ""}</div>
        </div>
      </div>
    ) : (
      <>
        <div style={{ fontSize: 13, color: C.slate, marginBottom: 16 }}>Mark the lead as fully processed. Your feedback feeds into the campaign statistics.</div>
        <PrimaryBtn icon="🏁" onClick={onComplete}>Mark lead as processed</PrimaryBtn>
      </>
    )}
  </>
);

// ── Main tab (controlled) ─────────────────────────────────────────────────────
export const FeedbackProcessingTab = ({ contact, state, setState, role }) => {
  const current = state.current;
  const currentStep = STEPS[current];
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);
  // Convert-to-Contact is offered only on result stages, never on an action stage.
  const showConvert = RESULT_STEPS.has(currentStep.key);

  const pushLog = (prev, text) => [...prev.log, { text, time: nowTime() }];
  const withDone = (prev, key) => prev.doneSteps.includes(key) ? prev.doneSteps : [...prev.doneSteps, key];

  const onSend = (channels) => setState(prev => {
    const ch = { ...prev.channels };
    channels.forEach(c => { ch[c] = (ch[c] || 0) + 1; });
    const summary = `Sent via ${channels.map(channelLabel).join(", ")}`;
    const total = (ch.sms || 0) + (ch.whatsapp || 0) + (ch.email || 0);
    return {
      ...prev, channels: ch, current: IDX.phone, doneSteps: withDone(prev, "initial"),
      summaries: { ...prev.summaries, initial: `${total} message${total !== 1 ? "s" : ""} sent` },
      lastAction: { icon: "✉️", label: `Initial contact · ${summary}`, date: today() },
      log: pushLog(prev, `Initial Contact → ${summary}`),
    };
  });

  const onLogCall = (reached) => setState(prev => {
    if (prev.notReached) return prev;
    const calls = Math.min(prev.calls + 1, MAX_CALL_ATTEMPTS);
    if (reached) {
      return {
        ...prev, calls, reached: true, current: IDX.outcome, doneSteps: withDone(prev, "phone"),
        summaries: { ...prev.summaries, phone: `${calls} calls · reached` },
        lastAction: { icon: "📞", label: "Reached by phone", date: today() },
        log: pushLog(prev, `Phone Contact Attempts → Reached (attempt ${calls})`),
      };
    }
    const exhausted = calls >= MAX_CALL_ATTEMPTS;
    if (exhausted) {
      return {
        ...prev, calls, notReached: true, current: IDX.finish, doneSteps: withDone(prev, "phone"),
        summaries: { ...prev.summaries, phone: `${calls} calls · not reached` },
        lastAction: { icon: "🚫", label: `Not reached (max ${MAX_CALL_ATTEMPTS} attempts)`, date: today() },
        log: pushLog(prev, `Phone Contact Attempts → Not reached (attempt ${calls}) · sent to Finalize`),
      };
    }
    return {
      ...prev, calls,
      summaries: { ...prev.summaries, phone: `${calls} call${calls !== 1 ? "s" : ""}` },
      lastAction: { icon: "📞", label: "Call attempt — not reached", date: today() },
      log: pushLog(prev, `Phone Contact Attempts → Not reached (attempt ${calls})`),
    };
  });

  const onContactOutcome = (v, label) => setState(prev => {
    const done = withDone(prev, "outcome");
    if (v === "appointment") {
      return {
        ...prev, contactOutcome: label, current: IDX.schedule, doneSteps: done,
        summaries: { ...prev.summaries, outcome: label },
        lastAction: { icon: "📅", label: `Outcome: ${label}`, date: today() },
        log: pushLog(prev, `Contact Outcome → ${label}`),
      };
    }
    // Negative outcome → skip to Finalize.
    return {
      ...prev, contactOutcome: label, negativeOutcome: true, current: IDX.finish, doneSteps: done,
      summaries: { ...prev.summaries, outcome: label },
      lastAction: { icon: "🏁", label: `Outcome: ${label}`, date: today() },
      log: pushLog(prev, `Contact Outcome → ${label} · sent to Finalize`),
    };
  });

  const onSchedule = (appt) => setState(prev => ({
    ...prev, appointment: appt, current: IDX.appointment, doneSteps: withDone(prev, "schedule"),
    summaries: { ...prev.summaries, schedule: `${appt.type} · ${appt.date} ${appt.time}` },
    lastAction: { icon: "📅", label: `Appointment booked · ${appt.date} ${appt.time}`, date: today() },
    log: pushLog(prev, `Schedule Appointment → ${appt.type} · ${appt.date} ${appt.time}`),
  }));

  // Re-book from within Appointment Outcome (reschedule) — keeps the current step.
  const onRebook = (appt) => setState(prev => ({
    ...prev, appointment: appt,
    summaries: { ...prev.summaries, schedule: `${appt.type} · ${appt.date} ${appt.time}` },
    lastAction: { icon: "📅", label: `Re-booked · ${appt.date} ${appt.time}`, date: today() },
    log: pushLog(prev, `Schedule Appointment → Re-booked · ${appt.type} · ${appt.date} ${appt.time}`),
  }));

  const onAppointmentOutcome = (v, label) => {
    if (v === "reschedule") {
      setState(prev => ({
        ...prev, reschedules: prev.reschedules + 1,
        lastAction: { icon: "🔁", label: "Appointment rescheduled — re-book", date: today() },
        log: pushLog(prev, "Appointment Outcome → Reschedule — re-opening scheduling"),
      }));
      setScheduleModalOpen(true);
      return;
    }
    setState(prev => ({
      ...prev, apptOutcome: label, current: IDX.finish, doneSteps: withDone(prev, "appointment"),
      negativeOutcome: NEGATIVE.has(v) ? true : prev.negativeOutcome,
      summaries: { ...prev.summaries, appointment: label },
      lastAction: { icon: NEGATIVE.has(v) ? "🏁" : "✅", label: `Appointment: ${label}`, date: today() },
      log: pushLog(prev, `Appointment Outcome → ${label}`),
    }));
  };

  const onToggleDnc = () => setState(prev => {
    const dnc = !prev.dnc;
    return { ...prev, dnc, log: pushLog(prev, `Do Not Contact → ${dnc ? "ON" : "OFF"}`) };
  });

  const onFinish = () => setState(prev => ({
    ...prev, finished: true,
    lastAction: { icon: "🏁", label: "Lead processed", date: today() },
    log: pushLog(prev, `Finalize Process → Processed${prev.dnc ? " · Do Not Contact" : ""}`),
  }));

  const onConvert = () => setState(prev => ({
    ...prev, isContact: true,
    lastAction: { icon: "⇪", label: "Lead converted to contact", date: today() },
    log: pushLog(prev, "Lead → Contact (converted)"),
  }));

  const apptInfo = state.appointment && (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 9, background: C.light, border: `1px solid ${C.border}`, marginBottom: 14, fontSize: 12.5, color: C.navy, fontWeight: 600 }}>
      📅 {state.appointment.type} · {state.appointment.date} {state.appointment.time}
    </div>
  );

  const renderCurrentBody = (step) => {
    switch (step.key) {
      case "initial":     return <InitialContactStep contact={contact} sent={state.channels} onSend={onSend} />;
      case "phone":       return <PhoneAttemptsStep key={`ph-${state.calls}`} calls={state.calls} notReached={state.notReached} onLog={onLogCall} />;
      case "outcome":     return <OutcomeSelectStep prompt="The contact was reached. What's the outcome of the conversation?" options={CONTACT_OUTCOMES} onComplete={onContactOutcome} />;
      case "schedule":    return <ScheduleStep reschedules={state.reschedules} onOpenModal={() => setScheduleModalOpen(true)} />;
      case "appointment": return <OutcomeSelectStep key={`ao-${state.reschedules}`} prompt="Record the outcome of the scheduled appointment." options={APPT_OUTCOMES} headerInfo={apptInfo} onComplete={onAppointmentOutcome} />;
      case "finish":      return <FinalizeStep done={state.finished} negativeOutcome={state.negativeOutcome} dnc={state.dnc} onToggleDnc={onToggleDnc} onComplete={onFinish} />;
      default:            return null;
    }
  };

  // Locked (future) steps: those after the current one — empty once we've jumped
  // to Finalize. Completed rows come from the actually-visited steps.
  const future    = STEPS.slice(current + 1);
  const completed = state.doneSteps.map(k => STEPS.find(s => s.key === k)).filter(Boolean).reverse();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontSize: 12.5, color: C.muted, marginBottom: 2 }}>
        Steps run from bottom to top — completed steps collapse below, the current step stays closest to you.
      </div>

      {future.slice().reverse().map(s => <LockedStep key={s.key} num={stepNo(s.key)} title={s.title} />)}

      <CurrentStepShell num={stepNo(currentStep.key)} title={currentStep.title}>
        {renderCurrentBody(currentStep)}
        {/* Lead → Contact conversion — offered only on result stages. */}
        {showConvert && (
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: C.navy }}>Lead status</div>
              <div style={{ fontSize: 11.5, color: C.muted }}>{state.isContact ? "This lead has been converted to a contact." : "Convert this lead into a contact based on the result."}</div>
            </div>
            {state.isContact
              ? <span style={{ fontSize: 12, fontWeight: 700, color: C.green, background: C.green + "14", padding: "6px 12px", borderRadius: 20, whiteSpace: "nowrap" }}>✓ Contact</span>
              : <button onClick={() => setConvertOpen(true)} style={{ padding: "8px 16px", borderRadius: 9, border: `1.5px solid ${C.primary}`, background: "#fff", color: C.primaryDark, fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit" }}>⇪ Convert to Contact</button>}
          </div>
        )}
      </CurrentStepShell>

      {completed.map(s => (
        <DoneStep key={s.key} num={stepNo(s.key)} title={s.title} summary={state.summaries[s.key]} />
      ))}

      {scheduleModalOpen && (
        <AppointmentModal
          mode="create" role={role} lockContact
          appt={{
            contact: contact?.name || "",
            title: `Consultation — ${contact?.name || ""}`.trim(),
            apptType: "Consultation Appointment",
          }}
          onClose={() => setScheduleModalOpen(false)}
          onSubmit={(data) => {
            const appt = { type: data.apptType, date: data.date, time: data.time };
            // From the Schedule step → advance; from Appointment Outcome → re-book & stay.
            if (current === IDX.schedule) onSchedule(appt); else onRebook(appt);
            setScheduleModalOpen(false);
          }}
        />
      )}

      {convertOpen && (
        <ConfirmDialog
          title="Convert Lead to Contact"
          message={<>Convert <b>{contact?.name}</b> from a lead into a contact? They'll be marked as an active contact in your network.</>}
          confirmLabel="Convert to Contact"
          onCancel={() => setConvertOpen(false)}
          onConfirm={() => { onConvert(); setConvertOpen(false); }}
        />
      )}

      {/* Automatic status log */}
      <div style={{ ...card, padding: "14px 18px", marginTop: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: C.muted, marginBottom: 12 }}>
          🕘 Automatic Status Log
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {state.log.map((l, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 12.5, color: C.text }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: C.blue, flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{l.text}</span>
              <span style={{ fontSize: 11.5, color: C.muted }}>{l.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
