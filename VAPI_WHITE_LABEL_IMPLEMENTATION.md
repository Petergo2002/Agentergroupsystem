# Vapi White-Label Implementation

## Overview

This implementation transforms your calendar-CRM from exposing Vapi directly to customers into a white-label AI platform where customers never see "Vapi" - they only see "AI Assistants" powered by your platform.

## Architecture Changes

### Before (Client-Side Vapi Keys)
- Customers entered their own Vapi API keys
- Vapi domains/endpoints visible in browser network tab
- Customer-facing UI mentioned "Vapi" explicitly
- API keys sent from client to server in headers

### After (Server-Side Organization Config)
- **Admin configures Vapi per organization** in admin panel
- **Customers see only "AI Assistants"** - no Vapi branding
- **All Vapi keys stored server-side** - never exposed to clients
- **Clean API responses** without Vapi internals

## Implementation Details

### 1. Database Schema Changes

**New columns in `organizations` table:**
```sql
ALTER TABLE organizations
ADD COLUMN vapi_enabled BOOLEAN DEFAULT false,
ADD COLUMN vapi_api_key TEXT,
ADD COLUMN vapi_base_url TEXT DEFAULT 'https://api.vapi.ai',
ADD COLUMN vapi_org_id TEXT,
ADD COLUMN default_chat_assistant_id TEXT,
ADD COLUMN default_call_assistant_id TEXT;
```

**Security:**
- Only super admins can read/write these fields
- Regular users never see `vapi_api_key` in API responses
- RLS policies enforce access control

### 2. Admin Panel Integration

**New Admin UI: `/admin/organizations/[id]` → "AI Integration" tab**

Features:
- Enable/disable AI integration per organization
- Configure Vapi API key (masked input with show/hide)
- Set base URL (for self-hosted Vapi instances)
- Set organization ID (for multi-org Vapi accounts)
- Configure default assistants for chat/calls
- **Test connection** button to verify Vapi config
- Real-time validation and error handling

**Files:**
- `components/admin/vapi-config-manager.tsx` - Main config UI
- `app/api/admin/organizations/[id]/vapi-config/route.ts` - CRUD API
- `app/api/admin/organizations/[id]/vapi-config/test/route.ts` - Connection test

### 3. Server-Side Vapi Configuration

**New helper: `lib/server/vapi-org-config.ts`**

Key functions:
- `getOrganizationVapiConfig()` - Get config for current user's org
- `getOrganizationVapiConfigById()` - Get config for specific org (admin)
- Automatic Vapi client creation with org credentials
- Proper error handling for missing/invalid configs

### 4. Refactored API Routes

**All Vapi API routes now use server-side org config:**

- `app/api/vapi/assistants/route.ts` - List AI assistants
- `app/api/vapi/analytics/route.ts` - Call analytics  
- `app/api/vapi/chat-analytics/route.ts` - Chat analytics

**Changes:**
- ❌ No longer accept `x-vapi-key` headers from client
- ✅ Read Vapi config from user's organization
- ✅ Return clean data without Vapi internals
- ✅ Proper error messages for unconfigured orgs

### 5. Updated Frontend Hooks

**Simplified hooks (no client-side keys):**

- `useVapiAssistants()` - No longer needs API key parameter
- `useVapiAnalytics()` - Removed baseUrl/key parameters  
- `useVapiChatAnalytics()` - Simplified parameters

**Benefits:**
- Cleaner API - just call `/api/vapi/assistants`
- No key management in frontend code
- Automatic org-scoped data

### 6. Customer-Facing AI Assistants UI

**New page: `/ai-assistants`**

Features:
- List all AI assistants for the organization
- Show assistant status (active/inactive)
- Select default assistant for chat widget
- Clean, branded UI (no "Vapi" mentions)
- Helpful info about AI capabilities

**Navigation:**
- Added to main sidebar under contractor operations
- Uses `IconSparkles` for AI branding

## Security Improvements

### 1. API Key Protection
- **Before:** Keys visible in browser network requests
- **After:** Keys never leave server, stored encrypted in database

### 2. Access Control
- Only super admins can configure Vapi integration
- Regular users can't see or modify API keys
- Organization-scoped data access

### 3. Error Handling
- Generic error messages to customers
- Detailed logs for admins
- No Vapi internals exposed in responses

## Customer Experience

### What Customers See Now:
1. **AI Assistants page** - Clean list of available assistants
2. **Analytics pages** - "AI Analytics" and "Chat Analytics" 
3. **No Vapi branding** - Everything says "AI" or "Assistant"
4. **Seamless integration** - Just works without configuration

### What Customers Don't See:
- Vapi API keys or configuration
- Vapi domains in network requests
- Technical Vapi terminology
- Backend integration details

## Admin Workflow

### Setting Up a New Organization:

1. **Create organization** in admin panel
2. **Go to AI Integration tab**
3. **Enable AI integration**
4. **Enter Vapi API key** (server key with full permissions)
5. **Configure base URL** (if using self-hosted Vapi)
6. **Set organization ID** (if multi-org Vapi account)
7. **Test connection** to verify setup
8. **Set default assistants** for chat/calls
9. **Save configuration**

### Customer gets:
- Immediate access to AI assistants
- Working analytics dashboards  
- Chat widget with AI integration
- No configuration required

## Migration Guide

### For Existing Customers:

If you have customers already using the old Vapi key input:

1. **Collect their Vapi keys** (from old UI or ask them)
2. **Configure in admin panel** per organization
3. **Remove old VapiKeyInput components** from customer UI
4. **Test that analytics still work**
5. **Inform customers** about the improved experience

### Backward Compatibility:

The old `useVapiKey` hook and `VapiKeyInput` components still exist but are not used in the main customer flow. You can:
- Keep them for admin/testing purposes
- Remove them completely if not needed
- Use them as fallback for organizations without server-side config

## Testing

### Admin Testing:
1. Create test organization
2. Configure Vapi integration with valid API key
3. Test connection using "Test" button
4. Verify assistants appear in customer UI
5. Check analytics work without client-side keys

### Customer Testing:
1. Login as regular user in configured organization
2. Visit `/ai-assistants` - should see assistants
3. Visit `/analytics/calls` and `/analytics/chat` - should see data
4. Verify no Vapi branding visible
5. Check network tab - no Vapi keys in requests

## Troubleshooting

### Common Issues:

**"AI integration not configured"**
- Admin needs to enable and configure Vapi in organization settings
- Check that `vapi_enabled = true` and `vapi_api_key` is set

**"Connection test failed"**
- Verify API key has correct permissions (assistants, calls, chat)
- Check base URL is correct
- Ensure organization ID is valid (if using multi-org)

**"No assistants found"**
- Vapi account might not have any assistants created
- Check API key permissions
- Verify organization ID if using multi-org setup

**Analytics not loading**
- Same as above - check Vapi configuration
- Ensure date ranges are valid
- Check server logs for detailed error messages

## Files Created/Modified

### Created:
```
supabase/migrations/20250118_add_vapi_config_to_organizations.sql
components/admin/vapi-config-manager.tsx
app/api/admin/organizations/[id]/vapi-config/route.ts
app/api/admin/organizations/[id]/vapi-config/test/route.ts
lib/server/vapi-org-config.ts
app/(dashboard)/ai-assistants/page.tsx
VAPI_WHITE_LABEL_IMPLEMENTATION.md
```

### Modified:
```
app/admin/organizations/[id]/page.tsx - Added AI Integration tab
app/api/vapi/assistants/route.ts - Server-side org config
app/api/vapi/analytics/route.ts - Server-side org config  
app/api/vapi/chat-analytics/route.ts - Server-side org config
lib/analytics/useVapi.ts - Removed client-side keys
components/app-sidebar.tsx - Added AI Assistants navigation
```

## Next Steps

### Optional Enhancements:

1. **Chat Widget Integration**
   - Update chat widget to use org's default assistant
   - Remove Vapi branding from widget UI

2. **Advanced Assistant Management**
   - Allow customers to switch between available assistants
   - Per-assistant analytics and settings

3. **White-Label Customization**
   - Custom AI assistant names per organization
   - Branded assistant descriptions and capabilities

4. **Usage Monitoring**
   - Track API usage per organization
   - Billing integration based on AI usage

5. **Multi-Provider Support**
   - Support other AI providers alongside Vapi
   - Provider selection per organization

## Support

For questions about this implementation:
1. Check server logs for detailed error messages
2. Verify database schema was applied correctly
3. Test Vapi API keys manually using curl/Postman
4. Check organization configuration in admin panel

The implementation provides a complete white-label AI experience while maintaining all existing functionality and improving security.
