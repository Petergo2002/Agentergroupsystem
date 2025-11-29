# VAPI Integration Guide

This guide explains how to connect your VAPI voice assistant to your Calendar CRM using the MCP (Model Context Protocol) server.

## Overview

The VAPI integration allows your voice assistant to:
- **Search properties** based on customer criteria
- **Get property details** for specific listings
- **Create leads** automatically from conversations
- **Check calendar availability** for showings
- **Book meetings** directly in your calendar

## Architecture

```
VAPI Assistant → MCP Server (Your CRM) → Database
                    ↓
            - Properties
            - Leads/Contacts
            - Calendar Events
```

## Setup Instructions

### 1. Run Database Migration

First, apply the VAPI integration migration to add necessary database fields:

```bash
# If using Supabase CLI
supabase db push

# Or apply the migration manually
psql -f supabase/migrations/003_vapi_integration.sql
```

### 2. Generate API Key

1. Navigate to **Settings** → **VAPI Integration** in your CRM
2. Click **"Skapa nyckel"** (Create Key)
3. Enter a description (e.g., "VAPI Production")
4. **Copy and save the API key immediately** - it will only be shown once!

### 3. Configure VAPI Assistant

#### Step 1: Access VAPI Dashboard
1. Log in to your VAPI account at https://vapi.ai
2. Navigate to your assistant or create a new one

#### Step 2: Add MCP Server
1. Go to **Model** → **Tools** → **MCP Servers**
2. Click **"Add MCP Server"**
3. Configure the server:

**Server URL:**
```
https://your-domain.com/api/mcp
```

**Authentication:**
- Type: `Bearer Token`
- Token: `[Your API Key from Step 2]`

#### Step 3: Enable Tools
The following tools will be automatically discovered:
- ✅ `search_properties`
- ✅ `get_property_details`
- ✅ `create_lead`
- ✅ `check_availability`
- ✅ `book_meeting`

#### Step 4: Configure Assistant Prompt
Add instructions to your assistant's system prompt:

```
You are a real estate assistant helping customers find properties and book showings.

When customers ask about properties:
1. Use search_properties to find matching listings
2. Use get_property_details to get full information
3. Present properties in a conversational way

When customers show interest:
1. Use create_lead to save their information
2. Set lead_quality based on interest level:
   - 1 = High interest (ready to buy/view)
   - 2 = Medium interest (exploring options)
   - 3 = Low interest (just browsing)

When booking showings:
1. Use check_availability to find open time slots
2. Offer 2-3 available times
3. Use book_meeting to confirm the booking
4. Provide confirmation details

Always be helpful, professional, and conversational.
```

## Available Tools

### 1. search_properties

Search for properties based on customer criteria.

**Parameters:**
- `city` (string, optional): City to search in
- `property_type` (string, optional): house, condo, townhouse, land, commercial, multi-family
- `min_price` (number, optional): Minimum price in SEK
- `max_price` (number, optional): Maximum price in SEK
- `min_bedrooms` (integer, optional): Minimum bedrooms
- `min_bathrooms` (number, optional): Minimum bathrooms
- `status` (string, optional): active, pending, sold (default: active)
- `limit` (integer, optional): Max results (default: 10)

**Example:**
```json
{
  "city": "Stockholm",
  "property_type": "house",
  "min_bedrooms": 3,
  "max_price": 5000000
}
```

### 2. get_property_details

Get detailed information about a specific property.

**Parameters:**
- `property_id` (string, required): UUID of the property

**Example:**
```json
{
  "property_id": "123e4567-e89b-12d3-a456-426614174000"
}
```

### 3. create_lead

Create a new lead from the conversation.

**Parameters:**
- `name` (string, required): Full name
- `phone` (string, optional): Phone number
- `email` (string, optional): Email address
- `lead_quality` (integer, required): 1=High, 2=Medium, 3=Low
- `notes` (string, optional): Conversation notes
- `budget_min` (number, optional): Minimum budget in SEK
- `budget_max` (number, optional): Maximum budget in SEK
- `property_type` (string, optional): Preferred type
- `bedrooms_min` (integer, optional): Minimum bedrooms
- `location_preference` (string, optional): Preferred area
- `timeline` (string, optional): immediate, 1-3months, 3-6months, 6-12months, just-looking

**Example:**
```json
{
  "name": "Anna Andersson",
  "phone": "+46701234567",
  "lead_quality": 1,
  "budget_max": 4500000,
  "property_type": "house",
  "bedrooms_min": 3,
  "location_preference": "Stockholm",
  "timeline": "1-3months",
  "notes": "Interested in family homes with garden. Pre-approved for mortgage."
}
```

### 4. check_availability

Check available time slots for a specific date.

**Parameters:**
- `date` (string, required): Date in YYYY-MM-DD format
- `duration_minutes` (integer, optional): Duration needed (default: 60)

**Example:**
```json
{
  "date": "2024-01-15",
  "duration_minutes": 60
}
```

**Response:**
```json
{
  "date": "2024-01-15",
  "available_slots": [
    {
      "start": "2024-01-15T09:00:00Z",
      "end": "2024-01-15T10:00:00Z"
    },
    {
      "start": "2024-01-15T14:00:00Z",
      "end": "2024-01-15T15:00:00Z"
    }
  ],
  "count": 2
}
```

### 5. book_meeting

Book a meeting or property showing.

**Parameters:**
- `contact_name` (string, required): Name of the person
- `contact_phone` (string, optional): Phone number
- `contact_email` (string, optional): Email address
- `title` (string, required): Meeting title
- `start_time` (string, required): ISO 8601 format (e.g., 2024-01-15T14:00:00Z)
- `end_time` (string, required): ISO 8601 format
- `description` (string, optional): Meeting notes
- `property_id` (string, optional): UUID if showing a specific property
- `event_type` (string, optional): showing, meeting, call (default: showing)

**Example:**
```json
{
  "contact_name": "Anna Andersson",
  "contact_phone": "+46701234567",
  "title": "Property Showing - Villa on Storgatan 123",
  "start_time": "2024-01-15T14:00:00Z",
  "end_time": "2024-01-15T15:00:00Z",
  "description": "First showing of the property",
  "property_id": "123e4567-e89b-12d3-a456-426614174000",
  "event_type": "showing"
}
```

## Security

### API Key Security
- ✅ Each user has their own isolated API key
- ✅ Keys are hashed in the database
- ✅ Rate limiting prevents abuse (60 requests/minute by default)
- ✅ Row-level security ensures data isolation
- ✅ Keys can be revoked instantly

### Best Practices
1. **Never share your API key** - treat it like a password
2. **Rotate keys regularly** - create new keys every 90 days
3. **Revoke unused keys** - remove old or compromised keys immediately
4. **Monitor usage** - check "Last Used" timestamps in settings
5. **Use HTTPS only** - ensure your domain has SSL/TLS

## Testing

### Test the MCP Server

```bash
curl -X POST https://your-domain.com/api/mcp \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/list",
    "id": 1
  }'
```

Expected response:
```json
{
  "jsonrpc": "2.0",
  "result": {
    "tools": [...]
  },
  "id": 1
}
```

### Test Property Search

```bash
curl -X POST https://your-domain.com/api/mcp \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "search_properties",
      "arguments": {
        "city": "Stockholm",
        "min_bedrooms": 2
      }
    },
    "id": 2
  }'
```

## Troubleshooting

### "Invalid API key" Error
- ✅ Verify the API key is correct (copy-paste carefully)
- ✅ Check if the key has been revoked in settings
- ✅ Ensure you're using `Bearer` authentication

### "Rate limit exceeded" Error
- ✅ Wait for the rate limit window to reset (default: 60 seconds)
- ✅ Adjust rate limits in API key settings if needed
- ✅ Consider implementing caching in your VAPI assistant

### No Properties Returned
- ✅ Verify you have properties in the database
- ✅ Check that property `status` is set to "active"
- ✅ Ensure search criteria aren't too restrictive

### Calendar Booking Fails
- ✅ Verify time slot is available using `check_availability` first
- ✅ Ensure start_time is in the future
- ✅ Check that start_time is before end_time
- ✅ Use ISO 8601 format for timestamps

## Monitoring

### View VAPI Call Logs
Navigate to **Analytics** → **Calls** to see:
- Call duration and status
- Leads created from calls
- Meetings booked
- Transcripts and summaries

### API Usage
Check your API key usage in **Settings** → **VAPI Integration**:
- Last used timestamp
- Request count
- Rate limit status

## Support

For issues or questions:
1. Check this documentation first
2. Review VAPI logs in your dashboard
3. Check browser console for errors
4. Contact your system administrator

## Example Conversation Flow

**Customer:** "I'm looking for a 3-bedroom house in Stockholm under 5 million SEK"

**Assistant:** *Calls search_properties*
```json
{
  "city": "Stockholm",
  "property_type": "house",
  "min_bedrooms": 3,
  "max_price": 5000000
}
```

**Assistant:** "I found 3 properties that match your criteria. The first one is a beautiful 4-bedroom house on Storgatan 123 for 4.5 million SEK..."

**Customer:** "That sounds interesting! Can I see it this week?"

**Assistant:** *Calls check_availability*
```json
{
  "date": "2024-01-15"
}
```

**Assistant:** "I have availability on Monday at 2 PM or Tuesday at 10 AM. Which works better for you?"

**Customer:** "Monday at 2 PM works great!"

**Assistant:** *Calls create_lead* (if not already created)
*Then calls book_meeting*
```json
{
  "contact_name": "Customer Name",
  "contact_phone": "+46701234567",
  "title": "Property Showing - Storgatan 123",
  "start_time": "2024-01-15T14:00:00Z",
  "end_time": "2024-01-15T15:00:00Z",
  "property_id": "property-uuid",
  "event_type": "showing"
}
```

**Assistant:** "Perfect! I've booked your showing for Monday, January 15th at 2 PM. You'll receive a confirmation shortly. Is there anything else I can help you with?"

---

**Version:** 1.0.0  
**Last Updated:** 2024-01-14  
**MCP Server URL:** `https://your-domain.com/api/mcp`
