# LH-Vion — Processing & Feedback

Wireframe: TBD

Source: `src/components/leads/feedback-processing-tab.tsx` (`FeedbackProcessingTab`),
embedded as the first tab of the contact detail (`src/components/leads/mvp-contact-detail-page.tsx`).

## Processing & Feedback

As an authenticated Advisor (Berater), I want a guided, top-to-bottom stepper that walks me through everything that happens to a lead — from the first outreach to the final processing outcome — so I can work the lead consistently and feed the result back into the campaign statistics without missing a step.

The flow runs through five stages:

1. **Send Initial Message** → 2. **Call Attempts** → 3. **Call Outcome** → 4. **Appointment Outcome** → 5. **Finalize Process**

Completed steps stay pinned at the top, the current step follows below them, and the remaining (locked) steps sit underneath.

### Tab Placement & Gating

- Processing & Feedback is the **first** tab on the contact detail and is always available.
- Every other tab (Overview, Activities, Documents, Information) and the identity-rail quick actions stay **locked** until the lead becomes a contact — a lead "becomes a contact" only once the initial outreach step has been passed.
- **My Network** entries are already contacts, so all tabs are enabled from the start (and the Overview tab is not shown for them).
- The tab opens on the step that matches the lead's current status; navigating to a different contact re-initialises the flow.

### Stepper Behaviour (all steps)

- Each stage is shown as a numbered dot in one of three states: **locked** (🔒, greyed), **current** (highlighted "Current" card), or **done** (✓, green).
- Only the **most recently completed** step is editable — it carries an **Edit** control; all earlier completed steps are locked (🔒) so a branch can't be orphaned.
- Reopening a step warns that it **discards the steps after it and their recorded outcomes**, then re-enters that step for correction and appends an audit line to the log.
- Every state change appends a timestamped entry to the processing **log**, and updates the "last action" one-liner surfaced elsewhere (e.g. Overview).

### Step 1 — Send Initial Message (optional)

- Sends a prepared introductory message to establish first contact with the lead.
- The advisor picks a channel: **SMS / WhatsApp** (shared template) or **Email** (its own longer template). The template is previewed with the lead's first name and the advisor's name filled in.
- Choosing a channel copies its message to the clipboard ("✓ Copied" confirmation).
- **Mark as Sent & Continue** records the send and advances to Call Attempts.
- **Skip — call directly** is offered because the step is optional; it advances to Call Attempts recorded as "Skipped — calling directly".

### Step 2 — Call Attempts

- The advisor makes a call attempt (max **5**), selects the result — **Reached** or **Not Reached** — and presses **Save & Continue**.
- A progress bar and counter show "N of 5 call attempts"; **Reached** advances to Call Outcome.
- If the lead is **not reached** on the 5th attempt, the lead is automatically sent to Finalize marked **Not Reached** — the advisor is not forced to use all 5.
- A ready-made **missed-call message** can be copied (SMS / WhatsApp) after a failed attempt.
- **Create a Task** is available (e.g. to schedule a callback reminder) — opens the shared Task modal.
- A **Finalize now — no further steps** shortcut appears once at least one attempt has been logged or a result picked, letting the advisor jump straight to Finalize.

### Step 3 — Call Outcome (after the contact is reached)

- The advisor records the outcome of the conversation: **Appointment Scheduled**, **Not Interested**, **Currently Not Interested**, **Difficult Case**, or **Other**.
- An optional **Note** captures conversation details.
- **Appointment Scheduled** → **Schedule & Continue** opens the scheduling (Appointment) modal, pre-filled for the contact; on submit the appointment is booked and the flow advances to Appointment Outcome.
- **Not Interested / Currently Not Interested / Difficult Case / Other** end processing and skip straight to Finalize.
- The three negative outcomes (Not Interested, Currently Not Interested, Difficult Case) flag the lead so the **Do Not Contact** toggle becomes available in Finalize; **Other** is neutral (no DNC).
- A **Finalize now** shortcut is also available.

### Step 4 — Appointment Outcome

- Shows the booked appointment (type · date · time) for context, then the advisor records the result: **Customer**, **Reschedule**, **Attending Event**, **Not Interested**, **Currently Not Interested**, **Difficult Case**, or **Other**.
- An optional **Note** captures details (e.g. a no-show without notice).
- **Reschedule** re-opens the scheduling modal to re-book a new appointment and **stays on this step** (reschedule count is tracked).
- Negative outcomes (Not Interested, Currently Not Interested, Difficult Case) enable the **Do Not Contact** toggle in Finalize.
- Non-reschedule outcomes advance to Finalize; a **Finalize now** shortcut is available.

### Step 5 — Finalize Process

- Marks the lead as **fully processed** ("Mark lead as processed"); the feedback feeds into the campaign statistics.
- When a **negative outcome** occurred, a persistent **Do Not Contact (DNC)** toggle is shown so no further outreach is attempted; its on/off state is logged.
- Once processed, the advisor sees a **"Lead Ready (Processed)"** confirmation (and "Marked Do Not Contact." when DNC is on).
- Actions after processing → **Back to Dashboard**, and **Add to My Network** (conversion).

### Convert Lead → Network

- **Add to My Network** opens the Convert Lead modal.
- **Network Status** is required, chosen from **Customer / Partner / Prospect** (defaults to **Customer**).
- Conversion sets Lifecycle = Network; **Ownership stays unchanged**, and all contact information, activities and history are preserved.
- Conversion **cannot be reversed** — a Network contact cannot be converted back to a Lead.
- After conversion the Finalize step shows a **"✓ In My Network · [Status]"** badge; an already-converted contact (My Network) shows this from the start.

### Supporting Rules

- Call attempts are capped at **5**; the 5th failed attempt auto-finalizes the lead as **Not Reached**.
- **Finalize now** (from Call Attempts onward) is neutral by design: it does not flag the lead as a negative outcome, so no DNC toggle is offered.
- The **Do Not Contact** toggle is only offered when a negative outcome (Not Interested / Currently Not Interested / Difficult Case) was recorded in Call Outcome or Appointment Outcome.
- Reopening the latest completed step clears the flags that step (and later steps) produced — call/reach state, outcomes, appointment, negative-outcome and DNC flags — as applicable to how far back the reopen goes.
- The tab is bilingual: **Processing & Feedback** (EN) / **Bearbeitung & Feedback** (DE).

### Role Restrictions

- **Super Admins cannot convert** leads to Network: in Finalize they see "Conversion not permitted for your role" instead of **Add to My Network**.
- All other steps and shortcuts are available to the working advisor.

### Faulty / Guard Cases

- **Save & Continue** on Call Attempts is disabled until a result (Reached / Not Reached) is selected.
- **Schedule & Continue / Save & Continue** on the outcome steps is disabled until an outcome is selected.
- Reopening a completed step requires confirmation because it discards later steps and their recorded outcomes.
- A lead already **finished** (processed) is not re-finalized by a "Finalize now" shortcut.
- A lead already at **Not Reached** cannot log further call attempts.
