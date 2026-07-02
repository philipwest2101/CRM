# Vion CRM — Proposed Epics

This document proposes a set of **epics** for the Vion CRM project, derived from
the current codebase (`src/components/*`, top navigation, and role model) and the
reference specifications in this `docs/` folder. It is intended as a starting
point for creating epics in Jira.

## Context

- **Roles:** Super Admin (SA), Sales Director / *Vertriebsdirektor* (VD),
  Advisor / *Geschäftspartner* (GP).
- **"Contact" and "Lead" mean the same thing.**
- The app is currently a fully client-side React + Vite UI with in-memory mock
  data; there is no backend yet. Calling lives on the companion mobile app —
  only call reports flow back.

## How to use this list

Each epic below has a **goal** and a set of **sample stories**. Sample stories
are illustrative, not exhaustive — they show the scope the epic is meant to
cover.

---

## 1. Contacts / Leads Management

**Goal:** Core lead list, detail view, drawer, and configurable lifecycle
statuses.

- Contact list with filters and views
- Lead detail page
- Quick actions from the contact detail view
- Configurable Lifecycle Stage + Stage Status (admin-dynamic, not hardcoded)
- Contact add/edit form

## 2. Lead Capture & Import

**Goal:** Bring leads into the system from external sources.

- Import sources
- Import history
- Field mapping against the master contact template (`Vion_MASTER_CONTACT`)
- Lead capture forms

## 3. Lead Assignment & Distribution

**Goal:** Auto-assignment rules plus smart and bulk (re)assignment across the
hierarchy.

- Auto-assign rule editor
- SA smart assignment
- VD smart reassignment
- Bulk assignment (see `docs/User_Story_Bulk_Assignment.md`)

## 4. Appointments & Calendar

**Goal:** Scheduling, activities, tasks, and reminders.

- Calendar view
- New appointment / activity / task modals
- Appointment outcomes
- Reminders
- Attendee handling

## 5. Email Marketing & Automation

**Goal:** Newsletter campaigns, templates, journeys, and bulk sends.

- Campaign builder
- Template editor
- Email automations
- Customer journeys
- Bulk email history

## 6. Dashboards & Analytics

**Goal:** Role-based dashboards (SA / VD / GP) and reports.

- SA / VD / GP dashboards
- Time-slot filters (Today / Week / Month / Quarter / Year)
- Analytics tab
- Reports 1–3
- Call-attempt cross-tabs

## 7. AI Features

**Goal:** The AI differentiators layered across the CRM.

- Lead AI scoring
- AI insights
- Objection roleplay
- Voice-to-CRM
- Meeting-prep briefs
- Call analysis
- AI agents panel and floating agent chat

## 8. Events Management

**Goal:** Manage events and connect them to leads.

- Events list and creation
- Attendance
- Event-to-lead linkage

## 9. Education Hub

**Goal:** Learning content for advisors and its administration.

- SA education management
- GP education / learning view

## 10. Settings & Administration

**Goal:** Configurable statuses, document types, workflow rules, automations,
and audit trail.

- Status configuration
- Document types
- Workflow rule editor
- Automations
- Audit log
- Admin toggles

## 11. Localization (i18n)

**Goal:** Full German / English support throughout (`src/lib/i18n.tsx`).

- Language switcher
- Translation coverage
- German domain-term handling (English equivalent on first use)

## 12. Design System & UI Foundation

**Goal:** The shared component kit and visual-consistency contract.

- Design tokens / theme
- Shared UI primitives (badges, charts, cards)
- Alignment with the LH-Vion design-system reference

## 13. Backend & Mobile Integration *(future / cross-cutting)*

**Goal:** Make the app real — persistence, shared backend, and mobile call
reports.

- Shared backend / DB integration
- Mobile call-report ingestion
- GDPR / compliance panel
- Data persistence (replace in-memory mock data)

---

## Open questions before committing to Jira

- **GDPR / Compliance** is currently folded into Epic 13. If compliance is a
  first-class concern, promote it to its own epic.
- **Design System (Epic 12)** is sometimes tracked as a standalone ongoing
  initiative rather than a product epic.
- **AI (Epic 7)** is large and may later split into "AI Assist"
  (scoring / insights) and "AI Voice & Calls" (voice-to-CRM, call analysis).
