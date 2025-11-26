# Debug Guide: Vapi Public Key Problem

## Problem
Public key sparas inte när du fyller i den i admin-panelen, och användare får felmeddelandet "Failed to load organization config" när de försöker använda rösttest.

## Debug-steg

### 1. Verifiera att kolumnen finns i databasen

Kör i Supabase SQL Editor:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'organizations' 
AND column_name LIKE '%vapi%'
ORDER BY column_name;
```

**Förväntat resultat:** Du ska se `vapi_public_api_key` i listan.

### 2. Kolla nuvarande värden

Hitta din organisation ID först (kör i admin-panelen eller SQL):
```sql
SELECT id, name FROM organizations ORDER BY name;
```

Sedan kolla Vapi-konfigurationen för din organisation:
```sql
-- Byt ut 'DIN_ORG_ID' med din faktiska organization ID
SELECT 
  id,
  name,
  vapi_enabled,
  vapi_api_key IS NOT NULL as has_private_key,
  vapi_public_api_key IS NOT NULL as has_public_key,
  LEFT(vapi_api_key, 15) as private_key_preview,
  LEFT(vapi_public_api_key, 15) as public_key_preview,
  vapi_base_url,
  vapi_org_id
FROM organizations
WHERE id = 'DIN_ORG_ID';
```

**Vad du ska leta efter:**
- `vapi_enabled` ska vara `true`
- `has_private_key` ska vara `true`
- `has_public_key` ska vara `true` (om du har fyllt i den)
- `private_key_preview` ska börja med `vk_` eller liknande
- `public_key_preview` ska börja med `pk_` eller liknande

### 3. Testa att spara public key manuellt

Om kolumnen finns men värdet inte sparas via UI, testa att spara direkt i SQL:
```sql
-- Byt ut 'DIN_ORG_ID' och 'DIN_PUBLIC_KEY'
UPDATE organizations
SET vapi_public_api_key = 'DIN_PUBLIC_KEY'
WHERE id = 'DIN_ORG_ID';

-- Verifiera att det sparades
SELECT 
  id, 
  name, 
  LEFT(vapi_public_api_key, 15) as public_key_preview
FROM organizations
WHERE id = 'DIN_ORG_ID';
```

Om detta fungerar men UI inte gör det, är problemet i frontend/backend-koden.

### 4. Kolla server-loggar

Jag har nu lagt till omfattande logging. När du försöker spara public key via admin-panelen:

1. Öppna din terminal där Next.js körs
2. Klicka "Spara" i admin-panelen
3. Leta efter dessa loggar:

**I admin API (`/api/admin/organizations/[id]/vapi-config`):**
```
🔧 VAPI Config Update Debug: {
  orgId: '...',
  receivedData: {
    vapi_enabled: true,
    hasPrivateKey: true/false,
    hasPublicKey: true/false,  <-- Ska vara true om du fyllt i public key
    privateKeyLength: ...,
    publicKeyLength: ...  <-- Ska vara > 0
  },
  updateData: { ... }
}
```

```
✅ VAPI Config Updated Successfully: {
  orgId: '...',
  orgName: '...',
  hasPublicKey: true/false,  <-- Ska vara true efter save
  publicKeyPreview: 'pk_...'  <-- Ska visa början av din key
}
```

**I user API (`/api/user/vapi-web-config`):**
```
🔍 Vapi Web Config Request: {
  userId: '...',
  organizationId: '...',
  hasConfig: true/false,
  error: null/string
}
```

```
📋 Config details: {
  vapi_enabled: true/false,
  hasPrivateKey: true/false,
  hasPublicKey: true/false,  <-- Ska vara true
  publicKeyPreview: 'pk_...'
}
```

### 5. Vanliga problem och lösningar

#### Problem: Kolumnen finns inte
**Lösning:** Kör migration:
```sql
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS vapi_public_api_key TEXT;
```

#### Problem: Public key sparas som NULL trots att du fyller i den
**Möjliga orsaker:**
1. Validation-fel - kolla att din public key är minst 10 tecken lång
2. Frontend skickar inte värdet - kolla Network tab i browser DevTools
3. Backend tar inte emot värdet - kolla server-loggar

**Debug:**
- Öppna Browser DevTools → Network tab
- Spara public key i admin-panelen
- Hitta PATCH-requesten till `/api/admin/organizations/[id]/vapi-config`
- Kolla Request Payload - ska innehålla `vapi_public_api_key`

#### Problem: "Failed to load organization config"
**Möjliga orsaker:**
1. Användaren tillhör ingen organisation
2. Organisationen har ingen Vapi-config
3. Kolumnen `vapi_public_api_key` finns inte i databasen

**Debug:**
- Kolla server-loggar när användaren laddar AI-assistenter-sidan
- Leta efter `🔍 Vapi Web Config Request` och `❌` felmeddelanden

#### Problem: Public key sparas men rösttest fungerar inte
**Möjliga orsaker:**
1. Fel public key (använd rätt key från Vapi dashboard)
2. Public key är inte aktiverad i Vapi
3. JavaScript-fel i frontend

**Debug:**
- Öppna Browser Console
- Klicka "Ring" på en assistent
- Leta efter JavaScript-fel
- Kolla att Vapi Web SDK initieras korrekt

## Snabb-test

### Test 1: Verifiera databas-struktur
```sql
-- Ska returnera minst 7 rader (alla vapi_* kolumner)
SELECT COUNT(*) as vapi_columns
FROM information_schema.columns 
WHERE table_name = 'organizations' 
AND column_name LIKE 'vapi_%';
```

### Test 2: Verifiera att du kan spara
```sql
-- Testa att uppdatera (byt ut ID)
UPDATE organizations
SET vapi_public_api_key = 'test_key_123'
WHERE id = 'DIN_ORG_ID'
RETURNING id, vapi_public_api_key;
```

### Test 3: Verifiera att du kan läsa
```sql
-- Ska visa din test-key
SELECT id, name, vapi_public_api_key
FROM organizations
WHERE vapi_public_api_key IS NOT NULL;
```

## Nästa steg

1. **Kör SQL-queries ovan** för att verifiera databas-struktur
2. **Försök spara public key igen** i admin-panelen
3. **Kolla server-loggar** för debug-meddelanden
4. **Rapportera tillbaka** vad du ser i loggarna

Jag väntar på din feedback!
