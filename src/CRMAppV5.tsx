import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { AutoAssignPage } from "./components/auto-assign/auto-assign-page";
import { CalendarPage } from "./components/calendar/calendar-page";
import { DashboardPage } from "./components/dashboard/dashboard-page";
import { EducationPage } from "./components/education/education-page";
import { GPEducationPage } from "./components/education/gp-education-page";
import { EmailMarketingPage } from "./components/email/email-marketing-page";
import { EventsPage } from "./components/events/events-page";
import { TopNav } from "./components/layout/top-nav";
import { LeadCapturePage } from "./components/lead-capture/lead-capture-page";
import { LeadDetailPage } from "./components/leads/lead-detail-page";
import { LeadsPage } from "./components/leads/leads-page";
import { ReportsPage } from "./components/reports/reports-page";
import { SettingsPage } from "./components/settings/settings-page";
import { ACTIVITIES_STORE, APPOINTMENTS, EMAIL_TEMPLATES_STORE, WORKFLOW_RULES_STORE } from "./lib/core";
import { C } from "./theme";

export default function CRMAppV5() {
  const [page, setPage]               = useState("Dashboard");
  const [role, setRole]               = useState("superadmin");
  const [currentLead, setCurrentLead] = useState(null);

  // ── Shared state ────────────────────────────────────────────────────────────
  const [appointments, setAppointments] = useState(APPOINTMENTS);
  const [activities,    setActivities]    = useState(ACTIVITIES_STORE);
  const [reminders,    setReminders]    = useState([
    { id:"r1", title:"Follow-up call — Sandra Richter",    lead:"Sandra Richter",  entityType:"lead",       date:"Today",        time:"14:00", recur:"Once",   priority:"high",   status:"pending",   channels:["push","inapp"], type:"manual"   },
    { id:"r2", title:"Appointment prep — Dirk Schumacher", lead:"Dirk Schumacher", entityType:"appointment", date:"Today",        time:"13:00", recur:"Once",   priority:"normal", status:"pending",   channels:["push","inapp"], type:"workflow"  },
    { id:"r3", title:"Birthday — Klaus Weber",             lead:"Klaus Weber",     entityType:"lead",        date:"Tomorrow",     time:"09:00", recur:"Yearly", priority:"low",    status:"pending",   channels:["inapp"],        type:"template"  },
    { id:"r4", title:"Re-engage — Claudia Becker",         lead:"Claudia Becker",  entityType:"lead",        date:"26 Feb 2026",  time:"10:30", recur:"Once",   priority:"normal", status:"pending",   channels:["push","inapp"], type:"workflow"  },
    { id:"r5", title:"Weekly team check-in",               lead:null,              entityType:"task",        date:"Every Monday", time:"08:30", recur:"Weekly", priority:"low",    status:"active",    channels:["push"],         type:"manual"    },
    { id:"r6", title:"Q1 Finanz follow-up campaign",       lead:null,              entityType:"lead",        date:"28 Feb 2026",  time:"09:00", recur:"Once",   priority:"normal", status:"completed", channels:["push","inapp"], type:"template"  },
  ]);

  // ── Push toast ref ──────────────────────────────────────────────────────────
  const pushRef = React.useRef(null);
  const triggerPush = (title, body) => {
    if (pushRef.current) pushRef.current(title, body);
  };

  // ── Workflow engine ─────────────────────────────────────────────────────────
  // ── Language-aware template resolver ───────────────────────────────────────
  const resolveTemplate = (rule, lead) => {
    const leadLang = lead?.lang || "de";

    // New journey-based resolution (emailJourney set)
    if (rule.emailJourney) {
      const match = EMAIL_TEMPLATES_STORE.find(
        t => t.journey === rule.emailJourney && t.lang === leadLang && t.published !== false
      );
      if (match) return { tpl: match, resolved: leadLang, fallback: false };

      // Fallback to DE if no language match
      const fallback = EMAIL_TEMPLATES_STORE.find(
        t => t.journey === rule.emailJourney && t.lang === "de" && t.published !== false
      );
      if (fallback) return { tpl: fallback, resolved: "de", fallback: true };
      return { tpl: null, resolved: null, fallback: false };
    }

    // Legacy: specific templateId
    if (rule.emailTemplateId) {
      const tpl = EMAIL_TEMPLATES_STORE.find(t => t.id === rule.emailTemplateId && t.published !== false);
      return { tpl, resolved: tpl?.lang || "de", fallback: false };
    }

    return { tpl: null, resolved: null, fallback: false };
  };

  const runWorkflow = React.useCallback((trigger, lead) => {
    const activeRules = WORKFLOW_RULES_STORE.filter(r => r.active && r.trigger === trigger);
    activeRules.forEach(rule => {
      const leadName = lead?.name || "Contact";
      const leadLang = lead?.lang || "de";
      const langFlag = leadLang === "en" ? "🇬🇧" : "🇩🇪";

      // ── Auto email — language-aware ────────────────────────────────────────
      const sendEmail = rule.sendEmail || rule.actions?.includes("auto_email");
      if (sendEmail) {
        const { tpl, resolved, fallback } = resolveTemplate(rule, lead);
        if (tpl) {
          const delayLabel = (!rule.delay || rule.delay===0) ? "Immediately" : `After ${rule.delay} ${rule.delayUnit}`;
          const fallbackNote = fallback ? ` (🇩🇪 DE fallback — no ${langFlag} variant)` : "";
          triggerPush(
            `✉️ Email sent ${langFlag} — ${leadName}`,
            `${tpl.name}${fallbackNote} · ${delayLabel}`
          );
        } else {
          triggerPush(
            `⚠️ Email not sent — ${leadName}`,
            `No active template found for "${rule.emailJourney||rule.emailTemplateId}" in ${langFlag}`
          );
        }
      }

      // ── Task ─────────────────────────────────────────────────────────────────
      const createTask = rule.createTask || rule.actions?.includes("task") || rule.createReminder || rule.actions?.includes("reminder");
      const taskTitle  = rule.taskTitle || rule.reminderTitle;
      if (createTask && taskTitle) {
        // Due date is relative to when the trigger fires ("now" is mocked here).
        const due = new Date("2026-02-24T09:00:00");
        const v = rule.taskDueValue || 0;
        if (rule.taskDueUnit === "hours")      due.setHours(due.getHours() + v);
        else if (rule.taskDueUnit === "weeks") due.setDate(due.getDate() + v * 7);
        else                                   due.setDate(due.getDate() + v);
        const reminder = {
          id: `r_wf_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
          title: taskTitle.replace("{contact}", leadName).replace("{attempt}", lead?.attempts||1),
          lead: leadName,
          entityType: "lead",
          date: due.toISOString().slice(0,10),
          time: "",
          recur: "Once",
          priority: rule.taskPriority || rule.reminderPriority || "normal",
          status: "pending",
          channels: rule.taskRemind ? ["push","inapp"] : ["inapp"],
          assignedTo: rule.taskRoles || ["gp"],
          type: "workflow",
        };
        setReminders(prev => [reminder, ...prev]);
        setActivities(prev => [{
          ...reminder,
          type: "note",
          title: reminder.title,
          entityType: "reminder",
          category: "reminder",
        }, ...prev]);
      }

      // ── Push ───────────────────────────────────────────────────────────────
      const sendPush = rule.sendPush || rule.actions?.includes("push");
      if (sendPush && !sendEmail) {
        triggerPush(`⚡ ${rule.name}`, `${leadName} · ${rule.name}`);
      }
    });
  }, []);

  const addAppointment = (appt) => {
    setAppointments(prev => [appt, ...prev]);
    // Also add to unified activities store
    const act = {
      id: appt.id, type: appt.type||"inperson",
      title: appt.lead, lead: appt.lead, leadId: appt.leadId,
      date: appt.date, time: appt.start, end: appt.end,
      gp: appt.gp, vd: appt.vd, status: "upcoming",
      priority: "normal", note: appt.notes||"",
      recur: "Once", channels: ["push","inapp"],
      entityType: "appointment", category: "appointment",
    };
    setActivities(prev => [act, ...prev]);
    ACTIVITIES_STORE.unshift(act);
    runWorkflow("appointment_scheduled", { name: appt.lead });
  };

  const addReminder = (reminder) => {
    setReminders(prev => [reminder, ...prev]);
    // Also add to unified activities store
    const act = {
      id: reminder.id, type: reminder.type==="workflow"?"call":"note",
      title: reminder.title, lead: reminder.lead, leadId: null,
      date: reminder.date, time: reminder.time, end: "",
      gp: "Anna Klein", vd: "Thomas Müller",
      status: reminder.status||"pending",
      priority: reminder.priority||"normal",
      note: reminder.note||"",
      recur: reminder.recur||"Once",
      channels: reminder.channels||["push","inapp"],
      entityType: "reminder", category: "reminder",
    };
    setActivities(prev => [act, ...prev]);
    ACTIVITIES_STORE.unshift(act);
    triggerPush(
      `⏰ Reminder set — ${reminder.title}`,
      `${reminder.date}${reminder.time ? ` at ${reminder.time}` : ""}`
    );
  };

  const navigateTo = (dest, lead=null) => {
    if (lead) setCurrentLead(lead);
    setPage(dest);
  };

  return (
    <div style={{ minHeight:"100vh",background:C.light,fontFamily:"'DM Sans','Segoe UI',sans-serif",color:C.text }}>
      <TopNav page={page} setPage={setPage} role={role} setRole={setRole} pushRef={pushRef} />
      {page==="Dashboard"       && <DashboardPage        role={role} navigateTo={navigateTo} />}
      {page==="Leads"           && <LeadsPage            role={role} navigateTo={navigateTo} />}
      {page==="LeadDetail"      && <LeadDetailPage       role={role} navigateTo={navigateTo} lead={currentLead} addAppointment={addAppointment} addReminder={addReminder} runWorkflow={runWorkflow} />}
      {(page==="Appointments"||page==="Calendar") && <CalendarPage role={role} navigateTo={navigateTo} activities={activities} setActivities={setActivities} addAppointment={addAppointment} addReminder={addReminder} />}
      {(page==="Reminders"||page==="Activities") && <CalendarPage role={role} navigateTo={navigateTo} activities={activities} setActivities={setActivities} addAppointment={addAppointment} addReminder={addReminder} />}
      {page==="AutoAssign"      && <AutoAssignPage        role={role} navigateTo={navigateTo} />}
      {page==="LeadCapture"     && <LeadCapturePage       role={role} navigateTo={navigateTo} />}
      {page==="Settings"        && <SettingsPage          role={role} navigateTo={navigateTo} />}
      {page==="Email Marketing"  && <EmailMarketingPage     role={role} navigateTo={navigateTo} />}
      {page==="Education"      && <EducationPage        role={role} navigateTo={navigateTo} />}
      {page==="GPEducation"    && <GPEducationPage      navigateTo={navigateTo} />}
      {page==="Events"         && <EventsPage           role={role} navigateTo={navigateTo} />}
      {page==="Reports"        && <ReportsPage          role={role} navigateTo={navigateTo} />}
    </div>
  );
}

