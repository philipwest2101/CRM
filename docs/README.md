# Reference Documents

Source specifications and context for the Vion CRM project. These are
reference material for the UI in `src/CRMAppV5.jsx` — they are not imported
by the app at runtime.

## Read order

1. **`Project_Instructions.docx`** — **start here.** How to use this project
   and these documents (operating rules, language, scope traps, working style).
2. **`CRM_Master_Context.docx`** — ground-truth briefing: project overview,
   domain glossary, file index, and business context. Treated as authoritative;
   conflicts with other files should be flagged, not silently resolved.

## All files

| File | What it is |
|------|------------|
| `Project_Instructions.docx` | **How to use the project/documents** — authoritative operating rules. |
| `CRM_Master_Context.docx` | Ground-truth briefing: overview, glossary, file index, domain context. |
| `Vion_Workflow_Specification.docx` | Requirements clarification / workflow specification. |
| `Vion_CRM_Workflow.docx` | Example lead lifecycle / status flow (illustrative, not a fixed spec — see Master Context §5.6). |
| `Vion_Mobile_App_Context.docx` | UI mockups / context for the companion mobile app. |
| `Vion_MASTER_CONTACT_2_ENG.csv` | Master contact/lead field template (field names, allowed values, field types) — German + English. |
| `LH-Vion_Design_System_Reference.md` | Design-system reference (tokens, components, principles) reconstructed from the Figma file. The contract for visual consistency. |
| `User_Story_Activities_Tab_Logs.md` | User stories for the contact-detail **Activities** tab (log feed), from the Balsamiq board *Activities Tab Logs* (`r6379`). |

## Key project rules (from Project_Instructions.docx)

- **"Contact" and "Lead" mean the same thing.**
- Out of scope in the Vion integration: **accounts (companies), additional fields, and in-app calling** (calling is on the mobile app; only call reports flow back).
- **Lead statuses (Lifecycle Stage + Stage Status) are admin-configurable and dynamic** — the statuses in the workflow files are illustrative examples, not hardcoded spec.
- Backend/DB are shared across apps; front-ends are separate repositories.
- Respond in English; give the English equivalent of German domain terms on first use.
