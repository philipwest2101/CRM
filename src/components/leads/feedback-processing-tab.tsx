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
//   1 Send Initial Message  →  2 Call Attempts  →  3 Call Outcome
//   →  4 Appointment Outcome  →  5 Finalize Process
//
// · Call attempts are capped at 5; the 5th failed attempt sends the lead to
//   Finalize as "Not Reached".
// · Call Outcome: Appointment Scheduled, Not Interested, Currently Not
//   Interested, Difficult Case. "Appointment Scheduled" opens the scheduling
//   modal ("Schedule & Continue"); the negative outcomes skip to Finalize.
// · Appointment Outcome: Qualified, Reschedule, Attending Event, Not Interested,
//   Currently Not Interested, Difficult Case. "Reschedule" re-opens scheduling.
// · Negative outcomes enable a persistent Do-Not-Contact toggle in Finalize.
// · Conversion happens in Finalize: "Add to My Network" opens the Convert Lead
//   modal (Network Status: Customer / Prospect / Partner).
// ─────────────────────────────────────────────────────────────────────────────

export const STEPS = [
  { key: "initial",     title: "Send Initial Message" },
  { key: "phone",       title: "Call Attempts" },
  { key: "outcome",     title: "Call Outcome" },
  { key: "appointment", title: "Appointment Outcome" },
  { key: "finish",      title: "Finalize Process" },
];
const IDX = Object.fromEntries(STEPS.map((s, i) => [s.key, i]));
const stepNo = (key) => IDX[key] + 1;

// Negative outcomes that end processing and enable the Do-Not-Contact toggle.
const NEGATIVE = new Set(["notinterested", "currentlynot", "difficult"]);

// A lead may be called at most 5 times; after that it is marked "Not Reached".
const MAX_CALL_ATTEMPTS = 5;

// Short label shown as the "Feedback & Processing status" elsewhere.
export const FEEDBACK_STEP_LABEL = {
  initial:     "Initial Message",
  phone:       "Call Attempts",
  outcome:     "Call Outcome",
  appointment: "Appointment",
  finish:      "Finalized",
};

const CHANNELS = [
  { key: "sms",      label: "SMS",      button: "Copy & Send as SMS" },
  { key: "whatsapp", label: "WhatsApp", button: "Copy & Send on WhatsApp" },
  { key: "email",    label: "Email",    button: "Copy & Send on Email" },
];
const channelLabel = (k) => CHANNELS.find(c => c.key === k)?.label || k;

const NETWORK_STATUSES = ["Customer", "Prospect", "Partner"];

// ── time / seed helpers ───────────────────────────────────────────────────────
const nowTime = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
const today   = () => new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

// Map a lead's mock status → the step it should open on.
const STATUS_STEP = {
  open: 0, in_progress: 1, attempted: 1, not_reached: 4,
  followup: 2, appointment: 3, closed: 4, no_interest: 4, dnc: 4,
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
  const doneSteps = notReached ? ["initial", "phone"]
    : negative ? ["initial", "phone", "outcome"]
    : STEPS.slice(0, current).map(s => s.key);
  const log = [{ text: "Lead assigned → status set to New", time: "12:58:29 PM" }];
  if (current > 0) log.push({ text: "Send Initial Message → Sent via SMS", time: "12:59:05 PM" });
  return {
    current, finished, isContact, channels, calls,
    reached: current >= IDX.outcome && !notReached,
    notReached,
    contactOutcome: null, apptOutcome: null,
    negativeOutcome: negative, dnc: status === "dnc",
    networkStatus: alreadyContact ? "Customer" : null,
    appointment: current >= IDX.appointment && !notReached ? { type: "Consultation Appointment", date: "—", time: "—" } : null,
    reschedules: 0,
    doneSteps,
    summaries: {},
    lastAction: current > 0 ? { icon: "✉️", label: "Initial message sent", date: today() } : null,
    log,
  };
};

// Derived one-liner for the current stage (used by Overview).
export const feedbackDetail = (s) => {
  const msgs = (s.channels.sms || 0) + (s.channels.whatsapp || 0) + (s.channels.email || 0);
  const step = STEPS[s.current]?.key;
  if (s.notReached) return `Not reached (${s.calls}/${MAX_CALL_ATTEMPTS})`;
  if (s.finished)   return s.apptOutcome || s.contactOutcome || "Processed";
  if (step === "initial")     return `${msgs} message${msgs !== 1 ? "s" : ""} sent`;
  if (step === "phone")       return `${s.calls} call${s.calls !== 1 ? "s" : ""}${s.reached ? " · reached" : ""}`;
  if (step === "outcome")     return "Recording outcome";
  if (step === "appointment") return s.reschedules ? `Re-scheduling (×${s.reschedules})` : "Awaiting appointment result";
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
const GhostBtn = ({ children, onClick, icon }: any) => (
  <button onClick={onClick} style={{
    display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 9,
    border: `1px solid ${C.border}`, background: "#fff", color: C.slate, fontSize: 13, fontWeight: 600,
    cursor: "pointer", fontFamily: "inherit",
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

// Only the most recently completed step is editable — reopening it discards the
// uncommitted current step; older steps stay locked so a branch can't be orphaned.
const DoneStep = ({ num, title, summary, editable, onReopen }) => (
  <div style={{ ...card, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12, background: C.green + "08", borderColor: C.green + "40" }}>
    <StepDot n={num} bg={C.green} color="#fff" />
    <div style={{ flex: 1, minWidth: 0 }}>
      <span style={{ fontSize: 14, fontWeight: 600, color: C.navy }}>{title}</span>
      {summary && <span style={{ fontSize: 12.5, color: C.slate, marginLeft: 8 }}>· {summary}</span>}
    </div>
    <span style={{ color: C.green, fontSize: 13 }}>✓</span>
    {editable
      ? <button onClick={onReopen} title="Reopen this step to correct it" style={{ background: "none", border: "none", cursor: "pointer", color: C.slate, fontSize: 12, fontWeight: 600 }}>Edit</button>
      : <span title="Only the latest completed step can be edited" style={{ color: C.muted, fontSize: 12 }}>🔒</span>}
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

// ── Convert Lead modal ────────────────────────────────────────────────────────
const ConvertLeadModal = ({ contact, onCancel, onApply }) => {
  const [status, setStatus] = useState("");
  return (
    <>
      <div onClick={onCancel} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", zIndex: 600 }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 440, maxWidth: "92vw", background: "#fff", borderRadius: 16, zIndex: 700, boxShadow: "0 24px 64px rgba(0,0,0,0.22)", padding: "22px 24px", fontFamily: "inherit" }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: C.navy, marginBottom: 8 }}>Convert Lead</div>
        <div style={{ fontSize: 13, color: C.slate, marginBottom: 18, lineHeight: 1.5 }}>Move the lead to My Network list; organizational reporting remains unchanged.</div>
        <label style={{ fontSize: 12, fontWeight: 600, color: C.navy, display: "block", marginBottom: 6 }}>Network Status *</label>
        <select value={status} onChange={e => setStatus(e.target.value)} style={{ ...fieldStyle, color: status ? C.text : C.muted, marginBottom: 22 }}>
          <option value="">Select status…</option>
          {NETWORK_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <button onClick={onCancel} style={{ padding: "9px 20px", borderRadius: 9, border: "none", background: "transparent", color: C.slate, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
          <button disabled={!status} onClick={() => onApply(status)} style={{ padding: "9px 26px", borderRadius: 9, border: "none", background: status ? C.navy : C.border, color: status ? "#fff" : C.muted, fontSize: 13, fontWeight: 700, cursor: status ? "pointer" : "default" }}>Apply</button>
        </div>
      </div>
    </>
  );
};

// Labelled on/off switch (used for the Do-Not-Contact flag).
const Toggle = ({ on, onChange, danger = false }) => (
  <button role="switch" aria-checked={on} onClick={onChange} style={{
    position: "relative", width: 42, height: 24, borderRadius: 20, border: "none", cursor: "pointer", flexShrink: 0,
    background: on ? (danger ? C.red : C.green) : C.border, transition: "background .15s", padding: 0,
  }}>
    <span style={{ position: "absolute", top: 3, left: on ? 21 : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left .15s", boxShadow: "0 1px 3px rgba(0,0,0,0.25)" }} />
  </button>
);

// "Create a Task" — opens the shared task modal (callback reminders etc.).
const CreateTaskBtn = ({ onClick }) => (
  <button onClick={onClick} style={{
    display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 8,
    border: `1px solid ${C.border}`, background: "#fff", color: C.slate, fontSize: 12.5, fontWeight: 600,
    cursor: "pointer", fontFamily: "inherit",
  }}>☑️ Create a Task</button>
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

const SendInitialMessageStep = ({ contact, onSend }) => {
  const [channel, setChannel] = useState("sms");
  const [copied, setCopied] = useState("");
  const first = (contact?.name || "there").replace(/^(Ms|Mr|Mrs|Dr)\.?\s+/i, "").split(" ")[0];
  const advisor = contact?.assignee || "your advisor";
  const template = (CHANNEL_TEMPLATE[channel] || "").replace(/{first}/g, first).replace(/{advisor}/g, advisor);
  const pick = (k) => { setChannel(k); setCopied(k); setTimeout(() => setCopied(""), 1500); };
  return (
    <>
      <div style={{ fontSize: 13, color: C.slate, marginBottom: 14 }}>Send the prepared introductory message to establish the first contact with the lead.</div>
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        {CHANNELS.map(ch => {
          const on = channel === ch.key;
          return (
            <button key={ch.key} onClick={() => pick(ch.key)} style={{
              display: "inline-flex", alignItems: "center", gap: 7, padding: "8px 14px", borderRadius: 9,
              border: `1.5px solid ${on ? C.navy : C.border}`, background: on ? C.navy + "0D" : "#fff",
              color: on ? C.navy : C.slate, fontSize: 12.5, fontWeight: on ? 700 : 500, cursor: "pointer", fontFamily: "inherit",
            }}>{copied === ch.key ? "✓ Copied" : ch.button}</button>
          );
        })}
      </div>
      <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, background: C.light, padding: "14px 16px", marginBottom: 18 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: C.muted, marginBottom: 8 }}>Message Template</div>
        <div style={{ fontSize: 13, color: C.text, lineHeight: 1.55, whiteSpace: "pre-wrap" }}>{template}</div>
      </div>
      <PrimaryBtn icon="✓" onClick={() => onSend(channel)}>Mark as Sent &amp; Continue</PrimaryBtn>
    </>
  );
};

const CALL_RESULTS = [
  { v: "notreached", label: "Not Reached", tone: C.red },
  { v: "reached",    label: "Reached",     tone: C.green },
];
// Select the result of a call attempt (correctable), then Save & Continue.
const CallAttemptsStep = ({ calls, notReached, onLog, onCreateTask }) => {
  const [sel, setSel] = useState("");
  return (
    <>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
        <div style={{ fontSize: 13, color: C.slate }}>Make a call attempt (max {MAX_CALL_ATTEMPTS}), pick the result and press <b>Save &amp; Continue</b>.</div>
        <CreateTaskBtn onClick={onCreateTask} />
      </div>
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
          <PrimaryBtn icon="✓" disabled={!sel} onClick={() => onLog(sel === "reached")}>Save &amp; Continue</PrimaryBtn>
        </>
      )}
    </>
  );
};

// Call Outcome (after the contact is reached).
const CALL_OUTCOMES = [
  { v: "appointment",  label: "Appointment Scheduled",    tone: C.green },
  { v: "notinterested",label: "Not Interested",           tone: C.red },
  { v: "currentlynot", label: "Currently Not Interested", tone: C.amber },
  { v: "difficult",    label: "Difficult Case",           tone: C.slate },
];
const CallOutcomeStep = ({ onComplete }) => {
  const [choice, setChoice] = useState("");
  const [note, setNote] = useState("");
  const sel = CALL_OUTCOMES.find(o => o.v === choice);
  const isAppt = choice === "appointment";
  return (
    <>
      <div style={{ fontSize: 13, color: C.slate, marginBottom: 14 }}>The contact was reached. Select the outcome of the conversation to continue processing the lead.</div>
      <OptionChips options={CALL_OUTCOMES} value={choice} onChange={setChoice} />
      {sel && NEGATIVE.has(choice) && (
        <div style={{ fontSize: 12, color: C.amber, fontWeight: 600, marginBottom: 12 }}>↩ Ends processing — you can set Do Not Contact in Finalize.</div>
      )}
      <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Briefly describe the conversation outcome…"
        style={{ ...fieldStyle, minHeight: 70, resize: "vertical", lineHeight: 1.5, marginBottom: 16 }} />
      <PrimaryBtn icon={isAppt ? "📅" : "✓"} disabled={!sel} onClick={() => sel && onComplete(sel.v, sel.label)}>
        {isAppt ? "Schedule & Continue" : "Save & Continue"}
      </PrimaryBtn>
    </>
  );
};

// Appointment Outcome (flat, single-select).
const APPT_OUTCOMES = [
  { v: "qualified",    label: "Qualified",                tone: C.green },
  { v: "reschedule",   label: "Reschedule",               tone: C.amber },
  { v: "attending",    label: "Attending Event",          tone: C.indigo },
  { v: "notinterested",label: "Not Interested",           tone: C.red },
  { v: "currentlynot", label: "Currently Not Interested", tone: C.amber },
  { v: "difficult",    label: "Difficult Case",           tone: C.slate },
];
const AppointmentOutcomeStep = ({ appointment, onComplete }) => {
  const [choice, setChoice] = useState("");
  const [note, setNote] = useState("");
  const sel = APPT_OUTCOMES.find(o => o.v === choice);
  const hint = choice === "reschedule"
    ? "↩ Re-opens scheduling — you'll re-book a new appointment and stay on this step."
    : NEGATIVE.has(choice) ? "↩ Ends processing — you can set Do Not Contact in Finalize." : null;
  return (
    <>
      {appointment && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 9, background: C.light, border: `1px solid ${C.border}`, marginBottom: 14, fontSize: 12.5, color: C.navy, fontWeight: 600 }}>
          📅 {appointment.type} · {appointment.date} {appointment.time}
        </div>
      )}
      <div style={{ fontSize: 13, color: C.slate, marginBottom: 14 }}>Record the outcome of the scheduled appointment.</div>
      <OptionChips options={APPT_OUTCOMES} value={choice} onChange={setChoice} />
      {hint && <div style={{ fontSize: 12, color: C.amber, fontWeight: 600, marginBottom: 12 }}>{hint}</div>}
      <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Briefly describe the appointment outcome…"
        style={{ ...fieldStyle, minHeight: 70, resize: "vertical", lineHeight: 1.5, marginBottom: 16 }} />
      <PrimaryBtn icon="✓" disabled={!sel} onClick={() => sel && onComplete(sel.v, sel.label)}>Save &amp; Continue</PrimaryBtn>
    </>
  );
};

const FinalizeStep = ({ done, negativeOutcome, dnc, isContact, networkStatus, onToggleDnc, onProcess, onAddToNetwork, onBackToDashboard }) => (
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
      <>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "2px 0 16px" }}>
          <span style={{ width: 34, height: 34, borderRadius: "50%", background: C.green, display: "grid", placeItems: "center", fontSize: 16, color: "#fff", flexShrink: 0 }}>✓</span>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.navy }}>Lead Ready (Processed)</div>
            <div style={{ fontSize: 12.5, color: C.slate, marginTop: 2 }}>Feedback has been fed into the campaign statistics.{dnc ? " Marked Do Not Contact." : ""}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <GhostBtn icon="←" onClick={onBackToDashboard}>Back to Dashboard</GhostBtn>
          {isContact
            ? <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: C.green, background: C.green + "14", padding: "9px 14px", borderRadius: 9, whiteSpace: "nowrap" }}>✓ In My Network · {networkStatus}</span>
            : <PrimaryBtn icon="⇪" onClick={onAddToNetwork}>Add to My Network</PrimaryBtn>}
        </div>
      </>
    ) : (
      <>
        <div style={{ fontSize: 13, color: C.slate, marginBottom: 16 }}>Mark the lead as fully processed. Your feedback feeds into the campaign statistics.</div>
        <PrimaryBtn icon="🏁" onClick={onProcess}>Mark lead as processed</PrimaryBtn>
      </>
    )}
  </>
);

// ── Main tab (controlled) ─────────────────────────────────────────────────────
export const FeedbackProcessingTab = ({ contact, state, setState, role, navigateTo, onCreateTask }) => {
  const current = state.current;
  const currentStep = STEPS[current];
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);

  const pushLog = (prev, text) => [...prev.log, { text, time: nowTime() }];
  const withDone = (prev, key) => prev.doneSteps.includes(key) ? prev.doneSteps : [...prev.doneSteps, key];

  const onSend = (channel) => setState(prev => {
    const ch = { ...prev.channels }; ch[channel] = (ch[channel] || 0) + 1;
    return {
      ...prev, channels: ch, current: IDX.phone, doneSteps: withDone(prev, "initial"),
      summaries: { ...prev.summaries, initial: "Initial message sent" },
      lastAction: { icon: "✉️", label: `Initial message · ${channelLabel(channel)}`, date: today() },
      log: pushLog(prev, `Send Initial Message → Sent via ${channelLabel(channel)}`),
    };
  });

  const onLogCall = (reached) => setState(prev => {
    if (prev.notReached) return prev;
    const calls = Math.min(prev.calls + 1, MAX_CALL_ATTEMPTS);
    if (reached) {
      return {
        ...prev, calls, reached: true, current: IDX.outcome, doneSteps: withDone(prev, "phone"),
        summaries: { ...prev.summaries, phone: `Reached after ${calls} call attempt${calls !== 1 ? "s" : ""}` },
        lastAction: { icon: "📞", label: "Reached by phone", date: today() },
        log: pushLog(prev, `Call Attempts → Reached after ${calls} call attempt${calls !== 1 ? "s" : ""}`),
      };
    }
    const exhausted = calls >= MAX_CALL_ATTEMPTS;
    if (exhausted) {
      return {
        ...prev, calls, notReached: true, current: IDX.finish, doneSteps: withDone(prev, "phone"),
        summaries: { ...prev.summaries, phone: `Not reached after ${calls} call attempts` },
        lastAction: { icon: "🚫", label: `Not reached (max ${MAX_CALL_ATTEMPTS} attempts)`, date: today() },
        log: pushLog(prev, `Call Attempts → Not reached after ${calls} call attempts · sent to Finalize`),
      };
    }
    return {
      ...prev, calls,
      summaries: { ...prev.summaries, phone: `Not reached after ${calls} call attempt${calls !== 1 ? "s" : ""}` },
      lastAction: { icon: "📞", label: "Call attempt — not reached", date: today() },
      log: pushLog(prev, `Call Attempts → Not reached after ${calls} call attempt${calls !== 1 ? "s" : ""}`),
    };
  });

  const onCallOutcome = (v, label) => {
    if (v === "appointment") {
      // "Schedule & Continue" — open the scheduling modal; advance on submit.
      setState(prev => ({
        ...prev, contactOutcome: label,
        lastAction: { icon: "📅", label: `Call outcome: ${label}`, date: today() },
        log: pushLog(prev, `Call Outcome → ${label}`),
      }));
      setScheduleModalOpen(true);
      return;
    }
    // Negative outcome → skip to Finalize.
    setState(prev => ({
      ...prev, contactOutcome: label, negativeOutcome: true, current: IDX.finish, doneSteps: withDone(prev, "outcome"),
      summaries: { ...prev.summaries, outcome: label },
      lastAction: { icon: "🏁", label: `Call outcome: ${label}`, date: today() },
      log: pushLog(prev, `Call Outcome → ${label} · sent to Finalize`),
    }));
  };

  // From Call Outcome (Appointment Scheduled) → book and advance to Appointment Outcome.
  const onScheduleFromOutcome = (appt) => setState(prev => ({
    ...prev, appointment: appt, current: IDX.appointment, doneSteps: withDone(prev, "outcome"),
    summaries: { ...prev.summaries, outcome: prev.contactOutcome || "Appointment Scheduled" },
    lastAction: { icon: "📅", label: `Appointment booked · ${appt.date} ${appt.time}`, date: today() },
    log: pushLog(prev, `Appointment Scheduled → ${appt.type} · ${appt.date} ${appt.time}`),
  }));

  // Re-book from within Appointment Outcome (reschedule) — keeps the current step.
  const onRebook = (appt) => setState(prev => ({
    ...prev, appointment: appt,
    lastAction: { icon: "📅", label: `Re-booked · ${appt.date} ${appt.time}`, date: today() },
    log: pushLog(prev, `Appointment Scheduled → Re-booked · ${appt.type} · ${appt.date} ${appt.time}`),
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

  const onProcess = () => setState(prev => ({
    ...prev, finished: true,
    lastAction: { icon: "🏁", label: "Lead processed", date: today() },
    log: pushLog(prev, `Finalize Process → Processed${prev.dnc ? " · Do Not Contact" : ""}`),
  }));

  const onApplyConvert = (status) => setState(prev => ({
    ...prev, isContact: true, networkStatus: status,
    lastAction: { icon: "⇪", label: `Added to My Network · ${status}`, date: today() },
    log: pushLog(prev, `Convert Lead → Added to My Network as ${status}`),
  }));

  // Reopen the most-recently-completed step for correction. The current step is
  // uncommitted, so nothing downstream is orphaned — we just clear the flags this
  // step (and later) produced and re-enter it, appending an audit line.
  const reopen = (stepKey) => setState(prev => {
    const idx = IDX[stepKey];
    const patch: any = {
      ...prev,
      current: idx,
      doneSteps: prev.doneSteps.filter(k => IDX[k] < idx),
      finished: false,
    };
    if (idx <= IDX.phone)       { patch.reached = false; patch.notReached = false; patch.calls = Math.max(0, prev.calls - 1); }
    if (idx <= IDX.outcome)     { patch.contactOutcome = null; patch.appointment = null; }
    if (idx <= IDX.appointment) { patch.apptOutcome = null; patch.negativeOutcome = false; patch.dnc = false; }
    patch.lastAction = { icon: "↩", label: `Reopened "${STEPS[idx].title}"`, date: today() };
    patch.log = pushLog(prev, `↩ Reopened "${STEPS[idx].title}" for correction`);
    return patch;
  });

  const renderCurrentBody = (step) => {
    switch (step.key) {
      case "initial":     return <SendInitialMessageStep contact={contact} onSend={onSend} />;
      case "phone":       return <CallAttemptsStep key={`ph-${state.calls}`} calls={state.calls} notReached={state.notReached} onLog={onLogCall} onCreateTask={onCreateTask} />;
      case "outcome":     return <CallOutcomeStep onComplete={onCallOutcome} />;
      case "appointment": return <AppointmentOutcomeStep key={`ao-${state.reschedules}`} appointment={state.appointment} onComplete={onAppointmentOutcome} />;
      case "finish":      return <FinalizeStep done={state.finished} negativeOutcome={state.negativeOutcome} dnc={state.dnc} isContact={state.isContact} networkStatus={state.networkStatus} onToggleDnc={onToggleDnc} onProcess={onProcess} onAddToNetwork={() => setConvertOpen(true)} onBackToDashboard={() => navigateTo && navigateTo("Dashboard")} />;
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
      </CurrentStepShell>

      {completed.map((s, i) => (
        <DoneStep key={s.key} num={stepNo(s.key)} title={s.title} summary={state.summaries[s.key]}
          editable={i === 0} onReopen={() => reopen(s.key)} />
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
            // From Call Outcome → advance to Appointment Outcome; from Appointment Outcome → re-book.
            if (current === IDX.outcome) onScheduleFromOutcome(appt); else onRebook(appt);
            setScheduleModalOpen(false);
          }}
        />
      )}

      {convertOpen && (
        <ConvertLeadModal
          contact={contact}
          onCancel={() => setConvertOpen(false)}
          onApply={(status) => { onApplyConvert(status); setConvertOpen(false); }}
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
