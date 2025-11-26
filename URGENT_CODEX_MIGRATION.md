# 🚨 URGENT: Codex MCP Migration Required

## Problem
Admin panel "Configure AI" kraschar med fel: **"Kunde inte hämta organisationen"**

Detta beror på att Vapi-kolumner saknas i `organizations`-tabellen.

## Lösning för Codex (med MCP)

Kör denna SQL-migration via din **Supabase MCP**:

```sql
-- Add Vapi configuration columns to organizations table
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS vapi_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS vapi_api_key TEXT,
ADD COLUMN IF NOT EXISTS vapi_base_url TEXT DEFAULT 'https://api.vapi.ai',
ADD COLUMN IF NOT EXISTS vapi_org_id TEXT,
ADD COLUMN IF NOT EXISTS default_chat_assistant_id TEXT,
ADD COLUMN IF NOT EXISTS default_call_assistant_id TEXT;

-- Add comments for documentation
COMMENT ON COLUMN organizations.vapi_enabled IS 'Whether Vapi integration is enabled for this organization';
COMMENT ON COLUMN organizations.vapi_api_key IS 'Vapi API key for this organization (server-side only, never exposed to client)';
COMMENT ON COLUMN organizations.vapi_base_url IS 'Vapi API base URL (default: https://api.vapi.ai)';
COMMENT ON COLUMN organizations.vapi_org_id IS 'Vapi organization ID if using multi-org Vapi account';
COMMENT ON COLUMN organizations.default_chat_assistant_id IS 'Default Vapi assistant ID for chat widget';
COMMENT ON COLUMN organizations.default_call_assistant_id IS 'Default Vapi assistant ID for outbound calls';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_organizations_vapi_enabled ON organizations(vapi_enabled) WHERE vapi_enabled = true;
```

## Verifiering

Efter migration, kör denna query för att bekräfta:

```sql
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'organizations' 
AND (column_name LIKE 'vapi_%' OR column_name LIKE 'default_%assistant_id');
```

**Förväntat resultat:** 6 rader med kolumner:
- `vapi_enabled` (boolean)
- `vapi_api_key` (text) 
- `vapi_base_url` (text)
- `vapi_org_id` (text)
- `default_chat_assistant_id` (text)
- `default_call_assistant_id` (text)

## Efter migration

1. **Testa admin-flödet:**
   - Gå till http://localhost:3000/admin/customers
   - Klicka ⋯ → "Configure AI" på en organisation
   - Ska nu öppna AI Integration-tabben utan fel

2. **Bekräfta att felet är löst:**
   - Ingen "Kunde inte hämta organisationen" längre
   - VapiConfigManager ska ladda med tomma fält (första gången)

## Om migration failar

Kolla Supabase logs för exakt fel och rapportera tillbaka.

Vanliga problem:
- **Permission denied** → Kontrollera service role key
- **Table doesn't exist** → Kör `CREATE TABLE organizations` först
- **Column already exists** → Ignorera, `IF NOT EXISTS` hanterar detta

---

**Status:** 🔴 BLOCKING - Admin panel fungerar inte utan denna migration
