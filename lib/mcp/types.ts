// MCP Protocol Types
export interface MCPRequest {
  jsonrpc: "2.0";
  method: string;
  params?: any;
  id?: string | number;
}

export interface MCPResponse {
  jsonrpc: "2.0";
  result?: any;
  error?: MCPError;
  id?: string | number | null;
}

export interface MCPError {
  code: number;
  message: string;
  data?: any;
}

// MCP Tool Definitions
export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, any>;
    required?: string[];
  };
}

// Tool Input Types
export interface SearchPropertiesInput {
  city?: string;
  property_type?: string;
  min_price?: number;
  max_price?: number;
  min_bedrooms?: number;
  min_bathrooms?: number;
  status?: "active" | "pending" | "sold";
  limit?: number;
}

export interface GetPropertyDetailsInput {
  property_id: string;
}

export interface CreateLeadInput {
  name: string;
  phone?: string;
  email?: string;
  lead_quality: 1 | 2 | 3;
  notes?: string;
  budget_min?: number;
  budget_max?: number;
  service_type?: string;
  job_description?: string;
  job_address?: string;
  urgency?: string;
}

export interface CheckAvailabilityInput {
  date: string; // YYYY-MM-DD
  duration_minutes?: number;
}

export interface BookMeetingInput {
  contact_name: string;
  contact_phone?: string;
  contact_email?: string;
  title: string;
  start_time: string; // ISO 8601
  end_time: string; // ISO 8601
  description?: string;
  job_id?: string;
  service_type?: string;
  job_address?: string;
  job_description?: string;
  event_type?: "site_visit" | "meeting" | "call";
}

// API Key Validation Result
export interface ValidatedApiKey {
  id: string;
  user_id: string;
  prefix: string;
  scopes: string[];
  vapi_assistant_id?: string;
}
