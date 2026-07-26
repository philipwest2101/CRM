# LH-Vion — Processing & Feedback

Wireframe: TBD

Source: `src/components/leads/feedback-processing-tab.tsx` (`FeedbackProcessingTab`),
embedded as the first tab of the contact detail (`src/components/leads/mvp-contact-detail-page.tsx`).

## Processing & Feedback

As an authenticated Advisor (Berater), I want a guided, top-to-bottom stepper that walks me through everything that happens to a lead — from the first outreach to the final processing outcome — so I can work the lead consistently and feed the result back into the campaign statistics without missing a step.

The flow runs through four steps:

1. **Send Initial Message** → 2. **Call Attempt & Outcome** → 3. **Appointment Outcome** → 4. **Finalize Process**

Completed steps stay pinned at the top, the current step follows below them, and the remaining (locked) steps sit underneath.

### Tab Placement & Gating

- Processing & Feedback is the **first** tab on the contact detail and is always available.
- Every other tab (Overview, Activities, Documents, Information) and the identity-rail quick actions stay **locked** until the lead becomes a contact — a lead "becomes a contact" only once the initial outreach step has been passed (sent or skipped), or the lead has been converted to Network.
- **My Network** entries are already contacts, so all tabs are enabled from the start (and the Overview tab is not shown for them). For My Network contacts the whole flow is **read-only** — the Customer / Partner classification is edited from the contact's **Status** field, not here.
- The tab opens on the step that matches the lead's current status; navigating to a different contact re-initialises the flow.

### Stepper Behaviour (all steps)

- Each step is shown as a numbered dot in one of three states: **locked** (🔒, greyed), **current** (highlighted "Current" card), or **done** (✓, green).
- Only the **most recently completed** step is editable — it carries an **Edit** control; all earlier completed steps are locked (🔒) so a branch can't be orphaned.
- Reopening a step warns that it **discards the steps after it and their recorded outcomes**, then re-enters that step for correction and appends an audit line to the log. If the reopen reaches back past a booked appointment, that appointment is **cancelled and removed from the calendar**; if the lead was already finalized, its result is **retracted from the campaign statistics**.
- A **Create Task** control (header) and a **Finalize Process** control (on the Finalize step row) are shared across the flow rather than repeated inside each step.
- Every state change appends a timestamped entry to the processing **log**, and updates the "last action" one-liner surfaced elsewhere (e.g. Overview).

### Step 1 — Send Initial Message (optional)

- Sends a prepared introductory message to establish first contact with the lead.
- The advisor picks a channel: **SMS / WhatsApp** (shared template) or **Email** (its own longer template). The template is previewed with the lead's first name, the advisor's name and the lead's preferred contact time filled in.
- **Copy for SMS / WhatsApp** copies the message to the clipboard ("✓ Copied" confirmation); **Copy & Send via Email** opens the email composer prefilled with the subject and body ("Email sent" confirmation once sent).
- **Mark as Sent & Continue** records the send (Status → *In Contact*, Processing → *First Contact Attempted*) and advances to Call Attempt & Outcome.
- **Skip & Continue** is offered because the step is optional; it advances to Call Attempt & Outcome recorded as "Skipped — calling directly" (Status stays *New*, Processing *Not Contacted Yet*).

### Step 2 — Call Attempt & Outcome (merged)

Attempts and the reached-outcome are handled in a **single step**.

**Call attempts**
- The advisor logs a call attempt (max **5**), selects the result — **Reached** or **Not Reached** — and presses **Save & Continue**.
- A progress bar and counter show "N of 5 call attempts". **Save & Continue** is disabled until a result is selected.
- Each **Not Reached** on attempts 1–4 increments the counter and keeps the lead *In Contact · Attempting Contact* (Next Action: call again).
- **Reached** stays on this same step and reveals the outcome picker below (there is no separate step to advance to); the lead becomes *In Contact · Connected*.
- If the lead is **not reached** on the 5th attempt, it is automatically sent to Finalize marked **Not Reached** (Processing → *Closed*) — the advisor is not forced to use all 5.
- A ready-made **missed-call message** can be copied (**Copy for SMS / WhatsApp**) or sent (**Copy & Send via Email**) after a failed attempt.
- Whenever the result is **Not Reached** — the moment it is selected, or once the lead has been auto-finalized as **Not Reached** — a suggestion banner prompts the advisor to schedule a follow-up (via **Create Task** in the header) so the lead isn't forgotten.

**Call outcome (after the contact is reached)**
- The advisor records the outcome of the conversation: **Appointment Scheduled**, **Won**, **Follow Up**, **Not Interested**, or **No Suitable Solution**. An optional **Note** captures conversation details.
- **Appointment Scheduled** opens the scheduling (Appointment) modal, pre-filled for the contact and locked to it; on submit the appointment is booked (and written to the shared calendar) and **Save & Continue** advances to Appointment Outcome. The booked card offers **Change** (re-open the scheduler) and a **Delete** (🗑️) icon that cancels the booking and removes it from the calendar.
- **Won** is a terminal outcome — Status → *Closed*, Processing → *Won* — and advances to Finalize.
- **Follow Up** is a deliberate pause: the lead becomes *Follow Up · Waiting for Follow-Up* with Next Action *Resume follow-up*. It **stays on this step** (it does not advance to Finalize and does not open a modal); the advisor schedules the actual follow-up via **Create Task**.
- **No Suitable Solution** (Closed / Lost) advances to Finalize; Status → *Closed*, Processing → *Lost*.
- **Won / Not Interested / No Suitable Solution** end processing and advance to Finalize.
- The two negative outcomes — **Not Interested** and **No Suitable Solution** — flag the lead so the **Do Not Contact** toggle becomes available in Finalize; the others are neutral (no DNC).

### Step 3 — Appointment Outcome

- Shows the booked appointment (type · date · time) for context, then the advisor records the result: **Won**, **Follow Up**, **Not Interested**, **No Suitable Solution**, **Reschedule**, or **No Show**. An optional **Note** captures details.
- A completed appointment must resolve to exactly one clear result — **attending an appointment does not auto-qualify** the lead.
- **Won** → Status *Closed*, Processing *Won*, advances to Finalize.
- **Not Interested** / **No Suitable Solution** → advance to Finalize and enable the **Do Not Contact** toggle.
- **No Show** → advances to Finalize and records the appointment status as **No Show**; it does **not** re-open the scheduler and is neutral (no DNC). Next Action: Finalize.
- **Reschedule** → re-opens the scheduler to re-book a new appointment; the lead **stays in the Appointment status** (*Appointment Scheduled*, Next Action: conduct appointment) and the reschedule count is tracked.
- **Follow Up** → a deliberate pause (Status *Follow Up · Waiting for Follow-Up*, Next Action *Resume follow-up*); it stays on this step and does not open a modal.

### Step 4 — Finalize Process

- The **Finalize Process** control lives on the Finalize step row and is enabled once the advisor has reached the **Call Attempt & Outcome** step, so a lead can be finalized from here at any point without stepping through every stage. It is neutral by design — finalizing early does **not** flag the lead as a negative outcome, so no DNC toggle is offered.
- Reaching the Finalize step marks the lead **processed automatically** — the terminal Status documents completion, so there is **no manual "mark as processed" button**. The feedback feeds into the campaign statistics (`Finished = true`).
- When a **negative outcome** occurred, a persistent **Do Not Contact (DNC)** toggle is shown so no further outreach is attempted; turning it on sets Status → *Do Not Contact* (Processing *Closed*), and its on/off state is logged.
- Once processed, the advisor sees a **"Lead Ready (Processed)"** confirmation (and "Marked Do Not Contact." when DNC is on).
- Actions after processing → **Back to Dashboard**, and **Add to My Network** (conversion).

### Convert Lead → Network

- **Add to My Network** converts the lead to a **Network contact directly** (no intermediate modal); an "Add to Network" deep-link from the Leads list converts once in the same way.
- The lead is added as a plain **Network contact** (no Customer / Partner outcome set at conversion). The **Customer / Partner** classification — either, both, or neither — is set afterwards from the contact's **Status** field.
- Conversion sets Lifecycle = Network; **Ownership stays unchanged**, and all contact information, activities and history are preserved.
- Conversion **cannot be reversed** — a Network contact cannot be converted back to a Lead, and once converted the stepper is frozen (no reopen / Edit).
- After conversion the Finalize step shows a **"✓ In My Network · [Outcome]"** badge; an already-converted contact (My Network) shows this from the start.

### Status & Processing Matrix

The action buttons drive the lead's **Status**, **Processing** stage, and **Next Action** as follows (see `Processing__Feedback_Matrix.xlsx`):

| # | Step | UI Action | Status | Processing | Next Action |
|---|------|-----------|--------|------------|-------------|
| 1 | 1 · Send Initial Message | Lead assigned to consultant | New | Not Contacted Yet | First contact |
| 2 | | Mark as Sent & Continue | In Contact | First Contact Attempted | Call the lead |
| 3 | | Skip & Continue | New | Not Contacted Yet | Call the lead |
| 4 | 2 · Call Attempt & Outcome | Not Reached + Save & Continue (attempts 1–4) | In Contact | Attempting Contact | Call again |
| 5 | | Not Reached + Save & Continue (attempt 5) | Not Reached | Closed | Finalize |
| 6 | | Reached + Save & Continue | In Contact | Connected | Record call outcome |
| 7 | | Appointment Scheduled | Appointment | Appointment Scheduled | Conduct appointment |
| 8 | | Won | Closed | Won | Finalize |
| 9 | | Follow Up | Follow Up | Waiting for Follow-Up | Resume follow-up |
| 10 | | Not Interested | Not Interested | Closed (enables DNC) | Finalize |
| 11 | | No Suitable Solution | Closed | Lost (enables DNC) | Finalize |
| 12 | 3 · Appointment Outcome | Won | Closed | Won | Finalize |
| 13 | | Follow Up | Follow Up | Waiting for Follow-Up | Resume follow-up |
| 14 | | Not Interested | Not Interested | Closed (enables DNC) | Finalize |
| 15 | | No Suitable Solution | Closed | Lost (enables DNC) | Finalize |
| 16 | | Reschedule | Appointment | Appointment Scheduled | Conduct appointment |
| 17 | | No Show | Appointment | No Show | **Finalize** |
| 18 | 4 · Finalize Process | Do Not Contact toggle → ON | Do Not Contact | Closed | Finalize |
| 19 | | Finalize Process | *(unchanged)* | *(unchanged)* | Finished = true |
| 20 | | Add to My Network | *(unchanged)* | *(unchanged)* | Convert to Network |

### Supporting Rules

- Call attempts are capped at **5**; the 5th failed attempt auto-finalizes the lead as **Not Reached**.
- **Follow Up** is treated as an active pause, not a processed lead: it keeps the lead on the current step and sets Next Action *Resume follow-up*; it does not advance to Finalize or open a modal.
- **Won** is a terminal, neutral outcome (Status *Closed*, Processing *Won*) — it advances to Finalize but does not enable DNC.
- **No Show** advances to Finalize while keeping the appointment status *No Show*; it does not re-open the scheduler and does not enable DNC.
- The **Do Not Contact** toggle is only offered when a negative outcome (**Not Interested** / **No Suitable Solution**) was recorded in Call Outcome or Appointment Outcome.
- A derived **Next Action** is set from the resolved outcome (Won / Not Interested / No Suitable Solution / No Show → "No open action"; Follow Up → "Resume follow-up"; Reschedule → "Call to reschedule"; Appointment Scheduled → "Attend / conduct appointment").
- Reopening the latest completed step clears the flags that step (and later steps) produced — call/reach state, outcomes, appointment, reschedule count, negative-outcome and DNC flags — as applicable to how far back the reopen goes.
- The tab is bilingual: **Processing & Feedback** (EN) / **Bearbeitung & Feedback** (DE).

### Role Restrictions

- **Super Admins cannot convert** leads to Network: in Finalize they see "Conversion not permitted for your role" instead of **Add to My Network**.
- All other steps and controls are available to the working advisor.

### Faulty / Guard Cases

- **Save & Continue** on Call Attempts is disabled until a result (Reached / Not Reached) is selected.
- **Save & Continue** on the outcome steps is disabled until an outcome is selected. (Follow Up and Reschedule are handled by their own chip action and do not use Save & Continue.)
- **Appointment Scheduled** cannot continue until the appointment is actually booked.
- Reopening a completed step requires confirmation because it discards later steps and their recorded outcomes (and, where applicable, cancels a booked appointment and retracts a finalized result from the statistics).
- A lead already at **Not Reached** cannot log further call attempts.
- A contact already in **My Network** cannot use the flow — it is read-only and the stepper cannot be reopened.
