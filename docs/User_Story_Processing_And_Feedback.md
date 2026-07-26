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
- **Mark as Sent & Continue** records the send and advances to Call Attempt & Outcome.
- **Skip & Continue** is offered because the step is optional; it advances to Call Attempt & Outcome recorded as "Skipped — calling directly".

### Step 2 — Call Attempt & Outcome (merged)

Attempts and the reached-outcome are handled in a **single step**.

**Call attempts**
- The advisor logs a call attempt (max **5**), selects the result — **Reached** or **Not Reached** — and presses **Save & Continue**.
- A progress bar and counter show "N of 5 call attempts". **Save & Continue** is disabled until a result is selected.
- **Reached** stays on this same step and reveals the outcome picker below (there is no separate step to advance to).
- If the lead is **not reached** on the 5th attempt, it is automatically sent to Finalize marked **Not Reached** — the advisor is not forced to use all 5.
- A ready-made **missed-call message** can be copied (**Copy for SMS / WhatsApp**) or sent (**Copy & Send via Email**) after a failed attempt.
- Whenever the result is **Not Reached** — the moment it is selected, or once the lead has been auto-finalized as **Not Reached** — a suggestion banner prompts the advisor to schedule a follow-up (via **Create Task** in the header) so the lead isn't forgotten.

**Call outcome (after the contact is reached)**
- The advisor records the outcome of the conversation: **Appointment Scheduled**, **Qualified**, **Follow Up (later)**, **Not Interested**, **No Suitable Solution**, or **Other**. An optional **Note** captures conversation details.
- **Appointment Scheduled** opens the scheduling (Appointment) modal, pre-filled for the contact and locked to it; on submit the appointment is booked (and written to the shared calendar) and **Save & Continue** advances to Appointment Outcome. The booked card offers **Change** (re-open the scheduler) and a **Delete** (🗑️) icon that cancels the booking and removes it from the calendar.
- **Qualified** sets the status to *Qualified (Ready to Close)*; the next action is to define the next closing step.
- **Follow Up (later)** is a deliberate pause and **requires a Follow-Up Date and a Follow-Up Reason** before continuing.
- **No Suitable Solution** (Closed / Lost) **requires a Lost Reason** before continuing.
- **Not Interested / No Suitable Solution / Qualified / Follow Up / Other** end processing and skip straight to Finalize.
- The two negative outcomes — **Not Interested** and **No Suitable Solution** — flag the lead so the **Do Not Contact** toggle becomes available in Finalize; the others are neutral (no DNC).

### Step 3 — Appointment Outcome

- Shows the booked appointment (type · date · time) for context, then the advisor records the result: **Qualified**, **Follow Up (later)**, **Not Interested**, **No Suitable Solution**, **Reschedule**, or **No Show**. An optional **Note** captures details.
- A completed appointment must resolve to exactly one clear result — **attending an appointment does not auto-qualify** the lead.
- **Reschedule** and **No Show** keep the lead in the Appointment status and **re-open scheduling** to re-book a new appointment (the reschedule count is tracked); the advisor stays on this step.
- **Follow Up (later)** requires a Follow-Up Date + Reason; **No Suitable Solution** requires a Lost Reason.
- The negative outcomes (Not Interested, No Suitable Solution) enable the **Do Not Contact** toggle in Finalize.
- Non-reschedule / non-no-show outcomes advance to Finalize.

### Step 4 — Finalize Process

- The **Finalize Process** control lives on the Finalize step row and is enabled once the advisor has reached the **Call Attempt & Outcome** step, so a lead can be finalized from here at any point without stepping through every stage. It is neutral by design — finalizing early does **not** flag the lead as a negative outcome, so no DNC toggle is offered.
- **Mark lead as processed** marks the lead as **fully processed**; the feedback feeds into the campaign statistics.
- When a **negative outcome** occurred, a persistent **Do Not Contact (DNC)** toggle is shown so no further outreach is attempted; its on/off state is logged.
- Once processed, the advisor sees a **"Lead Ready (Processed)"** confirmation (and "Marked Do Not Contact." when DNC is on).
- Actions after processing → **Back to Dashboard**, and **Add to My Network** (conversion).

### Convert Lead → Network

- **Add to My Network** opens the Convert Lead modal. (An "Add to Network" deep-link from the Leads list opens this dialog directly.)
- The **Outcome** is any combination of **Customer** and **Partner** — both may apply, and selecting **neither** is allowed (the person is then a plain **Network contact**).
- Conversion sets Lifecycle = Network; **Ownership stays unchanged**, and all contact information, activities and history are preserved.
- Conversion **cannot be reversed** — a Network contact cannot be converted back to a Lead, and once converted the stepper is frozen (no reopen / Edit).
- After conversion the Finalize step shows a **"✓ In My Network · [Outcome]"** badge; an already-converted contact (My Network) shows this from the start.

### Supporting Rules

- Call attempts are capped at **5**; the 5th failed attempt auto-finalizes the lead as **Not Reached**.
- **Follow Up (later)** always requires a date and reason; **No Suitable Solution** (Closed / Lost) always requires a Lost Reason — in both the Call Outcome and Appointment Outcome steps.
- The **Do Not Contact** toggle is only offered when a negative outcome (**Not Interested** / **No Suitable Solution**) was recorded in Call Outcome or Appointment Outcome.
- A derived **Next Action** is set from the resolved outcome (e.g. Qualified → "Define next closing step", Follow Up → "Resume follow-up", Reschedule / No Show → "Call to reschedule").
- Reopening the latest completed step clears the flags that step (and later steps) produced — call/reach state, outcomes, appointment, reschedule count, negative-outcome and DNC flags — as applicable to how far back the reopen goes.
- The tab is bilingual: **Processing & Feedback** (EN) / **Bearbeitung & Feedback** (DE).

### Role Restrictions

- **Super Admins cannot convert** leads to Network: in Finalize they see "Conversion not permitted for your role" instead of **Add to My Network**.
- All other steps and controls are available to the working advisor.

### Faulty / Guard Cases

- **Save & Continue** on Call Attempts is disabled until a result (Reached / Not Reached) is selected.
- **Save & Continue** on the outcome steps is disabled until an outcome is selected, and — where required — until the Lost Reason (No Suitable Solution) or Follow-Up Date + Reason (Follow Up) is provided.
- **Appointment Scheduled** cannot continue until the appointment is actually booked.
- Reopening a completed step requires confirmation because it discards later steps and their recorded outcomes (and, where applicable, cancels a booked appointment and retracts a finalized result from the statistics).
- A lead already **finished** (processed) is not re-finalized by the **Finalize Process** control.
- A lead already at **Not Reached** cannot log further call attempts.
- A contact already in **My Network** cannot use the flow — it is read-only and the stepper cannot be reopened.
