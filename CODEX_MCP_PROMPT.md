# MCP Prompt för Codex - Vapi White-Label Schema Migration

Hej Codex! Jag behöver din hjälp att köra en Supabase schema migration med MCP. Här är exakt vad du behöver göra:

## 1. Kör Supabase Migration

Använd din **Supabase MCP** för att köra denna migration:

**Fil:** `supabase/migrations/20250118_add_vapi_config_to_organizations.sql`

**SQL att köra:**
```sql
-- Add Vapi configuration columns to organizations table
-- This allows admin to configure Vapi integration per organization without exposing keys to customers

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS vapi_api_key TEXT,
ADD COLUMN IF NOT EXISTS vapi_base_url TEXT DEFAULT 'https://api.vapi.ai',
ADD COLUMN IF NOT EXISTS vapi_org_id TEXT,
ADD COLUMN IF NOT EXISTS default_chat_assistant_id TEXT,
ADD COLUMN IF NOT EXISTS default_call_assistant_id TEXT,
ADD COLUMN IF NOT EXISTS vapi_enabled BOOLEAN DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN organizations.vapi_api_key IS 'Vapi API key for this organization (server-side only, never exposed to client)';
COMMENT ON COLUMN organizations.vapi_base_url IS 'Vapi API base URL (default: https://api.vapi.ai)';
COMMENT ON COLUMN organizations.vapi_org_id IS 'Vapi organization ID if using multi-org Vapi account';
COMMENT ON COLUMN organizations.default_chat_assistant_id IS 'Default Vapi assistant ID for chat widget';
COMMENT ON COLUMN organizations.default_call_assistant_id IS 'Default Vapi assistant ID for outbound calls';
COMMENT ON COLUMN organizations.vapi_enabled IS 'Whether Vapi integration is enabled for this organization';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_organizations_vapi_enabled ON organizations(vapi_enabled) WHERE vapi_enabled = true;

-- RLS Policy: Only super admins can read/write Vapi config
-- Regular users should NEVER see vapi_api_key or other sensitive Vapi fields

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Super admins can manage organization Vapi config" ON organizations;

-- Create policy for super admin access to Vapi config
CREATE POLICY "Super admins can manage organization Vapi config"
ON organizations
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.is_super_admin = true
  )
);
```

## 2. Verifiera Migration

Efter att du kört migrationen, kör dessa queries för att verifiera:

```sql
-- Kontrollera att kolumnerna skapades
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'organizations' 
AND column_name LIKE 'vapi_%' OR column_name LIKE 'default_%assistant_id';

-- Kontrollera index
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'organizations' 
AND indexname = 'idx_organizations_vapi_enabled';

-- Kontrollera RLS policy
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'organizations' 
AND policyname = 'Super admins can manage organization Vapi config';
```

## 3. Testa Funktionalitet (Valfritt)

Om du vill testa att allt funkar:

```sql
-- Testa att lägga till Vapi config för en organisation (som super admin)
UPDATE organizations 
SET 
  vapi_enabled = true,
  vapi_api_key = 'test_key_123',
  vapi_base_url = 'https://api.vapi.ai',
  default_chat_assistant_id = 'agnt_test123'
WHERE id = 'din-org-id-här'  -- Byt ut mot riktig org ID
RETURNING id, name, vapi_enabled, vapi_api_key;
```

## 4. Säkerhetsverifiering

Kontrollera att säkerheten funkar:

```sql
-- Detta ska bara fungera för super admins
-- Vanliga användare ska INTE kunna se vapi_api_key
SELECT id, name, vapi_enabled, vapi_api_key 
FROM organizations 
WHERE vapi_enabled = true;
```

## Vad denna migration gör:

1. **Lägger till Vapi-konfiguration** per organisation i stället för per användare
2. **Gömmer API-nycklar** från kunder - bara admin ser dem
3. **Möjliggör white-label AI** - kunder ser "AI Assistants", inte "Vapi"
4. **Förbättrar säkerhet** - nycklar lagras server-side, inte i frontend
5. **Skapar grund för** admin-panel där superadmin kan konfigurera AI per organisation

## Förväntade resultat:

Efter migrationen ska:
- ✅ `organizations` tabellen ha 6 nya kolumner
- ✅ Index `idx_organizations_vapi_enabled` ska finnas
- ✅ RLS policy ska begränsa åtkomst till super admins
- ✅ Kommentarer ska förklara vad varje kolumn gör

## Om något går fel:

1. **Kolla att tabellen `organizations` finns** först
2. **Kolla att kolumnen `users.is_super_admin` finns** (behövs för RLS policy)
3. **Kör queries en i taget** om hela migrationen failar
4. **Använd `IF NOT EXISTS`** för att undvika konflikter

Tack för hjälpen! 

---

**Sammanfattning för Codex:**
Kör SQL-migrationen ovan med din Supabase MCP för att lägga till Vapi white-label funktionalitet. Detta gör att admin kan konfigurera AI per organisation utan att exponera Vapi för slutkunder.

## MCP-verktyg för Vapi-assistenten (hantverkar-CRM)

Nedan är en översikt över de viktigaste MCP-verktygen som din Vapi-assistent kan använda i **hantverkar-CRM:et**. Använd detta som referens när du skriver system-/tool-prompts för Vapi.

### `create_lead`

- Skapar eller uppdaterar en **lead/kund** i `contacts`-tabellen.
- Används när en person i samtalet visar intresse för en tjänst (t.ex. VVS, el, tak, målning osv.).

**Inputfält:**
- `name` (string, krävs) – kundens fullständiga namn.
- `phone` (string, valfri) – telefonnummer.
- `email` (string, valfri) – e-post.
- `lead_quality` (1 | 2 | 3, krävs)
  - `1` = hög kvalitet / redo att boka (Hot)
  - `2` = medelintresse (Warm)
  - `3` = lågt intresse / behöver uppföljning (Cold)
- `notes` (string, valfri) – fria anteckningar.
- `budget_min` / `budget_max` (number, valfria) – uppskattad budget i SEK.
- `service_type` (string, valfri) – typ av jobb/tjänst, t.ex. `"plumbing"`, `"electrical"`, `"roofing"`, `"painting"`.
- `job_description` (string, valfri) – beskrivning av jobbet/uppdraget.
- `job_address` (string, valfri) – adress/plats där jobbet ska utföras.
- `urgency` (string, valfri) – hur bråttom det är, t.ex. `"emergency"`, `"within_week"`, `"within_month"`.

**När AI:n ska kalla `create_lead`:**
- När en ny potentiell kund beskriver ett jobb/uppdrag.
- När det finns tillräckligt med info för att spara kontakt + grundläggande jobbinformation.
- Om kunden redan finns kan AI fortfarande använda `create_lead` för att spara ett nytt lead-tillfälle (systemet matchar på telefon/e-post där det är implementerat).

### `book_meeting`

- Bokar ett **kalendermöte/platsbesök/samtal** och skapar kontakt/lead om den inte finns.
- Används när kunden vill boka tid för hembesök, offertmöte eller telefonmöte.

**Inputfält:**
- `contact_name` (string, krävs) – namn på personen som bokar.
- `contact_phone` (string, valfri) – telefonnummer (hjälper till att hitta existerande kontakt).
- `contact_email` (string, valfri) – e-post (hjälper till att hitta existerande kontakt).
- `title` (string, krävs) – mötestitel, t.ex. `"Hembesök – badrumsrenovering"`.
- `start_time` (ISO 8601, krävs) – starttid.
- `end_time` (ISO 8601, krävs) – sluttid.
- `description` (string, valfri) – extra anteckningar om mötet.
- `job_id` (string, valfri) – om mötet ska kopplas till ett befintligt jobb.
- `service_type` (string, valfri) – typ av jobb om inget jobb finns ännu.
- `job_address` (string, valfri) – adress för besöket.
- `job_description` (string, valfri) – kort beskrivning av jobbet.
- `event_type` (string, valfri) – `"site_visit" | "meeting" | "call"` (default: `"site_visit"`).

**När AI:n ska kalla `book_meeting`:**
- När kunden uttryckligen vill **boka en tid**.
- När AI själv föreslår en tid och kunden bekräftar.
- AI bör fylla i så mycket som möjligt av `service_type`, `job_description` och `job_address` om det framgår i konversationen.

### Rekommenderat flöde för Vapi-assistenten

1. Identifiera om kunden är ny eller återkommande.
2. Om kunden beskriver ett nytt jobb/uppdrag:
   - Samla in namn, kontaktuppgifter, typ av jobb, adress, ungefärlig tid/budget.
   - Kalla `create_lead` när du har tillräckligt med info.
3. Om kunden vill boka tid:
   - Samla datum/tidsfönster.
   - (Valfritt) använd `check_availability` för att hitta lediga tider.
   - Kalla `book_meeting` med vald tid och beskrivning.
4. Bekräfta alltid för kunden vilken tid som bokats och vad syftet med besöket är.
