# Plan to Fix Before Selling (Pre-Launch Hardening Plan)

## 0. Scope of v1 We Sell

We only consider v1 "ready to sell" when the following areas are stable, predictable, and tested end-to-end:

- **Must be rock solid**
  - **Auth + organizations + membership**
  - **CRM**: contacts / leads / jobs / quotes / invoices / tasks / calendar
  - **Report system**: V3-compatible templates, reports, PDF pipeline, and public viewer
  - **AI assistants**: per-organization Vapi config, assistant list, basic usage and metrics
  - **Widget**: chat widget configuration + embed flow
  - **Admin**: create organizations, manage users, features/flags

- **Can be marked as beta / evolving**
  - Some advanced analytics views
  - Advanced Report V3-only features (complex section types, future automations)
  - Deeper automation / integrations beyond core flows

---

## Phase 1 – Database, Types, and RLS
### v1 Tenant Model Assumption

For v1, each customer organization typically has **one primary login** that may be shared by colleagues (owner + employees using the same credentials). We still treat all CRM, reports, AI usage, and widget data as **org-level data**, not personal user data.

Implications:

- In early versions, activity is effectively attributed to the primary user account rather than individual employees.
- RLS is designed as **org-level** from day one, so future multi-user per org (via `organization_members`) will not require a data model rewrite.

### 1.1 Regenerate and Align `lib/database.types.ts`

**Goal:** Zero drift between Supabase schema and TypeScript types, so DB changes are always caught at compile time.

**Tasks**

- **T1.1.1 – Regenerate types from Supabase (Agenter dashboard project)**
  - Use Supabase CLI (or MCP-backed generation) to generate a fresh `Database` TS type directly from the `Agenter dashboard` project.
  - Replace the current `lib/database.types.ts` with the generated version (or integrate the generated type into that file in a backward-compatible way).

- **T1.1.2 – Fix compile errors and update imports**
  - Update all imports of `Database` and table row types in:
    - `lib/store.ts`
    - `lib/rapport/*`
    - `lib/supabase.ts` / other Supabase utilities
    - Any `lib/server/*` files using database types
  - Remove or minimize usages of `Record<string, unknown>` for core tables where the DB has a defined shape.

- **T1.1.3 – Focus tables for type accuracy**
  - `users`: ensure all columns are typed (e.g. `organization_id`, `is_super_admin`, `is_first_login`, any Vapi-related columns).
  - `contacts` (and any legacy `customers` concept): align runtime code with the actual `contacts` table.
  - Report-related tables: `reports`, `report_templates`, `report_sections`, `pdf_designs`, `organization_settings`.

**Acceptance Criteria**

- `Database` type is generated from Supabase and is the single source of truth.
- Core tables (auth, org, CRM, reports, AI, widget) have concrete typed row/insert/update shapes rather than `any` / `Record<string, unknown>`.
- A deliberate DB schema change results in compile-time errors where adjustments are needed.

---

### 1.2 RLS and Multi-Tenant Sanity Pass

**Goal:** Every core table has clear, correct, and simple RLS that matches the intended multi-tenant behavior.

**Focus Tables**

- Auth & org: `users`, `organizations`, `organization_members`, `organization_settings`, `feature_flags`.
- CRM: `contacts`, `leads`, `jobs`, `quotes`, `invoices`, `events`, `tasks`, `deals`, `properties`.
- Reports: `reports`, `report_templates`, `report_sections`, `pdf_designs`.
- AI & widget: `chat_widget_configs`, `ai_chat_sessions`, `ai_chat_messages`, `ai_call_sessions`, `ai_usage_daily_metrics`, `vapi_calls`.

**Tasks**

- **T1.2.1 – Document intended RLS semantics per table**
  - For each table, write a one- or two-sentence description, e.g.:
    - "Users can select records where `organization_id` is in their memberships."
    - "Users can only update rows owned by their organization."
  - Compare the description to actual policies from Supabase MCP.

- **T1.2.2 – Simplify `organizations` policies**
  - Supabase advisor warned about multiple permissive RLS policies for `organizations`.
  - Consolidate into a small number of policies per action (select/insert/update/delete), factoring complex logic into SQL functions if needed.

- **T1.2.3 – Decide and enforce RLS semantics for report tables**
  - Decide whether reports and templates are primarily **org-level** or **user-level**:
    - Org-level: anyone in the org can see and collaborate on reports.
    - User-level: only the creator (or specifically authorized users) can see them.
  - Update RLS policies for `reports`, `report_templates`, and `report_sections` to match this decision.

**Acceptance Criteria**

- Each core table’s RLS behavior can be explained in one or two sentences, and the code/docs match.
- `organizations` has a small, understandable set of RLS policies without redundant permissive rules.
- Report-related tables enforce the chosen visibility model consistently.

---

## Phase 2 – Service-Role, Security, and Environment Safety

### 2.1 Service-Role Client Inventory and Hardening

**Goal:** Every use of the Supabase service-role key is narrow, justified, and obviously safe.

**Tasks**

- **T2.1.1 – Inventory service-role usage**
  - Search for all usages of any `createServiceClient` or service-role env variables.
  - For each occurrence, note:
    - Which route/file.
    - Which tables/operations it touches.
    - Why RLS cannot be used directly.

- **T2.1.2 – Verify auth + authZ around each service-role usage**
  - Ensure each route using service-role:
    - Performs authentication first (Supabase `auth.getUser` or equivalent).
    - Checks authorization (e.g. `users.is_super_admin`, `organization_members.role`, or trusted internal key) **before** sensitive reads/writes.
    - Does **not** allow user-controlled parameters to override `organization_id` or similar without server-side verification.

- **T2.1.3 – Add documentation and helpers**
  - Add clear comments in each service-role route describing:
    - Why service-role is needed.
    - The trust model and authZ checks.
  - Where it makes sense, centralize logic into helper functions for:
    - Mapping `user.id` to `organization_id` safely.
    - Checking super-admin privileges.

**Acceptance Criteria**

- Short, explicit list of service-role surfaces, each with clear authentication and authorization guarantees.
- No service-role usage reachable by merely "being logged in" without extra checks when sensitive data is involved.

---

### 2.2 Supabase Env + Demo Mode Behavior

**Goal:** In production, any Supabase misconfiguration fails fast and loudly, never silently falling back to demo mode.

**Tasks**

- **T2.2.1 – Restrict demo/mock client to non-production environments**
  - In `lib/supabase.ts`:
    - For `NODE_ENV === "production"`, require valid Supabase URL and anon key.
    - If missing/invalid, throw an error or make startup fail rather than returning a mock client.
  - Keep the mock client behavior for development and test environments where it is useful.

- **T2.2.2 – Add a health check API route**
  - Implement `app/api/health/route.ts` that:
    - Performs a minimal Supabase operation (e.g. `select 1` or a simple `auth.getUser` check with a service client).
    - Returns a JSON payload indicating database connectivity and overall application health.

**Acceptance Criteria**

- In production, missing or incorrect Supabase configuration causes an immediate, clear failure rather than silent demo-mode behavior.
- `/api/health` exists and can be used by monitoring or manual checks to verify DB connectivity.

---

### 2.3 Supabase Security Settings

**Goal:** Supabase security settings (auth, password policies, protections) are aligned with a real SaaS deployment.

**Tasks**

- **T2.3.1 – Harden Supabase Auth settings**
  - In the Supabase dashboard for the `Agenter dashboard` project:
    - Enable leaked password protection.
    - Set a reasonable password policy (length and complexity) matching the product’s UX.
    - Review session lifetime and refresh policies for consistency with app expectations.

**Acceptance Criteria**

- Supabase security advisor has no critical auth-related warnings.
- Auth behavior (session duration, re-login) is intentional and documented.

---

## Phase 3 – Core Domain Flows: "Everything Works" Guarantee

In this phase, we guarantee that each core domain flow is solid by combining DB/RLS checks, API correctness, state management, and UI/UX behavior.

### 3.1 Auth + Organizations + Membership

**Goal:** A user can sign up/log in, consistently land in the correct organization, and permissions behave as expected.

**Tasks**

- **T3.1.1 – New user / org setup flows**
  - Test and refine flows where:
    - A brand-new user signs up and is associated with an organization.
    - An admin creates a new organization and an owner user via admin APIs.
  - Ensure `organization_members` and `users.organization_id` are populated as expected.

- **T3.1.2 – Login and org resolution**
  - Verify that, on login:
    - The correct organization context is resolved consistently.
    - There is no state where a user is logged in but not associated with any org (unless explicitly handled as an onboarding state).

- **T3.1.3 – Admin vs regular user behavior**
  - Confirm:
    - `/admin` routes are accessible only when `users.is_super_admin` is true.
    - `/analytics/api/*` routes require authentication and behave correctly with RLS.

**Acceptance Criteria**

- Every logged-in user has a well-defined organization context.
- Super-admin-only routes are effectively protected.
- There is a defined and tested behavior for users who do not yet belong to any organization.

---

### 3.2 CRM + Calendar

**Goal:** CRM and calendar features can be used reliably without data corruption or strange edge cases.

**Tasks**

- **T3.2.1 – Align types and queries for CRM entities**
  - For each entity (`contacts`, `leads`, `jobs`, `quotes`, `invoices`, `tasks`, `events`, etc.):
    - Confirm TS types match DB rows after Phase 1.
    - Review corresponding fetch/update functions in `lib/store.ts`:
      - Ensure filters align with RLS (based on `user_id` and/or `organization_id`).
      - Ensure null/empty responses are handled gracefully.

- **T3.2.2 – End-to-end CRUD tests per entity**
  - In the UI, for each core CRM entity:
    - Create, read, update, and delete records.
    - Test edge cases (e.g. deletion with related records where allowed; handle constraints where not allowed).

- **T3.2.3 – Calendar-specific behavior**
  - Verify calendar views (day/week/month) and transitions.
  - Confirm time handling is at least consistent (ideally timezone-aware) between storage and display.

**Acceptance Criteria**

- You can run a realistic day-in-the-life: add leads → convert to jobs → create quotes/invoices → schedule events/tasks.
- No crashes, broken screens, or obvious data inconsistencies in CRM and calendar flows.

---

### 3.3 Report System (Templates, Reports, PDF, Public Viewer)

**Goal:** Report authoring, storage, and PDF export are reliable enough for customer-facing documents.

**Tasks**

- **T3.3.1 – RLS and schema review for report tables**
  - Confirm FKs and RLS for:
    - `report_templates`
    - `reports`
    - `report_sections`
    - `pdf_designs`
    - `organization_settings`
  - Ensure data access matches the chosen org/user visibility model.

- **T3.3.2 – V3 model usage for core flows**
  - Define the minimal V3 feature set required for v1:
    - Templates with `version = 3` and V3-style section structures.
    - Reports based on those templates.
  - Make sure mapping functions and UI flows correctly handle both legacy and V3 shapes, with clear invariants for new flows.

- **T3.3.3 – PDF pipeline testing**
  - Test the HTML-based PDF generator with:
    - Simple and complex templates.
    - Lots of sections and long text content.
    - Images and common edge cases.
  - Verify:
    - Browser `window.print()` preview looks correct.
    - Server-side PDF export (if enabled) generates expected PDFs with correct CSS.

- **T3.3.4 – Public viewer behavior**
  - For shared/public reports:
    - Test viewing as an unauthenticated user.
    - Confirm no leakage of other orgs' data.
    - Validate link behavior (expiry, access rules) as intended.

**Acceptance Criteria**

- A user can create a template, create a report from it, preview it, export a PDF, and share a public link.
- No crashes or broken layouts for typical customer content.

---

### 3.4 AI Assistants, Vapi, and Analytics

**Goal:** AI assistants and their analytics are stable, safe, and tenant-isolated.

**Tasks**

- **T3.4.1 – Per-organization Vapi configuration**
  - Verify that:
    - Vapi config is stored per organization.
    - API keys are never returned in full to normal users (only masked/last4, etc.).
    - Orgs without a Vapi config see a clear error and setup path, not a silent failure.

- **T3.4.2 – AI usage tables and analytics**
  - Confirm RLS for `ai_chat_sessions`, `ai_chat_messages`, `ai_call_sessions`, `ai_usage_daily_metrics`, and `vapi_calls`.
  - Ensure writes correctly set `organization_id` and other key fields.
  - Check analytics queries for correct org scoping and acceptable performance.

- **T3.4.3 – UI flows for AI and analytics**
  - Test assistant list loading, starting an AI session, and seeing basic analytics for that usage.

**Acceptance Criteria**

- From a given org, you can configure Vapi, use assistants, and see usage metrics without cross-tenant leakage or secrets exposure.

---

### 3.5 Widget (Chat Widget + Embed)

**Goal:** The chat widget can be configured and embedded on external sites, correctly scoped to the owning organization.

**Tasks**

- **T3.5.1 – Widget config and RLS**
  - Review `chat_widget_configs` schema and RLS:
    - Only org members can create/update configs.
    - Public/embed reads are done via a safe public identifier (not raw org IDs).

- **T3.5.2 – API route safety (`app/api/chat-widget`)**
  - Re-check `resolveOrgId` logic and any service-role usage around the widget API.
  - Ensure it cannot incorrectly resolve to another org.

- **T3.5.3 – End-to-end embed test**
  - Configure widget in the dashboard for one org.
  - Embed it into a test HTML page.
  - Verify that conversations are scoped to the correct org and assistant.

**Acceptance Criteria**

- Widget configuration is secure per org.
- Embedded widgets on customer sites always talk to the correct org config.

---

## Phase 4 – UX, Onboarding, and Observability

### 4.1 Onboarding and "First 10 Minutes" Flow

**Goal:** A new customer can get to real value quickly, without manual guidance.

**Tasks**

- **T4.1.1 – Guided onboarding experience**
  - Implement a simple multi-step onboarding for new orgs/users:
    - Step 1: Confirm org details (name, logo, timezone).
    - Step 2: Invite teammates (optional).
    - Step 3: Configure Vapi or clearly skip with an explanation.
    - Step 4: Create a first report template or add first contacts.

- **T4.1.2 – Contextual "getting started" prompts**
  - Add banners/empty states on key pages:
    - No contacts → prompt to create first contact.
    - No reports → prompt to create first report template.
    - No Vapi config → prompt to set up AI.

**Acceptance Criteria**

- A brand-new user can go from signup to first meaningful action (e.g. contact added or report created) following clear guidance.

---

### 4.2 Error Handling, Toasts, and Empty States

**Goal:** Users never see silent failures or unexplained blank states; all important errors are communicated clearly.

**Tasks**

- **T4.2.1 – Standardize API error responses**
  - Ensure core APIs return a consistent error shape: `{ code, message, details? }`.
  - Document main error codes for auth, validation, and domain errors.

- **T4.2.2 – UI error and empty state patterns**
  - For each core flow (auth, CRM, reports, AI, widget):
    - Ensure error conditions show a toast or inline message.
    - Provide useful empty states rather than pure emptiness.

**Acceptance Criteria**

- When something fails (DB down, validation fails, permission denied), the user gets a clear message and the app does not just spin or go blank.

---

### 4.3 Logging and Monitoring

**Goal:** When something breaks in production, it can be diagnosed quickly via logs and error tracking.

**Tasks**

- **T4.3.1 – Wire `lib/logger` to an external log/error service**
  - Integrate with a provider (e.g. Sentry, Logtail, etc.) using `lib/logger.ts` as the central logging interface.
  - Ensure at least all `error`-level logs are captured centrally with context.

- **T4.3.2 – Add minimal alerting**
  - Configure basic alerts for:
    - High error rates in key APIs (auth, org creation, Vapi, reports).

**Acceptance Criteria**

- You can see production errors, with stack traces and context, in one place.
- Spikes in failure for critical flows are visible via alerts.

---

## Phase 5 – Pre-Launch Checklist and Ongoing Discipline

### 5.1 Pre-Launch Checklist

Before announcing general availability or onboarding more than a handful of closely managed customers, confirm:

- [ ] `lib/database.types.ts` is regenerated from Supabase and compiles cleanly.
- [ ] RLS semantics are documented and verified for core tables.
- [ ] Service-role usage is inventoried, documented, and has strict auth/authZ.
- [ ] Demo-mode fallback is disabled in production; Supabase env issues fail fast.
- [ ] `/api/health` confirms DB connectivity in staging and prod.
- [ ] Golden-path flows tested end-to-end:
  - [ ] New org + owner user creation.
  - [ ] CRM flows (contacts → leads → jobs → quotes → invoices → tasks/events).
  - [ ] Report creation → PDF export → public share.
  - [ ] AI assistant usage + basic analytics.
  - [ ] Widget configuration + external embed.
- [ ] Onboarding flow walked through by someone who was not part of building it.

### 5.2 Post-Launch Discipline

- Run Supabase MCP advisors (schema and security) regularly and review recommendations.
- Use a staging environment for all DB migrations before production.
- Document:
  - Any breaking changes to schema or APIs.
  - Expectations around support and SLOs for early customers.
