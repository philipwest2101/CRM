# LH-Vion — Activity Popups, Result Logging, Activity Feed & Timeline — Field Reference

Complete field inventory for the activity/logging surfaces of the CRM, extracted
from the current implementation in `src/`. Covers:

1. Activity popups for **Call, Email, Appointment and Task**
2. **Result / disposition logging** (call outcome, appointment outcome)
3. **Per-contact activity feed**
4. **Activity log entries to the timeline** (except call report sync)
5. **Log Call / Log Email / Log Appointment / Offline Log** forms

Convention in the tables below: **\*** = required field. "Source" points to the
component that renders the field. Shared vocabularies (statuses, types,
priorities) are defined once in `src/lib/core.tsx` and reused everywhere.

---

## 0. Shared vocabularies (single source of truth)

Defined in `src/lib/core.tsx` and reused by every form, modal and outcome picker.

| Vocabulary | Values |
|---|---|
| **Activity types — Tasks** (`TASK_TYPE_KEYS`) | Call 📞, Email ✉️, Note 📝 (surfaced as "To Do" in the Task modal) |
| **Activity types — Appointments** (`APPOINTMENT_TYPE_KEYS`) | Consultation 💼, Recruiting 🧑‍💼, Business Meeting 🤝, Other 📌 |
| **Priorities** (`PRIORITY_KEYS`) | Low, Normal, High, Urgent |
| **Recurrence** | Once, Daily, Weekly, Monthly, Yearly (Add-Activity) · "Every N day/week/month/year" (Task modal) |
| **Call dispositions** (`CALL_STATUS_OPTIONS`) | Reached – Interested · Reached – Not Interested · Reached – Callback Requested · Reached – Appointment Set · Not Reached – Voicemail · Not Reached – No Answer · Not Reached – Wrong Number |
| **Appointment / meeting outcome** | Completed · No-show · Rescheduled · Cancelled |
| **Stage Status — Lead** (`LEAD_STAGE_STATUSES`) | New · In Contact · Not Reached · Not Interested · Currently Not Interested · Difficult Case · Appointment · Follow Up · Qualified |
| **Stage Status — Network** (`NETWORK_STAGE_STATUSES`) | Customer · Partner · Prospect |
| **Reminder offsets** | 15 Minutes Before · 30 Minutes Before · 1 Hour Before · (1 Day Before — appointments) · Custom Date |

> **Lifecycle is system-managed.** Logging an activity records the **Status**
> (Stage Status) only; Lifecycle (Lead → Network) changes solely via the Convert
> action, so no form below offers a Lifecycle picker. The Status options shown in
> any form follow the contact's lifecycle (`stageStatusOptions(lifecycle)`).

---

## 1. Activity popups — Call, Email, Appointment, Task

### 1.1 Add Activity popup — unified creator
*Source: `src/components/calendar/new-activity-modal.tsx` (`NewActivityModal`)*

Creates both **Tasks** (Call/Email/Note) and **Appointments** (Consultation/
Recruiting/Business/Other). When opened from a type-specific chevron menu, the
Type is pre-selected and locked.

| Field | Req | Type | Notes |
|---|---|---|---|
| Type | ✱ | Grouped button picker | Appointments group + Tasks group; hidden/locked when pre-set |
| Title / Subject | \* | Text | Label adapts: "Call subject" / "Email subject" / "Note title" / "Meeting title" |
| Contact | — | Text search | Optional |
| Date | \* | Date | |
| Time | \* | Time | Shown only for types with a time; label adapts ("Start time" / "Due time"). Required when the type has a time |
| End time | — | Time | Appointment types only (`hasEnd`) |
| Duration | — | Quick-pick buttons | Call: 15/30/45/60/90 min · Consultation 30/45/60/90 · Recruiting 30/45/60 · Business 30/60/90. Sets End |
| Location | — | Text | Appointment types with `hasLocation` |
| Meeting link | — | URL | Appointment types with `hasLink` |
| Priority | — | Select | Urgent / High / Normal / Low (default Normal) |
| Recurrence | — | Select | Once / Daily / Weekly / Monthly / Yearly |
| Note | — | Textarea | |
| Push notification | — | Toggle | "Remind me before this activity" (default on) |

Save is enabled when Title + Date (+ Time, when the type has one) are set.

### 1.2 Task popup — Call / Email / To-Do
*Source: `src/components/calendar/task-modal.tsx` (`TaskModal`)*

Three states: **create · edit · view**.

| Field | Req | Type | Notes |
|---|---|---|---|
| Title | \* | Text | |
| Contact | (\*) | Select (or locked input) | Labelled required in the UI, but **not enforced** by save validation (only Title + Date + Time are). Locked to the current contact when opened from a contact (`lockContact`) |
| Type | \* | Button group | Call 📞 / Email ✉️ / To Do ✅ (note) |
| Priority | — | Button group | Low / Normal / High / Urgent |
| Date | \* | Date | |
| Time | \* | Time | Mandatory (defaults to 09:00) |
| Reminder | — | Checkbox + Select | 15 Min / 30 Min / 1 Hour Before / Custom Date |
| Reminder — custom | — | datetime-local | Shown when "Custom Date" chosen |
| Set to repeat | — | Checkbox + counter + unit | "every N day/week/month/year" |
| Email Template | — | Select | **Edit mode only** — not shown on Create or View (`task-modal.tsx`, rendered under `m==="edit"`); options from `EMAIL_TEMPLATES_STORE` |
| Description | — | Textarea | |

**View-mode actions:** Log a Call · Make a Call (Call tasks only) · Delete · Done.
**Edit-mode actions:** Delete · Cancel · Update.

### 1.3 Appointment popups — Lead vs Network

Opening an appointment on the Calendar routes to **one of two different modals
by the contact's lifecycle** (`calendar-page.tsx` → `openActivity`): Network
contacts get the actionable modal; Leads get a read-only modal, because a Lead's
appointment is worked from the lead's *Processing & Feedback* tab, not the
Calendar. (Task / Call / Email items open the Task popup in §1.2 — never an
appointment modal.)

#### 1.3a Network appointment popup — schedule / edit / view
*Source: `src/components/appointments/appointment-modal.tsx` (`AppointmentModal`)*

Also used for **creating/editing** any appointment (create/edit don't yet know a
lifecycle) and for scheduling from a contact. Three states: **create · edit · view**.

| Field | Req | Type | Notes |
|---|---|---|---|
| Title | \* | Text | |
| Contact | \* | Select (or locked input) | Locked to current contact when `lockContact` |
| Attendees | \* | Searchable multiselect | User's superiors (role-derived) + free-typed email addresses; stored as emails |
| Type | \* | Select | Consultation Appointment · Recruiting · Business Opening · Investment Talk · Finance Talk · Other |
| Type (Other) | \* | Text | Required custom label when Type = Other |
| Date | \* | Date | |
| Start | \* | Time | Mandatory (defaults 09:00) |
| End | — | Time | |
| Meeting Location | \* | Text | Physical address or a video-meeting URL |
| Attachments | — | Multiselect | From `DOCUMENT_TYPES_STORE`; system docs + uploads |
| Reminder | — | Checkbox + Select | 15 Min / 30 Min / 1 Hour / 1 Day Before / Custom Date |
| Reminder — custom | — | datetime-local | Shown when "Custom Date" chosen |
| Description | — | Textarea | |

**View-mode actions (Network):** ✏️ Edit · Cancel Appointment · Set Outcome.

#### 1.3b Lead appointment popup — read-only detail
*Source: `src/components/appointments/lead-appointment-modal.tsx` (`LeadAppointmentModal`)*

Read-only. Opens when a **Lead** appointment is clicked on the Calendar. Carries a
**LEAD** badge and no edit / cancel / outcome actions.

| Field | Type | Notes |
|---|---|---|
| Date & Time | Read-only row | |
| Contact | Read-only row | |
| Type | Read-only row | |
| Attendees | Read-only row | Shown when present |
| Meeting Location | Read-only row | Shown when present |
| Attachments | Read-only row | Shown when present |
| Description | Read-only text | Shown when present |

**Actions:** Open Processing & Feedback (deep-links to the lead's detail) · Close.
No editing — Lead appointments are worked in *Processing & Feedback*.

---

## 2. Result / disposition logging

### 2.1 Outbound Call popup (live call → outcome)
*Source: `src/components/leads/outbound-call-modal.tsx` (`OutboundCallModal`)*

Three phases: **pre** (briefing) → **active** (live timer) → **post** (log the
result). The post phase is the disposition form.

| Field | Req | Type | Notes |
|---|---|---|---|
| Call timer | (auto) | Elapsed mm:ss | Runs during the active phase; feeds the report |
| Call Status | \* | Select | `CALL_STATUS_OPTIONS` (7 dispositions) |
| Call Report | \* | Textarea | "What happened on this call?" |
| Status | \* | Select | Stage Status for the contact's lifecycle (Lifecycle is not editable here) |

**AI Suggestion panel** (post phase, before the user edits): proposes
`callStatus`, `stageStatus`, an improved `reportImproved`, a `confidence` %, and a
one-line `reasoning`. Accept All applies all three; Ignore dismisses it.

**Outcome-driven workflow** on Done: Reached–Interested / Appointment Set →
`appointment_scheduled`; Reached–Not Interested → `lead_not_interested`; Not
Reached → `lead_not_reached_1_4` or `lead_not_reached_5` (by attempt count);
Status Qualified/Customer → `lead_closed`. Confirmation: "Call logged
successfully · Timeline updated · Status saved".

### 2.2 Appointment Outcome popup
*Source: `src/components/appointments/appointment-outcome-modal.tsx` (`AppointmentOutcomeModal`)*

Network-only action (Lead appointments are worked in Processing & Feedback).

| Field | Req | Type | Notes |
|---|---|---|---|
| (Context line) | — | Read-only | Contact · date · time of the appointment |
| Meeting Status | \* | Select | Completed / No-show / Rescheduled / Cancelled |
| Meeting Report | \* | Textarea | "What happened in the meeting…" |
| Status | \* | Select | Network Stage Status (Customer / Partner / Prospect) |

Returns `{ status, report, stageStatus }`.

---

## 3. Per-contact activity feed
*Source: `src/components/leads/mvp-contact-detail-page.tsx` (`ActivitiesTab`) — the contact detail "Activities" tab*

A reverse-chronological feed of everything logged against one contact.

**List-level fields / controls**

| Element | Values |
|---|---|
| Filter tabs | All · Call · Email · Task · Meeting |
| Month grouping | Entries grouped by month heading, order preserved |
| Row (collapsed) | Day label · type icon · title · date-time · expand chevron |
| Pagination | Page X of N · prev/next · page size 5 / 10 / 25 · "Displaying A–B of T records" |

**Expanded detail — fields per entry type**

| Type | Detail fields |
|---|---|
| Meeting 🤝 | Hosted By · Meeting Outcome · Meeting Type · Meeting Duration · Meeting Location · Attendees · Description · Attachments · Meeting Note |
| Call 📞 | Call By · Call Status · Call Direction · Call Duration · Call Report · Call Recording |
| Email ✉️ | Sent By · Direction · Subject · Status · Email Report |
| Task ☑️ | Created By · Task Type · Priority · Status · Description |
| Update ✎ | Changed By · Field · From · To (field-change audit rows, e.g. Assignee / Labels) |

---

## 4. Activity log entries → Timeline (except call report sync)
*Source: `src/lib/core.tsx` (`TIMELINE_EVENTS`, `TIMELINE_META`); rendered in `src/components/leads/lead-drawer.tsx`*

The contact **Timeline** shows a chronological stream of system- and
user-generated events. Each entry carries the same field shape; the type drives
the icon/colour.

**Fields per timeline entry**

| Field | Notes |
|---|---|
| Time | Relative/absolute timestamp (e.g. "Today, 09:30") |
| Actor | User or "System" |
| Action | Human-readable description of what happened |
| Type | Drives icon + colour (see below) |

**Timeline entry types** (`TIMELINE_META`)

| Type | Icon | Meaning |
|---|---|---|
| call | 📞 | Call activity / scheduling |
| attempt | 📵 | Contact attempt (reached / not reached) |
| assign | ⚡ | Auto/manual assignment change |
| email | ✉️ | Email sent (manual or automated) |
| import | 📥 | Contact captured / imported |
| note | 📝 | Manual note / reminder |

> **Excluded: call report sync.** Per project scope, **in-app calling lives in
> the mobile app; only call reports flow back** to this CRM. The synchronisation
> of a call report from the mobile app into the timeline is therefore **out of
> scope for this document** — the timeline entries listed above are the ones
> generated within this CRM (manual logs, automations, assignments, imports).

---

## 5. Log forms — Call / Email / Appointment / Offline

Two equivalent surfaces exist. **Variant A** uses four dedicated modals (MVP
contact detail). **Variant B** is one unified modal with a type switch (lead
detail). Both are reached via the **⋮ More → Log Activity** menu on a contact.

### 5.A Dedicated Log modals
*Source: `src/components/leads/mvp-contact-detail-page.tsx`*

Every Log modal ends with a **Status** row (`stageStatusOptions(lifecycle)`) and
Save / Cancel.

**Log a Call** (`LogCallModal`)

| Field | Req | Type | Options |
|---|---|---|---|
| Contact Name/Number | \* | Search input | |
| Call Direction | \* | Select | Inbound · Outbound |
| Call Status | \* | Select | Reached · Not Reached · Voicemail · Callback Requested |
| Call Duration | \* | Number (min) | |
| Date | \* | Date | |
| Time | \* | Time | |
| Report Of Call | \* | Textarea | |
| Status | — | Select | Stage Status for lifecycle |

**Log an Email** (`LogEmailModal`)

| Field | Req | Type | Options |
|---|---|---|---|
| Direction | \* | Select | Sent · Received |
| Email Address | \* | Text | |
| Subject | \* | Text | |
| Date | \* | Date | |
| Time | \* | Time | |
| Email Report | \* | Textarea | |
| Status | — | Select | Stage Status for lifecycle |

**Log on Appointment** (`LogAppointmentModal`)

| Field | Req | Type | Options |
|---|---|---|---|
| Meeting Type | \* | Select | Consultation Appointment · Recruiting · Business Opening · Investment Talk · Finance Talk · Other |
| Meeting Outcome | \* | Select | Completed · No Show · Rescheduled · Cancelled |
| Date | \* | Date | |
| Start | \* | Time | |
| End | \* | Time | |
| Meeting Report | \* | Textarea | |
| Status | — | Select | Stage Status for lifecycle |

**Offline Log** (`OfflineLogModal`)

| Field | Req | Type | Notes |
|---|---|---|---|
| Date | \* | Date | |
| Time | \* | Time | |
| Note | \* | Textarea | |
| Status | — | Select | Stage Status for lifecycle |

### 5.B Unified Log modal (type switch)
*Source: `src/components/leads/lead-detail-page.tsx` — action modal, `logType` = call / email / appointment / offline*

| Field | Req | Type | Notes |
|---|---|---|---|
| Log type | \* | Button group | 📞 Call · ✉️ Email · 📅 Appointment · 📝 Offline |
| Outcome | — | Select | Options depend on log type (below) |
| Date | — | Date | |
| Time | — | Time | |
| Notes | — | Textarea | "What happened during this interaction…" |

**Outcome options by log type**

| Log type | Outcome options |
|---|---|
| Call | ✅ Reached — Interested · ✅ Reached — Appointment set · 👎 Reached — Not Interested · 📵 Not Reached — No answer · 📵 Not Reached — Voicemail · 🔄 Callback Requested |
| Email | 📤 Email sent · 📥 Positive response · 📥 Negative response · 🔄 Follow-up requested |
| Appointment | ✅ Completed · ❌ No-show / Cancelled · 🔄 Rescheduled · 🕐 Follow-up required |
| Offline | 🤝 In-person meeting · 💬 WhatsApp / SMS · 📮 Letter / Post · 📱 Other channel |

Save button label: **📝 Save Log**; confirmation "✅ Saved successfully".

---

## Appendix — Source map

| Surface | File |
|---|---|
| Add Activity popup | `src/components/calendar/new-activity-modal.tsx` |
| Task popup | `src/components/calendar/task-modal.tsx` |
| Appointment popup — Network (actionable) | `src/components/appointments/appointment-modal.tsx` |
| Appointment popup — Lead (read-only) | `src/components/appointments/lead-appointment-modal.tsx` |
| Calendar popup routing (type + Lead/Network) | `src/components/calendar/calendar-page.tsx` (`openActivity`) |
| Outbound Call (disposition) | `src/components/leads/outbound-call-modal.tsx` |
| Appointment Outcome | `src/components/appointments/appointment-outcome-modal.tsx` |
| Per-contact activity feed | `src/components/leads/mvp-contact-detail-page.tsx` (`ActivitiesTab`) |
| Timeline events & meta | `src/lib/core.tsx` (`TIMELINE_EVENTS`, `TIMELINE_META`) · rendered in `src/components/leads/lead-drawer.tsx` |
| Dedicated Log modals | `src/components/leads/mvp-contact-detail-page.tsx` |
| Unified Log modal | `src/components/leads/lead-detail-page.tsx` |
| Shared vocabularies | `src/lib/core.tsx` |
