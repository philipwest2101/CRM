# LH-CRM-Vion — Design System Reference

*A reconstructed design-system reference compiled from direct analysis of the Figma file. This documents the system as it actually exists today (an unpublished, organically-grown system), including the inconsistencies worth resolving. Use it as the contract for keeping new work consistent.*

**Source file:** [`LH-CRM-Vion`](https://www.figma.com/design/pJRPiqqpzmIqiH1XaaHDiT/LH-CRM-Vion?node-id=0-1) · fileKey `pJRPiqqpzmIqiH1XaaHDiT`
**Pages:** Library · Main · Archive · Style Guide

**Figma links:**

| Area | Link | Node |
|---|---|---|
| File (open) | https://www.figma.com/design/pJRPiqqpzmIqiH1XaaHDiT/LH-CRM-Vion?node-id=0-1 | `0:1` |
| Style Guide page | https://www.figma.com/design/pJRPiqqpzmIqiH1XaaHDiT/LH-CRM-Vion?node-id=8952-6287 | `8952:6287` |
| Library page | https://www.figma.com/design/pJRPiqqpzmIqiH1XaaHDiT/LH-CRM-Vion?node-id=134-98 | `134:98` |
| Components | https://www.figma.com/design/pJRPiqqpzmIqiH1XaaHDiT/LH-CRM-Vion?node-id=24003-102141 | `24003:102141` |
| Main flow / prototype | https://www.figma.com/design/pJRPiqqpzmIqiH1XaaHDiT/LH-CRM-Vion?node-id=4411-13449 | `4411:13449` |
| Archive page | https://www.figma.com/design/pJRPiqqpzmIqiH1XaaHDiT/LH-CRM-Vion?node-id=21052-84396 | `21052:84396` |
**Product:** Multi-brand CRM (Agent + Supervisor personas) under the Vion / Green Habitat umbrella. Brand logos present in the icon set: CIMA, Partner Bank (PB), Green Habitat (GH), FFE, Arena, Twowings.

> **Confidence note:** Tokens, the component inventory, and visual patterns below are read directly from the file. The *Prototype & Interaction* section is reconstructed from component states and the screen inventory (which encode the interaction model reliably) — the live prototype-wiring page (`4411:13449`) timed out during extraction and should get a dedicated follow-up pass to confirm exact triggers/transitions.

---

## 1. Foundations — Tokens

### 1.1 Typography

Typeface: **Inter** throughout (Regular 400 / Medium 500 / Semibold 600 / Bold 700). One stray foreign token exists (see inconsistencies).

Type scale (from the Style Guide specimen + bound text variables):

| Token | Size | Line height | Notes |
|---|---|---|---|
| Xs | 12px | 14px* | `Text xs/regular`, `Text xs/medium`. *Spec sheet also shows an 18px option — reconcile. |
| Sm | 14px | 20px | `Text sm/Medium` |
| Md (Base) | 16px | 24px | `Text md/Regular`, `Text md/Medium`, `Text md/Semibold` |
| Lg (H3) | 18px | 28px | |
| Xl (H2) | 24px | 32px | `H6/semibold` is bound here (naming mismatch) |
| 2Xl (H1) | 30px | 38px | |

Each size is documented with Regular / Medium / Semibold / Bold variants.

### 1.2 Color

**Documented brand palette (Style Guide swatches):**

- **Primary — blue ramp:** `#071B5D` · `#0B257E` · `#18359F` · `#2649C0` · `#385FE1` · `#4972F6` · `#7092F7` · `#99B1F9` · `#C2D0FB` · `#EAEFFD` · `#FDFDFF`
- **Secondary — yellow ramp:** `#FFC900` · `#FFD22E` · `#FFE68A` · `#FFF0B7` · `#FFF9E5`
- **General accents:** `#FB6514` (orange) · `#9B8AFB` (violet) · `#12B76A` (green) · `#EE46BC` (pink)
- **Gray:** `#1D2939` · `#667085` · `#98A2B3` · `#EAECF0` · `#F2F4F7` · `#F9FAFB`
- **Error:** `#D92D20` · `#F04438` · `#FEE4E2` · `#FEF3F2`
- **Warning:** `#FDB022` · `#FFFAEB`
- **Success:** `#45A081` · `#12B76A`

**Live variables actually bound in components** (the working system — note the divergence from the swatches):

| Variable | Value | |
|---|---|---|
| `Primary` | `#0075FF` | blue |
| `Primary/500` | `#FF9000` | **orange** |
| `Primary/50` | `#FFF4E0` | light orange |
| `Primary/25` | `#FFFAF2` | near-white orange |
| `Gray/900` | `#101828` | |
| `Gray/800` | `#1D2939` | |
| `Gray/700` | `#344054` | |
| `Gray/500` | `#667085` | |
| `Gray/400` | `#98A2B3` | |
| `Gray/300` | `#D0D5DD` | |
| `Gray/100` | `#F2F4F7` | |
| `Error/500` | `#F04438` | |
| `Warning/400` | `#FDB022` | |
| `Text` | `#222730` | body text |
| `White` / `General/White` | `#FFFFFF` | duplicated |

The foundation is **Untitled-UI-derived** (the gray ramp, error/warning/success families and `Shadow/xs` are classic Untitled UI values), extended with project-specific accents.

### 1.3 Effects (elevation)

| Token | Definition | Use |
|---|---|---|
| `Shadow/xs` | drop `#1018280D`, offset (0,1), radius 2 | default subtle elevation (cards, inputs) |
| `Shadow/xs focused 4px primary-100` | `#F4EBFF` 4px spread + `Shadow/xs` | focus ring (purple-tinted) |
| `Drop Shadow` | `#FFFAF2` 4px spread | alternate focus ring (orange-tinted) |
| Popup / Login (Style Guide) | 4 documented specimens | modals, dropdowns, auth card — exact values not yet extracted |

### 1.4 Spacing & sizing (inferred from auto-layout + repeated dimensions)

- **Spacing rhythm:** 4 / 8 / 16 / 24 / 32 — 16 and 24 dominate; container insets are consistently 16–24px.
- **Modal / popup:** 512px wide, 24px inset → 464px content width.
- **Communication cards** (email/call/meeting/task/activity): ~871–872px wide; **64px collapsed** height; 16–20px padding.
- **Form fields** (input / dropdown / date / time): 378px × 70px (label + control block).
- **Header:** 1280px content × 80px. **Left nav:** 280px expanded. **Table row:** 1110px × 56px.
- **Avatars:** 40×40 standard (24/32 in dense contexts). **Status pills:** 20px tall. **Badges:** 26px tall.
- **Icons:** standard sizes are **24×24px** and **32×32px** only. Use 32×32 for nav/action contexts and 24×24 for inline/secondary contexts. (The file currently also contains stray 16px and 20px icon instances — these should be migrated to 24/32. Decorative dots/stepper markers that aren't true icons are exempt.)
- **Buttons:** 44px large/primary · 36px medium · 24/20px compact · icon buttons 32/36.

---

## 2. Component Library

~70 component sets, organized by domain.

### Navigation & chrome
- **Header** — `Property × Role` (Agent / Supervisor); states: Default, Data selected/on, Insight on, Report selected/on, Date selected, Import selected/open, Planner selected/on.
- **Left nav** (expanded / collapsed) · **Left nav – Settings** · **Contact Detail Left Nav**
- **Tabs-Supervisor** · **Views** · **My Views DDL** · **Pagination**

### Contact / records
- **Add Contact** (Create new / Add existing) · **Contact Info Accordion** (Default / Close) · **Profile details**
- **Status Journey** (Passed / Note / Current) + **Lines** (Passed / Note / in-progress) — timeline system
- **Card** (Type: New/State/Passed/Note × State: Default/Hover × Alternative 1/2) · **Cards1** · **Cards2** · **Document Cards**
- **Sortable Rows** (Default/Hover) · **Text Long** (Long/Short × Default/Hover — truncation) · **Contact Attempts**

### Communication / activity (core surface)
- **Email Cards** / **Email Cards-1** — Default / Open / Thread·Gmail / Thread·Outlook / Thread+Open (provider-aware threading)
- **Call Cards** (Call / Open / Open-Transcript / Logged) · **Logged Call Cards**
- **Meeting Cards** (Default / Open / Completed / small variants) · **Task Cards** (Default / Open / Completed) · **Activity Cards**
- **Action Email** (Default / Variant2 / Attachment)

### Telephony (dialer)
- **Inbound Call Popup – Existing Number** (Default / Answered / Done / Minimized)
- **Inbound Call Popup – New Number** (Default / Answered / variants)
- **Outbound** / **Outbound-Account** (Dialpad: Outbound Call / End Call / Dialpad3)

### Bulk email / campaign
- **Send Bulk Emails** (Default / Template open / Template select / Recipients — multi-step takeover)
- **Recipients list** · **Excluded** badge · **Schedule Send** (Check/Uncheck) · **AI Generated** badge (4 states) · **Badges** (GDPR / Subscribe × ON/OFF)

### Forms & inputs
- **Input field** · **Input field with badge** (Default / Typing / Field)
- **Dropdown** (Default / Open / Add) · **DDL Multi-select** (Default / Selected / Open) · **Lifecycle stage**
- **Date picker** · **Time picker** · **File Uploader** (size/hover/uploaded/error variants)
- **Linked Account** · **Password reset** (strength states) · **Checkbox** · **Meeting switches** · **Meeting Type** (Video Conference / MS Meeting)

### Buttons & actions
- **Button** (large 44 / medium 36 / compact; Connect / Connecting / Connected / Disable)
- **More Action** (Kind: More Action / Calendar-Table Meeting·Call·Email / Supervisor / Industries / Calendar / Campaign / Bulk-History Sent·Scheduled / Attachment × State Default/Open)
- **More Button** · **Import Button** · **Import file** (Default / loading / 90% / error) · **Float button (Note)** · **Segments** · **Edit Mode**

### Feedback / system
- **Loading** (progress bar) · **Loading 4** (spinner) · **Status** (Default / Sent / Connected)
- **Status-Meeting** (Scheduled / Overdue / Completed / Reschedule / Absent / Canceled) · **+10 / +1** avatar overflow

### Icons
~100 icons, plus the six brand logos. Naming convention `Icon/<Name>`. **Standard usage sizes: 24×24px and 32×32px only.**

---

## 3. Design Principles (the visual language)

1. **Card-centric activity model.** Every interaction type — email, call, meeting, task, note, logged activity — is a card sharing one lifecycle: *collapsed (64px) → open → completed*. This is the strongest and most consistent pattern in the system.
2. **Provider awareness.** Gmail / Outlook threading is built directly into email cards rather than abstracted away.
3. **Role-based theming.** Agent vs Supervisor variants run through Header, nav and tabs — the system is designed around two personas from the ground up.
4. **Status as a first-class citizen.** A deep, semantic vocabulary of pills and badges (meeting states, send states, GDPR/subscribe, contact attempts) with consistent color semantics.
5. **Dense, desktop-first data UI.** 1280px+ working widths, a tight 16/24 rhythm, compact controls — built for operators working a queue, not casual users.
6. **Untitled-UI foundation, extended.** A recognized base system the team grew product-specific components on top of.

---

## 4. Prototype & Interaction Patterns *(reconstructed — confirm in a follow-up pass)*

The component states imply a consistent interaction grammar:
- **Expand/collapse** as the primary disclosure pattern (every card has collapsed ↔ open; accordion has Default ↔ Close).
- **Multi-step takeovers** for complex flows (Send Bulk Emails: compose → template select → template open → recipients; Inbound Call: ringing → answered → done → minimized).
- **Inline progressive states** rather than separate screens (import: default → loading → 90% → error; button: connect → connecting → connected).
- **Hover affordances** defined explicitly (Sortable Rows, Document Cards, Excluded, +N overflow all carry Hover variants) — actions are hover-revealed in dense lists.
- **Minimize/escape hatches** for interruptive surfaces (call popup minimizes; modals carry Close).

---

## 5. Implicit System Rules & Inconsistencies

The conventions that exist in practice — and where they conflict. **Resolving #1 and #2 matters most.**

1. **Dual primary identity.** The Style Guide documents a **blue** primary ramp, but live interactive components bind to an **orange** `Primary/500 = #FF9000` (with `Primary/25/50` in the orange family) — while a separate `Primary = #0075FF` (blue) also exists. New work currently can't tell which is canonical.
2. **Inconsistent focus ring.** `#F4EBFF` (purple) in one token vs `#FFFAF2` (orange) in another.
3. **Token naming drift.** `Gray` vs `Grey`; `/500` vs `/05`; `Primary` vs `Primary/500`; duplicate `White` / `General/White`; typo `Tex md/regular`; a `Manrope / Body 1` token bound to **IBM Plex Sans**.
4. **Variant naming.** Most sets use Figma defaults (`Property 1=Default/Variant2/Variant3`) rather than semantic props. A few do it well (Header `Property × Role`, Card `Type × State × Alternative`, Badges `State × Type`) — standardize on those.
5. **Line-height units.** Mixed px and unitless (`1.25`, `1.5`).
6. **Styles vs variables.** Documented color *styles* don't all map to bound *variables* — two parallel sources of truth.
7. **Duplicate components.** `Email Cards` vs `Email Cards-1`; `Send Bulk Emails` and `Recipients list` each appear twice — likely working copies to reconcile.
8. **Archive page** exists (good hygiene) — verify nothing live still references it.

---

## 6. Recommendations (consistency & scalability)

1. **Pick one canonical primary** and document it; collapse the orange/blue duplication into a single ramp plus a clearly-named accent.
2. **Promote all color styles to variables** — one source of truth; delete duplicates and foreign tokens (`Grey/05`, `Manrope`→IBM Plex).
3. **Adopt semantic variant props** everywhere (`state=`, `type=`, `size=`, `role=`), following the patterns Header/Card/Badges already use.
4. **Formalize spacing & radius tokens** (4/8/16/24/32 + a radius scale) instead of relying on auto-layout values.
5. **Standardize one focus-ring token** and one elevation set with named levels (xs / card / popup / modal).
6. **Reconcile duplicate components** into single sources with variants.
7. **Publish as a shared library** so the other brand files (CIMA, Partner Bank, etc.) consume governed tokens and components.

---

## 7. Using this as a design-system-aware partner

When requesting new screens, features, or components, I'll:
- reuse existing components/variants and bound tokens first, before introducing anything new;
- follow the established patterns (card lifecycle, expand/collapse, multi-step takeover, role variants, status pills);
- default to canonical tokens and flag whenever a request would require a *new* token, component, or pattern — with a reuse alternative;
- call out consistency/scalability risks (e.g. the dual-primary issue) when they're relevant to what you're building.

*To deepen this reference next: a dedicated pass on the Main prototype page to capture exact triggers/transitions, and extraction of the Popup/Login shadow values and corner-radius tokens.*
