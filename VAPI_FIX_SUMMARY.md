# VAPI 404 Error Fix

## Problem
Getting error: `VAPI API error: 404 {"message":"Cannot POST /v1/agent/bf9689b8-14ab-4eb4-8de0-3cc3a1953cc7","error":"Not Found","statusCode":404}`

## Root Cause
The `Vapi` class in `lib/analytics/vapi.ts` was using incorrect endpoints. VAPI's text-based chat uses a different endpoint than voice calls.

## Solution
Updated the `sendAssistantMessage` method to use the correct VAPI Chat API endpoint:

### Correct Endpoint
```
POST https://api.vapi.ai/chat
```

### Request Body
```json
{
  "assistantId": "bf9689b8-14ab-4eb4-8de0-3cc3a1953cc7",
  "input": "user message here",
  "previousChatId": "chat_abc123"
}
```

**Note:** 
- The VAPI Chat API does not accept `metadata` or `conversationId` fields
- Only `assistantId` (required), `input` (required), and `previousChatId` (optional) are supported
- Use `previousChatId` from the previous response's `id` field to maintain conversation context

### Response Format
```json
{
  "id": "chat_abc123",
  "assistantId": "bf9689b8-14ab-4eb4-8de0-3cc3a1953cc7",
  "messages": [
    {
      "role": "user",
      "content": "user message here"
    }
  ],
  "output": [
    {
      "role": "assistant",
      "content": "assistant response here"
    }
  ],
  "createdAt": "2024-01-15T09:30:00Z",
  "updatedAt": "2024-01-15T09:30:00Z"
}
```

## Changes Made
1. **Fixed endpoint** - Changed from `/assistants/{id}/messages` to `/chat` (the correct VAPI Chat API endpoint)
2. **Updated request format** - Using `assistantId` and `input` fields as per VAPI Chat API spec
3. **Updated response parsing** - Extracting reply from `output` array in the response
4. **Applied to both** - Fixed in both `lib/analytics/vapi.ts` and `app/api/widget/send/route.ts`

## Testing
To test the fix:
1. Go to `/admin/ai-assistants` in your admin panel
2. Click "Testa assistent" on any assistant
3. Send a test message
4. You should now get a response instead of a 404 error

## Requirements
Make sure you have:
- ✅ `VAPI_API_KEY` set in your `.env.local` file
- ✅ Valid assistant ID (UUID format like `bf9689b8-14ab-4eb4-8de0-3cc3a1953cc7`)
- ✅ Assistant exists in your VAPI account

## API Reference
The correct VAPI Chat API endpoint:
- **URL**: `POST https://api.vapi.ai/chat`
- **Headers**: 
  - `Authorization: Bearer {VAPI_API_KEY}`
  - `Content-Type: application/json`
- **Body**: 
  ```json
  {
    "assistantId": "your-assistant-id",
    "input": "user message",
    "conversationId": "optional-for-multi-turn"
  }
  ```
- **Response**: Returns `output` array with assistant messages

## Documentation
- [VAPI Chat Quickstart](https://docs.vapi.ai/chat/quickstart)
- [VAPI Chat API Reference](https://docs.vapi.ai/api-reference)
