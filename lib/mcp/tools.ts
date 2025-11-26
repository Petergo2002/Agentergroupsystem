import type { MCPTool } from "./types";

export const MCP_TOOLS: MCPTool[] = [
  {
    name: "search_properties",
    description:
      "Search for available properties based on criteria like location, price range, bedrooms, etc. Returns a list of matching properties.",
    inputSchema: {
      type: "object",
      properties: {
        city: {
          type: "string",
          description: "City to search in",
        },
        property_type: {
          type: "string",
          enum: [
            "house",
            "condo",
            "townhouse",
            "land",
            "commercial",
            "multi-family",
          ],
          description: "Type of property",
        },
        min_price: {
          type: "number",
          description: "Minimum price in SEK",
        },
        max_price: {
          type: "number",
          description: "Maximum price in SEK",
        },
        min_bedrooms: {
          type: "integer",
          description: "Minimum number of bedrooms",
        },
        min_bathrooms: {
          type: "number",
          description: "Minimum number of bathrooms",
        },
        status: {
          type: "string",
          enum: ["active", "pending", "sold"],
          description: "Property status (default: active)",
        },
        limit: {
          type: "integer",
          description: "Maximum number of results to return (default: 10)",
        },
      },
    },
  },
  {
    name: "get_property_details",
    description:
      "Get detailed information about a specific property including all features, images, and virtual tour links.",
    inputSchema: {
      type: "object",
      properties: {
        property_id: {
          type: "string",
          description: "The UUID of the property",
        },
      },
      required: ["property_id"],
    },
  },
  {
    name: "create_lead",
    description:
      "Create a new lead from a conversation. Captures contact information and job details for a contractor. Lead quality: 1=High Interest (Hot), 2=Medium Interest (Warm), 3=Low Interest/Needs Follow-up (Cold)",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Full name of the lead",
        },
        phone: {
          type: "string",
          description: "Phone number",
        },
        email: {
          type: "string",
          description: "Email address",
        },
        lead_quality: {
          type: "integer",
          enum: [1, 2, 3],
          description:
            "Lead quality: 1=High (ready to buy), 2=Medium (interested), 3=Low (needs nurturing)",
        },
        notes: {
          type: "string",
          description: "Notes from the conversation",
        },
        budget_min: {
          type: "number",
          description: "Minimum budget in SEK",
        },
        budget_max: {
          type: "number",
          description: "Maximum budget in SEK",
        },
        service_type: {
          type: "string",
          description:
            "Type of service or trade (e.g., plumbing, electrical, roofing, painting)",
        },
        job_description: {
          type: "string",
          description: "Description of the job or project the customer needs help with",
        },
        job_address: {
          type: "string",
          description: "Address or location where the work will take place",
        },
        urgency: {
          type: "string",
          description:
            "How urgent the job is (e.g., emergency, within a week, within a month)",
        },
      },
      required: ["name", "lead_quality"],
    },
  },
  {
    name: "check_availability",
    description:
      "Check available time slots in the calendar for a specific date. Returns available time slots for booking meetings or showings.",
    inputSchema: {
      type: "object",
      properties: {
        date: {
          type: "string",
          description: "Date to check in YYYY-MM-DD format",
        },
        duration_minutes: {
          type: "integer",
          description: "Duration needed in minutes (default: 60)",
        },
      },
      required: ["date"],
    },
  },
  {
    name: "book_meeting",
    description:
      "Book a site visit, meeting, or call in the calendar. Creates both the calendar event and the contact/lead if they don't exist.",
    inputSchema: {
      type: "object",
      properties: {
        contact_name: {
          type: "string",
          description: "Name of the person booking",
        },
        contact_phone: {
          type: "string",
          description: "Phone number",
        },
        contact_email: {
          type: "string",
          description: "Email address",
        },
        title: {
          type: "string",
          description:
            'Meeting title (e.g., "Property Showing - Villa on Main St")',
        },
        start_time: {
          type: "string",
          description:
            "Start time in ISO 8601 format (e.g., 2024-01-15T14:00:00Z)",
        },
        end_time: {
          type: "string",
          description: "End time in ISO 8601 format",
        },
        description: {
          type: "string",
          description: "Meeting description or notes",
        },
        job_id: {
          type: "string",
          description: "UUID of the job this event is related to, if available",
        },
        service_type: {
          type: "string",
          description:
            "Type of service or job (e.g., plumbing, electrical, roofing, painting)",
        },
        job_address: {
          type: "string",
          description: "Address or location for the visit or work",
        },
        job_description: {
          type: "string",
          description: "Short description of the job or purpose of the visit",
        },
        event_type: {
          type: "string",
          enum: ["site_visit", "meeting", "call"],
          description: "Type of event (default: site_visit)",
        },
      },
      required: ["contact_name", "title", "start_time", "end_time"],
    },
  },
];
