---
description: Fullständig förbättring, optimering eller bugfix av vilken modul som helst i projektet.
auto_execution_mode: 1
---

WORKFLOW: IMPROVE ANY MODULE

Goal:
Perform a full fix/improvement pass on any module the user specifies. 
This workflow works for: calendar, contacts, tasks, reports, adminpanel, widget system, analytics, AI assistant, org system, dashboard, auth, or any other code in the repo.

---

STEPS:

1. **Confirm Task**
   Ask the user:
   - What module do you want to improve?
   - What is the specific issue or improvement you want?
   Use their one-sentence answer as module selector.

2. **Architecture Scan**
   Scan ONLY the relevant module using:
   - folder structure
   - component tree
   - UI components
   - API routes
   - DB tables
   - types/zod schemas
   - state stores
   - hooks
   - utils
   - rendering logic
   - fetchers
   - server actions
   Identify:
   - inconsistencies
   - broken flows
   - duplicated logic
   - type drift
   - missing error handling
   - poor naming
   - bad UX flow
   - performance issues

3. **Issue Mapping**
   Create a list:
   - What is broken?
   - What is outdated?
   - What is confusing?
   - What is inconsistent?
   - What is missing?

4. **Design Proposal**
   Propose a clean architecture fix that:
   - reduces code complexity
   - improves clarity
   - matches project conventions
   - follows V3 domain rules if reports
   - reduces API calls
   - fixes type drift
   - improves UI/UX and loading states

5. **Diff Proposal**
   Before writing code:
   - Propose minimal safe diffs for each file that needs changes.
   - Wait for user confirmation.

6. **Implementation**
   After user says “OK”:
   - Apply the diffs file-by-file.
   - Never overwrite whole files unless explicitly requested.
   - Keep consistent naming and imports.
   - Run self-check to ensure no unused imports, mismatched types or dead code.

7. **Self-Critique**
   Evaluate:
   - Do changes follow project conventions?
   - Did I follow naming rules?
   - Did I preserve V3 invariants?
   - Did I create new complexity?
   - Did I produce redundant logic?
   - If issues → propose corrections.

8. **Testing Instructions**
   Provide:
   - UI steps to verify fix
   - Edge-case tests
   - Quick regression checklist for the module
   - API verification steps if needed

---

RESTRICTIONS:
- Do NOT hallucinate file or folder names.
- If context is missing, request the exact file.
- Do NOT generate code before diff approval.
- Follow minimal-diff approach.
- Respect multi-tenant + RLS assumptions.
- Respect module architecture — don't rewrite entire systems.
- For reports module, always check versioning, V3 shapes, and renderer chain.

---

OUTPUT FORMAT:
- Step-by-step messages
- Ask before doing
- Show diffs clearly
