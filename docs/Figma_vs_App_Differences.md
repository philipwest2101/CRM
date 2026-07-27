# Figma **LH‑CRM‑Vion** vs. App (`CRMAppV5`) — Differences

*Comparison of the Figma design source of truth against the React app in this
repository, across four dimensions: **screens & layout · components & UI ·
content & labels · visual style**.*

**Design source:** [`LH-CRM-Vion`](https://www.figma.com/design/pJRPiqqpzmIqiH1XaaHDiT/LH-CRM-Vion?node-id=0-1) · fileKey `pJRPiqqpzmIqiH1XaaHDiT`
Pages: **Library · Main · Archive · Style Guide**. The **Main** page holds ~250 frames / **107 distinct screens** (full inventory in the Appendix).

**App target:** `src/CRMAppV5.tsx` (+ `src/components/**`, `src/theme.ts`, `src/lib/i18n.tsx`). React 18 + Vite, all inline styles, mock data. Default mode is **`version="mvp"`** (MVP page variants, 4‑item nav).

> **Method note.** The screen inventory came from Figma metadata; the visual‑style comparison is done at the **design‑token level** (`docs/LH-Vion_Design_System_Reference.md` ⇄ `src/theme.ts`), which is more exact than eyeballing screenshots. A pixel‑level visual diff was **not** possible this session: the Figma View‑seat MCP rate limit was reached and the sandbox proxy blocks Figma asset downloads. Where a claim needs a live screenshot to confirm, it is flagged **⚠ confirm visually**.

---

## 0. Top‑line findings

| # | Difference | Type |
|---|---|---|
| 1 | **Typeface mismatch.** Design = **Inter**. `index.html` loads Inter, but `CRMAppV5.tsx:218` overrode the whole app with `fontFamily:'DM Sans','Segoe UI'` — and **DM Sans was never loaded**, so the app rendered in system **Segoe UI**, not Inter. ✅ **Fixed** (now Inter). | Bug / visual |
| 2 | **Header treatment.** Design = **solid orange `#FF9000`, 80px tall**. App was **orange gradient** `#FF9000→#FFB733→#FFC94F`, **54px** tall. ✅ **Fixed** — desktop now solid `#FF9000` @ 80px (`top-nav.tsx`). | Visual |
| 3 | **Logo is fabricated.** Design has **no product logo asset** (Design Ref §1.5 explicitly flags this gap). App ships an invented **"vion world \| CRM"** text wordmark + X‑in‑circle SVG (`top-nav.tsx:34‑46`) — exactly the placeholder the reference warned codegen would produce. | Content / brand |
| 4 | **Icon system.** Design = a **~100‑icon set at 24/32px**. App = **emoji** throughout (🖥️ 📱 🌐 ⚙️ 👤 ✉️ ⏰ …). | Visual / components |
| 5 | **Persona model.** Design = **2 personas (Agent / Supervisor)**. App = **3 roles: SA / VD / GP** (+ a stray `manager` name). App correctly drops the undefined **`PO`** the reference flagged. | Content / structure |
| 6 | **Language.** Design content is **English‑only**; app is **bilingual EN/DE, default German** (`lang="de"`). | Content |
| 7 | **Whole domains exist on only one side** — see §5 (design‑only, intentional) and §6 (app‑only additions like the entire AI suite). | Screens |
| 8 | **Dual‑primary resolved.** The Design Ref's open "orange vs blue primary" decision (§5.1) is **settled in the app**: `theme.ts` makes orange `#FF9000` canonical, blue `#0075FF` a secondary accent. | Alignment ✓ |

---

## 1. Screens & layout

Coverage of Figma screen groups against app pages. App routing is in `CRMAppV5.tsx:216‑255`; nav in `top-nav.tsx:19‑25`.

| Figma screen group (node examples) | In app? | App location | Notes |
|---|---|---|---|
| **Dashboard** — `Dashboard` (24510:58613), `Dashboard-GP` (24354:77646), `crm-dashboard` | ✅ | `dashboard-page` → role‑based (`mvp-dashboard`, `gp-dashboard`, `manager`, full) | `crm-kpi-variations` / `alt-4-glass` / `alt-5-dark-neon` / `alt-6-playful` are **design KPI‑style studies**, not shipped screens. |
| **Contacts list** — `contacts` (×5), `Sortable Rows` | ✅ | `mvp-contacts-page` | "Contacts" = "Leads" (same entity, per Project Instructions). |
| **Add Contact** — (×6: 21006/21043/21048…) | ✅ | Add‑contact modal in contacts | Create‑new / add‑existing variants. |
| **Contact Detail** — Overview (×18), Documents, Contact Information, Send Initial Message, **Call Attempts (Not reached 1…5)**, **Call Outcome**, **Appointment Outcome (Scheduled/Won)**, **Finalized steps (Won / Not Interested / Add Network …)** | ✅ | `mvp-contact-detail-page` (tabs **Overview / Information / Activities / Documents**) | Strongest 1:1 match. App reproduces the call‑attempt ladder, outcomes and finalize/convert‑to‑network flow. |
| **Activities/History** — `ViewActivities-Contact Activities`, `…Contact History` | ✅ | Activities tab / Activities route | |
| **Calendar** — `My Calendar` (+meeting/email/call panels), `Scheduled Items` | ✅ | `calendar-page` | |
| **Supervisor Calendar** — Month / Week / Day / Add Activity | ⚠ partial | `calendar-page` | Confirm the app offers all three views + supervisor (team) mode. **⚠ confirm visually** |
| **Bulk Email History** (23891:99625) | ✅ | `bulk-email-history-page` | |
| **Import Contacts** (+ Empty State), `Uploader Landing Page`, `File Uploader` | ⚠ partial | `LeadCapture` → `imports-history-page` | App shows import **history**; confirm the upload/landing + empty‑state screens exist. |
| **Reports** — `First Report ‑ Performance / Call / Email / Meeting` (+ filter open) | ✅ (full ver.) | `reports-page` | **Hidden in MVP** (`top-nav.tsx:25` keeps only nav indices 0‑3). |
| **Settings** — Products / Campaigns / Attachement / Label / Email Templates / Email Config / Twilio Config | ✅ mostly | `mvp-settings-page` (Products, Campaigns, Email Templates, Attachements, Labels, Integrations) | App maps Email/Twilio config → **Integrations**. |
| **Settings — Lifecycle Stages / Stage Statuses** | ❌ removed | — | App made these **system‑defined** (`mvp-settings-page.tsx:91‑93`); intentionally not user‑editable. |
| **Supervisor‑Custom Fields**, **Supervisor‑Industries** | ❌ | — | **Out of scope**: "additional fields" and accounts (`docs/README.md`). |
| **Accounts** — `Supervisor-Accounts`, `Accounts Detail View-*`, `Import Accounts` | ❌ | — | **Out of scope** (companies). App correctly omits. |
| **Telephony** — `Inbound Calls`, `Call Detail`, CDRs, Call **Status/Duration/Time/Hourly** distributions | ❌ | — | Calling lives on the **mobile app**; only call *reports* flow back. Design's telephony analytics are **not** in this app. |
| **Profile / Profile‑Edit / Email Integration** | ⚠ | "My Profile" → Settings | No dedicated profile screen; folded into Settings. |
| **Auth/system** — `Page Not Found`, `Microsoft logged in Success/Failed`, `You are logged in else where` | ❌ | — | App has no auth layer (client‑only mock). |

**Layout‑level differences**
- **Working width.** Design is desktop‑first at **1280px** content width (Design Ref §1.4). The app is a **fluid full‑width** shell (`.device-frame { width:100% }`) with no 1280 max‑width cap — plus a **phone‑preview mode** (430px) the design doesn't model (mobile is a *separate* `Vion_Mobile_App_Context`).
- **Left navigation.** Design defines a **280px expandable left nav** + a settings left‑nav + contact‑detail left‑nav (Design Ref §2). The app is **top‑nav only** — there is no persistent left sidebar; contact‑detail uses an identity rail, not the design's left‑nav component.

---

## 2. Components & UI

Design library ≈ **~70 component sets** (Design Ref §2). App is hand‑built inline‑style components under `src/components/ui/**` and per‑domain folders.

| Design component family | App equivalent | Difference |
|---|---|---|
| **Card lifecycle** (email/call/meeting/task/activity: *collapsed 64px → open → completed*, provider‑aware Gmail/Outlook threading) | `ui/activity-card`, `ui/activity-feed`, contact‑detail cards | App has activity cards, but **provider‑aware (Gmail/Outlook) email threading** is a design feature not evident in the app. **⚠ confirm** |
| **Status pills / badges** (meeting states, send states, GDPR/Subscribe, contact attempts) | `ui/status-badge`, `ui/status-dot`, `ui/score-badge`, `ui/mode-pill` | Broadly present; GDPR/Subscribe badges exist (`dashboard/gdpr-panel`). |
| **Buttons** — 44/36/24px, Connect→Connecting→Connected states | inline buttons | App buttons are ad‑hoc inline styles, **not** a shared 44/36/24 button component with those states. |
| **Icons** — `Icon/<Name>` set, 24/32px | **emoji** | Whole icon system swapped for emoji. |
| **Telephony** — inbound/outbound call popups, dialpad | — | Absent (calling on mobile). |
| **Send Bulk Emails** multi‑step takeover, Recipients/Excluded/Schedule | `email/*`, `newsletter-page` | Present in spirit; confirm the multi‑step takeover matches. |
| **Forms** — input, DDL multi‑select, date/time picker, file uploader (hover/uploaded/error) | inline inputs, native `<select>`/`<option>` | App leans on **native form controls**; design specifies custom dropdowns/date‑time pickers with explicit states. |
| **Header × Role**, **Tabs‑Supervisor**, **Views / My Views DDL**, **Pagination** | `top-nav`, tab strips | App header is bespoke; no saved‑Views/My‑Views DDL system; pagination is simpler. |

**App‑only components with no design counterpart:** `ai/*` (voice‑to‑CRM, objection‑roleplay, insights, meeting‑prep brief, agents panel), `floating-agent-chat`, `ui/spark`/`mini-pie`/`mini-calendar`/`bar-chart`/`goals-widget`, auto‑assign UI, education/events pages.

---

## 3. Content & labels

- **Language.** Design = **English only**. App = **bilingual**, default **German** (`i18n.tsx`, `lang="de"`). E.g. nav renders "Dashboard / Kontakte / Kalender / Newsletter" by default.
- **Persona labels.** Design "Agent / Supervisor". App roles: **Super Admin (SA) / Sales Director / Advisor (GP)** (`i18n.tsx:21‑23`, `top-nav.tsx:8`). App **omits `PO`** (the reference flagged it as undefined — good). A stray **`manager` / "Julia Bauer"** name appears in `top-nav.tsx:10` with no matching role entry.
- **Nav wording.** Design‑Ref proposed nav = *Dashboard, Leads, Email Marketing, Reports, Education, Settings*. App nav = *Dashboard, **Contacts**, Calendar, **Newsletter**, (Reports hidden in MVP)*; **Settings** is a **gear icon**, not a nav item. "Email Marketing" → **"Newsletter"**; "Leads" → **"Contacts"**.
- **Design‑file typos** (present in Figma frame names, worth *not* copying into the app): "Distribui­tion", "Not Intrested", "Finilized", "Accardion", "Attachement". The app already uses correct English **except** it deliberately keeps **"Attachements"** (`mvp-settings-page.tsx:98`) — mirrors the Figma typo; recommend "Attachments".
- **Terminology alignment ✓.** "Contact = Lead", Lifecycle Stage vs Stage Status split, outcomes (Won / Not Interested / Not Reached), "Add Network" conversion — all match the design's vocabulary.

---

## 4. Visual style (design tokens)

`docs/LH-Vion_Design_System_Reference.md` §8 (canonical) ⇄ `src/theme.ts`.

| Token | Figma design | App (`theme.ts` / CSS) | Match |
|---|---|---|---|
| **Primary** | `#FF9000` orange (decided canonical) | `primary:"#FF9000"` | ✅ |
| Primary dark | — | `primaryDark:"#E07F00"` | app‑added |
| Primary soft / 50 | `#FFF4E0` | `primarySoft:"#FFF4E0"` | ✅ |
| Secondary accent (blue) | `#0075FF` | `blue:"#0075FF"` | ✅ (as accent) |
| **Font family** | **Inter** | CSS says Inter, but root inline = **DM Sans → falls back to Segoe UI** | ❌ **mismatch (bug #1)** |
| **Header bg** | **solid `#FF9000`** | **gradient** `#FF9000→#FFB733→#FFC94F` | ❌ |
| **Header height** | **80px** | **54px** | ❌ |
| Gray/900 | `#101828` | (navy `#1D2939` = Gray/800) | ~ |
| Gray/800 | `#1D2939` | `navy:"#1D2939"` | ✅ |
| Gray/500 | `#667085` | `slate:"#667085"` | ✅ |
| Gray/400 | `#98A2B3` | `muted:"#98A2B3"` | ✅ |
| Gray/200 border | `#EAECF0` | `border:"#EAECF0"` | ✅ |
| Gray/50 bg | `#F9FAFB` | `light:"#F9FAFB"` | ✅ |
| Body text | `#222730` | `text:"#222730"` | ✅ |
| Success | `#12B76A` | `green:"#12B76A"` | ✅ |
| Warning | `#FDB022` | `amber:"#FDB022"` | ✅ |
| Error | `#F04438` | `red:"#F04438"` | ✅ |
| Spacing rhythm | 4/8/16/24/32 | ad‑hoc inline (no token scale) | ~ |
| Content max‑width | 1280px | none (fluid) | ❌ |
| Icons | 24/32 icon set | emoji | ❌ |
| Logo | asset gap (white wordmark on orange) | fabricated text wordmark | ❌ |

**Verdict:** the **color palette is a near‑exact match** — the app faithfully implements the design's neutral ramp and semantic colors and even resolves the design's dual‑primary ambiguity. The divergences are concentrated in **typography (Inter not actually applied), header chrome (gradient + shorter), the logo, and the icon system (emoji).**

---

## 5. Design‑only, by intent (not gaps)

These exist in Figma but are **correctly absent** from the app per `docs/README.md` / Project Instructions scope rules:

- **Accounts / companies** and all `Accounts Detail View`, `Import Accounts`, `Industries` screens.
- **In‑app calling / telephony** — inbound/outbound popups, dialpad, CDRs and call‑distribution analytics (calling is the mobile app; only call *reports* return).
- **Custom / additional fields** (`Supervisor-Custom Fields`).
- **Lifecycle Stage / Stage Status** settings CRUD — deliberately made system‑defined.

## 6. App‑only additions (not in Figma)

Built into the app with **no design counterpart** — worth deciding whether they should be designed back into Figma:

- **Entire AI suite:** `voice-to-crm`, `ai-objection-roleplay`, `ai-insights-tab`, `ai-meeting-prep-brief`, `ai-agents-panel`, `call-analysis-tab`, `floating-agent-chat`, `lead-ai-insights`, AI scoring.
- **Auto‑assignment / smart (re)assignment** page and dashboard panels.
- **Education hub** (`education-page`, `gp-education-page`) and **Events** (`events-page`).
- **Newsletter** page, **Reminders** page, **Audit Log** (Settings).
- **Responsive/mobile preview** mode (430px device frame) — mobile is a separate context doc, not this Figma file.

## 7. Bugs & inconsistencies found

1. **Font override bug** (§0 #1) — the `DM Sans` inline override in `CRMAppV5.tsx:218` prevented the app from using **Inter** as designed. ✅ **Fixed** — replaced with the Inter stack.
2. **`manager` role not exposed in the switcher** — `top-nav.tsx` `roles{}` offers only superadmin/vd/gp, yet `manager` ("Julia Bauer") drives real UI branches in `full-dashboard-page`, `reports-page`, `email-marketing-page` and `settings-page`. So it's an **orphaned/unreachable role**, not dead code. ⏸ **Left as-is** — fully removing it (5 files) or adding it to the switcher (expands beyond the design's 2‑persona model) is a product decision, not a mechanical fix. Flagged for you to choose.
3. **"Attachements"** typo carried from Figma into app labels. ✅ **Fixed** — now "Attachments/Attachment" (`mvp-settings-page`, `mvp-contacts-page`).
4. Header **gradient vs solid** and **54 vs 80px**. ✅ **Fixed** — desktop header now solid `#FF9000` at **80px** per Design Ref §8.1 (mobile bar kept compact at 54px, as mobile isn't in this Figma file).

> **Fixes applied** in this branch (`claude/figma-lh-crm-vion-compare-sglhhs`): items 1, 3, 4 above. Build + affected files type-check clean (pre-existing loose-typing errors elsewhere are unrelated). The **logo** (§0 #3) still needs a real SVG asset from design before it can be corrected.

---

## Appendix — Figma "Main" page screen inventory (107 distinct)

<details><summary>Full list (dedup, generic wrapper frames removed)</summary>

Dashboard · Dashboard‑GP · crm‑dashboard · crm‑kpi‑variations · crm‑kpi‑alternatives (alt‑4‑glass / alt‑5‑dark‑neon / alt‑6‑playful) ·
contacts · Add Contact · Sortable Rows · Contact Info Accardion ·
Contact Detail View — Overview / Documents / Contact Information / Send Initial Message ·
Contact Detail View — Call Attempts (Not reached 1/2/5) · Call OutCome · Call Outcome (Appointment Scheduled / Not Intrested) · Appointment Outcome (Scheduled / Won) · Finilized Step (5 Notreached / Not Intrested / Won / Outcome Disabled / Add Network) ·
Contact Detail View‑Independent (+ /Activities) · ViewActivities — Contact Activities / Contact History · not‑reached‑attempt‑3/4/5‑of‑5 (+confirmed) ·
Import Contacts (+ Empty State) · Uploader Landing Page · File Uploader · Bulk Email History · Email template ‑ Creating meeting ·
My Calendar (+ meeting / email(scheduled) / email(done) / call panels) · Scheduled Items ·
Supervisor‑Calendar Month / Week / Day View (+ Add Activity) ·
First Report — Performance (+ Filter open) / Call / Email / Meeting ·
Supervisor — Activity Report · Call Detail Records (CDRs) · Call Status Distribuition · Call Duration Distribution · Call Time Distribuition · Hourly Call Activity · no result found ·
Settings — Products / Campaigns / Lifecycle Stages / Attachement / Stage Statuses (Super Admin) ·
Supervisor — Custom Fields (+ Single select DDL) / Industries / Attachment / Stage Status / Lifecycle stage (+scroll) / Label / Email Templates / Email Configuration / Twilio Configuration ·
Accounts — Supervisor‑Accounts · Accounts Detail View (Overview collapsed/expanded, Activities: Task/Meeting/Call/Email/Meeting‑Minimized) · Import Accounts / Import Emails / Import Offline Logs ·
Telephony — Inbound Calls · Call Detail ·
Profile · Profile‑Edit · Profile/Email Integration ·
System — Page Not Found · Microsoft logged in Success / Failed · You are logged in else where · No result Found ·
Components — Navbar · More Action · Breadcrumbs container · Main grid

</details>

*Generated by design‑to‑app comparison. Visual (pixel) confirmation of the ⚠ items is pending a Figma seat with available MCP calls.*
