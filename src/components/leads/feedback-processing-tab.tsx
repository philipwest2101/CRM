import React, { useState } from "react";
import { C } from "../../theme";
import { AppointmentModal } from "../appointments/appointment-modal";
import { LOST_REASONS, FOLLOWUP_REASONS, NETWORK_OUTCOMES } from "../../lib/core";

// ─────────────────────────────────────────────────────────────────────────────
// FEEDBACK & PROCESSING TAB  (controlled)
// A guided, top-to-bottom stepper that walks an advisor through everything that
// happens to a lead — from the first outreach to the final processing outcome.
// Completed steps stay at the top; the current step follows below them, and the
// remaining (locked) steps sit underneath.
//
// Flow:
//   1 Send Initial Message  →  2 Call Attempts  →  3 Call Outcome
//   →  4 Appointment Outcome  →  5 Finalize Process
//
// · Send Initial Message is optional — advisors who prefer to call directly can
//   skip it and go straight to Call Attempts.
// · Call attempts are capped at 5; the 5th failed attempt sends the lead to
//   Finalize as "Not Reached". Advisors are not forced to use all 5 — if a lead is
//   unreachable, a ready-made "missed call" message can be copied.
// · From Call Attempts onward every step offers a "Finalize now" shortcut, so an
//   advisor can proceed to Finalize at any point (whether or not the lead was
//   reached) without completing the remaining steps.
// · Call Outcome (spec-aligned): Appointment Scheduled, Qualified, Follow Up
//   (later — requires a date + reason), Not Interested, No Suitable Solution
//   (Closed / Lost — requires a Lost Reason), Other. "Appointment Scheduled"
//   opens the scheduling modal; the other outcomes skip to Finalize.
// · Appointment Outcome (spec-aligned): a completed appointment resolves to
//   exactly one of Qualified, Follow Up (later), Not Interested, or No Suitable
//   Solution (Closed / Lost). Reschedule / No Show keep the lead in Appointment
//   and re-open scheduling. An optional note captures details.
// · Negative outcomes (Not Interested, No Suitable Solution) enable a persistent
//   Do-Not-Contact toggle in Finalize.
// · Conversion happens in Finalize: "Add to My Network" opens the Convert Lead
//   modal, where the Outcome is any combination of Customer / Partner (both may
//   apply; none = a plain Network contact).
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

// Negative closing outcomes that end processing and enable the Do-Not-Contact
// toggle. Per the spec, "Currently Not Interested" is dropped (it's a Follow Up)
// and "Difficult Case" is replaced by "No Suitable Solution" → Closed / Lost.
const NEGATIVE = new Set(["notinterested", "lost"]);
// Outcomes that require a structured Lost Reason before continuing.
const NEEDS_LOST_REASON = new Set(["lost"]);

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

// SMS and WhatsApp share one identical template, so they are offered as a single
// "SMS / WhatsApp" channel. Email keeps its own (longer) template.
const CHANNELS = [
  { key: "text",  label: "SMS / WhatsApp", button: "Copy for SMS / WhatsApp" },
  { key: "email", label: "Email",          button: "Copy & Send on Email" },
];
const channelLabel = (k) => CHANNELS.find(c => c.key === k)?.label || k;


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
  const channels = { text: current > 0 ? 1 : 0, email: 0 };
  const doneSteps = notReached ? ["initial", "phone"]
    : negative ? ["initial", "phone", "outcome"]
    : STEPS.slice(0, current).map(s => s.key);
  const log = [{ text: "Lead assigned → status set to New", time: "12:58:29 PM" }];
  if (current > 0) log.push({ text: "Send Initial Message → Sent via SMS / WhatsApp", time: "12:59:05 PM" });
  return {
    current, finished, isContact, channels, calls,
    reached: current >= IDX.outcome && !notReached,
    notReached,
    contactOutcome: null, apptOutcome: null, contactNote: null, apptNote: null,
    negativeOutcome: negative, dnc: status === "dnc",
    // Spec §7 properties captured during processing.
    nextAction: null, nextActionDue: null, lostReason: null,
    followUpDate: null, followUpReason: null, outcome: null,
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
  const msgs = (s.channels.text || 0) + (s.channels.email || 0);
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
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 20px", borderBottom: `1px solid ${C.border}` }}>
      <StepDot n={num} bg={C.navy} color="#fff" />
      <span style={{ fontSize: 16, fontWeight: 700, color: C.navy }}>{title}</span>
    </div>
    <div style={{ padding: "18px 20px" }}>{children}</div>
  </div>
);

// ── Convert Lead modal ────────────────────────────────────────────────────────
// Conversion sets Lifecycle = Network. A Network member has no "stage status" —
// instead it carries an Outcome: any combination of Customer / Partner (both may
// apply, per spec §5 rows 9–11). Selecting neither is allowed — the person is
// then just a Network contact. Ownership is UNCHANGED and the contact's
// information, activities and history are preserved.
const OutcomeCheck = ({ label, on, tone, onToggle }) => (
  <button onClick={onToggle} style={{
    display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", borderRadius: 10, width: "100%",
    border: `1.5px solid ${on ? tone : C.border}`, background: on ? tone + "10" : "#fff", cursor: "pointer",
    fontFamily: "inherit", textAlign: "left" as const, marginBottom: 10,
  }}>
    <span style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${on ? tone : C.border}`, background: on ? tone : "#fff", display: "grid", placeItems: "center", fontSize: 11, color: "#fff", flexShrink: 0 }}>{on ? "✓" : ""}</span>
    <span style={{ fontSize: 13.5, fontWeight: on ? 700 : 500, color: on ? tone : C.slate }}>{label}</span>
  </button>
);
const ConvertLeadModal = ({ contact, onCancel, onApply }) => {
  const [outcome, setOutcome] = useState<string[]>([]);   // subset of NETWORK_OUTCOMES
  const toggle = (v) => setOutcome(o => o.includes(v) ? o.filter(x => x !== v) : [...o, v]);
  const tone = (v) => (v === "Customer" ? C.green : C.indigo);
  const summary = outcome.length === 2 ? "Customer + Partner" : outcome[0] || "Contact (no outcome yet)";
  return (
    <>
      <div onClick={onCancel} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", zIndex: 600 }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 440, maxWidth: "92vw", background: "#fff", borderRadius: 16, zIndex: 700, boxShadow: "0 24px 64px rgba(0,0,0,0.22)", padding: "22px 24px", fontFamily: "inherit" }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: C.navy, marginBottom: 8 }}>Convert Lead → Network</div>
        <div style={{ fontSize: 13, color: C.slate, marginBottom: 18, lineHeight: 1.5 }}>
          Move <b>{contact?.name || "this lead"}</b> to your Network. Ownership stays unchanged and all contact
          information, activities and history are preserved. This cannot be reversed — a Network cannot be converted back to a Lead.
        </div>
        <label style={{ fontSize: 12, fontWeight: 600, color: C.navy, display: "block", marginBottom: 8 }}>Outcome — the person may be both</label>
        {NETWORK_OUTCOMES.map(v => <OutcomeCheck key={v} label={v} on={outcome.includes(v)} tone={tone(v)} onToggle={() => toggle(v)} />)}
        <div style={{ fontSize: 11.5, color: C.muted, margin: "2px 0 20px" }}>Will be added to your Network as: <b style={{ color: C.slate }}>{summary}</b></div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <button onClick={onCancel} style={{ padding: "9px 20px", borderRadius: 9, border: "none", background: "transparent", color: C.slate, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
          <button onClick={() => onApply(outcome)} style={{ padding: "9px 26px", borderRadius: 9, border: "none", background: C.navy, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Convert</button>
        </div>
      </div>
    </>
  );
};

// Confirmation dialog (used before a reopen discards later steps).
const ConfirmDialog = ({ title, message, confirmLabel, danger = false, onCancel, onConfirm }) => (
  <>
    <div onClick={onCancel} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", zIndex: 600 }} />
    <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 440, maxWidth: "92vw", background: "#fff", borderRadius: 16, zIndex: 700, boxShadow: "0 24px 64px rgba(0,0,0,0.22)", padding: "22px 24px", fontFamily: "inherit" }}>
      <div style={{ fontSize: 17, fontWeight: 700, color: C.navy, marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 13, color: C.slate, marginBottom: 22, lineHeight: 1.5 }}>{message}</div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
        <button onClick={onCancel} style={{ padding: "9px 20px", borderRadius: 9, border: "none", background: "transparent", color: C.slate, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
        <button onClick={onConfirm} style={{ padding: "9px 22px", borderRadius: 9, border: "none", background: danger ? C.red : C.navy, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>{confirmLabel}</button>
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
// One shared introductory message, personalised with the lead's first name, the
// advisor's full name and the lead's preferred contact time. It is used both for
// the SMS / WhatsApp copy and as the Email body prefill.
const INITIAL_TEMPLATE =
  "Hello {lead_first_name}, thanks for your interest in financing with vionworld! I am {user_full_name}, your personal advisor, and will get in touch shortly; preferably {lead_preferred_time}. Best regards, {user_full_name}";
const INITIAL_SUBJECT = "Your financing consultation with vionworld";

// Ready-made message an advisor can send after failing to reach a lead by phone.
const MISSED_CALL_TEMPLATE =
  "Hi {first}, this is {advisor} from vionworld. I tried to call you but couldn't reach you. I'll try again tomorrow — or feel free to reply with a time that suits you best.";
const MISSED_CALL_SUBJECT = "I tried to reach you — vionworld";

const SendInitialMessageStep = ({ contact, emailSent, onSend, onSkip, onSendEmail }) => {
  const [channel, setChannel] = useState("text");   // channel of the last action taken
  const [copied, setCopied] = useState(false);
  const first = (contact?.name || "there").replace(/^(Ms|Mr|Mrs|Dr)\.?\s+/i, "").split(" ")[0];
  const advisor = contact?.assignee || "your advisor";
  const preferredTime = contact?.preferredTime || "evening (5–7 pm)";
  const template = INITIAL_TEMPLATE
    .replace(/{lead_first_name}/g, first)
    .replace(/{user_full_name}/g, advisor)
    .replace(/{lead_preferred_time}/g, preferredTime);
  // SMS / WhatsApp → copy the text. Email → open the email modal prefilled.
  const copyText = () => { try { navigator?.clipboard?.writeText?.(template); } catch {} setChannel("text"); setCopied(true); };
  const openEmail = () => { setChannel("email"); setCopied(false); onSendEmail && onSendEmail({ subject: INITIAL_SUBJECT, body: template }); };
  const badge = copied ? "Copied" : (emailSent ? "Email sent" : null);
  const chBtn = (key, label, onClick) => {
    const on = channel === key;
    return (
      <button onClick={onClick} style={{
        display: "inline-flex", alignItems: "center", gap: 7, padding: "8px 14px", borderRadius: 9,
        border: `1.5px solid ${on ? C.navy : C.border}`, background: on ? C.navy + "0D" : "#fff",
        color: on ? C.navy : C.slate, fontSize: 12.5, fontWeight: on ? 700 : 500, cursor: "pointer", fontFamily: "inherit",
      }}>{label}</button>
    );
  };
  return (
    <>
      <div style={{ fontSize: 13, color: C.slate, marginBottom: 14 }}>Send the prepared introductory message to establish the first contact with the lead.</div>
      <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, background: C.light, padding: "14px 16px", marginBottom: 18 }}>
        <div style={{ fontSize: 13, color: C.text, lineHeight: 1.55, whiteSpace: "pre-wrap" }}>{template}</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        {chBtn("text", "Copy for SMS / WhatsApp", copyText)}
        {chBtn("email", "Copy & Send via Email", openEmail)}
        {badge && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700, color: "#fff", background: C.green, padding: "7px 12px", borderRadius: 8 }}>✓ {badge}</span>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <PrimaryBtn icon="✓" onClick={() => onSend(channel)}>Mark as Sent &amp; Continue</PrimaryBtn>
        <GhostBtn icon="⏭" onClick={onSkip}>Skip &amp; Continue</GhostBtn>
      </div>
    </>
  );
};

const CALL_RESULTS = [
  { v: "notreached", label: "Not Reached", tone: C.red },
  { v: "reached",    label: "Reached",     tone: C.green },
];
// Select the result of a call attempt (correctable), then Save & Continue.
const CallAttemptsStep = ({ contact, calls, notReached, onLog, onFinalizeNow, onCreateTask, onSendEmail }) => {
  const [sel, setSel] = useState("");
  // Finalize is offered once the advisor has logged an attempt or picked a
  // result (reached or not) — they need never exhaust all attempts.
  const canFinalize = calls >= 1 || !!sel;
  const [copied, setCopied] = useState(false);
  const first = (contact?.name || "there").replace(/^(Ms|Mr|Mrs|Dr)\.?\s+/i, "").split(" ")[0];
  const advisor = contact?.assignee || "your advisor";
  const missedCall = MISSED_CALL_TEMPLATE.replace(/{first}/g, first).replace(/{advisor}/g, advisor);
  const copyMissed = () => { try { navigator?.clipboard?.writeText?.(missedCall); } catch {} setCopied(true); setTimeout(() => setCopied(false), 1500); };
  const emailMissed = () => { try { navigator?.clipboard?.writeText?.(missedCall); } catch {} onSendEmail && onSendEmail({ subject: MISSED_CALL_SUBJECT, body: missedCall }); };
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
      {notReached && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", border: `1px solid ${C.amber}55`, background: C.amber + "0F", borderRadius: 10, flexWrap: "wrap" }}>
          <span style={{ fontSize: 18 }}>💡</span>
          <div style={{ flex: 1, minWidth: 180, fontSize: 12.5, color: C.text, lineHeight: 1.45 }}>
            This lead couldn't be reached. Use <b>Create a Task</b> above to schedule a follow-up so it isn't lost — then finalize the process below.
          </div>
        </div>
      )}
      {!notReached && (
        <>
          {/* Couldn't reach the lead? Copy a ready-made "missed call" message. */}
          <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, background: C.light, padding: "12px 14px", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: C.muted }}>Missed-call message</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <button onClick={copyMissed} style={{
                  display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8,
                  border: `1px solid ${C.border}`, background: "#fff", color: copied ? C.green : C.slate,
                  fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                }}>{copied ? "✓ Copied" : "📋 Copy for SMS / WhatsApp"}</button>
                <button onClick={emailMissed} style={{
                  display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8,
                  border: `1px solid ${C.border}`, background: "#fff", color: C.slate,
                  fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                }}>✉️ Copy &amp; Send via Email</button>
              </div>
            </div>
            <div style={{ fontSize: 12.5, color: C.text, lineHeight: 1.5 }}>{missedCall}</div>
          </div>
          <OptionChips options={CALL_RESULTS} value={sel} onChange={setSel} />
          {sel === "notreached" && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", border: `1px solid ${C.amber}55`, background: C.amber + "0F", borderRadius: 10, marginBottom: 14, flexWrap: "wrap" }}>
              <span style={{ fontSize: 18 }}>💡</span>
              <div style={{ flex: 1, minWidth: 180, fontSize: 12.5, color: C.text, lineHeight: 1.45 }}>
                Couldn't reach the lead? Use <b>Create a Task</b> above to schedule a follow-up (e.g. a callback reminder) so this lead isn't forgotten.
              </div>
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <PrimaryBtn icon="✓" disabled={!sel} onClick={() => onLog(sel === "reached")}>Save &amp; Continue</PrimaryBtn>
            {canFinalize && (
              <GhostBtn icon="🏁" onClick={onFinalizeNow}>Finalize Process</GhostBtn>
            )}
          </div>
          {canFinalize && (
            <div style={{ fontSize: 11.5, color: C.muted, marginTop: 10 }}>
              You don't have to use all {MAX_CALL_ATTEMPTS} attempts — you can Finalize Process at any point.
            </div>
          )}
        </>
      )}
    </>
  );
};

// Call Outcome (after the contact is reached). Per the spec, a reached contact
// resolves to one of: schedule an appointment, qualify, pause as a Follow Up
// (with a date), reject (Not Interested), or Closed / Lost when no solution fits.
const CALL_OUTCOMES = [
  { v: "appointment",  label: "Appointment Scheduled", tone: C.green },
  { v: "qualified",    label: "Qualified",             tone: C.green },
  { v: "followup",     label: "Follow Up (later)",     tone: C.purple },
  { v: "notinterested",label: "Not Interested",        tone: C.red },
  { v: "lost",         label: "No Suitable Solution",  tone: C.slate },
  { v: "other",        label: "Other",                 tone: C.slate },
];
// Small labelled <select> used for Lost Reason / Follow-Up Reason / date capture.
const MiniField = ({ label, children }) => (
  <div style={{ marginBottom: 12 }}>
    <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: C.muted, display: "block", marginBottom: 6 }}>{label}</label>
    {children}
  </div>
);
const CallOutcomeStep = ({ appointment, onScheduleAppt, onDeleteAppt, onContinue, onFinalizeNow }) => {
  const [choice, setChoice] = useState("");
  const [note, setNote] = useState("");
  const [lostReason, setLostReason] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpReason, setFollowUpReason] = useState("");
  const sel = CALL_OUTCOMES.find(o => o.v === choice);
  const isAppt = choice === "appointment";
  const isLost = NEEDS_LOST_REASON.has(choice);
  const isFollow = choice === "followup";
  // Picking "Appointment Scheduled" opens the scheduling modal right away; the
  // step then keeps a plain "Continue" that advances once the appointment is booked.
  const pick = (v) => { setChoice(v); if (v === "appointment") onScheduleAppt(); };
  // Follow Up needs a date + reason; Closed / Lost needs a Lost Reason (spec §6, §9).
  const canContinue = !!sel
    && (!isAppt || !!appointment)
    && (!isLost || !!lostReason)
    && (!isFollow || (!!followUpDate && !!followUpReason));
  const extra = () => ({ lostReason: isLost ? lostReason : null, followUpDate: isFollow ? followUpDate : null, followUpReason: isFollow ? followUpReason : null });
  return (
    <>
      <div style={{ fontSize: 13, color: C.slate, marginBottom: 14 }}>The contact was reached (<b>Connected</b>). Select the outcome of the conversation to continue processing the lead.</div>
      <OptionChips options={CALL_OUTCOMES} value={choice} onChange={pick} />
      {isAppt && (appointment
        ? <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 9, background: C.green + "0C", border: `1px solid ${C.green}40`, marginBottom: 14, fontSize: 12.5, color: C.navy, fontWeight: 600 }}>
            📅 {appointment.type} · {appointment.date} {appointment.time}
            <button onClick={onScheduleAppt} style={{ marginLeft: "auto", background: "none", border: "none", color: C.slate, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Change</button>
            <button onClick={() => { onDeleteAppt(); setChoice(""); }} title="Delete this appointment" aria-label="Delete appointment" style={{ background: "none", border: "none", color: C.red, fontSize: 14, cursor: "pointer", fontFamily: "inherit", lineHeight: 1, padding: 0 }}>🗑️</button>
          </div>
        : <div style={{ fontSize: 12, color: C.amber, fontWeight: 600, marginBottom: 12 }}>📅 Book the appointment to continue — reopen the scheduler with “Appointment Scheduled”.</div>)}
      {choice === "qualified" && <div style={{ fontSize: 12, color: C.green, fontWeight: 600, marginBottom: 12 }}>→ Status becomes <b>Qualified</b> (Ready to Close). Next Action: define the next closing step.</div>}
      {isFollow && (
        <div style={{ padding: "12px 14px", border: `1px solid ${C.purple}40`, background: C.purple + "08", borderRadius: 10, marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: C.purple, fontWeight: 700, marginBottom: 10 }}>A Follow Up is a deliberate pause until a later date — a date and reason are required.</div>
          <MiniField label="Follow-Up Date *"><input type="date" value={followUpDate} onChange={e => setFollowUpDate(e.target.value)} style={fieldStyle} /></MiniField>
          <MiniField label="Follow-Up Reason *">
            <select value={followUpReason} onChange={e => setFollowUpReason(e.target.value)} style={fieldStyle}>
              <option value="">Choose…</option>{FOLLOWUP_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </MiniField>
        </div>
      )}
      {isLost && (
        <MiniField label="Lost Reason *">
          <select value={lostReason} onChange={e => setLostReason(e.target.value)} style={fieldStyle}>
            <option value="">Choose a reason…</option>{LOST_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </MiniField>
      )}
      {sel && !isAppt && !isFollow && (
        <div style={{ fontSize: 12, color: C.amber, fontWeight: 600, marginBottom: 12 }}>
          {NEGATIVE.has(choice) ? "↩ Ends processing — you can set Do Not Contact in Finalize." : choice === "qualified" ? "" : "↩ Ends processing — sent to Finalize."}
        </div>
      )}
      <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: C.muted, display: "block", marginBottom: 6 }}>Note (optional)</label>
      <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Optional — briefly describe the conversation outcome…"
        style={{ ...fieldStyle, minHeight: 70, resize: "vertical", lineHeight: 1.5, marginBottom: 16 }} />
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <PrimaryBtn icon="✓" disabled={!canContinue} onClick={() => sel && onContinue(sel.v, sel.label, note.trim(), extra())}>Save &amp; Continue</PrimaryBtn>
        <GhostBtn icon="🏁" onClick={() => onFinalizeNow(note.trim())}>Finalize Process</GhostBtn>
      </div>
    </>
  );
};

// Appointment Outcome (flat, single-select). Per spec §9/§11 a completed
// appointment must resolve to exactly one of Qualified / Follow Up / Not
// Interested / Closed-Lost — attending an appointment does NOT auto-qualify. No
// Show and Reschedule keep the lead in the Appointment status.
const APPT_OUTCOMES = [
  { v: "qualified",    label: "Qualified",            tone: C.green },
  { v: "followup",     label: "Follow Up (later)",    tone: C.purple },
  { v: "notinterested",label: "Not Interested",       tone: C.red },
  { v: "lost",         label: "No Suitable Solution", tone: C.slate },
  { v: "reschedule",   label: "Reschedule",           tone: C.amber },
  { v: "noshow",       label: "No Show",              tone: C.amber },
];
const AppointmentOutcomeStep = ({ appointment, onComplete, onFinalizeNow }) => {
  const [choice, setChoice] = useState("");
  const [note, setNote] = useState("");
  const [lostReason, setLostReason] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpReason, setFollowUpReason] = useState("");
  const sel = APPT_OUTCOMES.find(o => o.v === choice);
  const isLost = NEEDS_LOST_REASON.has(choice);
  const isFollow = choice === "followup";
  const hint = choice === "reschedule"
    ? "↩ Re-opens scheduling — you'll re-book a new appointment and stay on this step."
    : choice === "noshow" ? "↩ Stays in Appointment — Next Action: call to reschedule."
    : choice === "qualified" ? "→ Status becomes Qualified (Ready to Close)."
    : NEGATIVE.has(choice) ? "↩ Ends processing — you can set Do Not Contact in Finalize." : null;
  const canSave = !!sel
    && (!isLost || !!lostReason)
    && (!isFollow || (!!followUpDate && !!followUpReason));
  const extra = () => ({ lostReason: isLost ? lostReason : null, followUpDate: isFollow ? followUpDate : null, followUpReason: isFollow ? followUpReason : null });
  return (
    <>
      {appointment && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 9, background: C.light, border: `1px solid ${C.border}`, marginBottom: 14, fontSize: 12.5, color: C.navy, fontWeight: 600 }}>
          📅 {appointment.type} · {appointment.date} {appointment.time}
        </div>
      )}
      <div style={{ fontSize: 13, color: C.slate, marginBottom: 14 }}>Record the outcome of the appointment. A completed appointment must resolve to one clear result.</div>
      <OptionChips options={APPT_OUTCOMES} value={choice} onChange={setChoice} />
      {hint && <div style={{ fontSize: 12, color: choice === "qualified" ? C.green : C.amber, fontWeight: 600, marginBottom: 12 }}>{hint}</div>}
      {isFollow && (
        <div style={{ padding: "12px 14px", border: `1px solid ${C.purple}40`, background: C.purple + "08", borderRadius: 10, marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: C.purple, fontWeight: 700, marginBottom: 10 }}>A Follow Up is a deliberate pause until a later date — a date and reason are required.</div>
          <MiniField label="Follow-Up Date *"><input type="date" value={followUpDate} onChange={e => setFollowUpDate(e.target.value)} style={fieldStyle} /></MiniField>
          <MiniField label="Follow-Up Reason *">
            <select value={followUpReason} onChange={e => setFollowUpReason(e.target.value)} style={fieldStyle}>
              <option value="">Choose…</option>{FOLLOWUP_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </MiniField>
        </div>
      )}
      {isLost && (
        <MiniField label="Lost Reason *">
          <select value={lostReason} onChange={e => setLostReason(e.target.value)} style={fieldStyle}>
            <option value="">Choose a reason…</option>{LOST_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </MiniField>
      )}
      <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: C.muted, display: "block", marginBottom: 6 }}>Note (optional)</label>
      <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Optional — e.g. client was a no-show without notice…"
        style={{ ...fieldStyle, minHeight: 70, resize: "vertical", lineHeight: 1.5, marginBottom: 16 }} />
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <PrimaryBtn icon={choice === "reschedule" ? "📅" : "✓"} disabled={!canSave} onClick={() => sel && onComplete(sel.v, sel.label, note.trim(), extra())}>Save &amp; Continue</PrimaryBtn>
        <GhostBtn icon="🏁" onClick={() => onFinalizeNow(note.trim())}>Finalize Process</GhostBtn>
      </div>
    </>
  );
};

const FinalizeStep = ({ done, negativeOutcome, dnc, isContact, networkStatus, canConvert = true, onToggleDnc, onProcess, onAddToNetwork, onBackToDashboard }) => (
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
            : canConvert
              ? <PrimaryBtn icon="⇪" onClick={onAddToNetwork}>Add to My Network</PrimaryBtn>
              : <span title="Super Admins cannot convert leads to Network" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: C.muted, background: C.light, border: `1px solid ${C.border}`, padding: "9px 14px", borderRadius: 9, whiteSpace: "nowrap" }}>Conversion not permitted for your role</span>}
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
export const FeedbackProcessingTab = ({ contact, state, setState, role, navigateTo, onCreateTask, onSendEmail, emailSent, onBookAppointment, onCancelAppointment, onLeadFinalized, onLeadConverted, autoConvert, readOnly = false }) => {
  const current = state.current;
  const currentStep = STEPS[current];
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);
  const [reopenTarget, setReopenTarget] = useState<string | null>(null);

  // "Add to Network" deep-link from the Leads list opens the Convert dialog once.
  React.useEffect(() => { if (autoConvert && !state.isContact) setConvertOpen(true); }, []);

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

  // Send Initial Message is optional — skip straight to Call Attempts.
  const onSkipInitial = () => setState(prev => ({
    ...prev, current: IDX.phone, doneSteps: withDone(prev, "initial"),
    summaries: { ...prev.summaries, initial: "Skipped — calling directly" },
    lastAction: { icon: "⏭", label: "Initial message skipped", date: today() },
    log: pushLog(prev, "Send Initial Message → Skipped (calling directly)"),
  }));

  // "Finalize now" — jump straight to Finalize from any step at or after Call
  // Attempts, without completing the remaining steps. Neutral by design: it does
  // not flag the lead as a negative outcome (no DNC toggle).
  const onFinalizeNow = (fromKey, note = "") => setState(prev => {
    if (prev.finished) return prev;
    const title = STEPS[IDX[fromKey]].title;
    const noteSuffix = note ? ` — ${note}` : "";
    const summary = fromKey === "phone"
      ? (prev.calls >= 1 ? `Finalized early after ${prev.calls} call attempt${prev.calls !== 1 ? "s" : ""}` : "Finalized early")
      : `Finalized early${noteSuffix}`;
    return {
      ...prev, current: IDX.finish, doneSteps: withDone(prev, fromKey),
      summaries: { ...prev.summaries, [fromKey]: summary },
      lastAction: { icon: "🏁", label: "Finalized early", date: today() },
      log: pushLog(prev, `${title} → Finalized early${noteSuffix} · sent to Finalize`),
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

  // Write the booked appointment through to the shared calendar / activities store
  // (so it shows on the Calendar, not just inside this tab). No-op if the host
  // didn't wire a calendar (the callback is optional).
  const bookOnCalendar = (appt, data) => {
    if (!onBookAppointment) return;
    onBookAppointment({
      id: appt.id,
      type: data?.apptType || appt.type,
      lead: contact?.name || "",
      leadId: contact?.id,
      date: appt.date,
      start: appt.time,
      end: data?.end || "",
      gp: contact?.assignee || "",
      vd: "",
      notes: data?.description || "",
    });
  };

  // From Call Outcome: picking "Appointment Scheduled" opens the modal and books
  // the appointment WITHOUT leaving the step (the advisor advances with Continue).
  const onBookForOutcome = (appt, data) => {
    bookOnCalendar(appt, data);
    setState(prev => ({
      ...prev, appointment: appt, contactOutcome: prev.contactOutcome || "Appointment Scheduled",
      lastAction: { icon: "📅", label: `Appointment booked · ${appt.date} ${appt.time}`, date: today() },
      log: pushLog(prev, `Appointment Scheduled → ${appt.type} · ${appt.date} ${appt.time}`),
    }));
  };

  // Delete the appointment booked from Call Outcome — cancels its calendar event
  // and clears the booking so the advisor can re-book (or pick another outcome).
  const onDeleteApptForOutcome = () => setState(prev => {
    if (prev.appointment?.id) onCancelAppointment && onCancelAppointment(prev.appointment.id);
    return {
      ...prev, appointment: null,
      lastAction: { icon: "🗑️", label: "Appointment deleted", date: today() },
      log: pushLog(prev, "Appointment Scheduled → Appointment deleted · removed from calendar"),
    };
  });

  // Next Action derived from a resolved outcome (spec §4 / trigger matrix).
  const NEXT_ACTION_FOR = {
    appointment: "Attend / conduct appointment",
    qualified:   "Define next closing step",
    followup:    "Resume follow-up",
    notinterested: "No open action",
    lost:        "No open action",
    other:       "Review outcome",
  };

  // "Continue" from Call Outcome. Appointment (already booked) → advance to
  // Appointment Outcome; anything else → Finalize, discarding a stray booking.
  const onContinueOutcome = (v, label, note = "", extra: any = {}) => {
    const noteSuffix = note ? ` — ${note}` : "";
    const nextAction = NEXT_ACTION_FOR[v] || null;
    if (v === "appointment") {
      setState(prev => ({
        ...prev, contactOutcome: label, contactNote: note || null, nextAction,
        current: IDX.appointment, doneSteps: withDone(prev, "outcome"),
        summaries: { ...prev.summaries, outcome: `${label}${noteSuffix}` },
        lastAction: { icon: "📅", label: `Call outcome: ${label}`, date: today() },
        log: pushLog(prev, `Call Outcome → ${label}${noteSuffix}`),
      }));
      return;
    }
    if (state.appointment?.id) onCancelAppointment && onCancelAppointment(state.appointment.id);
    const extraLog = extra.lostReason ? ` · Lost Reason: ${extra.lostReason}`
      : extra.followUpDate ? ` · Follow-Up ${extra.followUpDate} (${extra.followUpReason})` : "";
    setState(prev => ({
      ...prev, contactOutcome: label, contactNote: note || null, appointment: null,
      negativeOutcome: NEGATIVE.has(v) ? true : prev.negativeOutcome,
      lostReason: extra.lostReason || prev.lostReason,
      followUpDate: extra.followUpDate || prev.followUpDate,
      followUpReason: extra.followUpReason || prev.followUpReason,
      nextAction, nextActionDue: extra.followUpDate || prev.nextActionDue,
      outcome: v === "lost" ? "Lost" : prev.outcome,
      current: IDX.finish, doneSteps: withDone(prev, "outcome"),
      summaries: { ...prev.summaries, outcome: `${label}${noteSuffix}` },
      lastAction: { icon: "🏁", label: `Call outcome: ${label}`, date: today() },
      log: pushLog(prev, `Call Outcome → ${label}${noteSuffix}${extraLog} · sent to Finalize`),
    }));
  };

  // Re-book from within Appointment Outcome (reschedule) — keeps the current step.
  // The previous calendar event is cancelled by the caller before this runs.
  const onRebook = (appt, data) => {
    bookOnCalendar(appt, data);
    setState(prev => ({
      ...prev, appointment: appt,
      lastAction: { icon: "📅", label: `Re-booked · ${appt.date} ${appt.time}`, date: today() },
      log: pushLog(prev, `Appointment Scheduled → Re-booked · ${appt.type} · ${appt.date} ${appt.time}`),
    }));
  };

  const onAppointmentOutcome = (v, label, note = "", extra: any = {}) => {
    // Reschedule and No Show both keep the lead in the Appointment status and
    // re-open scheduling (Next Action = call to reschedule / conduct appointment).
    if (v === "reschedule" || v === "noshow") {
      const isNoShow = v === "noshow";
      setState(prev => ({
        ...prev, reschedules: prev.reschedules + 1, nextAction: "Call to reschedule",
        lastAction: { icon: isNoShow ? "👻" : "🔁", label: isNoShow ? "No show — reschedule" : "Appointment rescheduled — re-book", date: today() },
        log: pushLog(prev, `Appointment Outcome → ${isNoShow ? "No Show" : "Reschedule"} — re-opening scheduling${note ? ` · ${note}` : ""}`),
      }));
      setScheduleModalOpen(true);
      return;
    }
    const noteSuffix = note ? ` — ${note}` : "";
    const nextAction = NEXT_ACTION_FOR[v] || null;
    const extraLog = extra.lostReason ? ` · Lost Reason: ${extra.lostReason}`
      : extra.followUpDate ? ` · Follow-Up ${extra.followUpDate} (${extra.followUpReason})` : "";
    setState(prev => ({
      ...prev, apptOutcome: label, apptNote: note || null, current: IDX.finish, doneSteps: withDone(prev, "appointment"),
      negativeOutcome: NEGATIVE.has(v) ? true : prev.negativeOutcome,
      lostReason: extra.lostReason || prev.lostReason,
      followUpDate: extra.followUpDate || prev.followUpDate,
      followUpReason: extra.followUpReason || prev.followUpReason,
      nextAction, nextActionDue: extra.followUpDate || prev.nextActionDue,
      outcome: v === "lost" ? "Lost" : prev.outcome,
      summaries: { ...prev.summaries, appointment: `${label}${noteSuffix}` },
      lastAction: { icon: NEGATIVE.has(v) ? "🏁" : "✅", label: `Appointment: ${label}`, date: today() },
      log: pushLog(prev, `Appointment Outcome → ${label}${noteSuffix}${extraLog}`),
    }));
  };

  const onToggleDnc = () => setState(prev => {
    const dnc = !prev.dnc;
    return { ...prev, dnc, log: pushLog(prev, `Do Not Contact → ${dnc ? "ON" : "OFF"}`) };
  });

  const onProcess = () => {
    onLeadFinalized && onLeadFinalized();   // persist "finalized" so the Leads list shows "Add to Network"
    setState(prev => ({
      ...prev, finished: true,
      lastAction: { icon: "🏁", label: "Lead processed", date: today() },
      log: pushLog(prev, `Finalize Process → Processed${prev.dnc ? " · Do Not Contact" : ""}`),
    }));
  };

  const onApplyConvert = (outcome) => {
    // outcome is a subset of NETWORK_OUTCOMES (Customer / Partner). Empty = a
    // plain Network contact ("Contact").
    const set = Array.isArray(outcome) ? outcome : (outcome ? [outcome] : []);
    const label = set.length === 2 ? "Customer + Partner" : set[0] || "Contact";
    onLeadConverted && onLeadConverted(set);   // move the lead into My Network (out of the Leads views)
    setState(prev => ({
      ...prev, isContact: true, networkStatus: label, outcome: label,
      lastAction: { icon: "⇪", label: `Added to My Network · ${label}`, date: today() },
      log: pushLog(prev, `Convert Lead → Added to My Network as ${label}`),
    }));
  };

  // Reopen the most-recently-completed step for correction. The current step is
  // uncommitted, so nothing downstream is orphaned — we just clear the flags this
  // step (and later) produced and re-enter it, appending an audit line.
  const reopen = (stepKey) => setState(prev => {
    // Conversion to Network is irreversible — once converted, the stepper is
    // frozen and cannot be reopened. (The Edit control is hidden too; this is a
    // belt-and-braces guard.)
    if (prev.isContact) return prev;
    const idx = IDX[stepKey];
    const wasFinalized = prev.finished;
    const patch: any = {
      ...prev,
      current: idx,
      doneSteps: prev.doneSteps.filter(k => IDX[k] < idx),
      finished: false,
    };
    if (idx <= IDX.phone)       { patch.reached = false; patch.notReached = false; patch.calls = Math.max(0, prev.calls - 1); }
    // Reopening at/through Call Outcome discards any booked appointment and the
    // reschedule history (the calendar event itself is cancelled by the caller).
    if (idx <= IDX.outcome)     { patch.contactOutcome = null; patch.contactNote = null; patch.appointment = null; patch.reschedules = 0; }
    if (idx <= IDX.appointment) { patch.apptOutcome = null; patch.apptNote = null; patch.negativeOutcome = false; patch.dnc = false; }
    patch.lastAction = { icon: "↩", label: `Reopened "${STEPS[idx].title}"`, date: today() };
    // Reopening a finalized lead pulls its result back out of the campaign stats.
    patch.log = pushLog(prev, `↩ Reopened "${STEPS[idx].title}" for correction${wasFinalized ? " · processing result retracted from campaign statistics" : ""}`);
    return patch;
  });

  const renderCurrentBody = (step) => {
    switch (step.key) {
      case "initial":     return <SendInitialMessageStep contact={contact} emailSent={emailSent} onSend={onSend} onSkip={onSkipInitial} onSendEmail={onSendEmail} />;
      case "phone":       return <CallAttemptsStep key={`ph-${state.calls}`} contact={contact} calls={state.calls} notReached={state.notReached} onLog={onLogCall} onFinalizeNow={() => onFinalizeNow("phone")} onCreateTask={onCreateTask} onSendEmail={onSendEmail} />;
      case "outcome":     return <CallOutcomeStep appointment={state.appointment} onScheduleAppt={() => setScheduleModalOpen(true)} onDeleteAppt={onDeleteApptForOutcome} onContinue={onContinueOutcome} onFinalizeNow={(note) => onFinalizeNow("outcome", note)} />;
      case "appointment": return <AppointmentOutcomeStep key={`ao-${state.reschedules}`} appointment={state.appointment} onComplete={onAppointmentOutcome} onFinalizeNow={(note) => onFinalizeNow("appointment", note)} />;
      case "finish":      return <FinalizeStep done={state.finished} negativeOutcome={state.negativeOutcome} dnc={state.dnc} isContact={state.isContact} networkStatus={state.networkStatus} canConvert={role !== "superadmin"} onToggleDnc={onToggleDnc} onProcess={onProcess} onAddToNetwork={() => setConvertOpen(true)} onBackToDashboard={() => navigateTo && navigateTo("Dashboard")} />;
      default:            return null;
    }
  };

  // Locked (future) steps: those after the current one — empty once we've jumped
  // to Finalize. Completed rows come from the actually-visited steps.
  const future    = STEPS.slice(current + 1);
  const completed = state.doneSteps.map(k => STEPS.find(s => s.key === k)).filter(Boolean);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Network contacts have completed the lead process — the flow is read-only
          (their Outcome is edited from the contact's Status field, not here). */}
      {readOnly && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 12, border: `1px solid ${C.border}`, background: C.light, marginBottom: 2 }}>
          <span style={{ fontSize: 18 }}>🔒</span>
          <div style={{ fontSize: 12.5, color: C.slate, lineHeight: 1.5 }}>
            This contact is in your <b>Network</b> — the lead <b>Processing &amp; Feedback</b> flow is read-only. To change the Customer / Partner classification, use the <b>Status</b> field on the contact.
          </div>
        </div>
      )}
      <div style={readOnly ? { pointerEvents: "none", opacity: 0.65, filter: "grayscale(0.2)" } : undefined} aria-disabled={readOnly}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {completed.map((s, i) => (
        <DoneStep key={s.key} num={stepNo(s.key)} title={s.title} summary={state.summaries[s.key]}
          editable={i === completed.length - 1 && !state.isContact} onReopen={() => setReopenTarget(s.key)} />
      ))}

      <CurrentStepShell num={stepNo(currentStep.key)} title={currentStep.title}>
        {renderCurrentBody(currentStep)}
      </CurrentStepShell>

      {future.map(s => <LockedStep key={s.key} num={stepNo(s.key)} title={s.title} />)}
        </div>
      </div>

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
            const appt = { id: `appt-${Date.now()}`, type: data.apptType, date: data.date, time: data.time };
            // Re-opening the scheduler (Change / reschedule) replaces the prior
            // booking — cancel its calendar event first.
            if (state.appointment?.id) onCancelAppointment && onCancelAppointment(state.appointment.id);
            if (current === IDX.outcome) {
              // From Call Outcome → book but stay; the advisor advances with Continue.
              onBookForOutcome(appt, data);
            } else {
              // From Appointment Outcome (reschedule) → book the replacement.
              onRebook(appt, data);
            }
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

      {reopenTarget && (
        <ConfirmDialog
          title="Reopen this step?"
          message={<>
            Reopening <b>{STEPS[IDX[reopenTarget]].title}</b> discards the steps after it and their recorded outcomes — you'll re-do them from here.
            {IDX[reopenTarget] <= IDX.outcome && state.appointment && <> The booked appointment will be cancelled and removed from the calendar.</>}
            {state.finished && <> This lead's result will be retracted from the campaign statistics.</>}
          </>}
          confirmLabel="Reopen & Discard"
          danger
          onCancel={() => setReopenTarget(null)}
          onConfirm={() => {
            // If the reopen discards a booked appointment, cancel its calendar
            // event too (and notify attendees, once that's wired server-side).
            if (IDX[reopenTarget] <= IDX.outcome && state.appointment?.id) {
              onCancelAppointment && onCancelAppointment(state.appointment.id);
            }
            reopen(reopenTarget);
            setReopenTarget(null);
          }}
        />
      )}
    </div>
  );
};
