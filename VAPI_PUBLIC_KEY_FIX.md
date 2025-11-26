# Vapi Public Key Fix - Implementerat

## ✅ Vad har fixats

### 1. Säkerhet - Maskerade API-nycklar
**Problem:** Hela `vapi_api_key` visades i adminpanelen när du klickade "Hantera".

**Lösning:**
- ✅ **Backend API** (`/api/admin/vapi/assistants`): Tar bort `vapi_api_key` och `vapi_public_api_key` från response, returnerar endast:
  - `has_vapi_key: boolean`
  - `vapi_key_last4: string` (sista 4 tecken)
  - `has_vapi_public_key: boolean`
  - `vapi_public_key_last4: string` (sista 4 tecken)

- ✅ **Admin UI** (`app/admin/ai-assistants/page.tsx`): 
  - Visar nu: `✓ Nyckel sparad (slutar på: XXXX)` istället för hela nyckeln
  - Gäller både server-nyckel och public key

**Resultat:** Ingen full API-nyckel exponeras någonsin till klienten.

### 2. Debug-verktyg
**Ny fil:** `/api/admin/debug/vapi-config`

Detta är en superadmin-only API som visar:
- Vilka organisationer som har Vapi aktiverat
- Om nycklar finns (utan att visa hela nyckeln)
- Längd och förhandsgranskning av nycklar
- All Vapi-konfiguration

**Användning:**
```bash
# Öppna i browser (måste vara inloggad som superadmin)
https://din-app.com/api/admin/debug/vapi-config
```

## 🧪 Testplan

### Steg 1: Verifiera säkerheten

1. **Öppna Admin → AI-assistenter**
2. **Klicka "Hantera" på en organisation**
3. **Kontrollera:**
   - ✅ Ser du `✓ Nyckel sparad (slutar på: XXXX)` istället för hela nyckeln?
   - ✅ Öppna DevTools → Network tab
   - ✅ Hitta requesten till `/api/admin/vapi/assistants`
   - ✅ I Response: Finns det någon `vapi_api_key` eller `vapi_public_api_key` med full nyckel? (Ska INTE finnas!)
   - ✅ Finns det `vapi_key_last4` och `vapi_public_key_last4`? (Ska finnas)

**Förväntat resultat:** Ingen full nyckel syns någonstans i UI eller Network-responses.

### Steg 2: Testa att spara public key

1. **I Admin → AI-assistenter → Hantera**
2. **Fyll i båda fälten:**
   - Server API-nyckel: Din `vk_...` nyckel från Vapi
   - Public API-nyckel: Din `pk_...` nyckel från Vapi
3. **Klicka "Uppdatera"**
4. **Kontrollera:**
   - ✅ Får du success-meddelande?
   - ✅ Öppna DevTools → Network → hitta PATCH-requesten
   - ✅ I Request Payload: Finns `vapi_public_api_key` med din nyckel?
   - ✅ I Response: Finns `vapi_public_api_key` med maskerad version (`****XXXX`)?

5. **Stäng och öppna dialogen igen**
6. **Kontrollera:**
   - ✅ Ser du `✓ Nyckel sparad (slutar på: XXXX)` för båda nycklarna?

**Förväntat resultat:** Public key sparas och visas maskerad när du öppnar dialogen igen.

### Steg 3: Verifiera i databasen (via debug-API)

1. **Öppna i browser:**
   ```
   http://localhost:3000/api/admin/debug/vapi-config
   ```

2. **Kontrollera JSON-responsen:**
   ```json
   {
     "organizations": [
       {
         "name": "Din Organisation",
         "vapi_enabled": true,
         "vapi_api_key": {
           "exists": true,
           "length": 64,
           "preview": "vk_live_12...XXXX",
           "starts_with": "vk_"
         },
         "vapi_public_api_key": {
           "exists": true,
           "length": 64,
           "preview": "pk_live_12...XXXX",
           "starts_with": "pk_"
         }
       }
     ]
   }
   ```

3. **Verifiera:**
   - ✅ `vapi_api_key.exists` = true
   - ✅ `vapi_public_api_key.exists` = true
   - ✅ `starts_with` visar rätt prefix (`vk_` och `pk_`)

**Förväntat resultat:** Båda nycklarna finns i databasen.

### Steg 4: Testa röstfunktionen

1. **Logga in som vanlig användare** (inte admin)
2. **Gå till AI-assistenter** (user dashboard)
3. **Klicka "Ring" på en assistent**
4. **Kontrollera:**
   - ✅ Får du fortfarande "Failed to load organization config"?
   - ✅ Eller öppnas röstdialogen?

5. **Om det fortfarande inte fungerar:**
   - Öppna DevTools → Console
   - Kolla efter felmeddelanden
   - Öppna Network tab → hitta `/api/user/vapi-web-config`
   - Vad säger Response?

**Förväntat resultat:** 
- Om public key är korrekt sparad: Röstdialogen öppnas
- Om inte: Tydligt felmeddelande om vad som saknas

## 🔍 Felsökning

### Problem: "Failed to load organization config"

**Möjliga orsaker:**

1. **Användaren tillhör ingen organisation**
   ```sql
   -- Kolla i Supabase SQL Editor
   SELECT id, email, organization_id 
   FROM users 
   WHERE email = 'din-email@example.com';
   ```
   - Om `organization_id` är NULL → användaren måste läggas till i en organisation

2. **Organisationen har inte Vapi aktiverat**
   ```sql
   SELECT id, name, vapi_enabled, vapi_api_key IS NOT NULL as has_key
   FROM organizations
   WHERE id = 'DIN_ORG_ID';
   ```
   - Om `vapi_enabled` = false → aktivera Vapi i admin-panelen
   - Om `has_key` = false → lägg till API-nyckel

3. **Public key saknas**
   ```sql
   SELECT 
     id, 
     name, 
     vapi_public_api_key IS NOT NULL as has_public_key,
     LEFT(vapi_public_api_key, 10) as key_preview
   FROM organizations
   WHERE id = 'DIN_ORG_ID';
   ```
   - Om `has_public_key` = false → lägg till public key i admin-panelen

4. **Kolumnen finns inte i databasen**
   ```sql
   SELECT column_name 
   FROM information_schema.columns 
   WHERE table_name = 'organizations' 
   AND column_name = 'vapi_public_api_key';
   ```
   - Om inga resultat → kör migration:
     ```sql
     ALTER TABLE organizations
     ADD COLUMN IF NOT EXISTS vapi_public_api_key TEXT;
     ```

### Problem: Public key sparas inte

**Debug-steg:**

1. **Kolla server-loggar när du sparar**
   - Leta efter: `🔧 VAPI Config Update Debug:`
   - Kontrollera: `hasPublicKey: true` och `publicKeyLength: > 0`

2. **Kolla Network tab i DevTools**
   - PATCH request body ska innehålla `vapi_public_api_key`
   - Response ska visa maskerad version

3. **Kolla validation**
   - Public key måste vara minst 10 tecken lång
   - Får du validation-fel i response?

### Problem: Nyckeln syns fortfarande i UI

**Kontrollera:**
1. Har du refreshat sidan efter ändringarna?
2. Kolla att du kör senaste versionen av koden
3. Öppna DevTools → Application → Clear site data
4. Ladda om sidan

## 📝 Sammanfattning av ändringar

### Filer som ändrats:

1. **`app/api/admin/vapi/assistants/route.ts`**
   - Tar bort full `vapi_api_key` och `vapi_public_api_key` från response
   - Returnerar endast maskerad info

2. **`app/admin/ai-assistants/page.tsx`**
   - Visar `✓ Nyckel sparad (slutar på: XXXX)` istället för hela nyckeln
   - Gäller både server-nyckel och public key

3. **`app/api/admin/debug/vapi-config/route.ts`** (NY)
   - Debug-API för superadmin
   - Visar Vapi-konfiguration för alla organisationer

### Filer som redan var korrekta:

- `app/api/admin/organizations/[id]/vapi-config/route.ts` - Sparar public key korrekt
- `app/api/user/vapi-web-config/route.ts` - Returnerar public key till användare
- `lib/server/vapi-org-config.ts` - Hämtar org-konfig korrekt

## ✅ Checklista

- [x] API-nycklar maskeras i admin UI
- [x] API-nycklar exponeras inte i API-responses
- [x] Debug-verktyg skapat för att verifiera databas
- [ ] Testa att spara public key
- [ ] Verifiera att public key finns i databas
- [ ] Testa röstfunktion från user dashboard
- [ ] Bekräfta att allt fungerar end-to-end

## 🚀 Nästa steg

1. **Testa enligt testplanen ovan**
2. **Rapportera tillbaka:**
   - Fungerar säkerheten? (Syns inga fulla nycklar?)
   - Sparas public key korrekt?
   - Fungerar rösttest nu?
3. **Om problem kvarstår:**
   - Skicka screenshot av debug-API response
   - Skicka server-loggar när du sparar
   - Skicka Network tab från DevTools

Lycka till! 🎉
