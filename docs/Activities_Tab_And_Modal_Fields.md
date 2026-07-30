# LH-Vion — Activities Tab & Modal Fields

A focused field reference for **two things only**:

1. **Activities tab** (contact detail) — the per-contact feed and the fields each
   activity type shows when expanded.
2. **All modal fields** — every activity/logging modal, field by field.

Each Activities-tab card mirrors the modal that creates it. **\*** = required.
Terminology note: the app uses **Appointment** everywhere (the former "Meeting"
wording was renamed project-wide).

---

## Part 1 — Activities tab
*Source: `src/components/leads/mvp-contact-detail-page.tsx` (`ActivitiesTab`, `ActivityDetail`)*

Reverse-chronological feed of everything logged against one contact.

### List controls

| Element | Values / behaviour |
|---|---|
| Filter tabs | All · Call · Email · Appointment · Task · Offline |
| Month grouping | Entries grouped under a month heading, newest first |
| Row (collapsed) | Day label · type icon · title · date-time · expand chevron |
| Pagination | Page X of N · prev/next · page size 5 / 10 / 25 · "Displaying A–B of T records" |

Type icons: 📅 Appointment · 📞 Call · ✉️ Email · ☑️ Task · 📝 Offline · ✎ Update.

### Expanded detail — fields per activity type

Each type's fields match its creating modal (Part 2). "…By" = who logged it.

**📅 Appointment** — mirrors the Appointment modal + Appointment Outcome
| Field | Notes |
|---|---|
| Hosted By | User who owns/hosted the appointment |
| Appointment Outcome | Scheduled / Completed / No-show / Rescheduled / Cancelled (chip) |
| Appointment Type | Consultation Appointment · Recruiting · Business Opening · Investment Talk · Finance Talk · Other |
| Duration | e.g. 60 min (Start–End) |
| Appointment Location | Address or video link |
| Attendees | Names (+N) |
| Attachments | Attached documents |
| Status | Resulting Stage Status |
| Description | Free text |
| **Appointment Report** | Outcome report (highlighted box) |

**📞 Call** — mirrors Log a Call / Outbound Call
| Field | Notes |
|---|---|
| Call By | Who made/logged the call |
| Call Direction | Inbound / Outbound |
| Call Status | Reached / Not Reached / Voicemail / Callback Requested |
| Call Duration | mm:ss |
| Status | Resulting Stage Status |
| **Call Report** | What happened (highlighted box) |

**✉️ Email** — mirrors Log an Email / Send an Email
| Field | Notes |
|---|---|
| Sent By | Who sent/logged it |
| Direction | Sent / Received |
| Email Address | Recipient / sender |
| Subject | Email subject |
| Status | Delivered / resulting Stage Status |
| **Email Report** | Summary (highlighted box) |

**☑️ Task** — mirrors the Task modal
| Field | Notes |
|---|---|
| Created By | Who created the task |
| Priority | Low / Normal / High / Urgent |
| Status | Open / Done |
| Reminder | e.g. 30 Minutes Before |
| Description | Free text |

**📝 Offline** — mirrors the Offline Log
| Field | Notes |
|---|---|
| Logged By | Who logged the interaction |
| Channel | In-person appointment · WhatsApp / SMS · Letter / Post · Other channel |
| Status | Resulting Stage Status |
| **Note** | What happened (highlighted box) |

**✎ Update** — system audit entry (a field change; not created from a modal)
| Field | Notes |
|---|---|
| Changed By | User (or System) |
| Field | Which field changed (e.g. Assignee, Labels) |
| From | Previous value |
| To | New value |

---

## Part 2 — All modal fields

### 2.1 Contact detail — quick actions & logging
*Source: `src/components/leads/mvp-contact-detail-page.tsx`*

Reached from a contact via **Send an Email · Create a Task · Schedule an
Appointment · ⋮ More** (More → Log a Call · Log an Email · Log on Appointment ·
Offline Log). Every Log modal ends with a **Status** row (Stage Status for the
contact's lifecycle) and Save / Cancel.

**✉️ Send an Email** (`EmailModal`)
| Field | Req | Type | Options / notes |
|---|---|---|---|
| From | \* | Select | Sender address |
| To | \* | Select | Recipient (contact email) |
| CC | — | Select | |
| Template | — | Select | From `EMAIL_TEMPLATES_STORE`; pre-fills subject + body + attachments |
| Attachment | — | Select | From `ATTACHMENTS_STORE` (chips, removable) |
| Subject | \* | Text | |
| Body | \* | Rich text | Toolbar + textarea |
| Schedule send | — | Checkbox | Reveals Date + Time when on |
| Status | — | Select | Stage Status |

**📞 Log a Call** (`LogCallModal`)
| Field | Req | Type | Options |
|---|---|---|---|
| Contact Name/Number | \* | Search input | |
| Call Direction | \* | Select | Inbound · Outbound |
| Call Status | \* | Select | Reached · Not Reached · Voicemail · Callback Requested |
| Call Duration | \* | Number (min) | |
| Date | \* | Date | |
| Time | \* | Time | |
| Report Of Call | \* | Textarea | |
| Status | — | Select | Stage Status |

**✉️ Log an Email** (`LogEmailModal`)
| Field | Req | Type | Options |
|---|---|---|---|
| Direction | \* | Select | Sent · Received |
| Email Address | \* | Text | |
| Subject | \* | Text | |
| Date | \* | Date | |
| Time | \* | Time | |
| Email Report | \* | Textarea | |
| Status | — | Select | Stage Status |

**📅 Log on Appointment** (`LogAppointmentModal`)
| Field | Req | Type | Options |
|---|---|---|---|
| Appointment Type | \* | Select | Consultation Appointment · Recruiting · Business Opening · Investment Talk · Finance Talk · Other |
| Appointment Outcome | \* | Select | Completed · No Show · Rescheduled · Cancelled |
| Date | \* | Date | |
| Start | \* | Time | |
| End | \* | Time | |
| Appointment Report | \* | Textarea | |
| Status | — | Select | Stage Status |

**📝 Offline Log** (`OfflineLogModal`)
| Field | Req | Type | Notes |
|---|---|---|---|
| Date | \* | Date | |
| Time | \* | Time | |
| Note | \* | Textarea | |
| Status | — | Select | Stage Status |

### 2.2 Task modal
*Source: `src/components/calendar/task-modal.tsx` (`TaskModal`)* — create · edit · view

| Field | Req | Type | Notes |
|---|---|---|---|
| Title | \* | Text | |
| Contact | (\*) | Select / locked input | Labelled required, **not enforced** on save (only Title + Date + Time are) |
| Priority | — | Button group | Low / Normal / High / Urgent |
| Date | \* | Date | |
| Time | \* | Time | Defaults 09:00 |
| Reminder | — | Checkbox + Select | 15 Min / 30 Min / 1 Hour Before / Custom Date |
| Reminder — custom | — | datetime-local | When "Custom Date" chosen |
| Set to repeat | — | Checkbox + counter + unit | every N day/week/month/year |
| Email Template | — | Select | **Edit mode only** (not on Create/View) |
| Description | — | Textarea | |

**View actions:** Log a Call · Make a Call (Call tasks) · Delete · Done.

### 2.3 Appointment modal — Network (actionable)
*Source: `src/components/appointments/appointment-modal.tsx` (`AppointmentModal`)* — create · edit · view

| Field | Req | Type | Options / notes |
|---|---|---|---|
| Title | \* | Text | |
| Contact | \* | Select / locked input | |
| Attendees | \* | Searchable multiselect | Superiors + free-typed emails |
| Type | \* | Select | Consultation Appointment · Recruiting · Business Opening · Investment Talk · Finance Talk · Other |
| Type (Other) | \* | Text | Custom label when Type = Other |
| Date | \* | Date | |
| Start | \* | Time | Defaults 09:00 |
| End | — | Time | |
| Appointment Location | \* | Text | Address or video link |
| Attachments | — | Multiselect | From `DOCUMENT_TYPES_STORE` |
| Reminder | — | Checkbox + Select | 15 Min / 30 Min / 1 Hour / 1 Day Before / Custom Date |
| Reminder — custom | — | datetime-local | When "Custom Date" chosen |
| Description | — | Textarea | |

**View actions (Network):** ✏️ Edit · Cancel Appointment · Set Outcome.

### 2.4 Appointment modal — Lead (read-only)
*Source: `src/components/appointments/lead-appointment-modal.tsx` (`LeadAppointmentModal`)*

Opens when a **Lead** appointment is clicked on the Calendar. Read-only.

| Field | Notes |
|---|---|
| Date & Time | Read-only |
| Contact | Read-only |
| Type | Read-only |
| Attendees | Shown when present |
| Appointment Location | Shown when present |
| Attachments | Shown when present |
| Description | Shown when present |

**Actions:** Open Processing & Feedback (deep-link) · Close. No editing.

### 2.5 Appointment Outcome modal
*Source: `src/components/appointments/appointment-outcome-modal.tsx` (`AppointmentOutcomeModal`)* — Network only

| Field | Req | Type | Options |
|---|---|---|---|
| Appointment Status | \* | Select | Won · Rescheduled · Follow Up · Not Interested · No Suitable Solution · No Show |
| Note | \* | Textarea | Required outcome note |
| Appointment Report | \* | Textarea | |
| Status | \* | Select | Network Stage Status (Customer / Partner / Prospect) |

### 2.6 Outbound Call modal
*Source: `src/components/leads/outbound-call-modal.tsx` (`OutboundCallModal`)* — pre → active → post

| Field | Req | Type | Notes |
|---|---|---|---|
| Call timer | (auto) | Elapsed mm:ss | Runs during the live call |
| Call Status | \* | Select | 7 dispositions (`CALL_STATUS_OPTIONS`) |
| Call Report | \* | Textarea | |
| Status | \* | Select | Stage Status |

Plus an AI Suggestion panel (proposed Call Status / Status / improved report /
confidence / reasoning; Accept All · Ignore).

### 2.7 Add Activity modal (calendar creator)
*Source: `src/components/calendar/new-activity-modal.tsx` (`NewActivityModal`)*

Creates Tasks (Call / Email / Note) and Appointments (Consultation / Recruiting /
Business Appointment / Other).

| Field | Req | Type | Notes |
|---|---|---|---|
| Type | \* | Grouped picker | Appointments + Tasks groups (locked when preset) |
| Title / Subject | \* | Text | Label adapts: Call subject / Email subject / Note title / Appointment title |
| Contact | — | Text | Optional |
| Date | \* | Date | |
| Time | \* | Time | Only for types with a time; label adapts (Start / Due time) |
| End time | — | Time | Appointment types (`hasEnd`) |
| Duration | — | Quick-pick | Type-specific minute options; sets End |
| Location | — | Text | Appointment types (`hasLocation`) |
| Appointment link | — | URL | Appointment types (`hasLink`) |
| Priority | — | Select | Urgent / High / Normal / Low |
| Recurrence | — | Select | Once / Daily / Weekly / Monthly / Yearly |
| Note | — | Textarea | |
| Push notification | — | Toggle | Default on |

### 2.8 Unified Log modal (lead detail)
*Source: `src/components/leads/lead-detail-page.tsx` — action modal (`logType` = call / email / appointment / offline)*

| Field | Req | Type | Notes |
|---|---|---|---|
| Log type | \* | Button group | 📞 Call · ✉️ Email · 📅 Appointment · 📝 Offline |
| Outcome | — | Select | Options depend on log type (below) |
| Date | — | Date | |
| Time | — | Time | |
| Notes | — | Textarea | |

**Outcome options by log type**
| Log type | Options |
|---|---|
| Call | Reached — Interested · Reached — Appointment set · Reached — Not Interested · Not Reached — No answer · Not Reached — Voicemail · Callback Requested |
| Email | Email sent · Positive response · Negative response · Follow-up requested |
| Appointment | Completed · No-show / Cancelled · Rescheduled · Follow-up required |
| Offline | In-person appointment · WhatsApp / SMS · Letter / Post · Other channel |

---

## Appendix — source map

| Surface | File |
|---|---|
| Activities tab (feed + detail) | `src/components/leads/mvp-contact-detail-page.tsx` |
| Send Email / Log Call / Log Email / Log Appointment / Offline Log | `src/components/leads/mvp-contact-detail-page.tsx` |
| Task modal | `src/components/calendar/task-modal.tsx` |
| Appointment modal — Network | `src/components/appointments/appointment-modal.tsx` |
| Appointment modal — Lead (read-only) | `src/components/appointments/lead-appointment-modal.tsx` |
| Appointment Outcome | `src/components/appointments/appointment-outcome-modal.tsx` |
| Outbound Call | `src/components/leads/outbound-call-modal.tsx` |
| Add Activity | `src/components/calendar/new-activity-modal.tsx` |
| Unified Log modal | `src/components/leads/lead-detail-page.tsx` |
| Shared vocabularies | `src/lib/core.tsx` |
