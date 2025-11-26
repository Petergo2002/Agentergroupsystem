# AI-assistenter för Användare

## Översikt
Användare kan nu se och testa de AI-assistenter som är tilldelade till deras organisation direkt från sin dashboard.

## Funktioner

### 1. Visa Tilldelade Assistenter
- **Sida**: `/ai-assistants` (tillgänglig i sidomenyn)
- **Visar**: Alla assistenter som är tilldelade till användarens organisation
- **Information som visas**:
  - Assistentens namn
  - Beskrivning
  - Status (active/inactive)
  - Typ (Chat/Samtal)
  - Om det är standardassistent

### 2. Testa Chat-assistenter
- Användare kan öppna en testdialog för chat-assistenter
- Stöd för multi-turn konversationer (konversationshistorik)
- Realtidssvar från VAPI
- Session-hantering för att bibehålla kontext

### 3. Navigation
- Ny menypost "AI-assistenter" med robot-ikon i sidomenyn
- Enkel åtkomst från alla sidor i dashboarden

## Teknisk Implementation

### API Endpoints

#### GET `/api/user/assistants`
Hämtar användarens tilldelade assistenter.

**Response:**
```json
{
  "assistants": [
    {
      "id": "bf9689b8-14ab-4eb4-8de0-3cc3a1953cc7",
      "name": "test assistnenten",
      "description": "En hjälpsam assistent",
      "status": "active",
      "type": "chat",
      "isDefault": true
    }
  ]
}
```

#### POST `/api/user/assistants/[assistantId]/chat`
Skickar ett meddelande till en assistent.

**Request:**
```json
{
  "message": "Hej, hur kan du hjälpa mig?",
  "conversationId": "chat_abc123"
}
```

**Response:**
```json
{
  "assistantId": "bf9689b8-14ab-4eb4-8de0-3cc3a1953cc7",
  "reply": "Hej! Hur kan jag hjälpa dig idag?",
  "sessionId": "chat_abc123"
}
```

### Säkerhet
- ✅ Användare kan endast se assistenter tilldelade till deras organisation
- ✅ Användare kan endast testa assistenter de har tillgång till
- ✅ Autentisering krävs för alla endpoints
- ✅ Organization-validering på varje request

### UI-komponenter

**Huvudsida** (`/ai-assistants`):
- Grid-layout med kort för varje assistent
- Visuell indikation av assistenttyp (Chat/Samtal)
- "Testa assistent"-knapp för chat-assistenter
- Responsiv design (mobil, tablet, desktop)

**Test-dialog**:
- Chat-gränssnitt med meddelandehistorik
- Användar- och assistentmeddelanden visuellt åtskilda
- Session-information
- "Starta om"-knapp för ny konversation
- Enter för att skicka, Shift+Enter för ny rad

## Användning

### För Administratörer
1. Gå till `/admin/ai-assistants`
2. Tilldela assistenter till organisationer under "Kunder och deras assistenter"
3. Välj chat-assistent och/eller call-assistent för varje organisation

### För Användare
1. Klicka på "AI-assistenter" i sidomenyn
2. Se alla tilldelade assistenter
3. Klicka "Testa assistent" på en chat-assistent
4. Skriv ett meddelande och få svar från AI:n
5. Fortsätt konversationen - historiken sparas automatiskt

## Begränsningar
- Endast chat-assistenter kan testas i webbgränssnittet
- Call-assistenter visas men kan inte testas här (kräver telefonsamtal)
- Konversationshistorik sparas endast under sessionen (försvinner vid "Starta om")

## Framtida Förbättringar
- [ ] Spara konversationshistorik permanent
- [ ] Export av konversationer
- [ ] Statistik över assistentanvändning
- [ ] Möjlighet att ge feedback på assistentsvar
- [ ] Integration med call-assistenter via WebRTC

## Felsökning

### "Inga assistenter tilldelade"
- Kontakta din administratör för att få assistenter tilldelade

### "VAPI integration not configured"
- Administratören behöver konfigurera VAPI-integration för organisationen

### "You don't have access to this assistant"
- Assistenten är inte tilldelad till din organisation
- Kontakta administratören

## Relaterade Filer
- `/app/api/user/assistants/route.ts` - Hämta assistenter
- `/app/api/user/assistants/[assistantId]/chat/route.ts` - Chatta med assistent
- `/app/(dashboard)/ai-assistants/page.tsx` - UI för användare
- `/components/app-sidebar.tsx` - Navigation
- `/lib/analytics/vapi.ts` - VAPI integration

## VAPI Chat API
Använder VAPI Chat API för text-baserad kommunikation:
- Endpoint: `POST https://api.vapi.ai/chat`
- Stöd för multi-turn konversationer via `previousChatId`
- Realtidssvar från AI-modeller
