export interface VapiCallLog {
  id: string;
  duration: number;
  direction: "inbound" | "outbound";
  status: "completed" | "busy" | "no-answer" | "failed";
  startTime: string;
  endTime: string;
  from: string;
  to: string;
  cost?: number;
  recordingUrl?: string;
  transcription?: string;
}

export interface VapiAssistant {
  id: string;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  status?: "active" | "disabled";
}

export interface VapiChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  sessionId?: string;
}

export interface VapiChatSession {
  id: string;
  assistantId?: string;
  startTime: string;
  endTime?: string;
  status: "active" | "completed" | "abandoned";
  messageCount?: number;
  messages?: VapiChatMessage[];
  metadata?: Record<string, any>;
  hasBooking?: boolean;
  bookingId?: string;
}

export interface OutboundCallRequest {
  to: string;
  from?: string;
  assistantId?: string;
  metadata?: Record<string, any>;
}

export interface VapiCallInitiateResponse {
  id: string;
  status: "queued" | "connecting" | "in_progress" | "failed";
}

export interface VapiCallStatus {
  id: string;
  status:
    | "queued"
    | "connecting"
    | "in_progress"
    | "completed"
    | "busy"
    | "no-answer"
    | "failed";
  startTime?: string;
  endTime?: string;
  duration?: number;
}

export interface VapiOptions {
  apiKey: string;
  baseUrl?: string;
  orgId?: string;
}

export class Vapi {
  private apiKey: string;
  private baseUrl: string;
  private orgId?: string;
  private assistantsCache?: { expires: number; data: VapiAssistant[] };

  constructor(options: VapiOptions) {
    this.apiKey = options.apiKey;
    // Default to main Vapi host and remove any /v1 suffix
    let baseUrl = options.baseUrl || "https://api.vapi.ai";
    baseUrl = baseUrl.replace(/\/v1\/?$/, ""); // Remove /v1 or /v1/
    baseUrl = baseUrl.replace(/\/$/, ""); // Remove trailing slash
    this.baseUrl = baseUrl;
    this.orgId = options.orgId;
  }

  private sanitizePayload(body: Record<string, any>) {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(body)) {
      if (value === undefined || value === null || value === "") continue;
      cleaned[key] = value;
    }
    return cleaned;
  }

  private headers(): Record<string, string> {
    const h: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
    };
    if (this.orgId) h["X-Organization-Id"] = this.orgId;
    return h;
  }

  async sendAssistantMessage(params: {
    assistantId: string;
    message: string;
    conversationId?: string;
    source?: string;
    metadata?: Record<string, any>;
  }): Promise<{ reply: string | null; raw: any; sessionId?: string }> {
    const previousChatId = params.conversationId?.trim()
      ? params.conversationId
      : undefined;

    // VAPI Chat API endpoint - the correct endpoint for text-based chat
    const attempts = [
      {
        url: `${this.baseUrl}/chat`,
        body: this.sanitizePayload({
          assistantId: params.assistantId,
          input: params.message,
          previousChatId: previousChatId,
        }),
      },
    ];

    let lastErrorDetails: { status?: number; body?: string } | null = null;
    let lastThrownError: Error | null = null;

    for (const attempt of attempts) {
      try {
        const response = await fetch(attempt.url, {
          method: "POST",
          headers: this.headers(),
          body: JSON.stringify(attempt.body),
        });

        if ([400, 404, 405, 422].includes(response.status)) {
          lastErrorDetails = {
            status: response.status,
            body: await response.text().catch(() => response.statusText),
          };
          continue;
        }

        if (!response.ok) {
          const text = await response.text().catch(() => "");
          const error: any = new Error(
            `VAPI API error: ${response.status} ${response.statusText}${
              text ? ` - ${text}` : ""
            } (URL: ${attempt.url})`,
          );
          error.status = response.status;
          throw error;
        }

        const contentType = response.headers.get("content-type") || "";
        let raw: any = null;
        let reply: string | null = null;

        if (contentType.includes("application/json")) {
          raw = await response.json().catch(() => null);
          if (raw) {
            // VAPI chat API returns { output: [{ role: "assistant", content: "..." }], id: "chat_xxx" }
            if (Array.isArray(raw.output) && raw.output.length > 0) {
              const lastOutput = raw.output[raw.output.length - 1];
              reply = lastOutput?.content ?? null;
            } else {
              // Fallback for other response formats
              reply =
                (typeof raw === "string"
                  ? raw
                  : (raw.reply ??
                    raw.message ??
                    raw.response ??
                    raw.text ??
                    raw.content ??
                    (Array.isArray(raw.messages)
                      ? raw.messages.at(-1)?.content
                      : undefined))) ?? null;
            }
          }
        } else {
          raw = await response.text().catch(() => "");
          reply = typeof raw === "string" && raw.length > 0 ? raw : null;
        }

        const sessionId =
          (raw &&
            (raw.id ??
              raw.conversationId ??
              raw.conversation_id ??
              raw.sessionId ??
              raw.session_id ??
              raw.session?.id)) ||
          undefined;

        return { reply, raw, sessionId };
      } catch (error) {
        lastThrownError = error as Error;
        if ((error as any)?.status && (error as any).status < 500) {
          // For non-retryable API errors, break early
          break;
        }
      }
    }

    if (lastThrownError) {
      throw lastThrownError;
    }

    const triedUrls = attempts.map(a => a.url).join(", ");
    const fallback: any = new Error(
      lastErrorDetails
        ? `VAPI API error: ${lastErrorDetails.status || "unknown"} ${
            lastErrorDetails.body || "Request failed"
          }. Tried endpoints: ${triedUrls}`
        : `Unable to reach Vapi assistant endpoint. Tried: ${triedUrls}`,
    );
    if (lastErrorDetails?.status) {
      fallback.status = lastErrorDetails.status;
    }
    throw fallback;
  }

  async getCallLogs(params?: {
    startDate?: string;
    endDate?: string;
    assistantId?: string;
    limit?: number;
  }): Promise<VapiCallLog[]> {
    const query = new URLSearchParams();
    
    // Vapi List Calls API supports assistantId and limit
    if (params?.assistantId && params.assistantId.trim()) {
      query.append("assistantId", params.assistantId);
    }
    if (params?.limit) query.append("limit", params.limit.toString());

    // Primary endpoint: GET /call (List Calls API)
    // Fallback: GET /calls
    const endpoints = [
      `/call${query.toString() ? `?${query.toString()}` : ""}`,
      `/calls${query.toString() ? `?${query.toString()}` : ""}`,
    ];

    let lastError: Error | null = null;

    for (const endpoint of endpoints) {
      try {
        console.log(`📞 Trying Vapi call endpoint: ${this.baseUrl}${endpoint}`);
        
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          headers: this.headers(),
        });

        if (response.ok) {
          const data = await response.json();
          console.log(`✅ Vapi ${endpoint} response:`, {
            isArray: Array.isArray(data),
            hasResults: !!data.results,
            resultsCount: data.results?.length || (Array.isArray(data) ? data.length : 0),
            rawKeys: Object.keys(data),
          });
          
          // Vapi List Calls returns array or { results: [...], metadata: {...} }
          const rawLogs = Array.isArray(data)
            ? data
            : (data.results ?? data.logs ?? data.items ?? data.calls ?? []);

          console.log(`📞 Got ${rawLogs.length} call logs from Vapi`);
          return rawLogs;
        } else {
          const errorText = await response.text().catch(() => "");
          console.log(`❌ Vapi ${endpoint} failed: ${response.status} ${errorText}`);
          
          if (response.status !== 404) {
            lastError = new Error(
              `VAPI API error: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ""}`
            );
          }
        }
      } catch (e) {
        lastError = e as Error;
        console.error(`❌ Vapi ${endpoint} error:`, e);
      }
    }

    if (lastError) {
      throw lastError;
    }

    console.warn("📞 Could not fetch call logs from Vapi - no working endpoint found");
    return [];
  }

  async getAssistants(): Promise<VapiAssistant[]> {
    if (this.assistantsCache && this.assistantsCache.expires > Date.now()) {
      return this.assistantsCache.data;
    }

    // Use the correct VAPI endpoint: /assistant (not /v1/assistant)
    const url = `${this.baseUrl}/assistant`;

    try {
      const response = await fetch(url, { headers: this.headers() });
      
      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(
          `VAPI API error: ${response.status} ${response.statusText}${text ? ` - ${text}` : ""} (URL: ${url})`,
        );
      }
      
      const data = await response.json();
      const assistants = Array.isArray(data) ? data : (data.assistants ?? data.agents ?? []);
      
      this.assistantsCache = {
        data: assistants,
        expires: Date.now() + 60 * 1000,
      };
      
      return assistants;
    } catch (error: any) {
      console.error(`Failed to fetch assistants from ${url}:`, error);
      throw error;
    }
  }

  async getAssistant(id: string): Promise<VapiAssistant> {
    const response = await fetch(`${this.baseUrl}/assistant/${id}`, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `VAPI API error: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();
    return data.assistant ?? data;
  }

  async createOutboundCall(
    payload: OutboundCallRequest,
  ): Promise<VapiCallInitiateResponse> {
    let response = await fetch(`${this.baseUrl}/calls/outbound`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(payload),
    });

    if (response.status === 404) {
      response = await fetch(`${this.baseUrl}/call/outbound`, {
        method: "POST",
        headers: this.headers(),
        body: JSON.stringify(payload),
      });
    }

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(
        `VAPI API error: ${response.status} ${response.statusText}${text ? ` - ${text}` : ""}`,
      );
    }

    const data = await response.json();
    return data;
  }

  async getCallStatus(callId: string): Promise<VapiCallStatus> {
    let response = await fetch(
      `${this.baseUrl}/calls/${encodeURIComponent(callId)}`,
      {
        headers: this.headers(),
      },
    );

    if (response.status === 404) {
      response = await fetch(
        `${this.baseUrl}/call/${encodeURIComponent(callId)}`,
        {
          headers: this.headers(),
        },
      );
    }

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(
        `VAPI API error: ${response.status} ${response.statusText}${text ? ` - ${text}` : ""}`,
      );
    }

    const data = await response.json();
    return data;
  }

  async getChatSessions(params?: {
    startDate?: string;
    endDate?: string;
    assistantId?: string;
    limit?: number;
  }): Promise<VapiChatSession[]> {
    const query = new URLSearchParams();
    
    // Vapi List Chats API supports assistantId and limit
    if (params?.assistantId && params.assistantId.trim()) {
      query.append("assistantId", params.assistantId);
    }
    if (params?.limit) query.append("limit", params.limit.toString());

    // Primary endpoint: GET /chat (List Chats API)
    // Fallback endpoints for backwards compatibility
    const endpoints = [
      `/chat${query.toString() ? `?${query.toString()}` : ""}`, // Correct Vapi Chat API endpoint
      `/call${query.toString() ? `?${query.toString()}` : ""}`, // Fallback: singular call endpoint
      `/calls${query.toString() ? `?${query.toString()}` : ""}`, // Fallback: plural calls endpoint
    ];

    let lastError: Error | null = null;

    for (const endpoint of endpoints) {
      try {
        console.log(`🔍 Trying Vapi endpoint: ${this.baseUrl}${endpoint}`);
        
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          headers: this.headers(),
        });

        if (response.ok) {
          const data = await response.json();
          console.log(`✅ Vapi ${endpoint} response:`, {
            hasResults: !!data.results,
            resultsCount: data.results?.length,
            hasMetadata: !!data.metadata,
            rawKeys: Object.keys(data),
          });
          
          // Vapi List Chats returns { results: [...], metadata: {...} }
          const rawSessions = Array.isArray(data)
            ? data
            : (data.results ?? data.sessions ?? data.items ?? data.calls ?? []);

          // Map Vapi chat format to our VapiChatSession format
          const sessions: VapiChatSession[] = rawSessions.map((chat: any) => {
            // Combine messages and output arrays for full conversation
            const allMessages: VapiChatMessage[] = [];
            
            // Add input messages (user messages)
            if (Array.isArray(chat.messages)) {
              chat.messages.forEach((msg: any, idx: number) => {
                allMessages.push({
                  id: `${chat.id}-msg-${idx}`,
                  role: msg.role === "assistant" ? "assistant" : "user",
                  content: msg.message || msg.content || "",
                  timestamp: chat.createdAt || new Date().toISOString(),
                  sessionId: chat.id,
                });
              });
            }
            
            // Add output messages (assistant responses)
            if (Array.isArray(chat.output)) {
              chat.output.forEach((msg: any, idx: number) => {
                allMessages.push({
                  id: `${chat.id}-out-${idx}`,
                  role: msg.role === "user" ? "user" : "assistant",
                  content: msg.message || msg.content || "",
                  timestamp: chat.updatedAt || chat.createdAt || new Date().toISOString(),
                  sessionId: chat.id,
                });
              });
            }

            // Determine status based on available data
            let status: "active" | "completed" | "abandoned" = "completed";
            if (chat.status) {
              status = chat.status;
            } else if (allMessages.length === 0) {
              status = "abandoned";
            }

            return {
              id: chat.id,
              assistantId: chat.assistantId,
              startTime: chat.createdAt || new Date().toISOString(),
              endTime: chat.updatedAt || chat.createdAt,
              status,
              messageCount: allMessages.length,
              messages: allMessages,
              metadata: {
                orgId: chat.orgId,
                sessionId: chat.sessionId,
                cost: chat.cost,
                costs: chat.costs,
                input: chat.input,
              },
              hasBooking: false, // Can be enhanced later based on metadata
              bookingId: undefined,
            };
          });

          console.log(`📊 Mapped ${sessions.length} chat sessions`);
          return sessions;
        } else {
          const errorText = await response.text().catch(() => "");
          console.log(`❌ Vapi ${endpoint} failed: ${response.status} ${errorText}`);
        }
      } catch (e) {
        lastError = e as Error;
        console.error(`❌ Vapi ${endpoint} error:`, e);
      }
    }

    // If all endpoints fail, return empty array (chat might not be set up yet)
    console.warn(
      "Could not fetch chat sessions from Vapi:",
      lastError?.message,
    );
    return [];
  }
}
