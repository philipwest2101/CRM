# Analysis — App Lead Model vs. Master Contact Spec

**Scope:** Reconciliation of the prototype's lead model (`src/CRMAppV5.jsx`)
against `docs/Vion_MASTER_CONTACT_2_ENG.csv`, grounded in
`docs/CRM_Master_Context.docx`.

**Ground rules applied (from `Project_Instructions.docx`):**
- "Contact" and "Lead" are the same thing.
- Lead statuses (Lifecycle Stage + Stage Status) are **admin-configurable and
  dynamic** — the workflow files are illustrative, not a fixed spec.
- Accounts (companies), additional fields, and in-app calling are **out of
  scope** for the Vion integration.
- Conflicts are **flagged, not silently resolved**.

> Status: analysis only. **No application code was changed.**

---

## 1. Aligned ✅

| Area | App | Master Context |
|------|-----|----------------|
| Pipeline lifecycle | `LIFECYCLE_STORE`: New → In Contact → Appointment → Closing, + DNC/Excluded | Matches the illustrative lifecycle (§5.6), correctly not hard-coded |
| Roles | GP (Geschäftspartner / Business Partner), VD (Vertriebsdirektor / Sales Director), Super Admin (Backoffice) | Matches §5.4; PO/manager correctly deferred as future roles |
| Language | per-lead `lang` (de/en) | EN/DE requirement |

---

## 2. Conflicts to flag ⚠️

### 2.1 "Lifecycle Stage" is overloaded
- **CSV:** *Lifecycle Stage* (German *Aktueller Status*) is a **relationship
  type** — Potential / Existing / Former **Customer**, Potential / Existing /
  Former **Partner**, Interested, Not Interested, DNC. A **separate** *Stage
  Status* column holds the pipeline state (New, In Progress, Not Reached…).
- **App:** uses "lifecycle stage" to mean the **pipeline stage**, and has **no
  relationship-type field at all**.
- **Impact:** Vion's business explicitly distinguishes customers from recruited
  partners/downline — this is a structural gap, not just naming.

### 2.2 In-app calling present but out of scope
- Master Context §5.3: in-app calling is **removed**; calling is on mobile,
  only **call reports** flow back.
- App ships a full `OutboundCallModal` / call-transcript UI.

### 2.3 Consent modeled as a single boolean
- **App:** `consent: true/false`.
- **CSV:** separate **GDPR communication consent (+date)** and **Newsletter
  subscription (+date)**.
- **Impact:** relevant to the `consent_withdrawn` and consent-gated
  `lead_nurturing` workflows.

---

## 3. Field-model gaps 🕳️

App lead object today (~17 fields): `id, lang, name, email, phone, zip, city,
source, campaign, status, assignedVD, assignedGP, created, consent, attempts,
labels, amount`.

Field groups defined in the CSV but **not modeled** in the app lead:

- **Personal:** salutation/title, gender, *Ansprache* (form of address: Sie/Du),
  date of birth, address (street/country), marital status, children, potential
  (★), estimated income & household income, expected changes, interests/hobbies.
- **Financial profile (Wishes & Goals inputs):** budget (max), risk profile,
  investment horizon, financial goals, existing contracts/products.
- **Funnel/appointment:** appointment scheduled / date / held / type.
- **Event tracking:** invited, event type, attended.
- **Products:** product type, units, provider.
- **Business/employment:** employer, employment type, position, industry,
  company size, decision role.
- **Documents:** type, name, file path/link, date.
- **Activity history:** type, channel, subject, notes.

> The **business/employment** fields resemble *Account* (company) attributes,
> but accounts are removed in the integration. **Open question:** contact-level
> fields now, or out of scope?

---

## 4. Recommendation

Treat the CSV as the **field-model reference** (statuses stay dynamic). Highest
value / lowest risk: add the **relationship-type field** (Customer vs Partner vs
Interested) — a real gap central to Vion's model. The calling-scope conflict
(§2.2) is an architectural decision for the requirements team.

---

## 4a. Decisions made

- **Status flags = 6.** Added `retargetingEligible` (nurture/retargeting eligible,
  consent-gated; Workflow §4B/§5.2/§9). `isContactAttempt` and `isFollowUp` are
  treated as **event-driven**, not flags.
- **Merged the two "not interested" statuses.** *Aktuell kein Interesse*
  (Currently Not Interested) was removed; the single *Kein Interesse*
  (Not Interested) carries `retargetingEligible`. The soft/hard nuance is better
  captured by a follow-up date + consent than a separate status.
- **Singleton is a per-flag property, not global.** `isNewDefault`, `isWon`,
  `isAppointment`, `isNotReachedTerminal`, `excludesOutreach` are singleton
  (exactly one status each); `retargetingEligible` may apply to several. A status
  may hold at most one flag (single-select per status).

## 5. Open questions

1. Expand the lead model to cover CSV fields — all, or just high-value
   (relationship type, split consent/newsletter, financial profile)?
2. Business/employment fields — contact-level or out of scope (accounts removed)?
3. In-app calling UI — keep as prototype or mark out-of-scope per the integration?
4. (See companion note) Does a status still need a **manual/automatic** flag if a
   workflow rule can set it? — Short answer: **yes**, the flag answers a
   different question than rules (see chat discussion).
