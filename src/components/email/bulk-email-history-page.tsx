import React, { useState } from "react";
import { C } from "../../theme";
import { useT } from "../../lib/i18n";

const STATUS_COLOR: Record<string, string> = {
  Sent:      C.green,
  Scheduled: C.amber,
  Failed:    C.red,
  Cancelled: C.muted,
};

const STATUS_ICON: Record<string, string> = {
  Sent:      "✓",
  Scheduled: "⏰",
  Failed:    "✕",
  Cancelled: "⊘",
};

const MOCK_HISTORY = [
  { id:"h1", template:"Email Template 1", sent:1234, total:1234, dateTime:"2026-02-03 - 14:22", responsible:"John Smith",  status:"Sent"      },
  { id:"h2", template:"Email Template 2", sent:145,  total:150,  dateTime:"2026-02-02 - 09:15", responsible:"Anna Muller", status:"Scheduled" },
  { id:"h3", template:"Email Template 3", sent:0,    total:67,   dateTime:"2026-02-01 - 16:40", responsible:"John Smith",  status:"Failed"    },
  { id:"h4", template:"Email Template 4", sent:25,   total:25,   dateTime:"2025-01-02 - 10:01", responsible:"Anna Muller", status:"Sent"      },
  { id:"h5", template:"Email Template 5", sent:4321, total:4321, dateTime:"2026-02-03 - 14:22", responsible:"John Smith",  status:"Sent"      },
  { id:"h6", template:"Email Template 6", sent:90,   total:150,  dateTime:"2026-02-02 - 09:15", responsible:"Anna Muller", status:"Scheduled" },
  { id:"h7", template:"Email Template 7", sent:0,    total:79,   dateTime:"2026-02-01 - 16:40", responsible:"John Smith",  status:"Cancelled" },
];

const fieldStyle = {
  padding: "7px 10px", borderRadius: 8, border: `1px solid ${C.border}`,
  fontSize: 12, fontFamily: "inherit", color: C.text, background: "#fff",
  outline: "none", boxSizing: "border-box" as const,
};

// Email preview modal
const PreviewModal = ({ template, onClose }: { template: string; onClose: () => void }) => (
  <>
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.45)", zIndex:600 }}/>
    <div style={{ position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:600, maxWidth:"94vw", background:"#fff", borderRadius:16, zIndex:700, boxShadow:"0 24px 64px rgba(0,0,0,0.22)", fontFamily:"inherit" }}>
      <div style={{ padding:"20px 26px 0" }}>
        <div style={{ display:"flex", alignItems:"center", gap:24, marginBottom:14 }}>
          <span style={{ fontSize:13, color:C.muted, width:80 }}>Template</span>
          <span style={{ flex:1, fontSize:17, fontWeight:700, color:C.navy }}>{template}</span>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", fontSize:20, color:C.muted }}>×</button>
        </div>
      </div>
      <div style={{ height:6, background:C.primary }}/>
      <div style={{ padding:"30px 40px" }}>
        <div style={{ textAlign:"center", marginBottom:26, fontSize:22, fontWeight:800 }}>
          <span style={{ color:C.primary }}>ⓧ vion</span><span style={{ color:C.slate }}>world</span>
        </div>
        <div style={{ fontSize:14, color:C.text, lineHeight:1.7 }}>
          <p style={{ margin:"0 0 16px" }}>Hi {"{FirstName}"},</p>
          <p style={{ margin:"0 0 16px" }}>Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
          <p style={{ margin:"0 0 16px" }}>Thank You,</p>
          <p style={{ margin:0 }}>Vionworld - CRM Hub</p>
        </div>
      </div>
      <div style={{ background:C.primary, color:"#fff", padding:"22px 30px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ fontSize:18, fontWeight:800 }}>ⓧ vion<span style={{ fontWeight:400 }}>world</span></span>
        <span style={{ fontSize:13, opacity:0.95 }}>2026© Lead Connect</span>
      </div>
    </div>
  </>
);

// Recipients list modal
const RecipientsModal = ({ template, count, onClose }: { template: string; count: number; onClose: () => void }) => {
  const mockRecipients = Array.from({ length: Math.min(count, 8) }, (_, i) => ({
    id: `r${i}`, name: ["Anna Schmidt","David Weber","Julia Klein","Klaus Mueller","Lisa Hoffman","Maria Berg","Stefan Maier","Thomas Richter"][i % 8],
    email: `contact${i}@email.com`,
  }));
  return (
    <>
      <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.45)", zIndex:600 }}/>
      <div style={{ position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:480, maxWidth:"92vw", maxHeight:"80vh", overflowY:"auto", background:"#fff", borderRadius:16, zIndex:700, boxShadow:"0 24px 64px rgba(0,0,0,0.22)", padding:"22px 24px", fontFamily:"inherit" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18 }}>
          <div style={{ fontSize:17, fontWeight:700, color:C.navy }}>📋 List of Recipients</div>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", fontSize:20, color:C.muted }}>×</button>
        </div>
        <div style={{ fontSize:13, color:C.slate, marginBottom:14 }}>{template} · {count} recipients</div>
        {mockRecipients.map(r => (
          <div key={r.id} style={{ display:"flex", alignItems:"center", gap:14, padding:"11px 0", borderBottom:`1px solid ${C.border}` }}>
            <div style={{ width:34, height:34, borderRadius:"50%", background:C.primarySoft, color:C.primaryDark, display:"grid", placeItems:"center", fontSize:13, fontWeight:700, flexShrink:0 }}>
              {r.name.split(" ").map((w: string) => w[0]).join("").toUpperCase()}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:600, color:C.navy }}>{r.name}</div>
              <div style={{ fontSize:11, color:C.muted }}>{r.email}</div>
            </div>
          </div>
        ))}
        <div style={{ display:"flex", justifyContent:"flex-end", marginTop:16 }}>
          <button onClick={onClose} style={{ padding:"9px 20px", borderRadius:9, border:"none", background:"transparent", color:C.slate, fontSize:13, fontWeight:600, cursor:"pointer" }}>Close</button>
        </div>
      </div>
    </>
  );
};

export const BulkEmailHistoryPage = ({ navigateTo }: { navigateTo: (page: string) => void }) => {
  const t = useT();
  const [history, setHistory] = useState(MOCK_HISTORY);
  const [search, setSearch]   = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [previewTpl, setPreviewTpl] = useState<string | null>(null);
  const [recipientsTpl, setRecipientsTpl] = useState<{ template: string; count: number } | null>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const cancelEntry = (id: string) => {
    setHistory(prev => prev.map(h => h.id === id ? { ...h, status: "Cancelled" } : h));
    setMenuOpen(null);
  };

  const filtered = history.filter(h => {
    if (search && !h.template.toLowerCase().includes(search.toLowerCase()) && !h.responsible.toLowerCase().includes(search.toLowerCase())) return false;
    if (dateFilter && !h.dateTime.includes(dateFilter)) return false;
    if (statusFilter !== "all" && h.status.toLowerCase() !== statusFilter.toLowerCase()) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const from = filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, filtered.length);

  const thStyle: React.CSSProperties = {
    padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 700,
    color: C.slate, whiteSpace: "nowrap", background: C.light,
    borderBottom: `1px solid ${C.border}`,
  };

  return (
    <div style={{ padding:"24px 28px", fontFamily:"inherit" }}>
      {/* Breadcrumb */}
      <div style={{ fontSize:13, color:C.muted, marginBottom:8 }}>
        <span onClick={() => navigateTo("Dashboard")} style={{ cursor:"pointer" }}>⌂</span>
        <span style={{ margin:"0 6px" }}>›</span>
        <span onClick={() => navigateTo("Leads")} style={{ cursor:"pointer", color:C.slate }}>{t("contacts")}</span>
        <span style={{ margin:"0 6px" }}>›</span>
        <span style={{ color:C.text }}>{t("bulkEmailsHistory")}</span>
      </div>

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
        <h1 style={{ margin:0, fontSize:22, fontWeight:700, color:C.navy, letterSpacing:"-0.02em" }}>
          ✉️ {t("bulkEmailsHistory")}
        </h1>
      </div>

      {/* Table */}
      <div style={{ background:"#fff", border:`1px solid ${C.border}`, borderRadius:14, overflow:"hidden" }}>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr>
                <th style={thStyle}><span style={{ display:"inline-flex", alignItems:"center", gap:4 }}>{t("emailTemplate")} <span style={{ fontSize:9, color:C.muted }}>⇅</span></span></th>
                <th style={thStyle}><span style={{ display:"inline-flex", alignItems:"center", gap:4 }}>{t("recipients")} <span style={{ fontSize:9, color:C.muted }}>⇅</span></span></th>
                <th style={thStyle}><span style={{ display:"inline-flex", alignItems:"center", gap:4 }}>{t("dateAndTime")} <span style={{ fontSize:9, color:C.muted }}>⇅</span></span></th>
                <th style={thStyle}><span style={{ display:"inline-flex", alignItems:"center", gap:4 }}>{t("responsible")} <span style={{ fontSize:9, color:C.muted }}>⇅</span></span></th>
                <th style={thStyle}><span style={{ display:"inline-flex", alignItems:"center", gap:4 }}>{t("status")} <span style={{ fontSize:9, color:C.muted }}>⇅</span></span></th>
                <th style={{ ...thStyle, width:40 }}></th>
              </tr>
              {/* Filter row */}
              <tr style={{ background:"#fff", borderBottom:`1px solid ${C.border}` }}>
                <td style={{ padding:"8px 16px" }}>
                  <div style={{ position:"relative" }}>
                    <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="🔍" style={{ ...fieldStyle, width:"100%", paddingLeft:28 }} />
                    <span style={{ position:"absolute", left:9, top:"50%", transform:"translateY(-50%)", fontSize:13, color:C.muted }}>🔍</span>
                  </div>
                </td>
                <td style={{ padding:"8px 16px" }}>
                  <div style={{ position:"relative" }}>
                    <input placeholder="🔍" style={{ ...fieldStyle, width:"100%", paddingLeft:28 }} />
                    <span style={{ position:"absolute", left:9, top:"50%", transform:"translateY(-50%)", fontSize:13, color:C.muted }}>🔍</span>
                  </div>
                </td>
                <td style={{ padding:"8px 16px" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <input type="date" value={dateFilter} onChange={e => { setDateFilter(e.target.value); setPage(1); }} style={{ ...fieldStyle }} />
                    <span style={{ fontSize:15, color:C.muted, cursor:"pointer" }}>📅</span>
                  </div>
                </td>
                <td style={{ padding:"8px 16px" }}>
                  <input placeholder="🔍" style={{ ...fieldStyle, width:"100%" }} />
                </td>
                <td style={{ padding:"8px 16px" }}>
                  <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} style={{ ...fieldStyle, width:"100%", color: statusFilter === "all" ? C.muted : C.text }}>
                    <option value="all">All statuses</option>
                    <option value="sent">{t("sent")}</option>
                    <option value="scheduled">{t("scheduled")}</option>
                    <option value="failed">{t("failed")}</option>
                    <option value="cancelled">{t("cancelled")}</option>
                  </select>
                </td>
                <td style={{ padding:"8px 16px" }}/>
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 && (
                <tr><td colSpan={6} style={{ padding:"40px", textAlign:"center", color:C.muted, fontSize:13 }}>No records found.</td></tr>
              )}
              {pageRows.map(h => {
                const col = STATUS_COLOR[h.status] || C.muted;
                const icon = STATUS_ICON[h.status] || "";
                return (
                  <tr key={h.id} style={{ borderBottom:`1px solid ${C.border}` }}>
                    <td style={{ padding:"13px 16px", fontSize:13, fontWeight:500, color:C.navy }}>{h.template}</td>
                    <td style={{ padding:"13px 16px", fontSize:13, color:C.slate }}>{h.sent.toLocaleString()} of {h.total.toLocaleString()}</td>
                    <td style={{ padding:"13px 16px", fontSize:13, color:C.slate }}>{h.dateTime}</td>
                    <td style={{ padding:"13px 16px", fontSize:13, color:C.slate }}>{h.responsible}</td>
                    <td style={{ padding:"13px 16px" }}>
                      <span style={{ display:"inline-flex", alignItems:"center", gap:5, fontSize:12, fontWeight:700, color:col, background:col+"18", padding:"4px 12px", borderRadius:20 }}>
                        {icon} {h.status}
                      </span>
                    </td>
                    <td style={{ padding:"13px 16px", position:"relative" }}>
                      <button onClick={() => setMenuOpen(menuOpen === h.id ? null : h.id)}
                        style={{ background:"none", border:"none", cursor:"pointer", fontSize:18, color:C.muted, lineHeight:1 }}>⋮</button>
                      {menuOpen === h.id && (
                        <>
                          <div onClick={() => setMenuOpen(null)} style={{ position:"fixed", inset:0, zIndex:250 }}/>
                          <div style={{ position:"absolute", right:16, top:36, zIndex:260, background:"#fff", borderRadius:10, boxShadow:"0 8px 28px rgba(0,0,0,0.15)", border:`1px solid ${C.border}`, minWidth:210, padding:"5px 0" }}>
                            <div onClick={() => { setPreviewTpl(h.template); setMenuOpen(null); }}
                              style={{ padding:"10px 16px", fontSize:13, color:C.text, cursor:"pointer", display:"flex", alignItems:"center", gap:9 }}
                              onMouseEnter={e => (e.currentTarget.style.background="#F8FAFC")}
                              onMouseLeave={e => (e.currentTarget.style.background="transparent")}>
                              👁️ {t("previewTemplate")}
                            </div>
                            <div onClick={() => { setRecipientsTpl({ template: h.template, count: h.total }); setMenuOpen(null); }}
                              style={{ padding:"10px 16px", fontSize:13, color:C.text, cursor:"pointer", display:"flex", alignItems:"center", gap:9 }}
                              onMouseEnter={e => (e.currentTarget.style.background="#F8FAFC")}
                              onMouseLeave={e => (e.currentTarget.style.background="transparent")}>
                              📋 {t("listOfRecipients")}
                            </div>
                            {h.status === "Scheduled" && (
                              <div onClick={() => cancelEntry(h.id)}
                                style={{ padding:"10px 16px", fontSize:13, color:C.red, cursor:"pointer", display:"flex", alignItems:"center", gap:9, borderTop:`1px solid ${C.border}`, marginTop:4 }}
                                onMouseEnter={e => (e.currentTarget.style.background="#FEF2F2")}
                                onMouseLeave={e => (e.currentTarget.style.background="transparent")}>
                                ⊘ {t("cancelScheduled")}
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{ padding:"12px 16px", borderTop:`1px solid ${C.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page <= 1}
              style={{ padding:"5px 10px", borderRadius:7, border:`1px solid ${C.border}`, background:"#fff", color: page <= 1 ? C.muted : C.slate, cursor: page <= 1 ? "default" : "pointer", fontSize:12 }}>‹</button>
            <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page >= totalPages}
              style={{ padding:"5px 10px", borderRadius:7, border:`1px solid ${C.border}`, background:"#fff", color: page >= totalPages ? C.muted : C.slate, cursor: page >= totalPages ? "default" : "pointer", fontSize:12 }}>›</button>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            <select defaultValue={PAGE_SIZE} style={{ ...fieldStyle, width:"auto" }}>
              {[10, 25, 50].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <span style={{ fontSize:12, color:C.muted }}>
              {t("displaying")} {from}–{to} {t("of")} {filtered.length} {t("records")}
            </span>
          </div>
        </div>
      </div>

      {previewTpl && <PreviewModal template={previewTpl} onClose={() => setPreviewTpl(null)} />}
      {recipientsTpl && <RecipientsModal template={recipientsTpl.template} count={recipientsTpl.count} onClose={() => setRecipientsTpl(null)} />}
    </div>
  );
};
