# Service-Role Usage Inventory

> **Generated:** 2025-11-28  
> **Status:** Phase 2.1 of Pre-Launch Hardening  
> **Purpose:** Document all service-role client usages and their security posture

---

## Overview

The service-role client (`createServiceClient()` from `lib/supabase/service.ts`) bypasses RLS and should only be used when:

1. The operation cannot be done via normal RLS (e.g., admin creating users in other orgs)
2. The caller has been authenticated AND authorized (super-admin or verified org membership)
3. Public endpoints that need to read specific public data (e.g., public reports by `public_id`)

---

## Service-Role Client Definition

**File:** `lib/supabase/service.ts`

```typescript
export function createServiceClient() {
  // Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
  // Throws if missing - good!
}
```

**Status:** ✅ Already fails fast if env vars are missing.

---

## Inventory Table

| Route/File | Function | Tables Touched | Operations | Auth Check | AuthZ Check | Status |
|------------|----------|----------------|------------|------------|-------------|--------|
| `app/api/admin/organizations/route.ts` | POST | organizations, users, organization_members, feature_flags | insert, update | ✅ getUser() | ✅ is_super_admin | ✅ OK |
| `app/api/admin/organizations/route.ts` | GET | organizations, users, organization_members | select | ✅ getUser() | ✅ is_super_admin | ✅ OK |
| `app/api/admin/users/super-admin/route.ts` | PATCH | users | update | ✅ getUser() | ✅ is_super_admin | ✅ OK |
| `app/api/admin/organizations/[id]/route.ts` | various | organizations | select, update, delete | ✅ getUser() | ✅ is_super_admin | ✅ OK |
| `app/api/admin/customers/route.ts` | various | contacts | select, insert, update | ✅ getUser() | ✅ is_super_admin | ✅ OK |
| `app/api/admin/vapi/assistants/route.ts` | GET | organizations | select | ✅ getUser() | ✅ is_super_admin | ✅ OK |
| `app/api/chat-widget/route.ts` | GET, PUT | users, organization_members, organizations, chat_widget_configs | select, insert, update | ✅ getUser() | ✅ org membership verified | ✅ OK |
| `app/api/reports/public/[publicId]/route.ts` | GET | reports, report_templates | select | ❌ None (public) | ❌ None (public) | ⚠️ Intentional |
| `app/api/reports/public/[publicId]/approve/route.ts` | POST | reports | update | ❌ None (public) | ❌ None (public) | ⚠️ Intentional |
| `app/api/public/widget/[publicId]/route.ts` | GET | chat_widget_configs | select | ❌ None (public) | ❌ None (public) | ⚠️ Intentional |
| `app/api/public/widget/[publicId]/vapi-config/route.ts` | GET | chat_widget_configs, organizations | select | ❌ None (public) | ❌ None (public) | ⚠️ Intentional |
| `app/api/health/route.ts` | GET | users | select (limit 1) | ❌ None | ❌ None | ⚠️ Review |
| `app/api/user/assistants/route.ts` | GET | organizations | select | ✅ getUser() | ✅ org membership | ✅ OK |
| `app/api/user/widget-config/route.ts` | various | chat_widget_configs | select, insert, update | ✅ getUser() | ✅ org membership | ✅ OK |
| `app/api/widget/chat/route.ts` | POST | ai_chat_sessions, ai_chat_messages | insert | ⚠️ Partial | ⚠️ org_id from widget | ⚠️ Review |
| `app/api/widget/send/route.ts` | POST | ai_chat_sessions, ai_chat_messages | insert | ⚠️ Partial | ⚠️ org_id from widget | ⚠️ Review |
| `app/api/integrations/n8n/route.ts` | various | contacts, events | insert, update | ⚠️ API key | ⚠️ org from key | ⚠️ Review |
| `lib/server/ai-logging.ts` | recordChatInteraction, recordCallSession | ai_chat_sessions, ai_chat_messages, ai_call_sessions, ai_usage_daily_metrics | insert, update | ❌ None (server-side) | ✅ org_id passed by caller | ⚠️ Trust caller |
| `lib/server/vapi-org-config.ts` | getOrganizationVapiConfig | users, organizations | select | ✅ getUser() | ✅ org membership | ✅ OK |
| `lib/server/vapi-org-config.ts` | getOrganizationVapiConfigById | users, organizations | select | ✅ getUser() | ✅ is_super_admin | ✅ OK |

---

## Analysis by Category

### ✅ Properly Secured (Admin Routes)

These routes correctly:
1. Authenticate via `supabase.auth.getUser()`
2. Check `is_super_admin` before using service client
3. Use service client only for cross-org operations

**Routes:**
- `app/api/admin/organizations/*`
- `app/api/admin/users/*`
- `app/api/admin/customers/*`
- `app/api/admin/vapi/*`

### ✅ Properly Secured (User Routes with Org Verification)

These routes correctly:
1. Authenticate via `supabase.auth.getUser()`
2. Verify org membership before operations
3. Use service client to bypass RLS but scope to verified org

**Routes:**
- `app/api/chat-widget/route.ts` (via `resolveOrgId()`)
- `app/api/user/assistants/route.ts`
- `app/api/user/widget-config/route.ts`
- `lib/server/vapi-org-config.ts`

### ⚠️ Intentionally Public (No Auth)

These routes are designed for public/anonymous access:

| Route | Purpose | Risk Mitigation |
|-------|---------|-----------------|
| `app/api/reports/public/[publicId]/route.ts` | View shared reports | Only returns report with matching `public_id` (unguessable UUID) |
| `app/api/reports/public/[publicId]/approve/route.ts` | Customer approves report | Only updates specific report by `public_id` |
| `app/api/public/widget/[publicId]/route.ts` | Embed widget config | Only returns enabled configs by `public_id` |
| `app/api/public/widget/[publicId]/vapi-config/route.ts` | Widget Vapi config | Returns only public key, not private API key |

**Recommendation:** These are acceptable as long as:
- `public_id` is a cryptographically random UUID (not sequential)
- No sensitive data (API keys, internal IDs) is exposed

### ⚠️ Needs Review

| Route | Issue | Recommendation |
|-------|-------|----------------|
| `app/api/health/route.ts` | Uses service client to query `users` table | Change to a simpler check that doesn't need service role |
| `app/api/widget/chat/route.ts` | Trusts `org_id` from widget config lookup | Acceptable - org_id comes from DB, not client |
| `app/api/widget/send/route.ts` | Same as above | Acceptable - org_id comes from DB, not client |
| `app/api/integrations/n8n/route.ts` | Uses API key auth | Verify API key → org mapping is secure |
| `lib/server/ai-logging.ts` | No auth, trusts caller | Acceptable - only called from server-side code |

---

## Recommended Changes

### 1. Health Route Improvement

**Current:** Uses service client to query `users` table.  
**Issue:** Unnecessary use of service role for a health check.  
**Fix:** Use a simpler check or query a less sensitive table.

```typescript
// Instead of querying users table, use organization_settings or a simple RPC
const { error } = await supabase
  .from("organization_settings")
  .select("id")
  .limit(1);
```

### 2. Add Helper Functions

Create `lib/server/auth-helpers.ts` with:

```typescript
export async function assertSuperAdmin(supabase: SupabaseClient): Promise<{
  user: User;
  error?: never;
} | {
  user?: never;
  error: NextResponse;
}> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  
  const { data: userData } = await supabase
    .from("users")
    .select("is_super_admin")
    .eq("id", user.id)
    .single();
    
  if (!userData?.is_super_admin) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  
  return { user };
}

export async function getUserOrganizationId(
  serviceClient: SupabaseClient,
  userId: string
): Promise<string | null> {
  // Check users.organization_id first
  const { data: profile } = await serviceClient
    .from("users")
    .select("organization_id")
    .eq("id", userId)
    .single();
    
  if (profile?.organization_id) return profile.organization_id;
  
  // Fallback to organization_members
  const { data: membership } = await serviceClient
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", userId)
    .limit(1)
    .single();
    
  return membership?.organization_id ?? null;
}
```

---

## Summary

| Category | Count | Status |
|----------|-------|--------|
| Admin routes (super-admin protected) | 8+ | ✅ OK |
| User routes (org-membership protected) | 5+ | ✅ OK |
| Public routes (intentionally open) | 4 | ⚠️ Acceptable |
| Server-side utilities | 2 | ⚠️ Trust caller |
| Needs minor fix | 1 (health) | 🔧 Fix |

**Overall Assessment:** Service-role usage is generally well-protected. The main patterns are correct:
- Admin routes check `is_super_admin`
- User routes verify org membership
- Public routes only expose non-sensitive data via unguessable IDs
