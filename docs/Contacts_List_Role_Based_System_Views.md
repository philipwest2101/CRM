## Role-Based System Views

The following sections describe the system views available to each role, including their purpose, the contacts they contain, their default columns, and their available actions. System views are provided by the platform, are scoped to the signed-in user's role, and cannot be deleted or renamed. Alongside them, each user can create **Custom Views** (Add View / Edit View / Delete View) with their own column selection and filters.

Two page-level actions are available above the list on every view where the user can reach the Contacts List, independent of the active view: **Import Contacts** (Excel wizard) and **Add Contact** (tabbed form). Column configuration is done per view via **Edit View**.

### System Views by Role

- **Super Admin:** Unassigned Leads, Assigned Leads
- **Sales Director:** My Network, My Leads, Assigned Leads, Pending Assignments
- **Consultant:** My Network, My Leads

---

## Super Admin

### Unassigned Leads

Visible to Super Admin.

Including the contacts who:

- Lifecycle = Lead
- Ownership = Company (org-owned)
- Assignee = empty (awaiting assignment to a team)

Default columns:

- Name
- Account Source
- Campaign
- Last Activity

Available actions:

- View Details
- Export to Excel
- Send Bulk Email
- Bulk Assignment

### Assigned Leads

Visible to Super Admin.

Including the contacts who:

- Lifecycle = Lead
- Assignee = set (already assigned across the organization)

This view is **read-only and reportable**; the rows are not clickable through to the contact detail.

Default columns:

- Name
- Assignee
- Feedback & Processing
- Stage Status
- Last Activity

Available actions:

- Export to Excel
- Send Bulk Email
- Bulk Assignment (reassign to another user)

---

## Sales Director

### My Network

Visible to Sales Director.

Including the contacts who:

- Are the director's own private contacts (hidden from other users)

Default columns:

- Name
- Primary Phone
- Stage Status
- Last Activity

Available actions:

- View Details
- Export to Excel
- Send Bulk Email

### My Leads

Visible to Sales Director.

Including the contacts who:

- Lifecycle = Lead
- Assignee = the current director (fully editable and reportable)

Default columns:

- Name
- Account Source
- Feedback & Processing
- Stage Status
- Last Activity

Available actions:

- View Details
- Export to Excel
- Send Bulk Email

### Assigned Leads

Visible to Sales Director.

Including the contacts who:

- Lifecycle = Lead
- Assignee = a team advisor the director delegated the lead to (i.e. assigned within the director's team, to someone other than the director)

This view is **read-only and reportable**; the rows are not clickable through to the contact detail.

Default columns:

- Name
- Assignee
- Feedback & Processing
- Stage Status
- Last Activity

Available actions:

- Export to Excel
- Send Bulk Email
- Bulk Assignment (reassign within the team)

### Pending Assignments

Visible to Sales Director.

Including the contacts who:

- Lifecycle = Lead
- Assignee = empty within the director's scope (awaiting assignment to the director or a team advisor)

Default columns:

- Name
- Account Source
- Campaign
- Last Activity

Available actions:

- View Details
- Export to Excel
- Send Bulk Email
- Bulk Assignment
- Take Over (the director claims the selected leads for themselves)

---

## Consultant

### My Network

Visible to Consultant.

Including the contacts who:

- Are the consultant's own private contacts (hidden from other users)

Default columns:

- Name
- Primary Phone
- Stage Status
- Last Activity

Available actions:

- View Details
- Export to Excel
- Send Bulk Email

### My Leads

Visible to Consultant.

Including the contacts who:

- Lifecycle = Lead
- Assignee = the current consultant (fully editable and reportable)

Default columns:

- Name
- Account Source
- Feedback & Processing
- Stage Status
- Last Activity

Available actions:

- View Details
- Export to Excel
- Send Bulk Email

---

## Dashboard Views

The dashboards surface a minimal, read-oriented slice of the same contacts. Each list widget mirrors a Contacts List system view, shows a shortened set of columns, and provides an "All Contacts" link that opens the matching full system view. The list widgets available per role are:

### Super Admin Dashboard

- **Unassigned Leads** panel — the leads awaiting assignment. Inline row action: **Assign**. "All Contacts" opens the *Unassigned Leads* view.
- The **Unassigned Leads** KPI tile and the Performance / Call Attempts tables link through to the *Assigned Leads* view via "All".

### Sales Director Dashboard — Team

- **Pending Assignment** panel — leads awaiting assignment to the director or the team. Inline row actions: **Assign**, **Take Over**. "All Contacts" opens the *Pending Assignments* view.
- **Assigned Leads** table — leads delegated to team advisors. "All Contacts" opens the *Assigned Leads* view.

### Sales Director Dashboard — My / Consultant Dashboard

- **My Leads** panel — the user's open leads. Inline row action: **Detail & Feedback**. "All Contacts" opens the *My Leads* view.
- **My Network** (Contact List) card — a slice of the user's private contacts. "All Contacts" opens the *My Network* view.
