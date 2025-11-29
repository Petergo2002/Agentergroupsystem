# Phase 4 – UX, Onboarding, Observability Implementation

> **Generated:** 2025-11-28  
> **Status:** Implementation complete

---

## Summary

Phase 4 adds user-facing polish: onboarding for new users, consistent error handling, empty states, and logging infrastructure ready for production monitoring.

---

## 4.1 Onboarding

### Files Created

| File | Purpose |
|------|---------|
| `components/onboarding/onboarding-wizard.tsx` | Multi-step onboarding wizard UI |
| `components/providers/onboarding-provider.tsx` | Provider that shows wizard for first-time users |

### How It Works

1. **Trigger:** When `users.is_first_login = true` or `sessionStorage.show_welcome = true`
2. **Steps:**
   - Welcome screen
   - Organization details (optional)
   - First action choice (contacts, reports, or AI)
   - Complete
3. **Completion:** Sets `is_first_login = false` via `/api/auth/session` PATCH
4. **Skip:** Users can skip at any step

### Integration

The `OnboardingProvider` is integrated into `app/(dashboard)/layout.tsx`:
- Fetches `is_first_login` from user profile on server
- Passes to provider as `initialIsFirstLogin`
- Provider shows wizard overlay when needed

---

## 4.2 Error Handling & Empty States

### Files Created

| File | Purpose |
|------|---------|
| `lib/types/api.ts` | Standard `ApiError` type and error codes |
| `lib/api-utils.ts` | Client-side helpers: `parseApiResponse`, `handleApiError`, `fetchApi` |
| `components/ui/empty-state.tsx` | Reusable empty state component + presets |

### Standard API Error Shape

```typescript
interface ApiError {
  code: string;      // e.g., "UNAUTHORIZED", "VALIDATION_ERROR"
  message: string;   // Human-readable
  details?: unknown; // Optional extra info
}
```

### Error Codes

Defined in `lib/types/api.ts`:
- Auth: `UNAUTHORIZED`, `FORBIDDEN`, `SESSION_EXPIRED`
- Validation: `VALIDATION_ERROR`, `MISSING_REQUIRED_FIELD`, `INVALID_INPUT`
- Resources: `NOT_FOUND`, `ALREADY_EXISTS`, `CONFLICT`
- Server: `INTERNAL_ERROR`, `DATABASE_ERROR`, `EXTERNAL_SERVICE_ERROR`
- Business: `ORGANIZATION_NOT_FOUND`, `VAPI_NOT_CONFIGURED`, `FEATURE_DISABLED`

### Client-Side Usage

```typescript
import { fetchApi, handleApiError } from "@/lib/api-utils";

// Option 1: Simple fetch with auto error handling
const data = await fetchApi<MyType>("/api/endpoint");

// Option 2: Manual error handling
const response = await fetch("/api/endpoint");
const result = await parseApiResponse<MyType>(response);
if ("error" in result && result.error) {
  handleApiError(result.error);
  return;
}
```

### Empty State Components

Pre-configured empty states in `components/ui/empty-state.tsx`:

| Component | Use Case |
|-----------|----------|
| `EmptyContacts` | No contacts in CRM |
| `EmptyReports` | No reports/templates |
| `EmptyAssistants` | Vapi not configured |
| `EmptyWidget` | No chat widget config |
| `EmptyEvents` | No calendar events |
| `EmptyTasks` | No tasks |
| `EmptyAnalytics` | No AI usage data |

Usage:
```tsx
import { EmptyContacts } from "@/components/ui/empty-state";

{contacts.length === 0 ? (
  <EmptyContacts onAction={() => router.push("/customers/new")} />
) : (
  <ContactsList contacts={contacts} />
)}
```

---

## 4.3 Logging & Monitoring

### Files Modified

| File | Change |
|------|--------|
| `lib/logger.ts` | Added ready-to-use Sentry integration (commented) |

### Logger Features

- **Sanitization:** Automatically redacts sensitive data (passwords, tokens, API keys)
- **Structured logging:** JSON format in production, human-readable in development
- **External service ready:** Sentry integration code is pre-written, just uncomment

### Enabling Sentry

1. Install Sentry:
   ```bash
   npm install @sentry/nextjs
   npx @sentry/wizard@latest -i nextjs
   ```

2. Uncomment the Sentry code in `lib/logger.ts` (lines 91-124)

3. Configure alerts in Sentry dashboard:
   - High error rate on auth endpoints
   - High error rate on org creation
   - High error rate on AI/Vapi APIs

### Current Logging

The logger is already used throughout the codebase:
- Admin routes log errors with context
- AI logging captures session/message errors
- Service-role operations log failures

---

## Files Changed Summary

| File | Status |
|------|--------|
| `lib/types/api.ts` | **New** |
| `lib/api-utils.ts` | **New** |
| `components/ui/empty-state.tsx` | **New** |
| `components/onboarding/onboarding-wizard.tsx` | **New** |
| `components/providers/onboarding-provider.tsx` | **New** |
| `app/(dashboard)/layout.tsx` | **Modified** - Added OnboardingProvider |
| `lib/logger.ts` | **Modified** - Added Sentry integration code |

---

## Next Steps

1. **Test onboarding:** Create a new user and verify the wizard appears
2. **Add empty states to pages:** Use the preset components where needed
3. **Enable Sentry:** When ready for production monitoring
4. **Apply RLS migrations:** Final step before launch

---

## Usage Examples

### Adding Empty State to a Page

```tsx
// In a CRM page component
import { EmptyContacts } from "@/components/ui/empty-state";

export default function ContactsPage() {
  const contacts = useContactsStore((s) => s.contacts);
  const router = useRouter();

  if (contacts.length === 0) {
    return (
      <EmptyContacts 
        onAction={() => router.push("/customers/new")} 
      />
    );
  }

  return <ContactsList contacts={contacts} />;
}
```

### Using API Error Handling

```tsx
// In a form submission handler
import { handleApiError, parseApiResponse } from "@/lib/api-utils";

const handleSubmit = async (data: FormData) => {
  const response = await fetch("/api/contacts", {
    method: "POST",
    body: JSON.stringify(data),
  });

  const result = await parseApiResponse(response);
  
  if ("error" in result && result.error) {
    handleApiError(result.error);
    return;
  }

  toast.success("Kontakt skapad!");
  router.push("/customers");
};
```
