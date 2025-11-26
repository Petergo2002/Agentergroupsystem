# Web-baserad Rösttest Implementation

## Översikt
Implementerat möjlighet för användare att testa AI-assistenter med både chat och röst direkt i webbläsaren på `/ai-assistants` sidan.

## Vad har implementerats

### 1. Admin-panel uppdateringar
**Fil:** `app/admin/ai-assistants/page.tsx`

- Lagt till input-fält för **Vapi Public API Key** i "Aktivera VAPI"-dialogen
- Uppdaterat state och hantering för att spara både privat och public key
- Tydliga etiketter: "VAPI API-nyckel (Server)" och "VAPI Public API-nyckel (Valfritt)"

**Användning:**
1. Gå till Admin → AI-assistenter
2. Klicka "Aktivera VAPI" eller "Hantera" för en organisation
3. Fyll i både server-nyckel (börjar med `vk_...`) och public key (börjar med `pk_...`)
4. Spara konfigurationen

### 2. Ny API-rutt för web-konfig
**Fil:** `app/api/user/vapi-web-config/route.ts`

- Ny autentiserad endpoint: `GET /api/user/vapi-web-config`
- Returnerar endast public key och base URL (aldrig privat nyckel)
- Validerar att Vapi är aktiverat och public key är konfigurerad
- Ger tydliga felmeddelanden om konfiguration saknas

**Response:**
```json
{
  "publicKey": "pk_live_...",
  "baseUrl": "https://api.vapi.ai",
  "defaultCallAssistantId": "agnt_...",
  "organizationId": "org_..."
}
```

### 3. Vapi Web SDK integration
**Paket:** `@vapi-ai/web` (installerat)

**Fil:** `app/(dashboard)/ai-assistants/page.tsx`

Nya funktioner:
- `loadVapiWebConfig()` - Hämtar public key från backend
- `initializeVapiClient()` - Skapar Vapi-klient med event-lyssnare
- `openVoiceDialog()` - Öppnar rösttest-dialog
- `closeVoiceDialog()` - Stänger dialog och avslutar samtal
- `startVoiceCall()` - Startar röstsamtal med assistenten
- `stopVoiceCall()` - Avslutar pågående samtal

Event-hantering:
- `call-start` - Uppdaterar status och visar toast
- `call-end` - Markerar samtal som avslutat
- `message` (transcript) - Lägger till transkript i realtid
- `error` - Hanterar fel och visar meddelande

### 4. Uppdaterat UI på /ai-assistants

**Två knappar per assistent:**
- **"Chatta"** - Öppnar befintlig chat-dialog (text)
- **"Ring"** - Öppnar ny rösttest-dialog (web-röst)

**Rösttest-dialog innehåller:**
- Status-indikator (idle/connecting/in_progress/ended)
- Live transkript av konversationen
- "Starta rösttest" / "Avsluta samtal" knappar
- Tydlig info om mikrofonåtkomst
- Felhantering om public key saknas

**Visuella indikatorer:**
- 🎤 Mikrofon-ikon med animation när samtal pågår
- Färgkodade transkript (blå för användare, vit för assistent)
- Loader-animation vid anslutning
- Disabled state på "Ring"-knapp om public key saknas

## Säkerhet

- ✅ Public key exponeras endast via autentiserad API-rutt
- ✅ Privat server-nyckel exponeras aldrig till klienten
- ✅ Användare kan endast testa assistenter från sin egen organisation
- ✅ Alla API-anrop kräver autentisering

## Användningsflöde

### För Administratörer:
1. Gå till Admin → AI-assistenter
2. Aktivera VAPI för en organisation
3. Fyll i både server-nyckel OCH public key
4. Spara konfigurationen

### För Användare:
1. Gå till AI-assistenter (i sidomenyn)
2. Se lista över tillgängliga assistenter
3. Klicka "Chatta" för textbaserad test
4. Klicka "Ring" för röstbaserad test
5. I röstdialogen:
   - Klicka "Starta rösttest"
   - Ge mikrofonåtkomst när browsern frågar
   - Prata med assistenten
   - Se live-transkript
   - Klicka "Avsluta samtal" när klar

## Tekniska detaljer

### State-hantering:
```typescript
// Voice-specifik state
const [voiceDialogOpen, setVoiceDialogOpen] = useState(false);
const [voiceAssistant, setVoiceAssistant] = useState<VapiAssistant | null>(null);
const [vapiWebConfig, setVapiWebConfig] = useState<{publicKey: string; baseUrl: string} | null>(null);
const [vapiWebConfigError, setVapiWebConfigError] = useState<string | null>(null);
const [callStatus, setCallStatus] = useState<"idle" | "connecting" | "in_progress" | "ended">("idle");
const [voiceTranscripts, setVoiceTranscripts] = useState<Array<{role: "user" | "assistant"; text: string}>>([]);
const vapiClientRef = useRef<any>(null);
```

### Vapi Web SDK användning:
```typescript
// Initiera klient
const vapi = new Vapi(publicKey);

// Starta samtal
await vapi.start(assistantId);

// Avsluta samtal
vapi.stop();

// Lyssna på events
vapi.on("call-start", () => {...});
vapi.on("call-end", () => {...});
vapi.on("message", (message) => {...});
vapi.on("error", (error) => {...});
```

## Felsökning

### "Rösttest inte tillgängligt"
- Kontrollera att public key är konfigurerad i admin-panelen
- Verifiera att Vapi är aktiverat för organisationen
- Kolla att public key börjar med `pk_`

### "Kunde inte starta röstsamtal"
- Kontrollera att mikrofon-permissions är givna i browsern
- Verifiera att assistant ID är korrekt
- Kolla browser console för detaljerade felmeddelanden

### Ingen transkript visas
- Kontrollera att assistenten är konfigurerad för transkription i Vapi
- Verifiera att mikrofonen fungerar
- Kolla att ljud faktiskt spelas in (mikrofon-ikon ska animera)

## Framtida förbättringar

- [ ] Spara röstsamtal-historik
- [ ] Export av transkript
- [ ] Volymkontroller för assistentens röst
- [ ] Möjlighet att pausa/återuppta samtal
- [ ] Statistik över röstsamtal per assistent
- [ ] Integration med voice widget för kunder

## Relaterade filer

### Skapade:
- `app/api/user/vapi-web-config/route.ts` - API för web-konfig

### Modifierade:
- `app/admin/ai-assistants/page.tsx` - Admin-panel med public key input
- `app/(dashboard)/ai-assistants/page.tsx` - User UI med rösttest
- `package.json` - Lagt till @vapi-ai/web

### Befintliga (används):
- `lib/server/vapi-org-config.ts` - Hämtar org Vapi-konfig
- `components/admin/vapi-config-manager.tsx` - Admin UI för Vapi-konfig (redan hade public key)

## Testning

För att testa implementationen:

1. **Admin-setup:**
   - Logga in som admin
   - Gå till AI-assistenter
   - Aktivera VAPI för en test-organisation
   - Fyll i både server och public key från Vapi-dashboarden
   - Spara

2. **User-test:**
   - Logga in som användare i test-organisationen
   - Gå till AI-assistenter
   - Verifiera att assistenter visas
   - Klicka "Chatta" - testa textbaserad chat
   - Klicka "Ring" - testa röstbaserad chat
   - Verifiera att mikrofon-permissions fungerar
   - Prata med assistenten
   - Verifiera att transkript visas live
   - Avsluta samtalet

3. **Felhantering:**
   - Testa utan public key konfigurerad
   - Verifiera att "Ring"-knappen är disabled
   - Verifiera att tydligt felmeddelande visas

## Support

Vid problem, kontrollera:
1. Browser console för JavaScript-fel
2. Network tab för API-anrop
3. Vapi-dashboard för assistant-konfiguration
4. Supabase logs för backend-fel
