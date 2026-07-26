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

## Faulty / Guard Cases

- A filter with no matching entries shows an empty state (*No activities.*) and
  a *Displaying 0 – 0 of 0 records* counter.
- The task **⋮ → Done** action is hidden/disabled for an **Overdue** or
  **Canceled** task ("It is not overdue or cancelled yet").
- **Update** entries are read-only audit records — they expose no destructive
  actions beyond the edit affordance shown in the wireframe.
