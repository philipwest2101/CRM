import React, { useState } from "react";
import { C } from "../../theme";

// ─────────────────────────────────────────────────────────────────────────────
// MVP CONTACT DETAIL VIEW
// Left identity rail (shared) + tabbed content: Overview / Information /
// Activities / Documents. Rail actions open Email / Task composers; Labels
// open a picker; the Journey Pipeline and Documents tab support adding content.
// ─────────────────────────────────────────────────────────────────────────────

const TABS = ["Overview", "Information", "Activities", "Documents"];

const fieldStyle = {
  width: "100%", padding: "10px 12px", borderRadius: 8,
  border: `1px solid ${C.border}`, fontSize: 13, fontFamily: "inherit",
  color: C.text, boxSizing: "border-box", outline: "none", background: "#fff",
};

// ── small shared bits ─────────────────────────────────────────────────────────
const Card = ({ children, style }) => (
  <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 14, ...style }}>{children}</div>
);

const Stars = ({ n = 2 }) => (
  <span style={{ display: "inline-flex", gap: 1 }}>
    {[1, 2, 3, 4, 5].map(i => <span key={i} style={{ color: i <= n ? C.amber : C.border, fontSize: 15 }}>★</span>)}
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

// ── generic modal shell (Email / Task) ────────────────────────────────────────
const ModalShell = ({ icon, title, width = 520, onClose, children }) => (
  <>
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", zIndex: 400 }} />
    <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width, maxWidth: "94vw", maxHeight: "92vh", overflowY: "auto", background: "#fff", borderRadius: 16, zIndex: 500, boxShadow: "0 24px 64px rgba(0,0,0,0.22)", padding: "20px 24px", fontFamily: "inherit" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18, color: C.primary }}>{icon}</span>
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

const Label = ({ children }) => (
  <label style={{ fontSize: 13, fontWeight: 600, color: C.navy, display: "block", marginBottom: 6 }}>{children}</label>
);

// ── Email composer ────────────────────────────────────────────────────────────
const EmailModal = ({ onClose }) => {
  const [schedule, setSchedule] = useState(true);
  const Chip = ({ text, removable }) => (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: C.primaryDark, background: C.primarySoft, padding: "4px 9px", borderRadius: 8 }}>
      {text}{removable && <span style={{ cursor: "pointer" }}>×</span>}
    </span>
  );
  const ChipBox = ({ children }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", padding: "7px 10px", border: `1px solid ${C.border}`, borderRadius: 8, minHeight: 22 }}>
      {children}<span style={{ width: 1, height: 16, background: C.border }} />
    </div>
  );
  const toolBtns = ["B", "I", "U", "⟸", "⟺", "⟹", "≔", "≕", "🖉", "T"];
  return (
    <ModalShell icon="✉️" title="Email" width={640} onClose={onClose}>
      <div style={{ marginBottom: 14 }}>
        <Label>From *</Label>
        <select style={fieldStyle} defaultValue="someone@gmail.com"><option>someone@gmail.com</option><option>sales@vionworld.com</option></select>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 14 }}>
        <div><Label>To *</Label><ChipBox><Chip text="Account/PC Email" /><Chip text="Example@gmail.com" removable /></ChipBox></div>
        <div><Label>CC</Label><ChipBox><Chip text="someone@example.com" /></ChipBox></div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 14 }}>
        <div><Label>Template</Label><select style={{ ...fieldStyle, color: C.muted }} defaultValue=""><option value="">Select Template</option><option>Welcome Email</option><option>Follow-up</option></select></div>
        <div><Label>Attachment</Label><select style={{ ...fieldStyle, color: C.muted }} defaultValue=""><option value="">Select Attachment</option><option>Product Brochure</option></select></div>
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
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 14 }}>
          <input type="date" style={{ ...fieldStyle, color: C.muted }} />
          <input type="time" style={{ ...fieldStyle, color: C.muted }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 18 }}>
          <div><Label>Lifecycle Stage</Label><select style={{ ...fieldStyle, color: C.muted }} defaultValue=""><option value="">Select Stage</option><option>Lead</option><option>Opportunity</option></select></div>
          <div><Label>Stage Status</Label><select style={{ ...fieldStyle, color: C.muted }} defaultValue=""><option value="">Select Status</option><option>New</option><option>To Do</option></select></div>
        </div>
      </>)}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
        <button onClick={onClose} style={{ padding: "9px 20px", borderRadius: 9, border: "none", background: "transparent", color: C.slate, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
        <button onClick={onClose} style={{ padding: "9px 28px", borderRadius: 9, border: "none", background: C.primary, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Send</button>
      </div>
    </ModalShell>
  );
};

// ── Task composer ─────────────────────────────────────────────────────────────
const TaskModal = ({ onClose }) => {
  const [repeat, setRepeat] = useState(true);
  const [n, setN] = useState(1);
  const [title, setTitle] = useState("");
  return (
    <ModalShell icon="☑️" title="Task" width={640} onClose={onClose}>
      <div style={{ marginBottom: 16 }}><Label>Title *</Label><input value={title} onChange={e => setTitle(e.target.value)} style={fieldStyle} placeholder="Title" /></div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div><Label>Due Date *</Label><input type="date" style={{ ...fieldStyle, color: C.muted }} /></div>
        <div><Label>Time *</Label><input type="time" style={{ ...fieldStyle, color: C.muted }} /></div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div><Label>Task Type *</Label><select style={{ ...fieldStyle, color: C.muted }} defaultValue=""><option value="">Select Task Type</option><option>Call</option><option>Email</option><option>Meeting</option><option>Follow-up</option></select></div>
        <div><Label>Task Priority *</Label><select style={{ ...fieldStyle, color: C.muted }} defaultValue=""><option value="">Select Task Priority</option><option>Low</option><option>Normal</option><option>High</option><option>Urgent</option></select></div>
      </div>
      <div style={{ marginBottom: 16 }}>
        <Label>Description *</Label>
        <textarea style={{ ...fieldStyle, minHeight: 90, resize: "vertical", lineHeight: 1.5 }} placeholder="Description" />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 9, cursor: "pointer", fontSize: 14, fontWeight: 600, color: C.navy }}>
          <input type="checkbox" checked={repeat} onChange={e => setRepeat(e.target.checked)} style={{ width: 16, height: 16, accentColor: C.primary }} /> Repeat every
        </label>
        {repeat && (<>
          <div style={{ display: "flex", alignItems: "center", border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
            <input value={n} onChange={e => setN(Number(e.target.value) || 1)} style={{ width: 50, border: "none", outline: "none", padding: "9px 10px", fontSize: 13, fontFamily: "inherit" }} />
            <div style={{ display: "flex", flexDirection: "column", borderLeft: `1px solid ${C.border}` }}>
              <button onClick={() => setN(v => v + 1)} style={{ border: "none", background: "#fff", cursor: "pointer", fontSize: 9, padding: "1px 7px", color: C.slate }}>▲</button>
              <button onClick={() => setN(v => Math.max(1, v - 1))} style={{ border: "none", borderTop: `1px solid ${C.border}`, background: "#fff", cursor: "pointer", fontSize: 9, padding: "1px 7px", color: C.slate }}>▼</button>
            </div>
          </div>
          <select style={{ ...fieldStyle, width: 160 }} defaultValue="Day"><option>Day</option><option>Week</option><option>Month</option></select>
        </>)}
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
        <button onClick={onClose} style={{ padding: "9px 20px", borderRadius: 9, border: "none", background: "transparent", color: C.slate, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
        <button disabled={!title.trim()} onClick={onClose} style={{ padding: "9px 28px", borderRadius: 9, border: "none", background: title.trim() ? C.primary : C.border, color: title.trim() ? "#fff" : C.muted, fontSize: 13, fontWeight: 700, cursor: title.trim() ? "pointer" : "default" }}>Create</button>
      </div>
    </ModalShell>
  );
};

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
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <button onClick={onClose} style={{ padding: "9px 20px", borderRadius: 9, border: "none", background: "transparent", color: C.slate, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
          <button disabled={!text.trim()} onClick={() => { onSave(text.trim()); onClose(); }} style={{ padding: "9px 28px", borderRadius: 9, border: "none", background: text.trim() ? C.primary : C.border, color: text.trim() ? "#fff" : C.muted, fontSize: 13, fontWeight: 700, cursor: text.trim() ? "pointer" : "default" }}>Save</button>
        </div>
      </div>
    </>
  );
};

// ── Labels picker (popover) ───────────────────────────────────────────────────
const LabelsPicker = ({ selected, onToggle, onClose }) => {
  const [q, setQ] = useState("");
  const ALL = ["Test 1", "Do Not Call", "Callback Set", "Friend", "Friend1"];
  const list = ALL.filter(l => l.toLowerCase().includes(q.toLowerCase()));
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
        </div>
        <div style={{ borderTop: `1px solid ${C.border}`, padding: "10px 14px 2px" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: C.primary, cursor: "pointer" }}>＋ Add Label</span>
        </div>
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
    <span style={{ fontSize: 15, color: C.muted, width: 18, textAlign: "center", flexShrink: 0 }}>{icon}</span>
    <div>
      <div style={{ fontSize: 11, color: C.muted }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginTop: 1 }}>{value}</div>
    </div>
  </div>
);

const IdentityRail = ({ c, onEmail, onTask }) => {
  const [labels, setLabels] = useState(["Label 1"]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const toggle = (l) => setLabels(prev => prev.includes(l) ? prev.filter(x => x !== l) : [...prev, l]);
  const action = (icon, title, onClick, color = C.primary) => (
    <span title={title} onClick={onClick} style={{ cursor: "pointer", color }}>{icon}</span>
  );
  return (
    <Card style={{ padding: "20px 18px", alignSelf: "start" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 13, marginBottom: 14 }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: C.indigo, color: "#fff", display: "grid", placeItems: "center", fontSize: 20, fontWeight: 700, flexShrink: 0 }}>
          {c.name.split(" ").slice(-2).map(w => w[0]).join("").toUpperCase()}
        </div>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: C.navy }}>{c.name}</div>
          <div style={{ marginTop: 3 }}><Stars n={2} /></div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <Badge icon="🛡" label="GDPR" color={C.green} />
        <Badge icon="✉" label="Subscribed" color={C.blue} />
      </div>

      <div style={{ display: "flex", gap: 14, paddingBottom: 14, borderBottom: `1px solid ${C.border}`, marginBottom: 16, fontSize: 17 }}>
        {action("✉️", "Email", onEmail)}
        {action("🤝", "Log activity", onTask)}
        {action("🔔", "Reminder", onTask)}
        {action("☑️", "Task", onTask)}
        {action("⋮", "More", () => {}, C.slate)}
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
          {pickerOpen && <LabelsPicker selected={labels} onToggle={toggle} onClose={() => setPickerOpen(false)} />}
        </div>
      </div>
    </Card>
  );
};

// ── Overview tab ──────────────────────────────────────────────────────────────
const OverviewTab = () => {
  const [addNote, setAddNote] = useState(false);
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
          <div style={{ fontSize: 14, fontWeight: 700, color: C.navy, marginBottom: 8 }}>Follow Up</div>
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
              <span style={{ fontSize: 16, color: C.slate }}>{icon}</span>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: C.text }}>{label}</span>
              <span style={{ color: C.muted }}>→</span>
            </div>
          ))}
        </Card>
      </div>

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
                        <span style={{ color: C.slate, cursor: "pointer" }}>🗑</span>
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

const InformationTab = ({ c }) => {
  const [sub, setSub] = useState("Basic");
  const SUBS = ["Basic", "Personal", "Address", "Business", "Financial"];
  const [first, ...rest] = c.name.replace(/^(Ms|Mr|Mrs|Dr)\.?\s+/i, "").split(" ");
  return (
    <Card style={{ padding: "18px 22px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
        <div style={{ display: "flex", gap: 6 }}>
          {SUBS.map(s => (
            <button key={s} onClick={() => setSub(s)} style={{
              padding: "7px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontFamily: "inherit",
              fontSize: 13, fontWeight: sub === s ? 700 : 500, color: sub === s ? C.primaryDark : C.slate,
              background: sub === s ? C.primarySoft : "transparent",
            }}>{s}</button>
          ))}
        </div>
        <button style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: C.primaryDark, fontSize: 13, fontWeight: 700 }}>✎ Edit</button>
      </div>

      {sub === "Basic" ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 60px" }}>
          <InfoField label="First Name" value={first} />
          <InfoField label="Last Name" value={rest.join(" ") || "—"} />
          <InfoField label="Email" value={c.email} />
          <InfoField label="Phone" value={c.phone} />
          <InfoField label="Assignee" value={c.assignee} />
          <div />
          <InfoField label="Product" value="Product #1" />
          <InfoField label="Product Provider" value="Product Provider #1" />
          <InfoField label="Lead Source" value={c.source} />
          <InfoField label="Campaign Assignment" value={c.campaign} />
          <InfoField label="Communication Consent (GDPR)" node={<div style={{ fontSize: 14, fontWeight: 600, color: C.green }}>✓ 01.01.2026</div>} />
          <InfoField label="Newsletter Subscription" node={<span style={{ fontSize: 12, fontWeight: 600, color: C.slate, background: C.light, padding: "4px 10px", borderRadius: 12 }}>✕ No</span>} />
        </div>
      ) : (
        <div style={{ padding: "40px 0", textAlign: "center", color: C.muted, fontSize: 13 }}>{sub} details</div>
      )}
    </Card>
  );
};

// ── Activities tab ────────────────────────────────────────────────────────────
const ActivitiesTab = () => (
  <Card style={{ padding: "18px 22px" }}>
    <div style={{ fontSize: 14, fontWeight: 700, color: C.navy, marginBottom: 14 }}>Recent Activities</div>
    {[
      ["📞", "Phone Call — Not Reached", "04.03.2026 - 10:00"],
      ["✉️", "Email sent — Cupcake offerings", "25.05.2026 - 14:20"],
      ["📅", "Appointment scheduled", "20.05.2026 - 09:00"],
      ["📝", "Note added by Anna Muller", "18.05.2026 - 16:45"],
    ].map(([icon, title, date], i, arr) => (
      <div key={title} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : "none" }}>
        <span style={{ width: 32, height: 32, borderRadius: "50%", background: C.light, display: "grid", placeItems: "center", fontSize: 14 }}>{icon}</span>
        <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: C.text }}>{title}</span>
        <span style={{ fontSize: 12, color: C.muted }}>{date}</span>
      </div>
    ))}
  </Card>
);

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
  const [filter, setFilter] = useState(null);   // active category or null
  const catColor = (cat) => (DOC_CATS.find(x => x.key === cat) || {}).color || C.slate;
  const rows = filter ? DOCS.filter(d => d.cat === filter) : DOCS;
  return (
    <Card style={{ padding: "18px 20px" }}>
      {/* Filter pills */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
        {DOC_CATS.map(cat => {
          const on = filter === cat.key;
          return (
            <button key={cat.key} onClick={() => setFilter(on ? null : cat.key)} style={{
              display: "flex", alignItems: "center", gap: 7, padding: "8px 14px", borderRadius: 9, cursor: "pointer", fontFamily: "inherit",
              border: `1px solid ${on ? cat.color : C.border}`, background: on ? cat.color + "12" : "#fff",
              fontSize: 13, fontWeight: 600, color: on ? cat.color : C.slate,
            }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: cat.color }} /> {cat.key}
            </button>
          );
        })}
      </div>

      {/* Document rows */}
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

      {/* Upload + share */}
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
            <button style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 18px", borderRadius: 9, border: `1px solid ${C.primary}`, background: "#fff", color: C.primaryDark, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>▦ QR Code</button>
          </div>
        </div>
      </div>
    </Card>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
export const MVPContactDetailPage = ({ lead, navigateTo }) => {
  const [tab, setTab] = useState("Overview");
  const [modal, setModal] = useState(null);   // "email" | "task" | null

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
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: C.navy, letterSpacing: "-0.02em" }}>Contact Detail View</h1>
        <span style={{ fontSize: 13, color: C.muted }}>
          <span onClick={() => navigateTo && navigateTo("Leads")} style={{ cursor: "pointer" }}>Contacts</span> . Contact detail view
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 18, alignItems: "start" }}>
        <IdentityRail c={c} onEmail={() => setModal("email")} onTask={() => setModal("task")} />

        <div>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {TABS.map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding: "9px 18px", borderRadius: 10, border: `1px solid ${tab === t ? C.primary : C.border}`,
                background: tab === t ? "#fff" : "transparent", cursor: "pointer", fontFamily: "inherit",
                fontSize: 14, fontWeight: tab === t ? 700 : 500, color: tab === t ? C.primaryDark : C.slate,
              }}>{t}</button>
            ))}
          </div>

          {tab === "Overview"    && <OverviewTab />}
          {tab === "Information" && <InformationTab c={c} />}
          {tab === "Activities"  && <ActivitiesTab />}
          {tab === "Documents"   && <DocumentsTab />}
        </div>
      </div>

      {modal === "email" && <EmailModal onClose={() => setModal(null)} />}
      {modal === "task"  && <TaskModal onClose={() => setModal(null)} />}
    </div>
  );
};
