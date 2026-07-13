import React from "react";
import { ALL_LEADS, ACTIVITIES_STORE, APPOINTMENTS } from "../../lib/core";
import { FullDashboardPage } from "./full-dashboard-page";
import { MVPDashboardPage } from "./mvp-dashboard-page";
import { GPDashboard } from "./gp-dashboard";

// Real display name per role (mirrors TopNav) — used for the personalised greeting.
const ROLE_NAME = { gp: "Anna Klein", vd: "Thomas Müller", superadmin: "Super Admin", manager: "Julia Bauer" };

// Wrapper that hosts the dashboards. Which one renders is driven by the app-wide
// page-version toggle (see TopNav) passed down as `version`. The advisor (GP) role
// gets its dedicated "Hello, <name>" layout in both versions.
export const DashboardPage = ({
  role,
  navigateTo,
  version = "mvp",
  leads = ALL_LEADS,
  activities = ACTIVITIES_STORE,
  setActivities,
  appointments = APPOINTMENTS,
}) => {
  if (role === "gp") return <GPDashboard navigateTo={navigateTo} userName={ROLE_NAME.gp} />;
  return version === "mvp"
    ? <MVPDashboardPage role={role} navigateTo={navigateTo} leads={leads} activities={activities} setActivities={setActivities} appointments={appointments} />
    : <FullDashboardPage role={role} navigateTo={navigateTo} />;
};
