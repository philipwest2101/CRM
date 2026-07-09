import React, { useState } from "react";
import { C } from "../../theme";
import { AppointmentModal } from "../appointments/appointment-modal";

// ─────────────────────────────────────────────────────────────────────────────
// FEEDBACK & PROCESSING TAB  (controlled)
// A guided, bottom-to-top stepper that walks an advisor through everything that
// happens to a lead after it becomes a contact — from the first outreach to the
// final processing outcome. Completed steps collapse below the current one; the
// current step stays closest to the user (just above the automatic status log).
//
// State is owned by the parent (contact detail page) so the Overview tab and the
// tab-gating (other tabs stay disabled until the lead becomes a contact) can all
// react to the same processing state.
//
// Flow: Initial Contact → Phone Contact Attempts → Schedule Appointment →
//       Appointment Outcome → Business Outcome → Finish Processing.
// Choosing "Rescheduled" at the appointment outcome loops back to scheduling —
// the lead stays at that stage instead of moving forward.
// ─────────────────────────────────────────────────────────────────────────────

export const STEPS = [
  { key: "initial",     title: "Initial Contact" },
  { key: "phone",       title: "Phone Contact Attempts" },
  { key: "schedule",    title: "Schedule Appointment" },
  { key: "apptOutcome", title: "Appointment Outcome" },
  { key: "bizOutcome",  title: "Business Outcome" },
  { key: "finish",      title: "Finish Processing" },
];
const IDX = Object.fromEntries(STEPS.map((s, i) => [s.key, i]));

// A lead may be called at most 5 times; after that it is marked "Not Reached".
const MAX_CALL_ATTEMPTS = 5;

// Short label shown as the "Feedback & Processing status" elsewhere.
export const FEEDBACK_STEP_LABEL = {
  initial:     "Initial Contact",
  phone:       "Phone Attempts",
  schedule:    "Scheduling",
  apptOutcome: "Appointment",
  bizOutcome:  "Business Outcome",
  finish:      "Finished",
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
  open: 0, in_progress: 1, attempted: 1, not_reached: 1,
  followup: 2, appointment: 3, closed: 5, no_interest: 5, dnc: 5,
};

// Build the initial processing state from a lead. `alreadyContact` is true when
// opened from a contacts view (My Network) — those are contacts already.
export const makeInitialFeedback = (lead, alreadyContact = false) => {
  const status  = lead?.status || "open";
  const current = STATUS_STEP[status] ?? 0;
  const finished = status === "closed" || status === "not_reached";
  const calls   = lead?.attempts || 0;
  // Already a contact if opened from a contacts view, or past the appointment
  // conversion point (appointment booked / deal closed).
  const isContact = alreadyContact || status === "appointment" || status === "closed";
  const channels = { sms: current > 0 ? 1 : 0, whatsapp: 0, email: 0 };
  const log = [{ text: "Lead assigned → status set to New", time: "12:58:29 PM" }];
  if (current > 0) log.push({ text: "Initial Contact → Sent via SMS", time: "12:59:05 PM" });
  return {
    current, finished, isContact, channels, calls,
    reached: current > 1,
    notReached: status === "not_reached",
    appointment: current >= 3 ? { type: "Consultation Appointment", date: "—", time: "—" } : null,
    apptOutcome: null, bizOutcome: status === "closed" ? "Closed – Won" : null,
    reschedules: 0,
    summaries: {},
    lastAction: current > 0
      ? { icon: "✉️", label: "Initial contact sent", date: today() }
      : null,
    log,
  };
};

// Derived one-liner with counts for the current stage (used by Overview).
export const feedbackDetail = (s) => {
  const msgs = (s.channels.sms || 0) + (s.channels.whatsapp || 0) + (s.channels.email || 0);
  const step = STEPS[s.current]?.key;
  if (s.finished) return "Processing complete";
  if (step === "initial")  return `${msgs} message${msgs !== 1 ? "s" : ""} sent`;
  if (step === "phone")    return s.notReached ? `Not reached (${s.calls}/${MAX_CALL_ATTEMPTS})` : `${s.calls} call${s.calls !== 1 ? "s" : ""}${s.reached ? " · reached" : ""}`;
  if (step === "schedule") return s.reschedules ? `Re-scheduling (×${s.reschedules})` : "Booking appointment";
  if (step === "apptOutcome") return "Awaiting appointment";
  if (step === "bizOutcome")  return "Awaiting outcome";
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
const GhostBtn = ({ children, onClick, icon }: any) => (
  <button onClick={onClick} style={{
    display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 9,
    border: `1px solid ${C.border}`, background: "#fff", color: C.slate, fontSize: 13, fontWeight: 600,
    cursor: "pointer", fontFamily: "inherit",
  }}>{icon && <span>{icon}</span>}{children}</button>
);

const LockedStep = ({ title }) => (
  <div style={{ ...card, padding: "16px 18px", display: "flex", alignItems: "center", gap: 12, opacity: 0.7 }}>
    <span style={{ width: 22, height: 22, borderRadius: "50%", border: `1.5px solid ${C.border}`, display: "grid", placeItems: "center", fontSize: 11, color: C.muted, flexShrink: 0 }}>🔒</span>
    <span style={{ fontSize: 14, fontWeight: 600, color: C.muted }}>{title}</span>
  </div>
);

// Only the most recently completed step is editable (`editable`); older steps
// are locked so history can't be rewritten out of order.
const DoneStep = ({ title, summary, onReopen, editable }) => (
  <div style={{ ...card, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12, background: C.green + "08", borderColor: C.green + "40" }}>
    <span style={{ width: 22, height: 22, borderRadius: "50%", background: C.green, display: "grid", placeItems: "center", fontSize: 12, color: "#fff", flexShrink: 0 }}>✓</span>
    <div style={{ flex: 1, minWidth: 0 }}>
      <span style={{ fontSize: 14, fontWeight: 600, color: C.navy }}>{title}</span>
      {summary && <span style={{ fontSize: 12.5, color: C.slate, marginLeft: 8 }}>· {summary}</span>}
    </div>
    {editable
      ? <button onClick={onReopen} title="Reopen this step" style={{ background: "none", border: "none", cursor: "pointer", color: C.slate, fontSize: 12, fontWeight: 600 }}>Edit</button>
      : <span title="Only the latest completed step can be edited" style={{ color: C.muted, fontSize: 12 }}>🔒</span>}
  </div>
);

const CurrentStepShell = ({ index, title, children }) => (
  <div style={{ ...card, borderColor: C.navy, boxShadow: "0 6px 22px rgba(29,41,57,0.10)" }}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${C.border}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ width: 26, height: 26, borderRadius: "50%", background: C.navy, display: "grid", placeItems: "center", fontSize: 12, color: "#fff", fontWeight: 700, flexShrink: 0 }}>{index + 1}</span>
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
      <div style={{ display: "flex", gap: 10 }}>
        <GhostBtn icon="➤" onClick={() => onSend(channels, false)}>Send externally</GhostBtn>
        <PrimaryBtn icon="✓" onClick={() => onSend(channels, true)} disabled={channels.length === 0}>Mark as Sent → Continue</PrimaryBtn>
      </div>
    </>
  );
};

const PhoneAttemptsStep = ({ calls, notReached, onLog }) => (
  <>
    <div style={{ fontSize: 13, color: C.slate, marginBottom: 14 }}>Log each call attempt (max {MAX_CALL_ATTEMPTS}). Mark <b>Reached</b> once the contact answers to continue.</div>
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", border: `1px solid ${notReached ? C.red + "55" : C.border}`, borderRadius: 10, marginBottom: 12, background: notReached ? C.red + "0C" : C.light }}>
      <span style={{ fontSize: 22 }}>{notReached ? "🚫" : "📞"}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: notReached ? C.red : C.navy }}>{calls} of {MAX_CALL_ATTEMPTS} call attempt{calls !== 1 ? "s" : ""}{notReached ? " · Not Reached" : ""}</div>
        <div style={{ fontSize: 11.5, color: C.muted }}>{notReached ? "Maximum attempts reached — processing finished as Not Reached." : "Keep trying until the contact answers."}</div>
      </div>
    </div>
    <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
      {Array.from({ length: MAX_CALL_ATTEMPTS }).map((_, i) => (
        <span key={i} style={{ flex: 1, height: 6, borderRadius: 4, background: i < calls ? (notReached ? C.red : C.amber) : C.border }} />
      ))}
    </div>
    {!notReached && (
      <div style={{ display: "flex", gap: 10 }}>
        <GhostBtn icon="📵" onClick={() => onLog(false)}>Log “Not reached” ({MAX_CALL_ATTEMPTS - calls} left)</GhostBtn>
        <PrimaryBtn icon="📞" onClick={() => onLog(true)}>Reached → Continue</PrimaryBtn>
      </div>
    )}
  </>
);

// Scheduling opens the full Appointment modal (same one used across the app).
const ScheduleStep = ({ reschedules, onOpenModal }) => (
  <>
    <div style={{ fontSize: 13, color: C.slate, marginBottom: 16 }}>
      {reschedules > 0 ? `Re-book the consultation appointment (rescheduled ${reschedules}×).` : "Book the consultation appointment with the contact."}
    </div>
    <PrimaryBtn icon="📅" onClick={onOpenModal}>Open Scheduling</PrimaryBtn>
  </>
);

const OUTCOME_OPTIONS = {
  apptOutcome: [
    { v: "completed",   label: "Completed",   tone: C.green },
    { v: "rescheduled", label: "Rescheduled", tone: C.amber },
    { v: "noshow",      label: "No Show",     tone: C.red },
  ],
  bizOutcome: [
    { v: "won",       label: "Closed – Won",  tone: C.green },
    { v: "followup",  label: "Follow-up",     tone: C.amber },
    { v: "lost",      label: "Closed – Lost", tone: C.red },
  ],
};
const OutcomeStep = ({ stepKey, prompt, onComplete }) => {
  const [choice, setChoice] = useState("");
  const [note, setNote] = useState("");
  const opts = OUTCOME_OPTIONS[stepKey];
  const sel = opts.find(o => o.v === choice);
  return (
    <>
      <div style={{ fontSize: 13, color: C.slate, marginBottom: 14 }}>{prompt}</div>
      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        {opts.map(o => {
          const on = choice === o.v;
          return (
            <button key={o.v} onClick={() => setChoice(o.v)} style={{
              padding: "9px 16px", borderRadius: 9, border: `1.5px solid ${on ? o.tone : C.border}`,
              background: on ? o.tone + "14" : "#fff", color: on ? o.tone : C.slate,
              fontSize: 13, fontWeight: on ? 700 : 500, cursor: "pointer", fontFamily: "inherit",
            }}>{o.label}</button>
          );
        })}
      </div>
      {choice === "rescheduled" && (
        <div style={{ fontSize: 12, color: C.amber, fontWeight: 600, marginBottom: 12 }}>↩ The contact stays at the scheduling stage — you'll re-book a new appointment.</div>
      )}
      <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Add a short note (optional)…"
        style={{ ...fieldStyle, minHeight: 70, resize: "vertical", lineHeight: 1.5, marginBottom: 16 }} />
      <PrimaryBtn icon="✓" onClick={() => sel && onComplete(sel.v, sel.label)} disabled={!sel}>Save & Continue</PrimaryBtn>
    </>
  );
};

const FinishStep = ({ done, onComplete }) => (
  <>
    {done ? (
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "6px 0" }}>
        <span style={{ width: 34, height: 34, borderRadius: "50%", background: C.green, display: "grid", placeItems: "center", fontSize: 16, color: "#fff", flexShrink: 0 }}>✓</span>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.navy }}>Processing complete</div>
          <div style={{ fontSize: 12.5, color: C.slate, marginTop: 2 }}>This contact has moved through the full feedback flow.</div>
        </div>
      </div>
    ) : (
      <>
        <div style={{ fontSize: 13, color: C.slate, marginBottom: 16 }}>Confirm and close out the processing for this contact.</div>
        <PrimaryBtn icon="🏁" onClick={onComplete}>Finish Processing</PrimaryBtn>
      </>
    )}
  </>
);

const OUTCOME_PROMPT = {
  apptOutcome: "How did the appointment go?",
  bizOutcome:  "What was the business outcome of the consultation?",
};

// ── Main tab (controlled) ─────────────────────────────────────────────────────
export const FeedbackProcessingTab = ({ contact, state, setState, role }) => {
  const current = state.current;
  const currentStep = STEPS[current];
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);
  // Conversion is offered from the appointment stage onward, and when the lead
  // ends up Not Reached — so the user can still decide to keep it as a contact.
  const showConvert = state.notReached || current >= IDX.schedule;

  const pushLog = (prev, text) => [...prev.log, { text, time: nowTime() }];

  const onSend = (channels, advance) => setState(prev => {
    const ch = { ...prev.channels };
    channels.forEach(c => { ch[c] = (ch[c] || 0) + 1; });
    const summary = `Sent via ${channels.map(channelLabel).join(", ")}`;
    const total = (ch.sms || 0) + (ch.whatsapp || 0) + (ch.email || 0);
    return {
      ...prev, channels: ch,
      current: advance ? IDX.phone : prev.current,
      summaries: { ...prev.summaries, initial: `${total} message${total !== 1 ? "s" : ""} sent` },
      lastAction: { icon: "✉️", label: `Initial contact · ${summary}`, date: today() },
      log: pushLog(prev, `Initial Contact → ${summary}`),
    };
  });

  const onLogCall = (reached) => setState(prev => {
    if (prev.notReached) return prev;                          // capped — no more attempts
    const calls = Math.min(prev.calls + 1, MAX_CALL_ATTEMPTS);
    const exhausted = !reached && calls >= MAX_CALL_ATTEMPTS;  // 5th failed attempt → Not Reached
    if (exhausted) {
      // Max attempts hit → mark Not Reached and auto-finish the processing.
      return {
        ...prev, calls, notReached: true, finished: true,
        summaries: { ...prev.summaries, phone: `${calls} calls · not reached` },
        lastAction: { icon: "🚫", label: `Not reached (max ${MAX_CALL_ATTEMPTS} attempts) — processing finished`, date: today() },
        log: [...prev.log,
          { text: `Phone Contact Attempts → Not reached (attempt ${calls}) · status set to Not Reached`, time: nowTime() },
          { text: "Finish Processing → Not Reached (automatic)", time: nowTime() },
        ],
      };
    }
    return {
      ...prev, calls, reached: reached || prev.reached,
      current: reached ? IDX.schedule : prev.current,
      summaries: { ...prev.summaries, phone: reached ? `${calls} calls · reached` : `${calls} call${calls !== 1 ? "s" : ""}` },
      lastAction: { icon: "📞", label: reached ? "Reached by phone" : "Call attempt — not reached", date: today() },
      log: pushLog(prev, `Phone Contact Attempts → ${reached ? "Reached" : "Not reached"} (attempt ${calls})`),
    };
  });

  // Convert a lead into a contact (explicit action at the appointment stage).
  const onConvert = () => setState(prev => ({
    ...prev, isContact: true,
    lastAction: { icon: "⇪", label: "Lead converted to contact", date: today() },
    log: pushLog(prev, "Lead → Contact (converted)"),
  }));

  const onSchedule = (appt) => setState(prev => ({
    ...prev, appointment: appt, current: IDX.apptOutcome,
    summaries: { ...prev.summaries, schedule: `${appt.type} · ${appt.date} ${appt.time}` },
    lastAction: { icon: "📅", label: `Appointment booked · ${appt.date} ${appt.time}`, date: today() },
    log: pushLog(prev, `Schedule Appointment → ${appt.type} · ${appt.date} ${appt.time}`),
  }));

  const onApptOutcome = (choiceV, label) => setState(prev => {
    const rescheduled = choiceV === "rescheduled";
    return {
      ...prev, apptOutcome: label,
      reschedules: rescheduled ? prev.reschedules + 1 : prev.reschedules,
      appointment: rescheduled ? null : prev.appointment,
      current: rescheduled ? IDX.schedule : IDX.bizOutcome,   // loop back to scheduling
      summaries: { ...prev.summaries, apptOutcome: rescheduled ? "" : label, schedule: rescheduled ? "" : prev.summaries.schedule },
      lastAction: { icon: rescheduled ? "🔁" : "✅", label: `Appointment: ${label}`, date: today() },
      log: pushLog(prev, `Appointment Outcome → ${label}${rescheduled ? " (back to scheduling)" : ""}`),
    };
  });

  const onBizOutcome = (choiceV, label) => setState(prev => ({
    ...prev, bizOutcome: label, current: IDX.finish,
    summaries: { ...prev.summaries, bizOutcome: label },
    lastAction: { icon: "💼", label: `Business outcome: ${label}`, date: today() },
    log: pushLog(prev, `Business Outcome → ${label}`),
  }));

  const onFinish = () => setState(prev => ({
    ...prev, finished: true,
    lastAction: { icon: "🏁", label: "Processing finished", date: today() },
    log: pushLog(prev, "Finish Processing → Completed"),
  }));

  const reopen = (idx) => setState(prev => ({ ...prev, current: idx, finished: false }));

  const renderCurrentBody = (step) => {
    switch (step.key) {
      case "initial":  return <InitialContactStep contact={contact} sent={state.channels} onSend={onSend} />;
      case "phone":    return <PhoneAttemptsStep calls={state.calls} notReached={state.notReached} onLog={onLogCall} />;
      case "schedule": return <ScheduleStep reschedules={state.reschedules} onOpenModal={() => setScheduleModalOpen(true)} />;
      case "apptOutcome": return <OutcomeStep stepKey="apptOutcome" prompt={OUTCOME_PROMPT.apptOutcome} onComplete={onApptOutcome} />;
      case "bizOutcome":  return <OutcomeStep stepKey="bizOutcome" prompt={OUTCOME_PROMPT.bizOutcome} onComplete={onBizOutcome} />;
      case "finish":   return <FinishStep done={state.finished} onComplete={onFinish} />;
      default:         return null;
    }
  };

  // When Not Reached the flow has ended, so the later steps are no longer pending.
  const future    = state.notReached ? [] : STEPS.slice(current + 1).reverse();
  const completed = STEPS.slice(0, current).reverse();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontSize: 12.5, color: C.muted, marginBottom: 2 }}>
        Steps run from bottom to top — completed steps collapse below, the current step stays closest to you.
      </div>

      {future.map(s => <LockedStep key={s.key} title={s.title} />)}

      <CurrentStepShell index={current} title={currentStep.title}>
        {renderCurrentBody(currentStep)}
        {/* Lead → Contact conversion — available from the appointment stage onward
            and whenever the lead is Not Reached. */}
        {showConvert && (
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: C.navy }}>Lead status</div>
              <div style={{ fontSize: 11.5, color: C.muted }}>{state.isContact ? "This lead has been converted to a contact." : "Convert this lead into a contact once it's qualified."}</div>
            </div>
            {state.isContact
              ? <span style={{ fontSize: 12, fontWeight: 700, color: C.green, background: C.green + "14", padding: "6px 12px", borderRadius: 20, whiteSpace: "nowrap" }}>✓ Contact</span>
              : <button onClick={() => setConvertOpen(true)} style={{ padding: "8px 16px", borderRadius: 9, border: `1.5px solid ${C.primary}`, background: "#fff", color: C.primaryDark, fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit" }}>⇪ Convert to Contact</button>}
          </div>
        )}
      </CurrentStepShell>

      {completed.map((s, i) => (
        <DoneStep key={s.key} title={s.title} summary={state.summaries[s.key]} editable={i === 0} onReopen={() => reopen(IDX[s.key])} />
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
            onSchedule({ type: data.apptType, date: data.date, time: data.time });
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
