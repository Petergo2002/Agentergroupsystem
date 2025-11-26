import { useCallback, useEffect, useRef, useState } from "react";
import { useVapiStore } from "@/lib/vapiStore";
import type {
  VapiAssistant,
  VapiCallInitiateResponse,
  VapiCallStatus,
} from "./vapi";

const jsonFetcher = async (url: string, init?: RequestInit) => {
  // Add timeout to prevent hanging requests
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
  
  try {
    const r = await fetch(url, { 
      ...init, 
      signal: controller.signal 
    });
    clearTimeout(timeoutId);
    
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      const msg = (data as any)?.error || r.statusText || "Request failed";
      const err: any = new Error(msg);
      err.status = r.status;
      throw err;
    }
    return data;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      const err: any = new Error('Request timeout - Vapi API is not responding. Please check your Vapi configuration.');
      err.status = 408;
      throw err;
    }
    throw error;
  }
};

export function useVapiKey() {
  const apiKey = useVapiStore((s) => s.apiKey);
  const orgId = useVapiStore((s) => s.orgId);
  const setApiKey = useVapiStore((s) => s.setApiKey);
  const setOrgId = useVapiStore((s) => s.setOrgId);
  const clearApiKey = useVapiStore((s) => s.clearApiKey);
  return { apiKey, orgId, setApiKey, setOrgId, clearApiKey };
}

function withKeyHeaders(apiKey: string | null) {
  return apiKey
    ? { headers: { "x-vapi-key": apiKey } as Record<string, string> }
    : {};
}

export function useVapiAssistants() {
  const [assistants, setAssistants] = useState<VapiAssistant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | undefined>(undefined);
  const [defaults, setDefaults] = useState<{
    chat: string | null;
    call: string | null;
  }>({
    chat: null,
    call: null,
  });

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(undefined);
    try {
      const data = await jsonFetcher("/api/vapi/assistants");
      setAssistants((data as any)?.assistants ?? []);
      setDefaults((data as any)?.defaults ?? { chat: null, call: null });
    } catch (e: any) {
      setError(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { assistants, isLoading, error, defaults, refresh: load };
}

export function useVapiAnalytics(params?: {
  startDate?: string;
  endDate?: string;
  assistantId?: string;
  limit?: number;
}) {
  const [logs, setLogs] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<
    | {
        totalCalls: number;
        answeredCalls: number;
        missedCalls: number;
        averageDuration: number;
        totalDuration: number;
        callVolumeByHour: Record<string, number>;
        callVolumeByDay: Record<string, number>;
        callStatusDistribution: Record<string, number>;
      }
    | undefined
  >(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | undefined>(undefined);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(undefined);
    try {
      const qs = new URLSearchParams();
      if (params?.startDate) qs.set("startDate", params.startDate);
      if (params?.endDate) qs.set("endDate", params.endDate);
      if (params?.assistantId) qs.set("assistantId", params.assistantId);
      if (params?.limit) qs.set("limit", String(params.limit));
      const url = `/api/vapi/analytics${qs.toString() ? `?${qs.toString()}` : ""}`;
      const data = await jsonFetcher(url);
      setLogs((data as any)?.logs ?? []);
      setMetrics((data as any)?.metrics);
    } catch (e: any) {
      setError(e);
    } finally {
      setIsLoading(false);
    }
  }, [params?.startDate, params?.endDate, params?.assistantId, params?.limit]);

  useEffect(() => {
    void load();
  }, [load]);

  return { logs, metrics, isLoading, error, refresh: load };
}

export function useOutboundCall(options?: { pollIntervalMs?: number }) {
  const [isCalling, setIsCalling] = useState(false);
  const [callId, setCallId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<Error | undefined>(undefined);

  const startCall = useCallback(async (payload: any) => {
    setIsCalling(true);
    setError(undefined);
    setCallId(null);
    setStatus(null);

    try {
      const data = await jsonFetcher("/api/vapi/calls/outbound", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setCallId(data.id);
      setStatus(data.status || "initiated");
    } catch (e: any) {
      setError(e);
      setIsCalling(false);
    }
  }, []);

  // Auto-polling for status updates
  useEffect(() => {
    if (!callId || !isCalling) return;

    const interval = setInterval(async () => {
      try {
        // In a real implementation, you'd poll the call status
        // For now, just simulate completion after a delay
        setTimeout(() => {
          setStatus("completed");
          setIsCalling(false);
        }, 5000);
      } catch (e: any) {
        setError(e);
        setIsCalling(false);
      }
    }, options?.pollIntervalMs || 2000);

    return () => clearInterval(interval);
  }, [callId, isCalling, options?.pollIntervalMs]);

  const stopPolling = useCallback(() => {
    setIsCalling(false);
  }, []);

  return { startCall, isCalling, callId, status, error, stop: stopPolling };
}

export function useVapiChatAnalytics(params?: {
  startDate?: string;
  endDate?: string;
  assistantId?: string;
  limit?: number;
}) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<
    | {
        totalConversations: number;
        answeredConversations: number;
        totalMessages: number;
        averageMessagesPerConversation: number;
        meetingsBooked: number;
        conversionRate: number;
        answerRate: number;
        conversationsByDay: Record<string, number>;
        conversationsByHour: Record<string, number>;
        statusDistribution: Record<string, number>;
        conversationChangePercent?: number;
        answerRateChangePercent?: number;
        conversionRateChangePercent?: number;
      }
    | undefined
  >(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | undefined>(undefined);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(undefined);
    try {
      const qs = new URLSearchParams();
      if (params?.startDate) qs.set("startDate", params.startDate);
      if (params?.endDate) qs.set("endDate", params.endDate);
      if (params?.assistantId) qs.set("assistantId", params.assistantId);
      if (params?.limit) qs.set("limit", String(params.limit));
      const url = `/api/vapi/chat-analytics${qs.toString() ? `?${qs.toString()}` : ""}`;
      const data = await jsonFetcher(url);
      setSessions((data as any)?.sessions ?? []);
      setMetrics((data as any)?.metrics);
    } catch (e: any) {
      setError(e);
    } finally {
      setIsLoading(false);
    }
  }, [params?.startDate, params?.endDate, params?.assistantId, params?.limit]);

  useEffect(() => {
    void load();
  }, [load]);

  return { sessions, metrics, isLoading, error, refresh: load };
}
