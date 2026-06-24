import React, { useState } from "react";
import { C } from "../../theme";

// ─────────────────────────────────────────────────────────────────────────────
// MVP CONTACT DETAIL VIEW
// Left identity rail (shared) + tabbed content: Overview / Information /
// Activities / Documents. Mirrors the product design mockups.
// ─────────────────────────────────────────────────────────────────────────────

const TABS = ["Overview", "Information", "Activities", "Documents"];

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

const IdentityRail = ({ c }) => (
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

    <div style={{ display: "flex", gap: 14, paddingBottom: 14, borderBottom: `1px solid ${C.border}`, marginBottom: 16, fontSize: 17, color: C.primary }}>
      <span title="Email" style={{ cursor: "pointer" }}>✉️</span>
      <span title="Log call" style={{ cursor: "pointer" }}>🤝</span>
      <span title="Reminder" style={{ cursor: "pointer" }}>🔔</span>
      <span title="Tasks" style={{ cursor: "pointer" }}>☑️</span>
      <span title="More" style={{ cursor: "pointer", color: C.slate }}>⋮</span>
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
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: C.primaryDark, background: C.primarySoft, padding: "5px 10px", borderRadius: 8 }}>Label 1 <span style={{ cursor: "pointer" }}>×</span></span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: C.slate, border: `1px dashed ${C.border}`, padding: "5px 10px", borderRadius: 8, cursor: "pointer" }}>＋ Add</span>
      </div>
    </div>
  </Card>
);

// ── Overview tab ──────────────────────────────────────────────────────────────
const OverviewTab = () => {
  const [notes, setNotes] = useState([
    { id: "n1", stage: "Prospect",   dur: "3 days",  active: true,  date: "04.03.2026 - 10:00" },
    { id: "n2", stage: "In Progress",dur: "18 days", done: true,    date: "04.03.2026 - 10:00" },
    { id: "n3", text: "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor…", note: true, date: "04.03.2026 - 10:00" },
    { id: "n4", text: "It's a short note.", note: true, date: "04.03.2026 - 10:00" },
    { id: "n5", stage: "New", done: true, created: "Anna Muller", source: "Landing Page", campaign: "Webinar – Q1 2026", date: "04.03.2026 - 10:00" },
  ]);

  const Dot = ({ color }) => <span style={{ width: 14, height: 14, borderRadius: "50%", background: color, border: `3px solid ${color}33`, flexShrink: 0, zIndex: 1 }} />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Follow-up + advisory */}
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

      {/* AI insight */}
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

      {/* Journey pipeline */}
      <Card style={{ padding: "18px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>Journey Pipeline</div>
          <button style={{ padding: "7px 14px", borderRadius: 8, border: `1px solid ${C.primary}`, background: "#fff", color: C.primaryDark, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>＋ Add Note</button>
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

// ── Activities / Documents (simple) ───────────────────────────────────────────
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

const DocumentsTab = () => (
  <Card style={{ padding: "18px 22px" }}>
    <div style={{ fontSize: 14, fontWeight: 700, color: C.navy, marginBottom: 14 }}>Documents</div>
    {["Wishes & Goals.pdf", "Concept File.pdf", "Financing Application.pdf"].map((d, i, arr) => (
      <div key={d} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : "none" }}>
        <span style={{ width: 26, height: 30, borderRadius: 4, background: C.red, color: "#fff", fontSize: 7, fontWeight: 800, display: "grid", placeItems: "center" }}>PDF</span>
        <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: C.text }}>{d}</span>
        <span style={{ fontSize: 12, color: C.blue, cursor: "pointer", fontWeight: 600 }}>Download</span>
      </div>
    ))}
  </Card>
);

// ─────────────────────────────────────────────────────────────────────────────
export const MVPContactDetailPage = ({ lead, navigateTo }) => {
  const [tab, setTab] = useState("Overview");

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
        <IdentityRail c={c} />

        <div>
          {/* Tabs */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {TABS.map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding: "9px 18px", borderRadius: 10, border: `1px solid ${tab === t ? C.primary : C.border}`,
                background: tab === t ? "#fff" : "transparent", cursor: "pointer", fontFamily: "inherit",
                fontSize: 14, fontWeight: tab === t ? 700 : 500, color: tab === t ? C.primaryDark : C.slate,
              }}>{t}</button>
            ))}
          </div>

          {tab === "Overview"     && <OverviewTab />}
          {tab === "Information"  && <InformationTab c={c} />}
          {tab === "Activities"   && <ActivitiesTab />}
          {tab === "Documents"    && <DocumentsTab />}
        </div>
      </div>
    </div>
  );
};
