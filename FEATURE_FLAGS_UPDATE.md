# Feature Flags Update - Campaigns & AI Assistants

## Summary
Added feature flags for **Campaigns** and **AI Assistants** sections to the admin portal, allowing admins to toggle visibility and access for these features per organization.

## Changes Made

### 1. Database Migration (Supabase)
- **Migration**: `add_campaigns_enabled_feature_flag`
- **Added column**: `campaigns_enabled` (boolean, default: `true`)
- **Status**: ✅ Successfully applied to production database
- All existing organizations automatically have `campaigns_enabled = true`

### 2. TypeScript Types Updated
**File**: `/lib/feature-flags/types.ts`

Added to `FeatureFlags` interface:
```typescript
campaigns_enabled: boolean;
ai_assistant_enabled: boolean;
```

Updated `DEFAULT_FEATURE_FLAGS`:
```typescript
campaigns_enabled: true,
ai_assistant_enabled: false,
```

### 3. Admin Portal UI Updated
**File**: `/components/admin/feature-flags-manager.tsx`

Added to "Sektioner" group:
- **Kampanjer** (`campaigns_enabled`)
  - Label: "Kampanjer"
  - Description: "Marknadsföring och kampanjhantering"
  
- **AI-assistenter** (`ai_assistant_enabled`)
  - Label: "AI-assistenter"
  - Description: "AI-drivna assistenter och automation"

### 4. Sidebar Navigation Updated
**File**: `/components/app-sidebar.tsx`

- Added `IconTarget` import for Campaigns icon
- Added `flag: "campaigns_enabled"` to Kampanjer navigation item
- Added `flag: "ai_assistant_enabled"` to AI-assistenter navigation item

## Feature Flag Status

### ✅ Complete Coverage - All Sections Now Have Flags

| Section | URL | Flag | Default | Status |
|---------|-----|------|---------|--------|
| Översikt | `/` | - | Always visible | ✅ |
| Leads | `/leads` | `leads_enabled` | `true` | ✅ |
| Kunder | `/customers` | `customers_enabled` | `true` | ✅ |
| Jobb | `/jobs` | `jobs_enabled` | `true` | ✅ |
| Offert | `/quotes` | `quotes_enabled` | `true` | ✅ |
| Fakturor | `/invoices` | `invoices_enabled` | `true` | ✅ |
| Kalender | `/calendar` | `calendar_enabled` | `true` | ✅ |
| Uppgifter | `/tasks` | `tasks_enabled` | `true` | ✅ |
| Rapporter | `/rapport` | `analytics_enabled` | `false` | ✅ |
| **Kampanjer** | `/campaigns` | `campaigns_enabled` | `true` | ✅ NEW |
| **AI-assistenter** | `/ai-assistants` | `ai_assistant_enabled` | `false` | ✅ NEW |

### Integration Flags (Existing)
- `voice_calls_enabled` (default: `false`)
- `email_integration_enabled` (default: `false`)
- `sms_integration_enabled` (default: `false`)

### Branding Flags (Existing)
- `api_access_enabled` (default: `false`)
- `webhooks_enabled` (default: `false`)
- `custom_branding_enabled` (default: `false`)
- `white_label_enabled` (default: `false`)

## How to Use

### Admin Portal
1. Navigate to `/admin/organizations/[id]`
2. Click on the "Features" tab
3. Toggle "Kampanjer" and "AI-assistenter" on/off under the "Sektioner" group
4. Click "Save Changes"

### Effect on Users
- When **disabled**: The section disappears from the sidebar navigation
- When **enabled**: The section appears in the sidebar and is accessible

## Database Schema

```sql
-- feature_flags table now includes:
CREATE TABLE feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  
  -- Main sections
  calendar_enabled boolean NOT NULL DEFAULT true,
  customers_enabled boolean NOT NULL DEFAULT true,
  leads_enabled boolean NOT NULL DEFAULT true,
  jobs_enabled boolean NOT NULL DEFAULT true,
  quotes_enabled boolean NOT NULL DEFAULT true,
  invoices_enabled boolean NOT NULL DEFAULT true,
  tasks_enabled boolean NOT NULL DEFAULT true,
  analytics_enabled boolean NOT NULL DEFAULT false,
  campaigns_enabled boolean NOT NULL DEFAULT true,      -- NEW
  ai_assistant_enabled boolean NOT NULL DEFAULT false,  -- NEW
  
  -- Integrations
  voice_calls_enabled boolean NOT NULL DEFAULT false,
  email_integration_enabled boolean NOT NULL DEFAULT false,
  sms_integration_enabled boolean NOT NULL DEFAULT false,
  
  -- Branding & API
  api_access_enabled boolean NOT NULL DEFAULT false,
  webhooks_enabled boolean NOT NULL DEFAULT false,
  custom_branding_enabled boolean NOT NULL DEFAULT false,
  white_label_enabled boolean NOT NULL DEFAULT false,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

## Testing Checklist

- [x] Database migration applied successfully
- [x] TypeScript types updated
- [x] Admin UI shows new toggles
- [x] Sidebar respects feature flags
- [x] Existing organizations have correct defaults
- [x] Admin API route updated to handle new flags
- [x] Feature flags API route uses updated defaults
- [ ] Test toggling campaigns on/off in admin portal
- [ ] Test toggling AI assistants on/off in admin portal
- [ ] Verify sidebar updates without page refresh
- [ ] Test with multiple organizations

## Notes

- All existing organizations automatically have `campaigns_enabled = true` and `ai_assistant_enabled = false`
- The feature flags are checked client-side in the sidebar navigation
- Changes take effect immediately after saving in the admin portal
- The overview page (`/`) remains always visible (no feature flag)
