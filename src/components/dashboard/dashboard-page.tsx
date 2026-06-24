import React from "react";
import { ALL_LEADS, ACTIVITIES_STORE, APPOINTMENTS } from "../../lib/core";
import { FullDashboardPage } from "./full-dashboard-page";
import { MVPDashboardPage } from "./mvp-dashboard-page";

// Wrapper that hosts both dashboards (MVP + Full). Which one renders is driven by
// the app-wide page-version toggle (see TopNav) passed down as `version`.
export const DashboardPage = ({
  role,
  navigateTo,
  version = "mvp",
  leads = ALL_LEADS,
  activities = ACTIVITIES_STORE,
  setActivities,
  appointments = APPOINTMENTS,
}) => (
  version === "mvp"
    ? <MVPDashboardPage role={role} navigateTo={navigateTo} leads={leads} activities={activities} setActivities={setActivities} appointments={appointments} />
    : <FullDashboardPage role={role} navigateTo={navigateTo} />
);
