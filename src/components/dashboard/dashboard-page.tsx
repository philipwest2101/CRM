import React, { useState } from "react";
import { C } from "../../theme";
import { ALL_LEADS, ACTIVITIES_STORE, APPOINTMENTS } from "../../lib/core";
import { FullDashboardPage } from "./full-dashboard-page";
import { MinimalDashboardPage } from "./minimal-dashboard-page";

// Wrapper that hosts both dashboards (Minimal + Full) behind a view toggle, so
// the lightweight overview and the rich role-based dashboard coexist.
const VIEWS = [
  { key: "minimal", label: "Minimal" },
  { key: "full",    label: "Full"    },
];

const ViewToggle = ({ view, setView }) => (
  <div style={{ display:"flex", justifyContent:"flex-end", padding:"16px 24px 0" }}>
    <div style={{ display:"inline-flex", background:"#fff", border:`1px solid ${C.border}`, borderRadius:10, padding:3, gap:3 }}>
      {VIEWS.map(v => (
        <button
          key={v.key}
          onClick={() => setView(v.key)}
          style={{
            padding:"6px 16px", borderRadius:8, border:"none", cursor:"pointer",
            fontSize:13, fontWeight:600, fontFamily:"inherit",
            background: view===v.key ? C.primary : "transparent",
            color:      view===v.key ? "#fff"    : C.slate,
          }}
        >
          {v.label}
        </button>
      ))}
    </div>
  </div>
);

export const DashboardPage = ({
  role,
  navigateTo,
  leads = ALL_LEADS,
  activities = ACTIVITIES_STORE,
  setActivities,
  appointments = APPOINTMENTS,
}) => {
  const [view, setView] = useState("minimal");
  return (
    <>
      <ViewToggle view={view} setView={setView} />
      {view === "minimal"
        ? <MinimalDashboardPage role={role} navigateTo={navigateTo} leads={leads} activities={activities} setActivities={setActivities} appointments={appointments} />
        : <FullDashboardPage role={role} navigateTo={navigateTo} />}
    </>
  );
};
