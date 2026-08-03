import React, { useState, useRef } from "react";
import { C } from "../../theme";
import { AppointmentModal } from "../appointments/appointment-modal";
import { useT } from "../../lib/i18n";

// Step key → i18n key, so step titles render in the active language.
const STEP_TITLE_KEY: Record<string, string> = {
  initial: "fpStepInitial", call: "fpStepCall", appointment: "fpStepAppt", finish: "fpStepFinish",
};
const stepTitleT = (key: string, t: any) => t(STEP_TITLE_KEY[key] || "fpStepInitial");

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
// · Call Outcome (spec-aligned): Appointment Scheduled, Won, Follow Up, Not
//   Interested, No Suitable Solution (Closed / Lost). "Appointment Scheduled"
//   opens the scheduling modal; Won / Not Interested / No Suitable Solution
//   advance to Finalize on Save & Continue. "Follow Up" is a deliberate pause —
//   it is recorded on Save & Continue (which stays enabled) but keeps the lead on
//   this step, marking it "Follow Up · Waiting for Follow-Up"; the advisor
//   schedules the real follow-up via Create Task.
// · Appointment Outcome (spec-aligned): a completed appointment resolves to
//   Won, Not Interested, No Suitable Solution (Closed / Lost) or No Show — all
//   advance to Finalize on Save & Continue. No Show keeps the appointment status
//   "No Show" but does NOT re-open scheduling. Reschedule re-opens scheduling and
//   keeps the lead in Appointment (its own chip action, no Save & Continue).
//   Follow Up is recorded on Save & Continue but stays on this step. An optional
//   note captures details.
// · Negative outcomes (Not Interested, No Suitable Solution) enable a persistent
//   Do-Not-Contact toggle in Finalize.
// · Conversion happens in Finalize: "Add to My Network" opens the Convert Lead
//   modal, where the Outcome is any combination of Customer / Partner (both may
//   apply; none = a plain Network contact).
// ─────────────────────────────────────────────────────────────────────────────

export const STEPS = [
  { key: "initial",     title: "Send Initial Message" },
  { key: "call",        title: "Call Attempt & Outcome" },
  { key: "appointment", title: "Appointment Outcome" },
  { key: "finish",      title: "Finalize Process" },
];
const IDX = Object.fromEntries(STEPS.map((s, i) => [s.key, i]));
const stepNo = (key) => IDX[key] + 1;

// Negative closing outcomes that end processing and enable the Do-Not-Contact
// toggle. Per the spec, "Currently Not Interested" is dropped (it's a Follow Up)
// and "Difficult Case" is replaced by "No Suitable Solution" → Closed / Lost.
const NEGATIVE = new Set(["notinterested", "lost"]);

// A lead may be called at most 5 times; after that it is marked "Not Reached".
const MAX_CALL_ATTEMPTS = 5;

// Short label shown as the "Feedback & Processing status" elsewhere.
export const FEEDBACK_STEP_LABEL = {
  initial:     "Initial Message",
  call:        "Call Attempt & Outcome",
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

// Map a lead's mock status → the step it should open on (initial 0, call 1,
// appointment 2, finish 3).
const STATUS_STEP = {
  open: 0, in_progress: 1, attempted: 1, connected: 1, not_reached: 3,
  followup: 1, appointment: 2, appt_completed: 2, no_show: 2, qualified: 3,
  closed: 3, no_interest: 3, dnc: 3,
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
  const doneSteps = notReached ? ["initial", "call"]
    : negative ? ["initial", "call"]
    : STEPS.slice(0, current).map(s => s.key);
  const log = [{ text: "Lead assigned → status set to New", time: "12:58:29 PM" }];
  if (current > 0) log.push({ text: "Send Initial Message → Sent via SMS / WhatsApp", time: "12:59:05 PM" });
  return {
    current, finished, isContact, channels, calls,
    reached: (status === "connected" || status === "followup" || current > IDX.call) && !notReached,
    notReached,
    followUp: status === "followup",
    contactOutcome: null, apptOutcome: null, contactNote: null, apptNote: null,
    negativeOutcome: negative, dnc: status === "dnc",
    // Spec §7 properties — seeded from the lead so a pre-existing Follow Up /
    // Lost lead shows its real date/reason; updated live during processing.
    nextAction: lead?.nextAction || null,
    nextActionDue: lead?.nextActionDue || lead?.nextActionDueDate || null,
    lostReason: lead?.lostReason || null,
    followUpDate: lead?.followUpDate || null,
    followUpReason: lead?.followUpReason || null,
    outcome: typeof lead?.outcome === "string" ? lead.outcome : null,
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
  if (step === "call")        return s.reached ? "Connected · recording outcome" : `${s.calls} call${s.calls !== 1 ? "s" : ""}${s.reached ? " · reached" : ""}`;
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

const LockedStep = ({ num, title }) => {
  const t = useT();
  return (
  <div style={{ ...card, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12, opacity: 0.75 }}>
    <StepDot n={num} bg={C.light} color={C.muted} ring />
    <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: C.muted }}>{title}</span>
    <span title={t("fpLocked")} style={{ fontSize: 12, color: C.muted }}>🔒</span>
  </div>
  );
};

// The Finalize Process step row carries the single "Finalize Process" action —
// enabled once the advisor has reached the Call Attempt & Outcome step, so a lead
// can be finalized from here at any point (without stepping through every stage).
const FinalizeStepRow = ({ num, title, canFinalize, onFinalize }) => {
  const t = useT();
  return (
  <div style={{ ...card, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12, opacity: canFinalize ? 1 : 0.75 }}>
    <StepDot n={num} bg={canFinalize ? C.navy : C.light} color={canFinalize ? "#fff" : C.muted} ring={!canFinalize} />
    <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: canFinalize ? C.navy : C.muted }}>{title}</span>
    <button onClick={canFinalize ? onFinalize : undefined} disabled={!canFinalize}
      title={canFinalize ? t("fpFinalizeNowHint") : t("fpFinalizeOffHint")}
      style={{
        display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 18px", borderRadius: 9, border: "none",
        background: canFinalize ? C.navy : C.border, color: canFinalize ? "#fff" : C.muted,
        fontSize: 13, fontWeight: 700, cursor: canFinalize ? "pointer" : "not-allowed", fontFamily: "inherit",
      }}>✓ {t("fpStepFinish")}</button>
  </div>
  );
};

// Only the most recently completed step is editable — reopening it discards the
// uncommitted current step; older steps stay locked so a branch can't be orphaned.
const DoneStep = ({ num, title, summary, editable, onReopen }) => {
  const t = useT();
  return (
  <div style={{ ...card, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12, background: C.green + "08", borderColor: C.green + "40" }}>
    <StepDot n={num} bg={C.green} color="#fff" />
    <div style={{ flex: 1, minWidth: 0 }}>
      <span style={{ fontSize: 14, fontWeight: 600, color: C.navy }}>{title}</span>
      {summary && <span style={{ fontSize: 12.5, color: C.slate, marginLeft: 8 }}>· {summary}</span>}
    </div>
    <span style={{ color: C.green, fontSize: 13 }}>✓</span>
    {editable
      ? <button onClick={onReopen} style={{ background: "none", border: "none", cursor: "pointer", color: C.slate, fontSize: 12, fontWeight: 600 }}>{t("fpEdit")}</button>
      : <span style={{ color: C.muted, fontSize: 12 }}>🔒</span>}
  </div>
  );
};

const CurrentStepShell = ({ num, title, children }) => (
  <div style={{ ...card, borderColor: C.navy, boxShadow: "0 6px 22px rgba(29,41,57,0.10)" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 20px", borderBottom: `1px solid ${C.border}` }}>
      <StepDot n={num} bg={C.navy} color="#fff" />
      <span style={{ fontSize: 16, fontWeight: 700, color: C.navy }}>{title}</span>
    </div>
    <div style={{ padding: "18px 20px" }}>{children}</div>
  </div>
);

// Confirmation dialog (used before a reopen discards later steps).
const ConfirmDialog = ({ title, message, confirmLabel, danger = false, onCancel, onConfirm }) => {
  const t = useT();
  return (
  <>
    <div onClick={onCancel} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", zIndex: 600 }} />
    <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 440, maxWidth: "92vw", background: "#fff", borderRadius: 16, zIndex: 700, boxShadow: "0 24px 64px rgba(0,0,0,0.22)", padding: "22px 24px", fontFamily: "inherit" }}>
      <div style={{ fontSize: 17, fontWeight: 700, color: C.navy, marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 13, color: C.slate, marginBottom: 22, lineHeight: 1.5 }}>{message}</div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
        <button onClick={onCancel} style={{ padding: "9px 20px", borderRadius: 9, border: "none", background: "transparent", color: C.slate, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>{t("cancel")}</button>
        <button onClick={onConfirm} style={{ padding: "9px 22px", borderRadius: 9, border: "none", background: danger ? C.red : C.navy, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>{confirmLabel}</button>
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
  const t = useT();
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
  const badge = copied ? t("fpCopied") : (emailSent ? t("fpEmailSentBadge") : null);
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
      <div style={{ fontSize: 13, color: C.slate, marginBottom: 14 }}>{t("fpInitialDesc")}</div>
      <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, background: C.light, padding: "14px 16px", marginBottom: 18 }}>
        <div style={{ fontSize: 13, color: C.text, lineHeight: 1.55, whiteSpace: "pre-wrap" }}>{template}</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        {chBtn("text", t("fpCopySms"), copyText)}
        {chBtn("email", t("fpCopyEmail"), openEmail)}
        {badge && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700, color: "#fff", background: C.green, padding: "7px 12px", borderRadius: 8 }}>✓ {badge}</span>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <PrimaryBtn icon="✓" onClick={() => onSend(channel)}>{t("fpMarkSent")}</PrimaryBtn>
        <GhostBtn icon="⏭" onClick={onSkip}>{t("fpSkip")}</GhostBtn>
      </div>
    </>
  );
};

const CALL_RESULTS = [
  { v: "notreached", k: "fpNotReachedShort", label: "Not Reached", tone: C.red },
  { v: "reached",    k: "fpReachedShort",    label: "Reached",     tone: C.green },
];
// Select the result of a call attempt (correctable), then Save & Continue.
const CallAttemptsStep = ({ contact, calls, notReached, onLog, onSendEmail }) => {
  const t = useT();
  const [sel, setSel] = useState("");
  const [copied, setCopied] = useState(false);
  const first = (contact?.name || "there").replace(/^(Ms|Mr|Mrs|Dr)\.?\s+/i, "").split(" ")[0];
  const advisor = contact?.assignee || "your advisor";
  const missedCall = MISSED_CALL_TEMPLATE.replace(/{first}/g, first).replace(/{advisor}/g, advisor);
  const copyMissed = () => { try { navigator?.clipboard?.writeText?.(missedCall); } catch {} setCopied(true); setTimeout(() => setCopied(false), 1500); };
  const emailMissed = () => { try { navigator?.clipboard?.writeText?.(missedCall); } catch {} onSendEmail && onSendEmail({ subject: MISSED_CALL_SUBJECT, body: missedCall }); };
  return (
    <>
      <div style={{ fontSize: 13, color: C.slate, marginBottom: 14 }}>{t("fpCallDesc")}</div>
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
            This lead couldn't be reached. Use <b>Create Task</b> (top) to schedule a follow-up so it isn't lost — then <b>Finalize Process</b> from the step below.
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
                }}>{copied ? `✓ ${t("fpCopied")}` : `📋 ${t("fpCopySms")}`}</button>
                <button onClick={emailMissed} style={{
                  display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8,
                  border: `1px solid ${C.border}`, background: "#fff", color: C.slate,
                  fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                }}>✉️ {t("fpCopyEmail")}</button>
              </div>
            </div>
            <div style={{ fontSize: 12.5, color: C.text, lineHeight: 1.5 }}>{missedCall}</div>
          </div>
          <OptionChips options={CALL_RESULTS.map(o => ({ ...o, label: t(o.k as any) }))} value={sel} onChange={setSel} />
          {sel === "notreached" && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", border: `1px solid ${C.amber}55`, background: C.amber + "0F", borderRadius: 10, marginBottom: 14, flexWrap: "wrap" }}>
              <span style={{ fontSize: 18 }}>💡</span>
              <div style={{ flex: 1, minWidth: 180, fontSize: 12.5, color: C.text, lineHeight: 1.45 }}>
                Couldn't reach the lead? Use <b>Create Task</b> (top) to schedule a follow-up (e.g. a callback reminder) so this lead isn't forgotten.
              </div>
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <PrimaryBtn icon="✓" disabled={!sel} onClick={() => onLog(sel === "reached")}>{t("fpSaveContinue")}</PrimaryBtn>
          </div>
          <div style={{ fontSize: 11.5, color: C.muted, marginTop: 10 }}>
            You don't have to use all {MAX_CALL_ATTEMPTS} attempts — you can <b>Finalize Process</b> at any point using the button on the Finalize Process step below.
          </div>
        </>
      )}
    </>
  );
};

// Call Outcome (after the contact is reached). Per the spec, a reached contact
// resolves to one of: schedule an appointment, qualify, pause as a Follow Up
// (with a date), reject (Not Interested), or Closed / Lost when no solution fits.
const CALL_OUTCOMES = [
  { v: "appointment",  k: "fpChipAppt",         label: "Appointment Scheduled", tone: C.green },
  { v: "won",          k: "fpChipWon",          label: "Won",                   tone: C.green },
  { v: "followup",     k: "fpChipFollowUp",     label: "Follow Up",             tone: C.purple },
  { v: "notinterested",k: "fpChipNotInterested",label: "Not Interested",        tone: C.red },
  { v: "lost",         k: "fpChipNoSolution",   label: "No Suitable Solution",  tone: C.slate },
];
const CallOutcomeStep = ({ appointment, followUp, onScheduleAppt, onFollowUp, onContinue }) => {
  const t = useT();
  const [choice, setChoice] = useState(followUp ? "followup" : "");
  const [note, setNote] = useState("");
  const sel = CALL_OUTCOMES.find(o => o.v === choice);
  const isAppt = choice === "appointment";
  const isFollowUp = choice === "followup";
  // Appointment Scheduled → open the scheduler. Follow Up is a deliberate pause:
  // it is recorded on Save & Continue (which stays enabled) but keeps the lead on
  // this step. Every other outcome resolves on Save & Continue and advances.
  const pick = (v) => { setChoice(v); if (v === "appointment") onScheduleAppt(); };
  const canContinue = !!sel && (!isAppt || !!appointment);
  // Follow Up records the pause and stays here; anything else advances the flow.
  const submit = () => {
    if (!sel) return;
    if (isFollowUp) { onFollowUp(note.trim()); return; }
    onContinue(sel.v, sel.label, note.trim());
  };
  return (
    <>
      <div style={{ fontSize: 13, color: C.slate, marginBottom: 14 }}>{t("fpCallOutcomeDesc")}</div>
      <OptionChips options={CALL_OUTCOMES.map(o => ({ ...o, label: t(o.k as any) }))} value={choice} onChange={pick} />
      {isAppt && (appointment
        ? <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 9, background: C.green + "0C", border: `1px solid ${C.green}40`, marginBottom: 14, fontSize: 12.5, color: C.navy, fontWeight: 600 }}>
            📅 {appointment.type} · {appointment.date} {appointment.time}
          </div>
        : <div style={{ fontSize: 12, color: C.amber, fontWeight: 600, marginBottom: 12 }}>📅 {t("fpChipAppt")}</div>)}
      {choice === "won" && <div style={{ fontSize: 12, color: C.green, fontWeight: 600, marginBottom: 12 }}>{t("fpWonHint")}</div>}
      {sel && !isAppt && (
        <div style={{ fontSize: 12, color: C.amber, fontWeight: 600, marginBottom: 12 }}>
          {NEGATIVE.has(choice) ? t("fpEndsDnc") : choice === "won" ? "" : choice === "followup" ? t("fpFollowUpHint") : t("fpEndsFinalize")}
        </div>
      )}
      <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: C.muted, display: "block", marginBottom: 6 }}>{t("fpNoteOptional")}</label>
      <textarea value={note} onChange={e => setNote(e.target.value)} placeholder=""
        style={{ ...fieldStyle, minHeight: 70, resize: "vertical", lineHeight: 1.5, marginBottom: 16 }} />
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <PrimaryBtn icon="✓" disabled={!canContinue} onClick={submit}>{t("fpSaveContinue")}</PrimaryBtn>
      </div>
    </>
  );
};

// Appointment Outcome (flat, single-select). Per spec §9/§11 a completed
// appointment must resolve to exactly one of Qualified / Follow Up / Not
// Interested / Closed-Lost — attending an appointment does NOT auto-qualify. No
// Show and Reschedule keep the lead in the Appointment status.
const APPT_OUTCOMES = [
  { v: "won",          k: "fpChipWon",          label: "Won",                  tone: C.green },
  { v: "followup",     k: "fpChipFollowUp",     label: "Follow Up",            tone: C.purple },
  { v: "notinterested",k: "fpChipNotInterested",label: "Not Interested",       tone: C.red },
  { v: "lost",         k: "fpChipNoSolution",   label: "No Suitable Solution", tone: C.slate },
  { v: "reschedule",   k: "fpChipReschedule",   label: "Reschedule",           tone: C.amber },
  { v: "noshow",       k: "fpChipNoShow",       label: "No Show",              tone: C.amber },
];
const AppointmentOutcomeStep = ({ appointment, followUp, onComplete, onReschedule, onFollowUp }) => {
  const t = useT();
  const [choice, setChoice] = useState(followUp ? "followup" : "");
  const [note, setNote] = useState("");
  const sel = APPT_OUTCOMES.find(o => o.v === choice);
  // Reschedule → re-open the scheduler and stay on this step (its own chip action,
  // no Save & Continue). Follow Up is a deliberate pause recorded on Save & Continue
  // (which stays enabled) that keeps the lead on this step. Won, Not Interested, No
  // Suitable Solution and No Show all resolve with Save & Continue and advance to
  // Finalize (No Show without re-opening the scheduler).
  const pick = (v) => {
    setChoice(v);
    if (v === "reschedule") onReschedule();
  };
  const hint = choice === "reschedule" ? t("fpRescheduleHint")
    : choice === "noshow" ? t("fpNoShowHint")
    : choice === "won" ? t("fpWonHintShort")
    : choice === "followup" ? t("fpFollowUpHint")
    : NEGATIVE.has(choice) ? t("fpEndsDnc") : null;
  const isActionChip = choice === "reschedule";
  const canSave = !!sel && !isActionChip;
  // Follow Up records the pause and stays here; anything else advances the flow.
  const submit = () => {
    if (!sel) return;
    if (choice === "followup") { onFollowUp(note.trim()); return; }
    onComplete(sel.v, sel.label, note.trim());
  };
  return (
    <>
      {appointment && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 9, background: C.light, border: `1px solid ${C.border}`, marginBottom: 14, fontSize: 12.5, color: C.navy, fontWeight: 600 }}>
          📅 {appointment.type} · {appointment.date} {appointment.time}
        </div>
      )}
      <div style={{ fontSize: 13, color: C.slate, marginBottom: 14 }}>{t("fpApptDesc")}</div>
      <OptionChips options={APPT_OUTCOMES.map(o => ({ ...o, label: t(o.k as any) }))} value={choice} onChange={pick} />
      {hint && <div style={{ fontSize: 12, color: choice === "won" ? C.green : C.amber, fontWeight: 600, marginBottom: 12 }}>{hint}</div>}
      <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: C.muted, display: "block", marginBottom: 6 }}>{t("fpNoteOptional")}</label>
      <textarea value={note} onChange={e => setNote(e.target.value)} placeholder=""
        style={{ ...fieldStyle, minHeight: 70, resize: "vertical", lineHeight: 1.5, marginBottom: 16 }} />
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <PrimaryBtn icon="✓" disabled={!canSave} onClick={submit}>{t("fpSaveContinue")}</PrimaryBtn>
      </div>
    </>
  );
};

// Reaching Finalize means the lead is processed — the terminal Status documents
// completion (no manual "mark as processed" button). Shows the processed summary,
// an optional Do-Not-Contact toggle for negative outcomes, and the convert action.
const FinalizeStep = ({ negativeOutcome, dnc, isContact, networkStatus, canConvert = true, convNotAllowedMsg, onToggleDnc, onAddToNetwork, onBackToDashboard }) => {
  const t = useT();
  return (
  <>
    {negativeOutcome && (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "12px 14px", borderRadius: 10, border: `1px solid ${dnc ? C.red + "55" : C.border}`, background: dnc ? C.red + "0C" : C.light, marginBottom: 16 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: dnc ? C.red : C.navy }}>{t("fpDncTitle")}</div>
          <div style={{ fontSize: 11.5, color: C.muted }}>{t("fpDncDesc")}</div>
        </div>
        <Toggle on={dnc} onChange={onToggleDnc} danger />
      </div>
    )}
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "2px 0 16px" }}>
      <span style={{ width: 34, height: 34, borderRadius: "50%", background: C.green, display: "grid", placeItems: "center", fontSize: 16, color: "#fff", flexShrink: 0 }}>✓</span>
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.navy }}>{t("fpProcessedTitle")}</div>
        <div style={{ fontSize: 12.5, color: C.slate, marginTop: 2 }}>{t("fpProcessedDesc")}{dnc ? t("fpProcessedDnc") : ""}</div>
      </div>
    </div>
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
      <GhostBtn icon="←" onClick={onBackToDashboard}>{t("fpBackDashboard")}</GhostBtn>
      {isContact
        ? <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: C.green, background: C.green + "14", padding: "9px 14px", borderRadius: 9, whiteSpace: "nowrap" }}>✓ {t("fpInNetwork")} · {networkStatus}</span>
        : canConvert
          ? <PrimaryBtn icon="⇪" onClick={onAddToNetwork}>{t("fpAddNetwork")}</PrimaryBtn>
          : <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: C.muted, background: C.light, border: `1px solid ${C.border}`, padding: "9px 14px", borderRadius: 9, whiteSpace: "nowrap" }}>{convNotAllowedMsg || t("fpConvNotAllowed")}</span>}
    </div>
  </>
  );
};

// ── Main tab (controlled) ─────────────────────────────────────────────────────
export const FeedbackProcessingTab = ({ contact, state, setState, role, navigateTo, onCreateTask, onSendEmail, emailSent, onBookAppointment, onCancelAppointment, onLeadFinalized, onLeadConverted, autoConvert, notify, readOnly = false }) => {
  const t = useT();
  const current = state.current;
  const currentStep = STEPS[current];
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [reopenTarget, setReopenTarget] = useState<string | null>(null);
  // The booking is committed to the calendar on Save & Continue (not on the
  // scheduler modal's Save), so the "added to calendar" confirmation and the
  // workflow "email sent" snackbar fire together in the same click.
  const pendingBookingRef = useRef<{ appt: any; data: any } | null>(null);

  // "Add to Network" deep-link from the Leads list converts the lead once (no modal).
  // Conversion is only allowed for a Won lead — otherwise it is blocked and the
  // advisor is told why (the Finalize step then shows the same restriction inline).
  React.useEffect(() => {
    if (!autoConvert || state.isContact) return;
    if (state.outcome === "Won") onApplyConvert([]);
    else notify && notify(t("fpConvOnlyWon"), "error");
  }, []);

  // Reaching the Finalize step marks the lead processed automatically — there is
  // no manual "mark as processed" button; the terminal Status documents it.
  React.useEffect(() => {
    if (current === IDX.finish && !state.finished && !state.isContact && !readOnly) onProcess();
  }, [current, state.finished, state.isContact, readOnly]);

  const pushLog = (prev, text) => [...prev.log, { text, time: nowTime() }];
  const withDone = (prev, key) => prev.doneSteps.includes(key) ? prev.doneSteps : [...prev.doneSteps, key];

  const onSend = (channel) => setState(prev => {
    const ch = { ...prev.channels }; ch[channel] = (ch[channel] || 0) + 1;
    return {
      ...prev, channels: ch, current: IDX.call, doneSteps: withDone(prev, "initial"),
      summaries: { ...prev.summaries, initial: "Initial message sent" },
      lastAction: { icon: "✉️", label: `Initial message · ${channelLabel(channel)}`, date: today() },
      log: pushLog(prev, `Send Initial Message → Sent via ${channelLabel(channel)}`),
    };
  });

  // Send Initial Message is optional — skip straight to Call Attempts.
  const onSkipInitial = () => setState(prev => ({
    ...prev, current: IDX.call, doneSteps: withDone(prev, "initial"),
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
    const summary = fromKey === "call"
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
      // Reached → stay on the merged "Call Attempt & Outcome" step and reveal the
      // outcome picker (no separate step to advance to).
      return {
        ...prev, calls, reached: true,
        lastAction: { icon: "📞", label: "Reached by phone", date: today() },
        log: pushLog(prev, `Call Attempt & Outcome → Connected after ${calls} call attempt${calls !== 1 ? "s" : ""}`),
      };
    }
    const exhausted = calls >= MAX_CALL_ATTEMPTS;
    if (exhausted) {
      return {
        ...prev, calls, notReached: true, current: IDX.finish, doneSteps: withDone(prev, "call"),
        summaries: { ...prev.summaries, call: `Not reached after ${calls} call attempts` },
        lastAction: { icon: "🚫", label: `Not reached (max ${MAX_CALL_ATTEMPTS} attempts)`, date: today() },
        log: pushLog(prev, `Call Attempt & Outcome → Not reached after ${calls} call attempts · sent to Finalize`),
      };
    }
    return {
      ...prev, calls,
      summaries: { ...prev.summaries, call: `Not reached after ${calls} call attempt${calls !== 1 ? "s" : ""}` },
      lastAction: { icon: "📞", label: "Call attempt — not reached", date: today() },
      log: pushLog(prev, `Call Attempt & Outcome → Not reached after ${calls} call attempt${calls !== 1 ? "s" : ""}`),
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
    // Stash the booking; it is written to the calendar on Save & Continue so the
    // "email sent" workflow snackbar coincides with the confirmation snackbar.
    pendingBookingRef.current = { appt, data };
    setState(prev => ({
      ...prev, appointment: appt, contactOutcome: prev.contactOutcome || "Appointment Scheduled",
      lastAction: { icon: "📅", label: `Appointment booked · ${appt.date} ${appt.time}`, date: today() },
      log: pushLog(prev, `Appointment Scheduled → ${appt.type} · ${appt.date} ${appt.time}`),
    }));
  };

  // Next Action derived from a resolved outcome (spec §4 / trigger matrix).
  const NEXT_ACTION_FOR = {
    appointment: "Attend / conduct appointment",
    won:         "No open action",
    followup:    "Resume follow-up",
    notinterested: "No open action",
    lost:        "No open action",
    noshow:      "No open action",
  };

  // "Continue" from Call Outcome. Appointment (already booked) → advance to
  // Appointment Outcome; anything else → Finalize, discarding a stray booking.
  const onContinueOutcome = (v, label, note = "") => {
    const noteSuffix = note ? ` — ${note}` : "";
    const nextAction = NEXT_ACTION_FOR[v] || null;
    if (v === "appointment") {
      // Commit the booking now: this writes it to the calendar and runs the
      // appointment_scheduled workflow (which may push an "email sent" snackbar),
      // so that fires together with the confirmation snackbar below.
      const pb = pendingBookingRef.current;
      if (pb) { bookOnCalendar(pb.appt, pb.data); pendingBookingRef.current = null; }
      // Confirmation snackbar (exact copy from the Figma Snackbar component).
      notify && notify("The Scheduled appointment has been successfully added to the calendar", "success");
      setState(prev => ({
        ...prev, contactOutcome: label, contactNote: note || null, nextAction, followUp: false,
        current: IDX.appointment, doneSteps: withDone(prev, "call"),
        summaries: { ...prev.summaries, call: `Connected · ${label}${noteSuffix}` },
        lastAction: { icon: "📅", label: `Call outcome: ${label}`, date: today() },
        log: pushLog(prev, `Call Attempt & Outcome → ${label}${noteSuffix}`),
      }));
      return;
    }
    // A different outcome was chosen — drop the un-committed booking (it was
    // never written to the calendar) and cancel any already-booked event.
    pendingBookingRef.current = null;
    if (state.appointment?.id) onCancelAppointment && onCancelAppointment(state.appointment.id);
    setState(prev => ({
      ...prev, contactOutcome: label, contactNote: note || null, appointment: null,
      negativeOutcome: NEGATIVE.has(v) ? true : prev.negativeOutcome,
      nextAction, followUp: false,
      outcome: v === "lost" ? "Lost" : v === "won" ? "Won" : prev.outcome,
      current: IDX.finish, doneSteps: withDone(prev, "call"),
      summaries: { ...prev.summaries, call: `Connected · ${label}${noteSuffix}` },
      lastAction: { icon: "🏁", label: `Call outcome: ${label}`, date: today() },
      log: pushLog(prev, `Call Attempt & Outcome → ${label}${noteSuffix} · sent to Finalize`),
    }));
  };

  // Follow Up — a deliberate pause. Recorded on Save & Continue: the lead becomes
  // "Follow Up · Waiting for Follow-Up" (Next Action: Resume follow-up) but the
  // stepper STAYS on the current step (it does not advance to Finalize and does not
  // open a modal). The advisor schedules the actual follow-up via Create Task.
  const onFollowUp = (fromKey, note = "") => {
    const title = STEPS[IDX[fromKey]].title;
    const noteSuffix = note ? ` — ${note}` : "";
    notify && notify("Marked as Follow Up — waiting for follow-up", "success");
    setState(prev => ({
      ...prev, followUp: true, nextAction: "Resume follow-up", contactNote: note || prev.contactNote,
      lastAction: { icon: "⏸️", label: "Follow Up — waiting for follow-up", date: today() },
      log: pushLog(prev, `${title} → Follow Up · Waiting for Follow-Up${noteSuffix}`),
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

  // Appointment outcomes that resolve to Finalize: Won / Not Interested / No
  // Suitable Solution / No Show. No Show keeps the lead's appointment status
  // ("No Show") but advances to Finalize without re-opening the scheduler.
  // Reschedule (re-open scheduler) and Follow Up (stay on step) are handled by
  // their own chip actions below.
  const onAppointmentOutcome = (v, label, note = "") => {
    const noteSuffix = note ? ` — ${note}` : "";
    const nextAction = NEXT_ACTION_FOR[v] || null;
    setState(prev => ({
      ...prev, apptOutcome: label, apptNote: note || null, current: IDX.finish, doneSteps: withDone(prev, "appointment"),
      negativeOutcome: NEGATIVE.has(v) ? true : prev.negativeOutcome, followUp: false,
      appointmentStatus: v === "noshow" ? "No Show" : prev.appointmentStatus,
      nextAction,
      outcome: v === "lost" ? "Lost" : v === "won" ? "Won" : prev.outcome,
      summaries: { ...prev.summaries, appointment: `${label}${noteSuffix}` },
      lastAction: { icon: NEGATIVE.has(v) ? "🏁" : "✅", label: `Appointment: ${label}`, date: today() },
      log: pushLog(prev, `Appointment Outcome → ${label}${noteSuffix}`),
    }));
  };

  // Reschedule — re-open the scheduler; the lead stays in Appointment.
  const onReschedule = () => {
    setState(prev => ({
      ...prev, reschedules: prev.reschedules + 1, appointmentStatus: "Rescheduled", nextAction: "Call to reschedule", followUp: false,
      lastAction: { icon: "🔁", label: "Appointment rescheduled — re-book", date: today() },
      log: pushLog(prev, "Appointment Outcome → Reschedule — re-opening scheduling"),
    }));
    setScheduleModalOpen(true);
  };

  const onToggleDnc = () => setState(prev => {
    const dnc = !prev.dnc;
    return { ...prev, dnc, log: pushLog(prev, `Do Not Contact → ${dnc ? "ON" : "OFF"}`) };
  });

  // Reaching the Finalize step marks the lead processed automatically — the
  // terminal Status already documents completion, so there is no manual button.
  const onProcess = () => {
    onLeadFinalized && onLeadFinalized();   // persist "finalized" so the Leads list shows "Add to Network"
    setState(prev => prev.finished ? prev : ({
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
    // Reopening the merged Call Attempt & Outcome step clears the reached/outcome
    // state and discards any booked appointment + reschedule history (the calendar
    // event itself is cancelled by the caller).
    if (idx <= IDX.call)        { patch.reached = false; patch.notReached = false; patch.calls = Math.max(0, prev.calls - 1); patch.contactOutcome = null; patch.contactNote = null; patch.appointment = null; patch.reschedules = 0; }
    if (idx <= IDX.appointment) { patch.apptOutcome = null; patch.apptNote = null; patch.negativeOutcome = false; patch.dnc = false; }
    patch.lastAction = { icon: "↩", label: `Reopened "${STEPS[idx].title}"`, date: today() };
    // Reopening a finalized lead pulls its result back out of the campaign stats.
    patch.log = pushLog(prev, `↩ Reopened "${STEPS[idx].title}" for correction${wasFinalized ? " · processing result retracted from campaign statistics" : ""}`);
    return patch;
  });

  const renderCurrentBody = (step) => {
    switch (step.key) {
      case "initial":     return <SendInitialMessageStep contact={contact} emailSent={emailSent} onSend={onSend} onSkip={onSkipInitial} onSendEmail={onSendEmail} />;
      case "call":        return (state.reached && !state.notReached)
                            ? <CallOutcomeStep appointment={state.appointment} followUp={state.followUp} onScheduleAppt={() => setScheduleModalOpen(true)} onFollowUp={(note) => onFollowUp("call", note)} onContinue={onContinueOutcome} />
                            : <CallAttemptsStep key={`ph-${state.calls}`} contact={contact} calls={state.calls} notReached={state.notReached} onLog={onLogCall} onSendEmail={onSendEmail} />;
      case "appointment": return <AppointmentOutcomeStep key={`ao-${state.reschedules}`} appointment={state.appointment} followUp={state.followUp} onComplete={onAppointmentOutcome} onReschedule={onReschedule} onFollowUp={(note) => onFollowUp("appointment", note)} />;
      case "finish": {
        // A lead can only be converted to a Network contact once its processing
        // outcome is "Won" (spec: conversion is gated on a won result). Super Admins
        // never convert; every other role converts only from a Won lead.
        const roleAllowed = role !== "superadmin";
        const wonOutcome  = state.outcome === "Won";
        return <FinalizeStep negativeOutcome={state.negativeOutcome} dnc={state.dnc} isContact={state.isContact} networkStatus={state.networkStatus}
          canConvert={roleAllowed && wonOutcome}
          convNotAllowedMsg={!roleAllowed ? t("fpConvNotAllowed") : t("fpConvOnlyWon")}
          onToggleDnc={onToggleDnc} onAddToNetwork={() => onApplyConvert([])} onBackToDashboard={() => navigateTo && navigateTo("Dashboard")} />;
      }
      default:            return null;
    }
  };

  // Locked (future) steps: those after the current one — empty once we've jumped
  // to Finalize. Completed rows come from the actually-visited steps.
  const future    = STEPS.slice(current + 1);
  const completed = state.doneSteps.map(k => STEPS.find(s => s.key === k)).filter(Boolean);

  // Single "Finalize Process" control lives in the header — enabled once the
  // advisor has reached the "Call Attempt & Outcome" step (not during the initial
  // message) and until the process is finalized.
  const canFinalize = !readOnly && !state.finished && current >= IDX.call && current < IDX.finish;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Header — the single Create Task and Finalize Process controls live here,
          not inside individual steps. */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 2 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: C.navy }}>{t("fpTitle")}</div>
          <div style={{ fontSize: 12.5, color: C.slate, marginTop: 2 }}>{t("fpSubtitle")}</div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button onClick={readOnly ? undefined : onCreateTask} disabled={readOnly} style={{
            display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 9,
            border: `1px solid ${C.border}`, background: "#fff", color: readOnly ? C.muted : C.slate,
            fontSize: 13, fontWeight: 600, cursor: readOnly ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: readOnly ? 0.6 : 1,
          }}>☑️ {t("fpCreateTask")}</button>
        </div>
      </div>
      {/* Network contacts have completed the lead process — the flow is read-only
          (their Outcome is edited from the contact's Status field, not here). */}
      {readOnly && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 12, border: `1px solid ${C.border}`, background: C.light, marginBottom: 2 }}>
          <span style={{ fontSize: 18 }}>🔒</span>
          <div style={{ fontSize: 12.5, color: C.slate, lineHeight: 1.5 }}>{t("fpReadOnly")}</div>
        </div>
      )}
      <div style={readOnly ? { pointerEvents: "none", opacity: 0.65, filter: "grayscale(0.2)" } : undefined} aria-disabled={readOnly}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {completed.map((s, i) => (
        <DoneStep key={s.key} num={stepNo(s.key)} title={stepTitleT(s.key, t)} summary={state.summaries[s.key]}
          editable={i === completed.length - 1 && !state.isContact} onReopen={() => setReopenTarget(s.key)} />
      ))}

      <CurrentStepShell num={stepNo(currentStep.key)} title={stepTitleT(currentStep.key, t)}>
        {renderCurrentBody(currentStep)}
      </CurrentStepShell>

      {future.map(s => s.key === "finish"
        ? <FinalizeStepRow key={s.key} num={stepNo(s.key)} title={stepTitleT(s.key, t)} canFinalize={canFinalize} onFinalize={() => onFinalizeNow(currentStep.key)} />
        : <LockedStep key={s.key} num={stepNo(s.key)} title={stepTitleT(s.key, t)} />)}
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
            if (current === IDX.call) {
              // From Call Attempt & Outcome → book but stay; advance with Continue.
              onBookForOutcome(appt, data);
            } else {
              // From Appointment Outcome (reschedule) → book the replacement.
              onRebook(appt, data);
            }
            setScheduleModalOpen(false);
          }}
        />
      )}

      {reopenTarget && (
        <ConfirmDialog
          title={t("fpReopenTitle")}
          message={<>
            <b>{stepTitleT(reopenTarget, t)}</b>
          </>}
          confirmLabel={t("fpReopenConfirm")}
          danger
          onCancel={() => setReopenTarget(null)}
          onConfirm={() => {
            // If the reopen discards a booked appointment, cancel its calendar
            // event too (and notify attendees, once that's wired server-side).
            if (IDX[reopenTarget] <= IDX.call && state.appointment?.id) {
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
