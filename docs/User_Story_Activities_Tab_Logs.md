# LH-Vion — Activities Tab (Logs)

Wireframe: **Activities Tab Logs** — Balsamiq board
`https://balsamiq.cloud/srk012p/p5mj549/r6379` (project *LeadConnect*).

Source: `src/components/leads/mvp-contact-detail-page.tsx` (`ActivitiesTab`,
`ActivityDetail`), the **Activities** tab of the contact detail
(`MVPContactDetailPage`).

Related field reference: `docs/Activities_Tab_And_Modal_Fields.md`
(the modals that create each entry).

---

## Activities Tab (Logs)

As an authenticated Advisor (Berater), I want a single reverse-chronological
feed of **everything** that has happened with a contact — calls, emails,
appointments, tasks, offline interactions and system updates — each collapsible
into a card that shows exactly the fields captured when it was created, so I can
review the full relationship history at a glance and drill into any entry
without leaving the page.

The tab is one scrollable, paginated list. Entries are grouped under a **month
heading** (e.g. *July 2026*, *April 2025*), newest first, and each row expands
in place to reveal a detail card whose fields match the activity's type.

### List Controls

- **Filter tabs** across the top: **All · Calls · Emails · Appointments ·
  Tasks · Updates**. Selecting a tab shows only that activity type; **All**
  shows every type (including offline logs). Changing the filter resets to
  page 1.
- **Month grouping**: entries sit under a bold month heading; groups appear in
  descending date order and a heading only renders when the current page has
  entries in that month.
- **Row (collapsed)** shows, left to right: the **day label** (e.g. *Mon 20*),
  a type **icon**, the **title**, an optional **status badge**, the
  **date-time** (`YYYY.MM.DD - HH:mm`), and an **expand/collapse chevron**.
- **Pagination footer**: *Page X of N* with prev/next arrows, a **page-size**
  selector, and a *Displaying A – B of T records* counter.

Type icons: 📅 Appointment · 📞 Call (inbound / outbound variants) ·
✉️ Email (sent / received) · ☑️ Task · 📝 Offline · ✎ Update.

### Status Badges (on the row)

- **Logged** — a neutral/grey badge on any activity that was **manually logged
  after the fact** (e.g. *Inbound Call Log*, *Outbound Call Log*,
  *Send/Received Email Log*, a logged Appointment, an Offline Log). Live or
  system-captured entries (a sent email the system recorded, a completed call)
  carry **no** badge.
- **Overdue** — a red badge on a **Task** whose due date has passed and which
  is neither done nor cancelled.
- **Canceled** — a badge on a **Task** that was cancelled.

### Expanding a Row

- Clicking anywhere on the row (or the chevron) toggles the detail card open or
  closed; the chevron rotates and multiple rows may be open at once.
- The card shows the fields captured by the entry's creating modal. Long free
  text (reports, descriptions, email bodies) is truncated with a **Show more…**
  link that reveals the full text.
- **Attachments** (e.g. `sample.pdf`) are listed when present.
- A manually **Logged** log (Call / Email / Appointment / Offline) carries a
  **⋮** menu on its row exposing **Edit · Delete**. *Edit* opens the matching
  prefilled **Edit … Log** modal (Edit Call Log · Edit Email Log · Edit
  Appointment Log · Edit Offline Log) whose **Update** writes the change back to
  the card; *Delete* removes the entry. Live / system-captured entries and
  **Update** audit rows have no such menu.

---

### Detail card — 📅 Appointment

Mirrors the Appointment modal (and, once held, the Appointment Outcome).

| Field | Notes |
|---|---|
| Hosted By / Logged By | Owner of a scheduled appointment; **Logged By** when the appointment was logged after the fact (badge **Logged**) |
| Attendees | Attendee emails (e.g. `john.smith@email.com, olivia.ruth@email.com`) |
| Type | Appointment type; when *Other* was chosen the custom label is shown here |
| Location / Link | Address or video link (e.g. *ARTIST Boutique Hotel — Vienna*) |
| Description | Free text |
| Attachments | Attached documents |
| **Outcome** | *Past/logged only* — the recorded result (e.g. *Not Interested*) |
| **Note** | *Past/logged only* — free-text outcome note |

- A **scheduled** appointment shows *Hosted By*; a **back-logged** appointment
  shows *Logged By* and the **Logged** badge. Once the appointment has been
  **held**, the card adds the **Outcome** (e.g. *Not Interested*) and a
  free-text **Note**.

### Detail card — 📞 Call

Mirrors *Log a Call* / *Outbound Call*. Inbound and outbound are distinguished
by the row icon (📥 inbound / 📤 outbound) and title (*Inbound Call Log* /
*Outbound Call* / *Outbound Call Log*).

| Field | Notes |
|---|---|
| Logged By / Call By | Who logged or made the call |
| Call Duration | e.g. *19 minutes* |
| **Call report** | What happened — free text, truncated with *Show more…* |

- Manually logged calls (*…Call Log*) carry the **Logged** badge; a
  system-captured call (*Outbound Call*) does not.

### Detail card — ✉️ Email

Mirrors *Send an Email* / *Log an Email*. Sent and received differ.

| Field | Sent | Received | Notes |
|---|:--:|:--:|---|
| From | ✓ | ✓ | Sender address |
| To | ✓ | ✓ | Recipient address |
| Cc | ✓ | — | Carbon-copy recipients |
| Created At | ✓ | — | When the email was created |
| Scheduled On | ✓* | — | Only when the send was scheduled |
| Subject | ✓ | ✓ | |
| Body | ✓ | ✓ | Message body, truncated with *Show more…* |
| Attachments | ✓ | ✓ | e.g. `sample.pdf` |

- Manually logged emails (*Send/Received Email **Log** Subject*) carry the
  **Logged** badge; system-recorded emails (*Sent/Received Email Subject*) do
  not.

### Detail card — ☑️ Task

Mirrors the Task modal.

| Field | Notes |
|---|---|
| Created By | Who created the task |
| Created At | Creation timestamp |
| Priority | Low / Normal / Medium / High / Urgent |
| Description | Free text, truncated with *Show more…* |

- The row carries an **Overdue** or **Canceled** badge as applicable.
- A **⋮ (more)** menu on the task exposes **Done · Edit · Delete**.
  **Done** is only offered while the task *"is not overdue or cancelled yet"* —
  an overdue or cancelled task cannot be marked done from this menu (it must be
  edited first).

### Detail card — 📝 Offline

Mirrors the Offline Log.

| Field | Notes |
|---|---|
| Logged By | Who logged the interaction |
| Type | Channel — e.g. *WhatsApp*, *SMS*, *Letter / Post*, *In-person*, *Other* |
| Description | What happened — free text, truncated with *Show more…* |

- Offline logs always carry the **Logged** badge (they are, by definition,
  logged after the fact) and appear under the **All** filter.

### Detail card — ✎ Update (system audit)

An audit entry recorded automatically when a field on the contact changes; it
is **not** created from a modal. Each shows a single **Action** line describing
the change, with an **edit (✎)** affordance:

| Update | Action line | Example |
|---|---|---|
| Update Assignee | 👤 *new assignee* | 👤 Anna Klein |
| Update Label(s) — added | 🏷️ **+** *label* | 🏷️ + VIP-CUSTOMER |
| Update Label(s) — removed | 🏷️ **−** *label* | 🏷️ − VIP-CUSTOMER |
| Add Contact | 👤 *Created by: {user}* | 👤 Created by: John Smith |

---

## Supporting Rules

- The feed is **per contact** and reverse-chronological; the most recent entry
  is at the top of the newest month group.
- **All** is the default filter; **Updates** surfaces only the system audit
  entries (assignee / label changes, contact creation).
- The **Logged** badge is the single signal that separates a manually
  back-logged activity from a live/system-captured one; the two render the same
  fields otherwise.
- Free-text fields (reports, descriptions, email bodies) collapse to a preview
  with **Show more…**; attachments render as file chips.
- Pagination is client-side; changing the page size returns to page 1 and the
  *Displaying A – B of T records* counter always reflects the active filter.
- The tab is bilingual: **Activities** (EN) / **Aktivitäten** (DE); type and
  badge labels follow the shared i18n vocabulary.

## Activity Logs Generated by Processing & Feedback

Reconciled to the **current implementation** (`src/components/leads/feedback-processing-tab.tsx`),
which has evolved past the Balsamiq board `rB069`. In the shipped flow:

- there are **four steps** — Send Initial Message → **Call Attempt & Outcome
  (merged)** → Appointment Outcome → Finalize;
- the outcome set is **Appointment Scheduled · Won · Follow Up · Not Interested
  · No Suitable Solution** (call), plus **Reschedule · No Show** on the
  appointment step (*Currently Not Interested* → **Follow Up**; *Difficult Case*
  → **No Suitable Solution / Lost**);
- attending an appointment **does not auto-qualify** — the outcome is recorded
  explicitly;
- Finalize **auto-marks the lead processed** on arrival (no manual
  "Mark as processed" button).

Status vocabulary follows the Lifecycle/Processing model in `src/lib/core.tsx`.

| # | P&F Step | Action / control | → Activities-tab log entry | Type | Badge | Key fields | Status result (Lifecycle · Processing / Next Action) |
|---|----------|------------------|---------------------------|------|-------|-----------|-------------------------------------------------------|
| 1 | 1 · Send Initial Message | Email → **Copy & Send via Email**, then **Mark as Sent & Continue** | Email (Sent) | ✉️ | Logged | From · To · Subject · Body · Attachments | Lead · In Contact · *Initial message sent* |
| 2 | 1 · Send Initial Message | SMS/WhatsApp → **Copy**, then **Mark as Sent & Continue** | Offline | 📝 | Logged | Logged By · Type=SMS/WhatsApp · Description | Lead · In Contact · *Initial message sent* |
| 3 | 1 · Send Initial Message | **Skip & Continue** | Update (status only) | ✎ | — | "Skipped — calling directly" | Lead · In Contact |
| 4 | 2 · Call Attempt & Outcome | Attempt *n* = **Not Reached** → Save & Continue | Outbound Call | 📤 | Logged | Call By · Duration · Call report | Lead · In Contact *(attempt counter, n = 1–4)* |
| 5 | 2 · Call Attempt & Outcome | 5th attempt **Not Reached** (auto-finalize) | Outbound Call | 📤 | Logged | " | Lead · **Not Reached** · Closed *(terminal)* |
| 6 | 2 · Call Attempt & Outcome | Attempt *n* = **Reached** | Outbound Call | 📤 | Logged | " | Lead · In Contact → reveals outcome picker |
| 7 | 2 · Call Outcome | **Appointment Scheduled** → scheduler → book | Appointment (scheduled) | 📅 | — | Hosted By · Type · Attendees · Location/Link · Description · Attachments | Lead · **Appointment** · Appointment Scheduled |
| 8 | 2 · Call Outcome | **Won** (+ Note) | Update (+ Note on call) | ✎ | — | Outcome=Won · Note | Lead · **Closed** · Won *(terminal)* → Finalize |
| 9 | 2 · Call Outcome | **Follow Up** (+ Date + Reason) | Update | ✎ | — | Follow-Up Date · Reason | Lead · **Follow Up** · Resume follow-up → Finalize |
| 10 | 2 · Call Outcome | **Not Interested** (+ Note) *(negative → DNC)* | Update | ✎ | — | Note | Lead · **Not Interested** · Closed *(terminal)* → Finalize |
| 11 | 2 · Call Outcome | **No Suitable Solution** (+ Lost Reason) *(negative → DNC)* | Update | ✎ | — | Lost Reason | Lead · **Closed** · Lost *(terminal)* → Finalize |
| 12 | 2 · Call Attempt & Outcome | **Create Task** (header — callback / missed-call follow-up) | Task | ☑️ | — → Overdue | Created By · Created At · Priority · Description | *(status unchanged)* |
| 13 | 2 · Call Attempt & Outcome | Missed-call message copied / sent (SMS·WA / Email) | Offline / Email *(optional)* | 📝 ✉️ | Logged | channel-dependent | *(status unchanged)* |
| 14 | 3 · Appointment Outcome | **Won** (+ Note) | Appointment updated → **Outcome + Note** | 📅 | Logged | Outcome=Won · Note | Lead · **Closed** · Won *(terminal)* → Finalize |
| 15 | 3 · Appointment Outcome | **Follow Up** (+ Date + Reason) *(stays on step)* | Appointment → Outcome + Update | 📅 ✎ | Logged | Follow-Up Date · Reason | Lead · **Follow Up** · Resume follow-up |
| 16 | 3 · Appointment Outcome | **Not Interested** *(negative → DNC)* | Appointment → Outcome + Update | 📅 ✎ | Logged | Note | Lead · **Not Interested** · Closed *(terminal)* → Finalize |
| 17 | 3 · Appointment Outcome | **No Suitable Solution** (+ Lost Reason) *(negative → DNC)* | Appointment → Outcome + Update | 📅 ✎ | Logged | Lost Reason | Lead · **Closed** · Lost *(terminal)* → Finalize |
| 18 | 3 · Appointment Outcome | **Reschedule** *(stays on step, re-opens scheduler)* | Appointment re-booked | 📅 | — | new date/time · reschedule count++ | Lead · Appointment *(Rescheduled)* · Call to reschedule |
| 19 | 3 · Appointment Outcome | **No Show** *(stays on step, re-book)* | Appointment (No Show) → re-book | 📅 | Logged | appointmentStatus=No Show | Lead · Appointment *(No Show)* · Call to reschedule |
| 20 | 4 · Finalize Process | **Reaching Finalize** (auto — no manual button) | Update (processed) | ✎ | — | terminal status documents completion | Lead · *(keeps outcome status)* · Processed |
| 21 | 4 · Finalize Process | **Do Not Contact** toggle on/off *(negative outcomes only)* | Update (DNC flag) | ✎ | — | DNC on/off logged | *(status unchanged)* |
| 22 | 4 · Finalize Process | **Add to My Network** (Convert; not Super Admin) | Update (lifecycle) | ✎ | — | Outcome = Customer and/or Partner *(or neither)* | **Network** · Customer / Partner |

### Coverage vs. this feed's log types

| Activities-tab log type | Produced by P&F? | Where |
|---|---|---|
| ✉️ Email — **Sent** | ✅ | Step 1 (email channel), Step 2 (missed-call via email) |
| ✉️ Email — Received | ❌ | inbound only, outside P&F |
| 📤 Call — **Outbound** | ✅ | Step 2 attempts |
| 📥 Call — Inbound | ❌ | inbound only, outside P&F |
| 📅 Appointment (scheduled + **logged w/ outcome**) | ✅ | Steps 2 (schedule) & 3 (outcome) |
| ☑️ Task | ✅ | Step 2 (Create Task) |
| 📝 Offline | ✅ | Step 1 (SMS/WhatsApp), Step 2 (missed-call msg) |
| ✎ Update (status / DNC / conversion) | ✅ | every step |

P&F generates **six of the eight** log variants; the two it never creates are
*Inbound Call* and *Received Email* (both inbound/system events).

> **Note.** Each step writes a timestamped line to the P&F **processing log**
> (`pushLog`). Which of those lines *also* surface as **Activities-tab** entries
> — the Update rows in particular — is a design detail not fully pinned in code;
> confirm with the owner of the log-write rules.

## Faulty / Guard Cases

- A filter with no matching entries shows an empty state (*No activities.*) and
  a *Displaying 0 – 0 of 0 records* counter.
- The task **⋮ → Done** action is hidden/disabled for an **Overdue** or
  **Canceled** task ("It is not overdue or cancelled yet").
- **Update** entries are read-only audit records — they expose no destructive
  actions beyond the edit affordance shown in the wireframe.
