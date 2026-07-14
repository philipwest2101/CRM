# LH-Vion - GP Dashboard

Wireframe: TBD

The GP Dashboard is the landing screen for a **Geschäftspartner (GP / Berater — Business Partner / Advisor)**. It gives the advisor a personal, at-a-glance view of their own book of business: their network, assigned leads, upcoming appointments, and open tasks — all filterable by time period. It shows only data that belongs to the signed-in advisor.

## Overview

As an authenticated Advisor (GP), I want a personal dashboard summarising my network, leads, appointments, and tasks, so I can start my day knowing what needs my attention without digging through separate screens.

- The dashboard shows only the signed-in advisor's own data (their network, their assigned leads, their appointments, their tasks).
- It is the default landing view for the Advisor (GP) role.
- All figures and lists respect the selected time period (see **Period Selector**).
- The interface is fully localised (English / German), including the greeting, role label, date, statuses, and activity types.

## Page Header

As an advisor, I want a personalised header, so the dashboard feels like mine and shows today's context.

- The header shows the advisor's avatar (initials derived from their name).
- A time-based greeting is shown next to the name: "Good morning" before 12:00, "Good afternoon" from 12:00 to 16:59, "Good evening" from 17:00 (localised).
- The greeting uses the advisor's **first name** only (e.g. "Good morning, Anna.").
- Below the name, a subline shows the role label ("Advisor (GP)" / "Berater (GP)") and the current date, formatted for the active language (e.g. "Tuesday, 14 July 2026" / "Dienstag, 14. Juli 2026").

## Quick Actions

As an advisor, I want quick actions in the header, so I can add or import contacts without leaving the dashboard.

- **Add Contact** — opens the Add Contact flow, scoped to the advisor's own leads ("my" view).
- **Import** — opens the import flow, scoped to the advisor's own leads ("my" view).
- Both actions are always available from the header.

## Period Selector

As an advisor, I want to switch the reporting period, so I can see my activity for different timeframes.

- Options: **Today, Week, Month, Quarter, Year** (localised).
- The default selection is **Today**.
- Exactly one period is selected at a time; the active period is visually highlighted.
- Changing the period updates the KPI strip, the Appointments list, and the My Network table figures.
- Changing the period resets the My Network table back to page 1.

## KPI Strip

As an advisor, I want key metrics summarised as cards, so I can see the size and state of my book at a glance.

- Four KPI cards, each with an icon, a label, and a value:
  - **My Network** — total contacts in the advisor's private network.
  - **My Leads** — leads assigned to the advisor.
  - **Appointments** — appointments in the selected period.
  - **Open Tasks** — tasks still open in the selected period.
- Values reflect the selected period and are formatted for the active language's locale (e.g. thousands separators: `5,840` / `5.840`).

## My Leads Panel

As an advisor, I want a preview of my assigned leads, so I can jump straight into working them.

- Lists the advisor's assigned leads (leads where the advisor is the responsible GP).
- Shows a preview of up to 5 leads; each row shows the lead's avatar, name, and city · source.
- Each row has a **Process** action that opens the lead's detail view (in the "my leads" context).
- An **All** link opens the full My Leads list.

## Appointments Panel

As an advisor, I want my upcoming appointments, so I know who I am meeting and when.

- Lists appointments for the selected period; the number shown is capped by the period's appointment count.
- Each row shows the time, date, contact name, and appointment type (e.g. Consultation, Recruiting, Business Opening, Investment Talk, Finance Talk — localised).
- A **Calendar** link opens the full calendar.

## Open Tasks Panel

As an advisor, I want my open tasks with the ability to tick them off, so I can track what still needs doing.

- Lists the advisor's open tasks; each row shows the task type and contact (e.g. "Email - Petra Müller"), the due date/time, and a type icon (email, document/GDPR, phone/follow-up).
- Each row has a checkbox to mark the task done.
- Completing a task shows it as checked and struck through; the state persists while the dashboard is open.
- Task types include Email, GDPR Renewal, and Follow Up Call (localised).
- A **Calendar** link opens the full calendar.

## My Network Table

As an advisor, I want a full, paginated table of my network, so I can browse and open any contact.

- Columns: **Name, Phone, Email, Status, Last Activity** (localised, each with a sort affordance).
- The record count reflects the selected period.
- **Status** values (New, To Do, N/A) are colour-coded (New = green, To Do = amber, N/A = muted).
- **Last Activity** shows the activity type (Lead, Opportunity, N/A).
- Clicking a row (or the underlined name) opens the advisor's contact list ("my" view).
- An **All** link opens the full network list.

### Pagination

- Page size is selectable: **10, 25, 50** (default 10).
- Previous / Next controls navigate pages; they are disabled on the first / last page respectively.
- A "Page X of Y" indicator and a "Displaying A–B of N records" summary are shown; N is formatted for the active locale.
- Changing the page size resets the view to page 1.

## Supporting Rules

- The dashboard is scoped to a single role: **Advisor (GP)**; it does not expose team or director data.
- "My Network" contacts are the advisor's **private** contacts, hidden from other users.
- "My Leads" are leads **assigned** to the advisor — fully editable and reportable.
- All labels, statuses, activities, appointment types, greetings, and dates are localised (English / German).
- Numeric values use locale-aware formatting (grouping separators) based on the active language.

## Faulty / Edge Cases

- No assigned leads → the My Leads panel renders empty (no rows), without error.
- No appointments in the period → the Appointments panel renders empty.
- Empty network (0 records) → the table shows "Displaying 0–0 of 0 records" and pagination controls stay disabled.
- Requesting a page beyond the last available page → the view clamps to the last valid page.
- Missing or blank advisor name → the header avatar falls back to a placeholder ("?") and the greeting omits the first name gracefully.
