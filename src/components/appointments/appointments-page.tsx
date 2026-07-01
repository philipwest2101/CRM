import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { NewAppointmentModal } from "./new-appointment-modal";
import { APPOINTMENTS, APPT_STATUS_META, APPT_TYPE_META } from "../../lib/core";
import { C } from "../../theme";

export const AppointmentsPage = ({ role, navigateTo, appointments=APPOINTMENTS, addAppointment }) => {
  const TODAY   = "2026-02-24";
  const myGP    = "Anna Klein";
  const myVD    = "Thomas Müller";
  const [filterType,    setFilterType]    = useState("all");
  const [filterGP,      setFilterGP]      = useState("all");
  const [tab,           setTab]           = useState("upcoming");
  const [selected,      setSelected]      = useState(null);
  const [showNewAppt,   setShowNewAppt]   = useState(false);

  const all = appointments.filter(a => {
    if (role === "gp" && a.gp !== myGP) return false;
    if (role === "vd" && a.vd !== myVD) return false;
    if (filterGP   !== "all" && a.gp   !== filterGP)   return false;
    if (filterType !== "all" && a.type !== filterType)  return false;
    return true;
  });

  const shown = tab === "upcoming"
    ? all.filter(a => a.date >= TODAY && ["upcoming","confirmed"].includes(a.status))
    : tab === "past"
    ? all.filter(a => a.date < TODAY || ["done","cancelled","noshow"].includes(a.status))
    : all;

  const sorted = [...shown].sort((a,b) =>
    a.date === b.date
      ? a.start.localeCompare(b.start)
      : a.date.localeCompare(b.date)
  );

  // Group by date
  const dateGroups = [];
  const seen = {};
  sorted.forEach(a => {
    if (!seen[a.date]) {
      seen[a.date] = [];
      dateGroups.push({ date: a.date, appts: seen[a.date] });
    }
    seen[a.date].push(a);
  });

  const gpList = [...new Set(appointments.map(a => a.gp))].sort();

  return (
    <div style={{ padding:"24px 28px", fontFamily:"inherit" }}>
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24 }}>
        <div>
          <h1 style={{ margin:0, fontSize:26, fontWeight:800, color:C.navy }}>Appointments</h1>
          <p style={{ margin:"4px 0 0", fontSize:13, color:C.muted }}>
            {all.length} total · {all.filter(a=>a.date>=TODAY&&["upcoming","confirmed"].includes(a.status)).length} upcoming
          </p>
        </div>
        <button onClick={()=>setShowNewAppt(true)} style={{ padding:"9px 18px", borderRadius:8, border:"none", background:C.primary, color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer" }}>
          + New Appointment
        </button>
      </div>

      {/* KPI row */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:20 }}>
        {[
          { label:"Today",       value: all.filter(a=>a.date===TODAY).length,                                             color:C.blue   },
          { label:"This week",   value: all.filter(a=>a.date>="2026-02-24"&&a.date<="2026-02-28").length,                color:C.indigo },
          { label:"Done MTD",    value: all.filter(a=>a.status==="done").length,                                          color:C.green  },
          { label:"No-shows",    value: all.filter(a=>["noshow","cancelled"].includes(a.status)).length,                  color:C.amber  },
        ].map(k => (
          <div key={k.label} style={{ padding:"14px 18px", borderRadius:10, background:k.color+"10", border:`1px solid ${k.color}25` }}>
            <div style={{ fontSize:10, color:C.muted, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:4 }}>{k.label}</div>
            <div style={{ fontSize:28, fontWeight:800, color:k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:16, padding:"12px 16px", background:"#fff", borderRadius:10, border:`1px solid ${C.border}` }}>
        {/* Tab strip */}
        <div style={{ display:"flex", background:"#F1F5F9", borderRadius:8, padding:3, gap:2 }}>
          {[["upcoming","Upcoming"],["past","Past"],["all","All"]].map(([k,l]) => (
            <button key={k} onClick={() => setTab(k)}
              style={{ padding:"5px 14px", borderRadius:6, border:"none", fontSize:12, fontWeight:700,
                background: tab===k ? "#fff" : "transparent",
                color: tab===k ? C.navy : C.muted,
                cursor:"pointer", fontFamily:"inherit",
                boxShadow: tab===k ? "0 1px 3px rgba(0,0,0,0.1)" : "none" }}>
              {l}
            </button>
          ))}
        </div>

        <div style={{ width:1, height:24, background:C.border }} />

        {role !== "gp" && (
          <select value={filterGP} onChange={e => setFilterGP(e.target.value)}
            style={{ border:`1px solid ${C.border}`, borderRadius:7, padding:"6px 10px", fontSize:12, fontFamily:"inherit", color:C.slate, background:"#fff" }}>
            <option value="all">All Advisors</option>
            {gpList.map(gp => <option key={gp}>{gp}</option>)}
          </select>
        )}

        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          style={{ border:`1px solid ${C.border}`, borderRadius:7, padding:"6px 10px", fontSize:12, fontFamily:"inherit", color:C.slate, background:"#fff" }}>
          <option value="all">All Types</option>
          <option value="call">📞 Phone Call</option>
          <option value="video">📹 Video Call</option>
          <option value="inperson">🤝 In-Person</option>
        </select>

        <span style={{ marginLeft:"auto", fontSize:12, color:C.muted, fontWeight:600 }}>
          {sorted.length} appointment{sorted.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* List */}
      <div style={{ background:"#fff", borderRadius:12, border:`1px solid ${C.border}`, overflow:"hidden" }}>
        {dateGroups.length === 0 && (
          <div style={{ padding:"60px 20px", textAlign:"center", color:C.muted }}>
            <div style={{ fontSize:36, marginBottom:12 }}>📅</div>
            <div style={{ fontSize:15, fontWeight:600 }}>No appointments</div>
            <div style={{ fontSize:12, marginTop:6 }}>Try switching to "All" or changing the filters</div>
          </div>
        )}

        {dateGroups.map(group => {
          const isToday = group.date === TODAY;
          const d = new Date(group.date + "T12:00:00");
          const label = isToday ? "Today — " + d.toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long"})
            : d.toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long",year:"numeric"});

          return (
            <div key={group.date}>
              {/* Date header */}
              <div style={{ padding:"10px 20px", background: isToday ? "#EFF6FF" : "#F8FAFC",
                borderBottom:`1px solid ${C.border}`,
                fontSize:11, fontWeight:700, color: isToday ? C.blue : C.muted,
                textTransform:"uppercase", letterSpacing:"0.07em" }}>
                {label}
              </div>

              {/* Appointment rows */}
              {group.appts.map((a, i) => {
                const tm  = APPT_TYPE_META[a.type]  || APPT_TYPE_META.call;
                const sm  = APPT_STATUS_META[a.status] || APPT_STATUS_META.upcoming;
                return (
                  <div key={a.id}
                    onClick={() => setSelected(a)}
                    style={{ display:"flex", alignItems:"center", gap:16, padding:"14px 20px",
                      borderBottom: i < group.appts.length-1 ? `1px solid ${C.border}` : "none",
                      cursor:"pointer", background:"#fff",
                      borderLeft: `4px solid ${tm.color}` }}
                    onMouseEnter={e => e.currentTarget.style.background = "#F8FAFC"}
                    onMouseLeave={e => e.currentTarget.style.background = "#fff"}>

                    {/* Time */}
                    <div style={{ width:56, flexShrink:0, textAlign:"center" }}>
                      <div style={{ fontSize:16, fontWeight:800, color:tm.color, lineHeight:1 }}>{a.start}</div>
                      <div style={{ fontSize:10, color:C.muted, marginTop:3 }}>{a.end}</div>
                    </div>

                    {/* Contact name + details */}
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                        <span style={{ fontSize:14, fontWeight:700, color:C.text }}>{a.lead}</span>
                        <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:10,
                          color:sm.color, background:sm.color+"15" }}>{sm.label}</span>
                        <span style={{ fontSize:10, padding:"2px 7px", borderRadius:7,
                          color:tm.color, background:tm.color+"12", fontWeight:600 }}>{tm.label}</span>
                      </div>
                      <div style={{ fontSize:11, color:C.muted }}>
                        {a.gp} {a.vd && a.vd !== a.gp ? `· ${a.vd}` : ""}
                        {a.notes ? ` — ${a.notes}` : ""}
                      </div>
                    </div>

                    <div style={{ fontSize:14, color:C.border }}>›</div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Detail modal */}
      {selected && (
        <>
          <div onClick={() => setSelected(null)}
            style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.35)", zIndex:400 }}/>
          <div style={{ position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%)",
            width:440, background:"#fff", borderRadius:16, zIndex:500,
            boxShadow:"0 24px 64px rgba(0,0,0,0.2)", padding:"24px", fontFamily:"inherit" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
              <div style={{ fontSize:15, fontWeight:800, color:C.navy }}>Appointment Detail</div>
              <button onClick={() => setSelected(null)}
                style={{ width:26, height:26, borderRadius:"50%", border:`1px solid ${C.border}`, background:"#F8FAFC", cursor:"pointer", fontSize:14 }}>×</button>
            </div>
            {[
              ["Contact",       selected.lead],
              ["Date",       selected.date],
              ["Time",       `${selected.start} – ${selected.end}`],
              ["Type",       APPT_TYPE_META[selected.type]?.label || selected.type],
              ["Status",     APPT_STATUS_META[selected.status]?.label || selected.status],
              ["Advisor", selected.gp],
              ["Director",   selected.vd],
              ["Notes",      selected.notes || "—"],
            ].map(([k,v]) => (
              <div key={k} style={{ display:"flex", gap:12, padding:"8px 0", borderBottom:`1px solid ${C.border}`, fontSize:13 }}>
                <span style={{ color:C.muted, width:80, flexShrink:0 }}>{k}</span>
                <span style={{ color:C.text, flex:1, fontWeight:500 }}>{v}</span>
              </div>
            ))}
            <button onClick={() => setSelected(null)}
              style={{ width:"100%", marginTop:18, padding:"10px", borderRadius:9, border:"none",
                background:C.primary, color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer" }}>
              Close
            </button>
          </div>
        </>
      )}
      {showNewAppt && <NewAppointmentModal lead={null} onClose={()=>setShowNewAppt(false)} role={role} onAdd={addAppointment} />}
    </div>
  );
};

// ─── New Appointment Modal ────────────────────────────────────────────────────
