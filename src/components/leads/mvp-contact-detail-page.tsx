import React, { useState, useMemo } from "react";
import { C } from "../../theme";
import { useT } from "../../lib/i18n";

// ─────────────────────────────────────────────────────────────────────────────
// MVP CONTACT DETAIL VIEW
// Left identity rail (shared) + tabbed content: Overview / Information /
// Activities / Documents.
// Quick actions: Send an Email · Schedule an Appointment · Create a Task · ⋮More
//   (More → Log a Call · Log an Email · Log on Appointment · Offline Log)
// ─────────────────────────────────────────────────────────────────────────────

const TABS = ["Overview", "Information", "Activities", "Documents"];
const LIFECYCLE_OPTS = ["Lead", "Opportunity", "Customer", "N/A"];
const STATUS_OPTS = ["New", "To Do", "Won", "N/A"];

const fieldStyle = {
  width: "100%", padding: "10px 12px", borderRadius: 8,
  border: `1px solid ${C.border}`, fontSize: 13, fontFamily: "inherit",
  color: C.text, boxSizing: "border-box", outline: "none", background: "#fff",
};
const placeholderSelect = { ...fieldStyle, color: C.muted };

const Card = ({ children, style }) => (
  <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 14, ...style }}>{children}</div>
);

// Changeable rating — click a star to set 1–5.
const Stars = ({ n = 2, onChange }) => (
  <span style={{ display: "inline-flex", gap: 1 }}>
    {[1, 2, 3, 4, 5].map(i => (
      <span key={i} onClick={() => onChange && onChange(i)} title={`${i} star${i > 1 ? "s" : ""}`}
        style={{ color: i <= n ? C.amber : C.border, fontSize: 16, cursor: onChange ? "pointer" : "default", lineHeight: 1 }}>★</span>
    ))}
  </span>
);

const Badge = ({ icon, label, color }) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, color, background: color + "14", padding: "4px 10px", borderRadius: 14 }}>
    {icon} {label}
  </span>
);

const AiTag = () => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, color: "#fff", background: "linear-gradient(90deg,#F0569B,#EC4899)", padding: "3px 9px", borderRadius: 12 }}>✦ AI</span>
);

const FileBadge = ({ type }) => {
  const map = { pdf: ["PDF", C.red], xlsx: ["XLS", C.green], jpg: ["IMG", C.amber], img: ["IMG", C.amber] };
  const [txt, col] = map[type] || ["DOC", C.slate];
  return <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 26, height: 30, borderRadius: 4, fontSize: 7, fontWeight: 800, color: "#fff", background: col }}>{txt}</span>;
};

const Label = ({ children }) => (
  <label style={{ fontSize: 13, fontWeight: 600, color: C.navy, display: "block", marginBottom: 6 }}>{children}</label>
);

const StageStatusRow = () => (
  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 18 }}>
    <div><Label>Lifecycle Stage</Label><select style={placeholderSelect} defaultValue=""><option value="">Select Lifecycle Stage</option>{LIFECYCLE_OPTS.map(o => <option key={o}>{o}</option>)}</select></div>
    <div><Label>Stage status</Label><select style={placeholderSelect} defaultValue=""><option value="">Select status</option>{STATUS_OPTS.map(o => <option key={o}>{o}</option>)}</select></div>
  </div>
);

// ── generic modal shell ───────────────────────────────────────────────────────
const ModalShell = ({ icon, title, width = 520, onClose, children }) => (
  <>
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", zIndex: 400 }} />
    <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width, maxWidth: "94vw", maxHeight: "92vh", overflowY: "auto", background: "#fff", borderRadius: 16, zIndex: 500, boxShadow: "0 24px 64px rgba(0,0,0,0.22)", padding: "20px 24px", fontFamily: "inherit" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18, color: C.slate }}>{icon}</span>
          <span style={{ fontSize: 18, fontWeight: 700, color: C.navy }}>{title}</span>
        </div>
        <div style={{ display: "flex", gap: 14, color: C.muted, fontSize: 18 }}>
          <span style={{ cursor: "pointer" }}>—</span>
          <span onClick={onClose} style={{ cursor: "pointer" }}>×</span>
        </div>
      </div>
      {children}
    </div>
  </>
);

const FooterBtns = ({ onClose, label, disabled, onAction }) => (
  <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
    <button onClick={onClose} style={{ padding: "9px 20px", borderRadius: 9, border: "none", background: "transparent", color: C.slate, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
    <button disabled={disabled} onClick={onAction || onClose} style={{ padding: "9px 28px", borderRadius: 9, border: "none", background: disabled ? C.border : C.primary, color: disabled ? C.muted : "#fff", fontSize: 13, fontWeight: 700, cursor: disabled ? "default" : "pointer" }}>{label}</button>
  </div>
);

// ── confirm dialog ────────────────────────────────────────────────────────────
const ConfirmModal = ({ title, message, confirmLabel = "Delete", onCancel, onConfirm }) => (
  <>
    <div onClick={onCancel} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", zIndex: 600 }} />
    <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 400, maxWidth: "92vw", background: "#fff", borderRadius: 16, zIndex: 700, boxShadow: "0 24px 64px rgba(0,0,0,0.22)", padding: "22px 24px", fontFamily: "inherit" }}>
      <div style={{ fontSize: 17, fontWeight: 700, color: C.navy, marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 13, color: C.slate, marginBottom: 22 }}>{message}</div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
        <button onClick={onCancel} style={{ padding: "9px 20px", borderRadius: 9, border: "none", background: "transparent", color: C.slate, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
        <button onClick={onConfirm} style={{ padding: "9px 24px", borderRadius: 9, border: "none", background: C.red, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>{confirmLabel}</button>
      </div>
    </div>
  </>
);

// ── Email composer ────────────────────────────────────────────────────────────
const EmailModal = ({ onClose }) => {
  const [schedule, setSchedule] = useState(true);
  const toolBtns = ["B", "I", "U", "⟸", "⟺", "⟹", "≔", "≕", "🖉", "T"];
  return (
    <ModalShell icon="✉️" title="Send an Email" width={640} onClose={onClose}>
      <div style={{ marginBottom: 14 }}>
        <Label>From *</Label>
        <select style={fieldStyle} defaultValue="someone@gmail.com"><option>someone@gmail.com</option><option>sales@vionworld.com</option></select>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 14 }}>
        <div><Label>To *</Label>
          <select style={placeholderSelect} defaultValue=""><option value="" disabled>Select recipient</option><option>Account/PC Email</option><option>Example@gmail.com</option><option>lana.steiner@email.com</option></select>
        </div>
        <div><Label>CC</Label>
          <select style={placeholderSelect} defaultValue=""><option value="" disabled>Select CC</option><option>someone@example.com</option><option>manager@vionworld.com</option></select>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 14 }}>
        <div><Label>Template</Label><select style={placeholderSelect} defaultValue=""><option value="">Select Template</option><option>Welcome Email</option><option>Follow-up</option></select></div>
        <div><Label>Attachment</Label><select style={placeholderSelect} defaultValue=""><option value="">Select Attachment</option><option>Product Brochure</option></select></div>
      </div>
      <div style={{ marginBottom: 14 }}><Label>Subject *</Label><input style={fieldStyle} placeholder="Subject" /></div>
      <div style={{ marginBottom: 16 }}>
        <Label>Body *</Label>
        <div style={{ border: `1.5px solid ${C.primary}`, borderRadius: 10, overflow: "hidden" }}>
          <div style={{ display: "flex", gap: 4, padding: "8px 10px", borderBottom: `1px solid ${C.border}`, color: C.slate, flexWrap: "wrap" }}>
            {toolBtns.map((b, i) => <span key={i} style={{ width: 26, height: 26, display: "grid", placeItems: "center", borderRadius: 6, fontSize: 13, cursor: "pointer" }}>{b}</span>)}
          </div>
          <textarea defaultValue="Email Text" style={{ width: "100%", border: "none", outline: "none", padding: "12px 14px", fontSize: 13, fontFamily: "inherit", minHeight: 90, resize: "vertical", boxSizing: "border-box" }} />
        </div>
      </div>
      <label style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 14, cursor: "pointer", fontSize: 14, fontWeight: 600, color: C.navy }}>
        <input type="checkbox" checked={schedule} onChange={e => setSchedule(e.target.checked)} style={{ width: 16, height: 16, accentColor: C.primary }} /> Schedule send
      </label>
      {schedule && (<>
        <Label>Select Date &amp; Time</Label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 18 }}>
          <input type="date" style={placeholderSelect} />
          <input type="time" style={placeholderSelect} />
        </div>
      </>)}
      {/* Lifecycle / Status at the bottom of the modal */}
      <StageStatusRow />
      <FooterBtns onClose={onClose} label="Send" />
    </ModalShell>
  );
};

// ── shared form controls (Task / Appointment) ────────────────────────────────
const Segmented = ({ options, value, onChange }) => (
  <div style={{ display: "flex", gap: 8 }}>
    {options.map(([key, label, icon]) => {
      const on = value === key;
      return (
        <button key={key} onClick={() => onChange(key)} style={{
          flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          padding: "9px 8px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: on ? 700 : 500,
          border: `1.5px solid ${on ? C.primary : C.border}`, background: on ? C.primarySoft : "#fff", color: on ? C.primaryDark : C.slate,
        }}>{icon && <span>{icon}</span>}{label}</button>
      );
    })}
  </div>
);

const ReminderBlock = () => {
  const [on, setOn] = useState(false);
  const [opt, setOpt] = useState("15 Minutes Before");
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 16, alignItems: "center" }}>
        <label style={{ display: "flex", alignItems: "center", gap: 9, cursor: "pointer", fontSize: 14, fontWeight: 600, color: C.navy }}>
          <input type="checkbox" checked={on} onChange={e => setOn(e.target.checked)} style={{ width: 16, height: 16, accentColor: C.primary }} /> Reminder
        </label>
        <select value={opt} onChange={e => setOpt(e.target.value)} style={fieldStyle}>
          {["15 Minutes Before", "30 Minutes Before", "1 Hour Before", "1 Day Before", "Custom"].map(o => <option key={o}>{o}</option>)}
        </select>
      </div>
      {opt === "Custom" && on && (
        <div style={{ marginTop: 12 }}>
          <Label>Remind me on</Label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <input type="date" style={placeholderSelect} /><input type="time" style={placeholderSelect} />
          </div>
        </div>
      )}
    </div>
  );
};

const RecurringBlock = () => {
  const [on, setOn] = useState(false);
  const [n, setN] = useState(1);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 18 }}>
      <label style={{ display: "flex", alignItems: "center", gap: 9, cursor: "pointer", fontSize: 14, fontWeight: 600, color: C.navy }}>
        <input type="checkbox" checked={on} onChange={e => setOn(e.target.checked)} style={{ width: 16, height: 16, accentColor: C.primary }} /> Recurring
      </label>
      {on && (<>
        <span style={{ fontSize: 13, color: C.slate }}>Every</span>
        <div style={{ display: "flex", alignItems: "center", border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
          <input value={n} onChange={e => setN(Number(e.target.value) || 1)} style={{ width: 46, border: "none", outline: "none", padding: "9px 10px", fontSize: 13, fontFamily: "inherit" }} />
          <div style={{ display: "flex", flexDirection: "column", borderLeft: `1px solid ${C.border}` }}>
            <button onClick={() => setN(v => v + 1)} style={{ border: "none", background: "#fff", cursor: "pointer", fontSize: 9, padding: "1px 7px", color: C.slate }}>▲</button>
            <button onClick={() => setN(v => Math.max(1, v - 1))} style={{ border: "none", borderTop: `1px solid ${C.border}`, background: "#fff", cursor: "pointer", fontSize: 9, padding: "1px 7px", color: C.slate }}>▼</button>
          </div>
        </div>
        <select style={{ ...fieldStyle, width: 130 }} defaultValue="Day"><option>Day</option><option>Week</option><option>Month</option></select>
      </>)}
    </div>
  );
};

// ── Task composer (Create a Task) ─────────────────────────────────────────────
const TaskModal = ({ onClose }) => {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("call");
  const [priority, setPriority] = useState("medium");
  return (
    <ModalShell icon="☑️" title="Create a Task" width={560} onClose={onClose}>
      <div style={{ marginBottom: 16 }}><Label>Title *</Label><input value={title} onChange={e => setTitle(e.target.value)} style={fieldStyle} placeholder="Title" /></div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.1fr", gap: 16, marginBottom: 16, alignItems: "end" }}>
        <div><Label>Contact *</Label><select style={placeholderSelect} defaultValue=""><option value="">Choose…</option><option>Sandra Richter</option><option>Markus Bauer</option></select></div>
        <div><Label>Type *</Label><Segmented value={type} onChange={setType} options={[["call", "Call", "📞"], ["email", "Email", "✉"], ["todo", "To Do", "☑"]]} /></div>
      </div>
      <div style={{ marginBottom: 16 }}>
        <Label>Priority *</Label>
        <Segmented value={priority} onChange={setPriority} options={[["low", "Low"], ["medium", "Medium"], ["high", "High"], ["urgent", "Urgent"]]} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div><Label>Date *</Label><input type="date" style={placeholderSelect} /></div>
        <div><Label>Time *</Label><input type="time" style={placeholderSelect} /></div>
      </div>
      <ReminderBlock />
      <RecurringBlock />
      <div style={{ marginBottom: 20 }}>
        <Label>Description</Label>
        <textarea style={{ ...fieldStyle, minHeight: 80, resize: "vertical", lineHeight: 1.5 }} placeholder="Description" />
      </div>
      <FooterBtns onClose={onClose} label="Save" disabled={!title.trim()} />
    </ModalShell>
  );
};

// ── Appointment composer (Schedule an Appointment) ────────────────────────────
const APPT_TYPES = ["Consultation Appointment", "Recruiting", "Business Opening", "Investment Talk", "Finance Talk", "Other"];
const AppointmentModal = ({ onClose }) => {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("Consultation Appointment");
  return (
    <ModalShell icon="📅" title="Schedule an Appointment" width={560} onClose={onClose}>
      <div style={{ marginBottom: 16 }}><Label>Title *</Label><input value={title} onChange={e => setTitle(e.target.value)} style={fieldStyle} placeholder="Title" /></div>
      <div style={{ marginBottom: 16 }}><Label>Contact *</Label><select style={placeholderSelect} defaultValue=""><option value="">Choose…</option><option>Sandra Richter</option><option>Markus Bauer</option></select></div>
      <div style={{ marginBottom: 16 }}><Label>Attendees</Label><select style={placeholderSelect} defaultValue=""><option value="">Choose…</option><option>olivia.ruth@email.com</option><option>john.smith@email.com</option></select></div>
      <div style={{ marginBottom: 16 }}>
        <Label>Type *</Label>
        <select value={type} onChange={e => setType(e.target.value)} style={fieldStyle}>{APPT_TYPES.map(o => <option key={o}>{o}</option>)}</select>
        {type === "Other" && <input style={{ ...fieldStyle, marginTop: 10 }} placeholder="Enter Appointment Type" />}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 16 }}>
        <div><Label>Date *</Label><input type="date" style={placeholderSelect} /></div>
        <div><Label>Start *</Label><input type="time" style={placeholderSelect} /></div>
        <div><Label>End *</Label><input type="time" style={placeholderSelect} /></div>
      </div>
      <div style={{ marginBottom: 16 }}><Label>Meeting Location / Link</Label><input style={fieldStyle} placeholder="Location or video link" /></div>
      <div style={{ marginBottom: 16 }}><Label>Attachment</Label><select style={placeholderSelect} defaultValue=""><option value="">Choose…</option><option>sample.pdf</option></select></div>
      <ReminderBlock />
      <div style={{ marginBottom: 20 }}>
        <Label>Description</Label>
        <textarea style={{ ...fieldStyle, minHeight: 80, resize: "vertical", lineHeight: 1.5 }} placeholder="Description" />
      </div>
      <FooterBtns onClose={onClose} label="Save" disabled={!title.trim()} />
    </ModalShell>
  );
};

// ── Log a Call ────────────────────────────────────────────────────────────────
const LogCallModal = ({ onClose }) => (
  <ModalShell icon="📞" title="Log a Call" width={720} onClose={onClose}>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
      <div><Label>Contact Name/Number *</Label>
        <div style={{ position: "relative" }}>
          <input style={{ ...fieldStyle, paddingRight: 32 }} placeholder="Select Contact Name/Number" />
          <span style={{ position: "absolute", right: 11, top: 10, color: C.muted }}>🔍</span>
        </div>
      </div>
      <div><Label>Call Direction *</Label><select style={placeholderSelect} defaultValue=""><option value="">Select Call Direction</option><option>Inbound</option><option>Outbound</option></select></div>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
      <div><Label>Call Status *</Label><select style={placeholderSelect} defaultValue=""><option value="">Select Status</option><option>Reached</option><option>Not Reached</option><option>Voicemail</option><option>Callback Requested</option></select></div>
      <div><Label>Call Duration *</Label>
        <div style={{ position: "relative" }}>
          <input style={{ ...fieldStyle, paddingRight: 40 }} placeholder="Call duration" />
          <span style={{ position: "absolute", right: 12, top: 11, color: C.muted, fontSize: 12 }}>min</span>
        </div>
      </div>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
      <div><Label>Date *</Label><input type="date" style={placeholderSelect} /></div>
      <div><Label>Time *</Label><input type="time" style={placeholderSelect} /></div>
    </div>
    <div style={{ marginBottom: 16 }}>
      <Label>Report Of Call *</Label>
      <textarea defaultValue="Report of call" style={{ ...fieldStyle, minHeight: 90, resize: "vertical", lineHeight: 1.5 }} />
    </div>
    <StageStatusRow />
    <FooterBtns onClose={onClose} label="Save" />
  </ModalShell>
);

// ── Log an Email ──────────────────────────────────────────────────────────────
const LogEmailModal = ({ onClose }) => (
  <ModalShell icon="✉️" title="Log an Email" width={720} onClose={onClose}>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
      <div><Label>Direction *</Label><select style={placeholderSelect} defaultValue=""><option value="">Select Direction</option><option>Sent</option><option>Received</option></select></div>
      <div><Label>Email Address *</Label><input style={fieldStyle} placeholder="name@example.com" /></div>
    </div>
    <div style={{ marginBottom: 16 }}><Label>Subject *</Label><input style={fieldStyle} placeholder="Subject" /></div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
      <div><Label>Date *</Label><input type="date" style={placeholderSelect} /></div>
      <div><Label>Time *</Label><input type="time" style={placeholderSelect} /></div>
    </div>
    <div style={{ marginBottom: 16 }}><Label>Email Report *</Label><textarea placeholder="What was discussed…" style={{ ...fieldStyle, minHeight: 90, resize: "vertical", lineHeight: 1.5 }} /></div>
    <StageStatusRow />
    <FooterBtns onClose={onClose} label="Save" />
  </ModalShell>
);

// ── Log on Appointment ────────────────────────────────────────────────────────
const LogAppointmentModal = ({ onClose }) => (
  <ModalShell icon="📅" title="Log on Appointment" width={720} onClose={onClose}>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
      <div><Label>Meeting Type *</Label><select style={placeholderSelect} defaultValue=""><option value="">Select Type</option>{APPT_TYPES.map(o => <option key={o}>{o}</option>)}</select></div>
      <div><Label>Meeting Outcome *</Label><select style={placeholderSelect} defaultValue=""><option value="">Select Outcome</option><option>Completed</option><option>No Show</option><option>Rescheduled</option><option>Cancelled</option></select></div>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 16 }}>
      <div><Label>Date *</Label><input type="date" style={placeholderSelect} /></div>
      <div><Label>Start *</Label><input type="time" style={placeholderSelect} /></div>
      <div><Label>End *</Label><input type="time" style={placeholderSelect} /></div>
    </div>
    <div style={{ marginBottom: 16 }}><Label>Meeting Report *</Label><textarea placeholder="Meeting report…" style={{ ...fieldStyle, minHeight: 90, resize: "vertical", lineHeight: 1.5 }} /></div>
    <StageStatusRow />
    <FooterBtns onClose={onClose} label="Save" />
  </ModalShell>
);

// ── Offline Log ───────────────────────────────────────────────────────────────
const OfflineLogModal = ({ onClose }) => (
  <ModalShell icon="ⓘ" title="Offline Log" width={720} onClose={onClose}>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
      <div><Label>Date *</Label><input type="date" style={placeholderSelect} /></div>
      <div><Label>Time *</Label><input type="time" style={placeholderSelect} /></div>
    </div>
    <div style={{ marginBottom: 16 }}>
      <Label>Note *</Label>
      <textarea placeholder="Note" style={{ ...fieldStyle, minHeight: 110, resize: "vertical", lineHeight: 1.5 }} />
    </div>
    <StageStatusRow />
    <FooterBtns onClose={onClose} label="Save" />
  </ModalShell>
);

// ── Add Note modal ────────────────────────────────────────────────────────────
const AddNoteModal = ({ onClose, onSave }) => {
  const [text, setText] = useState("");
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", zIndex: 400 }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 460, maxWidth: "92vw", background: "#fff", borderRadius: 16, zIndex: 500, boxShadow: "0 24px 64px rgba(0,0,0,0.22)", padding: "22px 24px", fontFamily: "inherit" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.navy }}>Add Note</div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: C.muted }}>×</button>
        </div>
        <div style={{ fontSize: 13, color: C.slate, marginBottom: 16 }}>Visible only to you. You can edit or delete it later.</div>
        <Label>Note</Label>
        <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Type something" autoFocus
          style={{ ...fieldStyle, minHeight: 120, resize: "vertical", lineHeight: 1.5, marginBottom: 20 }} />
        <FooterBtns onClose={onClose} label="Save" disabled={!text.trim()} onAction={() => { onSave(text.trim()); onClose(); }} />
      </div>
    </>
  );
};

// ── pseudo QR + Scan QR Code modal ────────────────────────────────────────────
const QRCode = ({ size = 190 }) => {
  const n = 25, cell = size / n, rects = [];
  let seed = 7;
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  const finder = (r, c, R, Cc) => { const rr = r - R, cc = c - Cc; if (rr < 0 || cc < 0 || rr > 6 || cc > 6) return null; const ring = rr === 0 || rr === 6 || cc === 0 || cc === 6; const ctr = rr >= 2 && rr <= 4 && cc >= 2 && cc <= 4; return ring || ctr; };
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    const f = finder(r, c, 0, 0) ?? finder(r, c, 0, n - 7) ?? finder(r, c, n - 7, 0);
    const on = f != null ? f : rnd() > 0.5;
    if (on) rects.push(<rect key={`${r}-${c}`} x={c * cell} y={r * cell} width={cell} height={cell} fill="#111" />);
  }
  return <svg width={size} height={size} shapeRendering="crispEdges">{rects}</svg>;
};

const ScanQRModal = ({ onClose }) => {
  const Corner = (pos) => {
    const base = { position: "absolute", width: 22, height: 22, borderColor: C.border, borderStyle: "solid" };
    const m = { tl: { top: -6, left: -6, borderWidth: "2px 0 0 2px" }, tr: { top: -6, right: -6, borderWidth: "2px 2px 0 0" }, bl: { bottom: -6, left: -6, borderWidth: "0 0 2px 2px" }, br: { bottom: -6, right: -6, borderWidth: "0 2px 2px 0" } }[pos];
    return <span style={{ ...base, ...m }} />;
  };
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", zIndex: 400 }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 480, maxWidth: "92vw", background: "#fff", borderRadius: 16, zIndex: 500, boxShadow: "0 24px 64px rgba(0,0,0,0.22)", padding: "22px 24px", fontFamily: "inherit" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.navy }}>Scan QR Code</div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: C.muted }}>×</button>
        </div>
        <div style={{ fontSize: 13, color: C.slate, marginBottom: 22 }}>Scan the QR code to open the secure document upload page.</div>
        <div style={{ display: "grid", placeItems: "center", marginBottom: 24 }}>
          <div style={{ position: "relative", padding: 14, borderRadius: 8 }}>
            {Corner("tl")}{Corner("tr")}{Corner("bl")}{Corner("br")}
            <QRCode size={190} />
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "9px 20px", borderRadius: 9, border: "none", background: "transparent", color: C.slate, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Close</button>
        </div>
      </div>
    </>
  );
};

// ── Labels picker (popover) — orange only; "Add Label" appears for a new entry ─
const LabelsPicker = ({ selected, options, onToggle, onAddLabel, onClose }) => {
  const [q, setQ] = useState("");
  const ql = q.trim();
  const list = options.filter(l => l.toLowerCase().includes(ql.toLowerCase()));
  const exact = options.some(l => l.toLowerCase() === ql.toLowerCase());
  const showAdd = ql.length > 0 && !exact;
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 250 }} />
      <div style={{ position: "absolute", bottom: "calc(100% + 8px)", left: 0, zIndex: 260, width: 230, background: "#fff", borderRadius: 12, boxShadow: "0 12px 36px rgba(0,0,0,0.18)", border: `1px solid ${C.border}`, padding: "10px 0" }}>
        <div style={{ position: "relative", padding: "0 12px 8px" }}>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search" style={{ ...fieldStyle, padding: "8px 30px 8px 10px" }} />
          <span style={{ position: "absolute", right: 22, top: 8, color: C.muted, fontSize: 13 }}>🔍</span>
        </div>
        <div style={{ maxHeight: 180, overflowY: "auto" }}>
          {list.map(l => (
            <label key={l} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", cursor: "pointer", fontSize: 13, color: C.text }}
              onMouseEnter={e => e.currentTarget.style.background = "#F8FAFC"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <input type="checkbox" checked={selected.includes(l)} onChange={() => onToggle(l)} style={{ width: 15, height: 15, accentColor: C.primary }} />
              {l}
            </label>
          ))}
          {list.length === 0 && !showAdd && <div style={{ padding: "10px 14px", fontSize: 12, color: C.muted }}>No labels found.</div>}
        </div>
        {showAdd && (
          <div onClick={() => { onAddLabel(ql); setQ(""); }} style={{ borderTop: `1px solid ${C.border}`, padding: "11px 14px", display: "flex", alignItems: "center", gap: 7, fontSize: 13, fontWeight: 700, color: C.primary, cursor: "pointer" }}
            onMouseEnter={e => e.currentTarget.style.background = "#F8FAFC"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            ＋ Add Label “{ql}”
          </div>
        )}
      </div>
    </>
  );
};

// ── Follow-up donut ───────────────────────────────────────────────────────────
const Donut = ({ value = 3, total = 5 }) => {
  const r = 46, circ = 2 * Math.PI * r, pct = value / total;
  return (
    <svg width={120} height={120} viewBox="0 0 120 120">
      <circle cx={60} cy={60} r={r} fill="none" stroke={C.border} strokeWidth={12} />
      <circle cx={60} cy={60} r={r} fill="none" stroke={C.primary} strokeWidth={12} strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)} transform="rotate(-90 60 60)" />
      <text x={60} y={56} textAnchor="middle" fontSize={24} fontWeight={700} fill={C.navy}>{value}/{total}</text>
      <text x={60} y={74} textAnchor="middle" fontSize={10} fill={C.muted}>Call Attempts</text>
    </svg>
  );
};

// ── identity rail ─────────────────────────────────────────────────────────────
const InfoRow = ({ icon, label, value }) => (
  <div style={{ display: "flex", gap: 11, alignItems: "flex-start", marginBottom: 14 }}>
    <span style={{ fontSize: 14, color: C.muted, width: 18, textAlign: "center", flexShrink: 0 }}>{icon}</span>
    <div>
      <div style={{ fontSize: 11, color: C.muted }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginTop: 1 }}>{value}</div>
    </div>
  </div>
);

const IdentityRail = ({ c, onEmail, onTask, onAppointment, onLogCall, onLogEmail, onLogAppt, onOffline }) => {
  const [gdpr, setGdpr] = useState(true);
  const [rating, setRating] = useState(2);
  const [labels, setLabels] = useState(["Label 1"]);
  const [options, setOptions] = useState(["Test 1", "Do Not Call", "Callback Set", "Friend", "Friend1"]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const toggle = (l) => setLabels(prev => prev.includes(l) ? prev.filter(x => x !== l) : [...prev, l]);
  const addLabel = (l) => { setOptions(prev => prev.includes(l) ? prev : [...prev, l]); setLabels(prev => prev.includes(l) ? prev : [...prev, l]); };

  // Action icons use a single muted tone (kept visually light, per design).
  const Action = ({ icon, title, onClick }) => (
    <span title={title} onClick={onClick} style={{ cursor: "pointer", color: C.slate, fontSize: 16 }}>{icon}</span>
  );

  return (
    <Card style={{ padding: "20px 18px", alignSelf: "start" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 13, marginBottom: 14 }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: C.indigo, color: "#fff", display: "grid", placeItems: "center", fontSize: 20, fontWeight: 700, flexShrink: 0 }}>
          {c.name.split(" ").slice(-2).map(w => w[0]).join("").toUpperCase()}
        </div>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: C.navy }}>{c.name}</div>
          <div style={{ marginTop: 3 }}><Stars n={rating} onChange={setRating} /></div>
        </div>
      </div>

      {/* GDPR is a clickable enable/disable toggle */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <button onClick={() => setGdpr(g => !g)} title="Click to enable/disable GDPR consent"
          style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, cursor: "pointer", border: "none", fontFamily: "inherit",
            color: gdpr ? C.green : C.red, background: (gdpr ? C.green : C.red) + "14", padding: "4px 10px", borderRadius: 14 }}>
          {gdpr ? "🛡 GDPR" : "⛔ GDPR Off"}
        </button>
        <Badge icon="✉" label="Subscribed" color={C.blue} />
      </div>

      {/* Actions: Send an Email · Schedule an Appointment · Create a Task · More */}
      <div style={{ display: "flex", gap: 16, paddingBottom: 14, borderBottom: `1px solid ${C.border}`, marginBottom: 16, alignItems: "center" }}>
        <Action icon="✉️" title="Send an Email" onClick={onEmail} />
        <Action icon="📅" title="Schedule an Appointment" onClick={onAppointment} />
        <Action icon="☑️" title="Create a Task" onClick={onTask} />
        <span style={{ position: "relative" }}>
          <span title="More" onClick={() => setMoreOpen(o => !o)} style={{ cursor: "pointer", color: C.slate, fontSize: 16 }}>⋯</span>
          {moreOpen && (
            <>
              <div onClick={() => setMoreOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 250 }} />
              <div style={{ position: "absolute", top: 24, left: 0, zIndex: 260, background: "#fff", borderRadius: 10, boxShadow: "0 8px 28px rgba(0,0,0,0.16)", border: `1px solid ${C.border}`, minWidth: 170, padding: "5px 0" }}>
                {[["Log a Call", onLogCall], ["Log an Email", onLogEmail], ["Log on Appointment", onLogAppt], ["Offline Log", onOffline]].map(([label, fn]) => (
                  <div key={label} onClick={() => { setMoreOpen(false); fn(); }} style={{ padding: "9px 14px", fontSize: 13, color: C.text, cursor: "pointer", fontWeight: 500, whiteSpace: "nowrap" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#F8FAFC"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>{label}</div>
                ))}
              </div>
            </>
          )}
        </span>
      </div>

      <InfoRow icon="✉" label="Email" value={c.email} />
      <InfoRow icon="📞" label="Phone" value={c.phone} />
      <InfoRow icon="👤" label="Assignee" value={c.assignee} />
      <InfoRow icon="📈" label="Lifecycle Stage" value={c.lifecycle} />
      <InfoRow icon="◎" label="Stage Status" value={c.stageStatus} />
      <InfoRow icon="🔗" label="Lead Source" value={c.source} />
      <InfoRow icon="📣" label="Campaign Assignment" value={c.campaign} />

      <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 14 }}>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>Labels</div>
        <div style={{ position: "relative", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {labels.map(l => (
            <span key={l} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: C.primaryDark, background: C.primarySoft, padding: "5px 10px", borderRadius: 8 }}>
              {l} <span onClick={() => toggle(l)} style={{ cursor: "pointer" }}>×</span>
            </span>
          ))}
          <span onClick={() => setPickerOpen(o => !o)} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: C.slate, border: `1px dashed ${C.border}`, padding: "5px 10px", borderRadius: 8, cursor: "pointer" }}>＋ Add</span>
          {pickerOpen && <LabelsPicker selected={labels} options={options} onToggle={toggle} onAddLabel={addLabel} onClose={() => setPickerOpen(false)} />}
        </div>
      </div>
    </Card>
  );
};

// ── Overview tab ──────────────────────────────────────────────────────────────
const OverviewTab = ({ showInsights = true }) => {
  const [addNote, setAddNote] = useState(false);
  const [delId, setDelId] = useState(null);
  const [notes, setNotes] = useState([
    { id: "n1", stage: "Prospect",   dur: "3 days",  active: true, date: "04.03.2026 - 10:00" },
    { id: "n2", stage: "In Progress",dur: "18 days", done: true,   date: "04.03.2026 - 10:00" },
    { id: "n3", text: "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor…", note: true, date: "04.03.2026 - 10:00" },
    { id: "n4", text: "It's a short note.", note: true, date: "04.03.2026 - 10:00" },
    { id: "n5", stage: "New", done: true, created: "Anna Muller", source: "Landing Page", campaign: "Webinar – Q1 2026", date: "04.03.2026 - 10:00" },
  ]);
  const addNoteItem = (text) => setNotes(prev => [{ id: `n-${Date.now()}`, text, note: true, date: "Today - now" }, ...prev]);
  const Dot = ({ color }) => <span style={{ width: 14, height: 14, borderRadius: "50%", background: color, border: `3px solid ${color}33`, flexShrink: 0, zIndex: 1 }} />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1.7fr 1fr", gap: 16, alignItems: "start" }}>
        <Card style={{ padding: "18px 20px" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.navy, marginBottom: 8, display: "flex", alignItems: "center", gap: 4 }}>Follow Up <InfoTip text="Scheduled reminder to reconnect with this contact. Helps ensure no lead falls through the cracks." /></div>
          <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
            <Donut value={3} total={5} />
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: C.muted }}>Last Action</span>
                <span style={{ fontSize: 12, color: C.muted }}>04.03.2026 - 10:00</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, fontSize: 14, fontWeight: 600, color: C.text }}>
                <span style={{ width: 26, height: 26, borderRadius: 7, background: C.light, display: "grid", placeItems: "center" }}>📞</span>
                Phone Call - Not Reached
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: C.muted }}>Next Best Action</span><AiTag />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 600, color: C.text }}>
                <span style={{ width: 26, height: 26, borderRadius: 7, background: C.light, display: "grid", placeItems: "center" }}>✉️</span>
                Send an Email
              </div>
            </div>
          </div>
        </Card>

        <Card style={{ padding: "18px 20px" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.navy, marginBottom: 14 }}>Advisory Documents</div>
          {[["🎯", "Wishes & Goals"], ["💡", "Concept File"], ["📄", "Financing Application"]].map(([icon, label]) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 0", borderBottom: `1px solid ${C.border}`, cursor: "pointer" }}>
              <span style={{ fontSize: 15, color: C.muted }}>{icon}</span>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: C.text }}>{label}</span>
              <span style={{ color: C.muted }}>→</span>
            </div>
          ))}
        </Card>
      </div>

      {showInsights && (
      <Card style={{ padding: "16px 20px", border: `1px solid ${C.primary}55`, background: "linear-gradient(180deg,#FFFBF5,#fff)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>AI Insight</span><AiTag /></div>
          <span style={{ fontSize: 12, color: C.muted }}>↺ Updated on 13 Jan 2026 - 10:00</span>
        </div>
        <ul style={{ margin: "0 0 12px", paddingLeft: 18, fontSize: 13, color: C.text, lineHeight: 1.6 }}>
          <li><b>Upcoming Task:</b> A task was created on May 27, 2026, to follow up with Brian next Tuesday at 4 PM about cupcake models and specifications.<br /><span style={{ color: C.muted }}>suggested action: ensure the task is completed on time.</span></li>
          <li style={{ marginTop: 6 }}><b>Latest Email:</b> An email sent on May 25, 2026, introduced the cupcake supply offerings and invited further discussion.<br /><span style={{ color: C.muted }}>suggested action: review the email response and plan next outreach.</span></li>
        </ul>
        <div style={{ display: "flex", gap: 14, color: C.muted, fontSize: 15 }}>
          <span style={{ cursor: "pointer" }}>👍</span><span style={{ cursor: "pointer" }}>👎</span><span style={{ cursor: "pointer" }}>⧉</span>
        </div>
      </Card>
      )}

      <Card style={{ padding: "18px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>Journey Pipeline</div>
          <button onClick={() => setAddNote(true)} style={{ padding: "7px 14px", borderRadius: 8, border: `1px solid ${C.primary}`, background: "#fff", color: C.primaryDark, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>＋ Add Note</button>
        </div>
        <div style={{ position: "relative", paddingLeft: 8 }}>
          <div style={{ position: "absolute", left: 14, top: 6, bottom: 6, width: 2, background: C.border }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {notes.map(n => (
              <div key={n.id} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <Dot color={n.active ? C.blue : n.done ? C.green : C.amber} />
                <div style={{ flex: 1, border: `1px solid ${n.active ? C.blue : C.border}`, borderRadius: 10, padding: "12px 16px", background: n.note ? C.primarySoft : "#fff" }}>
                  {n.stage && !n.created && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: n.active ? C.blue : C.text }}>{n.stage}</span>
                        <span style={{ fontSize: 11, color: C.slate, background: C.light, padding: "2px 9px", borderRadius: 12 }}>{n.dur}</span>
                      </span>
                      <span style={{ fontSize: 12, color: C.muted }}>{n.date}</span>
                    </div>
                  )}
                  {n.note && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                        <span style={{ width: 26, height: 26, borderRadius: "50%", background: C.indigo, flexShrink: 0 }} />
                        <span style={{ fontSize: 13, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.text}</span>
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                        <span style={{ color: C.slate, cursor: "pointer" }}>✎</span>
                        <span onClick={() => setDelId(n.id)} title="Delete note" style={{ color: C.slate, cursor: "pointer" }}>🗑</span>
                        <span style={{ fontSize: 12, color: C.muted }}>{n.date}</span>
                      </span>
                    </div>
                  )}
                  {n.created && (<>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{n.stage}</span>
                      <span style={{ fontSize: 12, color: C.muted }}>{n.date}</span>
                    </div>
                    <div style={{ display: "flex", gap: 40 }}>
                      {[["Created by", n.created], ["Lead Source", n.source], ["Campaign Assignment", n.campaign]].map(([k, v]) => (
                        <div key={k}>
                          <div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>{k}</div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{v}</div>
                        </div>
                      ))}
                    </div>
                  </>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {addNote && <AddNoteModal onClose={() => setAddNote(false)} onSave={addNoteItem} />}
      {delId && (
        <ConfirmModal title="Delete note?" message="This note will be permanently removed. This action cannot be undone."
          onCancel={() => setDelId(null)} onConfirm={() => { setNotes(prev => prev.filter(x => x.id !== delId)); setDelId(null); }} />
      )}
    </div>
  );
};

// ── Information tab ───────────────────────────────────────────────────────────
const InfoField = ({ label, value, node }) => (
  <div style={{ marginBottom: 22 }}>
    <div style={{ fontSize: 12, color: C.muted, marginBottom: 5 }}>{label}</div>
    {node || <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{value}</div>}
  </div>
);

// Tooltip icon shown inline next to field labels
const InfoTip = ({ text }) => {
  const [show, setShow] = React.useState(false);
  return (
    <span style={{ position: "relative", display: "inline-flex" }}
      onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      <span style={{ fontSize: 12, color: C.muted, cursor: "help", marginLeft: 4 }}>ⓘ</span>
      {show && (
        <div style={{
          position: "absolute", bottom: "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)",
          background: C.navy, color: "#fff", fontSize: 11, fontWeight: 500, lineHeight: 1.4,
          padding: "7px 10px", borderRadius: 8, whiteSpace: "nowrap", maxWidth: 260, zIndex: 999,
          boxShadow: "0 4px 16px rgba(0,0,0,0.2)", pointerEvents: "none",
        }}>{text}</div>
      )}
    </span>
  );
};

// Shared input style for edit mode
const editInputStyle = {
  width: "100%", padding: "7px 10px", borderRadius: 7,
  border: `1.5px solid #CBD5E1`, fontSize: 13, fontFamily: "inherit",
  color: "#1E293B", boxSizing: "border-box" as const, outline: "none", background: "#fff",
};
const editSelectStyle = { ...editInputStyle, appearance: "none" as const };

// EditField — shows a plain text value in view mode, an input in edit mode
const EditField = ({ label, value, onChange, editing, type = "text", children = null }: any) => (
  <div style={{ marginBottom: 22 }}>
    <div style={{ fontSize: 12, color: C.muted, marginBottom: 5 }}>{label}</div>
    {editing
      ? (children || <input type={type} value={value ?? ""} onChange={e => onChange(e.target.value)}
          style={{ ...editInputStyle, borderColor: "#94A3B8" }} />)
      : <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{value || "—"}</div>}
  </div>
);

const InformationTab = ({ c }) => {
  const t = useT();
  const [subIdx, setSubIdx] = useState(0);
  const SUBS = [t("basicTab"), t("personalTab"), t("addressTab"), t("businessTab"), t("financialTab")];
  const [first, ...rest] = c.name.replace(/^(Ms|Mr|Mrs|Dr)\.?\s+/i, "").split(" ");

  // Editable data — seeded from contact prop
  const initial = {
    firstName: first, lastName: rest.join(" ") || "",
    email: c.email || "", phone: c.phone || "",
    lifecycle: c.lifecycle || "Lead", stageStatus: c.stageStatus || "New",
    assignee: c.assignee || "", product: "Product #1", productProvider: "Product Provider #1",
    source: c.source || "", campaign: c.campaign || "",
    gdprConsent: true, gdprDate: "01.01.2026", newsletter: false, newsletterDate: "",
    salutation: "Mr.", dob: c.dob || "", gender: "Male", nationality: "German", language: "German",
    street: "Musterstraße", houseNo: "12", zip: "10115", city: "Berlin", country: "Germany",
    company: "Example GmbH", employment: "Employed", position: "Manager",
    companySize: "51–200", decisionRole: "Decision Maker", industry: "Finance",
    income: "€ 80,000", netWorth: "€ 250,000", risk: "Balanced", horizon: "Medium (3–7y)",
  };
  const [saved, setSaved]   = useState(initial);
  const [draft, setDraft]   = useState(initial);
  const [editing, setEditing] = useState(false);
  const [discardModal, setDiscardModal] = useState(false);

  const set = (k) => (v) => setDraft(p => ({ ...p, [k]: v }));

  const handleEdit   = () => { setDraft(saved); setEditing(true); };
  const handleUpdate = () => { setSaved(draft); setEditing(false); };
  const handleCancel = () => setDiscardModal(true);
  const handleDiscard = () => { setDraft(saved); setEditing(false); setDiscardModal(false); };

  const G2 = ({ children }) => <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 60px" }}>{children}</div>;

  return (
    <>
    <Card style={{ padding: "18px 22px" }}>
      {/* Sub-tab bar + action buttons */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
        <div style={{ display: "flex", gap: 6 }}>
          {SUBS.map((s, i) => (
            <button key={s} onClick={() => setSubIdx(i)} style={{
              padding: "7px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontFamily: "inherit",
              fontSize: 13, fontWeight: subIdx === i ? 700 : 500, color: subIdx === i ? C.primaryDark : C.slate,
              background: subIdx === i ? C.primarySoft : "transparent",
            }}>{s}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {editing ? (<>
            <button onClick={handleCancel}
              style={{ padding: "7px 16px", borderRadius: 8, border: `1px solid ${C.border}`, background: "#fff", color: C.slate, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              Cancel
            </button>
            <button onClick={handleUpdate}
              style={{ padding: "7px 18px", borderRadius: 8, border: "none", background: C.primary, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              Update
            </button>
          </>) : (
            <button onClick={handleEdit}
              style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: C.primaryDark, fontSize: 13, fontWeight: 700 }}>
              ✎ Edit
            </button>
          )}
        </div>
      </div>

      {/* Basic */}
      {subIdx === 0 && (
        <G2>
          <EditField label={t("firstName")} value={draft.firstName} onChange={set("firstName")} editing={editing} />
          <EditField label={t("lastName")} value={draft.lastName} onChange={set("lastName")} editing={editing} />
          <EditField label={t("email")} value={draft.email} onChange={set("email")} editing={editing} type="email" />
          <EditField label={t("phone")} value={draft.phone} onChange={set("phone")} editing={editing} />
          <EditField label={<>{t("lifecycleStage")} <InfoTip text={t("tooltip_lifecycle")} /></>} value={draft.lifecycle} editing={editing} onChange={set("lifecycle")}>
            {editing && <select value={draft.lifecycle} onChange={e => set("lifecycle")(e.target.value)} style={editSelectStyle}>
              {["Lead","Opportunity","Customer","N/A"].map(o => <option key={o}>{o}</option>)}
            </select>}
          </EditField>
          <EditField label={<>{t("stageStatus")} <InfoTip text={t("tooltip_status")} /></>} value={draft.stageStatus} editing={editing} onChange={set("stageStatus")}>
            {editing && <select value={draft.stageStatus} onChange={e => set("stageStatus")(e.target.value)} style={editSelectStyle}>
              {["New","To Do","Won","N/A"].map(o => <option key={o}>{o}</option>)}
            </select>}
          </EditField>
          <EditField label={t("assignee")} value={draft.assignee} onChange={set("assignee")} editing={false} />
          <div />
          <EditField label={t("product")} value={draft.product} onChange={set("product")} editing={editing} />
          <EditField label={t("productProvider")} value={draft.productProvider} onChange={set("productProvider")} editing={editing} />
          <EditField label={t("leadSource")} value={draft.source} onChange={set("source")} editing={editing} />
          <EditField label={t("campaignAssignment")} value={draft.campaign} onChange={set("campaign")} editing={editing} />
          {/* GDPR */}
          <div style={{ marginBottom: 22 }}>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 5 }}>{t("communicationConsent")}</div>
            {editing ? (<>
              <div style={{ display: "flex", gap: 20, marginBottom: draft.gdprConsent ? 8 : 0 }}>
                {[["Yes", true], ["No", false]].map(([l, v]) => (
                  <label key={l} style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer", fontSize: 13 }}>
                    <input type="radio" checked={draft.gdprConsent === v} onChange={() => setDraft(p => ({ ...p, gdprConsent: v, gdprDate: v ? p.gdprDate : "" }))} style={{ accentColor: C.primary }} /> {l}
                  </label>
                ))}
              </div>
              {draft.gdprConsent && <input type="date" value={draft.gdprDate} onChange={e => set("gdprDate")(e.target.value)} style={{ ...editInputStyle, borderColor: "#94A3B8" }} />}
            </>) : (
              draft.gdprConsent
                ? <div style={{ fontSize: 14, fontWeight: 600, color: C.green }}>✓ {draft.gdprDate || "—"}</div>
                : <div style={{ fontSize: 14, fontWeight: 600, color: C.muted }}>✕ No consent</div>
            )}
          </div>
          {/* Newsletter */}
          <div style={{ marginBottom: 22 }}>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 5 }}>{t("newsletterSubscription")}</div>
            {editing ? (<>
              <div style={{ display: "flex", gap: 20, marginBottom: draft.newsletter ? 8 : 0 }}>
                {[["Subscribed", true], ["Not subscribed", false]].map(([l, v]) => (
                  <label key={l} style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer", fontSize: 13 }}>
                    <input type="radio" checked={draft.newsletter === v} onChange={() => setDraft(p => ({ ...p, newsletter: v, newsletterDate: v ? p.newsletterDate : "" }))} style={{ accentColor: C.primary }} /> {l}
                  </label>
                ))}
              </div>
              {draft.newsletter && <input type="date" value={draft.newsletterDate} onChange={e => set("newsletterDate")(e.target.value)} style={{ ...editInputStyle, borderColor: "#94A3B8" }} />}
            </>) : (
              draft.newsletter
                ? <div style={{ fontSize: 14, fontWeight: 600, color: C.green }}>✓ {draft.newsletterDate || "—"}</div>
                : <span style={{ fontSize: 12, fontWeight: 600, color: C.slate, background: C.light, padding: "4px 10px", borderRadius: 12 }}>✕ No</span>
            )}
          </div>
        </G2>
      )}

      {/* Personal */}
      {subIdx === 1 && (
        <G2>
          <EditField label={t("salutation")} value={draft.salutation} editing={editing} onChange={set("salutation")}>
            {editing && <select value={draft.salutation} onChange={e => set("salutation")(e.target.value)} style={editSelectStyle}>
              {["Mr.","Ms.","Mrs.","Dr."].map(o => <option key={o}>{o}</option>)}
            </select>}
          </EditField>
          <EditField label={t("dob")} value={draft.dob} editing={editing} onChange={set("dob")} type="date" />
          <EditField label={t("gender")} value={draft.gender} editing={editing} onChange={set("gender")}>
            {editing && <select value={draft.gender} onChange={e => set("gender")(e.target.value)} style={editSelectStyle}>
              {["Male","Female","Diverse","N/A"].map(o => <option key={o}>{o}</option>)}
            </select>}
          </EditField>
          <EditField label={t("nationality")} value={draft.nationality} editing={editing} onChange={set("nationality")} />
          <EditField label={t("preferredLanguage")} value={draft.language} editing={editing} onChange={set("language")}>
            {editing && <select value={draft.language} onChange={e => set("language")(e.target.value)} style={editSelectStyle}>
              {["German","English","French","Czech"].map(o => <option key={o}>{o}</option>)}
            </select>}
          </EditField>
          <div />
        </G2>
      )}

      {/* Address */}
      {subIdx === 2 && (
        <G2>
          <EditField label={t("street")} value={draft.street} editing={editing} onChange={set("street")} />
          <EditField label={t("houseNo")} value={draft.houseNo} editing={editing} onChange={set("houseNo")} />
          <EditField label={t("zip")} value={draft.zip} editing={editing} onChange={set("zip")} />
          <EditField label={t("city")} value={draft.city} editing={editing} onChange={set("city")} />
          <EditField label={t("country")} value={draft.country} editing={editing} onChange={set("country")} />
          <div />
        </G2>
      )}

      {/* Business */}
      {subIdx === 3 && (
        <G2>
          <EditField label={t("company")} value={draft.company} editing={editing} onChange={set("company")} />
          <EditField label={t("employmentType")} value={draft.employment} editing={editing} onChange={set("employment")}>
            {editing && <select value={draft.employment} onChange={e => set("employment")(e.target.value)} style={editSelectStyle}>
              <option value="Employed">{t("empl_employed")}</option>
              <option value="Self-employed">{t("empl_selfEmployed")}</option>
              <option value="Unemployed">{t("empl_unemployed")}</option>
              <option value="In Training">{t("empl_inTraining")}</option>
              <option value="Student">{t("empl_student")}</option>
              <option value="Retired">{t("empl_retired")}</option>
              <option value="Other">{t("empl_other")}</option>
            </select>}
          </EditField>
          <EditField label={t("position")} value={draft.position} editing={editing} onChange={set("position")}>
            {editing && <select value={draft.position} onChange={e => set("position")(e.target.value)} style={editSelectStyle}>
              <option value="Senior Management">{t("pos_seniorMgmt")}</option>
              <option value="Executive">{t("pos_executive")}</option>
              <option value="Middle Management">{t("pos_middleMgmt")}</option>
              <option value="Employee">{t("pos_employee")}</option>
              <option value="Assistant">{t("pos_assistant")}</option>
              <option value="Other">{t("pos_other")}</option>
            </select>}
          </EditField>
          <EditField label={t("companySize")} value={draft.companySize} editing={editing} onChange={set("companySize")}>
            {editing && <select value={draft.companySize} onChange={e => set("companySize")(e.target.value)} style={editSelectStyle}>
              <option value="Corporation">{t("companySize_corporation")}</option>
              <option value="Large">{t("companySize_large")}</option>
              <option value="SME">{t("companySize_sme")}</option>
              <option value="Small">{t("companySize_small")}</option>
              <option value="EPU">{t("companySize_epu")}</option>
              <option value="Other">{t("companySize_other")}</option>
            </select>}
          </EditField>
          <EditField label={t("decisionMakingRole")} value={draft.decisionRole} editing={editing} onChange={set("decisionRole")}>
            {editing && <select value={draft.decisionRole} onChange={e => set("decisionRole")(e.target.value)} style={editSelectStyle}>
              <option value="None">{t("dmr_none")}</option>
              <option value="Decision Maker">{t("dmr_decisionMaker")}</option>
              <option value="Influencer">{t("dmr_influencer")}</option>
              <option value="User">{t("dmr_endUser")}</option>
            </select>}
          </EditField>
          <EditField label={t("industry")} value={draft.industry} editing={editing} onChange={set("industry")} />
        </G2>
      )}

      {/* Financial */}
      {subIdx === 4 && (
        <G2>
          <EditField label={t("annualIncome")} value={draft.income} editing={editing} onChange={set("income")} />
          <EditField label={t("netWorth")} value={draft.netWorth} editing={editing} onChange={set("netWorth")} />
          <EditField label={t("riskAppetite")} value={draft.risk} editing={editing} onChange={set("risk")}>
            {editing && <select value={draft.risk} onChange={e => set("risk")(e.target.value)} style={editSelectStyle}>
              <option value="Security Oriented">{t("risk_security")}</option>
              <option value="Balanced">{t("risk_balanced")}</option>
              <option value="Opportunity Oriented">{t("risk_opportunity")}</option>
            </select>}
          </EditField>
          <EditField label={t("investmentHorizon")} value={draft.horizon} editing={editing} onChange={set("horizon")}>
            {editing && <select value={draft.horizon} onChange={e => set("horizon")(e.target.value)} style={editSelectStyle}>
              <option value="Short">{t("horizon_short")}</option>
              <option value="Medium">{t("horizon_medium")}</option>
              <option value="Long">{t("horizon_long")}</option>
            </select>}
          </EditField>
        </G2>
      )}
    </Card>

    {/* Discard confirmation modal */}
    {discardModal && (<>
      <div onClick={() => setDiscardModal(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 800 }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 400, background: "#fff", borderRadius: 16, zIndex: 900, boxShadow: "0 24px 64px rgba(0,0,0,0.22)", padding: "28px 28px 24px", fontFamily: "inherit" }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: C.navy, marginBottom: 10 }}>Discard changes?</div>
        <div style={{ fontSize: 14, color: C.slate, lineHeight: 1.6, marginBottom: 24 }}>
          You have unsaved changes. If you cancel now, all edits on this tab will be lost.
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={() => setDiscardModal(false)}
            style={{ padding: "9px 20px", borderRadius: 9, border: `1px solid ${C.border}`, background: "#fff", color: C.slate, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
            Keep editing
          </button>
          <button onClick={handleDiscard}
            style={{ padding: "9px 20px", borderRadius: 9, border: "none", background: C.red, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            Discard changes
          </button>
        </div>
      </div>
    </>)}
    </>
  );
};

// ── Activities tab ────────────────────────────────────────────────────────────
const ACT_ICON = {
  meeting: { icon: "🤝", color: C.purple },
  call:    { icon: "📞", color: C.green },
  email:   { icon: "✉️", color: C.blue },
  task:    { icon: "☑️", color: C.amber },
  update:  { icon: "✎",  color: C.muted },
};

const ACTIVITIES = [
  { id: "a1", type: "meeting", title: "Meeting test", day: "Wed 24", month: "June 2026", dt: "24.06.2026 - 10:04" },
  { id: "a2", type: "update",  title: "Update Assignee", day: "Sun 21", month: "June 2026", dt: "21.06.2026 - 11:14", field: "Assignee", from: "—", to: "Anna Muller" },
  { id: "a3", type: "meeting", title: "M1", day: "Thu 04", month: "June 2026", dt: "04.06.2026 - 12:30" },
  { id: "a4", type: "update",  title: "Update Label", day: "Wed 03", month: "June 2026", dt: "03.06.2026 - 15:15", field: "Labels", from: "—", to: "Label 1" },
  { id: "a5", type: "call",    title: "Call with a2 s2", day: "Mon 18", month: "May 2026", dt: "18.05.2026 - 18:09", direction: "Outbound" },
  { id: "a6", type: "update",  title: "Update Label", day: "Thu 14", month: "May 2026", dt: "14.05.2026 - 10:38", field: "Labels", from: "Label 1", to: "Label 1, VIP" },
  { id: "a7", type: "email",   title: "Email to client", day: "Wed 13", month: "May 2026", dt: "13.05.2026 - 09:20" },
  { id: "a8", type: "task",    title: "Follow-up task", day: "Tue 12", month: "May 2026", dt: "12.05.2026 - 14:00" },
  { id: "a9", type: "call",    title: "Intro call", day: "Mon 11", month: "May 2026", dt: "11.05.2026 - 16:30", direction: "Inbound" },
  { id: "a10", type: "meeting", title: "Kickoff", day: "Fri 08", month: "May 2026", dt: "08.05.2026 - 11:00" },
  { id: "a11", type: "email",  title: "Proposal sent", day: "Thu 07", month: "May 2026", dt: "07.05.2026 - 13:45" },
  { id: "a12", type: "task",   title: "Prepare docs", day: "Wed 06", month: "May 2026", dt: "06.05.2026 - 10:15" },
  { id: "a13", type: "update", title: "Update Assignee", day: "Tue 05", month: "May 2026", dt: "05.05.2026 - 09:00", field: "Assignee", from: "Anna Muller", to: "Kai Becker" },
  { id: "a14", type: "call",   title: "Callback", day: "Mon 04", month: "May 2026", dt: "04.05.2026 - 17:20", direction: "Outbound" },
];

const ActField = ({ label, value, node }) => (
  <div style={{ marginBottom: 16 }}>
    <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>{label}</div>
    {node || <div style={{ fontSize: 13.5, fontWeight: 600, color: C.text }}>{value}</div>}
  </div>
);

const ActivityDetail = ({ a }) => {
  if (a.type === "meeting") return (<>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 40px" }}>
      <ActField label="Hosted By" value="Philip West" />
      <ActField label="Meeting Outcome" node={<span style={{ fontSize: 12, fontWeight: 700, color: C.amber, background: C.amber + "18", padding: "3px 12px", borderRadius: 12 }}>Scheduled</span>} />
      <ActField label="Meeting Type" value="Video Conference" />
      <ActField label="Meeting Duration" value="60 min" />
      <ActField label="Meeting Location" node={<a style={{ fontSize: 13.5, fontWeight: 600, color: C.blue, textDecoration: "none" }}>Microsoft Teams</a>} />
      <ActField label="Attendees" node={<span style={{ fontSize: 13.5, fontWeight: 600, color: C.text }}>Test Test <span style={{ fontSize: 11, color: C.blue, background: C.blue + "14", padding: "2px 8px", borderRadius: 10 }}>+1</span></span>} />
      <ActField label="Description" value="-" />
      <div />
      <ActField label="Attachments" value="-" />
    </div>
    <div style={{ background: C.blue + "0E", borderRadius: 10, padding: "14px 16px", marginTop: 4 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: C.blue, marginBottom: 4 }}>Meeting Note</div>
      <div style={{ fontSize: 13, color: C.text }}>-</div>
    </div>
  </>);
  if (a.type === "call") return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 40px" }}>
      <ActField label="Call By" value="Philip West" />
      <ActField label="Call Status" value="-" />
      <ActField label="Call Direction" node={<span style={{ fontSize: 13.5, fontWeight: 600, color: C.text }}>📞 {a.direction || "Outbound"}</span>} />
      <ActField label="Call Duration" value="00:00:00" />
      <ActField label="Call Report" value="-" />
      <div />
      <ActField label="Call Recording" value="-" />
    </div>
  );
  if (a.type === "email") return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 40px" }}>
      <ActField label="Sent By" value="Philip West" />
      <ActField label="Direction" value="Sent" />
      <ActField label="Subject" value={a.title} />
      <ActField label="Status" value="Delivered" />
      <ActField label="Email Report" value="-" />
    </div>
  );
  if (a.type === "task") return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 40px" }}>
      <ActField label="Created By" value="Philip West" />
      <ActField label="Task Type" value="Call" />
      <ActField label="Priority" value="Medium" />
      <ActField label="Status" value="Open" />
      <ActField label="Description" value="-" />
    </div>
  );
  // update
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 40px" }}>
      <ActField label="Changed By" value="Philip West" />
      <ActField label="Field" value={a.field || "-"} />
      <ActField label="From" value={a.from || "-"} />
      <ActField label="To" value={a.to || "-"} />
    </div>
  );
};

const ActivitiesTab = () => {
  const t = useT();
  const [filter, setFilter] = useState("all");
  const [open, setOpen] = useState<Record<string,boolean>>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const FILTERS: Array<{ key: string; label: string }> = [
    { key: "all", label: t("all") },
    { key: "call", label: t("call") },
    { key: "email", label: t("email") },
    { key: "task", label: t("task") },
    { key: "meeting", label: t("meeting") },
  ];
  const filtered = useMemo(() => {
    if (filter === "all") return ACTIVITIES;
    return ACTIVITIES.filter(a => a.type === filter);
  }, [filter]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  // group page items by month, preserving order
  const groups = [];
  pageItems.forEach(a => {
    let g = groups.find(x => x.month === a.month);
    if (!g) { g = { month: a.month, items: [] }; groups.push(g); }
    g.items.push(a);
  });

  return (
    <Card style={{ padding: "18px 20px" }}>
      {/* filter tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
        {FILTERS.map(({ key, label }) => {
          const on = filter === key;
          return (
            <button key={key} onClick={() => { setFilter(key); setPage(1); }} style={{
              padding: "7px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontFamily: "inherit",
              fontSize: 13, fontWeight: on ? 700 : 500, color: on ? C.blue : C.slate, background: on ? C.blue + "12" : "transparent",
            }}>{label}</button>
          );
        })}
      </div>

      {groups.map(g => (
        <div key={g.month} style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.navy, margin: "10px 0 12px" }}>{g.month}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {g.items.map(a => {
              const meta = ACT_ICON[a.type];
              const isOpen = !!open[a.id];
              return (
                <div key={a.id} style={{ border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
                  <div onClick={() => setOpen(prev => ({ ...prev, [a.id]: !prev[a.id] }))}
                    style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 18px", cursor: "pointer" }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: C.navy, width: 56, flexShrink: 0 }}>{a.day}</span>
                    <span style={{ width: 1, height: 30, background: C.border, flexShrink: 0 }} />
                    <span style={{ fontSize: 16, color: meta.color, flexShrink: 0 }}>{meta.icon}</span>
                    <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: C.navy }}>{a.title}</span>
                    <span style={{ fontSize: 12.5, color: C.muted }}>{a.dt}</span>
                    <span style={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      width: 26, height: 26, borderRadius: 7, flexShrink: 0,
                      background: isOpen ? C.blue + "15" : "#F1F5F9",
                      border: `1px solid ${isOpen ? C.blue + "40" : C.border}`,
                      color: isOpen ? C.blue : C.slate, fontSize: 13, fontWeight: 700,
                      transition: "background .15s, border .15s, transform .15s",
                      transform: isOpen ? "rotate(180deg)" : "none",
                    }}>⌄</span>
                  </div>
                  {isOpen && (
                    <div style={{ padding: "4px 18px 18px 90px", borderTop: `1px solid ${C.border}` }}>
                      <div style={{ paddingTop: 14 }}><ActivityDetail a={a} /></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {total === 0 && <div style={{ padding: "40px", textAlign: "center", color: C.muted, fontSize: 13 }}>No activities.</div>}

      {/* pagination */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontSize: 13, color: C.slate }}>Page <u>{page}</u> of {totalPages}</span>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${C.border}`, background: "#fff", cursor: page <= 1 ? "default" : "pointer", color: page <= 1 ? C.muted : C.slate }}>‹</button>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${C.border}`, background: "#fff", cursor: page >= totalPages ? "default" : "pointer", color: page >= totalPages ? C.muted : C.slate }}>›</button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }} style={{ ...fieldStyle, width: "auto", padding: "6px 10px" }}>
            {[5, 10, 25].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <span style={{ fontSize: 13, color: C.slate }}>Displaying {from} - {to} of {total} records</span>
        </div>
      </div>
    </Card>
  );
};

// ── Documents tab ─────────────────────────────────────────────────────────────
const DOC_CATS = [
  { key: "Contact Uploads",  color: C.blue   },
  { key: "Internal Uploads", color: C.green  },
  { key: "Send Emails",      color: C.amber  },
  { key: "Recieved Emails",  color: C.slate  },
];
const DOCS = [
  { id: "d1", name: "My_ID_Card.pdf",          type: "pdf",  who: "Sandra Richter", size: "750 KB", cat: "Contact Uploads",  date: "11.03.2026 - 10:00" },
  { id: "d2", name: "Proposal_Q1.xlsx",        type: "xlsx", who: "Lana Steiner",   size: "200 KB", cat: "Internal Uploads", date: "11.03.2026 - 10:00" },
  { id: "d3", name: "Wishes_and_Goals_01.jpg", type: "jpg",  who: "Lana Steiner",   size: "200 KB", cat: "Send Emails",      date: "11.03.2026 - 10:00" },
  { id: "d4", name: "Test_Title#1.pdf",        type: "pdf",  who: "Sandra Richter", size: "750 KB", cat: "Recieved Emails",  date: "11.03.2026 - 10:00" },
];

const DocumentsTab = () => {
  const [filters, setFilters] = useState(() => new Set<string>());
  const [qr, setQr] = useState(false);
  const catColor = (cat) => (DOC_CATS.find(x => x.key === cat) || {}).color || C.slate;
  const rows = filters.size > 0 ? DOCS.filter(d => filters.has(d.cat)) : DOCS;
  const toggleFilter = (key: string) => setFilters(prev => {
    const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n;
  });
  return (
    <Card style={{ padding: "18px 20px" }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
        {DOC_CATS.map(cat => {
          const on = filters.has(cat.key);
          return (
            <button key={cat.key} onClick={() => toggleFilter(cat.key)} style={{
              display: "flex", alignItems: "center", gap: 7, padding: "8px 14px", borderRadius: 9, cursor: "pointer", fontFamily: "inherit",
              border: `1px solid ${on ? cat.color : C.border}`, background: on ? cat.color + "12" : "#fff",
              fontSize: 13, fontWeight: 600, color: on ? cat.color : C.slate,
            }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: cat.color }} /> {cat.key}
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 26 }}>
        {rows.map(d => (
          <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 14px", border: `1px solid ${C.border}`, borderRadius: 12 }}>
            <FileBadge type={d.type} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.navy }}>{d.name}</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{d.who} | {d.size}</div>
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: catColor(d.cat), background: catColor(d.cat) + "14", padding: "5px 12px", borderRadius: 14 }}>{d.cat}</span>
            <span style={{ fontSize: 12, color: C.muted, width: 130, textAlign: "right" }}>{d.date}</span>
          </div>
        ))}
        {rows.length === 0 && <div style={{ padding: "24px", textAlign: "center", color: C.muted, fontSize: 13 }}>No documents in this category.</div>}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 16 }}>
        <div style={{ background: C.light, borderRadius: 12, padding: "16px 18px" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.navy, marginBottom: 12 }}>Upload Document</div>
          <div style={{ border: `1.5px dashed ${C.border}`, borderRadius: 10, padding: "16px 18px", background: "#fff", display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ width: 34, height: 34, borderRadius: "50%", background: C.primarySoft, color: C.primary, display: "grid", placeItems: "center", fontSize: 15 }}>⬆</span>
            <div>
              <div style={{ fontSize: 13, color: C.text }}>Drag &amp; drop files or <span style={{ color: C.primary, fontWeight: 700, cursor: "pointer" }}>Browse</span></div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Maximum Upload file size &lt;5 MB&gt;</div>
            </div>
          </div>
        </div>
        <div style={{ background: C.light, borderRadius: 12, padding: "16px 18px" }}>
          <div style={{ fontSize: 13, color: C.text, marginBottom: 14 }}>Share this link with the Contact to upload documents.</div>
          <div style={{ display: "flex", gap: 12 }}>
            <button style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 18px", borderRadius: 9, border: "none", background: C.primary, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>⧉ Copy link</button>
            <button onClick={() => setQr(true)} style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 18px", borderRadius: 9, border: `1px solid ${C.primary}`, background: "#fff", color: C.primaryDark, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>▦ QR Code</button>
          </div>
        </div>
      </div>

      {qr && <ScanQRModal onClose={() => setQr(false)} />}
    </Card>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
export const MVPContactDetailPage = ({ lead, navigateTo, sourceView, role }) => {
  const t = useT();
  const isMyNetwork = sourceView === "my";
  const ACTIVE_TABS = isMyNetwork
    ? [t("activitiesTab"), t("documentsTab"), t("informationTab")]
    : [t("overviewTab"), t("activitiesTab"), t("documentsTab"), t("informationTab")];
  const [tab, setTab] = useState(() => ACTIVE_TABS[0]);
  const [modal, setModal] = useState(null);   // email | task | appointment | logcall | logemail | logappt | offline

  const c = {
    name: lead?.name ? (/^(Ms|Mr|Mrs|Dr)/i.test(lead.name) ? lead.name : `Ms ${lead.name}`) : "Ms Lana Steiner",
    email: lead?.email || "lana.steiner@email.com",
    phone: lead?.phone || "+43 1111 11 11",
    assignee: lead?.assignedGP || "Anna Muller",
    lifecycle: "Lifecycle Stage 1",
    stageStatus: "Status 1",
    source: lead?.source || "Landing Page",
    campaign: lead?.campaign || "Webinar – Q1 2026",
  };

  return (
    <div style={{ padding: "20px 28px 36px", fontFamily: "inherit" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 18 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: C.navy, letterSpacing: "-0.02em" }}>{t("contactDetailTitle")}</h1>
        <span style={{ fontSize: 13, color: C.muted }}>
          <span onClick={() => navigateTo && navigateTo("Leads")} style={{ cursor: "pointer" }}>{t("contacts")}</span> . {t("contactDetailTitle")}
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 18, alignItems: "start" }}>
        <IdentityRail c={c}
          onEmail={() => setModal("email")} onTask={() => setModal("task")} onAppointment={() => setModal("appointment")}
          onLogCall={() => setModal("logcall")} onLogEmail={() => setModal("logemail")}
          onLogAppt={() => setModal("logappt")} onOffline={() => setModal("offline")} />

        <div>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {ACTIVE_TABS.map(tabName => (
              <button key={tabName} onClick={() => setTab(tabName)} style={{
                padding: "9px 18px", borderRadius: 10, border: `1px solid ${tab === tabName ? C.primary : C.border}`,
                background: tab === tabName ? "#fff" : "transparent", cursor: "pointer", fontFamily: "inherit",
                fontSize: 14, fontWeight: tab === tabName ? 700 : 500, color: tab === tabName ? C.primaryDark : C.slate,
              }}>{tabName}</button>
            ))}
          </div>

          {tab === t("overviewTab")     && <OverviewTab showInsights={false} />}
          {tab === t("informationTab") && <InformationTab c={c} />}
          {tab === t("activitiesTab")  && <ActivitiesTab />}
          {tab === t("documentsTab")   && <DocumentsTab />}
        </div>
      </div>

      {modal === "email"       && <EmailModal onClose={() => setModal(null)} />}
      {modal === "task"        && <TaskModal onClose={() => setModal(null)} />}
      {modal === "appointment" && <AppointmentModal onClose={() => setModal(null)} />}
      {modal === "logcall"     && <LogCallModal onClose={() => setModal(null)} />}
      {modal === "logemail"    && <LogEmailModal onClose={() => setModal(null)} />}
      {modal === "logappt"     && <LogAppointmentModal onClose={() => setModal(null)} />}
      {modal === "offline"     && <OfflineLogModal onClose={() => setModal(null)} />}
    </div>
  );
};
