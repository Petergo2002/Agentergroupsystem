# Phase 3 – Core Domain Flows Verification

> **Generated:** 2025-11-28  
> **Status:** Verification complete  
> **Purpose:** Document end-to-end flow verification for all core domains

---

## 3.1 Auth + Organizations + Membership

### 3.1.A – New User / Org Setup Flows

#### Admin-Created Users (Primary Flow)

**Route:** `POST /api/admin/organizations`

| Step | Action | Status |
|------|--------|--------|
| 1 | Super-admin check | ✅ Verified via `is_super_admin` |
| 2 | Create organization | ✅ Inserts into `organizations` |
| 3 | Create feature flags | ✅ Inserts into `feature_flags` |
| 4 | Create auth user | ✅ Uses `serviceClient.auth.admin.createUser()` |
| 5 | Create users record | ✅ Sets `organization_id`, `is_first_login` |
| 6 | Create organization_members | ✅ Sets role = "owner" |
| 7 | Update org owner_id | ✅ Links org to user |

**Verdict:** ✅ Complete and correct flow.

#### Self-Signup Flow

**Route:** `POST /auth/signup` → `lib/auth.ts` → Supabase Auth

| Step | Action | Status |
|------|--------|--------|
| 1 | User signs up | ✅ Creates auth.users record |
| 2 | Email verification | ✅ Supabase handles this |
| 3 | Create public.users record | ⚠️ **Not automatic** |
| 4 | Associate with organization | ⚠️ **Not automatic** |

**Issue Found:** Self-signup creates an `auth.users` record but does NOT automatically create a `public.users` record or associate with an organization. This is intentional for v1 (admin-only user creation), but should be documented.

**Recommendation:** Add a note in the signup page or redirect to a "contact admin" message, OR implement a trigger/callback to create the users record.

---

### 3.1.B – Login and Org Resolution

#### Login Flow

**Route:** `POST /auth/login` → `lib/auth.ts`

| Step | Action | Status |
|------|--------|--------|
| 1 | Authenticate | ✅ `auth.signInWithPassword()` |
| 2 | Fetch user data | ✅ `/api/auth/session` returns user + org info |
| 3 | First login handling | ✅ Sets `is_first_login = false`, stores welcome flag |
| 4 | Redirect to dashboard | ✅ `router.push("/")` |

**Verdict:** ✅ Login flow is solid.

#### Org Resolution Patterns

| Location | Method | Status |
|----------|--------|--------|
| `app/(dashboard)/layout.tsx` | `users.organization_id` via service client | ✅ |
| `app/api/chat-widget/route.ts` | `resolveOrgId()` - multi-fallback | ✅ |
| `lib/server/vapi-org-config.ts` | `users.organization_id` | ✅ |
| `lib/server/auth-helpers.ts` | `requireOrgMember()` | ✅ New helper |

**Verdict:** ✅ Org resolution is consistent across routes.

---

### 3.1.C – Admin vs Regular User

#### Admin Route Protection

| Layer | Protection | Status |
|-------|------------|--------|
| Middleware | Checks `is_super_admin`, redirects if false | ✅ |
| Layout | Server-side check, redirects if not super admin | ✅ |
| API routes | Each route checks `is_super_admin` | ✅ |

**Verdict:** ✅ Triple-layer protection is robust.

#### Analytics API Protection

| Route | Auth Check | Org Scoping | Status |
|-------|------------|-------------|--------|
| `/analytics/api/vapi` | ✅ getUser() | ✅ org from user | ✅ |
| `/api/user/assistants` | ✅ getUser() | ✅ org from user | ✅ |

**Verdict:** ✅ Analytics routes are properly protected.

---

## 3.2 CRM + Calendar

### 3.2.A – Types and Queries Alignment

#### Type Definitions

| Entity | Database Type | Store Type | Status |
|--------|---------------|------------|--------|
| contacts | `Database["public"]["Tables"]["contacts"]` | `CustomerRow` (custom) | ⚠️ Slight mismatch |
| deals | `Database["public"]["Tables"]["deals"]` | Not in store | ⚠️ Missing |
| properties | `Database["public"]["Tables"]["properties"]` | Not in store | ⚠️ Missing |
| events | `Database["public"]["Tables"]["events"]` | `EventRow` (custom) | ⚠️ Slight mismatch |
| tasks | `Database["public"]["Tables"]["tasks"]` | `TaskRow` (custom) | ⚠️ Slight mismatch |
| leads | `Database["public"]["Tables"]["leads"]` | `LeadRow` (from DB) | ✅ |
| jobs | `Database["public"]["Tables"]["jobs"]` | `JobRow` (from DB) | ✅ |
| quotes | `Database["public"]["Tables"]["quotes"]` | `QuoteRow` (from DB) | ✅ |
| invoices | `Database["public"]["Tables"]["invoices"]` | `InvoiceRow` (from DB) | ✅ |

**Issue Found:** Some store types are manually defined instead of using `Database` types. This can cause drift.

**Recommendation:** Update store types to derive from `Database` types:
```typescript
type CustomerRow = Database["public"]["Tables"]["contacts"]["Row"];
type EventRow = Database["public"]["Tables"]["events"]["Row"];
type TaskRow = Database["public"]["Tables"]["tasks"]["Row"];
```

#### Query Patterns

| Entity | Query Filter | RLS Model | Status |
|--------|--------------|-----------|--------|
| contacts | None (relies on RLS) | Currently user-level | ⚠️ Needs org-level |
| events | None (relies on RLS) | Currently user-level | ⚠️ Needs org-level |
| tasks | None (relies on RLS) | Currently user-level | ⚠️ Needs org-level |

**Note:** RLS changes are deferred to the migration phase.

---

### 3.2.B – CRUD Functionality

All CRM entities have complete CRUD in `lib/store.ts`:

| Entity | Create | Read | Update | Delete | Status |
|--------|--------|------|--------|--------|--------|
| customers/contacts | ✅ | ✅ | ✅ | ✅ | ✅ |
| leads | ✅ | ✅ | ✅ | ✅ | ✅ |
| jobs | ✅ | ✅ | ✅ | ✅ | ✅ |
| quotes | ✅ | ✅ | ✅ | ✅ | ✅ |
| invoices | ✅ | ✅ | ✅ | ✅ | ✅ |
| events | ✅ | ✅ | ✅ | ✅ | ✅ |
| tasks | ✅ | ✅ | ✅ | ✅ | ✅ |

**Verdict:** ✅ All CRUD operations are implemented.

---

### 3.2.C – Calendar Behavior

| Feature | Status |
|---------|--------|
| Day/Week/Month views | ✅ Implemented in `CalendarView` |
| Date navigation | ✅ Via `selectedDate` in store |
| Event creation | ✅ Via `addEvent` |
| Time handling | ⚠️ Uses ISO strings, TZ display depends on browser |

**Verdict:** ✅ Calendar is functional. TZ handling is browser-dependent (acceptable for v1).

---

## 3.3 Report System

### 3.3.A – RLS + Schema for Report Tables

| Table | Has organization_id | RLS Model | Status |
|-------|---------------------|-----------|--------|
| reports | ✅ | Currently user-level | ⚠️ Needs org-level |
| report_templates | ✅ | Currently user-level | ⚠️ Needs org-level |
| report_sections | ✅ | Currently user-level | ⚠️ Needs org-level |
| pdf_designs | ❌ (has created_by) | Global read, creator write | ✅ OK |
| organization_settings | ✅ (id = org_id) | ⚠️ Too permissive | ⚠️ Needs fix |

**Note:** RLS changes are deferred to the migration phase.

---

### 3.3.B – V3 Model Usage

| Component | V3 Support | Status |
|-----------|------------|--------|
| Templates | `version` column exists | ✅ |
| Reports | `version` column exists | ✅ |
| Mapping functions | `mapReportRow` handles both | ✅ |
| Section types | V3 section structure supported | ✅ |

**Verdict:** ✅ V3 model is properly supported.

---

### 3.3.C – PDF Pipeline

| Feature | Implementation | Status |
|---------|----------------|--------|
| Browser preview | HTML + CSS + `window.print()` | ✅ |
| Server-side export | Via puppeteer/playwright (if configured) | ✅ |
| Image handling | Base64 or URL references | ✅ |
| Long content | CSS page-break handling | ✅ |

**Verdict:** ✅ PDF pipeline is functional.

---

### 3.3.D – Public Viewer

| Route | Auth | Data Scoping | Status |
|-------|------|--------------|--------|
| `GET /api/reports/public/[publicId]` | None (public) | By `public_id` only | ✅ |
| `POST /api/reports/public/[publicId]/approve` | None (public) | By `public_id` only | ✅ |

**Security:** Uses unguessable UUID `public_id`, no org data exposed.

**Verdict:** ✅ Public viewer is secure.

---

## 3.4 AI Assistants, Vapi, Analytics

### 3.4.A – Per-Organization Vapi Configuration

| Column | Table | Status |
|--------|-------|--------|
| vapi_enabled | organizations | ✅ |
| vapi_api_key | organizations | ✅ |
| vapi_public_api_key | organizations | ✅ |
| vapi_base_url | organizations | ✅ |
| vapi_org_id | organizations | ✅ |

**Key Security:**
- Private API key never sent to client ✅
- Only public key exposed where needed ✅
- Clear error when Vapi not configured ✅

**Verdict:** ✅ Vapi config is properly secured.

---

### 3.4.B – AI Usage Tables & RLS

| Table | RLS | Org Scoping | Status |
|-------|-----|-------------|--------|
| ai_chat_sessions | ✅ org-level | ✅ | ✅ |
| ai_chat_messages | ✅ org-level | ✅ | ✅ |
| ai_call_sessions | ✅ org-level | ✅ | ✅ |
| ai_usage_daily_metrics | ✅ org-level | ✅ | ✅ |
| vapi_calls | ⚠️ user-level | ⚠️ | ⚠️ Needs org-level |

**Note:** `vapi_calls` RLS change is deferred to migration phase.

---

### 3.4.C – AI Logging

**File:** `lib/server/ai-logging.ts`

| Function | Sets org_id | Status |
|----------|-------------|--------|
| recordChatInteraction | ✅ From params | ✅ |
| recordCallSession | ✅ From params | ✅ |

**Verdict:** ✅ AI logging correctly sets organization_id.

---

## 3.5 Widget (Chat Widget + Embed)

### 3.5.A – Config + RLS

| Table | RLS | Status |
|-------|-----|--------|
| chat_widget_configs | ✅ org-level + anon read | ✅ |

**Verdict:** ✅ Widget config RLS is correct.

---

### 3.5.B – API Route Safety

| Route | Auth | Org Resolution | Status |
|-------|------|----------------|--------|
| `GET/PUT /api/chat-widget` | ✅ getUser() | ✅ resolveOrgId() | ✅ |
| `GET /api/public/widget/[publicId]` | None (public) | By public_id | ✅ |
| `GET /api/public/widget/[publicId]/vapi-config` | None (public) | By public_id | ✅ |

**Security:** Public routes only expose safe fields (no private API keys).

**Verdict:** ✅ Widget API routes are secure.

---

### 3.5.C – Embed Flow

| Step | Implementation | Status |
|------|----------------|--------|
| Configure in dashboard | Via `/api/chat-widget` | ✅ |
| Get embed code | Uses `public_id` | ✅ |
| Widget loads config | Via `/api/public/widget/[publicId]` | ✅ |
| Conversations stored | With correct `organization_id` | ✅ |

**Verdict:** ✅ Embed flow is complete and secure.

---

## Summary

### ✅ Verified Working

- Admin route protection (triple-layer)
- Login/logout flows
- Org resolution patterns
- CRM CRUD operations
- Calendar functionality
- Report V3 model
- PDF pipeline
- Public report viewer
- Vapi configuration security
- AI logging
- Widget configuration and embed

### ⚠️ Deferred to Migration Phase

- CRM tables RLS (user-level → org-level)
- Report tables RLS (user-level → org-level)
- vapi_calls RLS (user-level → org-level)
- organization_settings RLS (too permissive)
- organization_members RLS (missing)

### 🔧 Minor Improvements Recommended

1. **Store types:** Update to use `Database` types instead of manual definitions
2. **Self-signup:** Add clear messaging that admin creates accounts
3. **Type exports:** Consider exporting row types from `database.types.ts` for consistency

---

## Next Steps

1. Review this verification document
2. Apply RLS migrations from Phase 1 documentation
3. Proceed to Phase 4 (UX, Onboarding, Observability)
