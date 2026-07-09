import React, { useState } from "react";
import { C } from "../../theme";

// ─────────────────────────────────────────────────────────────────────────────
// FEEDBACK & PROCESSING TAB
// A guided, bottom-to-top stepper that walks an advisor through everything that
// happens to a lead after it becomes a contact — from the first outreach to the
// final processing outcome. Completed steps collapse below the current one; the
// current step stays closest to the user (just above the automatic status log).
//
// Mirrors the reference flow: Initial Contact → Phone Contact Attempts →
// Schedule Appointment → Appointment Outcome → Business Outcome → Finish.
// ─────────────────────────────────────────────────────────────────────────────

const STEPS = [
  { key: "initial",     title: "Initial Contact" },
  { key: "phone",       title: "Phone Contact Attempts" },
  { key: "schedule",    title: "Schedule Appointment" },
  { key: "apptOutcome", title: "Appointment Outcome" },
  { key: "bizOutcome",  title: "Business Outcome" },
  { key: "finish",      title: "Finish Processing" },
];

// Short label shown as the "Feedback & Processing status" everywhere else.
export const FEEDBACK_STEP_LABEL = {
  initial:     "Initial Contact",
  phone:       "Phone Attempts",
  schedule:    "Scheduling",
  apptOutcome: "Appointment",
  bizOutcome:  "Business Outcome",
  finish:      "Finished",
};

const card = {
  background: "#fff", border: `1px solid ${C.border}`, borderRadius: 14,
};
const fieldStyle = {
  width: "100%", padding: "9px 12px", borderRadius: 8,
  border: `1px solid ${C.border}`, fontSize: 13, fontFamily: "inherit",
  color: C.text, boxSizing: "border-box" as const, outline: "none", background: "#fff",
};

const PrimaryBtn = ({ children, onClick, icon }: any) => (
  <button onClick={onClick} style={{
    display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 18px", borderRadius: 9,
    border: "none", background: C.navy, color: "#fff", fontSize: 13, fontWeight: 700,
    cursor: "pointer", fontFamily: "inherit",
  }}>{icon && <span>{icon}</span>}{children}</button>
);
const GhostBtn = ({ children, onClick, icon }: any) => (
  <button onClick={onClick} style={{
    display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 9,
    border: `1px solid ${C.border}`, background: "#fff", color: C.slate, fontSize: 13, fontWeight: 600,
    cursor: "pointer", fontFamily: "inherit",
  }}>{icon && <span>{icon}</span>}{children}</button>
);

// A future (locked) step — collapsed row with a lock icon.
const LockedStep = ({ title }) => (
  <div style={{ ...card, padding: "16px 18px", display: "flex", alignItems: "center", gap: 12, opacity: 0.7 }}>
    <span style={{ width: 22, height: 22, borderRadius: "50%", border: `1.5px solid ${C.border}`, display: "grid", placeItems: "center", fontSize: 11, color: C.muted, flexShrink: 0 }}>🔒</span>
    <span style={{ fontSize: 14, fontWeight: 600, color: C.muted }}>{title}</span>
  </div>
);

// A completed step — collapsed row with a check + short summary.
const DoneStep = ({ index, title, summary, onReopen }) => (
  <div style={{ ...card, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12, background: C.green + "08", borderColor: C.green + "40" }}>
    <span style={{ width: 22, height: 22, borderRadius: "50%", background: C.green, display: "grid", placeItems: "center", fontSize: 12, color: "#fff", flexShrink: 0 }}>✓</span>
    <div style={{ flex: 1, minWidth: 0 }}>
      <span style={{ fontSize: 14, fontWeight: 600, color: C.navy }}>{title}</span>
      {summary && <span style={{ fontSize: 12.5, color: C.slate, marginLeft: 8 }}>· {summary}</span>}
    </div>
    <button onClick={onReopen} title="Reopen this step" style={{ background: "none", border: "none", cursor: "pointer", color: C.slate, fontSize: 12, fontWeight: 600 }}>Edit</button>
  </div>
);

// The current step — expanded card with step-specific content.
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

// ── Step bodies ───────────────────────────────────────────────────────────────
const CHANNELS = [
  { key: "sms",      label: "SMS",      icon: "💬" },
  { key: "whatsapp", label: "WhatsApp", icon: "📱" },
  { key: "email",    label: "Email",    icon: "✉️" },
];
const CHANNEL_TEMPLATE = {
  sms:      "Hi {first}, this is {advisor} from Nordpfeil Finance. Thanks for your interest in a consultation — I'll try to reach you by phone shortly. Feel free to reply with a time that suits you best.",
  whatsapp: "Hello {first}! 👋 {advisor} here from Nordpfeil Finance. Great to connect — when would be a good moment for a short call about your request?",
  email:    "Dear {first},\n\nThank you for your interest in a consultation with Nordpfeil Finance. I'd be glad to walk you through the next steps. When would be a convenient time for a brief call?\n\nBest regards,\n{advisor}",
};

const InitialContactStep = ({ contact, onComplete }) => {
  const [channels, setChannels] = useState<string[]>(["sms"]);
  const [copied, setCopied] = useState(false);
  const primary = channels[0] || "sms";
  const first = (contact?.name || "there").replace(/^(Ms|Mr|Mrs|Dr)\.?\s+/i, "").split(" ")[0];
  const advisor = contact?.assignee || "your advisor";
  const template = (CHANNEL_TEMPLATE[primary] || "").replace(/{first}/g, first).replace(/{advisor}/g, advisor);
  const toggle = (k) => setChannels(prev => prev.includes(k) ? prev.filter(x => x !== k) : [...prev, k]);
  return (
    <>
      <div style={{ fontSize: 13, color: C.slate, marginBottom: 14 }}>Choose one or more communication methods and send the prepared template.</div>
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        {CHANNELS.map(ch => {
          const on = channels.includes(ch.key);
          return (
            <button key={ch.key} onClick={() => toggle(ch.key)} style={{
              display: "inline-flex", alignItems: "center", gap: 7, padding: "8px 14px", borderRadius: 9,
              border: `1.5px solid ${on ? C.navy : C.border}`, background: on ? C.navy + "0D" : "#fff",
              color: on ? C.navy : C.slate, fontSize: 13, fontWeight: on ? 700 : 500, cursor: "pointer", fontFamily: "inherit",
            }}>{ch.icon} {ch.label}</button>
          );
        })}
      </div>
      <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, background: C.light, padding: "14px 16px", marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: C.muted }}>{CHANNELS.find(c => c.key === primary)?.label} Template</span>
          <button onClick={() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", color: copied ? C.green : C.slate, fontSize: 12, fontWeight: 600 }}>
            {copied ? "✓ Copied" : "⧉ Copy message"}
          </button>
        </div>
        <div style={{ fontSize: 13, color: C.text, lineHeight: 1.55, whiteSpace: "pre-wrap" }}>{template}</div>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <GhostBtn icon="➤" onClick={() => onComplete("Sent externally")}>Send externally</GhostBtn>
        <PrimaryBtn icon="✓" onClick={() => onComplete(`Sent via ${channels.map(c => CHANNELS.find(x => x.key === c)?.label).join(", ")}`)}>Mark as Sent</PrimaryBtn>
      </div>
    </>
  );
};

const PhoneAttemptsStep = ({ onComplete }) => {
  const [attempts, setAttempts] = useState<{ n: number; result: string; time: string }[]>([]);
  const log = (result) => setAttempts(prev => [...prev, { n: prev.length + 1, result, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }]);
  return (
    <>
      <div style={{ fontSize: 13, color: C.slate, marginBottom: 14 }}>Log each call attempt. Mark <b>Reached</b> once the contact answers to continue.</div>
      {attempts.length > 0 && (
        <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, marginBottom: 16, overflow: "hidden" }}>
          {attempts.map(a => (
            <div key={a.n} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: C.muted, width: 60 }}>Attempt {a.n}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: a.result === "Reached" ? C.green : C.slate, flex: 1 }}>{a.result === "Reached" ? "📞 Reached" : "📵 Not reached"}</span>
              <span style={{ fontSize: 12, color: C.muted }}>{a.time}</span>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: "flex", gap: 10 }}>
        <GhostBtn icon="📵" onClick={() => log("Not reached")}>Log “Not reached”</GhostBtn>
        <PrimaryBtn icon="📞" onClick={() => { log("Reached"); onComplete(`Reached after ${attempts.length + 1} attempt${attempts.length ? "s" : ""}`); }}>Reached → Continue</PrimaryBtn>
      </div>
    </>
  );
};

const ScheduleStep = ({ onComplete }) => {
  const [type, setType] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const ready = type && date && time;
  return (
    <>
      <div style={{ fontSize: 13, color: C.slate, marginBottom: 14 }}>Book the consultation appointment with the contact.</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: C.navy, display: "block", marginBottom: 6 }}>Appointment Type *</label>
          <select value={type} onChange={e => setType(e.target.value)} style={{ ...fieldStyle, color: type ? C.text : C.muted }}>
            <option value="">Select type</option>
            <option>Consultation Appointment</option><option>Investment Talk</option><option>Finance Talk</option><option>Business Opening</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: C.navy, display: "block", marginBottom: 6 }}>Date *</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ ...fieldStyle, color: date ? C.text : C.muted }} />
        </div>
      </div>
      <div style={{ marginBottom: 18, maxWidth: "calc(50% - 7px)" }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: C.navy, display: "block", marginBottom: 6 }}>Time *</label>
        <input type="time" value={time} onChange={e => setTime(e.target.value)} style={{ ...fieldStyle, color: time ? C.text : C.muted }} />
      </div>
      <PrimaryBtn icon="📅" onClick={() => ready && onComplete(`${type} · ${date} ${time}`)}>Schedule Appointment</PrimaryBtn>
    </>
  );
};

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
      <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Add a short note (optional)…"
        style={{ ...fieldStyle, minHeight: 70, resize: "vertical", lineHeight: 1.5, marginBottom: 16 }} />
      <div>
        <PrimaryBtn icon="✓" onClick={() => choice && onComplete(opts.find(o => o.v === choice)?.label)}>Save & Continue</PrimaryBtn>
      </div>
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
        <PrimaryBtn icon="🏁" onClick={() => onComplete("Processing finished")}>Finish Processing</PrimaryBtn>
      </>
    )}
  </>
);

const OUTCOME_PROMPT = {
  apptOutcome: "How did the appointment go?",
  bizOutcome:  "What was the business outcome of the consultation?",
};

// ── Main tab ────────────────────────────────────────────────────────────────
export const FeedbackProcessingTab = ({ contact }) => {
  const [current, setCurrent] = useState(0);              // index into STEPS
  const [summaries, setSummaries] = useState<Record<string, string>>({});
  const [finished, setFinished] = useState(false);
  const [log, setLog] = useState<{ text: string; time: string }[]>([
    { text: "Lead assigned → status set to New", time: "12:58:29 PM" },
  ]);

  const complete = (stepKey, summary) => {
    setSummaries(prev => ({ ...prev, [stepKey]: summary }));
    setLog(prev => [...prev, { text: `${STEPS.find(s => s.key === stepKey)?.title} → ${summary}`, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) }]);
    const idx = STEPS.findIndex(s => s.key === stepKey);
    if (idx === STEPS.length - 1) setFinished(true);
    else setCurrent(idx + 1);
  };
  const reopen = (idx) => setCurrent(idx);

  const renderCurrentBody = (step) => {
    switch (step.key) {
      case "initial":  return <InitialContactStep contact={contact} onComplete={s => complete("initial", s)} />;
      case "phone":    return <PhoneAttemptsStep onComplete={s => complete("phone", s)} />;
      case "schedule": return <ScheduleStep onComplete={s => complete("schedule", s)} />;
      case "apptOutcome":
      case "bizOutcome": return <OutcomeStep stepKey={step.key} prompt={OUTCOME_PROMPT[step.key]} onComplete={s => complete(step.key, s)} />;
      case "finish":   return <FinishStep done={finished} onComplete={s => complete("finish", s)} />;
      default:         return null;
    }
  };

  // Future steps (above current, locked) rendered top→bottom; then current; then
  // completed steps (below), most-recent first; then the automatic status log.
  const future   = STEPS.slice(current + 1).reverse();
  const completed = STEPS.slice(0, current).reverse();
  const currentStep = STEPS[current];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontSize: 12.5, color: C.muted, marginBottom: 2 }}>
        Steps run from bottom to top — completed steps collapse below, the current step stays closest to you.
      </div>

      {future.map(s => <LockedStep key={s.key} title={s.title} />)}

      {(!finished || current === STEPS.length - 1) && (
        <CurrentStepShell index={current} title={currentStep.title}>
          {renderCurrentBody(currentStep)}
        </CurrentStepShell>
      )}

      {completed.map(s => (
        <DoneStep key={s.key} index={STEPS.findIndex(x => x.key === s.key)} title={s.title} summary={summaries[s.key]} onReopen={() => reopen(STEPS.findIndex(x => x.key === s.key))} />
      ))}

      {/* Automatic status log */}
      <div style={{ ...card, padding: "14px 18px", marginTop: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: C.muted, marginBottom: 12 }}>
          🕘 Automatic Status Log
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {log.map((l, i) => (
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
