# LH-Vion - Bulk Actions

Wireframe: TBD

## Bulk Assignment

As an authenticated Super Admin / Sales Director, I want to assign multiple Contacts to a user at once, so I can efficiently distribute leads to the responsible advisors without opening each Contact individually.

### Contacts List (Views)

- The Bulk Assignment action is available on the Contact list views where assignment applies: for the Super Admin on the **Assigned Leads** and **Unassigned Leads** views, and for the Sales Director on the **Assigned Leads** and **Pending Assignments** views.
- The action is not shown on views where bulk assignment does not apply (e.g. an Advisor's personal views).
- The action is disabled until at least one row is selected.
- Rows can be selected using row checkboxes or the header-level Select All checkbox.
- Select All applies to the rows displayed in the current view.
- A "[X] selected" counter is shown next to the actions while rows are selected.

### Bulk Assignment Modal

- Selecting the Bulk Assignment action on top of the list opens the Bulk Assignment dialog.
- The modal displays the number of selected Contacts and the list of selected recipients.
- Modal Buttons → Assign, Cancel.
- Assign to is mandatory; the user is chosen from a dropdown of assignable users (each shown as Name — Role).
- The Assign button is disabled until an assignee is selected.
- Clicking Assign opens a confirmation dialog.
- On confirmation, the selected Contacts are assigned to the chosen user, the modal closes, and the selection is cleared.
- Clicking Cancel (or the × / overlay) closes the modal without assigning; the current selection is preserved.

### Selected Contacts

- The modal lists the selected Contacts → Contact's initials, name, and Primary Email.
- The header shows the count of Selected Contacts, matching the number that will be assigned.

### Confirm Assignment

- The confirmation dialog asks the user to confirm assigning [N] Contact(s) to the chosen user.
- Modal Buttons → Assign, Cancel.
- Cancel returns to the Bulk Assignment modal without changes.
- On confirmation, the assignment is applied and the confirmation and Bulk Assignment modals close.

### Supporting Rules

- Bulk Assignment is limited by role and view: Super Admin (Assigned Leads, Unassigned Leads) and Sales Director (Assigned Leads, Pending Assignments).
- The assignable users are advisors (Berater); a Contact is assigned to exactly one user per action.
- Assigning updates the responsible user for every selected Contact.
- After a successful assignment, the selection is reset and the list reflects the new assignee.

### Faulty Cases

- No assignee selected → prevent submission; the Assign button remains disabled.
- No rows selected → the Bulk Assignment action stays disabled and cannot be opened.
